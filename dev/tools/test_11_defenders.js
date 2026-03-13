/* Headless test: render roster for a synthetic club with 11 defenders */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
(async () => {
  const filePath = path.resolve(__dirname, '..', 'index.html');
  const html = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'file://' + filePath,
  });
  const { window } = dom;
  window.alert = window.alert || function () {};
  window.prompt =
    window.prompt ||
    function () {
      return null;
    };
  window.confirm =
    window.confirm ||
    function () {
      return true;
    };
  await new Promise((resolve) => {
    window.addEventListener('load', () => setTimeout(resolve, 50));
    setTimeout(resolve, 500);
  });
  // Create synthetic club with 11 defenders
  const players = [];
  // 2 GKs, 11 DEF, 6 MID, 2 ST for variety
  let id = 20000;
  players.push({
    id: id++,
    name: 'GK One',
    position: 'GK',
    skill: 60,
    salary: 1000,
    contractYears: 1,
  });
  players.push({
    id: id++,
    name: 'GK Two',
    position: 'GK',
    skill: 58,
    salary: 900,
    contractYears: 1,
  });
  for (let i = 1; i <= 11; i++) {
    players.push({
      id: id++,
      name: `DEF ${i}`,
      position: 'CB',
      skill: 50 + (i % 5),
      salary: 800 + i * 10,
      contractYears: 1,
    });
  }
  for (let i = 1; i <= 6; i++) {
    players.push({
      id: id++,
      name: `MID ${i}`,
      position: 'CM',
      skill: 55 + i,
      salary: 700 + i * 10,
      contractYears: 1,
    });
  }
  players.push({
    id: id++,
    name: 'ST One',
    position: 'ST',
    skill: 65,
    salary: 1200,
    contractYears: 1,
  });
  players.push({
    id: id++,
    name: 'ST Two',
    position: 'ST',
    skill: 62,
    salary: 1100,
    contractYears: 1,
  });

  const club = { team: { name: 'Test FC', players } };
  window.FootLab = window.FootLab || window.Elifoot || {};
  window.playerClub = club;
  window.FootLab.playerClub = club;
  try {
    const render =
      (window.FootLab && window.FootLab.Hub && window.FootLab.Hub.renderTeamRoster) ||
      (window.Elifoot && window.Elifoot.Hub && window.Elifoot.Hub.renderTeamRoster) ||
      window.renderTeamRoster;
    if (typeof render === 'function') {
      render(club);
      const content = window.document.getElementById('hub-main-content');
      if (content) {
        console.log('--- TEST: hub-main-content HTML START ---');
        console.log(content.innerHTML);
        console.log('--- TEST: hub-main-content HTML END ---');
      } else {
        console.error('hub-main-content not found in DOM');
      }
    } else {
      console.error('renderTeamRoster not found');
    }
  } catch (e) {
    console.error('render error', e && e.stack);
  }
})();
