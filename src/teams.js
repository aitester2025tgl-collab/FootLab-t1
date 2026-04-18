// teams.js - built directly from `data/real_rosters_2025_26.js`
/* eslint-disable no-empty, no-console */
/* exported getLogger */
const E =
  typeof window !== 'undefined'
    ? window.FootLab || window.Elifoot || window
    : typeof global !== 'undefined'
      ? global
      : {};
// This file constructs `divisionsData` using the exact ordering found in
// `window.REAL_ROSTERS`. It expects `data/real_rosters_2025_26.js` to set
// `window.REAL_ROSTERS` with teams in the desired order: first 18 = 1ª divisão,
// next 18 = 2ª divisão, next 18 = 3ª divisão, next 18 = 4ª divisão.

// Build divisions strictly from the ordering in REAL_ROSTERS
function buildDivisionsFromRostersOrdered() {
  const E =
    typeof window !== 'undefined'
      ? window.FootLab || window.Elifoot || window
      : typeof global !== 'undefined'
        ? global
        : {};
  // Local helper to prefer centralized logger when available
  /* eslint-disable-next-line no-unused-vars */
  function getLogger() {
    try {
      return (
        (typeof window !== 'undefined' && window.FootLab && window.FootLab.Logger) ||
        (typeof window !== 'undefined' && window.Elifoot && window.Elifoot.Logger) ||
        console
      );
    } catch (e) {
      return console;
    }
  }
  // Prefer the top-level window.REAL_ROSTERS (set by the archived JS file).
  // Some initialization code creates an empty `window.FootLab` object early,
  // so avoid reading only from `E` which may be an empty namespace object.
  const globalObj =
    typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : {};
  const rostersSource = (globalObj && globalObj.REAL_ROSTERS) || (E && E.REAL_ROSTERS) || null;
  const rosters = rostersSource ? Object.keys(rostersSource) : [];

  // CRÍTICO: Obter as cores e verificar se o mapa não está vazio
  const teamColorMapSource =
    (globalObj && globalObj.REAL_TEAM_COLORS) ||
    (E && E.REAL_TEAM_COLORS) ||
    null;

  const rostersArePresent = Array.isArray(rosters) && rosters.length > 0;

  // Só prosseguir se o dataset de ROSTERS estiver carregado (obrigatório)
  if (!rostersArePresent) {
    throw new Error(
      `Aguardando dados: window.REAL_ROSTERS não encontrado. Verifique se real_rosters_2025_26.js foi carregado.`
    );
  }

  // runtime validation: if REAL_ROSTERS exists, ensure it looks complete
  function validateRosters(expectedTeams = 72, minPlayers = 18) {
    if (!(E && E.REAL_ROSTERS)) return;
    const keys = Object.keys(E.REAL_ROSTERS);
    const problems = [];
    if (keys.length !== expectedTeams)
      problems.push(`expected ${expectedTeams} teams but found ${keys.length}`);
    for (let i = 0; i < keys.length; i++) {
      const team = keys[i];
      const players = E.REAL_ROSTERS[team] || [];
      if (!Array.isArray(players)) {
        problems.push(`${team} roster is not an array`);
        continue;
      }
      if (players.length < minPlayers) problems.push(`${team} has only ${players.length} players`);
    }
    if (problems.length) {
      const msg = 'Roster validation failed: ' + problems.join('; ');
      // Log a warning and continue: allow startup to proceed using generated teams
      try {
        const L = getLogger();
        L && L.warn && L.warn(msg);
      } catch (e) {
        try {
          console && console.warn && console.warn(msg);
        } catch (_) {
          /* ignore */
        }
      }
      // Do not throw here — fallback generators will create teams when REAL_ROSTERS is missing
      return;
    }
  }

  // Run validation (will no-op if REAL_ROSTERS is not present)
  validateRosters(72, 18);
  // Use exact slices: 0-17, 18-35, 36-53, 54-71
  // generate stable colors per team name so UI shows distinct two-tone club colors
  function nameToColor(name) {
    if (!name) return { bg: '#2e2e2e', fg: '#ffffff' };
    // simple hash to hue
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xfffffff;
    const hue = h % 360;
    const sat = 60 + (h % 10); // 60-69
    const light = 34 + (h % 12); // 34-45

    // Implementação local de HSL para HEX para evitar dependência de ColorUtils externa
    const hslToHexLocal = (h, s, l) => {
      l /= 100;
      const a = (s * Math.min(l, 1 - l)) / 100;
      const f = (n) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    };

    // Cálculo local de luminância para decidir cor do texto (preto ou branco)
    const getLuminanceLocal = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const a = [r, g, b].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
      return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    };

    const bg = hslToHexLocal(hue, sat, light);
    const L = getLuminanceLocal(bg);

    const fg = L > 0.5 ? '#000000' : '#ffffff';
    return { bg, fg };
  }

  const teamColorMap = teamColorMapSource;

  // Normalize team names for robust color lookups. Many team names in the
  // archived rosters include diacritics, abbreviations (FC/CF/AC/etc.) or
  // slightly different punctuation compared to the keys in
  // `window.REAL_TEAM_COLORS`. Build a normalized map so lookups succeed.
  function normalizeName(n) {
    if (!n) return '';
    // unicode normalize and remove diacritics
    let s = n.normalize ? n.normalize('NFD').replace(/\p{Diacritic}/gu, '') : n;
    s = String(s).toLowerCase();
    // Normalização alargada para clubes portugueses (SL, SC, CD, SAD, etc)
    s = s.replace(/\b(fc|cf|sl|sc|cd|ac|cp|sad|f c|c f|ac\.|fc\.|sc\.|rcd|ssc|ss|clube|futebol)\b/g, '');
    s = s.replace(/[\u2018\u2019'`’]/g, ''); // apostrophes
    s = s.replace(/[^a-z0-9\s]/g, '');
    s = s.replace(/\s+/g, ' ').trim();
    return s;
  }

  const _normalizedColorMap = {};
  try {
    Object.keys(teamColorMap || {}).forEach((k) => {
      const nk = normalizeName(k || '');
      if (nk) _normalizedColorMap[nk] = teamColorMap[k];
    });
  } catch (e) {
    /* ignore */
  }

  const sliceTeam = (start) =>
    rosters.slice(start, start + 18).map((name) => {
      let c;
      // try exact key first, then normalized key to tolerate small name
      // differences (accents, FC/CF suffixes, punctuation)
      const exact = teamColorMap && teamColorMap[name] ? teamColorMap[name] : null;
      if (exact) {
        c = { bg: exact.bgColor || '#2e2e2e', fg: exact.color || '#ffffff' };
      } else {
        const nk = normalizeName(name);
        const m = nk && _normalizedColorMap[nk] ? _normalizedColorMap[nk] : null;
        if (m) c = { bg: m.bgColor || '#2e2e2e', fg: m.color || '#ffffff' };
        else c = nameToColor(name);
      }
      return { name, color: c.fg, bgColor: c.bg };
    });

  const div1 = sliceTeam(0);
  const div2 = sliceTeam(18);
  const div3 = sliceTeam(36);
  const div4 = sliceTeam(54);

  return [
    { name: '1ª divisão', teams: div1 },
    { name: '2ª divisão', teams: div2 },
    { name: '3ª divisão', teams: div3 },
    { name: '4ª divisão', teams: div4 },
  ];
}

// Attempt to build divisionsData immediately. If REAL_ROSTERS hasn't been
// injected yet (race condition when scripts load out-of-order), poll for a
// short period and build once the data appears. Expose a Promise-based
// `waitForDivisionsData` so callers can await readiness in startup code.
let divisionsData = null;
let _divisionsResolve = null;
let _divisionsReject = null;
const divisionsReady = new Promise((resolve, reject) => {
  _divisionsResolve = resolve;
  _divisionsReject = reject;
});

function _tryBuildDivisions() {
  try {
    const dd = buildDivisionsFromRostersOrdered();
    divisionsData = dd;
    // Development diagnostic: print resolved team color map for verification
    try {
      if (typeof console !== 'undefined' && console.log) {
        // color mapping diagnostic removed
      }
    } catch (e) {
      /* ignore */
    }
    try {
      if (typeof window !== 'undefined') window.divisionsData = divisionsData;
      if (typeof global !== 'undefined') global.divisionsData = divisionsData;
    } catch (e) {
      /* ignore */
    }
    try {
      _divisionsResolve && _divisionsResolve(divisionsData);
    } catch (e) {
      /* ignore */
    }
    try {
      if (typeof document !== 'undefined' && typeof document.dispatchEvent === 'function') {
        document.dispatchEvent(new CustomEvent('footlab:rosters-loaded'));
      }
    } catch (e) {
      /* ignore */
    }
    return true;
  } catch (e) {
    return false;
  }
}

// Try immediate build; if it fails because REAL_ROSTERS isn't yet available,
// poll for a short window and then reject.
if (!_tryBuildDivisions()) {
  const start = Date.now();
  const timeout = 3000;
  const iv = setInterval(() => {
    if (_tryBuildDivisions()) {
      clearInterval(iv);
      return;
    }
    if (Date.now() - start > timeout) {
      clearInterval(iv);
      try {
        _divisionsReject &&
          _divisionsReject(
            new Error('Timed out waiting for window.REAL_ROSTERS to become available')
          );
      } catch (e) {
        /* ignore */
      }
      try {
        console && console.error && console.error('Timed out waiting for window.REAL_ROSTERS');
      } catch (_) {}
    }
  }, 80);
}

function waitForDivisionsData(timeoutMs = 3000) {
  if (divisionsData) return Promise.resolve(divisionsData);
  return Promise.race([
    divisionsReady,
    new Promise((_, rej) =>
      setTimeout(() => rej(new Error('waitForDivisionsData timeout')), timeoutMs)
    ),
  ]);
}

// Tactics (kept for UI compatibility)
const TACTICS = [
  {
    name: '4-4-2',
    description: 'Clássica - Equilibrada',
    attack: 3,
    defense: 3,
    midfield: 4,
    requires: { wingers: false, threeAtBack: false },
  },
  {
    name: '4-3-3',
    description: 'Ofensiva - Ataque (com pontas)',
    attack: 4,
    defense: 2,
    midfield: 3,
    requires: { wingers: true, threeAtBack: false, strikers: 1 },
  },
  {
    name: '3-5-2',
    description: 'Controle - Meio-campo (três centrais)',
    attack: 3,
    defense: 3,
    midfield: 5,
    requires: { wingers: false, threeAtBack: true },
  },
  {
    name: '5-3-2',
    description: 'Defensiva - Segurança (laterais avançam)',
    attack: 2,
    defense: 5,
    midfield: 3,
    requires: { wingers: false, threeAtBack: false },
  },
  {
    name: '4-5-1',
    description: 'Contenção - Defesa (meio-campo denso)',
    attack: 2,
    defense: 4,
    midfield: 5,
    requires: { wingers: false, threeAtBack: false },
  },
  {
    name: '3-4-3',
    description: 'Ataque Total - Pressão (três centrais e pontas)',
    attack: 5,
    defense: 2,
    midfield: 4,
    requires: { wingers: true, threeAtBack: true, strikers: 1 },
  },
  {
    name: '5-4-1',
    description: 'Ultra Defensiva - Resistência',
    attack: 1,
    defense: 5,
    midfield: 4,
    requires: { wingers: false, threeAtBack: false },
  },
  {
    name: '4-2-3-1',
    description: 'Moderna - Controle e Transição',
    attack: 4,
    defense: 3,
    midfield: 5,
    requires: { wingers: true, threeAtBack: false, strikers: 1 },
  },
  {
    name: '4-1-4-1',
    description: 'Posicional - Trinco e Linha Média',
    attack: 3,
    defense: 4,
    midfield: 5,
    requires: { wingers: true, threeAtBack: false, strikers: 1 },
  },
  {
    name: '4-2-4',
    description: 'Ultra Ofensiva - Risco Máximo',
    attack: 5,
    defense: 3,
    midfield: 2,
    requires: { wingers: true, threeAtBack: false, strikers: 2 },
  },
];

// Expose tactics to global/window for UI modules
try {
  if (typeof window !== 'undefined') {
    window.TACTICS = TACTICS;
    window.FootLab = window.FootLab || window.Elifoot || {};
    window.FootLab.TACTICS = window.FootLab.TACTICS || TACTICS;
    // compatibility alias
    window.Elifoot = window.Elifoot || window.FootLab;
  }
  if (typeof global !== 'undefined') global.TACTICS = TACTICS;
} catch (e) {
  /* ignore */
}

// generateTeam: returns a team object populated with players from REAL_ROSTERS
function generateTeam(teamId) {
  const allTeams = divisionsData.map((d) => d.teams).flat();
  const teamMeta = allTeams[teamId - 1] || {
    name: `Team ${teamId}`,
    color: '#FFFFFF',
    bgColor: '#000000',
  };
  let players = [];
  try {
    if (E && E.REAL_ROSTERS && E.REAL_ROSTERS[teamMeta.name])
      players = E.REAL_ROSTERS[teamMeta.name];
  } catch (e) {
    players = [];
  }

  // If no real roster exists for this team, fail fast.
  if (!Array.isArray(players) || players.length === 0) {
    throw new Error(
      `No roster found for team "${teamMeta.name}" (teamId ${teamId}). ` +
        'The application requires real roster data in window.REAL_ROSTERS.'
    );
  }

  // minimal stadium/member defaults
  const divIndex = Math.floor((teamId - 1) / 18);
  let stadiumCapacity =
    divIndex === 0 ? 30000 : divIndex === 1 ? 15000 : divIndex === 2 ? 10000 : 4000;
  let members = divIndex === 0 ? 25000 : divIndex === 1 ? 15000 : divIndex === 2 ? 5000 : 1000;

  return {
    id: teamId,
    name: teamMeta.name,
    color: teamMeta.color,
    bgColor: teamMeta.bgColor,
    players: players,
    tactic: '4-4-2',
    stadiumCapacity,
    members,
    ticketPrice: 20,
    totalSalaryCost: 0,
    currentLeaguePosition: 0,
    leaguePoints: 0,
  };
}

// expose helpers
try {
  if (typeof window !== 'undefined') {
    window.generateTeam = generateTeam;
    window.FootLab = window.FootLab || window.Elifoot || {};
    window.FootLab.generateTeam = window.FootLab.generateTeam || generateTeam;
    window.Elifoot = window.Elifoot || window.FootLab;
  }
  if (typeof global !== 'undefined') global.generateTeam = generateTeam;
} catch (e) {
  /* ignore */
}

// Diagnostic: print current division assignments (useful at dev-time)
function printDivisionAssignments() {
  if (typeof divisionsData === 'undefined') return;
  const logger =
    (typeof window !== 'undefined' && window.FootLab && window.FootLab.Logger) ||
    (typeof window !== 'undefined' && window.Elifoot && window.Elifoot.Logger) ||
    console;
  divisionsData.forEach((d, idx) => {
    logger.info(`${idx + 1}. ${d.name} — ${d.teams.length} teams`);
    d.teams.forEach((t, i) => logger.info(`   ${i + 1}. ${t.name}`));
  });
}

try {
  if (typeof window !== 'undefined') {
    window.printDivisionAssignments = printDivisionAssignments;
    window.FootLab = window.FootLab || window.Elifoot || {};
    window.FootLab.printDivisionAssignments =
      window.FootLab.printDivisionAssignments || printDivisionAssignments;
    window.Elifoot = window.Elifoot || window.FootLab;
  }
  if (typeof global !== 'undefined') global.printDivisionAssignments = printDivisionAssignments;
} catch (e) {
  /* ignore */
}

// Reusable stricter validator you can call from scripts/tests. Does not run automatically.
function validateRosterConstraints({
  expectedTeams = 72,
  minPlayers = 18,
  maxPlayers = 28,
  maxGK = 3,
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
      (a, p) => a + ((p.position || p.pos || '').toUpperCase() === 'GK' ? 1 : 0),
      0
    );
    if (gkCount > maxGK) problems.push(`${team} has ${gkCount} GKs (over ${maxGK})`);
  }
  return { ok: problems.length === 0, problems };
}

