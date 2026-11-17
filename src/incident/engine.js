// Pure incident logic: no React, no storage. Everything here is unit-tested.
import {
  P_ORDER, P_LEVELS, TRIAGE_QUESTIONS, SCENARIO_TRIGGERS, CARDS, FIRST_HOUR,
  STAGES, COMMS, HOLDING_MESSAGE, PACK_VERSION, CONTACTS,
} from "./data.js";

export const higherOf = (a, b) => {
  if (!a) return b;
  if (!b) return a;
  return P_ORDER.indexOf(a) <= P_ORDER.indexOf(b) ? a : b;
};

// Highest P-level implied by any "yes" answer; P4 if none. When in doubt, classify higher.
export function recommendPLevel(answers = {}) {
  return TRIAGE_QUESTIONS.reduce(
    (lvl, q) => (answers[q.id] ? higherOf(lvl, q.level) : lvl),
    "P4",
  );
}

export function reasonsFor(answers = {}) {
  return TRIAGE_QUESTIONS.filter(q => answers[q.id]).map(q => `${q.level}: ${q.text}`);
}

// Scenario cards whose triggers were selected, in card order.
export function suggestCards(triggerIds = []) {
  const ids = new Set(
    SCENARIO_TRIGGERS.filter(t => triggerIds.includes(t.id)).map(t => t.card),
  );
  return CARDS.filter(c => ids.has(c.id)).map(c => c.id);
}

export const cardById = id => CARDS.find(c => c.id === id) || null;

// Cards whose typical P-level is higher than the one set: prompt a second look.
export function cardsAboveLevel(cardIds, pLevel) {
  return cardIds
    .map(cardById)
    .filter(c => c && higherOf(c.typical, pLevel) === c.typical && c.typical !== pLevel);
}

export const elapsedMinutes = (declaredAt, now) =>
  Math.max(0, Math.floor((new Date(now) - new Date(declaredAt)) / 60000));

