
// tests/match_sim_test.js

const assert = require('assert');
const { JSDOM } = require('jsdom');

// Mock the browser environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  runScripts: 'dangerously',
  resources: 'usable',
});
global.window = dom.window;
global.document = dom.window.document;

// Load the game's core files
require('../src/matches.js');
require('../src/config/gameConfig.js');

// Mock Logger to suppress verbose output during simulation
window.FootLab = window.FootLab || {};
window.FootLab.Logger = {
  info: () => {},
  error: () => {},
  debug: () => {},
  warn: () => {},
};

describe('Match Simulation', function () {
  it('should simulate a match and produce a winner', function () {
    // Create two mock clubs with different skill levels
    const homeClub = {
      team: {
        name: 'Home Team',
        players: [
          { name: 'Player 1', skill: 100, position: 'ST' },
          { name: 'Player 2', skill: 100, position: 'MF' },
          { name: 'Player 3', skill: 100, position: 'DF' },
          { name: 'Player 4', skill: 100, position: 'GK' },
        ],
      },
    };
    const awayClub = {
      team: {
        name: 'Away Team',
        players: [
          { name: 'Player 5', skill: 10, position: 'ST' },
          { name: 'Player 6', skill: 10, position: 'MF' },
          { name: 'Player 7', skill: 10, position: 'DF' },
          { name: 'Player 8', skill: 10, position: 'GK' },
        ],
      },
    };

    const match = {
      homeClub,
      awayClub,
      home: homeClub.team,
      away: awayClub.team,
      homeGoals: 0,
      awayGoals: 0,
      goals: [],
      isFinished: false,
    };

    // Simulate a full 90-minute match
    for (let minute = 1; minute <= 90; minute++) {
      window.advanceMatchDay([match], minute);
    }

    // Assert that the match is finished
    assert.strictEqual(match.isFinished, true, 'The match should be finished after 90 minutes.');

    // Assert that the stronger team is more likely to win
    // Since the simulation is probabilistic, we'll run it multiple times
    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;
    const iterations = 500;
    
    for (let i = 0; i < iterations; i++) {
        const newMatch = {
            homeClub,
            awayClub,
            home: homeClub.team,
            away: awayClub.team,
            homeGoals: 0,
            awayGoals: 0,
            goals: [],
            isFinished: false,
        };
        for (let minute = 1; minute <= 90; minute++) {
            window.advanceMatchDay([newMatch], minute);
        }
        if (newMatch.homeGoals > newMatch.awayGoals) {
            homeWins++;
        } else if (newMatch.awayGoals > newMatch.homeGoals) {
            awayWins++;
        } else {
            draws++;
        }
    }

    console.log(`Simulated ${iterations} matches: Home Wins: ${homeWins}, Away Wins: ${awayWins}, Draws: ${draws}`);
    assert(homeWins > awayWins, 'The stronger home team should win more often than the weaker away team.');
    assert(homeWins > (iterations * 0.4), 'The stronger home team should win at least 40% of the matches (accounting for draws).');
  });
});