// core/persistence.js
// Centralized persistence API to replace ad-hoc localStorage usage.
(function () {
  'use strict';

  const DEFAULT_MAX_BYTES = 512 * 1024; // 512 KB default max snapshot size
  const SNAPSHOT_VERSION = 1;

  function getByteSize(str) {
    try {
      if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str).length;
      return str.length;
    } catch (e) {
      return (str && str.length) || 0;
    }
  }

  function getLogger() {
    try {
      if (typeof window !== 'undefined' && window.Elifoot && window.Elifoot.Logger)
        return window.Elifoot.Logger;
    } catch (e) {
      /* ignore */
    }
    try {
      if (typeof require === 'function') {
        // prefer local core logger when running under node/tests
        try {
          return require('./logger');
        } catch (e) {
          /* ignore */
        }
      }
    } catch (e) {
      /* ignore */
    }
    return console;
  }

  const Persistence = {
    // saveSnapshot stores an envelope {version, created, payload} and enforces a size guard.
    saveSnapshot(snap, opts) {
      try {
        const cfg =
          typeof window !== 'undefined' && window.Elifoot && window.Elifoot.Config
            ? window.Elifoot.Config
            : {};
        const maxBytes = (opts && opts.maxBytes) || cfg.maxSnapshotSizeBytes || DEFAULT_MAX_BYTES;
        const envelope = { version: SNAPSHOT_VERSION, created: Date.now(), payload: snap };
        const raw = JSON.stringify(envelope);
        const size = getByteSize(raw);
        const logger =
          typeof window !== 'undefined' && window.Elifoot && window.Elifoot.Logger
            ? window.Elifoot.Logger
            : console;
        if (size > maxBytes) {
          try {
            logger.warn &&
              logger.warn(
                'Persistence.saveSnapshot: snapshot too large',
                size,
                'bytes (max',
                maxBytes,
                ')'
              );
          } catch (_) {
            /* ignore */
          }
          // best-effort: save debug snapshot instead so we don't lose data for inspection
          try {
            Persistence.saveDebugSnapshot({
              reason: 'oversize_snapshot',
              size,
              maxBytes,
              snapshotMeta: { currentJornada: snap && snap.currentJornada },
            });
          } catch (_) {
            /* ignore */
          }
          return false;
        }
        if (typeof localStorage !== 'undefined') localStorage.setItem('elifoot_save_snapshot', raw);
        return true;
      } catch (e) {
        try {
          const lg = getLogger();
          lg.warn && lg.warn('Persistence.saveSnapshot failed', e);
        } catch (_) {
          /* ignore */
        }
        return false;
      }
    },

    loadSnapshot() {
      try {
        if (typeof localStorage === 'undefined') return null;
        const raw = localStorage.getItem('elifoot_save_snapshot');
        if (!raw) return null;
        const envelope = JSON.parse(raw);
        if (!envelope || typeof envelope !== 'object') return null;
        if (!('version' in envelope)) {
          // legacy snapshot detected - wrap into versioned envelope and persist so next loads are canonical
          try {
            const lg = getLogger();
            lg.info &&
              lg.info('Persistence.loadSnapshot: migrating legacy snapshot to versioned envelope');
          } catch (_) {
            /* ignore */
          }
          try {
            const legacy = envelope;
            const wrapped = { version: SNAPSHOT_VERSION, created: Date.now(), payload: legacy };
            try {
              localStorage.setItem('elifoot_save_snapshot', JSON.stringify(wrapped));
            } catch (e) {
              /* best-effort */
            }
            return wrapped.payload || null;
          } catch (e) {
            return envelope;
          }
        }
        if (envelope.version !== SNAPSHOT_VERSION) {
          try {
            const lg = getLogger();
            lg.warn &&
              lg.warn('Persistence.loadSnapshot: snapshot version mismatch', envelope.version);
          } catch (_) {
            /* ignore */
          }
          // incompatible version - return null for now
          return null;
        }
        return envelope.payload || null;
      } catch (e) {
        try {
          const lg = getLogger();
          lg.warn && lg.warn('Persistence.loadSnapshot failed', e);
        } catch (_) {
          /* ignore */
        }
        return null;
      }
    },

    saveDebugSnapshot(dbg) {
      try {
        if (typeof localStorage !== 'undefined')
          localStorage.setItem('elifoot_debug_snapshot', JSON.stringify(dbg));
      } catch (e) {
        /* ignore */
      }
    },

    saveSeasonResults(obj) {
      try {
        if (typeof localStorage !== 'undefined')
          localStorage.setItem('elifoot_last_season_results', JSON.stringify(obj));
      } catch (e) {
        /* ignore */
      }
    },

    // low-level helpers
    getRaw(key) {
      try {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      } catch (e) {
        return null;
      }
    },
    setRaw(key, value) {
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      } catch (e) {
        /* ignore */
      }
    },
  };

  // export to window.Elifoot and CommonJS for tests
  if (typeof window !== 'undefined') {
    window.Elifoot = window.Elifoot || {};
    window.Elifoot.Persistence = window.Elifoot.Persistence || Persistence;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = Persistence;
})();
