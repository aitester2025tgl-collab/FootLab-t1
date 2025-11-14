// attendance_payroll_test.js
// Simple runner to load existing teams.js and services/finance.js in Node and compute sample outputs

global.window = global.window || {};
// Ensure console shows line breaks
try {
    require('../teams.js');
} catch (e) {
    console.error('Failed to require teams.js:', e);
    process.exit(1);
}
try {
    require('../services/finance.js');
} catch (e) {
    console.error('Failed to require services/finance.js:', e);
    process.exit(1);
}

function genTeamForDivision(divIndex, idOffset=0) {
    // pick a teamId inside the division: divIndex 0..3 => teamId = divIndex*18 + 1 + idOffset
    const teamId = divIndex * 18 + 1 + idOffset;
    if (typeof window.generateTeam !== 'function') {
        console.error('generateTeam not found'); process.exit(1);
    }
    const t = window.generateTeam(teamId);
    // assign division explicitly
    t.division = divIndex + 1;
    // compute totalSalaryCost if not accurate
    t.totalSalaryCost = (t.players||[]).reduce((s,p)=>s+(p.salary||0),0);
    return t;
}

function printClubSummary(club) {
    console.log(`Club: ${club.name || 'Team'} (Div ${club.division})`);
    console.log(`  Stadium capacity: ${club.stadiumCapacity}`);
    console.log(`  Members: ${club.members}`);
    console.log(`  Players: ${club.players.length}`);
    console.log(`  Payroll (month): ${window.Finance.computePayrollPerMonth(club)}`);
    console.log(`  Payroll (week): ${window.Finance.computePayrollPerWeek(club)}`);
}

const divisions = [0,1,2,3].map(d=>genTeamForDivision(d));

console.log('=== Club summaries ===');
divisions.forEach(printClubSummary);

console.log('\n=== Attendance & Revenue: normal matches (home vs random away) ===');
for (let i=0;i<divisions.length;i++){
    const home = divisions[i];
    const away = genTeamForDivision(i, 1); // same division other team
    // set some demo positions so ranking logic can trigger for certain divisions
    if (i === 3) { // Div4: force these two to be bottom-ranked to test penalty
        home.currentLeaguePosition = 16; away.currentLeaguePosition = 18;
    } else if (i === 0) { // Div1: set mid/top positions
        home.currentLeaguePosition = 3; away.currentLeaguePosition = 6;
    }
    const match = { homeClub: home, awayClub: away };
    const att = window.Finance.computeMatchAttendance(match);
    const rev = window.Finance.estimateMatchRevenue(home);
    console.log(`Div ${home.division} normal: attendance=${att.attendance}, capacity=${att.capacity}, estRevenue=${rev.estRevenue}`);
}

console.log('\n=== High-profile matches: top-4 vs top-4 in Div1 ===');
const top1 = divisions[0];
const top2 = genTeamForDivision(0,2);
// mark them as top positions
top1.currentLeaguePosition = 1; top1.points = 85;
top2.currentLeaguePosition = 2; top2.points = 80;
let attTop = window.Finance.computeMatchAttendance({ homeClub: top1, awayClub: top2 });
let revTop = window.Finance.estimateMatchRevenue(top1);
console.log(`Div1 top-vs-top: attendance=${attTop.attendance}, capacity=${attTop.capacity}, estRevenue=${revTop.estRevenue}`);

console.log('\n=== Edge case: Div4 top-vs-top (simulate small clubs) ===');
const d4a = divisions[3];
const d4b = genTeamForDivision(3,2);
// demonstrate top vs top in Div4 (should still be capped by division rules)
d4a.currentLeaguePosition = 1; d4a.points = 70;
d4b.currentLeaguePosition = 2; d4b.points = 68;
let attD4Top = window.Finance.computeMatchAttendance({ homeClub: d4a, awayClub: d4b });
let revD4Top = window.Finance.estimateMatchRevenue(d4a);
console.log(`Div4 top-vs-top: attendance=${attD4Top.attendance}, capacity=${attD4Top.capacity}, estRevenue=${revD4Top.estRevenue}`);

console.log('\n=== Payroll vs Attendance ratios ===');
divisions.forEach(c=>{
    const payrollMonth = window.Finance.computePayrollPerMonth(c);
    const payrollWeek = window.Finance.computePayrollPerWeek(c);
    const att = window.Finance.computeMatchAttendance({ homeClub: c, awayClub: {} }).attendance;
    console.log(`Div ${c.division}: payrollMonth=${payrollMonth}, payrollWeek=${payrollWeek}, attendance~${att}, ticketPrice=${c.ticketPrice}`);
});

console.log('\nDone.');

// --- Demonstrate evolution and negotiation ---
console.log('\n=== Evolution demo (ticket price moves slowly) ===');
const demoClub = divisions[0];
console.log('Before: ticketPrice=', demoClub.ticketPrice, 'target=', window.Finance.computeTargetTicketPrice(demoClub));
window.Finance.evolveClubEconomyMonthly(demoClub, 3);
console.log('After 3 months: ticketPrice=', demoClub.ticketPrice, 'members=', demoClub.members);

console.log('\n=== Negotiation demo ===');
const player = demoClub.players[0];
console.log('Player before:', player.name, 'salary', player.salary, 'contractYears', player.contractYears);
const offer = Math.round(player.salary * 1.3);
const neg = window.Finance.negotiatePlayerContract(demoClub, player.id, offer, 1);
console.log('Negotiation result:', neg, 'Player after:', player.salary, 'contractYears', player.contractYears);

console.log('\nFinished extended demo.');

// --- Demonstrate salary cut negotiation ---
console.log('\n=== Negotiation demo: salary cut ===');
const cutPlayer = demoClub.players[1];
console.log('Player before cut:', cutPlayer.name, 'salary', cutPlayer.salary, 'contractYears', cutPlayer.contractYears);
const cutOffer = Math.round(cutPlayer.salary * 0.9); // 10% cut
const negCut = window.Finance.negotiatePlayerContract(demoClub, cutPlayer.id, cutOffer, 1);
console.log('Cut negotiation result:', negCut, 'Player after:', cutPlayer.salary, 'contractYears', cutPlayer.contractYears);

console.log('\nFinished all demos.');
