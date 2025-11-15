#!/usr/bin/env node
/*
  tools/select_best_screenshots.js

  Find the most visually different timestamped screenshot per menu compared
  to a baseline screenshot, and copy it to the fixed preview filename
  (e.g. `screenshot-hub-team.png`).

  Usage:
    node tools/select_best_screenshots.js [--baseline path/to/baseline.png] [--threshold 0.01]

  Requires dev dependency: pngjs
*/

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

function readPng(file) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(file)
      .pipe(new PNG())
      .on('parsed', function () {
        resolve(this);
      })
      .on('error', reject);
  });
}

async function pixelDiff(pngA, pngB) {
  // compare overlapping area
  const w = Math.min(pngA.width, pngB.width);
  const h = Math.min(pngA.height, pngB.height);
  if (w === 0 || h === 0) return 1; // totally different
  let diff = 0;
  const threshold = 10; // channel absolute difference threshold
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idxA = (pngA.width * y + x) << 2;
      const idxB = (pngB.width * y + x) << 2;
      const dr = Math.abs(pngA.data[idxA] - pngB.data[idxB]);
      const dg = Math.abs(pngA.data[idxA + 1] - pngB.data[idxB + 1]);
      const db = Math.abs(pngA.data[idxA + 2] - pngB.data[idxB + 2]);
      const da = Math.abs(pngA.data[idxA + 3] - pngB.data[idxB + 3]);
      if (dr > threshold || dg > threshold || db > threshold || da > threshold) diff++;
    }
  }
  const total = w * h;
  return diff / total; // fraction different
}

async function main() {
  const root = path.resolve(__dirname, '..');
  const snaps = path.join(root, 'snapshots');
  if (!fs.existsSync(snaps)) {
    console.error('snapshots/ not found');
    process.exit(2);
  }

  const argv = process.argv.slice(2);
  const argBaseline = (() => {
    const i = argv.indexOf('--baseline');
    if (i >= 0 && argv[i + 1]) return argv[i + 1];
    return null;
  })();
  const thresholdArg = (() => {
    const i = argv.indexOf('--threshold');
    if (i >= 0 && argv[i + 1]) return parseFloat(argv[i + 1]);
    return 0.01;
  })();

  // pick baseline
  let baselinePath = argBaseline;
  if (!baselinePath) {
    // find earliest screenshot file (non-preview) by lexicographic sort
    const files = fs
      .readdirSync(snaps)
      .filter((f) => f.startsWith('screenshot-') && f.endsWith('.png'));
    if (!files.length) {
      console.error('No screenshot PNGs found in snapshots/');
      process.exit(2);
    }
    files.sort();
    baselinePath = path.join(snaps, files[0]);
  } else if (!path.isAbsolute(baselinePath)) baselinePath = path.join(snaps, baselinePath);

  if (!fs.existsSync(baselinePath)) {
    console.error('Baseline not found:', baselinePath);
    process.exit(2);
  }

  console.log('Using baseline:', baselinePath);
  const baselinePng = await readPng(baselinePath);

  // find menu names present in snapshots: files named screenshot-<name>-*.png
  const files = fs
    .readdirSync(snaps)
    .filter((f) => f.startsWith('screenshot-') && f.endsWith('.png'));
  const menuMap = {}; // name -> [files]
  for (const f of files) {
    // skip baseline file
    if (path.join(snaps, f) === baselinePath) continue;
    const m = f.match(/^screenshot-([a-z0-9\-]+)-\d{4}-/i);
    if (m) {
      const name = m[1];
      menuMap[name] = menuMap[name] || [];
      menuMap[name].push(path.join(snaps, f));
    } else {
      // files without name like screenshot-fullpage-<ts> or screenshot-<ts>
      const m2 = f.match(/^screenshot-([\dT\-:]+)\.png$/i);
      if (m2) {
        // ignore
      }
    }
  }

  const threshold = isFinite(thresholdArg) ? thresholdArg : 0.01;
  console.log('Diff threshold:', threshold);

  for (const [name, list] of Object.entries(menuMap)) {
    console.log('\nProcessing menu:', name, 'candidates:', list.length);
    let best = { file: null, diff: -1 };
    for (const f of list) {
      try {
        const p = await readPng(f);
        const d = await pixelDiff(baselinePng, p);
        console.log('  ', path.basename(f), 'diff=', d.toFixed(4));
        if (d > best.diff) best = { file: f, diff: d };
      } catch (e) {
        console.warn('  failed reading', f, e && e.message);
      }
    }
    if (best.file && best.diff > threshold) {
      const dest = path.join(snaps, `screenshot-${name}.png`);
      try {
        fs.copyFileSync(best.file, dest);
        console.log(
          '  -> selected',
          path.basename(best.file),
          'as preview (diff=',
          best.diff.toFixed(4),
          ')'
        );
      } catch (e) {
        console.error('  failed to copy to preview:', e && e.message);
      }
    } else if (best.file) {
      console.log('  -> no candidate exceeded threshold, best diff=', best.diff.toFixed(4));
    } else {
      console.log('  -> no candidates found');
    }
  }

  console.log('\nDone. Fixed previews updated where distinct candidates were found.');
}

main().catch((e) => {
  console.error(e && e.stack ? e.stack : e);
  process.exit(2);
});
