try {
  $node = Get-Command node -ErrorAction SilentlyContinue
  if (-not $node) { throw "Node.js not found in PATH. Install Node.js or run via PowerShell with Node available." }
  Write-Output "Starting Elifoot dev server and opening browser..."
  & node tools\start_and_open.js
} catch {
  Write-Error "Failed: $_"
  pause
}
