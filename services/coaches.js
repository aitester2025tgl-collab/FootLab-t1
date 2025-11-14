// services/coaches.js
// Lightweight coach management system: tracks coaches, stats, reputation, hiring/firing logic.

window.COACH_SERVICE = window.COACH_SERVICE || (function(){
  const coachesByName = {}; // name -> coach object
  const teamToCoach = {}; // teamName -> coachName
  let _suppressEvents = false; // when true, do not emit onCoachHired events (useful during startup)

  function computeReputation(coach) {
    // Simple reputation function: base 50 + 10*(winRate) + 2*seasons
    const games = coach.stats.wins + coach.stats.draws + coach.stats.losses;
    const winRate = games ? (coach.stats.wins / games) : 0;
    return Math.round(50 + (winRate * 100) * 0.1 + (coach.seasons || 0) * 2);
  }

  function registerCoach(name, opts = {}) {
    if (!name) return null;
    if (!coachesByName[name]) {
      coachesByName[name] = {
        name,
        team: opts.team || null,
        stats: { wins: 0, draws: 0, losses: 0 },
        seasons: opts.seasons || 0,
        unemployed: !!opts.unemployed,
        reputation: 50
      };
    }
    // update fields
    const c = coachesByName[name];
    if (opts.team) c.team = opts.team;
    if (typeof opts.unemployed === 'boolean') c.unemployed = opts.unemployed;
    c.reputation = computeReputation(c);
    if (c.team) teamToCoach[c.team] = name;
    return c;
  }

  function assignCoachToTeam(coachName, teamName, clubObj) {
    if (!coachName) return null;
    const c = registerCoach(coachName, { team: teamName, unemployed: false });
    c.unemployed = false;
    c.team = teamName;
    if (clubObj) clubObj.coach = coachName;
    teamToCoach[teamName] = coachName;
    // emit hire event (unless events suppressed)
    try {
      if (!_suppressEvents && typeof window.onCoachHired === 'function') window.onCoachHired({ coach: c, teamName, club: clubObj });
    } catch (e) {}
    return c;
  }

  function unassignCoachFromTeam(teamName) {
    const coachName = teamToCoach[teamName];
    if (!coachName) return null;
    const c = coachesByName[coachName];
    if (c) {
      c.team = null;
      c.unemployed = true;
    }
    delete teamToCoach[teamName];
    return c;
  }

  function getCoachByTeam(teamName) {
    const coachName = teamToCoach[teamName];
    return coachName ? coachesByName[coachName] : null;
  }

  function recordMatchResult(teamName, result) {
    // result: 'win'|'draw'|'loss'
    const coach = getCoachByTeam(teamName);
    if (!coach) return null;
    if (result === 'win') coach.stats.wins += 1;
    else if (result === 'draw') coach.stats.draws += 1;
    else if (result === 'loss') coach.stats.losses += 1;
    coach.reputation = computeReputation(coach);

    // simple immediate firing check after a minimum number of games
    const games = coach.stats.wins + coach.stats.draws + coach.stats.losses;
    if (games >= 10) {
      // try to find club info from global clubs if available
      try {
        const club = (window.ALL_CLUBS || []).find(c => c.team && c.team.name === teamName) || null;
        let expected = 0.35; // default expected win rate
        if (club) {
          // base by division
          const div = club.division || 4;
          if (div === 1) expected = 0.5;
          else if (div === 2) expected = 0.4;
          else if (div === 3) expected = 0.33;
          else expected = 0.28;
          // factor in club "reputation" approximate from members/stadium
          const members = club.team && club.team.members ? club.team.members : 5000;
          const repFactor = Math.min(0.15, (members / 100000));
          expected += repFactor;
        }
        const winRate = coach.stats.wins / games;
        // if coach performs significantly below expectation, fire
        if (winRate + 0.05 < expected) {
          // fire coach
          unassignCoachFromTeam(teamName);
          if (club) club.coach = null;
          // add to unemployed pool if data source exists
          try {
            if (window.UNEMPLOYED_COACHES && Array.isArray(window.UNEMPLOYED_COACHES)) {
              if (!window.UNEMPLOYED_COACHES.includes(coach.name)) window.UNEMPLOYED_COACHES.push(coach.name);
            }
          } catch (e){}
          // expose an event if consumer wants to react
          if (typeof window.onCoachFired === 'function') window.onCoachFired({ coach, teamName, club });
        }
      } catch (e) { /* ignore */ }
    }

    return coach;
  }

  function hireFromUnemployedForClub(clubObj) {
    if (!clubObj) return null;
    // prefer coaches with higher reputation from registered pool, then fallback to global UNEMPLOYED_COACHES
    const candidates = Object.values(coachesByName).filter(c => c.unemployed).sort((a,b)=>b.reputation - a.reputation);
    let chosen = candidates.length ? candidates[0] : null;
    if (!chosen && window.UNEMPLOYED_COACHES && window.UNEMPLOYED_COACHES.length) {
      chosen = registerCoach(window.UNEMPLOYED_COACHES.shift(), {unemployed: true});
    }
    if (chosen) {
      assignCoachToTeam(chosen.name, clubObj.team.name, clubObj);
      // emit hire event handled by assignCoachToTeam (suppressed if _suppressEvents)
      return coachesByName[chosen.name];
    }
    return null;
  }

  function listAll() { return Object.values(coachesByName); }

  return {
    registerCoach,
    assignCoachToTeam,
    unassignCoachFromTeam,
    getCoachByTeam,
    recordMatchResult,
    hireFromUnemployedForClub,
    listAll,
    setSuppressEvents: (v) => { _suppressEvents = !!v; },
    _internal: { coachesByName, teamToCoach }
  };
})();

// Attempt to pre-register any real coaches found in window.REAL_COACHES
try{
  if (window.REAL_COACHES) {
    Object.keys(window.REAL_COACHES).forEach(teamName => {
      const coachName = window.REAL_COACHES[teamName];
      if (coachName) window.COACH_SERVICE.registerCoach(coachName, { team: teamName, unemployed: false });
    });
  }
}catch(e){}
