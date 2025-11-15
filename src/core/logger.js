/* eslint-disable no-console */
// core/logger.js
// Minimal logger with configurable level. Attach to window.Elifoot.Logger for centralized logging.
(function () {
  'use strict';

  const LEVELS = { DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40 };
  let currentLevel =
    typeof window !== 'undefined' &&
    window.Elifoot &&
    window.Elifoot.Config &&
    window.Elifoot.Config.LOG_LEVEL
      ? window.Elifoot.Config.LOG_LEVEL
      : typeof window !== 'undefined' &&
          window.Elifoot &&
          window.Elifoot.Config &&
          window.Elifoot.Config.DEBUG
        ? LEVELS.DEBUG
        : LEVELS.INFO;

  function shouldLog(level) {
    return level >= currentLevel;
  }

  const logger = {
    LEVELS,
    setLevel(nameOrValue) {
      if (typeof nameOrValue === 'string' && LEVELS[nameOrValue] !== undefined)
        currentLevel = LEVELS[nameOrValue];
      else if (typeof nameOrValue === 'number') currentLevel = nameOrValue;
    },
    debug(...args) {
      if (shouldLog(LEVELS.DEBUG))
        try {
          console.debug && console.debug(...args);
        } catch (_) {
          /* ignore */
        }
    },
    info(...args) {
      if (shouldLog(LEVELS.INFO))
        try {
          console.info && console.info(...args);
        } catch (_) {
          /* ignore */
        }
    },
    warn(...args) {
      if (shouldLog(LEVELS.WARN))
        try {
          console.warn && console.warn(...args);
        } catch (_) {
          /* ignore */
        }
    },
    error(...args) {
      if (shouldLog(LEVELS.ERROR))
        try {
          console.error && console.error(...args);
        } catch (_) {
          /* ignore */
        }
    },
  };

  if (typeof window !== 'undefined') {
    window.Elifoot = window.Elifoot || {};
    window.Elifoot.Logger = window.Elifoot.Logger || logger;
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = logger;
})();
