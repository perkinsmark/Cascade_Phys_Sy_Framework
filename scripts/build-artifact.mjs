// Assembles the shareable single-file page from the artifact build.
// Usage: node scripts/build-artifact.mjs [output.html]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { packFile } from "../pack.config.js";

const pack = (await import(pathToFileURL(packFile).href)).default;
const out = process.argv[2] || `dist-artifact/${pack.id}-incident-commander.html`;
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const js = readFileSync("dist-artifact/build/app.js", "utf8");
const css = readFileSync("dist-artifact/build/app.css", "utf8");
const safe = s => s.replace(/<\/(script|style)/gi, "<\\/$1");

const page = `<title>${esc(pack.pageTitle || pack.appTitle)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&family=Space+Grotesk:wght@600;700&display=swap">
<style>
${safe(css)}
.ic-root { max-width: 1100px; margin: 0 auto; padding-block: 20px 32px;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
.ic-head { display: grid; gap: 4px; margin-bottom: 16px; }
.ic-head h1 { font-family: var(--display); font-size: 26px; line-height: 1.15; margin: 0; letter-spacing: -0.02em; }
.ic-head p { margin: 0; color: var(--muted); font-size: 14px; max-width: 65ch; }
.ic-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted-strong); }
</style>
<div id="root"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>
${safe(js)}
</script>
`;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, page);
console.log(`Wrote ${out} (${(page.length / 1024).toFixed(1)} KB)`);
