// main.js - VERSÃO COMPLETA SEM toLocaleString

let allDivisions = []; 
let playerClub = null; 
let allClubs = []; 
let coachName = "";
let currentJornada = 1;
let currentRoundMatches = []; 
// Simulation state
let isSimulating = false;
let simIntervalId = null;

// Global game name
if (typeof window !== 'undefined') {
    window.GAME_NAME = window.GAME_NAME || 'FootLab t1';
    try { if (typeof document !== 'undefined') document.title = window.GAME_NAME; } catch(e){}
}

// UI state for setup (informational only — selection removed)
function populateTeamSelection(){
    try{
        const grid = document.getElementById('team-select-grid');
        if(!grid) return;
        // show first division teams as informational tiles (no selection)
        const teams = (divisionsData && divisionsData.length && divisionsData[0].teams) ? divisionsData[0].teams : [];
        grid.innerHTML = '';
        teams.forEach(t=>{
            const card = document.createElement('div');
            card.className = 'team-select-card';
            card.title = t.name;
            card.innerHTML = `<div class="badge" style="background:${t.bgColor || '#ccc'};border-color:${t.color || '#fff'}"></div><div class="team-name">${t.name}</div>`;
            // informational only, no onclick
            grid.appendChild(card);
        });
    }catch(e){ console.warn('populateTeamSelection error',e); }
}

function setupInitialUiHandlers(){
    const introBtn = document.getElementById('introContinueBtn');
    if(introBtn){
        introBtn.addEventListener('click', ()=>{
            const intro = document.getElementById('intro-screen');
            const setup = document.getElementById('screen-setup');
            if(intro) intro.style.display = 'none';
            if(setup) setup.style.display = 'flex';
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
                } catch (e) { /* ignore style errors */ }

                // after fade completes, hide intro and reveal setup with fade-in
                setTimeout(() => {
                    try { intro.style.display = 'none'; } catch(e){}
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
                    } catch (e) { /* ignore */ }
                }, 620); // wait for intro fade
            }, 900); // allow a shorter delay so intro feels snappy
        }
    } catch (e) { /* ignore */ }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupInitialUiHandlers);
} else {
    try { setupInitialUiHandlers(); } catch(e) { console.warn('setupInitialUiHandlers failed', e); }
}

