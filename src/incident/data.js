// Content transcribed from "EIT Incident Response Pack v1" (Parts B and C).
// Keep this file in step with the pack: change the pack first, then this file.
// Values in [square brackets] are completed by the building lead.

export const PACK_VERSION = "EIT Incident Response Pack v1";

// ── Part B, Section 1: Priority levels ───────────────────────────────
export const P_LEVELS = {
  P1: {
    name: "Critical",
    looksLike: "Threat to life, serious injury, site-wide loss, or major reputational or regulatory exposure",
    activated: "IRT and CMT at once; CEO notified",
    howFast: "Minutes",
  },
  P2: {
    name: "Major",
    looksLike: "Building or service out of use, multiple teams affected, recovery beyond normal capability",
    activated: "IRT activated; CMT convenes within 2 hours",
    howFast: "1 to 2 hours",
  },
  P3: {
    name: "Significant",
    looksLike: "Disruption to one team or area that needs coordination beyond the line manager",
    activated: "Site Incident Lead manages; Crisis Co-ordinator informed; CMT on standby",
    howFast: "Same day",
  },
  P4: {
    name: "Minor",
    looksLike: "Handled in normal operations, but could escalate",
    activated: "Line manager or Security handles; logged",
    howFast: "Routine",
  },
};
export const P_ORDER = ["P1", "P2", "P3", "P4"];

export const REASSESS_TRIGGERS = [
  { id: "casualties", label: "Casualties" },
  { id: "media", label: "Media interest" },
  { id: "regulatory", label: "Regulatory duties" },
  { id: "spread", label: "Spread to another building" },
];

// Triage questions. Each "yes" points to the P-level it implies (Section 1).
// The recommendation is the highest level any "yes" implies: when in doubt, classify higher.
export const TRIAGE_QUESTIONS = [
  { id: "life", text: "Is anyone's life at risk, or is there a serious injury, fatality or multiple casualties?", level: "P1" },
  { id: "attack", text: "Is there a hostile attack, weapons, or a credible bomb threat?", level: "P1" },
  { id: "siteLoss", text: "Is a whole building lost, or is the site-wide operation affected?", level: "P1" },
  { id: "exposure", text: "Is there major reputational or regulatory exposure?", level: "P1" },
  { id: "outOfUse", text: "Is a building or service out of use, or are multiple teams affected?", level: "P2" },
  { id: "beyondCapability", text: "Is recovery beyond normal operational capability?", level: "P2" },
  { id: "oneArea", text: "Is one team or area disrupted and needing coordination beyond the line manager?", level: "P3" },
];

// ── Part B, Section 2: Roles ─────────────────────────────────────────
export const ROLES = [
  { role: "Site Incident Lead", who: "Duty Responder on shift; [named building lead] once on scene", handsOver: "IRT at P2 or above" },
  { role: "Incident Response Team (IRT)", who: "Site Incident Lead plus Security, Facilities, EHS, HR and IT as needed", handsOver: "CMT for strategic decisions" },
  { role: "Crisis Management Team (CMT)", who: "Chaired by the SLT Sponsor; COO, Communications, Legal, HR; Crisis Co-ordinator as secretary", handsOver: "Normal management when stood down" },
];

// ── Part B, Section 3: First-hour checklist ──────────────────────────
export const FIRST_HOUR = [
  {
    id: "safe", label: "Make people safe", fromMin: 0, toMin: 15,
    items: [
      { id: "safe-999", text: "SCR has called 999 if needed; Part A actions under way" },
      { id: "safe-account", text: "Everyone accounted for: wardens' reports, visitor sign-in and access control roll call" },
      { id: "safe-missing", text: "Anyone missing or injured reported to the emergency services on arrival" },
      { id: "safe-meet", text: "Someone named to meet the emergency services, with site plans and the lab hazard summary" },
    ],
  },
  {
    id: "classify", label: "Understand and classify", fromMin: 15, toMin: 30,
    items: [
      { id: "cls-what", text: "What happened, where, and what is affected (people, buildings, labs, systems)" },
      { id: "cls-plevel", text: "Provisional P-level set (Section 1)", auto: "plevel" },
      { id: "cls-cc", text: "Crisis Co-ordinator called and the P-level agreed", auto: "confirmed" },
      { id: "cls-card", text: "Scenario card opened if one applies (Part C)", auto: "card" },
    ],
  },
  {
    id: "activate", label: "Activate and inform", fromMin: 30, toMin: 60,
    items: [
      { id: "act-irt", text: "IRT called in at P3 or above; CMT alerted at P2 or above" },
      { id: "act-holding", text: "Holding message to staff on site (Section 4)", auto: "holding" },
      { id: "act-cordons", text: "Cordons, access and building status confirmed with Security" },
      { id: "act-update", text: "Time set for the first IRT or CMT update", auto: "nextUpdate" },
      { id: "act-log", text: "Log started and kept: decisions, actions, times, who", auto: "log" },
    ],
  },
];

