(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __commonJS = (cb, mod) => function __require2() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // src/core/globals.js
  var require_globals = __commonJS({
    "src/core/globals.js"(exports, module) {
      (function() {
        if (typeof window === "undefined") return;
        window.FootLab = window.FootLab || window.Elifoot || {};
        window.Elifoot = window.Elifoot || window.FootLab;
        const keys = [
          "playerClub",
          "currentRoundMatches",
          "allDivisions",
          "allClubs",
          "currentJornada",
          "GAME_NAME",
          "GameConfig"
        ];
        keys.forEach((k) => {
          try {
            if (typeof window[k] !== "undefined" && typeof window.Elifoot[k] === "undefined")
              window.Elifoot[k] = window[k];
          } catch (e2) {
          }
          try {
            Object.defineProperty(window, k, {
              get() {
                return window.Elifoot[k];
              },
              set(v) {
                window.Elifoot[k] = v;
              },
              configurable: true
            });
          } catch (e2) {
          }
        });
        const namespaces = [
          "MatchBoard",
          "Hub",
          "Tactics",
          "Overlays",
          "Finance",
          "Offers",
          "Lineups",
          "Promotion"
        ];
        namespaces.forEach((name) => {
          try {
            window.FootLab[name] = window.FootLab[name] || window[name] || {};
            Object.defineProperty(window, name, {
              get() {
                return window.FootLab[name];
              },
              set(v) {
                window.FootLab[name] = v;
              },
              configurable: true
            });
          } catch (e2) {
          }
        });
        try {
          if (typeof module !== "undefined" && module.exports)
            module.exports = window.FootLab || window.Elifoot;
        } catch (e2) {
        }
      })();
    }
  });

  // src/core/logger.js
  var require_logger = __commonJS({
    "src/core/logger.js"(exports, module) {
      (function() {
        "use strict";
        const LEVELS = { DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40 };
        const FootLab2 = typeof window !== "undefined" && (window.FootLab || window.Elifoot) || {};
        let currentLevel = FootLab2 && FootLab2.Config && FootLab2.Config.LOG_LEVEL ? FootLab2.Config.LOG_LEVEL : FootLab2 && FootLab2.Config && FootLab2.Config.DEBUG ? LEVELS.DEBUG : LEVELS.INFO;
        function shouldLog(level) {
          return level >= currentLevel;
        }
        const logger = {
          LEVELS,
          setLevel(nameOrValue) {
            if (typeof nameOrValue === "string" && LEVELS[nameOrValue] !== void 0)
              currentLevel = LEVELS[nameOrValue];
            else if (typeof nameOrValue === "number") currentLevel = nameOrValue;
          },
          debug(...args) {
            if (shouldLog(LEVELS.DEBUG))
              try {
                console.debug && console.debug(...args);
              } catch (_) {
              }
          },
          info(...args) {
            if (shouldLog(LEVELS.INFO))
              try {
                console.info && console.info(...args);
              } catch (_) {
              }
          },
          warn(...args) {
            if (shouldLog(LEVELS.WARN))
              try {
                console.warn && console.warn(...args);
              } catch (_) {
              }
          },
          error(...args) {
            if (shouldLog(LEVELS.ERROR))
              try {
                console.error && console.error(...args);
              } catch (_) {
              }
          }
        };
        if (typeof window !== "undefined") {
          window.FootLab = window.FootLab || window.Elifoot || {};
          window.FootLab.Logger = window.FootLab.Logger || logger;
          window.Elifoot = window.Elifoot || window.FootLab;
        }
        if (typeof module !== "undefined" && module.exports) module.exports = logger;
      })();
    }
  });

  // src/core/persistence.js
  var require_persistence = __commonJS({
    "src/core/persistence.js"(exports, module) {
      (function() {
        "use strict";
        const DEFAULT_MAX_BYTES = 512 * 1024;
        const SNAPSHOT_VERSION = 1;
        function getByteSize(str) {
          try {
            if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(str).length;
            return str.length;
          } catch (e2) {
            return str && str.length || 0;
          }
        }
        function getLogger6() {
          try {
            if (typeof window !== "undefined" && (window.FootLab || window.Elifoot) && (window.FootLab || window.Elifoot).Logger)
              return (window.FootLab || window.Elifoot).Logger;
          } catch (e2) {
          }
          try {
            if (typeof __require === "function") {
              try {
                return require_logger();
              } catch (e2) {
              }
            }
          } catch (e2) {
          }
          return console;
        }
        const Persistence = {
          // saveSnapshot stores an envelope {version, created, payload} and enforces a size guard.
          saveSnapshot(snap, opts) {
            try {
              const cfg = typeof window !== "undefined" && (window.FootLab || window.Elifoot) && (window.FootLab || window.Elifoot).Config ? (window.FootLab || window.Elifoot).Config : {};
              const maxBytes = opts && opts.maxBytes || cfg.maxSnapshotSizeBytes || DEFAULT_MAX_BYTES;
              const envelope = { version: SNAPSHOT_VERSION, created: Date.now(), payload: snap };
              const raw = JSON.stringify(envelope);
              const size = getByteSize(raw);
              const logger = typeof window !== "undefined" && (window.FootLab || window.Elifoot) && (window.FootLab || window.Elifoot).Logger ? (window.FootLab || window.Elifoot).Logger : console;
              if (size > maxBytes) {
                try {
                  logger.warn && logger.warn(
                    "Persistence.saveSnapshot: snapshot too large",
                    size,
                    "bytes (max",
                    maxBytes,
                    ")"
                  );
                } catch (_) {
                }
                try {
                  Persistence.saveDebugSnapshot({
                    reason: "oversize_snapshot",
                    size,
                    maxBytes,
                    snapshotMeta: { currentJornada: snap && snap.currentJornada }
                  });
                } catch (_) {
                }
                return false;
              }
              if (typeof localStorage !== "undefined") {
                try {
                  localStorage.setItem("footlab_t1_save_snapshot", raw);
                } catch (_) {
                }
                try {
                  localStorage.setItem("elifoot_save_snapshot", raw);
                } catch (_) {
                }
              }
              return true;
            } catch (e2) {
              try {
                const lg = getLogger6();
                lg.warn && lg.warn("Persistence.saveSnapshot failed", e2);
              } catch (_) {
              }
              return false;
            }
          },
          loadSnapshot() {
            try {
              if (typeof localStorage === "undefined") return null;
              const raw = localStorage.getItem("footlab_t1_save_snapshot") || localStorage.getItem("elifoot_save_snapshot");
              if (!raw) return null;
              const envelope = JSON.parse(raw);
              if (!envelope || typeof envelope !== "object") return null;
              if (!("version" in envelope)) {
                try {
                  const lg = getLogger6();
                  lg.info && lg.info("Persistence.loadSnapshot: migrating legacy snapshot to versioned envelope");
                } catch (_) {
                }
                try {
                  const legacy = envelope;
                  const wrapped = { version: SNAPSHOT_VERSION, created: Date.now(), payload: legacy };
                  try {
                    try {
                      localStorage.setItem("footlab_t1_save_snapshot", JSON.stringify(wrapped));
                    } catch (_) {
                    }
                    try {
                      localStorage.setItem("elifoot_save_snapshot", JSON.stringify(wrapped));
                    } catch (_) {
                    }
                  } catch (e2) {
                  }
                  return wrapped.payload || null;
                } catch (e2) {
                  return envelope;
                }
              }
              if (envelope.version !== SNAPSHOT_VERSION) {
                try {
                  const lg = getLogger6();
                  lg.warn && lg.warn("Persistence.loadSnapshot: snapshot version mismatch", envelope.version);
                } catch (_) {
                }
                return null;
              }
              return envelope.payload || null;
            } catch (e2) {
              try {
                const lg = getLogger6();
                lg.warn && lg.warn("Persistence.loadSnapshot failed", e2);
              } catch (_) {
              }
              return null;
            }
          },
          saveDebugSnapshot(dbg) {
            try {
              if (typeof localStorage !== "undefined") {
                try {
                  localStorage.setItem("footlab_t1_debug_snapshot", JSON.stringify(dbg));
                } catch (_) {
                }
                try {
                  localStorage.setItem("elifoot_debug_snapshot", JSON.stringify(dbg));
                } catch (_) {
                }
              }
            } catch (e2) {
            }
          },
          saveSeasonResults(obj) {
            try {
              if (typeof localStorage !== "undefined") {
                try {
                  localStorage.setItem("footlab_t1_last_season_results", JSON.stringify(obj));
                } catch (_) {
                }
                try {
                  localStorage.setItem("elifoot_last_season_results", JSON.stringify(obj));
                } catch (_) {
                }
              }
            } catch (e2) {
            }
          },
          // low-level helpers
          getRaw(key) {
            try {
              return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
            } catch (e2) {
              return null;
            }
          },
          setRaw(key, value) {
            try {
              if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
            } catch (e2) {
            }
          }
        };
        if (typeof window !== "undefined") {
          window.FootLab = window.FootLab || window.Elifoot || {};
          window.FootLab.Persistence = window.FootLab.Persistence || Persistence;
          window.Elifoot = window.Elifoot || window.FootLab;
        }
        if (typeof module !== "undefined" && module.exports) module.exports = Persistence;
      })();
    }
  });

  // src/core/promotion.js
  var require_promotion = __commonJS({
    "src/core/promotion.js"(exports, module) {
      (function() {
        "use strict";
        function cloneClubs(arr) {
          return arr.map((c) => Object.assign({}, c));
        }
        function applyPromotionRelegation(allDivisions2) {
          if (!Array.isArray(allDivisions2) || allDivisions2.length === 0)
            throw new Error("allDivisions must be an array of divisions");
          const divisions = allDivisions2.map((d) => Array.isArray(d) ? d.slice() : []);
          const promoted = {};
          const relegated = {};
          function sortStandings(arr) {
            return arr.slice().sort((a, b) => {
              const pa = Number(a.points || 0), pb = Number(b.points || 0);
              if (pb !== pa) return pb - pa;
              const gda = Number(a.goalsFor || 0) - Number(a.goalsAgainst || 0);
              const gdb = Number(b.goalsFor || 0) - Number(b.goalsAgainst || 0);
              if (gdb !== gda) return gdb - gda;
              return Number(b.goalsFor || 0) - Number(a.goalsFor || 0);
            });
          }
          const D = divisions.length;
          for (let idx = 1; idx < D; idx++) {
            const div = divisions[idx] || [];
            const sorted = sortStandings(div);
            const top3 = sorted.slice(0, 3);
            promoted[idx] = top3;
          }
          for (let idx = 0; idx < D - 1; idx++) {
            const div = divisions[idx] || [];
            const sorted = sortStandings(div);
            const bottom3 = sorted.slice(-3);
            relegated[idx] = bottom3;
          }
          const newDivisions = divisions.map((d) => d.slice());
          for (let idx = 0; idx < D - 1; idx++) {
            const rej = (relegated[idx] || []).slice();
            if (!rej.length) continue;
            rej.forEach((club) => {
              const arr = newDivisions[idx];
              const i = arr.indexOf(club);
              if (i >= 0) arr.splice(i, 1);
              if (club) club.division = idx + 2;
            });
            newDivisions[idx + 1] = newDivisions[idx + 1].concat(rej);
          }
          for (let idx = D - 1; idx >= 1; idx--) {
            const pr = (promoted[idx] || []).slice();
            if (!pr.length) continue;
            pr.forEach((club) => {
              const arr = newDivisions[idx];
              const i = arr.indexOf(club);
              if (i >= 0) arr.splice(i, 1);
              if (club) club.division = idx;
            });
            newDivisions[idx - 1] = newDivisions[idx - 1].concat(pr);
          }
          return { newDivisions, promoted, relegated };
        }
        if (typeof module !== "undefined" && module.exports)
          module.exports = { applyPromotionRelegation };
        if (typeof window !== "undefined") {
          window.Promotion = window.Promotion || {};
          window.Promotion.applyPromotionRelegation = applyPromotionRelegation;
        }
      })();
    }
  });

  // src/constants.js
  var require_constants = __commonJS({
    "src/constants.js"(exports, module) {
      (function(root) {
        const Constants = {
          GAME_NAME: "FootLab t1",
          POSITIONS: ["GK", "DF", "MF", "FW"],
          DIVISION_SKILL_CAPS: {
            1: { base: 95, min: 75 },
            2: { base: 80, min: 60 },
            3: { base: 65, min: 45 },
            4: { base: 50, min: 25 }
          },
          DEFAULT_DIVISION_SKILL_CAP: { base: 50, min: 25 },
          CONTRACT_CONFIG: {
            pctOneYear: 0.35,
            pctExpiring: 0.12,
            minSalary: 300,
            salaryMultiplier: 25
          },
          TRANSFER_MARKET: {
            freeAgentProb: 0.06,
            maxFreeAgentsPerClub: 2,
            pendingReleaseProb: 0.02,
            maxPendingPerClub: 1,
            expiringLeaveProb: 0.35,
            maxExpiringPerClub: 2,
            baseMarketValue: 5e3,
            skillValueMultiplier: 200,
            divisionMultipliers: {
              1: 1.6,
              2: 1.25,
              3: 0.9,
              4: 0.6
            }
          },
          SEASONAL_DRIFT_FACTORS: [0.6, 0.4, 0.28, 0.18]
        };
        if (typeof exports !== "undefined") {
          if (typeof module !== "undefined" && module.exports) {
            exports = module.exports = Constants;
          } else {
            exports.Constants = Constants;
          }
        } else {
          root.GameConstants = Constants;
        }
      })(typeof self !== "undefined" ? self : exports);
    }
  });

  // src/teams.js
  var require_teams = __commonJS({
    "src/teams.js"(exports, module) {
      var E = typeof window !== "undefined" ? window.FootLab || window.Elifoot || window : typeof global !== "undefined" ? global : {};
      function buildDivisionsFromRostersOrdered() {
        const E2 = typeof window !== "undefined" ? window.FootLab || window.Elifoot || window : typeof global !== "undefined" ? global : {};
        function getLogger6() {
          try {
            return typeof window !== "undefined" && window.FootLab && window.FootLab.Logger || typeof window !== "undefined" && window.Elifoot && window.Elifoot.Logger || console;
          } catch (e2) {
            return console;
          }
        }
        const globalObj = typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {};
        const rostersSource = globalObj && globalObj.REAL_ROSTERS || E2 && E2.REAL_ROSTERS || null;
        const rosters = rostersSource ? Object.keys(rostersSource) : [];
        const teamColorMapSource = globalObj && globalObj.REAL_TEAM_COLORS || E2 && E2.REAL_TEAM_COLORS || null;
        const rostersArePresent = Array.isArray(rosters) && rosters.length > 0;
        if (!rostersArePresent) {
          throw new Error(
            `Aguardando dados: window.REAL_ROSTERS n\xE3o encontrado. Verifique se real_rosters_2025_26.js foi carregado.`
          );
        }
        function validateRosters(expectedTeams = 72, minPlayers = 18) {
          if (!(E2 && E2.REAL_ROSTERS)) return;
          const keys = Object.keys(E2.REAL_ROSTERS);
          const problems = [];
          if (keys.length !== expectedTeams)
            problems.push(`expected ${expectedTeams} teams but found ${keys.length}`);
          for (let i = 0; i < keys.length; i++) {
            const team = keys[i];
            const players = E2.REAL_ROSTERS[team] || [];
            if (!Array.isArray(players)) {
              problems.push(`${team} roster is not an array`);
              continue;
            }
            if (players.length < minPlayers) problems.push(`${team} has only ${players.length} players`);
          }
          if (problems.length) {
            const msg = "Roster validation failed: " + problems.join("; ");
            try {
              const L = getLogger6();
              L && L.warn && L.warn(msg);
            } catch (e2) {
              try {
                console && console.warn && console.warn(msg);
              } catch (_) {
              }
            }
            return;
          }
        }
        validateRosters(72, 18);
        function nameToColor(name) {
          if (!name) return { bg: "#2e2e2e", fg: "#ffffff" };
          let h = 0;
          for (let i = 0; i < name.length; i++) h = h * 31 + name.charCodeAt(i) & 268435455;
          const hue = h % 360;
          const sat = 60 + h % 10;
          const light = 34 + h % 12;
          const hslToHexLocal = (h2, s, l) => {
            l /= 100;
            const a = s * Math.min(l, 1 - l) / 100;
            const f = (n) => {
              const k = (n + h2 / 30) % 12;
              const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
              return Math.round(255 * color).toString(16).padStart(2, "0");
            };
            return `#${f(0)}${f(8)}${f(4)}`;
          };
          const getLuminanceLocal = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            const a = [r, g, b].map((v) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
            return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
          };
          const bg = hslToHexLocal(hue, sat, light);
          const L = getLuminanceLocal(bg);
          const fg = L > 0.5 ? "#000000" : "#ffffff";
          return { bg, fg };
        }
        const teamColorMap = teamColorMapSource;
        function normalizeName(n) {
          if (!n) return "";
          let s = n.normalize ? n.normalize("NFD").replace(/\p{Diacritic}/gu, "") : n;
          s = String(s).toLowerCase();
          s = s.replace(/\b(fc|cf|sl|sc|cd|ac|cp|sad|f c|c f|ac\.|fc\.|sc\.|rcd|ssc|ss|clube|futebol)\b/g, "");
          s = s.replace(/[\u2018\u2019'`’]/g, "");
          s = s.replace(/[^a-z0-9\s]/g, "");
          s = s.replace(/\s+/g, " ").trim();
          return s;
        }
        const _normalizedColorMap = {};
        try {
          Object.keys(teamColorMap || {}).forEach((k) => {
            const nk = normalizeName(k || "");
            if (nk) _normalizedColorMap[nk] = teamColorMap[k];
          });
        } catch (e2) {
        }
        const sliceTeam = (start) => rosters.slice(start, start + 18).map((name) => {
          let c;
          const exact = teamColorMap && teamColorMap[name] ? teamColorMap[name] : null;
          if (exact) {
            c = { bg: exact.bgColor || "#2e2e2e", fg: exact.color || "#ffffff" };
          } else {
            const nk = normalizeName(name);
            const m = nk && _normalizedColorMap[nk] ? _normalizedColorMap[nk] : null;
            if (m) c = { bg: m.bgColor || "#2e2e2e", fg: m.color || "#ffffff" };
            else c = nameToColor(name);
          }
          return { name, color: c.fg, bgColor: c.bg };
        });
        const div1 = sliceTeam(0);
        const div2 = sliceTeam(18);
        const div3 = sliceTeam(36);
        const div4 = sliceTeam(54);
        return [
          { name: "1\xAA divis\xE3o", teams: div1 },
          { name: "2\xAA divis\xE3o", teams: div2 },
          { name: "3\xAA divis\xE3o", teams: div3 },
          { name: "4\xAA divis\xE3o", teams: div4 }
        ];
      }
      var divisionsData2 = null;
      var _divisionsResolve = null;
      var _divisionsReject = null;
      var divisionsReady = new Promise((resolve, reject) => {
        _divisionsResolve = resolve;
        _divisionsReject = reject;
      });
      function _tryBuildDivisions() {
        try {
          const dd = buildDivisionsFromRostersOrdered();
          divisionsData2 = dd;
          try {
            if (typeof console !== "undefined" && console.log) {
            }
          } catch (e2) {
          }
          try {
            if (typeof window !== "undefined") window.divisionsData = divisionsData2;
            if (typeof global !== "undefined") global.divisionsData = divisionsData2;
          } catch (e2) {
          }
          try {
            _divisionsResolve && _divisionsResolve(divisionsData2);
          } catch (e2) {
          }
          try {
            if (typeof document !== "undefined" && typeof document.dispatchEvent === "function") {
              document.dispatchEvent(new CustomEvent("footlab:rosters-loaded"));
            }
          } catch (e2) {
          }
          return true;
        } catch (e2) {
          return false;
        }
      }
      if (!_tryBuildDivisions()) {
        const start = Date.now();
        const timeout = 3e3;
        const iv = setInterval(() => {
          if (_tryBuildDivisions()) {
            clearInterval(iv);
            return;
          }
          if (Date.now() - start > timeout) {
            clearInterval(iv);
            try {
              _divisionsReject && _divisionsReject(
                new Error("Timed out waiting for window.REAL_ROSTERS to become available")
              );
            } catch (e2) {
            }
            try {
              console && console.error && console.error("Timed out waiting for window.REAL_ROSTERS");
            } catch (_) {
            }
          }
        }, 80);
      }
      function waitForDivisionsData(timeoutMs = 3e3) {
        if (divisionsData2) return Promise.resolve(divisionsData2);
        return Promise.race([
          divisionsReady,
          new Promise(
            (_, rej) => setTimeout(() => rej(new Error("waitForDivisionsData timeout")), timeoutMs)
          )
        ]);
      }
      var TACTICS = [
        {
          name: "4-4-2",
          description: "Cl\xE1ssica - Equilibrada",
          attack: 3,
          defense: 3,
          midfield: 4,
          requires: { wingers: false, threeAtBack: false }
        },
        {
          name: "4-3-3",
          description: "Ofensiva - Ataque (com pontas)",
          attack: 4,
          defense: 2,
          midfield: 3,
          requires: { wingers: true, threeAtBack: false }
        },
        {
          name: "3-5-2",
          description: "Controle - Meio-campo (tr\xEAs centrais)",
          attack: 3,
          defense: 3,
          midfield: 5,
          requires: { wingers: false, threeAtBack: true }
        },
        {
          name: "5-3-2",
          description: "Defensiva - Seguran\xE7a (laterais avan\xE7am)",
          attack: 2,
          defense: 5,
          midfield: 3,
          requires: { wingers: false, threeAtBack: false }
        },
        {
          name: "4-5-1",
          description: "Conten\xE7\xE3o - Defesa (meio-campo denso)",
          attack: 2,
          defense: 4,
          midfield: 5,
          requires: { wingers: false, threeAtBack: false }
        },
        {
          name: "3-4-3",
          description: "Ataque Total - Press\xE3o (tr\xEAs centrais e pontas)",
          attack: 5,
          defense: 2,
          midfield: 4,
          requires: { wingers: true, threeAtBack: true }
        },
        {
          name: "5-4-1",
          description: "Ultra Defensiva - Resist\xEAncia",
          attack: 1,
          defense: 5,
          midfield: 4,
          requires: { wingers: false, threeAtBack: false }
        }
      ];
      try {
        if (typeof window !== "undefined") {
          window.TACTICS = TACTICS;
          window.FootLab = window.FootLab || window.Elifoot || {};
          window.FootLab.TACTICS = window.FootLab.TACTICS || TACTICS;
          window.Elifoot = window.Elifoot || window.FootLab;
        }
        if (typeof global !== "undefined") global.TACTICS = TACTICS;
      } catch (e2) {
      }
      function generateTeam(teamId) {
        const allTeams = divisionsData2.map((d) => d.teams).flat();
        const teamMeta = allTeams[teamId - 1] || {
          name: `Team ${teamId}`,
          color: "#FFFFFF",
          bgColor: "#000000"
        };
        let players = [];
        try {
          if (E && E.REAL_ROSTERS && E.REAL_ROSTERS[teamMeta.name])
            players = E.REAL_ROSTERS[teamMeta.name];
        } catch (e2) {
          players = [];
        }
        if (!Array.isArray(players) || players.length === 0) {
          throw new Error(
            `No roster found for team "${teamMeta.name}" (teamId ${teamId}). The application requires real roster data in window.REAL_ROSTERS.`
          );
        }
        const divIndex = Math.floor((teamId - 1) / 18);
        let stadiumCapacity = divIndex === 0 ? 3e4 : divIndex === 1 ? 15e3 : divIndex === 2 ? 1e4 : 4e3;
        let members = divIndex === 0 ? 25e3 : divIndex === 1 ? 15e3 : divIndex === 2 ? 5e3 : 1e3;
        return {
          id: teamId,
          name: teamMeta.name,
          color: teamMeta.color,
          bgColor: teamMeta.bgColor,
          players,
          tactic: "4-4-2",
          stadiumCapacity,
          members,
          ticketPrice: 20,
          totalSalaryCost: 0,
          currentLeaguePosition: 0,
          leaguePoints: 0
        };
      }
      try {
        if (typeof window !== "undefined") {
          window.generateTeam = generateTeam;
          window.FootLab = window.FootLab || window.Elifoot || {};
          window.FootLab.generateTeam = window.FootLab.generateTeam || generateTeam;
          window.Elifoot = window.Elifoot || window.FootLab;
        }
        if (typeof global !== "undefined") global.generateTeam = generateTeam;
      } catch (e2) {
      }
      function printDivisionAssignments() {
        if (typeof divisionsData2 === "undefined") return;
        const logger = typeof window !== "undefined" && window.FootLab && window.FootLab.Logger || typeof window !== "undefined" && window.Elifoot && window.Elifoot.Logger || console;
        divisionsData2.forEach((d, idx) => {
          logger.info(`${idx + 1}. ${d.name} \u2014 ${d.teams.length} teams`);
          d.teams.forEach((t, i) => logger.info(`   ${i + 1}. ${t.name}`));
        });
      }
      try {
        if (typeof window !== "undefined") {
          window.printDivisionAssignments = printDivisionAssignments;
          window.FootLab = window.FootLab || window.Elifoot || {};
          window.FootLab.printDivisionAssignments = window.FootLab.printDivisionAssignments || printDivisionAssignments;
          window.Elifoot = window.Elifoot || window.FootLab;
        }
        if (typeof global !== "undefined") global.printDivisionAssignments = printDivisionAssignments;
      } catch (e2) {
      }
      function validateRosterConstraints({
        expectedTeams = 72,
        minPlayers = 18,
        maxPlayers = 28,
        maxGK = 3
      } = {}) {
        if (!(E && E.REAL_ROSTERS)) return { ok: true, problems: [] };
        const keys = Object.keys(E.REAL_ROSTERS);
        const problems = [];
        if (keys.length !== expectedTeams)
          problems.push(`expected ${expectedTeams} teams but found ${keys.length}`);
        for (let team of keys) {
          const players = E.REAL_ROSTERS[team] || [];
          if (!Array.isArray(players)) {
            problems.push(`${team} roster is not an array`);
            continue;
          }
          if (players.length < minPlayers) problems.push(`${team} has only ${players.length} players`);
          if (players.length > maxPlayers)
            problems.push(`${team} has ${players.length} players (over ${maxPlayers})`);
          const gkCount = players.reduce(
            (a, p) => a + ((p.position || p.pos || "").toUpperCase() === "GK" ? 1 : 0),
            0
          );
          if (gkCount > maxGK) problems.push(`${team} has ${gkCount} GKs (over ${maxGK})`);
        }
        return { ok: problems.length === 0, problems };
      }
      try {
        if (typeof window !== "undefined") window.validateRosterConstraints = validateRosterConstraints;
        if (typeof global !== "undefined") global.validateRosterConstraints = validateRosterConstraints;
      } catch (e2) {
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports.printDivisionAssignments = printDivisionAssignments;
        module.exports.validateRosterConstraints = validateRosterConstraints;
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = {
          divisionsData: divisionsData2,
          waitForDivisionsData,
          generateTeam,
          TACTICS,
          printDivisionAssignments,
          validateRosterConstraints
        };
      }
      try {
        if (typeof window !== "undefined") {
          window.waitForDivisionsData = waitForDivisionsData;
          window.FootLab = window.FootLab || window.Elifoot || {};
          window.FootLab.waitForDivisionsData = window.FootLab.waitForDivisionsData || waitForDivisionsData;
          window.Elifoot = window.Elifoot || window.FootLab;
        }
        if (typeof global !== "undefined") global.waitForDivisionsData = waitForDivisionsData;
      } catch (e2) {
      }
      try {
        const _startup = validateRosterConstraints({
          expectedTeams: 72,
          minPlayers: 18,
          maxPlayers: 28,
          maxGK: 3
        });
        if (!_startup.ok) {
          throw new Error("Startup roster validation failed: " + _startup.problems.join("; "));
        }
      } catch (e2) {
        if (e2 && e2.message && e2.message.indexOf("Startup roster validation failed") === 0) throw e2;
      }
    }
  });

  // src/entry.mjs
  var import_globals = __toESM(require_globals(), 1);
  var import_logger = __toESM(require_logger(), 1);
  var import_persistence = __toESM(require_persistence(), 1);
  var import_promotion = __toESM(require_promotion(), 1);

  // src/logic/lineups.js
  (function() {
    function getLogger6() {
      try {
        return window.FootLab && window.FootLab.Logger || window.Elifoot && window.Elifoot.Logger || console;
      } catch (e2) {
        return console;
      }
    }
    try {
      window.FootLab = window.FootLab || window.Elifoot || {};
      const NS = window.FootLab.Lineups = window.FootLab.Lineups || {};
      window.Elifoot = window.Elifoot || window.FootLab;
      const parseFormation = function(tacticName) {
        try {
          const nums = (tacticName || "4-4-2").split("-").map((n) => parseInt(n, 10));
          if (nums.length === 3 && nums.every((n) => !isNaN(n))) return nums;
        } catch (e2) {
        }
        return [4, 4, 2];
      };
      const getPositionCategory = function(pos) {
        const p = (pos || "").toUpperCase();
        if (p === "GK" || p === "G" || p === "GOALKEEPER") return "GK";
        if (["DF", "CB", "LB", "RB", "LWB", "RWB"].includes(p)) return "DEF";
        if (["MF", "CM", "AM", "DM", "LM", "RM", "M"].includes(p)) return "MID";
        if (["ST", "FW", "SS", "CF", "LW", "RW", "A", "W"].includes(p)) return "ATT";
        return "MID";
      };
      const normalizePosition2 = function(pos) {
        const p = (pos || "").toUpperCase();
        if (p === "DF") return "CB";
        if (p === "MF" || p === "AM" || p === "DM") return "CM";
        if (p === "FW" || p === "SS") return "ST";
        return p;
      };
      const getCompatibleTactics = function(team) {
        if (!team || !Array.isArray(team.players) || !window.TACTICS) return [];
        const counts = { GK: 0, DEF: 0, MID: 0, ATT: 0 };
        team.players.forEach((p) => {
          counts[getPositionCategory(p.position)]++;
        });
        return window.TACTICS.filter((tactic) => {
          const formation = parseFormation(tactic.name);
          const reqGK = 1;
          const reqDEF = formation[0];
          const reqMID = formation[1];
          const reqATT = formation[2];
          const hasGK = counts.GK >= reqGK;
          const hasDef = counts.DEF >= reqDEF - 1;
          const hasMid = counts.MID >= reqMID - 1;
          const hasAtt = counts.ATT >= Math.min(reqATT, 1);
          const totalFieldPlayers = counts.DEF + counts.MID + counts.ATT;
          const isCompatible = hasGK && hasDef && hasMid && hasAtt && totalFieldPlayers >= 10;
          if (!isCompatible && team.name === (window.playerClub && window.playerClub.team.name)) {
            console.log(`T\xE1tica ${tactic.name} rejeitada:`, {
              reqs: { reqDEF, reqMID, reqATT },
              tem: counts,
              checks: { hasGK, hasDef, hasMid, hasAtt }
            });
          }
          return isCompatible;
        });
      };
      const orderByRoster = function(originalList, listToOrder) {
        if (!Array.isArray(originalList) || !Array.isArray(listToOrder))
          return Array.isArray(listToOrder) ? listToOrder.slice() : [];
        const namesSet = new Set(listToOrder.map((p) => p && p.name));
        const ordered = [];
        originalList.forEach((orig) => {
          if (!orig || !orig.name) return;
          if (namesSet.has(orig.name)) {
            const found = listToOrder.find((p) => p && p.name === orig.name);
            if (found) ordered.push(found);
          }
        });
        listToOrder.forEach((p) => {
          if (!ordered.includes(p)) ordered.push(p);
        });
        return ordered;
      };
      const chooseStarters = function(team) {
        if (!team || !Array.isArray(team.players)) return { starters: [], subs: [] };
        const available = team.players.filter((p) => !(p.suspendedGames && p.suspendedGames > 0));
        const players = available.slice();
        const formation = parseFormation(team.tactic || team.tacticData && team.tacticData.name);
        const defCount = formation[0] || 4;
        const midCount = formation[1] || 4;
        const attCount = formation[2] || 2;
        const byPos = { GK: [], LB: [], RB: [], CB: [], CM: [], LW: [], RW: [], ST: [], other: [] };
        players.forEach((p) => {
          const np = normalizePosition2(p.position);
          if (byPos[np]) byPos[np].push(p);
          else byPos.other.push(p);
        });
        Object.keys(byPos).forEach((k) => byPos[k].sort((a, b) => (b.skill || 0) - (a.skill || 0)));
        const starters = [];
        if (byPos.GK.length > 0) {
          const gk = byPos.GK.shift();
          const idx = players.findIndex((x) => x === gk);
          if (idx >= 0) players.splice(idx, 1);
          starters.push(gk);
        }
        const defenders = [];
        if (defCount === 5) {
          for (let i = 0; i < 3 && byPos.CB.length > 0; i++) defenders.push(byPos.CB.shift());
          if (defenders.length < defCount && byPos.LB.length > 0) defenders.push(byPos.LB.shift());
          if (defenders.length < defCount && byPos.RB.length > 0) defenders.push(byPos.RB.shift());
          while (defenders.length < defCount && byPos.CB.length > 0) defenders.push(byPos.CB.shift());
          while (defenders.length < defCount && (byPos.LB.length > 0 || byPos.RB.length > 0)) {
            if (byPos.LB.length > 0) defenders.push(byPos.LB.shift());
            if (defenders.length >= defCount) break;
            if (byPos.RB.length > 0) defenders.push(byPos.RB.shift());
          }
          while (defenders.length < defCount && byPos.CM.length > 0) defenders.push(byPos.CM.shift());
        } else {
          const minCBs = defCount === 3 ? 3 : Math.min(2, defCount);
          for (let k = 0; k < minCBs && byPos.CB.length > 0; k++) defenders.push(byPos.CB.shift());
          while (defenders.length < defCount && (byPos.LB.length > 0 || byPos.RB.length > 0)) {
            if (byPos.LB.length > 0) defenders.push(byPos.LB.shift());
            if (defenders.length >= defCount) break;
            if (byPos.RB.length > 0) defenders.push(byPos.RB.shift());
          }
          while (defenders.length < defCount && byPos.CB.length > 0) defenders.push(byPos.CB.shift());
          while (defenders.length < defCount && byPos.CM.length > 0) defenders.push(byPos.CM.shift());
        }
        defenders.forEach((p) => {
          if (!p) return;
          starters.push(p);
          const idx = players.findIndex((x) => x === p);
          if (idx >= 0) players.splice(idx, 1);
        });
        const mids = [];
        const wantsWingers = team.tacticData && team.tacticData.requires && team.tacticData.requires.wingers || false;
        if (wantsWingers) {
          if (byPos.LW.length > 0) mids.push(byPos.LW.shift());
          if (byPos.RW.length > 0) mids.push(byPos.RW.shift());
        }
        while (mids.length < midCount && byPos.CM.length > 0) mids.push(byPos.CM.shift());
        while (mids.length < midCount && (byPos.LW.length > 0 || byPos.RW.length > 0)) {
          if (byPos.LW.length > 0) mids.push(byPos.LW.shift());
          if (mids.length >= midCount) break;
          if (byPos.RW.length > 0) mids.push(byPos.RW.shift());
        }
        while (mids.length < midCount && byPos.other.length > 0) mids.push(byPos.other.shift());
        mids.forEach((p) => {
          if (!p) return;
          starters.push(p);
          const idx = players.findIndex((x) => x === p);
          if (idx >= 0) players.splice(idx, 1);
        });
        const atts = [];
        while (atts.length < attCount && byPos.ST.length > 0) atts.push(byPos.ST.shift());
        while (atts.length < attCount && byPos.RW.length > 0) atts.push(byPos.RW.shift());
        while (atts.length < attCount && byPos.LW.length > 0) atts.push(byPos.LW.shift());
        while (atts.length < attCount && byPos.CM.length > 0) atts.push(byPos.CM.shift());
        atts.forEach((p) => {
          if (!p) return;
          starters.push(p);
          const idx = players.findIndex((x) => x === p);
          if (idx >= 0) players.splice(idx, 1);
        });
        players.sort((a, b) => (b.skill || 0) - (a.skill || 0));
        while (starters.length < 11 && players.length > 0) starters.push(players.shift());
        const subsCount = Math.min(7, players.length);
        const subs = [];
        const remainingSorted = players.slice().sort((a, b) => (b.skill || 0) - (a.skill || 0));
        let gkSubs = 0;
        for (let i = 0; i < remainingSorted.length && subs.length < subsCount; i++) {
          const p = remainingSorted[i];
          const pPos = p && p.position ? (p.position || "").toUpperCase() : "";
          if (pPos === "GK") {
            const nonGkLeft = remainingSorted.slice(i + 1).filter((x) => (x.position || "").toUpperCase() !== "GK").length + subs.filter((x) => (x.position || "").toUpperCase() !== "GK").length;
            if (gkSubs >= 1 && nonGkLeft >= subsCount - subs.length) {
              continue;
            }
            gkSubs++;
            subs.push(p);
          } else {
            subs.push(p);
          }
        }
        subs.forEach((s) => {
          const idx = players.findIndex((x) => x === s);
          if (idx >= 0) players.splice(idx, 1);
        });
        const groupAndOrder = function(list, roster) {
          if (!Array.isArray(list)) return [];
          const groups = { GK: [], DEF: [], MID: [], ATT: [] };
          list.forEach((p) => {
            const np = normalizePosition2(p.position);
            if (np === "GK") groups.GK.push(p);
            else if (np === "CB" || np === "LB" || np === "RB" || np === "DF") groups.DEF.push(p);
            else if (np === "CM" || np === "LW" || np === "RW" || np === "AM" || np === "DM")
              groups.MID.push(p);
            else if (np === "ST") groups.ATT.push(p);
            else groups.MID.push(p);
          });
          const ordered = [];
          ordered.push(...orderByRoster(roster, groups.GK));
          ordered.push(...orderByRoster(roster, groups.DEF));
          ordered.push(...orderByRoster(roster, groups.MID));
          ordered.push(...orderByRoster(roster, groups.ATT));
          list.forEach((p) => {
            if (!ordered.includes(p)) ordered.push(p);
          });
          return ordered;
        };
        const orderedStarters = groupAndOrder(starters, team.players);
        const subsNonGk = subs.filter((s) => (s.position || "").toUpperCase() !== "GK");
        const subsGk = subs.filter((s) => (s.position || "").toUpperCase() === "GK");
        const orderedSubs = orderByRoster(team.players, subsNonGk).concat(
          orderByRoster(team.players, subsGk)
        );
        return { starters: orderedStarters, subs: orderedSubs };
      };
      const reorderMatchByRoster = function(clubObj, matchObj, isHomeSide) {
        try {
          if (!clubObj || !clubObj.team || !Array.isArray(clubObj.team.players)) return;
          const roster = clubObj.team.players;
          const orderList = (list) => {
            if (!Array.isArray(list)) return list;
            const ordered = [];
            roster.forEach((r) => {
              if (!r || !r.name) return;
              const found = list.find((p) => p && p.name === r.name);
              if (found) ordered.push(found);
            });
            list.forEach((p) => {
              if (!ordered.includes(p)) ordered.push(p);
            });
            return ordered;
          };
          if (isHomeSide) {
            matchObj.homePlayers = orderList(matchObj.homePlayers || []);
            matchObj.homeSubs = orderList(matchObj.homeSubs || []);
          } else {
            matchObj.awayPlayers = orderList(matchObj.awayPlayers || []);
            matchObj.awaySubs = orderList(matchObj.awaySubs || []);
          }
        } catch (err) {
          try {
            getLogger6().error("Erro a reordenar match por roster", err);
          } catch (_) {
          }
        }
      };
      NS.parseFormation = parseFormation;
      NS.normalizePosition = normalizePosition2;
      NS.getPositionCategory = getPositionCategory;
      NS.chooseStarters = chooseStarters;
      NS.getCompatibleTactics = getCompatibleTactics;
      NS.orderByRoster = orderByRoster;
      NS.reorderMatchByRoster = reorderMatchByRoster;
    } catch (err) {
      try {
        getLogger6().error("Erro a inicializar Elifoot.Lineups", err);
      } catch (_) {
      }
    }
  })();

  // src/entry.mjs
  var import_constants = __toESM(require_constants(), 1);

  // src/players.js
  var positions = typeof GameConstants !== "undefined" && GameConstants.POSITIONS || ["GK", "DF", "MF", "FW"];
  var PlayersLogger = typeof window !== "undefined" && window.FootLab && window.FootLab.Logger ? window.FootLab.Logger : typeof window !== "undefined" && window.Elifoot && window.Elifoot.Logger ? window.Elifoot.Logger : console;
  function computeTeamSkillCap(club, allDivisions2) {
    try {
      const div = club && club.division ? club.division : 4;
      const divisionClubs = Array.isArray(allDivisions2) && allDivisions2[div - 1] ? allDivisions2[div - 1] : [];
      const size = Math.max(2, divisionClubs.length);
      const rankIndex = divisionClubs.findIndex((c) => c === club);
      const posIndex = rankIndex >= 0 ? rankIndex : size - 1;
      const divConf = typeof GameConstants !== "undefined" && GameConstants.DIVISION_SKILL_CAPS || {
        1: { base: 95, min: 75 },
        2: { base: 80, min: 60 },
        3: { base: 65, min: 45 },
        4: { base: 50, min: 25 }
      };
      const conf = divConf[div] || divConf[4];
      const ratio = size > 1 ? posIndex / (size - 1) : 0;
      const cap = Math.round(conf.base - ratio * (conf.base - conf.min));
      return Math.max(0, Math.min(100, cap));
    } catch (err) {
      return 50;
    }
  }
  function applySkillCaps2(allDivisions2) {
    if (!Array.isArray(allDivisions2)) return;
    allDivisions2.forEach((divisionClubs, idx) => {
      if (!Array.isArray(divisionClubs)) return;
      divisionClubs.forEach((club) => {
        try {
          const cap = computeTeamSkillCap(club, allDivisions2);
          if (club && club.team && Array.isArray(club.team.players)) {
            club.team.players.forEach((p) => {
              if (!p) return;
              const old = typeof p.skill === "number" ? p.skill : 0;
              if (old > cap) {
                p.skill = Math.max(0, cap - Math.floor(Math.random() * 3));
              } else {
                p.skill = Math.max(
                  0,
                  Math.min(cap, Math.round(old || Math.random() * Math.min(30, cap)))
                );
              }
            });
          }
        } catch (err) {
        }
      });
    });
  }
  try {
    if (typeof window !== "undefined") {
      window.computeTeamSkillCap = computeTeamSkillCap;
      window.applySkillCaps = applySkillCaps2;
      window.assignRandomShortContracts = assignRandomShortContracts2;
      window.computeMinContractFromSkill = computeMinContractFromSkill;
      window.generateFreeAgents = generateFreeAgents;
      window.selectPlayersForRelease = selectPlayersForRelease2;
      window.selectExpiringPlayersToLeave = selectExpiringPlayersToLeave2;
      window.processPendingReleases = processPendingReleases;
      window.computePlayerMarketValue = computePlayerMarketValue2;
      window.seasonalSkillDrift = seasonalSkillDrift2;
      window.FootLab = window.FootLab || {};
      window.FootLab.Players = {
        computeTeamSkillCap,
        applySkillCaps: applySkillCaps2,
        assignRandomShortContracts: assignRandomShortContracts2,
        computeMinContractFromSkill,
        generateFreeAgents,
        selectPlayersForRelease: selectPlayersForRelease2,
        selectExpiringPlayersToLeave: selectExpiringPlayersToLeave2,
        processPendingReleases,
        computePlayerMarketValue: computePlayerMarketValue2,
        seasonalSkillDrift: seasonalSkillDrift2
      };
    }
  } catch (e2) {
  }
  function assignRandomShortContracts2(allDivisions2, options) {
    options = options || {};
    const pctOneYear = typeof options.pctOneYear === "number" ? options.pctOneYear : typeof GameConstants !== "undefined" && GameConstants.CONTRACT_CONFIG && GameConstants.CONTRACT_CONFIG.pctOneYear || 0.35;
    if (!Array.isArray(allDivisions2)) return;
    allDivisions2.forEach((div) => {
      if (!Array.isArray(div)) return;
      div.forEach((club) => {
        if (!club || !club.team || !Array.isArray(club.team.players)) return;
        club.team.players.forEach((p) => {
          if (!p) return;
          if (typeof p.contractYears !== "undefined" || typeof p.contractYearsLeft !== "undefined")
            return;
          const one = Math.random() < pctOneYear;
          p.contractYears = one ? 1 : 0;
          p.contractYearsLeft = p.contractYears;
        });
      });
    });
    return true;
  }
  function computeMinContractFromSkill(skill) {
    const sk = Math.max(0, Math.min(100, Number(skill || 40)));
    const minSalary = typeof GameConstants !== "undefined" && GameConstants.CONTRACT_CONFIG && GameConstants.CONTRACT_CONFIG.minSalary || 300;
    const multiplier = typeof GameConstants !== "undefined" && GameConstants.CONTRACT_CONFIG && GameConstants.CONTRACT_CONFIG.salaryMultiplier || 25;
    return Math.max(minSalary, Math.round(sk * multiplier));
  }
  function generateFreeAgents(allDivisions2, options) {
    options = options || {};
    const perPlayerProb = typeof options.probability === "number" ? options.probability : typeof GameConstants !== "undefined" && GameConstants.TRANSFER_MARKET && GameConstants.TRANSFER_MARKET.freeAgentProb || 0.06;
    const maxPerClub = typeof options.maxPerClub === "number" ? options.maxPerClub : typeof GameConstants !== "undefined" && GameConstants.TRANSFER_MARKET && GameConstants.TRANSFER_MARKET.maxFreeAgentsPerClub || 2;
    window.FREE_TRANSFERS = window.FREE_TRANSFERS || [];
    if (!Array.isArray(allDivisions2)) return window.FREE_TRANSFERS;
    allDivisions2.forEach((div) => {
      if (!Array.isArray(div)) return;
      div.forEach((club) => {
        if (!club || !club.team || !Array.isArray(club.team.players)) return;
        const players = club.team.players.slice();
        let removed = 0;
        for (let i = players.length - 1; i >= 0; i--) {
          const p = players[i];
          if (!p) continue;
          if (removed >= maxPerClub) break;
          if (Math.random() < perPlayerProb) {
            const idx = club.team.players.findIndex((x) => x === p || x && p && x.id === p.id);
            if (idx >= 0) club.team.players.splice(idx, 1);
            p.previousSalary = Number(p.salary || 0);
            p.contractYears = 0;
            p.contractYearsLeft = 0;
            p.previousClubName = club.team && club.team.name || club.name || "";
            p.minContract = Math.max(0, Math.round(p.previousSalary * 0.9));
            try {
              p.playerValue = computePlayerMarketValue2(p, club && club.division ? club.division : 4);
            } catch (e2) {
              p.playerValue = 0;
            }
            p.leavingFee = Math.max(0, Math.round((p.playerValue || 0) * 0.8));
            try {
              delete p.club;
            } catch (e2) {
            }
            window.FREE_TRANSFERS.push(p);
            removed++;
          }
        }
      });
    });
    return window.FREE_TRANSFERS;
  }
  function selectPlayersForRelease2(allDivisions2, options) {
    options = options || {};
    const perPlayerProb = typeof options.probability === "number" ? options.probability : typeof GameConstants !== "undefined" && GameConstants.TRANSFER_MARKET && GameConstants.TRANSFER_MARKET.pendingReleaseProb || 0.02;
    const maxPerClub = typeof options.maxPerClub === "number" ? options.maxPerClub : typeof GameConstants !== "undefined" && GameConstants.TRANSFER_MARKET && GameConstants.TRANSFER_MARKET.maxPendingPerClub || 1;
    window.PENDING_RELEASES = window.PENDING_RELEASES || [];
    if (!Array.isArray(allDivisions2)) return window.PENDING_RELEASES;
    allDivisions2.forEach((div) => {
      if (!Array.isArray(div)) return;
      div.forEach((club) => {
        if (!club || !club.team || !Array.isArray(club.team.players)) return;
        let removed = 0;
        for (let i = club.team.players.length - 1; i >= 0; i--) {
          if (removed >= maxPerClub) break;
          const p = club.team.players[i];
          if (!p) continue;
          if (Math.random() < perPlayerProb) {
            const clone = Object.assign({}, p);
            clone.previousSalary = Number(p.salary || 0);
            clone.minContract = Math.max(0, Math.round(clone.previousSalary * 0.9));
            try {
              clone.playerValue = computePlayerMarketValue2(
                clone,
                club && club.division ? club.division : 4
              );
            } catch (e2) {
              clone.playerValue = 0;
            }
            clone.leavingFee = Math.max(0, Math.round((clone.playerValue || 0) * 0.8));
            clone.previousClubName = club.team && club.team.name || club.name || "";
            clone.originalClubRef = club;
            window.PENDING_RELEASES.push(clone);
            removed++;
          }
        }
      });
    });
    return window.PENDING_RELEASES;
  }
  function selectExpiringPlayersToLeave2(allDivisions2, options) {
    options = options || {};
    const prob = typeof options.probability === "number" ? options.probability : typeof GameConstants !== "undefined" && GameConstants.TRANSFER_MARKET && GameConstants.TRANSFER_MARKET.expiringLeaveProb || 0.35;
    const maxPerClub = typeof options.maxPerClub === "number" ? options.maxPerClub : typeof GameConstants !== "undefined" && GameConstants.TRANSFER_MARKET && GameConstants.TRANSFER_MARKET.maxExpiringPerClub || 2;
    window.PENDING_RELEASES = window.PENDING_RELEASES || [];
    if (!Array.isArray(allDivisions2)) return window.PENDING_RELEASES;
    allDivisions2.forEach((div) => {
      if (!Array.isArray(div)) return;
      div.forEach((club) => {
        if (!club || !club.team || !Array.isArray(club.team.players)) return;
        let marked = 0;
        for (let i = 0; i < club.team.players.length && marked < maxPerClub; i++) {
          const p = club.team.players[i];
          if (!p) continue;
          const contractLeft = typeof p.contractYearsLeft !== "undefined" ? Number(p.contractYearsLeft) : typeof p.contractYears !== "undefined" ? Number(p.contractYears) : 0;
          if (contractLeft !== 0) continue;
          const already = (window.PENDING_RELEASES || []).find(
            (x) => x.id && p.id && x.id === p.id || x.name && x.name === p.name
          );
          if (already) continue;
          if (Math.random() < prob) {
            const clone = Object.assign({}, p);
            clone.previousSalary = Number(p.salary || 0);
            clone.minContract = Math.max(0, Math.round(clone.previousSalary * 0.9));
            try {
              clone.playerValue = computePlayerMarketValue2(
                clone,
                club && club.division ? club.division : 4
              );
            } catch (e2) {
              clone.playerValue = 0;
            }
            clone.leavingFee = Math.max(0, Math.round((clone.playerValue || 0) * 0.8));
            clone.previousClubName = club.team && club.team.name || club.name || "";
            clone.originalClubRef = club;
            window.PENDING_RELEASES.push(clone);
            marked++;
          }
        }
      });
    });
    return window.PENDING_RELEASES;
  }
  function processPendingReleases() {
    window.PENDING_RELEASES = window.PENDING_RELEASES || [];
    window.FREE_TRANSFERS = window.FREE_TRANSFERS || [];
    const cfg = typeof window !== "undefined" && window.GameConfig && window.GameConfig.transfer || {};
    const autoProcess = cfg && cfg.autoProcessPendingReleases === true;
    while (window.PENDING_RELEASES.length) {
      const p = window.PENDING_RELEASES.shift();
      if (autoProcess && Array.isArray(window.allClubs) && window.allClubs.length) {
        try {
          const clubs = window.allClubs.slice();
          for (let i = clubs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = clubs[i];
            clubs[i] = clubs[j];
            clubs[j] = tmp;
          }
          let purchased = false;
          for (let c of clubs) {
            if (!c || !c.team) continue;
            if (p.originalClubRef && (c === p.originalClubRef || c.team && p.originalClubRef.team && c.team === p.originalClubRef.team))
              continue;
            const fee = Number(p.leavingFee || 0);
            const buyerBudget = Number(c.budget || 0);
            const inferredMin = Math.max(1, Math.round(Number(p.previousSalary || 0) * 0.9));
            const minOfferFromPlayer = typeof p.minContract === "number" ? Number(p.minContract) : inferredMin;
            if (buyerBudget < fee + minOfferFromPlayer) continue;
            let realPlayer = null;
            if (p.originalClubRef && p.originalClubRef.team && Array.isArray(p.originalClubRef.team.players)) {
              realPlayer = p.originalClubRef.team.players.find(
                (pp) => pp && pp.id && p.id && pp.id === p.id || pp && pp.name === p.name
              );
            }
            const baseOffer = Math.max(1, Math.round(Number(p.previousSalary || 500) * 1.05));
            const offerSalary = Math.max(baseOffer, minOfferFromPlayer);
            let negotiation = null;
            let prob;
            try {
              if (window.Finance && typeof window.Finance.negotiatePlayerContract === "function") {
                negotiation = window.Finance.negotiatePlayerContract(
                  c,
                  realPlayer || p.id || p.name,
                  offerSalary,
                  1
                );
              } else {
                const baseMultiplier = cfg && cfg.debugPurchases === true ? 0.25 : 0.02;
                let buyerAvgSkill = 50;
                try {
                  if (c && c.team && Array.isArray(c.team.players) && c.team.players.length) {
                    const sum = c.team.players.reduce(
                      (acc, pp) => acc + (Number(pp && pp.skill) || 0),
                      0
                    );
                    buyerAvgSkill = Math.round(sum / c.team.players.length) || 50;
                  }
                } catch (e2) {
                  buyerAvgSkill = 50;
                }
                const skillDelta = Math.max(0, Number(p.skill || 0) - Number(buyerAvgSkill || 0));
                const desirability = Math.min(3, skillDelta / 10);
                prob = Math.max(
                  0.05,
                  Math.min(
                    0.95,
                    buyerBudget / Math.max(1, fee) * baseMultiplier * (1 + desirability)
                  )
                );
                if (buyerBudget < fee + offerSalary) {
                  negotiation = { accepted: false };
                } else {
                  negotiation = { accepted: Math.random() < prob };
                }
                if (cfg && cfg.debugPurchases === true && PlayersLogger && typeof PlayersLogger.debug === "function") {
                  try {
                    PlayersLogger.debug("Auto-buy attempt:", {
                      buyer: c && c.team && c.team.name || c.name,
                      fee,
                      offerSalary,
                      prob,
                      skillDelta
                    });
                  } catch (e2) {
                  }
                }
              }
            } catch (e2) {
              negotiation = { accepted: false };
            }
            try {
              const buyerName = c && c.team && c.team.name || c.name || "unknown";
              const acceptProb = negotiation && typeof negotiation.acceptProb !== "undefined" ? negotiation.acceptProb : typeof prob !== "undefined" ? prob : null;
              if (cfg && cfg.debugPurchases === true && PlayersLogger && typeof PlayersLogger.debug === "function") {
                try {
                  PlayersLogger.debug("Negotiation attempt", {
                    buyer: buyerName,
                    player: p && (p.name || p.id),
                    fee: Number(p.leavingFee || 0),
                    acceptProb,
                    roll: negotiation && negotiation.roll
                  });
                } catch (e2) {
                }
              }
            } catch (e2) {
            }
            if (negotiation && negotiation.accepted) {
              if (cfg && cfg.debugPurchases === true && PlayersLogger && typeof PlayersLogger.debug === "function") {
                try {
                  PlayersLogger.debug("Negotiation result: ACCEPTED", {
                    buyer: c && c.team && c.team.name || c.name,
                    player: p && (p.name || p.id)
                  });
                } catch (e2) {
                }
              }
              try {
                const expectedMin = typeof p.minContract === "number" ? Number(p.minContract) : inferredMin;
                if (offerSalary < expectedMin) {
                  if (cfg && cfg.debugPurchases === true && PlayersLogger && typeof PlayersLogger.debug === "function") {
                    try {
                      PlayersLogger.debug(
                        "Negotiation accepted but offer below minContract \u2014 rejecting",
                        {
                          player: p && (p.name || p.id),
                          offerSalary,
                          expectedMin
                        }
                      );
                    } catch (e2) {
                    }
                  }
                  negotiation.accepted = false;
                }
              } catch (e2) {
              }
              try {
                c.budget = Math.max(0, Number(c.budget || 0) - fee);
                if (p.originalClubRef)
                  p.originalClubRef.budget = Number(p.originalClubRef.budget || 0) + fee;
                if (realPlayer && p.originalClubRef && p.originalClubRef.team && Array.isArray(p.originalClubRef.team.players)) {
                  const ridx = p.originalClubRef.team.players.findIndex(
                    (pp) => pp === realPlayer || pp && p.id && pp.id === p.id || pp && pp.name === p.name
                  );
                  if (ridx >= 0) p.originalClubRef.team.players.splice(ridx, 1);
                }
                const playerToAdd = realPlayer || Object.assign({}, p);
                playerToAdd.salary = offerSalary;
                playerToAdd.contractYears = 1;
                playerToAdd.contractYearsLeft = 1;
                c.team.players = c.team.players || [];
                c.team.players.push(playerToAdd);
                try {
                  window.TRANSFER_HISTORY = window.TRANSFER_HISTORY || [];
                  window.TRANSFER_HISTORY.push({
                    player: playerToAdd.name || playerToAdd.id,
                    from: p.originalClubRef && (p.originalClubRef.team ? p.originalClubRef.team.name : p.originalClubRef.name) || p.previousClubName || "",
                    to: c && c.team && c.team.name || c.name || "",
                    fee,
                    salary: offerSalary,
                    type: "purchase",
                    time: Date.now(),
                    jornada: typeof window.currentJornada !== "undefined" ? window.currentJornada : null
                  });
                } catch (e2) {
                }
                if (PlayersLogger && typeof PlayersLogger.debug === "function") {
                  try {
                    PlayersLogger.debug("Auto-purchase:", {
                      player: playerToAdd && (playerToAdd.name || playerToAdd.id),
                      buyer: c.team && c.team.name || c.name,
                      fee
                    });
                  } catch (e2) {
                  }
                }
                purchased = true;
              } catch (e2) {
              }
            }
            if (purchased) break;
          }
          if (purchased) continue;
        } catch (e2) {
        }
      }
      p.contractYears = 0;
      p.contractYearsLeft = 0;
      p.minContract = Math.max(0, Math.round((p.previousSalary || 0) * 0.9));
      p.playerValue = p.playerValue || computePlayerMarketValue2(
        p,
        p.originalClubRef && p.originalClubRef.division ? p.originalClubRef.division : 4
      );
      p.leavingFee = Math.max(0, Math.round((p.playerValue || 0) * 0.8));
      try {
        window.TRANSFER_HISTORY = window.TRANSFER_HISTORY || [];
        window.TRANSFER_HISTORY.push({
          player: p.name || p.id,
          from: p.originalClubRef && (p.originalClubRef.team ? p.originalClubRef.team.name : p.originalClubRef.name) || p.previousClubName || "",
          to: "FREE",
          fee: 0,
          salary: p.minContract || 0,
          type: "free",
          time: Date.now(),
          jornada: typeof window.currentJornada !== "undefined" ? window.currentJornada : null
        });
      } catch (e2) {
      }
      try {
        delete p.originalClubRef;
      } catch (e2) {
      }
      window.FREE_TRANSFERS.push(p);
      if (PlayersLogger && typeof PlayersLogger.debug === "function") {
        try {
          PlayersLogger.debug("Moved to FREE_TRANSFERS:", {
            player: p && (p.name || p.id),
            minContract: p.minContract,
            leavingFee: p.leavingFee
          });
        } catch (e2) {
        }
      }
    }
    return window.FREE_TRANSFERS;
  }
  function computePlayerMarketValue2(playerOrSkill, division) {
    const skill = playerOrSkill && typeof playerOrSkill.skill === "number" ? playerOrSkill.skill : Number(playerOrSkill || 40);
    const div = Number(division || 4);
    const divFactor = div === 1 ? 1.6 : div === 2 ? 1.25 : div === 3 ? 0.9 : 0.6;
    const base = typeof GameConstants !== "undefined" && GameConstants.TRANSFER_MARKET && GameConstants.TRANSFER_MARKET.baseMarketValue || 5e3;
    const skillAdj = Math.round(skill * (typeof GameConstants !== "undefined" && GameConstants.TRANSFER_MARKET && GameConstants.TRANSFER_MARKET.skillValueMultiplier || 200));
    const raw = Math.round((base + skillAdj) * divFactor);
    return Math.max(0, raw);
  }
  if (typeof window !== "undefined") {
    window.selectPlayersForRelease = selectPlayersForRelease2;
    window.processPendingReleases = processPendingReleases;
    window.computePlayerMarketValue = computePlayerMarketValue2;
    window.selectExpiringPlayersToLeave = selectExpiringPlayersToLeave2;
  }
  if (typeof window !== "undefined") {
    window.generateFreeAgents = generateFreeAgents;
    window.computeMinContractFromSkill = computeMinContractFromSkill;
  }
  function markSomeContractsExpiring(allDivisions2, pctExpiring) {
    pctExpiring = typeof pctExpiring === "number" ? pctExpiring : typeof GameConstants !== "undefined" && GameConstants.CONTRACT_CONFIG && GameConstants.CONTRACT_CONFIG.pctExpiring || 0.12;
    if (!Array.isArray(allDivisions2)) return 0;
    let marked = 0;
    allDivisions2.forEach((div) => {
      if (!Array.isArray(div)) return;
      div.forEach((club) => {
        if (!club || !club.team || !Array.isArray(club.team.players)) return;
        club.team.players.forEach((p) => {
          if (!p) return;
          const hasContract = typeof p.contractYears !== "undefined" ? p.contractYears > 0 : typeof p.contractYearsLeft !== "undefined" ? p.contractYearsLeft > 0 : false;
          if (!hasContract) return;
          if (Math.random() < pctExpiring) {
            p.contractYearsLeft = 0;
            marked++;
          }
        });
      });
    });
    return marked;
  }
  if (typeof window !== "undefined") {
    window.markSomeContractsExpiring = markSomeContractsExpiring;
  }
  function seasonalSkillDrift2(allDivisions2) {
    if (!Array.isArray(allDivisions2)) return;
    const divisionFactor = typeof GameConstants !== "undefined" && GameConstants.SEASONAL_DRIFT_FACTORS || [0.6, 0.4, 0.28, 0.18];
    allDivisions2.forEach((divisionClubs, divIdx) => {
      if (!Array.isArray(divisionClubs) || divisionClubs.length === 0) return;
      const sorted = [...divisionClubs].sort((a, b) => {
        const pa = a.points || 0;
        const pb = b.points || 0;
        if (pb !== pa) return pb - pa;
        const ad = (a.goalsFor || 0) - (a.goalsAgainst || 0);
        const bd = (b.goalsFor || 0) - (b.goalsAgainst || 0);
        return bd - ad;
      });
      const size = Math.max(2, sorted.length);
      const factor = divisionFactor[divIdx] || 0.2;
      sorted.forEach((club, idx) => {
        try {
          const percentile = 1 - idx / (size - 1);
          const center = percentile - 0.5;
          const raw = center * factor;
          let delta = 0;
          if (raw >= 0.45) delta = 2;
          else if (raw >= 0.12) delta = 1;
          else if (raw <= -0.45) delta = -2;
          else if (raw <= -0.12) delta = -1;
          else delta = 0;
          if (club && club.team && Array.isArray(club.team.players)) {
            club.team.players.forEach((p) => {
              if (!p || typeof p.skill !== "number") return;
              const pos = String(p.position || "").toUpperCase();
              const posFactor = pos === "GK" ? 0.6 : 1;
              const adj = Math.round(delta * posFactor);
              if (adj === 0) return;
              p.skill = Math.max(0, Math.min(100, p.skill + adj));
            });
          }
        } catch (err) {
        }
      });
    });
  }
  try {
    if (typeof window !== "undefined") {
      window.FootLab = window.FootLab || window.Elifoot || {};
      window.FootLab.computeTeamSkillCap = window.FootLab.computeTeamSkillCap || computeTeamSkillCap;
      window.FootLab.applySkillCaps = window.FootLab.applySkillCaps || applySkillCaps2;
      window.FootLab.assignRandomShortContracts = window.FootLab.assignRandomShortContracts || assignRandomShortContracts2;
      window.FootLab.generateFreeAgents = window.FootLab.generateFreeAgents || generateFreeAgents;
      window.FootLab.selectPlayersForRelease = window.FootLab.selectPlayersForRelease || selectPlayersForRelease2;
      window.FootLab.seasonalSkillDrift = window.FootLab.seasonalSkillDrift || seasonalSkillDrift2;
      window.Elifoot = window.Elifoot || window.FootLab;
    }
  } catch (e2) {
  }

  // src/clubs.js
  function _getLogger() {
    try {
      if (typeof window !== "undefined" && window.FootLab && window.FootLab.Logger)
        return window.FootLab.Logger;
      if (typeof window !== "undefined" && window.Elifoot && window.Elifoot.Logger)
        return window.Elifoot.Logger;
    } catch (e2) {
    }
    try {
      if (typeof __require === "function") return require_logger();
    } catch (e2) {
    }
    return console;
  }
  var divisionBudgets = [2e6, 15e5, 1e6, 5e5];
  function createClub(team, division) {
    return {
      team,
      division,
      // 1 = top, 4 = bottom
      budget: divisionBudgets[division - 1] || 5e5,
      revenue: 0,
      expenses: 0,
      points: 0,
      gamesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      coach: null
    };
  }
  function generateDivisionClubs(divisionNumber) {
    const clubs = [];
    const divisionData = divisionsData[divisionNumber - 1];
    if (!divisionData || !divisionData.teams) {
      const _logger = _getLogger();
      _logger.error(`Divis\xE3o ${divisionNumber} n\xE3o encontrada em teams.js.`);
      return clubs;
    }
    const normalize = (s) => String(s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const rosterKeyMap = {};
    try {
      if (window.REAL_ROSTERS)
        Object.keys(window.REAL_ROSTERS).forEach((k) => {
          try {
            rosterKeyMap[normalize(k)] = k;
          } catch (__) {
            rosterKeyMap[String(k).toLowerCase()] = k;
          }
        });
    } catch (e2) {
    }
    let teamId = 1;
    divisionData.teams.forEach((teamData) => {
      const tnorm = normalize(teamData.name);
      let key = rosterKeyMap[tnorm] || null;
      if (!key) {
        const candidates = Object.keys(rosterKeyMap || {});
        key = candidates.find((nk) => nk === tnorm || nk.includes(tnorm) || tnorm.includes(nk));
        if (key) key = rosterKeyMap[key];
      }
      if (!key) {
        key = Object.keys(window.REAL_ROSTERS || {}).find((k) => {
          if (!k) return false;
          const kn = String(k || "").toLowerCase();
          const tn = String(teamData.name || "").toLowerCase();
          return kn === tn || kn.includes(tn) || tn.includes(kn);
        }) || null;
      }
      const roster = key ? window.REAL_ROSTERS && window.REAL_ROSTERS[key] : null;
      if (!Array.isArray(roster) || roster.length === 0) {
        const _logger = _getLogger();
        const msg = `Missing roster for team "${teamData.name}" (division ${divisionNumber}).`;
        try {
          console.error("TEMP_DEBUG: missing roster", {
            team: teamData.name,
            division: divisionNumber,
            rosterKeys: Object.keys(window.REAL_ROSTERS || {}).slice(0, 12),
            rosterCount: Object.keys(window.REAL_ROSTERS || {}).length || 0
          });
        } catch (e2) {
          try {
            _logger && _logger.error && _logger.error("TEMP_DEBUG console error failed", e2);
          } catch (_) {
          }
        }
        _logger.error && _logger.error(msg);
        throw new Error(msg);
      }
      const players = roster.map((r, idx) => ({
        id: teamId * 1e3 + idx,
        name: r.name || `Player ${teamId * 1e3 + idx}`,
        position: r.position || "CM",
        skill: typeof r.skill === "number" ? r.skill : 60,
        salary: typeof r.salary === "number" ? r.salary : Math.round(
          (divisionNumber === 1 ? 8e3 : divisionNumber === 2 ? 3e3 : divisionNumber === 3 ? 1e3 : 500) * 0.6
        ),
        contractYears: typeof r.contractYears === "number" ? r.contractYears : 1,
        goals: r.goals || 0
      }));
      let stadiumCapacity, members, ticketPrice;
      if (divisionNumber === 1) {
        stadiumCapacity = 3e4 + Math.floor(Math.random() * 4e4);
        members = 25e3 + Math.floor(Math.random() * 5e4);
        ticketPrice = 30 + Math.floor(Math.random() * 20);
      } else if (divisionNumber === 2) {
        stadiumCapacity = 15e3 + Math.floor(Math.random() * 3e4);
        members = 15e3 + Math.floor(Math.random() * 15e3);
        ticketPrice = 25 + Math.floor(Math.random() * 10);
      } else if (divisionNumber === 3) {
        stadiumCapacity = 1e4 + Math.floor(Math.random() * 1e4);
        members = 5e3 + Math.floor(Math.random() * 1e4);
        ticketPrice = 18 + Math.floor(Math.random() * 7);
      } else {
        stadiumCapacity = 4e3 + Math.floor(Math.random() * 6e3);
        members = 1e3 + Math.floor(Math.random() * 4e3);
        ticketPrice = 12 + Math.floor(Math.random() * 5);
      }
      const totalSalary = players.reduce((acc, p) => acc + (p.salary || 0), 0);
      const team = {
        id: teamId,
        name: teamData.name,
        color: teamData.color,
        bgColor: teamData.bgColor,
        players,
        tactic: "4-4-2",
        stadiumCapacity,
        members,
        ticketPrice,
        totalSalaryCost: totalSalary,
        currentLeaguePosition: 0,
        leaguePoints: 0
      };
      const club = createClub(team, divisionNumber);
      club.expenses = Math.max(0, Number(totalSalary));
      club.coach = window.REAL_COACHES && window.REAL_COACHES[team.name] || null;
      window.ALL_CLUBS = window.ALL_CLUBS || [];
      window.ALL_CLUBS.push(club);
      teamId++;
      clubs.push(club);
    });
    return clubs;
  }
  function validateAllRosters(minPlayers = 18) {
    const normalize = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const rosterMap = {};
    try {
      if (window.REAL_ROSTERS)
        Object.keys(window.REAL_ROSTERS).forEach((k) => rosterMap[normalize(k)] = k);
    } catch (e2) {
    }
    const missing = [];
    divisionsData.forEach((div, divIndex) => {
      div.teams.forEach((teamData) => {
        const tnorm = normalize(teamData.name);
        let key = rosterMap[tnorm] || null;
        if (!key) {
          key = Object.keys(window.REAL_ROSTERS || {}).find((k) => {
            if (!k) return false;
            const kn = normalize(k);
            return kn === tnorm || kn.includes(tnorm) || tnorm.includes(kn);
          }) || null;
        }
        const roster = key ? window.REAL_ROSTERS && window.REAL_ROSTERS[key] : null;
        const count = Array.isArray(roster) ? roster.length : 0;
        if (!Array.isArray(roster) || count < minPlayers) {
          missing.push({
            division: divIndex + 1,
            team: teamData.name,
            rosterKey: key,
            players: count
          });
        }
      });
    });
    if (missing.length) {
      const lines = missing.map(
        (m) => `Div${m.division} ${m.team} -> rosterKey=${m.rosterKey || "MISSING"} players=${m.players}`
      );
      const msg = `Roster validation failed: ${missing.length} teams missing or under ${minPlayers} players:
` + lines.join("\n");
      const lg = _getLogger();
      try {
        lg.error && lg.error(msg);
      } catch (e2) {
        try {
          console && console.error && console.error(msg);
        } catch (_) {
        }
      }
      throw new Error(msg);
    }
  }
  function generateAllClubs() {
    const allClubs2 = [];
    validateAllRosters(18);
    for (let i = 1; i <= 4; i++) {
      const divisionClubs = generateDivisionClubs(i);
      allClubs2.push(...divisionClubs);
    }
    return allClubs2;
  }
  try {
    if (typeof window !== "undefined") {
      window.FootLab = window.FootLab || window.Elifoot || {};
      window.FootLab.generateAllClubs = window.FootLab.generateAllClubs || generateAllClubs;
      window.FootLab.generateDivisionClubs = window.FootLab.generateDivisionClubs || generateDivisionClubs;
      window.Elifoot = window.Elifoot || window.FootLab;
    }
  } catch (e2) {
  }

  // src/entry.mjs
  var import_teams = __toESM(require_teams(), 1);

  // src/matches.js
  var SIM_CONFIG = {
    baseGoalChance: 0.015,
    homeAdvantageFactor: 1.15,
    skillExponentialBase: 1.01,
    maxGoalsPerMinute: 2,
    staminaLossPerMinute: 2e-3,
    // Perda de ~18% de eficácia até ao fim do jogo
    events: {
      yellowChance: 0.02,
      redChance: 1e-3,
      suspensionYellows: 1,
      suspensionRed: 2
    }
  };
  function getLogger() {
    return typeof window !== "undefined" && window.FootLab && window.FootLab.Logger ? window.FootLab.Logger : typeof window !== "undefined" && window.Elifoot && window.Elifoot.Logger ? window.Elifoot.Logger : console;
  }
  function generateRounds2(clubs) {
    const rounds = [];
    if (!Array.isArray(clubs) || clubs.length === 0) return rounds;
    const teams = clubs.slice();
    if (teams.length % 2 !== 0) {
      teams.push({
        team: { name: "BYE", players: [], color: "#666", bgColor: "#333" },
        division: clubs[0].division,
        budget: 0,
        revenue: 0,
        expenses: 0,
        points: 0,
        gamesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0
      });
    }
    const n = teams.length;
    const teamList = teams.slice();
    for (let round = 0; round < n - 1; round++) {
      const matchesThisRound = [];
      for (let i = 0; i < n / 2; i++) {
        const homeClub = teamList[i];
        const awayClub = teamList[n - 1 - i];
        if (!homeClub || !awayClub) continue;
        const homeIsBye = homeClub.team && homeClub.team.name === "BYE";
        const awayIsBye = awayClub.team && awayClub.team.name === "BYE";
        if (homeIsBye || awayIsBye) continue;
        const match = {
          homeClub,
          awayClub,
          home: homeClub.team,
          away: awayClub.team,
          homeGoals: 0,
          awayGoals: 0,
          goals: [],
          isFinished: false,
          division: homeClub.division
        };
        matchesThisRound.push(match);
      }
      rounds.push(matchesThisRound);
      const last = teamList.pop();
      teamList.splice(1, 0, last);
    }
    const returnLegs = rounds.map((round) => {
      return round.map((m) => ({
        homeClub: m.awayClub,
        awayClub: m.homeClub,
        home: m.away,
        away: m.home,
        homeGoals: 0,
        awayGoals: 0,
        goals: [],
        isFinished: false,
        division: m.division
      }));
    });
    return rounds.concat(returnLegs);
  }
  function advanceMatchDay(matches, minute) {
    const updates = [];
    if (!Array.isArray(matches)) return updates;
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      if (!match || match.isFinished) continue;
      match.goals = Array.isArray(match.goals) ? match.goals : [];
      const staminaFactor = 1 - minute * SIM_CONFIG.staminaLossPerMinute;
      if (minute === 1 || !match._homeSkill || match._needsSkillUpdate) {
        const hp = match.homePlayers || match.home && match.home.players || [];
        const ap = match.awayPlayers || match.away && match.away.players || [];
        match._homeSkill = hp.reduce((sum, p) => sum + (p.skill || 0), 0) / Math.max(1, hp.length) * staminaFactor;
        match._awaySkill = ap.reduce((sum, p) => sum + (p.skill || 0), 0) / Math.max(1, ap.length) * staminaFactor;
        match._needsSkillUpdate = false;
      }
      const homePlayers = match.homePlayers && Array.isArray(match.homePlayers) ? match.homePlayers : match.home && match.home.players;
      const awayPlayers = match.awayPlayers && Array.isArray(match.awayPlayers) ? match.awayPlayers : match.away && match.away.players;
      if (!homePlayers || !awayPlayers || !Array.isArray(homePlayers) || !Array.isArray(awayPlayers)) {
        try {
          const L = getLogger();
          L.error && L.error("Equipa sem jogadores ou formato inv\xE1lido:", match);
        } catch (_) {
        }
        continue;
      }
      const homeSkill = match._homeSkill;
      const awaySkill = match._awaySkill;
      const skillDiff = homeSkill - awaySkill;
      const skillMultiplier = Math.pow(SIM_CONFIG.skillExponentialBase, skillDiff);
      const homeChanceFactor = skillMultiplier;
      const awayChanceFactor = 1 / skillMultiplier;
      const homeGoalChance = SIM_CONFIG.baseGoalChance * homeChanceFactor * SIM_CONFIG.homeAdvantageFactor;
      const homeDraw = Math.random();
      if (window.DEBUG_MATCH_SIM && minute <= 10) {
        try {
          const L = getLogger();
          L.debug && L.debug("DBG goal-check home", {
            matchIdx: i,
            minute,
            homePlayers: homePlayers.length,
            awayPlayers: awayPlayers.length,
            homeSkill: homeSkill.toFixed(2),
            awaySkill: awaySkill.toFixed(2),
            homeGoalChance: homeGoalChance.toFixed(6),
            homeDraw: homeDraw.toFixed(6)
          });
        } catch (e2) {
        }
      }
      if (homeDraw < homeGoalChance) {
        const homeGoal = generateGoal(homePlayers, minute, "home");
        homeGoal.type = "goal";
        match.goals.push(homeGoal);
        try {
          const L = getLogger();
          L.info && L.info("advanceMatchDay: HOME GOAL ->", homeGoal.player, "min", minute, "matchIdx", i);
        } catch (e2) {
        }
        match.homeGoals = (match.homeGoals || 0) + 1;
        match.index = i;
        updates.push({ match });
      }
      const goalsAfterHome = match.goals ? match.goals.filter((g) => g.minute === minute).length : 0;
      if ((goalsAfterHome || 0) < SIM_CONFIG.maxGoalsPerMinute) {
        const awayGoalChanceBase = SIM_CONFIG.baseGoalChance * awayChanceFactor;
        const awayGoalChance = goalsAfterHome >= 1 ? awayGoalChanceBase * 0.06 : awayGoalChanceBase;
        const awayDraw = Math.random();
        if (window.DEBUG_MATCH_SIM && minute <= 10) {
          try {
            const L = getLogger();
            L.debug && L.debug("DBG goal-check away", {
              matchIdx: i,
              minute,
              awayGoalChance: awayGoalChance.toFixed(6),
              awayDraw: awayDraw.toFixed(6)
            });
          } catch (e2) {
          }
        }
        if (awayDraw < awayGoalChance) {
          const awayGoal = generateGoal(awayPlayers, minute, "away");
          awayGoal.type = "goal";
          match.goals.push(awayGoal);
          try {
            const L = getLogger();
            L.info && L.info(
              "advanceMatchDay: AWAY GOAL ->",
              awayGoal.player,
              "min",
              minute,
              "matchIdx",
              i
            );
          } catch (e2) {
          }
          match.awayGoals = (match.awayGoals || 0) + 1;
          match.index = i;
          updates.push({ match });
        }
      }
      try {
        const yellowChance = SIM_CONFIG.events.yellowChance;
        const redChance = SIM_CONFIG.events.redChance;
        const giveCard = function(teamPlayers, side) {
          if (!teamPlayers || !teamPlayers.length) return;
          if (Math.random() < yellowChance) {
            const p = teamPlayers[Math.floor(Math.random() * teamPlayers.length)];
            if (!p) return;
            p.yellowCards = (p.yellowCards || 0) + 1;
            match.goals.push({ minute, team: side, player: p.name, card: "yellow", type: "card" });
            if (p.yellowCards >= 2) {
              match.goals.push({
                minute,
                team: side,
                player: p.name,
                card: "red",
                reason: "double-yellow",
                type: "card"
              });
              const idx = teamPlayers.findIndex((x) => x === p);
              if (idx >= 0) teamPlayers.splice(idx, 1);
              const banGames = SIM_CONFIG.events.suspensionYellows;
              p.suspendedGames = Math.max(p.suspendedGames || 0, banGames);
              p.sentOff = true;
              match._needsSkillUpdate = true;
            }
          }
          if (Math.random() < redChance) {
            const p = teamPlayers[Math.floor(Math.random() * teamPlayers.length)];
            if (!p) return;
            match.goals.push({
              minute,
              team: side,
              player: p.name,
              card: "red",
              reason: "straight-red",
              type: "card"
            });
            const idx = teamPlayers.findIndex((x) => x === p);
            if (idx >= 0) teamPlayers.splice(idx, 1);
            const straightBan = SIM_CONFIG.events.suspensionRed;
            p.suspendedGames = Math.max(p.suspendedGames || 0, straightBan);
            p.sentOff = true;
            match._needsSkillUpdate = true;
          }
        };
        giveCard(homePlayers, "home");
        giveCard(awayPlayers, "away");
      } catch (err) {
        try {
          const L = getLogger();
          L.error && L.error("Erro ao simular cart\xF5es:", err);
        } catch (_) {
        }
      }
      if (minute >= 90) {
        match.isFinished = true;
      }
    }
    return updates;
  }
  try {
    if (typeof window !== "undefined") {
      window.generateRounds = generateRounds2;
      window.advanceMatchDay = advanceMatchDay;
      window.FootLab = window.FootLab || {};
      window.FootLab.Matches = {
        generateRounds: generateRounds2,
        advanceMatchDay
      };
    }
  } catch (e2) {
  }
  function generateGoal(team, minute, teamType) {
    let players = [];
    if (Array.isArray(team)) players = team;
    else if (team && Array.isArray(team.players)) players = team.players;
    const priorityGroups = [
      ["ST", "FW", "SS"],
      ["LW", "RW"],
      ["CM", "MF", "AM", "DM"]
    ];
    let scorer = null;
    for (const group of priorityGroups) {
      const candidates = players.filter((p) => p && p.position && group.includes(p.position));
      if (candidates && candidates.length) {
        scorer = candidates[Math.floor(Math.random() * candidates.length)];
        break;
      }
    }
    if (!scorer && players.length) {
      scorer = players[Math.floor(Math.random() * players.length)];
    }
    try {
      if (scorer && typeof scorer === "object") {
        scorer.goals = (scorer.goals || 0) + 1;
      }
    } catch (e2) {
    }
    return {
      minute,
      team: teamType,
      player: scorer && scorer.name ? scorer.name : "Jogador Desconhecido"
    };
  }

  // src/ui.js
  (function() {
    "use strict";
    function hexToRgb2(hex) {
      if (window.ColorUtils && typeof window.ColorUtils.hexToRgb === "function")
        return window.ColorUtils.hexToRgb(hex);
      if (!hex) return null;
      const h = String(hex).replace("#", "").trim();
      if (h.length === 3)
        return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
      if (h.length === 6)
        return [
          parseInt(h.substr(0, 2), 16),
          parseInt(h.substr(2, 2), 16),
          parseInt(h.substr(4, 2), 16)
        ];
      return null;
    }
    function luminance2(rgb) {
      if (window.ColorUtils && typeof window.ColorUtils.luminance === "function")
        return window.ColorUtils.luminance(rgb);
      if (!rgb) return 0;
      const s = rgb.map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
    }
    function adjustColor(hex, amt) {
      let c = String(hex).replace("#", "");
      if (c.length === 3)
        c = c.split("").map((x) => x + x).join("");
      let num = parseInt(c, 16);
      let r = Math.min(255, Math.max(0, (num >> 16 & 255) + amt));
      let g = Math.min(255, Math.max(0, (num >> 8 & 255) + amt));
      let b = Math.min(255, Math.max(0, (num & 255) + amt));
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
    function getReadableTextColor2(bgHex, preferredHex) {
      if (window.ColorUtils && typeof window.ColorUtils.getReadableTextColor === "function")
        return window.ColorUtils.getReadableTextColor(bgHex, preferredHex);
      return preferredHex || "#ffffff";
    }
    function updateDayProgress2(minute) {
      const progress = document.getElementById("dayProgress");
      if (progress) progress.style.width = `${minute / 90 * 100}%`;
    }
    function setIntroColors2(club) {
      if (window.Overlays && typeof window.Overlays.setIntroColors === "function")
        return window.Overlays.setIntroColors(club);
      const bg = club && club.team && club.team.bgColor || "#222";
      const fg = club && club.team && club.team.color || "#fff";
      const overlay = document.getElementById("intro-overlay");
      if (overlay) {
        overlay.style.setProperty("--intro-bg", bg);
        overlay.style.setProperty("--intro-fg", fg);
      }
      return { bg, fg };
    }
    function showIntroOverlay3(club, cb) {
      if (window.Overlays && typeof window.Overlays.showIntroOverlay === "function")
        return window.Overlays.showIntroOverlay(club, cb);
      const overlay = document.getElementById("intro-overlay");
      if (!overlay) {
        if (typeof cb === "function") cb();
        return;
      }
      overlay.style.display = "flex";
      overlay.style.opacity = "1";
      setTimeout(() => {
        overlay.style.opacity = "0";
        setTimeout(() => {
          overlay.style.display = "none";
          if (typeof cb === "function") cb();
        }, 300);
      }, 1200);
    }
    function showHalfTimeSubsOverlay3(club, match, cb) {
      const overlay = document.getElementById("subs-overlay");
      if (overlay && club && club.team) {
        const bg = club.team.bgColor || "#2e2e2e";
        const fg = club.team.color || "#ffffff";
        const rgb = hexToRgb2(bg);
        const lum = rgb ? luminance2(rgb) : 0;
        const panelBgAdjust = lum < 0.35 ? 20 : -25;
        const panelBg = adjustColor(bg, panelBgAdjust);
        overlay.style.setProperty("--subs-overlay-bg", `rgba(${rgb ? rgb.join(",") : "0,0,0"}, 0.8)`, "important");
        overlay.style.setProperty("--subs-panel-bg", panelBg, "important");
        overlay.style.setProperty("--subs-fg", fg, "important");
      }
      if (window.Overlays && typeof window.Overlays.showHalfTimeSubsOverlay === "function")
        return window.Overlays.showHalfTimeSubsOverlay(club, match, cb);
      if (!overlay) {
        if (typeof cb === "function") cb();
        return;
      }
      try {
        if (overlay.parentElement !== document.body) document.body.appendChild(overlay);
      } catch (e2) {
      }
      try {
        overlay.style.setProperty("position", "fixed", "important");
        overlay.style.setProperty("left", "0", "important");
        overlay.style.setProperty("top", "0", "important");
        overlay.style.setProperty("width", "100vw", "important");
        overlay.style.setProperty("height", "100vh", "important");
        overlay.style.setProperty("z-index", "2147483647", "important");
        overlay.style.setProperty("display", "flex", "important");
        overlay.style.setProperty("justify-content", "center", "important");
        overlay.style.setProperty("align-items", "center", "important");
        overlay.style.setProperty(
          "background",
          "var(--subs-overlay-bg, rgba(0,0,0,0.66))",
          "important"
        );
        if (!overlay.querySelector(".resume-btn")) {
          const btn = document.createElement("button");
          btn.className = "resume-btn";
          btn.textContent = "Retomar Simula\xE7\xE3o";
          btn.style.cssText = "position:absolute; bottom:40px; padding:12px 24px; cursor:pointer; background:#4CAF50; color:white; border:none; border-radius:4px; font-weight:bold;";
          btn.onclick = () => {
            overlay.style.setProperty("display", "none", "important");
            overlay.setAttribute("aria-hidden", "true");
            if (typeof cb === "function") cb();
          };
          overlay.appendChild(btn);
        }
      } catch (e2) {
      }
      overlay.setAttribute("aria-hidden", "false");
    }
    function initHubUI2() {
      if (window.Hub && typeof window.Hub.initHubUI === "function") return window.Hub.initHubUI();
    }
    function renderHubContent3(menuId) {
      if (window.Hub && typeof window.Hub.renderHubContent === "function")
        return window.Hub.renderHubContent(menuId);
    }
    function renderTeamRoster3(club) {
      if (window.Hub && typeof window.Hub.renderTeamRoster === "function")
        return window.Hub.renderTeamRoster(club);
    }
    function buildNextOpponentHtml2() {
      if (window.Hub && typeof window.Hub.buildNextOpponentHtml === "function")
        return window.Hub.buildNextOpponentHtml();
      return "<div>Sem informa\xE7\xE3o.</div>";
    }
    function renderAllDivisionsTables() {
      if (window.Hub && typeof window.Hub.renderAllDivisionsTables === "function")
        return window.Hub.renderAllDivisionsTables();
    }
    function renderLeagueTable() {
      if (window.Hub && typeof window.Hub.renderLeagueTable === "function")
        return window.Hub.renderLeagueTable();
    }
    function initTacticPanel2() {
      if (window.Tactics && typeof window.Tactics.initTacticPanel === "function")
        return window.Tactics.initTacticPanel();
    }
    function renderInitialMatchBoard3(allDivisions2) {
      if (window.MatchBoard && typeof window.MatchBoard.renderInitialMatchBoard === "function")
        return window.MatchBoard.renderInitialMatchBoard(allDivisions2);
    }
    function updateMatchBoardLine3(matchIndex, matchResult) {
      if (window.MatchBoard && typeof window.MatchBoard.updateMatchBoardLine === "function")
        return window.MatchBoard.updateMatchBoardLine(matchIndex, matchResult);
    }
    function startGame2(playerClub2) {
      window.scrollTo(0, 0);
      const screens = ["screen-setup", "screen-match", "screen-hub", "intro-screen"];
      screens.forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          el.style.setProperty("display", "none", "important");
          el.style.opacity = "0";
        }
      });
      const hubScreen = document.getElementById("screen-hub");
      if (hubScreen) {
        hubScreen.style.setProperty("display", "flex", "important");
        hubScreen.style.setProperty("flex-direction", "row", "important");
        hubScreen.style.opacity = "1";
        let styleEl = document.getElementById("hub-layout-adjustment");
        if (!styleEl) {
          styleEl = document.createElement("style");
          styleEl.id = "hub-layout-adjustment";
          document.head.appendChild(styleEl);
        }
        styleEl.textContent = `
        #screen-hub { 
          display: flex !important; 
          flex-direction: row !important; 
          height: 100vh !important; 
          overflow: hidden !important; 
          width: 100vw !important; 
          margin: 0 !important; 
          background: #1a1a1a;
        }
        
        /* \xC1rea Central (Jogadores) - Deve ocupar todo o espa\xE7o restante */
        #hub-main-content { 
          flex: 1 !important; 
          min-width: 0 !important; 
          overflow-y: auto !important; 
          padding: 20px !important; 
        }
        
        /* Barras Laterais - For\xE7ar largura fixa e verticalidade */
        .hub-sidebar, #tactics-panel, .tactics-column, .hub-sidebar-left, .hub-sidebar-right { 
          display: flex !important; 
          flex-direction: column !important; 
          gap: 10px !important; 
          padding: 10px !important; 
          background: rgba(0,0,0,0.5) !important;
          overflow-y: auto !important;
          box-sizing: border-box !important;
        }
        
        /* Sidebar Esquerda (Treinador, Menu) */
        .hub-sidebar { flex: 0 0 170px !important; width: 170px !important; border-right: 1px solid rgba(255,255,255,0.1) !important; }
        
        /* Sidebar Direita (T\xE1ticas, Finan\xE7as, Advers\xE1rio) */
        #tactics-panel, .tactics-column { flex: 0 0 210px !important; width: 210px !important; border-left: 1px solid rgba(255,255,255,0.1) !important; }

        /* FOR\xC7AR VERTICALIDADE: Bloquear qualquer tentativa de colocar elementos lado-a-lado nas laterais */
        .hub-sidebar *, #tactics-panel *, .tactics-column * { 
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important; 
          float: none !important;
          box-sizing: border-box !important;
        }

        /* Bot\xF5es individuais dentro das laterais */
        .hub-sidebar button, .tactics-column button {
          margin-bottom: 5px !important;
          text-align: left !important;
          padding: 8px !important;
          white-space: normal !important; /* Permitir que o texto do bot\xE3o quebre linha se for longo */
        }
      `;
      }
      if (typeof initHubUI2 === "function") {
        try {
          initHubUI2(playerClub2);
        } catch (e2) {
          console.error("Error initializing hub UI:", e2);
        }
      }
    }
    window.updateDayProgress = window.updateDayProgress || updateDayProgress2;
    window.hexToRgb = window.hexToRgb || hexToRgb2;
    window.luminance = window.luminance || luminance2;
    window.getReadableTextColor = window.getReadableTextColor || getReadableTextColor2;
    window.setIntroColors = window.setIntroColors || setIntroColors2;
    window.showIntroOverlay = window.showIntroOverlay || showIntroOverlay3;
    window.showHalfTimeSubsOverlay = window.showHalfTimeSubsOverlay || showHalfTimeSubsOverlay3;
    window.initHubUI = window.initHubUI || initHubUI2;
    window.renderHubContent = window.renderHubContent || renderHubContent3;
    window.renderTeamRoster = window.renderTeamRoster || renderTeamRoster3;
    window.buildNextOpponentHtml = window.buildNextOpponentHtml || buildNextOpponentHtml2;
    window.renderAllDivisionsTables = window.renderAllDivisionsTables || renderAllDivisionsTables;
    window.renderLeagueTable = window.renderLeagueTable || renderLeagueTable;
    window.initTacticPanel = window.initTacticPanel || initTacticPanel2;
    window.renderInitialMatchBoard = window.renderInitialMatchBoard || renderInitialMatchBoard3;
    window.updateMatchBoardLine = window.updateMatchBoardLine || updateMatchBoardLine3;
    window.startGame = window.startGame || startGame2;
  })();

  // src/core/simulation.js
  (function() {
    "use strict";
    function getLogger6() {
      return typeof window !== "undefined" && window.FootLab && window.FootLab.Logger ? window.FootLab.Logger : typeof window !== "undefined" && window.Elifoot && window.Elifoot.Logger ? window.Elifoot.Logger : console;
    }
    const PersistenceAPI = typeof window !== "undefined" && window.FootLab && window.FootLab.Persistence || typeof window !== "undefined" && window.Elifoot && window.Elifoot.Persistence || null;
    let isSimulating = false;
    let simIntervalId = null;
    function updateClubStatsAfterMatches(matches) {
      if (!Array.isArray(matches)) return;
      matches.forEach((match) => {
        try {
          if (!match || !match.isFinished) return;
          if (match._counted) return;
          match.goals = match.goals || [];
          const homeGoals = match.goals.filter((g) => g.team === "home" && g.type === "goal").length;
          const awayGoals = match.goals.filter((g) => g.team === "away" && g.type === "goal").length;
          match.homeGoals = homeGoals;
          match.awayGoals = awayGoals;
          try {
            const attendanceInfo = window.Finance && typeof window.Finance.computeMatchAttendance === "function" ? window.Finance.computeMatchAttendance(match) : { attendance: 0, capacity: 0 };
            match.attendance = attendanceInfo.attendance;
            match.stadiumCapacity = attendanceInfo.capacity;
            const homeClub = match.homeClub;
            if (homeClub) {
              const ticketPrice = Number(homeClub.ticketPrice || homeClub.ticket || 20) || 20;
              const matchRevenue = Math.round(match.attendance * ticketPrice);
              homeClub.revenue = (homeClub.revenue || 0) + matchRevenue;
              homeClub.budget = (homeClub.budget || 0) + matchRevenue;
              const operatingCost = Math.round(match.attendance * 0.5);
              homeClub.expenses = (homeClub.expenses || 0) + operatingCost;
              homeClub.budget = (homeClub.budget || 0) - operatingCost;
              match.homeMatchRevenue = matchRevenue;
              match.homeMatchOperatingCost = operatingCost;
            }
          } catch (e2) {
            try {
              const L = getLogger6();
              L.warn && L.warn("Erro a calcular receita/assist\xEAncia do jogo:", e2);
            } catch (_) {
            }
          }
          const clubs = [match.homeClub, match.awayClub];
          clubs.forEach((club, idx) => {
            if (!club) return;
            const isHome = idx === 0;
            const goalsScored = isHome ? homeGoals : awayGoals;
            const goalsConceded = isHome ? awayGoals : homeGoals;
            club.gamesPlayed = (club.gamesPlayed || 0) + 1;
            club.goalsFor = (club.goalsFor || 0) + goalsScored;
            club.goalsAgainst = (club.goalsAgainst || 0) + goalsConceded;
            if (homeGoals > awayGoals) {
              if (isHome) {
                club.points = (club.points || 0) + 3;
                club.wins = (club.wins || 0) + 1;
              } else {
                club.losses = (club.losses || 0) + 1;
              }
            } else if (homeGoals < awayGoals) {
              if (isHome) {
                club.losses = (club.losses || 0) + 1;
              } else {
                club.points = (club.points || 0) + 3;
                club.wins = (club.wins || 0) + 1;
              }
            } else {
              club.points = (club.points || 0) + 1;
              club.draws = (club.draws || 0) + 1;
            }
          });
          match._counted = true;
        } catch (err) {
          try {
            const L = getLogger6();
            L.warn && L.warn("updateClubStatsAfterMatches: failed for match", match, err);
          } catch (_) {
          }
        }
      });
      try {
        const snap = {
          currentJornada: window.currentJornada,
          playerClub: window.playerClub,
          allDivisions: window.allDivisions,
          allClubs: window.allClubs,
          currentRoundMatches: matches
        };
        try {
          if (PersistenceAPI && typeof PersistenceAPI.saveSnapshot === "function") {
            PersistenceAPI.saveSnapshot(snap);
          } else {
            try {
              localStorage.setItem("footlab_t1_save_snapshot", JSON.stringify(snap));
            } catch (_) {
            }
            try {
              localStorage.setItem("elifoot_save_snapshot", JSON.stringify(snap));
            } catch (_) {
            }
          }
        } catch (e2) {
        }
      } catch (err) {
        try {
          const L = getLogger6();
          L.warn && L.warn("Could not persist snapshot after updating club stats", err);
        } catch (_) {
        }
      }
    }
    function assignStartingLineups2(matches) {
      if (!Array.isArray(matches)) return;
      const Lineups = window.FootLab && window.FootLab.Lineups || window.Elifoot && window.Elifoot.Lineups || {};
      function buildFallback(teamObj) {
        const players = Array.isArray(teamObj && teamObj.players) ? teamObj.players.slice() : [];
        let gkIndex = players.findIndex(
          (p) => p && (p.position === "GK" || p.position === "Goalkeeper" || p.position === "G")
        );
        let starters = [];
        if (gkIndex >= 0) {
          starters.push(players.splice(gkIndex, 1)[0]);
        }
        players.sort((a, b) => (b && b.skill || 0) - (a && a.skill || 0));
        for (let i = 0; i < players.length && starters.length < 11; i++) {
          starters.push(players[i]);
        }
        const subs = players.slice(starters.length - (gkIndex >= 0 ? 1 : 0));
        return { starters, subs };
      }
      matches.forEach((match) => {
        try {
          const homeTeam = match.homeClub && match.homeClub.team;
          const awayTeam = match.awayClub && match.awayClub.team;
          if (homeTeam && typeof Lineups.chooseStarters === "function") {
            let result = {};
            try {
              result = Lineups.chooseStarters(homeTeam) || {};
            } catch (e2) {
              try {
                const L = getLogger6();
                L.warn && L.warn("chooseStarters failed for homeTeam, using fallback", e2);
              } catch (_) {
              }
            }
            let starters = Array.isArray(result.starters) ? result.starters : null;
            let subs = Array.isArray(result.subs) ? result.subs : null;
            if (!Array.isArray(starters) || starters.length < 7) {
              const fb = buildFallback(homeTeam);
              starters = fb.starters;
              subs = fb.subs;
            }
            match.homePlayers = starters;
            match.homeSubs = subs;
          }
          if (awayTeam && typeof Lineups.chooseStarters === "function") {
            let result = {};
            try {
              result = Lineups.chooseStarters(awayTeam) || {};
            } catch (e2) {
              try {
                const L = getLogger6();
                L.warn && L.warn("chooseStarters failed for awayTeam, using fallback", e2);
              } catch (_) {
              }
            }
            let starters = Array.isArray(result.starters) ? result.starters : null;
            let subs = Array.isArray(result.subs) ? result.subs : null;
            if (!Array.isArray(starters) || starters.length < 7) {
              const fb = buildFallback(awayTeam);
              starters = fb.starters;
              subs = fb.subs;
            }
            match.awayPlayers = starters;
            match.awaySubs = subs;
          }
        } catch (err) {
          try {
            const L = getLogger6();
            L.error && L.error("Erro ao atribuir lineups para match", err, match);
          } catch (_) {
          }
        }
      });
    }
    function simulateDay() {
      try {
        const win = typeof window !== "undefined" ? window : null;
        const allowed = win && win.__userInitiatedSim || win && win.__allowProgrammaticSim;
        if (!allowed) {
          const L = getLogger6();
          L.info && L.info("simulateDay blocked: not user-initiated");
          return;
        }
      } catch (e2) {
      }
      if (isSimulating) {
        try {
          const L = getLogger6();
          L.warn && L.warn("simulateDay called but already simulating (Jornada", window.currentJornada, ")");
        } catch (_) {
        }
        return;
      }
      isSimulating = true;
      try {
        const L = typeof window !== "undefined" && window.Elifoot && window.Elifoot.Logger ? window.Elifoot.Logger : console;
        L.info && L.info("Iniciando simula\xE7\xE3o (Jornada", window.currentJornada, ")...");
      } catch (_) {
      }
      try {
        assignStartingLineups2(window.currentRoundMatches);
      } catch (e2) {
        try {
          const L = getLogger6();
          L.error && L.error("Erro ao atribuir lineups antes da simula\xE7\xE3o", e2);
        } catch (_) {
        }
      }
      function proceedToMatch() {
        try {
          document.getElementById("screen-hub").style.display = "none";
        } catch (e2) {
        }
        try {
          document.getElementById("screen-match").style.display = "flex";
        } catch (e2) {
        }
        try {
          if (typeof renderInitialMatchBoard === "function")
            renderInitialMatchBoard(window.allDivisions);
        } catch (e2) {
          try {
            const L = getLogger6();
            L.error && L.error("renderInitialMatchBoard not found", e2);
          } catch (_) {
          }
          isSimulating = false;
        }
      }
      const HALF_MS = window.GameConfig && window.GameConfig.timing && window.GameConfig.timing.halfDurationMs || 2e4;
      const MIN_TICK = window.GameConfig && window.GameConfig.timing && window.GameConfig.timing.minTickMs || 20;
      const perMinuteMs = Math.max(MIN_TICK, Math.round(HALF_MS / 45));
      const START_DELAY_MS = window.GameConfig && window.GameConfig.timing && window.GameConfig.timing.startDelayMs || 700;
      if (typeof showIntroOverlay === "function") {
        try {
          showIntroOverlay(window.playerClub, () => {
            try {
              proceedToMatch();
            } catch (e2) {
            }
            try {
              const L = getLogger6();
              L.info && L.info("Scheduling simulation interval in", START_DELAY_MS, "ms, tick=", perMinuteMs);
              setTimeout(() => {
                const L2 = getLogger6();
                L2.info && L2.info("Starting simulation interval, tick=", perMinuteMs);
                simIntervalId = setInterval(simulationTick, perMinuteMs);
              }, START_DELAY_MS);
            } catch (e2) {
              const L3 = getLogger6();
              L3.info && L3.info("Starting simulation interval (fallback) tick=", perMinuteMs);
              simIntervalId = setInterval(simulationTick, perMinuteMs);
            }
          });
        } catch (e2) {
          proceedToMatch();
          const L = getLogger6();
          L.info && L.info("Scheduling simulation interval in", START_DELAY_MS, "ms, tick=", perMinuteMs);
          setTimeout(() => {
            const L2 = getLogger6();
            L2.info && L2.info("Starting simulation interval, tick=", perMinuteMs);
            simIntervalId = setInterval(simulationTick, perMinuteMs);
          }, START_DELAY_MS);
        }
      } else {
        proceedToMatch();
        setTimeout(() => {
          simIntervalId = setInterval(simulationTick, perMinuteMs);
        }, START_DELAY_MS);
      }
      let minute = 0;
      function simulationTick() {
        minute++;
        const HALF_MINUTE = window.GameConfig && window.GameConfig.rules && window.GameConfig.rules.halftimeMinute || 46;
        if (minute === HALF_MINUTE) {
          const playerMatch = (window.currentRoundMatches || []).find(
            (m) => m.homeClub === window.playerClub || m.awayClub === window.playerClub
          );
          if (playerMatch && typeof showHalfTimeSubsOverlay === "function") {
            if (simIntervalId) {
              clearInterval(simIntervalId);
              simIntervalId = null;
            }
            showHalfTimeSubsOverlay(window.playerClub, playerMatch, () => {
              if (simIntervalId) {
                clearInterval(simIntervalId);
                simIntervalId = null;
              }
              simIntervalId = setInterval(simulationTick, perMinuteMs);
            });
            return;
          }
        }
        if (minute > 90) {
          if (simIntervalId) {
            clearInterval(simIntervalId);
            simIntervalId = null;
          }
          endSimulation();
          return;
        }
        if (typeof window.advanceMatchDay === "function") {
          const updates = window.advanceMatchDay(window.currentRoundMatches, minute);
          if (typeof window.updateDayProgress === "function") window.updateDayProgress(minute);
          else if (typeof updateDayProgress === "function") updateDayProgress(minute);
          if (Array.isArray(updates)) {
            updates.forEach((update) => {
              if (!update || !update.match || typeof update.match.index === "undefined") return;
              const fullMatch = window.currentRoundMatches[update.match.index];
              if (!fullMatch) return;
              if (typeof window.updateMatchBoardLine === "function")
                window.updateMatchBoardLine(update.match.index, fullMatch);
              else if (typeof updateMatchBoardLine === "function")
                updateMatchBoardLine(update.match.index, fullMatch);
            });
          }
        } else {
          try {
            const L = getLogger6();
            L.error && L.error("Fun\xE7\xE3o advanceMatchDay n\xE3o encontrada (matches.js).");
          } catch (_) {
          }
          if (simIntervalId) {
            clearInterval(simIntervalId);
            simIntervalId = null;
          }
          endSimulation();
        }
      }
    }
    function endSimulation() {
      try {
        if (simIntervalId) {
          clearInterval(simIntervalId);
          simIntervalId = null;
        }
      } catch (e2) {
      }
      isSimulating = false;
      if (typeof updateClubStatsAfterMatches === "function")
        updateClubStatsAfterMatches(window.currentRoundMatches);
      try {
        const progressContainer = document.getElementById("progress-container");
        if (progressContainer) progressContainer.style.display = "none";
      } catch (e2) {
      }
      try {
        if (typeof finishDayAndReturnToHub === "function") {
          finishDayAndReturnToHub();
          return;
        }
      } catch (e2) {
      }
      try {
        document.getElementById("screen-match").style.display = "none";
        document.getElementById("screen-hub").style.display = "flex";
        if (typeof renderHubContent === "function") renderHubContent("menu-standings");
      } catch (e2) {
        try {
          const L = getLogger6();
          L.warn && L.warn("endSimulation fallback failed", e2);
        } catch (_) {
        }
      }
    }
    function finishDayAndReturnToHub() {
      try {
        if (Array.isArray(window.currentRoundMatches)) {
          window.currentRoundMatches.forEach((m) => {
            if (m) m.isFinished = true;
          });
          if (typeof updateClubStatsAfterMatches === "function")
            updateClubStatsAfterMatches(window.currentRoundMatches);
        }
      } catch (e2) {
        try {
          const L = getLogger6();
          L.warn && L.warn("finishDayAndReturnToHub: error finalizing matches", e2);
        } catch (_) {
        }
      }
      window.currentJornada = (window.currentJornada || 1) + 1;
      try {
        if (typeof window.generateRounds === "function" && Array.isArray(window.allDivisions) && window.allDivisions.length) {
          const topDivClubs = window.allDivisions[0] || [];
          const topRounds = window.generateRounds(topDivClubs);
          const seasonLength = Array.isArray(topRounds) ? topRounds.length : 0;
          if (seasonLength > 0 && (window.currentJornada || 0) > seasonLength) {
            try {
              if (window.Promotion && typeof window.Promotion.applyPromotionRelegation === "function") {
                const promoResult = window.Promotion.applyPromotionRelegation(
                  window.allDivisions || []
                );
                window.allDivisions = promoResult.newDivisions || window.allDivisions || [];
                window.allClubs = (window.allDivisions || []).reduce(
                  (acc, d) => acc.concat(d || []),
                  []
                );
                window.allClubs.forEach((c, idx) => {
                  if (c)
                    c.division = c.division || c.team && c.team.division || Math.floor(idx / 18) + 1;
                });
                try {
                  const results = {
                    promoted: promoResult.promoted,
                    relegated: promoResult.relegated
                  };
                  if (window.Elifoot && window.Elifoot.Persistence && typeof window.Elifoot.Persistence.saveSeasonResults === "function") {
                    try {
                      window.Elifoot.Persistence.saveSeasonResults(results);
                    } catch (e2) {
                    }
                  } else {
                    try {
                      localStorage.setItem("elifoot_last_season_results", JSON.stringify(results));
                    } catch (e2) {
                    }
                  }
                } catch (e2) {
                }
                if (window.Overlays && typeof window.Overlays.showSeasonSummary === "function") {
                  try {
                    window.Overlays.showSeasonSummary({
                      promoted: promoResult.promoted,
                      relegated: promoResult.relegated,
                      champions: promoResult.newDivisions && promoResult.newDivisions[0] && promoResult.newDivisions[0].length ? promoResult.newDivisions[0].slice().sort((a, b) => (b.points || 0) - (a.points || 0))[0] : null
                    });
                  } catch (e2) {
                    try {
                      const L = getLogger6();
                      L.warn && L.warn("Could not show season summary overlay", e2);
                    } catch (_) {
                    }
                  }
                } else {
                  try {
                    const L = typeof window !== "undefined" && window.Elifoot && window.Elifoot.Logger ? window.Elifoot.Logger : console;
                    L.info && L.info(
                      "Season finished \u2014 promotions:",
                      promoResult.promoted,
                      "relegations:",
                      promoResult.relegated
                    );
                  } catch (_) {
                  }
                }
              }
            } catch (e2) {
              try {
                const L = getLogger6();
                L.warn && L.warn("applyPromotionRelegation failed", e2);
              } catch (_) {
              }
            }
          }
        }
      } catch (e2) {
      }
      try {
        document.getElementById("screen-match").style.display = "none";
        document.getElementById("screen-hub").style.display = "flex";
      } catch (e2) {
      }
      try {
        if (simIntervalId) {
          clearInterval(simIntervalId);
          simIntervalId = null;
        }
      } catch (e2) {
      }
      isSimulating = false;
      try {
        if (typeof window.generateRounds === "function") {
          const nextRoundMatches = [];
          (window.allDivisions || []).forEach((divisionClubs) => {
            const rounds = window.generateRounds(divisionClubs);
            if (!Array.isArray(rounds) || rounds.length === 0) return;
            let roundIndex = ((window.currentJornada || 1) - 1) % rounds.length;
            try {
              if (window.playerClub && Array.isArray(window.currentRoundMatches) && window.currentRoundMatches.length) {
                const isPlayerInThisDivision = divisionClubs.some((dc) => dc === window.playerClub);
                if (isPlayerInThisDivision) {
                  const lastMatch = window.currentRoundMatches.find(
                    (m) => m && (m.homeClub === window.playerClub || m.awayClub === window.playerClub)
                  );
                  const lastOpponent = lastMatch ? lastMatch.homeClub === window.playerClub ? lastMatch.awayClub : lastMatch.homeClub : null;
                  if (lastOpponent) {
                    let tries = 0;
                    while (tries < rounds.length) {
                      const candidateRound = rounds[roundIndex];
                      if (!Array.isArray(candidateRound)) break;
                      const candidateMatch = candidateRound.find(
                        (m) => m && (m.homeClub === window.playerClub || m.awayClub === window.playerClub)
                      );
                      if (!candidateMatch) break;
                      const candidateOpp = candidateMatch.homeClub === window.playerClub ? candidateMatch.awayClub : candidateMatch.homeClub;
                      if (!candidateOpp || !candidateOpp.team || !lastOpponent.team) break;
                      if (candidateOpp.team.name !== lastOpponent.team.name) break;
                      roundIndex = (roundIndex + 1) % rounds.length;
                      tries++;
                    }
                  }
                }
              }
            } catch (e2) {
              try {
                const L = getLogger6();
                L.warn && L.warn("Erro ao evitar repeti\xE7\xE3o de advers\xE1rio na gera\xE7\xE3o de rondas:", e2);
              } catch (_) {
              }
            }
            if (rounds[roundIndex]) nextRoundMatches.push(...rounds[roundIndex]);
          });
          window.currentRoundMatches = nextRoundMatches;
          try {
            assignStartingLineups2(window.currentRoundMatches);
          } catch (e2) {
            try {
              const L = getLogger6();
              L.error && L.error("ERRO ao atribuir lineups:", e2);
            } catch (_) {
            }
          }
          try {
            const snap = {
              currentJornada: window.currentJornada,
              playerClub: window.playerClub,
              allDivisions: window.allDivisions,
              allClubs: window.allClubs,
              currentRoundMatches: window.currentRoundMatches
            };
            if (PersistenceAPI && typeof PersistenceAPI.saveSnapshot === "function") {
              try {
                PersistenceAPI.saveSnapshot(snap);
              } catch (e2) {
              }
            } else {
              try {
                localStorage.setItem("footlab_t1_save_snapshot", JSON.stringify(snap));
              } catch (_) {
              }
              try {
                localStorage.setItem("elifoot_save_snapshot", JSON.stringify(snap));
              } catch (_) {
              }
            }
          } catch (e2) {
          }
        }
      } catch (e2) {
        try {
          const L = getLogger6();
          L.warn && L.warn("finishDayAndReturnToHub main error", e2);
        } catch (_) {
        }
      }
      try {
        if (typeof seasonalSkillDrift === "function") seasonalSkillDrift(window.allDivisions);
      } catch (e2) {
      }
      try {
        if (typeof selectExpiringPlayersToLeave === "function") {
          selectExpiringPlayersToLeave(window.allDivisions, { probability: 0.35, maxPerClub: 1 });
        }
      } catch (err) {
        try {
          const L = getLogger6();
          L.warn && L.warn("selectExpiringPlayersToLeave failed in finishDayAndReturnToHub:", err);
        } catch (_) {
        }
      }
      try {
        if (typeof selectPlayersForRelease === "function") {
          selectPlayersForRelease(window.allDivisions, { probability: 0.02, maxPerClub: 1 });
        }
      } catch (err) {
        try {
          const L = getLogger6();
          L.warn && L.warn("selectPlayersForRelease failed in finishDayAndReturnToHub:", err);
        } catch (_) {
        }
      }
      try {
        window.PENDING_RELEASES = window.PENDING_RELEASES || [];
        const allClubs2 = Array.isArray(window.allClubs) ? window.allClubs : [];
        const clubCount = allClubs2.length || 0;
        const cfg = window.GameConfig && window.GameConfig.transfer || {};
        const cfgMin = typeof cfg.minPendingReleases === "number" ? cfg.minPendingReleases : null;
        const cfgEarly = typeof cfg.minPendingReleasesEarly === "number" ? cfg.minPendingReleasesEarly : null;
        const earlyJornadas = typeof cfg.earlyJornadas === "number" ? cfg.earlyJornadas : 6;
        const baseTargetDefault = Math.max(2, Math.min(6, Math.floor(clubCount / 12) || 2));
        const jornada = Number(window.currentJornada || 1);
        let target;
        if (jornada <= earlyJornadas) {
          target = cfgEarly != null ? cfgEarly : Math.max(baseTargetDefault, 3);
        } else {
          target = cfgMin != null ? cfgMin : baseTargetDefault;
        }
        if ((window.PENDING_RELEASES || []).length < target) {
          for (let c = 0; c < allClubs2.length && (window.PENDING_RELEASES || []).length < target; c++) {
            const club = allClubs2[c];
            try {
              if (!club || !club.team || !Array.isArray(club.team.players)) continue;
              const candidate = club.team.players.find((p) => {
                if (!p) return false;
                const already = (window.PENDING_RELEASES || []).find(
                  (x) => x && x.id && p.id && x.id === p.id || x && x.name && x.name === p.name
                );
                return !already;
              });
              if (!candidate) continue;
              const clone = Object.assign({}, candidate);
              clone.previousSalary = Number(candidate.salary || 0);
              try {
                clone.playerValue = computePlayerMarketValue(
                  clone,
                  club && club.division ? club.division : 4
                );
              } catch (e2) {
                clone.playerValue = 0;
              }
              clone.leavingFee = Math.max(0, Math.round((clone.playerValue || 0) * 0.8));
              clone.previousClubName = club.team && club.team.name || club.name || "";
              clone.originalClubRef = club;
              window.PENDING_RELEASES.push(clone);
            } catch (e2) {
            }
          }
        }
      } catch (e2) {
        try {
          const L = getLogger6();
          L.warn && L.warn("ensurePendingReleases filler failed:", e2);
        } catch (_) {
        }
      }
      try {
        try {
          const cfg = window.GameConfig && window.GameConfig.transfer || {};
          if (cfg && cfg.autoProcessPendingReleases === true && typeof window.processPendingReleases === "function") {
            try {
              window.processPendingReleases();
            } catch (e2) {
            }
          }
        } catch (e2) {
        }
        if (typeof renderHubContent === "function") renderHubContent("menu-team");
      } catch (e2) {
      }
      try {
        if (Array.isArray(window.allClubs)) {
          window.allClubs.forEach((club) => {
            if (club && club.team && Array.isArray(club.team.players)) {
              club.team.players.forEach((p) => {
                if (p && typeof p.suspendedGames === "number" && p.suspendedGames > 0)
                  p.suspendedGames = Math.max(0, p.suspendedGames - 1);
                if (p) p.yellowCards = 0;
                if (p) p.sentOff = false;
              });
            }
          });
        }
      } catch (e2) {
        try {
          const L = getLogger6();
          L.warn && L.warn("Erro ao decrementar suspens\xF5es:", e2);
        } catch (_) {
        }
      }
    }
    window.Simulation = window.Simulation || {};
    window.Simulation.updateClubStatsAfterMatches = updateClubStatsAfterMatches;
    window.Simulation.assignStartingLineups = assignStartingLineups2;
    window.Simulation.simulateDay = simulateDay;
    window.Simulation.endSimulation = endSimulation;
    window.Simulation.finishDayAndReturnToHub = finishDayAndReturnToHub;
    window.updateClubStatsAfterMatches = updateClubStatsAfterMatches;
    window.assignStartingLineups = assignStartingLineups2;
    window.simulateDay = simulateDay;
    window.endSimulation = endSimulation;
    window.finishDayAndReturnToHub = finishDayAndReturnToHub;
  })();

  // src/ui/helpers.mjs
  function hexToRgb(hex) {
    if (!hex) return [46, 46, 46];
    let h = String(hex).replace("#", "");
    if (h.length === 3)
      h = h.split("").map((c) => c + c).join("");
    const v = parseInt(h, 16);
    if (isNaN(v)) return [46, 46, 46];
    return [v >> 16 & 255, v >> 8 & 255, v & 255];
  }
  function luminance(rgb) {
    if (!rgb) return 0;
    const s = rgb.map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
  }
  function getReadableTextColor(bg, pref) {
    const hex = String(bg || "#2e2e2e");
    const prefHex = pref || null;
    try {
      const bgRgb = hexToRgb(hex);
      const L = luminance(bgRgb);
      const contrastWhite = (1 + 0.05) / (L + 0.05);
      const contrastBlack = (L + 0.05) / (0 + 0.05);
      if (prefHex) {
        try {
          const prefRgb = hexToRgb(prefHex);
          const Lp = luminance(prefRgb);
          const contrastPref = (Math.max(L, Lp) + 0.05) / (Math.min(L, Lp) + 0.05);
          if (contrastPref >= Math.max(contrastWhite, contrastBlack)) return prefHex;
        } catch (e2) {
        }
      }
      return contrastWhite >= contrastBlack ? "#ffffff" : "#000000";
    } catch (e2) {
      return pref || "#ffffff";
    }
  }
  function normalizePosition(pos) {
    if (!pos) return "";
    const p = String(pos || "").toUpperCase().trim();
    if (p === "GK" || p === "GOALKEEPER") return "GK";
    if (/^(CB|CENTERBACK|CENTREBACK|CEN|CTR|DC|DF)$/.test(p)) return "CB";
    if (/^(LB|LWB|LEFTBACK|LEFTBACKWARD)$/.test(p)) return "LB";
    if (/^(RB|RWB|RIGHTBACK|RIGHTBACKWARD)$/.test(p)) return "RB";
    if (/^(CDM|DM|DEFMID|HOLDING)$/.test(p)) return "CM";
    if (/^(CM|MC|MID|MF|MIDFIELDER|CENTRAL)$/.test(p)) return "CM";
    if (/^(AM|CAM|OM|SS|SH|ATT|AMF)$/.test(p)) return "CM";
    if (/^(LW|LM|LEFTWING|LEFT)$/.test(p)) return "LW";
    if (/^(RW|RM|RIGHTWING|RIGHT)$/.test(p)) return "RW";
    if (/^(ST|CF|FW|FORWARD|STRIKER)$/.test(p)) return "ST";
    if (/^D/.test(p)) return "CB";
    if (/^M/.test(p)) return "CM";
    if (/^F|^A|^S/.test(p)) return "ST";
    return p;
  }
  function isPlayerInAnyClub(player) {
    try {
      const all = window.ALL_CLUBS || window.allClubs || [];
      for (const c of all) {
        if (!c || !c.team || !Array.isArray(c.team.players)) continue;
        if (c.team.players.find(
          (p) => p && p.id && player.id && p.id === player.id || p && p.name && p.name === player.name
        ))
          return true;
      }
    } catch (e2) {
    }
    return false;
  }
  if (typeof window !== "undefined") {
    window.FootLab = window.FootLab || window.Elifoot || {};
    window.FootLab.ColorUtils = window.FootLab.ColorUtils || {};
    if (!window.FootLab.ColorUtils.hexToRgb) window.FootLab.ColorUtils.hexToRgb = hexToRgb;
    if (!window.FootLab.ColorUtils.luminance) window.FootLab.ColorUtils.luminance = luminance;
    if (!window.FootLab.ColorUtils.getReadableTextColor)
      window.FootLab.ColorUtils.getReadableTextColor = getReadableTextColor;
    window.Elifoot = window.Elifoot || window.FootLab;
  }

  // src/ui/roster.mjs
  function renderTeamRoster2(club) {
    try {
      const formatMoney2 = window.FootLab && window.FootLab.formatMoney || window.formatMoney || ((v) => String(v));
      const content = document.getElementById("hub-main-content");
      if (!content) return;
      if (!club || !club.team || !club.team.players || club.team.players.length === 0) {
        content.innerHTML = "<h2>ERRO</h2><p>Equipa n\xE3o tem jogadores!</p>";
        return;
      }
      const teamBg = club.team && club.team.bgColor || "#2e2e2e";
      let teamFg = getReadableTextColor(teamBg, club.team && club.team.color || "#ffffff");
      try {
        const c = luminance(hexToRgb(teamBg));
        if (c < 0.18) teamFg = "#fff";
      } catch (e2) {
      }
      const players = Array.isArray(club.team.players) ? club.team.players.slice() : [];
      const enriched = players.map(
        (p) => Object.assign({}, p, { _normPos: normalizePosition(p.position || p.pos) })
      );
      enriched.sort((a, b) => {
        const order = { GK: 1, CB: 2, LB: 2, RB: 2, DF: 2, CM: 3, LW: 3, RW: 3, ST: 4 };
        const posA = order[a._normPos] || 5;
        const posB = order[b._normPos] || 5;
        if (posA !== posB) return posA - posB;
        return (b.skill || 0) - (a.skill || 0);
      });
      const groups = { GK: [], DEF: [], MID: [], ATT: [] };
      enriched.forEach((p) => {
        const np = p._normPos || normalizePosition(p.position || p.pos);
        if (np === "GK") groups.GK.push(p);
        else if (np === "CB" || np === "LB" || np === "RB" || np === "DF") groups.DEF.push(p);
        else if (np === "CM" || np === "LW" || np === "RW" || np === "AM" || np === "DM")
          groups.MID.push(p);
        else if (np === "ST") groups.ATT.push(p);
        else groups.MID.push(p);
      });
      const groupLabels = { GK: "Guarda-redes", DEF: "Defesas", MID: "M\xE9dios", ATT: "Avan\xE7ados" };
      let html = `<div class="players-cards" style="color:${teamFg};">`;
      const playerNameColor = teamFg;
      ["GK", "DEF", "MID", "ATT"].forEach((k) => {
        const list = groups[k];
        if (!list || list.length === 0) return;
        html += `<div class="player-group">`;
        html += `<h4 class="lane-title" style="margin:6px 0 8px 0;">${groupLabels[k]} (${list.length})</h4>`;
        html += `<div class="lane-slots" data-pos="${k}">`;
        (list || []).forEach((p) => {
          const skill = p.skill || 0;
          const barColor = skill >= 80 ? "#4CAF50" : skill >= 70 ? "#8BC34A" : skill >= 60 ? "#FFC107" : "#F44336";
          const salary = p.salary || 0;
          const contractLeft = typeof p.contractYearsLeft !== "undefined" ? p.contractYearsLeft : typeof p.contractYears !== "undefined" ? p.contractYears : 0;
          const endsMarker = Number(contractLeft) === 0 ? "*" : "";
          const displayPos = p._normPos || p.position || p.pos || "";
          html += `<div class="hub-box player-box" data-player-id="${p.id}">
                  <div class="player-header-row">
                    <div class="player-pos">${displayPos}</div>
                    <div class="player-name">${p.name}</div>
                  </div>
                  <div class="skill-bar"><div class="skill-fill" style="width:${skill}%;background:${barColor};"></div></div>
                  <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.92em;">
                    <div style="font-weight:700;color:rgba(255,255,255,0.9);">${skill}</div>
                    <div class="player-salary" data-player-id="${p.id}">${formatMoney2(salary)}${endsMarker ? " " + endsMarker : ""}</div>
                  </div>
                </div>`;
        });
        html += `</div>`;
        html += `</div>`;
      });
      html += `</div>`;
      try {
        const counts = {
          GK: (groups.GK || []).length,
          DEF: (groups.DEF || []).length,
          MID: (groups.MID || []).length,
          ATT: (groups.ATT || []).length
        };
        console.debug("renderTeamRoster: groupCounts=", counts, "displayedPerGroup=5");
      } catch (e2) {
      }
      content.innerHTML = `<div class="hub-box team-roster-grid" style="color:${teamFg};"><h2 class="team-roster-title">PLANTEL (${enriched.length} jogadores)</h2>${html}</div>`;
      setTimeout(() => {
        try {
          const salaryEls = content.querySelectorAll(".player-salary");
          salaryEls.forEach((el) => {
            el.style.cursor = "pointer";
            el.title = "Clique para negociar contrato deste jogador";
            el.replaceWith(el.cloneNode(true));
          });
          const fresh = content.querySelectorAll(".player-salary");
          fresh.forEach((el) => {
            el.addEventListener("click", () => {
              const pid = Number(el.dataset.playerId);
              const player = club.team && Array.isArray(club.team.players) ? club.team.players.find((p) => p.id === pid) : null;
              if (!player) return alert("Jogador n\xE3o encontrado");
              const current = Number(player.salary || 0);
              const proposedStr = window.prompt(
                `Negociar sal\xE1rio para ${player.name}
Sal\xE1rio atual: ${formatMoney2(current)}
Introduza sal\xE1rio mensal proposto (n\xFAmero):`,
                String(current)
              );
              if (proposedStr === null) return;
              const proposed = Math.max(1, Math.round(Number(proposedStr) || 0));
              const yearsStr = window.prompt(
                "Dura\xE7\xE3o do contrato em anos (ex: 1 ou 0):",
                String(Number(player.contractYears || 1))
              );
              if (yearsStr === null) return;
              const years = Math.max(0, Math.min(10, Number(yearsStr) || 1));
              if (window.Finance && typeof window.Finance.negotiatePlayerContract === "function") {
                const res = window.Finance.negotiatePlayerContract(club, pid, proposed, years);
                if (!res) return alert("Erro na negocia\xE7\xE3o (resultado inv\xE1lido).");
                const prob = typeof res.acceptProb === "number" ? res.acceptProb : 0;
                if (res.accepted)
                  alert(
                    `${player.name} aceitou a oferta!
Novo sal\xE1rio: ${formatMoney2(player.salary)}
Probabilidade estimada: ${(prob * 100).toFixed(1)}%`
                  );
                else
                  alert(
                    `${player.name} rejeitou a oferta.
Probabilidade estimada: ${(prob * 100).toFixed(1)}%`
                  );
                renderTeamRoster2(club);
              } else {
                alert("Servi\xE7o de negocia\xE7\xE3o indispon\xEDvel.");
              }
            });
          });
          const rowEls = content.querySelectorAll(".player-box");
          rowEls.forEach((r) => {
            r.style.cursor = "pointer";
            r.title = "Clique para negociar ou oferecer contrato";
            r.replaceWith(r.cloneNode(true));
          });
          const freshRows = content.querySelectorAll(".player-box");
          freshRows.forEach((r) => {
            r.addEventListener("click", (ev) => {
              if (ev.target && ev.target.classList && ev.target.classList.contains("player-salary"))
                return;
              const pid = Number(r.dataset.playerId);
              const player = club.team && Array.isArray(club.team.players) ? club.team.players.find((p) => p.id === pid) : null;
              if (!player) return;
              const showPlayerActionMenu = window.FootLab && window.FootLab.Hub && window.FootLab.Hub.showPlayerActionMenu || window.showPlayerActionMenu;
              if (typeof showPlayerActionMenu === "function") showPlayerActionMenu(player, club);
              else alert("A\xE7\xE3o de jogador indispon\xEDvel (showPlayerActionMenu).");
            });
          });
        } catch (e2) {
          try {
            const L = window.FootLab && window.FootLab.Logger || console;
            L.warn && L.warn("Failed to attach negotiation handlers", e2);
          } catch (_) {
          }
        }
      }, 10);
      const createFloatingOpponentBox = window.FootLab && window.FootLab.Hub && window.FootLab.Hub.createFloatingOpponentBox || window.createFloatingOpponentBox;
      try {
        if (typeof createFloatingOpponentBox === "function") createFloatingOpponentBox(teamFg);
      } catch (e2) {
      }
    } catch (e2) {
      try {
        const L = window.FootLab && window.FootLab.Logger || console;
        L.warn && L.warn("renderTeamRoster failed", e2);
      } catch (_) {
      }
    }
  }
  if (typeof window !== "undefined") {
    window.FootLab = window.FootLab || {};
    window.FootLab.Hub = window.FootLab.Hub || {};
    window.FootLab.Hub.renderTeamRoster = window.FootLab.Hub.renderTeamRoster || renderTeamRoster2;
    window.Elifoot = window.Elifoot || window.FootLab;
  }

  // src/ui/transfers.mjs
  function renderTransfers() {
    try {
      const content = document.getElementById("hub-main-content");
      if (!content) return;
      const market = window.transferMarket || window.availableTransfers || window.transferList || [];
      const rawFreeAgents = window.FREE_TRANSFERS || window.freeAgents || [];
      const freeAgents = Array.isArray(rawFreeAgents) ? rawFreeAgents.filter((p) => !isPlayerInAnyClub(p)) : [];
      if ((!Array.isArray(market) || market.length === 0) && (!Array.isArray(freeAgents) || freeAgents.length === 0)) {
        content.innerHTML = "<h2>Transfer\xEAncias</h2><p>Nenhum jogador dispon\xEDvel no mercado.</p>";
        return;
      }
      let html = `<h2>Transfer\xEAncias</h2><div class="hub-box subs-panel" style="padding:8px;display:flex;flex-direction:column;gap:8px;">`;
      html += `<div style="display:flex;gap:8px;margin-bottom:8px;"><button id="tab-market" style="padding:6px 10px;border-radius:8px;border:none;background:#eee;color:#111;font-weight:700;">Mercado</button><button id="tab-free" style="padding:6px 10px;border-radius:8px;border:none;background:transparent;color:#aaa;font-weight:700;">Jogadores Livres</button><button id="tab-movements" style="padding:6px 10px;border-radius:8px;border:none;background:transparent;color:#aaa;font-weight:700;">Movimentos</button><button id="tab-my" style="padding:6px 10px;border-radius:8px;border:none;background:transparent;color:#aaa;font-weight:700;">Meus</button></div>`;
      html += `<div id="trans-tab-content" style="display:flex;flex-direction:column;gap:8px;">`;
      html += `<div data-tab="market" class="trans-tab" style="display:block;">`;
      if (Array.isArray(market) && market.length) {
        const buyer = window.playerClub || null;
        market.forEach((p) => {
          try {
            const pos = p.position || p.pos || "-";
            const name = p.name || p.playerName || "\u2014";
            const clubObj = p.club || p.originalClubRef || null;
            const club = clubObj && (clubObj.team ? clubObj.team.name : clubObj.name) || p.clubName || "Livre";
            const price = p.price || p.minPrice || p.value || 0;
            let isOwn = false;
            if (buyer && clubObj) {
              try {
                if (clubObj === buyer) isOwn = true;
                else if (clubObj.team && buyer.team && clubObj.team === buyer.team) isOwn = true;
                else {
                  const pName = clubObj.team ? clubObj.team.name : clubObj.name || clubObj.clubName || "";
                  const bName = buyer.team ? buyer.team.name : buyer.name || buyer.clubName || "";
                  if (pName && bName && String(pName).trim() === String(bName).trim()) isOwn = true;
                }
              } catch (e2) {
                isOwn = false;
              }
            }
            const btnTitle = isOwn ? "N\xE3o \xE9 poss\xEDvel comprar jogadores do seu pr\xF3prio clube" : "";
            const btnStyle = isOwn ? "padding:6px 8px;border-radius:6px;border:none;background:#9e9e9e;color:#fff;cursor:not-allowed;opacity:0.9;" : "padding:6px 8px;border-radius:6px;border:none;background:#2b7;color:#fff;";
            const disabledAttr = isOwn ? "disabled" : "";
            html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;background:rgba(0,0,0,0.04);border-radius:6px;">
                    <div style="display:flex;gap:10px;align-items:center;"><div style="width:36px;font-weight:700;text-align:center">${pos}</div><div style="font-weight:600">${name}</div><div style="opacity:0.8;margin-left:8px">${club}</div></div>
                    <div style="display:flex;gap:8px;align-items:center;"><div style="font-weight:700;color:#FFEB3B">${formatMoney(price)}</div><button data-player-name="${name}" class="buy-market-btn" title="${btnTitle}" ${disabledAttr} style="${btnStyle}">${isOwn ? "N\xE3o dispon\xEDvel" : "Comprar"}</button></div>`;
            try {
              const L = window.FootLab && window.FootLab.Logger || window.Elifoot && window.Elifoot.Logger || console;
              L.warn && L.warn("attach transfer handlers failed", e);
            } catch (e2) {
              const L = window.FootLab && window.FootLab.Logger || console;
              L.warn && L.warn("attach transfer handlers failed", e2);
            }
          } catch (e2) {
            const name = p && (p.name || p.playerName) || "\u2014";
            html += `<div style="padding:6px 8px;background:rgba(0,0,0,0.02);border-radius:6px;"><div style="font-weight:600">${name}</div></div>`;
          }
        });
      } else {
        html += `<div style="opacity:0.85;padding:8px">Nenhum item no mercado.</div>`;
      }
      html += `</div>`;
      html += `<div data-tab="free" class="trans-tab" style="display:none;">`;
      if (Array.isArray(freeAgents) && freeAgents.length) {
        freeAgents.forEach((p, idx) => {
          const pos = p.position || p.pos || "-";
          const name = p.name || p.playerName || "\u2014";
          const prev = p.previousClubName || p.club && (p.club.team ? p.club.team.name : p.club.name) || p.clubName || "\u2014";
          const minContract = p.minContract || p.minMonthly || p.minSalary || 0;
          const skill = typeof p.skill === "number" ? p.skill : p._skill || 0;
          html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;background:rgba(0,0,0,0.03);border-radius:6px;">
                    <div style="display:flex;gap:10px;align-items:center;"><div style="width:36px;font-weight:700;text-align:center">${pos}</div><div style="font-weight:600">${name}</div><div style="opacity:0.8;margin-left:8px">${prev}</div><div style="opacity:0.75;margin-left:8px;font-size:0.9em;color:#ddd">Skill: ${skill}</div></div>
                    <div style="display:flex;gap:8px;align-items:center;"><div style="font-weight:700;color:#8BC34A">M\xEDn: ${formatMoney(minContract)}</div><button data-free-idx="${idx}" class="buy-free-btn" style="padding:6px 8px;border-radius:6px;border:none;background:#2b7;color:#fff;">Comprar</button></div>
                </div>`;
        });
      } else {
        html += `<div style="opacity:0.85;padding:8px">Nenhum jogador livre dispon\xEDvel.</div>`;
      }
      html += `</div>`;
      html += `<div data-tab="movements" class="trans-tab" style="display:none;">`;
      try {
        const history = Array.isArray(window.TRANSFER_HISTORY) ? window.TRANSFER_HISTORY.slice().reverse() : [];
        if (history.length === 0) {
          html += `<div style="opacity:0.85;padding:8px">Nenhum movimento registado.</div>`;
        } else {
          history.forEach((h, i) => {
            const player = h.player || "\u2014";
            const from = h.from || "\u2014";
            const to = h.to || "\u2014";
            const fee = Number(h.fee || 0);
            const salary = Number(h.salary || 0);
            const when = h.time ? new Date(Number(h.time)).toLocaleString() : "";
            html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;background:rgba(0,0,0,0.03);border-radius:6px;margin-bottom:6px;">
                      <div style="display:flex;flex-direction:column;">
                        <div style="font-weight:700">${player}</div>
                        <div style="opacity:0.8;font-size:0.9em">${from} \u2192 ${to} \xB7 ${when}</div>
                      </div>
                      <div style="text-align:right;font-size:0.95em">${fee ? formatMoney(fee) + "<br/>" : ""}${salary ? formatMoney(salary) + "/m" : ""}</div>
                    </div>`;
          });
        }
      } catch (e2) {
        html += `<div style="opacity:0.85;padding:8px">Erro ao ler hist\xF3rico de transfer\xEAncias.</div>`;
      }
      html += `</div>`;
      html += `<div data-tab="my" class="trans-tab" style="display:none;">`;
      try {
        const history = Array.isArray(window.TRANSFER_HISTORY) ? window.TRANSFER_HISTORY.slice().reverse() : [];
        const buyer = window.playerClub || {};
        const buyerName = buyer.team && buyer.team.name || buyer.name || "";
        const mine = history.filter((h) => {
          try {
            if (!buyerName) return false;
            return String(h.from || "").trim() === String(buyerName).trim() || String(h.to || "").trim() === String(buyerName).trim();
          } catch (_) {
            return false;
          }
        });
        if (mine.length === 0)
          html += `<div style="opacity:0.85;padding:8px">Nenhum movimento para a sua equipa.</div>`;
        else {
          mine.forEach((h) => {
            const player = h.player || "\u2014";
            const from = h.from || "\u2014";
            const to = h.to || "\u2014";
            const fee = Number(h.fee || 0);
            const salary = Number(h.salary || 0);
            const when = h.time ? new Date(Number(h.time)).toLocaleString() : "";
            html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;background:rgba(0,0,0,0.03);border-radius:6px;margin-bottom:6px;">
                      <div style="display:flex;flex-direction:column;">
                        <div style="font-weight:700">${player}</div>
                        <div style="opacity:0.8;font-size:0.9em">${from} \u2192 ${to} \xB7 ${when}</div>
                      </div>
                      <div style="text-align:right;font-size:0.95em">${fee ? formatMoney(fee) + "<br/>" : ""}${salary ? formatMoney(salary) + "/m" : ""}</div>
                    </div>`;
          });
        }
      } catch (e2) {
        html += `<div style="opacity:0.85;padding:8px">Erro ao filtrar movimentos da equipa.</div>`;
      }
      html += `</div>`;
      html += `</div>`;
      html += `</div>`;
      content.innerHTML = html;
      setTimeout(() => {
        try {
          const tabMarket = document.getElementById("tab-market");
          const tabFree = document.getElementById("tab-free");
          const tabs = content.querySelectorAll(".trans-tab");
          const showTab = (name) => {
            tabs.forEach((t) => {
              t.style.display = t.getAttribute("data-tab") === name ? "block" : "none";
            });
            if (name === "market") {
              tabMarket.style.background = "#eee";
              tabMarket.style.color = "#111";
              tabFree.style.background = "transparent";
              tabFree.style.color = "#aaa";
            } else {
              tabFree.style.background = "#eee";
              tabFree.style.color = "#111";
              tabMarket.style.background = "transparent";
              tabMarket.style.color = "#aaa";
            }
          };
          if (tabMarket) tabMarket.addEventListener("click", () => showTab("market"));
          if (tabFree) tabFree.addEventListener("click", () => showTab("free"));
          const tabMov = document.getElementById("tab-movements");
          const tabMy = document.getElementById("tab-my");
          if (tabMov) tabMov.addEventListener("click", () => showTab("movements"));
          if (tabMy) tabMy.addEventListener("click", () => showTab("my"));
          content.querySelectorAll(".buy-market-btn").forEach((b) => {
            b.addEventListener("click", () => {
              if (b.disabled) {
                const title = b.getAttribute("title") || "A\xE7\xE3o indispon\xEDvel";
                alert(title);
                return;
              }
              const name = b.getAttribute("data-player-name");
              alert(
                "Comprar do mercado: " + name + ". Implementar fluxo de transfer\xEAncia dependendo do tipo de listagem."
              );
            });
          });
          content.querySelectorAll(".buy-free-btn").forEach((b) => {
            b.addEventListener("click", () => {
              const idx = Number(b.getAttribute("data-free-idx"));
              const freeList = Array.isArray(rawFreeAgents) ? rawFreeAgents.filter((p) => !isPlayerInAnyClub(p)) : [];
              const pl = freeList[idx];
              if (!pl) return alert("Jogador livre n\xE3o encontrado");
              showBuyFreePlayerMenu(pl, rawFreeAgents, idx);
            });
          });
        } catch (e2) {
          try {
            const L = window.Elifoot && window.Elifoot.Logger || console;
            L.warn && L.warn("attach transfer handlers failed", e2);
          } catch (e3) {
            const L = window.FootLab && window.FootLab.Logger || console;
            L.warn && L.warn("attach transfer handlers failed", e3);
          }
        }
      }, 10);
    } catch (e2) {
      try {
        const L = window.FootLab && window.FootLab.Logger || console;
        L.warn && L.warn("renderTransfers failed", e2);
      } catch (_) {
      }
    }
  }
  function showBuyFreePlayerMenu(pl, rawFreeAgents, idxInFiltered) {
    try {
      const overlayId = "buy-free-overlay";
      let overlay = document.getElementById(overlayId);
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = overlayId;
        overlay.style.position = "fixed";
        overlay.style.left = "0";
        overlay.style.top = "0";
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.zIndex = "70010";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.background = "rgba(0,0,0,0.5)";
        document.body.appendChild(overlay);
      }
      overlay.innerHTML = "";
      const box = document.createElement("div");
      box.className = "subs-panel transfer-overlay-root";
      const skill = pl.skill || 0;
      const minC = Math.max(0, Number(pl.minContract || pl.minMonthly || pl.minSalary || 0));
      const prev = pl.previousClubName || pl.club && (pl.club.team ? pl.club.team.name : pl.club.name) || pl.clubName || "\u2014";
      const html = `
          <h3 class="transfer-title">Assinar jogador livre</h3>
          <div style="margin-top:8px;font-weight:700;color:var(--hub-fg, #111)">${pl.name} <span style="font-weight:500;opacity:0.85">(${pl.position || ""})</span></div>
          <div style="margin-top:8px;color:var(--hub-fg, #333)">Skill: ${skill} \xB7 Clube anterior: ${prev} \xB7 Sal\xE1rio m\xEDnimo: ${formatMoney(minC)}</div>
          <div style="margin-top:12px;display:flex;gap:8px;align-items:center;">
            <label style="min-width:120px;color:var(--hub-fg, #111)">Sal\xE1rio mensal</label>
            <input id="buyFreeSalaryInput" type="number" min="${minC}" value="${minC || Math.max(500, Number(pl.salary || 500))}" style="width:200px;padding:8px;border-radius:8px;border:1px solid rgba(0,0,0,0.12);background:rgba(255,255,255,0.9);color:#111" />
          </div>
          <div style="margin-top:16px;display:flex;justify-content:flex-end;gap:10px;">
            <button id="buyFreeCancelBtn" style="padding:10px 14px;border-radius:10px;border:none;background:#efefef;color:#111">Cancelar</button>
            <button id="buyFreeConfirmBtn" style="padding:10px 14px;border-radius:10px;border:none;background:#2b7;color:#fff">Assinar (1 ano)</button>
          </div>`;
      box.innerHTML = html;
      overlay.appendChild(box);
      setTimeout(() => {
        const cancel = document.getElementById("buyFreeCancelBtn");
        const confirm = document.getElementById("buyFreeConfirmBtn");
        const salaryIn = document.getElementById("buyFreeSalaryInput");
        if (cancel)
          cancel.addEventListener("click", () => {
            try {
              if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
            } catch (e2) {
            }
          });
        if (confirm)
          confirm.addEventListener("click", () => {
            const salary = Math.max(minC, Math.round(Number(salaryIn.value || minC || 500)));
            const buyer = window.playerClub;
            if (!buyer) return alert("Nenhum clube comprador definido (playerClub).");
            const ridx = rawFreeAgents.findIndex(
              (pp) => pp.id && pl.id && pp.id === pl.id || pp.name && pp.name === pl.name
            );
            if (ridx >= 0) rawFreeAgents.splice(ridx, 1);
            const playerToAdd = Object.assign({}, pl);
            playerToAdd.salary = salary;
            playerToAdd.contractYears = 1;
            playerToAdd.contractYearsLeft = 1;
            buyer.team.players = buyer.team.players || [];
            buyer.team.players.push(playerToAdd);
            if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
            alert(
              `${pl.name} assinado por ${buyer.team.name} por ${formatMoney(salary)} /m\xEAs (1 ano).`
            );
            try {
              if (typeof renderTransfers === "function") renderTransfers();
            } catch (_) {
            }
            try {
              if (typeof renderTeamRoster === "function") renderTeamRoster(buyer);
            } catch (_) {
            }
          });
      }, 10);
    } catch (e2) {
      try {
        const L = window.FootLab && window.FootLab.Logger || console;
        L.warn && L.warn("showBuyFreePlayerMenu failed", e2);
      } catch (_) {
      }
    }
  }
  if (typeof window !== "undefined") {
    window.FootLab = window.FootLab || {};
    window.FootLab.Hub = window.FootLab.Hub || {};
    window.FootLab.Hub.renderTransfers = window.FootLab.Hub.renderTransfers || renderTransfers;
    window.FootLab.Hub.showBuyFreePlayerMenu = window.FootLab.Hub.showBuyFreePlayerMenu || showBuyFreePlayerMenu;
    window.renderTransfers = window.renderTransfers || renderTransfers;
    window.showBuyFreePlayerMenu = window.showBuyFreePlayerMenu || showBuyFreePlayerMenu;
    window.Elifoot = window.Elifoot || window.FootLab;
  }

  // src/ui/finance.mjs
  function renderFinance(club) {
    try {
      const FootLab2 = window.FootLab || window.Elifoot || window;
      const content = document.getElementById("hub-main-content");
      if (!content) return;
      const c = club || window.playerClub;
      if (!c) {
        content.innerHTML = "<h2>Finan\xE7as</h2><p>Nenhum clube do jogador definido.</p>";
        return;
      }
      const stadiumCap = Number(c.stadiumCapacity || c.stadium || 1e4) || 1e4;
      const ticketPrice = Number(c.ticketPrice || c.ticket || 20) || 20;
      const bud = Number(c.budget || 0) || 0;
      content.innerHTML = `
      <h2>Finan\xE7as</h2>
      <div style="display:flex;flex-direction:column;gap:10px;max-width:640px;">
          <div><strong>Or\xE7amento:</strong> <span id="clubBudgetDisplay">${formatMoney(bud)}</span></div>
          <div><strong>Capacidade do Est\xE1dio (atual):</strong> <span id="stadiumCapacityDisplay">${stadiumCap.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</span> lugares</div>
          <div><strong>Limite atual do motor:</strong> 65.000 lugares (pode expandir at\xE9 100.000)</div>
          <div style="display:flex;gap:12px;align-items:center;">
              <label style="min-width:160px;">Aumentar est\xE1dio (%)</label>
              <input id="upgradePercentInput" type="number" min="1" max="100" value="10" style="width:80px;padding:6px;border-radius:6px;border:1px solid #ccc;" />
              <button id="upgradeStadiumBtn" style="padding:8px 12px;border-radius:8px;background:#2b7; border:none; cursor:pointer;">Aumentar</button>
              <div id="upgradeCostDisplay" style="margin-left:8px;color:rgba(0,0,0,0.6)"></div>
          </div>
          <div style="display:flex;gap:12px;align-items:center;">
              <label style="min-width:160px;">Pre\xE7o do bilhete (\u20AC)</label>
              <input id="ticketPriceInput" type="number" min="1" value="${ticketPrice}" style="width:100px;padding:6px;border-radius:6px;border:1px solid #ccc;" />
              <button id="setTicketBtn" style="padding:8px 12px;border-radius:8px;background:#58a; border:none; cursor:pointer;color:#fff;">Guardar</button>
              <div id="estRevenueDisplay" style="margin-left:8px;color:rgba(0,0,0,0.6)"></div>
          </div>
          <div style="opacity:0.9;font-size:0.92em;color:rgba(0,0,0,0.7);">Notas: o custo por lugar aumenta com o tamanho atual do est\xE1dio. A receita dos jogos entra no or\xE7amento do clube ap\xF3s o fim de cada jogo.</div>
      </div>
    `;
      setTimeout(() => {
        try {
          let calcCostForPercent = function(pct) {
            const currentCap = Number(c.stadiumCapacity || c.stadium || 1e4);
            const seatsAdded = Math.ceil(currentCap * (pct / 100));
            const costPerSeat = Math.round(20 + currentCap / 1e3 * 2);
            const total = seatsAdded * costPerSeat;
            return { seatsAdded, costPerSeat, total };
          }, updateCostDisplay = function() {
            const pct = Math.max(1, Math.min(100, Number(pctIn.value || 10)));
            const cc = calcCostForPercent(pct);
            costDisp.textContent = `${cc.seatsAdded} lugares \u2192 custo aprox. ${formatMoney(cc.total)} (${cc.costPerSeat}\u20AC/lugar)`;
            const estAttendance = FootLab2 && FootLab2.Finance && typeof FootLab2.Finance.computeMatchAttendance === "function" ? FootLab2.Finance.computeMatchAttendance({ homeClub: c, awayClub: {} }).attendance : Math.min(Number(c.stadiumCapacity || 1e4), 1e4);
            estDisp.textContent = estAttendance ? `Estimativa por jogo: ${estAttendance} espectadores \u2192 receita ~ ${formatMoney(Math.round(estAttendance * Number(priceIn.value || c.ticketPrice || 20)))} ` : "";
          };
          const pctIn = document.getElementById("upgradePercentInput");
          const upgradeBtn = document.getElementById("upgradeStadiumBtn");
          const costDisp = document.getElementById("upgradeCostDisplay");
          const capDisp = document.getElementById("stadiumCapacityDisplay");
          const budDisp = document.getElementById("clubBudgetDisplay");
          const priceIn = document.getElementById("ticketPriceInput");
          const setTicket = document.getElementById("setTicketBtn");
          const estDisp = document.getElementById("estRevenueDisplay");
          pctIn.addEventListener("input", updateCostDisplay);
          priceIn.addEventListener("input", updateCostDisplay);
          updateCostDisplay();
          upgradeBtn.addEventListener("click", () => {
            const pct = Math.max(1, Math.min(100, Number(pctIn.value || 10)));
            const ccalc = calcCostForPercent(pct);
            const currentBudget = Number(c.budget || 0);
            if (ccalc.total > currentBudget) {
              alert("Or\xE7amento insuficiente para esta expans\xE3o.");
              return;
            }
            const currentCap = Number(c.stadiumCapacity || c.stadium || 1e4);
            const newCap = Math.min(1e5, currentCap + ccalc.seatsAdded);
            c.stadiumCapacity = newCap;
            c.budget = currentBudget - ccalc.total;
            try {
              const snap = {
                currentJornada: window.currentJornada,
                playerClub: window.playerClub,
                allDivisions: window.allDivisions,
                allClubs: window.allClubs,
                currentRoundMatches: window.currentRoundMatches
              };
              if (FootLab2 && FootLab2.Persistence && typeof FootLab2.Persistence.saveSnapshot === "function") {
                try {
                  FootLab2.Persistence.saveSnapshot(snap);
                } catch (_) {
                }
              } else {
                try {
                  localStorage.setItem("footlab_t1_save_snapshot", JSON.stringify(snap));
                } catch (_) {
                }
                try {
                  localStorage.setItem("elifoot_save_snapshot", JSON.stringify(snap));
                } catch (_) {
                }
              }
            } catch (e2) {
            }
            capDisp.textContent = newCap.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            budDisp.textContent = formatMoney(c.budget || 0);
            updateCostDisplay();
            alert(
              `Expans\xE3o aplicada: +${ccalc.seatsAdded} lugares (novo total ${newCap}). Custo: ${formatMoney(ccalc.total)}.`
            );
          });
          setTicket.addEventListener("click", () => {
            const price = Math.max(1, Math.round(Number(priceIn.value || c.ticketPrice || 20)));
            c.ticketPrice = price;
            try {
              const snap = {
                currentJornada: window.currentJornada,
                playerClub: window.playerClub,
                allDivisions: window.allDivisions,
                allClubs: window.allClubs,
                currentRoundMatches: window.currentRoundMatches
              };
              if (FootLab2 && FootLab2.Persistence && typeof FootLab2.Persistence.saveSnapshot === "function") {
                try {
                  FootLab2.Persistence.saveSnapshot(snap);
                } catch (_) {
                }
              } else {
                try {
                  localStorage.setItem("footlab_t1_save_snapshot", JSON.stringify(snap));
                } catch (_) {
                }
                try {
                  localStorage.setItem("elifoot_save_snapshot", JSON.stringify(snap));
                } catch (_) {
                }
              }
            } catch (e2) {
            }
            alert("Pre\xE7o do bilhete atualizado para " + formatMoney(price));
            updateCostDisplay();
          });
        } catch (e2) {
        }
      }, 10);
    } catch (e2) {
      try {
        const L = window.FootLab && window.FootLab.Logger || window.Elifoot && window.Elifoot.Logger || console;
        L.warn && L.warn("renderFinance failed", e2);
      } catch (_) {
      }
    }
  }
  if (typeof window !== "undefined") {
    window.FootLab = window.FootLab || window.Elifoot || {};
    window.FootLab.Hub = window.FootLab.Hub || {};
    window.FootLab.Hub.renderFinance = window.FootLab.Hub.renderFinance || renderFinance;
    window.renderFinance = window.renderFinance || renderFinance;
    window.Elifoot = window.Elifoot || window.FootLab;
  }

  // src/ui/tactics.mjs
  function initTacticPanel() {
    const tacticList = document.getElementById("tacticList");
    const tactics = window.FootLab && window.FootLab.TACTICS || window.TACTICS;
    if (!tacticList || !tactics) return;
    tacticList.innerHTML = "";
    const team = window.FootLab && window.FootLab.playerClub && window.FootLab.playerClub.team;
    const profile = { CB: 0, LB: 0, RB: 0, CM: 0, LW: 0, RW: 0, ST: 0, GK: 0 };
    if (team && Array.isArray(team.players)) {
      team.players.forEach((p) => {
        const pos = (p.position || "").toUpperCase();
        if (Object.prototype.hasOwnProperty.call(profile, pos)) profile[pos]++;
        else if (pos === "DF") profile.CB++;
        else if (pos === "MF" || pos === "AM" || pos === "DM") profile.CM++;
        else if (pos === "FW" || pos === "SS") profile.ST++;
      });
    }
    function tacticCompatible(tactic) {
      if (!tactic || !tactic.requires) return true;
      const req = tactic.requires;
      if (req.threeAtBack) {
        if ((profile.CB || 0) < 3) return false;
      }
      if (req.wingers) {
        const wide = (profile.LW || 0) + (profile.RW || 0);
        if (wide < 2) return false;
      }
      const reqStrikers = typeof req.strikers === "number" ? req.strikers : (function() {
        try {
          const parts = tactic && tactic.name && tactic.name.match(/\d+/g) || [];
          if (parts.length === 0) return null;
          return parseInt(parts[parts.length - 1], 10);
        } catch (e2) {
          return null;
        }
      })();
      if (reqStrikers != null) {
        if ((profile.ST || 0) < reqStrikers) return false;
      }
      return true;
    }
    tactics.forEach((tactic) => {
      if (!tacticCompatible(tactic)) return;
      const tacticItem = document.createElement("div");
      tacticItem.className = "tactic-item";
      tacticItem.textContent = `${tactic.name}`;
      tacticItem.dataset.tactic = tactic.name;
      if (window.FootLab && window.FootLab.playerClub && window.FootLab.playerClub.team) {
        const teamBg = window.FootLab.playerClub.team.bgColor || "#2E7D32";
        const teamSec = window.FootLab.playerClub.team.color || "#ffffff";
        const rgb = hexToRgb(teamBg) || [34, 125, 50];
        const alphaBg = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.12)`;
        const borderColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.28)`;
        tacticItem.style.backgroundColor = alphaBg;
        tacticItem.style.border = `1px solid ${borderColor}`;
        tacticItem.style.color = getReadableTextColor(teamBg, teamSec);
      }
      if (window.FootLab && window.FootLab.playerClub && window.FootLab.playerClub.team.tactic === tactic.name) {
        tacticItem.classList.add("active");
        if (window.FootLab && window.FootLab.playerClub && window.FootLab.playerClub.team) {
          const teamBg2 = window.FootLab.playerClub.team.bgColor || "#2E7D32";
          const rgb2 = hexToRgb(teamBg2) || [34, 125, 50];
          tacticItem.style.backgroundColor = `rgba(${rgb2[0]}, ${rgb2[1]}, ${rgb2[2]}, 0.26)`;
          tacticItem.style.border = `2px solid rgba(${rgb2[0]}, ${rgb2[1]}, ${rgb2[2]}, 0.6)`;
          tacticItem.style.boxShadow = `0 12px 30px rgba(${rgb2[0]}, ${rgb2[1]}, ${rgb2[2]}, 0.22), inset 0 0 0 1px rgba(255,255,255,0.03)`;
          const outlineColor = getReadableTextColor(
            teamBg2,
            window.FootLab && window.FootLab.playerClub && window.FootLab.playerClub.team && window.FootLab.playerClub.team.color || window.Elifoot && window.Elifoot.playerClub && window.Elifoot.playerClub.team && window.Elifoot.playerClub.team.color || "#ffffff"
          );
          tacticItem.style.outline = `3px solid ${outlineColor}`;
          tacticItem.style.outlineOffset = "3px";
          tacticItem.style.zIndex = "3";
        }
      }
      tacticItem.addEventListener("click", () => {
        if (!window.FootLab || !window.FootLab.playerClub) return;
        window.FootLab.playerClub.team.tactic = tactic.name;
        window.FootLab.playerClub.team.tacticData = tactic;
        const teamBg = window.FootLab && window.FootLab.playerClub && window.FootLab.playerClub.team && window.FootLab.playerClub.team.bgColor || window.Elifoot && window.Elifoot.playerClub && window.Elifoot.playerClub.team && window.Elifoot.playerClub.team.bgColor || "#2E7D32";
        const rgb = hexToRgb(teamBg) || [34, 125, 50];
        document.querySelectorAll(".tactic-item").forEach((item) => {
          item.classList.remove("active");
          if (item.dataset.tactic === tactic.name) {
            item.classList.add("active");
            item.style.backgroundColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.26)`;
            item.style.border = `2px solid rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.6)`;
            item.style.boxShadow = `0 12px 30px rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.26), inset 0 0 0 1px rgba(255,255,255,0.04)`;
            const outlineColor = getReadableTextColor(
              window.FootLab.playerClub.team.bgColor || teamBg,
              window.FootLab.playerClub.team.color || "#ffffff"
            );
            item.style.outline = `3px solid ${outlineColor}`;
            item.style.outlineOffset = "3px";
            item.style.transform = "translateY(-4px)";
            item.style.zIndex = "5";
          } else {
            item.style.backgroundColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.12)`;
            item.style.border = `1px solid rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.28)`;
            item.style.boxShadow = "none";
            item.style.transform = "translateY(0)";
            item.style.outline = "none";
            item.style.zIndex = "";
          }
        });
        const renderFn = window.FootLab && window.FootLab.renderHubContent || window.renderHubContent;
        if (typeof renderFn === "function") renderFn("menu-team");
      });
      tacticList.appendChild(tacticItem);
    });
    try {
      const L = window.FootLab && window.FootLab.Logger ? window.FootLab.Logger : console;
      L.info && L.info("Painel de t\xE1ticas inicializado");
    } catch (_) {
    }
  }
  if (typeof window !== "undefined") {
    window.Tactics = window.Tactics || {};
    window.Tactics.initTacticPanel = window.Tactics.initTacticPanel || initTacticPanel;
    window.initTacticPanel = window.initTacticPanel || initTacticPanel;
    window.FootLab = window.FootLab || {};
    window.FootLab.Tactics = window.FootLab.Tactics || {};
    window.FootLab.Tactics.initTacticPanel = window.FootLab.Tactics.initTacticPanel || initTacticPanel;
    window.FootLab.initTacticPanel = window.FootLab.initTacticPanel || initTacticPanel;
    window.Elifoot = window.Elifoot || window.FootLab;
  }

  // src/ui/hub-controller.mjs
  var hub_controller_exports = {};
  __export(hub_controller_exports, {
    default: () => hub_controller_default,
    initHubUI: () => initHubUI,
    renderHubContent: () => renderHubContent2,
    updateBudgetDisplays: () => updateBudgetDisplays
  });
  var FootLab = window.FootLab || window.Elifoot || window;
  function updateBudgetDisplays(club) {
    try {
      const headerBudget = document.getElementById("club-budget");
      const finBudget = document.getElementById("clubBudgetDisplay");
      const revEl = document.getElementById("club-revenue");
      const expEl = document.getElementById("club-expenses");
      const val = Number(club && (Number(club.budget) || 0) || 0);
      if (headerBudget) headerBudget.textContent = formatMoney(val);
      if (finBudget) finBudget.textContent = formatMoney(val);
      try {
        const rev = Number(club && (Number(club.revenue) || 0) || 0);
        const exp = Number(club && (Number(club.expenses) || 0) || 0);
        if (revEl) revEl.textContent = formatMoney(rev);
        if (expEl) expEl.textContent = formatMoney(exp);
      } catch (e2) {
      }
    } catch (e2) {
    }
  }
  function renderHubContent2(menuId) {
    const content = document.getElementById("hub-main-content");
    if (!content) return;
    switch (menuId) {
      case "menu-team":
        try {
          renderTeamRoster2(window.playerClub);
        } catch (e2) {
          if (typeof window.renderTeamRoster === "function")
            window.renderTeamRoster(window.playerClub);
        }
        break;
      case "menu-transfers":
        try {
          renderTransfers();
        } catch (e2) {
          if (typeof window.renderTransfers === "function") window.renderTransfers();
        }
        break;
      case "menu-finance":
        try {
          renderFinance(window.playerClub);
        } catch (e2) {
          if (typeof window.renderFinance === "function") window.renderFinance(window.playerClub);
        }
        break;
      case "menu-next-match":
        try {
          const html = window.Hub && window.Hub.buildNextOpponentHtml && typeof window.Hub.buildNextOpponentHtml === "function" ? window.Hub.buildNextOpponentHtml() : typeof buildNextOpponentHtml === "function" ? buildNextOpponentHtml() : "<h2>Pr\xF3ximo Jogo</h2>";
          content.innerHTML = `<h2>Pr\xF3ximo Jogo</h2><div id="nextMatchDetails">${html}</div>`;
        } catch (e2) {
          content.innerHTML = '<h2>Pr\xF3ximo Jogo</h2><div id="nextMatchDetails">\u2014</div>';
        }
        break;
      case "menu-liga":
        try {
          if (typeof window.renderLeagueTable === "function") window.renderLeagueTable();
        } catch (e2) {
        }
        break;
      case "menu-standings":
        try {
          if (typeof window.renderAllDivisionsTables === "function")
            window.renderAllDivisionsTables();
        } catch (e2) {
        }
        break;
      case "menu-load":
        try {
          const snap = FootLab && FootLab.Persistence && typeof FootLab.Persistence.loadSnapshot === "function" ? FootLab.Persistence.loadSnapshot() : (function() {
            try {
              const raw = localStorage.getItem("footlab_t1_save_snapshot") || localStorage.getItem("elifoot_save_snapshot");
              return raw ? JSON.parse(raw) : null;
            } catch (e2) {
              return null;
            }
          })();
          if (!snap) {
            content.innerHTML = "<h2>Carregar Jogo</h2><p>Nenhum jogo salvo encontrado.</p>";
            break;
          }
          const html = `<h2>Jogo salvo</h2><div style="padding:12px;background:rgba(0,0,0,0.06);border-radius:8px;"><div><strong>Jornada:</strong> ${snap.currentJornada || "-"} </div><div><strong>Clube do jogador:</strong> ${snap.playerClub && snap.playerClub.team && snap.playerClub.team.name || "-"}</div><div style="margin-top:10px;"><button id="loadSavedBtn" style="padding:8px 12px;border-radius:8px;border:none;">Carregar jogo salvo</button></div></div>`;
          content.innerHTML = html;
          const btn = document.getElementById("loadSavedBtn");
          if (btn)
            btn.addEventListener("click", () => {
              if (typeof window.loadSavedGame === "function") window.loadSavedGame();
            });
        } catch (e2) {
          content.innerHTML = "<h2>Carregar Jogo</h2><p>Erro ao ler o save.</p>";
        }
        break;
      case "save-game":
        try {
          content.innerHTML = `<h2>Gravar Jogo</h2><p>Guarde o estado atual do jogo para carregar mais tarde.</p><div style="margin-top:10px;"><button id="doSaveBtn" style="padding:8px 12px;border-radius:8px;border:none;">Gravar agora</button></div>`;
          const btn = document.getElementById("doSaveBtn");
          if (btn)
            btn.addEventListener("click", () => {
              try {
                const snap = {
                  currentJornada: window.currentJornada,
                  playerClub: window.playerClub,
                  allDivisions: window.allDivisions,
                  allClubs: window.allClubs,
                  currentRoundMatches: window.currentRoundMatches
                };
                if (FootLab && FootLab.Persistence && typeof FootLab.Persistence.saveSnapshot === "function") {
                  try {
                    FootLab.Persistence.saveSnapshot(snap);
                  } catch (_) {
                  }
                } else {
                  try {
                    localStorage.setItem("footlab_t1_save_snapshot", JSON.stringify(snap));
                  } catch (_) {
                  }
                  try {
                    localStorage.setItem("elifoot_save_snapshot", JSON.stringify(snap));
                  } catch (_) {
                  }
                }
                alert("Jogo gravado com sucesso.");
              } catch (e2) {
                alert("Erro ao gravar o jogo: " + (e2 && e2.message));
              }
            });
        } catch (e2) {
          content.innerHTML = "<h2>Gravar Jogo</h2><p>Erro ao preparar grava\xE7\xE3o.</p>";
        }
        break;
      default:
        content.innerHTML = "<h2>Bem-vindo!</h2><p>Selecione uma op\xE7\xE3o no menu.</p>";
    }
  }
  function initHubUI(playerClub2) {
    const E = window.FootLab || window.Elifoot || window;
    try {
      const L = E && E.Logger || console;
      L.debug && L.debug("Initializing Hub Controller with playerClub:", playerClub2);
    } catch (_) {
    }
    if (playerClub2 && !E.playerClub) E.playerClub = playerClub2;
    const club = E.playerClub;
    try {
      const coachNameDisplay = document.getElementById("coachNameDisplay");
      const playerTeamNameHub = document.getElementById("playerTeamNameHub");
      const playerTeamNameFooter = document.getElementById("playerTeamNameFooter");
      if (coachNameDisplay && club && club.coach) coachNameDisplay.textContent = club.coach.name;
      if (playerTeamNameHub && club && club.team) playerTeamNameHub.textContent = club.team.name;
      if (playerTeamNameFooter && club && club.team)
        playerTeamNameFooter.textContent = club.team.name;
    } catch (e2) {
    }
    try {
      const hubScreen = document.getElementById("screen-hub");
      const hubMenu = document.getElementById("hub-menu");
      if (hubScreen && club && club.team) {
        let bg = club.team.bgColor || "#2e2e2e";
        let fg = club.team.color || "#ffffff";
        if (!/^#([0-9a-f]{3}){1,2}$/i.test(bg)) bg = "#2e2e2e";
        if (!/^#([0-9a-f]{3}){1,2}$/i.test(fg)) fg = "#ffffff";
        const bgRgb = hexToRgb(bg);
        const bgLum = luminance(bgRgb);
        const adjustColor = (hex, amt) => {
          let c = String(hex).replace("#", "");
          if (c.length === 3)
            c = c.split("").map((x) => x + x).join("");
          let num = parseInt(c, 16);
          let r = Math.min(255, Math.max(0, (num >> 16 & 255) + amt));
          let g = Math.min(255, Math.max(0, (num >> 8 & 255) + amt));
          let b = Math.min(255, Math.max(0, (num & 255) + amt));
          return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        };
        if (bgLum < 0.18) bg = adjustColor(bg, 32);
        if (bgLum > 0.85) bg = adjustColor(bg, -32);
        const hubHeader = document.getElementById("hub-header");
        if (hubHeader) {
          hubHeader.style.backgroundColor = bg;
          hubHeader.style.color = getReadableTextColor(bg);
        }
        const hubFooter = document.getElementById("hub-footer-status");
        if (hubFooter) {
          hubFooter.style.backgroundColor = bg;
          hubFooter.style.color = getReadableTextColor(bg);
        }
        hubScreen.style.backgroundImage = "none";
        hubScreen.style.backgroundColor = bg;
        hubScreen.style.setProperty("--hub-bg", bg);
        const panelBgAdjust = bgLum < 0.35 ? 18 : -22;
        const panelBg = adjustColor(bg, panelBgAdjust);
        hubScreen.style.setProperty("--hub-panel-bg", panelBg);
        hubScreen.style.color = fg;
        if (hubMenu) {
          hubMenu.style.setProperty("--team-menu-bg", panelBg);
          hubMenu.style.setProperty("--team-menu-fg", fg);
        }
      }
    } catch (e2) {
    }
    updateBudgetDisplays(club);
    renderHubContent2("menu-team");
    try {
      const opponentDetails = document.getElementById("nextOpponentDetails");
      if (opponentDetails) {
        const html = window.Hub && window.Hub.buildNextOpponentHtml && typeof window.Hub.buildNextOpponentHtml === "function" ? window.Hub.buildNextOpponentHtml() : typeof buildNextOpponentHtml === "function" ? buildNextOpponentHtml() : "\u2014";
        opponentDetails.innerHTML = html;
      }
    } catch (e2) {
    }
    initTacticPanel();
    const menuButtons = document.querySelectorAll("#hub-menu .hub-menu-btn");
    menuButtons.forEach((btn) => {
      btn.addEventListener("click", (e2) => {
        const menuId = e2.target.id;
        menuButtons.forEach((b) => {
          b.classList.remove("active");
          b.style.background = "rgba(255,255,255,0.07)";
          b.style.color = getReadableTextColor(
            E.playerClub && E.playerClub.team && E.playerClub.team.bgColor || "#2e2e2e",
            E.playerClub && E.playerClub.team && E.playerClub.team.color || "#008000"
          );
          b.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)";
        });
        e2.target.classList.add("active");
        e2.target.style.background = "linear-gradient(90deg, rgba(255,255,255,0.13) 0%, rgba(0,0,0,0.13) 100%)";
        e2.target.style.color = getReadableTextColor(
          E.playerClub && E.playerClub.team && E.playerClub.team.bgColor || "#2e2e2e",
          E.playerClub && E.playerClub.team && E.playerClub.team.color || "#008000"
        );
        e2.target.style.boxShadow = "0 6px 18px rgba(0,0,0,0.16)";
        if (menuId === "menu-team") {
          if (E && E.Offers && typeof E.Offers.showPendingReleasesPopup === "function") {
            E.Offers.showPendingReleasesPopup(() => renderHubContent2(menuId));
          } else {
            renderHubContent2(menuId);
          }
        } else {
          renderHubContent2(menuId);
        }
      });
    });
    const simulateBtn = document.getElementById("simulateBtnHub");
    if (simulateBtn && (E && typeof E.simulateDay === "function" || typeof window.simulateDay === "function")) {
      simulateBtn.addEventListener("click", (e2) => {
        try {
          if (typeof window !== "undefined" && e2 && e2.isTrusted) window.__userInitiatedSim = true;
        } catch (_) {
        }
        const simFn = E && E.simulateDay || window.simulateDay;
        if (!simFn || typeof simFn !== "function") return;
        if (E && E.Offers && typeof E.Offers.showPendingReleasesPopup === "function") {
          E.Offers.showPendingReleasesPopup(() => {
            try {
              simFn();
            } catch (err) {
              try {
                const L = E && E.Logger || console;
                L.warn && L.warn("simulateDay failed", err);
              } catch (_) {
              }
            }
          });
        } else {
          try {
            simFn();
          } catch (err) {
            try {
              const L = E && E.Logger || console;
              L.warn && L.warn("simulateDay failed", err);
            } catch (_) {
            }
          }
        }
        try {
          setTimeout(() => {
            if (typeof window !== "undefined") window.__userInitiatedSim = false;
          }, 500);
        } catch (_) {
        }
      });
    }
    try {
      initTacticPanel();
    } catch (e2) {
      try {
        if (typeof window.initTacticPanel === "function") window.initTacticPanel();
      } catch (_) {
      }
    }
  }
  window.Hub = window.Hub || {};
  window.Hub.initHubUI = window.Hub.initHubUI || initHubUI;
  window.Hub.renderHubContent = window.Hub.renderHubContent || renderHubContent2;
  window.Hub.renderTeamRoster = window.Hub.renderTeamRoster || renderTeamRoster2;
  window.Hub.renderTransfers = window.Hub.renderTransfers || renderTransfers;
  window.Hub.renderFinance = window.Hub.renderFinance || renderFinance;
  window.Hub.createFloatingOpponentBox = window.Hub.createFloatingOpponentBox || window.Hub.createFloatingOpponentBox || function() {
  };
  window.FootLab = window.FootLab || window.Elifoot || {};
  window.FootLab.Hub = window.FootLab.Hub || {};
  window.FootLab.Hub.initHubUI = window.FootLab.Hub.initHubUI || initHubUI;
  window.FootLab.Hub.renderHubContent = window.FootLab.Hub.renderHubContent || renderHubContent2;
  window.FootLab.Hub.renderTeamRoster = window.FootLab.Hub.renderTeamRoster || renderTeamRoster2;
  window.FootLab.Hub.renderTransfers = window.FootLab.Hub.renderTransfers || renderTransfers;
  window.FootLab.Hub.renderFinance = window.FootLab.Hub.renderFinance || renderFinance;
  window.Elifoot = window.Elifoot || window.FootLab;
  window.initHubUI = window.initHubUI || initHubUI;
  window.renderHubContent = window.renderHubContent || renderHubContent2;
  window.renderTeamRoster = window.renderTeamRoster || renderTeamRoster2;
  var hub_controller_default = { initHubUI, renderHubContent: renderHubContent2 };

  // src/ui/matchBoard.mjs
  function getFinance() {
    const FootLab2 = window.FootLab || window.Elifoot || {};
    return FootLab2 && FootLab2.Finance || window.Finance;
  }
  function getLogger2() {
    const FootLab2 = window.FootLab || window.Elifoot || {};
    return FootLab2 && FootLab2.Logger ? FootLab2.Logger : console;
  }
  function renderInitialMatchBoard2(allDivisions2) {
    const FootLab2 = window.FootLab || window.Elifoot || {};
    const allMatches = FootLab2 && FootLab2.currentRoundMatches || window.currentRoundMatches || [];
    if (!allMatches || !allMatches.length) return;
    const Finance = getFinance();
    try {
      const player = window.FootLab && window.FootLab.playerClub || window.Elifoot && window.Elifoot.playerClub || window.playerClub;
      const playerMatch = (allMatches || []).find(
        (m) => m.homeClub === player || m.awayClub === player
      );
      const headerSpan = document.getElementById("playerTeamNameMatch");
      if (playerMatch && headerSpan) {
        const home = playerMatch.home ? playerMatch.home.name : "Home";
        const away = playerMatch.away ? playerMatch.away.name : "Away";
        headerSpan.textContent = `${home} \xD7 ${away}`;
      }
      if ((FootLab2 && FootLab2.GAME_NAME || window.GAME_NAME) && typeof document !== "undefined") {
        const gameName = FootLab2 && FootLab2.GAME_NAME || window.GAME_NAME;
        document.title = `${gameName} \u2014 ${player && player.team ? player.team.name : ""}`;
      }
    } catch (err) {
    }
    const divisionContainers = {
      1: document.getElementById("division-1"),
      2: document.getElementById("division-2"),
      3: document.getElementById("division-3"),
      4: document.getElementById("division-4")
    };
    Object.values(divisionContainers).forEach((container) => {
      if (container) container.innerHTML = "";
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
        const divisionNames = { 1: "Division 1", 2: "Division 2", 3: "Division 3", 4: "Division 4" };
        let html = `<h3 class="division-title">${divisionNames[divisionNumber]}</h3>`;
        matches.forEach((match) => {
          const homeBg = match.home && match.home.bgColor || "#333";
          const homeSec = match.home && match.home.color || "#ffffff";
          const homeFg = getReadableTextColor(homeBg, homeSec);
          const homeBorder = homeSec;
          const awayBg = match.away && match.away.bgColor || "#333";
          const awaySec = match.away && match.away.color || "#ffffff";
          const awayFg = getReadableTextColor(awayBg, awaySec);
          const awayBorder = awaySec;
          html += `
                        <div class="match-line-new" id="match-line-${match.index}" style="display:flex; align-items:center; gap:8px;">
                            <span class="team-name home" style="color: ${homeFg}; background-color: ${homeBg}; border:2px solid ${homeBorder};">${match.home.name}</span>
                            <span class="home-goals" style="width:28px; text-align:center; font-weight:700;">0</span>
                            <span class="separator">-</span>
                            <span class="away-goals" style="width:28px; text-align:center; font-weight:700;">0</span>
                            <span class="team-name away" style="color: ${awayFg}; background-color: ${awayBg}; border:2px solid ${awayBorder};">${match.away.name}</span>
                            <span class="last-goal" style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:inherit; font-size:0.95em;"></span>
                            <span class="spectators" style="display:inline-block; width:6ch; min-width:6ch; max-width:6ch; text-align:right; font-variant-numeric: tabular-nums;">\u2014</span>
                        </div>
                    `;
        });
        container.innerHTML = html;
        try {
          matches.forEach((match) => {
            const el = document.getElementById(`match-line-${match.index}`);
            if (!el) return;
            const specEl = el.querySelector(".spectators");
            if (!specEl) return;
            let attendance = null;
            try {
              if (typeof match.attendance !== "undefined") attendance = match.attendance;
              else if (Finance && typeof Finance.computeMatchAttendance === "function") {
                const a = Finance.computeMatchAttendance(match);
                attendance = a && typeof a.attendance !== "undefined" ? a.attendance : null;
              }
            } catch (e2) {
              attendance = null;
            }
            specEl.textContent = attendance === null || typeof attendance === "undefined" ? "\u2014" : `${attendance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
          });
        } catch (e2) {
        }
      }
    });
    try {
      adjustMatchBoardSizing();
    } catch (e2) {
    }
  }
  function updateMatchBoardLine2(matchIndex, matchResult) {
    const FootLab2 = window.FootLab || window.Elifoot || {};
    const DEBUG_MATCH_SIM = FootLab2 && FootLab2.DEBUG_MATCH_SIM || window.DEBUG_MATCH_SIM;
    if (DEBUG_MATCH_SIM) {
      try {
        const L = FootLab2 && FootLab2.Logger ? FootLab2.Logger : console;
        L.debug && L.debug("DBG updateMatchBoardLine called", {
          matchIndex,
          hasGoals: Array.isArray(matchResult.goals) ? matchResult.goals.length : 0
        });
      } catch (e2) {
      }
    }
    const lineElement = document.getElementById(`match-line-${matchIndex}`);
    if (!lineElement) {
      if (window.DEBUG_MATCH_SIM)
        try {
          const L = getLogger2();
          L.warn && L.warn("DBG updateMatchBoardLine: element not found for index", matchIndex);
        } catch (e2) {
        }
      return;
    }
    const homeGoalsEl = lineElement.querySelector(".home-goals");
    const awayGoalsEl = lineElement.querySelector(".away-goals");
    const lastGoalEl = lineElement.querySelector(".last-goal");
    if (homeGoalsEl) homeGoalsEl.textContent = matchResult.homeGoals;
    if (awayGoalsEl) awayGoalsEl.textContent = matchResult.awayGoals;
    const lastGoal = Array.isArray(matchResult.goals) && matchResult.goals.length ? matchResult.goals[matchResult.goals.length - 1] : null;
    if (lastGoal && lastGoalEl) {
      const isHome = lastGoal.team === "home";
      const team = isHome ? matchResult.home : matchResult.away;
      const bg = team.bgColor || "#333";
      const fg = getReadableTextColor(bg, team.color || "#fff");
      const playerName = lastGoal.player || (lastGoal.scorer ? lastGoal.scorer : "Jogador");
      lastGoalEl.innerHTML = `(${lastGoal.minute}') <span style="background:${bg};color:${fg};padding:2px 6px;border-radius:3px;font-weight:bold;text-shadow:0 1px 2px #0008;">${playerName}</span>`;
    }
    try {
      const specEl = lineElement.querySelector(".spectators");
      let attendance = null;
      if (typeof matchResult.attendance !== "undefined") {
        attendance = matchResult.attendance;
      } else if (getFinance() && typeof getFinance().computeMatchAttendance === "function") {
        try {
          attendance = getFinance().computeMatchAttendance(matchResult).attendance;
        } catch (e2) {
          attendance = null;
        }
      }
      if (specEl) {
        specEl.textContent = attendance === null || typeof attendance === "undefined" ? "\u2014" : `${attendance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
      }
    } catch (e2) {
    }
  }
  function adjustMatchBoardSizing() {
    const board = document.getElementById("match-board");
    if (!board) return;
    const lines = board.querySelectorAll(".match-line-new");
    const totalLines = lines ? lines.length : 0;
    if (!totalLines) return;
    const viewportH = window.innerHeight || document.documentElement.clientHeight;
    const boardRect = board.getBoundingClientRect();
    const progressH = document.getElementById("progress-container") && document.getElementById("progress-container").offsetHeight || 0;
    const footerH = document.getElementById("hub-footer-status") && document.getElementById("hub-footer-status").offsetHeight || 0;
    const reserved = progressH + footerH + 80;
    const availableForBoard = Math.max(100, viewportH - boardRect.top - reserved);
    const headers = board.querySelectorAll(".division-title");
    let headersTotal = 0;
    headers.forEach((h) => headersTotal += h.offsetHeight || 30);
    const verticalHeadersHeight = headersTotal / 2;
    const gapTotal = 40;
    const availableForLines = Math.max(60, availableForBoard - verticalHeadersHeight - gapTotal);
    let target = Math.floor(availableForLines / (totalLines / 2));
    if (target < 16) target = 16;
    if (target > 40) target = 40;
    try {
      document.documentElement.style.setProperty("--match-line-height", `${target}px`);
    } catch (e2) {
    }
  }
  function attachGlobals() {
    window.MatchBoard = window.MatchBoard || {};
    window.MatchBoard.renderInitialMatchBoard = renderInitialMatchBoard2;
    window.MatchBoard.updateMatchBoardLine = updateMatchBoardLine2;
    window.renderInitialMatchBoard = renderInitialMatchBoard2;
    window.updateMatchBoardLine = updateMatchBoardLine2;
    window.FootLab = window.FootLab || window.Elifoot || {};
    window.FootLab.MatchBoard = window.FootLab.MatchBoard || {};
    window.FootLab.MatchBoard.renderInitialMatchBoard = renderInitialMatchBoard2;
    window.FootLab.MatchBoard.updateMatchBoardLine = updateMatchBoardLine2;
    window.FootLab.renderInitialMatchBoard = renderInitialMatchBoard2;
    window.FootLab.updateMatchBoardLine = updateMatchBoardLine2;
    window.Elifoot = window.Elifoot || window.FootLab;
  }
  attachGlobals();
  window.addEventListener("resize", function() {
    try {
      adjustMatchBoardSizing();
    } catch (e2) {
    }
  });

  // src/ui/overlays/intro.mjs
  var intro_exports = {};
  __export(intro_exports, {
    setIntroColors: () => setIntroColors,
    showIntroOverlay: () => showIntroOverlay2
  });
  function getLogger3() {
    return window.FootLab && window.FootLab.Logger || console;
  }
  function setIntroColors(club) {
    const bg = club && club.team && club.team.bgColor || "#222";
    const fg = getReadableTextColor(bg, club && club.team && club.team.color || "#ffffff");
    const fgRgb = hexToRgb(fg);
    const blackContrast = luminance(fgRgb) > 0.5 ? 21 : 1;
    const whiteContrast = luminance(fgRgb) > 0.5 ? 1 : 21;
    const stroke = blackContrast >= whiteContrast ? "#000" : "#fff";
    const overlay = document.getElementById("intro-overlay");
    if (overlay) {
      overlay.style.setProperty("--intro-bg", bg);
      overlay.style.setProperty("--intro-fg", fg);
      overlay.style.setProperty("--intro-club-bg", bg);
      overlay.style.setProperty("--team-menu-stroke", stroke);
    }
    const hubMenu = document.getElementById("hub-menu");
    if (hubMenu) hubMenu.style.setProperty("--team-menu-stroke", stroke);
    return { bg, fg };
  }
  function showIntroOverlay2(club, cb) {
    try {
      const E = window.FootLab || window;
      const overlay = document.getElementById("intro-overlay");
      if (!overlay) {
        if (typeof cb === "function") cb();
        return;
      }
      const playerMatch = (E.currentRoundMatches || window.currentRoundMatches || []).find(
        (m) => m.homeClub === club || m.awayClub === club
      );
      const isHome = playerMatch && playerMatch.homeClub === club;
      const starters = playerMatch ? isHome ? playerMatch.homePlayers : playerMatch.awayPlayers : club && club.team && club.team.players ? club.team.players.slice(0, 11) : [];
      const subs = playerMatch ? isHome ? playerMatch.homeSubs || [] : playerMatch.awaySubs || [] : club && club.team && club.team.players ? club.team.players.slice(11) : [];
      const { bg, fg } = setIntroColors(club);
      overlay.style.display = "flex";
      overlay.setAttribute("aria-hidden", "false");
      overlay.style.opacity = "0";
      overlay.style.transition = "opacity 560ms ease";
      const content = document.createElement("div");
      content.className = "intro-card intro-lineup";
      content.style.background = "var(--intro-bg)";
      content.style.color = "var(--intro-fg)";
      const badge = `<div class="intro-badge" id="introBadge" style="background:${bg}; border-color:${getReadableTextColor(bg, "#ffffff")}"></div>`;
      const header = `<div class="intro-header">${badge}<div><h2 id="introTeamName">${club && club.team && club.team.name || "Equipe"}</h2><div style="opacity:0.9;">Onze inicial / Suplentes</div></div></div>`;
      const renderSimpleListItem = (p, idx) => {
        const displayPos = normalizePosition(p.position) || "";
        const skill = p.skill || 0;
        return `<li data-idx="${idx}">${displayPos} \u2014 ${p.name || "\u2014"} <span class="player-skill">(skill: ${skill})</span></li>`;
      };
      const startersList = (starters || []).map((p, i) => renderSimpleListItem(p, i)).join("");
      const subsList = (subs || []).map((p, i) => renderSimpleListItem(p, i)).join("");
      const startersHtml = `<div class="subs-col starters-col"><h3 style="margin:0 0 8px 0;">Onze Inicial</h3><ol class="intro-lineup-list">${startersList}</ol></div>`;
      const subsHtml = `<div class="subs-col subs-col-right"><h3 style="margin:0 0 8px 0;">Suplentes</h3><ol class="intro-lineup-list">${subsList}</ol></div>`;
      content.innerHTML = `${header}<div class="subs-columns">${startersHtml}${subsHtml}</div>`;
      overlay.innerHTML = "";
      overlay.appendChild(content);
      requestAnimationFrame(() => {
        overlay.style.opacity = "1";
      });
      setTimeout(() => {
        overlay.style.opacity = "0";
        setTimeout(() => {
          overlay.style.display = "none";
          overlay.setAttribute("aria-hidden", "true");
          if (typeof cb === "function") cb();
        }, 360);
      }, 2200);
    } catch (e2) {
      try {
        const L = getLogger3();
        L.warn && L.warn("showIntroOverlay failed", e2);
      } catch (_) {
      }
      if (typeof cb === "function") cb();
    }
  }
  if (typeof window !== "undefined") {
    window.FootLab = window.FootLab || {};
    window.FootLab.Overlays = window.FootLab.Overlays || {};
    window.FootLab.Overlays.setIntroColors = window.FootLab.Overlays.setIntroColors || setIntroColors;
    window.FootLab.Overlays.showIntroOverlay = window.FootLab.Overlays.showIntroOverlay || showIntroOverlay2;
    window.Elifoot = window.Elifoot || window.FootLab;
  }

  // src/ui/overlays/halftime.mjs
  var halftime_exports = {};
  __export(halftime_exports, {
    showHalfTimeSubsOverlay: () => showHalfTimeSubsOverlay2
  });
  function getLogger4() {
    return window.FootLab && window.FootLab.Logger || console;
  }
  function showHalfTimeSubsOverlay2(club, match, cb) {
    try {
      let applyPair = function(pairIndex) {
        const pr = pairs[pairIndex];
        if (!pr || pr.applied) return;
        const outIdx = pr.outIdx;
        const inIdx = pr.inIdx;
        if (isHome) {
          const outPlayer = match.homePlayers[outIdx];
          const incoming = match.homeSubs[inIdx];
          if (outPlayer && incoming) {
            match.homePlayers[outIdx] = incoming;
            const sidx = match.homeSubs.findIndex((s) => s.name === incoming.name);
            if (sidx >= 0) match.homeSubs.splice(sidx, 1);
            match.homeSubs.push(outPlayer);
          }
        } else {
          const outPlayer = match.awayPlayers[outIdx];
          const incoming = match.awaySubs[inIdx];
          if (outPlayer && incoming) {
            match.awayPlayers[outIdx] = incoming;
            const sidx = match.awaySubs.findIndex((s) => s.name === incoming.name);
            if (sidx >= 0) match.awaySubs.splice(sidx, 1);
            match.awaySubs.push(outPlayer);
          }
        }
        try {
          if (window.FootLab && window.FootLab.Lineups && typeof window.FootLab.Lineups.reorderMatchByRoster === "function")
            window.FootLab.Lineups.reorderMatchByRoster(club, match, isHome);
        } catch (e2) {
        }
        pr.applied = true;
        renderLists();
        renderPairs();
        try {
          if (typeof window.updateMatchBoardLine === "function" && typeof match.index !== "undefined")
            window.updateMatchBoardLine(match.index, match);
        } catch (e2) {
        }
      };
      const overlay = document.getElementById("subs-overlay");
      if (!overlay) {
        if (typeof cb === "function") cb();
        return;
      }
      try {
        if (overlay.parentElement !== document.body) document.body.appendChild(overlay);
      } catch (e2) {
      }
      const isHome = match.homeClub === club;
      const starters = isHome ? match.homePlayers || [] : match.awayPlayers || [];
      const subs = isHome ? match.homeSubs || [] : match.awaySubs || [];
      overlay.innerHTML = "";
      try {
        overlay.style.setProperty("position", "fixed", "important");
        overlay.style.setProperty("left", "0", "important");
        overlay.style.setProperty("top", "0", "important");
        overlay.style.setProperty("width", "100vw", "important");
        overlay.style.setProperty("height", "100vh", "important");
        overlay.style.setProperty("z-index", "2147483647", "important");
        overlay.style.setProperty("display", "flex", "important");
        overlay.style.setProperty("justify-content", "center", "important");
        overlay.style.setProperty("align-items", "center", "important");
        overlay.style.setProperty(
          "background",
          "var(--subs-overlay-bg, rgba(0,0,0,0.66))",
          "important"
        );
      } catch (e2) {
      }
      const _prevBodyOverflow = document.body.style.overflow;
      try {
        document.body.style.overflow = "hidden";
      } catch (e2) {
      }
      overlay.setAttribute("aria-hidden", "false");
      const hubMenu = document.getElementById("hub-menu");
      const hubMenuPrev = hubMenu ? {
        bg: hubMenu.style.getPropertyValue("--team-menu-bg"),
        fg: hubMenu.style.getPropertyValue("--team-menu-fg")
      } : null;
      let teamBg = club && club.team && club.team.bgColor || "#2e2e2e";
      let teamSec = club && club.team && club.team.color || "#ffffff";
      const fg = getReadableTextColor(teamBg, teamSec);
      const rgb = hexToRgb(teamBg) || [34, 34, 34];
      const panelBg = `linear-gradient(rgba(0,0,0,0.48), rgba(0,0,0,0.28)), rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.9)`;
      try {
        if (hubMenu && club && club.team) {
          hubMenu.style.setProperty("--team-menu-bg", teamBg);
          hubMenu.style.setProperty("--team-menu-fg", fg);
        }
        overlay.style.setProperty("--subs-fg", fg);
        overlay.style.setProperty("--subs-overlay-bg", "rgba(0,0,0,0.66)");
        overlay.style.setProperty("--subs-panel-bg", panelBg);
      } catch (e2) {
      }
      const panel = document.createElement("div");
      panel.className = "subs-panel";
      panel.className = "subs-panel";
      panel.style.color = fg;
      panel.style.position = "relative";
      const homeGoals = typeof match.homeGoals === "number" ? match.homeGoals : 0;
      const awayGoals = typeof match.awayGoals === "number" ? match.awayGoals : 0;
      const scoreText = `${homeGoals} - ${awayGoals}`;
      const rawSubsForPanel = subs || [];
      panel.innerHTML = [
        `<div class="subs-header"><div class="subs-title"><div class="team-badge" style="background:${teamBg}"></div><div>Substitui\xE7\xF5es ao Intervalo \u2014 <span class="subs-team-name">${club.team.name}</span></div></div><div class="subs-meta"><span class="subs-score">${scoreText}</span></div></div>`,
        `<div class="subs-body">`,
        `<div class="subs-columns">`,
        `<div class="subs-col starters-col"><h3 style="margin:0 0 8px 0;">Onze Inicial</h3><ol class="starters-list">${starters.map((p, si) => `<li data-si='${si}' data-name='${p.name}' data-pos='${p.position}'><span class="player-pos-badge">${normalizePosition(p.position)}</span><span class="player-name">${p.name}</span><span class="player-skill">${p.skill || 0}</span></li>`).join("")}</ol></div>`,
        `<div class="subs-col subs-col-right"><h3 style="margin:0 0 8px 0;">Suplentes</h3><ul class="subs-list">${rawSubsForPanel.map((p, idx) => {
          const cls = normalizePosition(p.position || p.pos || "") === "GK" ? "is-gk" : "";
          return `<li class="${cls}" data-idx='${idx}' data-name='${p.name}' data-pos='${p.position}'><span class="player-pos-badge">${normalizePosition(p.position)}</span><span class="player-name">${p.name}</span><span class="player-skill">${p.skill || 0}</span></li>`;
        }).join("")}</ul></div>`,
        `</div>`,
        `</div>`,
        `<div class="subs-actions">`,
        `<div id="subs-pairs" class="subs-pairs"></div>`,
        `<button id="subsBackToGameBtn" class="subs-back-btn">Voltar ao Jogo</button>`,
        `</div>`,
        `<div class="subs-footer">Regras: apenas 5 substitui\xE7\xF5es; GR pode ser substitu\xEDdo s\xF3 por GR.</div>`
      ].join("");
      overlay.appendChild(panel);
      try {
        const teamRgb = hexToRgb(teamBg) || [34, 34, 34];
        const teamLum = luminance(teamRgb);
        const panelSurface = teamLum < 0.45 ? "rgba(255,255,255,0.94)" : "rgba(10,10,10,0.92)";
        const itemSurface = teamLum < 0.45 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.02)";
        const borderColor = teamLum < 0.45 ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)";
        overlay.style.setProperty("--subs-panel-bg", panelSurface);
        panel.style.background = panelSurface;
        const panelTextColor = teamLum < 0.45 ? "#111" : "#fff";
        panel.style.color = panelTextColor;
        overlay.style.setProperty("--subs-fg", panelTextColor);
        panel.querySelectorAll(".subs-col").forEach((col) => {
          col.style.background = itemSurface;
          col.style.border = `1px solid ${borderColor}`;
          col.style.boxShadow = "inset 0 1px 0 rgba(0,0,0,0.04)";
          col.style.color = panelTextColor;
        });
        panel.querySelectorAll(".starters-list, .subs-list").forEach((list) => {
          list.style.maxHeight = "60vh";
          list.style.overflowY = "auto";
          list.style.margin = "0";
          list.style.padding = "6px";
          list.style.display = "block";
        });
        const liBgFull = teamLum < 0.45 ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";
        panel.querySelectorAll(".subs-list li, .starters-list li").forEach((li) => {
          li.style.borderBottom = "none";
          li.style.padding = "8px 12px";
          li.style.backgroundClip = "padding-box";
          li.style.color = panelTextColor;
          li.style.background = liBgFull;
          li.style.borderRadius = "8px";
          li.style.display = "flex";
          li.style.alignItems = "center";
          li.style.justifyContent = "space-between";
        });
        const headerNode = panel.querySelector("h2");
        if (headerNode) headerNode.style.background = teamBg;
      } catch (e2) {
      }
      setTimeout(() => {
        const backBtn = panel.querySelector("#subsBackToGameBtn");
        if (backBtn) {
          backBtn.onclick = () => {
            try {
              if (document.activeElement && typeof document.activeElement.blur === "function")
                document.activeElement.blur();
            } catch (e2) {
            }
            try {
              if (selectedOut && typeof selectedOut.idx === "number" && selectedSubIdx !== null) {
                pairs.push({ outIdx: selectedOut.idx, inIdx: selectedSubIdx, applied: false });
                selectedOut = null;
                selectedSubIdx = null;
                renderPairs();
              }
              pairs.forEach((pr, idx) => {
                try {
                  if (!pr.applied) applyPair(idx);
                } catch (e2) {
                }
              });
            } catch (e2) {
              try {
                const L = getLogger4();
                L.warn && L.warn("Error auto-applying substitutions on close", e2);
              } catch (_) {
              }
            }
            if (hubMenu && hubMenuPrev) {
              if (hubMenuPrev.bg) hubMenu.style.setProperty("--team-menu-bg", hubMenuPrev.bg);
              if (hubMenuPrev.fg) hubMenu.style.setProperty("--team-menu-fg", hubMenuPrev.fg);
            }
            overlay.style.display = "none";
            overlay.setAttribute("aria-hidden", "true");
            try {
              document.body.style.overflow = _prevBodyOverflow || "";
            } catch (e2) {
            }
            if (typeof cb === "function") cb();
          };
        }
      }, 0);
      const pairsContainer = panel.querySelector("#subs-pairs");
      let selectedOut = null;
      let selectedSubIdx = null;
      const pairs = [];
      const renderLists = function() {
        const startersHtml = (isHome ? match.homePlayers : match.awayPlayers).map(
          (p, si) => `<li data-si="${si}" data-name="${p.name}" data-pos="${normalizePosition(p.position)}"><span class="player-pos-badge">${normalizePosition(p.position)}</span> <span class="player-name">${p.name}</span> <span class="player-skill">(skill: ${p.skill || 0})</span></li>`
        ).join("");
        const rawSubs = isHome ? match.homeSubs || [] : match.awaySubs || [];
        const subsHtml = rawSubs.map((p, idx) => {
          const cls = normalizePosition(p.position || p.pos || "") === "GK" ? "is-gk" : "";
          return `<li class="${cls}" data-idx="${idx}" data-name="${p.name}" data-pos="${p.position}"><span class="player-pos-badge">${normalizePosition(p.position)}</span> <span class="player-name">${p.name}</span> <span class="player-skill">(skill: ${p.skill || 0})</span></li>`;
        }).join("");
        const startersCol = panel.querySelector(".starters-col .starters-list");
        const subsCol = panel.querySelector(".subs-col-right .subs-list");
        if (startersCol) startersCol.innerHTML = startersHtml;
        if (subsCol) subsCol.innerHTML = subsHtml;
        attachListHandlers();
      };
      const renderPairs = function() {
        pairsContainer.innerHTML = `<strong>Trocas:</strong><ul>${pairs.map((pr, i) => {
          const out = (isHome ? match.homePlayers : match.awayPlayers)[pr.outIdx] || {
            name: "-",
            position: ""
          };
          const incoming = (isHome ? match.homeSubs : match.awaySubs)[pr.inIdx] || {
            name: "-",
            position: ""
          };
          const appliedCls = pr.applied ? "applied" : "";
          const statusNode = pr.applied ? `<button disabled>aplicada</button>` : `<span class="pending">pendente</span>`;
          return `<li class="${appliedCls}" data-pair="${i}">${normalizePosition(out.position)} ${out.name} \u2192 ${normalizePosition(incoming.position)} ${incoming.name} ${statusNode} <button data-remove="${i}">remover</button></li>`;
        }).join("")}</ul>`;
        pairsContainer.querySelectorAll("button[data-remove]").forEach((btn) => {
          btn.addEventListener("click", (e2) => {
            const idx = Number(btn.getAttribute("data-remove"));
            const pr = pairs[idx];
            if (!pr) return;
            const outNode = panel.querySelector(`.starters-list li[data-si="${pr.outIdx}"]`);
            const inNode = panel.querySelector(`.subs-list li[data-idx="${pr.inIdx}"]`);
            if (outNode) outNode.classList.remove("paired");
            if (inNode) inNode.classList.remove("paired");
            pairs.splice(idx, 1);
            renderPairs();
            const MAX_SUBS = window.FootLab && window.FootLab.GameConfig && window.FootLab.GameConfig.rules && window.FootLab.GameConfig.rules.maxSubs || 5;
            if (pairs.length < MAX_SUBS) {
              panel.querySelectorAll(".starters-list li.disabled").forEach((n) => n.classList.remove("disabled"));
              panel.querySelectorAll(".subs-list li.disabled").forEach((n) => n.classList.remove("disabled"));
            }
          });
        });
      };
      const attachListHandlers = function() {
        panel.querySelectorAll(".starters-list li").forEach((n) => {
          n.classList.remove("paired");
          n.classList.remove("disabled");
        });
        panel.querySelectorAll(".subs-list li").forEach((n) => {
          n.classList.remove("paired");
          n.classList.remove("disabled");
        });
        panel.querySelectorAll(".subs-list li").forEach((n) => n.classList.remove("selected-out"));
        if (selectedOut && typeof selectedOut.idx === "number") {
          panel.querySelectorAll(".starters-list li").forEach((n) => n.classList.remove("selected-out"));
          const outNode = panel.querySelector(`.starters-list li[data-si="${selectedOut.idx}"]`);
          if (outNode) outNode.classList.add("selected-out");
        }
        const startersNodes = panel.querySelectorAll(".starters-list li");
        const subsNodes = panel.querySelectorAll(".subs-list li");
        const maybeShowConfirm = function() {
          if (selectedOut && typeof selectedOut.idx === "number" && selectedSubIdx !== null) {
            const out = selectedOut.player;
            const inIdx = selectedSubIdx;
            const incoming = (isHome ? match.homeSubs : match.awaySubs)[inIdx];
            const ENFORCE_GK_ONLY = (window.FootLab && window.FootLab.GameConfig && window.FootLab.GameConfig.rules && window.FootLab.GameConfig.rules.enforceGkOnlySwap) !== false;
            if (ENFORCE_GK_ONLY) {
              if (out.position === "GK" && incoming.position !== "GK") {
                const subNode = panel.querySelector(`.subs-list li[data-idx="${inIdx}"]`);
                if (subNode) {
                  subNode.classList.add("invalid-swap");
                  setTimeout(() => subNode.classList.remove("invalid-swap"), 400);
                }
                return;
              }
              if (incoming.position === "GK" && out.position !== "GK") {
                const teamPlayers = isHome ? match.homePlayers || [] : match.awayPlayers || [];
                const hasSentOffGk = teamPlayers.some(
                  (p) => p && p.sentOff && String(p.position || "").toUpperCase() === "GK"
                );
                if (!hasSentOffGk) {
                  const subNode = panel.querySelector(`.subs-list li[data-idx="${inIdx}"]`);
                  if (subNode) {
                    subNode.classList.add("invalid-swap");
                    setTimeout(() => subNode.classList.remove("invalid-swap"), 400);
                  }
                  return;
                }
              }
            }
            const confirmDiv = document.createElement("div");
            confirmDiv.className = "subs-confirm-prompt";
            confirmDiv.style.position = "fixed";
            confirmDiv.style.left = "50%";
            confirmDiv.style.top = "50%";
            confirmDiv.style.transform = "translate(-50%, -50%)";
            confirmDiv.style.minWidth = "320px";
            confirmDiv.style.maxWidth = "90%";
            confirmDiv.style.background = panel.style.background || teamBg;
            confirmDiv.style.color = panel.style.color || fg;
            confirmDiv.style.padding = "20px 18px";
            confirmDiv.style.borderRadius = "12px";
            confirmDiv.style.boxShadow = "0 6px 28px rgba(0,0,0,0.45)";
            confirmDiv.style.zIndex = "2147483650";
            confirmDiv.style.textAlign = "center";
            confirmDiv.innerHTML = `<div>
                    <h3 style="margin:0 0 8px 0">Confirmar Substitui\xE7\xE3o?</h3>
                    <div style='margin:8px 0;font-size:1.05em;'>${out.position} <b>${out.name}</b> \u2192 ${incoming.position} <b>${incoming.name}</b></div>
                    <div style="display:flex;gap:12px;justify-content:center;margin-top:12px;"><button id="subsDoConfirmBtn" style="padding:8px 14px;border-radius:8px;">Confirmar</button>
                    <button id="subsDoCancelBtn" style="padding:8px 14px;border-radius:8px;">Cancelar</button></div>
                  </div>`;
            try {
              overlay.appendChild(confirmDiv);
            } catch (e2) {
              panel.appendChild(confirmDiv);
            }
            confirmDiv.querySelector("#subsDoConfirmBtn").onclick = () => {
              try {
                const outNode = panel.querySelector(
                  `.starters-list li[data-si="${selectedOut.idx}"]`
                );
                const subNode = panel.querySelector(`.subs-list li[data-idx="${inIdx}"]`);
                if (outNode) outNode.classList.add("paired");
                if (subNode) subNode.classList.add("paired");
                pairs.push({ outIdx: selectedOut.idx, inIdx, applied: false });
                const pairIndex = pairs.length - 1;
                applyPair(pairIndex);
                const MAX_SUBS = window.FootLab && window.FootLab.GameConfig && window.FootLab.GameConfig.rules && window.FootLab.GameConfig.rules.maxSubs || 5;
                if (pairs.length >= MAX_SUBS) {
                  panel.querySelectorAll(".starters-list li:not(.paired)").forEach((n) => n.classList.add("disabled"));
                  panel.querySelectorAll(".subs-list li:not(.paired)").forEach((n) => n.classList.add("disabled"));
                }
              } catch (err) {
                try {
                  const L = getLogger4();
                  L.warn && L.warn("Error applying substitution on confirm", err);
                } catch (_) {
                }
              } finally {
                try {
                  if (confirmDiv && confirmDiv.parentNode)
                    confirmDiv.parentNode.removeChild(confirmDiv);
                } catch (_) {
                }
                selectedOut = null;
                selectedSubIdx = null;
                panel.querySelectorAll(".starters-list li").forEach((n) => n.classList.remove("selected-out"));
              }
            };
            confirmDiv.querySelector("#subsDoCancelBtn").onclick = () => {
              try {
                if (confirmDiv && confirmDiv.parentNode)
                  confirmDiv.parentNode.removeChild(confirmDiv);
              } catch (_) {
              }
              selectedSubIdx = null;
            };
          }
        };
        startersNodes.forEach((node) => {
          node.addEventListener("click", () => {
            const si = Number(node.getAttribute("data-si"));
            if (node.classList.contains("disabled") || node.classList.contains("paired")) return;
            if (selectedOut && selectedOut.idx === si) {
              node.classList.remove("selected-out");
              selectedOut = null;
              return;
            }
            panel.querySelectorAll(".starters-list li").forEach((n) => n.classList.remove("selected-out"));
            panel.querySelectorAll(".subs-list li").forEach((n) => n.classList.remove("selected-out"));
            node.classList.add("selected-out");
            selectedOut = { idx: si, player: (isHome ? match.homePlayers : match.awayPlayers)[si] };
            maybeShowConfirm();
          });
        });
        subsNodes.forEach((node) => {
          node.addEventListener("click", () => {
            if (node.classList.contains("disabled") || node.classList.contains("paired")) return;
            if (!selectedOut) return;
            const inIdx = Number(node.getAttribute("data-idx"));
            selectedSubIdx = inIdx;
            maybeShowConfirm();
          });
        });
      };
      renderLists();
      renderPairs();
    } catch (e2) {
      try {
        const L = getLogger4();
        L.warn && L.warn("showHalfTimeSubsOverlay failed", e2);
      } catch (_) {
      }
      if (typeof cb === "function") cb();
    }
  }

  // src/ui/overlays/seasonSummary.mjs
  var seasonSummary_exports = {};
  __export(seasonSummary_exports, {
    showSeasonSummaryOverlay: () => showSeasonSummaryOverlay
  });
  function showSeasonSummaryOverlay(summary, cb) {
    try {
      const overlay = document.getElementById("season-summary-overlay");
      if (!overlay) {
        if (typeof cb === "function") cb();
        return;
      }
      overlay.innerHTML = "";
      overlay.style.display = "flex";
      overlay.setAttribute("aria-hidden", "false");
      const panel = document.createElement("div");
      panel.className = "season-summary-panel";
      panel.style.width = "min(1100px, 96vw)";
      panel.style.maxHeight = "90vh";
      panel.style.overflow = "auto";
      panel.style.padding = "18px";
      panel.style.borderRadius = "12px";
      const clubNames = summary && summary.clubs ? summary.clubs.map((c) => c.name).join(", ") : "";
      const title = `Resumo da Temporada ${summary && summary.season ? summary.season : ""}`;
      panel.innerHTML = `<h2 style="margin:0 0 12px 0;">${title}</h2><div style="margin-bottom:8px;color:rgba(0,0,0,0.6);">Clubes: ${clubNames}</div>`;
      const sections = [];
      if (summary.topScorers && summary.topScorers.length) {
        sections.push(
          "<section><h3>Artilheiros</h3><ol>" + summary.topScorers.map((s) => `<li>${s.player} (${s.club}) - ${s.goals}</li>`).join("") + "</ol></section>"
        );
      }
      if (summary.assists && summary.assists.length) {
        sections.push(
          "<section><h3>Assist\xEAncias</h3><ol>" + summary.assists.map((s) => `<li>${s.player} (${s.club}) - ${s.assists}</li>`).join("") + "</ol></section>"
        );
      }
      if (summary.awards && summary.awards.length) {
        sections.push(
          "<section><h3>Pr\xEAmios</h3><ul>" + summary.awards.map((a) => `<li>${a.title} - ${a.player} (${a.club})</li>`).join("") + "</ul></section>"
        );
      }
      panel.innerHTML += sections.join("");
      const closeBtn = document.createElement("button");
      closeBtn.textContent = "Fechar";
      closeBtn.style.marginTop = "12px";
      closeBtn.style.padding = "8px 12px";
      closeBtn.style.borderRadius = "8px";
      closeBtn.onclick = () => {
        overlay.style.display = "none";
        overlay.setAttribute("aria-hidden", "true");
        if (typeof cb === "function") cb();
      };
      overlay.appendChild(panel);
      overlay.appendChild(closeBtn);
      try {
        const dominantColor = summary && summary.dominantColor || "#2e2e2e";
        const rgb = hexToRgb(dominantColor) || [34, 34, 34];
        const fg = getReadableTextColor(dominantColor, "#ffffff");
        panel.style.background = `linear-gradient(rgba(0,0,0,0.06), rgba(0,0,0,0.02)), rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.96)`;
        panel.style.color = fg;
      } catch (e2) {
      }
    } catch (e2) {
      console.warn("showSeasonSummaryOverlay failed", e2);
      if (typeof cb === "function") cb();
    }
  }

  // src/ui/overlays/index.mjs
  var Overlays = {
    ...intro_exports,
    ...halftime_exports,
    ...seasonSummary_exports
  };
  window.FootLab = window.FootLab || {};
  window.FootLab.Overlays = window.FootLab.Overlays || {};
  Object.assign(window.FootLab.Overlays, Overlays);
  window.Elifoot = window.Elifoot || window.FootLab;

  // src/main.js
  var allDivisions = [];
  var playerClub = null;
  var allClubs = [];
  if (typeof window !== "undefined") {
    window.GAME_NAME = typeof GameConstants !== "undefined" && GameConstants.GAME_NAME || "FootLab t1";
    try {
      if (typeof document !== "undefined") document.title = window.GAME_NAME;
    } catch (e2) {
    }
  }
  var MainLogger = typeof window !== "undefined" && window.FootLab && window.FootLab.Logger ? window.FootLab.Logger : console;
  function getLogger5() {
    return typeof window !== "undefined" && window.FootLab && window.FootLab.Logger || typeof window !== "undefined" && window.Elifoot && window.Elifoot.Logger || MainLogger || console;
  }
  function setupInitialUiHandlers() {
    const introBtn = document.getElementById("introContinueBtn");
    if (introBtn) {
      introBtn.addEventListener("click", () => {
        const intro = document.getElementById("intro-screen");
        const setup = document.getElementById("screen-setup");
        if (intro) intro.style.display = "none";
        if (setup) setup.style.display = "flex";
      });
    }
    try {
      const intro = document.getElementById("intro-screen");
      const setup = document.getElementById("screen-setup");
      if (intro && setup) {
        intro.style.transition = intro.style.transition || "opacity 600ms ease, transform 600ms ease";
        setup.style.transition = setup.style.transition || "opacity 600ms ease, transform 600ms ease";
        setTimeout(() => {
          try {
            intro.style.opacity = "0";
            intro.style.transform = "translateY(-8px) scale(0.995)";
          } catch (e2) {
          }
          setTimeout(() => {
            try {
              intro.style.display = "none";
            } catch (e2) {
            }
            try {
              setup.style.display = "flex";
              setup.style.opacity = "0";
              setup.style.transform = "translateY(6px)";
              setup.offsetWidth;
              setup.style.opacity = "1";
              setup.style.transform = "none";
            } catch (e2) {
            }
          }, 620);
        }, 900);
      }
    } catch (e2) {
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupInitialUiHandlers);
  } else {
    try {
      setupInitialUiHandlers();
    } catch (e2) {
      try {
        const L = getLogger5();
        L.warn && L.warn("setupInitialUiHandlers failed", e2);
      } catch (_) {
      }
    }
  }
  async function validateGameData() {
    const L = getLogger5();
    L.info("Waiting for divisions data...");
    const waitFn = window && window.waitForDivisionsData || window && window.FootLab && window.FootLab.waitForDivisionsData;
    if (typeof waitFn === "function") {
      await waitFn(3e3);
    }
    const requireArchived = window.FootLab && window.FootLab.GameConfig && window.FootLab.GameConfig.requireArchivedRosters;
    const realCount = window.REAL_ROSTERS ? Object.keys(window.REAL_ROSTERS).length : 0;
    if (requireArchived && realCount < 72) {
      throw new Error("Rosters incompletos ou em falta.");
    }
    const totalTeams = (window.divisionsData || []).reduce(
      (acc, d) => acc + (d && d.teams && d.teams.length || 0),
      0
    );
    if (totalTeams === 0) {
      throw new Error("Nenhuma equipa carregada em divisionsData.");
    }
    return true;
  }
  function initializeGameSession() {
    const L = getLogger5();
    L.info("Generating all clubs...");
    allClubs = generateAllClubs();
    allDivisions = [[], [], [], []];
    allClubs.forEach((club) => {
      if (club.division >= 1 && club.division <= 4) {
        allDivisions[club.division - 1].push(club);
      }
    });
    const division4 = allDivisions[3];
    if (!division4 || division4.length === 0) {
      throw new Error("Divis\xE3o 4 est\xE1 vazia.");
    }
    if (typeof assignRandomShortContracts === "function") assignRandomShortContracts(allDivisions);
    if (typeof applySkillCaps === "function") applySkillCaps(allDivisions);
    const pool = division4.length > 8 ? division4.slice(-8) : division4.slice();
    playerClub = pool[Math.floor(Math.random() * pool.length)];
    window.playerClub = playerClub;
    window.allDivisions = allDivisions;
    window.allClubs = allClubs;
    if (typeof generateRounds === "function") {
      const firstRoundMatches = [];
      allDivisions.forEach((div) => {
        const rounds = generateRounds(div);
        if (rounds.length > 0) firstRoundMatches.push(...rounds[0]);
      });
      window.currentRoundMatches = firstRoundMatches;
      if (typeof assignStartingLineups === "function") assignStartingLineups(window.currentRoundMatches);
    }
    return playerClub;
  }
  document.addEventListener("DOMContentLoaded", () => {
    const _startBtn = document.getElementById("startBtn");
    if (!_startBtn) {
      try {
        const L = getLogger5();
        L.error && L.error("startBtn not found in DOM; cannot start game.");
      } catch (_) {
      }
      return;
    }
    _startBtn.addEventListener("click", async () => {
      try {
        await validateGameData();
        const coachName = document.getElementById("coachName").value.trim();
        if (!coachName) return alert("Digite o nome do treinador!");
        const picked = initializeGameSession();
        if (typeof startGame === "function") startGame(picked);
      } catch (err) {
        getLogger5().error("Falha ao iniciar jogo:", err);
        alert("Erro cr\xEDtico: " + err.message);
      }
    });
  });

  // src/entry.mjs
  window.Hub = hub_controller_exports;
})();
//# sourceMappingURL=app.bundle.js.map
