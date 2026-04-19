// Minimal esbuild-based build script for the project.
// Usage: `node dev/build.js [--watch]`
import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
