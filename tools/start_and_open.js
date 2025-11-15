const cp = require('child_process');
const http = require('http');
const path = require('path');

const PORT = process.env.PORT || 8080;
const serverScript = path.join(process.cwd(), 'dev-server.js');

function spawnServer() {
  // Start dev-server.js detached so it keeps running after this process exits
  const child = cp.spawn(process.execPath, [serverScript], {
    cwd: process.cwd(),
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  return child;
}

function pingOnce() {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: '127.0.0.1', port: PORT, path: '/', timeout: 1500 }, (res) => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.abort(); reject(new Error('timeout')); });
  });
}

async function waitForServer(maxAttempts = 20, interval = 300) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const status = await pingOnce();
      if (status >= 200 && status < 400) return true;
    } catch (e) {
      // ignore
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  return false;
}

(async () => {
  try {
    // Attempt ping first; if it fails, spawn server
    let up = false;
    try { await pingOnce(); up = true; } catch (e) { up = false; }
    if (!up) {
      console.log('Starting dev server...');
      spawnServer();
    } else console.log('Dev server already running');

    const ok = await waitForServer();
    if (!ok) {
      console.error('Server did not become available in time. Open http://localhost:' + PORT + '/ manually.');
      process.exit(1);
    }

    const url = `http://localhost:${PORT}/`;
    console.log('Opening', url);
    if (process.platform === 'win32') cp.exec(`start "" "${url}"`);
    else if (process.platform === 'darwin') cp.exec(`open "${url}"`);
    else cp.exec(`xdg-open "${url}"`);
    process.exit(0);
  } catch (e) {
    console.error('Failed to start/open:', e && e.message);
    process.exit(1);
  }
})();
