// players.js

const positions = ["GK", "DF", "MF", "FW"];

// Generate a single player. If skillCap is provided, skill will be generated up to that cap
function generatePlayer(id, position = null, skillCap = 100) {
    // Player generation disabled. Return a minimal placeholder and log a warning so
    // callers become aware that `window.REAL_ROSTERS` should be used instead.
    console.error('generatePlayer: player generation disabled. Use window.REAL_ROSTERS as the authoritative player source.');
    const pos = position || 'CM';
    return { id, name: `Unknown Player ${id}`, position: pos, skill: 60, salary: 0, contractYears: 0, goals: 0 };
}

// Generate a pool of players with optional skill cap
function generatePlayers(total, skillCap = 100) {
    // Player generation disabled. Return an empty array and log a warning.
    console.error('generatePlayers: player generation disabled. Use window.REAL_ROSTERS for real rosters.');
    return [];
}

// Compute a team's skill cap based on its division and ranking inside that division.
// Returns an integer skill cap between 0 and 100.
function computeTeamSkillCap(club, allDivisions) {
    try {
        const div = (club && club.division) ? club.division : 4;
        const divisionClubs = (Array.isArray(allDivisions) && allDivisions[div - 1]) ? allDivisions[div - 1] : [];
        const size = Math.max(2, divisionClubs.length);
        const rankIndex = divisionClubs.findIndex(c => c === club);
        const posIndex = rankIndex >= 0 ? rankIndex : (size - 1);

        // Base caps and minimum caps per division (adjustable)
        const divConf = {
            1: { base: 95, min: 75 },
            2: { base: 80, min: 60 },
            3: { base: 65, min: 45 },
            4: { base: 50, min: 25 }
        };
        const conf = divConf[div] || divConf[4];

        // interpolate between base and min by team position inside the division
        const ratio = (size > 1) ? (posIndex / (size - 1)) : 0;
        const cap = Math.round(conf.base - ratio * (conf.base - conf.min));
        return Math.max(0, Math.min(100, cap));
    } catch (err) {
        return 50; // safe default
    }
}

// Apply skill caps to all teams/players in the provided allDivisions structure.
// This will clamp existing player.skill values to the computed cap (with slight jitter).
function applySkillCaps(allDivisions) {
    if (!Array.isArray(allDivisions)) return;
    allDivisions.forEach((divisionClubs, idx) => {
        if (!Array.isArray(divisionClubs)) return;
        divisionClubs.forEach(club => {
            try {
                const cap = computeTeamSkillCap(club, allDivisions);
                if (club && club.team && Array.isArray(club.team.players)) {
                    club.team.players.forEach(p => {
                        if (!p) return;
                        const old = typeof p.skill === 'number' ? p.skill : 0;
                        if (old > cap) {
                            // clamp down with a small random offset so not all become the exact cap
                            p.skill = Math.max(0, cap - Math.floor(Math.random() * 3));
                        } else {
                            // if below cap, leave as-is but ensure it's within reasonable bounds
                            p.skill = Math.max(0, Math.min(cap, Math.round(old || Math.random() * Math.min(30, cap)))) ;
                        }
                    });
                }
            } catch (err) {
                // ignore per-club errors
            }
        });
    });
}

// Expose functions for other modules
if (typeof window !== 'undefined') {
    window.generatePlayer = generatePlayer;
    window.generatePlayers = generatePlayers;
    window.computeTeamSkillCap = computeTeamSkillCap;
    window.applySkillCaps = applySkillCaps;
}

// Assign short (1-year) or no contracts randomly to players that don't already have contract info.
// Options: pctOneYear (0..1) default 0.35
function assignRandomShortContracts(allDivisions, options) {
    options = options || {};
    const pctOneYear = typeof options.pctOneYear === 'number' ? options.pctOneYear : 0.35;
    if (!Array.isArray(allDivisions)) return;
    allDivisions.forEach(div => {
        if (!Array.isArray(div)) return;
        div.forEach(club => {
            if (!club || !club.team || !Array.isArray(club.team.players)) return;
            club.team.players.forEach(p => {
                if (!p) return;
                // if player already has explicit contractYears, skip
                if (typeof p.contractYears !== 'undefined' || typeof p.contractYearsLeft !== 'undefined') return;
                const one = Math.random() < pctOneYear;
                p.contractYears = one ? 1 : 0;
                p.contractYearsLeft = p.contractYears;
            });
        });
    });
    return true;
}

