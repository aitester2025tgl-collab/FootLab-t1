(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
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
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/core/logger.js
  var logger_exports = {};
  __export(logger_exports, {
    default: () => logger_default
  });
  function shouldLog(level) {
    return level >= currentLevel;
  }
  var LEVELS, FootLab, currentLevel, logger, logger_default;
  var init_logger = __esm({
    "src/core/logger.js"() {
      LEVELS = { DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40 };
      FootLab = typeof window !== "undefined" && (window.FootLab || window.Elifoot) || {};
      currentLevel = FootLab && FootLab.Config && FootLab.Config.LOG_LEVEL ? FootLab.Config.LOG_LEVEL : FootLab && FootLab.Config && FootLab.Config.DEBUG ? LEVELS.DEBUG : LEVELS.INFO;
      logger = {
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
      logger_default = logger;
    }
  });

  // src/core/globals.js
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
      } catch (e) {
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
      } catch (e) {
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
      } catch (e) {
      }
    });
  })();

  // src/entry.mjs
  init_logger();

  // src/core/persistence.js
  var SNAPSHOT_VERSION = 1;
  function getByteSize(str) {
    try {
      if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(str).length;
      return str.length;
    } catch (e) {
      return str && str.length || 0;
    }
  }
  function getLogger() {
    try {
      if (typeof window !== "undefined" && (window.FootLab || window.Elifoot) && (window.FootLab || window.Elifoot).Logger)
        return (window.FootLab || window.Elifoot).Logger;
    } catch (e) {
    }
    try {
      if (typeof __require === "function") {
        try {
          return init_logger(), __toCommonJS(logger_exports);
        } catch (e) {
        }
      }
    } catch (e) {
    }
    return console;
  }
  function pruneSnapshot(snap) {
    if (!snap) return null;
    const pruned = JSON.parse(JSON.stringify(snap));
    if (Array.isArray(pruned.TRANSFER_HISTORY)) {
      pruned.TRANSFER_HISTORY = pruned.TRANSFER_HISTORY.slice(-50);
    }
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
    if (Array.isArray(pruned.PENDING_RELEASES)) {
      pruned.PENDING_RELEASES.forEach(cleanPlayer);
    }
    return pruned;
  }
  var Persistence = {
    // saveSnapshot stores an envelope {version, created, payload} and enforces a size guard.
    saveSnapshot(snap, opts) {
      try {
        const cleanSnap = pruneSnapshot(snap);
        const cfg = typeof window !== "undefined" && (window.FootLab || window.Elifoot) && (window.FootLab || window.Elifoot).Config ? (window.FootLab || window.Elifoot).Config : {};
        const maxBytes = 5242880;
        const envelope = { version: SNAPSHOT_VERSION, created: Date.now(), payload: cleanSnap };
        const raw = JSON.stringify(envelope);
        const size = getByteSize(raw);
        const logger2 = typeof window !== "undefined" && (window.FootLab || window.Elifoot) && (window.FootLab || window.Elifoot).Logger ? (window.FootLab || window.Elifoot).Logger : console;
        if (size > maxBytes) {
          try {
            logger2.warn && logger2.warn(
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
      } catch (e) {
        try {
          const lg = getLogger();
          lg.warn && lg.warn("Persistence.saveSnapshot failed", e);
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
            const lg = getLogger();
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
            } catch (e) {
            }
            return wrapped.payload || null;
          } catch (e) {
            return envelope;
          }
        }
        if (envelope.version !== SNAPSHOT_VERSION) {
          try {
            const lg = getLogger();
            lg.warn && lg.warn("Persistence.loadSnapshot: snapshot version mismatch", envelope.version);
          } catch (_) {
          }
          return null;
        }
        return envelope.payload || null;
      } catch (e) {
        try {
          const lg = getLogger();
          lg.warn && lg.warn("Persistence.loadSnapshot failed", e);
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
      } catch (e) {
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
      } catch (e) {
      }
    },
    // low-level helpers
    getRaw(key) {
      try {
        return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
      } catch (e) {
        return null;
      }
    },
    setRaw(key, value) {
      try {
        if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
      } catch (e) {
      }
    }
  };
  if (typeof window !== "undefined") {
    window.FootLab = window.FootLab || window.Elifoot || {};
    window.FootLab.Persistence = window.FootLab.Persistence || Persistence;
    window.Elifoot = window.Elifoot || window.FootLab;
  }

  // src/logic/lineups.js
  (function() {
    function getLogger7() {
      try {
        return window.FootLab && window.FootLab.Logger || window.Elifoot && window.Elifoot.Logger || console;
      } catch (e) {
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
          if (nums.length >= 3 && nums.every((n) => !isNaN(n))) {
            if (nums.length === 4) {
              return [nums[0], nums[1] + nums[2], nums[3]];
            }
            return nums;
          }
        } catch (e) {
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
            getLogger7().error("Erro a reordenar match por roster", err);
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
        getLogger7().error("Erro a inicializar Elifoot.Lineups", err);
      } catch (_) {
      }
    }
  })();

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
  } catch (e) {
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
          if (window.FREE_TRANSFERS.length >= 10) return window.FREE_TRANSFERS;
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
            } catch (e) {
              p.playerValue = 0;
            }
            p.leavingFee = Math.max(0, Math.round((p.playerValue || 0) * 0.8));
            try {
              delete p.club;
            } catch (e) {
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
          if (window.PENDING_RELEASES.length >= 10) return window.PENDING_RELEASES;
          if (Math.random() < perPlayerProb) {
            const clone = Object.assign({}, p);
            clone.previousSalary = Number(p.salary || 0);
            clone.minContract = Math.max(0, Math.round(clone.previousSalary * 0.9));
            try {
              clone.playerValue = computePlayerMarketValue2(
                clone,
                club && club.division ? club.division : 4
              );
            } catch (e) {
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
            } catch (e) {
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
                } catch (e) {
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
                  } catch (e) {
                  }
                }
              }
            } catch (e) {
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
                } catch (e) {
                }
              }
            } catch (e) {
            }
            if (negotiation && negotiation.accepted) {
              if (cfg && cfg.debugPurchases === true && PlayersLogger && typeof PlayersLogger.debug === "function") {
                try {
                  PlayersLogger.debug("Negotiation result: ACCEPTED", {
                    buyer: c && c.team && c.team.name || c.name,
                    player: p && (p.name || p.id)
                  });
                } catch (e) {
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
                    } catch (e) {
                    }
                  }
                  negotiation.accepted = false;
                }
              } catch (e) {
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
                } catch (e) {
                }
                if (PlayersLogger && typeof PlayersLogger.debug === "function") {
                  try {
                    PlayersLogger.debug("Auto-purchase:", {
                      player: playerToAdd && (playerToAdd.name || playerToAdd.id),
                      buyer: c.team && c.team.name || c.name,
                      fee
                    });
                  } catch (e) {
                  }
                }
                purchased = true;
              } catch (e) {
              }
            }
            if (purchased) break;
          }
          if (purchased) continue;
        } catch (e) {
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
      } catch (e) {
      }
      try {
        delete p.originalClubRef;
      } catch (e) {
      }
      window.FREE_TRANSFERS.push(p);
      if (PlayersLogger && typeof PlayersLogger.debug === "function") {
        try {
          PlayersLogger.debug("Moved to FREE_TRANSFERS:", {
            player: p && (p.name || p.id),
            minContract: p.minContract,
            leavingFee: p.leavingFee
          });
        } catch (e) {
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
  } catch (e) {
  }

  // src/clubs.js
  function _getLogger() {
    try {
      if (typeof window !== "undefined" && window.FootLab && window.FootLab.Logger)
        return window.FootLab.Logger;
      if (typeof window !== "undefined" && window.Elifoot && window.Elifoot.Logger)
        return window.Elifoot.Logger;
    } catch (e) {
    }
    try {
      if (typeof __require === "function") return init_logger(), __toCommonJS(logger_exports);
    } catch (e) {
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
    } catch (e) {
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
        } catch (e) {
          try {
            _logger && _logger.error && _logger.error("TEMP_DEBUG console error failed", e);
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
        contractYears: typeof r.contractYears === "number" ? r.contractYears : void 0,
        goals: r.goals || 0
      }));
      let stadiumCapacity, members, ticketPrice;
      if (divisionNumber === 1) {
        stadiumCapacity = 3e4 + Math.floor(Math.random() * 4e4);
        members = Math.floor(stadiumCapacity * (0.5 + Math.random() * 0.4));
        ticketPrice = 30 + Math.floor(Math.random() * 20);
      } else if (divisionNumber === 2) {
        stadiumCapacity = 15e3 + Math.floor(Math.random() * 3e4);
        members = Math.floor(stadiumCapacity * (0.4 + Math.random() * 0.4));
        ticketPrice = 25 + Math.floor(Math.random() * 10);
      } else if (divisionNumber === 3) {
        stadiumCapacity = 1e4 + Math.floor(Math.random() * 1e4);
        members = Math.floor(stadiumCapacity * (0.3 + Math.random() * 0.4));
        ticketPrice = 18 + Math.floor(Math.random() * 7);
      } else {
        stadiumCapacity = 4e3 + Math.floor(Math.random() * 6e3);
        members = Math.floor(stadiumCapacity * (0.2 + Math.random() * 0.4));
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
      const coachName = window.REAL_COACHES && window.REAL_COACHES[team.name] || null;
      if (coachName) {
        const baseRep = divisionNumber === 1 ? 82 : divisionNumber === 2 ? 68 : divisionNumber === 3 ? 55 : 40;
        club.coach = { name: coachName, reputation: baseRep + Math.floor(Math.random() * 12) };
      } else {
        club.coach = null;
      }
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
    } catch (e) {
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
      } catch (e) {
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
  } catch (e) {
  }

  // src/teams.js
  var E = typeof window !== "undefined" ? window.FootLab || window.Elifoot || window : typeof global !== "undefined" ? global : {};
  function buildDivisionsFromRostersOrdered() {
    const E2 = typeof window !== "undefined" ? window.FootLab || window.Elifoot || window : typeof global !== "undefined" ? global : {};
    function getLogger7() {
      try {
        return typeof window !== "undefined" && window.FootLab && window.FootLab.Logger || typeof window !== "undefined" && window.Elifoot && window.Elifoot.Logger || console;
      } catch (e) {
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
          const L2 = getLogger7();
          L2 && L2.warn && L2.warn(msg);
        } catch (e) {
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
      const L2 = getLuminanceLocal(bg);
      const fg = L2 > 0.5 ? "#000000" : "#ffffff";
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
    } catch (e) {
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
        if (typeof window !== "undefined") window.divisionsData = divisionsData2;
        if (typeof global !== "undefined") global.divisionsData = divisionsData2;
      } catch (e) {
      }
      try {
        _divisionsResolve && _divisionsResolve(divisionsData2);
      } catch (e) {
      }
      try {
        if (typeof document !== "undefined" && typeof document.dispatchEvent === "function") {
          document.dispatchEvent(new CustomEvent("footlab:rosters-loaded"));
        }
      } catch (e) {
      }
      return true;
    } catch (e) {
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
        } catch (e) {
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
      requires: { wingers: true, threeAtBack: false, strikers: 1 }
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
      requires: { wingers: true, threeAtBack: true, strikers: 1 }
    },
    {
      name: "5-4-1",
      description: "Ultra Defensiva - Resist\xEAncia",
      attack: 1,
      defense: 5,
      midfield: 4,
      requires: { wingers: false, threeAtBack: false }
    },
    {
      name: "4-2-3-1",
      description: "Moderna - Controle e Transi\xE7\xE3o",
      attack: 4,
      defense: 3,
      midfield: 5,
      requires: { wingers: true, threeAtBack: false, strikers: 1 }
    },
    {
      name: "4-1-4-1",
      description: "Posicional - Trinco e Linha M\xE9dia",
      attack: 3,
      defense: 4,
      midfield: 5,
      requires: { wingers: true, threeAtBack: false, strikers: 1 }
    },
    {
      name: "4-2-4",
      description: "Ultra Ofensiva - Risco M\xE1ximo",
      attack: 5,
      defense: 3,
      midfield: 2,
      requires: { wingers: true, threeAtBack: false, strikers: 2 }
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
  } catch (e) {
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
    } catch (e) {
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
  } catch (e) {
  }
  function printDivisionAssignments() {
    if (typeof divisionsData2 === "undefined") return;
    const logger2 = typeof window !== "undefined" && window.FootLab && window.FootLab.Logger || typeof window !== "undefined" && window.Elifoot && window.Elifoot.Logger || console;
    divisionsData2.forEach((d, idx) => {
      logger2.info(`${idx + 1}. ${d.name} \u2014 ${d.teams.length} teams`);
      d.teams.forEach((t, i) => logger2.info(`   ${i + 1}. ${t.name}`));
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
  } catch (e) {
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
    if (typeof window !== "undefined") {
      window.waitForDivisionsData = waitForDivisionsData;
      window.FootLab = window.FootLab || window.Elifoot || {};
      window.FootLab.waitForDivisionsData = window.FootLab.waitForDivisionsData || waitForDivisionsData;
      window.Elifoot = window.Elifoot || window.FootLab;
    }
    if (typeof global !== "undefined") global.waitForDivisionsData = waitForDivisionsData;
  } catch (e) {
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
  } catch (e) {
    if (e && e.message && e.message.indexOf("Startup roster validation failed") === 0) throw e;
  }

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
  function getLogger2() {
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
          const L2 = getLogger2();
          L2.error && L2.error("Equipa sem jogadores ou formato inv\xE1lido:", match);
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
          const L2 = getLogger2();
          L2.debug && L2.debug("DBG goal-check home", {
            matchIdx: i,
            minute,
            homePlayers: homePlayers.length,
            awayPlayers: awayPlayers.length,
            homeSkill: homeSkill.toFixed(2),
            awaySkill: awaySkill.toFixed(2),
            homeGoalChance: homeGoalChance.toFixed(6),
            homeDraw: homeDraw.toFixed(6)
          });
        } catch (e) {
        }
      }
      if (homeDraw < homeGoalChance) {
        const homeGoal = generateGoal(homePlayers, minute, "home");
        homeGoal.type = "goal";
        match.goals.push(homeGoal);
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
            const L2 = getLogger2();
            L2.debug && L2.debug("DBG goal-check away", {
              matchIdx: i,
              minute,
              awayGoalChance: awayGoalChance.toFixed(6),
              awayDraw: awayDraw.toFixed(6)
            });
          } catch (e) {
          }
        }
        if (awayDraw < awayGoalChance) {
          const awayGoal = generateGoal(awayPlayers, minute, "away");
          awayGoal.type = "goal";
          match.goals.push(awayGoal);
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
          const L2 = getLogger2();
          L2.error && L2.error("Erro ao simular cart\xF5es:", err);
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
  } catch (e) {
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
    } catch (e) {
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
      let bg = "#2e2e2e";
      let fg = "#ffffff";
      if (club) {
        bg = club.bgColor || club.team && club.team.bgColor || "#2e2e2e";
        fg = club.color || club.team && club.team.color || "#ffffff";
      }
      if (overlay) {
        overlay.style.setProperty("--subs-overlay-bg", "rgba(0, 0, 0, 0.9)", "important");
        overlay.style.setProperty("--subs-panel-bg", bg, "important");
        overlay.style.setProperty("--subs-fg", fg, "important");
        const panel = overlay.querySelector(".subs-panel");
        if (panel) {
          panel.style.backgroundColor = bg;
          panel.style.color = fg;
          panel.style.opacity = "1";
        }
      }
      if (window.Overlays && typeof window.Overlays.showHalfTimeSubsOverlay === "function") {
        const result = window.Overlays.showHalfTimeSubsOverlay(club, match, cb);
        if (overlay) {
          const panel = overlay.querySelector(".subs-panel");
          if (panel) {
            panel.style.setProperty("background-color", bg, "important");
            panel.style.setProperty("color", fg, "important");
            panel.style.setProperty("opacity", "1", "important");
          }
        }
        return result;
      }
      if (!overlay) {
        if (typeof cb === "function") cb();
        return;
      }
      try {
        if (overlay.parentElement !== document.body) document.body.appendChild(overlay);
      } catch (e) {
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
          "var(--subs-overlay-bg, rgba(0, 0, 0, 0.9))",
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
      } catch (e) {
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
      let html = "";
      if (window.Hub && typeof window.Hub.buildNextOpponentHtml === "function") {
        html = window.Hub.buildNextOpponentHtml();
      }
      if (!html || html.includes("Sem informa\xE7\xE3o")) {
        if (!window.playerClub || !window.seasonCalendar || !window.currentJornada) {
          return "<div>Sem informa\xE7\xE3o do calend\xE1rio.</div>";
        }
        const nextRoundIndex = window.currentJornada - 1;
        if (nextRoundIndex >= window.seasonCalendar.length) {
          return "<div>Fim de \xC9poca</div>";
        }
        const nextRoundMatches = window.seasonCalendar[nextRoundIndex];
        const myMatch = nextRoundMatches.find((m) => m.homeClub === window.playerClub || m.awayClub === window.playerClub);
        if (!myMatch) return "<div>Sem jogo agendado (Folga)</div>";
        const isHome = myMatch.homeClub === window.playerClub;
        const oppClub = isHome ? myMatch.awayClub : myMatch.homeClub;
        const oppName = oppClub && oppClub.team ? oppClub.team.name : "Desconhecido";
        const oppBg = oppClub && oppClub.team ? oppClub.team.bgColor : "#333";
        const oppFg = oppClub && oppClub.team ? oppClub.team.color : "#fff";
        const oppTactic = oppClub && oppClub.team && oppClub.team.tactic || "4-4-2";
        const oppGF = oppClub ? oppClub.goalsFor || 0 : 0;
        const oppGA = oppClub ? oppClub.goalsAgainst || 0 : 0;
        let topScorer = { name: "Nenhum", goals: 0 };
        let avgSkill2 = 0;
        if (oppClub && oppClub.team && oppClub.team.players) {
          oppClub.team.players.forEach((p) => {
            if ((p.goals || 0) > topScorer.goals) topScorer = p;
          });
          const sortedSkill = [...oppClub.team.players].sort((a, b) => (b.skill || 0) - (a.skill || 0)).slice(0, 11);
          if (sortedSkill.length > 0) {
            avgSkill2 = Math.round(sortedSkill.reduce((sum, p) => sum + (p.skill || 0), 0) / sortedSkill.length);
          }
        }
        html = `
        <div style="display:flex; flex-direction:column; gap:12px; margin-top:5px; width: 100%;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:36px; height:36px; flex-shrink:0; border-radius:6px; background:${oppBg}; border:2px solid ${oppFg}; box-shadow: 0 4px 8px rgba(0,0,0,0.3);"></div>
            <div style="display:flex; flex-direction:column; overflow:hidden; width:100%;">
              <strong style="font-size:1.05em; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;" title="${oppName}">${oppName}</strong>
              <span style="font-size:0.8em; opacity:0.7;">${isHome ? "Em Casa" : "Fora"} - Jor. ${window.currentJornada}</span>
            </div>
          </div>
          
          <div style="background:rgba(128,128,128,0.15); border:1px solid rgba(128,128,128,0.2); border-radius:8px; padding:10px; font-size:0.85em; display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(128,128,128,0.2); padding-bottom:4px;">
              <span style="opacity:0.7;">T\xE1tica:</span>
              <strong style="background: rgba(128,128,128,0.2); padding: 2px 6px; border-radius: 4px;">${oppTactic}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(128,128,128,0.2); padding-bottom:4px;">
              <span style="opacity:0.7;">Qualidade:</span>
              <strong style="background: rgba(128,128,128,0.2); border: 1px solid rgba(128,128,128,0.3); padding: 2px 6px; border-radius: 4px; font-weight: 900;">${avgSkill2}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(128,128,128,0.2); padding-bottom:4px;">
              <span style="opacity:0.7;">Golos (M/S):</span>
              <strong><span style="color:#4CAF50;">${oppGF}</span> / <span style="color:#F44336;">${oppGA}</span></strong>
            </div>
            <div style="display:flex; flex-direction:column; gap:4px; margin-top:2px;">
              <span style="opacity:0.7;">Melhor Marcador:</span>
              <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(128,128,128,0.2); padding:6px 8px; border-radius:6px; border:1px solid rgba(128,128,128,0.2);">
                <strong style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:70%;" title="${topScorer.name}">\u{1F45F} ${topScorer.name}</strong>
                <span style="font-weight:900; font-size:1.1em; flex-shrink:0;">${topScorer.goals} <span style="font-size:0.8em; font-weight:normal; opacity:0.8;">Gls</span></span>
              </div>
            </div>
          </div>
        </div>
      `;
      }
      return html;
    }
    function renderNextMatchMenu() {
      const content = document.getElementById("hub-main-content");
      if (!content) return;
      if (!window.playerClub || !window.seasonCalendar || !window.currentJornada) {
        content.innerHTML = `<h2>Pr\xF3ximo Jogo</h2><div class="hub-box" style="padding:30px; text-align:center; color:#aaa; font-size:1.1em;">Sem informa\xE7\xE3o do calend\xE1rio.</div>`;
        return;
      }
      const nextRoundIndex = window.currentJornada - 1;
      if (nextRoundIndex >= window.seasonCalendar.length) {
        content.innerHTML = `<h2>Fim de \xC9poca</h2><div class="hub-box" style="padding:30px; text-align:center; color:#aaa; font-size:1.1em;">O campeonato terminou.</div>`;
        return;
      }
      const nextRoundMatches = window.seasonCalendar[nextRoundIndex];
      const myMatch = nextRoundMatches.find((m) => m.homeClub === window.playerClub || m.awayClub === window.playerClub);
      if (!myMatch) {
        content.innerHTML = `<h2>Pr\xF3ximo Jogo (Jornada ${window.currentJornada})</h2><div class="hub-box" style="padding:30px; text-align:center; color:#aaa; font-size:1.1em;">Sem jogo agendado (Folga).</div>`;
        return;
      }
      const isHome = myMatch.homeClub === window.playerClub;
      const oppClub = isHome ? myMatch.awayClub : myMatch.homeClub;
      const oppName = oppClub && oppClub.team ? oppClub.team.name : "Desconhecido";
      const oppBg = oppClub && oppClub.team ? oppClub.team.bgColor : "#333";
      const oppFg = oppClub && oppClub.team ? oppClub.team.color : "#fff";
      const oppTactic = oppClub && oppClub.team && oppClub.team.tactic || "4-4-2";
      const oppGF = oppClub ? oppClub.goalsFor || 0 : 0;
      const oppGA = oppClub ? oppClub.goalsAgainst || 0 : 0;
      let topScorer = { name: "Nenhum", goals: 0 };
      let avgSkill2 = 0;
      if (oppClub && oppClub.team && oppClub.team.players) {
        oppClub.team.players.forEach((p) => {
          if ((p.goals || 0) > topScorer.goals) topScorer = p;
        });
        const sortedSkill = [...oppClub.team.players].sort((a, b) => (b.skill || 0) - (a.skill || 0)).slice(0, 11);
        if (sortedSkill.length > 0) avgSkill2 = Math.round(sortedSkill.reduce((sum, p) => sum + (p.skill || 0), 0) / sortedSkill.length);
      }
      content.innerHTML = `
      <h2 style="margin-bottom: 20px; color: var(--team-menu-fg, inherit);">Pr\xF3ximo Jogo <span style="opacity:0.7; font-weight:normal; font-size:0.7em;">(Jornada ${window.currentJornada})</span></h2>
      <div class="hub-box" style="max-width: 600px; background: rgba(128,128,128,0.15); padding: 30px; border-radius: 12px; border: 1px solid rgba(128,128,128,0.2); color: var(--team-menu-fg, inherit);">
        <div style="display:flex; align-items:center; gap:20px; margin-bottom: 25px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px;">
          <div style="width:80px; height:80px; flex-shrink:0; border-radius:12px; background:${oppBg}; border:3px solid ${oppFg}; box-shadow: 0 8px 16px rgba(0,0,0,0.2);"></div>
          <div style="display:flex; flex-direction:column; overflow:hidden; width:100%;">
            <span style="font-size:1.1em; opacity:0.7; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Advers\xE1rio (${isHome ? "Em Casa" : "Fora"})</span>
            <strong style="font-size:2em; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;" title="${oppName}">${oppName}</strong>
          </div>
        </div>
        <div style="font-size:1.15em; display:flex; flex-direction:column; gap:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(128,128,128,0.2); padding-bottom:10px;">
            <span style="opacity:0.7;">T\xE1tica Habitual:</span>
            <strong style="background: rgba(128,128,128,0.2); padding: 4px 12px; border-radius: 6px;">${oppTactic}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(128,128,128,0.2); padding-bottom:10px;">
            <span style="opacity:0.7;">Qualidade do Onze:</span>
            <strong style="background: rgba(128,128,128,0.2); border: 1px solid rgba(128,128,128,0.3); padding: 4px 12px; border-radius: 6px; font-weight: 900;">${avgSkill2}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(128,128,128,0.2); padding-bottom:10px;">
            <span style="opacity:0.7;">Golos (Marcados / Sofridos):</span>
            <strong><span style="color:#2e7d32; text-shadow:0 0 1px rgba(255,255,255,0.5);">${oppGF}</span> / <span style="color:#c62828; text-shadow:0 0 1px rgba(255,255,255,0.5);">${oppGA}</span></strong>
          </div>
          <div style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">
            <span style="opacity:0.7;">Melhor Marcador:</span>
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(128,128,128,0.2); padding:12px 16px; border-radius:8px; border:1px solid rgba(128,128,128,0.2);">
              <strong style="font-size:1.1em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:75%;" title="${topScorer.name}">\u{1F45F} ${topScorer.name}</strong>
              <span style="font-weight:900; font-size:1.2em; flex-shrink:0;">${topScorer.goals} <span style="font-size:0.7em; font-weight:normal; opacity:0.7;">Gls</span></span>
            </div>
          </div>
        </div>
      </div>
    `;
    }
    function updateNextOpponentDisplay() {
      const container = document.getElementById("nextOpponentDetails");
      if (container) {
        container.innerHTML = buildNextOpponentHtml2();
      }
    }
    function buildTableHtml(divisionIndex) {
      const divisionNum = divisionIndex + 1;
      const clubs = window.allDivisions && window.allDivisions[divisionIndex] ? window.allDivisions[divisionIndex].slice() : [];
      clubs.sort((a, b) => {
        const ptsA = a.points || 0;
        const ptsB = b.points || 0;
        if (ptsA !== ptsB) return ptsB - ptsA;
        const diffA = (a.goalsFor || 0) - (a.goalsAgainst || 0);
        const diffB = (b.goalsFor || 0) - (b.goalsAgainst || 0);
        if (diffA !== diffB) return diffB - diffA;
        return (b.goalsFor || 0) - (a.goalsFor || 0);
      });
      let html = `<div class="hub-box"><h2>Classifica\xE7\xE3o - ${divisionNum}\xAA Divis\xE3o</h2>`;
      html += `<table>
      <thead>
        <tr>
          <th>Pos</th><th>Equipa</th><th>Pts</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GM</th><th>GS</th><th>DG</th>
        </tr>
      </thead>
      <tbody>`;
      clubs.forEach((c, idx) => {
        const isPlayer = window.playerClub && c.team && window.playerClub.team && c.team.name === window.playerClub.team.name;
        const highlightStyle = isPlayer ? 'style="background: rgba(128,128,128,0.25); font-weight: 800;"' : "";
        const diff = (c.goalsFor || 0) - (c.goalsAgainst || 0);
        const bg = c.team && c.team.bgColor || "#333";
        const fg = c.team && c.team.color || "#fff";
        html += `<tr ${highlightStyle}>
        <td>${idx + 1}</td>
        <td style="display:flex; align-items:center; gap:6px; overflow:hidden; white-space:nowrap;">
          <div style="width:12px; height:12px; flex-shrink:0; border-radius:3px; background:${bg}; border:1px solid ${fg};"></div>
          <span style="overflow:hidden; text-overflow:ellipsis;">${c.team ? c.team.name : "Desconhecida"}</span>
        </td>
        <td style="font-weight:800; opacity:0.9;">${c.points || 0}</td>
        <td>${c.gamesPlayed || 0}</td>
        <td>${c.wins || 0}</td>
        <td>${c.draws || 0}</td>
        <td>${c.losses || 0}</td>
        <td>${c.goalsFor || 0}</td>
        <td>${c.goalsAgainst || 0}</td>
        <td>${diff}</td>
      </tr>`;
      });
      html += `</tbody></table></div>`;
      return html;
    }
    function renderAllDivisionsTables() {
      let html = "";
      try {
        if (window.Hub && typeof window.Hub.renderAllDivisionsTables === "function") html = window.Hub.renderAllDivisionsTables();
      } catch (e) {
        console.warn("Falha no Hub.renderAllDivisionsTables, a usar fallback.");
      }
      if (!html || typeof html !== "string" || html.trim() === "") {
        html = '<div class="all-standings-grid">';
        for (let i = 0; i < 4; i++) html += buildTableHtml(i);
        html += "</div>";
      }
      const container = document.getElementById("hub-main-content");
      if (container) container.innerHTML = html;
      return html;
    }
    function renderLeagueTable() {
      let html = "";
      try {
        if (window.Hub && typeof window.Hub.renderLeagueTable === "function") html = window.Hub.renderLeagueTable();
      } catch (e) {
        console.warn("Falha no Hub.renderLeagueTable, a usar fallback.");
      }
      if (!html || typeof html !== "string" || html.trim() === "") {
        const divIndex = window.playerClub ? window.playerClub.division - 1 : 3;
        html = buildTableHtml(divIndex);
      }
      const container = document.getElementById("hub-main-content");
      if (container) container.innerHTML = html;
      return html;
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
          el.style.display = "none";
          el.style.opacity = "1";
        }
      });
      const hubScreen = document.getElementById("screen-hub");
      if (hubScreen) {
        let styleEl = document.getElementById("hub-layout-adjustment");
        if (styleEl) styleEl.remove();
        hubScreen.style.display = "flex";
        hubScreen.style.flexDirection = "column";
        hubScreen.style.opacity = "1";
      }
      if (typeof initHubUI2 === "function") {
        try {
          initHubUI2(playerClub2);
        } catch (e) {
          console.error("Error initializing hub UI:", e);
        }
      }
      if (typeof updateNextOpponentDisplay === "function") {
        updateNextOpponentDisplay();
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
    window.renderNextMatchMenu = window.renderNextMatchMenu || renderNextMatchMenu;
    window.updateMatchBoardLine = window.updateMatchBoardLine || updateMatchBoardLine3;
    window.updateNextOpponentDisplay = window.updateNextOpponentDisplay || updateNextOpponentDisplay;
    window.startGame = window.startGame || startGame2;
  })();

  // src/core/simulation.js
  (function() {
    "use strict";
    function getLogger7() {
      return typeof window !== "undefined" && window.FootLab && window.FootLab.Logger ? window.FootLab.Logger : typeof window !== "undefined" && window.Elifoot && window.Elifoot.Logger ? window.Elifoot.Logger : console;
    }
    const PersistenceAPI = typeof window !== "undefined" && window.FootLab && window.FootLab.Persistence || typeof window !== "undefined" && window.Elifoot && window.Elifoot.Persistence || null;
    let isSimulating = false;
    let simIntervalId = null;
    function showSingleReleasePopup(player, callback) {
      const overlay = document.createElement("div");
      overlay.id = "single-release-overlay";
      overlay.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:999999;";
      const box = document.createElement("div");
      box.style.cssText = "background:#1a1a1a;border:1px solid rgba(255,255,255,0.15);border-radius:12px;padding:24px;width:360px;color:#fff;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,0.5);font-family:sans-serif;";
      const formatMoney4 = typeof window.formatMoney === "function" ? window.formatMoney : (v) => v + " \u20AC";
      const fee = player.leavingFee || 0;
      const salary = player.minContract || player.salary || 0;
      const clubName = player.previousClubName || "Desconhecido";
      const myBudget = window.playerClub ? window.playerClub.budget || 0 : 0;
      const sqSz = window.playerClub && window.playerClub.team && window.playerClub.team.players ? window.playerClub.team.players.length : 0;
      if (myBudget < fee || sqSz >= 28) {
        const myDiv = window.playerClub ? window.playerClub.division : 4;
        const rivals = (window.allDivisions[myDiv - 1] || []).filter((c) => c !== window.playerClub);
        const rival = rivals.length > 0 ? rivals[Math.floor(Math.random() * rivals.length)] : null;
        const rSal = Math.floor(salary * (1 + Math.random() * 0.3));
        box.innerHTML = `
            <h3 style="margin-top:0;color:#f44336;font-size:1.3rem;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:12px;">Proposta Invi\xE1vel</h3>
            <p style="font-size:1rem;margin-bottom:20px;line-height:1.5;">
                Sem fundos/espa\xE7o para <strong>${player.name}</strong>. Assinou pelo <strong>${rival ? rival.team.name : "outro clube"}</strong>.
            </p>
            <button id="btn-continue-free" style="width:100%;background:#2196F3;color:#fff;border:none;padding:12px;border-radius:6px;font-weight:bold;cursor:pointer;font-size:1rem;">Continuar</button>
        `;
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        box.querySelector("#btn-continue-free").onclick = () => {
          document.body.removeChild(overlay);
          callback(false, 0, rival, rSal);
        };
        return;
      }
      box.innerHTML = `
        <h3 style="margin-top:0;color:#ffeb3b;font-size:1.3rem;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:12px;">Jogador Livre</h3>
        <p style="font-size:0.95rem;margin-bottom:20px;opacity:0.9;line-height:1.4;"><strong>${player.name}</strong> terminou o contrato com o <strong>${clubName}</strong> e foi oferecido ao teu clube.</p>
        <div style="background:rgba(255,255,255,0.05);padding:15px;border-radius:8px;margin-bottom:24px;text-align:left;font-size:0.95rem;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>Posi\xE7\xE3o:</span> <strong>${player.position}</strong></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>Habilidade:</span> <strong><span style="color:#ffeb3b;">${player.skill}</span></strong></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span>Sal\xE1rio:</span> <strong>${formatMoney4(salary)}/m\xEAs</strong></div>
            <div style="display:flex;justify-content:space-between;"><span>Pr\xE9mio Assinatura:</span> <strong>${formatMoney4(fee)}</strong></div>
        </div>
    <div style="margin-bottom: 20px;">
        <p style="font-size: 0.85em; color: #ff9800; margin-bottom: 8px;">Outros clubes tamb\xE9m est\xE3o interessados. Melhora a oferta para garantir a contrata\xE7\xE3o.</p>
        <div style="display:flex; align-items:center; gap: 10px; justify-content:center;">
            <label>Tua Oferta:</label>
            <input type="number" id="offer-salary-input" value="${salary}" style="padding: 8px; border-radius: 4px; border: 1px solid #555; background: #222; color: #fff; width: 120px; text-align: center; font-weight: bold;">
        </div>
    </div>
        <div style="display:flex;gap:12px;">
        <button id="btn-accept-free" style="flex:1;background:#4caf50;color:#fff;border:none;padding:12px;border-radius:6px;font-weight:bold;cursor:pointer;font-size:1rem;transition:background 0.2s;">Fazer Oferta</button>
            <button id="btn-reject-free" style="flex:1;background:#f44336;color:#fff;border:none;padding:12px;border-radius:6px;font-weight:bold;cursor:pointer;font-size:1rem;transition:background 0.2s;">Ignorar</button>
        </div>
    `;
      overlay.appendChild(box);
      document.body.appendChild(overlay);
      const btnAccept = box.querySelector("#btn-accept-free");
      const btnReject = box.querySelector("#btn-reject-free");
      btnAccept.onmouseover = () => btnAccept.style.background = "#45a049";
      btnAccept.onmouseout = () => btnAccept.style.background = "#4caf50";
      btnReject.onmouseover = () => btnReject.style.background = "#da190b";
      btnReject.onmouseout = () => btnReject.style.background = "#f44336";
      btnReject.onclick = () => {
        document.body.removeChild(overlay);
        callback(false);
      };
      btnAccept.onclick = () => {
        const offered = parseInt(box.querySelector("#offer-salary-input").value, 10) || salary;
        let prob = 0.05;
        if (offered >= salary * 1.5) prob = 1;
        else if (offered >= salary * 1.2) prob = 0.8;
        else if (offered >= salary) prob = 0.3;
        const success = Math.random() < prob;
        let rival = null, rivalSalary = 0;
        if (!success) {
          const myDiv = window.playerClub ? window.playerClub.division : 4;
          const rivals = (window.allDivisions[myDiv - 1] || []).filter((c) => c !== window.playerClub);
          if (rivals.length > 0) rival = rivals[Math.floor(Math.random() * rivals.length)];
          rivalSalary = Math.floor(salary * (1 + Math.random() * 0.3));
        }
        box.innerHTML = `
            <h3 style="margin-top:0;color:${success ? "#4caf50" : "#f44336"};font-size:1.3rem;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:12px;">${success ? "Contrata\xE7\xE3o Conclu\xEDda!" : "Proposta Rejeitada"}</h3>
            <p style="font-size:1rem;margin-bottom:20px;line-height:1.5;">
                ${success ? `<strong>${player.name}</strong> aceitou a tua proposta e assinou pelo <strong>${window.playerClub ? window.playerClub.team.name : "teu clube"}</strong>.` : `<strong>${player.name}</strong> rejeitou a tua proposta e assinou pelo <strong>${rival ? rival.team.name : "outro clube"}</strong> por um sal\xE1rio de <br><span style="display:inline-block; width:140px; text-align:center; color:#ffeb3b; font-weight:bold; margin-top:8px; padding:6px; background:rgba(0,0,0,0.3); border-radius:4px;">${formatMoney4(rivalSalary)}</span>.`}
            </p>
            <button id="btn-continue-free" style="width:100%;background:#2196F3;color:#fff;border:none;padding:12px;border-radius:6px;font-weight:bold;cursor:pointer;font-size:1rem;">Continuar</button>
        `;
        box.querySelector("#btn-continue-free").onclick = () => {
          document.body.removeChild(overlay);
          callback(success, offered, rival, rivalSalary);
        };
      };
    }
    function processManagerMovements(isEndSeason) {
      const allDivisions2 = window.allDivisions || [];
      if (!Array.isArray(window.UNEMPLOYED_COACHES)) {
        window.UNEMPLOYED_COACHES = [];
      }
      const freeCoaches = window.UNEMPLOYED_COACHES;
      window.PLAYER_JOB_OFFERS = window.PLAYER_JOB_OFFERS || [];
      let clubsNeedingCoaches = [];
      allDivisions2.forEach((division) => {
        const sorted = [...division].sort((a, b) => (b.points || 0) - (a.points || 0));
        const total = sorted.length;
        sorted.forEach((club, rank) => {
          if (!club.coach || club === window.playerClub) return;
          let sackChance = 0;
          if (rank >= total - 3) sackChance = isEndSeason ? 1 : 0.4;
          else if (rank >= total - 6) sackChance = isEndSeason ? 0.3 : 0.1;
          if (Math.random() < sackChance) {
            const coach = club.coach;
            if (coach) {
              delete coach.clubId;
              freeCoaches.push(coach);
            }
            club.coach = null;
            clubsNeedingCoaches.push(club);
          }
        });
      });
      const playerClub2 = window.playerClub;
      let playerRep = 40;
      if (playerClub2 && playerClub2.division) {
        playerRep = playerClub2.division === 1 ? 82 : playerClub2.division === 2 ? 68 : playerClub2.division === 3 ? 55 : 40;
        const myDiv = allDivisions2[playerClub2.division - 1] || [];
        const myRank = [...myDiv].sort((a, b) => (b.points || 0) - (a.points || 0)).findIndex((c) => c === playerClub2);
        if (myRank === 0) playerRep += 15;
        else if (myRank <= 2) playerRep += 10;
        else if (myRank <= 5) playerRep += 5;
      }
      clubsNeedingCoaches.sort((a, b) => a.division - b.division);
      for (let i = 0; i < clubsNeedingCoaches.length; i++) {
        const club = clubsNeedingCoaches[i];
        const baseRep = club.division === 1 ? 82 : club.division === 2 ? 68 : club.division === 3 ? 55 : 40;
        let candidates = [...freeCoaches];
        allDivisions2.forEach((div) => {
          div.forEach((c) => {
            if (c.coach && c !== club && c.division > club.division) candidates.push({ ...c.coach, currentClub: c });
          });
        });
        if (playerClub2 && playerClub2.division > club.division && playerRep >= baseRep - 10) {
          candidates.push({ name: "JOGADOR", reputation: playerRep, isPlayer: true });
        }
        let viable = candidates.filter((c) => c.reputation >= baseRep - 15 && c.reputation <= baseRep + 15);
        if (viable.length === 0 && candidates.length > 0) {
          viable = [...candidates];
        }
        if (viable.length === 0) {
          club.coach = null;
          continue;
        }
        viable.sort((a, b) => b.reputation - a.reputation);
        const chosen = viable[0];
        if (chosen.isPlayer) {
          if (!window.PLAYER_JOB_OFFERS.find((o) => o.id === club.id)) window.PLAYER_JOB_OFFERS.push(club);
          club.coach = null;
        } else {
          club.coach = { name: chosen.name, reputation: chosen.reputation };
          if (chosen.currentClub) {
            const poachedCoach = chosen.currentClub.coach;
            chosen.currentClub.coach = null;
            if (poachedCoach) {
              delete poachedCoach.clubId;
              freeCoaches.push(poachedCoach);
            }
            clubsNeedingCoaches.push(chosen.currentClub);
          } else {
            const idx = freeCoaches.findIndex((fc) => fc.name === chosen.name);
            if (idx > -1) freeCoaches.splice(idx, 1);
          }
        }
      }
    }
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
            let attendance = match.attendance || 0;
            if (attendance === 0 && match.homeClub) {
              const cap = match.homeClub.stadiumCapacity || match.homeClub.team && match.homeClub.team.stadiumCapacity || 1e4;
              attendance = Math.floor(cap * 0.6);
              match.attendance = attendance;
            }
            const homeClub = match.homeClub;
            if (homeClub) {
              const ticketPrice = Number(homeClub.ticketPrice || homeClub.team && homeClub.team.ticketPrice || 20) || 20;
              const matchRevenue = Math.round(attendance * ticketPrice);
              homeClub.revenue = (homeClub.revenue || 0) + matchRevenue;
              homeClub.budget = (homeClub.budget || 0) + matchRevenue;
              const operatingCost = Math.round(attendance * 0.5);
              homeClub.expenses = (homeClub.expenses || 0) + operatingCost;
              homeClub.budget = (homeClub.budget || 0) - operatingCost;
              match.homeMatchRevenue = matchRevenue;
              match.homeMatchOperatingCost = operatingCost;
            }
          } catch (e) {
            try {
              const L2 = getLogger7();
              L2.warn && L2.warn("Erro a calcular receita/assist\xEAncia do jogo:", e);
            } catch (_) {
            }
          }
          const clubs = [match.homeClub, match.awayClub];
          clubs.forEach((club, idx) => {
            if (!club) return;
            const isHome = idx === 0;
            const goalsScored = isHome ? homeGoals : awayGoals;
            const goalsConceded = isHome ? awayGoals : homeGoals;
            const actualSalary = club.team && Array.isArray(club.team.players) ? club.team.players.reduce((sum, p) => sum + (p.salary || 0), 0) : club.totalSalaryCost || 0;
            const matchSalary = Math.round(actualSalary / 4);
            club.expenses = (club.expenses || 0) + matchSalary;
            club.budget = (club.budget || 0) - matchSalary;
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
            const L2 = getLogger7();
            L2.warn && L2.warn("updateClubStatsAfterMatches: failed for match", match, err);
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
        } catch (e) {
        }
      } catch (err) {
        try {
          const L2 = getLogger7();
          L2.warn && L2.warn("Could not persist snapshot after updating club stats", err);
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
          if (match.homeClub && typeof match.attendance === "undefined") {
            const cap = match.homeClub.stadiumCapacity || match.homeClub.team && match.homeClub.team.stadiumCapacity || 1e4;
            const members = match.homeClub.members || match.homeClub.team && match.homeClub.team.members || Math.floor(cap * 0.5);
            let performanceFactor = 0.5;
            try {
              if (window.allDivisions && match.homeClub.division) {
                const divClubs = window.allDivisions[match.homeClub.division - 1];
                if (divClubs && divClubs.length > 1) {
                  const sorted = [...divClubs].sort((a, b) => {
                    const pa = a.points || 0;
                    const pb = b.points || 0;
                    if (pb !== pa) return pb - pa;
                    const gda = (a.goalsFor || 0) - (a.goalsAgainst || 0);
                    const gdb = (b.goalsFor || 0) - (b.goalsAgainst || 0);
                    return gdb - gda;
                  });
                  const rank = sorted.findIndex((c) => c === match.homeClub);
                  if (rank >= 0) performanceFactor = 1 - rank / (divClubs.length - 1);
                }
              }
            } catch (e) {
            }
            let awayAvgSkill = 50;
            try {
              if (match.awayClub && match.awayClub.team && Array.isArray(match.awayClub.team.players)) {
                const ap = match.awayClub.team.players;
                const top11 = [...ap].sort((a, b) => (b.skill || 0) - (a.skill || 0)).slice(0, 11);
                awayAvgSkill = top11.reduce((sum, p) => sum + (p.skill || 0), 0) / Math.max(1, top11.length);
              }
            } catch (e) {
            }
            const divNum = match.homeClub.division || 4;
            let basePrice = divNum === 1 ? 30 : divNum === 2 ? 25 : divNum === 3 ? 18 : 12;
            if (awayAvgSkill >= 85) basePrice *= 1.5;
            else if (awayAvgSkill >= 75) basePrice *= 1.25;
            else if (awayAvgSkill >= 65) basePrice *= 1.1;
            const actualPrice = Number(match.homeClub.ticketPrice || match.homeClub.team && match.homeClub.team.ticketPrice || 20);
            let priceFactor = basePrice / Math.max(1, actualPrice);
            priceFactor = Math.max(0.2, Math.min(1.5, priceFactor));
            const baseFill = performanceFactor * 0.7 * priceFactor;
            const randomFill = Math.random() * 0.3 * priceFactor;
            let att = members + Math.floor((cap - members) * (baseFill + randomFill));
            if (att > cap) att = cap;
            match.attendance = att;
            match.stadiumCapacity = cap;
          }
          const homeTeam = match.homeClub && match.homeClub.team;
          const awayTeam = match.awayClub && match.awayClub.team;
          if (homeTeam && typeof Lineups.chooseStarters === "function") {
            let result = {};
            try {
              result = Lineups.chooseStarters(homeTeam) || {};
            } catch (e) {
              try {
                const L2 = getLogger7();
                L2.warn && L2.warn("chooseStarters failed for homeTeam, using fallback", e);
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
            } catch (e) {
              try {
                const L2 = getLogger7();
                L2.warn && L2.warn("chooseStarters failed for awayTeam, using fallback", e);
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
            const L2 = getLogger7();
            L2.error && L2.error("Erro ao atribuir lineups para match", err, match);
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
          const L2 = getLogger7();
          L2.info && L2.info("simulateDay blocked: not user-initiated");
          return;
        }
      } catch (e) {
      }
      if (isSimulating) {
        try {
          const L2 = getLogger7();
          L2.warn && L2.warn("simulateDay called but already simulating (Jornada", window.currentJornada, ")");
        } catch (_) {
        }
        return;
      }
      isSimulating = true;
      try {
        const L2 = typeof window !== "undefined" && window.Elifoot && window.Elifoot.Logger ? window.Elifoot.Logger : console;
        L2.info && L2.info("Iniciando simula\xE7\xE3o (Jornada", window.currentJornada, ")...");
      } catch (_) {
      }
      try {
        assignStartingLineups2(window.currentRoundMatches);
      } catch (e) {
        try {
          const L2 = getLogger7();
          L2.error && L2.error("Erro ao atribuir lineups antes da simula\xE7\xE3o", e);
        } catch (_) {
        }
      }
      function proceedToMatch() {
        try {
          document.getElementById("screen-hub").style.setProperty("display", "none", "important");
        } catch (e) {
        }
        try {
          document.getElementById("screen-match").style.setProperty("display", "flex", "important");
        } catch (e) {
        }
        try {
          if (typeof renderInitialMatchBoard === "function")
            renderInitialMatchBoard(window.allDivisions);
        } catch (e) {
          try {
            const L2 = getLogger7();
            L2.error && L2.error("renderInitialMatchBoard not found", e);
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
            } catch (e) {
            }
            try {
              setTimeout(() => {
                simIntervalId = setInterval(simulationTick, perMinuteMs);
              }, START_DELAY_MS);
            } catch (e) {
              simIntervalId = setInterval(simulationTick, perMinuteMs);
            }
          });
        } catch (e) {
          proceedToMatch();
          const L2 = getLogger7();
          L2.info && L2.info("Scheduling simulation interval in", START_DELAY_MS, "ms, tick=", perMinuteMs);
          setTimeout(() => {
            const L22 = getLogger7();
            L22.info && L22.info("Starting simulation interval, tick=", perMinuteMs);
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
        if (minute === 45) {
          try {
            const L2 = getLogger7();
            L2.info && L2.info(`\u23F1\uFE0F Intervalo da partida (Jornada ${window.currentJornada}).`);
          } catch (e) {
          }
        }
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
          try {
            const L2 = getLogger7();
            L2.info && L2.info(`\u{1F3C1} Fim dos jogos (Jornada ${window.currentJornada}).`);
          } catch (e) {
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
            const L2 = getLogger7();
            L2.error && L2.error("Fun\xE7\xE3o advanceMatchDay n\xE3o encontrada (matches.js).");
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
      } catch (e) {
      }
      isSimulating = false;
      if (typeof updateClubStatsAfterMatches === "function")
        updateClubStatsAfterMatches(window.currentRoundMatches);
      try {
        const progressContainer = document.getElementById("progress-container");
        if (progressContainer) progressContainer.style.display = "none";
      } catch (e) {
      }
      try {
        if (typeof finishDayAndReturnToHub === "function") {
          finishDayAndReturnToHub();
          return;
        }
      } catch (e) {
      }
      try {
        document.getElementById("screen-match").style.setProperty("display", "none", "important");
        document.getElementById("screen-hub").style.setProperty("display", "flex", "important");
        if (typeof renderHubContent === "function") renderHubContent("menu-standings");
      } catch (e) {
        try {
          const L2 = getLogger7();
          L2.warn && L2.warn("endSimulation fallback failed", e);
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
      } catch (e) {
        try {
          const L2 = getLogger7();
          L2.warn && L2.warn("finishDayAndReturnToHub: error finalizing matches", e);
        } catch (_) {
        }
      }
      window.currentJornada = (window.currentJornada || 1) + 1;
      try {
        if (typeof window.generateRounds === "function" && Array.isArray(window.allDivisions) && window.allDivisions.length) {
          const topDivClubs = window.allDivisions[0] || [];
          const topRounds = window.generateRounds(topDivClubs);
          const seasonLength = Array.isArray(topRounds) ? topRounds.length : 0;
          if (seasonLength > 0) {
            const isMidSeason = window.currentJornada === Math.floor(seasonLength / 2) + 1;
            const isEndSeason = window.currentJornada > seasonLength;
            if (isMidSeason || isEndSeason) processManagerMovements(isEndSeason);
          }
          if (seasonLength > 0 && (window.currentJornada || 0) > seasonLength) {
            try {
              let prizeMsg = "";
              let totalPrize = 0;
              const fm = typeof window.formatMoney === "function" ? window.formatMoney : ((v) => v + " \u20AC");
              const allClubsFlat = window.allClubs || [];
              const sortedByAttack = [...allClubsFlat].sort((a, b) => (b.goalsFor || 0) - (a.goalsFor || 0));
              const sortedByDefense = [...allClubsFlat].sort((a, b) => (a.goalsAgainst || 0) - (b.goalsAgainst || 0));
              if (sortedByAttack[0] === window.playerClub) {
                prizeMsg += "\u{1F3C6} Melhor Ataque Global: +" + fm(5e5) + "\n";
                totalPrize += 5e5;
              }
              if (sortedByDefense[0] === window.playerClub) {
                prizeMsg += "\u{1F6E1}\uFE0F Melhor Defesa Global: +" + fm(5e5) + "\n";
                totalPrize += 5e5;
              }
              const allPlayers = [];
              allClubsFlat.forEach((c) => {
                if (c && c.team && c.team.players) c.team.players.forEach((p) => allPlayers.push({ p, club: c }));
              });
              allPlayers.sort((a, b) => (b.p.goals || 0) - (a.p.goals || 0));
              const globalTop10 = allPlayers.slice(0, 10);
              globalTop10.forEach((item, index) => {
                if (item.club === window.playerClub) {
                  const prize = (10 - index) * 5e4;
                  prizeMsg += `\u{1F45F} ${item.p.name} (${index + 1}\xBA Melhor Marcador): +${fm(prize)}
`;
                  totalPrize += prize;
                }
              });
              if (totalPrize > 0) {
                window.playerClub.budget = (window.playerClub.budget || 0) + totalPrize;
                alert(`FIM DE \xC9POCA - PR\xC9MIOS DE DESEMPENHO

${prizeMsg}
Total recebido: ${fm(totalPrize)}`);
              }
            } catch (e) {
            }
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
                    } catch (e) {
                    }
                  } else {
                    try {
                      localStorage.setItem("elifoot_last_season_results", JSON.stringify(results));
                    } catch (e) {
                    }
                  }
                } catch (e) {
                }
                if (window.Overlays && typeof window.Overlays.showSeasonSummary === "function") {
                  try {
                    window.Overlays.showSeasonSummary({
                      promoted: promoResult.promoted,
                      relegated: promoResult.relegated,
                      champions: promoResult.newDivisions && promoResult.newDivisions[0] && promoResult.newDivisions[0].length ? promoResult.newDivisions[0].slice().sort((a, b) => (b.points || 0) - (a.points || 0))[0] : null
                    });
                  } catch (e) {
                    try {
                      const L2 = getLogger7();
                      L2.warn && L2.warn("Could not show season summary overlay", e);
                    } catch (_) {
                    }
                  }
                } else {
                  try {
                    const L2 = typeof window !== "undefined" && window.Elifoot && window.Elifoot.Logger ? window.Elifoot.Logger : console;
                    L2.info && L2.info(
                      "Season finished \u2014 promotions:",
                      promoResult.promoted,
                      "relegations:",
                      promoResult.relegated
                    );
                  } catch (_) {
                  }
                }
              }
            } catch (e) {
              try {
                const L2 = getLogger7();
                L2.warn && L2.warn("applyPromotionRelegation failed", e);
              } catch (_) {
              }
            }
          }
        }
      } catch (e) {
      }
      try {
        document.getElementById("screen-match").style.setProperty("display", "none", "important");
        document.getElementById("screen-hub").style.setProperty("display", "flex", "important");
        if (typeof renderHubContent === "function") {
          renderHubContent("menu-standings");
        }
      } catch (e) {
      }
      try {
        if (simIntervalId) {
          clearInterval(simIntervalId);
          simIntervalId = null;
        }
      } catch (e) {
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
            } catch (e) {
              try {
                const L2 = getLogger7();
                L2.warn && L2.warn("Erro ao evitar repeti\xE7\xE3o de advers\xE1rio na gera\xE7\xE3o de rondas:", e);
              } catch (_) {
              }
            }
            if (rounds[roundIndex]) nextRoundMatches.push(...rounds[roundIndex]);
          });
          window.currentRoundMatches = nextRoundMatches;
          try {
            assignStartingLineups2(window.currentRoundMatches);
          } catch (e) {
            try {
              const L2 = getLogger7();
              L2.error && L2.error("ERRO ao atribuir lineups:", e);
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
              } catch (e) {
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
          } catch (e) {
          }
        }
      } catch (e) {
        try {
          const L2 = getLogger7();
          L2.warn && L2.warn("finishDayAndReturnToHub main error", e);
        } catch (_) {
        }
      }
      try {
        if (typeof seasonalSkillDrift === "function") seasonalSkillDrift(window.allDivisions);
      } catch (e) {
      }
      try {
        if (typeof selectExpiringPlayersToLeave === "function") {
          selectExpiringPlayersToLeave(window.allDivisions, { probability: 0.35, maxPerClub: 1 });
        }
      } catch (err) {
        try {
          const L2 = getLogger7();
          L2.warn && L2.warn("selectExpiringPlayersToLeave failed in finishDayAndReturnToHub:", err);
        } catch (_) {
        }
      }
      try {
        if (typeof selectPlayersForRelease === "function") {
          selectPlayersForRelease(window.allDivisions, { probability: 0.02, maxPerClub: 1 });
        }
      } catch (err) {
        try {
          const L2 = getLogger7();
          L2.warn && L2.warn("selectPlayersForRelease failed in finishDayAndReturnToHub:", err);
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
              } catch (e) {
                clone.playerValue = 0;
              }
              clone.leavingFee = Math.max(0, Math.round((clone.playerValue || 0) * 0.8));
              clone.previousClubName = club.team && club.team.name || club.name || "";
              clone.originalClubRef = club;
              window.PENDING_RELEASES.push(clone);
            } catch (e) {
            }
          }
        }
      } catch (e) {
        try {
          const L2 = getLogger7();
          L2.warn && L2.warn("ensurePendingReleases filler failed:", e);
        } catch (_) {
        }
      }
      try {
        setTimeout(() => {
          const recentTransfers = (window.TRANSFER_HISTORY || []).filter((t) => t.jornada === window.currentJornada && t.type === "purchase");
          const checkPending = () => {
            const externalReleases = (window.PENDING_RELEASES || []).filter(
              (p) => p.originalClubRef !== window.playerClub
            );
            if (externalReleases.length === 0) {
              if (typeof window.processPendingReleases === "function") window.processPendingReleases();
              window.PENDING_RELEASES = [];
              if (typeof renderHubContent === "function") renderHubContent("menu-team");
              return;
            }
            const processNextRelease = (index) => {
              if (index >= externalReleases.length) {
                if (typeof window.processPendingReleases === "function") window.processPendingReleases();
                window.PENDING_RELEASES = [];
                if (typeof renderHubContent === "function") renderHubContent("menu-team");
                return;
              }
              const p = externalReleases[index];
              showSingleReleasePopup(p, (accepted, offerSalary, rivalClub, rivalSalary) => {
                if (accepted) {
                  const fee = p.leavingFee || 0;
                  if (window.playerClub && (window.playerClub.budget || 0) >= fee) {
                    window.playerClub.budget -= fee;
                    if (!window.playerClub.team.players) window.playerClub.team.players = [];
                    p.salary = offerSalary || p.minContract || p.salary || 0;
                    p.contractYears = 2;
                    window.playerClub.team.players.push(p);
                    if (p.originalClubRef && p.originalClubRef.team && p.originalClubRef.team.players) {
                      const idx = p.originalClubRef.team.players.findIndex((x) => x.id === p.id || x.name === p.name);
                      if (idx !== -1) p.originalClubRef.team.players.splice(idx, 1);
                    }
                    window.TRANSFER_HISTORY = window.TRANSFER_HISTORY || [];
                    window.TRANSFER_HISTORY.push({ player: p.name, from: p.previousClubName || "Mercado Livre", to: window.playerClub.team.name, fee, salary: p.salary, type: "purchase", jornada: window.currentJornada, time: Date.now() });
                    const pendingIdx = window.PENDING_RELEASES.indexOf(p);
                    if (pendingIdx !== -1) window.PENDING_RELEASES.splice(pendingIdx, 1);
                  } else {
                    alert(`N\xE3o tens or\xE7amento suficiente para pagar o pr\xE9mio de assinatura de ${typeof window.formatMoney === "function" ? window.formatMoney(fee) : fee + " \u20AC"}.`);
                  }
                } else if (rivalClub && !accepted) {
                  const fee = p.leavingFee || 0;
                  rivalClub.budget = Math.max(0, (rivalClub.budget || 0) - fee);
                  p.salary = rivalSalary || p.minContract || p.salary || 0;
                  p.contractYears = 2;
                  if (!rivalClub.team.players) rivalClub.team.players = [];
                  rivalClub.team.players.push(p);
                  if (p.originalClubRef && p.originalClubRef.team && p.originalClubRef.team.players) {
                    const idx = p.originalClubRef.team.players.findIndex((x) => x.id === p.id || x.name === p.name);
                    if (idx !== -1) p.originalClubRef.team.players.splice(idx, 1);
                  }
                  window.TRANSFER_HISTORY = window.TRANSFER_HISTORY || [];
                  window.TRANSFER_HISTORY.push({ player: p.name, from: p.previousClubName || "Mercado Livre", to: rivalClub.team.name, fee, salary: p.salary, type: "purchase", jornada: window.currentJornada, time: Date.now() });
                  const pendingIdx = window.PENDING_RELEASES.indexOf(p);
                  if (pendingIdx !== -1) window.PENDING_RELEASES.splice(pendingIdx, 1);
                }
                processNextRelease(index + 1);
              });
            };
            processNextRelease(0);
          };
          const checkJobOffers = () => {
            if (window.Offers && typeof window.Offers.showJobOffersPopup === "function" && window.PLAYER_JOB_OFFERS && window.PLAYER_JOB_OFFERS.length > 0) {
              window.Offers.showJobOffersPopup(checkPending);
            } else {
              checkPending();
            }
          };
          if (window.Offers && typeof window.Offers.showTransferNewsPopup === "function" && recentTransfers.length > 0) {
            window.Offers.showTransferNewsPopup(recentTransfers, checkJobOffers);
          } else {
            checkJobOffers();
          }
        }, 500);
      } catch (e) {
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
      } catch (e) {
        try {
          const L2 = getLogger7();
          L2.warn && L2.warn("Erro ao decrementar suspens\xF5es:", e);
        } catch (_) {
        }
      }
    }
    function fastForwardSeason() {
      if (isSimulating) return alert("J\xE1 existe uma simula\xE7\xE3o a decorrer!");
      if (!confirm("Isto vai simular todos os jogos restantes da \xE9poca instantaneamente. Tem a certeza?")) return;
      isSimulating = true;
      const topDivClubs = window.allDivisions[0] || [];
      const topRounds = window.generateRounds ? window.generateRounds(topDivClubs) : [];
      const totalRounds = topRounds.length || 34;
      let seasonEndData = null;
      let promoData = null;
      try {
        document.getElementById("hub-main-content").innerHTML = '<div style="display:flex; height:100%; justify-content:center; align-items:center;"><h2 style="color:#ffeb3b; text-align:center;">A simular o resto da \xE9poca...<br><span style="font-size:0.6em; color:#aaa;">Isto pode demorar alguns segundos.</span></h2></div>';
      } catch (e) {
      }
      setTimeout(() => {
        while (window.currentJornada <= totalRounds) {
          assignStartingLineups2(window.currentRoundMatches);
          for (let min = 1; min <= 90; min++) {
            if (typeof window.advanceMatchDay === "function") {
              window.advanceMatchDay(window.currentRoundMatches, min);
            }
          }
          if (Array.isArray(window.currentRoundMatches)) {
            window.currentRoundMatches.forEach((m) => {
              if (m) m.isFinished = true;
            });
            updateClubStatsAfterMatches(window.currentRoundMatches);
          }
          window.currentJornada++;
          if (window.currentJornada === Math.floor(totalRounds / 2) + 1) {
            processManagerMovements(false);
          }
          try {
            if (typeof seasonalSkillDrift === "function") seasonalSkillDrift(window.allDivisions);
          } catch (e) {
          }
          try {
            if (typeof selectExpiringPlayersToLeave === "function") selectExpiringPlayersToLeave(window.allDivisions, { probability: 0.35, maxPerClub: 1 });
          } catch (e) {
          }
          try {
            if (typeof selectPlayersForRelease === "function") selectPlayersForRelease(window.allDivisions, { probability: 0.02, maxPerClub: 1 });
          } catch (e) {
          }
          try {
            if (typeof window.processPendingReleases === "function") window.processPendingReleases();
          } catch (e) {
          }
          if (window.currentJornada > totalRounds) {
            processManagerMovements(true);
            try {
              let prizeMsg = "";
              let totalPrize = 0;
              const fm = typeof window.formatMoney === "function" ? window.formatMoney : ((v) => v + " \u20AC");
              const allClubsFlat = window.allClubs || [];
              const sortedByAttack = [...allClubsFlat].sort((a, b) => (b.goalsFor || 0) - (a.goalsFor || 0));
              const sortedByDefense = [...allClubsFlat].sort((a, b) => (a.goalsAgainst || 0) - (b.goalsAgainst || 0));
              if (sortedByAttack[0] === window.playerClub) {
                prizeMsg += "\u{1F3C6} Melhor Ataque Global: +" + fm(5e5) + "\n";
                totalPrize += 5e5;
              }
              if (sortedByDefense[0] === window.playerClub) {
                prizeMsg += "\u{1F6E1}\uFE0F Melhor Defesa Global: +" + fm(5e5) + "\n";
                totalPrize += 5e5;
              }
              if (sortedByAttack[0] === window.playerClub) {
                prizeMsg += "\u{1F3C6} Melhor Ataque: +" + fm(5e5) + "<br>";
                totalPrize += 5e5;
              }
              if (sortedByDefense[0] === window.playerClub) {
                prizeMsg += "\u{1F6E1}\uFE0F Melhor Defesa: +" + fm(5e5) + "<br>";
                totalPrize += 5e5;
              }
              const allPlayers = [];
              allClubsFlat.forEach((c) => {
                if (c && c.team && c.team.players) c.team.players.forEach((p) => allPlayers.push({ p, club: c }));
              });
              allPlayers.sort((a, b) => (b.p.goals || 0) - (a.p.goals || 0));
              const d1 = window.allDivisions[0] || [];
              const championD1 = [...d1].sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                const diffA = (a.goalsFor || 0) - (a.goalsAgainst || 0);
                const diffB = (b.goalsFor || 0) - (b.goalsAgainst || 0);
                if (diffA !== diffB) return diffB - diffA;
                return (b.goalsFor || 0) - (a.goalsFor || 0);
              })[0];
              if (championD1 === window.playerClub) {
                prizeMsg += "\u{1F947} Campe\xE3o 1\xAA Divis\xE3o: +" + fm(2e6) + "<br>";
                totalPrize += 2e6;
              }
              const globalTop10 = allPlayers.slice(0, 10);
              globalTop10.forEach((item, index) => {
                if (item.club === window.playerClub) {
                  const prize = (10 - index) * 5e4;
                  prizeMsg += `\u{1F45F} ${item.p.name} (${index + 1}\xBA Melhor Marcador): +${fm(prize)}
`;
                  prizeMsg += `\u{1F45F} ${item.p.name} (${index + 1}\xBA Melhor Marcador): +${fm(prize)}<br>`;
                  totalPrize += prize;
                }
              });
              if (totalPrize > 0) {
                window.playerClub.budget = (window.playerClub.budget || 0) + totalPrize;
                alert(`FIM DE \xC9POCA - PR\xC9MIOS DE DESEMPENHO

${prizeMsg}
Total recebido: ${fm(totalPrize)}`);
              }
              seasonEndData = { championD1, bestAttack: sortedByAttack[0], bestDefense: sortedByDefense[0], topScorer: allPlayers[0], prizeMsg, totalPrize };
            } catch (e) {
            }
            try {
              if (window.Promotion && typeof window.Promotion.applyPromotionRelegation === "function") {
                const promoResult = window.Promotion.applyPromotionRelegation(window.allDivisions || []);
                window.allDivisions = promoResult.newDivisions || window.allDivisions || [];
                promoData = window.Promotion.applyPromotionRelegation(window.allDivisions || []);
                window.allDivisions = promoData.newDivisions || window.allDivisions || [];
                window.allClubs = (window.allDivisions || []).reduce((acc, d) => acc.concat(d || []), []);
                window.allClubs.forEach((c, idx) => {
                  if (c) c.division = c.division || c.team && c.team.division || Math.floor(idx / 18) + 1;
                });
                alert("A \xE9poca chegou ao fim! Consulte as Classifica\xE7\xF5es e as Estat\xEDsticas.");
              }
            } catch (e) {
            }
            break;
          } else {
            const nextRoundMatches = [];
            (window.allDivisions || []).forEach((divisionClubs) => {
              const rounds = window.generateRounds(divisionClubs);
              const roundIndex = (window.currentJornada - 1) % rounds.length;
              if (rounds[roundIndex]) nextRoundMatches.push(...rounds[roundIndex]);
            });
            window.currentRoundMatches = nextRoundMatches;
          }
        }
        isSimulating = false;
        if (typeof window.renderHubContent === "function") window.renderHubContent("menu-stats");
        setTimeout(() => {
          executePostMatchFlow(seasonEndData, promoData, [], true);
        }, 150);
      }, 150);
    }
    window.Simulation = window.Simulation || {};
    window.Simulation.updateClubStatsAfterMatches = updateClubStatsAfterMatches;
    window.Simulation.assignStartingLineups = assignStartingLineups2;
    window.Simulation.simulateDay = simulateDay;
    window.Simulation.endSimulation = endSimulation;
    window.Simulation.finishDayAndReturnToHub = finishDayAndReturnToHub;
    window.Simulation.fastForwardSeason = fastForwardSeason;
    window.Simulation._showSingleReleasePopup = showSingleReleasePopup;
    window.updateClubStatsAfterMatches = updateClubStatsAfterMatches;
    window.assignStartingLineups = assignStartingLineups2;
    window.simulateDay = simulateDay;
    window.endSimulation = endSimulation;
    window.finishDayAndReturnToHub = finishDayAndReturnToHub;
    window.fastForwardSeason = fastForwardSeason;
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
      const L2 = luminance(bgRgb);
      const contrastWhite = (1 + 0.05) / (L2 + 0.05);
      const contrastBlack = (L2 + 0.05) / (0 + 0.05);
      if (prefHex) {
        try {
          const prefRgb = hexToRgb(prefHex);
          const Lp = luminance(prefRgb);
          const contrastPref = (Math.max(L2, Lp) + 0.05) / (Math.min(L2, Lp) + 0.05);
          if (contrastPref >= Math.max(contrastWhite, contrastBlack)) return prefHex;
        } catch (e) {
        }
      }
      return contrastWhite >= contrastBlack ? "#ffffff" : "#000000";
    } catch (e) {
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
    } catch (e) {
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
  function showRenewContractMenu(player, club, minDemanded, formatMoneyFn, renderTeamRosterFn) {
    const overlayId = "renew-contract-overlay";
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
      overlay.style.background = "rgba(0,0,0,0.7)";
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = "";
    const box = document.createElement("div");
    box.className = "subs-panel transfer-overlay-root";
    box.style.padding = "24px";
    box.style.background = "#2e2e2e";
    box.style.color = "#fff";
    box.style.borderRadius = "10px";
    box.style.boxShadow = "0 10px 40px rgba(0,0,0,0.8)";
    box.style.maxWidth = "420px";
    const html = `
        <h3 style="margin-top:0; color:#4CAF50; font-size:1.5em; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px;">Renova\xE7\xE3o de Contrato</h3>
        <div style="margin-top:16px;font-weight:700;font-size:1.2em;">${player.name} <span style="font-weight:500;opacity:0.85">(${player.position || ""})</span></div>
        <div style="margin-top:8px;font-size:1em;color:#ddd;">O jogador exige um sal\xE1rio m\xEDnimo mensal de <strong style="color:#8BC34A; font-size:1.1em;">${formatMoneyFn(minDemanded)}</strong>.</div>
        <div style="margin-top:24px;display:flex;gap:12px;align-items:center;background:rgba(0,0,0,0.2);padding:16px;border-radius:8px;">
          <label style="min-width:120px;font-weight:bold;opacity:0.9;">Sal\xE1rio a propor:</label>
          <input id="renewSalaryInput" type="number" min="${minDemanded}" value="${minDemanded}" style="width:160px;padding:10px;border-radius:6px;border:1px solid #555;background:#111;color:#fff;font-size:1.1em;font-weight:bold;" />
        </div>
        <div style="margin-top:24px;display:flex;justify-content:flex-end;gap:12px;">
          <button id="renewCancelBtn" style="padding:12px 20px;border-radius:6px;border:none;background:#555;color:#fff;font-weight:bold;cursor:pointer;">Cancelar</button>
          <button id="renewConfirmBtn" style="padding:12px 20px;border-radius:6px;border:none;background:#4CAF50;color:#fff;font-weight:bold;cursor:pointer;">Propor Contrato</button>
        </div>`;
    box.innerHTML = html;
    overlay.appendChild(box);
    setTimeout(() => {
      const cancel = document.getElementById("renewCancelBtn");
      const confirm2 = document.getElementById("renewConfirmBtn");
      const salaryIn = document.getElementById("renewSalaryInput");
      if (cancel) cancel.addEventListener("click", () => {
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      });
      if (confirm2) confirm2.addEventListener("click", () => {
        const proposed = Math.max(1, Math.round(Number(salaryIn.value) || 0));
        if (proposed >= minDemanded) {
          player.salary = proposed;
          player.contractYears = 1;
          player.contractYearsLeft = 1;
          alert(`${player.name} aceitou a proposta de ${formatMoneyFn(proposed)} e renovou por 1 \xE9poca!`);
          if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
          renderTeamRosterFn(club);
        } else {
          alert(`${player.name} recusou a sua proposta! O valor oferecido \xE9 demasiado baixo.`);
          if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }
      });
    }, 10);
  }
  function renderTeamRoster2(club) {
    try {
      const formatMoney4 = window.FootLab && window.FootLab.formatMoney || window.formatMoney || ((v) => String(v));
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
      } catch (e) {
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
        html += `<h4 class="lane-title" style="margin:2px 0 6px 0;">${groupLabels[k]} (${list.length})</h4>`;
        html += `<div class="lane-slots" data-pos="${k}">`;
        (list || []).forEach((p) => {
          const skill = p.skill || 0;
          const barColor = skill >= 80 ? "#4CAF50" : skill >= 70 ? "#8BC34A" : skill >= 60 ? "#FFC107" : "#F44336";
          const salary = p.salary || 0;
          const contractLeft = typeof p.contractYearsLeft !== "undefined" ? p.contractYearsLeft : typeof p.contractYears !== "undefined" ? p.contractYears : 0;
          const contractMarker = Number(contractLeft) > 0 ? "*" : "";
          const displayPos = p._normPos || p.position || p.pos || "";
          html += `<div class="hub-box player-box" data-player-id="${p.id}">
                  <div class="player-header-row">
                    <div class="player-pos">${displayPos}</div>
                    <div class="player-name">${p.name}</div>
                  </div>
                  <div class="skill-bar"><div class="skill-fill" style="width:${skill}%;background:${barColor};"></div></div>
                  <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.92em;">
                    <div style="font-weight:700;color:rgba(255,255,255,0.9);">${skill}</div>
                    <div class="player-salary" data-player-id="${p.id}">${formatMoney4(salary)} <span style="color:#ffeb3b;font-weight:bold;">${contractMarker}</span></div>
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
      } catch (e) {
      }
      content.innerHTML = `<div class="hub-box team-roster-grid" style="color:${teamFg};"><h2 class="team-roster-title">PLANTEL (${enriched.length} jogadores)</h2>${html}</div>`;
      setTimeout(() => {
        try {
          const rowEls = content.querySelectorAll(".player-box");
          rowEls.forEach((r) => {
            r.replaceWith(r.cloneNode(true));
          });
          const freshRows = content.querySelectorAll(".player-box");
          freshRows.forEach((r) => {
            const pid = Number(r.dataset.playerId);
            const player = club.team && Array.isArray(club.team.players) ? club.team.players.find((p) => p.id === pid) : null;
            if (!player) return;
            const contractLeft = typeof player.contractYearsLeft !== "undefined" ? player.contractYearsLeft : player.contractYears || 0;
            const hasContract = Number(contractLeft) > 0;
            if (hasContract) {
              r.style.cursor = "default";
              r.title = "Jogador com contrato ativo.";
            } else {
              r.style.cursor = "pointer";
              r.title = "Sem contrato! Clique para negociar.";
            }
            r.addEventListener("click", (ev) => {
              if (hasContract) return;
              const currentSalary = Number(player.salary || 300);
              const skillLvl = Number(player.skill || 40);
              const raisePercentage = 0.05 + skillLvl / 100 * 0.2;
              let minDemanded = Math.round(currentSalary * (1 + raisePercentage));
              minDemanded = Math.ceil(minDemanded / 10) * 10;
              const absoluteMin = Math.max(300, Math.round(skillLvl * 5));
              minDemanded = Math.max(minDemanded, absoluteMin);
              showRenewContractMenu(player, club, minDemanded, formatMoney4, renderTeamRoster2);
            });
          });
        } catch (e) {
          try {
            const L2 = window.FootLab && window.FootLab.Logger || console;
            L2.warn && L2.warn("Failed to attach negotiation handlers", e);
          } catch (_) {
          }
        }
      }, 10);
      const createFloatingOpponentBox = window.FootLab && window.FootLab.Hub && window.FootLab.Hub.createFloatingOpponentBox || window.createFloatingOpponentBox;
      try {
        if (typeof createFloatingOpponentBox === "function") createFloatingOpponentBox(teamFg);
      } catch (e) {
      }
    } catch (e) {
      try {
        const L2 = window.FootLab && window.FootLab.Logger || console;
        L2.warn && L2.warn("renderTeamRoster failed", e);
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
      let html = `<h2>Transfer\xEAncias</h2><div class="hub-box" style="padding:16px;display:flex;flex-direction:column;gap:12px; border:1px solid rgba(128,128,128,0.2);">`;
      html += `<div style="display:flex; gap:6px; margin-bottom:16px; background:rgba(128,128,128,0.1); padding:6px; border-radius:10px; overflow-x:auto;">
              <button id="tab-market" style="flex:1; padding:10px 16px; border-radius:6px; border:none; background:var(--team-menu-fg, #111); color:var(--team-menu-bg, #eee); font-weight:bold; cursor:pointer; opacity:1; white-space:nowrap; transition:all 0.2s;">Mercado</button>
              <button id="tab-free" style="flex:1; padding:10px 16px; border-radius:6px; border:none; background:transparent; color:inherit; font-weight:bold; cursor:pointer; opacity:0.6; white-space:nowrap; transition:all 0.2s;">Jogadores Livres</button>
              <button id="tab-movements" style="flex:1; padding:10px 16px; border-radius:6px; border:none; background:transparent; color:inherit; font-weight:bold; cursor:pointer; opacity:0.6; white-space:nowrap; transition:all 0.2s;">Movimentos</button>
              <button id="tab-my" style="flex:1; padding:10px 16px; border-radius:6px; border:none; background:transparent; color:inherit; font-weight:bold; cursor:pointer; opacity:0.6; white-space:nowrap; transition:all 0.2s;">Meus</button>
            </div>`;
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
              } catch (e) {
                isOwn = false;
              }
            }
            const btnTitle = isOwn ? "N\xE3o \xE9 poss\xEDvel comprar jogadores do seu pr\xF3prio clube" : "";
            const btnStyle = isOwn ? "padding:10px 16px;border-radius:6px;border:none;background:rgba(128,128,128,0.5);color:inherit;cursor:not-allowed;opacity:0.7;font-weight:bold;" : "padding:10px 16px;border-radius:6px;border:none;background:#4CAF50;color:#fff;font-weight:bold;cursor:pointer;transition:transform 0.2s;";
            const disabledAttr = isOwn ? "disabled" : "";
            html += `<div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:rgba(128,128,128,0.1); border-radius:8px; border:1px solid rgba(128,128,128,0.1); margin-bottom:8px; flex-wrap:wrap; gap:12px;">
                    <div style="display:flex; gap:12px; align-items:center; flex:1; min-width:200px;">
                      <div style="width:40px; font-weight:700; text-align:center; opacity:0.8; background:rgba(128,128,128,0.2); padding:4px 0; border-radius:4px;">${pos}</div>
                      <div style="font-weight:700; font-size:1.1em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px;" title="${name}">${name}</div>
                      <div style="opacity:0.7; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;" title="${club}">${club}</div>
                    </div>
                    <div style="display:flex; gap:16px; align-items:center; justify-content:flex-end;">
                      <div style="font-weight:800; font-size:1.15em; opacity:0.95;">${formatMoney(price)}</div>
                      <button data-player-name="${name}" class="buy-market-btn" title="${btnTitle}" ${disabledAttr} style="${btnStyle}">${isOwn ? "N\xE3o dispon\xEDvel" : "Comprar"}</button>
                    </div>
                  </div>`;
          } catch (e) {
            const name = p && (p.name || p.playerName) || "\u2014";
            html += `<div style="padding:12px;background:rgba(128,128,128,0.1);border-radius:6px;margin-bottom:8px;"><div style="font-weight:600">${name}</div></div>`;
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
          html += `<div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:rgba(128,128,128,0.1); border-radius:8px; border:1px solid rgba(128,128,128,0.1); margin-bottom:8px; flex-wrap:wrap; gap:12px;">
                  <div style="display:flex; gap:12px; align-items:center; flex:1; min-width:250px;">
                    <div style="width:40px; font-weight:700; text-align:center; opacity:0.8; background:rgba(128,128,128,0.2); padding:4px 0; border-radius:4px;">${pos}</div>
                    <div style="font-weight:700; font-size:1.1em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px;" title="${name}">${name}</div>
                    <div style="opacity:0.7; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;" title="${prev}">${prev}</div>
                    <div style="background:rgba(128,128,128,0.2); padding:4px 8px; border-radius:4px; font-size:0.9em; font-weight:bold;">Skill <span style="color:var(--team-menu-fg, inherit); opacity: 0.9;">${skill}</span></div>
                  </div>
                  <div style="display:flex; gap:16px; align-items:center; justify-content:flex-end;">
                    <div style="font-weight:800; font-size:1.1em; color:#4CAF50; text-shadow:0 0 1px rgba(255,255,255,0.2);">M\xEDn: ${formatMoney(minContract)}</div>
                    <button data-free-idx="${idx}" class="buy-free-btn" style="padding:10px 16px; border-radius:6px; border:none; background:#4CAF50; color:#fff; cursor:pointer; font-weight:bold; transition:transform 0.2s;">Assinar</button>
                  </div>
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
            html += `<div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:rgba(128,128,128,0.1); border-radius:8px; border:1px solid rgba(128,128,128,0.1); margin-bottom:8px; flex-wrap:wrap; gap:12px;">
                      <div style="display:flex; flex-direction:column; gap:6px; flex:1; min-width:200px;">
                        <div style="font-weight:700; font-size:1.1em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${player}">${player}</div>
                        <div style="opacity:0.8; font-size:0.9em; font-weight:600; display:flex; gap:8px; flex-wrap:wrap;">
                          <span><strong style="opacity:0.7;">De:</strong> ${from}</span> 
                          <span>\u2794</span> 
                          <span><strong style="opacity:0.7;">Para:</strong> ${to}</span>
                          <span style="opacity:0.6;">\xB7 ${when}</span>
                        </div>
                      </div>
                      <div style="text-align:right; font-size:1.05em; font-weight:bold; opacity:0.95; display:flex; flex-direction:column; gap:4px;">
                        <span style="font-size: 1.1em;">${fee ? formatMoney(fee) : "Custo Zero"}</span>
                        <span style="font-size:0.85em; opacity:0.8; color:var(--team-menu-fg, inherit);">${salary ? formatMoney(salary) + " /m\xEAs" : ""}</span>
                      </div>
                    </div>`;
          });
        }
      } catch (e) {
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
            html += `<div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:rgba(128,128,128,0.1); border-radius:8px; border:1px solid rgba(128,128,128,0.1); margin-bottom:8px; flex-wrap:wrap; gap:12px;">
                      <div style="display:flex; flex-direction:column; gap:6px; flex:1; min-width:200px;">
                        <div style="font-weight:700; font-size:1.1em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${player}">${player}</div>
                        <div style="opacity:0.8; font-size:0.9em; font-weight:600; display:flex; gap:8px; flex-wrap:wrap;">
                          <span><strong style="opacity:0.7;">De:</strong> ${from}</span> 
                          <span>\u2794</span> 
                          <span><strong style="opacity:0.7;">Para:</strong> ${to}</span>
                          <span style="opacity:0.6;">\xB7 ${when}</span>
                        </div>
                      </div>
                      <div style="text-align:right; font-size:1.05em; font-weight:bold; opacity:0.95; display:flex; flex-direction:column; gap:4px;">
                        <span style="font-size: 1.1em;">${fee ? formatMoney(fee) : "Custo Zero"}</span>
                        <span style="font-size:0.85em; opacity:0.8; color:var(--team-menu-fg, inherit);">${salary ? formatMoney(salary) + " /m\xEAs" : ""}</span>
                      </div>
                    </div>`;
          });
        }
      } catch (e) {
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
            const allTabBtns = [tabMarket, tabFree, tabMov, tabMy].filter(Boolean);
            allTabBtns.forEach((b) => {
              b.style.background = "transparent";
              b.style.color = "inherit";
              b.style.opacity = "0.6";
            });
            const activeBtn = name === "market" ? tabMarket : name === "free" ? tabFree : name === "movements" ? tabMov : tabMy;
            if (activeBtn) {
              activeBtn.style.background = "var(--team-menu-fg, #111)";
              activeBtn.style.color = "var(--team-menu-bg, #eee)";
              activeBtn.style.opacity = "1";
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
        } catch (e) {
          try {
            const L2 = window.Elifoot && window.Elifoot.Logger || console;
            L2.warn && L2.warn("attach transfer handlers failed", e);
          } catch (e2) {
            const L2 = window.FootLab && window.FootLab.Logger || console;
            L2.warn && L2.warn("attach transfer handlers failed", e2);
          }
        }
      }, 10);
    } catch (e) {
      try {
        const L2 = window.FootLab && window.FootLab.Logger || console;
        L2.warn && L2.warn("renderTransfers failed", e);
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
      box.style.background = "#2e2e2e";
      box.style.color = "#ffffff";
      box.style.padding = "30px";
      box.style.borderRadius = "12px";
      box.style.boxShadow = "0 15px 40px rgba(0,0,0,0.8)";
      box.style.border = "1px solid rgba(255,255,255,0.1)";
      const skill = pl.skill || 0;
      const minC = Math.max(0, Number(pl.minContract || pl.minMonthly || pl.minSalary || 0));
      const prev = pl.previousClubName || pl.club && (pl.club.team ? pl.club.team.name : pl.club.name) || pl.clubName || "\u2014";
      const html = `
          <h3 style="margin-top:0; color:#4CAF50; font-size:1.5em; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px;">Assinar Jogador Livre</h3>
          <div style="margin-top:16px;font-weight:700;font-size:1.2em;">${pl.name} <span style="font-weight:500;opacity:0.85">(${pl.position || ""})</span></div>
          <div style="margin-top:8px;opacity:0.8;font-size:1em;">Skill: ${skill} \xB7 Clube anterior: ${prev}</div>
          <div style="margin-top:8px;font-size:1em;">Sal\xE1rio M\xEDnimo: <strong style="color:#8BC34A">${formatMoney(minC)}</strong></div>
          <div style="margin-top:24px;display:flex;gap:12px;align-items:center;background:rgba(0,0,0,0.2);padding:16px;border-radius:8px;">
            <label style="min-width:120px;font-weight:bold;opacity:0.9;">Sal\xE1rio a Propor:</label>
            <input id="buyFreeSalaryInput" type="number" min="${minC}" value="${minC || Math.max(500, Number(pl.salary || 500))}" style="width:160px;padding:10px;border-radius:6px;border:1px solid #555;background:#111;color:#fff;font-size:1.1em;font-weight:bold;" />
          </div>
          <div style="margin-top:24px;display:flex;justify-content:flex-end;gap:12px;">
            <button id="buyFreeCancelBtn" style="padding:12px 20px;border-radius:6px;border:none;background:#555;color:#fff;font-weight:bold;cursor:pointer;">Cancelar</button>
            <button id="buyFreeConfirmBtn" style="padding:12px 20px;border-radius:6px;border:none;background:#4CAF50;color:#fff;font-weight:bold;cursor:pointer;">Assinar (1 ano)</button>
          </div>`;
      box.innerHTML = html;
      overlay.appendChild(box);
      setTimeout(() => {
        const cancel = document.getElementById("buyFreeCancelBtn");
        const confirm2 = document.getElementById("buyFreeConfirmBtn");
        const salaryIn = document.getElementById("buyFreeSalaryInput");
        if (cancel)
          cancel.addEventListener("click", () => {
            try {
              if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
            } catch (e) {
            }
          });
        if (confirm2)
          confirm2.addEventListener("click", () => {
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
    } catch (e) {
      try {
        const L2 = window.FootLab && window.FootLab.Logger || console;
        L2.warn && L2.warn("showBuyFreePlayerMenu failed", e);
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
      const FootLab3 = window.FootLab || window.Elifoot || window;
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
      <h2>Finan\xE7as do Clube</h2>
      
      <div class="hub-box" style="margin-bottom: 20px; max-width: 800px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05);">
        <h3 style="margin-top:0; margin-bottom: 15px; color:#ffeb3b; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">Est\xE1dio & Infraestruturas</h3>
        
        <div style="margin-bottom: 20px;">
          <div style="display:flex; justify-content: space-between;">
            <span>Capacidade Atual: <strong><span id="stadiumCapacityDisplay">${stadiumCap.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</span> lugares</strong></span>
            <span style="color:#aaa; font-size: 0.85em;">M\xE1x: 100.000 lugares</span>
          </div>
          <div style="width: 100%; height: 12px; background: rgba(0,0,0,0.4); border-radius: 6px; margin: 8px 0; overflow:hidden;">
            <div style="width: ${Math.min(100, stadiumCap / 1e5 * 100)}%; height: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A); border-radius: 6px; transition: width 0.3s;"></div>
          </div>
          <div style="font-size:0.85em; color:#999; margin-bottom: 12px;">O custo por lugar aumenta \xE0 medida que o est\xE1dio cresce. O limite m\xE1ximo permitido pela c\xE2mara \xE9 de 100.000 lugares.</div>
          <div style="display:flex; gap:12px; align-items:center; margin-top: 12px;">
            <label style="font-size:0.9em; color:#ccc;">Expandir est\xE1dio (%):</label>
            <input id="upgradePercentInput" type="number" min="1" max="100" value="5" style="width:70px; padding:6px; border-radius:4px; border:1px solid #555; background:#222; color:#fff;" />
            <button id="upgradeStadiumBtn" style="padding:6px 12px; border-radius:4px; background:#4CAF50; color:white; border:none; cursor:pointer; font-weight:bold;">Aumentar</button>
            <span id="upgradeCostDisplay" style="font-size:0.9em; color:#bbb; margin-left:10px;"></span>
          </div>
        </div>
      </div>
      
      <div class="hub-box" style="max-width: 800px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05);">
        <h3 style="margin-top:0; margin-bottom: 15px; color:#ffeb3b; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">Bilheteira & Tesouraria</h3>
        <div style="font-size: 1.2em; margin-bottom: 15px;">Saldo Atual: <strong style="color:#4CAF50;" id="clubBudgetDisplay">${formatMoney(bud)}</strong></div>
        
        <div style="display:flex; gap:12px; align-items:center;">
            <label style="min-width:140px; color:#ccc;">Pre\xE7o do Bilhete (\u20AC):</label>
            <input id="ticketPriceInput" type="number" min="1" value="${ticketPrice}" style="width:90px; padding:8px; border-radius:4px; border:1px solid #555; background:#222; color:#fff; font-weight:bold;" />
            <button id="setTicketBtn" style="padding:8px 16px; border-radius:4px; background:#2196F3; border:none; cursor:pointer; color:#fff; font-weight:bold;">Aplicar Novo Pre\xE7o</button>
        </div>
        <div style="margin-top:8px; font-size:0.85em; color:#999;">Pre\xE7os altos afastam os adeptos em jogos normais, mas jogos grandes (contra equipas de topo) suportam bilhetes mais caros!</div>
        <div id="estRevenueDisplay" style="margin-top:12px; font-size:0.95em; color:#bbb; background:rgba(0,0,0,0.2); padding:10px; border-radius:6px;"></div>
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
            const basePrice = (c.division || 4) === 1 ? 30 : (c.division || 4) === 2 ? 25 : (c.division || 4) === 3 ? 18 : 12;
            const selectedPrice = Math.max(1, Number(priceIn.value || 20));
            let priceFactor = basePrice / selectedPrice;
            priceFactor = Math.max(0.2, Math.min(1.5, priceFactor));
            const cap = Number(c.stadiumCapacity || 1e4);
            const members = Number(c.members || Math.floor(cap * 0.5));
            const baseFill = 0.5 * 0.7 * priceFactor;
            let estAttendance = members + Math.floor((cap - members) * baseFill);
            if (estAttendance > cap) estAttendance = cap;
            estDisp.innerHTML = `Estimativa Assist\xEAncia (Meio da Tabela): <strong>${estAttendance.toLocaleString()} espectadores</strong><br/>
                               Estimativa Receita por Jogo: <strong style="color:#4CAF50;">${formatMoney(Math.round(estAttendance * selectedPrice))}</strong>`;
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
              if (FootLab3 && FootLab3.Persistence && typeof FootLab3.Persistence.saveSnapshot === "function") {
                try {
                  FootLab3.Persistence.saveSnapshot(snap);
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
            } catch (e) {
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
              if (FootLab3 && FootLab3.Persistence && typeof FootLab3.Persistence.saveSnapshot === "function") {
                try {
                  FootLab3.Persistence.saveSnapshot(snap);
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
            } catch (e) {
            }
            alert("Pre\xE7o do bilhete atualizado para " + formatMoney(price));
            updateCostDisplay();
          });
        } catch (e) {
        }
      }, 10);
    } catch (e) {
      try {
        const L2 = window.FootLab && window.FootLab.Logger || window.Elifoot && window.Elifoot.Logger || console;
        L2.warn && L2.warn("renderFinance failed", e);
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
    let validTactics = tactics;
    if (team && window.FootLab && window.FootLab.Lineups && typeof window.FootLab.Lineups.getCompatibleTactics === "function") {
      validTactics = window.FootLab.Lineups.getCompatibleTactics(team);
    }
    validTactics.forEach((tactic) => {
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
      const L2 = window.FootLab && window.FootLab.Logger ? window.FootLab.Logger : console;
      L2.info && L2.info("Painel de t\xE1ticas inicializado");
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

  // src/ui/history.mjs
  function renderHistory() {
    const content = document.getElementById("hub-main-content");
    if (!content) return;
    const history = window.TRANSFER_HISTORY || [];
    const formatMoney4 = window.formatMoney || ((v) => v + " \u20AC");
    if (history.length === 0) {
      content.innerHTML = `
      <h2>Hist\xF3rico de Transfer\xEAncias</h2>
      <div class="hub-box" style="padding: 30px; text-align: center; color: #aaa;">
        Nenhuma transfer\xEAncia registada at\xE9 ao momento.<br>
        <span style="font-size:0.85em; color: #777;">As movimenta\xE7\xF5es do mercado (compras, vendas e dispensas) aparecer\xE3o aqui \xE0 medida que a \xE9poca avan\xE7a.</span>
      </div>`;
      return;
    }
    const sorted = history.slice().reverse();
    let html = `<h2>Hist\xF3rico de Transfer\xEAncias</h2>
    <div class="hub-box" style="padding: 0; overflow: hidden;">
      <table style="width:100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr>
            <th style="padding:14px 16px; background:rgba(0,0,0,0.4); border-bottom:2px solid #444; color:#888; width: 60px;">Jor.</th>
            <th style="padding:14px 16px; background:rgba(0,0,0,0.4); border-bottom:2px solid #444; color:#888;">Jogador</th>
            <th style="padding:14px 16px; background:rgba(0,0,0,0.4); border-bottom:2px solid #444; color:#888;">De</th>
            <th style="padding:14px 16px; background:rgba(0,0,0,0.4); border-bottom:2px solid #444; color:#888;">Para</th>
            <th style="padding:14px 16px; background:rgba(0,0,0,0.4); border-bottom:2px solid #444; color:#888; text-align:right;">Valor</th>
          </tr>
        </thead>
        <tbody>`;
    sorted.forEach((t, i) => {
      const isPurchase = t.type === "purchase";
      const feeColor = isPurchase && t.fee > 0 ? "#4CAF50" : "#aaa";
      const feeStr = t.fee > 0 ? formatMoney4(t.fee) : "Custo Zero";
      const rowBg = i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent";
      html += `<tr style="background: ${rowBg}; border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s;">
        <td style="padding:12px 16px; color:#ccc;">${t.jornada || "-"}</td>
        <td style="padding:12px 16px; font-weight:bold; color:#fff;">${t.player}</td>
        <td style="padding:12px 16px; color:#bbb;">${t.from || "Livre"}</td>
        <td style="padding:12px 16px; color:#bbb;">${t.to || "Livre"}</td>
        <td style="padding:12px 16px; text-align:right; font-weight:bold; color:${feeColor};">${feeStr}</td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
    content.innerHTML = html;
  }

  // src/ui/stats.mjs
  function renderStats() {
    const content = document.getElementById("hub-main-content");
    if (!content) return;
    const allClubs2 = window.allClubs || [];
    const playerClub2 = window.playerClub;
    const myDiv = playerClub2 ? playerClub2.division : 4;
    let allPlayers = [];
    allClubs2.forEach((c) => {
      if (c && c.team && Array.isArray(c.team.players)) {
        c.team.players.forEach((p) => {
          if (p.goals > 0) {
            allPlayers.push({
              name: p.name,
              goals: p.goals || 0,
              clubName: c.team.name,
              clubBg: c.team.bgColor || "#333",
              clubFg: c.team.color || "#fff",
              division: c.division,
              isMine: c === playerClub2
            });
          }
        });
      }
    });
    allPlayers.sort((a, b) => b.goals - a.goals);
    const globalTop10 = allPlayers.slice(0, 10);
    const divTop10 = allPlayers.filter((p) => p.division === myDiv).slice(0, 10);
    const sortedByAttack = [...allClubs2].sort((a, b) => (b.goalsFor || 0) - (a.goalsFor || 0)).slice(0, 5);
    const sortedByDefense = [...allClubs2].sort((a, b) => {
      const gaA = a.goalsAgainst || 0;
      const gaB = b.goalsAgainst || 0;
      if (gaA !== gaB) return gaA - gaB;
      return (b.goalsFor || 0) - (a.goalsFor || 0);
    }).slice(0, 5);
    const renderTeamList = (list, statKey, statName) => {
      let str = `<table style="width:100%; border-collapse: collapse; font-size:0.9em; text-align:left;">`;
      list.forEach((c, idx) => {
        const isMe = c === playerClub2;
        const bgRow = isMe ? "rgba(255,255,255,0.1)" : "transparent";
        const badge = `<div style="width:14px;height:14px;border-radius:3px;background:${c.team.bgColor};border:1px solid ${c.team.color};display:inline-block;margin-right:6px;vertical-align:middle;"></div>`;
        str += `<tr style="background:${bgRow}; border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:8px 4px; color:#aaa; width:20px;">${idx + 1}\xBA</td>
                <td style="padding:8px 4px; color:#fff; font-weight:${isMe ? "bold" : "normal"};">${badge}${c.team.name}</td>
                <td style="padding:8px 4px; color:#ffeb3b; font-weight:bold; text-align:right;">${c[statKey] || 0}</td>
              </tr>`;
      });
      str += `</table>`;
      return str;
    };
    const renderScorers = (list) => {
      if (list.length === 0) return `<div style="padding:20px; color:#888; text-align:center;">Ainda n\xE3o h\xE1 golos registados.</div>`;
      let str = `<table style="width:100%; border-collapse: collapse; font-size:0.95em; text-align:left; margin-top:10px;">
                 <thead><tr style="border-bottom:2px solid #444; color:#888;">
                   <th style="padding:10px 8px;">Pos</th><th style="padding:10px 8px;">Jogador</th><th style="padding:10px 8px;">Equipa</th><th style="padding:10px 8px; text-align:right;">Golos</th>
                 </tr></thead><tbody>`;
      list.forEach((p, idx) => {
        const bgRow = p.isMine ? "rgba(255,255,255,0.1)" : "transparent";
        const badge = `<div style="width:16px;height:16px;border-radius:3px;background:${p.clubBg};border:1px solid ${p.clubFg};display:inline-block;margin-right:8px;vertical-align:middle;"></div>`;
        str += `<tr style="background:${bgRow}; border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:10px 8px; color:#aaa; font-weight:bold;">${idx + 1}\xBA</td>
                <td style="padding:10px 8px; color:#fff; font-weight:bold;">${p.name}</td>
                <td style="padding:10px 8px; color:#bbb;">${badge}${p.clubName}</td>
                <td style="padding:10px 8px; color:#4CAF50; font-weight:bold; text-align:right; font-size:1.1em;">${p.goals}</td>
              </tr>`;
      });
      str += `</tbody></table>`;
      return str;
    };
    content.innerHTML = `
    <h2 style="margin-bottom:15px;">Estat\xEDsticas da \xC9poca</h2>
    <div style="display:flex; gap: 20px; flex-wrap: wrap;">
      
      <!-- Marcadores Box -->
      <div class="hub-box" style="flex: 2; min-width: 320px; background: rgba(0,0,0,0.3);">
        <div style="display:flex; justify-content: space-between; align-items: center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">
          <h3 style="margin:0; color:#ffeb3b;">Top 10 Marcadores</h3>
          <div style="display:flex; gap: 8px;">
            <button id="btn-tab-div" style="padding:6px 12px; background:#2196F3; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Divis\xE3o ${myDiv}</button>
            <button id="btn-tab-glob" style="padding:6px 12px; background:#444; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Global</button>
          </div>
        </div>
        <div id="scorers-table-container">${renderScorers(divTop10)}</div>
      </div>

      <!-- Clubes Box -->
      <div style="flex: 1; min-width: 250px; display:flex; flex-direction:column; gap:20px;">
        <div class="hub-box" style="background: rgba(0,0,0,0.3); padding:15px;"><h3 style="margin:0 0 10px 0; color:#4CAF50;">\u{1F3C6} Melhor Ataque</h3>${renderTeamList(sortedByAttack, "goalsFor")}</div>
        <div class="hub-box" style="background: rgba(0,0,0,0.3); padding:15px;"><h3 style="margin:0 0 10px 0; color:#2196F3;">\u{1F6E1}\uFE0F Melhor Defesa</h3>${renderTeamList(sortedByDefense, "goalsAgainst")}</div>
      </div>
    </div>
  `;
    setTimeout(() => {
      const btnDiv = document.getElementById("btn-tab-div");
      const btnGlob = document.getElementById("btn-tab-glob");
      const container = document.getElementById("scorers-table-container");
      if (btnDiv) btnDiv.onclick = () => {
        container.innerHTML = renderScorers(divTop10);
        btnDiv.style.background = "#2196F3";
        btnGlob.style.background = "#444";
      };
      if (btnGlob) btnGlob.onclick = () => {
        container.innerHTML = renderScorers(globalTop10);
        btnGlob.style.background = "#2196F3";
        btnDiv.style.background = "#444";
      };
    }, 10);
  }

  // src/ui/hub-controller.mjs
  var FootLab2 = window.FootLab || window.Elifoot || window;
  function updateBudgetDisplays(club) {
    try {
      const safeFormatMoney = typeof window.formatMoney === "function" ? window.formatMoney : (v) => !v && v !== 0 ? "0 \u20AC" : Math.floor(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " \u20AC";
      const headerBudget = document.getElementById("club-budget");
      const finBudget = document.getElementById("clubBudgetDisplay");
      const revEl = document.getElementById("club-revenue");
      const expEl = document.getElementById("club-expenses");
      const val = Number(club && (Number(club.budget) || 0) || 0);
      if (headerBudget) headerBudget.textContent = safeFormatMoney(val);
      if (finBudget) finBudget.textContent = safeFormatMoney(val);
      try {
        const rev = Number(club && (Number(club.revenue) || 0) || 0);
        const exp = Number(club && (Number(club.expenses) || 0) || 0);
        if (revEl) revEl.textContent = safeFormatMoney(rev);
        if (expEl) expEl.textContent = safeFormatMoney(exp);
      } catch (e) {
      }
    } catch (e) {
      console.warn("Erro ao atualizar painel de finan\xE7as:", e);
    }
  }
  function renderHubContent2(menuId) {
    const content = document.getElementById("hub-main-content");
    if (!content) return;
    if (window.playerClub) updateBudgetDisplays(window.playerClub);
    if (typeof window.updateNextOpponentDisplay === "function") {
      window.updateNextOpponentDisplay();
    }
    const menuButtons = document.querySelectorAll("#hub-menu .hub-menu-btn");
    menuButtons.forEach((b) => {
      b.style.background = "";
      b.style.color = "";
      b.style.boxShadow = "";
      if (b.id === menuId) b.classList.add("active");
      else b.classList.remove("active");
    });
    switch (menuId) {
      case "menu-team":
        try {
          renderTeamRoster2(window.playerClub);
        } catch (e) {
          if (typeof window.renderTeamRoster === "function")
            window.renderTeamRoster(window.playerClub);
        }
        break;
      case "menu-transfers":
        try {
          renderTransfers();
        } catch (e) {
          if (typeof window.renderTransfers === "function") window.renderTransfers();
        }
        break;
      case "menu-finance":
        try {
          renderFinance(window.playerClub);
        } catch (e) {
          if (typeof window.renderFinance === "function") window.renderFinance(window.playerClub);
        }
        break;
      case "menu-next-match":
        try {
          if (typeof window.renderNextMatchMenu === "function") {
            window.renderNextMatchMenu();
          } else {
            content.innerHTML = '<h2>Pr\xF3ximo Jogo</h2><div id="nextMatchDetails">\u2014</div>';
          }
        } catch (e) {
          content.innerHTML = '<h2>Pr\xF3ximo Jogo</h2><div id="nextMatchDetails">\u2014</div>';
        }
        break;
      case "menu-liga":
        try {
          if (typeof window.renderLeagueTable === "function") window.renderLeagueTable();
        } catch (e) {
        }
        break;
      case "menu-standings":
        try {
          if (typeof window.renderAllDivisionsTables === "function")
            window.renderAllDivisionsTables();
        } catch (e) {
        }
        break;
      case "menu-history":
        try {
          renderHistory();
        } catch (e) {
          if (typeof window.renderHistory === "function") window.renderHistory();
        }
        break;
      case "menu-stats":
        try {
          renderStats();
        } catch (e) {
          if (typeof window.renderStats === "function") window.renderStats();
        }
        break;
      case "menu-load":
        try {
          const saves = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("footlab_save_")) {
              try {
                const parsed = JSON.parse(localStorage.getItem(key));
                saves.push({ key, name: key.replace("footlab_save_", ""), data: parsed });
              } catch (e) {
              }
            }
          }
          const oldSaveRaw = localStorage.getItem("footlab_t1_save_snapshot");
          if (oldSaveRaw) {
            try {
              const oldSaveParsed = JSON.parse(oldSaveRaw);
              if (!saves.find((s) => s.name === "Save Antigo (Autom\xE1tico)")) {
                saves.push({ key: "footlab_t1_save_snapshot", name: "Save Antigo (Autom\xE1tico)", data: oldSaveParsed });
              }
            } catch (e) {
            }
          }
          if (saves.length === 0) {
            content.innerHTML = "<h2>Carregar Jogo</h2><p>Nenhum jogo salvo encontrado.</p>";
            break;
          }
          let html = '<h2>Carregar Jogo</h2><p>Selecione a grava\xE7\xE3o que deseja carregar:</p><div style="display:flex; flex-direction:column; gap:10px; margin-top:15px; max-width:500px;">';
          saves.forEach((save) => {
            html += `
            <div style="padding:12px;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.05);border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
              <div>
                <strong style="color:#ffeb3b;font-size:1.1em;">${save.name}</strong><br>
                <span style="font-size:0.85em;color:#aaa;">Jornada: ${save.data.currentJornada || "-"} | Clube: ${save.data.playerClub && save.data.playerClub.team && save.data.playerClub.team.name || "-"}</span>
              </div>
              <button class="load-specific-btn" data-key="${save.key}" style="padding:8px 16px;border-radius:6px;border:none;background:#2196F3;color:white;cursor:pointer;font-weight:bold;transition:background 0.2s;">Carregar</button>
            </div>
          `;
          });
          html += "</div>";
          content.innerHTML = html;
          const btns = content.querySelectorAll(".load-specific-btn");
          btns.forEach((btn) => {
            btn.addEventListener("click", (e) => {
              const key = e.target.getAttribute("data-key");
              const saveData = localStorage.getItem(key);
              localStorage.setItem("footlab_t1_save_snapshot", saveData);
              if (typeof window.loadSavedGame === "function") {
                window.loadSavedGame();
              } else {
                alert("Carregado! Por favor fa\xE7a refresh \xE0 p\xE1gina caso n\xE3o inicie sozinho.");
              }
            });
          });
        } catch (e) {
          content.innerHTML = "<h2>Carregar Jogo</h2><p>Erro ao ler o save.</p>";
        }
        break;
      case "save-game":
        try {
          content.innerHTML = `
          <h2>Gravar Jogo</h2>
          <p>Guarde o estado atual do jogo para carregar mais tarde.</p>
          <div style="margin-top:20px; display:flex; flex-direction:column; gap:12px; max-width:320px; background:rgba(0,0,0,0.2); padding:20px; border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
            <label for="saveGameName" style="font-size:0.9em; color:#ccc;">Nome da grava\xE7\xE3o:</label>
            <input type="text" id="saveGameName" placeholder="Ex: Minha Carreira" style="padding:10px 12px; border-radius:6px; border:1px solid #444; background:#222; color:#fff; font-size:1em;">
            <button id="doSaveBtn" style="padding:12px; border-radius:6px; border:none; background:#4CAF50; color:white; cursor:pointer; font-weight:bold; font-size:1.05em; margin-top:5px;">Gravar Jogo</button>
          </div>
        `;
          const btn = document.getElementById("doSaveBtn");
          if (btn)
            btn.addEventListener("click", () => {
              try {
                const inputName = document.getElementById("saveGameName").value.trim();
                const saveName = inputName || "Save_" + (/* @__PURE__ */ new Date()).toLocaleString().replace(/[:/]/g, "-");
                const saveKey = "footlab_save_" + saveName;
                const snap = {
                  currentJornada: window.currentJornada,
                  playerClub: window.playerClub,
                  allDivisions: window.allDivisions,
                  allClubs: window.allClubs,
                  currentRoundMatches: window.currentRoundMatches,
                  seasonCalendar: window.seasonCalendar || [],
                  freeTransfers: window.FREE_TRANSFERS || [],
                  pendingReleases: window.PENDING_RELEASES || [],
                  transferHistory: window.TRANSFER_HISTORY || []
                };
                try {
                  localStorage.setItem(saveKey, JSON.stringify(snap));
                } catch (_) {
                }
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
                alert("Jogo gravado com sucesso com o nome: " + saveName);
                document.getElementById("saveGameName").value = "";
              } catch (e) {
                alert("Erro ao gravar o jogo: " + (e && e.message));
              }
            });
        } catch (e) {
          content.innerHTML = "<h2>Gravar Jogo</h2><p>Erro ao preparar grava\xE7\xE3o.</p>";
        }
        break;
      default:
        content.innerHTML = "<h2>Bem-vindo!</h2><p>Selecione uma op\xE7\xE3o no menu.</p>";
    }
  }
  function initHubUI(playerClub2) {
    const E2 = window.FootLab || window.Elifoot || window;
    try {
      const L2 = E2 && E2.Logger || console;
      L2.debug && L2.debug("Initializing Hub Controller with playerClub:", playerClub2);
    } catch (_) {
    }
    if (playerClub2 && !E2.playerClub) E2.playerClub = playerClub2;
    const club = E2.playerClub;
    try {
      const coachNameDisplay = document.getElementById("coachNameDisplay");
      const playerTeamNameHub = document.getElementById("playerTeamNameHub");
      const playerTeamNameFooter = document.getElementById("playerTeamNameFooter");
      if (coachNameDisplay && club && club.coach) coachNameDisplay.textContent = club.coach.name;
      if (playerTeamNameHub && club && club.team) playerTeamNameHub.textContent = club.team.name;
      if (playerTeamNameFooter && club && club.team)
        playerTeamNameFooter.textContent = club.team.name;
    } catch (e) {
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
    } catch (e) {
    }
    updateBudgetDisplays(club);
    renderHubContent2("menu-team");
    try {
      const opponentDetails = document.getElementById("nextOpponentDetails");
      if (opponentDetails) {
        const html = window.Hub && window.Hub.buildNextOpponentHtml && typeof window.Hub.buildNextOpponentHtml === "function" ? window.Hub.buildNextOpponentHtml() : typeof buildNextOpponentHtml === "function" ? buildNextOpponentHtml() : "\u2014";
        opponentDetails.innerHTML = html;
      }
    } catch (e) {
    }
    initTacticPanel();
    const menuButtons = document.querySelectorAll("#hub-menu .hub-menu-btn");
    menuButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const menuId = e.target.id;
        renderHubContent2(menuId);
      });
    });
    const simulateBtn = document.getElementById("simulateBtnHub");
    if (simulateBtn && (E2 && typeof E2.simulateDay === "function" || typeof window.simulateDay === "function")) {
      simulateBtn.addEventListener("click", (e) => {
        try {
          if (typeof window !== "undefined" && e && e.isTrusted) window.__userInitiatedSim = true;
        } catch (_) {
        }
        const simFn = E2 && E2.simulateDay || window.simulateDay;
        if (!simFn || typeof simFn !== "function") return;
        try {
          simFn();
        } catch (err) {
          try {
            const L2 = E2 && E2.Logger || console;
            L2.warn && L2.warn("simulateDay failed", err);
          } catch (_) {
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
    } catch (e) {
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
    const FootLab3 = window.FootLab || window.Elifoot || {};
    return FootLab3 && FootLab3.Finance || window.Finance;
  }
  function getLogger3() {
    const FootLab3 = window.FootLab || window.Elifoot || {};
    return FootLab3 && FootLab3.Logger ? FootLab3.Logger : console;
  }
  function renderInitialMatchBoard2(allDivisions2) {
    const FootLab3 = window.FootLab || window.Elifoot || {};
    const allMatches = FootLab3 && FootLab3.currentRoundMatches || window.currentRoundMatches || [];
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
      if ((FootLab3 && FootLab3.GAME_NAME || window.GAME_NAME) && typeof document !== "undefined") {
        const gameName = FootLab3 && FootLab3.GAME_NAME || window.GAME_NAME;
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
            } catch (e) {
              attendance = null;
            }
            specEl.textContent = attendance === null || typeof attendance === "undefined" ? "\u2014" : `${attendance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
          });
        } catch (e) {
        }
      }
    });
    try {
      adjustMatchBoardSizing();
    } catch (e) {
    }
  }
  function updateMatchBoardLine2(matchIndex, matchResult) {
    const FootLab3 = window.FootLab || window.Elifoot || {};
    const DEBUG_MATCH_SIM = FootLab3 && FootLab3.DEBUG_MATCH_SIM || window.DEBUG_MATCH_SIM;
    if (DEBUG_MATCH_SIM) {
      try {
        const L2 = FootLab3 && FootLab3.Logger ? FootLab3.Logger : console;
        L2.debug && L2.debug("DBG updateMatchBoardLine called", {
          matchIndex,
          hasGoals: Array.isArray(matchResult.goals) ? matchResult.goals.length : 0
        });
      } catch (e) {
      }
    }
    const lineElement = document.getElementById(`match-line-${matchIndex}`);
    if (!lineElement) {
      if (window.DEBUG_MATCH_SIM)
        try {
          const L2 = getLogger3();
          L2.warn && L2.warn("DBG updateMatchBoardLine: element not found for index", matchIndex);
        } catch (e) {
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
        } catch (e) {
          attendance = null;
        }
      }
      if (specEl) {
        specEl.textContent = attendance === null || typeof attendance === "undefined" ? "\u2014" : `${attendance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
      }
    } catch (e) {
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
    } catch (e) {
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
    } catch (e) {
    }
  });

  // src/ui/overlays/intro.mjs
  var intro_exports = {};
  __export(intro_exports, {
    setIntroColors: () => setIntroColors,
    showIntroOverlay: () => showIntroOverlay2
  });
  function getLogger4() {
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
      const E2 = window.FootLab || window;
      const overlay = document.getElementById("intro-overlay");
      if (!overlay) {
        if (typeof cb === "function") cb();
        return;
      }
      const playerMatch = (E2.currentRoundMatches || window.currentRoundMatches || []).find(
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
    } catch (e) {
      try {
        const L2 = getLogger4();
        L2.warn && L2.warn("showIntroOverlay failed", e);
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
  function getLogger5() {
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
        } catch (e) {
        }
        pr.applied = true;
        renderLists();
        renderPairs();
        try {
          if (typeof window.updateMatchBoardLine === "function" && typeof match.index !== "undefined")
            window.updateMatchBoardLine(match.index, match);
        } catch (e) {
        }
      };
      const overlay = document.getElementById("subs-overlay");
      if (!overlay) {
        if (typeof cb === "function") cb();
        return;
      }
      try {
        if (overlay.parentElement !== document.body) document.body.appendChild(overlay);
      } catch (e) {
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
      } catch (e) {
      }
      const _prevBodyOverflow = document.body.style.overflow;
      try {
        document.body.style.overflow = "hidden";
      } catch (e) {
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
      } catch (e) {
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
      } catch (e) {
      }
      setTimeout(() => {
        const backBtn = panel.querySelector("#subsBackToGameBtn");
        if (backBtn) {
          backBtn.onclick = () => {
            try {
              if (document.activeElement && typeof document.activeElement.blur === "function")
                document.activeElement.blur();
            } catch (e) {
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
                } catch (e) {
                }
              });
            } catch (e) {
              try {
                const L2 = getLogger5();
                L2.warn && L2.warn("Error auto-applying substitutions on close", e);
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
            } catch (e) {
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
          btn.addEventListener("click", (e) => {
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
            } catch (e) {
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
                  const L2 = getLogger5();
                  L2.warn && L2.warn("Error applying substitution on confirm", err);
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
    } catch (e) {
      try {
        const L2 = getLogger5();
        L2.warn && L2.warn("showHalfTimeSubsOverlay failed", e);
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
      } catch (e) {
      }
    } catch (e) {
      console.warn("showSeasonSummaryOverlay failed", e);
      if (typeof cb === "function") cb();
    }
  }

  // src/ui/overlays/index.mjs
  var Overlays = {
    ...intro_exports,
    ...halftime_exports,
    ...seasonSummary_exports
  };
  if (typeof window !== "undefined") {
    window.FootLab = window.FootLab || {};
    window.FootLab.Overlays = window.FootLab.Overlays || {};
    Object.assign(window.FootLab.Overlays, Overlays);
    window.Elifoot = window.Elifoot || window.FootLab;
  }

  // src/ui/dev_sandbox.js
  (function() {
    "use strict";
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.altKey && e.code === "KeyD") {
          let menu = document.getElementById("dev-debug-menu");
          if (menu) {
            menu.remove();
            return;
          }
          menu = document.createElement("div");
          menu.id = "dev-debug-menu";
          menu.style.cssText = "position:fixed; bottom:20px; right:20px; background:#1e1e1e; border:1px solid #4CAF50; padding:15px; z-index:2147483647; border-radius:8px; display:flex; flex-direction:column; gap:10px; box-shadow: 0 10px 40px rgba(0,0,0,0.9);";
          menu.innerHTML = `<h3 style="margin:0 0 10px 0; color:#4CAF50; font-size:16px; border-bottom:1px solid #333; padding-bottom:8px;">\u{1F6E0}\uFE0F Dev Sandbox</h3>`;
          const createBtn = (text, onClick) => {
            const btn = document.createElement("button");
            btn.textContent = text;
            btn.style.cssText = "padding:8px 12px; background:#333; color:#fff; border:1px solid #555; border-radius:4px; cursor:pointer; font-size:12px;";
            btn.onmouseover = () => btn.style.background = "#444";
            btn.onmouseout = () => btn.style.background = "#333";
            btn.onclick = onClick;
            menu.appendChild(btn);
          };
          createBtn("1. Visualizar Menus de Substitui\xE7\xF5es", () => {
            const mockClub = window.playerClub || { bgColor: "#006400", color: "#ffffff", team: { name: "Sandbox FC", players: [] } };
            const mockStarters = Array.from({ length: 11 }, (_, i) => ({ name: `Titular ${i + 1}`, position: i === 0 ? "GK" : "CM", skill: 80 - i }));
            const mockSubs = Array.from({ length: 7 }, (_, i) => ({ name: `Suplente ${i + 1}`, position: i === 0 ? "GK" : "ST", skill: 70 - i }));
            const mockMatch = {
              homeClub: mockClub,
              awayClub: { team: { name: "Advers\xE1rio FC" } },
              homeGoals: 2,
              awayGoals: 1,
              homePlayers: window.currentRoundMatches && window.currentRoundMatches[0] && window.currentRoundMatches[0].homePlayers || mockStarters,
              homeSubs: window.currentRoundMatches && window.currentRoundMatches[0] && window.currentRoundMatches[0].homeSubs || mockSubs
            };
            window.showHalfTimeSubsOverlay(mockClub, mockMatch, () => console.log("Subs fechado pelo Sandbox."));
          });
          createBtn("2. Visualizar Ofertas (Transfer\xEAncias)", () => {
            window.PENDING_RELEASES = [
              { name: "Jo\xE3o F\xE9lix (Mock)", position: "ST", leavingFee: 5e6, minContract: 25e3 },
              { name: "R\xFAben Dias (Mock)", position: "CB", leavingFee: 3e6, minContract: 18e3 }
            ];
            const showPopup = window.Offers && window.Offers.showPendingReleasesPopup || window.Hub && window.Hub.showPendingReleasesPopup;
            if (typeof showPopup === "function") {
              showPopup(() => console.log("Ofertas fechadas."));
            } else {
              alert('O m\xF3dulo de Ofertas n\xE3o foi encontrado. Adicionaste o script "src/ui/offers.js" no teu index.html?');
            }
          });
          createBtn("3. Visualizar Tabelas de Divis\xE3o", () => {
            window.renderAllDivisionsTables();
          });
          createBtn("4. For\xE7ar Fim de Jogo (Ecr\xE3 de Classifica\xE7\xE3o)", () => {
            if (typeof window.endSimulation === "function") window.endSimulation();
            else alert("Erro: A fun\xE7\xE3o endSimulation n\xE3o foi encontrada no contexto global.");
          });
          createBtn("5. Simular \xC9poca Inteira (Fast-Forward)", () => {
            if (typeof window.fastForwardSeason === "function") {
              window.fastForwardSeason();
              const devMenu = document.getElementById("dev-debug-menu");
              if (devMenu) devMenu.remove();
            } else {
              alert("Erro: A fun\xE7\xE3o fastForwardSeason n\xE3o foi encontrada.");
            }
          });
          document.body.appendChild(menu);
        }
      });
    }
  })();

  // src/logic/transfers.js
  function clubNeedsPosition(club, category) {
    const Lineups = window.FootLab && window.FootLab.Lineups;
    if (!Lineups) return true;
    const tacticName = club.team.tactic || "4-4-2";
    const formation = typeof Lineups.parseFormation === "function" ? Lineups.parseFormation(tacticName) : [4, 4, 2];
    const requirements = {
      GK: 1,
      DEF: formation[0] || 4,
      MID: formation[1] || 4,
      ATT: formation[2] || 2
    };
    const currentCount = (club.team.players || []).filter((p) => Lineups.getPositionCategory(p.position) === category).length;
    const saturationLimit = Math.max(category === "GK" ? 2 : 4, requirements[category] * 2);
    return currentCount < saturationLimit;
  }
  function findPotentialBuyer(player, fee) {
    const sellerClub = player.originalClubRef;
    const Lineups = window.FootLab && window.FootLab.Lineups;
    const category = Lineups ? Lineups.getPositionCategory(player.position) : "MID";
    const allClubs2 = window.ALL_CLUBS || [];
    const potentialBuyers = allClubs2.filter((club) => {
      if (club === sellerClub) return false;
      if (club.budget < fee) return false;
      if (!clubNeedsPosition(club, category)) return false;
      return true;
    });
    return potentialBuyers.length > 0 ? potentialBuyers[Math.floor(Math.random() * potentialBuyers.length)] : null;
  }
  function executeTransfer(player, sellerClub, buyerClub, fee, salary) {
    sellerClub.budget = (sellerClub.budget || 0) + fee;
    buyerClub.budget = (buyerClub.budget || 0) - fee;
    const pIdx = sellerClub.team.players.findIndex((p) => p.id === player.id);
    if (pIdx > -1) {
      const [transferredPlayer] = sellerClub.team.players.splice(pIdx, 1);
      transferredPlayer.salary = salary;
      transferredPlayer.contractYears = 1;
      transferredPlayer.contractYearsLeft = 1;
      buyerClub.team.players.push(transferredPlayer);
      window.TRANSFER_HISTORY = window.TRANSFER_HISTORY || [];
      window.TRANSFER_HISTORY.push({
        player: transferredPlayer.name,
        from: sellerClub.team ? sellerClub.team.name : sellerClub.name,
        to: buyerClub.team ? buyerClub.team.name : buyerClub.name,
        fee,
        salary,
        type: "purchase",
        jornada: typeof window.currentJornada !== "undefined" ? window.currentJornada : null,
        time: Date.now()
      });
      return true;
    }
    return false;
  }

  // src/ui/offers.mjs
  var L = typeof window !== "undefined" && window.FootLab && window.FootLab.Logger || console;
  var formatMoney2 = function(value) {
    if (!value && value !== 0) return "0 \u20AC";
    return Math.floor(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " \u20AC";
  };
  function handleOfferAccept(player, playerIndex, onClose) {
    const sellerClub = player.originalClubRef;
    const fee = player.leavingFee || 0;
    const buyerClub = findPotentialBuyer(player, fee);
    if (!buyerClub) {
      alert("Nenhum clube tem or\xE7amento ou necessidade para contratar este jogador no momento.");
      return;
    }
    if (buyerClub.budget < fee) {
      alert(
        `${buyerClub.team.name} cannot afford the transfer fee of ${formatMoney2(fee)}.`
      );
      return;
    }
    const offerSalaryStr = prompt(
      `Propor sal\xE1rio para ${player.name} (m\xEDnimo: ${formatMoney2(
        player.minContract || 0
      )})`,
      player.minContract || 500
    );
    const offerSalary = parseInt(offerSalaryStr, 10);
    if (isNaN(offerSalary) || offerSalary < (player.minContract || 0)) {
      alert("Sal\xE1rio inv\xE1lido ou abaixo do m\xEDnimo.");
      return;
    }
    const confirmed = confirm(
      `Confirmar transfer\xEAncia de ${player.name} para ${buyerClub.team.name} por ${formatMoney2(fee)} com sal\xE1rio de ${formatMoney2(offerSalary)}?`
    );
    if (confirmed) {
      executeTransfer(player, sellerClub, buyerClub, fee, offerSalary);
      window.PENDING_RELEASES.splice(playerIndex, 1);
      const overlay = document.getElementById("offers-overlay");
      if (overlay) document.body.removeChild(overlay);
      showPendingReleasesPopup(onClose);
    }
  }
  function showPendingReleasesPopup(onClose) {
    const pending = window.PENDING_RELEASES || [];
    if (!pending.length) {
      if (typeof onClose === "function") onClose();
      return;
    }
    const overlay = document.createElement("div");
    overlay.id = "offers-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      left: "0",
      top: "0",
      right: "0",
      bottom: "0",
      background: "rgba(0,0,0,0.75)",
      zIndex: 1e4,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff"
    });
    let html = `<div class="subs-panel" style="padding: 24px; background: #2e2e2e; color: #fff; border-radius: 10px; max-width: 600px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.1);">`;
    html += `<h3 style="margin-top:0; color:#ffeb3b; font-size:1.3em; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">Propostas Recebidas</h3>`;
    html += `<p style="font-size:0.95em; color:#ccc;">Os seguintes jogadores da sua equipa t\xEAm ofertas de outros clubes:</p>`;
    pending.forEach((p, idx) => {
      const fee = p.leavingFee || 0;
      html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:rgba(0,0,0,0.2);margin-bottom:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.05);">
                  <div>
                      <strong style="font-size:1.1em;">${p.name}</strong> <span style="color:#aaa;">(${p.position})</span><br/>
                      <span style="color:#8BC34A; font-weight:bold; font-size:0.9em;">Oferta: ${formatMoney2(fee)}</span>
                  </div>
                  <button id="offersDoProposeBtn" class="offer-propose-btn" data-player-idx="${idx}" style="padding:10px 16px;border:none;border-radius:6px;background:#2196F3;color:white;cursor:pointer;font-weight:bold;">Vender</button>
              </div>`;
    });
    html += `<div style="text-align:right;margin-top:20px;"><button id="close-offers-popup" style="padding:10px 16px;border-radius:6px;border:none;background:#555;color:#fff;cursor:pointer;font-weight:bold;">Fechar</button></div>`;
    html += `</div>`;
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    document.getElementById("close-offers-popup").addEventListener("click", () => {
      document.body.removeChild(overlay);
      if (typeof onClose === "function") onClose();
    });
    overlay.querySelectorAll(".offer-propose-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const playerIndex = parseInt(e.target.getAttribute("data-player-idx"), 10);
        const player = pending[playerIndex];
        handleOfferAccept(player, playerIndex, onClose);
      });
    });
  }
  function showJobOffersPopup(onClose) {
    const offers = window.PLAYER_JOB_OFFERS || [];
    if (!offers.length) {
      if (typeof onClose === "function") onClose();
      return;
    }
    const club = offers.shift();
    const overlay = document.createElement("div");
    overlay.id = "job-offers-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      left: "0",
      top: "0",
      right: "0",
      bottom: "0",
      background: "rgba(0,0,0,0.85)",
      zIndex: 10005,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff"
    });
    const currentCoachName = document.getElementById("coachNameDisplay") ? document.getElementById("coachNameDisplay").innerText : "Treinador";
    let html = `<div class="subs-panel" style="padding: 30px; border-radius: 12px; width: 90%; max-width: 550px; text-align: center; border: 1px solid rgba(255,255,255,0.1); background: #2e2e2e; box-shadow: 0 15px 40px rgba(0,0,0,0.8);">`;
    html += `<h2 style="color: #4CAF50; margin-top: 0; font-size: 1.6em;">Proposta de Trabalho</h2>`;
    html += `<div style="width: 64px; height: 64px; margin: 20px auto; border-radius: 12px; background: ${club.team.bgColor}; border: 3px solid ${club.team.color}; box-shadow: 0 4px 10px rgba(0,0,0,0.3);"></div>`;
    html += `<p style="font-size: 1.1em; line-height: 1.5; color: #ddd;">A dire\xE7\xE3o do <strong>${club.team.name}</strong> (${club.division}\xAA Divis\xE3o) despediu o seu treinador.<br><br>Eles acompanharam o seu trabalho e oferecem-lhe o comando t\xE9cnico. Aceita o desafio?</p>`;
    html += `<div style="margin-top: 30px; display: flex; justify-content: center; gap: 15px;">`;
    html += `<button id="rejectJobBtn" style="padding: 12px 24px; border-radius: 8px; border: none; background: #555; color: white; cursor: pointer; font-weight: bold; transition: background 0.2s;">Rejeitar Proposta</button>`;
    html += `<button id="acceptJobBtn" style="padding: 12px 24px; border-radius: 8px; border: none; background: #4CAF50; color: white; cursor: pointer; font-weight: bold; transition: background 0.2s;">Assinar Contrato</button>`;
    html += `</div></div>`;
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    document.getElementById("rejectJobBtn").addEventListener("click", () => {
      document.body.removeChild(overlay);
      showJobOffersPopup(onClose);
    });
    document.getElementById("acceptJobBtn").addEventListener("click", () => {
      window.playerClub.coach = { name: "Treinador Interino", reputation: 50 };
      window.playerClub = club;
      club.coach = { name: currentCoachName, reputation: 80 };
      window.PLAYER_JOB_OFFERS = [];
      document.body.removeChild(overlay);
      alert(`Parab\xE9ns! Assinou contrato com o ${club.team.name}!`);
      const playerTeamNameHub = document.getElementById("playerTeamNameHub");
      const playerTeamNameFooter = document.getElementById("playerTeamNameFooter");
      if (playerTeamNameHub) playerTeamNameHub.textContent = club.team.name;
      if (playerTeamNameFooter) playerTeamNameFooter.textContent = club.team.name;
      showJobOffersPopup(onClose);
    });
  }
  function showTransferNewsPopup(transfers, onClose) {
    if (!transfers || transfers.length === 0) {
      if (typeof onClose === "function") onClose();
      return;
    }
    const overlay = document.createElement("div");
    overlay.id = "transfer-news-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      left: "0",
      top: "0",
      right: "0",
      bottom: "0",
      background: "rgba(0,0,0,0.85)",
      zIndex: 10005,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff"
    });
    const fm = typeof window.formatMoney === "function" ? window.formatMoney : (v) => v + " \u20AC";
    let html = `<div class="subs-panel" style="padding: 24px; background: #2e2e2e; color: #fff; border-radius: 12px; width: 90%; max-width: 600px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.1);">`;
    html += `<h3 style="margin-top:0; color:#4CAF50; font-size:1.4em; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px;">\u{1F4B8} Mercado de Transfer\xEAncias</h3>`;
    html += `<p style="font-size:1em; color:#ccc; margin-bottom: 20px;">Resumo das principais transfer\xEAncias realizadas nesta jornada:</p>`;
    html += `<div style="max-height: 400px; overflow-y: auto; padding-right: 10px; display:flex; flex-direction:column; gap:10px;">`;
    transfers.forEach((t) => {
      html += `<div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 6px;">
                 <div style="font-weight:bold; font-size:1.1em; color:#fff;">${t.player}</div>
                 <div style="display:flex; justify-content:space-between; font-size:0.95em;">
                   <span style="color:#aaa;">De: ${t.from} \u2794 Para: ${t.to}</span>
                   <strong style="color:#ffeb3b;">${fm(t.fee)}</strong>
                 </div>
               </div>`;
    });
    html += `</div>`;
    html += `<div style="text-align:right; margin-top:24px;"><button id="close-transfer-news-btn" style="padding:10px 20px; border-radius:6px; border:none; background:#2196F3; color:white; font-weight:bold; cursor:pointer;">Continuar</button></div>`;
    html += `</div>`;
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    document.getElementById("close-transfer-news-btn").addEventListener("click", () => {
      document.body.removeChild(overlay);
      if (typeof onClose === "function") onClose();
    });
  }
  function showManagerMovementsPopup(movements, onClose) {
    if (!movements || movements.length === 0) {
      if (typeof onClose === "function") onClose();
      return;
    }
    const overlay = document.createElement("div");
    overlay.id = "manager-movements-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      left: "0",
      top: "0",
      right: "0",
      bottom: "0",
      background: "rgba(0,0,0,0.85)",
      zIndex: 10005,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff"
    });
    let html = `<div class="subs-panel" style="padding: 24px; background: #2e2e2e; color: #fff; border-radius: 12px; width: 90%; max-width: 600px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.1);">`;
    html += `<h3 style="margin-top:0; color:#ffeb3b; font-size:1.4em; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px;">\u{1F4F0} Chicotadas Psicol\xF3gicas</h3>`;
    html += `<p style="font-size:1em; color:#ccc; margin-bottom: 20px;">Resumo das recentes movimenta\xE7\xF5es de treinadores no futebol mundial:</p>`;
    html += `<div style="max-height: 400px; overflow-y: auto; padding-right: 10px; display:flex; flex-direction:column; gap:10px;">`;
    movements.forEach((m) => {
      html += `<div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 6px;">
                 <div style="font-weight:bold; font-size:1.1em; color:#fff;">${m.clubName}</div>
                 <div style="display:flex; justify-content:space-between; font-size:0.95em;">
                   <span style="color:#F44336;">\u274C Sai: ${m.out}</span>
                   <span style="color:#4CAF50;">\u2705 Entra: ${m.in}</span>
                 </div>
               </div>`;
    });
    html += `</div>`;
    html += `<div style="text-align:right; margin-top:24px;"><button id="close-movements-btn" style="padding:10px 20px; border-radius:6px; border:none; background:#2196F3; color:white; font-weight:bold; cursor:pointer;">Continuar</button></div>`;
    html += `</div>`;
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    document.getElementById("close-movements-btn").addEventListener("click", () => {
      document.body.removeChild(overlay);
      if (typeof onClose === "function") onClose();
    });
  }
  function showEndSeasonAwardsPopup(data, onClose) {
    if (!data) {
      if (typeof onClose === "function") onClose();
      return;
    }
    const overlay = document.createElement("div");
    overlay.id = "end-season-awards-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      left: "0",
      top: "0",
      right: "0",
      bottom: "0",
      background: "rgba(0,0,0,0.85)",
      zIndex: 10005,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff"
    });
    const fm = typeof window.formatMoney === "function" ? window.formatMoney : (v) => v + " \u20AC";
    let html = `<div class="subs-panel" style="padding: 30px; background: #2e2e2e; color: #fff; border-radius: 12px; width: 90%; max-width: 650px; box-shadow: 0 15px 40px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.1);">`;
    html += `<h2 style="margin-top:0; color:#ffeb3b; font-size:1.8em; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px; text-align:center;">\u{1F3C6} Fim de \xC9poca - Pr\xE9mios</h2>`;
    html += `<div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-top:20px;">`;
    const renderAward = (title, icon, name, sub) => `
      <div style="background: rgba(0,0,0,0.2); padding: 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); text-align:center;">
        <div style="font-size:2em; margin-bottom:8px;">${icon}</div>
        <div style="color:#aaa; font-size:0.9em; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; font-weight:bold;">${title}</div>
        <strong style="font-size:1.2em; color:#fff;">${name}</strong>
        <div style="color:#4CAF50; font-size:0.9em; margin-top:4px; font-weight:bold;">${sub}</div>
      </div>
    `;
    if (data.championD1 && data.championD1.team) html += renderAward("Campe\xE3o 1\xAA Divis\xE3o", "\u{1F947}", data.championD1.team.name, `${data.championD1.points} Pts`);
    if (data.topScorer && data.topScorer.p) html += renderAward("Melhor Marcador", "\u{1F45F}", data.topScorer.p.name, `${data.topScorer.p.goals} Golos (${data.topScorer.club.team.name})`);
    if (data.bestAttack && data.bestAttack.team) html += renderAward("Melhor Ataque", "\u2694\uFE0F", data.bestAttack.team.name, `${data.bestAttack.goalsFor} Golos Marcados`);
    if (data.bestDefense && data.bestDefense.team) html += renderAward("Melhor Defesa", "\u{1F6E1}\uFE0F", data.bestDefense.team.name, `${data.bestDefense.goalsAgainst} Golos Sofridos`);
    html += `</div>`;
    if (data.totalPrize > 0) {
      html += `<div style="margin-top:20px; background:rgba(76, 175, 80, 0.15); border:1px solid rgba(76, 175, 80, 0.3); padding:16px; border-radius:8px; text-align:center;">
                  <div style="color:#4CAF50; font-weight:bold; font-size:1.1em; margin-bottom:8px;">\u{1F4B0} Pr\xE9mios Recebidos pela Sua Equipa:</div>
                  <div style="font-size:0.95em; color:#ddd; line-height:1.5;">${data.prizeMsg}</div>
                  <div style="margin-top:8px; font-size:1.2em; font-weight:900; color:#ffeb3b;">Total: ${fm(data.totalPrize)}</div>
                </div>`;
    }
    html += `<div style="text-align:center; margin-top:24px;"><button id="close-awards-btn" style="padding:12px 30px; border-radius:8px; border:none; background:#2196F3; color:white; font-weight:bold; cursor:pointer; font-size:1.1em; transition:transform 0.2s;">Continuar</button></div>`;
    html += `</div>`;
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    document.getElementById("close-awards-btn").addEventListener("click", () => {
      document.body.removeChild(overlay);
      if (typeof onClose === "function") onClose();
    });
  }
  function showPromotionsPopup(data, onClose) {
    if (!data || !data.promoted || !data.relegated) {
      if (typeof onClose === "function") onClose();
      return;
    }
    const overlay = document.createElement("div");
    overlay.id = "promotions-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      left: "0",
      top: "0",
      right: "0",
      bottom: "0",
      background: "rgba(0,0,0,0.85)",
      zIndex: 10005,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff"
    });
    let html = `<div class="subs-panel" style="padding: 30px; background: #2e2e2e; color: #fff; border-radius: 12px; width: 90%; max-width: 850px; box-shadow: 0 15px 40px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.1); max-height:95vh; overflow-y:auto;">`;
    html += `<h2 style="margin-top:0; color:#4CAF50; font-size:1.8em; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px; text-align:center;">\u{1F4C8} Subidas e Descidas</h2>`;
    const renderDivisionBlock = (divisionName, promoList, promoTitle, relegList, relegTitle) => {
      let block = `<div style="display:flex; flex-direction:column; gap:12px;">`;
      block += `<h3 style="margin:0; text-align:center; color:#FF9800; font-size:1.2em; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">${divisionName}</h3>`;
      if (promoList && promoList.length > 0) {
        block += `<div style="display:flex; flex-direction:column; gap:6px;">`;
        block += `<h4 style="margin:0; color:#4CAF50; font-size:1em; text-align:center;">${promoTitle}</h4>`;
        promoList.forEach((c) => {
          block += `<div style="background:rgba(0,0,0,0.3); padding:6px 10px; border-radius:4px; font-weight:bold; font-size:0.95em; display:flex; justify-content:space-between; align-items:center;">
                      <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${c.team.name}">${c.team.name}</span><span style="flex-shrink:0;">\u{1F53A}</span>
                    </div>`;
        });
        block += `</div>`;
      }
      if (relegList && relegList.length > 0) {
        block += `<div style="display:flex; flex-direction:column; gap:6px;">`;
        block += `<h4 style="margin:0; color:#F44336; font-size:1em; text-align:center;">${relegTitle}</h4>`;
        relegList.forEach((c) => {
          block += `<div style="background:rgba(0,0,0,0.3); padding:6px 10px; border-radius:4px; font-weight:bold; font-size:0.95em; display:flex; justify-content:space-between; align-items:center;">
                      <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${c.team.name}">${c.team.name}</span><span style="flex-shrink:0;">\u{1F53B}</span>
                    </div>`;
        });
        block += `</div>`;
      }
      block += `</div>`;
      return block;
    };
    html += `<div class="promotions-grid" style="margin-top: 20px;">`;
    html += renderDivisionBlock("1\xAA Divis\xE3o", data.promoted[1], "Promovidos \xE0 1\xAA Div.", data.relegated[0], "Despromovidos \xE0 2\xAA Div.");
    html += renderDivisionBlock("2\xAA Divis\xE3o", data.promoted[2], "Promovidos \xE0 2\xAA Div.", data.relegated[1], "Despromovidos \xE0 3\xAA Div.");
    html += renderDivisionBlock("3\xAA Divis\xE3o", data.promoted[3], "Promovidos \xE0 3\xAA Div.", data.relegated[2], "Despromovidos \xE0 4\xAA Div.");
    html += renderDivisionBlock("4\xAA Divis\xE3o", data.promoted[3], "Promovidos \xE0 3\xAA Div.", null, "");
    html += `</div>`;
    html += `<div style="text-align:center; margin-top:30px;"><button id="close-promos-btn" style="padding:12px 30px; border-radius:8px; border:none; background:#2196F3; color:white; font-weight:bold; cursor:pointer; font-size:1.1em; transition:transform 0.2s;">Concluir \xC9poca</button></div>`;
    html += `</div>`;
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    document.getElementById("close-promos-btn").addEventListener("click", () => {
      document.body.removeChild(overlay);
      if (typeof onClose === "function") onClose();
    });
  }
  var Offers = {
    showPendingReleasesPopup,
    showJobOffersPopup,
    showTransferNewsPopup,
    showManagerMovementsPopup,
    showEndSeasonAwardsPopup,
    showPromotionsPopup
  };
  if (typeof window !== "undefined") window.Offers = Offers;

  // src/main.js
  var allDivisions = [];
  var playerClub = null;
  var allClubs = [];
  if (typeof window !== "undefined") {
    window.GAME_NAME = typeof GameConstants !== "undefined" && GameConstants.GAME_NAME || "FootLab t1";
    try {
      if (typeof document !== "undefined") document.title = window.GAME_NAME;
    } catch (e) {
    }
  }
  var MainLogger = typeof window !== "undefined" && window.FootLab && window.FootLab.Logger ? window.FootLab.Logger : console;
  function getLogger6() {
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
          } catch (e) {
          }
          setTimeout(() => {
            try {
              intro.style.display = "none";
            } catch (e) {
            }
            try {
              setup.style.display = "flex";
              setup.style.opacity = "0";
              setup.style.transform = "translateY(6px)";
              setup.offsetWidth;
              setup.style.opacity = "1";
              setup.style.transform = "none";
            } catch (e) {
            }
          }, 620);
        }, 900);
      }
    } catch (e) {
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupInitialUiHandlers);
  } else {
    try {
      setupInitialUiHandlers();
    } catch (e) {
      try {
        const L2 = getLogger6();
        L2.warn && L2.warn("setupInitialUiHandlers failed", e);
      } catch (_) {
      }
    }
  }
  async function validateGameData() {
    const L2 = getLogger6();
    L2.info("Waiting for divisions data...");
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
    const L2 = getLogger6();
    L2.info("Generating all clubs...");
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
    window.FREE_TRANSFERS = [];
    window.PENDING_RELEASES = [];
    window.TRANSFER_HISTORY = [];
    if (typeof window.generateFreeAgents === "function") {
      window.generateFreeAgents(allDivisions, { probability: 0.05, maxPerClub: 2 });
    }
    const pool = division4.length > 8 ? division4.slice(-8) : division4.slice();
    playerClub = pool[Math.floor(Math.random() * pool.length)];
    window.playerClub = playerClub;
    window.allDivisions = allDivisions;
    window.allClubs = allClubs;
    window.currentJornada = 1;
    if (typeof generateRounds === "function") {
      window.seasonCalendar = [];
      allDivisions.forEach((div) => {
        const rounds = generateRounds(div);
        rounds.forEach((roundMatches, idx) => {
          if (!window.seasonCalendar[idx]) window.seasonCalendar[idx] = [];
          window.seasonCalendar[idx].push(...roundMatches);
        });
      });
      if (window.seasonCalendar.length > 0) {
        window.currentRoundMatches = window.seasonCalendar[0];
      } else {
        window.currentRoundMatches = [];
      }
      if (typeof assignStartingLineups === "function") assignStartingLineups(window.currentRoundMatches);
    }
    return playerClub;
  }
  window.loadSavedGame = function() {
    try {
      const snapRaw = localStorage.getItem("footlab_t1_save_snapshot");
      if (!snapRaw) {
        alert("Nenhum jogo salvo encontrado.");
        return;
      }
      const snap = JSON.parse(snapRaw);
      if (!snap.playerClub || !snap.allDivisions) {
        alert("Save corrompido ou inv\xE1lido.");
        return;
      }
      window.allDivisions = snap.allDivisions;
      window.allClubs = snap.allClubs;
      window.currentRoundMatches = snap.currentRoundMatches;
      window.currentJornada = snap.currentJornada;
      window.playerClub = window.allClubs.find((c) => c.team && snap.playerClub.team && c.team.name === snap.playerClub.team.name) || snap.playerClub;
      window.seasonCalendar = snap.seasonCalendar || [];
      window.FREE_TRANSFERS = snap.freeTransfers || [];
      window.PENDING_RELEASES = snap.pendingReleases || [];
      window.TRANSFER_HISTORY = snap.transferHistory || [];
      if (typeof window.startGame === "function") {
        window.startGame(window.playerClub);
      } else {
        alert("Erro: fun\xE7\xE3o startGame n\xE3o encontrada.");
      }
    } catch (e) {
      alert("Erro ao ler o ficheiro de grava\xE7\xE3o: " + e.message);
    }
  };
  function formatMoney3(value) {
    if (!value && value !== 0) return "0 \u20AC";
    return Math.floor(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " \u20AC";
  }
  window.formatMoney = formatMoney3;
  document.addEventListener("DOMContentLoaded", () => {
    const _startBtn = document.getElementById("startBtn");
    if (!_startBtn) {
      try {
        const L2 = getLogger6();
        L2.error && L2.error("startBtn not found in DOM; cannot start game.");
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
        getLogger6().error("Falha ao iniciar jogo:", err);
        alert("Erro cr\xEDtico: " + err.message);
      }
    });
    const _loadGameSetupBtn = document.getElementById("loadGameSetupBtn");
    if (_loadGameSetupBtn) {
      _loadGameSetupBtn.addEventListener("click", () => {
        ["screen-setup", "intro-screen"].forEach((id) => {
          const el = document.getElementById(id);
          if (el) el.style.display = "none";
        });
        const hubScreen = document.getElementById("screen-hub");
        if (hubScreen) {
          hubScreen.style.display = "flex";
          hubScreen.style.flexDirection = "column";
        }
        if (typeof window.renderHubContent === "function") {
          window.renderHubContent("menu-load");
        } else {
          alert("M\xF3dulo de UI n\xE3o carregado.");
        }
      });
    }
  });

  // src/entry.mjs
  window.Hub = hub_controller_exports;
})();
//# sourceMappingURL=app.bundle.js.map
