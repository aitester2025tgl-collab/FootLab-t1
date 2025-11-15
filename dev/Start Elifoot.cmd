@echo off
rem Single-file launcher for Elifoot: double-click this to start server and open browser

rem Ensure working directory is the location of this script
cd /d "%~dp0"

rem Find node executable: prefer PATH, then common install locations
set "NODE="
where node >nul 2>nul && set "NODE=node"
if not defined NODE (
  if exist "%ProgramFiles%\nodejs\node.exe" set "NODE=%ProgramFiles%\nodejs\node.exe"
)
if not defined NODE (
  if exist "%LocalAppData%\Programs\nodejs\node.exe" set "NODE=%LocalAppData%\Programs\nodejs\node.exe"
)

if not defined NODE (
  echo Node.js not found. Please install Node.js from https://nodejs.org/ and ensure it is on your PATH.
  pause
  exit /b 1
)

rem Start dev-server.js in a new window so logs remain visible
echo Starting dev server using %NODE%
start "Elifoot Server" "%NODE%" "%~dp0dev-server.js"

rem Poll localhost:8080 until it responds (uses PowerShell for HTTP ping)
set "URL=http://localhost:8080/"
echo Waiting for %URL% to become available...

powershell -NoProfile -Command "for($i=0;$i -lt 40;$i++){try{ $r = Invoke-WebRequest -Uri '%URL%' -UseBasicParsing -TimeoutSec 2; if($r.StatusCode -ge 200 -and $r.StatusCode -lt 400){ exit 0 }}catch{}; Start-Sleep -Milliseconds 500 }; exit 1"
if errorlevel 1 (
  echo Timed out waiting for %URL%.
  echo Check the server window for errors, or run `npm run serve` in a terminal.
  pause
  exit /b 1
)

rem Open default browser to the game
start "" "%URL%"
exit /b 0
@echo off
rem Single-file launcher for Elifoot dev server and browser
rem Place this file in the project root and double-click it to start the game.

setlocal enabledelayedexpansion
rem Ensure working directory is the location of this script
cd /d "%~dp0"

rem Find node executable
set "NODE=node"
where node >nul 2>nul
if errorlevel 1 (
  if exist "%ProgramFiles%\nodejs\node.exe" (
    set "NODE=%ProgramFiles%\nodejs\node.exe"
  ) else if exist "%LocalAppData%\Programs\nodejs\node.exe" (
    set "NODE=%LocalAppData%\Programs\nodejs\node.exe"
  ) else (
    echo Node.js not found in PATH.
    echo Please install Node.js (https://nodejs.org/) or run the project from a terminal.
    pause
    exit /b 1
  )
)

rem Run the start helper which will spawn the dev server (detached) and open the browser
"%NODE%" "%~dp0tools\start_and_open.js"
if errorlevel 1 (
  echo Failed to start the helper script. Try running the following in a terminal:
  echo    npm run serve
  echo    or
  echo    node tools\start_and_open.js
  pause
  exit /b 1
)

exit /b 0