if (typeof window !== 'undefined') {
    window.assignRandomShortContracts = assignRandomShortContracts;
}

// Generate a pool of free agents by randomly selecting some players from clubs.
// Removes the player from their club roster and places them into `window.FREE_TRANSFERS`.
function computeMinContractFromSkill(skill) {
    // Simple linear formula: base 300€/month + skill*25 => skill 80 -> 2300€/month
    const sk = Math.max(0, Math.min(100, Number(skill || 40)));
    return Math.max(300, Math.round(sk * 25));
}

function generateFreeAgents(allDivisions, options) {
    options = options || {};
    const perPlayerProb = typeof options.probability === 'number' ? options.probability : 0.06; // ~6% chance per player
    const maxPerClub = typeof options.maxPerClub === 'number' ? options.maxPerClub : 2;
    window.FREE_TRANSFERS = window.FREE_TRANSFERS || [];
    if (!Array.isArray(allDivisions)) return window.FREE_TRANSFERS;
    allDivisions.forEach(div => {
        if (!Array.isArray(div)) return;
        div.forEach(club => {
            if (!club || !club.team || !Array.isArray(club.team.players)) return;
            // pick candidates
            const players = club.team.players.slice();
            let removed = 0;
            for (let i = players.length - 1; i >= 0; i--) {
                const p = players[i];
                if (!p) continue;
                if (removed >= maxPerClub) break;
                if (Math.random() < perPlayerProb) {
                    // remove from club roster
                    const idx = club.team.players.findIndex(x => x === p || (x && p && x.id === p.id));
                    if (idx >= 0) club.team.players.splice(idx,1);
                    // mark as free agent: record previous salary and compute minimum contract based on that
                    p.previousSalary = Number(p.salary || 0);
                    p.contractYears = 0;
                    p.contractYearsLeft = 0;
                    p.previousClubName = (club.team && club.team.name) || club.name || '';
                    // min contract when free will be 90% of previous salary
                    p.minContract = Math.max(0, Math.round(p.previousSalary * 0.9));
                    // compute market value and leaving fee (if used earlier)
                    try { p.playerValue = computePlayerMarketValue(p, club && club.division ? club.division : 4); } catch(e){ p.playerValue = 0; }
                    p.leavingFee = Math.max(0, Math.round((p.playerValue || 0) * 0.8));
                    // clear club association to mark as free
                    try { delete p.club; } catch(e){}
                    window.FREE_TRANSFERS.push(p);
                    removed++;
                }
            }
        });
    });
    return window.FREE_TRANSFERS;
}

// Select players that have decided to leave the club but haven't yet become free agents.
// These players are added to `window.PENDING_RELEASES` so the UI can show an offer window
// where clubs may pay a leaving fee to sign them immediately. If no offers arrive later,
// the player should be moved to `window.FREE_TRANSFERS` (use processPendingReleases()).
function selectPlayersForRelease(allDivisions, options) {
    options = options || {};
    const perPlayerProb = typeof options.probability === 'number' ? options.probability : 0.02;
    const maxPerClub = typeof options.maxPerClub === 'number' ? options.maxPerClub : 1;
    window.PENDING_RELEASES = window.PENDING_RELEASES || [];
    if (!Array.isArray(allDivisions)) return window.PENDING_RELEASES;
    allDivisions.forEach(div => {
        if (!Array.isArray(div)) return;
        div.forEach(club => {
            if (!club || !club.team || !Array.isArray(club.team.players)) return;
            let removed = 0;
            // iterate players and mark some as pending release
            for (let i = club.team.players.length - 1; i >= 0; i--) {
                if (removed >= maxPerClub) break;
                const p = club.team.players[i];
                if (!p) continue;
                if (Math.random() < perPlayerProb) {
                    // mark as pending release but keep in squad until signed or moved to free
                    const clone = Object.assign({}, p);
                    clone.previousSalary = Number(p.salary || 0);
                    try { clone.playerValue = computePlayerMarketValue(clone, club && club.division ? club.division : 4); } catch(e){ clone.playerValue = 0; }
                    clone.leavingFee = Math.max(0, Math.round((clone.playerValue || 0) * 0.8));
                    clone.previousClubName = (club.team && club.team.name) || club.name || '';
                    clone.originalClubRef = club; // keep reference so UI can show origin
                    window.PENDING_RELEASES.push(clone);
                    removed++;
                }
            }
        });
    });
    return window.PENDING_RELEASES;
}

