param(
  [string]$ShortcutName = 'Start Elifoot.lnk',
  [string]$TargetRelative = 'start-game.bat'
)

# Create a .lnk shortcut in the repository root that points to the start-game.bat wrapper
try {
  $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
  $repoRoot = Resolve-Path (Join-Path $scriptDir '..')
  $shortcutPath = Join-Path $repoRoot $ShortcutName
  $targetPath = Resolve-Path (Join-Path $repoRoot $TargetRelative)

  $wsh = New-Object -ComObject WScript.Shell
  $sc = $wsh.CreateShortcut($shortcutPath)
  $sc.TargetPath = $targetPath.Path
  $sc.WorkingDirectory = Split-Path -Parent $targetPath.Path
  # Use a generic shell icon
  $sc.IconLocation = "$env:SystemRoot\system32\SHELL32.dll,1"
  $sc.WindowStyle = 1
  $sc.Description = 'Start Elifoot dev server and open the game in browser'
  $sc.Save()
  Write-Host "Created shortcut at: $shortcutPath"
} catch {
  Write-Error "Failed to create shortcut: $_"
  exit 1
}
