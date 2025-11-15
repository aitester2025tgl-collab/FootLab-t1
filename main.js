/* global divisionsData, generateAllClubs, applySkillCaps, generateRounds, renderInitialMatchBoard, initHubUI, renderHubContent, seasonalSkillDrift, selectExpiringPlayersToLeave, selectPlayersForRelease, simulateDay, startGame, assignRandomShortContracts, markSomeContractsExpiring */
/* exported isSimulating, populateTeamSelection, formatNumber, proceedToMatch, endSimulation */
// main.js - VERSÃO COMPLETA SEM toLocaleString

let allDivisions = [];
let playerClub = null;
let allClubs = [];
let coachName = '';
let currentJornada = 1;
let currentRoundMatches = [];
// Simulation state
/* eslint-disable-next-line no-unused-vars */
let isSimulating = false;
let simIntervalId = null;

// Global game name
if (typeof window !== 'undefined') {
  window.GAME_NAME = window.GAME_NAME || 'FootLab t1';
  try {
    if (typeof document !== 'undefined') document.title = window.GAME_NAME;
  } catch (e) {
    /* ignore */
  }
}

// small local logger shim to prefer the centralized logger when available
const MainLogger =
  typeof window !== 'undefined' && window.Elifoot && window.Elifoot.Logger
    ? window.Elifoot.Logger
    : console;
// runtime helper that prefers a fresh window.Elifoot.Logger when available, then MainLogger, then console
function getLogger() {
  return typeof window !== 'undefined' && window.Elifoot && window.Elifoot.Logger
    ? window.Elifoot.Logger
    : MainLogger || console;
}

// UI state for setup (informational only — selection removed)
/* eslint-disable-next-line no-unused-vars */
function populateTeamSelection() {
  try {
    const grid = document.getElementById('team-select-grid');
    if (!grid) return;
    // show first division teams as informational tiles (no selection)
    const teams =
      divisionsData && divisionsData.length && divisionsData[0].teams ? divisionsData[0].teams : [];
    grid.innerHTML = '';
    teams.forEach((t) => {
      const card = document.createElement('div');
      card.className = 'team-select-card';
      card.title = t.name;
      card.innerHTML = `<div class="badge" style="background:${t.bgColor || '#ccc'};border-color:${t.color || '#fff'}"></div><div class="team-name">${t.name}</div>`;
      // informational only, no onclick
      grid.appendChild(card);
    });
  } catch (e) {
    try {
      const L = getLogger();
      L.warn && L.warn('handleOffer: error calling Offers', e);
    } catch (_) {
      /* ignore */
    }
  }
}

function setupInitialUiHandlers() {
  const introBtn = document.getElementById('introContinueBtn');
  if (introBtn) {
    introBtn.addEventListener('click', () => {
      const intro = document.getElementById('intro-screen');
      const setup = document.getElementById('screen-setup');
      if (intro) intro.style.display = 'none';
      if (setup) setup.style.display = 'flex';
    });
  }
  // Auto-advance after a short animation delay with a smooth transition
  try {
    const intro = document.getElementById('intro-screen');
    const setup = document.getElementById('screen-setup');
    if (intro && setup) {
      // Ensure transitions are present
      intro.style.transition = intro.style.transition || 'opacity 600ms ease, transform 600ms ease';
      setup.style.transition = setup.style.transition || 'opacity 600ms ease, transform 600ms ease';
      // Start the sequence after a short pause so the intro can be noticed
      setTimeout(() => {
        // fade out intro
        try {
          intro.style.opacity = '0';
          intro.style.transform = 'translateY(-8px) scale(0.995)';
        } catch (e) {
          /* ignore style errors */
        }

        // after fade completes, hide intro and reveal setup with fade-in
        setTimeout(() => {
          try {
            intro.style.display = 'none';
          } catch (e) {
            /* ignore */
          }
          try {
            setup.style.display = 'flex';
            // start hidden then fade-in
            setup.style.opacity = '0';
            setup.style.transform = 'translateY(6px)';
            // force reflow so transition runs
            // eslint-disable-next-line no-unused-expressions
            setup.offsetWidth;
            setup.style.opacity = '1';
            setup.style.transform = 'none';
          } catch (e) {
            /* ignore */
          }
        }, 620); // wait for intro fade
      }, 900); // allow a shorter delay so intro feels snappy
    }
  } catch (e) {
    /* ignore */
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupInitialUiHandlers);
} else {
  try {
    setupInitialUiHandlers();
  } catch (e) {
    try {
      const L = getLogger();
      L.warn && L.warn('setupInitialUiHandlers failed', e);
    } catch (_) {
      /* ignore */
    }
  }
}

