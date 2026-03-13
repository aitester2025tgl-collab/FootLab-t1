UI archive record

- archive path: `archive/archives/ui_2025-11-16_17-40-38.zip`
- action: compressed root `ui/` into the zip above and removed the original `ui/` folder
- script used: `dev/archive_ui.ps1`
- timestamp (archive name): 2025-11-16_17-40-38

If you want the original `ui/` restored, unzip the file and move the folder back to the repo root:

```
Expand-Archive -Path "archive\archives\ui_2025-11-16_17-40-38.zip" -DestinationPath . -Force
```
