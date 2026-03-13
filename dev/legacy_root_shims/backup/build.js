// NOTICE: build moved to `dev/build.js` to reduce root clutter.
// This shim keeps `node build.js` working for scripts that expect it.
try {
  require('./dev/build.js');
} catch (err) {
  console.error('Failed to require ./dev/build.js:', err && err.message);
  process.exit(1);
}
