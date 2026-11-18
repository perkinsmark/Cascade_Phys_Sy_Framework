// Entry for the shareable single-page build (npm run build:artifact).
// React and ReactDOM come from the page's CDN script tags as globals.
import { createRoot } from "react-dom/client";
import PACK from "@pack";
import IncidentCommander from "./incident/IncidentCommander.jsx";
import "./incident/theme.css";

createRoot(document.getElementById("root")).render(
  <main className="ic-root">
    <header className="ic-head">
      {PACK.eyebrow && <span className="ic-eyebrow">{PACK.eyebrow}</span>}
      <h1>{PACK.appTitle}</h1>
      <p>{PACK.subtitle}</p>
    </header>
    <IncidentCommander />
  </main>,
);
