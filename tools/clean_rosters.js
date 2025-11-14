const fs = require('fs');
const path = require('path');

function normalizePos(p){
  if(!p) return '';
  return String(p).trim().toUpperCase();
}

const repoRoot = path.resolve(__dirname, '..');
const dataDir = path.join(repoRoot, 'data');
const src = path.join(dataDir, 'real_rosters_2025_26.js');
const backups = path.join(dataDir, 'backups');
if(!fs.existsSync(backups)) fs.mkdirSync(backups, { recursive: true });

const ts = new Date().toISOString().replace(/[:.]/g,'-');
const backupPath = path.join(backups, `real_rosters_2025_26.js.bak_clean_${ts}.js`);
fs.copyFileSync(src, backupPath);

// Load the roster file in a Node-friendly global.window
global.window = {};
require(src);
const rosters = global.window.REAL_ROSTERS || {};

const modifiedTeams = [];
const actions = [];

for(const team of Object.keys(rosters)){
  const players = rosters[team];
  if(!Array.isArray(players)) continue;

  // Count GKs
  const gkCount = players.reduce((acc,p)=> acc + (normalizePos(p.position||p.pos)==='GK' ? 1 : 0), 0);

  let changed = false;

  // New rule: ONLY remove extra goalkeepers. Do not trim non-GK players.
  // Remove the last GK(s) until GK count <= 3.
  let currentGk = gkCount;
  while(currentGk > 3){
    // find last GK index
    let lastGK = -1;
    for(let i = players.length - 1; i >= 0; i--){
      if(normalizePos(players[i].position||players[i].pos) === 'GK'){
        lastGK = i; break;
      }
    }
    if(lastGK === -1) break; // nothing to remove
    const removed = players.splice(lastGK, 1)[0];
    actions.push({ team, action: 'removed_last_gk', removed });
    changed = true;
    currentGk--;
  }

  if(changed) modifiedTeams.push(team);
}

// Write back the cleaned roster file (preserve simple JSON-ish formatting)
let out = `// real_rosters_2025_26.js -- cleaned by tools/clean_rosters.js on ${ts}\n`;
out += 'window.REAL_ROSTERS = window.REAL_ROSTERS || {};\n\n';

for(const team of Object.keys(rosters)){
  out += 'window.REAL_ROSTERS[' + JSON.stringify(team) + '] = ' + JSON.stringify(rosters[team], null, 2) + ';\n\n';
}

fs.writeFileSync(src, out, 'utf8');

console.log('Backup created at:', backupPath);
console.log('Teams modified:', modifiedTeams.length);
if(modifiedTeams.length) console.log(modifiedTeams.join(', '));
if(actions.length){
  console.log('\nActions taken (latest first 20 shown):');
  actions.slice(0,20).forEach((a,i)=>{
    const who = a.removed && a.removed.name ? `${a.removed.name} (${a.removed.position||a.removed.pos||''})` : JSON.stringify(a.removed);
    console.log(`${i+1}. ${a.team} -> ${a.action} -> ${who}`);
  });
}
console.log('\nCleaning complete.');
