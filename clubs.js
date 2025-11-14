// clubs.js - Versão FINALMENTE Corrigida e Completa

// Default starting budgets per division (lower division = less money)
const divisionBudgets = [2000000, 1500000, 1000000, 500000];

// Cria um objeto Club
function createClub(team, division) {
    return {
        team: team,
        division: division, // 1 = top, 4 = bottom
        budget: divisionBudgets[division - 1] || 500000,
        revenue: 0,
        expenses: 0,
        points: 0,
        gamesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0
        ,coach: null
    };
}

/**
 * Gera clubes para uma divisão, aplica as cores e ajusta a skill dos jogadores.
 * @param {number} divisionNumber - 1 a 4.
 * @returns {Array<Object>} Lista de objetos Club.
 */
function generateDivisionClubs(divisionNumber) {
    const clubs = [];
    
    // divisionsData é uma variável global de teams.js
    const divisionData = divisionsData[divisionNumber - 1]; 
    if (!divisionData || !divisionData.teams) {
        console.error(`Divisão ${divisionNumber} não encontrada em teams.js. Clubs.js: generateDivisionClubs.`);
        return clubs; 
    }

    let teamId = 1; // Contador interno
    
    divisionData.teams.forEach(teamData => {
        // Prefer using a provided real roster for this team if available. This prevents
        // generating synthetic players for divisions where we've already imported real rosters
        // (e.g., the second division in the user's dataset).
        const normalize = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        let rosterKeyMap = {};
        try {
            if (window.REAL_ROSTERS && Object.keys(window.REAL_ROSTERS).length) {
                Object.keys(window.REAL_ROSTERS).forEach(k => rosterKeyMap[normalize(k)] = k);
            }
        } catch (e) { rosterKeyMap = {}; }

        const targetNorm = normalize(teamData.name);
        let teamKey = rosterKeyMap[targetNorm] || null;
        if (!teamKey) {
            // try fuzzy match
            try {
                teamKey = Object.keys(window.REAL_ROSTERS || {}).find(k => {
                    if (!k) return false;
                    const kn = normalize(k);
                    if (kn === targetNorm) return true;
                    if (kn.includes(targetNorm)) return true;
                    if (targetNorm.includes(kn)) return true;
                    return false;
                });
            } catch (e) { teamKey = null; }
        }

        let team = null;
        if (teamKey && Array.isArray(window.REAL_ROSTERS[teamKey])) {
            // Build a team object directly from the provided roster (do NOT generate extra players)
            const roster = window.REAL_ROSTERS[teamKey];
            const players = roster.map((r, idx) => ({
                id: teamId * 1000 + idx,
                name: r.name || `Player ${teamId * 1000 + idx}`,
                position: (r.position || 'CM'),
                skill: (typeof r.skill === 'number') ? r.skill : 60,
                salary: (typeof r.salary === 'number') ? r.salary : Math.round((divisionNumber === 1 ? 8000 : divisionNumber === 2 ? 3000 : divisionNumber === 3 ? 1000 : 500) * 0.6),
                contractYears: (typeof r.contractYears === 'number') ? r.contractYears : 1,
                goals: r.goals || 0
            }));

            // compute basic attributes based on division (same logic as the generator)
            let stadiumCapacity, members, ticketPrice;
            if (divisionNumber === 1) {
                stadiumCapacity = 30000 + Math.floor(Math.random() * 40000);
                members = 25000 + Math.floor(Math.random() * 50000);
                ticketPrice = 30 + Math.floor(Math.random() * 20);
            } else if (divisionNumber === 2) {
                stadiumCapacity = 15000 + Math.floor(Math.random() * 30000);
                members = 15000 + Math.floor(Math.random() * 15000);
                ticketPrice = 25 + Math.floor(Math.random() * 10);
            } else if (divisionNumber === 3) {
                stadiumCapacity = 10000 + Math.floor(Math.random() * 10000);
                members = 5000 + Math.floor(Math.random() * 10000);
                ticketPrice = 18 + Math.floor(Math.random() * 7);
            } else {
                stadiumCapacity = 4000 + Math.floor(Math.random() * 6000);
                members = 1000 + Math.floor(Math.random() * 4000);
                ticketPrice = 12 + Math.floor(Math.random() * 5);
            }

            const totalSalary = players.reduce((acc, p) => acc + (p.salary || 0), 0);
            team = {
                id: teamId,
                name: teamData.name,
                color: teamData.color,
                bgColor: teamData.bgColor,
                players,
                tactic: "4-4-2",
                stadiumCapacity: stadiumCapacity,
                members: members,
                ticketPrice: ticketPrice,
                totalSalaryCost: totalSalary,
                currentLeaguePosition: 0,
                leaguePoints: 0
            };
            // ensure club-level expenses reflect monthly payroll so UI can display despesas
            team.totalSalaryCost = totalSalary;
            teamId++;
        } else {
            // fallback to the existing generator when no real roster is provided
            if (typeof generateTeam !== 'function') {
                console.error("Função generateTeam não encontrada em teams.js. Não é possível gerar jogadores.");
                return;
            }
            team = generateTeam(teamId++);
            // apply real names/colors from divisionsData
            team.name = teamData.name;
            team.color = teamData.color;
            team.bgColor = teamData.bgColor;

            // adjust player skills with division reduction
            if (team.players && team.players.length > 0) {
                team.players.forEach(p => {
                    const reduction = (divisionNumber - 1) * 10;
                    p.skill = Math.max(50, p.skill - reduction);
                });
            }
        }

        // Ajusta player skills com base na divisão
        if (team.players && team.players.length > 0) {
            team.players.forEach(p => {
                const reduction = (divisionNumber - 1) * 10; 
                p.skill = Math.max(50, p.skill - reduction);
            });
        } else {
            console.error(`Equipa ${teamData.name} não tem jogadores!`);
        }
        
        team.tactic = "4-4-2"; // Adicionar tática
            
        const club = createClub(team, divisionNumber);
        // compute payroll from team players if not already present
        try {
            const totalS = (team.players || []).reduce((acc, p) => acc + (Number(p.salary) || 0), 0);
            team.totalSalaryCost = team.totalSalaryCost || totalS;
            club.expenses = Math.max(0, Number(team.totalSalaryCost || totalS));
        } catch (e) { club.expenses = club.expenses || 0; }
        // attach coach from REAL_COACHES if present and register with coach service
        try {
            const coachName = (window.REAL_COACHES && window.REAL_COACHES[team.name]) || null;
            club.coach = coachName || null;
            // keep a global registry of all clubs so coach service can consult club info
            window.ALL_CLUBS = window.ALL_CLUBS || [];
            window.ALL_CLUBS.push(club);
            if (coachName && window.COACH_SERVICE && typeof window.COACH_SERVICE.assignCoachToTeam === 'function') {
                window.COACH_SERVICE.assignCoachToTeam(coachName, team.name, club);
            }
        } catch (e) { /* ignore registration errors */ }

        clubs.push(club);
    });
    
    return clubs; 
}