// ── Part B, Section 4: Escalation and communications ─────────────────
// dueMin: minutes after declaration by P-level; null = event-driven.
export const COMMS = [
  { id: "staff", audience: "Staff on site", channel: "Mass notification, wardens, line managers", owner: "Site Incident Lead", when: "Within 60 minutes, then at each change", dueMin: { P1: 60, P2: 60, P3: 60, P4: 60 } },
  { id: "slt", audience: "SLT and Board", channel: "Direct call, then scheduled briefings", owner: "CMT chair", when: "P1 at once; P2 within 2 hours", dueMin: { P1: 0, P2: 120 } },
  { id: "services", audience: "Emergency services", channel: "In person on arrival", owner: "Site Incident Lead", when: "On arrival", dueMin: null },
  { id: "regulators", audience: "Regulators (HSE, police and others)", channel: "As required by law", owner: "EHS lead with Legal", when: "See the reference annex", dueMin: null },
  { id: "partners", audience: "Partners, tenants and visitors' organisations", channel: "Approved statement", owner: "Communications", when: "When the CMT approves", dueMin: null, cmtApproval: true },
  { id: "media", audience: "Media", channel: "Designated spokesperson only", owner: "Communications", when: "When the CMT approves; everyone else refers enquiries", dueMin: null, cmtApproval: true },
];

export const HOLDING_MESSAGE =
  "There is an incident at {building} affecting {area}. Please {instruction} {location} and follow instructions from wardens and Security. We will update you by {time}. Do not post about this on social media.";
export const HOLDING_INSTRUCTIONS = ["stay away from", "leave", "remain in"];

// ── Part B, Section 5: Key contacts ──────────────────────────────────
// Fill name, phone, deputy and verified (YYYY-MM-DD) per site. Blank fields show as gaps.
export const CONTACTS = [
  { role: "Emergency services", name: "999", phone: "999", deputy: "", verified: "", fixed: true },
  { role: "Security Control Room", name: "", phone: "", deputy: "", verified: "" },
  { role: "Duty Responder", name: "", phone: "", deputy: "", verified: "" },
  { role: "Site Incident Lead (building lead)", name: "", phone: "", deputy: "", verified: "" },
  { role: "Crisis Co-ordinator", name: "", phone: "", deputy: "", verified: "" },
  { role: "SLT Sponsor (CMT chair)", name: "", phone: "", deputy: "", verified: "" },
  { role: "COO", name: "", phone: "", deputy: "", verified: "" },
  { role: "Facilities / estates", name: "", phone: "", deputy: "", verified: "" },
  { role: "EHS lead", name: "", phone: "", deputy: "", verified: "" },
  { role: "IT service desk (major incident)", name: "", phone: "", deputy: "", verified: "" },
  { role: "HR", name: "", phone: "", deputy: "", verified: "" },
  { role: "Communications", name: "", phone: "", deputy: "", verified: "" },
  { role: "Utilities: gas, power, water", name: "", phone: "", deputy: "", verified: "" },
  { role: "Thames Valley Police (non-emergency)", name: "101", phone: "101", deputy: "", verified: "", fixed: true },
];

// ── Part C: Scenario cards ───────────────────────────────────────────
export const STAGES = [
  { id: "secure", label: "Secure", fromH: 0, toH: 1 },
  { id: "activate", label: "Activate", fromH: 1, toH: 4 },
  { id: "stabilise", label: "Stabilise", fromH: 4, toH: 24 },
  { id: "recover", label: "Recover", fromH: 24, toH: 72 },
];

