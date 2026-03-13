/* eslint-disable no-console, no-unused-vars */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const filePath = path.resolve(__dirname, '..', 'index.html');
    let html = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'file://' + filePath,
      beforeParse(window) {
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
        if (typeof window.localStorage === 'undefined') {
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
      },
    });

    const { window } = dom;

    await new Promise((resolve, reject) => {
      window.addEventListener('load', () => setTimeout(resolve, 50));
      setTimeout(() => reject(new Error('timeout waiting for load')), 5000);
    });

    // init minimal runtime similar to smoke helper
    const generateAllClubs =
      window.generateAllClubs || (window.Elifoot && window.Elifoot.generateAllClubs);
    const generateRounds =
      window.generateRounds || (window.Elifoot && window.Elifoot.generateRounds);
    const assignStartingLineups =
      window.assignStartingLineups || (window.Elifoot && window.Elifoot.assignStartingLineups);

    if (typeof generateAllClubs === 'function') {
      const allClubs = generateAllClubs();
      const allDivisions = [[], [], [], []];
      allClubs.forEach((c) => {
        if (c && c.division >= 1 && c.division <= 4) allDivisions[c.division - 1].push(c);
      });
      window.Elifoot = window.Elifoot || {};
      const division4 = allDivisions[3] || [];
      const pool = division4.length > 8 ? division4.slice(-8) : division4.slice();
      const playerClub = pool.length
        ? pool[Math.floor(Math.random() * pool.length)]
        : allClubs[0] || null;
      window.playerClub = playerClub;
      window.Elifoot.playerClub = playerClub;
      window.Elifoot.allDivisions = allDivisions;
      window.allDivisions = allDivisions;
      window.allClubs = allClubs;
      if (typeof generateRounds === 'function') {
        const firstRoundMatches = [];
        allDivisions.forEach((div) => {
          const rounds = generateRounds(div);
          if (rounds && rounds.length) firstRoundMatches.push(...rounds[0]);
        });
        window.currentRoundMatches = firstRoundMatches;
        if (typeof assignStartingLineups === 'function')
          try {
            assignStartingLineups(firstRoundMatches);
          } catch (e) {
            /* ignore */
          }
      }
    } else {
      console.error('generateAllClubs not available');
      process.exit(2);
    }

    // call finish day
    if (typeof window.finishDayAndReturnToHub === 'function')
      try {
        window.finishDayAndReturnToHub();
      } catch (e) {
        /* ignore */
      }
    else if (window.Simulation && typeof window.Simulation.finishDayAndReturnToHub === 'function')
      try {
        window.Simulation.finishDayAndReturnToHub();
      } catch (e) {
        /* ignore */
      }
    else {
      console.error('finishDayAndReturnToHub not found');
      process.exit(2);
    }

    // wait a bit
    await new Promise((r) => setTimeout(r, 60));

    const cfg = (window.GameConfig && window.GameConfig.transfer) || {};
    const clubCount = Array.isArray(window.allClubs) ? window.allClubs.length : 0;
    const baseTargetDefault = Math.max(2, Math.min(6, Math.floor(clubCount / 12) || 2));
    const earlyJornadas = typeof cfg.earlyJornadas === 'number' ? cfg.earlyJornadas : 6;
    const jornada = Number(window.currentJornada || 1);
    const target =
      jornada <= earlyJornadas
        ? typeof cfg.minPendingReleasesEarly === 'number'
          ? cfg.minPendingReleasesEarly
          : Math.max(baseTargetDefault, 3)
        : typeof cfg.minPendingReleases === 'number'
          ? cfg.minPendingReleases
          : baseTargetDefault;

    const pending = window.PENDING_RELEASES || [];
    console.log('Test: target =', target, 'pending =', pending.length);
    if ((pending.length || 0) < target) {
      console.error('FAIL: pending releases below target');
      process.exit(1);
    }
    console.log('PASS: pending releases >= target');
    process.exit(0);
  } catch (err) {
    console.error('pending_releases_smoke_test failed:', err && err.message);
    process.exit(3);
  }
})();
