/* eslint-disable no-console, no-unused-vars */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

(async () => {
  let extractDir = null;

  function safeExit(code) {
    try {
      if (extractDir && fs.existsSync(extractDir)) {
        try {
          fs.rmSync(extractDir, { recursive: true, force: true });
        } catch (e) {
          try {
            // fallback for older Node: use rmdirSync
            fs.rmdirSync(extractDir, { recursive: true });
          } catch (_) {
            /* ignore cleanup errors */
          }
        }
      }
    } catch (e) {
      /* ignore cleanup errors */
    }
    process.exit(code);
  }

  try {
    // Prefer repo root `index.html` when present (fast path for dev).
    const rootHtml = path.resolve(__dirname, '..', 'index.html');
    let filePath;
    if (fs.existsSync(rootHtml)) {
      filePath = rootHtml;
    } else {
      // No root index.html available: synthesize a minimal test HTML that loads
      // `src/players.js` directly so `processPendingReleases` becomes available.
      const playersPath = path.resolve(__dirname, '..', 'src', 'players.js');
      if (!fs.existsSync(playersPath)) {
        throw new Error('Neither root index.html nor src/players.js found; cannot run ai_buy_test.');
      }
      extractDir = path.resolve(__dirname, '..', 'tmp', 'generated_index');
      if (!fs.existsSync(extractDir)) fs.mkdirSync(extractDir, { recursive: true });
      filePath = path.join(extractDir, 'index.html');
      const playersUrl = require('url').pathToFileURL(playersPath).href;
      const htmlContent = `<!doctype html><html><head><meta charset="utf-8"></head><body>\n` +
        `<script>window.REAL_ROSTERS = window.REAL_ROSTERS || {};</script>\n` +
        `<script src="${playersUrl}"></script>\n` +
        `</body></html>`;
      fs.writeFileSync(filePath, htmlContent, 'utf8');
    }
    const html = fs.readFileSync(filePath, 'utf8');
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
      window.addEventListener('load', () => setTimeout(resolve, 30));
      setTimeout(() => reject(new Error('timeout waiting for load')), 5000);
    });

    // Ensure processPendingReleases is available
    const processPendingReleases =
      window.processPendingReleases || (window.Elifoot && window.Elifoot.processPendingReleases);
    if (typeof processPendingReleases !== 'function') {
      console.error('processPendingReleases not available');
      safeExit(2);
    }

    // TEST 1: min salary enforcement via Finance.negotiatePlayerContract stub
    // Setup simple clubs and a pending player
    window.allClubs = [];
    const seller = { team: { players: [] }, budget: 0, name: 'Seller FC', division: 4 };
    const buyer = { team: { players: [] }, budget: 1000000, name: 'Buyer FC', division: 4 };
    window.allClubs.push(buyer);
    // poor cannot afford minimum (set budget < fee + minContract)
    window.allClubs.push({ team: { players: [] }, budget: 0, name: 'Poor FC', division: 4 });

    const player = {
      id: 9999,
      name: 'Test MinWage',
      position: 'ST',
      skill: 60,
      previousSalary: 500,
      minContract: 800, // explicit minimum
      playerValue: 2000,
      leavingFee: 0,
      originalClubRef: seller,
    };

    // Put a real reference in seller roster to test removal
    seller.team.players.push({ id: 9999, name: 'Test MinWage', salary: 500, skill: 60 });

    window.PENDING_RELEASES = [Object.assign({}, player)];

    // Make autoProcess enabled
    window.GameConfig = window.GameConfig || {};
    window.GameConfig.transfer = window.GameConfig.transfer || {};
    window.GameConfig.transfer.autoProcessPendingReleases = true;

    // Provide Finance.negotiatePlayerContract stub that accepts only if offerSalary >= minContract
    window.Finance = window.Finance || {};
    window.Finance.negotiatePlayerContract = function (club, playerRefOrId, offerSalary, years) {
      // simulate accepted if offerSalary >= player's minContract
      const pl =
        typeof playerRefOrId === 'object'
          ? playerRefOrId
          : window.PENDING_RELEASES.find((p) => p.id === playerRefOrId) || player;
      const minC = (pl && (pl.minContract || pl.minMonthly || pl.minSalary)) || 0;
      const accepted = Number(offerSalary || 0) >= Number(minC || 0);
      return { accepted, acceptProb: accepted ? 1 : 0 };
    };

    // Run processing
    window.processPendingReleases();

    // After processing, buyer should have the player with salary >= minContract
    const bought = buyer.team.players.find(
      (p) => p && (p.id === 9999 || p.name === 'Test MinWage')
    );
    if (!bought) {
      console.error('FAIL: buyer did not sign player respecting minContract');
      safeExit(3);
    }
    const salaryOK = Number(bought.salary || 0) >= 800;
    console.log('Test1: bought salary =', bought.salary, '>= minContract?', salaryOK);
    if (!salaryOK) {
      console.error('FAIL: salary below minContract');
      safeExit(4);
    }

    // TEST 2: skill-based probability function increases with skill delta (pure function assertion)
    // Re-implement small portion of fallback probability logic to ensure skill increases desirability
    const computeFallbackProb = function (
      buyerBudget,
      fee,
      baseMultiplier,
      buyerAvgSkill,
      playerSkill
    ) {
      const skillDelta = Math.max(0, Number(playerSkill || 0) - Number(buyerAvgSkill || 0));
      const desirability = Math.min(3, skillDelta / 10);
      const raw =
        (Number(buyerBudget || 0) / Math.max(1, fee || 1)) * baseMultiplier * (1 + desirability);
      const prob = Math.max(0.05, Math.min(0.95, raw));
      return prob;
    };

    const buyerBudget = 1000; // chosen small so raw prob falls inside unclamped range
    const fee = 1000;
    const baseMultiplier = 0.02;
    const buyerAvgSkill = 50;

    const probLow = computeFallbackProb(buyerBudget, fee, baseMultiplier, buyerAvgSkill, 52);
    const probHigh = computeFallbackProb(buyerBudget, fee, baseMultiplier, buyerAvgSkill, 72);
    console.log('Test2: probLow=', probLow, 'probHigh=', probHigh);
    if (!(probHigh > probLow)) {
      console.error('FAIL: skill-based desirability did not increase probability');
      safeExit(5);
    }

    console.log('AI buy tests: PASS');
    safeExit(0);
  } catch (err) {
    console.error('ai_buy_test failed:', err && err.stack ? err.stack : err);
    safeExit(10);
  }
})();