// Select players whose contract is expiring (contractYearsLeft === 0) and who may decide
// to leave the club on their own. Adds clones to window.PENDING_RELEASES but DOES NOT
// remove them from the club roster. Options:
// - probability: chance (0..1) that an expiring player will decide to leave (default 0.35)
// - maxPerClub: maximum players per club to mark as leaving (default 2)
function selectExpiringPlayersToLeave(allDivisions, options) {
    options = options || {};
    const prob = typeof options.probability === 'number' ? options.probability : 0.35;
    const maxPerClub = typeof options.maxPerClub === 'number' ? options.maxPerClub : 2;
    window.PENDING_RELEASES = window.PENDING_RELEASES || [];
    if (!Array.isArray(allDivisions)) return window.PENDING_RELEASES;
    allDivisions.forEach(div => {
        if (!Array.isArray(div)) return;
        div.forEach(club => {
            if (!club || !club.team || !Array.isArray(club.team.players)) return;
            let marked = 0;
            for (let i = 0; i < club.team.players.length && marked < maxPerClub; i++) {
                const p = club.team.players[i];
                if (!p) continue;
                const contractLeft = (typeof p.contractYearsLeft !== 'undefined') ? Number(p.contractYearsLeft) : (typeof p.contractYears !== 'undefined' ? Number(p.contractYears) : 0);
                // only consider players at the end of contract
                if (contractLeft !== 0) continue;
                // avoid marking players already pending
                const already = (window.PENDING_RELEASES || []).find(x => (x.id && p.id && x.id === p.id) || (x.name && x.name === p.name));
                if (already) continue;
                if (Math.random() < prob) {
                    const clone = Object.assign({}, p);
                    clone.previousSalary = Number(p.salary || 0);
                    try { clone.playerValue = computePlayerMarketValue(clone, club && club.division ? club.division : 4); } catch(e){ clone.playerValue = 0; }
                    clone.leavingFee = Math.max(0, Math.round((clone.playerValue || 0) * 0.8));
                    clone.previousClubName = (club.team && club.team.name) || club.name || '';
                    clone.originalClubRef = club;
                    window.PENDING_RELEASES.push(clone);
                    marked++;
                }
            }
        });
    });
    return window.PENDING_RELEASES;
}

// Move pending releases that didn't receive an offer to the free transfer list
function processPendingReleases() {
    window.PENDING_RELEASES = window.PENDING_RELEASES || [];
    window.FREE_TRANSFERS = window.FREE_TRANSFERS || [];
    while (window.PENDING_RELEASES.length) {
        const p = window.PENDING_RELEASES.shift();
        // when moving to free transfers: set contract to 0, compute minContract as 90% of previous salary
        p.contractYears = 0; p.contractYearsLeft = 0;
        p.minContract = Math.max(0, Math.round((p.previousSalary || 0) * 0.9));
        p.playerValue = p.playerValue || computePlayerMarketValue(p, p.originalClubRef && p.originalClubRef.division ? p.originalClubRef.division : 4);
        p.leavingFee = Math.max(0, Math.round((p.playerValue || 0) * 0.8));
        // remove originalClubRef before adding to free list
        try { delete p.originalClubRef; } catch(e){}
        window.FREE_TRANSFERS.push(p);
    }
    return window.FREE_TRANSFERS;
}

// Compute a player's approximate market value based on skill and division (higher division => higher value)
function computePlayerMarketValue(playerOrSkill, division) {
    const skill = (playerOrSkill && typeof playerOrSkill.skill === 'number') ? playerOrSkill.skill : Number(playerOrSkill || 40);
    const div = Number(division || 4);
    const divFactor = (div === 1) ? 1.6 : (div === 2) ? 1.25 : (div === 3) ? 0.9 : 0.6;
    // base value + scaled skill (values in monthly*12-ish units). Tunable constants.
    const base = 5000; // base market value
    const skillAdj = Math.round(skill * 200); // skill multiplier
    const raw = Math.round((base + skillAdj) * divFactor);
    return Math.max(0, raw);
}

