// Which pack a build uses. Default: the EIT pack in the repo.
//   PACK=eit                         -> src/incident/packs/eit.js
//   PACK_FILE=private-packs/acme.js   -> any pack file (private-packs/ is git-ignored)
import { resolve } from "node:path";

export const packFile = resolve(process.env.PACK_FILE || `src/incident/packs/${process.env.PACK || "eit"}.js`);