// Scenario triggers offered at triage; each maps to the card whose "Triggers" line names it.
export const SCENARIO_TRIGGERS = [
  { id: "ambulance", label: "Someone needs an ambulance", card: "card1" },
  { id: "labExposure", label: "Lab exposure", card: "card1" },
  { id: "multiCasualty", label: "Multiple casualties", card: "card1" },
  { id: "attack", label: "Weapons or hostile attack", card: "card2" },
  { id: "intruder", label: "Intruder", card: "card2" },
  { id: "bombThreat", label: "Bomb threat", card: "card2" },
  { id: "suspiciousItem", label: "Suspicious item", card: "card2" },
  { id: "protest", label: "Aggressive protest", card: "card2" },
  { id: "power", label: "Loss of power", card: "card3" },
  { id: "water", label: "Loss of water", card: "card3" },
  { id: "gasSupply", label: "Loss of gas, heating or cooling", card: "card3" },
  { id: "telecoms", label: "Loss of telecoms", card: "card3" },
  { id: "gasLeak", label: "Gas leak", card: "card3" },
  { id: "fire", label: "Confirmed fire", card: "card4" },
  { id: "explosion", label: "Explosion", card: "card4" },
  { id: "structural", label: "Collapse or structural movement", card: "card4" },
  { id: "flood", label: "Major flood damage", card: "card4" },
];

