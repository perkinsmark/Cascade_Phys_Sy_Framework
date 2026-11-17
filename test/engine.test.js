import { describe, it, expect } from "vitest";
import {
  recommendPLevel, suggestCards, cardsAboveLevel, elapsedMinutes, formatElapsed,
  windowState, checklistProgress, stageProgress, commsPlan, fillHolding,
  contactGaps, newIncident, addLog, toMarkdown, actionKey, higherOf,
} from "../src/incident/engine.js";
import { CARDS, FIRST_HOUR, STAGES } from "../src/incident/data.js";

const T0 = "2026-11-17T02:00:00.000Z";
const at = mins => new Date(new Date(T0).getTime() + mins * 60000).toISOString();

describe("P-level triage", () => {
  it("defaults to P4 with no yes answers", () => {
    expect(recommendPLevel({})).toBe("P4");
  });
  it("takes the highest level implied (when in doubt, classify higher)", () => {
    expect(recommendPLevel({ oneArea: true })).toBe("P3");
    expect(recommendPLevel({ oneArea: true, outOfUse: true })).toBe("P2");
    expect(recommendPLevel({ outOfUse: true, attack: true })).toBe("P1");
  });
  it("higherOf picks the more severe level", () => {
    expect(higherOf("P3", "P1")).toBe("P1");
    expect(higherOf(null, "P2")).toBe("P2");
  });
});

describe("scenario card selection", () => {
  it("maps triggers to cards in card order without duplicates", () => {
    expect(suggestCards(["fire", "ambulance", "multiCasualty"])).toEqual(["card1", "card4"]);
    expect(suggestCards(["gasLeak"])).toEqual(["card3"]);
    expect(suggestCards([])).toEqual([]);
  });
  it("flags cards whose typical level is above the set level", () => {
    expect(cardsAboveLevel(["card2", "card3"], "P3").map(c => c.id)).toEqual(["card2"]);
    expect(cardsAboveLevel(["card2"], "P1")).toEqual([]);
  });
  it("every card has all four stages with 3 to 4 actions", () => {
    for (const c of CARDS) for (const s of STAGES) {
      const n = c.stages[s.id].actions.length;
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(4);
    }
  });
});

describe("clock and windows", () => {
  it("computes elapsed minutes and formats them", () => {
    expect(elapsedMinutes(T0, at(75))).toBe(75);
    expect(elapsedMinutes(T0, at(-5))).toBe(0);
    expect(formatElapsed(75)).toBe("1h 15m");
    expect(formatElapsed(9)).toBe("9m");
  });
  it("classifies windows", () => {
    expect(windowState(15, 30, 10, 0, 4)).toBe("upcoming");
    expect(windowState(15, 30, 20, 1, 4)).toBe("current");
    expect(windowState(15, 30, 31, 3, 4)).toBe("overdue");
    expect(windowState(15, 30, 31, 4, 4)).toBe("done");
  });
  it("marks the 0-15 band overdue at 16 minutes if not complete", () => {
    const inc = newIncident(T0);
    const bands = checklistProgress(inc, at(16));
    expect(bands[0].state).toBe("overdue");
    expect(bands[1].state).toBe("current");
  });
  it("auto-completes checklist items from commander actions", () => {
    let inc = { ...newIncident(T0), pLevel: "P2", pLevelConfirmedAt: at(20), cardIds: ["card4"] };
    const classify = checklistProgress(inc, at(20)).find(b => b.id === "classify");
    expect(classify.done).toBe(3);
    inc = { ...inc, checklist: { "cls-what": { at: at(18) } } };
    expect(checklistProgress(inc, at(20)).find(b => b.id === "classify").state).toBe("done");
  });
  it("tracks card stage completion by hours", () => {
    const inc = { ...newIncident(T0), cardIds: ["card2"], actions: { [actionKey("card2", "secure", 0)]: { doneAt: at(5) } } };
    const st = stageProgress(inc, "card2", at(90));
    expect(st[0]).toMatchObject({ id: "secure", done: 1, state: "overdue" });
    expect(st[1].state).toBe("current");
  });
});

describe("communications", () => {
  it("sets SLT due at once for P1 and within 2 hours for P2", () => {
    expect(commsPlan("P1", T0).find(r => r.id === "slt").dueAt).toBe(at(0));
    expect(commsPlan("P2", T0).find(r => r.id === "slt").dueAt).toBe(at(120));
  });
  it("SLT row does not apply below P2; staff message due within 60 minutes", () => {
    const p3 = commsPlan("P3", T0);
    expect(p3.find(r => r.id === "slt").applies).toBe(false);
    expect(p3.find(r => r.id === "staff").dueAt).toBe(at(60));
  });
  it("fills the holding message and leaves placeholders for blanks", () => {
    const msg = fillHolding({ building: "Lab B", instruction: "leave", location: "the east wing", time: "03:00" });
    expect(msg).toContain("incident at Lab B affecting [area/service]");
    expect(msg).toContain("Please leave the east wing");
    expect(msg).toContain("Do not post about this on social media.");
  });
});

describe("contacts", () => {
  it("treats a contact without deputy and verified date as a gap", () => {
    const gaps = contactGaps([
      { role: "A", name: "x", phone: "1", deputy: "y", verified: "2026-10-01" },
      { role: "B", name: "x", phone: "1", deputy: "", verified: "" },
      { role: "999", fixed: true },
    ]);
    expect(gaps.map(g => g.role)).toEqual(["B"]);
  });
});

describe("report", () => {
  it("exports a markdown report with checklist, cards and log", () => {
    let inc = newIncident(T0, { title: "Fire in Lab B", lead: "Duty Responder" });
    inc = { ...inc, pLevel: "P2", cardIds: ["card4"], checklist: { "safe-999": { at: at(2) } } };
    inc = addLog(inc, at(10), "decision", "Evacuated Lab B | east wing", "DR");
    const md = toMarkdown(inc, at(30));
    expect(md).toContain("# Incident report: INC-202611170200");
    expect(md).toContain("**P-level:** P2 Major (provisional)");
    expect(md).toContain("- [x] SCR has called 999 if needed; Part A actions under way (02:02Z)");
    expect(md).toContain("## Card 4: Fire, explosion or structural damage");
    expect(md).toContain("Evacuated Lab B \\| east wing");
    expect(FIRST_HOUR.flatMap(b => b.items).every(i => md.includes(i.text))).toBe(true);
  });
});

import { exampleIncident } from "../src/incident/engine.js";
describe("training example", () => {
  it("is labelled, 22 minutes in, at P2 with Card 4 open", () => {
    const inc = exampleIncident(at(60));
    expect(inc.title.startsWith("EXAMPLE")).toBe(true);
    expect(elapsedMinutes(inc.declaredAt, at(60))).toBe(22);
    expect(inc.pLevel).toBe("P2");
    expect(inc.cardIds).toEqual(["card4"]);
    const bands = checklistProgress(inc, at(60));
    expect(bands[0].state).toBe("overdue");   // 3 of 4 done after 15 minutes
    expect(bands[1].state).toBe("done");
    expect(toMarkdown(inc, at(60))).toContain("INC-EXAMPLE");
  });
});
