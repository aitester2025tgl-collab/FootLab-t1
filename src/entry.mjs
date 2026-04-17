// Single entry that pulls in legacy `main.js` and the new ES module POC so esbuild can produce a single bundle.

// Core game logic modules. Order is important.
import './core/globals.js';
import './core/logger.js';
import './core/persistence.js';
import './core/promotion.js';
import './logic/lineups.js'; // <-- Adicionado para garantir que a lógica de seleção de titulares existe

import './constants.js';
import './players.js';
import './clubs.js';
import './teams.js';
import './matches.js'; // <-- Garante que advanceMatchDay é definido
import './ui.js';

// Simulation must come after matches, teams, etc. as it depends on them.
import './core/simulation.js';

// New UI modules
import './ui/helpers.mjs';
import './ui/roster.mjs';
import './ui/transfers.mjs';
import './ui/finance.mjs';
import './ui/tactics.mjs';
import './ui/hub-controller.mjs';
import './ui/helpers.mjs';
import './ui/roster.mjs';
import './ui/transfers.mjs';
import './ui/finance.mjs';
import './ui/tactics.mjs';
import * as Hub from './ui/hub-controller.mjs';
import './ui/matchBoard.mjs';
import './ui/overlays/index.mjs';

// Expose the Hub controller to the window for legacy access
window.Hub = Hub;

// Import the legacy main after the modules so the modules attach to window before main runs if both set globals.
import './main.js';