export const CARDS = [
  {
    id: "card1", number: 1, name: "Serious injury or medical emergency",
    lead: "Site Incident Lead",
    typical: "P3", typicalNote: "P3; P1 for a fatality or multiple casualties",
    triggers: "Anyone needing an ambulance, a lab exposure, multiple casualties",
    stages: {
      secure: { owners: ["SCR", "Security", "Lab manager", "Site Incident Lead"], actions: [
        "Call 999 and send a first aider and the defibrillator.",
        "Meet the ambulance and guide it to the casualty.",
        "For a lab exposure, identify the agent and give its safety data to the paramedics.",
        "Keep the area clear and leave it untouched if work-related.",
      ] },
      activate: { owners: ["Site Incident Lead", "HR", "EHS lead", "Line manager"], actions: [
        "Confirm the P-level with the Crisis Co-ordinator.",
        "Contact next of kin through HR only.",
        "Check whether it is RIDDOR reportable.",
        "Support witnesses and first aiders.",
      ] },
      stabilise: { owners: ["EHS lead", "Site Incident Lead", "Communications"], actions: [
        "Keep the area and equipment out of use until EHS releases them.",
        "Brief the team on a need-to-know basis.",
        "Prepare a holding statement if there is media interest.",
      ] },
      recover: { owners: ["EHS lead", "HR"], actions: [
        "Report to the HSE within RIDDOR deadlines.",
        "Investigate and record corrective actions.",
        "Arrange welfare follow-up and a return-to-work plan.",
      ] },
    },
    contacts: "Occupational health [ ], employee assistance [ ], Biological Safety Officer [ ], HSE Incident Contact Centre [ ]",
    bcp: "Invoke the Site BCP when key staff are lost to a team, or an area stays closed for more than [24] hours.",
  },
  {
    id: "card2", number: 2, name: "Security threat",
    lead: "Security Manager, with the SCR",
    typical: "P2", typicalNote: "P2; P1 for an attack or credible bomb threat",
    triggers: "Weapons or hostile attack, intruder, bomb threat, suspicious item, aggressive protest",
    stages: {
      secure: { owners: ["SCR", "Security"], actions: [
        "Start lockdown or evacuation to suit the threat.",
        "Call 999; in an attack, staff may already have done so.",
        "Track the threat on CCTV and pass it to police.",
        "Complete the bomb threat checklist or cordon a suspicious item.",
      ] },
      activate: { owners: ["Site Incident Lead", "Security", "SCR"], actions: [
        "Set the P-level with the Crisis Co-ordinator; an attack is P1.",
        "Lock access control and stop visitor entry.",
        "Account for people using access control records.",
        "Send the holding message.",
      ] },
      stabilise: { owners: ["Security", "Communications"], actions: [
        "Act on police direction and hand over CCTV and logs.",
        "Sweep buildings before reoccupation if instructed.",
        "Issue CMT-approved statements and monitor social media.",
      ] },
      recover: { owners: ["Site Incident Lead", "HR", "Security Manager"], actions: [
        "Lift lockdown only on police all-clear.",
        "Provide welfare and trauma support.",
        "Review access control and security measures.",
      ] },
    },
    contacts: "Thames Valley Police (999 / 101), Counter Terrorism Security Adviser [ ], threat monitoring provider [ ], security contractor [ ]",
    bcp: "Invoke the Site BCP when a police cordon keeps a building closed for more than [24] hours.",
  },
  {
    id: "card3", number: 3, name: "Utility failure",
    lead: "Facilities Manager",
    typical: "P3", typicalNote: "P3; P2 if site-wide or labs are at risk",
    triggers: "Loss of power, water, gas, heating or cooling, or telecoms; a gas leak",
    stages: {
      secure: { owners: ["Facilities", "SCR", "Lab managers"], actions: [
        "Check lifts and release anyone trapped.",
        "Confirm emergency lighting and the fire alarm work; if not, set a fire watch or evacuate.",
        "Make lab equipment safe and check fume cupboards and containment.",
        "For a gas leak, evacuate, do not operate switches, and call the gas emergency line.",
      ] },
      activate: { owners: ["Facilities", "Lab managers", "Site Incident Lead"], actions: [
        "Get a restoration estimate from the utility provider.",
        "Confirm generator and UPS status and run time.",
        "Protect freezers, cryogenic stores and samples.",
        "Decide with the Crisis Co-ordinator whether the building stays open.",
      ] },
      stabilise: { owners: ["Facilities", "HR", "IT"], actions: [
        "Prioritise generator load to critical equipment.",
        "Move staff to remote working where possible.",
        "Monitor lab and server room temperatures.",
      ] },
      recover: { owners: ["Facilities", "Lab managers", "Operations"], actions: [
        "Restore supply in controlled stages.",
        "Check lab equipment and alarms before restart.",
        "Record lost samples and stock for insurance.",
      ] },
    },
    contacts: "Power cuts 105, gas emergency 0800 111 999, water supplier [ ], generator contractor [ ], building management system contractor [ ]",
    bcp: "Invoke the Loss of Power BCP when the outage passes [4] hours or the generator cannot support critical loads.",
  },
  {
    id: "card4", number: 4, name: "Fire, explosion or structural damage",
    lead: "Site Incident Lead",
    typical: "P2", typicalNote: "P2; P1 with casualties or loss of a building",
    triggers: "Confirmed fire, explosion, collapse or structural movement, major flood damage",
    stages: {
      secure: { owners: ["SCR", "Fire wardens", "Site Incident Lead", "Facilities"], actions: [
        "Confirm the alarm is raised and 999 called.",
        "Evacuate and account for everyone; report anyone missing or in a refuge to the fire service.",
        "Meet the fire service with site plans, the lab hazard summary and isolation points.",
        "Isolate gas and power only if safe and trained.",
      ] },
      activate: { owners: ["Site Incident Lead", "HR"], actions: [
        "Set the P-level with the Crisis Co-ordinator.",
        "Move people from the assembly point to shelter at [location] if it will be prolonged.",
        "Send the holding message and release staff not needed.",
        "Alert the CMT at P2 or above.",
      ] },
      stabilise: { owners: ["Site Incident Lead", "Security", "Facilities", "IT", "Finance"], actions: [
        "Keep everyone out until the fire service and a structural engineer clear the building.",
        "Secure the site once the fire service leaves.",
        "Salvage critical items and data where safe.",
        "Notify the insurer.",
      ] },
      recover: { owners: ["Facilities", "BCP owner", "EHS lead", "HR"], actions: [
        "Commission a structural survey before reoccupation.",
        "Relocate critical activities.",
        "Investigate and report any RIDDOR dangerous occurrence.",
        "Provide welfare support.",
      ] },
    },
    contacts: "Oxfordshire Fire and Rescue (via 999), structural engineer [ ], insurer [ ], salvage and restoration contractor [ ]",
    bcp: "Invoke the Denial of Access BCP when the building is unusable for more than [24] hours.",
  },
];
