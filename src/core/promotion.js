// core/promotion.js
// Small utility to compute promotion/relegation for a multi-division league.
// Exposes both module.exports (for Node tests) and window.Promotion for in-browser usage.
(function () {
  'use strict';

  /* eslint-disable-next-line no-unused-vars */
  function cloneClubs(arr) {
    return arr.map((c) => Object.assign({}, c));
  }

  /**
   * applyPromotionRelegation(allDivisions)
   * - allDivisions: array of divisions (index 0 = top division) each an array of club objects
   * Behavior:
   * - For divisions 2..4 (index 1..3) the top 3 are promoted up one division.
   * - For divisions 1..3 (index 0..2) the bottom 3 are relegated down one division.
   * - Division 1 cannot be promoted further; Division 4 cannot be relegated further.
   * Tie-breakers: points desc, goal difference, goals for.
   * Returns: { newDivisions, promoted: { fromIndex: [clubs]... }, relegated: { fromIndex: [clubs]... } }
   */
  function applyPromotionRelegation(allDivisions) {
    if (!Array.isArray(allDivisions) || allDivisions.length === 0)
      throw new Error('allDivisions must be an array of divisions');

    // Ensure we don't mutate original arrays
    const divisions = allDivisions.map((d) => (Array.isArray(d) ? d.slice() : []));

    const promoted = {};
    const relegated = {};

    // Helper sort
    function sortStandings(arr) {
      return arr.slice().sort((a, b) => {
        const pa = Number(a.points || 0),
          pb = Number(b.points || 0);
        if (pb !== pa) return pb - pa; // desc
        const gda = Number(a.goalsFor || 0) - Number(a.goalsAgainst || 0);
        const gdb = Number(b.goalsFor || 0) - Number(b.goalsAgainst || 0);
        if (gdb !== gda) return gdb - gda;
        return Number(b.goalsFor || 0) - Number(a.goalsFor || 0);
      });
    }

    const D = divisions.length;

    // Compute promotions (for divisions 1..D-1 where index >=1)
    for (let idx = 1; idx < D; idx++) {
      const div = divisions[idx] || [];
      const sorted = sortStandings(div);
      const top3 = sorted.slice(0, 3);
      promoted[idx] = top3;
    }

    // Compute relegations (for divisions 0..D-2)
    for (let idx = 0; idx < D - 1; idx++) {
      const div = divisions[idx] || [];
      const sorted = sortStandings(div);
      const bottom3 = sorted.slice(-3);
      relegated[idx] = bottom3;
    }

    // Build newDivisions by removing/adding
    const newDivisions = divisions.map((d) => d.slice());

    // Apply relegations downwards first to avoid index conflicts
    for (let idx = 0; idx < D - 1; idx++) {
      const rej = (relegated[idx] || []).slice();
      if (!rej.length) continue;
      // remove these clubs from their current division
      rej.forEach((club) => {
        const arr = newDivisions[idx];
        const i = arr.indexOf(club);
        if (i >= 0) arr.splice(i, 1);
        // update division property
        if (club) club.division = idx + 2; // 1-based division
      });
      // append to next division
      newDivisions[idx + 1] = newDivisions[idx + 1].concat(rej);
    }

    // Apply promotions (from lower idx -> up one). Do in reverse order to avoid moving same elements twice
    for (let idx = D - 1; idx >= 1; idx--) {
      const pr = (promoted[idx] || []).slice();
      if (!pr.length) continue;
      // remove from current division
      pr.forEach((club) => {
        const arr = newDivisions[idx];
        const i = arr.indexOf(club);
        if (i >= 0) arr.splice(i, 1);
        if (club) club.division = idx; // move up one (1-based)
      });
      // add to upper division
      newDivisions[idx - 1] = newDivisions[idx - 1].concat(pr);
    }

    return { newDivisions, promoted, relegated };
  }

  // Export
  if (typeof module !== 'undefined' && module.exports)
    module.exports = { applyPromotionRelegation };
  if (typeof window !== 'undefined') {
    window.Promotion = window.Promotion || {};
    window.Promotion.applyPromotionRelegation = applyPromotionRelegation;
  }
})();
