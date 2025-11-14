// teams.js - built directly from `data/real_rosters_2025_26.js`
// This file constructs `divisionsData` using the exact ordering found in
// `window.REAL_ROSTERS`. It expects `data/real_rosters_2025_26.js` to set
// `window.REAL_ROSTERS` with teams in the desired order: first 18 = 1ª divisão,
// next 18 = 2ª divisão, next 18 = 3ª divisão, next 18 = 4ª divisão.

// Build divisions strictly from the ordering in REAL_ROSTERS
function buildDivisionsFromRostersOrdered() {
    const rosters = (typeof window !== 'undefined' && window.REAL_ROSTERS) ? Object.keys(window.REAL_ROSTERS) : [];

    // runtime validation: if REAL_ROSTERS exists, ensure it looks complete
    function validateRosters(expectedTeams = 72, minPlayers = 18) {
        if (!(typeof window !== 'undefined' && window.REAL_ROSTERS)) return;
        const keys = Object.keys(window.REAL_ROSTERS);
        const problems = [];
        if (keys.length !== expectedTeams) problems.push(`expected ${expectedTeams} teams but found ${keys.length}`);
        for (let i = 0; i < keys.length; i++) {
            const team = keys[i];
            const players = window.REAL_ROSTERS[team] || [];
            if (!Array.isArray(players)) {
                problems.push(`${team} roster is not an array`);
                continue;
            }
            if (players.length < minPlayers) problems.push(`${team} has only ${players.length} players`);
        }
        if (problems.length) {
            const msg = 'Roster validation failed: ' + problems.join('; ');
            // Throw so startup fails fast when rosters are incomplete
            throw new Error(msg);
        }
    }

    // Run validation (will no-op if REAL_ROSTERS is not present)
    validateRosters(72, 18);
    // Use exact slices: 0-17, 18-35, 36-53, 54-71
    // generate stable colors per team name so UI shows distinct two-tone club colors
    function nameToColor(name) {
        if (!name) return { bg: '#2e2e2e', fg: '#ffffff' };
        // simple hash to hue
        let h = 0;
        for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xfffffff;
        const hue = h % 360;
        const sat = 60 + (h % 10); // 60-69
        const light = 34 + (h % 12); // 34-45

        // Prefer shared hsl->hex and color utilities
        const bg = (window.ColorUtils && typeof window.ColorUtils.hslToHex === 'function')
            ? window.ColorUtils.hslToHex(hue, sat, light)
            : '#2e2e2e';

        const rgb = (window.ColorUtils && typeof window.ColorUtils.hexToRgb === 'function')
            ? window.ColorUtils.hexToRgb(bg)
            : null;

        const L = (window.ColorUtils && typeof window.ColorUtils.luminance === 'function')
            ? window.ColorUtils.luminance(rgb)
            : 0;

        const fg = L > 0.5 ? '#000000' : '#ffffff';
        return { bg, fg };
    }

    const teamColorMap = (typeof window !== 'undefined' && window.REAL_TEAM_COLORS) ? window.REAL_TEAM_COLORS : {};
    const sliceTeam = (start) => rosters.slice(start, start + 18).map(name => {
        let c;
        if (teamColorMap && teamColorMap[name]) {
            const m = teamColorMap[name];
            c = { bg: m.bgColor || '#2e2e2e', fg: m.color || '#ffffff' };
        } else {
            c = nameToColor(name);
        }
        return { name, color: c.fg, bgColor: c.bg };
    });

    const div1 = sliceTeam(0);
    const div2 = sliceTeam(18);
    const div3 = sliceTeam(36);
    const div4 = sliceTeam(54);

    return [
        { name: '1ª divisão', teams: div1 },
        { name: '2ª divisão', teams: div2 },
        { name: '3ª divisão', teams: div3 },
        { name: '4ª divisão', teams: div4 }
    ];
}

const divisionsData = buildDivisionsFromRostersOrdered();

// Expose divisionsData to window/global for compatibility
try {
    if (typeof window !== 'undefined') window.divisionsData = divisionsData;
    if (typeof global !== 'undefined') global.divisionsData = divisionsData;
} catch (e) {}

// Tactics (kept for UI compatibility)
const TACTICS = [
    { name: '4-4-2', description: 'Clássica - Equilibrada', attack: 3, defense: 3, midfield: 4, requires: { wingers: false, threeAtBack: false } },
    { name: '4-3-3', description: 'Ofensiva - Ataque (com pontas)', attack: 4, defense: 2, midfield: 3, requires: { wingers: true, threeAtBack: false } },
    { name: '3-5-2', description: 'Controle - Meio-campo (três centrais)', attack: 3, defense: 3, midfield: 5, requires: { wingers: false, threeAtBack: true } },
    { name: '5-3-2', description: 'Defensiva - Segurança (laterais avançam)', attack: 2, defense: 5, midfield: 3, requires: { wingers: false, threeAtBack: false } },
    { name: '4-5-1', description: 'Contenção - Defesa (meio-campo denso)', attack: 2, defense: 4, midfield: 5, requires: { wingers: false, threeAtBack: false } },
    { name: '3-4-3', description: 'Ataque Total - Pressão (três centrais e pontas)', attack: 5, defense: 2, midfield: 4, requires: { wingers: true, threeAtBack: true } },
    { name: '5-4-1', description: 'Ultra Defensiva - Resistência', attack: 1, defense: 5, midfield: 4, requires: { wingers: false, threeAtBack: false } }
];

