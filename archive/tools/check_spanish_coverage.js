// Archived: original tools/check_spanish_coverage.js
// Archived on 2025-11-14. Kept for reference; the preferred active script is check_spanish_coverage2.js

// Original contents:
// Renamed from check_laliga.js -> clearer name: check_spanish_coverage
global.window = {};
require('../data/real_rosters_2025_26.js');
const keys = Object.keys(window.REAL_ROSTERS || {});
const expected = [
  'Real Madrid',
  'Barcelona',
  'Atletico de Madrid',
  'Athletic Club',
  'FC Villarreal',
  'Real Sociedad',
  'Real Betis',
  'Valencia CF',
  'Girona FC',
  'Celta de Vigo',
  'Sevilla FC',
  'RCD Espanyol',
  'CA Osasuna',
  'Rayo Vallecano',
  'Levante UD',
  'RCD Mallorca',
  'Elche CF',
  'Deportivo Alavés',
  'Getafe FC',
  'Real Oviedo',
];
function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}
const keymap = {};
keys.forEach((k, i) => (keymap[norm(k)] = { name: k, pos: i + 1 }));
const logger = require('../tools/cliLogger');
logger.info('Total teams in file:', keys.length);
expected.forEach((e) => {
  const n = norm(e);
  if (keymap[n]) logger.info(e, '-> FOUND as "' + keymap[n].name + '" at position', keymap[n].pos);
  else {
    const found = keys.find((k) => norm(k).includes(n) || n.includes(norm(k)));
    if (found)
      logger.info(e, '-> fuzzy match as "' + found + '" at position', keys.indexOf(found) + 1);
    else logger.info(e, '-> MISSING');
  }
});
