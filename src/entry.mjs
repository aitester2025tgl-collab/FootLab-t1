// Single entry that pulls in legacy `main.js` and the new ES module POC so esbuild can produce a single bundle.
import './ui/helpers.mjs';
import './ui/roster.mjs';
import './ui/transfers.mjs';
import './ui/finance.mjs';
import './ui/tactics.mjs';
import './ui/hub-controller.mjs';
import './ui/overlays/index.mjs';
// Import the legacy main after the modules so the modules attach to window before main runs if both set globals.
import './main.js';
