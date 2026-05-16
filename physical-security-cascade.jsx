import { useState } from "react";

// ── Colour schemes ────────────────────────────────────────────────────
const LAYERS = ["Physical", "Technology", "Process", "Human", "Leadership"];
const LAYER_SCHEME = {
  Physical:   { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  Technology: { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD" },
  Process:    { bg: "#F3E8FF", text: "#6B21A8", border: "#D8B4FE" },
  Human:      { bg: "#DCFCE7", text: "#166534", border: "#86EFAC" },
  Leadership: { bg: "#FFE4E6", text: "#9F1239", border: "#FDA4AF" },
};
const PRIORITY = {
  Critical: { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
  High:     { bg: "#FFEDD5", text: "#9A3412", border: "#FDBA74" },
  Medium:   { bg: "#FEF9C3", text: "#854D0E", border: "#FDE047" },
  Low:      { bg: "#DCFCE7", text: "#166534", border: "#86EFAC" },
};
const STATUS = {
  planned:  { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1", label: "PLANNED" },
  active:   { bg: "#DBEAFE", text: "#1D4ED8", border: "#93C5FD", label: "● ACTIVE" },
  complete: { bg: "#DCFCE7", text: "#15803D", border: "#86EFAC", label: "✓ DONE" },
  onhold:   { bg: "#FEF9C3", text: "#854D0E", border: "#FDE047", label: "⏸ ON HOLD" },
};
const statusNext = { planned: "active", active: "complete", complete: "onhold", onhold: "planned" };
const PRIORITIES = ["Critical","High","Medium","Low"];
const EFFORTS    = ["High","Medium","Low"];

// ── Data model ────────────────────────────────────────────────────────
// Pillars → threats → controls → activities → sub-activities
// Each level stores only its own data; children are nested arrays.
const INIT_PILLARS = [
  {
    id:"p1", name:"Secure Access", icon:"🔑", color:"#1A6EC9", lightBg:"#F0F6FF",
    tag:"FRICTIONLESS · CONVERGED · CONTROLLED",
    objectives:["Frictionless employee access across all sites","Strong control for critical and sensitive areas","Converged identity — physical and digital in one ecosystem"],
    threats:[
      {
        id:"t1", text:"Tailgating / piggybacking into secure areas", status:"planned",
        controls:[
          {
            id:"c1", text:"Frictionless credentials + anti-tailgate sensors + staff challenge culture", status:"planned",
            activities:[
              { id:"a1", text:"Deploy BLE/NFC mobile credential rollout across all standard access doors", priority:"High", effort:"Medium", layer:"Technology", status:"planned",
                subActivities:[
                  { id:"s1", text:"Audit existing reader hardware for BLE compatibility", priority:"High", effort:"Low", layer:"Technology", status:"planned" },
                  { id:"s2", text:"Procure and configure mobile credential management platform", priority:"High", effort:"Medium", layer:"Technology", status:"planned" },
                  { id:"s3", text:"Pilot on 2 sites, gather user feedback, iterate", priority:"Medium", effort:"Low", layer:"Process", status:"planned" },
                ]},
              { id:"a2", text:"Install anti-tailgate sensors at all critical and elevated zone entries", priority:"Critical", effort:"High", layer:"Physical", status:"planned",
                subActivities:[
                  { id:"s4", text:"Survey entry points and specify sensor type per door configuration", priority:"Critical", effort:"Low", layer:"Physical", status:"planned" },
                  { id:"s5", text:"Procure and install sensors with integration to access control system", priority:"Critical", effort:"High", layer:"Physical", status:"planned" },
                ]},
              { id:"a3", text:"Deliver staff challenge culture training — how to safely question unknown persons", priority:"High", effort:"Low", layer:"Human", status:"planned",
                subActivities:[
                  { id:"s6", text:"Develop e-learning module and scenario scripts", priority:"High", effort:"Medium", layer:"Process", status:"planned" },
                  { id:"s7", text:"Roll out to all staff — track completion in LMS", priority:"High", effort:"Low", layer:"Human", status:"planned" },
                ]},
            ],
          },
        ],
      },
      {
        id:"t2", text:"Credential cloning or badge theft", status:"planned",
        controls:[
          {
            id:"c2", text:"Multi-factor physical auth (badge + PIN or biometric) + immediate automated revocation on HR trigger", status:"planned",
            activities:[
              { id:"a4", text:"Implement MFA on all critical and elevated zone readers", priority:"Critical", effort:"High", layer:"Physical", status:"planned",
                subActivities:[
                  { id:"s8", text:"Define zone tier map and MFA requirement per tier", priority:"Critical", effort:"Low", layer:"Process", status:"planned" },
                  { id:"s9", text:"Upgrade readers to support PIN/biometric", priority:"Critical", effort:"High", layer:"Physical", status:"planned" },
                  { id:"s10", text:"Test and validate MFA workflow with representative users", priority:"High", effort:"Low", layer:"Process", status:"planned" },
                ]},
              { id:"a5", text:"Automate access revocation on HR system leaver/mover trigger — same-day SLA", priority:"Critical", effort:"Medium", layer:"Process", status:"planned",
                subActivities:[
                  { id:"s11", text:"Map HR system events to access control API", priority:"Critical", effort:"High", layer:"Technology", status:"planned" },
                  { id:"s12", text:"Build and test automated revocation workflow", priority:"Critical", effort:"Medium", layer:"Technology", status:"planned" },
                  { id:"s13", text:"Define SLA, monitoring dashboard, and exception escalation", priority:"High", effort:"Low", layer:"Process", status:"planned" },
                ]},
            ],
          },
        ],
      },
      {
        id:"t3", text:"Orphaned access — leavers retaining entry rights", status:"planned",
        controls:[
          {
            id:"c3", text:"Real-time HR-to-access sync + quarterly entitlement review + least-privilege policy", status:"planned",
            activities:[
              { id:"a6", text:"Deploy converged identity platform integrating HR, IAM, and physical access", priority:"Critical", effort:"High", layer:"Technology", status:"planned",
                subActivities:[
                  { id:"s14", text:"Evaluate and select converged identity platform", priority:"Critical", effort:"Medium", layer:"Leadership", status:"planned" },
                  { id:"s15", text:"Integrate HR system, physical ACS, and digital IAM", priority:"Critical", effort:"High", layer:"Technology", status:"planned" },
                  { id:"s16", text:"UAT and go-live with parallel run", priority:"High", effort:"Medium", layer:"Process", status:"planned" },
                ]},
              { id:"a7", text:"Establish quarterly access entitlement review with area owner sign-off", priority:"High", effort:"Low", layer:"Process", status:"planned",
                subActivities:[
                  { id:"s17", text:"Define review process, templates, and area owner responsibilities", priority:"High", effort:"Low", layer:"Process", status:"planned" },
                  { id:"s18", text:"Schedule and run Q1 review cycle as pilot", priority:"High", effort:"Low", layer:"Process", status:"planned" },
                ]},
            ],
          },
        ],
      },
    ],
  },
  {
    id:"p2", name:"Proactive Threat Management", icon:"🎯", color:"#B01A1A", lightBg:"#FFF2F2",
    tag:"DETECT EARLY · DETER · AWARE",
    objectives:["Early detection of suspicious activity across all sites","Active deterrence — visible and covert — across the estate","Insider and external threat awareness programme"],
    threats:[
      {
        id:"t4", text:"Undetected hostile reconnaissance of sites", status:"planned",
        controls:[
          {
            id:"c4", text:"AI video analytics + red team testing + staff awareness of surveillance indicators", status:"planned",
            activities:[
              { id:"a8", text:"Deploy AI-powered video analytics for behavioural anomaly detection", priority:"Critical", effort:"High", layer:"Technology", status:"planned",
                subActivities:[
                  { id:"s19", text:"Define detection use cases — loitering, perimeter breach, crowd surge", priority:"Critical", effort:"Low", layer:"Process", status:"planned" },
                  { id:"s20", text:"Procure and integrate AI analytics platform with existing CCTV estate", priority:"Critical", effort:"High", layer:"Technology", status:"planned" },
                  { id:"s21", text:"Tune alert thresholds to reduce false positives — 30-day calibration", priority:"High", effort:"Medium", layer:"Technology", status:"planned" },
                ]},
              { id:"a9", text:"Run bi-annual hostile reconnaissance red team exercises", priority:"High", effort:"High", layer:"Process", status:"planned",
                subActivities:[
                  { id:"s22", text:"Commission external red team provider and agree scope/rules of engagement", priority:"High", effort:"Medium", layer:"Leadership", status:"planned" },
                  { id:"s23", text:"Execute exercise and debrief with findings report", priority:"High", effort:"Medium", layer:"Process", status:"planned" },
                  { id:"s24", text:"Track and close identified gaps within 90 days", priority:"High", effort:"Low", layer:"Process", status:"planned" },
                ]},
            ],
          },
        ],
      },
      {
        id:"t5", text:"Insider threat — data theft, sabotage, facilitation", status:"planned",
        controls:[
          {
            id:"c5", text:"Insider threat programme + behavioural analytics + anonymous reporting channel", status:"planned",
            activities:[
              { id:"a10", text:"Establish a formal insider threat programme with policy and governance", priority:"Critical", effort:"Medium", layer:"Process", status:"planned",
                subActivities:[
                  { id:"s25", text:"Draft insider threat policy and get legal/HR sign-off", priority:"Critical", effort:"Medium", layer:"Leadership", status:"planned" },
                  { id:"s26", text:"Define indicators of compromise and escalation path", priority:"Critical", effort:"Low", layer:"Process", status:"planned" },
                  { id:"s27", text:"Train security and HR teams on programme operation", priority:"High", effort:"Low", layer:"Human", status:"planned" },
                ]},
              { id:"a11", text:"Deploy anonymous near-miss and concern reporting channel", priority:"High", effort:"Low", layer:"Technology", status:"planned",
                subActivities:[
                  { id:"s28", text:"Select and configure anonymous reporting platform", priority:"High", effort:"Low", layer:"Technology", status:"planned" },
                  { id:"s29", text:"Communicate channel to all staff with no-blame messaging", priority:"High", effort:"Low", layer:"Human", status:"planned" },
                ]},
            ],
          },
        ],
      },
      {
        id:"t6", text:"Social engineering / pretext access", status:"planned",
        controls:[
          {
            id:"c6", text:"Staff challenge culture + visitor controls + awareness training", status:"planned",
            activities:[
              { id:"a12", text:"Deliver annual social engineering awareness programme to all staff", priority:"High", effort:"Low", layer:"Human", status:"planned",
                subActivities:[
                  { id:"s30", text:"Develop scenario-based training covering phone, email and physical pretexting", priority:"High", effort:"Medium", layer:"Process", status:"planned" },
                  { id:"s31", text:"Run simulated social engineering tests and report results to leadership", priority:"High", effort:"Medium", layer:"Process", status:"planned" },
                ]},
              { id:"a13", text:"Upgrade visitor management — pre-registration, ID verification, escort tracking", priority:"Medium", effort:"Low", layer:"Technology", status:"planned",
                subActivities:[
                  { id:"s32", text:"Select and deploy digital visitor management system", priority:"Medium", effort:"Medium", layer:"Technology", status:"planned" },
                  { id:"s33", text:"Train reception and security staff on system and escorting policy", priority:"Medium", effort:"Low", layer:"Human", status:"planned" },
                ]},
            ],
          },
        ],
      },
    ],
  },
  {
    id:"p3", name:"Rapid Response & Resilience", icon:"⚡", color:"#0A7A4E", lightBg:"#F0FBF6",
    tag:"COORDINATE · ALERT · RECOVER",
    objectives:["Coordinated incident response across security, IT, and business","Real-time alerts and communications to the right people instantly","Business recovery — minimum disruption from physical incidents"],
    threats:[
      {
        id:"t7", text:"Slow / uncoordinated response to physical incident", status:"planned",
        controls:[
          {
            id:"c7", text:"Tested incident response plan + runbooks + clear command structure", status:"planned",
            activities:[
              { id:"a14", text:"Develop Physical Security Incident Response Plan (PSIRP)", priority:"Critical", effort:"High", layer:"Process", status:"planned",
                subActivities:[
                  { id:"s34", text:"Define incident categories, severity levels and response tiers", priority:"Critical", effort:"Low", layer:"Process", status:"planned" },
                  { id:"s35", text:"Write response runbooks for each critical scenario", priority:"Critical", effort:"High", layer:"Process", status:"planned" },
                  { id:"s36", text:"Get PSIRP signed off by CISO, security director and COO", priority:"Critical", effort:"Low", layer:"Leadership", status:"planned" },
                ]},
              { id:"a15", text:"Run quarterly tabletop exercises against key scenarios", priority:"High", effort:"Medium", layer:"Process", status:"planned",
                subActivities:[
                  { id:"s37", text:"Schedule exercise calendar and assign exercise owner", priority:"High", effort:"Low", layer:"Leadership", status:"planned" },
                  { id:"s38", text:"Facilitate exercises and capture lessons learned", priority:"High", effort:"Medium", layer:"Process", status:"planned" },
                  { id:"s39", text:"Update PSIRP within 30 days of each exercise", priority:"High", effort:"Low", layer:"Process", status:"planned" },
                ]},
            ],
          },
        ],
      },
      {
        id:"t8", text:"Staff unaware or unreachable during active incident", status:"planned",
        controls:[
          {
            id:"c8", text:"Mass notification platform + pre-defined escalation tree + tested comms drill", status:"planned",
            activities:[
              { id:"a16", text:"Implement mass notification system for real-time incident alerts", priority:"Critical", effort:"Medium", layer:"Technology", status:"planned",
                subActivities:[
                  { id:"s40", text:"Evaluate and procure mass notification platform", priority:"Critical", effort:"Medium", layer:"Leadership", status:"planned" },
                  { id:"s41", text:"Configure alert templates for each incident type", priority:"Critical", effort:"Low", layer:"Process", status:"planned" },
                  { id:"s42", text:"Test system quarterly — verify delivery to 100% of staff", priority:"High", effort:"Low", layer:"Process", status:"planned" },
                ]},
              { id:"a17", text:"Establish and test joint physical-cyber incident command", priority:"High", effort:"Medium", layer:"Process", status:"planned",
                subActivities:[
                  { id:"s43", text:"Define joint command structure with IT security leadership", priority:"High", effort:"Low", layer:"Leadership", status:"planned" },
                  { id:"s44", text:"Run joint physical-cyber tabletop exercise annually", priority:"High", effort:"Medium", layer:"Process", status:"planned" },
                ]},
            ],
          },
        ],
      },
    ],
  },
  {
    id:"p4", name:"Unified Visibility & Control", icon:"🖥️", color:"#6B21C9", lightBg:"#F6F0FF",
    tag:"INTEGRATED · SINGLE PANE · DATA-DRIVEN",
    objectives:["Better and faster surveillance and security decision-making","Single operational view across all systems and sites","Integrated data — video, access, alarms, and IT signals unified"],
    threats:[
      {
        id:"t9", text:"Siloed systems — missed connections between events", status:"planned",
        controls:[
          {
            id:"c9", text:"PSIM / unified platform correlating video, access, alarms, and IT signals in real time", status:"planned",
            activities:[
              { id:"a18", text:"Implement PSIM or unified security operations platform", priority:"Critical", effort:"High", layer:"Technology", status:"planned",
                subActivities:[
                  { id:"s45", text:"Define integration requirements across CCTV, ACS, alarms, and IT SIEM", priority:"Critical", effort:"Medium", layer:"Process", status:"planned" },
                  { id:"s46", text:"Evaluate and select PSIM platform", priority:"Critical", effort:"Medium", layer:"Leadership", status:"planned" },
                  { id:"s47", text:"Implement integrations in phased approach — critical systems first", priority:"Critical", effort:"High", layer:"Technology", status:"planned" },
                  { id:"s48", text:"Train SOC operators on unified platform", priority:"High", effort:"Low", layer:"Human", status:"planned" },
                ]},
              { id:"a19", text:"Define and publish security operations KPI dashboard", priority:"High", effort:"Medium", layer:"Leadership", status:"planned",
                subActivities:[
                  { id:"s49", text:"Agree KPIs with security director — response time, alert volume, camera uptime", priority:"High", effort:"Low", layer:"Leadership", status:"planned" },
                  { id:"s50", text:"Build automated KPI dashboard within PSIM or BI tool", priority:"High", effort:"Medium", layer:"Technology", status:"planned" },
                ]},
            ],
          },
        ],
      },
      {
        id:"t10", text:"CCTV blind spots exploited by intruders", status:"planned",
        controls:[
          {
            id:"c10", text:"Quarterly coverage gap analysis + HD camera upgrade programme + overlapping arcs", status:"planned",
            activities:[
              { id:"a20", text:"Upgrade CCTV estate to HD / low-light capable cameras", priority:"High", effort:"High", layer:"Physical", status:"planned",
                subActivities:[
                  { id:"s51", text:"Audit all cameras — resolution, age, coverage arc, condition", priority:"High", effort:"Medium", layer:"Process", status:"planned" },
                  { id:"s52", text:"Prioritise replacement by site risk tier", priority:"High", effort:"Low", layer:"Leadership", status:"planned" },
                  { id:"s53", text:"Procure and install replacement cameras to specification", priority:"High", effort:"High", layer:"Physical", status:"planned" },
                ]},
              { id:"a21", text:"Enforce 90-day video retention with encrypted off-site backup", priority:"High", effort:"Medium", layer:"Technology", status:"planned",
                subActivities:[
                  { id:"s54", text:"Assess current retention settings across all NVRs", priority:"High", effort:"Low", layer:"Process", status:"planned" },
                  { id:"s55", text:"Configure 90-day retention and off-site encrypted backup", priority:"High", effort:"Medium", layer:"Technology", status:"planned" },
                  { id:"s56", text:"Monthly integrity check — verify recording continuity and backup", priority:"Medium", effort:"Low", layer:"Process", status:"planned" },
                ]},
            ],
          },
        ],
      },
    ],
  },
  {
    id:"p5", name:"Asset & Infrastructure Protection", icon:"🏛️", color:"#92520A", lightBg:"#FFF8F0",
    tag:"PROTECT · SAFEGUARD · SUSTAIN",
    objectives:["Protection of critical facilities and operational systems","Safeguarding high-value physical and information environments","Operational continuity — security that enables business, not just protects it"],
    threats:[
      {
        id:"t11", text:"Physical breach of critical infrastructure or comms room", status:"planned",
        controls:[
          {
            id:"c11", text:"Tiered access + CCTV + environmental alarms + 24/7 SOC monitoring", status:"planned",
            activities:[
              { id:"a22", text:"Classify all facilities by risk tier and apply access/monitoring standards per tier", priority:"Critical", effort:"Medium", layer:"Leadership", status:"planned",
                subActivities:[
                  { id:"s57", text:"Define tier criteria — criticality, occupancy, data sensitivity, operational impact", priority:"Critical", effort:"Low", layer:"Process", status:"planned" },
                  { id:"s58", text:"Classify all sites and rooms against tier criteria", priority:"Critical", effort:"Medium", layer:"Process", status:"planned" },
                  { id:"s59", text:"Assign access control and monitoring standard to each tier", priority:"Critical", effort:"Low", layer:"Leadership", status:"planned" },
                ]},
              { id:"a23", text:"Install environmental monitoring in all Tier 1 critical infrastructure rooms", priority:"High", effort:"Medium", layer:"Technology", status:"planned",
                subActivities:[
                  { id:"s60", text:"Specify sensor types — temperature, humidity, flood, smoke, power", priority:"High", effort:"Low", layer:"Process", status:"planned" },
                  { id:"s61", text:"Procure and install sensors with SOC alert integration", priority:"High", effort:"Medium", layer:"Technology", status:"planned" },
                ]},
            ],
          },
        ],
      },
      {
        id:"t12", text:"Theft or tampering with high-value equipment", status:"planned",
        controls:[
          {
            id:"c12", text:"Asset tagging + cable locks + exit inspection + CCTV at removal points", status:"planned",
            activities:[
              { id:"a24", text:"Implement comprehensive physical asset register with audit cycle", priority:"Critical", effort:"Medium", layer:"Process", status:"planned",
                subActivities:[
                  { id:"s62", text:"Define asset register scope — all IT hardware, servers, portable media", priority:"Critical", effort:"Low", layer:"Process", status:"planned" },
                  { id:"s63", text:"Tag all in-scope assets and import to register", priority:"High", effort:"Medium", layer:"Physical", status:"planned" },
                  { id:"s64", text:"Schedule quarterly physical audit against register", priority:"High", effort:"Low", layer:"Process", status:"planned" },
                ]},
              { id:"a25", text:"Conduct annual physical penetration test of all Tier 1 facilities", priority:"High", effort:"High", layer:"Process", status:"planned",
                subActivities:[
                  { id:"s65", text:"Commission physical pen test provider and agree scope", priority:"High", effort:"Low", layer:"Leadership", status:"planned" },
                  { id:"s66", text:"Execute test and receive findings report", priority:"High", effort:"High", layer:"Process", status:"planned" },
                  { id:"s67", text:"Remediate all Critical and High findings within 90 days", priority:"High", effort:"Medium", layer:"Process", status:"planned" },
                ]},
            ],
          },
        ],
      },
    ],
  },
];

// ── Flatten helpers ───────────────────────────────────────────────────
const countAll = (pillar, key) => {
  let n = 0;
  pillar.threats.forEach(t => t.controls.forEach(c => {
    if (key === "activities") c.activities.forEach(() => n++);
    if (key === "subActivities") c.activities.forEach(a => a.subActivities.forEach(() => n++));
  }));
  return n;
};

// ── Shared UI components ──────────────────────────────────────────────
const Badge = ({ text, scheme }) => (
  <span style={{ background: scheme.bg, color: scheme.text, border: `1px solid ${scheme.border}`, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 4, whiteSpace: "nowrap" }}>{text}</span>
);

const IconBtn = ({ onClick, title, children, danger, color }) => (
  <button onClick={onClick} title={title}
    style={{ background: danger ? "#FFF1F2" : color ? `${color}18` : "#F8FAFC", border: `1px solid ${danger ? "#FECDD3" : color ? `${color}40` : "#E2E8F0"}`, borderRadius: 5, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: danger ? "#DC2626" : color || "#64748B", flexShrink: 0 }}
    onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
    onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
    {children}
  </button>
);

// ── Edit modal ────────────────────────────────────────────────────────
function EditModal({ item, type, pillarColor, onSave, onClose }) {
  const [text,     setText]     = useState(item.text    || "");
  const [priority, setPriority] = useState(item.priority || "High");
  const [effort,   setEffort]   = useState(item.effort   || "Medium");
  const [layer,    setLayer]    = useState(item.layer    || "Physical");
  const inp = { width:"100%", background:"#fff", border:"1.5px solid #CBD5E1", borderRadius:6, padding:"9px 12px", fontSize:13, color:"#1E293B", fontFamily:"inherit", outline:"none" };
  const lbl = { fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.8px", display:"block", marginBottom:5 };
  const isActivity = type === "activity" || type === "subactivity";
  const isThreat   = type === "threat";
  const isControl  = type === "control";

  const typeLabel = { threat:"Threat / Risk", control:"Control / Countermeasure", activity:"Activity", subactivity:"Sub-Activity" }[type];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:"#fff", borderRadius:14, padding:28, width:560, maxWidth:"95vw", boxShadow:"0 8px 40px rgba(0,0,0,0.18)", border:`2px solid ${pillarColor}30` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontSize:15, fontWeight:800, color:"#0F172A" }}>Edit {typeLabel}</div>
          <button onClick={onClose} style={{ background:"#F1F5F9", border:"none", borderRadius:6, width:30, height:30, fontSize:16, cursor:"pointer", color:"#64748B" }}>✕</button>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={lbl}>{typeLabel}</label>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={3} style={{ ...inp, resize:"vertical", lineHeight:1.5 }} />
        </div>
        {isActivity && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:20 }}>
            <div><label style={lbl}>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} style={{ ...inp, cursor:"pointer" }}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select></div>
            <div><label style={lbl}>Effort</label>
              <select value={effort} onChange={e => setEffort(e.target.value)} style={{ ...inp, cursor:"pointer" }}>
                {EFFORTS.map(ef => <option key={ef}>{ef}</option>)}
              </select></div>
            <div><label style={lbl}>Layer</label>
              <select value={layer} onChange={e => setLayer(e.target.value)} style={{ ...inp, cursor:"pointer" }}>
                {LAYERS.map(l => <option key={l}>{l}</option>)}
              </select></div>
          </div>
        )}
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ background:"#F1F5F9", color:"#475569", border:"none", borderRadius:8, padding:"9px 20px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
          <button onClick={() => { if (!text.trim()) return; onSave({ ...item, text, ...(isActivity ? { priority, effort, layer } : {}) }); }}
            style={{ background:pillarColor, color:"#fff", border:"none", borderRadius:8, padding:"9px 24px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Save</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ label, onConfirm, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:"#fff", borderRadius:14, padding:28, width:400, maxWidth:"95vw", boxShadow:"0 8px 40px rgba(0,0,0,0.18)", border:"2px solid #FEE2E2" }}>
        <div style={{ fontSize:15, fontWeight:800, color:"#0F172A", marginBottom:10 }}>Remove this item?</div>
        <div style={{ fontSize:13, color:"#475569", lineHeight:1.6, marginBottom:22 }}>
          "<span style={{ fontWeight:600, color:"#1E293B" }}>{label}</span>"<br/>This cannot be undone.
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ background:"#F1F5F9", color:"#475569", border:"none", borderRadius:8, padding:"9px 20px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
          <button onClick={onConfirm} style={{ background:"#DC2626", color:"#fff", border:"none", borderRadius:8, padding:"9px 24px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Remove</button>
        </div>
      </div>
    </div>
  );
}

// ── Level colours for the cascade ────────────────────────────────────
const LEVEL = {
  threat:      { icon:"▲", label:"Threat / Risk",         bg:"#FFF1F2", border:"#FECDD3", text:"#991B1B", accent:"#DC2626" },
  control:     { icon:"🛡", label:"Control",               bg:"#F0FDF4", border:"#BBF7D0", text:"#15803D", accent:"#16A34A" },
  activity:    { icon:"⚡", label:"Activity",              bg:"#EFF6FF", border:"#BFDBFE", text:"#1D4ED8", accent:"#2563EB" },
  subactivity: { icon:"◎", label:"Sub-Activity",          bg:"#F5F3FF", border:"#DDD6FE", text:"#6D28D9", accent:"#7C3AED" },
};

// ── Main app ──────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(INIT_PILLARS);

  // Breadcrumb selection state
  const [selPillar,  setSelPillar]  = useState(null); // pillar id
  const [selThreat,  setSelThreat]  = useState(null); // threat id
  const [selControl, setSelControl] = useState(null); // control id
  const [selAct,     setSelAct]     = useState(null); // activity id

  // Modals
  const [editItem,   setEditItem]   = useState(null); // { item, type, path }
  const [deleteItem, setDeleteItem] = useState(null); // { id, type, path, label }

  // Add-new state
  const [addingAt, setAddingAt] = useState(null); // { level, path }
  const [newText,  setNewText]  = useState("");
  const [newPri,   setNewPri]   = useState("High");
  const [newEff,   setNewEff]   = useState("Medium");
  const [newLayer, setNewLayer] = useState("Physical");

  const inp = { background:"#fff", border:"1.5px solid #CBD5E1", borderRadius:6, padding:"9px 12px", fontSize:13, color:"#1E293B", fontFamily:"inherit", outline:"none", flex:1 };

  // ── Derived selections ─────────────────────────────────────────────
  const pillar  = data.find(p => p.id === selPillar) || null;
  const threat  = pillar?.threats.find(t => t.id === selThreat) || null;
  const control = threat?.controls.find(c => c.id === selControl) || null;
  const act     = control?.activities.find(a => a.id === selAct) || null;

  // ── Deep immutable updaters ────────────────────────────────────────
  const updatePillar = (pid, fn) =>
    setData(prev => prev.map(p => p.id === pid ? fn(p) : p));

  const cycleStatus = (type, id) => {
    updatePillar(selPillar, p => ({
      ...p,
      threats: p.threats.map(t => {
        if (type === "threat" && t.id === id) return { ...t, status: statusNext[t.status] };
        return {
          ...t,
          controls: t.controls.map(c => {
            if (type === "control" && c.id === id) return { ...c, status: statusNext[c.status] };
            return {
              ...c,
              activities: c.activities.map(a => {
                if (type === "activity" && a.id === id) return { ...a, status: statusNext[a.status] };
                return {
                  ...a,
                  subActivities: a.subActivities.map(s =>
                    type === "subactivity" && s.id === id ? { ...s, status: statusNext[s.status] } : s
                  ),
                };
              }),
            };
          }),
        };
      }),
    }));
  };

  const saveEdit = (updated) => {
    const { type } = editItem;
    updatePillar(selPillar, p => ({
      ...p,
      threats: p.threats.map(t => {
        if (type === "threat" && t.id === updated.id) return { ...t, ...updated };
        return {
          ...t,
          controls: t.controls.map(c => {
            if (type === "control" && c.id === updated.id) return { ...c, ...updated };
            return {
              ...c,
              activities: c.activities.map(a => {
                if (type === "activity" && a.id === updated.id) return { ...a, ...updated };
                return {
                  ...a,
                  subActivities: a.subActivities.map(s =>
                    type === "subactivity" && s.id === updated.id ? { ...s, ...updated } : s
                  ),
                };
              }),
            };
          }),
        };
      }),
    }));
    setEditItem(null);
  };

  const doDelete = () => {
    const { id, type } = deleteItem;
    updatePillar(selPillar, p => ({
      ...p,
      threats: type === "threat"
        ? p.threats.filter(t => t.id !== id)
        : p.threats.map(t => ({
            ...t,
            controls: type === "control"
              ? t.controls.filter(c => c.id !== id)
              : t.controls.map(c => ({
                  ...c,
                  activities: type === "activity"
                    ? c.activities.filter(a => a.id !== id)
                    : c.activities.map(a => ({
                        ...a,
                        subActivities: type === "subactivity"
                          ? a.subActivities.filter(s => s.id !== id)
                          : a.subActivities,
                      })),
                })),
          })),
    }));
    // Reset breadcrumb if deleted item was selected
    if (type === "threat")      { setSelThreat(null); setSelControl(null); setSelAct(null); }
    if (type === "control")     { setSelControl(null); setSelAct(null); }
    if (type === "activity")    { setSelAct(null); }
    setDeleteItem(null);
  };

  const doAdd = () => {
    if (!newText.trim()) return;
    const uid = Date.now().toString();
    updatePillar(selPillar, p => {
      const { level } = addingAt;
      if (level === "threat") return { ...p, threats: [...p.threats, { id:"t"+uid, text:newText, status:"planned", controls:[] }] };
      return {
        ...p,
        threats: p.threats.map(t => {
          if (level === "control" && t.id === selThreat)
            return { ...t, controls: [...t.controls, { id:"c"+uid, text:newText, status:"planned", activities:[] }] };
          return {
            ...t,
            controls: t.controls.map(c => {
              if (level === "activity" && c.id === selControl)
                return { ...c, activities: [...c.activities, { id:"a"+uid, text:newText, priority:newPri, effort:newEff, layer:newLayer, status:"planned", subActivities:[] }] };
              return {
                ...c,
                activities: c.activities.map(a => {
                  if (level === "subactivity" && a.id === selAct)
                    return { ...a, subActivities: [...a.subActivities, { id:"s"+uid, text:newText, priority:newPri, effort:newEff, layer:newLayer, status:"planned" }] };
                  return a;
                }),
              };
            }),
          };
        }),
      };
    });
    setNewText(""); setNewPri("High"); setNewEff("Medium"); setNewLayer("Physical");
    setAddingAt(null);
  };

  // ── KPI counts ─────────────────────────────────────────────────────
  const allActs = data.flatMap(p => p.threats.flatMap(t => t.controls.flatMap(c => c.activities)));
  const allSubs = allActs.flatMap(a => a.subActivities);
  const totalItems = allActs.length + allSubs.length;
  const doneItems  = [...allActs, ...allSubs].filter(x => x.status === "complete").length;

  // ── Level card component ──────────────────────────────────────────
  const LevelCard = ({ item, type, isSelected, onSelect, pillarColor, onEdit, onDelete, onCycle }) => {
    const lv = LEVEL[type];
    const hasStatus = item.status !== undefined;
    const st = hasStatus ? STATUS[item.status] || STATUS.planned : null;
    return (
      <div onClick={onSelect}
        style={{ background: isSelected ? pillarColor + "12" : "#FFFFFF", border: `1.5px solid ${isSelected ? pillarColor : "#E2E8F0"}`, borderLeft: `4px solid ${isSelected ? pillarColor : lv.accent}`, borderRadius: 10, padding: "11px 14px", marginBottom: 8, cursor: onSelect ? "pointer" : "default", boxShadow: isSelected ? `0 2px 8px ${pillarColor}20` : "0 1px 3px rgba(0,0,0,0.04)", transition: "all 0.12s" }}
        onMouseEnter={e => { if (!isSelected && onSelect) e.currentTarget.style.borderColor = pillarColor + "60"; }}
        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = "#E2E8F0"; }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
          <span style={{ fontSize:14, marginTop:1, flexShrink:0 }}>{lv.icon}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight: isSelected ? 700 : 500, color: isSelected ? pillarColor : "#1E293B", lineHeight:1.5 }}>{item.text}</div>
            {/* Badges row */}
            {(item.priority || item.layer) && (
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:6 }}>
                {item.priority && <Badge text={item.priority.toUpperCase()} scheme={PRIORITY[item.priority]} />}
                {item.layer    && <Badge text={item.layer} scheme={LAYER_SCHEME[item.layer]} />}
                {item.effort   && <span style={{ fontSize:11, fontWeight:600, color:"#94A3B8" }}>Effort: {item.effort}</span>}
              </div>
            )}
          </div>
          <div style={{ display:"flex", gap:5, alignItems:"center", flexShrink:0 }}>
            {st && (
              <button onClick={e => { e.stopPropagation(); onCycle && onCycle(); }}
                style={{ background:st.bg, color:st.text, border:`1px solid ${st.border}`, borderRadius:4, padding:"3px 8px", fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                {st.label} ↻
              </button>
            )}
            <IconBtn title="Edit" color={pillarColor} onClick={e => { e.stopPropagation(); onEdit(); }}>✏️</IconBtn>
            <IconBtn title="Remove" danger onClick={e => { e.stopPropagation(); onDelete(); }}>🗑</IconBtn>
          </div>
        </div>
      </div>
    );
  };

  // ── Add-row form ───────────────────────────────────────────────────
  const AddForm = ({ level, pillarColor }) => {
    const isActivity = level === "activity" || level === "subactivity";
    const lv = LEVEL[level];
    return (
      <div style={{ background:"#FFFFFF", border:`1.5px dashed ${pillarColor}60`, borderRadius:10, padding:14, marginTop:4 }}>
        <div style={{ fontSize:11, fontWeight:700, color:pillarColor, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>New {lv.label}</div>
        <textarea value={newText} onChange={e => setNewText(e.target.value)} placeholder={`Describe the ${lv.label.toLowerCase()}...`} rows={2}
          style={{ ...inp, width:"100%", resize:"vertical", lineHeight:1.5, marginBottom:10, flex:"none" }} autoFocus />
        {isActivity && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:10 }}>
            <select value={newPri} onChange={e => setNewPri(e.target.value)} style={{ ...inp, flex:"none", width:"100%", cursor:"pointer" }}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
            <select value={newEff} onChange={e => setNewEff(e.target.value)} style={{ ...inp, flex:"none", width:"100%", cursor:"pointer" }}>
              {EFFORTS.map(ef => <option key={ef}>{ef}</option>)}
            </select>
            <select value={newLayer} onChange={e => setNewLayer(e.target.value)} style={{ ...inp, flex:"none", width:"100%", cursor:"pointer" }}>
              {LAYERS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        )}
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={doAdd} style={{ background:pillarColor, color:"#fff", border:"none", borderRadius:7, padding:"8px 18px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Add</button>
          <button onClick={() => { setAddingAt(null); setNewText(""); }} style={{ background:"#F1F5F9", color:"#64748B", border:"none", borderRadius:7, padding:"8px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
        </div>
      </div>
    );
  };

  // ── Column header ─────────────────────────────────────────────────
  const ColHeader = ({ level, count, pillarColor }) => {
    const lv = LEVEL[level];
    return (
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:13 }}>{lv.icon}</span>
          <span style={{ fontSize:11, fontWeight:800, color:"#0F172A", textTransform:"uppercase", letterSpacing:1 }}>{lv.label}s</span>
          <span style={{ background:pillarColor+"18", color:pillarColor, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:10 }}>{count}</span>
        </div>
      </div>
    );
  };

  // ── Breadcrumb bar ────────────────────────────────────────────────
  const Crumb = ({ label, icon, color, active, onClick, isLast }) => (
    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
      <button onClick={onClick} disabled={active}
        style={{ background: active ? color : "#FFFFFF", color: active ? "#FFFFFF" : color || "#64748B", border:`1.5px solid ${active ? color : "#E2E8F0"}`, borderRadius:7, padding:"5px 12px", fontSize:12, fontWeight:700, cursor: active ? "default" : "pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:5 }}>
        {icon && <span>{icon}</span>}
        <span style={{ maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{label}</span>
      </button>
      {!isLast && <span style={{ color:"#CBD5E1", fontSize:16, fontWeight:300 }}>›</span>}
    </div>
  );

  const pillarColor = pillar?.color || "#64748B";

  return (
    <div style={{ fontFamily:"'Segoe UI', system-ui, sans-serif", background:"#F8FAFC", minHeight:"100vh", color:"#1E293B", padding:24 }}>
      <style>{`* { box-sizing: border-box; margin: 0; } ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; } input:focus, textarea:focus, select:focus { outline: none; border-color: #6366F1 !important; box-shadow: 0 0 0 3px #E0E7FF; }`}</style>

      {editItem   && <EditModal item={editItem.item} type={editItem.type} pillarColor={pillarColor} onSave={saveEdit} onClose={() => setEditItem(null)} />}
      {deleteItem && <ConfirmModal label={deleteItem.label.slice(0,80)+(deleteItem.label.length>80?"…":"")} onConfirm={doDelete} onClose={() => setDeleteItem(null)} />}

      {/* ── Header ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, paddingBottom:16, borderBottom:"2px solid #E2E8F0" }}>
        <div>
          <div style={{ fontSize:22, fontWeight:800, color:"#0F172A", letterSpacing:"-0.5px" }}>Physical Security — Cascade Framework</div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:3, textTransform:"uppercase", letterSpacing:"0.5px" }}>
            Pillar → Threat/Risk → Control → Activity → Sub-Activity
          </div>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          {[
            { l:"Total Items", v:totalItems, col:"#1E293B", bg:"#F1F5F9", border:"#CBD5E1" },
            { l:"Completed",   v:doneItems,  col:"#15803D", bg:"#F0FDF4", border:"#BBF7D0" },
          ].map(k => (
            <div key={k.l} style={{ background:k.bg, border:`1.5px solid ${k.border}`, borderRadius:10, padding:"10px 18px", textAlign:"right" }}>
              <div style={{ fontSize:24, fontWeight:800, color:k.col, lineHeight:1 }}>{k.v}</div>
              <div style={{ fontSize:11, color:"#64748B", marginTop:3, fontWeight:500 }}>{k.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pillar selector ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:20 }}>
        {data.map(p => {
          const threats = p.threats.length;
          const acts = countAll(p, "activities");
          const subs = countAll(p, "subActivities");
          const isSel = selPillar === p.id;
          return (
            <button key={p.id} onClick={() => { setSelPillar(p.id); setSelThreat(null); setSelControl(null); setSelAct(null); }}
              style={{ background: isSel ? p.color : "#FFFFFF", color: isSel ? "#FFFFFF" : p.color, border:`1.5px solid ${isSel ? p.color : p.color+"40"}`, borderRadius:10, padding:"12px 10px", cursor:"pointer", fontFamily:"inherit", textAlign:"left", transition:"all 0.12s" }}>
              <div style={{ fontSize:18, marginBottom:4 }}>{p.icon}</div>
              <div style={{ fontSize:11, fontWeight:800, lineHeight:1.3, marginBottom:6 }}>{p.name}</div>
              <div style={{ fontSize:10, color: isSel ? "rgba(255,255,255,0.75)" : "#94A3B8" }}>
                {threats} threats · {acts} acts · {subs} subs
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Breadcrumb ── */}
      {pillar && (
        <div style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"wrap", marginBottom:16, padding:"10px 14px", background:"#FFFFFF", border:"1.5px solid #E2E8F0", borderRadius:10, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
          <Crumb label={pillar.name} icon={pillar.icon} color={pillar.color} active={!selThreat}
            onClick={() => { setSelThreat(null); setSelControl(null); setSelAct(null); }} isLast={!threat} />
          {threat && (
            <Crumb label={threat.text} icon="▲" color="#DC2626" active={!selControl}
              onClick={() => { setSelControl(null); setSelAct(null); }} isLast={!control} />
          )}
          {control && (
            <Crumb label={control.text} icon="🛡" color="#16A34A" active={!selAct}
              onClick={() => setSelAct(null)} isLast={!act} />
          )}
          {act && (
            <Crumb label={act.text} icon="⚡" color="#2563EB" active={true} isLast={true} />
          )}
        </div>
      )}

      {/* ── Pillar objectives strip ── */}
      {pillar && (
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
          {pillar.objectives.map((o,i) => (
            <span key={i} style={{ background:pillar.lightBg, color:pillar.color, border:`1px solid ${pillar.color}30`, fontSize:11, fontWeight:600, padding:"4px 12px", borderRadius:20 }}>{o}</span>
          ))}
        </div>
      )}

      {/* ── Cascade columns ── */}
      {pillar && (
        <div style={{ display:"grid", gridTemplateColumns: act ? "1fr 1fr 1fr 1fr" : control ? "1fr 1fr 1fr" : threat ? "1fr 1fr" : "1fr", gap:14 }}>

          {/* COL 1: Threats */}
          <div style={{ background:"#FAFAFA", border:"1.5px solid #E2E8F0", borderRadius:12, padding:16 }}>
            <ColHeader level="threat" count={pillar.threats.length} pillarColor={pillarColor} />
            {pillar.threats.map(t => (
              <LevelCard key={t.id} item={t} type="threat" isSelected={selThreat === t.id} pillarColor={pillarColor}
                onSelect={() => { setSelThreat(t.id); setSelControl(null); setSelAct(null); }}
                onCycle={() => cycleStatus("threat", t.id)}
                onEdit={() => setEditItem({ item:t, type:"threat" })}
                onDelete={() => setDeleteItem({ id:t.id, type:"threat", label:t.text })} />
            ))}
            {addingAt?.level === "threat"
              ? <AddForm level="threat" pillarColor={pillarColor} />
              : <button onClick={() => { setAddingAt({ level:"threat" }); setNewText(""); }}
                  style={{ background:"#FFFFFF", color:pillarColor, border:`2px dashed ${pillarColor}40`, borderRadius:9, padding:"9px 14px", fontSize:12, fontWeight:700, width:"100%", cursor:"pointer", fontFamily:"inherit", marginTop:4 }}>
                  + Add Threat
                </button>
            }
          </div>

          {/* COL 2: Controls */}
          {threat && (
            <div style={{ background:"#FAFAFA", border:"1.5px solid #E2E8F0", borderRadius:12, padding:16 }}>
              <ColHeader level="control" count={threat.controls.length} pillarColor={pillarColor} />
              {threat.controls.map(c => (
                <LevelCard key={c.id} item={c} type="control" isSelected={selControl === c.id} pillarColor={pillarColor}
                  onSelect={() => { setSelControl(c.id); setSelAct(null); }}
                  onCycle={() => cycleStatus("control", c.id)}
                  onEdit={() => setEditItem({ item:c, type:"control" })}
                  onDelete={() => setDeleteItem({ id:c.id, type:"control", label:c.text })} />
              ))}
              {addingAt?.level === "control"
                ? <AddForm level="control" pillarColor={pillarColor} />
                : <button onClick={() => { setAddingAt({ level:"control" }); setNewText(""); }}
                    style={{ background:"#FFFFFF", color:pillarColor, border:`2px dashed ${pillarColor}40`, borderRadius:9, padding:"9px 14px", fontSize:12, fontWeight:700, width:"100%", cursor:"pointer", fontFamily:"inherit", marginTop:4 }}>
                    + Add Control
                  </button>
              }
            </div>
          )}

          {/* COL 3: Activities */}
          {control && (
            <div style={{ background:"#FAFAFA", border:"1.5px solid #E2E8F0", borderRadius:12, padding:16 }}>
              <ColHeader level="activity" count={control.activities.length} pillarColor={pillarColor} />
              {control.activities.map(a => (
                <LevelCard key={a.id} item={a} type="activity" isSelected={selAct === a.id} pillarColor={pillarColor}
                  onSelect={() => setSelAct(a.id)}
                  onCycle={() => cycleStatus("activity", a.id)}
                  onEdit={() => setEditItem({ item:a, type:"activity" })}
                  onDelete={() => setDeleteItem({ id:a.id, type:"activity", label:a.text })} />
              ))}
              {addingAt?.level === "activity"
                ? <AddForm level="activity" pillarColor={pillarColor} />
                : <button onClick={() => { setAddingAt({ level:"activity" }); setNewText(""); }}
                    style={{ background:"#FFFFFF", color:pillarColor, border:`2px dashed ${pillarColor}40`, borderRadius:9, padding:"9px 14px", fontSize:12, fontWeight:700, width:"100%", cursor:"pointer", fontFamily:"inherit", marginTop:4 }}>
                    + Add Activity
                  </button>
              }
            </div>
          )}

          {/* COL 4: Sub-Activities */}
          {act && (
            <div style={{ background:"#FAFAFA", border:"1.5px solid #E2E8F0", borderRadius:12, padding:16 }}>
              <ColHeader level="subactivity" count={act.subActivities.length} pillarColor={pillarColor} />
              {act.subActivities.map(s => (
                <LevelCard key={s.id} item={s} type="subactivity" isSelected={false} pillarColor={pillarColor}
                  onSelect={null}
                  onCycle={() => cycleStatus("subactivity", s.id)}
                  onEdit={() => setEditItem({ item:s, type:"subactivity" })}
                  onDelete={() => setDeleteItem({ id:s.id, type:"subactivity", label:s.text })} />
              ))}
              {addingAt?.level === "subactivity"
                ? <AddForm level="subactivity" pillarColor={pillarColor} />
                : <button onClick={() => { setAddingAt({ level:"subactivity" }); setNewText(""); }}
                    style={{ background:"#FFFFFF", color:pillarColor, border:`2px dashed ${pillarColor}40`, borderRadius:9, padding:"9px 14px", fontSize:12, fontWeight:700, width:"100%", cursor:"pointer", fontFamily:"inherit", marginTop:4 }}>
                    + Add Sub-Activity
                  </button>
              }
            </div>
          )}
        </div>
      )}

      {/* ── Empty state ── */}
      {!pillar && (
        <div style={{ textAlign:"center", padding:"60px 24px", color:"#94A3B8" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>☝️</div>
          <div style={{ fontSize:16, fontWeight:700, color:"#475569", marginBottom:6 }}>Select a pillar above to begin</div>
          <div style={{ fontSize:13 }}>Then drill down through Threats → Controls → Activities → Sub-Activities</div>
        </div>
      )}

      {/* ── Legend ── */}
      <div style={{ display:"flex", gap:16, marginTop:20, paddingTop:14, borderTop:"1.5px solid #E2E8F0", flexWrap:"wrap", alignItems:"center" }}>
        {Object.entries(LEVEL).map(([k,v]) => (
          <span key={k} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, fontWeight:600, color:"#475569" }}>
            <span style={{ width:10, height:10, borderRadius:2, background:v.accent, display:"inline-block" }}/>
            {v.label}
          </span>
        ))}
        <span style={{ fontSize:11, color:"#94A3B8", marginLeft:"auto" }}>✏️ edit · 🗑 remove · click status badge to cycle · breadcrumb to navigate back</span>
      </div>
    </div>
  );
}
