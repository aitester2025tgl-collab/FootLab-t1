/* eslint-disable no-console, no-unused-vars */
// smoke_test.js - programmatic smoke harness
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    // index.html remains at project root; smoke_test.js now lives in `src/`, so go up one level
    const filePath = path.resolve(__dirname, '..', 'index.html');
    let html = fs.readFileSync(filePath, 'utf8');

    // If per-team rosters exist under data/rosters, inject them inline into
    // the test HTML so jsdom page scripts can access window.REAL_ROSTERS
    // synchronously (avoids relying on dynamic loaders in the shim).
    try {
      const rosterIndexPath = path.resolve(__dirname, 'data', 'rosters', 'index.json');
      if (fs.existsSync(rosterIndexPath)) {
        const idx = JSON.parse(fs.readFileSync(rosterIndexPath, 'utf8'));
        let inline = ['<script>window.REAL_ROSTERS = window.REAL_ROSTERS || {};'];
        for (const teamName of Object.keys(idx)) {
          try {
            const fname = idx[teamName];
            const teamPath = path.resolve(__dirname, 'data', 'rosters', fname);
            if (!fs.existsSync(teamPath)) continue;
            const data = fs.readFileSync(teamPath, 'utf8');
            // read file content (JSON array) and assign to window.REAL_ROSTERS
            inline.push('window.REAL_ROSTERS[' + JSON.stringify(teamName) + '] = ' + data + ';');
          } catch (e) {
            /* skip team on error */
          }
        }
        inline.push('</script>');
        // prepend roster script to HTML so page scripts see rosters during parsing
        html = inline.join('\n') + '\n' + html;
      }
    } catch (e) {
      // non-fatal; continue without injecting rosters
      console.warn('smoke_test: could not inject rosters inline:', e && e.message);
    }

    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'file://' + filePath,
      // inject minimal browser APIs before any page scripts run
      beforeParse: function (window) {
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
              return setTimeout(function () {
                cb(Date.now());
              }, 0);
            };
          }
          if (typeof window.cancelAnimationFrame !== 'function') {
            window.cancelAnimationFrame = function (id) {
              clearTimeout(id);
            };
          }
          // Also ensure prototype-level alert/confirm are safe (some code calls through prototype)
          try {
            var p = Object.getPrototypeOf(window);
            if (p) {
              p.alert = p.alert || function () {};
              p.confirm =
                p.confirm ||
                function () {
                  return true;
                };
              p.prompt =
                p.prompt ||
                function () {
                  return null;
                };
            }
          } catch (e) {
            /* ignore */
          }
        } catch (e) {
          /* ignore */
        }
      },
    });

    const { window } = dom;
    console.log('DBG: window.alert after JSDOM beforeParse =', typeof window.alert);
    // minimal browser APIs not implemented by jsdom that app code may call
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
    } catch (e) {
      /* ignore */
    }
    const doc = window.document;

    // jsdom polyfills: provide requestAnimationFrame and a minimal localStorage to reduce noise
    try {
      if (typeof window.requestAnimationFrame !== 'function') {
        window.requestAnimationFrame = function (cb) {
          return setTimeout(function () {
            cb(Date.now());
          }, 0);
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
            getItem: function (k) {
              return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null;
            },
            setItem: function (k, v) {
              store[k] = String(v);
            },
            removeItem: function (k) {
              delete store[k];
            },
            clear: function () {
              store = {};
            },
          };
        })();
      }
    } catch (e) {
      /* ignore polyfill failures */
    }

    // capture console from the page; prefer test logger for harness output
    const logger = require('../tests/testLogger').getLogger();
    const origConsoleLog = console.log;
    window.console = {
      log: (...args) => {
        try {
          logger.info('[page]', ...args);
        } catch (e) {
          origConsoleLog('[page]', ...args);
        }
      },
      error: (...args) => {
        try {
          logger.error('[page][ERROR]', ...args);
        } catch (e) {
          origConsoleLog('[page][ERROR]', ...args);
        }
      },
      warn: (...args) => {
        try {
          logger.warn('[page][WARN]', ...args);
        } catch (e) {
          origConsoleLog('[page][WARN]', ...args);
        }
      },
    };

    await new Promise((resolve, reject) => {
      // wait for scripts to load
      window.addEventListener('load', () => setTimeout(resolve, 50));

      // timeout
      setTimeout(() => reject(new Error('Timeout waiting for page load')), 5000);
    });

    // Instead of dispatching UI events (which may trigger alert() calls in the
    // app and are not fully implemented in jsdom), initialize the minimal
    // runtime state programmatically. This mirrors the start button flow
    // without invoking DOM dialogs.
    try {
      // prefer namespaced exports when available
      const generateAllClubs =
        window.generateAllClubs || (window.Elifoot && window.Elifoot.generateAllClubs);
      const generateRounds =
        window.generateRounds || (window.Elifoot && window.Elifoot.generateRounds);
      const assignStartingLineups =
        window.assignStartingLineups || (window.Elifoot && window.Elifoot.assignStartingLineups);

      if (typeof generateAllClubs === 'function') {
        const allClubs = generateAllClubs();
        console.log(
          'DBG: generateAllClubs result type =',
          Array.isArray(allClubs) ? 'array' : typeof allClubs,
          'length=',
          Array.isArray(allClubs) ? allClubs.length : 'N/A'
        );
        const allDivisions = [[], [], [], []];
        allClubs.forEach((club) => {
          if (club.division >= 1 && club.division <= 4) {
            allDivisions[club.division - 1].push(club);
          }
        });

        const division4 = allDivisions[3] || [];
        const pool = division4.length > 8 ? division4.slice(-8) : division4.slice();
        const playerClub = pool.length
          ? pool[Math.floor(Math.random() * pool.length)]
          : allClubs[0] || null;

        window.Elifoot = window.Elifoot || {};
        window.playerClub = playerClub;
        window.Elifoot.playerClub = playerClub;
        window.Elifoot.allDivisions = allDivisions;

        if (typeof generateRounds === 'function') {
          const firstRoundMatches = [];
          allDivisions.forEach((divisionClubs) => {
            const rounds = generateRounds(divisionClubs);
            if (rounds && rounds.length) firstRoundMatches.push(...rounds[0]);
          });
          window.currentRoundMatches = firstRoundMatches;
          window.Elifoot.currentRoundMatches = firstRoundMatches;
          if (typeof assignStartingLineups === 'function') {
            try {
              assignStartingLineups(firstRoundMatches);
            } catch (e) {
              /* ignore */
            }
          }
        }
        // If generateAllClubs returned no clubs but we have matches, try to
        // recover a playerClub from the first match object so the smoke
        // harness can continue.
        if (
          !playerClub &&
          Array.isArray(window.currentRoundMatches) &&
          window.currentRoundMatches.length
        ) {
          try {
            const sample = window.currentRoundMatches[0];
            console.log('DBG: sample match keys =', Object.keys(sample));
            // common shapes: { home: { team... } }, {teamA/teamB}, {homeTeam}
            let candidate = null;
            if (sample.home && typeof sample.home === 'object') candidate = sample.home;
            else if (sample.homeTeam && typeof sample.homeTeam === 'object')
              candidate = sample.homeTeam;
            else if (sample.teamA && typeof sample.teamA === 'object') candidate = sample.teamA;
            else if (Array.isArray(sample.teams) && sample.teams.length)
              candidate = sample.teams[0];
            if (candidate) {
              window.playerClub = candidate;
              window.Elifoot.playerClub = candidate;
              console.log('DBG: recovered playerClub from match');
            }
          } catch (e) {
            /* ignore recovery errors */
          }
        }
      } else {
        logger.error('smoke_test: generateAllClubs not available; cannot initialize app state');
      }
    } catch (e) {
      logger.error('smoke_test: programmatic initialization failed', e && e.message);
    }

    // wait for playerClub and currentRoundMatches to be defined
    const maxWait = 5000;
    const pollInterval = 100;
    let waited = 0;
    const ok = await new Promise((resolve) => {
      const i = setInterval(() => {
        const el = window.Elifoot && window.Elifoot.playerClub;
        const matches = window.Elifoot && window.Elifoot.currentRoundMatches;
        if (el && Array.isArray(matches)) {
          clearInterval(i);
          resolve({ playerClub: el, matchesCount: matches.length });
        }
        waited += pollInterval;
        if (waited >= maxWait) {
          clearInterval(i);
          resolve(null);
        }
      }, pollInterval);
    });

    if (!ok) {
      logger.error('smoke_test: failed to initialize playerClub or matches');
      // dump some diagnostics
      logger.error('window.playerClub =', !!window.playerClub);
      logger.error('window.Elifoot =', !!window.Elifoot);
      try {
        logger.error(
          'window.currentRoundMatches type =',
          typeof window.currentRoundMatches,
          'isArray=',
          Array.isArray(window.currentRoundMatches),
          'length=',
          Array.isArray(window.currentRoundMatches) ? window.currentRoundMatches.length : 'N/A'
        );
      } catch (e) {
        /* ignore */
      }
      try {
        if (Array.isArray(window.currentRoundMatches) && window.currentRoundMatches.length)
          logger.error('sample match keys=', Object.keys(window.currentRoundMatches[0]));
      } catch (e) {
        /* ignore */
      }
      process.exit(3);
    }

    logger.info(
      'smoke_test: success — playerClub:',
      ok.playerClub.team ? ok.playerClub.team.name : '[no-name]',
      'matches:',
      ok.matchesCount
    );
    process.exit(0);
  } catch (err) {
    console.error('smoke_test error:', err);
    process.exit(1);
  }
})();
