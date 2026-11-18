// Pure incident logic: no React, no storage. Everything here is unit-tested.
// createEngine(pack) binds the logic to one organisation's pack (see packs/README.md).

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

export const actionKey = (cardId, stageId, idx) => `${cardId}:${stageId}:${idx}`;

// Fill {key} placeholders; blanks show as [label] so nothing is sent half-finished unnoticed.
export function fillTemplate(template, fields, values = {}) {
  return fields.reduce((out, f) => {
    const v = values[f.key];
    return out.split(`{${f.key}}`).join((v && String(v).trim()) || `[${f.label}]`);
  }, template);
}

// A contact is a gap without a name, phone, deputy and verified date.
export function contactGaps(contacts) {
  return contacts.filter(c => !c.fixed && !(c.name && c.phone && c.deputy && c.verified));
}

const hhmmZ = iso => (iso ? new Date(iso).toISOString().slice(11, 16) + "Z" : "");

export function createEngine(pack) {
  const order = pack.levels.map(l => l.id);
  const lowest = order[order.length - 1];
  const level = id => pack.levels.find(l => l.id === id) || null;
  const levelLabel = id => {
    const l = level(id);
    if (!l) return "not set";
    return l.name.includes(l.short) ? l.name : `${l.short} ${l.name}`;
  };
  const higherOf = (a, b) => {
    if (!a) return b;
    if (!b) return a;
    return order.indexOf(a) <= order.indexOf(b) ? a : b;
  };
  const cardById = id => pack.cards.find(c => c.id === id) || null;

  // Highest level implied by any "yes" answer; the lowest level if none. When in doubt, classify higher.
  const recommendLevel = (answers = {}) =>
    pack.triage.reduce((lvl, q) => (answers[q.id] && q.level ? higherOf(lvl, q.level) : lvl), lowest);

  const reasonsFor = (answers = {}) =>
    pack.triage.filter(q => answers[q.id] && q.level).map(q => `${level(q.level).short}: ${q.text}`);

  // Answers that require an immediate alert whatever the level (e.g. "Notify the CMT at once").
  const alertsFor = (answers = {}) => pack.triage.filter(q => q.alert && answers[q.id]);

  const suggestCards = (triggerIds = []) => {
    const ids = new Set(pack.triggers.filter(t => triggerIds.includes(t.id)).map(t => t.card));
    return pack.cards.filter(c => ids.has(c.id)).map(c => c.id);
  };

  // Cards whose typical level is higher than the one set: prompt a second look.
  const cardsAboveLevel = (cardIds, lvl) =>
    cardIds.map(cardById).filter(c => c && c.typical !== lvl && higherOf(c.typical, lvl) === c.typical);

  const sentAt = (incident, id) => (incident.sent || {})[id] || null;

  // Checklist items that tick themselves from what the commander has already done.
  // auto is a key or an array of keys that must all hold.
  const autoKeyDone = (key, incident) => {
    if (key.startsWith("sent:")) return !!sentAt(incident, key.slice(5));
    switch (key) {
      case "plevel": return !!incident.pLevel;
      case "confirmed": return !!incident.pLevelConfirmedAt;
      case "card": return (incident.cardIds || []).length > 0;
      case "nextUpdate": return !!incident.nextUpdateAt;
      case "log": return (incident.log || []).some(e => e.type === "decision" || e.type === "note");
      default: return false;
    }
  };
  const autoDone = (item, incident) =>
    !!item.auto && [].concat(item.auto).every(k => autoKeyDone(k, incident));
  const isChecklistDone = (item, incident) => !!(incident.checklist || {})[item.id] || autoDone(item, incident);

  const checklistProgress = (incident, now) => {
    const elapsed = elapsedMinutes(incident.declaredAt, now);
    return pack.firstHour.map(band => {
      const done = band.items.filter(i => isChecklistDone(i, incident)).length;
      return { ...band, done, total: band.items.length, state: windowState(band.fromMin, band.toMin, elapsed, done, band.items.length) };
    });
  };

  const stageProgress = (incident, cardId, now) => {
    const card = cardById(cardId);
    if (!card) return [];
    const elapsed = elapsedMinutes(incident.declaredAt, now);
    return pack.stages.map(st => {
      const actions = card.stages[st.id].actions;
      const done = actions.filter((_, i) => (incident.actions || {})[actionKey(cardId, st.id, i)]?.doneAt).length;
      return { ...st, done, total: actions.length, state: windowState(st.fromH * 60, st.toH * 60, elapsed, done, actions.length) };
    });
  };

  // Communications at this level, with a due time where the pack sets one.
  // A row with onAlert is due at that many minutes whenever an alert answer is active.
  const commsPlan = (lvl, declaredAt, { alert = false } = {}) => pack.comms.map(row => {
    const byLevel = row.dueMin && lvl && row.dueMin[lvl] !== undefined ? row.dueMin[lvl] : null;
    const byAlert = alert && row.onAlert !== undefined ? row.onAlert : null;
    const due = byAlert !== null && (byLevel === null || byAlert < byLevel) ? byAlert : byLevel;
    return {
      ...row,
      applies: !row.dueMin || due !== null,
      dueAt: due === null || !declaredAt ? null : new Date(new Date(declaredAt).getTime() + due * 60000).toISOString(),
    };
  });

  // Prefill message fields from the incident where the pack says so.
  const messageDefaults = (msg, incident) => Object.fromEntries(msg.fields.map(f => {
    const src = f.prefill;
    let v = "";
    if (src === "level") v = incident.pLevel ? levelLabel(incident.pLevel) : "";
    else if (src === "nextUpdate") v = incident.nextUpdateAt ? new Date(incident.nextUpdateAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
    else if (src) v = incident[src] || "";
    else if (f.options) v = f.options[0];
    return [f.key, v];
  }));

  const newIncident = (now, fields = {}) => {
    const at = new Date(now).toISOString();
    return {
      id: `INC-${at.slice(0, 16).replace(/[-:T]/g, "")}`,
      pack: pack.id,
      title: "", location: "", lead: "", reportedBy: "",
      ...fields,
      declaredAt: at,
      answers: {}, triggers: [],
      pLevel: null, pLevelConfirmedAt: null, confirmedBy: "",
      cardIds: [], checklist: {}, actions: {}, comms: {}, sent: {},
      nextUpdateAt: null, closedAt: null,
      log: [{ at, type: "system", text: "Incident declared" }],
    };
  };

  // Bring incidents saved by earlier versions up to the current shape.
  const normalize = inc => {
    if (!inc) return inc;
    const sent = { ...(inc.sent || {}) };
    if (inc.holdingSentAt && !sent.holding) sent.holding = inc.holdingSentAt;
    return { comms: {}, actions: {}, checklist: {}, cardIds: [], triggers: [], answers: {}, ...inc, sent };
  };

  const exampleIncident = now => {
    const ex = pack.example;
    const t0 = new Date(new Date(now).getTime() - ex.ageMin * 60000);
    const at = m => new Date(t0.getTime() + m * 60000).toISOString();
    let inc = newIncident(t0, { title: ex.title, location: ex.location, lead: ex.lead, reportedBy: ex.reportedBy });
    inc = {
      ...inc,
      id: "INC-EXAMPLE",
      answers: { ...ex.answers }, triggers: [...ex.triggers],
      pLevel: ex.level, pLevelConfirmedAt: ex.confirmAt == null ? null : at(ex.confirmAt), confirmedBy: ex.confirmedBy || "",
      cardIds: [...ex.cardIds],
      checklist: Object.fromEntries(Object.entries(ex.checklist).map(([k, m]) => [k, { at: at(m) }])),
      actions: Object.fromEntries(ex.actions.map(([c, s, i, m, owner]) => [actionKey(c, s, i), { ...(m == null ? {} : { doneAt: at(m) }), ...(owner ? { owner } : {}) }])),
      sent: Object.fromEntries(Object.entries(ex.sent || {}).map(([k, m]) => [k, at(m)])),
      comms: Object.fromEntries(Object.entries(ex.comms || {}).map(([k, m]) => [k, at(m)])),
    };
    for (const [m, type, text] of ex.log) inc = addLog(inc, at(m), type, text, ex.lead);
    return inc;
  };

  // Incident report for handover to the next tier, or for the post-incident review.
  const toMarkdown = (incident, now) => {
    const t = pack.terms;
    const elapsed = elapsedMinutes(incident.declaredAt, incident.closedAt || now);
    const alerts = alertsFor(incident.answers);
    const lines = [
      `# Incident report: ${incident.id}`,
      "",
      ...(pack.classification ? [`*${pack.classification}*`, ""] : []),
      `- **Incident:** ${incident.title || "(untitled)"}`,
      `- **Location:** ${incident.location || "(not recorded)"}`,
      `- **${t.lead}:** ${incident.lead || "(not recorded)"}`,
      `- **Declared:** ${incident.declaredAt}`,
      `- **Elapsed:** ${formatElapsed(elapsed)}${incident.closedAt ? ` (closed ${incident.closedAt})` : ""}`,
      `- **${t.level[0].toUpperCase()}${t.level.slice(1)}:** ${levelLabel(incident.pLevel)}${incident.pLevel ? (incident.pLevelConfirmedAt ? ` (${t.confirmedWord.toLowerCase()} ${hhmmZ(incident.pLevelConfirmedAt)}${incident.confirmedBy ? ` with ${incident.confirmedBy}` : ""})` : " (provisional)") : ""}`,
      ...(alerts.length ? [`- **Immediate alert:** ${alerts.map(a => a.text).join("; ")}`] : []),
      `- **Scenario cards:** ${incident.cardIds.map(id => `Card ${cardById(id).number}: ${cardById(id).name}`).join("; ") || "none"}`,
      `- **Messages sent:** ${pack.messages.filter(m => sentAt(incident, m.id)).map(m => `${m.title} (${hhmmZ(sentAt(incident, m.id))})`).join("; ") || "none"}`,
      `- **Source:** ${pack.source}`,
      "",
      "## First-hour checklist",
    ];
    for (const band of pack.firstHour) {
      lines.push(`### ${band.fromMin} to ${band.toMin} minutes: ${band.label}`);
      for (const item of band.items) {
        const at = (incident.checklist || {})[item.id]?.at;
        lines.push(`- [${isChecklistDone(item, incident) ? "x" : " "}] ${item.text}${at ? ` (${hhmmZ(at)})` : ""}`);
      }
    }
    for (const id of incident.cardIds) {
      const card = cardById(id);
      lines.push("", `## Card ${card.number}: ${card.name}`);
      for (const st of pack.stages) {
        lines.push(`### ${st.label} (${st.fromH} to ${st.toH} hours)`);
        card.stages[st.id].actions.forEach((a, i) => {
          const s = (incident.actions || {})[actionKey(id, st.id, i)] || {};
          lines.push(`- [${s.doneAt ? "x" : " "}] ${a}${s.owner ? ` (owner: ${s.owner})` : ""}${s.doneAt ? ` (${hhmmZ(s.doneAt)})` : ""}`);
        });
      }
    }
    lines.push("", "## Log", "", "| Time (UTC) | Type | Entry | By |", "|---|---|---|---|");
    for (const e of incident.log) {
      lines.push(`| ${e.at.replace("T", " ").slice(0, 19)} | ${e.type} | ${String(e.text).replace(/\|/g, "\\|").replace(/\n/g, " ")} | ${e.by || ""} |`);
    }
    return lines.join("\n") + "\n";
  };

  return {
    pack, order, lowest, level, levelLabel, higherOf, cardById,
    recommendLevel, reasonsFor, alertsFor, suggestCards, cardsAboveLevel,
    autoDone, isChecklistDone, checklistProgress, stageProgress, commsPlan,
    messageDefaults, sentAt, newIncident, normalize, exampleIncident, toMarkdown,
  };
}

export const addLog = (incident, now, type, text, by = "") => ({
  ...incident,
  log: [...incident.log, { at: new Date(now).toISOString(), type, text, by }],
});

// Structural checks every pack must pass. Returns a list of problems (empty when valid).
export function validatePack(pack) {
  const errs = [];
  const levels = new Set(pack.levels.map(l => l.id));
  const cards = new Set(pack.cards.map(c => c.id));
  const autos = new Set(["plevel", "confirmed", "card", "nextUpdate", "log", ...pack.messages.map(m => `sent:${m.id}`)]);
  const comms = new Set(pack.comms.map(c => c.id));
  for (const q of pack.triage) if (q.level && !levels.has(q.level)) errs.push(`triage ${q.id}: unknown level ${q.level}`);
  for (const q of pack.triage) if (!q.level && !q.alert) errs.push(`triage ${q.id}: needs a level or an alert`);
  for (const t of pack.triggers) if (!cards.has(t.card)) errs.push(`trigger ${t.id}: unknown card ${t.card}`);
  for (const c of pack.cards) {
    if (!levels.has(c.typical)) errs.push(`card ${c.id}: unknown typical level ${c.typical}`);
    for (const s of pack.stages) {
      const n = c.stages[s.id]?.actions.length || 0;
      if (n < 1 || n > 6) errs.push(`card ${c.id} ${s.id}: ${n} actions (expected 1 to 6)`);
    }
  }
  for (const b of pack.firstHour) for (const i of b.items) for (const k of [].concat(i.auto || [])) if (!autos.has(k)) errs.push(`checklist ${i.id}: unknown auto ${k}`);
  for (const r of pack.comms) for (const l of Object.keys(r.dueMin || {})) if (!levels.has(l)) errs.push(`comms ${r.id}: unknown level ${l}`);
  for (const m of pack.messages) {
    if (m.commsRow && ![].concat(m.commsRow).every(r => comms.has(r))) errs.push(`message ${m.id}: unknown comms row`);
    for (const f of m.fields) if (!m.template.includes(`{${f.key}}`)) errs.push(`message ${m.id}: field ${f.key} not in template`);
  }
  const ex = pack.example;
  if (!levels.has(ex.level)) errs.push(`example: unknown level ${ex.level}`);
  for (const id of ex.cardIds) if (!cards.has(id)) errs.push(`example: unknown card ${id}`);
  return errs;
}
