@echo off
cd /d "%~dp0"

:: ── EDIT THIS LINE: your ngrok static domain ──────────────────
set NGROK_DOMAIN=nonhyperbolic-antony-unresentful.ngrok-free.dev
:: ──────────────────────────────────────────────────────────────

title ShareT Redeploy

echo.
echo  ============================================================
echo    ShareT - Redeploy
echo  ============================================================
echo.

:: 1. Kill existing ngrok so the port/domain is free
echo  [1/3] Stopping ngrok...
taskkill /F /IM ngrok.exe /T >nul 2>&1
echo        Done.

:: 2. Stop + remove containers, then rebuild and restart
echo  [2/3] Rebuilding Docker containers (this takes a minute)...
docker-compose down
docker-compose up -d --build
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Docker build failed. Check the output above.
    pause
    exit /b 1
)
echo        Containers running.

:: 3. Start ngrok in a new window
echo  [3/3] Starting ngrok tunnel...
start "ngrok - ShareT" ngrok http --domain=%NGROK_DOMAIN% 5005

echo.
echo  ============================================================
echo    Done! ShareT is live at:
echo    https://%NGROK_DOMAIN%
echo  ============================================================
echo.
pause