// Validate all rosters before starting the simulation.
// Ensures every team in divisionsData has a matching real roster entry with
// at least `minPlayers` players. Throws an Error listing missing/short rosters.
function validateAllRosters(minPlayers = 18) {
    const normalize = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const rosterMap = {};
    try {
        if (window.REAL_ROSTERS) Object.keys(window.REAL_ROSTERS).forEach(k => rosterMap[normalize(k)] = k);
    } catch (e) { /* ignore */ }

    const missing = [];
    divisionsData.forEach((div, divIndex) => {
        div.teams.forEach(teamData => {
            const tnorm = normalize(teamData.name);
            let key = rosterMap[tnorm] || null;
            if (!key) {
                // fuzzy attempts: find containing or contained keys
                key = Object.keys(window.REAL_ROSTERS || {}).find(k => {
                    if (!k) return false;
                    const kn = normalize(k);
                    if (kn === tnorm) return true;
                    if (kn.includes(tnorm)) return true;
                    if (tnorm.includes(kn)) return true;
                    return false;
                }) || null;
            }

            const roster = key ? (window.REAL_ROSTERS && window.REAL_ROSTERS[key]) : null;
            const count = Array.isArray(roster) ? roster.length : 0;
            if (!Array.isArray(roster) || count < minPlayers) {
                missing.push({ division: divIndex + 1, team: teamData.name, rosterKey: key, players: count });
            }
        });
    });

    if (missing.length) {
        const lines = missing.map(m => `Div${m.division} ${m.team} -> rosterKey=${m.rosterKey || 'MISSING'} players=${m.players}`);
        const msg = `Roster validation failed: ${missing.length} teams missing or under ${minPlayers} players:\n` + lines.join('\n');
        // Log full details then throw so startup stops
        console.error(msg);
        throw new Error(msg);
    }
}


/**
 * Função principal chamada pelo main.js para gerar TODOS os clubes de todas as divisões.
 * Exportada globalmente para ser usada pelo main.js.
 */
function generateAllClubs() {
    const allClubs = [];
    // Validate that every team in divisionsData has a real roster loaded.
    // If any team is missing or has fewer than 18 players, throw an error so the
    // game doesn't start with incomplete squads.
    try {
        validateAllRosters(18);
    } catch (err) {
        // Rethrow so callers (startup) fail loudly and the developer knows to fix data
        throw err;
    }
    // If coach service exists, suppress hire events while we assign initial coaches
    try {
        if (window.COACH_SERVICE && typeof window.COACH_SERVICE.setSuppressEvents === 'function') window.COACH_SERVICE.setSuppressEvents(true);
    } catch (e) {}

    // Assumindo 4 divisões
    for (let i = 1; i <= 4; i++) {
        const divisionClubs = generateDivisionClubs(i);
        allClubs.push(...divisionClubs);
    }

    // re-enable hire events after initial assignment
    try {
        if (window.COACH_SERVICE && typeof window.COACH_SERVICE.setSuppressEvents === 'function') window.COACH_SERVICE.setSuppressEvents(false);
    } catch (e) {}
    
    return allClubs; 
}

// CRÍTICO: EXPORTA A FUNÇÃO PARA O ESCOPO GLOBAL
window.generateAllClubs = generateAllClubs;