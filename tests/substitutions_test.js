/* eslint-disable no-console, no-unused-vars */
// tests/substitutions_test.js
// Unit test for substitution flow using jsdom
const assert = require('assert');
const { JSDOM } = require('jsdom');

// prepare a minimal DOM with subs-overlay container
const dom = new JSDOM(
  `<!doctype html><html><head></head><body><div id="subs-overlay"></div></body></html>`,
  { runScripts: 'dangerously', resources: 'usable' }
);
const window = dom.window;
global.window = window;
global.document = window.document;

// provide a lightweight test logger
const logger = require('./testLogger').getLogger();
logger.info('Starting substitutions_test');

// Provide minimal GameConfig
window.FootLab = window.FootLab || window.Elifoot || {};
window.FootLab.GameConfig = window.FootLab.GameConfig || {
  rules: { maxSubs: 5, enforceGkOnlySwap: true },
};

// Load the overlays module (it will attach to window.Elifoot.Overlays)
require('../src/legacy_ui/overlays');

// Build a sample club and match for home side
const club = { team: { name: 'Test Club', bgColor: '#123456', color: '#fff' } };
const starter = { name: 'Starter One', position: 'ST', skill: 50 };
const starter2 = { name: 'Starter Two', position: 'CM', skill: 45 };
const sub1 = { name: 'Sub One', position: 'ST', skill: 40 };
const sub2 = { name: 'Sub Two', position: 'GK', skill: 30 };

const match = {
  homeClub: club,
  awayClub: { team: { name: 'Other' } },
  homePlayers: [starter, starter2],
  awayPlayers: [],
  homeSubs: [sub1, sub2],
  awaySubs: [],
  homeGoals: 0,
  awayGoals: 0,
};

// Call the overlay to render (use FootLab if available, fallback to Elifoot)
(window.FootLab &&
  window.FootLab.Overlays &&
  typeof window.FootLab.Overlays.showHalfTimeSubsOverlay === 'function'
  ? window.FootLab.Overlays.showHalfTimeSubsOverlay
  : window.Elifoot.Overlays.showHalfTimeSubsOverlay)(club, match, () => {});

// Wait for the overlay to be rendered (handlers are attached synchronously, but use a tiny timeout)
setTimeout(() => {
  try {
    const panel = document.querySelector('.subs-panel');
    assert(panel, 'subs panel should be present');

    const starters = panel.querySelectorAll('.starters-list li');
    const subs = panel.querySelectorAll('.subs-list li');
    assert(starters.length >= 1, 'should have starters');
    assert(subs.length >= 1, 'should have subs');

    // simulate selecting first starter and first sub
    const starterNode = starters[0];
    const subNode = subs[0];
    starterNode.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    subNode.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

    // confirm dialog should be appended
    const confirmDiv = document.querySelector('.subs-confirm-prompt');
    assert(confirmDiv, 'confirm prompt should be shown');
    const confirmBtn = confirmDiv.querySelector('#subsDoConfirmBtn');
    assert(confirmBtn, 'confirm button should exist');

    // click confirm
    confirmBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

    // after confirm, substitution should be applied
    // check that match.homePlayers[0] is now sub1
    assert.strictEqual(
      match.homePlayers[0].name,
      sub1.name,
      'Starter should be replaced by the incoming sub'
    );

    // the original starter should appear in homeSubs
    const found = match.homeSubs.find((p) => p && p.name === starter.name);
    assert(found, 'Original starter should be moved to homeSubs');

    // pairs UI should show an "aplicada" label (disabled button) for the applied pair
    const pairsContainer = panel.querySelector('#subs-pairs');
    assert(
      pairsContainer && /aplicada/.test(pairsContainer.innerHTML),
      'pairs UI should mark substitution as aplicada'
    );

    logger.info('substitutions_test PASSED');
    process.exit(0);
  } catch (err) {
    logger.error('substitutions_test FAILED:', err && err.stack ? err.stack : err);
    process.exit(2);
  }
}, 20);
