/* eslint-disable no-console, no-unused-vars */
// tests/transfer_integration_test.js

// Simple Node-based integration test to simulate a pending release and execute a purchase.
// Places everything on `global.window` like the browser environment used by the app.
const assert = require('assert');

global.window = global.window || {};

// Create seller club with one player
const sellerPlayer = {
  id: 'p_test_001',
  name: 'Test Striker',
  salary: 30000,
  contractYears: 1,
  leavingFee: 200000,
};

const seller = {
  team: { name: 'Seller FC', players: [sellerPlayer] },
  budget: 500000,
};

// Create buyer club
const buyer = {
  team: { name: 'Buyer United', players: [] },
  budget: 1000000,
};

// Install global collections used in the app
window.ALL_CLUBS = [seller, buyer];
window.PENDING_RELEASES = [Object.assign({}, sellerPlayer, { originalClubRef: seller })];
// buyer will act as window.playerClub
window.playerClub = buyer;

const logger = require('./testLogger').getLogger();
logger.info('--- BEFORE TRANSFER ---');
logger.info('Seller budget:', seller.budget);
logger.info('Buyer budget: ', buyer.budget);
logger.info(
  'Seller players:',
  seller.team.players.map((p) => p.name)
);
logger.info(
  'Buyer players: ',
  buyer.team.players.map((p) => p.name)
);

// Simulate the same logic used by the Offers popup transfer flow
function executePendingPurchase(pendingIdx, offerSalary = 30000, offerYears = 1) {
  const pl = window.PENDING_RELEASES[pendingIdx];
  if (!pl) throw new Error('Pending player not found');

  const buyerClub = window.playerClub;
  let sellerClub = pl.originalClubRef || null;
  const fee = Number(pl.leavingFee || 0);

  if (buyerClub.budget < fee) throw new Error('Buyer has insufficient budget');

  // find real player in seller if possible
  let realPlayer = null;
  if (sellerClub && sellerClub.team && Array.isArray(sellerClub.team.players)) {
    realPlayer = sellerClub.team.players.find(
      (pp) => (pp && pp.id && pl.id && pp.id === pl.id) || (pp && pp.name === pl.name)
    );
  }
  if (!realPlayer) {
    for (let c of window.ALL_CLUBS || []) {
      if (!c || !c.team || !Array.isArray(c.team.players)) continue;
      const found = c.team.players.find(
        (pp) => (pp && pp.id && pl.id && pp.id === pl.id) || (pp && pp.name === pl.name)
      );
      if (found) {
        realPlayer = found;
        sellerClub = c;
        break;
      }
    }
  }

  // perform payments
  buyerClub.budget = Math.max(0, Number(buyerClub.budget || 0) - fee);
  if (sellerClub) sellerClub.budget = Number(sellerClub.budget || 0) + fee;

  // remove from seller roster
  if (realPlayer && sellerClub && sellerClub.team && Array.isArray(sellerClub.team.players)) {
    const ridx = sellerClub.team.players.findIndex(
      (pp) => pp === realPlayer || (pp && pl.id && pp.id === pl.id) || (pp && pp.name === pl.name)
    );
    if (ridx >= 0) sellerClub.team.players.splice(ridx, 1);
  }

  // add to buyer
  const playerToAdd = realPlayer || Object.assign({}, pl);
  playerToAdd.salary = offerSalary;
  playerToAdd.contractYears = offerYears;
  playerToAdd.contractYearsLeft = offerYears;

  buyerClub.team.players = buyerClub.team.players || [];
  buyerClub.team.players.push(playerToAdd);

  // remove from pending releases
  window.PENDING_RELEASES.splice(pendingIdx, 1);

  return { buyer: buyerClub, seller: sellerClub, player: playerToAdd };
}

try {
  const result = executePendingPurchase(0, 35000, 2);

  logger.info('\n--- AFTER TRANSFER ---');
  logger.info('Seller budget:', seller.budget);
  logger.info('Buyer budget: ', buyer.budget);
  logger.info(
    'Seller players:',
    seller.team.players.map((p) => p.name)
  );
  logger.info(
    'Buyer players: ',
    buyer.team.players.map((p) => p.name)
  );

  // Assertions
  assert.strictEqual(buyer.team.players.length, 1, 'Buyer should have 1 player');
  assert.strictEqual(
    seller.team.players.find((p) => p.id === 'p_test_001'),
    undefined,
    'Seller should no longer have the player'
  );
  assert.strictEqual(window.PENDING_RELEASES.length, 0, 'Pending releases should be empty');
  assert.strictEqual(
    buyer.budget,
    1000000 - 200000,
    'Buyer budget should have decreased by the leaving fee'
  );
  assert.strictEqual(
    seller.budget,
    500000 + 200000,
    'Seller budget should have increased by the leaving fee'
  );

  logger.info('\nIntegration test PASSED');
  process.exit(0);
} catch (err) {
  logger.error('\nIntegration test FAILED:', err && err.stack ? err.stack : err);
  process.exit(2);
}
