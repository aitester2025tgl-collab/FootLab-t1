// NOTICE: dev server implementation moved to `dev/dev-server.js` to reduce root clutter.
// This shim keeps `node dev-server.js` working for scripts that expect it.
try {
  require('./dev/dev-server.js');
} catch (err) {
  console.error('Failed to require ./dev/dev-server.js:', err && err.message);
  process.exit(1);
}