function formatMoney(value) {
  if (!value && value !== 0) return '0 €';
  return (
    Math.floor(value)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €'
  );
}

/* eslint-disable-next-line no-unused-vars */
function formatNumber(value) {
  if (!value && value !== 0) return '0';
  return Math.floor(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// --- SETUP ---
// Bind start button safely and catch runtime errors so we can diagnose failures in the browser
const _startBtn = document.getElementById('startBtn');
if (!_startBtn) {
  try {
    const L = getLogger();
    L.error && L.error('startBtn not found in DOM; cannot start game.');
  } catch (_) {
    /* ignore */
  }
} else {
  _startBtn.addEventListener('click', () => {
    coachName = document.getElementById('coachName').value.trim();
    if (!coachName) {
      alert('Digite o nome do treinador!');
      return;
    }

    if (typeof generateAllClubs === 'function') {
      allClubs = generateAllClubs();
      allDivisions = [[], [], [], []];

      // 1. Distribuir clubes pelas divisões
      allClubs.forEach((club) => {
        if (club.division >= 1 && club.division <= 4) {
          allDivisions[club.division - 1].push(club);
        }
      });

      // 2. Escolher o clube do jogador (Divisão 4) OR use selected team from UI
      const division4 = allDivisions[3];
      if (!Array.isArray(division4) || division4.length === 0) {
        alert('Não existem clubes na Divisão 4 para escolher o seu clube.');
        return;
      }

      // Assign some players short (1-year) contracts if missing and mark a subset as expiring
      try {
        if (typeof assignRandomShortContracts === 'function') {
          assignRandomShortContracts(allDivisions);
        }
      } catch (e) {
        try {
          const L = getLogger();
          L.warn && L.warn('assignRandomShortContracts failed', e);
        } catch (_) {
          /* ignore */
        }
      }
      try {
        if (typeof markSomeContractsExpiring === 'function') {
          // mark ~12% of contracted players as expiring this season so UI shows '*' markers
          markSomeContractsExpiring(allDivisions, 0.12);
        }
      } catch (e) {
        try {
          const L = getLogger();
          L.warn && L.warn('markSomeContractsExpiring failed', e);
        } catch (_) {
          /* ignore */
        }
      }
      // default: random pick from the LAST 8 teams of division 4 (or fewer if division has <8)
      const pool = division4.length > 8 ? division4.slice(-8) : division4.slice();
      let pickedClub = pool[Math.floor(Math.random() * pool.length)];
      playerClub = pickedClub;

      // CRÍTICO: Exportar para o escopo global ANTES de chamar initHubUI
      // keep backwards-compatible globals and also namespace under window.Elifoot
      window.playerClub = playerClub;
      window.allDivisions = allDivisions;
      window.Elifoot = window.Elifoot || {};
      window.Elifoot.playerClub = playerClub;
      window.Elifoot.allDivisions = allDivisions;

      try {
        const L = getLogger();
        L.debug && L.debug('Clube do jogador selecionado:', playerClub);
      } catch (_) {
        /* ignore */
      }
      try {
        const L = getLogger();
        L.debug && L.debug('Equipa do clube:', playerClub.team);
      } catch (_) {
        /* ignore */
      }
      try {
        const L = getLogger();
        L.debug && L.debug('Jogadores da equipa:', playerClub.team.players);
      } catch (_) {
        /* ignore */
      }
      try {
        const L = getLogger();
        L.debug &&
          L.debug(
            'Número de jogadores:',
            playerClub.team.players ? playerClub.team.players.length : 0
          );
      } catch (_) {
        /* ignore */
      } // Apply skill caps so player skills respect division/team caps before generating rounds
      if (typeof applySkillCaps === 'function') {
        try {
          applySkillCaps(allDivisions);
          try {
            const L = getLogger();
            L.debug && L.debug('applySkillCaps executed');
          } catch (_) {
            /* ignore */
          }
        } catch (e) {
          try {
            const L = getLogger();
            L.warn && L.warn('applySkillCaps failed', e);
          } catch (_) {
            /* ignore */
          }
      }

      // 3. Gerar a primeira jornada de jogos para todas as divisões
      if (typeof generateRounds === 'function') {
        const firstRoundMatches = [];
        allDivisions.forEach((divisionClubs) => {
          // Assumindo que generateRounds retorna um array de jornadas [[jornada1], [jornada2], ...]
          const rounds = generateRounds(divisionClubs);
          if (rounds.length > 0) {
            firstRoundMatches.push(...rounds[0]);
          }
        });
        currentRoundMatches = firstRoundMatches;
        // export the generated round to globals/namespace for other modules and tests
        window.currentRoundMatches = currentRoundMatches;
        window.Elifoot = window.Elifoot || {};
        window.Elifoot.currentRoundMatches = currentRoundMatches;

        // Prepare starting lineups and substitutes for each match
        if (Array.isArray(currentRoundMatches)) {
          const _assign =
            typeof window !== 'undefined' &&
            (window.assignStartingLineups ||
              (window.Elifoot && window.Elifoot.assignStartingLineups));
          if (typeof _assign === 'function') _assign(currentRoundMatches);
        }

        // CRÍTICO: Exportar para o escopo global (and namespace)
        // proceedToMatch switches screens and renders the initial board
        /* eslint-disable-next-line no-unused-vars */
        const proceedToMatch = function () {
          document.getElementById('screen-hub').style.display = 'none';
          document.getElementById('screen-match').style.display = 'flex';

          // Remove floating UI elements (they must not persist during match view)
          try {
            const nextFloat = document.getElementById('nextOpponentFloating');
            if (nextFloat && nextFloat.parentNode) {
              nextFloat.parentNode.removeChild(nextFloat);
            }
            const budgetFloat = document.getElementById('budgetFloating');
            if (budgetFloat && budgetFloat.parentNode) {
              budgetFloat.parentNode.removeChild(budgetFloat);
            }
          } catch (e) {
            /* ignore */
          }

          const matchTeamNameEl = document.getElementById('playerTeamNameMatch');
          if (matchTeamNameEl) matchTeamNameEl.textContent = '';

          const hubTeamNameEl = document.getElementById('playerTeamNameHub');
          if (hubTeamNameEl) hubTeamNameEl.textContent = '';

          const teamFooterEl = document.getElementById('playerTeamNameFooter');
          if (teamFooterEl) teamFooterEl.textContent = '';

          if (typeof renderInitialMatchBoard === 'function') {
            renderInitialMatchBoard(allDivisions);
          } else {
            try {
              const L = getLogger();
              L.error && L.error('Função renderInitialMatchBoard não encontrada (ui.js).');
            } catch (_) {
              /* ignore */
            }
            isSimulating = false;
            return;
          }
        };

        // Instead of auto-starting the full match simulation here, show the Hub (team menu)
        // and let the user start simulation manually via the Hub's "SIMULAR" button.
        try {
          // hide setup and show hub
          const setupScreen = document.getElementById('screen-setup');
          if (setupScreen) setupScreen.style.display = 'none';
          const hubScreen = document.getElementById('screen-hub');
          if (hubScreen) hubScreen.style.display = 'flex';
          // initialize hub UI (tactics, roster, etc.) if available
          if (typeof initHubUI === 'function') {
            try {
              initHubUI();
            } catch (e) {
              try {
                const L = getLogger();
                L.warn && L.warn('initHubUI threw during start flow:', e);
              } catch (_) {
                /* ignore */
              }
              if (typeof renderHubContent === 'function')
                try {
                  renderHubContent('menu-team');
                } catch (_) {
                  /* ignore */
                }
            }
          } else if (typeof renderHubContent === 'function') {
            try {
              renderHubContent('menu-team');
            } catch (e) {
              try {
                const L = getLogger();
                L.warn && L.warn('renderHubContent failed during start flow:', e);
              } catch (_) {
                /* ignore */
              }
            }
          }
        } catch (e) {
          try {
            const L = getLogger();
            L.warn && L.warn('Failed to show hub after team selection:', e);
          } catch (_) {
            /* ignore */
          }
        }
      }

      /* eslint-disable-next-line no-unused-vars */
      const endSimulation = function () {
        // ensure any running interval is cleared
        if (simIntervalId) {
          clearInterval(simIntervalId);
          simIntervalId = null;
        }
        // 1. Processar os resultados finais dos jogos e atualizar a classificação
        {
          const _updateClubStats =
            typeof window !== 'undefined' &&
            (window.updateClubStatsAfterMatches ||
              (window.Elifoot && window.Elifoot.updateClubStatsAfterMatches));
          if (typeof _updateClubStats === 'function') {
            _updateClubStats(currentRoundMatches);
          } else {
            try {
              const L = getLogger();
              L.error && L.error('Função updateClubStatsAfterMatches não encontrada (matches.js).');
            } catch (_) {
              /* ignore */
            }
          }
        }
        // 2. Esconder a barra de progresso (botão de simulação aparece)
        const progressContainer = document.getElementById('progress-container');
        if (progressContainer) progressContainer.style.display = 'none';

        // Prefer to reuse finishDayAndReturnToHub so the jornada is incremented and
        // next round is prepared consistently. finishDayAndReturnToHub calls
        // updateClubStatsAfterMatches as well but that function guards against double-counting.
        try {
          isSimulating = false;
          if (typeof finishDayAndReturnToHub === 'function') {
            finishDayAndReturnToHub();
            return;
          }
          // fallback: switch to hub and render standings
          document.getElementById('screen-match').style.display = 'none';
          document.getElementById('screen-hub').style.display = 'flex';
          if (typeof renderHubContent === 'function') renderHubContent('menu-standings');
        } catch (err) {
          try {
            const L = getLogger();
            L.warn && L.warn('endSimulation: could not switch to standings view', err);
          } catch (_) {
            /* ignore */
          }
        }
      };

      const finishDayAndReturnToHub = function () {
        // Ensure today's matches are finalized and stats applied before moving to the next jornada.
        try {
          if (Array.isArray(currentRoundMatches)) {
            // mark all matches finished so updateClubStatsAfterMatches processes them
            currentRoundMatches.forEach((m) => {
              if (m) m.isFinished = true;
            });
            {
              const _updateClubStats =
                typeof window !== 'undefined' &&
                (window.updateClubStatsAfterMatches ||
                  (window.Elifoot && window.Elifoot.updateClubStatsAfterMatches));
              if (typeof _updateClubStats === 'function') {
                _updateClubStats(currentRoundMatches);
                try {
                  const L = getLogger();
                  L.debug &&
                    L.debug(
                      'finishDayAndReturnToHub: updateClubStatsAfterMatches executed for current round'
                    );
                } catch (_) {
                  /* ignore */
                }
              }
            }
          }
        } catch (e) {
          try {
            const L = getLogger();
            L.warn && L.warn('finishDayAndReturnToHub: error finalizing matches', e);
          } catch (_) {
            /* ignore */
          }
        }

        currentJornada++;
        document.getElementById('screen-match').style.display = 'none';
        document.getElementById('screen-hub').style.display = 'flex';

        isSimulating = false;

        const jornadaDisplayEl = document.getElementById('currentJornadaDisplay');
        if (jornadaDisplayEl) jornadaDisplayEl.textContent = `${currentJornada}ª JORNADA`;

        const hubTeamNameEl = document.getElementById('playerTeamNameHub');
        if (hubTeamNameEl && playerClub && playerClub.team)
          hubTeamNameEl.textContent = playerClub.team.name;

        const teamFooterEl = document.getElementById('playerTeamNameFooter');
        if (teamFooterEl && playerClub && playerClub.team)
          teamFooterEl.textContent = playerClub.team.name;

        const progressContainer = document.getElementById('progress-container');
        if (progressContainer) progressContainer.style.display = 'block';

        const finishBtn = document.getElementById('finishSimBtn');
        if (finishBtn) finishBtn.style.display = 'none';

        // CRÍTICO: Gerar próxima jornada corretamente
        if (typeof generateRounds === 'function') {
          const nextRoundMatches = [];
          allDivisions.forEach((divisionClubs) => {
            const rounds = generateRounds(divisionClubs);
            if (!Array.isArray(rounds) || rounds.length === 0) {
              try {
                const L = getLogger();
                L.warn && L.warn('generateRounds retornou vazio para uma divisão');
              } catch (_) {
                /* ignore */
              }
              return;
            }

            // currentJornada já foi incrementado acima, usar índice correto
            let roundIndex = (currentJornada - 1) % rounds.length;

            // Evitar que, para a equipa do jogador, o adversário da próxima jornada seja o mesmo do último jogo.
            // Procuramos pelo último adversário do jogador na jornada que acabámos de finalizar (currentRoundMatches)
            try {
              if (playerClub && Array.isArray(currentRoundMatches) && currentRoundMatches.length) {
                // apenas tentar evitar repetição se o jogador pertencer a esta divisão
                const isPlayerInThisDivision = divisionClubs.some((dc) => dc === playerClub);
                if (isPlayerInThisDivision) {
                  const lastMatch = currentRoundMatches.find(
                    (m) => m && (m.homeClub === playerClub || m.awayClub === playerClub)
                  );
                  const lastOpponent = lastMatch
                    ? lastMatch.homeClub === playerClub
                      ? lastMatch.awayClub
                      : lastMatch.homeClub
                    : null;
                  if (lastOpponent) {
                    // tentar até rounds.length opções para encontrar uma ronda onde o adversário seja diferente
                    let tries = 0;
                    while (tries < rounds.length) {
                      const candidateRound = rounds[roundIndex];
                      if (!Array.isArray(candidateRound)) break;
                      const candidateMatch = candidateRound.find(
                        (m) => m && (m.homeClub === playerClub || m.awayClub === playerClub)
                      );
                      if (!candidateMatch) break; // não há jogo do jogador nesta ronda (p.ex. bye) -> accept
                      const candidateOpp =
                        candidateMatch.homeClub === playerClub
                          ? candidateMatch.awayClub
                          : candidateMatch.homeClub;
                      if (!candidateOpp || !candidateOpp.team || !lastOpponent.team) break;
                      if (candidateOpp.team.name !== lastOpponent.team.name) {
                        // encontramos uma ronda com adversário diferente
                        break;
                      }
                      // caso contrário, tente a próxima ronda
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

            if (rounds[roundIndex]) {
              nextRoundMatches.push(...rounds[roundIndex]);
            } else {
              try {
                const L = getLogger();
                L.warn &&
                  L.warn('Índice de jornada fora de alcance:', roundIndex, 'de', rounds.length);
              } catch (_) {
                /* ignore */
              }
            }
          });

          currentRoundMatches = nextRoundMatches;
          window.currentRoundMatches = currentRoundMatches;

          try {
            const L = getLogger();
            L.info &&
              L.info(
                'finishDayAndReturnToHub: jornada',
                currentJornada,
                'gerou',
                currentRoundMatches.length,
                'jogos'
              );
          } catch (_) {
            /* ignore */
          }

          // Verificar se lineups foram atribuídas
          const sampleMatch = currentRoundMatches[0];
          if (sampleMatch) {
            try {
              const L = getLogger();
              L.debug &&
                L.debug('Exemplo de jogo gerado:', {
                  home: sampleMatch.homeClub?.team?.name,
                  away: sampleMatch.awayClub?.team?.name,
                  homePlayers: sampleMatch.homePlayers?.length,
                  awayPlayers: sampleMatch.awayPlayers?.length,
                });
            } catch (_) {
              /* ignore */
            }
          }

          try {
            const _assign =
              typeof window !== 'undefined' &&
              (window.assignStartingLineups ||
                (window.Elifoot && window.Elifoot.assignStartingLineups));
            if (typeof _assign === 'function') _assign(currentRoundMatches);
            try {
              const L = getLogger();
              L.info && L.info('Lineups atribuídas para próxima jornada');
            } catch (_) {
              /* ignore */
            }
          } catch (e) {
            try {
              const L = getLogger();
              L.error && L.error('ERRO ao atribuir lineups:', e);
            } catch (_) {
              /* ignore */
            }
          }

          // Debug snapshot: save the generated round so we can inspect it later if issues occur
          try {
            const dbg = {
              currentJornada: currentJornada,
              generatedMatchesCount: currentRoundMatches.length,
              matches: currentRoundMatches,
            };
            if (
              window.Elifoot &&
              window.Elifoot.Persistence &&
              typeof window.Elifoot.Persistence.saveDebugSnapshot === 'function'
            ) {
              try {
                window.Elifoot.Persistence.saveDebugSnapshot(dbg);
              } catch (e) {
                /* ignore */
              }
            } else {
              try {
                localStorage.setItem('elifoot_debug_snapshot', JSON.stringify(dbg));
              } catch (e) {
                try {
                  const L = getLogger();
                  L.warn && L.warn('Could not write debug snapshot to localStorage', e);
                } catch (_) {
                  /* ignore */
                }
              }
            }
          } catch (e) {
            try {
              const L = getLogger();
              L.warn && L.warn('Could not write debug snapshot', e);
            } catch (_) {
              /* ignore */
            }
          }

          try {
            const snap = {
              currentJornada: currentJornada,
              playerClub: playerClub,
              allDivisions: allDivisions,
              allClubs: allClubs,
              currentRoundMatches: currentRoundMatches,
            };
            if (
              window.Elifoot &&
              window.Elifoot.Persistence &&
              typeof window.Elifoot.Persistence.saveSnapshot === 'function'
            ) {
              try {
                window.Elifoot.Persistence.saveSnapshot(snap);
              } catch (e) {
                /* ignore */
              }
            } else {
              try {
                localStorage.setItem('elifoot_save_snapshot', JSON.stringify(snap));
              } catch (err) {
                try {
                  const L = getLogger();
                  L.warn && L.warn('Could not write snapshot to localStorage', err);
                } catch (_) {
                  /* ignore */
                }
              }
            }
          } catch (err) {
            try {
              const L = getLogger();
              L.warn && L.warn('Erro ao guardar snapshot:', err);
            } catch (_) {
              /* ignore */
            }
          }
        }

        try {
          if (typeof seasonalSkillDrift === 'function') {
            seasonalSkillDrift(allDivisions);
          }
        } catch (err) {
          try {
            const L = getLogger();
            L.warn && L.warn('Erro em seasonalSkillDrift:', err);
          } catch (_) {
            /* ignore */
          }
        }

        // Populate pending releases / transfer candidates so UI can show players
        try {
          if (typeof selectExpiringPlayersToLeave === 'function') {
            // mark some expiring-contract players as wanting to leave
            selectExpiringPlayersToLeave(allDivisions, { probability: 0.35, maxPerClub: 1 });
          }
        } catch (err) {
          try {
            const L = getLogger();
            L.warn && L.warn('selectExpiringPlayersToLeave failed:', err);
          } catch (_) {
            /* ignore */
          }
        }
        try {
          if (typeof selectPlayersForRelease === 'function') {
            // select a few other players who decide to ask for release
            selectPlayersForRelease(allDivisions, { probability: 0.02, maxPerClub: 1 });
          }
        } catch (err) {
          try {
            const L = getLogger();
            L.warn && L.warn('selectPlayersForRelease failed:', err);
          } catch (_) {
            /* ignore */
          }
        }

        if (typeof renderHubContent === 'function') {
          // Render the team menu. If the simulation flow set the flag,
          // show pending release offers first, otherwise render directly.
          if (
            window._offersPendingOnNextTeamEntry &&
            window.Offers &&
            typeof window.Offers.showPendingReleasesPopup === 'function'
          ) {
            try {
              window._offersPendingOnNextTeamEntry = false;
            } catch (_) {
              /* ignore */
            }
            window.Offers.showPendingReleasesPopup(() => {
              try {
                renderHubContent('menu-team');
              } catch (e) {
                try {
                  const L = getLogger();
                  L.warn && L.warn('renderHubContent failed after offers popup', e);
                } catch (_) {
                  /* ignore */
                }
              }
              try {
                if (typeof window.updateBudgetDisplays === 'function')
                  window.updateBudgetDisplays(playerClub);
              } catch (e) {
                /* ignore */
              }
            });
          } else {
            renderHubContent('menu-team');
            try {
              if (typeof window.updateBudgetDisplays === 'function')
                window.updateBudgetDisplays(playerClub);
            } catch (e) {
              /* ignore */
            }
          }
        }
        }

        // Decrementar suspensões e reset de amarelos
        try {
          if (Array.isArray(allClubs)) {
            allClubs.forEach((club) => {
              if (club && club.team && Array.isArray(club.team.players)) {
                club.team.players.forEach((p) => {
                  if (p && typeof p.suspendedGames === 'number' && p.suspendedGames > 0) {
                    p.suspendedGames = Math.max(0, p.suspendedGames - 1);
                  }
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
      };

      // Expor funções globais para que outros ficheiros (como ui.js) as possam usar
      window.formatMoney = formatMoney;
      window.simulateDay = simulateDay;
      // expose namespaced versions too for compatibility
      window.Elifoot = window.Elifoot || {};
      window.Elifoot.formatMoney = formatMoney;
      window.Elifoot.simulateDay = simulateDay;

      // Load a previously saved snapshot (basic restore)
      const loadSavedGame = function () {
        try {
          const snap =
            window.Elifoot &&
            window.Elifoot.Persistence &&
            typeof window.Elifoot.Persistence.loadSnapshot === 'function'
              ? window.Elifoot.Persistence.loadSnapshot()
              : (function () {
                  try {
                    const raw = localStorage.getItem('elifoot_save_snapshot');
                    return raw ? JSON.parse(raw) : null;
                  } catch (e) {
                    return null;
                  }
                })();
          if (!snap) {
            alert('Nenhum jogo salvo encontrado.');
            return;
          }
          // restore minimal state
          allDivisions = snap.allDivisions || allDivisions;
          allClubs = snap.allClubs || allClubs;
          currentRoundMatches = snap.currentRoundMatches || currentRoundMatches;
          playerClub = snap.playerClub || playerClub;
          currentJornada = snap.currentJornada || currentJornada;

          // export to globals
          window.playerClub = playerClub;
          window.allDivisions = allDivisions;
          window.currentRoundMatches = currentRoundMatches;
          window.Elifoot = window.Elifoot || {};
          window.Elifoot.playerClub = playerClub;
          window.Elifoot.allDivisions = allDivisions;
          window.Elifoot.currentRoundMatches = currentRoundMatches;

          // re-assign starting lineups if missing
          try {
            const _assign =
              typeof window !== 'undefined' &&
              (window.assignStartingLineups ||
                (window.Elifoot && window.Elifoot.assignStartingLineups));
            if (typeof _assign === 'function') _assign(currentRoundMatches);
          } catch (e) {
            /* ignore */
          }

          // move to hub UI
          startGame();
        } catch (err) {
          try {
            const L = getLogger();
            L.error && L.error('Erro ao carregar jogo salvo:', err);
          } catch (_) {
            /* ignore */
          }
          alert('Erro ao carregar o jogo salvo. Verifica o console.');
        }
      };
      window.loadSavedGame = loadSavedGame;

      // `updateClubStatsAfterMatches` is implemented in `core/simulation.js` and
      // exported to `window`. Use that shared implementation rather than
      // duplicating it here.

      // `assignStartingLineups` is provided by `core/simulation.js` and exported to `window`.
      // We use the global implementation to avoid duplicating logic here.
    } // end if generateAllClubs
  }); // end of startBtn click handler
} // end else (startBtn exists)
