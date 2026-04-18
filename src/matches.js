// matches.js - CORRIGIDO: Adicionada advanceMatchDay e Match Club Naming

/**
 * Configurações de equilíbrio da simulação (Game Design)
 */
const SIM_CONFIG = {
  baseGoalChance: 0.015,
  homeAdvantageFactor: 1.15,
  skillExponentialBase: 1.01,
  maxGoalsPerMinute: 2,
  staminaLossPerMinute: 0.002, // Perda de ~18% de eficácia até ao fim do jogo
  events: {
    yellowChance: 0.02,
    redChance: 0.001,
    suspensionYellows: 1,
    suspensionRed: 2
  }
};


// local helper to prefer centralized logger when available
function getLogger() {
  return typeof window !== 'undefined' && window.FootLab && window.FootLab.Logger
    ? window.FootLab.Logger
    : typeof window !== 'undefined' && window.Elifoot && window.Elifoot.Logger
      ? window.Elifoot.Logger
      : console;
}

function generateRounds(clubs) {
  // Implementação de calendário (round-robin) -> retorna várias jornadas (ida e volta)
  const rounds = [];
  if (!Array.isArray(clubs) || clubs.length === 0) return rounds;

  // criar cópia e garantir objetos válidos
  const teams = clubs.slice();

  // Se o número de clubes for ímpar, adicionar um "bye" (clube fictício)
  if (teams.length % 2 !== 0) {
    teams.push({
      team: { name: 'BYE', players: [], color: '#666', bgColor: '#333' },
      division: clubs[0].division,
      budget: 0,
      revenue: 0,
      expenses: 0,
      points: 0,
      gamesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    });
  }

  const n = teams.length;
  // Use algoritmo circle method para gerar n-1 rondas (ida)
  const teamList = teams.slice();

  for (let round = 0; round < n - 1; round++) {
    const matchesThisRound = [];
    for (let i = 0; i < n / 2; i++) {
      const homeClub = teamList[i];
      const awayClub = teamList[n - 1 - i];
      if (!homeClub || !awayClub) continue;

      // Ignorar jogos com BYE
      const homeIsBye = homeClub.team && homeClub.team.name === 'BYE';
      const awayIsBye = awayClub.team && awayClub.team.name === 'BYE';
      if (homeIsBye || awayIsBye) continue;

      const match = {
        homeClub: homeClub,
        awayClub: awayClub,
        home: homeClub.team,
        away: awayClub.team,
        homeGoals: 0,
        awayGoals: 0,
        goals: [],
        isFinished: false,
        division: homeClub.division,
      };
      matchesThisRound.push(match);
    }

    rounds.push(matchesThisRound);

    // rotate (keep first element fixed)
    const last = teamList.pop();
    teamList.splice(1, 0, last);
  }

  // Criar as jornadas de volta (inverter casa/fora)
  const returnLegs = rounds.map((round) => {
    return round.map((m) => ({
      homeClub: m.awayClub,
      awayClub: m.homeClub,
      home: m.away,
      away: m.home,
      homeGoals: 0,
      awayGoals: 0,
      goals: [],
      isFinished: false,
      division: m.division,
    }));
  });

  return rounds.concat(returnLegs);
}

/**
 * CORREÇÃO CRÍTICA: Simula o avanço do dia de jogo, minuto a minuto.
 * @param {Array<Object>} matches - Array de objetos match (contém os objetos Club).
 * @param {number} minute - O minuto atual do jogo (1 a 90).
 * @returns {Array<Object>} Lista de jogos que tiveram uma atualização (novo golo).
 */
