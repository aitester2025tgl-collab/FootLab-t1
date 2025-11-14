// logic/lineups.js
// Centralized lineup utilities: formation parsing, starter selection, and reordering helpers
(function(){
  try {
    window.Elifoot = window.Elifoot || {};
    const NS = window.Elifoot.Lineups = window.Elifoot.Lineups || {};

    function parseFormation(tacticName) {
      try {
        const nums = (tacticName || '4-4-2').split('-').map(n => parseInt(n, 10));
        if (nums.length === 3 && nums.every(n => !isNaN(n))) return nums;
      } catch (e) {}
      return [4, 4, 2];
    }

    function normalizePosition(pos) {
      const p = (pos || '').toUpperCase();
      if (p === 'DF') return 'CB';
      if (p === 'MF' || p === 'AM' || p === 'DM') return 'CM';
      if (p === 'FW' || p === 'SS') return 'ST';
      return p;
    }

    function orderByRoster(originalList, listToOrder) {
      if (!Array.isArray(originalList) || !Array.isArray(listToOrder)) return Array.isArray(listToOrder) ? listToOrder.slice() : [];
      const namesSet = new Set(listToOrder.map(p => p && p.name));
      const ordered = [];
      originalList.forEach(orig => {
        if (!orig || !orig.name) return;
        if (namesSet.has(orig.name)) {
          const found = listToOrder.find(p => p && p.name === orig.name);
          if (found) ordered.push(found);
        }
      });
      // append any remaining that weren't in original order
      listToOrder.forEach(p => { if (!ordered.includes(p)) ordered.push(p); });
      return ordered;
    }

    function chooseStarters(team) {
      if (!team || !Array.isArray(team.players)) return { starters: [], subs: [] };
      // exclude suspended players
      const available = team.players.filter(p => !(p.suspendedGames && p.suspendedGames > 0));
      const players = available.slice();

      const formation = parseFormation(team.tactic || (team.tacticData && team.tacticData.name));
      const defCount = formation[0] || 4;
      const midCount = formation[1] || 4;
      const attCount = formation[2] || 2;

      // bucket players by position
      const byPos = { GK: [], LB: [], RB: [], CB: [], CM: [], LW: [], RW: [], ST: [], other: [] };
      players.forEach(p => {
        const np = normalizePosition(p.position);
        if (byPos[np]) byPos[np].push(p);
        else byPos.other.push(p);
      });
      // sort buckets by skill descending
      Object.keys(byPos).forEach(k => byPos[k].sort((a, b) => (b.skill || 0) - (a.skill || 0)));

      const starters = [];
      // pick GK
      if (byPos.GK.length > 0) {
        const gk = byPos.GK.shift();
        const idx = players.findIndex(x => x === gk);
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
        const minCBs = (defCount === 3) ? 3 : Math.min(2, defCount);
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
      defenders.forEach(p => { if (!p) return; starters.push(p); const idx = players.findIndex(x => x === p); if (idx >= 0) players.splice(idx, 1); });

      // choose midfielders: prefer wingers if tactic requires
      const mids = [];
      const wantsWingers = (team.tacticData && team.tacticData.requires && team.tacticData.requires.wingers) || false;
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
      mids.forEach(p => { if (!p) return; starters.push(p); const idx = players.findIndex(x => x === p); if (idx >= 0) players.splice(idx, 1); });

      // choose attackers
      const atts = [];
      while (atts.length < attCount && byPos.ST.length > 0) atts.push(byPos.ST.shift());
      while (atts.length < attCount && byPos.RW.length > 0) atts.push(byPos.RW.shift());
      while (atts.length < attCount && byPos.LW.length > 0) atts.push(byPos.LW.shift());
      while (atts.length < attCount && byPos.CM.length > 0) atts.push(byPos.CM.shift());
      atts.forEach(p => { if (!p) return; starters.push(p); const idx = players.findIndex(x => x === p); if (idx >= 0) players.splice(idx, 1); });

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
        const pPos = (p && p.position) ? (p.position || '').toUpperCase() : '';
        if (pPos === 'GK') {
          // allow only one GK sub unless there are not enough non-GKs to fill the subs
          const nonGkLeft = remainingSorted.slice(i+1).filter(x => ((x.position||'').toUpperCase() !== 'GK')).length + subs.filter(x=> (x.position||'').toUpperCase() !== 'GK').length;
          if (gkSubs >= 1 && nonGkLeft >= (subsCount - subs.length)) {
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
      subs.forEach(s => {
        const idx = players.findIndex(x => x === s);
        if (idx >= 0) players.splice(idx, 1);
      });

      // Order according to original team roster order so UI follows the provided list
      const orderedStarters = orderByRoster(team.players, starters);
      const orderedSubs = orderByRoster(team.players, subs);

      return { starters: orderedStarters, subs: orderedSubs };
    }

    function reorderMatchByRoster(clubObj, matchObj, isHomeSide) {
      try {
        if (!clubObj || !clubObj.team || !Array.isArray(clubObj.team.players)) return;
        const roster = clubObj.team.players;
        function orderList(list) {
          if (!Array.isArray(list)) return list;
          const ordered = [];
          roster.forEach(r => {
            if (!r || !r.name) return;
            const found = list.find(p => p && p.name === r.name);
            if (found) ordered.push(found);
          });
          // append any remaining
          list.forEach(p => { if (!ordered.includes(p)) ordered.push(p); });
          return ordered;
        }
        if (isHomeSide) {
          matchObj.homePlayers = orderList(matchObj.homePlayers || []);
          matchObj.homeSubs = orderList(matchObj.homeSubs || []);
        } else {
          matchObj.awayPlayers = orderList(matchObj.awayPlayers || []);
          matchObj.awaySubs = orderList(matchObj.awaySubs || []);
        }
      } catch (err) { console.error('Erro a reordenar match por roster', err); }
    }

    // expose API
    NS.parseFormation = parseFormation;
    NS.normalizePosition = normalizePosition;
    NS.chooseStarters = chooseStarters;
    NS.orderByRoster = orderByRoster;
    NS.reorderMatchByRoster = reorderMatchByRoster;
  } catch (err) {
    console.error('Erro a inicializar Elifoot.Lineups', err);
  }
})();
