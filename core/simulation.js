// core/simulation.js
// Moved simulation-related functions from main.js to keep main.js smaller.
(function(){
  'use strict';

  function updateClubStatsAfterMatches(matches) {
    if (!Array.isArray(matches)) return;
    matches.forEach(match => {
      try {
        if (!match || !match.isFinished) return;
        if (match._counted) return;

        match.goals = match.goals || [];
        const homeGoals = match.goals.filter(g => g.team === 'home' && g.type === 'goal').length;
        const awayGoals = match.goals.filter(g => g.team === 'away' && g.type === 'goal').length;
        match.homeGoals = homeGoals;
        match.awayGoals = awayGoals;

        try {
          const attendanceInfo = (window.Finance && typeof window.Finance.computeMatchAttendance === 'function') ? window.Finance.computeMatchAttendance(match) : { attendance: 0, capacity: 0 };
          match.attendance = attendanceInfo.attendance;
          match.stadiumCapacity = attendanceInfo.capacity;
          const homeClub = match.homeClub;
          if (homeClub) {
            const ticketPrice = Number(homeClub.ticketPrice || homeClub.ticket || 20) || 20;
            const matchRevenue = Math.round(match.attendance * ticketPrice);
            homeClub.revenue = (homeClub.revenue || 0) + matchRevenue;
            homeClub.budget = (homeClub.budget || 0) + matchRevenue;
            const operatingCost = Math.round(match.attendance * 0.5);
            homeClub.expenses = (homeClub.expenses || 0) + operatingCost;
            homeClub.budget = (homeClub.budget || 0) - operatingCost;
            match.homeMatchRevenue = matchRevenue;
            match.homeMatchOperatingCost = operatingCost;
          }
        } catch (e) {
          console.warn('Erro a calcular receita/assistência do jogo:', e);
        }

        const clubs = [match.homeClub, match.awayClub];
        clubs.forEach((club, idx) => {
          if (!club) return;
          const isHome = idx === 0;
          const goalsScored = isHome ? homeGoals : awayGoals;
          const goalsConceded = isHome ? awayGoals : homeGoals;

          club.gamesPlayed = (club.gamesPlayed || 0) + 1;
          club.goalsFor = (club.goalsFor || 0) + goalsScored;
          club.goalsAgainst = (club.goalsAgainst || 0) + goalsConceded;

          if (homeGoals > awayGoals) {
            if (isHome) { club.points = (club.points || 0) + 3; club.wins = (club.wins || 0) + 1; }
            else { club.losses = (club.losses || 0) + 1; }
          } else if (homeGoals < awayGoals) {
            if (isHome) { club.losses = (club.losses || 0) + 1; }
            else { club.points = (club.points || 0) + 3; club.wins = (club.wins || 0) + 1; }
          } else {
            club.points = (club.points || 0) + 1; club.draws = (club.draws || 0) + 1;
          }
        });

        match._counted = true;
      } catch (err) {
        console.warn('updateClubStatsAfterMatches: failed for match', match, err);
      }
    });

    try {
      const snap = {
        currentJornada: window.currentJornada,
        playerClub: window.playerClub,
        allDivisions: window.allDivisions,
        allClubs: window.allClubs,
        currentRoundMatches: matches
      };
      try { localStorage.setItem('elifoot_save_snapshot', JSON.stringify(snap)); } catch(e) { /* ignore in non-browser env */ }
    } catch (err) { console.warn('Could not persist snapshot after updating club stats', err); }
  }

  function assignStartingLineups(matches) {
    if (!Array.isArray(matches)) return;
    const Lineups = (window.Elifoot && window.Elifoot.Lineups) || {};
    function buildFallback(teamObj) {
      const players = Array.isArray(teamObj && teamObj.players) ? teamObj.players.slice() : [];
      let gkIndex = players.findIndex(p => p && (p.position === 'GK' || p.position === 'Goalkeeper' || p.position === 'G'));
      let starters = [];
      if (gkIndex >= 0) {
        starters.push(players.splice(gkIndex, 1)[0]);
      }
      players.sort((a, b) => (b && b.skill || 0) - (a && a.skill || 0));
      for (let i = 0; i < players.length && starters.length < 11; i++) {
        starters.push(players[i]);
      }
      const subs = players.slice(starters.length - (gkIndex >= 0 ? 1 : 0));
      return { starters, subs };
    }

    matches.forEach(match => {
      try {
        const homeTeam = match.homeClub && match.homeClub.team;
        const awayTeam = match.awayClub && match.awayClub.team;
        if (homeTeam && typeof Lineups.chooseStarters === 'function') {
          let result = {};
          try { result = Lineups.chooseStarters(homeTeam) || {}; } catch(e) { console.warn('chooseStarters failed for homeTeam, using fallback', e); }
          let starters = Array.isArray(result.starters) ? result.starters : null;
          let subs = Array.isArray(result.subs) ? result.subs : null;
          if (!Array.isArray(starters) || starters.length < 7) {
            const fb = buildFallback(homeTeam);
            starters = fb.starters;
            subs = fb.subs;
          }
          match.homePlayers = starters;
          match.homeSubs = subs;
        }
        if (awayTeam && typeof Lineups.chooseStarters === 'function') {
          let result = {};
          try { result = Lineups.chooseStarters(awayTeam) || {}; } catch(e) { console.warn('chooseStarters failed for awayTeam, using fallback', e); }
          let starters = Array.isArray(result.starters) ? result.starters : null;
          let subs = Array.isArray(result.subs) ? result.subs : null;
          if (!Array.isArray(starters) || starters.length < 7) {
            const fb = buildFallback(awayTeam);
            starters = fb.starters;
            subs = fb.subs;
          }
          match.awayPlayers = starters;
          match.awaySubs = subs;
        }
      } catch (err) {
        console.error('Erro ao atribuir lineups para match', err, match);
      }
    });
  }

  function simulateDay() {
    if (window.Simulation && typeof window.Simulation.simulateDay === 'function') return window.Simulation.simulateDay();
    // original implementation moved here for clarity
    // actual simulate implementation relies on the functions below and will be exposed as window.simulateDay by this module
    let isSimulating = false;
    let simIntervalId = null;

    if (isSimulating) { console.warn('simulateDay called but already simulating (Jornada', window.currentJornada, ')'); return; }
    isSimulating = true;
    console.log('Iniciando simulação (Jornada', window.currentJornada, ')...');

    try { assignStartingLineups(window.currentRoundMatches); } catch (e) { console.error('Erro ao atribuir lineups antes da simulação', e); }

    function proceedToMatch() {
      try { document.getElementById('screen-hub').style.display = 'none'; } catch(e){}
      try { document.getElementById('screen-match').style.display = 'flex'; } catch(e){}
      try { if (typeof renderInitialMatchBoard === 'function') renderInitialMatchBoard(window.allDivisions); } catch(e){ console.error('renderInitialMatchBoard not found', e); isSimulating=false; }
    }

    if (typeof showIntroOverlay === 'function') {
      try { showIntroOverlay(window.playerClub, proceedToMatch); } catch(e) { proceedToMatch(); }
    } else proceedToMatch();

    const HALF_MS = (window.GameConfig && window.GameConfig.timing && window.GameConfig.timing.halfDurationMs) || 20000;
    const MIN_TICK = (window.GameConfig && window.GameConfig.timing && window.GameConfig.timing.minTickMs) || 20;
    const perMinuteMs = Math.max(MIN_TICK, Math.round(HALF_MS / 45));

    let minute = 0;
    function simulationTick() {
      minute++;
      const HALF_MINUTE = (window.GameConfig && window.GameConfig.rules && window.GameConfig.rules.halftimeMinute) || 46;
      if (minute === HALF_MINUTE) {
        const playerMatch = (window.currentRoundMatches || []).find(m => (m.homeClub === window.playerClub) || (m.awayClub === window.playerClub));
        if (playerMatch && typeof showHalfTimeSubsOverlay === 'function') {
          if (simIntervalId) { clearInterval(simIntervalId); simIntervalId = null; }
          showHalfTimeSubsOverlay(window.playerClub, playerMatch, () => {
            if (simIntervalId) { clearInterval(simIntervalId); simIntervalId = null; }
            simIntervalId = setInterval(simulationTick, perMinuteMs);
          });
          return;
        }
      }

      if (minute > 90) {
        if (simIntervalId) { clearInterval(simIntervalId); simIntervalId = null; }
        endSimulation();
        return;
      }

      if (typeof advanceMatchDay === 'function') {
        const updates = advanceMatchDay(window.currentRoundMatches, minute);
        if (typeof updateDayProgress === 'function') updateDayProgress(minute);
        if (Array.isArray(updates)) {
          updates.forEach(update => { if (!update || !update.match) return; if (typeof updateMatchBoardLine === 'function') updateMatchBoardLine(update.match.index, update.match); });
        }
      } else {
        console.error("Função advanceMatchDay não encontrada (matches.js).");
        if (simIntervalId) { clearInterval(simIntervalId); simIntervalId = null; }
        endSimulation();
      }
    }

    simIntervalId = setInterval(simulationTick, perMinuteMs);
  }

  function endSimulation() {
    if (typeof updateClubStatsAfterMatches === 'function') updateClubStatsAfterMatches(window.currentRoundMatches);
    try { const progressContainer = document.getElementById('progress-container'); if(progressContainer) progressContainer.style.display = 'none'; } catch(e){}
    try { if (typeof finishDayAndReturnToHub === 'function') { finishDayAndReturnToHub(); return; } } catch(e){}
    try { document.getElementById('screen-match').style.display = 'none'; document.getElementById('screen-hub').style.display = 'flex'; if (typeof renderHubContent === 'function') renderHubContent('menu-standings'); } catch(e){ console.warn('endSimulation fallback failed', e); }
  }

  function finishDayAndReturnToHub() {
    try {
      if (Array.isArray(window.currentRoundMatches)) {
        window.currentRoundMatches.forEach(m => { if (m) m.isFinished = true; });
        if (typeof updateClubStatsAfterMatches === 'function') updateClubStatsAfterMatches(window.currentRoundMatches);
      }
    } catch (e) { console.warn('finishDayAndReturnToHub: error finalizing matches', e); }

    window.currentJornada = (window.currentJornada || 1) + 1;
    // Detect end of season: assume season length equals number of rounds in top division
    try {
      if (typeof generateRounds === 'function' && Array.isArray(window.allDivisions) && window.allDivisions.length) {
        const topDivClubs = window.allDivisions[0] || [];
        const topRounds = generateRounds(topDivClubs);
        const seasonLength = Array.isArray(topRounds) ? topRounds.length : 0;
        if (seasonLength > 0 && (window.currentJornada || 0) > seasonLength) {
          // Season finished -> apply promotions/relegations
          try {
            if (window.Promotion && typeof window.Promotion.applyPromotionRelegation === 'function') {
              const promoResult = window.Promotion.applyPromotionRelegation(window.allDivisions || []);
              // update global divisions and clubs
              window.allDivisions = promoResult.newDivisions || (window.allDivisions || []);
              // flatten clubs list
              window.allClubs = (window.allDivisions || []).reduce((acc, d) => acc.concat(d || []), []);
              // normalize division property on clubs
              window.allClubs.forEach((c, idx) => { if (c) c.division = (c.division || (c.team && c.team.division)) || (Math.floor(idx / 18) + 1); });

              // persist season results snapshot
              try { localStorage.setItem('elifoot_last_season_results', JSON.stringify({ promoted: promoResult.promoted, relegated: promoResult.relegated })); } catch(e){}

              // show overlay if UI is available
              if (window.Overlays && typeof window.Overlays.showSeasonSummary === 'function') {
                try { window.Overlays.showSeasonSummary({ promoted: promoResult.promoted, relegated: promoResult.relegated, champions: (promoResult.newDivisions && promoResult.newDivisions[0] && promoResult.newDivisions[0].length) ? promoResult.newDivisions[0].slice().sort((a,b)=> (b.points||0)-(a.points||0))[0] : null }); } catch(e){ console.warn('Could not show season summary overlay', e); }
              } else {
                console.log('Season finished — promotions:', promoResult.promoted, 'relegations:', promoResult.relegated);
              }
            }
          } catch (e) { console.warn('applyPromotionRelegation failed', e); }
        }
      }
    } catch (e) { /* ignore detection errors */ }
    try { document.getElementById('screen-match').style.display = 'none'; document.getElementById('screen-hub').style.display = 'flex'; } catch(e){}

    try {
      if (typeof generateRounds === 'function') {
        const nextRoundMatches = [];
        (window.allDivisions || []).forEach(divisionClubs => {
          const rounds = generateRounds(divisionClubs);
          if (!Array.isArray(rounds) || rounds.length === 0) return;
          let roundIndex = ((window.currentJornada || 1) - 1) % rounds.length;
          try {
            if (window.playerClub && Array.isArray(window.currentRoundMatches) && window.currentRoundMatches.length) {
              const isPlayerInThisDivision = divisionClubs.some(dc => dc === window.playerClub);
              if (isPlayerInThisDivision) {
                const lastMatch = window.currentRoundMatches.find(m => m && (m.homeClub === window.playerClub || m.awayClub === window.playerClub));
                const lastOpponent = lastMatch ? (lastMatch.homeClub === window.playerClub ? lastMatch.awayClub : lastMatch.homeClub) : null;
                if (lastOpponent) {
                  let tries = 0;
                  while (tries < rounds.length) {
                    const candidateRound = rounds[roundIndex];
                    if (!Array.isArray(candidateRound)) break;
                    const candidateMatch = candidateRound.find(m => m && (m.homeClub === window.playerClub || m.awayClub === window.playerClub));
                    if (!candidateMatch) break;
                    const candidateOpp = candidateMatch.homeClub === window.playerClub ? candidateMatch.awayClub : candidateMatch.homeClub;
                    if (!candidateOpp || !candidateOpp.team || !lastOpponent.team) break;
                    if (candidateOpp.team.name !== lastOpponent.team.name) break;
                    roundIndex = (roundIndex + 1) % rounds.length;
                    tries++;
                  }
                }
              }
            }
          } catch (e) { console.warn('Erro ao evitar repetição de adversário na geração de rondas:', e); }
          if (rounds[roundIndex]) nextRoundMatches.push(...rounds[roundIndex]);
        });
        window.currentRoundMatches = nextRoundMatches;
        try { assignStartingLineups(window.currentRoundMatches); } catch(e){ console.error('ERRO ao atribuir lineups:', e); }
        try { const snap = { currentJornada: window.currentJornada, playerClub: window.playerClub, allDivisions: window.allDivisions, allClubs: window.allClubs, currentRoundMatches: window.currentRoundMatches }; localStorage.setItem('elifoot_save_snapshot', JSON.stringify(snap)); } catch(e){}
      }
    } catch (e) { console.warn('finishDayAndReturnToHub main error', e); }

    try { if (typeof seasonalSkillDrift === 'function') seasonalSkillDrift(window.allDivisions); } catch(e){}

    try { if (typeof renderHubContent === 'function') renderHubContent('menu-team'); } catch(e){}

    try {
      if (Array.isArray(window.allClubs)) {
        window.allClubs.forEach(club => {
          if (club && club.team && Array.isArray(club.team.players)) {
            club.team.players.forEach(p => {
              if (p && typeof p.suspendedGames === 'number' && p.suspendedGames > 0) p.suspendedGames = Math.max(0, p.suspendedGames - 1);
              if (p) p.yellowCards = 0;
              if (p) p.sentOff = false;
            });
          }
        });
      }
    } catch(e){ console.warn('Erro ao decrementar suspensões:', e); }
  }

  // expose both names for compatibility
  window.Simulation = window.Simulation || {};
  window.Simulation.updateClubStatsAfterMatches = updateClubStatsAfterMatches;
  window.Simulation.assignStartingLineups = assignStartingLineups;
  window.Simulation.simulateDay = simulateDay;
  window.Simulation.endSimulation = endSimulation;
  window.Simulation.finishDayAndReturnToHub = finishDayAndReturnToHub;

  // Also export legacy global names used elsewhere
  window.updateClubStatsAfterMatches = updateClubStatsAfterMatches;
  window.assignStartingLineups = assignStartingLineups;
  window.simulateDay = simulateDay;
  window.endSimulation = endSimulation;
  window.finishDayAndReturnToHub = finishDayAndReturnToHub;

})();