function advanceMatchDay(matches, minute) {
  const updates = [];
  // defensive: ensure matches array
  if (!Array.isArray(matches)) return updates;
  // Iterar com índice consistente com a posição no array "matches" (para que match.index seja válido)
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    if (!match || match.isFinished) continue;

    // ensure goals array exists
    match.goals = Array.isArray(match.goals) ? match.goals : [];

    // Fator de cansaço: diminui a skill efetiva conforme o tempo passa
    const staminaFactor = 1.0 - (minute * SIM_CONFIG.staminaLossPerMinute);

    // Pré-cálculo de skills (recalcula no início, após expulsões ou para aplicar fadiga)
    if (minute === 1 || !match._homeSkill || match._needsSkillUpdate) {
      const hp = match.homePlayers || (match.home && match.home.players) || [];
      const ap = match.awayPlayers || (match.away && match.away.players) || [];
      
      // Aplicar stamina à média de skill
      match._homeSkill = (hp.reduce((sum, p) => sum + (p.skill || 0), 0) / Math.max(1, hp.length)) * staminaFactor;
      match._awaySkill = (ap.reduce((sum, p) => sum + (p.skill || 0), 0) / Math.max(1, ap.length)) * staminaFactor;
      match._needsSkillUpdate = false;
    }

    const homePlayers =
      match.homePlayers && Array.isArray(match.homePlayers)
        ? match.homePlayers
        : match.home && match.home.players;
    const awayPlayers =
      match.awayPlayers && Array.isArray(match.awayPlayers)
        ? match.awayPlayers
        : match.away && match.away.players;
    if (
      !homePlayers ||
      !awayPlayers ||
      !Array.isArray(homePlayers) ||
      !Array.isArray(awayPlayers)
    ) {
      try {
        const L = getLogger();
        L.error && L.error('Equipa sem jogadores ou formato inválido:', match);
      } catch (_) {
        /* ignore */
      }
      continue;
    }

    const homeSkill = match._homeSkill;
    const awaySkill = match._awaySkill;

    // Fator de golo base por minuto. Reduzido para compensar o aumento do impacto da skill.
    const skillDiff = homeSkill - awaySkill;

    // NOVO CÁLCULO: Usar potência para acentuar a diferença de skill.
    const skillMultiplier = Math.pow(SIM_CONFIG.skillExponentialBase, skillDiff);

    const homeChanceFactor = skillMultiplier;
    const awayChanceFactor = 1 / skillMultiplier; // Inverso para a equipa mais fraca

    // Chance de golo para a equipa da casa
    const homeGoalChance = SIM_CONFIG.baseGoalChance * homeChanceFactor * SIM_CONFIG.homeAdvantageFactor;
      // sample RNG once so we can debug decisions without changing distribution
      const homeDraw = Math.random();
      if (window.DEBUG_MATCH_SIM && minute <= 10) {
        try {
          const L = getLogger();
          L.debug &&
            L.debug('DBG goal-check home', {
              matchIdx: i,
              minute,
              homePlayers: homePlayers.length,
              awayPlayers: awayPlayers.length,
              homeSkill: homeSkill.toFixed(2),
              awaySkill: awaySkill.toFixed(2),
              homeGoalChance: homeGoalChance.toFixed(6),
              homeDraw: homeDraw.toFixed(6),
            });
        } catch (e) {
          /* ignore */
        }
      }
      if (homeDraw < homeGoalChance) {
        const homeGoal = generateGoal(homePlayers, minute, 'home');
        // mark event as goal
        homeGoal.type = 'goal';
        match.goals.push(homeGoal);
        try {
          const L = getLogger();
          L.info &&
            L.info('advanceMatchDay: HOME GOAL ->', homeGoal.player, 'min', minute, 'matchIdx', i);
        } catch (e) {
          /* ignore */
        }
        match.homeGoals = (match.homeGoals || 0) + 1;
        match.index = i;
        updates.push({ match });
      }

      // Recalculate goals this minute after possible home goal
      const goalsAfterHome = match.goals
        ? match.goals.filter((g) => g.minute === minute).length
        : 0;
      if ((goalsAfterHome || 0) < SIM_CONFIG.maxGoalsPerMinute) {
        const awayGoalChanceBase = SIM_CONFIG.baseGoalChance * awayChanceFactor;
        const awayGoalChance = goalsAfterHome >= 1 ? awayGoalChanceBase * 0.06 : awayGoalChanceBase;
        const awayDraw = Math.random();
        if (window.DEBUG_MATCH_SIM && minute <= 10) {
          try {
            const L = getLogger();
            L.debug &&
              L.debug('DBG goal-check away', {
                matchIdx: i,
                minute,
                awayGoalChance: awayGoalChance.toFixed(6),
                awayDraw: awayDraw.toFixed(6),
              });
          } catch (e) {
            /* ignore */
          }
        }
        if (awayDraw < awayGoalChance) {
          const awayGoal = generateGoal(awayPlayers, minute, 'away');
          awayGoal.type = 'goal';
          match.goals.push(awayGoal);
          try {
            const L = getLogger();
            L.info &&
              L.info(
                'advanceMatchDay: AWAY GOAL ->',
                awayGoal.player,
                'min',
                minute,
                'matchIdx',
                i
              );
          } catch (e) {
            /* ignore */
          }
          match.awayGoals = (match.awayGoals || 0) + 1;
          match.index = i;
          updates.push({ match });
        }
      }
    // Cards simulation: yellows are more common, reds rare. Use on-field players arrays.
    try {
      const yellowChance = SIM_CONFIG.events.yellowChance;
      const redChance = SIM_CONFIG.events.redChance;

      const giveCard = function (teamPlayers, side) {
        if (!teamPlayers || !teamPlayers.length) return;

        // Yellow
        if (Math.random() < yellowChance) {
          const p = teamPlayers[Math.floor(Math.random() * teamPlayers.length)];
          if (!p) return;
          p.yellowCards = (p.yellowCards || 0) + 1;
          match.goals.push({ minute, team: side, player: p.name, card: 'yellow', type: 'card' });

          if (p.yellowCards >= 2) {
            // two yellows -> red (sent off) and 1 game suspension
            match.goals.push({
              minute,
              team: side,
              player: p.name,
              card: 'red',
              reason: 'double-yellow',
              type: 'card',
            });
            // remove from on-field players
            const idx = teamPlayers.findIndex((x) => x === p);
            if (idx >= 0) teamPlayers.splice(idx, 1);
            const banGames = SIM_CONFIG.events.suspensionYellows;
            p.suspendedGames = Math.max(p.suspendedGames || 0, banGames);
            p.sentOff = true;
            match._needsSkillUpdate = true;
          }
        }

        // Straight red (rare)
        if (Math.random() < redChance) {
          const p = teamPlayers[Math.floor(Math.random() * teamPlayers.length)];
          if (!p) return;
          match.goals.push({
            minute,
            team: side,
            player: p.name,
            card: 'red',
            reason: 'straight-red',
            type: 'card',
          });
          const idx = teamPlayers.findIndex((x) => x === p);
          if (idx >= 0) teamPlayers.splice(idx, 1);
          const straightBan = SIM_CONFIG.events.suspensionRed;
          p.suspendedGames = Math.max(p.suspendedGames || 0, straightBan);
          p.sentOff = true;
          match._needsSkillUpdate = true;
        }
      };

      giveCard(homePlayers, 'home');
      giveCard(awayPlayers, 'away');
    } catch (err) {
      try {
        const L = getLogger();
        L.error && L.error('Erro ao simular cartões:', err);
      } catch (_) {
        /* ignore */
      }
    }

    // Fim do jogo (se o minuto for 90)
    if (minute >= 90) {
      match.isFinished = true;
    }
  }

  return updates;
}

