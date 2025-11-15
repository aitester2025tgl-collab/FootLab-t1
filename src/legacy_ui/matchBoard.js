// ui/matchBoard.js
// Extracted match-board rendering and update functions so UI can be modularized.
/* global Finance, formatMoney */
/* exported formatMoney */
(function () {
  // Prefer shared color utilities when available; fallback to tiny local wrappers
  // logger helper (use central logger when available, fall back to console)
  function getLogger() {
    return window.Elifoot && window.Elifoot.Logger ? window.Elifoot.Logger : console;
  }
  function hexToRgb(hex) {
    if (window.ColorUtils && typeof window.ColorUtils.hexToRgb === 'function')
      return window.ColorUtils.hexToRgb(hex);
    if (!hex) return [0, 0, 0];
    let h = String(hex).replace('#', '');
    if (h.length === 3)
      h = h
        .split('')
        .map((c) => c + c)
        .join('');
    const v = parseInt(h, 16);
    if (isNaN(v)) return [0, 0, 0];
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }

  function luminance(rgb) {
    if (window.ColorUtils && typeof window.ColorUtils.luminance === 'function')
      return window.ColorUtils.luminance(rgb);
    if (!rgb) return 0;
    const srgb = rgb.map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  }

  function getReadableTextColor(bgHex, preferredHex) {
    if (window.ColorUtils && typeof window.ColorUtils.getReadableTextColor === 'function')
      return window.ColorUtils.getReadableTextColor(bgHex, preferredHex);
    // minimal fallback: choose white or black based on luminance
    try {
      if (!bgHex) return preferredHex || '#fff';
      const bg = hexToRgb(bgHex);
      const Lbg = luminance(bg);
      const contrastWhite = (Math.max(Lbg, 1) + 0.05) / (Math.min(Lbg, 1) + 0.05);
      const contrastBlack = (Math.max(Lbg, 0) + 0.05) / (Math.min(Lbg, 0) + 0.05);
      return contrastWhite >= contrastBlack ? '#ffffff' : '#000000';
    } catch (e) {
      return preferredHex || '#fff';
    }
  }

  function renderInitialMatchBoard(allDivisions) {
    const allMatches =
      (window.Elifoot && window.Elifoot.currentRoundMatches) || window.currentRoundMatches || [];
    if (!allMatches || !allMatches.length) return;
    const Finance = (window.Elifoot && window.Elifoot.Finance) || window.Finance;

    try {
      const player = (window.Elifoot && window.Elifoot.playerClub) || window.playerClub;
      const playerMatch = (allMatches || []).find(
        (m) => m.homeClub === player || m.awayClub === player
      );
      const headerSpan = document.getElementById('playerTeamNameMatch');
      if (playerMatch && headerSpan) {
        const home =
          playerMatch.homeClub && playerMatch.homeClub.team
            ? playerMatch.homeClub.team.name
            : 'Home';
        const away =
          playerMatch.awayClub && playerMatch.awayClub.team
            ? playerMatch.awayClub.team.name
            : 'Away';
        headerSpan.textContent = `${home} × ${away}`;
      }
      if (
        ((window.Elifoot && window.Elifoot.GAME_NAME) || window.GAME_NAME) &&
        typeof document !== 'undefined'
      ) {
        const gameName = (window.Elifoot && window.Elifoot.GAME_NAME) || window.GAME_NAME;
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
        const divisionNames = {
          1: 'Division 1',
          2: 'Division 2',
          3: 'Division 3',
          4: 'Division 4',
        };
        let html = `<h3 class="division-title">${divisionNames[divisionNumber]}</h3>`;

        matches.forEach((match) => {
          const homeBg =
            (match.homeClub && match.homeClub.team && match.homeClub.team.bgColor) || '#333';
          const homeSec =
            (match.homeClub && match.homeClub.team && match.homeClub.team.color) || '#ffffff';
          const homeFg = getReadableTextColor(homeBg, homeSec);
          const homeBorder = homeSec;

          const awayBg =
            (match.awayClub && match.awayClub.team && match.awayClub.team.bgColor) || '#333';
          const awaySec =
            (match.awayClub && match.awayClub.team && match.awayClub.team.color) || '#ffffff';
          const awayFg = getReadableTextColor(awayBg, awaySec);
          const awayBorder = awaySec;

          html += `
                        <div class="match-line-new" id="match-line-${match.index}" style="display:flex; align-items:center; gap:8px;">
                            <span class="team-name home" style="display:inline-block; width:16ch; max-width:16ch; min-width:16ch; box-sizing:border-box; text-align:center; vertical-align:middle; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color: ${homeFg}; background-color: ${homeBg}; padding:4px 6px; border-radius:3px; font-weight:bold; border:2px solid ${homeBorder};">${match.homeClub.team.name}</span>
                            <span class="home-goals" style="width:28px; text-align:center; font-weight:700;">0</span>
                            <span class="separator">-</span>
                            <span class="away-goals" style="width:28px; text-align:center; font-weight:700;">0</span>
                            <span class="team-name away" style="display:inline-block; width:16ch; max-width:16ch; min-width:16ch; box-sizing:border-box; text-align:center; vertical-align:middle; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color: ${awayFg}; background-color: ${awayBg}; padding:4px 6px; border-radius:3px; font-weight:bold; border:2px solid ${awayBorder};">${match.awayClub.team.name}</span>
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
            // Use finance helper to compute realistic attendance based on home team stadium
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

    // adjust sizing so the board attempts to fit all match lines without excessive spacing
    try {
      adjustMatchBoardSizing();
    } catch (e) {
      /* ignore */
    }
  }

  function updateMatchBoardLine(matchIndex, matchResult) {
    const DEBUG_MATCH_SIM =
      (window.Elifoot && window.Elifoot.DEBUG_MATCH_SIM) || window.DEBUG_MATCH_SIM;
    if (DEBUG_MATCH_SIM) {
      try {
        const L = window.Elifoot && window.Elifoot.Logger ? window.Elifoot.Logger : console;
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
      const team = isHome ? matchResult.homeClub.team : matchResult.awayClub.team;
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
      } else if (Finance && typeof Finance.computeMatchAttendance === 'function') {
        try {
          attendance = Finance.computeMatchAttendance(matchResult).attendance;
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

  // expose as MatchBoard and preserve global names for compatibility
  window.MatchBoard = window.MatchBoard || {};
  window.MatchBoard.renderInitialMatchBoard = renderInitialMatchBoard;
  window.MatchBoard.updateMatchBoardLine = updateMatchBoardLine;
  window.renderInitialMatchBoard = renderInitialMatchBoard;
  window.updateMatchBoardLine = updateMatchBoardLine;

  // also export into canonical namespace for migration
  window.Elifoot = window.Elifoot || {};
  window.Elifoot.MatchBoard = window.Elifoot.MatchBoard || {};
  window.Elifoot.MatchBoard.renderInitialMatchBoard = renderInitialMatchBoard;
  window.Elifoot.MatchBoard.updateMatchBoardLine = updateMatchBoardLine;
  window.Elifoot.renderInitialMatchBoard = renderInitialMatchBoard;
  window.Elifoot.updateMatchBoardLine = updateMatchBoardLine;

  // Attempt to dynamically size match lines to fit the viewport when possible
  function adjustMatchBoardSizing() {
    const board = document.getElementById('match-board');
    if (!board) return;
    // number of visible match lines
    const lines = board.querySelectorAll('.match-line-new');
    const totalLines = lines ? lines.length : 0;
    if (!totalLines) return;

    // compute available vertical space for the match board
    const viewportH = window.innerHeight || document.documentElement.clientHeight;
    const boardRect = board.getBoundingClientRect();
    // compute reserved footer/progress area heights if present
    const progressH =
      (document.getElementById('progress-container') &&
        document.getElementById('progress-container').offsetHeight) ||
      0;
    const footerH =
      (document.getElementById('hub-footer-status') &&
        document.getElementById('hub-footer-status').offsetHeight) ||
      0;
    // subtract some padding for margins
    const reserved = progressH + footerH + 80; // extra buffer
    const availableForBoard = Math.max(100, viewportH - boardRect.top - reserved);

    // account for division headers heights
    const headers = board.querySelectorAll('.division-title');
    let headersTotal = 0;
    headers.forEach((h) => (headersTotal += h.offsetHeight || 24));

    const gapTotal = Math.max(0, headers.length - 1) * 12 + headers.length * 12;
    const availableForLines = Math.max(60, availableForBoard - headersTotal - gapTotal);

    // target height per line
    let target = Math.floor(availableForLines / totalLines);
    // clamp to reasonable values
    if (target < 16) target = 16;
    if (target > 40) target = 40;

    // apply as CSS variable for use in stylesheet
    try {
      document.documentElement.style.setProperty('--match-line-height', `${target}px`);
    } catch (e) {
      /* ignore */
    }
  }

  // call adjust on resize to remain responsive
  window.addEventListener('resize', function () {
    try {
      adjustMatchBoardSizing();
    } catch (e) {
      /* ignore */
    }
  });
})();
