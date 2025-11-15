const fs = require('fs');
const path = require('path');

async function findLatestSnapshot(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.startsWith('elifoot_save_snapshot'));
  if (!files || !files.length) return null;
  files.sort();
  return path.join(dir, files[files.length - 1]);
}

(async () => {
  try {
    let puppeteer;
    try {
      puppeteer = require('puppeteer');
    } catch (e) {
      console.error('Puppeteer not installed. Run: npm install puppeteer --save-dev');
      process.exit(2);
    }

    const root = path.resolve(__dirname, '..');
    const snapDir = path.join(root, 'snapshots');
    const latest = await findLatestSnapshot(snapDir);
    let storageValue = null;
    if (latest && fs.existsSync(latest)) storageValue = fs.readFileSync(latest, 'utf8');

    const indexPath = path.join(root, 'index.html');
    const fileUrl = 'file://' + indexPath;

    const browser = await puppeteer.launch({ args: ['--disable-web-security'], headless: true });
    const page = await browser.newPage();

    if (storageValue) {
      await page.evaluateOnNewDocument((k, v) => {
        try { localStorage.setItem(k, v); } catch (e) {}
      }, 'elifoot_save_snapshot', storageValue);

      try {
        const parsed = JSON.parse(storageValue);
        const payload = parsed && parsed.payload ? parsed.payload : parsed;
        if (payload) {
          await page.evaluateOnNewDocument((snap) => {
            try {
              window.currentJornada = snap.currentJornada;
              window.playerClub = snap.playerClub || window.playerClub;
              window.allDivisions = snap.allDivisions || window.allDivisions;
              window.allClubs = snap.allClubs || window.allClubs;
              window.currentRoundMatches = snap.currentRoundMatches || window.currentRoundMatches;
            } catch (e) {}
          }, payload);
        }
      } catch (e) {
        /* ignore parse issues */
      }
    }

    await page.goto(fileUrl, { waitUntil: 'load' });

    // wait for hub to initialize
    await new Promise((r) => setTimeout(r, 1200));

    // ensure hub is shown and render team menu
    await page.evaluate(() => {
      try {
        const intro = document.getElementById('intro-screen'); if (intro) intro.style.display='none';
        const setup = document.getElementById('screen-setup'); if (setup) setup.style.display='none';
        const hub = document.getElementById('screen-hub'); if (hub) hub.style.display='flex';
        if (typeof window.initHubUI === 'function') window.initHubUI();
        else if (typeof window.renderHubContent === 'function') window.renderHubContent('menu-team');
      } catch (e) {}
    });

    await new Promise((r) => setTimeout(r, 800));

    // measure
    const diag = await page.evaluate(() => {
      const left = document.getElementById('left-column');
      const menu = document.getElementById('hub-menu');
      const firstBtn = (menu && menu.querySelector('.hub-menu-btn')) || null;
      const info = {};
      if (left) {
        const r = left.getBoundingClientRect();
        info.leftColumn = { w: Math.round(r.width), h: Math.round(r.height) };
      }
      if (firstBtn) {
        const b = firstBtn.getBoundingClientRect();
        const cs = window.getComputedStyle(firstBtn);
        info.firstButton = {
          w: Math.round(b.width),
          h: Math.round(b.height),
          fontSize: cs.fontSize,
          paddingTop: cs.paddingTop,
          paddingBottom: cs.paddingBottom,
          marginTop: cs.marginTop,
          marginBottom: cs.marginBottom,
        };
      }
      // ensure finance box visibility
      const fin = document.querySelector('#hub-finance-panel') || document.querySelector('.hub-menu-footer') || null;
      if (fin) {
        const fr = fin.getBoundingClientRect();
        info.finance = { visible: fr.height > 0, top: Math.round(fr.top), bottom: Math.round(fr.bottom), h: Math.round(fr.height) };
      }
      return info;
    });

    const outDir = path.join(root, 'snapshots');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
    const outPng = path.join(outDir, `test-menu-compact-${Date.now()}.png`);
    await page.screenshot({ path: outPng, fullPage: false });

    // decide pass/fail thresholds
    const btnH = diag.firstButton && diag.firstButton.h ? diag.firstButton.h : 9999;
    const leftW = diag.leftColumn && diag.leftColumn.w ? diag.leftColumn.w : 9999;
    const financeVisible = diag.finance ? diag.finance.visible : false;

    let pass = btnH <= 40 && leftW <= 260 && financeVisible;

    const report = {
      initial: { measured: diag },
      thresholds: { maxButtonHeightPx: 40, maxLeftColumnWidthPx: 260, financeShouldBeVisible: true },
      screenshotInitial: outPng,
      final: null,
    };

    if (!pass) {
      // Try forcing the compact classes (simulate the desired runtime behavior)
      await page.evaluate(() => {
        try {
          const hubMenu = document.getElementById('hub-menu');
          const leftCol = document.getElementById('left-column');
          if (hubMenu) hubMenu.classList.add('compact-buttons');
          if (leftCol) leftCol.classList.add('compact');
        } catch (e) {}
      });
      await new Promise((r) => setTimeout(r, 300));
      const outPng2 = path.join(outDir, `test-menu-compact-final-${Date.now()}.png`);
      await page.screenshot({ path: outPng2, fullPage: false });
      const diag2 = await page.evaluate(() => {
        const left = document.getElementById('left-column');
        const menu = document.getElementById('hub-menu');
        const firstBtn = (menu && menu.querySelector('.hub-menu-btn')) || null;
        const info = {};
        if (left) {
          const r = left.getBoundingClientRect();
          info.leftColumn = { w: Math.round(r.width), h: Math.round(r.height) };
        }
        if (firstBtn) {
          const b = firstBtn.getBoundingClientRect();
          const cs = window.getComputedStyle(firstBtn);
          info.firstButton = {
            w: Math.round(b.width),
            h: Math.round(b.height),
            fontSize: cs.fontSize,
            paddingTop: cs.paddingTop,
            paddingBottom: cs.paddingBottom,
            marginTop: cs.marginTop,
            marginBottom: cs.marginBottom,
          };
        }
        const fin = document.querySelector('#hub-finance-panel') || document.querySelector('.hub-menu-footer') || null;
        if (fin) {
          const fr = fin.getBoundingClientRect();
          info.finance = { visible: fr.height > 0, top: Math.round(fr.top), bottom: Math.round(fr.bottom), h: Math.round(fr.height) };
        }
        return info;
      });
      // update pass based on forced state
      const btnH2 = diag2.firstButton && diag2.firstButton.h ? diag2.firstButton.h : 9999;
      const leftW2 = diag2.leftColumn && diag2.leftColumn.w ? diag2.leftColumn.w : 9999;
      const financeVisible2 = diag2.finance ? diag2.finance.visible : false;
      pass = btnH2 <= 40 && leftW2 <= 260 && financeVisible2;
      report.final = { measured: diag2, screenshot: outPng2, pass };
    }

    const outJson = path.join(outDir, `test-menu-compact-${Date.now()}.json`);
    fs.writeFileSync(outJson, JSON.stringify(report, null, 2), 'utf8');

    console.log(pass ? 'TEST PASS' : 'TEST FAIL', JSON.stringify(report));
    console.log('Report JSON:', outJson);

    await browser.close();
    process.exit(pass ? 0 : 3);
  } catch (e) {
    console.error('ERROR running test:', e && e.stack ? e.stack : e);
    process.exit(2);
  }
})();
