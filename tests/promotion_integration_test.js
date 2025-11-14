const assert = require('assert');
const { applyPromotionRelegation } = require('../core/promotion');

function makeDivision(divIndex) {
  // produce 18 clubs with predictable names and tiebreak values
  const clubs = [];
  for (let i = 1; i <= 18; i++) {
    const points = 100 - i; // descending so club 1 highest
    const gf = 50 - i; // descending
    const ga = i; // ascending
    clubs.push({ team: { name: `D${divIndex+1}_T${i}` }, division: divIndex+1, points, goalsFor: gf, goalsAgainst: ga });
  }
  return clubs;
}

// Build 4 divisions
const allDivisions = [ makeDivision(0), makeDivision(1), makeDivision(2), makeDivision(3) ];

// Quick sanity: top of each division should be T1 and bottom T18
for (let d=0; d<4; d++) {
  assert.strictEqual(allDivisions[d][0].team.name, `D${d+1}_T1`);
  assert.strictEqual(allDivisions[d][17].team.name, `D${d+1}_T18`);
}

const result = applyPromotionRelegation(allDivisions);

// Expectations:
// - promoted[1] (from division 2) => D2_T1, D2_T2, D2_T3 move to division1
// - promoted[2] => D3_T1..T3 move to division2
// - promoted[3] => D4_T1..T3 move to division3
// - relegated[0] => D1_T16..T18 move to division2
// - relegated[1] => D2_T16..T18 move to division3
// - relegated[2] => D3_T16..T18 move to division4

// Check promoted lists
assert(Array.isArray(result.promoted[1]), 'promoted[1] present');
assert.strictEqual(result.promoted[1].length, 3);
assert.strictEqual(result.promoted[1][0].team.name, 'D2_T1');
assert.strictEqual(result.promoted[1][1].team.name, 'D2_T2');
assert.strictEqual(result.promoted[1][2].team.name, 'D2_T3');

assert.strictEqual(result.promoted[2][0].team.name, 'D3_T1');
assert.strictEqual(result.promoted[3][0].team.name, 'D4_T1');

// Check relegated lists
assert.strictEqual(result.relegated[0].length, 3);
assert.strictEqual(result.relegated[0][0].team.name, 'D1_T16');
assert.strictEqual(result.relegated[0][2].team.name, 'D1_T18');

assert.strictEqual(result.relegated[1][0].team.name, 'D2_T16');
assert.strictEqual(result.relegated[2][2].team.name, 'D3_T18');

// Validate newDivisions sizes: since 3 promoted up and 3 relegated down per border, sizes should remain 18
result.newDivisions.forEach((d,idx)=>{
  assert.strictEqual(d.length, 18, `division ${idx+1} should have 18 clubs after movement`);
});

console.log('Promotion/Relegation test PASSED');
process.exit(0);
