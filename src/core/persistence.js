// core/persistence.js
// Centralized persistence API to replace ad-hoc localStorage usage.
'use strict';

const DEFAULT_MAX_BYTES = 5242880; // 5MB default max snapshot size
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

  /**
   * Cleans the snapshot object before saving. This function removes temporary data,
   * trims long history arrays, and eliminates circular references to reduce the
   * overall size of the save file and prevent serialization errors.
   * @param {object} snap The raw game state snapshot.
   * @returns {object} A cleaned, smaller version of the snapshot.
   */
  function pruneSnapshot(snap) {
    if (!snap) return null;
    // Create a deep copy to avoid mutating the live game state.
    // This is the simplest way, though not the most performant for huge objects.
    // It also handily breaks any circular references that would prevent stringification.
    const pruned = JSON.parse(JSON.stringify(snap));

    // 1. Trim large history arrays to keep the snapshot lean.
    if (Array.isArray(pruned.TRANSFER_HISTORY)) {
      pruned.TRANSFER_HISTORY = pruned.TRANSFER_HISTORY.slice(-50); // Keep last 50 entries
    }

    // 2. Remove redundant or circular references from clubs and players.
    // The `originalClubRef` is a major source of bloat and is not needed for loading a save.
    const cleanPlayer = (player) => {
      if (player) delete player.originalClubRef;
    };

    if (Array.isArray(pruned.allClubs)) {
      pruned.allClubs.forEach((club) => {
        if (club && club.team && Array.isArray(club.team.players)) {
          club.team.players.forEach(cleanPlayer);
        }
      });
    }

    // 3. Clean pending releases as well.
    if (Array.isArray(pruned.PENDING_RELEASES)) {
      pruned.PENDING_RELEASES.forEach(cleanPlayer);
    }

    return pruned;
  }

  const Persistence = {
    // saveSnapshot stores an envelope {version, created, payload} and enforces a size guard.
    saveSnapshot(snap, opts) {
      try {
        const cleanSnap = pruneSnapshot(snap);
        const cfg =
          typeof window !== 'undefined' &&
          (window.FootLab || window.Elifoot) &&
          (window.FootLab || window.Elifoot).Config
            ? (window.FootLab || window.Elifoot).Config
            : {};
        const maxBytes = 5242880; // Forçado para 5MB
        const envelope = { version: SNAPSHOT_VERSION, created: Date.now(), payload: cleanSnap };
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
  
  export default Persistence;