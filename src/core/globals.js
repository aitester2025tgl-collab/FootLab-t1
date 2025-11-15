// core/globals.js
// Initialize a single application namespace `window.Elifoot` and keep backwards compatibility
// by forwarding common globals (playerClub, currentRoundMatches, etc.) to properties on that object.
(function () {
  // Only run in browser-like environments
  if (typeof window === 'undefined') return;

  window.Elifoot = window.Elifoot || {};

  // Keys that historically lived on `window` and should be centralized
  const keys = [
    'playerClub',
    'currentRoundMatches',
    'allDivisions',
    'allClubs',
    'currentJornada',
    'GAME_NAME',
    'GameConfig',
  ];

  keys.forEach((k) => {
    // if a value already exists on window (loaded before this script), copy it into Elifoot
    try {
      if (typeof window[k] !== 'undefined' && typeof window.Elifoot[k] === 'undefined')
        window.Elifoot[k] = window[k];
    } catch (e) {
      /* ignore */
    }
    // define a forwarding accessor on window to keep old code working
    try {
      Object.defineProperty(window, k, {
        get() {
          return window.Elifoot[k];
        },
        set(v) {
          window.Elifoot[k] = v;
        },
        configurable: true,
      });
    } catch (e) {
      /* ignore defineProperty errors */
    }
  });

  // Common module namespaces to place under Elifoot
  const namespaces = [
    'MatchBoard',
    'Hub',
    'Tactics',
    'Overlays',
    'Finance',
    'Offers',
    'Lineups',
    'Promotion',
  ];
  namespaces.forEach((name) => {
    try {
      window.Elifoot[name] = window.Elifoot[name] || window[name] || {};
      Object.defineProperty(window, name, {
        get() {
          return window.Elifoot[name];
        },
        set(v) {
          window.Elifoot[name] = v;
        },
        configurable: true,
      });
    } catch (e) {
      /* ignore */
    }
  });

  // Export for Node tests that require this file
  try {
    if (typeof module !== 'undefined' && module.exports) module.exports = window.Elifoot;
  } catch (e) {
    /* ignore */
  }
})();
