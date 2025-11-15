/* eslint-disable no-console, no-unused-vars */
// tests/offers_test.js
// Verify Offers.showPendingReleasesPopup doesn't throw and handles a simple pending release
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

// minimal polyfills for alert/confirm/prompt used by the offers code
window.alert = (...args) => {
  try {
    console.log('ALERT:', ...args);
  } catch (_) {
    /* ignore */
  }
};
window.confirm = (...args) => {
  try {
    console.log('CONFIRM:', ...args);
  } catch (_) {
    /* ignore */
  }
  return false;
};
window.prompt = (...args) => {
  try {
    console.log('PROMPT:', ...args);
  } catch (_) {
    /* ignore */
  }
  return '500';
};

// stub formatMoney used by hub.js
window.formatMoney = function (v) {
  return '$' + (Number(v) || 0);
};
global.formatMoney = window.formatMoney;

// minimal clubs and player
const seller = {
  team: { name: 'Seller FC', players: [{ id: 'p1', name: 'P1', position: 'ST', salary: 1000 }] },
  budget: 100000,
};
const buyer = { team: { name: 'Buyer FC', players: [] }, budget: 100000 };

window.ALL_CLUBS = [seller, buyer];
window.playerClub = buyer;

// create a pending release referring to seller.player
window.PENDING_RELEASES = [
  Object.assign({}, seller.team.players[0], {
    previousSalary: 1000,
    leavingFee: 2000,
    originalClubRef: seller,
  }),
];

// load the hub module
require('./src/legacy_ui/hub');

try {
  // call the popup; confirm returns false so it will not proceed with transfer, but should not throw
  window.Offers.showPendingReleasesPopup(() => {
    logger.info('offers popup callback executed');
    process.exit(0);
  });
  // allow a short timeout for async handlers
  setTimeout(() => {
    logger.info('offers_test PASSED');
    process.exit(0);
  }, 100);
} catch (err) {
  logger.error('offers_test FAILED', err && err.stack ? err.stack : err);
  process.exit(2);
}
