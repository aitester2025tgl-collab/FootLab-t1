/* eslint-disable no-console, no-unused-vars */
// tests/transfer_offers_integration_test.js
// Full transfer integration test: simulate confirming a pending release purchase
const { JSDOM } = require('jsdom');
const assert = require('assert');
const logger = require('./testLogger').getLogger();

const dom = new JSDOM(`<!doctype html><html><head></head><body></body></html>`, {
  runScripts: 'dangerously',
  resources: 'usable',
});
const window = dom.window;
global.window = window;
global.document = window.document;

// Polyfills/stubs used by hub.js
window.alert = (...args) => {
  try {
    console.log('ALERT:', ...args);
  } catch (_) {
    /* ignore */
  }
};
// simulate user clicking OK on confirm dialogs
window.confirm = (...args) => {
  try {
    console.log('CONFIRM:', ...args);
  } catch (_) {
    /* ignore */
  }
  return true;
};
// simulate user entering a salary
window.prompt = (...args) => {
  try {
    console.log('PROMPT:', ...args);
  } catch (_) {
    /* ignore */
  }
  return '35000';
};

// formatMoney expected by hub.js
window.formatMoney = function (v) {
  return '$' + (Number(v) || 0);
};
global.formatMoney = window.formatMoney;
// also expose alert/confirm/prompt as globals so handlers using unqualified names see them
global.alert = window.alert;
global.confirm = window.confirm;
global.prompt = window.prompt;

// Minimal data: seller with one player, buyer with enough budget
const seller = {
  team: {
    name: 'Seller FC',
    players: [{ id: 'p_offer_001', name: 'OfferPlayer', position: 'ST', salary: 1000 }],
  },
  budget: 200000,
};
const buyer = { team: { name: 'Buyer FC', players: [] }, budget: 500000 };

window.ALL_CLUBS = [seller, buyer];
window.playerClub = buyer;

// create a pending release referring to seller.player
window.PENDING_RELEASES = [
  Object.assign({}, seller.team.players[0], {
    previousSalary: 1000,
    leavingFee: 200000,
    originalClubRef: seller,
  }),
];

// load hub (offers) code
require('./src/legacy_ui/hub');

logger.info('Starting full transfer integration test');

// Run the popup and let the confirm/prompt flow execute
window.Offers.showPendingReleasesPopup(() => {
  logger.info('offers popup callback finished');
});

// programmatically click the first 'Propor' button in the offers popup to trigger the transfer flow
setTimeout(() => {
  try {
    const proposeBtn = document.querySelector('.offer-propose-btn');
    if (proposeBtn) {
      proposeBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    }
  } catch (e) {
    console.error('error clicking proposeBtn', e);
  }
}, 30);

// After a short delay, assert transfer applied
setTimeout(() => {
  try {
    // Buyer should have the player
    assert.strictEqual(buyer.team.players.length, 1, 'Buyer should have acquired the player');
    const added = buyer.team.players[0];
    assert.strictEqual(added.name, 'OfferPlayer');
    // Salary and contract applied
    assert.strictEqual(added.salary, 35000, 'Player salary should be set from prompt');
    assert.strictEqual(added.contractYears, 1, 'Contract years should be 1 on purchase');

    // Seller should no longer have the player
    const foundInSeller = seller.team.players.find((p) => p && p.id === 'p_offer_001');
    assert.strictEqual(foundInSeller, undefined, 'Seller should no longer have the player');

    // Budgets updated: buyer decreased by fee, seller increased
    assert.strictEqual(buyer.budget, 500000 - 200000, 'Buyer budget reduced by leaving fee');
    assert.strictEqual(seller.budget, 200000 + 200000, 'Seller budget increased by leaving fee');

    // Pending releases list should be empty
    assert.strictEqual(
      (window.PENDING_RELEASES || []).length,
      0,
      'Pending releases should be empty after purchase'
    );

    logger.info('transfer_offers_integration_test PASSED');
    process.exit(0);
  } catch (err) {
    logger.error('transfer_offers_integration_test FAILED:', err && err.stack ? err.stack : err);
    process.exit(2);
  }
}, 120);