export function formatElapsed(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

// State of a time window given elapsed time and completion.
// "done" | "overdue" (window passed, items open) | "current" | "upcoming"
export function windowState(fromMin, toMin, elapsed, doneCount, total) {
  if (total > 0 && doneCount >= total) return "done";
  if (elapsed >= toMin) return "overdue";
  if (elapsed >= fromMin) return "current";
  return "upcoming";
}

// Checklist items that are ticked automatically by what the commander has already done.
export function autoDone(item, incident) {
  switch (item.auto) {
    case "plevel": return !!incident.pLevel;
    case "confirmed": return !!incident.pLevelConfirmedAt;
    case "card": return (incident.cardIds || []).length > 0;
    case "holding": return !!incident.holdingSentAt;
    case "nextUpdate": return !!incident.nextUpdateAt;
    case "log": return (incident.log || []).some(e => e.type === "decision" || e.type === "note");
    default: return false;
  }
}

export const isChecklistDone = (item, incident) =>
  !!(incident.checklist || {})[item.id] || autoDone(item, incident);

export function checklistProgress(incident, now) {
  const elapsed = elapsedMinutes(incident.declaredAt, now);
  return FIRST_HOUR.map(band => {
    const done = band.items.filter(i => isChecklistDone(i, incident)).length;
    return { ...band, done, total: band.items.length, state: windowState(band.fromMin, band.toMin, elapsed, done, band.items.length) };
  });
}

export const actionKey = (cardId, stageId, idx) => `${cardId}:${stageId}:${idx}`;

export function stageProgress(incident, cardId, now) {
  const card = cardById(cardId);
  if (!card) return [];
  const elapsed = elapsedMinutes(incident.declaredAt, now);
  return STAGES.map(st => {
    const actions = card.stages[st.id].actions;
    const done = actions.filter((_, i) => (incident.actions || {})[actionKey(cardId, st.id, i)]?.doneAt).length;
    return { ...st, done, total: actions.length, state: windowState(st.fromH * 60, st.toH * 60, elapsed, done, actions.length) };
  });
}

// Communications due at this P-level, with a due time where the pack sets one.
export function commsPlan(pLevel, declaredAt) {
  return COMMS.map(row => {
    const due = row.dueMin && row.dueMin[pLevel] !== undefined ? row.dueMin[pLevel] : null;
    return {
      ...row,
      applies: row.id !== "slt" || pLevel === "P1" || pLevel === "P2",
      dueAt: due === null || !declaredAt ? null : new Date(new Date(declaredAt).getTime() + due * 60000).toISOString(),
    };
  });
}

export function fillHolding({ building, area, instruction, location, time }) {
  const v = (x, ph) => (x && String(x).trim()) || `[${ph}]`;
  return HOLDING_MESSAGE
    .replace("{building}", v(building, "building"))
    .replace("{area}", v(area, "area/service"))
    .replace("{instruction}", v(instruction, "stay away from / leave / remain in"))
    .replace("{location}", v(location, "location"))
    .replace("{time}", v(time, "time"));
}

// A contact is a gap without a name, phone, deputy and verified date (Section 5).
export function contactGaps(contacts = CONTACTS) {
  return contacts.filter(c => !c.fixed && !(c.name && c.phone && c.deputy && c.verified));
}

export function newIncident(now, fields = {}) {
  const at = new Date(now).toISOString();
  return {
    id: `INC-${at.slice(0, 16).replace(/[-:T]/g, "")}`,
    title: "", location: "", lead: "", reportedBy: "",
    ...fields,
    declaredAt: at,
    answers: {}, triggers: [],
    pLevel: null, pLevelConfirmedAt: null, confirmedBy: "",
    cardIds: [], checklist: {}, actions: {}, comms: {},
    holdingSentAt: null, nextUpdateAt: null, closedAt: null,
    log: [{ at, type: "system", text: "Incident declared" }],
  };
}

export const addLog = (incident, now, type, text, by = "") => ({
  ...incident,
  log: [...incident.log, { at: new Date(now).toISOString(), type, text, by }],
});

const hhmm = iso => (iso ? new Date(iso).toISOString().slice(11, 16) + "Z" : "");

// Incident report for handover to the IRT or CMT, or for the post-incident review.
export function toMarkdown(incident, now) {
  const elapsed = elapsedMinutes(incident.declaredAt, incident.closedAt || now);
  const lvl = incident.pLevel ? `${incident.pLevel} ${P_LEVELS[incident.pLevel].name}` : "not set";
  const lines = [
    `# Incident report: ${incident.id}`,
    "",
    `- **Incident:** ${incident.title || "(untitled)"}`,
    `- **Location:** ${incident.location || "(not recorded)"}`,
    `- **Site Incident Lead:** ${incident.lead || "(not recorded)"}`,
    `- **Declared:** ${incident.declaredAt}`,
    `- **Elapsed:** ${formatElapsed(elapsed)}${incident.closedAt ? ` (closed ${incident.closedAt})` : ""}`,
    `- **P-level:** ${lvl}${incident.pLevelConfirmedAt ? ` (confirmed ${hhmm(incident.pLevelConfirmedAt)}${incident.confirmedBy ? ` by ${incident.confirmedBy}` : ""})` : " (provisional)"}`,
    `- **Scenario cards:** ${incident.cardIds.map(id => `Card ${cardById(id).number}: ${cardById(id).name}`).join("; ") || "none"}`,
    `- **Source:** ${PACK_VERSION}`,
    "",
    "## First-hour checklist",
  ];
  for (const band of FIRST_HOUR) {
    lines.push(`### ${band.fromMin} to ${band.toMin} minutes: ${band.label}`);
    for (const item of band.items) {
      const at = (incident.checklist || {})[item.id]?.at;
      const done = isChecklistDone(item, incident);
      lines.push(`- [${done ? "x" : " "}] ${item.text}${at ? ` (${hhmm(at)})` : ""}`);
    }
  }
  for (const id of incident.cardIds) {
    const card = cardById(id);
    lines.push("", `## Card ${card.number}: ${card.name}`);
    for (const st of STAGES) {
      lines.push(`### ${st.label} (${st.fromH} to ${st.toH} hours)`);
      card.stages[st.id].actions.forEach((a, i) => {
        const s = (incident.actions || {})[actionKey(id, st.id, i)] || {};
        lines.push(`- [${s.doneAt ? "x" : " "}] ${a}${s.owner ? ` (owner: ${s.owner})` : ""}${s.doneAt ? ` (${hhmm(s.doneAt)})` : ""}`);
      });
    }
  }
  lines.push("", "## Log", "", "| Time (UTC) | Type | Entry | By |", "|---|---|---|---|");
  for (const e of incident.log) {
    lines.push(`| ${e.at.replace("T", " ").slice(0, 19)} | ${e.type} | ${String(e.text).replace(/\|/g, "\\|").replace(/\n/g, " ")} | ${e.by || ""} |`);
  }
  return lines.join("\n") + "\n";
}
