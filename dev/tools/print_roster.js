/* Quick verifier: render roster in jsdom and print hub-main-content HTML */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
(async () => {
  const filePath = path.resolve(__dirname, '..', 'index.html');
  let html = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'file://' + filePath,
  });
  const { window } = dom;
  // minimal polyfills
  window.alert = window.alert || function () {};
  window.confirm =
    window.confirm ||
    function () {
      return true;
    };
  window.prompt =
    window.prompt ||
    function () {
      return null;
    };
  // wait for load
  await new Promise((resolve) => {
    window.addEventListener('load', () => setTimeout(resolve, 50));
    setTimeout(resolve, 1000);
  });
  // try to initialize state similarly to smoke_test
  try {
    const gen =
      window.generateAllClubs ||
      (window.FootLab && window.FootLab.generateAllClubs) ||
      (window.Elifoot && window.Elifoot.generateAllClubs);
    if (typeof gen === 'function') {
      const allClubs = gen();
      const division4 = (allClubs.filter((c) => c.division === 4) || []).slice(-8);
      const playerClub = division4.length ? division4[0] : allClubs[0];
      window.FootLab = window.FootLab || window.Elifoot || {};
      window.playerClub = playerClub;
      window.FootLab.playerClub = playerClub;
      // call the app render function if present
      const render =
        (window.FootLab && window.FootLab.Hub && window.FootLab.Hub.renderTeamRoster) ||
        (window.Elifoot && window.Elifoot.Hub && window.Elifoot.Hub.renderTeamRoster) ||
        window.renderTeamRoster;
      if (typeof render === 'function') {
        render(playerClub);
        const content = window.document.getElementById('hub-main-content');
        if (content) {
          console.log('--- hub-main-content HTML START ---');
          console.log(content.innerHTML);
          console.log('--- hub-main-content HTML END ---');
        } else console.error('hub-main-content not found in DOM');
      } else {
        console.error('renderTeamRoster not found in page');
      }
    } else {
      console.error('generateAllClubs not available');
    }
  } catch (e) {
    console.error('error rendering roster:', e && e.message);
  }
})();
