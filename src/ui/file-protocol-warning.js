export function initializeFileProtocolWarning() {
  const isFile = window.location.protocol === 'file:';
  const isElectron = navigator.userAgent.includes('Electron');

  if (isFile && !isElectron) {
    const id = 'file-protocol-warning';
    if (document.getElementById(id)) {
      return; // Warning already exists
    }

    const wrap = document.createElement('div');
    wrap.id = id;
    wrap.style.position = 'fixed';
    wrap.style.left = '0';
    wrap.style.top = '0';
    wrap.style.right = '0';
    wrap.style.zIndex = '9999';
    wrap.style.background = 'linear-gradient(90deg, #ff7043, #ffab40)';
    wrap.style.color = '#111';
    wrap.style.padding = '12px 16px';

    wrap.innerHTML = `
      <strong>Warning:</strong> The app was opened via <code>file://</code>. ES modules cannot be loaded from the file protocol, so tactics and match board modules are disabled.
      <span style="margin-left:12px">Run <code>npm run serve</code> and open <a id="__local_link" href="http://localhost:8080/">http://localhost:8080/</a></span>
    `;

    const btn = document.createElement('button');
    btn.textContent = 'Check localhost:8080';
    btn.style.marginLeft = '12px';
    btn.onclick = function () {
      const statusId = '__local_status';
      let statusEl = document.getElementById(statusId);
      if (!statusEl) {
        statusEl = document.createElement('span');
        statusEl.id = statusId;
        statusEl.style.marginLeft = '12px';
        statusEl.style.fontWeight = '700';
        wrap.appendChild(statusEl);
      }
      statusEl.textContent = 'Checking http://localhost:8080/ ...';
      let attempts = 0;
      function tryCheck() {
        attempts++;
        fetch('http://localhost:8080/', { mode: 'cors' })
          .then(function (r) {
            if (r.ok) {
              window.location.href = 'http://localhost:8080/';
            } else {
              statusEl.textContent = `Dev server responded with HTTP ${r.status}`;
            }
          })
          .catch(function () {
            if (attempts < 6) {
              const wait = attempts * 1000;
              statusEl.textContent = `No server on localhost:8080 — retrying in ${wait / 1000}s...`;
              setTimeout(tryCheck, wait);
            } else {
              statusEl.textContent = 'No dev server detected. Start it with: npm run serve';
              alert('No dev server detected at http://localhost:8080/. Start it with: npm run serve');
            }
          });
      }
      tryCheck();
    };

    wrap.appendChild(btn);
    document.body.appendChild(wrap);
  }
}
