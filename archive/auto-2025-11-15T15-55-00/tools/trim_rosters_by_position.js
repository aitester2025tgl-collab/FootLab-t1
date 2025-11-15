const fs = require('fs');
const path = require('path');

function normalizePos(p) {
  if (!p) return '';
  return String(p).trim().toUpperCase();
}

// Position groups
const GROUPS = {
  GK: ['GK'],
  DEF: ['CB', 'LB', 'RB'],
  // treat LW/RW as midfielders for our tactical logic; DM/AM/CM also count as MID
  MID: ['CM', 'DM', 'AM', 'LW', 'RW'],
  // ATT is strictly ST
  ATT: ['ST'],
};

function posToGroup(pos) {
  const p = normalizePos(pos);
  if (GROUPS.GK.includes(p)) return 'GK';
  if (GROUPS.DEF.includes(p)) return 'DEF';
  if (GROUPS.MID.includes(p)) return 'MID';
  if (GROUPS.ATT.includes(p)) return 'ATT';
  return 'MID'; // default to MID if unknown
}

function posToSubMid(pos) {
  const p = normalizePos(pos);
  if (p === 'LW') return 'LW';
  if (p === 'RW') return 'RW';
  // treat DM/AM/CM as CM subgroup
  return 'CM';
}

function parseFormation(str) {
  // Accept formats like "5-3-2" or "4-3-3:wingers" => returns {DEF, MID, ATT, wingers}
  const partsFlag = String(str || '4-3-3')
    .split(':')
    .map((s) => s.trim());
  const base = partsFlag[0];
  const flag = (partsFlag[1] || '').toLowerCase();
  const parts = base.split('-').map((s) => parseInt(s, 10) || 0);
  const wingers = flag === 'wingers' || flag === 'w';
  if (parts.length < 3) return { DEF: 4, MID: 3, ATT: 3, wingers };
  return { DEF: parts[0], MID: parts[1], ATT: parts[2], wingers };
}

function parseFormations(arg) {
  // comma-separated list of formations (each may include :wingers)
  return String(arg || '4-3-3')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseFormation);
}

const repoRoot = path.resolve(__dirname, '..');
const dataDir = path.join(repoRoot, 'data');
const src = path.join(dataDir, 'real_rosters_2025_26.js');
const backups = path.join(dataDir, 'backups');
if (!fs.existsSync(backups)) fs.mkdirSync(backups, { recursive: true });

const argv = process.argv.slice(2);
const runTs = new Date().toISOString().replace(/[:.]/g, '-');
const formationArg = argv.find((a) => !a.startsWith('--')) || '4-3-3';
const apply = argv.includes('--apply');
const report = argv.includes('--report');
const targetTotal =
  Number((argv.find((a) => a.startsWith('--target=')) || '--target=28').split('=')[1]) || 28;
const minGK =
  Number((argv.find((a) => a.startsWith('--mingk=')) || '--mingk=2').split('=')[1]) || 2;
const minST =
  Number((argv.find((a) => a.startsWith('--minst=')) || '--minst=2').split('=')[1]) || 2;
const maxGK =
  Number((argv.find((a) => a.startsWith('--maxgk=')) || '--maxgk=3').split('=')[1]) || 3;

const formations = parseFormations(formationArg);
// Compute average weights across provided formations
const weightDef =
  Math.round((formations.reduce((a, f) => a + f.DEF, 0) / formations.length) * 100) / 100;
const weightMid =
  Math.round((formations.reduce((a, f) => a + f.MID, 0) / formations.length) * 100) / 100;
const weightAtt =
  Math.round((formations.reduce((a, f) => a + f.ATT, 0) / formations.length) * 100) / 100;

// This tool has been archived to reduce repository noise.
// Original archived copy: archive/tools/trim_rosters_by_position.js
const logger = require('./cliLogger');
logger.info(
  'tools/trim_rosters_by_position.js has been archived. To restore, move archive/tools/trim_rosters_by_position.js back to tools/'
);
process.exit(0);

// Load rosters
global.window = {};
require(src);
const rosters = global.window.REAL_ROSTERS || {};

const actions = [];
const modified = [];

