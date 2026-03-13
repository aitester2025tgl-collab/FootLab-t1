<#
PowerShell helper to move legacy / duplicate root files into `archive/legacy_root_files`.
This script is non-destructive: it moves files (not deletes) and timestamps the destination.

Run from the repository root (PowerShell v5.1):
    .\dev\cleanup_root.ps1

It will move the following items if present:
  - main.js
  - players.js
  - preload.js
<#
PowerShell helper to move legacy / duplicate root files into `archive/legacy_root_files`.
This script is non-destructive: it moves files (not deletes) and timestamps the destination.

Run from the repository root (PowerShell v5.1):
    .\dev\cleanup_root.ps1

It will move the following items if present:
  - main.js
  - players.js
  - preload.js
  - electron-main.js
  - core\ (folder)
  - services\ (folder)

After running, confirm the app still works (e.g. `npm run smoke`).
#>

Set-StrictMode -Version Latest

$root = Get-Location
$archiveRoot = Join-Path $root 'archive' | Resolve-Path -ErrorAction SilentlyContinue
if (-not $archiveRoot) { New-Item -ItemType Directory -Path (Join-Path $root 'archive') | Out-Null }

$destBase = Join-Path $root 'archive\legacy_root_files'
if (-not (Test-Path $destBase)) { New-Item -ItemType Directory -Path $destBase | Out-Null }

$timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'

$items = @('main.js','players.js','preload.js','electron-main.js','core','services')

foreach ($name in $items) {
    $srcPath = Join-Path $root $name
    if (Test-Path $srcPath) {
        $destName = "$name-$timestamp"
        $destPath = Join-Path $destBase $destName
        Write-Host "Moving $name -> $destPath"
        try {
            Move-Item -Path $srcPath -Destination $destPath -Force
        } catch {
            Write-Warning "Failed to move ${name}: $_"
        }
    } else {
        Write-Host "Not found: $name - skipping"
    }
}

Write-Host "Move complete. If you keep only minimal runtime files, consider adding 'archive/' to .gitignore."
