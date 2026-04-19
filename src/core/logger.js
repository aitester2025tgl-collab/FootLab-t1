/* eslint-disable no-console */
// core/logger.js
// Minimal logger with configurable level. Attach to window.Elifoot.Logger for centralized logging.

const LEVELS = { DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40 };
const FootLab = (typeof window !== 'undefined' && (window.FootLab || window.Elifoot)) || {};
let currentLevel =
  (FootLab && FootLab.Config && FootLab.Config.LOG_LEVEL)
    ? FootLab.Config.LOG_LEVEL
    : (FootLab && FootLab.Config && FootLab.Config.DEBUG)
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
    window.FootLab = window.FootLab || window.Elifoot || {};
    window.FootLab.Logger = window.FootLab.Logger || logger;
    // compatibility alias
    window.Elifoot = window.Elifoot || window.FootLab;
  }

export default logger;
