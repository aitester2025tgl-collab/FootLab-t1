/* tools/screenshot_from_snapshot.js

  Use Puppeteer to load the local `index.html`, inject a saved snapshot into
  `localStorage` before page scripts run, then capture a PNG screenshot.

  Usage:
    1) Install Puppeteer locally: `npm install puppeteer --save-dev`
    2) Create or confirm a snapshot exists under `snapshots/` (e.g. from dump_snapshot.js)
    3) Run: `node tools/screenshot_from_snapshot.js [path/to/snapshot.json]`
       If no path provided, the script will pick the latest file in `snapshots/`.

  Notes:
    - Puppeteer will download Chromium on install; network access required.
    - The script opens the page via `file://` URL and injects `localStorage` via
      `page.evaluateOnNewDocument` so the app picks it up during initialization.
*/

/* global generateAllClubs, generateRounds */
/* eslint-disable no-empty, no-console */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function findLatestSnapshot(dir) {
  const files = fs
    .readdirSync(dir)
    .filter(
      (f) => f.startsWith('footlab_t1_save_snapshot') || f.startsWith('elifoot_save_snapshot')
    );
  if (!files || !files.length) return null;
  files.sort();
  return path.join(dir, files[files.length - 1]);
}

(async () => {
  try {
    const root = path.resolve(__dirname, '..');
    const outDir = path.join(root, 'snapshots');
    if (!fs.existsSync(outDir)) {
      console.error('No snapshots/ directory found. Run tools/dump_snapshot.js first.');
      process.exit(2);
    }

    // parse CLI args: flags like --all-menus or a snapshot path
    const rawArgs = process.argv.slice(2) || [];
    // remove flag values for flags that expect a value (currently only --delay-ms)
    const positional = [];
    for (let i = 0; i < rawArgs.length; i++) {
      const a = rawArgs[i];
      if (a === '--delay-ms') {
        i++;
        continue;
      } // skip the value token
      if (a.startsWith('-')) continue;
      positional.push(a);
    }
    const nonFlag = positional[0];
    let snapPath = nonFlag || (await findLatestSnapshot(outDir));
    if (!snapPath || !fs.existsSync(snapPath)) {
      console.error('Snapshot file not found:', snapPath);
      process.exit(2);
    }

    const raw = fs.readFileSync(snapPath, 'utf8');

    // raw may be either the raw localStorage string or a JSON envelope; pass string through
    const storageValue = raw;

    // lazy-require puppeteer so the script fails gracefully if not installed
    let puppeteer;
    try {
      puppeteer = require('puppeteer');
    } catch (e) {
      console.error(
        'Puppeteer not installed. Run `npm install puppeteer --save-dev` and try again.'
      );
      process.exit(2);
    }

    const indexPath = path.join(root, 'index.html');
    const fileUrl = 'file://' + indexPath;

    console.log('Starting headless Chromium (Puppeteer)...');
    const browser = await puppeteer.launch({ args: ['--disable-web-security'] });
    const page = await browser.newPage();

    // Collect page console messages and errors for diagnosis
    const consoleLines = [];
    page.on('console', (msg) => {
      try {
        const text = msg.text ? msg.text() : String(msg);
        consoleLines.push({ type: 'console', text, ts: Date.now() });
        console.log('PAGE LOG:', text);
      } catch (e) {}
    });
    page.on('pageerror', (err) => {
      try {
        const text = err && err.stack ? err.stack : String(err);
        consoleLines.push({ type: 'pageerror', text, ts: Date.now() });
        console.error('PAGE ERROR:', text);
      } catch (e) {}
    });
    page.on('error', (err) => {
      try {
        const text = err && err.stack ? err.stack : String(err);
        consoleLines.push({ type: 'error', text, ts: Date.now() });
        console.error('PAGE ERROR:', text);
      } catch (e) {}
    });

    // inject localStorage before any script executes (set both new and legacy keys)
    await page.evaluateOnNewDocument((value) => {
      try {
        localStorage.setItem('footlab_t1_save_snapshot', value);
      } catch (e) {}
      try {
        localStorage.setItem('elifoot_save_snapshot', value);
      } catch (e) {}
    }, storageValue);

    // Parse snapshot on the Node side and inject its payload into window globals
    let snapshotPayload = null;
    try {
      const parsed = JSON.parse(storageValue);
      snapshotPayload = parsed && parsed.payload ? parsed.payload : parsed;
    } catch (e) {
      try {
        snapshotPayload = JSON.parse(storageValue);
      } catch (err) {
        snapshotPayload = null;
      }
    }
    if (snapshotPayload) {
      await page.evaluateOnNewDocument((snap) => {
        try {
          window.currentJornada = snap.currentJornada;
          window.playerClub = snap.playerClub || window.playerClub;
          window.allDivisions = snap.allDivisions || window.allDivisions;
          window.allClubs = snap.allClubs || window.allClubs;
          window.currentRoundMatches = snap.currentRoundMatches || window.currentRoundMatches;
        } catch (e) {
          /* ignore */
        }
      }, snapshotPayload);
    }

    // Ensure the hub screen is visible and initial UI is initialized using the injected snapshot
    await page.evaluate(async (snap) => {
      try {
        // Hide intro/setup and show hub
        const intro = document.getElementById('intro-screen');
        const setup = document.getElementById('screen-setup');
        const hubScreen = document.getElementById('screen-hub');
        if (intro) intro.style.display = 'none';
        if (setup) setup.style.display = 'none';
        if (hubScreen) hubScreen.style.display = 'flex';

        // Apply some basic header text from snapshot
        try {
          if (snap && snap.playerClub && snap.playerClub.team) {
            const name = snap.playerClub.team.name || '';
            const coachEl = document.getElementById('coachNameDisplay');
            const teamEl = document.getElementById('playerTeamNameHub');
            const footerEl = document.getElementById('playerTeamNameFooter');
            if (coachEl && snap.coachName) coachEl.textContent = snap.coachName;
            if (teamEl) teamEl.textContent = name;
            if (footerEl) footerEl.textContent = name;
          }
        } catch (e) {
          /* ignore */
        }

        // If no snapshot was provided, try to generate a minimal game state using available generators
        try {
          if (!snap) {
            try {
              if (typeof generateAllClubs === 'function') {
                const all = generateAllClubs();
                window.allClubs = all;
                const divs = [[], [], [], []];
                all.forEach((c) => {
                  if (c && c.division >= 1 && c.division <= 4) divs[c.division - 1].push(c);
                });
                window.allDivisions = divs;
                // pick a club (prefer last division teams like the UI does)
                const pool =
                  divs[3] && divs[3].length > 8
                    ? divs[3].slice(-8)
                    : (divs[3] && divs[3].slice()) || [];
                const picked = pool.length ? pool[0] : all[0] || null;
                if (picked) window.playerClub = picked;
                // generate rounds if available
                if (typeof generateRounds === 'function' && Array.isArray(window.allDivisions)) {
                  const firstRoundMatches = [];
                  window.allDivisions.forEach((divisionClubs) => {
                    try {
                      const rounds = generateRounds(divisionClubs || []);
                      if (rounds && rounds[0]) firstRoundMatches.push(...rounds[0]);
                    } catch (e) {
                      /* ignore per-division errors */
                    }
                  });
                  window.currentRoundMatches = firstRoundMatches;
                }
              }
            } catch (e) {
              /* ignore generation errors */
            }
          }

          // If initHubUI is available, call it to attach handlers and render default content
          if (typeof window.initHubUI === 'function') {
            try {
              window.initHubUI();
            } catch (e) {
              /* ignore */
            }
          } else if (typeof window.renderHubContent === 'function') {
            try {
              window.renderHubContent('menu-team');
            } catch (e) {
              /* ignore */
            }
          }
        } catch (e) {
          /* ignore */
        }
      } catch (e) {
        /* ignore */
      }
    }, snapshotPayload || {});

    await page.goto(fileUrl, { waitUntil: 'load' });

    // wait a bit for in-page initialization (avoid API incompatibilities)
    // allow configuring this via CLI --delay-ms; default to 1000ms to give app time to render
    const cliArgsFull = process.argv.slice(2) || [];
    const delayArgIndex = cliArgsFull.indexOf('--delay-ms');
    const delayMs =
      delayArgIndex >= 0 && cliArgsFull[delayArgIndex + 1]
        ? parseInt(cliArgsFull[delayArgIndex + 1], 10)
        : 1000;
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // If the page didn't already set up a playerClub (no snapshot), simulate entering a coach name and clicking Start
    try {
      const hasPlayerClub = await page.evaluate(() => !!window.playerClub);
      if (!hasPlayerClub) {
        // show setup lightly and fill the coach name
        await page.evaluate(() => {
          try {
            const intro = document.getElementById('intro-screen');
            const setup = document.getElementById('screen-setup');
            if (intro) intro.style.display = 'none';
            if (setup) setup.style.display = 'flex';
            const hub = document.getElementById('screen-hub');
            if (hub) hub.style.display = 'none';
          } catch (e) {
            /* ignore */
          }
        });

        await page.waitForSelector('#coachName', { timeout: 1200 }).catch(() => null);
        const inputExists = await page.evaluate(() => !!document.getElementById('coachName'));
        if (inputExists) {
          await page.evaluate(() => {
            const el = document.getElementById('coachName');
            if (el) {
              el.value = 'AutoCoach';
              el.dispatchEvent(new Event('input', { bubbles: true }));
            }
          });
          await page.waitForSelector('#startBtn', { timeout: 1200 }).catch(() => null);
          await page.evaluate(() => {
            const b = document.getElementById('startBtn');
            if (b) b.click();
          });
          try {
            await page.waitForFunction(() => !!window.playerClub, {
              timeout: Math.max(3000, delayMs * 3),
            });
            await new Promise((r) => setTimeout(r, 400));
          } catch (e) {
            // fallback: attempt to initialize hub UI directly
            try {
              await page.evaluate(() => {
                if (typeof window.initHubUI === 'function') window.initHubUI();
                else if (typeof window.renderHubContent === 'function')
                  window.renderHubContent('menu-team');
              });
            } catch (er) {
              /* ignore */
            }
            await new Promise((r) => setTimeout(r, 600));
          }
        }
      }
    } catch (e) {
      /* ignore startup automation errors */
    }

    // If still no playerClub, try calling generateAllClubs directly (deterministic setup)
    try {
      const stillHas = await page.evaluate(() => !!window.playerClub);
      if (!stillHas) {
        const created = await page.evaluate(() => {
          try {
            const gen =
              window.generateAllClubs || (window.Elifoot && window.Elifoot.generateAllClubs);
            if (typeof gen === 'function') {
              const all = gen();
              window.allClubs = all;
              const divs = [[], [], [], []];
              all.forEach((c) => {
                if (c && c.division >= 1 && c.division <= 4) divs[c.division - 1].push(c);
              });
              window.allDivisions = divs;
              const pool =
                divs[3] && divs[3].length > 8
                  ? divs[3].slice(-8)
                  : (divs[3] && divs[3].slice()) || [];
              const picked = pool.length ? pool[0] : all[0] || null;
              if (picked) window.playerClub = picked;
              if (
                typeof window.generateRounds === 'function' &&
                Array.isArray(window.allDivisions)
              ) {
                const firstRoundMatches = [];
                window.allDivisions.forEach((divisionClubs) => {
                  try {
                    const rounds = window.generateRounds(divisionClubs || []);
                    if (rounds && rounds[0]) firstRoundMatches.push(...rounds[0]);
                  } catch (e) {}
                });
                window.currentRoundMatches = firstRoundMatches;
              }
              return !!window.playerClub;
            }
          } catch (e) {
            /* ignore */
          }
          return false;
        });
        if (created) {
          try {
            await page.evaluate(() => {
              if (typeof window.initHubUI === 'function') window.initHubUI();
              else if (typeof window.renderHubContent === 'function')
                window.renderHubContent('menu-team');
            });
          } catch (e) {
            /* ignore */
          }
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    } catch (e) {
      /* ignore */
    }

    // Stub blocking popups (like pending-releases) so menu clicks render immediately
    await page.evaluateOnNewDocument(() => {
      try {
        window.Offers = window.Offers || {};
        window.Offers._orig_showPendingReleasesPopup = window.Offers.showPendingReleasesPopup;
        window.Offers.showPendingReleasesPopup = function (cb) {
          try {
            if (typeof cb === 'function') cb();
          } catch (e) {
            /* ignore */
          }
        };
      } catch (e) {
        /* ignore */
      }
    });

    // Inject debug wrappers to record when key render functions are called.
    await page.evaluateOnNewDocument(() => {
      try {
        window.__screenshot_debug = window.__screenshot_debug || [];
        const toWrap = [
          { path: 'renderHubContent', label: 'renderHubContent' },
          { path: 'showIntroOverlay', label: 'showIntroOverlay' },
          { path: 'Offers.showPendingReleasesPopup', label: 'Offers.showPendingReleasesPopup' },
          {
            path: 'FootLab.Overlays.showHalfTimeSubsOverlay',
            label: 'Overlays.showHalfTimeSubsOverlay',
          },
        ];

        const tryWrapOnce = function () {
          toWrap.forEach((t) => {
            try {
              const parts = t.path.split('.');
              let obj = window;
              for (let i = 0; i < parts.length - 1; i++) {
                if (!obj[parts[i]]) return; // target not present yet
                obj = obj[parts[i]];
              }
              const name = parts[parts.length - 1];
              if (obj && obj[name] && !obj[name].__screenshot_wrapped) {
                const orig = obj[name];
                obj[name] = function () {
                  try {
                    window.__screenshot_debug.push({
                      fn: t.label,
                      args: Array.from(arguments),
                      ts: Date.now(),
                    });
                  } catch (e) {}
                  return orig.apply(this, arguments);
                };
                obj[name].__screenshot_wrapped = true;
              }
            } catch (e) {
              /* ignore */
            }
          });
        };

        // Try wrapping repeatedly while the page initializes; stop after a few seconds
        const sw = setInterval(tryWrapOnce, 120);
        document.addEventListener('DOMContentLoaded', () => {
          tryWrapOnce();
          setTimeout(() => clearInterval(sw), 5000);
        });
      } catch (e) {
        /* ignore */
      }
    });

    const tsBase = new Date().toISOString().replace(/[:.]/g, '-');

    // CLI flags
    const cliArgs = process.argv.slice(2) || [];
    const replaceMode = cliArgs.includes('--replace') || cliArgs.includes('--latest');

    // helper to capture with a friendly name; if replaceMode is true write without timestamp
    const capture = async (name, buffer) => {
      const filename = replaceMode ? `screenshot-${name}.png` : `screenshot-${name}-${tsBase}.png`;
      const outPng = path.join(outDir, filename);
      if (buffer) {
        fs.writeFileSync(outPng, buffer);
      } else {
        const buf = await page.screenshot({ fullPage: true });
        fs.writeFileSync(outPng, buf);
      }
      console.log('Wrote screenshot to', outPng);
    };

    const takeBuffer = async () => {
      return await page.screenshot({ fullPage: true });
    };

    const hashBuffer = (buf) => {
      return crypto.createHash('sha256').update(buf).digest('hex');
    };

    // If replaceMode, remove previous fixed-name screenshots to avoid clutter
    if (replaceMode) {
      try {
        const existing = fs
          .readdirSync(outDir)
          .filter((f) => f.startsWith('screenshot-') && f.endsWith('.png') && !f.includes(tsBase));
        for (const f of existing) {
          // only remove fixed-name files (no timestamp) to be safe
          if (!/-\d{4}-\d{2}-\d{2}T/.test(f)) {
            const p = path.join(outDir, f);
            try {
              fs.unlinkSync(p);
            } catch (e) {
              /* ignore */
            }
          }
        }
      } catch (e) {
        /* ignore cleanup errors */
      }
    }

    const args = process.argv.slice(2);
    const allMenus = args.includes('--all-menus');

    if (!allMenus) {
      // default: capture the full page once
      await capture('fullpage');
    } else {
      // Sequence of common hub menus and overlays to capture
      const seq = [
        { name: 'hub-team', click: '#menu-team' },
        { name: 'hub-liga', click: '#menu-liga' },
        { name: 'hub-next-match', click: '#menu-next-match' },
        { name: 'hub-standings', click: '#menu-standings' },
        { name: 'hub-transfers', click: '#menu-transfers' },
        { name: 'hub-finance', click: '#menu-finance' },
        {
          name: 'hub-tactics',
          click: '#menu-team',
          after:
            "(function(){var el=document.querySelector('#hub-tactic-panel'); if(el) el.scrollIntoView();})();",
        },
        {
          name: 'intro-overlay',
          eval: "if (typeof showIntroOverlay === 'function') { try { showIntroOverlay(window.playerClub || null, function(){}); } catch(e){} }",
          overlay: true,
        },
        {
          name: 'half-time-subs',
          eval: "if ((window.FootLab && window.FootLab.Overlays && typeof window.FootLab.Overlays.showHalfTimeSubsOverlay === 'function') || (window.Elifoot && window.Elifoot.Overlays && typeof window.Elifoot.Overlays.showHalfTimeSubsOverlay === 'function')) { try { var match = (window.currentRoundMatches && window.currentRoundMatches[0]) || null; (window.FootLab && window.FootLab.Overlays && typeof window.FootLab.Overlays.showHalfTimeSubsOverlay === 'function' ? window.FootLab.Overlays.showHalfTimeSubsOverlay : window.Elifoot.Overlays.showHalfTimeSubsOverlay)(window.playerClub || null, match, function(){}); } catch(e){} }",
          overlay: true,
        },
        {
          name: 'offers-popup',
          eval: "if (window.Offers && typeof window.Offers.showPendingReleasesPopup === 'function') { try { window.Offers.showPendingReleasesPopup(function(){}); } catch(e){} }",
          overlay: true,
        },
      ];

      // helper to hide common overlay elements so they don't block captures
      const hideAllOverlays = async () => {
        await page.evaluate(() => {
          const sels = [
            '#intro-overlay',
            '#subs-overlay',
            '.transfer-overlay-root',
            '.subs-panel',
            '.subs-overlay',
            '.subs-confirm-prompt',
            '.offers-popup',
          ];
          sels.forEach((s) => {
            const el = document.querySelector(s);
            if (el && el.style) el.style.display = 'none';
          });
          // also remove modal-like backdrops
          const backs = document.querySelectorAll('.modal-backdrop, .overlay-backdrop');
          backs.forEach((b) => {
            if (b && b.style) b.style.display = 'none';
          });
        });
        // slight delay to allow UI to settle
        await new Promise((r) => setTimeout(r, 120));
      };

      // Wait for the hub content to change and become stable.
      const waitForHubContentChange = async (timeoutMs, stableMs) => {
        const sel = '#hub-main-content';
        const start = Date.now();
        let last = await page.evaluate((s) => {
          const el = document.querySelector(s);
          return el ? el.innerHTML : '';
        }, sel);
        let stableSince = Date.now();
        while (Date.now() - start < timeoutMs) {
          await new Promise((r) => setTimeout(r, 120));
          const cur = await page.evaluate((s) => {
            const el = document.querySelector(s);
            return el ? el.innerHTML : '';
          }, sel);
          if (cur !== last) {
            last = cur;
            stableSince = Date.now();
            continue;
          }
          if (Date.now() - stableSince >= stableMs) return true;
        }
        return false;
      };

      // Wait for any known overlay selector to appear (for overlay steps)
      const waitForAnyOverlay = async (timeoutMs) => {
        const sels = [
          '#intro-overlay',
          '#subs-overlay',
          '.transfer-overlay-root',
          '.offers-popup',
          '.subs-panel',
          '.subs-overlay',
        ];
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
          const found = await page.evaluate(
            (ss) => ss.some((s) => !!document.querySelector(s)),
            sels
          );
          if (found) return true;
          await new Promise((r) => setTimeout(r, 120));
        }
        return false;
      };

      for (const step of seq) {
        // Take an intermediate 'before' screenshot and hash it (capture current state before interaction)
        let beforeBuf = await takeBuffer();
        const beforeHash = hashBuffer(beforeBuf);
        // collect lightweight DOM diagnostics before the interaction
        let diagBefore = {};
        try {
          diagBefore = await page.evaluate(() => {
            const el = document.querySelector('#hub-main-content');
            return {
              innerHTMLLen: el ? el.innerHTML.length : 0,
              textSnippet: el ? (el.innerText || '').slice(0, 400) : null,
              childCount: el ? el.children.length : 0,
              firstChildTag: el && el.firstElementChild ? el.firstElementChild.tagName : null,
              firstChildClass: el && el.firstElementChild ? el.firstElementChild.className : null,
            };
          });
        } catch (e) {
          diagBefore = { error: String(e) };
        }

        try {
          // hide overlays unless this step intends to show one
          if (!step.overlay) await hideAllOverlays();

          if (step.click) {
            // Prefer calling renderHubContent directly when available (more deterministic)
            try {
              const menuId = (step.click || '').replace(/^#/, '');
              const rendered = await page.evaluate((m) => {
                try {
                  if (typeof window.renderHubContent === 'function') {
                    window.renderHubContent(m);
                    return true;
                  }
                } catch (e) {
                  /* ignore */
                }
                return false;
              }, menuId);

              if (!rendered) {
                // fallback to clicking the menu button so event handlers run as in UI
                const sel = step.click;
                await page.waitForSelector(sel, { timeout: 800 }).catch(() => null);
                const el = await page.$(sel);
                if (el) {
                  try {
                    await el.evaluate((e) =>
                      e.scrollIntoView({ block: 'center', inline: 'center' })
                    );
                  } catch (e) {}
                  try {
                    await page.click(sel);
                  } catch (e) {
                    /* ignore */
                  }
                } else {
                  // fallback to DOM click
                  try {
                    await page.evaluate((s) => {
                      const el = document.querySelector(s);
                      if (el) el.click();
                    }, sel);
                  } catch (e) {}
                }
              }
            } catch (e) {
              /* ignore click/render errors */
            }
            if (step.after) {
              try {
                await page.evaluate(step.after);
              } catch (e) {}
            }
          }
          if (step.eval) {
            try {
              await page.evaluate(step.eval);
            } catch (e) {
              /* ignore */
            }
          }
        } catch (e) {
          // ignore individual failures
        }
        // Wait for content changes rather than an arbitrary fixed timeout.
        const timeoutMs = Math.max(3000, delayMs * 3);
        const stableMs = 400;
        try {
          if (!step.overlay) {
            await waitForHubContentChange(timeoutMs, stableMs);
          } else {
            await waitForAnyOverlay(timeoutMs);
          }
        } catch (e) {
          // fall back to short fixed delay on unexpected errors
          await new Promise((r) => setTimeout(r, Math.max(500, delayMs)));
        }

        // after the wait, capture 'after' buffer and compare
        let afterBuf = await takeBuffer();
        let afterHash = hashBuffer(afterBuf);
        // collect lightweight DOM diagnostics after the interaction
        let diagAfter = {};
        try {
          diagAfter = await page.evaluate(() => {
            const el = document.querySelector('#hub-main-content');
            return {
              innerHTMLLen: el ? el.innerHTML.length : 0,
              textSnippet: el ? (el.innerText || '').slice(0, 400) : null,
              childCount: el ? el.children.length : 0,
              firstChildTag: el && el.firstElementChild ? el.firstElementChild.tagName : null,
              firstChildClass: el && el.firstElementChild ? el.firstElementChild.className : null,
            };
          });
        } catch (e) {
          diagAfter = { error: String(e) };
        }

        // If hashes equal, do a few incremental retries (give more time for async renders)
        let retries = 0;
        const maxRetries = 3;
        let extraDelay = delayMs;
        while (beforeHash === afterHash && retries < maxRetries) {
          retries++;
          const backoff = extraDelay * Math.pow(1.5, retries);
          await new Promise((r) => setTimeout(r, Math.min(backoff, 5000)));
          afterBuf = await takeBuffer();
          afterHash = hashBuffer(afterBuf);
        }

        if (beforeHash !== afterHash) {
          // visual change detected
          await capture(step.name, afterBuf);
        } else {
          // no visual change detected after retries; save afterBuf anyway and log warning
          console.warn(
            'Warning: no visible change detected for step',
            step.name,
            '- saving capture anyway'
          );
          await capture(step.name, afterBuf);
        }

        // export any in-page debug logs captured by our wrappers
        try {
          const dbg = await page.evaluate(() => (window.__screenshot_debug || []).slice(0, 200));
          if (dbg && dbg.length) {
            const dbgPath = path.join(outDir, `screenshot-${step.name}-debug.json`);
            try {
              fs.writeFileSync(dbgPath, JSON.stringify(dbg, null, 2), 'utf8');
              console.log('Wrote debug log to', dbgPath);
            } catch (e) {
              /* ignore */
            }
          }
        } catch (e) {
          /* ignore */
        }

        // write diagnostics for before/after DOM snapshot
        try {
          const diagPath = path.join(outDir, `screenshot-${step.name}-diag.json`);
          const payload = { before: diagBefore, after: diagAfter, beforeHash, afterHash };
          try {
            fs.writeFileSync(diagPath, JSON.stringify(payload, null, 2), 'utf8');
            console.log('Wrote diag to', diagPath);
          } catch (e) {
            /* ignore */
          }
        } catch (e) {
          /* ignore */
        }
      }
    }

    await browser.close();
    // dump collected page console/errors to disk for inspection
    try {
      if (consoleLines && consoleLines.length) {
        const logPath = path.join(outDir, `startup-console-${tsBase}.json`);
        fs.writeFileSync(logPath, JSON.stringify(consoleLines, null, 2), 'utf8');
        console.log('Wrote page console log to', logPath);
      }
    } catch (e) {
      /* ignore */
    }
  } catch (e) {
    console.error('Failed to capture screenshot:', e && e.stack ? e.stack : e);
    process.exit(2);
  }
})();
