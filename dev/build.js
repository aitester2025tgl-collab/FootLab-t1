// Minimal esbuild-based build script for the project.
// Usage: `node dev/build.js [--watch]`
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '..', 'dist');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const entryPoint = path.resolve(__dirname, '..', 'src', 'entry.mjs');
const outFile = path.join(outDir, 'app.bundle.js');

const args = process.argv.slice(2);
const watch = args.includes('--watch');

const common = {
  entryPoints: [entryPoint],
  outfile: outFile,
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: ['es2020'],
  sourcemap: true,
  logLevel: 'info',
};

if (watch) {
  esbuild
    .build({
      ...common,
      watch: {
        onRebuild(error, result) {
          if (error) console.error('Build failed:', error.message || error);
          else console.log('Build succeeded');
        },
      },
    })
    .then(() => console.log('Watching for changes...'))
    .catch((e) => {
      console.error(e && e.message);
      process.exit(1);
    });
} else {
  esbuild
    .build(common)
    .then(() => {
      console.log('Build completed:', outFile);
    })
    .catch((e) => {
      console.error('Build failed:', e && e.message);
      process.exit(1);
    });
}
