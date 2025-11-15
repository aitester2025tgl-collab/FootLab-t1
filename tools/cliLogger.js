/* eslint-disable no-console, no-unused-vars */
// Simple CLI logger used by tools/ scripts. Supports --silent CLI flag or CLI_SILENT=1 env var.
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
function getLevel() {
  const env =
    process && process.env && process.env.CLI_LOG_LEVEL
      ? process.env.CLI_LOG_LEVEL.toLowerCase()
      : null;
  if (env && Object.prototype.hasOwnProperty.call(LEVELS, env)) return LEVELS[env];
  return LEVELS.info;
}
function isSilent() {
  try {
    if (process && process.env && process.env.CLI_SILENT === '1') return true;
    if (process && Array.isArray(process.argv) && process.argv.indexOf('--silent') >= 0)
      return true;
  } catch (e) {
    /* ignore */
  }
  return false;
}
const currentLevel = getLevel();
module.exports = {
  debug: function (...args) {
    if (isSilent() || currentLevel > LEVELS.debug) return;
    try {
      console.debug ? console.debug(...args) : console.log(...args);
    } catch (e) {
      /* ignore */
    }
  },
  info: function (...args) {
    if (isSilent() || currentLevel > LEVELS.info) return;
    try {
      console.log(...args);
    } catch (e) {
      /* ignore */
    }
  },
  warn: function (...args) {
    if (isSilent() || currentLevel > LEVELS.warn) return;
    try {
      console.warn ? console.warn(...args) : console.log(...args);
    } catch (e) {
      /* ignore */
    }
  },
  error: function (...args) {
    if (isSilent() || currentLevel > LEVELS.error) return;
    try {
      console.error ? console.error(...args) : console.log(...args);
    } catch (e) {
      /* ignore */
    }
  },
};