// Exportar funções necessárias para o escopo global
try {
  if (typeof window !== 'undefined') {
    window.generateRounds = generateRounds;
    window.advanceMatchDay = advanceMatchDay;

    // Namespace
    window.FootLab = window.FootLab || {};
    window.FootLab.Matches = {
      generateRounds,
      advanceMatchDay,
    };
  }
} catch (e) {
  /* ignore */
}

// Função auxiliar para gerar um golo (nome do jogador, minuto)
function generateGoal(team, minute, teamType) {
  // Accept either an array of players or a team object with .players
  let players = [];
  if (Array.isArray(team)) players = team;
  else if (team && Array.isArray(team.players)) players = team.players;

  // Escolhe um jogador ofensivo aleatório.
  const priorityGroups = [
    ['ST', 'FW', 'SS'],
    ['LW', 'RW'],
    ['CM', 'MF', 'AM', 'DM'],
  ];
  let scorer = null;
  for (const group of priorityGroups) {
    const candidates = players.filter((p) => p && p.position && group.includes(p.position));
    if (candidates && candidates.length) {
      scorer = candidates[Math.floor(Math.random() * candidates.length)];
      break;
    }
  }
  // Fallback: any player
  if (!scorer && players.length) {
    scorer = players[Math.floor(Math.random() * players.length)];
  }

  // If we have a scorer object, increment their personal goal tally so top-scorer logic can read it
  try {
    if (scorer && typeof scorer === 'object') {
      scorer.goals = (scorer.goals || 0) + 1;
    }
  } catch (e) {
    /* ignore */
  }

  return {
    minute: minute,
    team: teamType,
    player: scorer && scorer.name ? scorer.name : 'Jogador Desconhecido',
  };
}