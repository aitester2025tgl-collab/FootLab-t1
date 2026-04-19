// src/constants.js
export const GameConstants = {
  GAME_NAME: 'FootLab t1',
  POSITIONS: ['GK', 'DF', 'MF', 'FW'],
  DIVISION_SKILL_CAPS: {
    1: { base: 95, min: 75 },
    2: { base: 80, min: 60 },
    3: { base: 65, min: 45 },
    4: { base: 50, min: 25 },
  },
  DEFAULT_DIVISION_SKILL_CAP: { base: 50, min: 25 },
  CONTRACT_CONFIG: {
    pctOneYear: 0.35,
    pctExpiring: 0.12,
    minSalary: 300,
    salaryMultiplier: 25,
  },
  TRANSFER_MARKET: {
    freeAgentProb: 0.06,
    maxFreeAgentsPerClub: 2,
    pendingReleaseProb: 0.02,
    maxPendingPerClub: 1,
    expiringLeaveProb: 0.35,
    maxExpiringPerClub: 2,
    baseMarketValue: 5000,
    skillValueMultiplier: 200,
    divisionMultipliers: {
      1: 1.6,
      2: 1.25,
      3: 0.9,
      4: 0.6,
    },
  },
  SEASONAL_DRIFT_FACTORS: [0.6, 0.4, 0.28, 0.18],
};
