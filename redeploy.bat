@echo off
cd /d "%~dp0"
title ShareT - One-Click Startup

:: ── EDIT THESE LINES ──────────────────────────────────────────
set NGROK_DOMAIN=nonhyperbolic-antony-unresentful.ngrok-free.dev
set PORT=5005
set DOCKER_EXE=C:\Program Files\Docker\Docker\Docker Desktop.exe
:: ──────────────────────────────────────────────────────────────

:: Parse flags: pass --local to skip ngrok
set SKIP_NGROK=0
for %%A in (%*) do if /i "%%A"=="--local" set SKIP_NGROK=1

cls
echo.
echo  ============================================================
echo    ShareT One-Click Startup
echo  ============================================================
echo.

:: ── DEPENDENCY CHECKS ─────────────────────────────────────────
echo  Checking dependencies...

:: Docker installed?
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Docker is not installed or not in PATH.
    echo  Install Docker Desktop from: https://www.docker.com/products/docker-desktop
    start https://www.docker.com/products/docker-desktop
    pause & exit /b 1
)
echo  [OK] Docker CLI found

:: Docker daemon running?
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo  [INFO] Docker is not running. Starting Docker Desktop...
    if exist "%DOCKER_EXE%" (
        start "" "%DOCKER_EXE%"
    ) else (
        start "" "%LOCALAPPDATA%\Docker\Docker Desktop.exe" 2>nul
    )
    echo  [INFO] Waiting for Docker daemon (up to 90 seconds)...
    set /a _dc=0
    :waitdocker
    timeout /t 3 /nobreak >nul
    set /a _dc+=3
    if %_dc% gtr 90 (
        echo  [ERROR] Docker did not start. Please open Docker Desktop manually.
        pause & exit /b 1
    )
    docker info >nul 2>&1
    if %errorlevel% neq 0 goto waitdocker
    echo  [OK] Docker is running
) else (
    echo  [OK] Docker is running
)

:: ngrok (optional)
set NGROK_AVAILABLE=0
where ngrok >nul 2>&1
if %errorlevel% equ 0 (
    set NGROK_AVAILABLE=1
    echo  [OK] ngrok found
) else (
    echo  [WARN] ngrok not in PATH - ShareT will only be accessible locally
    echo         Install: https://ngrok.com/download
    set SKIP_NGROK=1
)

:: Node.js (optional for Docker mode)
where node >nul 2>&1
if %errorlevel% equ 0 (echo  [OK] Node.js found) else (echo  [INFO] Node.js not found - not needed in Docker mode)

echo.

:: ── STEP 1: Stop ngrok ────────────────────────────────────────
echo  [1/3] Stopping existing ngrok...
taskkill /F /IM ngrok.exe /T >nul 2>&1
echo        Done.

:: ── STEP 2: Rebuild containers ────────────────────────────────
echo  [2/3] Rebuilding ShareT containers...
echo        (first run: ~2 min, subsequent: ~15 s)
echo.
docker-compose down
docker-compose up -d --build
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Docker build failed. Check output above.
    pause & exit /b 1
)

:: Wait for health endpoint (max 60 s)
echo.
echo  [INFO] Waiting for ShareT to be ready...
set /a _hc=0
:waithealth
timeout /t 3 /nobreak >nul
set /a _hc+=3
curl -sf http://localhost:%PORT%/health >nul 2>&1
if %errorlevel% neq 0 (
    if %_hc% lss 60 goto waithealth
    echo  [WARN] Health check timed out - ShareT may still be starting
)
echo  [OK] ShareT is ready

:: ── STEP 3: Start ngrok ────────────────────────────────────────
if %SKIP_NGROK% equ 1 (
    echo  [3/3] Skipping ngrok (--local flag or ngrok not installed)
) else (
    echo  [3/3] Starting ngrok tunnel...
    start "ngrok - ShareT" ngrok http --domain=%NGROK_DOMAIN% %PORT%
    timeout /t 2 /nobreak >nul
)

:: ── Open browser ──────────────────────────────────────────────
start http://localhost:%PORT%

:: ── Result ────────────────────────────────────────────────────
cls
echo.
echo  ============================================================
echo    ShareT is LIVE
echo  ============================================================
echo.
echo    Local:   http://localhost:%PORT%
if %SKIP_NGROK% equ 0 (
    echo    Public:  https://%NGROK_DOMAIN%
    echo.
    echo    Share the PUBLIC link with clients.
) else (
    echo.
    echo    Running in LOCAL mode only (no public URL).
    echo    Run WITHOUT --local flag to enable public access.
)
echo.
echo  ============================================================
echo  To stop ShareT:  docker-compose down
echo  ============================================================
echo.
pause
