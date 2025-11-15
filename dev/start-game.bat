@echo off
REM Start Elifoot dev server and open the game in the browser
node tools\start_and_open.js
if %ERRORLEVEL% NEQ 0 (
  echo Failed to start the server. Try running `npm run serve` manually.
  pause
)
