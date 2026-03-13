// tools/check_rosters.js
// Diagnostic: validate divisionsData vs REAL_ROSTERS and print samples

global.window = global;
// Provide a minimal `document` stub so browser-oriented roster files can run under Node.
global.document = global.document || {};

// Try to load known roster sources; prefer archive/data then src/data shim
try {
  require('../archive/data/real_rosters_2025_26.js');
} catch (e) {
  try {
    require('../src/data/real_rosters_2025_26.js');
  } catch (e2) {
    // no-op
  }
}

// Load divisionsData from src/teams.js (this will build divisionsData)
try {
  require('../src/teams.js');
} catch (e) {
  console.error('Failed to load src/teams.js:', e && e.message);
  process.exit(2);
}

const divisions = global.divisionsData || (global.window && window.divisionsData);
const REAL = global.REAL_ROSTERS || (global.window && window.REAL_ROSTERS) || {};

function normalize(s) {
  try {
    return String(s || '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  } catch (e) {
    return String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }
}

if (!divisions || !Array.isArray(divisions) || divisions.length === 0) {
  console.error('No divisionsData found.');
  process.exit(3);
}

const rosterKeys = Object.keys(REAL || {});
const rosterMap = {};
rosterKeys.forEach((k) => {
  try {
    rosterMap[normalize(k)] = k;
  } catch (_) {
    rosterMap[String(k).toLowerCase()] = k;
  }
});

let missing = [];
let matched = 0;
let totalPlayers = 0;

divisions.forEach((div, di) => {
  console.log(`Division ${di + 1}: ${div.name} — ${div.teams.length} teams`);
  div.teams.forEach((t, ti) => {
    const tnorm = normalize(t.name);
    let key = rosterMap[tnorm] || null;
    if (!key) {
      // try fuzzy
      key =
        rosterKeys.find((k) => {
          if (!k) return false;
          const kn = normalize(k);
          return kn === tnorm || kn.includes(tnorm) || tnorm.includes(kn);
        }) || null;
    }
    if (!key) {
      missing.push({ division: di + 1, team: t.name });
    } else {
      matched++;
      const roster = REAL[key] || [];
      totalPlayers += Array.isArray(roster) ? roster.length : 0;
      if (Array.isArray(roster) && roster.length > 0 && di === 0 && ti < 3) {
        console.log(`  Team sample: ${t.name} -> rosterKey=${key} players=${roster.length}`);
        console.log(
          '    First players:',
          roster.slice(0, 3).map((p) => p.name || p)
        );
      }
    }
  });
});

console.log('\nSummary:');
console.log(`  divisions: ${divisions.length}`);
console.log(`  teams total: ${divisions.map((d) => d.teams.length).reduce((a, b) => a + b, 0)}`);
console.log(`  matched rosters: ${matched}`);
console.log(`  missing: ${missing.length}`);
console.log(`  total players counted (matched): ${totalPlayers}`);
if (missing.length) {
  console.log('\nMissing teams:');
  missing.forEach((m) => console.log(`  Div${m.division} ${m.team}`));
  process.exit(1);
} else {
  console.log('\nAll teams matched.');
  process.exit(0);
}
