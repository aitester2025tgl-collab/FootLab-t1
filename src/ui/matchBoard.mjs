// src/ui/matchBoard.mjs
// ES module port of legacy ui/matchBoard.js
import { hexToRgb, luminance, getReadableTextColor } from './helpers.mjs';

// Prefer central Finance if available at runtime
function getFinance() {
  const FootLab = window.FootLab || window.Elifoot || {};
  return (FootLab && FootLab.Finance) || window.Finance;
}

function getLogger() {
  const FootLab = window.FootLab || window.Elifoot || {};
  return FootLab && FootLab.Logger ? FootLab.Logger : console;
}

function renderInitialMatchBoard(allDivisions) {
  const FootLab = window.FootLab || window.Elifoot || {};
  const allMatches = (FootLab && FootLab.currentRoundMatches) || window.currentRoundMatches || [];
  if (!allMatches || !allMatches.length) return;
  const Finance = getFinance();

  try {
    const player =
      (window.FootLab && window.FootLab.playerClub) ||
      (window.Elifoot && window.Elifoot.playerClub) ||
      window.playerClub;
    const playerMatch = (allMatches || []).find(
      (m) => m.homeClub === player || m.awayClub === player
    );
    const headerSpan = document.getElementById('playerTeamNameMatch');
    if (playerMatch && headerSpan) {
      const home = playerMatch.home ? playerMatch.home.name : 'Home';
      const away = playerMatch.away ? playerMatch.away.name : 'Away';
      headerSpan.textContent = `${home} × ${away}`;
    }
    if (((FootLab && FootLab.GAME_NAME) || window.GAME_NAME) && typeof document !== 'undefined') {
      const gameName = (FootLab && FootLab.GAME_NAME) || window.GAME_NAME;
      document.title = `${gameName} — ${player && player.team ? player.team.name : ''}`;
    }
  } catch (err) {
    /* ignore */
  }

  const divisionContainers = {
    1: document.getElementById('division-1'),
    2: document.getElementById('division-2'),
    3: document.getElementById('division-3'),
    4: document.getElementById('division-4'),
  };

  Object.values(divisionContainers).forEach((container) => {
    if (container) container.innerHTML = '';
  });

  const matchesByDivision = { 1: [], 2: [], 3: [], 4: [] };
  allMatches.forEach((match, index) => {
    if (match.division && matchesByDivision[match.division]) {
      match.index = index;
      matchesByDivision[match.division].push(match);
    }
  });

  [1, 2, 3, 4].forEach((divisionNumber) => {
    const matches = matchesByDivision[divisionNumber];
    const container = divisionContainers[divisionNumber];

    if (container) {
      const divisionNames = { 1: 'Division 1', 2: 'Division 2', 3: 'Division 3', 4: 'Division 4' };
      let html = `<h3 class="division-title">${divisionNames[divisionNumber]}</h3>`;

      matches.forEach((match) => {
        const homeBg = (match.home && match.home.bgColor) || '#333';
        const homeSec = (match.home && match.home.color) || '#ffffff';
        const homeFg = getReadableTextColor(homeBg, homeSec);
        const homeBorder = homeSec;

        const awayBg = (match.away && match.away.bgColor) || '#333';
        const awaySec = (match.away && match.away.color) || '#ffffff';
        const awayFg = getReadableTextColor(awayBg, awaySec);
        const awayBorder = awaySec;

        html += `
                        <div class="match-line-new" id="match-line-${match.index}" style="display:flex; align-items:center; gap:8px;">
                            <span class="team-name home" style="display:inline-block; width:16ch; max-width:16ch; min-width:16ch; box-sizing:border-box; text-align:center; vertical-align:middle; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color: ${homeFg}; background-color: ${homeBg}; padding:4px 6px; border-radius:3px; font-weight:bold; border:2px solid ${homeBorder};">${match.home.name}</span>
                            <span class="home-goals" style="width:28px; text-align:center; font-weight:700;">0</span>
                            <span class="separator">-</span>
                            <span class="away-goals" style="width:28px; text-align:center; font-weight:700;">0</span>
                            <span class="team-name away" style="display:inline-block; width:16ch; max-width:16ch; min-width:16ch; box-sizing:border-box; text-align:center; vertical-align:middle; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color: ${awayFg}; background-color: ${awayBg}; padding:4px 6px; border-radius:3px; font-weight:bold; border:2px solid ${awayBorder};">${match.away.name}</span>
                            <span class="last-goal" style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:inherit; font-size:0.95em;"></span>
                            <span class="spectators" style="display:inline-block; width:6ch; min-width:6ch; max-width:6ch; text-align:right; font-variant-numeric: tabular-nums;">—</span>
                        </div>
                    `;
      });

      container.innerHTML = html;
      try {
        matches.forEach((match) => {
          const el = document.getElementById(`match-line-${match.index}`);
          if (!el) return;
          const specEl = el.querySelector('.spectators');
          if (!specEl) return;
          let attendance = null;
          try {
            if (typeof match.attendance !== 'undefined') attendance = match.attendance;
            else if (Finance && typeof Finance.computeMatchAttendance === 'function') {
              const a = Finance.computeMatchAttendance(match);
              attendance = a && typeof a.attendance !== 'undefined' ? a.attendance : null;
            }
          } catch (e) {
            attendance = null;
          }
          specEl.textContent =
            attendance === null || typeof attendance === 'undefined'
              ? '—'
              : `${attendance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
        });
      } catch (e) {
        /* ignore */
      }
    }
  });

  try {
    adjustMatchBoardSizing();
  } catch (e) {
    /* ignore */
  }
}

function updateMatchBoardLine(matchIndex, matchResult) {
  const FootLab = window.FootLab || window.Elifoot || {};
  const DEBUG_MATCH_SIM = (FootLab && FootLab.DEBUG_MATCH_SIM) || window.DEBUG_MATCH_SIM;
  if (DEBUG_MATCH_SIM) {
    try {
      const L = FootLab && FootLab.Logger ? FootLab.Logger : console;
      L.debug &&
        L.debug('DBG updateMatchBoardLine called', {
          matchIndex,
          hasGoals: Array.isArray(matchResult.goals) ? matchResult.goals.length : 0,
        });
    } catch (e) {
      /* ignore */
    }
  }
  const lineElement = document.getElementById(`match-line-${matchIndex}`);
  if (!lineElement) {
    if (window.DEBUG_MATCH_SIM)
      try {
        const L = getLogger();
        L.warn && L.warn('DBG updateMatchBoardLine: element not found for index', matchIndex);
      } catch (e) {
        /* ignore */
      }
    return;
  }

  const homeGoalsEl = lineElement.querySelector('.home-goals');
  const awayGoalsEl = lineElement.querySelector('.away-goals');
  const lastGoalEl = lineElement.querySelector('.last-goal');

  if (homeGoalsEl) homeGoalsEl.textContent = matchResult.homeGoals;
  if (awayGoalsEl) awayGoalsEl.textContent = matchResult.awayGoals;

  const lastGoal =
    Array.isArray(matchResult.goals) && matchResult.goals.length
      ? matchResult.goals[matchResult.goals.length - 1]
      : null;
  if (lastGoal && lastGoalEl) {
    const isHome = lastGoal.team === 'home';
    const team = isHome ? matchResult.home : matchResult.away;
    const bg = team.bgColor || '#333';
    const fg = getReadableTextColor(bg, team.color || '#fff');
    const playerName = lastGoal.player || (lastGoal.scorer ? lastGoal.scorer : 'Jogador');
    lastGoalEl.innerHTML = `(${lastGoal.minute}') <span style="background:${bg};color:${fg};padding:2px 6px;border-radius:3px;font-weight:bold;text-shadow:0 1px 2px #0008;">${playerName}</span>`;
  }

  try {
    const specEl = lineElement.querySelector('.spectators');
    let attendance = null;
    if (typeof matchResult.attendance !== 'undefined') {
      attendance = matchResult.attendance;
    } else if (getFinance() && typeof getFinance().computeMatchAttendance === 'function') {
      try {
        attendance = getFinance().computeMatchAttendance(matchResult).attendance;
      } catch (e) {
        attendance = null;
      }
    }
    if (specEl) {
      specEl.textContent =
        attendance === null || typeof attendance === 'undefined'
          ? '—'
          : `${attendance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    }
  } catch (e) {
    /* ignore UI spectator errors */
  }
}

function adjustMatchBoardSizing() {
  const board = document.getElementById('match-board');
  if (!board) return;
  const lines = board.querySelectorAll('.match-line-new');
  const totalLines = lines ? lines.length : 0;
  if (!totalLines) return;

  const viewportH = window.innerHeight || document.documentElement.clientHeight;
  const boardRect = board.getBoundingClientRect();
  const progressH =
    (document.getElementById('progress-container') &&
      document.getElementById('progress-container').offsetHeight) ||
    0;
  const footerH =
    (document.getElementById('hub-footer-status') &&
      document.getElementById('hub-footer-status').offsetHeight) ||
    0;
  const reserved = progressH + footerH + 80;
  const availableForBoard = Math.max(100, viewportH - boardRect.top - reserved);

  const headers = board.querySelectorAll('.division-title');
  let headersTotal = 0;
  headers.forEach((h) => (headersTotal += h.offsetHeight || 24));

  const gapTotal = Math.max(0, headers.length - 1) * 12 + headers.length * 12;
  const availableForLines = Math.max(60, availableForBoard - headersTotal - gapTotal);

  let target = Math.floor(availableForLines / totalLines);
  if (target < 16) target = 16;
  if (target > 40) target = 40;

  try {
    document.documentElement.style.setProperty('--match-line-height', `${target}px`);
  } catch (e) {
    /* ignore */
  }
}

// attach as window globals for compatibility and export for modules
function attachGlobals() {
  window.MatchBoard = window.MatchBoard || {};
  window.MatchBoard.renderInitialMatchBoard = renderInitialMatchBoard;
  window.MatchBoard.updateMatchBoardLine = updateMatchBoardLine;
  window.renderInitialMatchBoard = renderInitialMatchBoard;
  window.updateMatchBoardLine = updateMatchBoardLine;

  window.FootLab = window.FootLab || window.Elifoot || {};
  window.FootLab.MatchBoard = window.FootLab.MatchBoard || {};
  window.FootLab.MatchBoard.renderInitialMatchBoard = renderInitialMatchBoard;
  window.FootLab.MatchBoard.updateMatchBoardLine = updateMatchBoardLine;
  window.FootLab.renderInitialMatchBoard = renderInitialMatchBoard;
  window.FootLab.updateMatchBoardLine = updateMatchBoardLine;

  // keep compatibility alias
  window.Elifoot = window.Elifoot || window.FootLab;
}

attachGlobals();

window.addEventListener('resize', function () {
  try {
    adjustMatchBoardSizing();
  } catch (e) {
    /* ignore */
  }
});

export { renderInitialMatchBoard, updateMatchBoardLine, adjustMatchBoardSizing };