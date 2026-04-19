/* global renderInitialMatchBoard, showIntroOverlay, showHalfTimeSubsOverlay, advanceMatchDay, updateDayProgress, updateMatchBoardLine, renderHubContent, generateRounds, seasonalSkillDrift, selectExpiringPlayersToLeave, selectPlayersForRelease, computePlayerMarketValue, Persistence */
/* eslint-disable no-empty */
/* exported Persistence */
// core/simulation.js
// Moved simulation-related functions from main.js to keep main.js smaller.
(function () {
  'use strict';

  // local helper to prefer centralized logger when available
  function getLogger() {
    return typeof window !== 'undefined' && window.FootLab && window.FootLab.Logger
      ? window.FootLab.Logger
      : typeof window !== 'undefined' && window.Elifoot && window.Elifoot.Logger
        ? window.Elifoot.Logger
        : console;
  }

  // Prefer a centralized Persistence API when available (FootLab preferred, but fall back to legacy Elifoot)
  const PersistenceAPI =
    (typeof window !== 'undefined' && window.FootLab && window.FootLab.Persistence) ||
    (typeof window !== 'undefined' && window.Elifoot && window.Elifoot.Persistence) ||
    null;

  // simulation state (module-scope so repeated calls are guarded)
  let isSimulating = false;
  let simIntervalId = null;

  // --- POPUP DE JOGADOR LIVRE (ESTILO ELIFOOT) ---
  function showSingleReleasePopup(player, callback) {
    const overlay = document.createElement('div');
    overlay.id = 'single-release-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:999999;';
    
    const box = document.createElement('div');
    box.style.cssText = 'background:#1a1a1a;border:1px solid rgba(255,255,255,0.15);border-radius:12px;padding:24px;width:360px;color:#fff;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,0.5);font-family:sans-serif;';
    
    const formatMoney = typeof window.formatMoney === 'function' ? window.formatMoney : (v) => v + ' €';
    const fee = player.leavingFee || 0;
    const salary = player.minContract || player.salary || 0;
    const clubName = player.previousClubName || 'Desconhecido';

    const myBudget = window.playerClub ? (window.playerClub.budget || 0) : 0;
    const sqSz = window.playerClub && window.playerClub.team && window.playerClub.team.players ? window.playerClub.team.players.length : 0;
    if (myBudget < fee || sqSz >= 28) {
        const myDiv = window.playerClub ? window.playerClub.division : 4;
        const rivals = (window.allDivisions[myDiv - 1] || []).filter(c => c !== window.playerClub);
        const rival = rivals.length > 0 ? rivals[Math.floor(Math.random() * rivals.length)] : null;
        const rSal = Math.floor(salary * (1.0 + Math.random() * 0.3));
        box.innerHTML = `
            <h3 style="margin-top:0;color:#f44336;font-size:1.3rem;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:12px;">Proposta Inviável</h3>
            <p style="font-size:1rem;margin-bottom:20px;line-height:1.5;">
                Sem fundos/espaço para <strong>${player.name}</strong>. Assinou pelo <strong>${rival ? rival.team.name : 'outro clube'}</strong>.
            </p>
            <button id="btn-continue-free" style="width:100%;background:#2196F3;color:#fff;border:none;padding:12px;border-radius:6px;font-weight:bold;cursor:pointer;font-size:1rem;">Continuar</button>
        `;
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        box.querySelector('#btn-continue-free').onclick = () => { document.body.removeChild(overlay); callback(false, 0, rival, rSal); };
        return;
    }
    
    box.innerHTML = `
        <h3 style="margin-top:0;color:#ffeb3b;font-size:1.3rem;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:12px;">Jogador Livre</h3>
        <p style="font-size:0.95rem;margin-bottom:20px;opacity:0.9;line-height:1.4;"><strong>${player.name}</strong> terminou o contrato com o <strong>${clubName}</strong> e foi oferecido ao teu clube.</p>
        <div style="background:rgba(255,255,255,0.05);padding:15px;border-radius:8px;margin-bottom:24px;text-align:left;font-size:0.95rem;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>Posição:</span> <strong>${player.position}</strong></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>Habilidade:</span> <strong><span style="color:#ffeb3b;">${player.skill}</span></strong></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>Salário:</span> <strong>${formatMoney(salary)}/mês</strong></div>
            <div style="display:flex;justify-content:space-between;"><span>Prémio Assinatura:</span> <strong>${formatMoney(fee)}</strong></div>
        </div>
    <div style="margin-bottom: 20px;">
        <p style="font-size: 0.85em; color: #ff9800; margin-bottom: 8px;">Outros clubes também estão interessados. Melhora a oferta para garantir a contratação.</p>
        <div style="display:flex; align-items:center; gap: 10px; justify-content:center;">
            <label>Tua Oferta:</label>
            <input type="number" id="offer-salary-input" value="${salary}" style="padding: 8px; border-radius: 4px; border: 1px solid #555; background: #222; color: #fff; width: 120px; text-align: center; font-weight: bold;">
        </div>
    </div>
        <div style="display:flex;gap:12px;">
        <button id="btn-accept-free" style="flex:1;background:#4caf50;color:#fff;border:none;padding:12px;border-radius:6px;font-weight:bold;cursor:pointer;font-size:1rem;transition:background 0.2s;">Fazer Oferta</button>
            <button id="btn-reject-free" style="flex:1;background:#f44336;color:#fff;border:none;padding:12px;border-radius:6px;font-weight:bold;cursor:pointer;font-size:1rem;transition:background 0.2s;">Ignorar</button>
        </div>
    `;
    
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    
    const btnAccept = box.querySelector('#btn-accept-free');
    const btnReject = box.querySelector('#btn-reject-free');
    
    btnAccept.onmouseover = () => btnAccept.style.background = '#45a049';
    btnAccept.onmouseout = () => btnAccept.style.background = '#4caf50';
    btnReject.onmouseover = () => btnReject.style.background = '#da190b';
    btnReject.onmouseout = () => btnReject.style.background = '#f44336';
    
    btnReject.onclick = () => { document.body.removeChild(overlay); callback(false); };

    btnAccept.onclick = () => {
        const offered = parseInt(box.querySelector('#offer-salary-input').value, 10) || salary;
        let prob = 0.05;
        if (offered >= salary * 1.5) prob = 1.0;
        else if (offered >= salary * 1.2) prob = 0.8;
        else if (offered >= salary) prob = 0.3;

        const success = Math.random() < prob;
        let rival = null, rivalSalary = 0;

        if (!success) {
            const myDiv = window.playerClub ? window.playerClub.division : 4;
            const rivals = (window.allDivisions[myDiv - 1] || []).filter(c => c !== window.playerClub);
            if (rivals.length > 0) rival = rivals[Math.floor(Math.random() * rivals.length)];
            rivalSalary = Math.floor(salary * (1.0 + Math.random() * 0.3));
        }

        box.innerHTML = `
            <h3 style="margin-top:0;color:${success ? '#4caf50' : '#f44336'};font-size:1.3rem;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:12px;">${success ? 'Contratação Concluída!' : 'Proposta Rejeitada'}</h3>
            <p style="font-size:1rem;margin-bottom:20px;line-height:1.5;">
                ${success ? `<strong>${player.name}</strong> aceitou a tua proposta e assinou pelo <strong>${window.playerClub ? window.playerClub.team.name : 'teu clube'}</strong>.` : `<strong>${player.name}</strong> rejeitou a tua proposta e assinou pelo <strong>${rival ? rival.team.name : 'outro clube'}</strong> por um salário de <br><span style="display:inline-block; width:140px; text-align:center; color:#ffeb3b; font-weight:bold; margin-top:8px; padding:6px; background:rgba(0,0,0,0.3); border-radius:4px;">${formatMoney(rivalSalary)}</span>.`}
            </p>
            <button id="btn-continue-free" style="width:100%;background:#2196F3;color:#fff;border:none;padding:12px;border-radius:6px;font-weight:bold;cursor:pointer;font-size:1rem;">Continuar</button>
        `;
        box.querySelector('#btn-continue-free').onclick = () => {
            document.body.removeChild(overlay);
            callback(success, offered, rival, rivalSalary);
        };
    };
  }

  // --- LÓGICA DO MERCADO DE TREINADORES ---
  function processManagerMovements(isEndSeason) {
    const allDivisions = window.allDivisions || [];

    // Garantir que UNEMPLOYED_COACHES é um array e obter uma referência a ele.
    // Isto corrige um bug onde a variável local `freeCoaches` podia ficar dessincronizada.
    if (!Array.isArray(window.UNEMPLOYED_COACHES)) {
      window.UNEMPLOYED_COACHES = [];
    }
    const freeCoaches = window.UNEMPLOYED_COACHES;

    window.PLAYER_JOB_OFFERS = window.PLAYER_JOB_OFFERS || [];
    let clubsNeedingCoaches = [];

    // 1. Avaliar desempenho e Despedir Treinadores
    allDivisions.forEach((division) => {
      const sorted = [...division].sort((a, b) => (b.points || 0) - (a.points || 0));
      const total = sorted.length;
      
      sorted.forEach((club, rank) => {
        if (!club.coach || club === window.playerClub) return; // Não despedir o Jogador automaticamente aqui
        let sackChance = 0;
        if (rank >= total - 3) sackChance = isEndSeason ? 1.0 : 0.4; // Zona de despromoção
        else if (rank >= total - 6) sackChance = isEndSeason ? 0.3 : 0.1; // Risco de despromoção

        if (Math.random() < sackChance) {
          const coach = club.coach;
          if (coach) {
            // Remove club association and add the original coach object to the unemployed list.
            delete coach.clubId;
            freeCoaches.push(coach);
          }
          club.coach = null;
          clubsNeedingCoaches.push(club);
        }
      });
    });

    // 2. Calcular a Reputação do Jogador
    const playerClub = window.playerClub;
    let playerRep = 40;
    if (playerClub && playerClub.division) {
      playerRep = (playerClub.division === 1 ? 82 : playerClub.division === 2 ? 68 : playerClub.division === 3 ? 55 : 40);
      const myDiv = allDivisions[playerClub.division - 1] || [];
      const myRank = [...myDiv].sort((a,b) => (b.points||0) - (a.points||0)).findIndex(c => c === playerClub);
      // Bónus brutal por estar a subir a equipa de divisão
      if (myRank === 0) playerRep += 15;
      else if (myRank <= 2) playerRep += 10;
      else if (myRank <= 5) playerRep += 5;
    }

    // 3. Contratar Novos Treinadores (As equipas maiores escolhem primeiro)
    clubsNeedingCoaches.sort((a, b) => a.division - b.division);
    
    for (let i = 0; i < clubsNeedingCoaches.length; i++) {
      const club = clubsNeedingCoaches[i];
      const baseRep = club.division === 1 ? 82 : club.division === 2 ? 68 : club.division === 3 ? 55 : 40;
      
      let candidates = [...freeCoaches];
      // "Roubar" treinadores ativos de divisões inferiores
      allDivisions.forEach(div => {
        div.forEach(c => {
          if (c.coach && c !== club && c.division > club.division) candidates.push({ ...c.coach, currentClub: c });
        });
      });
      // Avaliar o Jogador (só recebe convite de divisões superiores se a rep o permitir)
      if (playerClub && playerClub.division > club.division && playerRep >= baseRep - 10) {
        candidates.push({ name: "JOGADOR", reputation: playerRep, isPlayer: true });
      }

      let viable = candidates.filter(c => c.reputation >= baseRep - 15 && c.reputation <= baseRep + 15);
      // Se não houver ninguém no intervalo exigido, procuramos o melhor disponível
      if (viable.length === 0 && candidates.length > 0) { viable = [...candidates]; }
      if (viable.length === 0) { club.coach = null; continue; }
      
      viable.sort((a, b) => b.reputation - a.reputation);
      const chosen = viable[0];

      if (chosen.isPlayer) {
        if (!window.PLAYER_JOB_OFFERS.find(o => o.id === club.id)) window.PLAYER_JOB_OFFERS.push(club);
        club.coach = null; // O cargo fica vazio a aguardar a tua decisão
      } else {
        club.coach = { name: chosen.name, reputation: chosen.reputation };
        if (chosen.currentClub) {
          // Lógica de "carrossel": o treinador do clube que foi 'roubado' fica agora desempregado.
          const poachedCoach = chosen.currentClub.coach;
          chosen.currentClub.coach = null;

          // Adicionar o treinador que foi substituído à lista de desempregados.
          if (poachedCoach) {
            delete poachedCoach.clubId;
            freeCoaches.push(poachedCoach);
          }

          // O clube que ficou sem treinador entra na lista para contratar um substituto.
          clubsNeedingCoaches.push(chosen.currentClub);
        } else {
          const idx = freeCoaches.findIndex(fc => fc.name === chosen.name);
          if (idx > -1) freeCoaches.splice(idx, 1);
        }
      }
    }
  }

  function updateClubStatsAfterMatches(matches) {
    if (!Array.isArray(matches)) return;
    matches.forEach((match) => {
      try {
        if (!match || !match.isFinished) return;
        if (match._counted) return;

        match.goals = match.goals || [];
        const homeGoals = match.goals.filter((g) => g.team === 'home' && g.type === 'goal').length;
        const awayGoals = match.goals.filter((g) => g.team === 'away' && g.type === 'goal').length;
        match.homeGoals = homeGoals;
        match.awayGoals = awayGoals;

        try {
          let attendance = match.attendance || 0;
          if (attendance === 0 && match.homeClub) {
             const cap = match.homeClub.stadiumCapacity || (match.homeClub.team && match.homeClub.team.stadiumCapacity) || 10000;
             attendance = Math.floor(cap * 0.6);
             match.attendance = attendance;
          }
          const homeClub = match.homeClub;
          if (homeClub) {
            const ticketPrice = Number(homeClub.ticketPrice || (homeClub.team && homeClub.team.ticketPrice) || 20) || 20;
            const matchRevenue = Math.round(attendance * ticketPrice);
            homeClub.revenue = (homeClub.revenue || 0) + matchRevenue;
            homeClub.budget = (homeClub.budget || 0) + matchRevenue;
            const operatingCost = Math.round(attendance * 0.5);
            homeClub.expenses = (homeClub.expenses || 0) + operatingCost;
            homeClub.budget = (homeClub.budget || 0) - operatingCost;
            match.homeMatchRevenue = matchRevenue;
            match.homeMatchOperatingCost = operatingCost;
          }
        } catch (e) {
          try {
            const L = getLogger();
            L.warn && L.warn('Erro a calcular receita/assistência do jogo:', e);
          } catch (_) {
            /* ignore */
          }
        }

        const clubs = [match.homeClub, match.awayClub];
        clubs.forEach((club, idx) => {
          if (!club) return;
          const isHome = idx === 0;
          const goalsScored = isHome ? homeGoals : awayGoals;
          const goalsConceded = isHome ? awayGoals : homeGoals;

          // Deduzir salários (1/4 do custo mensal por jogo) a ambas as equipas
          const actualSalary = (club.team && Array.isArray(club.team.players)) ? club.team.players.reduce((sum, p) => sum + (p.salary || 0), 0) : (club.totalSalaryCost || 0);
          const matchSalary = Math.round(actualSalary / 4);
          club.expenses = (club.expenses || 0) + matchSalary;
          club.budget = (club.budget || 0) - matchSalary;

          club.gamesPlayed = (club.gamesPlayed || 0) + 1;
          club.goalsFor = (club.goalsFor || 0) + goalsScored;
          club.goalsAgainst = (club.goalsAgainst || 0) + goalsConceded;

          if (homeGoals > awayGoals) {
            if (isHome) {
              club.points = (club.points || 0) + 3;
              club.wins = (club.wins || 0) + 1;
            } else {
              club.losses = (club.losses || 0) + 1;
            }
          } else if (homeGoals < awayGoals) {
            if (isHome) {
              club.losses = (club.losses || 0) + 1;
            } else {
              club.points = (club.points || 0) + 3;
              club.wins = (club.wins || 0) + 1;
            }
          } else {
            club.points = (club.points || 0) + 1;
            club.draws = (club.draws || 0) + 1;
          }
        });

        match._counted = true;
      } catch (err) {
        try {
          const L = getLogger();
          L.warn && L.warn('updateClubStatsAfterMatches: failed for match', match, err);
        } catch (_) {
          /* ignore */
        }
      }
    });

    try {
      const snap = {
        currentJornada: window.currentJornada,
        playerClub: window.playerClub,
        allDivisions: window.allDivisions,
        allClubs: window.allClubs,
        currentRoundMatches: matches,
      };
      // Prefer the centralized Persistence API when available (FootLab first, Elifoot fallback)
      try {
        if (PersistenceAPI && typeof PersistenceAPI.saveSnapshot === 'function') {
          PersistenceAPI.saveSnapshot(snap);
        } else {
          try {
            localStorage.setItem('footlab_t1_save_snapshot', JSON.stringify(snap));
          } catch (_) {}
          try {
            localStorage.setItem('elifoot_save_snapshot', JSON.stringify(snap));
          } catch (_) {}
        }
      } catch (e) {
        /* ignore persistence errors */
      }
    } catch (err) {
      try {
        const L = getLogger();
        L.warn && L.warn('Could not persist snapshot after updating club stats', err);
      } catch (_) {
        /* ignore */
      }
    }
  }

  function assignStartingLineups(matches) {
    if (!Array.isArray(matches)) return;
    const Lineups =
      (window.FootLab && window.FootLab.Lineups) ||
      (window.Elifoot && window.Elifoot.Lineups) ||
      {};
    function buildFallback(teamObj) {
      const players = Array.isArray(teamObj && teamObj.players) ? teamObj.players.slice() : [];
      let gkIndex = players.findIndex(
        (p) => p && (p.position === 'GK' || p.position === 'Goalkeeper' || p.position === 'G')
      );
      let starters = [];
      if (gkIndex >= 0) {
        starters.push(players.splice(gkIndex, 1)[0]);
      }
      players.sort((a, b) => ((b && b.skill) || 0) - ((a && a.skill) || 0));
      for (let i = 0; i < players.length && starters.length < 11; i++) {
        starters.push(players[i]);
      }
      const subs = players.slice(starters.length - (gkIndex >= 0 ? 1 : 0));
      return { starters, subs };
    }

    matches.forEach((match) => {
      try {
        // Calcular a assistência ANTES de o jogo começar para a UI do MatchBoard poder mostrar
        if (match.homeClub && typeof match.attendance === 'undefined') {
          const cap = match.homeClub.stadiumCapacity || (match.homeClub.team && match.homeClub.team.stadiumCapacity) || 10000;
          const members = match.homeClub.members || (match.homeClub.team && match.homeClub.team.members) || Math.floor(cap * 0.5);
          
          // Calcular fator de performance com base na posição atual na liga
          let performanceFactor = 0.5; // Base (meio da tabela)
          try {
            if (window.allDivisions && match.homeClub.division) {
              const divClubs = window.allDivisions[match.homeClub.division - 1];
              if (divClubs && divClubs.length > 1) {
                const sorted = [...divClubs].sort((a, b) => {
                  const pa = a.points || 0;
                  const pb = b.points || 0;
                  if (pb !== pa) return pb - pa;
                  const gda = (a.goalsFor || 0) - (a.goalsAgainst || 0);
                  const gdb = (b.goalsFor || 0) - (b.goalsAgainst || 0);
                  return gdb - gda;
                });
                const rank = sorted.findIndex(c => c === match.homeClub);
                if (rank >= 0) performanceFactor = 1.0 - (rank / (divClubs.length - 1));
              }
            }
          } catch (e) { /* ignore */ }
          
          // Avaliar o "peso" do adversário para a Lei da Oferta e da Procura (Jogos Grandes)
          let awayAvgSkill = 50;
          try {
            if (match.awayClub && match.awayClub.team && Array.isArray(match.awayClub.team.players)) {
              const ap = match.awayClub.team.players;
              const top11 = [...ap].sort((a,b) => (b.skill||0) - (a.skill||0)).slice(0, 11);
              awayAvgSkill = top11.reduce((sum, p) => sum + (p.skill || 0), 0) / Math.max(1, top11.length);
            }
          } catch(e) { /* ignore */ }
          
          // Fator Preço: Lei da Oferta e da Procura
          const divNum = match.homeClub.division || 4;
          let basePrice = divNum === 1 ? 30 : divNum === 2 ? 25 : divNum === 3 ? 18 : 12;
          
          // Jogos contra equipas fortes aumentam o interesse (o preço aceitável sobe)
          if (awayAvgSkill >= 85) basePrice *= 1.5;       // Jogo de Cartaz (ex: contra equipas de topo)
          else if (awayAvgSkill >= 75) basePrice *= 1.25; // Jogo Muito Importante
          else if (awayAvgSkill >= 65) basePrice *= 1.1;  // Jogo Interessante
          
          const actualPrice = Number(match.homeClub.ticketPrice || (match.homeClub.team && match.homeClub.team.ticketPrice) || 20);
          
          let priceFactor = basePrice / Math.max(1, actualPrice);
          priceFactor = Math.max(0.2, Math.min(1.5, priceFactor));
          
          // Cálculo Final
          const baseFill = performanceFactor * 0.7 * priceFactor;
          const randomFill = (Math.random() * 0.3) * priceFactor;
          
          let att = members + Math.floor((cap - members) * (baseFill + randomFill));
          if (att > cap) att = cap;
          match.attendance = att;
          match.stadiumCapacity = cap;
        }

        const homeTeam = match.homeClub && match.homeClub.team;
        const awayTeam = match.awayClub && match.awayClub.team;
        if (homeTeam && typeof Lineups.chooseStarters === 'function') {
          let result = {};
          try {
            result = Lineups.chooseStarters(homeTeam) || {};
          } catch (e) {
            try {
              const L = getLogger();
              L.warn && L.warn('chooseStarters failed for homeTeam, using fallback', e);
            } catch (_) {
              /* ignore */
            }
          }
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
          try {
            result = Lineups.chooseStarters(awayTeam) || {};
          } catch (e) {
            try {
              const L = getLogger();
              L.warn && L.warn('chooseStarters failed for awayTeam, using fallback', e);
            } catch (_) {
              /* ignore */
            }
          }
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
        try {
          const L = getLogger();
          L.error && L.error('Erro ao atribuir lineups para match', err, match);
        } catch (_) {
          /* ignore */
        }
      }
    });
  }

  function simulateDay() {
    // Guard: only allow simulation to start if it was initiated by a
    // user action (clicked the simulate button) or an explicit opt-in flag
    // (`window.__allowProgrammaticSim`), otherwise ignore to prevent
    // unwanted programmatic starts (e.g. automated clicks).
    try {
      const win = typeof window !== 'undefined' ? window : null;
      const allowed = (win && win.__userInitiatedSim) || (win && win.__allowProgrammaticSim);
      if (!allowed) {
        const L = getLogger();
        L.info && L.info('simulateDay blocked: not user-initiated');
        return;
      }
    } catch (e) {
      /* ignore guard errors and proceed */
    }
    // original implementation moved here for clarity
    // actual simulate implementation relies on the functions below and will be exposed as window.simulateDay by this module

    if (isSimulating) {
      try {
        const L = getLogger();
        L.warn &&
          L.warn('simulateDay called but already simulating (Jornada', window.currentJornada, ')');
      } catch (_) {
        /* ignore */
      }
      return;
    }
    isSimulating = true;
    try {
      const L =
        typeof window !== 'undefined' && window.Elifoot && window.Elifoot.Logger
          ? window.Elifoot.Logger
          : console;
      L.info && L.info('Iniciando simulação (Jornada', window.currentJornada, ')...');
      // diagnostic removed: call-stack logging suppressed in production
    } catch (_) {
      /* ignore */
    }

    try {
      assignStartingLineups(window.currentRoundMatches);
    } catch (e) {
      try {
        const L = getLogger();
        L.error && L.error('Erro ao atribuir lineups antes da simulação', e);
      } catch (_) {
        /* ignore */
      }
    }

    function proceedToMatch() {
      try {
        document.getElementById('screen-hub').style.setProperty('display', 'none', 'important');
      } catch (e) {
        /* ignore */
      }
      try {
        document.getElementById('screen-match').style.setProperty('display', 'flex', 'important');
      } catch (e) {
        /* ignore */
      }
      try {
        if (typeof renderInitialMatchBoard === 'function')
          renderInitialMatchBoard(window.allDivisions);
      } catch (e) {
        try {
          const L = getLogger();
          L.error && L.error('renderInitialMatchBoard not found', e);
        } catch (_) {
          /* ignore */
        }
        isSimulating = false;
      }
    }

    // Compute timing configuration before starting the loop so we can
    // schedule the interval with the correct per-minute tick duration.
    const HALF_MS =
      (window.GameConfig && window.GameConfig.timing && window.GameConfig.timing.halfDurationMs) ||
      20000;
    const MIN_TICK =
      (window.GameConfig && window.GameConfig.timing && window.GameConfig.timing.minTickMs) || 20;
    const perMinuteMs = Math.max(MIN_TICK, Math.round(HALF_MS / 45));

    // Show intro overlay (team/kit) if available, then proceed to match.
    // Start the main simulation loop only after the match screen is visible
    // and after a short delay so the user has time to see the menu.
    const START_DELAY_MS =
      (window.GameConfig && window.GameConfig.timing && window.GameConfig.timing.startDelayMs) ||
      700;
    if (typeof showIntroOverlay === 'function') {
      try {
        showIntroOverlay(window.playerClub, () => {
          try {
            proceedToMatch();
          } catch (e) {
            /* ignore */
          }
          try {
            setTimeout(() => {
              simIntervalId = setInterval(simulationTick, perMinuteMs);
            }, START_DELAY_MS);
          } catch (e) {
            simIntervalId = setInterval(simulationTick, perMinuteMs);
          }
        });
      } catch (e) {
        proceedToMatch();
        const L = getLogger();
        L.info &&
          L.info('Scheduling simulation interval in', START_DELAY_MS, 'ms, tick=', perMinuteMs);
        setTimeout(() => {
          const L2 = getLogger();
          L2.info && L2.info('Starting simulation interval, tick=', perMinuteMs);
          simIntervalId = setInterval(simulationTick, perMinuteMs);
        }, START_DELAY_MS);
      }
    } else {
      proceedToMatch();
      setTimeout(() => {
        simIntervalId = setInterval(simulationTick, perMinuteMs);
      }, START_DELAY_MS);
    }

    let minute = 0;
    function simulationTick() {
      minute++;
      
      if (minute === 45) {
        try {
          const L = getLogger();
          L.info && L.info(`⏱️ Intervalo da partida (Jornada ${window.currentJornada}).`);
        } catch(e) {}
      }

      const HALF_MINUTE =
        (window.GameConfig && window.GameConfig.rules && window.GameConfig.rules.halftimeMinute) ||
        46;
      if (minute === HALF_MINUTE) {
        const playerMatch = (window.currentRoundMatches || []).find(
          (m) => m.homeClub === window.playerClub || m.awayClub === window.playerClub
        );
        if (playerMatch && typeof showHalfTimeSubsOverlay === 'function') {
          if (simIntervalId) {
            clearInterval(simIntervalId);
            simIntervalId = null;
          }
          showHalfTimeSubsOverlay(window.playerClub, playerMatch, () => {
            if (simIntervalId) {
              clearInterval(simIntervalId);
              simIntervalId = null;
            }
            simIntervalId = setInterval(simulationTick, perMinuteMs);
          });
          return;
        }
      }

      if (minute > 90) {
        if (simIntervalId) {
          clearInterval(simIntervalId);
          simIntervalId = null;
        }
        try {
          const L = getLogger();
          L.info && L.info(`🏁 Fim dos jogos (Jornada ${window.currentJornada}).`);
        } catch(e) {}
        endSimulation();
        return;
      }

      if (typeof window.advanceMatchDay === 'function') {
        const updates = window.advanceMatchDay(window.currentRoundMatches, minute);
        if (typeof window.updateDayProgress === 'function') window.updateDayProgress(minute);
        else if (typeof updateDayProgress === 'function') updateDayProgress(minute);
        
        if (Array.isArray(updates)) {
          updates.forEach((update) => {
            if (!update || !update.match || typeof update.match.index === 'undefined') return;
            const fullMatch = window.currentRoundMatches[update.match.index];
            if (!fullMatch) return;
            if (typeof window.updateMatchBoardLine === 'function')
              window.updateMatchBoardLine(update.match.index, fullMatch);
            else if (typeof updateMatchBoardLine === 'function')
              updateMatchBoardLine(update.match.index, fullMatch);
          });
        }
      } else {
        try {
          const L = getLogger();
          L.error && L.error('Função advanceMatchDay não encontrada (matches.js).');
        } catch (_) {
          /* ignore */
        }
        if (simIntervalId) {
          clearInterval(simIntervalId);
          simIntervalId = null;
        }
        endSimulation();
      }
    }

    // Note: simIntervalId is started above after intro/match render and delay.
  }

  function endSimulation() {
    // clear any running interval and mark simulation as finished
    try {
      if (simIntervalId) {
        clearInterval(simIntervalId);
        simIntervalId = null;
      }
    } catch (e) {
      /* ignore */
    }
    isSimulating = false;
    if (typeof updateClubStatsAfterMatches === 'function')
      updateClubStatsAfterMatches(window.currentRoundMatches);
    try {
      const progressContainer = document.getElementById('progress-container');
      if (progressContainer) progressContainer.style.display = 'none';
    } catch (e) {
      /* ignore */
    }
    try {
      if (typeof finishDayAndReturnToHub === 'function') {
        finishDayAndReturnToHub();
        return;
      }
    } catch (e) {
      /* ignore */
    }
    try {
      document.getElementById('screen-match').style.setProperty('display', 'none', 'important');
      document.getElementById('screen-hub').style.setProperty('display', 'flex', 'important');
      if (typeof renderHubContent === 'function') renderHubContent('menu-standings');
    } catch (e) {
      try {
        const L = getLogger();
        L.warn && L.warn('endSimulation fallback failed', e);
      } catch (_) {
        /* ignore */
      }
    }
  }

  function finishDayAndReturnToHub() {
    try {
      if (Array.isArray(window.currentRoundMatches)) {
        window.currentRoundMatches.forEach((m) => {
          if (m) m.isFinished = true;
        });
        if (typeof updateClubStatsAfterMatches === 'function')
          updateClubStatsAfterMatches(window.currentRoundMatches);
      }
    } catch (e) {
      try {
        const L = getLogger();
        L.warn && L.warn('finishDayAndReturnToHub: error finalizing matches', e);
      } catch (_) {
        /* ignore */
      }
    }

    window.currentJornada = (window.currentJornada || 1) + 1;
    // Detect end of season: assume season length equals number of rounds in top division
    try {
      if (
        typeof window.generateRounds === 'function' &&
        Array.isArray(window.allDivisions) &&
        window.allDivisions.length
      ) {
        const topDivClubs = window.allDivisions[0] || [];
        const topRounds = window.generateRounds(topDivClubs);
        const seasonLength = Array.isArray(topRounds) ? topRounds.length : 0;
        
        // AVALIAÇÃO DE TREINADORES (Meio da Época e Final)
        if (seasonLength > 0) {
          const isMidSeason = (window.currentJornada === Math.floor(seasonLength / 2) + 1);
          const isEndSeason = (window.currentJornada > seasonLength);
          if (isMidSeason || isEndSeason) processManagerMovements(isEndSeason);
        }

        if (seasonLength > 0 && (window.currentJornada || 0) > seasonLength) {
          // Season finished -> apply promotions/relegations
          
          // --- PRÉMIOS DE FIM DE ÉPOCA (ESTATÍSTICAS) ---
          try {
             let prizeMsg = "";
             let totalPrize = 0;
             const fm = typeof window.formatMoney === 'function' ? window.formatMoney : (v => v + ' €');

             // Melhor Ataque e Defesa Global
             const allClubsFlat = window.allClubs || [];
             const sortedByAttack = [...allClubsFlat].sort((a, b) => (b.goalsFor || 0) - (a.goalsFor || 0));
             const sortedByDefense = [...allClubsFlat].sort((a, b) => (a.goalsAgainst || 0) - (b.goalsAgainst || 0));

             if (sortedByAttack[0] === window.playerClub) {
                 prizeMsg += "🏆 Melhor Ataque Global: +" + fm(500000) + "\n";
                 totalPrize += 500000;
             }
             if (sortedByDefense[0] === window.playerClub) {
                 prizeMsg += "🛡️ Melhor Defesa Global: +" + fm(500000) + "\n";
                 totalPrize += 500000;
             }

             // Top 10 Marcadores Global
             const allPlayers = [];
             allClubsFlat.forEach(c => {
               if (c && c.team && c.team.players) c.team.players.forEach(p => allPlayers.push({ p, club: c }));
             });
             allPlayers.sort((a, b) => (b.p.goals || 0) - (a.p.goals || 0));
             
             const globalTop10 = allPlayers.slice(0, 10);
             globalTop10.forEach((item, index) => {
               if (item.club === window.playerClub) {
                   const prize = (10 - index) * 50000; // 1º: 500k, 2º: 450k ... 10º: 50k
                   prizeMsg += `👟 ${item.p.name} (${index+1}º Melhor Marcador): +${fm(prize)}\n`;
                   totalPrize += prize;
               }
             });

             if (totalPrize > 0) {
                 window.playerClub.budget = (window.playerClub.budget || 0) + totalPrize;
                 alert(`FIM DE ÉPOCA - PRÉMIOS DE DESEMPENHO\n\n${prizeMsg}\nTotal recebido: ${fm(totalPrize)}`);
             }
          } catch (e) { /* ignore */ }

          try {
            if (
              window.Promotion &&
              typeof window.Promotion.applyPromotionRelegation === 'function'
            ) {
              const promoResult = window.Promotion.applyPromotionRelegation(
                window.allDivisions || []
              );
              // update global divisions and clubs
              window.allDivisions = promoResult.newDivisions || window.allDivisions || [];
              // flatten clubs list
              window.allClubs = (window.allDivisions || []).reduce(
                (acc, d) => acc.concat(d || []),
                []
              );
              // normalize division property on clubs
              window.allClubs.forEach((c, idx) => {
                if (c)
                  c.division =
                    c.division || (c.team && c.team.division) || Math.floor(idx / 18) + 1;
              });

              // persist season results snapshot
              try {
                const results = {
                  promoted: promoResult.promoted,
                  relegated: promoResult.relegated,
                };
                if (
                  window.Elifoot &&
                  window.Elifoot.Persistence &&
                  typeof window.Elifoot.Persistence.saveSeasonResults === 'function'
                ) {
                  try {
                    window.Elifoot.Persistence.saveSeasonResults(results);
                  } catch (e) {
                    /* ignore */
                  }
                } else {
                  try {
                    localStorage.setItem('elifoot_last_season_results', JSON.stringify(results));
                  } catch (e) {
                    /* ignore */
                  }
                }
              } catch (e) {
                /* ignore */
              }

              // show overlay if UI is available
              if (window.Overlays && typeof window.Overlays.showSeasonSummary === 'function') {
                try {
                  window.Overlays.showSeasonSummary({
                    promoted: promoResult.promoted,
                    relegated: promoResult.relegated,
                    champions:
                      promoResult.newDivisions &&
                      promoResult.newDivisions[0] &&
                      promoResult.newDivisions[0].length
                        ? promoResult.newDivisions[0]
                            .slice()
                            .sort((a, b) => (b.points || 0) - (a.points || 0))[0]
                        : null,
                  });
                } catch (e) {
                  try {
                    const L = getLogger();
                    L.warn && L.warn('Could not show season summary overlay', e);
                  } catch (_) {
                    /* ignore */
                  }
                }
              } else {
                try {
                  const L =
                    typeof window !== 'undefined' && window.Elifoot && window.Elifoot.Logger
                      ? window.Elifoot.Logger
                      : console;
                  L.info &&
                    L.info(
                      'Season finished — promotions:',
                      promoResult.promoted,
                      'relegations:',
                      promoResult.relegated
                    );
                } catch (_) {
                  /* ignore */
                }
              }
            }
          } catch (e) {
            try {
              const L = getLogger();
              L.warn && L.warn('applyPromotionRelegation failed', e);
            } catch (_) {
              /* ignore */
            }
          }
        }
      }
    } catch (e) {
      /* ignore detection errors */
    }
    try {
      document.getElementById('screen-match').style.setProperty('display', 'none', 'important');
      document.getElementById('screen-hub').style.setProperty('display', 'flex', 'important');
        // Ir imediatamente para o ecrã de Classificações
        if (typeof renderHubContent === 'function') {
          renderHubContent('menu-standings');
        }
    } catch (e) {
      /* ignore */
    }

    // mark simulation state cleared
    try {
      if (simIntervalId) {
        clearInterval(simIntervalId);
        simIntervalId = null;
      }
    } catch (e) {
      /* ignore */
    }
    isSimulating = false;

    try {
      if (typeof window.generateRounds === 'function') {
        const nextRoundMatches = [];
        (window.allDivisions || []).forEach((divisionClubs) => {
          const rounds = window.generateRounds(divisionClubs);
          if (!Array.isArray(rounds) || rounds.length === 0) return;
          let roundIndex = ((window.currentJornada || 1) - 1) % rounds.length;
          try {
            if (
              window.playerClub &&
              Array.isArray(window.currentRoundMatches) &&
              window.currentRoundMatches.length
            ) {
              const isPlayerInThisDivision = divisionClubs.some((dc) => dc === window.playerClub);
              if (isPlayerInThisDivision) {
                const lastMatch = window.currentRoundMatches.find(
                  (m) => m && (m.homeClub === window.playerClub || m.awayClub === window.playerClub)
                );
                const lastOpponent = lastMatch
                  ? lastMatch.homeClub === window.playerClub
                    ? lastMatch.awayClub
                    : lastMatch.homeClub
                  : null;
                if (lastOpponent) {
                  let tries = 0;
                  while (tries < rounds.length) {
                    const candidateRound = rounds[roundIndex];
                    if (!Array.isArray(candidateRound)) break;
                    const candidateMatch = candidateRound.find(
                      (m) =>
                        m && (m.homeClub === window.playerClub || m.awayClub === window.playerClub)
                    );
                    if (!candidateMatch) break;
                    const candidateOpp =
                      candidateMatch.homeClub === window.playerClub
                        ? candidateMatch.awayClub
                        : candidateMatch.homeClub;
                    if (!candidateOpp || !candidateOpp.team || !lastOpponent.team) break;
                    if (candidateOpp.team.name !== lastOpponent.team.name) break;
                    roundIndex = (roundIndex + 1) % rounds.length;
                    tries++;
                  }
                }
              }
            }
          } catch (e) {
            try {
              const L = getLogger();
              L.warn && L.warn('Erro ao evitar repetição de adversário na geração de rondas:', e);
            } catch (_) {
              /* ignore */
            }
          }
          if (rounds[roundIndex]) nextRoundMatches.push(...rounds[roundIndex]);
        });
        window.currentRoundMatches = nextRoundMatches;
        try {
          assignStartingLineups(window.currentRoundMatches);
        } catch (e) {
          try {
            const L = getLogger();
            L.error && L.error('ERRO ao atribuir lineups:', e);
          } catch (_) {
            /* ignore */
          }
        }
        try {
          const snap = {
            currentJornada: window.currentJornada,
            playerClub: window.playerClub,
            allDivisions: window.allDivisions,
            allClubs: window.allClubs,
            currentRoundMatches: window.currentRoundMatches,
          };
          if (PersistenceAPI && typeof PersistenceAPI.saveSnapshot === 'function') {
            try {
              PersistenceAPI.saveSnapshot(snap);
            } catch (e) {
              /* ignore */
            }
          } else {
            try {
              localStorage.setItem('footlab_t1_save_snapshot', JSON.stringify(snap));
            } catch (_) {}
            try {
              localStorage.setItem('elifoot_save_snapshot', JSON.stringify(snap));
            } catch (_) {}
          }
        } catch (e) {
          /* ignore */
        }
      }
    } catch (e) {
      try {
        const L = getLogger();
        L.warn && L.warn('finishDayAndReturnToHub main error', e);
      } catch (_) {
        /* ignore */
      }
    }

    try {
      if (typeof seasonalSkillDrift === 'function') seasonalSkillDrift(window.allDivisions);
    } catch (e) {
      /* ignore */
    }

    // Populate pending releases / transfer candidates after seasonal drift so UI can show offers
    try {
      if (typeof selectExpiringPlayersToLeave === 'function') {
        selectExpiringPlayersToLeave(window.allDivisions, { probability: 0.35, maxPerClub: 1 });
      }
    } catch (err) {
      try {
        const L = getLogger();
        L.warn && L.warn('selectExpiringPlayersToLeave failed in finishDayAndReturnToHub:', err);
      } catch (_) {
        /* ignore */
      }
    }
    try {
      if (typeof selectPlayersForRelease === 'function') {
        selectPlayersForRelease(window.allDivisions, { probability: 0.02, maxPerClub: 1 });
      }
    } catch (err) {
      try {
        const L = getLogger();
        L.warn && L.warn('selectPlayersForRelease failed in finishDayAndReturnToHub:', err);
      } catch (_) {
        /* ignore */
      }
    }

    // Ensure a minimum number of pending releases so early rounds reliably show activity.
    try {
      window.PENDING_RELEASES = window.PENDING_RELEASES || [];
      const allClubs = Array.isArray(window.allClubs) ? window.allClubs : [];
      const clubCount = allClubs.length || 0;

      // configuration hook: window.GameConfig.transfer
      const cfg = (window.GameConfig && window.GameConfig.transfer) || {};
      const cfgMin = typeof cfg.minPendingReleases === 'number' ? cfg.minPendingReleases : null;
      const cfgEarly =
        typeof cfg.minPendingReleasesEarly === 'number' ? cfg.minPendingReleasesEarly : null;
      const earlyJornadas = typeof cfg.earlyJornadas === 'number' ? cfg.earlyJornadas : 6;

      // target: at least 1 pending per ~12 clubs, but min 2 and max 6 by default
      const baseTargetDefault = Math.max(2, Math.min(6, Math.floor(clubCount / 12) || 2));
      const jornada = Number(window.currentJornada || 1);

      let target;
      if (jornada <= earlyJornadas) {
        target = cfgEarly != null ? cfgEarly : Math.max(baseTargetDefault, 3);
      } else {
        target = cfgMin != null ? cfgMin : baseTargetDefault;
      }

      // quick filler: iterate clubs and add one clone per club until we reach target
      if ((window.PENDING_RELEASES || []).length < target) {
        for (
          let c = 0;
          c < allClubs.length && (window.PENDING_RELEASES || []).length < target;
          c++
        ) {
          const club = allClubs[c];
          try {
            if (!club || !club.team || !Array.isArray(club.team.players)) continue;
            // pick the first non-pending player from the club
            const candidate = club.team.players.find((p) => {
              if (!p) return false;
              const already = (window.PENDING_RELEASES || []).find(
                (x) => (x && x.id && p.id && x.id === p.id) || (x && x.name && x.name === p.name)
              );
              return !already;
            });
            if (!candidate) continue;
            const clone = Object.assign({}, candidate);
            clone.previousSalary = Number(candidate.salary || 0);
            try {
              clone.playerValue = computePlayerMarketValue(
                clone,
                club && club.division ? club.division : 4
              );
            } catch (e) {
              clone.playerValue = 0;
            }
            clone.leavingFee = Math.max(0, Math.round((clone.playerValue || 0) * 0.8));
            clone.previousClubName = (club.team && club.team.name) || club.name || '';
            clone.originalClubRef = club;
            window.PENDING_RELEASES.push(clone);
          } catch (e) {
            /* ignore per-club filler errors */
          }
        }
      }
    } catch (e) {
      try {
        const L = getLogger();
        L.warn && L.warn('ensurePendingReleases filler failed:', e);
      } catch (_) {
        /* ignore */
      }
    }

    try {
      // Removido autoProcessPendingReleases inicial.
      // A IA só vai contratar jogadores DEPOIS de o humano os rejeitar.
      
      // Fluxo Sequencial: 1º Resumo Transferências -> 2º Ofertas Emprego -> 3º Propostas Jogadores -> 4º Hub
      setTimeout(() => {
        const recentTransfers = (window.TRANSFER_HISTORY || []).filter(t => t.jornada === window.currentJornada && t.type === 'purchase');
        
        const checkPending = () => {
          const externalReleases = (window.PENDING_RELEASES || []).filter(
            (p) => p.originalClubRef !== window.playerClub
          );

          if (externalReleases.length === 0) {
            if (typeof window.processPendingReleases === 'function') window.processPendingReleases();
            window.PENDING_RELEASES = [];
            if (typeof renderHubContent === 'function') renderHubContent('menu-team');
            return;
          }

          const processNextRelease = (index) => {
            if (index >= externalReleases.length) {
              // Quando o humano terminar as suas decisões, a IA compra os que restam
              if (typeof window.processPendingReleases === 'function') window.processPendingReleases();
              window.PENDING_RELEASES = []; 
              if (typeof renderHubContent === 'function') renderHubContent('menu-team');
              return;
            }

            const p = externalReleases[index];
            showSingleReleasePopup(p, (accepted, offerSalary, rivalClub, rivalSalary) => {
              if (accepted) {
                const fee = p.leavingFee || 0;
                if (window.playerClub && (window.playerClub.budget || 0) >= fee) {
                  window.playerClub.budget -= fee;
                  if (!window.playerClub.team.players) window.playerClub.team.players = [];
                  
                  p.salary = offerSalary || p.minContract || p.salary || 0;
                  p.contractYears = 2; // Assina por 2 anos
                  window.playerClub.team.players.push(p);

                  if (p.originalClubRef && p.originalClubRef.team && p.originalClubRef.team.players) {
                    const idx = p.originalClubRef.team.players.findIndex((x) => x.id === p.id || x.name === p.name);
                    if (idx !== -1) p.originalClubRef.team.players.splice(idx, 1);
                  }

                  window.TRANSFER_HISTORY = window.TRANSFER_HISTORY || [];
                  window.TRANSFER_HISTORY.push({ player: p.name, from: p.previousClubName || 'Mercado Livre', to: window.playerClub.team.name, fee: fee, salary: p.salary, type: 'purchase', jornada: window.currentJornada, time: Date.now() });
                  
                  const pendingIdx = window.PENDING_RELEASES.indexOf(p);
                  if (pendingIdx !== -1) window.PENDING_RELEASES.splice(pendingIdx, 1);
                } else {
                  alert(`Não tens orçamento suficiente para pagar o prémio de assinatura de ${typeof window.formatMoney === 'function' ? window.formatMoney(fee) : fee + ' €'}.`);
                }
              } else if (rivalClub && !accepted) {
                const fee = p.leavingFee || 0;
                rivalClub.budget = Math.max(0, (rivalClub.budget || 0) - fee);
                p.salary = rivalSalary || p.minContract || p.salary || 0;
                p.contractYears = 2;
                if (!rivalClub.team.players) rivalClub.team.players = [];
                rivalClub.team.players.push(p);
                if (p.originalClubRef && p.originalClubRef.team && p.originalClubRef.team.players) {
                  const idx = p.originalClubRef.team.players.findIndex((x) => x.id === p.id || x.name === p.name);
                  if (idx !== -1) p.originalClubRef.team.players.splice(idx, 1);
                }
                window.TRANSFER_HISTORY = window.TRANSFER_HISTORY || [];
                window.TRANSFER_HISTORY.push({ player: p.name, from: p.previousClubName || 'Mercado Livre', to: rivalClub.team.name, fee: fee, salary: p.salary, type: 'purchase', jornada: window.currentJornada, time: Date.now() });
                const pendingIdx = window.PENDING_RELEASES.indexOf(p);
                if (pendingIdx !== -1) window.PENDING_RELEASES.splice(pendingIdx, 1);
              }
              processNextRelease(index + 1);
            });
          };

          processNextRelease(0);
        };

        const checkJobOffers = () => {
          if (window.Offers && typeof window.Offers.showJobOffersPopup === 'function' && window.PLAYER_JOB_OFFERS && window.PLAYER_JOB_OFFERS.length > 0) {
            window.Offers.showJobOffersPopup(checkPending);
          } else {
            checkPending();
          }
        };

        if (window.Offers && typeof window.Offers.showTransferNewsPopup === 'function' && recentTransfers.length > 0) {
          window.Offers.showTransferNewsPopup(recentTransfers, checkJobOffers);
        } else {
          checkJobOffers();
        }
      }, 500);
    } catch (e) {
      /* ignore */
    }

    try {
      if (Array.isArray(window.allClubs)) {
        window.allClubs.forEach((club) => {
          if (club && club.team && Array.isArray(club.team.players)) {
            club.team.players.forEach((p) => {
              if (p && typeof p.suspendedGames === 'number' && p.suspendedGames > 0)
                p.suspendedGames = Math.max(0, p.suspendedGames - 1);
              if (p) p.yellowCards = 0;
              if (p) p.sentOff = false;
            });
          }
        });
      }
    } catch (e) {
      try {
        const L = getLogger();
        L.warn && L.warn('Erro ao decrementar suspensões:', e);
      } catch (_) {
        /* ignore */
      }
    }
  }

  function fastForwardSeason() {
    if (isSimulating) return alert("Já existe uma simulação a decorrer!");
    if (!confirm("Isto vai simular todos os jogos restantes da época instantaneamente. Tem a certeza?")) return;
    
    isSimulating = true;
    
    const topDivClubs = window.allDivisions[0] || [];
    const topRounds = window.generateRounds ? window.generateRounds(topDivClubs) : [];
    const totalRounds = topRounds.length || 34;
    
    let seasonEndData = null;
    let promoData = null;
    
    // Avisar o utilizador que o jogo está a processar
    try { document.getElementById('hub-main-content').innerHTML = '<div style="display:flex; height:100%; justify-content:center; align-items:center;"><h2 style="color:#ffeb3b; text-align:center;">A simular o resto da época...<br><span style="font-size:0.6em; color:#aaa;">Isto pode demorar alguns segundos.</span></h2></div>'; } catch(e){}
    
    // Timeout pequeno para dar tempo de o browser desenhar o ecrã de Loading acima
    setTimeout(() => {
      while (window.currentJornada <= totalRounds) {
        assignStartingLineups(window.currentRoundMatches);
        
        for (let min = 1; min <= 90; min++) {
          if (typeof window.advanceMatchDay === 'function') {
            window.advanceMatchDay(window.currentRoundMatches, min);
          }
        }
        
        if (Array.isArray(window.currentRoundMatches)) {
          window.currentRoundMatches.forEach((m) => { if (m) m.isFinished = true; });
          updateClubStatsAfterMatches(window.currentRoundMatches);
        }
        
        window.currentJornada++;
        
        if (window.currentJornada === Math.floor(totalRounds / 2) + 1) {
          processManagerMovements(false); // Despedimentos a meio da época
        }
        
        // Manutenção de final de jornada (Drifts e Mercado IA)
        try { if (typeof seasonalSkillDrift === 'function') seasonalSkillDrift(window.allDivisions); } catch (e) {}
        try { if (typeof selectExpiringPlayersToLeave === 'function') selectExpiringPlayersToLeave(window.allDivisions, { probability: 0.35, maxPerClub: 1 }); } catch (e) {}
        try { if (typeof selectPlayersForRelease === 'function') selectPlayersForRelease(window.allDivisions, { probability: 0.02, maxPerClub: 1 }); } catch (e) {}
        try { if (typeof window.processPendingReleases === 'function') window.processPendingReleases(); } catch (e) {}
        
        if (window.currentJornada > totalRounds) {
          // --- FIM DE ÉPOCA ---
          processManagerMovements(true); // Despedimentos no fim da época
          try {
             let prizeMsg = "";
             let totalPrize = 0;
             const fm = typeof window.formatMoney === 'function' ? window.formatMoney : (v => v + ' €');

             const allClubsFlat = window.allClubs || [];
             const sortedByAttack = [...allClubsFlat].sort((a, b) => (b.goalsFor || 0) - (a.goalsFor || 0));
             const sortedByDefense = [...allClubsFlat].sort((a, b) => (a.goalsAgainst || 0) - (b.goalsAgainst || 0));

             if (sortedByAttack[0] === window.playerClub) { prizeMsg += "🏆 Melhor Ataque Global: +" + fm(500000) + "\n"; totalPrize += 500000; }
             if (sortedByDefense[0] === window.playerClub) { prizeMsg += "🛡️ Melhor Defesa Global: +" + fm(500000) + "\n"; totalPrize += 500000; }
             if (sortedByAttack[0] === window.playerClub) { prizeMsg += "🏆 Melhor Ataque: +" + fm(500000) + "<br>"; totalPrize += 500000; }
             if (sortedByDefense[0] === window.playerClub) { prizeMsg += "🛡️ Melhor Defesa: +" + fm(500000) + "<br>"; totalPrize += 500000; }

             const allPlayers = [];
             allClubsFlat.forEach(c => { if (c && c.team && c.team.players) c.team.players.forEach(p => allPlayers.push({ p, club: c })); });
             allPlayers.sort((a, b) => (b.p.goals || 0) - (a.p.goals || 0));
             
             const d1 = window.allDivisions[0] || [];
             const championD1 = [...d1].sort((a, b) => {
               if (b.points !== a.points) return b.points - a.points;
               const diffA = (a.goalsFor || 0) - (a.goalsAgainst || 0);
               const diffB = (b.goalsFor || 0) - (b.goalsAgainst || 0);
               if (diffA !== diffB) return diffB - diffA;
               return (b.goalsFor || 0) - (a.goalsFor || 0);
             })[0];
             if (championD1 === window.playerClub) { prizeMsg += "🥇 Campeão 1ª Divisão: +" + fm(2000000) + "<br>"; totalPrize += 2000000; }

             const globalTop10 = allPlayers.slice(0, 10);
             globalTop10.forEach((item, index) => {
               if (item.club === window.playerClub) {
                   const prize = (10 - index) * 50000; 
                   prizeMsg += `👟 ${item.p.name} (${index+1}º Melhor Marcador): +${fm(prize)}\n`;
                   prizeMsg += `👟 ${item.p.name} (${index+1}º Melhor Marcador): +${fm(prize)}<br>`;
                   totalPrize += prize;
               }
             });

             if (totalPrize > 0) {
                 window.playerClub.budget = (window.playerClub.budget || 0) + totalPrize;
                 alert(`FIM DE ÉPOCA - PRÉMIOS DE DESEMPENHO\n\n${prizeMsg}\nTotal recebido: ${fm(totalPrize)}`);
             }

             seasonEndData = { championD1, bestAttack: sortedByAttack[0], bestDefense: sortedByDefense[0], topScorer: allPlayers[0], prizeMsg, totalPrize };
          } catch (e) { /* ignore */ }

          try {
            if (window.Promotion && typeof window.Promotion.applyPromotionRelegation === 'function') {
              const promoResult = window.Promotion.applyPromotionRelegation(window.allDivisions || []);
              window.allDivisions = promoResult.newDivisions || window.allDivisions || [];
              promoData = window.Promotion.applyPromotionRelegation(window.allDivisions || []);
              window.allDivisions = promoData.newDivisions || window.allDivisions || [];
              window.allClubs = (window.allDivisions || []).reduce((acc, d) => acc.concat(d || []), []);
              window.allClubs.forEach((c, idx) => { if (c) c.division = c.division || (c.team && c.team.division) || Math.floor(idx / 18) + 1; });
              alert("A época chegou ao fim! Consulte as Classificações e as Estatísticas.");
            }
          } catch (e) {}
          break;
        } else {
          // Preparar a ronda seguinte para o loop processar
          const nextRoundMatches = [];
          (window.allDivisions || []).forEach((divisionClubs) => {
            const rounds = window.generateRounds(divisionClubs);
            const roundIndex = (window.currentJornada - 1) % rounds.length;
            if (rounds[roundIndex]) nextRoundMatches.push(...rounds[roundIndex]);
          });
          window.currentRoundMatches = nextRoundMatches;
        }
      }
      
      isSimulating = false;
      if (typeof window.renderHubContent === 'function') window.renderHubContent('menu-stats');
      setTimeout(() => { executePostMatchFlow(seasonEndData, promoData, [], true); }, 150);
      
    }, 150);
  }

  // expose both names for compatibility
  window.Simulation = window.Simulation || {};
  window.Simulation.updateClubStatsAfterMatches = updateClubStatsAfterMatches;
  window.Simulation.assignStartingLineups = assignStartingLineups;
  window.Simulation.simulateDay = simulateDay;
  window.Simulation.endSimulation = endSimulation;
  window.Simulation.finishDayAndReturnToHub = finishDayAndReturnToHub;
  window.Simulation.fastForwardSeason = fastForwardSeason;
  window.Simulation._showSingleReleasePopup = showSingleReleasePopup; // For testing/debug

  // Also export legacy global names used elsewhere
  window.updateClubStatsAfterMatches = updateClubStatsAfterMatches;
  window.assignStartingLineups = assignStartingLineups;
  window.simulateDay = simulateDay;
  window.endSimulation = endSimulation;
  window.finishDayAndReturnToHub = finishDayAndReturnToHub;
  window.fastForwardSeason = fastForwardSeason;
})();