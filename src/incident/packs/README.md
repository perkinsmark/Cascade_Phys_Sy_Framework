# Response packs

Everything that is specific to one organisation lives in a pack file: its levels, roles, wording, checklist, comms, message templates, contacts, scenario cards and training example. The screens, timers, triage logic and report are shared.

- `eit.js` is the EIT Incident Response Pack v1. Read it as the worked example.
- Confidential packs go in `private-packs/` at the repo root. That folder is git-ignored, because this repository is public. Keep those packs in a private repository or another secure location.

## Building with a pack

```sh
npm run build:artifact                                   # EIT (default)
PACK=eit npm run build:artifact                          # a pack in src/incident/packs/
PACK_FILE=private-packs/acme.js npm run build:artifact    # any pack file
PACK_FILE=private-packs/acme.js npm run dev               # run the full app with that pack
```

The single page lands in `dist-artifact/<pack id>-incident-commander.html`. `npm test` validates every pack in this folder and in `private-packs/`.

## Pack fields

| Field | What it holds |
|---|---|
| `id`, `storageKey` | Short id; prefix for the browser storage keys (keep it stable, or saved incidents are lost) |
| `eyebrow`, `appTitle`, `pageTitle`, `subtitle` | Page header and tab title |
| `source`, `classification` | Shown in the footer and the report |
| `terms` | Words the screens use: `level` ("P-level", "level"), `lead`, `confirmer`, `confirmVerb`, `confirmedWord`, `updateTo`, `bcpTo` |
| `levels` | Most severe first: `id`, `short`, `name`, `looksLike`, `activated`, `notify` (optional), `howFast` |
| `triage` | Questions: `level` they imply, and/or `alert: true` for "escalate now whatever the level" (`short` names it in the banner) |
| `alert` | Banner for alert answers: `text`, `tag`, `commsRow` it ticks, `button`, `doneLog`. `null` if the pack has none |
| `reassess`, `reassessNote` | Re-assessment triggers |
| `roles` | `role`, `who`, `does` (optional), `handsOver` |
| `firstHour` | Bands with `fromMin`, `toMin` and items. An item's `auto` ticks it from other actions: `plevel`, `confirmed`, `card`, `nextUpdate`, `log`, `sent:<message id>`, or an array that must all hold |
| `comms`, `commsRule` | Rows with `dueMin` by level id (null = event-driven), optional `onAlert` minutes and `approval` text |
| `messages` | Templates with `{field}` placeholders. Fields may have `options` or `prefill` (`location`, `title`, `lead`, `level`, `nextUpdate`). `commsRow` marks comms rows sent |
| `contacts` | `role`, `name`, `phone`, `deputy`, `verified`; `fixed: true` for numbers like 999 |
| `stages`, `triggers`, `cards` | Card stages by hour, triggers that suggest a card, and the cards (`typical` is a level id) |
| `closeNote` | Extra line on the close confirmation (optional) |
| `example` | The training incident: answers, level, cards, checklist and action times in minutes, sent messages and log |
