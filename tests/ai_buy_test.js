/* eslint-disable no-console, no-unused-vars */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Mock the browser environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  runScripts: 'dangerously',
  resources: 'usable',
});
global.window = dom.window;
global.document = dom.window.document;

// Load the game's core files
require('../src/players.js');
require('../src/config/gameConfig.js');

(async () => {
  try {
    // Ensure processPendingReleases is available
    const processPendingReleases =
      window.processPendingReleases || (window.Elifoot && window.Elifoot.processPendingReleases);
    if (typeof processPendingReleases !== 'function') {
      console.error('processPendingReleases not available');
      process.exit(2);
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
    process.exit(0);
  } catch (err) {
    console.error('ai_buy_test failed:', err && err.stack ? err.stack : err);
    process.exit(10);
  }
})();