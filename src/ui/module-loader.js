function updateModuleStatusDisplay() {
  try {
    const el = document.getElementById('module-status-list');
    if (!el) return;
    const parts = [];
    for (const k in window.__moduleDiagnostics.modules) {
      const m = window.__moduleDiagnostics.modules[k];
      if (m.status === 'loaded') {
        parts.push(`${k} ✓ ${m.loadTime != null ? `${m.loadTime}ms` : ''}`);
      } else if (m.status === 'error') {
        parts.push(`${k} ✕`);
      } else {
        parts.push(`${k} …`);
      }
    }
    if (window.__moduleDiagnostics.globalErrors.length) {
      parts.push(`errors: ${window.__moduleDiagnostics.globalErrors.length}`);
    }
    el.textContent = parts.join(' | ');
  } catch (e) {
    console.error('module status update failed', e && e.message);
  }
}

function registerModule(name, src) {
  const entry = {
    name,
    src,
    start: Date.now(),
    status: 'loading',
    loadTime: null,
    error: null,
  };
  window.__moduleDiagnostics.modules[name] = entry;
  updateModuleStatusDisplay();

  const s = document.createElement('script');
  s.type = 'module';
  s.src = src;
  s.onload = () => {
    entry.status = 'loaded';
    entry.loadTime = Date.now() - entry.start;
    updateModuleStatusDisplay();
    console.log(`[module-status] loaded ${name} in ${entry.loadTime}ms`);
  };
  s.onerror = (ev) => {
    entry.status = 'error';
    entry.error = ev && (ev.message || 'error');
    entry.loadTime = Date.now() - entry.start;
    updateModuleStatusDisplay();
    console.error(`[module-status] failed to load ${name}`, entry.error);
  };
  document.body.appendChild(s);
  return s;
}

function initializeGlobalErrorCapture() {
  window.addEventListener('error', (e) => {
    try {
      window.__moduleDiagnostics.globalErrors.push({
        type: 'error',
        msg: String((e && e.message) || e),
      });
      updateModuleStatusDisplay();
    } catch (ex) {
      // ignore
    }
  });

  window.addEventListener('unhandledrejection', (ev) => {
    try {
      window.__moduleDiagnostics.globalErrors.push({
        type: 'promise',
        msg: String((ev && ev.reason) || ev),
      });
      updateModuleStatusDisplay();
    } catch (ex) {
      // ignore
    }
  });
}

export function loadUiModules() {
  const isFile = window.location.protocol === 'file:';
  const isElectron = navigator.userAgent.includes('Electron');

  // Do not load ESM modules from file:// protocol unless in Electron
  if (isFile && !isElectron) {
    return;
  }

  window.__moduleDiagnostics = window.__moduleDiagnostics || {
    modules: {},
    globalErrors: [],
  };

  initializeGlobalErrorCapture();

  // Register the UI modules
  registerModule('matchBoard', 'src/ui/matchBoard.mjs');
  registerModule('tactics', 'src/ui/tactics.mjs');
}
