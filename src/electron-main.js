import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import logger from './core/logger.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Note: previous implementation created a separate native modal window for
// substitutions. That approach was removed in favor of an in-page overlay.
// IPC handlers and helper windows for the modal are no longer required.

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 820,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const indexPath = path.join(__dirname, '..', 'index.html');
  win.loadFile(indexPath).catch((err) => {
    logger.error && logger.error('Failed to load index.html in Electron from', indexPath, err);
  });

  // Attach renderer logging listeners so console messages and load failures
  // are forwarded to the main process terminal for easier debugging.
  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    try {
      logger.debug &&
        logger.debug(`[renderer console:${level}] ${message} (line:${line} source:${sourceId})`);
    } catch (e) {
      /* ignore logging errors */
    }
  });

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    logger.error &&
      logger.error('Renderer failed to load:', errorCode, errorDescription, validatedURL);
  });

  win.webContents.on('crashed', () => {
    logger.error && logger.error('Renderer process crashed');
  });

  // Open devtools when ELECTRON_DEV env var is set
  if (process.env.ELECTRON_DEV) {
    win.webContents.openDevTools();
  }

  // After the page finishes loading, poll the renderer for roster lane counts
  // (some UI modules render asynchronously). Retry for up to ~2s then print
  // whatever we obtain so the developer can inspect the live DOM.
  win.webContents.on('did-finish-load', async () => {
    try {
      const dump = await win.webContents.executeJavaScript(
        `(async () => {
        const waitFor = (selector, timeout = 5000) => new Promise((resolve) => {
          const start = Date.now();
          const tick = () => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);
            if (Date.now() - start > timeout) return resolve(null);
            setTimeout(tick, 100);
          };
          tick();
        });
        // wait for hub-main-content to be populated by the hub renderer (be generous)
        await waitFor('#hub-main-content .player-group, #hub-main-content .team-roster-grid', 5000);
        try {
          const content = document.getElementById('hub-main-content');
          if (!content) return [];
          const groups = Array.from(content.querySelectorAll('.player-group'));
          return groups.map(g => {
            const titleEl = g.querySelector('.lane-title');
            const title = titleEl ? titleEl.textContent.trim() : '(no title)';
            const total = (g.querySelectorAll('.player-box') || []).length;
            const lanes = [];
            let rem = total;
            while (rem > 0) { lanes.push(Math.min(5, rem)); rem -= 5; }
            return { title, lanes };
          });
        } catch (e) { return { error: String(e && e.message) } }
      })();`,
        true
      );
      logger.info && logger.info('[LIVE_DUMP]', JSON.stringify(dump, null, 2));
      // MATCH_COLORS diagnostic removed — colors now computed by teams.js and
      // used by the match board. Keep the LIVE_DUMP and LIVE_HEADER diagnostics
      // above for general UI inspection.
      try {
        const headerInfo = await win.webContents.executeJavaScript(
          `(function(){
          const coachEl = document.getElementById('coachNameDisplay');
          const simulateBtn = document.getElementById('simulateBtnHub');
          const coachText = coachEl ? coachEl.textContent.trim() : null;
          const computed = simulateBtn ? window.getComputedStyle(simulateBtn) : null;
          const simStyles = computed
            ? { position: computed.position, left: computed.left, bottom: computed.bottom, transform: computed.transform }
            : null;
          return { coachText, simStyles };
        })();`,
          true
        );
        logger.info && logger.info('[LIVE_HEADER]', JSON.stringify(headerInfo, null, 2));
      } catch (e) {
        logger.error && logger.error('Live header dump failed:', e && e.message);
      }
      // Inject a persistent visual highlight so lanes are obvious in the running UI.
      try {
        // Remove any temporary highlight previously injected during debugging so UI looks normal
        await win.webContents.executeJavaScript(
          `(function(){ const ex = document.getElementById('__lane_highlight'); if(ex) ex.remove(); return true; })();`,
          true
        );
        logger.info && logger.info('[LIVE_HIGHLIGHT] removed');
      } catch (e) {
        logger.error && logger.error('Highlight removal failed:', e && e.message);
      }

      // Auto-trigger diagnostic (opt-in): only run if the environment variable
      // `ELECTRON_HALFTIME_CHECK=1` is present. This prevents the main process
      // from starting simulations automatically during normal developer runs.
      if (process.env.ELECTRON_HALFTIME_CHECK === '1') {
        try {
          const result = await win.webContents.executeJavaScript(
            `(async function(){
              try {
                const simBtn = document.getElementById('simulateBtnHub');
                if (simBtn && typeof simBtn.click === 'function') simBtn.click();
                // poll for subs-overlay visible or timeout
                const start = Date.now();
                const timeout = 12000; // 12s
                while (Date.now() - start < timeout) {
                  const ov = document.getElementById('subs-overlay');
                  if (ov && ov.style && ov.style.display !== 'none') {
                    const rect = ov.getBoundingClientRect ? ov.getBoundingClientRect() : null;
                    const confirmPrompt = ov.querySelector('.subs-confirm-prompt');
                    const confirmFixed = confirmPrompt ? (getComputedStyle(confirmPrompt).position === 'fixed') : null;
                    return { found: true, rect: rect ? {left:rect.left,top:rect.top,width:rect.width,height:rect.height} : null, confirmFixed };
                  }
                  await new Promise(r => setTimeout(r, 300));
                }
                return { found: false, reason: 'timeout' };
              } catch (e) { return { error: String(e && e.message) }; }
            })();`,
            true
          );
          logger.info && logger.info('[HALFTIME_CHECK]', JSON.stringify(result, null, 2));
        } catch (e) {
          logger.error && logger.error('Halftime overlay diagnostic failed:', e && e.message);
        }
      }
    } catch (e) {
      logger.error && logger.error('Live dump failed:', e && e.message);
    }

    // Note: removed automatic dev-mode opening of halftime substitution overlay
    // to avoid interfering with the match simulation (the overlay must only
    // appear when the simulation reaches the halftime minute).
  });
}

app.whenReady().then(() => {
  // Ensure Electron uses a writable userData path inside the project to avoid
  // cache creation permission errors on some systems.
  try {
    // Use a temp dir for userData to avoid permission issues on some machines
    const userDataPath = path.join(os.tmpdir(), 'elifoot-electron-userdata');
    app.setPath('userData', userDataPath);
  } catch (e) {
    logger.error && logger.error('Failed to set userData path:', e);
  }

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// small ipc helper to open devtools from renderer (if needed)
ipcMain.on('open-devtools', (ev) => {
  const w = BrowserWindow.fromWebContents(ev.sender);
  if (w) w.webContents.openDevTools();
});

// Expose app version on demand
ipcMain.handle('get-app-info', async () => ({
  version: app.getVersion(),
  path: app.getAppPath(),
}));