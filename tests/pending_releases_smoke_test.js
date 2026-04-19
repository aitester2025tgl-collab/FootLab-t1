/* eslint-disable no-console, no-unused-vars */
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Mock the browser environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  runScripts: 'dangerously',
  resources: 'usable',
});
global.window = dom.window;
global.document = dom.window.document;

// Load the game's core files
await import('../src/data/real_rosters_2025_26.js');
await import('../src/teams.js');
await import('../src/players.js');
await import('../src/config/gameConfig.js');
await import('../src/core/simulation.js');
await import('../src/clubs.js');
await import('../src/matches.js');

(async () => {
  try {
    // Manually initialize team data, which is normally done by the UI, then wait for it to be ready.
    if (typeof window.initializeTeams === 'function') {
      window.initializeTeams();
    }
    // Wait for rosters to be processed into divisionsData
    if (typeof window.waitForDivisionsData === 'function') {
      await window.waitForDivisionsData();
    }

    // init minimal runtime similar to smoke helper
    const generateAllClubs =
      window.generateAllClubs || (window.Elifoot && window.Elifoot.generateAllClubs);
    const generateRounds =
      window.generateRounds || (window.Elifoot && window.Elifoot.generateRounds);
    const assignStartingLineups =
      window.assignStartingLineups || (window.Elifoot && window.Elifoot.assignStartingLineups);

    if (typeof generateAllClubs === 'function') {
      const allClubs = generateAllClubs();
      const allDivisions = [[], [], [], []];
      allClubs.forEach((c) => {
        if (c && c.division >= 1 && c.division <= 4) allDivisions[c.division - 1].push(c);
      });
      window.Elifoot = window.Elifoot || {};
      const division4 = allDivisions[3] || [];
      const pool = division4.length > 8 ? division4.slice(-8) : division4.slice();
      const playerClub = pool.length
        ? pool[Math.floor(Math.random() * pool.length)]
        : allClubs[0] || null;
      window.playerClub = playerClub;
      window.Elifoot.playerClub = playerClub;
      window.Elifoot.allDivisions = allDivisions;
      window.allDivisions = allDivisions;
      window.allClubs = allClubs;
      if (typeof generateRounds === 'function') {
        const firstRoundMatches = [];
        allDivisions.forEach((div) => {
          const rounds = generateRounds(div);
          if (rounds && rounds.length) firstRoundMatches.push(...rounds[0]);
        });
        window.currentRoundMatches = firstRoundMatches;
        if (typeof assignStartingLineups === 'function')
          try {
            assignStartingLineups(firstRoundMatches);
          } catch (e) {
            /* ignore */
          }
      }
    } else {
      console.error('generateAllClubs not available');
      process.exit(2);
    }

    // call finish day
    if (typeof window.finishDayAndReturnToHub === 'function')
      try {
        window.finishDayAndReturnToHub();
      } catch (e) {
        /* ignore */
      }
    else if (window.Simulation && typeof window.Simulation.finishDayAndReturnToHub === 'function')
      try {
        window.Simulation.finishDayAndReturnToHub();
      } catch (e) {
        /* ignore */
      }
    else {
      console.error('finishDayAndReturnToHub not found');
      process.exit(2);
    }

    // wait a bit
    await new Promise((r) => setTimeout(r, 60));

    const cfg = (window.GameConfig && window.GameConfig.transfer) || {};
    const clubCount = Array.isArray(window.allClubs) ? window.allClubs.length : 0;
    const baseTargetDefault = Math.max(2, Math.min(6, Math.floor(clubCount / 12) || 2));
    const earlyJornadas = typeof cfg.earlyJornadas === 'number' ? cfg.earlyJornadas : 6;
    const jornada = Number(window.currentJornada || 1);
    const target =
      jornada <= earlyJornadas
        ? typeof cfg.minPendingReleasesEarly === 'number'
          ? cfg.minPendingReleasesEarly
          : Math.max(baseTargetDefault, 3)
        : typeof cfg.minPendingReleases === 'number'
          ? cfg.minPendingReleases
          : baseTargetDefault;

    const pending = window.PENDING_RELEASES || [];
    console.log('Test: target =', target, 'pending =', pending.length);
    if ((pending.length || 0) < target) {
      console.error('FAIL: pending releases below target');
      process.exit(1);
    }
    console.log('PASS: pending releases >= target');
    process.exit(0);
  } catch (err) {
    console.error('pending_releases_smoke_test failed:', err && err.message);
    process.exit(3);
  }
})();