try {
  if (typeof window !== 'undefined') window.validateRosterConstraints = validateRosterConstraints;
  if (typeof global !== 'undefined') global.validateRosterConstraints = validateRosterConstraints;
} catch (e) {
  /* ignore */
}

// Ensure these diagnostics are exported when required as a module
if (typeof module !== 'undefined' && module.exports) {
  module.exports.printDivisionAssignments = printDivisionAssignments;
  module.exports.validateRosterConstraints = validateRosterConstraints;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    divisionsData,
    waitForDivisionsData,
    generateTeam,
    TACTICS,
    printDivisionAssignments,
    validateRosterConstraints,
  };
}

// Expose wait helper to browser globals for startup scripts
try {
  if (typeof window !== 'undefined') {
    window.waitForDivisionsData = waitForDivisionsData;
    window.FootLab = window.FootLab || window.Elifoot || {};
    window.FootLab.waitForDivisionsData =
      window.FootLab.waitForDivisionsData || waitForDivisionsData;
    window.Elifoot = window.Elifoot || window.FootLab;
  }
  if (typeof global !== 'undefined') global.waitForDivisionsData = waitForDivisionsData;
} catch (e) {
  /* ignore */
}

// Startup: run strict validation and throw if problems found. This makes the
// application fail fast when rosters are incomplete or invalid. Set parameters
// conservatively to match repository expectations.
try {
  const _startup = validateRosterConstraints({
    expectedTeams: 72,
    minPlayers: 18,
    maxPlayers: 28,
    maxGK: 3,
  });
  if (!_startup.ok) {
    throw new Error('Startup roster validation failed: ' + _startup.problems.join('; '));
  }
} catch (e) {
  // In environments where window/REAL_ROSTERS is not present, validateRosterConstraints
  // returns ok=true; otherwise we rethrow to make startup fail fast.
  if (e && e.message && e.message.indexOf('Startup roster validation failed') === 0) throw e;
}