if (typeof window !== 'undefined') {
    window.selectPlayersForRelease = selectPlayersForRelease;
    window.processPendingReleases = processPendingReleases;
    window.computePlayerMarketValue = computePlayerMarketValue;
    window.selectExpiringPlayersToLeave = selectExpiringPlayersToLeave;
}

if (typeof window !== 'undefined') {
    window.generateFreeAgents = generateFreeAgents;
    window.computeMinContractFromSkill = computeMinContractFromSkill;
}

// Mark a percentage of players as being at the end of their contract this season
// pctExpiring: fraction 0..1 (default 0.12 => ~12% of players across the league)
function markSomeContractsExpiring(allDivisions, pctExpiring) {
    pctExpiring = (typeof pctExpiring === 'number') ? pctExpiring : 0.12;
    if (!Array.isArray(allDivisions)) return 0;
    let marked = 0;
    allDivisions.forEach(div => {
        if (!Array.isArray(div)) return;
        div.forEach(club => {
            if (!club || !club.team || !Array.isArray(club.team.players)) return;
            club.team.players.forEach(p => {
                if (!p) return;
                // skip if already explicitly no-contract (0) - we want players who have contracts to be nearing end
                const hasContract = typeof p.contractYears !== 'undefined' ? p.contractYears > 0 : (typeof p.contractYearsLeft !== 'undefined' ? p.contractYearsLeft > 0 : false);
                if (!hasContract) return;
                if (Math.random() < pctExpiring) {
                    p.contractYearsLeft = 0; // mark as expired/last year
                    // keep contractYears as original so we can show full-term if needed
                    marked++;
                }
            });
        });
    });
    return marked;
}

if (typeof window !== 'undefined') {
    window.markSomeContractsExpiring = markSomeContractsExpiring;
}

// Seasonal/slow evolution of player skills across the season.
// Applies a small delta to each player's skill based on their team's current league position.
// - top teams gain a small amount, bottom teams lose a small amount.
// - the magnitude is scaled per division so higher divisions see larger evolution.
// This should be called once per jornada (or less frequently) to keep progression slow.
function seasonalSkillDrift(allDivisions) {
    if (!Array.isArray(allDivisions)) return;
    // division factor controls how strong the drift is per division (index 0 = div1)
    const divisionFactor = [0.6, 0.4, 0.28, 0.18];

    allDivisions.forEach((divisionClubs, divIdx) => {
        if (!Array.isArray(divisionClubs) || divisionClubs.length === 0) return;
        // sort by current standings (points, goal diff) to determine ranks
        const sorted = [...divisionClubs].sort((a,b)=>{
            const pa = a.points || 0; const pb = b.points || 0;
            if (pb !== pa) return pb - pa;
            const ad = (a.goalsFor||0) - (a.goalsAgainst||0);
            const bd = (b.goalsFor||0) - (b.goalsAgainst||0);
            return bd - ad;
        });

        const size = Math.max(2, sorted.length);
        const factor = divisionFactor[divIdx] || 0.2;

        sorted.forEach((club, idx) => {
            try {
                // percentile where top is near 1, bottom near 0
                const percentile = 1 - (idx / (size - 1));
                // center around 0: negative for bottom half, positive for top half
                const center = percentile - 0.5;
                // compute a small delta; multiply by factor and scale to typical -1,0,1
                const raw = center * factor;
                // convert to -1/0/1 mostly, but allow occasional 2 for extreme cases
                let delta = 0;
                if (raw >= 0.45) delta = 2;
                else if (raw >= 0.12) delta = 1;
                else if (raw <= -0.45) delta = -2;
                else if (raw <= -0.12) delta = -1;
                else delta = 0;

                // Apply to each player in the club slowly
                if (club && club.team && Array.isArray(club.team.players)) {
                    club.team.players.forEach(p => {
                        if (!p || typeof p.skill !== 'number') return;
                        const pos = String(p.position || '').toUpperCase();
                        // goalkeepers evolve slower
                        const posFactor = (pos === 'GK') ? 0.6 : 1.0;
                        const adj = Math.round(delta * posFactor);
                        if (adj === 0) return;
                        p.skill = Math.max(0, Math.min(100, p.skill + adj));
                    });
                }
            } catch (err) {
                // ignore per-club failures
            }
        });
    });
}

if (typeof window !== 'undefined') window.seasonalSkillDrift = seasonalSkillDrift;
