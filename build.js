// Minimal esbuild harness for bundling legacy project into a single IIFE bundle.
// Usage: node build.js [--watch]
const esbuild = require('esbuild');
const path = require('path');

const outdir = path.resolve(__dirname, 'dist');
const entry = path.resolve(__dirname, 'src', 'entry.mjs');

const opts = {
  entryPoints: [entry],
  bundle: true,
  outfile: path.join(outdir, 'app.bundle.js'),
  platform: 'browser',
  format: 'iife',
  sourcemap: true,
  target: ['es2019'],
  define: { 'process.env.NODE_ENV': '"development"' },
  logLevel: 'info',
};

if (process.argv.includes('--watch')) {
  esbuild.build({ ...opts, watch: { onRebuild(error, result) {
    if (error) console.error('Rebuild failed:', error);
    else console.log('Rebuild succeeded');
  }}}).then(() => console.log('Watching for changes...')).catch((e) => {
    console.error(e); process.exit(1);
  });
} else {
  esbuild.build(opts).then(() => console.log('Build complete: dist/app.bundle.js')).catch((e) => {
    console.error(e); process.exit(1);
  });
}
