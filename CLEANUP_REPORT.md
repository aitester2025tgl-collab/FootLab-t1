# FootLab t1 — Cleanup Report

Date: 2025-11-16

## Purpose

This report summarizes a non-destructive review of the repository and recommends which files and folders are safe to archive or remove to reduce repo size. No code or features are changed. Commands are provided so you can run them locally (PowerShell examples).

## Quick summary

- Total repository entries inspected (approx): 244 files (see workspace inventory).
- Biggest candidates for removal/archiving: `archive/` (historical snapshots, old builds, backups), `archive/dist/` build outputs, `archive/backups.zip` and duplicated legacy copies under `archive/legacy_*`.
- Files that must remain in repo for the app/tests to run: `archive/data/real_rosters_2025_26.js` (or an equivalent path accessible to `index.html` and `src`), and `src/legacy_ui/` (referenced by `index.html` and tests).

## Key findings (explicit files/paths found)

- Build outputs found:
  - `archive/dist/dist/app.bundle.js`
  - `archive/dist/dist/app.bundle.js.map`

- Backups & archives:
  - `archive/backups.zip` (zipped backup)

- Snapshots and auto snapshots (many JSON and PNG files):
  - `archive/snapshots/snapshots/*.json` and PNGs
  - `archive/auto-2025-11-15T15-55-00/snapshots/*` (many JSON/PNG)

- Duplicate/historical copies (these appear to be older copies of files now in `src` or `tools`):
  - `archive/legacy_ui/` (contains `hub.js`, `matchBoard.js`, `overlays.js`)
  - `archive/legacy_root_files/` (contains `index.html`, `style.css`)
  - `archive/tools/` (duplicates of scripts in top-level `tools/`)

- Data files referenced by runtime/tests:
  - `archive/data/real_rosters_2025_26.js` — required by `index.html` and runtime messages in `src/teams.js` and `src/main.js`.
  - `src/data/real_rosters_2025_26.js` (shim referencing the `archive/data` file)

Notes: the repository also contains many small JS modules and per-team JSON roster files under `src/data/rosters/` (these are expected and part of the app). The `tests/` and `src/legacy_ui/` files are still referenced, so do not delete them.

## Size estimates & rationale

I did not measure exact bytes in this pass; instead I provide conservative estimates based on file types and common sizes:

- `archive/backups.zip`: likely medium/large (tens to hundreds of MB) depending on snapshot history — treat as large.
- `archive/dist/dist/app.bundle.js` and `.map`: bundle JS and sourcemap — often several MB combined. Safe to delete because `npm run build` regenerates them.
- `archive/auto-*/snapshots/*.png` and `.json`: PNG images can be hundreds KB each; many JSON snapshots may be tens to hundreds KB each. If numerous, they accumulate to tens or hundreds of MB.

If you want exact sizes, run this in PowerShell in the repo root:

```powershell
# show sizes for archive top-level and large files
Get-ChildItem -Recurse -Force .\archive | Where-Object {!$_.PSIsContainer} | Sort-Object Length -Descending | Select-Object FullName, @{Name='SizeMB';Expression={[math]::Round($_.Length/1MB,2)}} -First 50

# total size of archive folder
(Get-ChildItem -Recurse -Force .\archive | Where-Object {!$_.PSIsContainer} | Measure-Object -Property Length -Sum).Sum / 1MB
```

## Recommended non-destructive actions (safe, reversible)

1. Remove build outputs from `archive` (rebuildable):

```powershell
Remove-Item -Force .\archive\dist\dist\app.bundle.js
Remove-Item -Force .\archive\dist\dist\app.bundle.js.map
```

2. Move large historical snapshot folders out of the repo (non-destructive — keeps data accessible).

```powershell
$dest = "C:\\Users\\Tiago\\Documents\\FootLab-archive-$(Get-Date -Format 'yyyy-MM-dd_HH-mm')"
New-Item -ItemType Directory -Path $dest
Move-Item -Path .\archive\auto-* -Destination $dest
Move-Item -Path .\archive\snapshots -Destination $dest
Move-Item -Path .\archive\backups.zip -Destination $dest
```

3. Compress the entire `archive` folder into one zip and then remove the original (keeps a single compressed copy):

```powershell
Compress-Archive -Path .\archive -DestinationPath .\archive_backup_$(Get-Date -Format 'yyyy-MM-dd_HH-mm').zip
# verify the zip then remove the folder
Remove-Item -Recurse -Force .\archive
```

4. If you prefer to keep a small subset of `archive` (for runtime), keep only `archive/data/real_rosters_2025_26.js` and remove or move the rest.

```powershell
# keep roster file, move everything else
New-Item -ItemType Directory -Path $dest
Get-ChildItem -Path .\archive -Exclude data -Force | Move-Item -Destination $dest -Force

# optionally keep only the roster file in-place
# (do not move the roster file if your app expects it at archive/data/real_rosters_2025_26.js)
```

5. Update `.gitignore` to avoid re-adding large archives and temporary folders (suggested lines):

```
archive/
tmp/
archive/*.zip
archive/auto-*/
```

You can append those lines to `.gitignore` manually or with PowerShell:

```powershell
@'
archive/
tmp/
archive/*.zip
archive/auto-*/
'@ | Out-File -FilePath .gitignore -Encoding utf8 -Append
```

## Files/folders I consider safe to delete or move (detailed list)

- `archive/dist/dist/app.bundle.js` (delete — rebuildable)
- `archive/dist/dist/app.bundle.js.map` (delete — rebuildable)
- `archive/backups.zip` (move out or delete if redundant)
- `archive/snapshots/` (move out)
- `archive/auto-*/` (move out)
- `archive/legacy_ui/` (move out — duplicates of `src/legacy_ui/`)
- `archive/legacy_root_files/` (move out)
- `archive/tools/` (if these are duplicates of top-level `tools/`, move out)

Do NOT delete:

- `archive/data/real_rosters_2025_26.js` (referenced by `index.html` and `src`)
- `src/legacy_ui/` (referenced by `index.html` and tests)

## Risk & verification

- Before removing or moving anything, run the PowerShell `Get-ChildItem` size check above to confirm large files.
- After moving or compressing, run your smoke harness and tests:

```powershell
npm run smoke
npm test
```

- If `index.html` complains about missing `archive/data/real_rosters_2025_26.js`, restore only that file to `archive/data/`.

## Suggested next steps (pick one)

- Option 1 (recommended): Run the PowerShell size-check to confirm biggest files, then move `archive/auto-*` and `archive/snapshots` out to an external archive folder using the `Move-Item` commands above.
- Option 2: Compress `archive` into a single zip, verify it, and remove the original folder.
- Option 3: Keep `archive` but update `.gitignore` and add a small `archive/README.md` describing which files are runtime-critical (the roster JS file) and which are historical.

## Contact / restore instructions

If you move or compress files and later need to restore them, copy them back under `archive/` preserving the `data/real_rosters_2025_26.js` path (that path is referenced directly by `index.html` and by `src` shims).

---

Report generated by repository scan on 2025-11-16. No destructive actions taken by this tool.
