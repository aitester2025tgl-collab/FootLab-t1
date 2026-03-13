Cleanup notes: moved root shims and archived root UI

- `build.js` and `dev-server.js` were removed from the repository root to reduce clutter.
  Copies/working shims are available under `dev/legacy_root_shims/`.

- `index.html` and `style.css` were archived in `archive/archives/legacy_root_files_2025-11-16_18-11-26.zip`.
  Tests now load the archived `index.html` automatically when no root copy exists.

To restore the original root files, extract the zip: 
```
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory('archive\archives\legacy_root_files_2025-11-16_18-11-26.zip','.')
```

If you want me to move other root items into `dev/` or `archive/`, tell me which ones and I'll prepare a non-destructive plan.
