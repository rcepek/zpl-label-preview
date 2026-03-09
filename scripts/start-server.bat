@echo off
REM ZPL Label Preview — Log File Server (Windows)
REM Double-click this file to start the server.
REM It serves %LOCALAPPDATA%\PlexComponentHost\logs on http://localhost:8765
REM Press Ctrl+C in this window to stop.

SET PORT=8765
SET LOG_DIR=%LOCALAPPDATA%\PlexComponentHost\logs

IF NOT EXIST "%LOG_DIR%" (
    echo ERROR: Log directory not found: %LOG_DIR%
    echo.
    echo Adjust LOG_DIR in this script if PlexComponentHost logs are stored elsewhere.
    pause
    exit /b 1
)

echo Starting ZPL Label Preview log server...
echo Serving: %LOG_DIR%
echo URL:     http://localhost:%PORT%
echo.
echo Press Ctrl+C to stop.
echo.
python -m http.server %PORT% --directory "%LOG_DIR%"
pause
