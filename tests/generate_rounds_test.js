// tests/generate_rounds_test.js
// Simple Node test that asserts generateRounds(18 clubs) returns 34 rounds

// Ensure a minimal global.window exists because matches.js attaches to window
global.window = global.window || {};

// require the file (it will attach generateRounds to window)
require('../matches.js');

if (typeof window.generateRounds !== 'function') {
  console.error('generateRounds not available on window');
  process.exit(2);
}

// build 18 dummy clubs
const clubs = [];
for (let i = 0; i < 18; i++) {
  clubs.push({
    team: { name: 'Club #' + (i+1), players: [] },
    division: 1,
  });
}

const rounds = window.generateRounds(clubs);

console.log('Generated rounds:', Array.isArray(rounds) ? rounds.length : typeof rounds);

const expected = 34;
if (!Array.isArray(rounds)) {
  console.error('generateRounds did not return an array');
  process.exit(3);
}

if (rounds.length !== expected) {
  console.error(`FAIL: expected ${expected} rounds for 18 teams, got ${rounds.length}`);
  // debug: print per-round sizes
  try {
    console.error('per-round match counts:', rounds.map(r => Array.isArray(r) ? r.length : 0).join(', '));
  } catch(e){}
  process.exit(4);
}

// also assert each round has 9 matches
const badRound = rounds.find(r => !Array.isArray(r) || r.length !== 9);
if (badRound) {
  console.error('FAIL: one round does not have 9 matches as expected for 18 teams');
  process.exit(5);
}

console.log('PASS: generateRounds produced 34 rounds of 9 matches each for 18 teams');
process.exit(0);
