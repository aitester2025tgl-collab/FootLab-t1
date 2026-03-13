/* Dump lanes counts: render roster in jsdom and print compact JSON of groups and lane counts */
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
    setTimeout(resolve, 800);
  });

  // initialize playerClub if generator is available (same logic as print_roster)
  try {
    const gen =
      window.generateAllClubs ||
      (window.FootLab && window.FootLab.generateAllClubs) ||
      (window.Elifoot && window.Elifoot.generateAllClubs);
    let club = window.playerClub;
    if (!club && typeof gen === 'function') {
      const allClubs = gen();
      const division4 = (allClubs.filter((c) => c.division === 4) || []).slice(-8);
      club = division4.length ? division4[0] : allClubs[0];
      window.FootLab = window.FootLab || window.Elifoot || {};
      window.playerClub = club;
      window.FootLab.playerClub = club;
    }
    const render =
      (window.FootLab && window.FootLab.Hub && window.FootLab.Hub.renderTeamRoster) ||
      (window.Elifoot && window.Elifoot.Hub && window.Elifoot.Hub.renderTeamRoster) ||
      window.renderTeamRoster;
    if (typeof render === 'function') render(club);
    const content = window.document.getElementById('hub-main-content');
    if (!content) {
      console.error('hub-main-content not found');
      return;
    }
    const groups = Array.from(content.querySelectorAll('.player-group'));
    const out = groups.map((g) => {
      const title =
        (g.querySelector('.lane-title') && g.querySelector('.lane-title').textContent.trim()) ||
        '(no title)';
      const rows = Array.from(g.querySelectorAll('.lane-row')).map(
        (r) => r.querySelectorAll('.player-box').length
      );
      return { title, lanes: rows };
    });
    console.log(JSON.stringify(out, null, 2));
  } catch (e) {
    console.error('error dumping lanes:', e && e.stack);
  }
})();
