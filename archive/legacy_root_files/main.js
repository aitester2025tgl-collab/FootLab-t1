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

// NOTE: archived copy of root main.js
