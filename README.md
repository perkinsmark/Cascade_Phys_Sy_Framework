# Cascade_Phys_Sy_Framework
Cascade version of the physical security framework, plus an Incident Commander workflow for the first hours of a physical security incident.

## Run it

```sh
npm install
npm run dev     # local dev server
npm test        # unit tests (Vitest)
npm run build   # static build in dist/
npm run build:artifact  # single-file shareable page in dist-artifact/ (EIT pack by default)
```

The app has two views: **Incident Commander** (default) and **Security Framework** (`#framework`, the original `physical-security-cascade.jsx`).

## Incident Commander

Built from *EIT Incident Response Pack v1* (Parts B and C). It walks the Site Incident Lead through:

1. **Declare.** Records what happened, where and who leads, and starts the incident clock.
2. **Triage.** Section 1 questions recommend a P-level (always the highest one any answer implies), then the Crisis Co-ordinator confirms it. Scenario triggers suggest Part C cards, with a warning when a card's typical level is higher than the level set. Re-assessment triggers (casualties, media, regulatory duties, spread to another building) are logged.
3. **First hour.** The Section 3 checklist in three bands (0 to 15, 15 to 30 and 30 to 60 minutes). Each band is flagged NOW or OVERDUE against the clock, and items tick themselves when the matching step is done elsewhere: P-level set, card opened, holding message sent, update time set, log started.
4. **Scenario cards.** Cards 1 to 4, with stages Secure (0 to 1 h), Activate (1 to 4 h), Stabilise (4 to 24 h) and Recover (24 to 72 h). Each action gets an owner and a time when done, and the card's BCP threshold can be recommended to the CMT.
5. **Comms.** The Section 4 matrix, with due times by P-level, a holding message builder and the IRT/CMT briefing rhythm.
6. **Log.** Every tick and decision is timestamped. **Export report** downloads a Markdown handover or post-incident report.

State is kept in the browser's local storage, so a refresh doesn't lose it. The exported report is the record. Closed incidents are archived in the same browser.

### Shareable page

`npm run build:artifact` builds a single HTML page (Incident Commander only) that loads React from cdnjs. It's the page published as a claude.ai artifact. That page can't download files, so **Export report** shows the report with a Copy button instead. It follows the viewer's light or dark theme, and **Load a training example** opens a fictional incident, 22 minutes in.

### Packs: one app, several organisations

Everything organisation-specific (levels, roles, wording, checklist, comms, message templates, contacts, scenario cards and the training example) lives in a pack file. The EIT pack is `src/incident/packs/eit.js`. To build for another organisation, write a pack and pass `PACK_FILE=path/to/pack.js` to `npm run dev` or `npm run build:artifact`. See `src/incident/packs/README.md` for the format.

This repository is public. Packs with confidential content go in `private-packs/`, which git ignores.

### Keeping it current

- Change the source pack document first, then its pack file.
- Fill in Section 5 contacts (name, 24/7 phone, deputy, verified date) in the pack's `CONTACTS`. Blank ones show as gaps.
- The logic lives in `src/incident/engine.js` and is covered by `test/engine.test.js`, which also validates every pack.
