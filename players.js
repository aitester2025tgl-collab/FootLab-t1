// players.js

/* exported positions */
/* eslint-disable-next-line no-unused-vars */
const positions = ['GK', 'DF', 'MF', 'FW'];

// Local logger for this module (prefer centralized logger when available)
const PlayersLogger =
  typeof window !== 'undefined' && window.Elifoot && window.Elifoot.Logger
    ? window.Elifoot.Logger
    : console;

// Generate a single player. If skillCap is provided, skill will be generated up to that cap
function generatePlayer(id, position = null, skillCap = 100) {
  // Player generation disabled. Return a minimal placeholder and log a warning so
  // callers become aware that `window.REAL_ROSTERS` should be used instead.
  try {
    const _logger =
      typeof window !== 'undefined' && window.Elifoot && window.Elifoot.Logger
        ? window.Elifoot.Logger
        : console;
    _logger.warn(
      'generatePlayer: player generation disabled. Use window.REAL_ROSTERS as the authoritative player source.'
    );
  } catch (e) {
    /* ignore */
  }
  const pos = position || 'CM';
  return {
    id,
    name: `Unknown Player ${id}`,
    position: pos,
    // Root `players.js` moved to `archive/legacy_root_files/players.js` to reduce root clutter.
    // The canonical implementation lives in `src/players.js` and should be used for runtime.
    // This file is intentionally left as a small shim/placeholder to keep backward compatibility for tooling that
    // expects a top-level `players.js` file. If you need the original full version, see
    // `archive/legacy_root_files/players.js`.
    /* eslint-disable no-console */
    console.warn('Root players.js has been archived to archive/legacy_root_files/players.js — use src/players.js instead.');
            const buyerName = (c && c.team && c.team.name) || c.name || 'unknown';
            const acceptProb =
              negotiation && typeof negotiation.acceptProb !== 'undefined'
                ? negotiation.acceptProb
                : typeof prob !== 'undefined'
                  ? prob
                  : null;
            if (
              cfg &&
              cfg.debugPurchases === true &&
              PlayersLogger &&
              typeof PlayersLogger.debug === 'function'
            ) {
              try {
                PlayersLogger.debug('Negotiation attempt', {
                  buyer: buyerName,
                  player: p && (p.name || p.id),
                  fee: Number(p.leavingFee || 0),
                  acceptProb,
                  roll: negotiation && negotiation.roll,
                });
              } catch (e) {
                /* ignore logging errors */
              }
            }
          } catch (e) {
            /* ignore */
          }

          if (negotiation && negotiation.accepted) {
            if (
              cfg &&
              cfg.debugPurchases === true &&
              PlayersLogger &&
              typeof PlayersLogger.debug === 'function'
            ) {
              try {
                PlayersLogger.debug('Negotiation result: ACCEPTED', {
                  buyer: (c && c.team && c.team.name) || c.name,
                  player: p && (p.name || p.id),
                });
              } catch (e) {
                /* ignore */
              }
            }
            // apply payment and move player
            try {
              // deduct fee from buyer
              c.budget = Math.max(0, Number(c.budget || 0) - fee);
              // pay seller if present
              if (p.originalClubRef)
                p.originalClubRef.budget = Number(p.originalClubRef.budget || 0) + fee;
              // remove from seller roster if present
              if (
                realPlayer &&
                p.originalClubRef &&
                p.originalClubRef.team &&
                Array.isArray(p.originalClubRef.team.players)
              ) {
                const ridx = p.originalClubRef.team.players.findIndex(
                  (pp) =>
                    pp === realPlayer ||
                    (pp && p.id && pp.id === p.id) ||
                    (pp && pp.name === p.name)
                );
                if (ridx >= 0) p.originalClubRef.team.players.splice(ridx, 1);
              }
              // prepare object to add
              const playerToAdd = realPlayer || Object.assign({}, p);
              playerToAdd.salary = offerSalary;
              playerToAdd.contractYears = 1;
              playerToAdd.contractYearsLeft = 1;
              c.team.players = c.team.players || [];
              c.team.players.push(playerToAdd);
              if (PlayersLogger && typeof PlayersLogger.debug === 'function') {
                try {
                  PlayersLogger.debug('Auto-purchase:', {
                    player: playerToAdd && (playerToAdd.name || playerToAdd.id),
                    buyer: (c.team && c.team.name) || c.name,
                    fee: fee,
                  });
                } catch (e) {
                  /* ignore logging errors */
                }
              }
              purchased = true;
            } catch (e) {
              /* ignore purchase errors */
            }
          }
          if (purchased) break;
        }
        if (purchased) continue; // skip moving to free transfers if bought
      } catch (e) {
        /* ignore autoProcess errors and fall through to free transfer */
      }
    }
    // when moving to free transfers: set contract to 0, compute minContract as 90% of previous salary
    p.contractYears = 0;
    p.contractYearsLeft = 0;
    p.minContract = Math.max(0, Math.round((p.previousSalary || 0) * 0.9));
    p.playerValue =
      p.playerValue ||
      computePlayerMarketValue(
        p,
        p.originalClubRef && p.originalClubRef.division ? p.originalClubRef.division : 4
      );
    p.leavingFee = Math.max(0, Math.round((p.playerValue || 0) * 0.8));
    // remove originalClubRef before adding to free list
    try {
      delete p.originalClubRef;
    } catch (e) {
      /* ignore */
    }
    window.FREE_TRANSFERS.push(p);
    if (PlayersLogger && typeof PlayersLogger.debug === 'function') {
      try {
        PlayersLogger.debug('Moved to FREE_TRANSFERS:', {
          player: p && (p.name || p.id),
          minContract: p.minContract,
          leavingFee: p.leavingFee,
        });
      } catch (e) {
        /* ignore logging errors */
      }
    }
  }
  return window.FREE_TRANSFERS;
}