// Expose tactics to global/window for UI modules
try {
    if (typeof window !== 'undefined') window.TACTICS = TACTICS;
    if (typeof global !== 'undefined') global.TACTICS = TACTICS;
} catch (e) {}

// generateTeam: returns a team object populated with players from REAL_ROSTERS
function generateTeam(teamId) {
    const allTeams = divisionsData.map(d => d.teams).flat();
    const teamMeta = allTeams[teamId - 1] || { name: `Team ${teamId}`, color: '#FFFFFF', bgColor: '#000000' };
    let players = [];
    try {
        if (typeof window !== 'undefined' && window.REAL_ROSTERS && window.REAL_ROSTERS[teamMeta.name]) players = window.REAL_ROSTERS[teamMeta.name];
    } catch (e) {
        players = [];
    }

    // minimal stadium/member defaults
    const divIndex = Math.floor((teamId - 1) / 18);
    let stadiumCapacity = divIndex === 0 ? 30000 : divIndex === 1 ? 15000 : divIndex === 2 ? 10000 : 4000;
    let members = divIndex === 0 ? 25000 : divIndex === 1 ? 15000 : divIndex === 2 ? 5000 : 1000;

    return {
        id: teamId,
        name: teamMeta.name,
        color: teamMeta.color,
        bgColor: teamMeta.bgColor,
        players: players,
        tactic: '4-4-2',
        stadiumCapacity,
        members,
        ticketPrice: 20,
        totalSalaryCost: 0,
        currentLeaguePosition: 0,
        leaguePoints: 0
    };
}

// expose helpers
try {
    if (typeof window !== 'undefined') window.generateTeam = generateTeam;
    if (typeof global !== 'undefined') global.generateTeam = generateTeam;
} catch (e) {}

// Diagnostic: print current division assignments (useful at dev-time)
function printDivisionAssignments() {
    if (typeof divisionsData === 'undefined') return;
    divisionsData.forEach((d, idx) => {
        console.log(`${idx + 1}. ${d.name} — ${d.teams.length} teams`);
        d.teams.forEach((t, i) => console.log(`   ${i + 1}. ${t.name}`));
    });
}

try {
    if (typeof window !== 'undefined') window.printDivisionAssignments = printDivisionAssignments;
    if (typeof global !== 'undefined') global.printDivisionAssignments = printDivisionAssignments;
} catch (e) {}

// Reusable stricter validator you can call from scripts/tests. Does not run automatically.
function validateRosterConstraints({ expectedTeams = 72, minPlayers = 18, maxPlayers = 28, maxGK = 3 } = {}) {
    if (!(typeof window !== 'undefined' && window.REAL_ROSTERS)) return { ok: true, problems: [] };
    const keys = Object.keys(window.REAL_ROSTERS);
    const problems = [];
    if (keys.length !== expectedTeams) problems.push(`expected ${expectedTeams} teams but found ${keys.length}`);
    for (let team of keys) {
        const players = window.REAL_ROSTERS[team] || [];
        if (!Array.isArray(players)) { problems.push(`${team} roster is not an array`); continue; }
        if (players.length < minPlayers) problems.push(`${team} has only ${players.length} players`);
        if (players.length > maxPlayers) problems.push(`${team} has ${players.length} players (over ${maxPlayers})`);
        const gkCount = players.reduce((a, p) => a + (((p.position||p.pos||'').toUpperCase() === 'GK') ? 1 : 0), 0);
        if (gkCount > maxGK) problems.push(`${team} has ${gkCount} GKs (over ${maxGK})`);
    }
    return { ok: problems.length === 0, problems };
}

try {
    if (typeof window !== 'undefined') window.validateRosterConstraints = validateRosterConstraints;
    if (typeof global !== 'undefined') global.validateRosterConstraints = validateRosterConstraints;
} catch (e) {}

// Ensure these diagnostics are exported when required as a module
if (typeof module !== 'undefined' && module.exports) {
    module.exports.printDivisionAssignments = printDivisionAssignments;
    module.exports.validateRosterConstraints = validateRosterConstraints;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { divisionsData, generateTeam, TACTICS, printDivisionAssignments, validateRosterConstraints };
}

// Startup: run strict validation and throw if problems found. This makes the
// application fail fast when rosters are incomplete or invalid. Set parameters
// conservatively to match repository expectations.
try {
    const _startup = validateRosterConstraints({ expectedTeams: 72, minPlayers: 18, maxPlayers: 28, maxGK: 3 });
    if (!_startup.ok) {
        throw new Error('Startup roster validation failed: ' + _startup.problems.join('; '));
    }
} catch (e) {
    // In environments where window/REAL_ROSTERS is not present, validateRosterConstraints
    // returns ok=true; otherwise we rethrow to make startup fail fast.
    if (e && e.message && e.message.indexOf('Startup roster validation failed') === 0) throw e;
}