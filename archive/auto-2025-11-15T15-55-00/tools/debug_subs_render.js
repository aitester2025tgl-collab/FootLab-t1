const { JSDOM } = require('jsdom');
const dom = new JSDOM(
  `<!doctype html><html><head></head><body><div id="subs-overlay"></div></body></html>`,
  { runScripts: 'dangerously', resources: 'usable' }
);
const window = dom.window;
global.window = window;
global.document = window.document;
window.Elifoot = window.Elifoot || {};
window.Elifoot.GameConfig = window.Elifoot.GameConfig || {
  rules: { maxSubs: 5, enforceGkOnlySwap: true },
};
// formatMoney used by overlays
window.formatMoney = (v) => '$' + (Number(v) || 0);
// Load overlays
require('../ui/overlays.js');
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
window.Elifoot.Overlays.showHalfTimeSubsOverlay(club, match, () => {});
setTimeout(() => {
  console.log(
    'After call, match.homeSubs order:',
    match.homeSubs.map((p) => p.name)
  );
  const panel = document.querySelector('.subs-panel');
  console.log('PANEL HTML:\n', panel ? panel.innerHTML : 'no panel');
  const starters = panel.querySelectorAll('.starters-list li');
  const subs = panel.querySelectorAll('.subs-list li');
  console.log('starters count', starters.length);
  subs.forEach((n, i) =>
    console.log(
      'subs[' + i + '] data-idx',
      n.getAttribute('data-idx'),
      'text',
      n.textContent.trim(),
      'class',
      n.className
    )
  );
}, 20);