// Compute a player's approximate market value based on skill and division (higher division => higher value)
function computePlayerMarketValue(playerOrSkill, division) {
  const skill =
    playerOrSkill && typeof playerOrSkill.skill === 'number'
      ? playerOrSkill.skill
      : Number(playerOrSkill || 40);
  const div = Number(division || 4);
  const divFactor = div === 1 ? 1.6 : div === 2 ? 1.25 : div === 3 ? 0.9 : 0.6;
  // base value + scaled skill (values in monthly*12-ish units). Tunable constants.
  const base = 5000; // base market value
  const skillAdj = Math.round(skill * 200); // skill multiplier
  const raw = Math.round((base + skillAdj) * divFactor);
  return Math.max(0, raw);
}

if (typeof window !== 'undefined') {
  window.selectPlayersForRelease = selectPlayersForRelease;
  window.processPendingReleases = processPendingReleases;
  window.computePlayerMarketValue = computePlayerMarketValue;
  window.selectExpiringPlayersToLeave = selectExpiringPlayersToLeave;
}

if (typeof window !== 'undefined') {
  window.generateFreeAgents = generateFreeAgents;
  window.computeMinContractFromSkill = computeMinContractFromSkill;
}

// Mark a percentage of players as being at the end of their contract this season
// pctExpiring: fraction 0..1 (default 0.12 => ~12% of players across the league)
function markSomeContractsExpiring(allDivisions, pctExpiring) {
  pctExpiring = typeof pctExpiring === 'number' ? pctExpiring : 0.12;
  if (!Array.isArray(allDivisions)) return 0;
  let marked = 0;
  allDivisions.forEach((div) => {
    if (!Array.isArray(div)) return;
    div.forEach((club) => {
      if (!club || !club.team || !Array.isArray(club.team.players)) return;
      club.team.players.forEach((p) => {
        if (!p) return;
        // skip if already explicitly no-contract (0) - we want players who have contracts to be nearing end
        const hasContract =
          typeof p.contractYears !== 'undefined'
            ? p.contractYears > 0
            : typeof p.contractYearsLeft !== 'undefined'
              ? p.contractYearsLeft > 0
              : false;
        if (!hasContract) return;
        if (Math.random() < pctExpiring) {
          p.contractYearsLeft = 0; // mark as expired/last year
          // keep contractYears as original so we can show full-term if needed
          marked++;
        }
      });
    });
  });
  return marked;
}

if (typeof window !== 'undefined') {
  window.markSomeContractsExpiring = markSomeContractsExpiring;
}

// Seasonal/slow evolution of player skills across the season.
// Applies a small delta to each player's skill based on their team's current league position.
// - top teams gain a small amount, bottom teams lose a small amount.
// - the magnitude is scaled per division so higher divisions see larger evolution.
// This should be called once per jornada (or less frequently) to keep progression slow.
function seasonalSkillDrift(allDivisions) {
  if (!Array.isArray(allDivisions)) return;
  // division factor controls how strong the drift is per division (index 0 = div1)
  const divisionFactor = [0.6, 0.4, 0.28, 0.18];

  allDivisions.forEach((divisionClubs, divIdx) => {
    if (!Array.isArray(divisionClubs) || divisionClubs.length === 0) return;
    // sort by current standings (points, goal diff) to determine ranks
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
        // percentile where top is near 1, bottom near 0
        const percentile = 1 - idx / (size - 1);
        // center around 0: negative for bottom half, positive for top half
        const center = percentile - 0.5;
        // compute a small delta; multiply by factor and scale to typical -1,0,1
        const raw = center * factor;
        // convert to -1/0/1 mostly, but allow occasional 2 for extreme cases
        let delta = 0;
        if (raw >= 0.45) delta = 2;
        else if (raw >= 0.12) delta = 1;
        else if (raw <= -0.45) delta = -2;
        else if (raw <= -0.12) delta = -1;
        else delta = 0;

        // Apply to each player in the club slowly
        if (club && club.team && Array.isArray(club.team.players)) {
          club.team.players.forEach((p) => {
            if (!p || typeof p.skill !== 'number') return;
            const pos = String(p.position || '').toUpperCase();
            // goalkeepers evolve slower
            const posFactor = pos === 'GK' ? 0.6 : 1.0;
            const adj = Math.round(delta * posFactor);
            if (adj === 0) return;
            p.skill = Math.max(0, Math.min(100, p.skill + adj));
          });
        }
      } catch (err) {
        // ignore per-club failures
      }
    });
  });
}

if (typeof window !== 'undefined') window.seasonalSkillDrift = seasonalSkillDrift;
