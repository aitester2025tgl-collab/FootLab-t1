// clubs.js - Versão FINALMENTE Corrigida e Completa
/* global divisionsData */
// clubs.js - Strict clubs generator (no synthetic player generation)

// small helper to prefer centralized logger when available
function _getLogger() {
  try {
    if (typeof window !== 'undefined' && window.FootLab && window.FootLab.Logger)
      return window.FootLab.Logger;
    if (typeof window !== 'undefined' && window.Elifoot && window.Elifoot.Logger)
      return window.Elifoot.Logger;
  } catch (e) {
    /* ignore */
  }
  try {
    if (typeof require === 'function') return require('./core/logger');
  } catch (e) {
    /* ignore */
  }
  return console;
}

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
    goalsAgainst: 0,
    coach: null,
  };
}

/**
 * Gera clubes para uma divisão a partir de `window.REAL_ROSTERS`.
 * Não gera jogadores sintéticos; se um time não tiver roster válido, lança erro.
 * @param {number} divisionNumber - 1 a 4.
 * @returns {Array<Object>} Lista de objetos Club.
 */
function generateDivisionClubs(divisionNumber) {
  const clubs = [];
  const divisionData = divisionsData[divisionNumber - 1];
  if (!divisionData || !divisionData.teams) {
    const _logger = _getLogger();
    _logger.error(`Divisão ${divisionNumber} não encontrada em teams.js.`);
    return clubs;
  }

  // build a robust normalization map for roster keys (remove diacritics, punctuation)
  const normalize = (s) =>
    String(s || '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  const rosterKeyMap = {};
  try {
    if (window.REAL_ROSTERS)
      Object.keys(window.REAL_ROSTERS).forEach((k) => {
        try {
          rosterKeyMap[normalize(k)] = k;
        } catch (__) {
          rosterKeyMap[String(k).toLowerCase()] = k;
        }
      });
  } catch (e) {
    /* ignore */
  }

  let teamId = 1;
  divisionData.teams.forEach((teamData) => {
    const tnorm = normalize(teamData.name);
    let key = rosterKeyMap[tnorm] || null;
    if (!key) {
      // fuzzy attempts: try normalized keys first
      const candidates = Object.keys(rosterKeyMap || {});
      key = candidates.find((nk) => nk === tnorm || nk.includes(tnorm) || tnorm.includes(nk));
      if (key) key = rosterKeyMap[key];
    }
    if (!key) {
      // final attempt: try direct substring search against original keys
      key =
        Object.keys(window.REAL_ROSTERS || {}).find((k) => {
          if (!k) return false;
          const kn = String(k || '').toLowerCase();
          const tn = String(teamData.name || '').toLowerCase();
          return kn === tn || kn.includes(tn) || tn.includes(kn);
        }) || null;
    }

    const roster = key ? window.REAL_ROSTERS && window.REAL_ROSTERS[key] : null;
    if (!Array.isArray(roster) || roster.length === 0) {
      const _logger = _getLogger();
      const msg = `Missing roster for team "${teamData.name}" (division ${divisionNumber}).`;
      // TEMP DEBUG: Log detailed diagnostic to console before throwing
      try {
        console.error('TEMP_DEBUG: missing roster', {
          team: teamData.name,
          division: divisionNumber,
          rosterKeys: Object.keys(window.REAL_ROSTERS || {}).slice(0, 12),
          rosterCount: Object.keys(window.REAL_ROSTERS || {}).length || 0,
        });
      } catch (e) {
        try {
          _logger && _logger.error && _logger.error('TEMP_DEBUG console error failed', e);
        } catch (_) {
          void 0;
        }
      }
      _logger.error && _logger.error(msg);
      throw new Error(msg);
    }

    const players = roster.map((r, idx) => ({
      id: teamId * 1000 + idx,
      name: r.name || `Player ${teamId * 1000 + idx}`,
      position: r.position || 'CM',
      skill: typeof r.skill === 'number' ? r.skill : 60,
      salary:
        typeof r.salary === 'number'
          ? r.salary
          : Math.round(
              (divisionNumber === 1
                ? 8000
                : divisionNumber === 2
                  ? 3000
                  : divisionNumber === 3
                    ? 1000
                    : 500) * 0.6
            ),
      contractYears: typeof r.contractYears === 'number' ? r.contractYears : undefined,
      goals: r.goals || 0,
    }));

    // basic computed attributes
    let stadiumCapacity, members, ticketPrice;
    if (divisionNumber === 1) {
      stadiumCapacity = 30000 + Math.floor(Math.random() * 40000);
      members = Math.floor(stadiumCapacity * (0.5 + Math.random() * 0.4));
      ticketPrice = 30 + Math.floor(Math.random() * 20);
    } else if (divisionNumber === 2) {
      stadiumCapacity = 15000 + Math.floor(Math.random() * 30000);
      members = Math.floor(stadiumCapacity * (0.4 + Math.random() * 0.4));
      ticketPrice = 25 + Math.floor(Math.random() * 10);
    } else if (divisionNumber === 3) {
      stadiumCapacity = 10000 + Math.floor(Math.random() * 10000);
      members = Math.floor(stadiumCapacity * (0.3 + Math.random() * 0.4));
      ticketPrice = 18 + Math.floor(Math.random() * 7);
    } else {
      stadiumCapacity = 4000 + Math.floor(Math.random() * 6000);
      members = Math.floor(stadiumCapacity * (0.2 + Math.random() * 0.4));
      ticketPrice = 12 + Math.floor(Math.random() * 5);
    }

    const totalSalary = players.reduce((acc, p) => acc + (p.salary || 0), 0);
    const team = {
      id: teamId,
      name: teamData.name,
      color: teamData.color,
      bgColor: teamData.bgColor,
      players,
      tactic: '4-4-2',
      stadiumCapacity,
      members,
      ticketPrice,
      totalSalaryCost: totalSalary,
      currentLeaguePosition: 0,
      leaguePoints: 0,
    };

    // register club
    const club = createClub(team, divisionNumber);
    club.expenses = Math.max(0, Number(totalSalary));
    club.coach = (window.REAL_COACHES && window.REAL_COACHES[team.name]) || null;
    window.ALL_CLUBS = window.ALL_CLUBS || [];
    window.ALL_CLUBS.push(club);

    teamId++;
    clubs.push(club);
  });

  return clubs;
}

// Validate all rosters before starting the simulation.
// Ensures every team in divisionsData has a matching real roster entry with
// at least `minPlayers` players. Throws an Error listing problems.
function validateAllRosters(minPlayers = 18) {
  const normalize = (s) =>
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  const rosterMap = {};
  try {
    if (window.REAL_ROSTERS)
      Object.keys(window.REAL_ROSTERS).forEach((k) => (rosterMap[normalize(k)] = k));
  } catch (e) {
    /* ignore */
  }

  const missing = [];
  divisionsData.forEach((div, divIndex) => {
    div.teams.forEach((teamData) => {
      const tnorm = normalize(teamData.name);
      let key = rosterMap[tnorm] || null;
      if (!key) {
        key =
          Object.keys(window.REAL_ROSTERS || {}).find((k) => {
            if (!k) return false;
            const kn = normalize(k);
            return kn === tnorm || kn.includes(tnorm) || tnorm.includes(kn);
          }) || null;
      }

      const roster = key ? window.REAL_ROSTERS && window.REAL_ROSTERS[key] : null;
      const count = Array.isArray(roster) ? roster.length : 0;
      if (!Array.isArray(roster) || count < minPlayers) {
        missing.push({
          division: divIndex + 1,
          team: teamData.name,
          rosterKey: key,
          players: count,
        });
      }
    });
  });

  if (missing.length) {
    const lines = missing.map(
      (m) =>
        `Div${m.division} ${m.team} -> rosterKey=${m.rosterKey || 'MISSING'} players=${m.players}`
    );
    const msg =
      `Roster validation failed: ${missing.length} teams missing or under ${minPlayers} players:\n` +
      lines.join('\n');
    const lg = _getLogger();
    try {
      lg.error && lg.error(msg);
    } catch (e) {
      try {
        console && console.error && console.error(msg);
      } catch (_) {
        /* ignore */
      }
    }
    throw new Error(msg);
  }
}

/**
 * Gera todos os clubes (4 divisões) chamando generateDivisionClubs.
 */
export function generateAllClubs() {
  const allClubs = [];
  validateAllRosters(18);

  for (let i = 1; i <= 4; i++) {
    const divisionClubs = generateDivisionClubs(i);
    allClubs.push(...divisionClubs);
  }

  return allClubs;
}

// Export global helpers and namespace
try {
  if (typeof window !== 'undefined') {
    window.FootLab = window.FootLab || window.Elifoot || {};
    window.FootLab.generateAllClubs = window.FootLab.generateAllClubs || generateAllClubs;
    window.FootLab.generateDivisionClubs =
      window.FootLab.generateDivisionClubs || generateDivisionClubs;
    window.Elifoot = window.Elifoot || window.FootLab;
  }
} catch (e) {
  /* ignore */
}