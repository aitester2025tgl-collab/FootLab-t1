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
      if (
        typeof window !== 'undefined' &&
        (window.FootLab || window.Elifoot) &&
        (window.FootLab || window.Elifoot).Logger
      )
        return (window.FootLab || window.Elifoot).Logger;
      // eslint-disable-next-line no-empty
    } catch (e) {
      /* ignore */
    }
    try {
      if (typeof require === 'function') {
        // prefer local core logger when running under node/tests
        try {
          return require('./logger');
          // eslint-disable-next-line no-empty
        } catch (e) {
          /* ignore */
        }
      }
      // eslint-disable-next-line no-empty
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
          typeof window !== 'undefined' &&
          (window.FootLab || window.Elifoot) &&
          (window.FootLab || window.Elifoot).Config
            ? (window.FootLab || window.Elifoot).Config
            : {};
        const maxBytes = (opts && opts.maxBytes) || cfg.maxSnapshotSizeBytes || DEFAULT_MAX_BYTES;
        const envelope = { version: SNAPSHOT_VERSION, created: Date.now(), payload: snap };
        const raw = JSON.stringify(envelope);
        const size = getByteSize(raw);
        const logger =
          typeof window !== 'undefined' &&
          (window.FootLab || window.Elifoot) &&
          (window.FootLab || window.Elifoot).Logger
            ? (window.FootLab || window.Elifoot).Logger
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
            // eslint-disable-next-line no-empty
          } catch (_) {
            void 0;
          }
          // best-effort: save debug snapshot instead so we don't lose data for inspection
          try {
            Persistence.saveDebugSnapshot({
              reason: 'oversize_snapshot',
              size,
              maxBytes,
              snapshotMeta: { currentJornada: snap && snap.currentJornada },
            });
            // eslint-disable-next-line no-empty
          } catch (_) {
            /* ignore */
          }
          return false;
        }
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('footlab_t1_save_snapshot', raw);
            // eslint-disable-next-line no-empty
          } catch (_) {}
          try {
            localStorage.setItem('elifoot_save_snapshot', raw);
            // eslint-disable-next-line no-empty
          } catch (_) {}
        }
        return true;
      } catch (e) {
        try {
          const lg = getLogger();
          lg.warn && lg.warn('Persistence.saveSnapshot failed', e);
          // eslint-disable-next-line no-empty
        } catch (_) {
          /* ignore */
        }
        return false;
      }
    },

    loadSnapshot() {
      try {
        if (typeof localStorage === 'undefined') return null;
        const raw =
          localStorage.getItem('footlab_t1_save_snapshot') ||
          localStorage.getItem('elifoot_save_snapshot');
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
              try {
                localStorage.setItem('footlab_t1_save_snapshot', JSON.stringify(wrapped));
              } catch (_) {
                void 0;
              }
              try {
                localStorage.setItem('elifoot_save_snapshot', JSON.stringify(wrapped));
              } catch (_) {
                void 0;
              }
              // small no-op to explicitly ignore storage write failures
            } catch (e) {
              void 0;
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
            // eslint-disable-next-line no-empty
          } catch (_) {
            void 0;
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
          void 0;
        }
        return null;
      }
    },

    saveDebugSnapshot(dbg) {
      try {
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('footlab_t1_debug_snapshot', JSON.stringify(dbg));
            // eslint-disable-next-line no-empty
          } catch (_) {
            void 0;
          }
          try {
            localStorage.setItem('elifoot_debug_snapshot', JSON.stringify(dbg));
            // small no-op to explicitly ignore storage write failures
          } catch (_) {
            void 0;
          }
        }
        // small no-op
      } catch (e) {
        void 0;
      }
    },

    saveSeasonResults(obj) {
      try {
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('footlab_t1_last_season_results', JSON.stringify(obj));
          } catch (_) {
            void 0;
          }
          try {
            localStorage.setItem('elifoot_last_season_results', JSON.stringify(obj));
          } catch (_) {
            void 0;
          }
        }
      } catch (e) {
        void 0;
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
        void 0;
      }
    },
  };

  // export to window.Elifoot and CommonJS for tests
  if (typeof window !== 'undefined') {
    window.FootLab = window.FootLab || window.Elifoot || {};
    window.FootLab.Persistence = window.FootLab.Persistence || Persistence;
    // compatibility alias
    window.Elifoot = window.Elifoot || window.FootLab;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = Persistence;
})();
