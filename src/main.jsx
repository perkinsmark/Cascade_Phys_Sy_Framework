import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import IncidentCommander from "./incident/IncidentCommander.jsx";
import CascadeFramework from "../physical-security-cascade.jsx";

function Shell() {
  const [view, setView] = useState(() => (location.hash === "#framework" ? "framework" : "incident"));
  const go = v => { setView(v); history.replaceState(null, "", v === "framework" ? "#framework" : "#"); };
  const tab = active => ({
    background: active ? "#fff" : "transparent", color: active ? "#0F172A" : "#CBD5E1",
    border: "none", borderRadius: 6, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer",
  });
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif", color: "#0F172A", minHeight: "100vh", background: "#F8FAFC" }}>
      <nav style={{ background: "#0F172A", padding: "8px 16px", display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ color: "#fff", fontWeight: 800, marginRight: 12 }}>Cascade</span>
        <button style={tab(view === "incident")} onClick={() => go("incident")}>Incident Commander</button>
        <button style={tab(view === "framework")} onClick={() => go("framework")}>Security Framework</button>
      </nav>
      {view === "incident"
        ? <main style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}><IncidentCommander /></main>
        : <CascadeFramework />}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<StrictMode><Shell /></StrictMode>);
