import { describe, it, expect } from "vitest";
import { readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  createEngine, validatePack, elapsedMinutes, formatElapsed, windowState, fillTemplate,
  contactGaps, addLog, actionKey,
} from "../src/incident/engine.js";
import eit from "../src/incident/packs/eit.js";

const T0 = "2026-11-17T02:00:00.000Z";
const at = mins => new Date(new Date(T0).getTime() + mins * 60000).toISOString();
const E = createEngine(eit);

// Every pack in the repo, plus any in the git-ignored private-packs/ folder, must be valid.
const packFiles = [
  ...readdirSync("src/incident/packs").filter(f => f.endsWith(".js")).map(f => resolve("src/incident/packs", f)),
  ...(existsSync("private-packs") ? readdirSync("private-packs").filter(f => f.endsWith(".js")).map(f => resolve("private-packs", f)) : []),
];
const packs = await Promise.all(packFiles.map(async f => (await import(pathToFileURL(f).href)).default));

describe.each(packs.map(p => [p.id, p]))("pack %s", (_, pack) => {
  const P = createEngine(pack);
  it("passes the structural checks", () => {
    expect(validatePack(pack)).toEqual([]);
  });
  it("builds its training example and report", () => {
    const inc = P.exampleIncident(at(60));
    expect(inc.title.startsWith("EXAMPLE")).toBe(true);
    expect(elapsedMinutes(inc.declaredAt, at(60))).toBe(pack.example.ageMin);
    const md = P.toMarkdown(inc, at(60));
    expect(md).toContain("INC-EXAMPLE");
    expect(pack.firstHour.flatMap(b => b.items).every(i => md.includes(i.text))).toBe(true);
  });
  it("recommends the lowest level with no answers", () => {
    expect(P.recommendLevel({})).toBe(pack.levels[pack.levels.length - 1].id);
  });
});

describe("EIT triage", () => {
  it("takes the highest level implied (when in doubt, classify higher)", () => {
    expect(E.recommendLevel({ oneArea: true })).toBe("P3");
    expect(E.recommendLevel({ oneArea: true, outOfUse: true })).toBe("P2");
    expect(E.recommendLevel({ outOfUse: true, attack: true })).toBe("P1");
  });
  it("higherOf picks the more severe level", () => {
    expect(E.higherOf("P3", "P1")).toBe("P1");
    expect(E.higherOf(null, "P2")).toBe("P2");
  });
  it("labels levels with their name", () => {
    expect(E.levelLabel("P2")).toBe("P2 Major");
  });
});

describe("EIT scenario cards", () => {
  it("maps triggers to cards in card order without duplicates", () => {
    expect(E.suggestCards(["fire", "ambulance", "multiCasualty"])).toEqual(["card1", "card4"]);
    expect(E.suggestCards(["gasLeak"])).toEqual(["card3"]);
    expect(E.suggestCards([])).toEqual([]);
  });
  it("flags cards whose typical level is above the set level", () => {
    expect(E.cardsAboveLevel(["card2", "card3"], "P3").map(c => c.id)).toEqual(["card2"]);
    expect(E.cardsAboveLevel(["card2"], "P1")).toEqual([]);
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
    const bands = E.checklistProgress(E.newIncident(T0), at(16));
    expect(bands[0].state).toBe("overdue");
    expect(bands[1].state).toBe("current");
  });
  it("auto-completes checklist items from commander actions", () => {
    let inc = { ...E.newIncident(T0), pLevel: "P2", pLevelConfirmedAt: at(20), cardIds: ["card4"] };
    expect(E.checklistProgress(inc, at(20)).find(b => b.id === "classify").done).toBe(3);
    inc = { ...inc, checklist: { "cls-what": { at: at(18) } } };
    expect(E.checklistProgress(inc, at(20)).find(b => b.id === "classify").state).toBe("done");
    inc = { ...inc, sent: { holding: at(25) } };
    expect(E.isChecklistDone(eit.firstHour[2].items.find(i => i.id === "act-holding"), inc)).toBe(true);
  });
  it("tracks card stage completion by hours", () => {
    const inc = { ...E.newIncident(T0), cardIds: ["card2"], actions: { [actionKey("card2", "secure", 0)]: { doneAt: at(5) } } };
    const st = E.stageProgress(inc, "card2", at(90));
    expect(st[0]).toMatchObject({ id: "secure", done: 1, state: "overdue" });
    expect(st[1].state).toBe("current");
  });
});

