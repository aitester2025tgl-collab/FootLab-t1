// logic/lineups.js
// Centralized lineup utilities: formation parsing, starter selection, and reordering helpers
(function () {
  // prefer centralized logger when present (declare at IIFE root so catch blocks can use it)
  function getLogger() {
    try {
      return (
        (window.FootLab && window.FootLab.Logger) ||
        (window.Elifoot && window.Elifoot.Logger) ||
        console
      );
    } catch (e) {
      return console;
    }
  }
  try {
    window.FootLab = window.FootLab || window.Elifoot || {};
    const NS = (window.FootLab.Lineups = window.FootLab.Lineups || {});
    // compatibility alias
    window.Elifoot = window.Elifoot || window.FootLab;

    const parseFormation = function (tacticName) {
      try {
        const nums = (tacticName || '4-4-2').split('-').map((n) => parseInt(n, 10));
        if (nums.length === 3 && nums.every((n) => !isNaN(n))) return nums;
      } catch (e) {
        /* ignore */
      }
      return [4, 4, 2];
    };

    /**
     * Mapeia uma posição específica para uma categoria tática simplificada.
     */
    const getPositionCategory = function (pos) {
      const p = (pos || '').toUpperCase();
      if (p === 'GK' || p === 'G' || p === 'GOALKEEPER') return 'GK';
      if (['DF', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p)) return 'DEF';
      if (['MF', 'CM', 'AM', 'DM', 'LM', 'RM', 'M'].includes(p)) return 'MID';
      if (['ST', 'FW', 'SS', 'CF', 'LW', 'RW', 'A', 'W'].includes(p)) return 'ATT';
      return 'MID';
    };

    const normalizePosition = function (pos) {
      const p = (pos || '').toUpperCase();
      if (p === 'DF') return 'CB';
      if (p === 'MF' || p === 'AM' || p === 'DM') return 'CM';
      if (p === 'FW' || p === 'SS') return 'ST';
      return p;
    };

    /**
     * Retorna a lista de táticas (de window.TACTICS) que a equipa pode utilizar
     * com base nos jogadores disponíveis no plantel.
     */
    const getCompatibleTactics = function (team) {
      if (!team || !Array.isArray(team.players) || !window.TACTICS) return [];

      const counts = { GK: 0, DEF: 0, MID: 0, ATT: 0 };
      team.players.forEach(p => {
        counts[getPositionCategory(p.position)]++;
      });

      return window.TACTICS.filter(tactic => {
        const formation = parseFormation(tactic.name);
        const reqGK = 1;
        const reqDEF = formation[0];
        const reqMID = formation[1];
        const reqATT = formation[2];

        const hasGK = counts.GK >= reqGK;
        const hasDef = counts.DEF >= (reqDEF - 1);
        const hasMid = counts.MID >= (reqMID - 1);
        // Para o ataque (4-3-3 precisa de 3), permitimos que apareça se tiveres pelo menos 1.
        const hasAtt = counts.ATT >= Math.min(reqATT, 1);
        
        const totalFieldPlayers = counts.DEF + counts.MID + counts.ATT;
        const isCompatible = hasGK && hasDef && hasMid && hasAtt && totalFieldPlayers >= 10;

        if (!isCompatible && team.name === (window.playerClub && window.playerClub.team.name)) {
           // Log apenas para a equipa do jogador para não inundar a consola
           console.log(`Tática ${tactic.name} rejeitada:`, { 
             reqs: { reqDEF, reqMID, reqATT }, 
             tem: counts,
             checks: { hasGK, hasDef, hasMid, hasAtt }
           });
        }

        return isCompatible;
      });
    };

    const orderByRoster = function (originalList, listToOrder) {
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
      // append any remaining that weren't in original order
      listToOrder.forEach((p) => {
        if (!ordered.includes(p)) ordered.push(p);
      });
      return ordered;
    };

    const chooseStarters = function (team) {
      if (!team || !Array.isArray(team.players)) return { starters: [], subs: [] };
      // exclude suspended players
      const available = team.players.filter((p) => !(p.suspendedGames && p.suspendedGames > 0));
      const players = available.slice();

      const formation = parseFormation(team.tactic || (team.tacticData && team.tacticData.name));
      const defCount = formation[0] || 4;
      const midCount = formation[1] || 4;
      const attCount = formation[2] || 2;

      // bucket players by position
      const byPos = { GK: [], LB: [], RB: [], CB: [], CM: [], LW: [], RW: [], ST: [], other: [] };
      players.forEach((p) => {
        const np = normalizePosition(p.position);
        if (byPos[np]) byPos[np].push(p);
        else byPos.other.push(p);
      });
      // sort buckets by skill descending
      Object.keys(byPos).forEach((k) => byPos[k].sort((a, b) => (b.skill || 0) - (a.skill || 0)));

      const starters = [];
      // pick GK
      if (byPos.GK.length > 0) {
        const gk = byPos.GK.shift();
        const idx = players.findIndex((x) => x === gk);
        if (idx >= 0) players.splice(idx, 1);
        starters.push(gk);
      }

      // choose defenders with enforced central-defender rules
      const defenders = [];
      // Special handling for five-man backlines: prefer 3 CB + 1 LB + 1 RB when possible
      if (defCount === 5) {
        // try to pick 3 CBs
        for (let i = 0; i < 3 && byPos.CB.length > 0; i++) defenders.push(byPos.CB.shift());
        // then 1 LB
        if (defenders.length < defCount && byPos.LB.length > 0) defenders.push(byPos.LB.shift());
        // then 1 RB
        if (defenders.length < defCount && byPos.RB.length > 0) defenders.push(byPos.RB.shift());
        // if we still don't have enough (roster lacks specific positions), fill with remaining CBs
        while (defenders.length < defCount && byPos.CB.length > 0) defenders.push(byPos.CB.shift());
        // then try LB/RB again
        while (defenders.length < defCount && (byPos.LB.length > 0 || byPos.RB.length > 0)) {
          if (byPos.LB.length > 0) defenders.push(byPos.LB.shift());
          if (defenders.length >= defCount) break;
          if (byPos.RB.length > 0) defenders.push(byPos.RB.shift());
        }
        // fallback to midfielders if still short
        while (defenders.length < defCount && byPos.CM.length > 0) defenders.push(byPos.CM.shift());
      } else {
        // determine minimum number of CBs required: for 3-at-back require 3, otherwise prefer at least 2
        const minCBs = defCount === 3 ? 3 : Math.min(2, defCount);
        // take central defenders first up to minCBs
        for (let k = 0; k < minCBs && byPos.CB.length > 0; k++) defenders.push(byPos.CB.shift());
        // fill remaining defender slots preferring fullbacks (LB/RB)
        while (defenders.length < defCount && (byPos.LB.length > 0 || byPos.RB.length > 0)) {
          if (byPos.LB.length > 0) defenders.push(byPos.LB.shift());
          if (defenders.length >= defCount) break;
          if (byPos.RB.length > 0) defenders.push(byPos.RB.shift());
        }
        // if still short, take more CBs
        while (defenders.length < defCount && byPos.CB.length > 0) defenders.push(byPos.CB.shift());
        // fallback to midfielders if still short
        while (defenders.length < defCount && byPos.CM.length > 0) defenders.push(byPos.CM.shift());
      }
      defenders.forEach((p) => {
        if (!p) return;
        starters.push(p);
        const idx = players.findIndex((x) => x === p);
        if (idx >= 0) players.splice(idx, 1);
      });

      // choose midfielders: prefer wingers if tactic requires
      const mids = [];
      const wantsWingers =
        (team.tacticData && team.tacticData.requires && team.tacticData.requires.wingers) || false;
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

      // choose attackers
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

      // fill remaining slots up to 11 with best remaining players
      players.sort((a, b) => (b.skill || 0) - (a.skill || 0));
      while (starters.length < 11 && players.length > 0) starters.push(players.shift());

      // subs are remaining available players but limited to 7 (18-man squad) and at most 1 GK sub unless insufficient outfielders
      const subsCount = Math.min(7, players.length);
      const subs = [];
      // sort remaining players by skill desc
      const remainingSorted = players.slice().sort((a, b) => (b.skill || 0) - (a.skill || 0));
      let gkSubs = 0;
      for (let i = 0; i < remainingSorted.length && subs.length < subsCount; i++) {
        const p = remainingSorted[i];
        const pPos = p && p.position ? (p.position || '').toUpperCase() : '';
        if (pPos === 'GK') {
          // allow only one GK sub unless there are not enough non-GKs to fill the subs
          const nonGkLeft =
            remainingSorted.slice(i + 1).filter((x) => (x.position || '').toUpperCase() !== 'GK')
              .length + subs.filter((x) => (x.position || '').toUpperCase() !== 'GK').length;
          if (gkSubs >= 1 && nonGkLeft >= subsCount - subs.length) {
            // skip this GK for now
            continue;
          }
          gkSubs++;
          subs.push(p);
        } else {
          subs.push(p);
        }
      }

      // remove chosen subs from players array
      subs.forEach((s) => {
        const idx = players.findIndex((x) => x === s);
        if (idx >= 0) players.splice(idx, 1);
      });

      // Order starters by position groups so the lineup displays by position (GK, Def, Mid, Att)
      const groupAndOrder = function (list, roster) {
        if (!Array.isArray(list)) return [];
        const groups = { GK: [], DEF: [], MID: [], ATT: [] };
        list.forEach((p) => {
          const np = normalizePosition(p.position);
          if (np === 'GK') groups.GK.push(p);
          else if (np === 'CB' || np === 'LB' || np === 'RB' || np === 'DF') groups.DEF.push(p);
          else if (np === 'CM' || np === 'LW' || np === 'RW' || np === 'AM' || np === 'DM')
            groups.MID.push(p);
          else if (np === 'ST') groups.ATT.push(p);
          else groups.MID.push(p);
        });
        const ordered = [];
        ordered.push(...orderByRoster(roster, groups.GK));
        ordered.push(...orderByRoster(roster, groups.DEF));
        ordered.push(...orderByRoster(roster, groups.MID));
        ordered.push(...orderByRoster(roster, groups.ATT));
        // append any remaining just in case
        list.forEach((p) => {
          if (!ordered.includes(p)) ordered.push(p);
        });
        return ordered;
      };

      const orderedStarters = groupAndOrder(starters, team.players);
      // For subs keep a sensible order but prefer non-GK subs first
      const subsNonGk = subs.filter((s) => (s.position || '').toUpperCase() !== 'GK');
      const subsGk = subs.filter((s) => (s.position || '').toUpperCase() === 'GK');
      const orderedSubs = orderByRoster(team.players, subsNonGk).concat(
        orderByRoster(team.players, subsGk)
      );

      return { starters: orderedStarters, subs: orderedSubs };
    };

    const reorderMatchByRoster = function (clubObj, matchObj, isHomeSide) {
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
          // append any remaining
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
          getLogger().error('Erro a reordenar match por roster', err);
        } catch (_) {
          /* ignore */
        }
      }
    };

    // expose API
    NS.parseFormation = parseFormation;
    NS.normalizePosition = normalizePosition;
    NS.getPositionCategory = getPositionCategory;
    NS.chooseStarters = chooseStarters;
    NS.getCompatibleTactics = getCompatibleTactics;
    NS.orderByRoster = orderByRoster;
    NS.reorderMatchByRoster = reorderMatchByRoster;
  } catch (err) {
    try {
      getLogger().error('Erro a inicializar Elifoot.Lineups', err);
    } catch (_) {
      /* ignore */
    }
  }
})();
