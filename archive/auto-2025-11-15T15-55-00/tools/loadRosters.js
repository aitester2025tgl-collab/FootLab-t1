// tools/loadRosters.js
// Node helper to load the rosters produced by tools/split_rosters.js
const fs = require('fs');
const path = require('path');

function loadRosters() {
  const repoRoot = path.resolve(__dirname, '..');
  const indexPath = path.join(repoRoot, 'data', 'rosters', 'index.json');
  if (!fs.existsSync(indexPath)) throw new Error('Rosters index not found: ' + indexPath);
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const out = {};
  const dir = path.join(repoRoot, 'data', 'rosters');
  Object.keys(index).forEach((team) => {
    const fn = path.join(dir, index[team]);
    if (!fs.existsSync(fn)) throw new Error('Roster file missing: ' + fn);
    out[team] = JSON.parse(fs.readFileSync(fn, 'utf8'));
  });
  return out;
}

module.exports = loadRosters;
