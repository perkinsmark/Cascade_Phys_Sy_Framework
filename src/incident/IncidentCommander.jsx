import { useEffect, useState } from "react";
import PACK from "@pack";
import {
  createEngine, elapsedMinutes, formatElapsed, actionKey, fillTemplate, contactGaps, addLog,
} from "./engine.js";

const E = createEngine(PACK);
const T = PACK.terms;

// ── Storage (per-browser; the exported report is the record of truth) ─
const KEY = `${PACK.storageKey}.current.v1`;
const ARCHIVE = `${PACK.storageKey}.archive.v1`;
const load = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } };

// ── Look: every colour is a token from theme.css (light and dark) ───────
const tone = k => ({ bg: `var(--${k}-bg)`, text: `var(--${k}-fg)`, border: `var(--${k}-bd)` });
const levelTone = id => tone(`p${Math.min(4, E.order.indexOf(id) + 1 + Math.max(0, 4 - E.order.length))}`);
const NO_LEVEL = tone("idle");
const STATE_STYLE = {
  done:     { ...tone("done"), label: "DONE" },
  overdue:  { ...tone("late"), label: "OVERDUE" },
  current:  { ...tone("now"),  label: "NOW" },
  upcoming: { ...tone("idle"), label: "NEXT" },
};
const card = { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: 16, marginBottom: 14, minWidth: 0 };
const btn = (primary) => ({
  background: primary ? "var(--ink)" : "var(--surface)", color: primary ? "var(--ink-fg)" : "var(--ink)",
  border: "1.5px solid var(--ink)", borderRadius: 6, padding: "8px 14px", fontSize: 13,
  fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
});
const input = { background: "var(--field)", color: "var(--fg)", border: "1.5px solid var(--field-line)", borderRadius: 6, padding: "8px 10px", fontSize: 14, fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
const Pill = ({ s, children }) => (
  <span style={{ background: s.bg, color: s.text, border: `1px solid ${s.border || s.bg}`, borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>{children}</span>
);
const hhmm = iso => (iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");
const stamp = () => new Date().toISOString();

// Downloads work in the repo app; the shared page's sandbox blocks them, so it copies instead.
const CAN_DOWNLOAD = typeof __ARTIFACT__ === "undefined" || !__ARTIFACT__;
function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Copy with a fallback: when the clipboard is refused, select the text so the viewer can copy it.
function CopyButton({ text, targetId, label = "Copy" }) {
  const [state, setState] = useState(label);
  const selectTarget = () => { const el = targetId && document.getElementById(targetId); if (el) { el.focus(); el.select?.(); } };
  const copy = () => {
    const done = () => { setState("Copied"); setTimeout(() => setState(label), 1500); };
    const fail = () => { selectTarget(); setState("Selected: press Ctrl+C"); setTimeout(() => setState(label), 2500); };
    try { navigator.clipboard ? navigator.clipboard.writeText(text).then(done, fail) : fail(); } catch { fail(); }
  };
  return <button style={btn(false)} onClick={copy}>{state}</button>;
}

function ReportPanel({ inc, now, onClose }) {
  const text = E.toMarkdown(inc, inc.closedAt || now);
  const id = `report-${inc.id}`;
  return (
    <div style={{ ...card, borderColor: "var(--ink)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <h3 style={{ margin: 0 }}>Incident report: {inc.id}</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <CopyButton text={text} targetId={id} label="Copy report" />
          {CAN_DOWNLOAD && <button style={btn(false)} onClick={() => download(`${inc.id}.md`, text)}>Download .md</button>}
          <button style={btn(true)} onClick={onClose}>Done</button>
        </div>
      </div>
      <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 8px" }}>Markdown. Paste it into an email, Teams, or the incident record.{PACK.classification ? ` ${PACK.classification}.` : ""}</p>
      <textarea id={id} readOnly value={text} style={{ ...input, height: 320, fontFamily: "var(--mono)", fontSize: 12, resize: "vertical" }} />
    </div>
  );
}

// ── Declare ───────────────────────────────────────────────────────────
function Declare({ onDeclare, onExample, archive, now }) {
  const [report, setReport] = useState(null);
  const [f, setF] = useState({ title: "", location: "", lead: "", reportedBy: "" });
  const set = k => e => setF({ ...f, [k]: e.target.value });
  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Declare an incident</h2>
        <p style={{ color: "var(--muted-strong)", fontSize: 14 }}>Starts the clock. Set a provisional {T.level} within 15 minutes; when in doubt, classify higher.</p>
        {[["title", "What has happened?"], ["location", "Exactly where?"], ["lead", `${T.lead} (your name)`], ["reportedBy", "Reported by / how"]].map(([k, l]) => (
          <label key={k} style={{ display: "block", marginBottom: 10, fontSize: 13, fontWeight: 600 }}>{l}
            <input id={`declare-${k}`} style={{ ...input, marginTop: 4 }} value={f[k]} onChange={set(k)} />
          </label>
        ))}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={btn(true)} onClick={() => onDeclare(f)}>Declare incident and start clock</button>
          <button style={btn(false)} onClick={onExample}>Load a training example</button>
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 0 }}>{PACK.example.blurb}</p>
      </div>
      {report && <ReportPanel inc={report} now={now} onClose={() => setReport(null)} />}
      {archive.length > 0 && (
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Closed incidents (this browser)</h3>
          {archive.slice().reverse().map(inc => (
            <div key={inc.id + inc.closedAt} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: "1px solid var(--line-soft)", gap: 8 }}>
              <span style={{ fontSize: 13 }}>{inc.id} · {inc.title || "(untitled)"} · {inc.pLevel ? E.levelLabel(inc.pLevel) : `no ${T.level}`}</span>
              <button style={btn(false)} onClick={() => setReport(E.normalize(inc))}>Report</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────
export default function IncidentCommander() {
  const [inc, setInc] = useState(() => E.normalize(load(KEY)));
  const [archive, setArchive] = useState(() => load(ARCHIVE) || []);
  const [tab, setTab] = useState("triage");
  const [now, setNow] = useState(() => stamp());
  const [showReport, setShowReport] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => { const t = setInterval(() => setNow(stamp()), 15000); return () => clearInterval(t); }, []);
  useEffect(() => { save(KEY, inc); }, [inc]);
  useEffect(() => { save(ARCHIVE, archive); }, [archive]);

  if (!inc) return <Declare archive={archive} now={now} onExample={() => { setInc(E.exampleIncident(new Date())); setTab("checklist"); }} onDeclare={f => { setInc(E.newIncident(new Date(), f)); setTab("triage"); }} />;

  const log = (type, text) => setInc(i => addLog(i, stamp(), type, text, i.lead));
  const patch = (fields, type, text) => setInc(i => {
    const next = { ...i, ...(typeof fields === "function" ? fields(i) : fields) };
    return text ? addLog(next, stamp(), type, text, i.lead) : next;
  });

  const elapsed = elapsedMinutes(inc.declaredAt, now);
  const bands = E.checklistProgress(inc, now);
  const overdue = bands.filter(b => b.state === "overdue").length
    + inc.cardIds.reduce((n, id) => n + E.stageProgress(inc, id, now).filter(s => s.state === "overdue").length, 0);
  const pStyle = inc.pLevel ? levelTone(inc.pLevel) : NO_LEVEL;
  const updateDue = inc.nextUpdateAt ? Math.round((new Date(inc.nextUpdateAt) - new Date(now)) / 60000) : null;
  const alerts = E.alertsFor(inc.answers);
  const alertRow = PACK.alert?.commsRow;
  const alertOpen = alerts.length > 0 && PACK.alert && !(alertRow && inc.comms[alertRow]);
  const alertWhy = alerts.map(a => a.short || a.text).join("; ");

  const close = () => {
    const closed = addLog({ ...inc, closedAt: stamp() }, stamp(), "system", "Incident closed", inc.lead);
    setArchive(a => [...a, closed]);
    setClosing(false); setShowReport(false);
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
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{inc.id} · declared {hhmm(inc.declaredAt)} · lead {inc.lead || "—"}</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{inc.title || "(untitled incident)"}{inc.location ? ` — ${inc.location}` : ""}</div>
        </div>
        <Pill s={pStyle}>{inc.pLevel ? `${E.levelLabel(inc.pLevel)} · ${inc.pLevelConfirmedAt ? T.confirmedWord : "PROVISIONAL"}` : `${T.level.toUpperCase()} NOT SET`}</Pill>
        <div style={{ textAlign: "center" }}>
          <div className="clock" style={{ fontSize: 26, fontWeight: 700 }}>{formatElapsed(elapsed)}</div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>ELAPSED</div>
        </div>
        {updateDue !== null && <Pill s={updateDue < 0 ? STATE_STYLE.overdue : STATE_STYLE.current}>Update {updateDue < 0 ? `overdue ${-updateDue}m` : `in ${updateDue}m`}</Pill>}
        {overdue > 0 && <Pill s={STATE_STYLE.overdue}>{overdue} overdue</Pill>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={btn(false)} onClick={() => setShowReport(v => !v)}>{showReport ? "Hide report" : "Export report"}</button>
          <button style={btn(true)} onClick={() => setClosing(true)}>Close incident</button>
        </div>
      </div>
      {alertOpen && (
        <div style={{ ...card, background: "var(--late-bg)", borderColor: "var(--late-bd)", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ flex: "1 1 260px", minWidth: 0, color: "var(--late-fg)", fontWeight: 700 }}>{PACK.alert.text} <span style={{ fontWeight: 500 }}>({alertWhy})</span></span>
          {alertRow && <button style={btn(true)} onClick={() => patch(i => ({ comms: { ...i.comms, [alertRow]: stamp() } }), "comms", `${PACK.alert.doneLog} (${alertWhy})`)}>{PACK.alert.button}</button>}
        </div>
      )}
      {closing && (
        <div style={{ ...card, background: "var(--late-bg)", borderColor: "var(--late-bd)", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ flex: "1 1 260px", minWidth: 0, color: "var(--late-fg)", fontWeight: 600 }}>Close this incident? It moves to Closed incidents, where its report stays available in this browser. Copy the report first if it needs to go anywhere else.{PACK.closeNote ? ` ${PACK.closeNote}` : ""}</span>
          <button style={btn(false)} onClick={() => { setShowReport(true); setClosing(false); }}>Show report first</button>
          <button style={btn(false)} onClick={() => setClosing(false)}>Cancel</button>
          <button style={btn(true)} onClick={close}>Close incident</button>
        </div>
      )}
      {showReport && <ReportPanel inc={inc} now={now} onClose={() => setShowReport(false)} />}
      {!inc.pLevel && elapsed >= 15 && <div style={{ ...card, background: "var(--late-bg)", color: "var(--late-fg)", borderColor: "var(--late-bd)", fontWeight: 600 }}>The provisional {T.level} is overdue (due within 15 minutes). Set it in Triage now.</div>}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {TABS.map(([id, l]) => <button key={id} onClick={() => setTab(id)} style={{ ...btn(tab === id), borderRadius: 999 }}>{l}</button>)}
      </div>

      {tab === "triage" && <Triage inc={inc} patch={patch} log={log} />}
      {tab === "checklist" && <Checklist inc={inc} bands={bands} patch={patch} />}
      {tab === "cards" && <Cards inc={inc} now={now} patch={patch} log={log} />}
      {tab === "comms" && <Comms inc={inc} now={now} patch={patch} />}
      {tab === "log" && <Log inc={inc} log={log} />}
      {tab === "contacts" && <Contacts />}
      <p style={{ fontSize: 11, color: "var(--faint)" }}>Source: {PACK.source}.{PACK.classification ? ` ${PACK.classification}.` : ""} State is saved in this browser only and is not shared with anyone else who opens this page. Export the report for the record.</p>
    </div>
  );
}

// ── 1. Triage ─────────────────────────────────────────────────────────
function Triage({ inc, patch, log }) {
  const rec = E.recommendLevel(inc.answers);
  const recL = E.level(rec);
  const suggested = E.suggestCards(inc.triggers);
  const [confirmer, setConfirmer] = useState(inc.confirmedBy || "");
  const toggleAnswer = q => patch(i => ({ answers: { ...i.answers, [q.id]: !i.answers[q.id] } }), "triage", `${inc.answers[q.id] ? "Unset" : "Yes"}: ${q.text}`);
  const toggleTrigger = t => patch(i => ({ triggers: i.triggers.includes(t.id) ? i.triggers.filter(x => x !== t.id) : [...i.triggers, t.id] }));
  const setLevel = lvl => {
    const why = E.reasonsFor(inc.answers);
    patch({ pLevel: lvl, pLevelConfirmedAt: null }, "decision", `Provisional ${T.level} set to ${E.levelLabel(lvl)}${why.length ? ` (${why.join("; ")})` : ""}`);
  };
  const toggleCard = id => {
    const open = inc.cardIds.includes(id); const c = E.cardById(id);
    patch(i => ({ cardIds: open ? i.cardIds.filter(x => x !== id) : [...i.cardIds, id] }), "decision", `${open ? "Closed" : "Opened"} Card ${c.number}: ${c.name}`);
  };
  const above = inc.pLevel ? E.cardsAboveLevel(inc.cardIds, inc.pLevel) : [];
  const confirmedTitle = T.confirmedWord[0] + T.confirmedWord.slice(1).toLowerCase();

  return (
    <>
      <div style={card}>
        <h3 style={{ marginTop: 0 }}>What does it look like? (Section 1)</h3>
        {PACK.triage.map(q => (
          <label key={q.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 0", cursor: "pointer", fontSize: 14 }}>
            <input id={`q-${q.id}`} type="checkbox" checked={!!inc.answers[q.id]} onChange={() => toggleAnswer(q)} style={{ width: 18, height: 18, marginTop: 1 }} />
            <span style={{ flex: 1, minWidth: 0 }}>{q.text}</span>
            <span style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {q.alert && <Pill s={tone("late")}>{PACK.alert?.tag || "ALERT"}</Pill>}
              {q.level && <Pill s={levelTone(q.level)}>{E.level(q.level).short}</Pill>}
            </span>
          </label>
        ))}
        <div style={{ marginTop: 12, padding: 12, background: levelTone(rec).bg, color: "var(--fg)", borderRadius: 8 }}>
          <strong>Recommended: {E.levelLabel(rec)}.</strong> {recL.activated}{recL.notify ? `. Notify: ${recL.notify}` : ""} ({recL.howFast.toLowerCase()}).
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {E.order.map(l => <button key={l} style={btn(l === rec)} onClick={() => setLevel(l)}>Set {E.level(l).short}{l === inc.pLevel ? " ✓" : ""}</button>)}
          </div>
        </div>
        {inc.pLevel && (
          <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
            <input id="confirmer" style={{ ...input, maxWidth: 260 }} placeholder={`${T.confirmer} name`} value={confirmer} onChange={e => setConfirmer(e.target.value)} />
            <button style={btn(!inc.pLevelConfirmedAt)} onClick={() => patch({ pLevelConfirmedAt: stamp(), confirmedBy: confirmer }, "decision", `${E.levelLabel(inc.pLevel)} ${T.confirmedWord.toLowerCase()} with ${T.confirmer}${confirmer ? ` ${confirmer}` : ""}`)}>
              {inc.pLevelConfirmedAt ? `${confirmedTitle} ${hhmm(inc.pLevelConfirmedAt)}: record again` : `${T.confirmer} ${T.confirmVerb} ${E.level(inc.pLevel).short}`}
            </button>
          </div>
        )}
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Which scenario? (Part C triggers)</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {PACK.triggers.map(t => (
            <button key={t.id} onClick={() => toggleTrigger(t)} style={{ ...btn(inc.triggers.includes(t.id)), fontWeight: 500, borderRadius: 999, padding: "6px 12px" }}>{t.label}</button>
          ))}
        </div>
        {suggested.length === 0 && <p style={{ fontSize: 13, color: "var(--muted)" }}>No card matches yet. If none applies, the first-hour checklist covers it.</p>}
        {suggested.map(id => {
          const c = E.cardById(id); const open = inc.cardIds.includes(id);
          return (
            <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 10, padding: 10, border: "1px solid var(--line)", borderRadius: 8, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 240px", minWidth: 0 }}><strong>Card {c.number}: {c.name}</strong><div style={{ fontSize: 12, color: "var(--muted)" }}>Lead: {c.lead} · Typical: {c.typicalNote}</div></div>
              <button style={btn(!open)} onClick={() => toggleCard(id)}>{open ? "Opened ✓" : "Open card"}</button>
            </div>
          );
        })}
        {above.map(c => <p key={c.id} style={{ color: "var(--p2-fg)", fontSize: 13, fontWeight: 600 }}>Card {c.number} is typically {E.level(c.typical).short}, higher than the {E.level(inc.pLevel).short} set. Check the {T.level}.</p>)}
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Re-assess now if any of these appear</h3>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PACK.reassess.map(r => <button key={r.id} style={btn(false)} onClick={() => log("reassess", `Re-assessment triggered: ${r.label}`)}>{r.label}</button>)}
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 0 }}>{PACK.reassessNote}</p>
      </div>
    </>
  );
}

// ── 2. First-hour checklist ───────────────────────────────────────────
function Checklist({ inc, bands, patch }) {
  const toggle = item => {
    const done = !!inc.checklist[item.id];
    patch(i => {
      const checklist = { ...i.checklist };
      if (done) delete checklist[item.id]; else checklist[item.id] = { at: stamp() };
      return { checklist };
    }, "checklist", `${done ? "Unticked" : "Done"}: ${item.text}`);
  };
  return bands.map(band => (
    <div key={band.id} style={{ ...card, borderLeft: `6px solid ${STATE_STYLE[band.state].text}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0 }}>{band.fromMin} to {band.toMin} min: {band.label}</h3>
        <Pill s={STATE_STYLE[band.state]}>{STATE_STYLE[band.state].label} · {band.done}/{band.total}</Pill>
      </div>
      {band.items.map(item => {
        const auto = E.autoDone(item, inc); const done = E.isChecklistDone(item, inc);
        return (
          <label key={item.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderTop: "1px solid var(--line-soft)", cursor: auto ? "default" : "pointer", fontSize: 14 }}>
            <input id={`chk-${item.id}`} type="checkbox" checked={done} disabled={auto} onChange={() => toggle(item)} style={{ width: 18, height: 18, marginTop: 1 }} />
            <span style={{ flex: 1, minWidth: 0, textDecoration: done ? "line-through" : "none", color: done ? "var(--muted)" : "var(--fg)" }}>{item.text}</span>
            <span style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>{inc.checklist[item.id] ? hhmm(inc.checklist[item.id].at) : auto ? "auto" : ""}</span>
          </label>
        );
      })}
    </div>
  ));
}

// ── 3. Scenario cards ─────────────────────────────────────────────────
function Cards({ inc, now, patch, log }) {
  if (!inc.cardIds.length) return <div style={card}>No scenario card open. Open one from Triage, or run the first-hour checklist only.</div>;
  const setAction = (key, fields, text) => patch(i => ({ actions: { ...i.actions, [key]: { ...(i.actions[key] || {}), ...fields } } }), text ? "action" : null, text);
  return inc.cardIds.map(id => {
    const c = E.cardById(id); const stages = E.stageProgress(inc, id, now);
    return (
      <div key={id} style={card}>
        <h3 style={{ margin: "0 0 4px" }}>Card {c.number}: {c.name}</h3>
        <div style={{ fontSize: 13, color: "var(--muted-strong)", marginBottom: 10 }}>Lead: {c.lead} · Typical {T.level}: {c.typicalNote} · Triggers: {c.triggers}</div>
        {stages.map(st => (
          <div key={st.id} style={{ border: "1px solid var(--line)", borderLeft: `5px solid ${STATE_STYLE[st.state].text}`, borderRadius: 8, padding: 10, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
              <strong>{st.label} ({st.fromH} to {st.toH} h)</strong>
              <Pill s={STATE_STYLE[st.state]}>{STATE_STYLE[st.state].label} · {st.done}/{st.total}</Pill>
            </div>
            {c.stages[st.id].actions.map((a, i) => {
              const key = actionKey(id, st.id, i); const s = inc.actions[key] || {};
              return (
                <div key={key} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0", borderTop: "1px solid var(--line-soft)", flexWrap: "wrap" }}>
                  <input id={`act-${key}`} type="checkbox" checked={!!s.doneAt} style={{ width: 18, height: 18 }}
                    onChange={() => setAction(key, { doneAt: s.doneAt ? null : stamp() }, `${s.doneAt ? "Reopened" : "Done"} (Card ${c.number}, ${st.label}): ${a}`)} />
                  <span style={{ flex: "1 1 260px", minWidth: 0, fontSize: 14, textDecoration: s.doneAt ? "line-through" : "none", color: s.doneAt ? "var(--muted)" : "var(--fg)" }}>{a}</span>
                  <select id={`own-${key}`} aria-label="Owner" value={s.owner || ""} style={{ ...input, width: 190, padding: "5px 8px", fontSize: 13 }}
                    onChange={e => setAction(key, { owner: e.target.value }, `Owner for "${a}" set to ${e.target.value || "none"}`)}>
                    <option value="">Assign owner…</option>
                    {c.stages[st.id].owners.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <span style={{ fontSize: 12, color: "var(--muted)", width: 64, whiteSpace: "nowrap" }}>{hhmm(s.doneAt)}</span>
                </div>
              );
            })}
          </div>
        ))}
        <div style={{ fontSize: 13 }}><strong>Key contacts:</strong> {c.contacts}</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, flex: "1 1 260px", minWidth: 0 }}><strong>BCP:</strong> {c.bcp}</span>
          <button style={btn(false)} onClick={() => log("decision", `BCP invocation recommended to ${T.bcpTo} (Card ${c.number}): ${c.bcp}`)}>Recommend BCP to {T.bcpTo}</button>
        </div>
      </div>
    );
  });
}

// ── 4. Communications ─────────────────────────────────────────────────
function Message({ msg, inc, patch }) {
  const [v, setV] = useState(() => E.messageDefaults(msg, inc));
  const text = fillTemplate(msg.template, msg.fields, v);
  const sent = E.sentAt(inc, msg.id);
  const id = `msg-${msg.id}`;
  const markSent = () => patch(i => {
    const t = stamp();
    const rows = [].concat(msg.commsRow || []);
    return { sent: { ...i.sent, [msg.id]: t }, comms: { ...i.comms, ...Object.fromEntries(rows.filter(r => !i.comms[r]).map(r => [r, t])) } };
  }, "comms", `${msg.title} sent: "${text}"`);
  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <h3 style={{ margin: 0 }}>{msg.title}</h3>
        {sent && <Pill s={STATE_STYLE.done}>Sent {hhmm(sent)}</Pill>}
      </div>
      {msg.note && <p style={{ fontSize: 13, color: "var(--muted)", margin: "6px 0 10px" }}>{msg.note}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
        {msg.fields.map(f => (
          <label key={f.key} style={{ display: "grid", gap: 3, fontSize: 11, fontWeight: 600, color: "var(--muted)", minWidth: 0 }}>
            {f.label[0].toUpperCase() + f.label.slice(1)}
            {f.options
              ? <select id={`${id}-${f.key}`} style={input} value={v[f.key]} onChange={e => setV({ ...v, [f.key]: e.target.value })}>{f.options.map(x => <option key={x}>{x}</option>)}</select>
              : <input id={`${id}-${f.key}`} style={input} value={v[f.key]} onChange={e => setV({ ...v, [f.key]: e.target.value })} />}
          </label>
        ))}
      </div>
      <textarea id={id} readOnly value={text} rows={Math.max(2, Math.ceil(text.length / 90))} style={{ ...input, background: "var(--sunken)", border: "1px dashed var(--faint)", margin: "10px 0", fontSize: 15, resize: "vertical" }} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <CopyButton text={text} targetId={id} />
        <button style={btn(!sent)} onClick={markSent}>{sent ? "Mark update sent" : "Mark sent"}</button>
      </div>
    </div>
  );
}

function Comms({ inc, now, patch }) {
  const plan = E.commsPlan(inc.pLevel, inc.declaredAt, { alert: E.alertsFor(inc.answers).length > 0 });
  const markComms = row => patch(i => ({ comms: { ...i.comms, [row.id]: i.comms[row.id] ? null : stamp() } }), "comms", `${inc.comms[row.id] ? "Reopened" : "Sent"}: ${row.audience} via ${row.channel}`);
  const setNext = mins => patch({ nextUpdateAt: new Date(Date.now() + mins * 60000).toISOString() }, "decision", `Next ${T.updateTo} update set for ${mins} minutes from now`);
  return (
    <>
      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Who to tell (Section 4){inc.pLevel ? ` at ${E.level(inc.pLevel).short}` : `: set a ${T.level} first`}</h3>
        <p style={{ fontSize: 13, color: "var(--late-fg)", fontWeight: 600 }}>{PACK.commsRule}</p>
        {plan.filter(r => r.applies).map(r => {
          const sent = inc.comms[r.id]; const late = r.dueAt && !sent && new Date(now) > new Date(r.dueAt);
          return (
            <div key={r.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderTop: "1px solid var(--line-soft)", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 280px", minWidth: 0, fontSize: 14 }}><strong>{r.audience}</strong> — {r.channel}<div style={{ fontSize: 12, color: "var(--muted)" }}>Owner: {r.owner} · {r.when}{r.approval ? ` · ${r.approval}` : ""}</div></div>
              {r.dueAt && <Pill s={late ? STATE_STYLE.overdue : STATE_STYLE.upcoming}>{late ? "OVERDUE" : "Due"} {hhmm(r.dueAt)}</Pill>}
              <button style={btn(!sent)} onClick={() => markComms(r)}>{sent ? `Sent ${hhmm(sent)}` : "Mark sent"}</button>
            </div>
          );
        })}
      </div>
      {PACK.messages.map(m => <Message key={m.id} msg={m} inc={inc} patch={patch} />)}
      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Briefing rhythm</h3>
        <p style={{ fontSize: 14, margin: "0 0 8px" }}>{inc.nextUpdateAt ? `Next ${T.updateTo} update at ${hhmm(inc.nextUpdateAt)}.` : "No update time set yet."}</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{[30, 60, 120].map(m => <button key={m} style={btn(false)} onClick={() => setNext(m)}>In {m} min</button>)}</div>
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
        <select id="log-type" aria-label="Entry type" style={{ ...input, width: 130 }} value={type} onChange={e => setType(e.target.value)}>{["decision", "note", "action", "comms"].map(t => <option key={t}>{t}</option>)}</select>
        <input id="log-text" style={{ ...input, flex: "1 1 240px", width: "auto" }} placeholder="What was decided or done, and by whom" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
        <button style={btn(true)} onClick={add}>Add</button>
      </div>
      {inc.log.slice().reverse().map((e, i) => (
        <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0", borderTop: "1px solid var(--line-soft)", fontSize: 13 }}>
          <span style={{ width: 48, flexShrink: 0, color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{hhmm(e.at)}</span>
          <span style={{ width: 70, flexShrink: 0, fontWeight: 700, textTransform: "uppercase", fontSize: 11, color: "var(--muted-strong)" }}>{e.type}</span>
          <span style={{ flex: 1, minWidth: 0 }}>{e.text}</span>
        </div>
      ))}
    </div>
  );
}

// ── Contacts and roles ────────────────────────────────────────────────
function Contacts() {
  const gaps = new Set(contactGaps(PACK.contacts).map(c => c.role));
  return (
    <>
      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Key contacts (Section 5)</h3>
        {gaps.size > 0 && <p style={{ color: "var(--late-fg)", fontSize: 13, fontWeight: 600 }}>{gaps.size} contacts are gaps: each needs a name, 24/7 phone, deputy and verified date in the pack file.</p>}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr>{["Role", "Name", "24/7 phone", "Deputy", "Verified"].map(h => <th key={h} style={{ textAlign: "left", padding: 6, borderBottom: "2px solid var(--line)" }}>{h}</th>)}</tr></thead>
            <tbody>{PACK.contacts.map(c => (
              <tr key={c.role} style={{ background: gaps.has(c.role) ? "var(--late-tint)" : "transparent" }}>
                <td style={{ padding: 6 }}>{c.role}</td><td style={{ padding: 6 }}>{c.name || "—"}</td>
                <td style={{ padding: 6 }}>{c.phone ? <span style={{ fontFamily: "var(--mono)", userSelect: "all" }}>{c.phone}</span> : "—"}</td>
                <td style={{ padding: 6 }}>{c.deputy || "—"}</td><td style={{ padding: 6 }}>{c.verified || "—"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Roles (Section 2)</h3>
        {PACK.roles.map(r => <p key={r.role} style={{ fontSize: 13 }}><strong>{r.role}:</strong> {r.who}.{r.does ? ` ${r.does}.` : ""} Hands over to {r.handsOver}.</p>)}
      </div>
    </>
  );
}