function formatMoney(value) {
    if (!value && value !== 0) return '0 €';
    return Math.floor(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €';
}

function formatNumber(value) {
    if (!value && value !== 0) return '0';
    return Math.floor(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// --- SETUP ---
// Bind start button safely and catch runtime errors so we can diagnose failures in the browser
const _startBtn = document.getElementById("startBtn");
if (!_startBtn) {
    console.error('startBtn not found in DOM; cannot start game.');
} else {
    _startBtn.addEventListener("click", () => {
            coachName = document.getElementById("coachName").value.trim();
            if(!coachName){
                alert("Digite o nome do treinador!");
                return;
            }
            
            if (typeof generateAllClubs === 'function') {
        allClubs = generateAllClubs(); 
        allDivisions = [[], [], [], []];

        // 1. Distribuir clubes pelas divisões
        allClubs.forEach(club => {
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
        // default: random pick from the LAST 8 teams of division 4 (or fewer if division has <8)
        const pool = (division4.length > 8) ? division4.slice(-8) : division4.slice();
        let pickedClub = pool[Math.floor(Math.random() * pool.length)];
        playerClub = pickedClub;
        
        // CRÍTICO: Exportar para o escopo global ANTES de chamar initHubUI
        // keep backwards-compatible globals and also namespace under window.Elifoot
        window.playerClub = playerClub;
        window.allDivisions = allDivisions;
        window.Elifoot = window.Elifoot || {};
        window.Elifoot.playerClub = playerClub;
        window.Elifoot.allDivisions = allDivisions;
        
        console.log('Clube do jogador selecionado:', playerClub);
        console.log('Equipa do clube:', playerClub.team);
        console.log('Jogadores da equipa:', playerClub.team.players);
        console.log('Número de jogadores:', playerClub.team.players ? playerClub.team.players.length : 0);

        // Apply skill caps so player skills respect division/team caps before generating rounds
        if (typeof applySkillCaps === 'function') {
            try { applySkillCaps(allDivisions); console.log('applySkillCaps executed'); } catch(e){ console.warn('applySkillCaps failed', e); }
        }

        // 3. Gerar a primeira jornada de jogos para todas as divisões
        if (typeof generateRounds === 'function') {
            const firstRoundMatches = [];
            allDivisions.forEach(divisionClubs => {
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
                    assignStartingLineups(currentRoundMatches);
                }

                // CRÍTICO: Exportar para o escopo global (and namespace)
    // proceedToMatch switches screens and renders the initial board
    function proceedToMatch() {
        document.getElementById("screen-hub").style.display = "none";
        document.getElementById("screen-match").style.display = "flex";

        // Remove floating UI elements (they must not persist during match view)
        try {
            const nextFloat = document.getElementById('nextOpponentFloating');
            if (nextFloat && nextFloat.parentNode) { nextFloat.parentNode.removeChild(nextFloat); }
            const budgetFloat = document.getElementById('budgetFloating');
            if (budgetFloat && budgetFloat.parentNode) { budgetFloat.parentNode.removeChild(budgetFloat); }
        } catch (e) { /* ignore */ }

        const matchTeamNameEl = document.getElementById('playerTeamNameMatch');
        if (matchTeamNameEl) matchTeamNameEl.textContent = '';

        const hubTeamNameEl = document.getElementById('playerTeamNameHub');
        if (hubTeamNameEl) hubTeamNameEl.textContent = '';

        const teamFooterEl = document.getElementById('playerTeamNameFooter');
        if (teamFooterEl) teamFooterEl.textContent = '';

        if (typeof renderInitialMatchBoard === 'function') {
            renderInitialMatchBoard(allDivisions);
        } else {
            console.error("Função renderInitialMatchBoard não encontrada (ui.js).");
            isSimulating = false;
            return;
        }
    }

    // Start: show intro then start simulation
    if (typeof showIntroOverlay === 'function') {
        try { showIntroOverlay(playerClub, proceedToMatch); }
        catch (err) { console.error('Erro ao mostrar intro overlay:', err); proceedToMatch(); }
    } else {
        proceedToMatch();
    }

    // target half duration in milliseconds (from config if available)
    const HALF_MS = (window.GameConfig && window.GameConfig.timing && window.GameConfig.timing.halfDurationMs) || 20000;
    const MIN_TICK = (window.GameConfig && window.GameConfig.timing && window.GameConfig.timing.minTickMs) || 20;
    const perMinuteMs = Math.max(MIN_TICK, Math.round(HALF_MS / 45));

    // simulation tick
    let minute = 0;
    function simulationTick() {
        minute++;

        // Pause at half-time to allow subs for player's match
    const HALF_MINUTE = (window.GameConfig && window.GameConfig.rules && window.GameConfig.rules.halftimeMinute) || 46;
    if (minute === HALF_MINUTE) {
            const playerMatch = currentRoundMatches.find(m => (m.homeClub === playerClub) || (m.awayClub === playerClub));
            if (playerMatch && typeof showHalfTimeSubsOverlay === 'function') {
                if (simIntervalId) { clearInterval(simIntervalId); simIntervalId = null; }
                showHalfTimeSubsOverlay(playerClub, playerMatch, () => {
                    // resume
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
            const updates = advanceMatchDay(currentRoundMatches, minute);
            if (typeof updateDayProgress === 'function') updateDayProgress(minute);
            if (Array.isArray(updates)) {
                updates.forEach(update => {
                    if (!update || !update.match) return;
                    if (typeof updateMatchBoardLine === 'function') updateMatchBoardLine(update.match.index, update.match);
                });
            }
        } else {
            console.error("Função advanceMatchDay não encontrada (matches.js).");
            if (simIntervalId) { clearInterval(simIntervalId); simIntervalId = null; }
            endSimulation();
        }
    }

    // start with the per-minute interval derived from HALF_MS
    simIntervalId = setInterval(simulationTick, perMinuteMs);
}

function endSimulation() {
    // ensure any running interval is cleared
    if (simIntervalId) { clearInterval(simIntervalId); simIntervalId = null; }
    // 1. Processar os resultados finais dos jogos e atualizar a classificação
    if (typeof updateClubStatsAfterMatches === 'function') {
        updateClubStatsAfterMatches(currentRoundMatches); 
    } else {
        console.error("Função updateClubStatsAfterMatches não encontrada (matches.js).");
    }
    // 2. Esconder a barra de progresso (botão de simulação aparece)
    const progressContainer = document.getElementById('progress-container');
    if(progressContainer) progressContainer.style.display = 'none';

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
        console.warn('endSimulation: could not switch to standings view', err);
    }
}

function finishDayAndReturnToHub() {
    // Ensure today's matches are finalized and stats applied before moving to the next jornada.
    try {
        if (Array.isArray(currentRoundMatches)) {
            // mark all matches finished so updateClubStatsAfterMatches processes them
            currentRoundMatches.forEach(m => { if (m) m.isFinished = true; });
            if (typeof updateClubStatsAfterMatches === 'function') {
                updateClubStatsAfterMatches(currentRoundMatches);
                console.log('finishDayAndReturnToHub: updateClubStatsAfterMatches executed for current round');
            }
        }
    } catch (e) { console.warn('finishDayAndReturnToHub: error finalizing matches', e); }

    currentJornada++;
    document.getElementById("screen-match").style.display = "none";
    document.getElementById("screen-hub").style.display = "flex"; 
    
    isSimulating = false;
    
    const jornadaDisplayEl = document.getElementById('currentJornadaDisplay');
    if (jornadaDisplayEl) jornadaDisplayEl.textContent = `${currentJornada}ª JORNADA`;

    const hubTeamNameEl = document.getElementById('playerTeamNameHub');
    if (hubTeamNameEl && playerClub && playerClub.team) hubTeamNameEl.textContent = playerClub.team.name;

    const teamFooterEl = document.getElementById('playerTeamNameFooter');
    if (teamFooterEl && playerClub && playerClub.team) teamFooterEl.textContent = playerClub.team.name;

    const progressContainer = document.getElementById('progress-container');
    if(progressContainer) progressContainer.style.display = 'block';

    const finishBtn = document.getElementById('finishSimBtn');
    if (finishBtn) finishBtn.style.display = 'none';

    // CRÍTICO: Gerar próxima jornada corretamente
    if (typeof generateRounds === 'function') {
        const nextRoundMatches = [];
        allDivisions.forEach(divisionClubs => {
            const rounds = generateRounds(divisionClubs);
            if (!Array.isArray(rounds) || rounds.length === 0) {
                console.warn('generateRounds retornou vazio para uma divisão');
                return;
            }

            // currentJornada já foi incrementado acima, usar índice correto
            let roundIndex = (currentJornada - 1) % rounds.length;

            // Evitar que, para a equipa do jogador, o adversário da próxima jornada seja o mesmo do último jogo.
            // Procuramos pelo último adversário do jogador na jornada que acabámos de finalizar (currentRoundMatches)
            try {
                if (playerClub && Array.isArray(currentRoundMatches) && currentRoundMatches.length) {
                    // apenas tentar evitar repetição se o jogador pertencer a esta divisão
                    const isPlayerInThisDivision = divisionClubs.some(dc => dc === playerClub);
                    if (isPlayerInThisDivision) {
                        const lastMatch = currentRoundMatches.find(m => m && (m.homeClub === playerClub || m.awayClub === playerClub));
                        const lastOpponent = lastMatch ? (lastMatch.homeClub === playerClub ? lastMatch.awayClub : lastMatch.homeClub) : null;
                        if (lastOpponent) {
                            // tentar até rounds.length opções para encontrar uma ronda onde o adversário seja diferente
                            let tries = 0;
                            while (tries < rounds.length) {
                                const candidateRound = rounds[roundIndex];
                                if (!Array.isArray(candidateRound)) break;
                                const candidateMatch = candidateRound.find(m => m && (m.homeClub === playerClub || m.awayClub === playerClub));
                                if (!candidateMatch) break; // não há jogo do jogador nesta ronda (p.ex. bye) -> accept
                                const candidateOpp = candidateMatch.homeClub === playerClub ? candidateMatch.awayClub : candidateMatch.homeClub;
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
            } catch (e) { console.warn('Erro ao evitar repetição de adversário na geração de rondas:', e); }

            if (rounds[roundIndex]) {
                nextRoundMatches.push(...rounds[roundIndex]);
            } else {
                console.warn('Índice de jornada fora de alcance:', roundIndex, 'de', rounds.length);
            }
        });
        
        currentRoundMatches = nextRoundMatches;
        window.currentRoundMatches = currentRoundMatches;
        
        console.log('finishDayAndReturnToHub: jornada', currentJornada, 'gerou', currentRoundMatches.length, 'jogos');
        
        // Verificar se lineups foram atribuídas
        const sampleMatch = currentRoundMatches[0];
        if (sampleMatch) {
            console.log('Exemplo de jogo gerado:', {
                home: sampleMatch.homeClub?.team?.name,
                away: sampleMatch.awayClub?.team?.name,
                homePlayers: sampleMatch.homePlayers?.length,
                awayPlayers: sampleMatch.awayPlayers?.length
            });
        }

        try { 
            assignStartingLineups(currentRoundMatches); 
            console.log('Lineups atribuídas para próxima jornada');
        } catch (e) { 
            console.error('ERRO ao atribuir lineups:', e); 
        }

        // Debug snapshot: save the generated round so we can inspect it later if issues occur
        try {
            const dbg = { currentJornada: currentJornada, generatedMatchesCount: currentRoundMatches.length, matches: currentRoundMatches };
            localStorage.setItem('elifoot_debug_snapshot', JSON.stringify(dbg));
        } catch (e) { console.warn('Could not write debug snapshot to localStorage', e); }

        try {
            const snap = {
                currentJornada: currentJornada,
                playerClub: playerClub,
                allDivisions: allDivisions,
                allClubs: allClubs,
                currentRoundMatches: currentRoundMatches
            };
            localStorage.setItem('elifoot_save_snapshot', JSON.stringify(snap));
        } catch (err) { 
            console.warn('Erro ao guardar snapshot:', err); 
        }
    }

    try {
        if (typeof seasonalSkillDrift === 'function') {
            seasonalSkillDrift(allDivisions);
        }
    } catch (err) { 
        console.warn('Erro em seasonalSkillDrift:', err); 
    }

        if (typeof renderHubContent === 'function') {
            // Before rendering the team menu after a simulation, allow other clubs to make offers
            if (window.Offers && typeof window.Offers.showPendingReleasesPopup === 'function') {
                window.Offers.showPendingReleasesPopup(() => {
                    try { renderHubContent('menu-team'); } catch(e){ console.warn('renderHubContent failed after offers popup', e); }
                    try { if (typeof window.updateBudgetDisplays === 'function') window.updateBudgetDisplays(playerClub); } catch(e){}
                });
            } else {
                renderHubContent('menu-team');
                try { if (typeof window.updateBudgetDisplays === 'function') window.updateBudgetDisplays(playerClub); } catch(e){}
            }
        }

    // Decrementar suspensões e reset de amarelos
    try {
        if (Array.isArray(allClubs)) {
            allClubs.forEach(club => {
                if (club && club.team && Array.isArray(club.team.players)) {
                    club.team.players.forEach(p => {
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
        console.warn('Erro ao decrementar suspensões:', e);
    }
}

// Expor funções globais para que outros ficheiros (como ui.js) as possam usar
window.formatMoney = formatMoney;
window.simulateDay = simulateDay; 
window.updateClubStatsAfterMatches = updateClubStatsAfterMatches; // Do matches.js
// expose namespaced versions too for compatibility
window.Elifoot = window.Elifoot || {};
window.Elifoot.formatMoney = formatMoney;
window.Elifoot.simulateDay = simulateDay;
window.Elifoot.updateClubStatsAfterMatches = updateClubStatsAfterMatches;

// Load a previously saved snapshot (basic restore)
function loadSavedGame(){
    try {
        const raw = localStorage.getItem('elifoot_save_snapshot');
        if(!raw) { alert('Nenhum jogo salvo encontrado.'); return; }
        const snap = JSON.parse(raw);
        if(!snap) { alert('Snapshot inválido'); return; }
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
        try { assignStartingLineups(currentRoundMatches); } catch(e) { /* ignore */ }

        // move to hub UI
        startGame();
    } catch (err) {
        console.error('Erro ao carregar jogo salvo:', err);
        alert('Erro ao carregar o jogo salvo. Verifica o console.');
    }
}
window.loadSavedGame = loadSavedGame;

// FUNÇÃO PARA ATUALIZAR AS ESTATÍSTICAS DOS CLUBES APÓS OS JOGOS
function updateClubStatsAfterMatches(matches) {
    if (!Array.isArray(matches)) return;
    // helper to compute attendance/revenue for a match
    // attendance computation moved to finance.js -> window.Finance.computeMatchAttendance
    matches.forEach(match => {
        try {
            // Only process matches that were actually played/finished and not yet counted
            if (!match || !match.isFinished) return;
            if (match._counted) return; // already applied

            // Ensure goals array exists and count only goal events (cards are stored too)
            match.goals = match.goals || [];
            const homeGoals = match.goals.filter(g => g.team === 'home' && g.type === 'goal').length;
            const awayGoals = match.goals.filter(g => g.team === 'away' && g.type === 'goal').length;
            // store final tallies
            match.homeGoals = homeGoals;
            match.awayGoals = awayGoals;

            // Compute attendance and revenue for the match (home club receives gate revenue)
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
                    // simple match operating cost (security, staff) proportional to attendance
                    const operatingCost = Math.round(match.attendance * 0.5); // 0.5€ per spectator cost
                    homeClub.expenses = (homeClub.expenses || 0) + operatingCost;
                    homeClub.budget = (homeClub.budget || 0) - operatingCost;
                    // persist small fields onto match for UI
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

                // update W/D/L and points
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

            // mark as counted to avoid double-applying stats
            match._counted = true;
        } catch (err) {
            console.warn('updateClubStatsAfterMatches: failed for match', match, err);
        }
    });

    // Persist updated snapshot so next-opponent and standings reflect played games
    try {
        const snap = {
            currentJornada: currentJornada,
            playerClub: playerClub,
            allDivisions: allDivisions,
            allClubs: allClubs,
            currentRoundMatches: matches
        };
        localStorage.setItem('elifoot_save_snapshot', JSON.stringify(snap));
    } catch (err) { console.warn('Could not persist snapshot after updating club stats', err); }
}

// Assign starting lineups for matches: pick 1 GK then top players by skill for the rest
function assignStartingLineups(matches) {
    if (!Array.isArray(matches)) return;
    const Lineups = (window.Elifoot && window.Elifoot.Lineups) || {};
    // helper: build fallback starters/subs from team object
    function buildFallback(teamObj) {
        const players = Array.isArray(teamObj && teamObj.players) ? teamObj.players.slice() : [];
        // try to find a goalkeeper
        let gkIndex = players.findIndex(p => p && (p.position === 'GK' || p.position === 'Goalkeeper' || p.position === 'G'));
        let starters = [];
        if (gkIndex >= 0) {
            starters.push(players.splice(gkIndex, 1)[0]);
        }
        // sort remaining by skill desc
        players.sort((a, b) => (b && b.skill || 0) - (a && a.skill || 0));
        // fill starters up to 11
        for (let i = 0; i < players.length && starters.length < 11; i++) {
            starters.push(players[i]);
        }
        // remaining become subs
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

        } // end if generateAllClubs
    }); // end of startBtn click handler
} // end else (startBtn exists)