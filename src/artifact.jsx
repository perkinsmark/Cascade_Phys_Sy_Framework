// Entry for the shareable single-page build (npm run build:artifact).
// React and ReactDOM come from the page's CDN script tags as globals.
import { createRoot } from "react-dom/client";
import IncidentCommander from "./incident/IncidentCommander.jsx";
import "./incident/theme.css";

createRoot(document.getElementById("root")).render(
  <main className="ic-root">
    <header className="ic-head">
      <h1>Incident Commander</h1>
      <p>The first hours of a physical security incident, from the EIT Incident Response Pack v1.</p>
    </header>
    <IncidentCommander />
  </main>,
);
