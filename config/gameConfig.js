// Central game configuration (timing & probabilities)
// Modify values here to tune simulation without touching core code.
window.GameConfig = {
  timing: {
    halfDurationMs: 20000, // 20s per half (used in main.js if imported)
    minTickMs: 20
  },
  rules: {
    maxSubs: 5,
    enforceGkOnlySwap: true,
    halftimeMinute: 46
  },
  events: {
    yellowChancePerMinuteTeam: 0.02,
    redChancePerMinuteTeam: 0.001,
    suspensionDoubleYellowGames: 1,
    suspensionStraightRedGames: 2
  }
};
