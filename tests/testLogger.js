/* eslint-disable no-console, no-unused-vars */
// tests/testLogger.js
// Provides a small logger for tests that prefers the in-app logger when available
// and falls back to console when not.

function makeConsoleWrapper() {
  return {
    info: (...args) => {
      try {
        console.log(...args);
      } catch (_) {
        /* ignore */
      }
    },
    error: (...args) => {
      try {
        console.error(...args);
      } catch (_) {
        /* ignore */
      }
    },
    warn: (...args) => {
      try {
        console.warn ? console.warn(...args) : console.log(...args);
      } catch (_) {
        /* ignore */
      }
    },
    debug: (...args) => {
      try {
        console.debug ? console.debug(...args) : console.log(...args);
      } catch (_) {
        /* ignore */
      }
    },
  };
}

function getLogger() {
  // Browser runtime: prefer window.Elifoot.Logger
  try {
    if (typeof window !== 'undefined' && window && window.Elifoot && window.Elifoot.Logger)
      return window.Elifoot.Logger;
  } catch (e) {
    /* ignore */
  }

  // Try to load core logger (Node tests can require it)
  try {
    const coreLogger = require('../src/core/logger');
    if (coreLogger && (coreLogger.info || coreLogger.log)) return coreLogger;
  } catch (e) {
    /* ignore */
  }

  // Fallback to console wrapper
  return makeConsoleWrapper();
}

module.exports = { getLogger };
