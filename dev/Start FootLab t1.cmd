@echo off
chcp 65001 >nul
REM Start FootLab t1: launch dev server in a minimized window and open browser, then exit launcher
where node >nul 2>&1
if errorlevel 1 (
	echo Node.js not found in PATH. Please install Node.js and try again.
	pause
	exit /b 1
)

echo Launching dev server (will run minimized)...
REM Start the dev server in a new minimized window and detach from this launcher.
start "FootLab t1 Server" /min cmd /c "npm run serve"

REM Short delay to let server bind
timeout /t 2 /nobreak >nul

echo Opening browser at http://localhost:8080
start "" "http://localhost:8080"

REM Exit the launcher immediately; server keeps running in the separate minimized window.
exit /b 0
