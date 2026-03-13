#!/usr/bin/env pwsh
# Archive the root ui folder into archive\archives and remove the original
$ErrorActionPreference = 'Stop'
$src = 'ui'
if (-not (Test-Path -LiteralPath $src)) {
    Write-Output "No '$src' folder found - nothing to do."
    exit 0
}
$archivesDir = Join-Path 'archive' 'archives'
if (-not (Test-Path -LiteralPath $archivesDir)) {
    New-Item -ItemType Directory -Path $archivesDir | Out-Null
}
$ts = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$zipName = "ui_$ts.zip"
$dest = Join-Path $archivesDir $zipName
Write-Output ("Compressing '{0}' -> '{1}'" -f $src, $dest)
Compress-Archive -Path $src -DestinationPath $dest -Force
if (-not (Test-Path -LiteralPath $dest)) {
    Write-Error ("Failed to create archive: {0}" -f $dest)
    exit 2
}
Write-Output ("Archive created: {0}" -f $dest)
Write-Output ("Removing original folder '{0}'" -f $src)
Remove-Item -LiteralPath $src -Recurse -Force
if (-not (Test-Path -LiteralPath $src)) {
    Write-Output ("Original folder removed: {0}" -f $src)
} else {
    Write-Warning ("Could not remove original folder: {0}" -f $src)
}
# Output the zip path (machine-readable)
Write-Output ("__ARCHIVE_PATH::{0}" -f $dest)
