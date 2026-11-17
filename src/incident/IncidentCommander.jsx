import { useEffect, useState } from "react";
import {
  P_LEVELS, P_ORDER, TRIAGE_QUESTIONS, SCENARIO_TRIGGERS, FIRST_HOUR, STAGES,
  REASSESS_TRIGGERS, ROLES, CONTACTS, HOLDING_INSTRUCTIONS, PACK_VERSION,
} from "./data.js";
import {
  recommendPLevel, reasonsFor, suggestCards, cardById, cardsAboveLevel, elapsedMinutes,
  formatElapsed, checklistProgress, isChecklistDone, autoDone, stageProgress, actionKey,
  commsPlan, fillHolding, contactGaps, newIncident, addLog, toMarkdown,
} from "./engine.js";

// ── Storage (per-browser; the exported report is the record of truth) ─
const KEY = "ic.current.v1";
const ARCHIVE = "ic.archive.v1";
const load = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } };

// ── Look ──────────────────────────────────────────────────────────────
const P_STYLE = {
  P1: { bg: "#FEE2E2", text: "#991B1B", border: "#F87171" },
  P2: { bg: "#FFEDD5", text: "#9A3412", border: "#FB923C" },
  P3: { bg: "#FEF9C3", text: "#854D0E", border: "#FACC15" },
  P4: { bg: "#DCFCE7", text: "#166534", border: "#4ADE80" },
};
const STATE_STYLE = {
  done:     { bg: "#DCFCE7", text: "#166534", label: "DONE" },
  overdue:  { bg: "#FEE2E2", text: "#991B1B", label: "OVERDUE" },
  current:  { bg: "#DBEAFE", text: "#1D4ED8", label: "NOW" },
  upcoming: { bg: "#F1F5F9", text: "#475569", label: "NEXT" },
};
const card = { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 16, marginBottom: 14 };
const btn = (primary) => ({
  background: primary ? "#1E293B" : "#fff", color: primary ? "#fff" : "#1E293B",
  border: "1.5px solid #1E293B", borderRadius: 6, padding: "8px 14px", fontSize: 13,
  fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
});
const input = { border: "1.5px solid #CBD5E1", borderRadius: 6, padding: "8px 10px", fontSize: 14, fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
const Pill = ({ s, children }) => (
  <span style={{ background: s.bg, color: s.text, border: `1px solid ${s.border || s.bg}`, borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>{children}</span>
);
const hhmm = iso => (iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Declare ───────────────────────────────────────────────────────────
function Declare({ onDeclare, archive }) {
  const [f, setF] = useState({ title: "", location: "", lead: "", reportedBy: "" });
  const set = k => e => setF({ ...f, [k]: e.target.value });
  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Declare an incident</h2>
        <p style={{ color: "#475569", fontSize: 14 }}>Starts the clock. Set a provisional P-level within 15 minutes; when in doubt, classify higher.</p>
        {[["title", "What has happened?"], ["location", "Exactly where?"], ["lead", "Site Incident Lead (your name)"], ["reportedBy", "Reported by / how"]].map(([k, l]) => (
          <label key={k} style={{ display: "block", marginBottom: 10, fontSize: 13, fontWeight: 600 }}>{l}
            <input style={{ ...input, marginTop: 4 }} value={f[k]} onChange={set(k)} />
          </label>
        ))}
        <button style={btn(true)} onClick={() => onDeclare(f)}>Declare incident and start clock</button>
      </div>
      {archive.length > 0 && (
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Closed incidents (this browser)</h3>
          {archive.slice().reverse().map(inc => (
            <div key={inc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: "1px solid #F1F5F9", gap: 8 }}>
              <span style={{ fontSize: 13 }}>{inc.id} · {inc.title || "(untitled)"} · {inc.pLevel || "no P-level"}</span>
              <button style={btn(false)} onClick={() => download(`${inc.id}.md`, toMarkdown(inc, inc.closedAt))}>Report</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────
export default function IncidentCommander() {
  const [inc, setInc] = useState(() => load(KEY));
  const [archive, setArchive] = useState(() => load(ARCHIVE) || []);
  const [tab, setTab] = useState("triage");
  const [now, setNow] = useState(() => new Date().toISOString());

  useEffect(() => { const t = setInterval(() => setNow(new Date().toISOString()), 15000); return () => clearInterval(t); }, []);
  useEffect(() => { save(KEY, inc); }, [inc]);
  useEffect(() => { save(ARCHIVE, archive); }, [archive]);

  if (!inc) return <Declare archive={archive} onDeclare={f => { setInc(newIncident(new Date(), f)); setTab("triage"); }} />;

  const stamp = () => new Date().toISOString();
  const log = (type, text) => setInc(i => addLog(i, stamp(), type, text, i.lead));
  const patch = (fields, type, text) => setInc(i => {
    const next = { ...i, ...fields };
    return text ? addLog(next, stamp(), type, text, i.lead) : next;
  });

  const elapsed = elapsedMinutes(inc.declaredAt, now);
  const bands = checklistProgress(inc, now);
  const overdue = bands.filter(b => b.state === "overdue").length
    + inc.cardIds.reduce((n, id) => n + stageProgress(inc, id, now).filter(s => s.state === "overdue").length, 0);
  const pStyle = inc.pLevel ? P_STYLE[inc.pLevel] : { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" };
  const updateDue = inc.nextUpdateAt ? Math.round((new Date(inc.nextUpdateAt) - new Date(now)) / 60000) : null;

  const close = () => {
    if (!window.confirm("Close this incident? Export the report first if you need it.")) return;
    const closed = addLog({ ...inc, closedAt: stamp() }, stamp(), "system", "Incident closed", inc.lead);
    setArchive(a => [...a, closed]);
    download(`${closed.id}.md`, toMarkdown(closed, closed.closedAt));
    setInc(null);
  };

  const TABS = [
    ["triage", "1 · Triage"], ["checklist", "2 · First hour"], ["cards", `3 · Cards (${inc.cardIds.length})`],
    ["comms", "4 · Comms"], ["log", `5 · Log (${inc.log.length})`], ["contacts", "Contacts & roles"],
  ];

  return (
    <div>
      {/* Status bar */}
      <div style={{ ...card, display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", borderLeft: `6px solid ${pStyle.border}` }}>
        <div style={{ flex: "1 1 260px" }}>
          <div style={{ fontSize: 12, color: "#64748B" }}>{inc.id} · declared {hhmm(inc.declaredAt)} · lead {inc.lead || "—"}</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{inc.title || "(untitled incident)"}{inc.location ? ` — ${inc.location}` : ""}</div>
        </div>
        <Pill s={pStyle}>{inc.pLevel ? `${inc.pLevel} ${P_LEVELS[inc.pLevel].name} · ${inc.pLevelConfirmedAt ? "CONFIRMED" : "PROVISIONAL"}` : "P-LEVEL NOT SET"}</Pill>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{formatElapsed(elapsed)}</div>
          <div style={{ fontSize: 11, color: "#64748B" }}>ELAPSED</div>
        </div>
        {updateDue !== null && <Pill s={updateDue < 0 ? STATE_STYLE.overdue : STATE_STYLE.current}>Update {updateDue < 0 ? `overdue ${-updateDue}m` : `in ${updateDue}m`}</Pill>}
        {overdue > 0 && <Pill s={STATE_STYLE.overdue}>{overdue} overdue</Pill>}
        <div style={{ display: "flex", gap: 8 }}>
          <button style={btn(false)} onClick={() => download(`${inc.id}.md`, toMarkdown(inc, now))}>Export report</button>
          <button style={btn(true)} onClick={close}>Close incident</button>
        </div>
      </div>
      {!inc.pLevel && elapsed >= 15 && <div style={{ ...card, background: "#FEE2E2", color: "#991B1B", fontWeight: 600 }}>Provisional P-level is overdue (due within 15 minutes). Set it in Triage now.</div>}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {TABS.map(([id, l]) => <button key={id} onClick={() => setTab(id)} style={{ ...btn(tab === id), borderRadius: 999 }}>{l}</button>)}
      </div>

      {tab === "triage" && <Triage inc={inc} patch={patch} log={log} />}
      {tab === "checklist" && <Checklist inc={inc} bands={bands} patch={patch} />}
      {tab === "cards" && <Cards inc={inc} now={now} patch={patch} log={log} />}
      {tab === "comms" && <Comms inc={inc} now={now} patch={patch} />}
      {tab === "log" && <Log inc={inc} log={log} />}
      {tab === "contacts" && <Contacts />}
      <p style={{ fontSize: 11, color: "#94A3B8" }}>Source: {PACK_VERSION}. State is saved in this browser only; export the report for the record.</p>
    </div>
  );
}

// ── 1. Triage ─────────────────────────────────────────────────────────
function Triage({ inc, patch, log }) {
  const rec = recommendPLevel(inc.answers);
  const suggested = suggestCards(inc.triggers);
  const [confirmer, setConfirmer] = useState(inc.confirmedBy || "");
  const toggleAnswer = q => patch({ answers: { ...inc.answers, [q.id]: !inc.answers[q.id] } }, "triage", `${inc.answers[q.id] ? "Unset" : "Yes"}: ${q.text}`);
  const toggleTrigger = t => patch({ triggers: inc.triggers.includes(t.id) ? inc.triggers.filter(x => x !== t.id) : [...inc.triggers, t.id] });
  const setLevel = lvl => patch({ pLevel: lvl, pLevelConfirmedAt: null }, "decision", `Provisional P-level set to ${lvl} ${P_LEVELS[lvl].name}${reasonsFor(inc.answers).length ? ` (${reasonsFor(inc.answers).join("; ")})` : ""}`);
  const toggleCard = id => {
    const open = inc.cardIds.includes(id);
    patch({ cardIds: open ? inc.cardIds.filter(x => x !== id) : [...inc.cardIds, id] }, "decision", `${open ? "Closed" : "Opened"} Card ${cardById(id).number}: ${cardById(id).name}`);
  };
  const above = inc.pLevel ? cardsAboveLevel(inc.cardIds, inc.pLevel) : [];

  return (
    <>
      <div style={card}>
        <h3 style={{ marginTop: 0 }}>What does it look like? (Section 1)</h3>
        {TRIAGE_QUESTIONS.map(q => (
          <label key={q.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 0", cursor: "pointer", fontSize: 14 }}>
            <input type="checkbox" checked={!!inc.answers[q.id]} onChange={() => toggleAnswer(q)} style={{ width: 18, height: 18, marginTop: 1 }} />
            <span style={{ flex: 1 }}>{q.text}</span><Pill s={P_STYLE[q.level]}>{q.level}</Pill>
          </label>
        ))}
        <div style={{ marginTop: 12, padding: 12, background: P_STYLE[rec].bg, borderRadius: 8 }}>
          <strong>Recommended: {rec} {P_LEVELS[rec].name}.</strong> {P_LEVELS[rec].activated} ({P_LEVELS[rec].howFast.toLowerCase()}).
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {P_ORDER.map(l => <button key={l} style={btn(l === rec)} onClick={() => setLevel(l)}>Set {l}{l === inc.pLevel ? " ✓" : ""}</button>)}
          </div>
        </div>
        {inc.pLevel && (
          <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
            <input style={{ ...input, maxWidth: 260 }} placeholder="Crisis Co-ordinator name" value={confirmer} onChange={e => setConfirmer(e.target.value)} />
            <button style={btn(!inc.pLevelConfirmedAt)} onClick={() => patch({ pLevelConfirmedAt: new Date().toISOString(), confirmedBy: confirmer }, "decision", `${inc.pLevel} confirmed by Crisis Co-ordinator ${confirmer}`.trim())}>
              {inc.pLevelConfirmedAt ? `Confirmed ${hhmm(inc.pLevelConfirmedAt)} — re-confirm` : `Crisis Co-ordinator confirms ${inc.pLevel}`}
            </button>
          </div>
        )}
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Which scenario? (Part C triggers)</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SCENARIO_TRIGGERS.map(t => (
            <button key={t.id} onClick={() => toggleTrigger(t)} style={{ ...btn(inc.triggers.includes(t.id)), fontWeight: 500, borderRadius: 999, padding: "6px 12px" }}>{t.label}</button>
          ))}
        </div>
        {suggested.length === 0 && <p style={{ fontSize: 13, color: "#64748B" }}>No card matches yet. If none applies, the first-hour checklist covers it.</p>}
        {suggested.map(id => {
          const c = cardById(id); const open = inc.cardIds.includes(id);
          return (
            <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 10, padding: 10, border: "1px solid #E2E8F0", borderRadius: 8 }}>
              <div><strong>Card {c.number}: {c.name}</strong><div style={{ fontSize: 12, color: "#64748B" }}>Lead: {c.lead} · Typical: {c.typicalNote}</div></div>
              <button style={btn(!open)} onClick={() => toggleCard(id)}>{open ? "Opened ✓" : "Open card"}</button>
            </div>
          );
        })}
        {above.map(c => <p key={c.id} style={{ color: "#9A3412", fontSize: 13, fontWeight: 600 }}>Card {c.number} is typically {c.typical}, higher than the {inc.pLevel} set. Check the level.</p>)}
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Re-assess now if any of these appear</h3>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {REASSESS_TRIGGERS.map(r => <button key={r.id} style={btn(false)} onClick={() => log("reassess", `Re-assessment triggered: ${r.label}`)}>{r.label}</button>)}
        </div>
        <p style={{ fontSize: 13, color: "#64748B", marginBottom: 0 }}>Also re-assess the P-level at every IRT meeting.</p>
      </div>
    </>
  );
}

// ── 2. First-hour checklist ───────────────────────────────────────────
function Checklist({ inc, bands, patch }) {
  const toggle = item => {
    const done = !!inc.checklist[item.id];
    const checklist = { ...inc.checklist };
    if (done) delete checklist[item.id]; else checklist[item.id] = { at: new Date().toISOString() };
    patch({ checklist }, "checklist", `${done ? "Unticked" : "Done"}: ${item.text}`);
  };
  return bands.map(band => (
    <div key={band.id} style={{ ...card, borderLeft: `6px solid ${STATE_STYLE[band.state].text}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <h3 style={{ margin: 0 }}>{band.fromMin} to {band.toMin} min: {band.label}</h3>
        <Pill s={STATE_STYLE[band.state]}>{STATE_STYLE[band.state].label} · {band.done}/{band.total}</Pill>
      </div>
      {band.items.map(item => {
        const auto = autoDone(item, inc); const done = isChecklistDone(item, inc);
        return (
          <label key={item.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderTop: "1px solid #F1F5F9", cursor: auto ? "default" : "pointer", fontSize: 14 }}>
            <input type="checkbox" checked={done} disabled={auto} onChange={() => toggle(item)} style={{ width: 18, height: 18, marginTop: 1 }} />
            <span style={{ flex: 1, textDecoration: done ? "line-through" : "none", color: done ? "#64748B" : "#0F172A" }}>{item.text}</span>
            <span style={{ fontSize: 12, color: "#64748B" }}>{inc.checklist[item.id] ? hhmm(inc.checklist[item.id].at) : auto ? "auto" : ""}</span>
          </label>
        );
      })}
    </div>
  ));
}

// ── 3. Scenario cards ─────────────────────────────────────────────────
function Cards({ inc, now, patch, log }) {
  if (!inc.cardIds.length) return <div style={card}>No scenario card open. Open one from Triage, or run the first-hour checklist only.</div>;
  const setAction = (key, fields, text) => patch({ actions: { ...inc.actions, [key]: { ...(inc.actions[key] || {}), ...fields } } }, text ? "action" : null, text);
  return inc.cardIds.map(id => {
    const c = cardById(id); const stages = stageProgress(inc, id, now);
    return (
      <div key={id} style={card}>
        <h3 style={{ margin: "0 0 4px" }}>Card {c.number}: {c.name}</h3>
        <div style={{ fontSize: 13, color: "#475569", marginBottom: 10 }}>Lead: {c.lead} · Typical P-level: {c.typicalNote} · Triggers: {c.triggers}</div>
        {stages.map(st => (
          <div key={st.id} style={{ border: "1px solid #E2E8F0", borderLeft: `5px solid ${STATE_STYLE[st.state].text}`, borderRadius: 8, padding: 10, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
              <strong>{st.label} ({st.fromH} to {st.toH} h)</strong>
              <Pill s={STATE_STYLE[st.state]}>{STATE_STYLE[st.state].label} · {st.done}/{st.total}</Pill>
            </div>
            {c.stages[st.id].actions.map((a, i) => {
              const key = actionKey(id, st.id, i); const s = inc.actions[key] || {};
              return (
                <div key={key} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0", borderTop: "1px solid #F1F5F9", flexWrap: "wrap" }}>
                  <input type="checkbox" checked={!!s.doneAt} style={{ width: 18, height: 18 }}
                    onChange={() => setAction(key, { doneAt: s.doneAt ? null : new Date().toISOString() }, `${s.doneAt ? "Reopened" : "Done"} (Card ${c.number}, ${st.label}): ${a}`)} />
                  <span style={{ flex: "1 1 260px", fontSize: 14, textDecoration: s.doneAt ? "line-through" : "none", color: s.doneAt ? "#64748B" : "#0F172A" }}>{a}</span>
                  <select value={s.owner || ""} style={{ ...input, width: 170, padding: "5px 8px", fontSize: 13 }}
                    onChange={e => setAction(key, { owner: e.target.value }, `Owner for "${a}" set to ${e.target.value || "none"}`)}>
                    <option value="">Assign owner…</option>
                    {c.stages[st.id].owners.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <span style={{ fontSize: 12, color: "#64748B", width: 64, whiteSpace: "nowrap" }}>{hhmm(s.doneAt)}</span>
                </div>
              );
            })}
          </div>
        ))}
        <div style={{ fontSize: 13 }}><strong>Key contacts:</strong> {c.contacts}</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, flex: 1 }}><strong>BCP:</strong> {c.bcp}</span>
          <button style={btn(false)} onClick={() => log("decision", `BCP invocation recommended to CMT (Card ${c.number}): ${c.bcp}`)}>Recommend BCP to CMT</button>
        </div>
      </div>
    );
  });
}

// ── 4. Communications ─────────────────────────────────────────────────
function Comms({ inc, now, patch }) {
  const plan = commsPlan(inc.pLevel || "P4", inc.declaredAt);
  const [h, setH] = useState({ building: inc.location, area: "", instruction: HOLDING_INSTRUCTIONS[0], location: "", time: "" });
  const msg = fillHolding(h);
  const markComms = row => patch({ comms: { ...inc.comms, [row.id]: inc.comms[row.id] ? null : new Date().toISOString() } }, "comms", `${inc.comms[row.id] ? "Reopened" : "Sent"}: ${row.audience} via ${row.channel}`);
  const setNext = mins => patch({ nextUpdateAt: new Date(Date.now() + mins * 60000).toISOString() }, "decision", `Next IRT/CMT update set for ${mins} minutes from now`);
  return (
    <>
      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Who to tell (Section 4){inc.pLevel ? ` at ${inc.pLevel}` : " — set a P-level first"}</h3>
        <p style={{ fontSize: 13, color: "#9F1239", fontWeight: 600 }}>Only the CMT approves anything said outside EIT. The holding message below may go to staff without approval.</p>
        {plan.filter(r => r.applies).map(r => {
          const sent = inc.comms[r.id]; const late = r.dueAt && !sent && new Date(now) > new Date(r.dueAt);
          return (
            <div key={r.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderTop: "1px solid #F1F5F9", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 280px", fontSize: 14 }}><strong>{r.audience}</strong> — {r.channel}<div style={{ fontSize: 12, color: "#64748B" }}>Owner: {r.owner} · {r.when}{r.cmtApproval ? " · CMT approval required" : ""}</div></div>
              {r.dueAt && <Pill s={late ? STATE_STYLE.overdue : STATE_STYLE.upcoming}>{late ? "OVERDUE" : "Due"} {hhmm(r.dueAt)}</Pill>}
              <button style={btn(!sent)} onClick={() => markComms(r)}>{sent ? `Sent ${hhmm(sent)}` : "Mark sent"}</button>
            </div>
          );
        })}
      </div>
      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Holding message to staff</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
          <input style={input} placeholder="Building" value={h.building} onChange={e => setH({ ...h, building: e.target.value })} />
          <input style={input} placeholder="Area / service affected" value={h.area} onChange={e => setH({ ...h, area: e.target.value })} />
          <select style={input} value={h.instruction} onChange={e => setH({ ...h, instruction: e.target.value })}>{HOLDING_INSTRUCTIONS.map(x => <option key={x}>{x}</option>)}</select>
          <input style={input} placeholder="Location" value={h.location} onChange={e => setH({ ...h, location: e.target.value })} />
          <input style={input} placeholder="Next update by (time)" value={h.time} onChange={e => setH({ ...h, time: e.target.value })} />
        </div>
        <div style={{ background: "#F8FAFC", border: "1px dashed #94A3B8", borderRadius: 8, padding: 12, margin: "10px 0", fontSize: 15 }}>{msg}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={btn(false)} onClick={() => navigator.clipboard?.writeText(msg)}>Copy</button>
          <button style={btn(!inc.holdingSentAt)} onClick={() => patch({ holdingSentAt: new Date().toISOString(), comms: { ...inc.comms, staff: inc.comms.staff || new Date().toISOString() } }, "comms", `Holding message sent: "${msg}"`)}>
            {inc.holdingSentAt ? `Sent ${hhmm(inc.holdingSentAt)} — send update` : "Mark holding message sent"}
          </button>
        </div>
      </div>
      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Briefing rhythm</h3>
        <p style={{ fontSize: 14, margin: "0 0 8px" }}>{inc.nextUpdateAt ? `Next IRT/CMT update at ${hhmm(inc.nextUpdateAt)}.` : "No update time set yet."}</p>
        <div style={{ display: "flex", gap: 6 }}>{[30, 60, 120].map(m => <button key={m} style={btn(false)} onClick={() => setNext(m)}>In {m} min</button>)}</div>
      </div>
    </>
  );
}

// ── 5. Log ────────────────────────────────────────────────────────────
function Log({ inc, log }) {
  const [text, setText] = useState(""); const [type, setType] = useState("decision");
  const add = () => { if (text.trim()) { log(type, text.trim()); setText(""); } };
  return (
    <div style={card}>
      <h3 style={{ marginTop: 0 }}>Incident log: decisions, actions, times, who</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <select style={{ ...input, width: 130 }} value={type} onChange={e => setType(e.target.value)}>{["decision", "note", "action", "comms"].map(t => <option key={t}>{t}</option>)}</select>
        <input style={{ ...input, flex: "1 1 240px", width: "auto" }} placeholder="What was decided or done, and by whom" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
        <button style={btn(true)} onClick={add}>Add</button>
      </div>
      {inc.log.slice().reverse().map((e, i) => (
        <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0", borderTop: "1px solid #F1F5F9", fontSize: 13 }}>
          <span style={{ width: 48, color: "#64748B", fontVariantNumeric: "tabular-nums" }}>{hhmm(e.at)}</span>
          <span style={{ width: 70, fontWeight: 700, textTransform: "uppercase", fontSize: 11, color: "#475569" }}>{e.type}</span>
          <span style={{ flex: 1 }}>{e.text}</span>
        </div>
      ))}
    </div>
  );
}

// ── Contacts and roles ────────────────────────────────────────────────
function Contacts() {
  const gaps = new Set(contactGaps().map(c => c.role));
  return (
    <>
      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Key contacts (Section 5)</h3>
        {gaps.size > 0 && <p style={{ color: "#991B1B", fontSize: 13, fontWeight: 600 }}>{gaps.size} contacts are gaps: each needs a name, 24/7 phone, deputy and verified date in src/incident/data.js.</p>}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr>{["Role", "Name", "24/7 phone", "Deputy", "Verified"].map(h => <th key={h} style={{ textAlign: "left", padding: 6, borderBottom: "2px solid #E2E8F0" }}>{h}</th>)}</tr></thead>
            <tbody>{CONTACTS.map(c => (
              <tr key={c.role} style={{ background: gaps.has(c.role) ? "#FEF2F2" : "transparent" }}>
                <td style={{ padding: 6 }}>{c.role}</td><td style={{ padding: 6 }}>{c.name || "—"}</td>
                <td style={{ padding: 6 }}>{c.phone ? <a href={`tel:${c.phone}`}>{c.phone}</a> : "—"}</td>
                <td style={{ padding: 6 }}>{c.deputy || "—"}</td><td style={{ padding: 6 }}>{c.verified || "—"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Roles (Section 2)</h3>
        {ROLES.map(r => <p key={r.role} style={{ fontSize: 13 }}><strong>{r.role}:</strong> {r.who}. Hands over to {r.handsOver}.</p>)}
      </div>
    </>
  );
}
