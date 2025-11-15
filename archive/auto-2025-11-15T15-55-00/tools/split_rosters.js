#!/usr/bin/env node
// tools/split_rosters.js
// Safely load `data/real_rosters_2025_26.js` into a VM sandbox and write
// per-team JSON files into data/rosters/, plus an index.json mapping.

/* eslint-disable no-console, no-unused-vars */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function slugify(name) {
  return (
    String(name || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'team'
  );
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const srcPath = path.join(repoRoot, 'data', 'real_rosters_2025_26.js');
  if (!fs.existsSync(srcPath)) {
    console.error('Source roster file not found:', srcPath);
    process.exitCode = 2;
    return;
  }

  const src = fs.readFileSync(srcPath, 'utf8');

  // Create a minimal sandbox with a `window` object so the file can safely
  // assign window.REAL_ROSTERS as it does in the repo.
  const sandbox = { window: {} };
  vm.createContext(sandbox);

  try {
    vm.runInContext(src, sandbox, { filename: 'real_rosters_2025_26.js' });
  } catch (err) {
    console.error('Failed to execute roster source in sandbox:', (err && err.stack) || err);
    process.exitCode = 3;
    return;
  }

  const rosters =
    sandbox.window && sandbox.window.REAL_ROSTERS ? sandbox.window.REAL_ROSTERS : null;
  if (!rosters || typeof rosters !== 'object') {
    console.error('No window.REAL_ROSTERS object found in sandbox after execution.');
    process.exitCode = 4;
    return;
  }

  const outDir = path.join(repoRoot, 'data', 'rosters');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const index = {};
  Object.keys(rosters).forEach((teamName) => {
    const slug = slugify(teamName);
    let filename = `${slug}.json`;
    // avoid overwriting if duplicate slug — append a counter
    let i = 1;
    while (fs.existsSync(path.join(outDir, filename))) {
      i += 1;
      filename = `${slug}-${i}.json`;
    }

    const teamData = rosters[teamName];
    try {
      fs.writeFileSync(path.join(outDir, filename), JSON.stringify(teamData, null, 2), 'utf8');
      index[teamName] = filename;
      console.log('WROTE', filename, 'for team', teamName);
    } catch (err) {
      console.error('Failed to write roster for', teamName, (err && err.stack) || err);
    }
  });

  const indexPath = path.join(outDir, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');
  console.log('WROTE index.json with', Object.keys(index).length, 'teams to', indexPath);
  console.log('Migration complete. You can now use tools/loadRosters.js to load the JSON rosters.');
}

if (require.main === module) main();
