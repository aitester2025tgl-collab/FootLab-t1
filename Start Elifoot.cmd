@echo off
chcp 65001 >nul
REM Start Elifoot helper - choose how to run the app
echo.
echo === Start Elifoot ===
echo 1) Run dev server (npm run serve)
echo 2) Start Electron (npm run start:electron)
echo 3) Open browser at http://localhost:8080
echo 4) Exit
echo.
set /p choice=Select an option [1-4]: 

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js not found in PATH. Please install Node.js and try again.
  pause
  exit /b 1
)

if "%choice%"=="1" (
  echo Running dev server (npm run serve)...
  call npm run serve
  exit /b %ERRORLEVEL%
) else if "%choice%"=="2" (
  echo Starting Electron (npm run start:electron)...
  call npm run start:electron
  exit /b %ERRORLEVEL%
) else if "%choice%"=="3" (
  echo Opening browser at http://localhost:8080
  start http://localhost:8080
  exit /b 0
) else (
  echo Exiting.
  exit /b 0
)
// NOTICE: 'Start Elifoot.cmd' moved to 'dev/Start Elifoot.cmd' to reduce root clutter. Use files from dev/ instead.
