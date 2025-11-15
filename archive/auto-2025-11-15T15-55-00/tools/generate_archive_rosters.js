/* eslint-disable no-console, no-unused-vars */
const fs = require('fs');
const path = require('path');

function slugSafe(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const root = path.resolve(__dirname, '..');
const rostersDir = path.join(root, 'data', 'rosters');
const indexPath = path.join(rostersDir, 'index.json');
const outPath = path.join(root, 'archive', 'data', 'real_rosters_2025_26.js');

if (!fs.existsSync(indexPath)) {
  console.error('index.json not found at', indexPath);
  process.exit(2);
}

const idx = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

let out = [];
out.push('// archived full roster generated from data/rosters/index.json');
out.push('// Generated: ' + new Date().toISOString());
out.push('window.REAL_ROSTERS = window.REAL_ROSTERS || {};');

for (const teamName of Object.keys(idx)) {
  const fname = idx[teamName];
  const teamPath = path.join(rostersDir, fname);
  if (!fs.existsSync(teamPath)) {
    console.warn('Missing team file for', teamName, 'expected at', teamPath);
    continue;
  }
  const data = fs.readFileSync(teamPath, 'utf8').trim();
  // Ensure data is a JSON array; append assignment
  out.push(`\nwindow.REAL_ROSTERS[${JSON.stringify(teamName)}] = ${data};\n`);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out.join('\n'), 'utf8');
console.log('WROTE archived roster to', outPath);