describe("EIT communications", () => {
  it("sets SLT due at once for P1 and within 2 hours for P2", () => {
    expect(E.commsPlan("P1", T0).find(r => r.id === "slt").dueAt).toBe(at(0));
    expect(E.commsPlan("P2", T0).find(r => r.id === "slt").dueAt).toBe(at(120));
  });
  it("SLT row does not apply below P2; staff message due within 60 minutes", () => {
    const p3 = E.commsPlan("P3", T0);
    expect(p3.find(r => r.id === "slt").applies).toBe(false);
    expect(p3.find(r => r.id === "staff").dueAt).toBe(at(60));
  });
  it("fills the holding message and leaves placeholders for blanks", () => {
    const m = eit.messages[0];
    const msg = fillTemplate(m.template, m.fields, { building: "Lab B", instruction: "leave", location: "the east wing", time: "03:00" });
    expect(msg).toContain("incident at Lab B affecting [area/service]");
    expect(msg).toContain("Please leave the east wing");
    expect(msg).toContain("Do not post about this on social media.");
  });
  it("prefills the building from the incident location", () => {
    expect(E.messageDefaults(eit.messages[0], { location: "Lab B" })).toMatchObject({ building: "Lab B", instruction: "stay away from" });
  });
});

describe("saved state from earlier versions", () => {
  it("maps holdingSentAt onto sent.holding", () => {
    const inc = E.normalize({ ...E.newIncident(T0), sent: undefined, holdingSentAt: at(30) });
    expect(inc.sent.holding).toBe(at(30));
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
    let inc = E.newIncident(T0, { title: "Fire in Lab B", lead: "Duty Responder" });
    inc = { ...inc, pLevel: "P2", cardIds: ["card4"], checklist: { "safe-999": { at: at(2) } } };
    inc = addLog(inc, at(10), "decision", "Evacuated Lab B | east wing", "DR");
    const md = E.toMarkdown(inc, at(30));
    expect(md).toContain("# Incident report: INC-202611170200");
    expect(md).toContain("**P-level:** P2 Major (provisional)");
    expect(md).toContain("- [x] SCR has called 999 if needed; Part A actions under way (02:02Z)");
    expect(md).toContain("## Card 4: Fire, explosion or structural damage");
    expect(md).toContain("Evacuated Lab B \\| east wing");
  });
});

describe("alerts that override the level", () => {
  // A synthetic pack: EIT plus one alert-only question and an escalation row that is due at once on alert.
  const alertPack = {
    ...eit,
    triage: [...eit.triage, { id: "vip", text: "Is a senior person involved?", alert: true, short: "senior person" }],
    alert: { text: "Escalate now.", commsRow: "slt", button: "Mark escalated", doneLog: "Escalated" },
    comms: eit.comms.map(r => (r.id === "slt" ? { ...r, onAlert: 0 } : r)),
  };
  const A = createEngine(alertPack);
  it("is valid and does not raise the level by itself", () => {
    expect(validatePack(alertPack)).toEqual([]);
    expect(A.recommendLevel({ vip: true })).toBe("P4");
    expect(A.alertsFor({ vip: true }).map(q => q.id)).toEqual(["vip"]);
  });
  it("makes the alert row due at once even where the level would not include it", () => {
    expect(A.commsPlan("P3", T0).find(r => r.id === "slt").applies).toBe(false);
    const row = A.commsPlan("P3", T0, { alert: true }).find(r => r.id === "slt");
    expect(row).toMatchObject({ applies: true, dueAt: at(0) });
  });
  it("names the alert in the report", () => {
    const inc = { ...A.newIncident(T0), answers: { vip: true } };
    expect(A.toMarkdown(inc, at(5))).toContain("**Immediate alert:** Is a senior person involved?");
  });
});
