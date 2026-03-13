// NOTICE: dev server implementation moved to `dev/dev-server.js` to reduce root clutter.
// This shim was moved from repository root to `dev/` to keep the root minimal.
try {
  require('./dev/dev-server.js');
} catch (err) {
  console.error('Failed to require ./dev/dev-server.js:', err && err.message);
  process.exit(1);
}