for (const team of Object.keys(rosters)) {
  const players = rosters[team];
  if (!Array.isArray(players)) continue;

  // compute groups
  const groups = { GK: [], DEF: [], MID: [], ATT: [] };
  players.forEach((p, idx) => {
    const g = posToGroup(p.position || p.pos);
    groups[g].push({ idx, player: p });
  });

  // Enforce GK max first (remove last GK(s))
  while (groups.GK.length > maxGK) {
    const rem = groups.GK.pop();
    actions.push({ team, action: 'remove_gk', removed: rem.player });
    // remove from players array by index
    players.splice(rem.idx, 1);
    modified.push(team);
    // rebuild groups indices after mutation
    groups.GK = [];
    groups.DEF = [];
    groups.MID = [];
    groups.ATT = [];
    players.forEach((p, idx) => {
      const g = posToGroup(p.position || p.pos);
      groups[g].push({ idx, player: p });
    });
  }

  // If roster already <= target, skip positional trimming
  if (players.length <= targetTotal) continue;

  // Desired GK baseline is minGK but we will consider GK as a removable group too
  let desiredGK = Math.max(0, Math.min(minGK, targetTotal));
  // cap desiredGK by maxGK as an upper bound
  desiredGK = Math.min(desiredGK, maxGK);

  // Determine desired distribution for non-GK slots
  const nonGkSlots = targetTotal - desiredGK;

  // Minimum required starters per group across formations (ensure formation minima preserved)
  const baseReq = formations.reduce((acc, f) => {
    acc.DEF = Math.max(acc.DEF || 0, f.DEF);
    acc.MID = Math.max(acc.MID || 0, f.MID);
    acc.ATT = Math.max(acc.ATT || 0, f.ATT);
    // subposition minima for MID: if formation uses wingers reserve 1 LW and 1 RW
    const lw = f.wingers && f.MID >= 2 ? 1 : 0;
    const rw = f.wingers && f.MID >= 2 ? 1 : 0;
    const cm = Math.max(0, f.MID - lw - rw);
    acc.LW = Math.max(acc.LW || 0, lw);
    acc.RW = Math.max(acc.RW || 0, rw);
    acc.CM = Math.max(acc.CM || 0, cm);
    return acc;
  }, {});

  // Ensure baseReq is defined
  baseReq.DEF = baseReq.DEF || 0;
  baseReq.MID = baseReq.MID || 0;
  baseReq.ATT = baseReq.ATT || 0;
  baseReq.LW = baseReq.LW || 0;
  baseReq.RW = baseReq.RW || 0;
  baseReq.CM = baseReq.CM || 0;

  // Start desired with minima from formations (group-level)
  let desired = { DEF: baseReq.DEF, MID: baseReq.MID, ATT: baseReq.ATT };
  let assigned = desired.DEF + desired.MID + desired.ATT;

  // If base requirement exceeds available nonGK slots, scale down proportionally
  if (assigned > nonGkSlots) {
    const scale = nonGkSlots / assigned;
    desired.DEF = Math.max(0, Math.floor(desired.DEF * scale));
    desired.MID = Math.max(0, Math.floor(desired.MID * scale));
    desired.ATT = Math.max(0, Math.floor(desired.ATT * scale));
    assigned = desired.DEF + desired.MID + desired.ATT;
  }

  // Distribute remaining slots proportionally to average formation weights
  let remaining = nonGkSlots - assigned;
  if (remaining > 0) {
    const totalWeight = weightDef + weightMid + weightAtt;
    const desiredFloat = {
      DEF: desired.DEF + (weightDef / totalWeight) * remaining,
      MID: desired.MID + (weightMid / totalWeight) * remaining,
      ATT: desired.ATT + (weightAtt / totalWeight) * remaining,
    };
    const desiredFloor = {
      DEF: Math.floor(desiredFloat.DEF),
      MID: Math.floor(desiredFloat.MID),
      ATT: Math.floor(desiredFloat.ATT),
    };
    assigned = desiredFloor.DEF + desiredFloor.MID + desiredFloor.ATT;
    const remainders = [
      ['DEF', desiredFloat.DEF - desiredFloor.DEF],
      ['MID', desiredFloat.MID - desiredFloor.MID],
      ['ATT', desiredFloat.ATT - desiredFloor.ATT],
    ];
    remainders.sort((a, b) => b[1] - a[1]);
    for (let i = 0; assigned < nonGkSlots; i = (i + 1) % 3) {
      desiredFloor[remainders[i][0]]++;
      assigned++;
    }
    desired = desiredFloor;
  }

  // Now split desired MID into CM/LW/RW using minima: reserve LW/RW minima then fill CM
  const desiredMid = { LW: baseReq.LW, RW: baseReq.RW, CM: 0 };
  desiredMid.CM = Math.max(0, desired.MID - desiredMid.LW - desiredMid.RW);

  // Include desired counts (including mid subpositions) for removal choice
  const desiredCounts = {
    GK: desiredGK,
    DEF: desired.DEF,
    MID: desired.MID,
    ATT: desired.ATT,
    CM: desiredMid.CM,
    LW: desiredMid.LW,
    RW: desiredMid.RW,
  };

  // Now trim from groups that have surplus
  // Continue until players.length == targetTotal
  while (players.length > targetTotal) {
    // compute current counts including GK
    const counts = {
      GK: groups.GK.length,
      DEF: groups.DEF.length,
      MID: groups.MID.length,
      ATT: groups.ATT.length,
    };
    // compute surplus per group (actual - desired)
    const surplus = {
      GK: counts.GK - desiredCounts.GK,
      DEF: counts.DEF - desiredCounts.DEF,
      MID: counts.MID - desiredCounts.MID,
      ATT: counts.ATT - desiredCounts.ATT,
    };

    // compute normalized surplus (surplus / max(1, desired)) to compare proportionally
    const norm = {};
    for (const k of Object.keys(surplus)) {
      const d = Math.max(1, desiredCounts[k] || 0);
      norm[k] = surplus[k] / d;
    }

    // pick group with largest normalized surplus among groups we are allowed to remove from
    const removable = Object.keys(norm).filter((k) => {
      if (k === 'GK') return counts.GK > minGK; // don't go below minGK
      if (k === 'ATT') return counts.ATT > minST; // don't reduce attackers below minimum
      return counts[k] > 1; // never remove the last player of a non-GK group
    });
    let pick = null;
    if (removable.length > 0) {
      pick = removable.reduce((a, b) => (norm[a] >= norm[b] ? a : b));
      if (norm[pick] <= 0) {
        // pick by largest absolute surplus among removable
        pick = removable.reduce((a, b) => (surplus[a] >= surplus[b] ? a : b));
      }
    } else {
      // no removable groups (all groups at their minimums) -> fallback remove last player
      pick = null;
    }
    // tie-break by absolute surplus
    const tied = Object.keys(norm).filter(
      (k) => Math.abs(norm[k] - norm[pick]) < 1e-9 && removable.includes(k)
    );
    if (tied.length > 1) {
      // choose by absolute surplus
      tied.sort((a, b) => surplus[b] - surplus[a]);
      pick = tied[0];
      // final tie-break prefer MID over ATT, DEF, GK
      if (tied.length > 1 && Math.abs(surplus[tied[0]] - surplus[tied[1]]) < 1e-9) {
        const order = ['MID', 'ATT', 'DEF', 'GK'];
        for (const o of order)
          if (tied.includes(o)) {
            pick = o;
            break;
          }
      }
    }

    // If we picked MID, choose a MID subposition (CM/LW/RW) to remove from
    let grpArr = null;
    let removeGroupLabel = pick;
    if (pick === 'MID') {
      // build mid sublists
      const midSubs = { CM: [], LW: [], RW: [] };
      groups.MID.forEach((e) => {
        const sub = posToSubMid(e.player.position || e.player.pos);
        midSubs[sub].push(e);
      });
      const subCounts = { CM: midSubs.CM.length, LW: midSubs.LW.length, RW: midSubs.RW.length };
      const subDesired = {
        CM: desiredCounts.CM || 0,
        LW: desiredCounts.LW || 0,
        RW: desiredCounts.RW || 0,
      };
      const subSurplus = {
        CM: subCounts.CM - subDesired.CM,
        LW: subCounts.LW - subDesired.LW,
        RW: subCounts.RW - subDesired.RW,
      };
      const subNorm = {};
      for (const k of Object.keys(subSurplus)) {
        const d = Math.max(1, subDesired[k] || 0);
        subNorm[k] = subSurplus[k] / d;
      }
      // choose removable subposition (don't go below base minima)
      const removableSub = Object.keys(subNorm).filter((k) => subCounts[k] > (baseReq[k] || 0));
      let subPick = null;
      if (removableSub.length > 0) {
        subPick = removableSub.reduce((a, b) => (subNorm[a] >= subNorm[b] ? a : b));
        if (subNorm[subPick] <= 0) {
          subPick = removableSub.reduce((a, b) => (subSurplus[a] >= subSurplus[b] ? a : b));
        }
      }
      if (subPick) {
        grpArr = midSubs[subPick];
        removeGroupLabel = `MID-${subPick}`;
      } else {
        // fallback to removing from MID group generally
        grpArr = groups.MID;
        removeGroupLabel = 'MID';
      }
    } else {
      grpArr = pick ? groups[pick] : null;
    }

    if (!grpArr || grpArr.length === 0) {
      // nothing to remove; fallback remove last non-GK then GK
      let lastIdx = players.length - 1;
      const removed = players.splice(lastIdx, 1)[0];
      actions.push({ team, action: 'trim_last_fallback', removed });
      modified.push(team);
    } else {
      const rem = grpArr.pop();
      // find index in players (rem.idx may be stale after previous splices). Find last occurrence of that player object.
      const idx = players
        .map((p) => p.name + '|' + (p.position || p.pos))
        .lastIndexOf(rem.player.name + '|' + (rem.player.position || rem.player.pos));
      const removed = idx >= 0 ? players.splice(idx, 1)[0] : players.pop();
      actions.push({ team, action: 'trim_from_group', group: removeGroupLabel, removed });
      modified.push(team);
    }
    // rebuild groups
    groups.GK = [];
    groups.DEF = [];
    groups.MID = [];
    groups.ATT = [];
    players.forEach((p, idx) => {
      const g = posToGroup(p.position || p.pos);
      groups[g].push({ idx, player: p });
    });
  }
}

