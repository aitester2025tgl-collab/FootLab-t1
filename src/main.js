/* global divisionsData, applySkillCaps, generateRounds, renderInitialMatchBoard, initHubUI, renderHubContent, seasonalSkillDrift, selectExpiringPlayersToLeave, selectPlayersForRelease, simulateDay, startGame, assignRandomShortContracts, markSomeContractsExpiring */
import { generateAllClubs } from './clubs.js';
/* exported isSimulating, populateTeamSelection, formatNumber, proceedToMatch, endSimulation */
/* eslint-disable no-empty */
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
  window.GAME_NAME = (typeof GameConstants !== 'undefined' && GameConstants.GAME_NAME) || 'FootLab t1';
  try {
    if (typeof document !== 'undefined') document.title = window.GAME_NAME;
  } catch (e) {
    /* ignore */
  }
}

// small local logger shim to prefer the centralized logger when available
const MainLogger =
  typeof window !== 'undefined' && window.FootLab && window.FootLab.Logger
    ? window.FootLab.Logger
    : console;
// runtime helper that prefers a fresh window.FootLab/Elifoot.Logger when available, then MainLogger, then console
function getLogger() {
  return (
    (typeof window !== 'undefined' && window.FootLab && window.FootLab.Logger) ||
    (typeof window !== 'undefined' && window.Elifoot && window.Elifoot.Logger) ||
    MainLogger ||
    console
  );
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
      card.onclick = () => selectTeam(t.name);
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

/**
 * Valida os dados necessários antes de permitir o início do jogo.
 */
async function validateGameData() {
  const L = getLogger();
  L.info('Waiting for divisions data...');
  
  const waitFn = (window && window.waitForDivisionsData) || 
                 (window && window.FootLab && window.FootLab.waitForDivisionsData);
                 
  if (typeof waitFn === 'function') {
    await waitFn(3000);
  }

  const requireArchived = (window.FootLab && window.FootLab.GameConfig && window.FootLab.GameConfig.requireArchivedRosters);
  const realCount = window.REAL_ROSTERS ? Object.keys(window.REAL_ROSTERS).length : 0;

  if (requireArchived && realCount < 72) {
    throw new Error('Rosters incompletos ou em falta.');
  }

  const totalTeams = (window.divisionsData || []).reduce(
    (acc, d) => acc + ((d && d.teams && d.teams.length) || 0), 0
  );

  if (totalTeams === 0) {
    throw new Error('Nenhuma equipa carregada em divisionsData.');
  }
  
  return true;
}

/**
 * Inicializa o estado do jogo e o clube do jogador.
 */
function initializeGameSession() {
  const L = getLogger();
  L.info('Generating all clubs...');
  
  allClubs = generateAllClubs();
  allDivisions = [[], [], [], []];

  allClubs.forEach((club) => {
    if (club.division >= 1 && club.division <= 4) {
      allDivisions[club.division - 1].push(club);
    }
  });

  const division4 = allDivisions[3];
  if (!division4 || division4.length === 0) {
    throw new Error('Divisão 4 está vazia.');
  }

  // Aplicar contratos e drift inicial
  if (typeof assignRandomShortContracts === 'function') assignRandomShortContracts(allDivisions);
  if (typeof applySkillCaps === 'function') applySkillCaps(allDivisions);

  // Escolha aleatória do clube (últimos 8 da D4)
  const pool = division4.length > 8 ? division4.slice(-8) : division4.slice();
  playerClub = pool[Math.floor(Math.random() * pool.length)];
  window.playerClub = playerClub;
  window.allDivisions = allDivisions;
  window.allClubs = allClubs;

  // Gerar calendários
  if (typeof generateRounds === 'function') {
    const firstRoundMatches = [];
    allDivisions.forEach((div) => {
      const rounds = generateRounds(div);
      if (rounds.length > 0) firstRoundMatches.push(...rounds[0]);
    });
    window.currentRoundMatches = firstRoundMatches;
    if (typeof assignStartingLineups === 'function') assignStartingLineups(window.currentRoundMatches);
  }

  return playerClub;
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

document.addEventListener('DOMContentLoaded', () => {
  const _startBtn = document.getElementById('startBtn');
  if (!_startBtn) {
    try {
      const L = getLogger();
      L.error && L.error('startBtn not found in DOM; cannot start game.');
    } catch (_) {
      /* ignore */
    }
    return;
  }

  _startBtn.addEventListener('click', async () => {
    try {
      await validateGameData();
      const coachName = document.getElementById('coachName').value.trim();
      if (!coachName) return alert('Digite o nome do treinador!');
      
      const picked = initializeGameSession();
      if (typeof startGame === 'function') startGame(picked);

    } catch (err) {
      getLogger().error('Falha ao iniciar jogo:', err);
      alert('Erro crítico: ' + err.message);
    }
  }); // end of startBtn click handler
}); // end of DOMContentLoaded