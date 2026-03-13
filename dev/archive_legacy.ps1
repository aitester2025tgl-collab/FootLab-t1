<#
Compress `archive/legacy_root_files` into a timestamped ZIP and remove the original folder.

Non-destructive: the folder is only removed after the ZIP is successfully created.

Run from repository root:
    .\dev\archive_legacy.ps1
#>

Set-StrictMode -Version Latest

$root = Get-Location
$src = Join-Path $root 'archive\legacy_root_files'
if (-not (Test-Path $src)) {
    Write-Host "No legacy_root_files found at: $src -- nothing to do."
    exit 0
}

$destDir = Join-Path $root 'archive\archives'
if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir | Out-Null }

$timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$zipPath = Join-Path $destDir ("legacy_root_files_$timestamp.zip")

Write-Host "Creating archive: $zipPath"
try {
    Compress-Archive -Path $src -DestinationPath $zipPath -Force
} catch {
    Write-Warning "Compress-Archive failed: $_"
    exit 1
}

if (Test-Path $zipPath) {
    Write-Host "Archive created successfully: $zipPath"
    Write-Host "Removing original folder: $src"
    try {
        Remove-Item -Recurse -Force $src
        Write-Host "Original folder removed."
    } catch {
        Write-Warning "Failed to remove original folder: $_"
        Write-Host "You can remove it manually after verifying the zip exists."
        exit 1
    }
} else {
    Write-Warning "Archive not found after Compress-Archive; original folder preserved."
    exit 1
}

Write-Host "Done. Archive saved to: $zipPath"
