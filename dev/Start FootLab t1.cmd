@echo off
chcp 65001 >nul
REM Dev/Start Elifoot helper - keep a copy here for convenience
echo Running dev server by default (npm run serve)
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js not found in PATH. Please install Node.js and try again.
  pause
  exit /b 1
)

call npm run serve
exit /b %ERRORLEVEL%
// NOTICE: 'Start Elifoot.cmd' moved to 'dev/Start Elifoot.cmd' to reduce root clutter. Use files from dev/ instead.
