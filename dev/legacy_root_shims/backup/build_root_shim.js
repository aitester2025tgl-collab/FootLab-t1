// NOTICE: build moved to `dev/build.js` to reduce root clutter.
// This shim was moved from repository root to `dev/` to keep the root minimal.
try {
  require('./dev/build.js');
} catch (err) {
  console.error('Failed to require ./dev/build.js:', err && err.message);
  process.exit(1);
}
