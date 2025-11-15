const puppeteer = require('puppeteer');
const fs = require('fs');
const http = require('http');
const cp = require('child_process');

function ping(url, timeout = 1500) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on('error', reject);
    req.setTimeout(timeout, () => {
      req.abort();
      reject(new Error('timeout'));
    });
  });
}

(async () => {
  const url = process.argv[2] || 'http://localhost:8080/index.html';
  console.log('Opening', url);
  let serverProc = null;
  try {
    // If no server is responding, start the local dev server in this process
    try {
      await ping('http://localhost:8080/');
      console.log('Dev server already running at http://localhost:8080/');
    } catch (e) {
      console.log('No dev server detected — starting local dev-server.js');
      serverProc = cp.spawn(process.execPath, ['dev-server.js'], {
        cwd: process.cwd(),
        stdio: ['ignore', 'inherit', 'inherit'],
      });
      // wait briefly for server startup
      await new Promise((r) => setTimeout(r, 600));
    }

    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', (msg) => logs.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', (err) => logs.push({ type: 'pageerror', text: String(err) }));
  page.on('error', (err) => logs.push({ type: 'error', text: String(err) }));
  page.on('requestfailed', (req) => logs.push({ type: 'requestfailed', text: req.url() + ' -> ' + (req.failure && req.failure().errorText) }));
  page.on('response', (res) => { if (res.status() >= 400) logs.push({ type: 'response-error', text: res.status() + ' ' + res.url() }); });
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    // wait briefly for JS to initialize
    await new Promise((r) => setTimeout(r, 1200));
    // If tactics init exists, call it
    const hasTactics = await page.evaluate(() => {
      return !!(window.Tactics && typeof window.Tactics.initTacticPanel === 'function');
    });
    if (hasTactics) {
      console.log('Tactics module available, initializing panel...');
      await page.evaluate(() => {
        try {
          window.Tactics.initTacticPanel();
        } catch (e) {
          console.error('Tactics init failed', e && e.message);
        }
      });
      await new Promise((r) => setTimeout(r, 400));
    } else {
      console.warn('Tactics module not found on page (window.Tactics missing)');
    }
    // capture screenshot
    const outDir = 'tmp';
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const screenshotPath = `${outDir}/tactics_panel.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Saved screenshot to', screenshotPath);
  } catch (err) {
    console.error('Error during check:', err && err.stack ? err.stack : err);
  } finally {
    // dump collected logs
    console.log('Page console logs:');
    logs.forEach((l) => console.log(`[${l.type}] ${l.text}`));
    await browser.close();
  }
  } finally {
    // if we started a server process, try to shut it down
    if (serverProc) {
      try {
        serverProc.kill();
        console.log('Shut down spawned dev-server.js');
      } catch (e) {
        console.warn('Failed to kill spawned dev-server', e && e.message);
      }
    }
  }
})();
