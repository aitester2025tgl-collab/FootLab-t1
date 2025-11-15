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
        // minimal browser shims
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
          // enable auto-processing of pending releases for this test run
          try {
            window.GameConfig = window.GameConfig || {};
            window.GameConfig.transfer = window.GameConfig.transfer || {};
            window.GameConfig.transfer.autoProcessPendingReleases = true;
            // enable debug so console.debug outputs are visible in node
            window.GameConfig.transfer.debugPurchases = true;
          } catch (e) {
            /* ignore */
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

    await new Promise((resolve, reject) => {
      window.addEventListener('load', () => setTimeout(resolve, 50));
      setTimeout(() => reject(new Error('timeout waiting for load')), 5000);
    });

    // Initialize minimal runtime state similar to smoke_test
    try {
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
        const division4 = allDivisions[3] || [];
        const pool = division4.length > 8 ? division4.slice(-8) : division4.slice();
        const playerClub = pool.length
          ? pool[Math.floor(Math.random() * pool.length)]
          : allClubs[0] || null;
        window.Elifoot = window.Elifoot || {};
        window.playerClub = playerClub;
        window.Elifoot.playerClub = playerClub;
        window.Elifoot.allDivisions = allDivisions;
        window.allDivisions = allDivisions;
        window.allClubs = allClubs;

        if (typeof generateRounds === 'function') {
          const firstRoundMatches = [];
          allDivisions.forEach((divisionClubs) => {
            const rounds = generateRounds(divisionClubs);
            if (rounds && rounds.length) firstRoundMatches.push(...rounds[0]);
          });
          window.currentRoundMatches = firstRoundMatches;
          if (typeof assignStartingLineups === 'function') {
            try {
              assignStartingLineups(firstRoundMatches);
            } catch (e) {
              /* ignore */
            }
          }
        }
      } else {
        console.error('generateAllClubs not available');
      }
    } catch (e) {
      console.error('init failed', e && e.message);
    }

    // Now invoke finishDayAndReturnToHub to trigger end-of-day logic (promotions, seasonal drift, and our selection hooks)
    if (typeof window.finishDayAndReturnToHub === 'function') {
      try {
        window.finishDayAndReturnToHub();
      } catch (e) {
        // some UI code may access DOM elements; ignore errors
      }
    } else if (
      typeof window.Simulation !== 'undefined' &&
      typeof window.Simulation.finishDayAndReturnToHub === 'function'
    ) {
      try {
        window.Simulation.finishDayAndReturnToHub();
      } catch (e) {
        /* ignore */
      }
    } else {
      console.error('finishDayAndReturnToHub not found');
    }

    // wait briefly for selection functions to run
    await new Promise((r) => setTimeout(r, 50));

    const pending = window.PENDING_RELEASES || [];
    console.log('PENDING_RELEASES count =', pending.length);
    try {
      console.log(
        'PENDING_RELEASES sample =',
        pending
          .map((p) => ({
            id: p && p.id,
            name: p && p.name,
            previousClubName: p && p.previousClubName,
            leavingFee: p && p.leavingFee,
          }))
          .slice(0, 20)
      );
    } catch (e) {
      console.log('Could not stringify pending releases', e && e.message);
    }

    // Post-processing summary: show FREE_TRANSFERS and a few club rosters to detect moves
    try {
      const free = window.FREE_TRANSFERS || [];
      console.log('FREE_TRANSFERS count =', free.length);
      try {
        console.log(
          'FREE_TRANSFERS sample =',
          (free || [])
            .map((p) => ({ id: p && p.id, name: p && p.name, minContract: p && p.minContract }))
            .slice(0, 20)
        );
      } catch (e) {
        console.log('Could not stringify free transfers', e && e.message);
      }

      // Print a small roster snapshot for the first few clubs
      const clubs = window.allClubs || window.ALL_CLUBS || [];
      console.log('Clubs snapshot (first 8):');
      for (let i = 0; i < Math.min(8, clubs.length); i++) {
        const c = clubs[i];
        try {
          const names =
            c && c.team && Array.isArray(c.team.players)
              ? c.team.players.map((pl) => pl && (pl.name || pl.id)).slice(-5)
              : [];
          console.log(
            `#${i + 1}:`,
            (c && c.team && c.team.name) || c.name || 'Unnamed',
            'players=',
            c && c.team && Array.isArray(c.team.players) ? c.team.players.length : 0,
            'recent=',
            names
          );
        } catch (e) {
          console.log('#', i + 1, 'club snapshot failed', e && e.message);
        }
      }
    } catch (e) {
      console.log('post-processing summary failed', e && e.message);
    }

    // FOR TESTING: force a single deterministic purchase of the first pending release
    try {
      const pendingAll = window.PENDING_RELEASES || [];
      if (Array.isArray(pendingAll) && pendingAll.length > 0) {
        const p0 = pendingAll[0];
        // find a buyer club that is not the original club and has enough budget
        const clubs = window.allClubs || window.ALL_CLUBS || [];
        const buyer = clubs.find((c) => {
          if (!c || !c.team) return false;
          if (
            p0.originalClubRef &&
            (c === p0.originalClubRef ||
              (c.team && p0.originalClubRef.team && c.team === p0.originalClubRef.team))
          )
            return false;
          return Number(c.budget || 0) >= Number(p0.leavingFee || 0);
        });
        if (buyer) {
          // simulate paying the leaving fee and moving player
          const fee = Number(p0.leavingFee || 0);
          try {
            // find seller
            let seller = p0.originalClubRef || null;
            // try find real player in seller roster
            let realPlayer = null;
            if (seller && seller.team && Array.isArray(seller.team.players)) {
              realPlayer = seller.team.players.find(
                (pp) => (pp && pp.id && p0.id && pp.id === p0.id) || (pp && pp.name === p0.name)
              );
            }
            // move budgets
            buyer.budget = Math.max(0, Number(buyer.budget || 0) - fee);
            if (seller) seller.budget = Number(seller.budget || 0) + fee;
            // remove from seller roster
            if (realPlayer && seller && seller.team && Array.isArray(seller.team.players)) {
              const ridx = seller.team.players.findIndex(
                (pp) =>
                  pp === realPlayer ||
                  (pp && p0.id && pp.id === p0.id) ||
                  (pp && pp.name === p0.name)
              );
              if (ridx >= 0) seller.team.players.splice(ridx, 1);
            }
            const playerToAdd = realPlayer || Object.assign({}, p0);
            playerToAdd.salary = Math.max(1, Number(p0.previousSalary || 500));
            playerToAdd.contractYears = 1;
            playerToAdd.contractYearsLeft = 1;
            buyer.team.players = buyer.team.players || [];
            buyer.team.players.push(playerToAdd);
            // remove from pending
            if (Array.isArray(window.PENDING_RELEASES) && window.PENDING_RELEASES.length)
              window.PENDING_RELEASES.splice(0, 1);
            console.log('FORCED TEST PURCHASE: ', {
              player: playerToAdd && (playerToAdd.name || playerToAdd.id),
              buyer: (buyer && buyer.team && buyer.team.name) || buyer.name,
              fee,
            });
          } catch (e) {
            console.log('Forced purchase failed:', e && e.message);
          }
        } else {
          console.log('No suitable buyer found for forced test purchase');
        }
      }
    } catch (e) {
      console.log('forced purchase step failed', e && e.message);
    }

    process.exit(0);
  } catch (err) {
    console.error('run_one_day error:', err && err.message);
    process.exit(2);
  }
})();
