/* tools/dump_snapshot.js
   Run a lightweight JSDOM harness that loads `index.html`, waits for `load`,
   reads `localStorage` keys `elifoot_save_snapshot` and `elifoot_debug_snapshot`,
   and writes them to `snapshots/` for inspection.

   Usage: node tools/dump_snapshot.js
*/

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const root = path.resolve(__dirname, '..');
    const indexPath = path.join(root, 'index.html');
    const html = fs.readFileSync(indexPath, 'utf8');

    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'file://' + indexPath,
      beforeParse(window) {
        try {
          window.alert = window.alert || function () {};
          window.confirm =
            window.confirm ||
            function () {
              return true;
            };
          window.prompt =
            window.prompt ||
            function () {
              return null;
            };

          if (typeof window.requestAnimationFrame !== 'function') {
            window.requestAnimationFrame = function (cb) {
              return setTimeout(() => cb(Date.now()), 0);
            };
          }
          if (typeof window.cancelAnimationFrame !== 'function') {
            window.cancelAnimationFrame = function (id) {
              clearTimeout(id);
            };
          }

          if (typeof window.localStorage === 'undefined' || !window.localStorage) {
            (function () {
              let store = {};
              window.localStorage = {
                getItem(k) {
                  return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null;
                },
                setItem(k, v) {
                  store[k] = String(v);
                },
                removeItem(k) {
                  delete store[k];
                },
                clear() {
                  store = {};
                },
              };
            })();
          }
        } catch (e) {
          /* ignore */
        }
      },
    });

    const { window } = dom;
    console.log('Loading page (JSDOM)...');

    await new Promise((resolve, reject) => {
      let settled = false;
      const onLoad = () => {
        if (settled) return;
        settled = true;
        // allow a small delay for async in-page tasks
        setTimeout(resolve, 100);
      };
      window.addEventListener('load', onLoad);
      // fallback timeout
      setTimeout(() => {
        if (settled) return;
        settled = true;
        resolve();
      }, 5000);
    });

    // read snapshot keys
    const ls = window.localStorage || {};
    const saveRaw = typeof ls.getItem === 'function' ? ls.getItem('elifoot_save_snapshot') : null;
    const debugRaw = typeof ls.getItem === 'function' ? ls.getItem('elifoot_debug_snapshot') : null;

    const args = process.argv.slice(2);
    const mode = args.includes('--both') ? 'both' : args.includes('--pretty') ? 'pretty' : 'raw';

    const outDir = path.join(root, 'snapshots');
    fs.mkdirSync(outDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');

    // Always write raw when mode === 'raw' or 'both'
    if (mode === 'raw' || mode === 'both') {
      const savePath = path.join(outDir, `elifoot_save_snapshot-${ts}.json`);
      fs.writeFileSync(savePath, saveRaw || 'null', 'utf8');
      console.log('Wrote save snapshot (raw) to', savePath);
    }

    // Pretty output when requested; attempt to parse JSON and pretty-print.
    if (mode === 'pretty' || mode === 'both') {
      try {
        const parsed = saveRaw ? JSON.parse(saveRaw) : null;
        const prettyPath = path.join(outDir, `elifoot_save_snapshot-pretty-${ts}.json`);
        fs.writeFileSync(prettyPath, JSON.stringify(parsed, null, 2), 'utf8');
        console.log('Wrote save snapshot (pretty) to', prettyPath);
      } catch (e) {
        // Not valid JSON? write a wrapper so the string is still inspectable.
        try {
          const prettyPath = path.join(outDir, `elifoot_save_snapshot-pretty-${ts}.json`);
          fs.writeFileSync(prettyPath, JSON.stringify({ raw: String(saveRaw) }, null, 2), 'utf8');
          console.log('Wrote save snapshot (wrapped raw) to', prettyPath);
        } catch (ee) {
          console.warn('Could not write pretty snapshot:', ee && ee.message);
        }
      }
    }

    if (debugRaw) {
      if (mode === 'raw' || mode === 'both') {
        const debugPath = path.join(outDir, `elifoot_debug_snapshot-${ts}.json`);
        fs.writeFileSync(debugPath, debugRaw, 'utf8');
        console.log('Wrote debug snapshot (raw) to', debugPath);
      }
      if (mode === 'pretty' || mode === 'both') {
        try {
          const parsed = JSON.parse(debugRaw);
          const debugPretty = path.join(outDir, `elifoot_debug_snapshot-pretty-${ts}.json`);
          fs.writeFileSync(debugPretty, JSON.stringify(parsed, null, 2), 'utf8');
          console.log('Wrote debug snapshot (pretty) to', debugPretty);
        } catch (e) {
          const debugPretty = path.join(outDir, `elifoot_debug_snapshot-pretty-${ts}.json`);
          fs.writeFileSync(debugPretty, JSON.stringify({ raw: String(debugRaw) }, null, 2), 'utf8');
          console.log('Wrote debug snapshot (wrapped raw) to', debugPretty);
        }
      }
    } else {
      console.log('No debug snapshot present (key `elifoot_debug_snapshot` not found).');
    }

    console.log('Done. Open the files in the `snapshots/` folder to inspect JSON payloads.');
  } catch (e) {
    console.error('Failed to dump snapshot:', e && e.stack ? e.stack : e);
    process.exit(2);
  }
})();
