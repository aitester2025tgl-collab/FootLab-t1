# FootLab t1 - Quick dev README

This repository contains a browser-style football manager simulation used for
development and testing. The project source is centralized under `src/` to keep
the repository root minimal and easier to navigate.

Quick commands

- Build the browser bundle (esbuild):

```powershell
npm run build
```

- Run the full test suite (unit + integration + smoke):

```powershell
npm test
```

- Run only the smoke harness (JSDOM):

```powershell
npm run smoke
```

Top-level layout (kept at repo root)

- `index.html` — application HTML used by the smoke harness and browser testing.
- `package.json` — scripts and dev dependencies.
- `dist/` — build output (bundled `app.bundle.js`).
- `src/` — all application source code (moved from previous root layout).
- `tests/` — Node test files used by `npm test`.
- `tools/` — helper scripts (screenshot capture, CLI tools).
 - `dev/tools/` — helper scripts (screenshot capture, CLI tools).
- `style.css`, `README.md` and other repo metadata files.

Source layout (under `src/`)

- `src/legacy_ui/` — legacy browser-style UI scripts still referenced directly
  from `index.html` (keeps script ordering stable for the browser harness).
- `src/ui/` — new ES module proof-of-concept modules (being migrated
  incrementally).
- `src/data/` — data files and per-club rosters (some large files split under
  `src/data/rosters/`).

Migration notes

- The project is being migrated incrementally to ES modules. To keep the
  runtime stable and allow progressive conversion, code was moved under `src/`
  and references were updated. Temporary compatibility shims were used during
  the transition and have now been removed.
- Keep `index.html`, `package.json`, and `style.css` at the repository root for
  conventional tooling and CI simplicity.
- If you want to further reduce initial bundle size, we can add dynamic
  imports and lazy-load large `src/data/` assets (per-club rosters, etc.).

**Developer layout (updated)**

- `dev/` — developer helpers and build tooling are now centralized here. This
  includes the real build server (`dev/build.js`), the dev static server
  (`dev/dev-server.js`), and helper scripts (`dev/cleanup_root.ps1`,
  `dev/cleanup_and_archive.ps1`, `dev/archive_legacy.ps1`, etc.).
- `dev/*_root_shim.js` — compatibility shims were moved into `dev/` and are
  available there if some workflows expect `node build.js` or
  `node dev-server.js` at the repository root.
- `dev/tools/` — small command-line helpers (screenshots, CLI tools). You may
  optionally keep less-used helpers in `dev/tools/` to keep the root smaller.
- `archive/archives/` — compressed archives created by maintenance scripts. If
  you need to reclaim disk, move these zip files to external storage; they are
  safe to delete once verified.

When contributors run commands, prefer the npm scripts defined in
`package.json` (for example `npm run build`, `npm run serve`) — these invoke
the `dev/` tooling so callers don't need to run Node directly against root
shims.

If you'd like a different layout (for example, keep `data/` at repo root),
let me know and I will update script paths and tests accordingly.