if (actions.length === 0) {
  logger.info('No changes proposed.');
  process.exit(0);
}

// Summary
logger.info('Proposed removals:', actions.length);
const byTeam = {};
actions.forEach((a) => {
  byTeam[a.team] = byTeam[a.team] || [];
  byTeam[a.team].push(a);
});
Object.keys(byTeam).forEach((t) => {
  logger.info(`\nTeam: ${t}`);
  byTeam[t].forEach((a) => {
    logger.info(
      ` - ${a.action} -> ${a.removed.name} (${a.removed.position || a.removed.pos || ''}) ${a.group ? '[' + a.group + ']' : ''}`
    );
  });
});

if (report) {
  try {
    const reportObj = {
      created: runTs,
      formations: formations,
      targetTotal,
      minGK,
      maxGK,
      proposed: actions,
    };
    const reportPath = path.join(backups, `trim_report_${runTs}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(reportObj, null, 2), 'utf8');
    logger.info('\nReport written to:', reportPath);
  } catch (err) {
    logger.error('Failed to write report:', err);
  }
}

if (apply) {
  // backup and write file
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backups, `real_rosters_2025_26.js.bak_trim_${ts}.js`);
  fs.copyFileSync(src, backupPath);
  // write
  let out = `// real_rosters_2025_26.js -- trimmed by tools/trim_rosters_by_position.js on ${ts}\n`;
  out += 'window.REAL_ROSTERS = window.REAL_ROSTERS || {};\n\n';
  for (const team of Object.keys(rosters)) {
    out +=
      'window.REAL_ROSTERS[' +
      JSON.stringify(team) +
      '] = ' +
      JSON.stringify(rosters[team], null, 2) +
      ';\n\n';
  }
  fs.writeFileSync(src, out, 'utf8');
  logger.info('\nChanges applied and backup saved at:', backupPath);
} else {
  logger.info('\nDry-run complete. To apply changes re-run with --apply');
}
