<#
Safe cleanup and archive script.

Actions performed (non-destructive where possible):
- Move start helper scripts and shortcuts into `dev/`.
- Move `electron-run.log` into `archive/archives/`.
- Compress `archive/snapshots`, `archive/auto-*`, and `archive/dist` into `archive/archives/` and remove originals after successful archive.
- Run `npm ci`, `npm run smoke`, and `npm test` to verify correctness.

Run from repository root:
    .\dev\cleanup_and_archive.ps1

This script logs actions to the console and exits with non-zero code on failures.
#>

Set-StrictMode -Version Latest

function Ensure-Dir($p) {
    if (-not (Test-Path $p)) { New-Item -ItemType Directory -Path $p | Out-Null }
}

$root = Get-Location
$devDir = Join-Path $root 'dev'
Ensure-Dir $devDir

# Move helper/start files into dev/
$moveItems = @('.\start-game.bat', '.\start-game.ps1', '.\Start FootLab t1.cmd', '.\Start FootLab t1.lnk')
foreach ($it in $moveItems) {
    if (Test-Path $it) {
        try {
            Move-Item -Path $it -Destination $devDir -Force
            Write-Host "Moved $it -> $devDir"
        } catch {
            Write-Warning "Failed to move ${it}: ${_}"
        }
    } else { Write-Host "$it not present; skipping" }
}

# Ensure archive/archives exists
$archivesDir = Join-Path $root 'archive\archives'
Ensure-Dir $archivesDir

# Move electron-run.log into archives
if (Test-Path '.\electron-run.log') {
    try {
        Move-Item -Path '.\electron-run.log' -Destination $archivesDir -Force
        Write-Host "Moved electron-run.log -> $archivesDir"
    } catch { Write-Warning "Failed to move electron-run.log: $_" }
} else { Write-Host "electron-run.log not present; skipping" }

# Helper to compress and remove folder safely
function Compress-And-Remove($folderPath, $destName) {
    if (-not (Test-Path $folderPath)) { Write-Host "$folderPath not found; skipping"; return }
    $ts = Get-Date -Format 'yyyy-MM-dd_HH-mm'
    $zipPath = Join-Path $archivesDir ("${destName}_$ts.zip")
    Write-Host "Compressing $folderPath -> $zipPath"
    try {
        Compress-Archive -Path $folderPath -DestinationPath $zipPath -Force
    } catch {
        Write-Warning "Compress-Archive failed for ${folderPath}: ${_}"
        return
    }
    if (Test-Path $zipPath) {
        try {
            Remove-Item -Recurse -Force $folderPath
            Write-Host "Removed original folder: $folderPath"
        } catch {
            Write-Warning "Failed to remove ${folderPath} after archiving: ${_}"
        }
    } else {
        Write-Warning "Zip not found after compressing $folderPath; original preserved."
    }
}

# Compress snapshots, auto-* and dist
Compress-And-Remove (Join-Path $root 'archive\snapshots') 'snapshots'

Get-ChildItem -Path (Join-Path $root 'archive') -Directory -Filter 'auto-*' | ForEach-Object {
    Compress-And-Remove $_.FullName $_.Name
}

Compress-And-Remove (Join-Path $root 'archive\dist') 'archive_dist'

Write-Host "Cleanup and archival steps completed. Now running tests..."

cd $root

# Install exact deps
Write-Host "Running npm ci (may be slow)..."
try {
    npm ci
} catch {
    Write-Warning "npm ci failed: $_"
    exit 1
}

Write-Host "Running npm run smoke..."
try { npm run smoke } catch { Write-Warning "smoke failed: $_"; exit 1 }

Write-Host "Running npm test..."
try { npm test } catch { Write-Warning "tests failed: $_"; exit 1 }

Write-Host "All tests passed and cleanup completed."
