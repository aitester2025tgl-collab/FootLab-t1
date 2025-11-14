# Elifoot - Quick dev README

This repository is a lightweight browser-style football manager simulation. This README documents a couple of small developer/test tasks.

Run the smoke test (jsdom):

```powershell
npm run smoke
```

Run the Node integration test:

```powershell
npm test
```

Notes:
- The app uses global `window.*` state and simple script ordering (not modules).
- Large roster backups live under `data/backups/` — consider archiving them outside the repo to reduce clutter.
