@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title ShareT - One-Click Setup
color 0A

:: ── SETTINGS (edit if needed) ─────────────────────────────────
set PORT=5005
set "DOCKER_EXE=C:\Program Files\Docker\Docker\Docker Desktop.exe"
:: ──────────────────────────────────────────────────────────────

:: Windows / Notepad sometimes saves ".env.docker" as ".env.docker.txt".
:: Fix the name automatically so docker-compose finds the real file.
if not exist ".env.docker" if exist ".env.docker.txt" (
    echo  [..] Found .env.docker.txt - renaming to .env.docker
    ren ".env.docker.txt" ".env.docker"
)

:: Read PUBLIC_URL from .env.docker (for the final summary)
set "PUBLIC_URL="
if exist .env.docker (
    for /f "tokens=1,* delims==" %%A in ('findstr /B "PUBLIC_URL=" .env.docker') do set "PUBLIC_URL=%%B"
)

cls
echo.
echo  ============================================================
echo    ShareT  --  One-Click Setup
echo  ============================================================
echo.

:: ════════════════════════════════════════════════
:: STEP 1  CHECK + START DOCKER
:: ════════════════════════════════════════════════
echo  [1/4] Checking Docker...

where docker >nul 2>&1
if !errorlevel! neq 0 (
    echo.
    echo  [!] Docker is not installed.
    echo      Opening download page...
    start "" https://www.docker.com/products/docker-desktop
    echo      Install Docker Desktop, then run this again.
    echo.
    pause
    exit /b
)
echo  [OK] Docker CLI found.

docker info >nul 2>&1
if !errorlevel! equ 0 goto docker_ok

echo  [..] Docker not running. Starting Docker Desktop...
if exist "%DOCKER_EXE%" (
    start "" "%DOCKER_EXE%"
) else (
    start "" "%LOCALAPPDATA%\Docker\Docker Desktop.exe"
)
echo  [..] Waiting up to 150s for Docker to start...
set _t=0

:waitdocker
timeout /t 3 /nobreak >nul
set /a _t+=3
docker info >nul 2>&1
if !errorlevel! equ 0 goto docker_ok
if !_t! lss 150 goto waitdocker

echo.
echo  [!] Docker did not start in time.
echo      Open Docker Desktop manually, wait for it to load, then run this again.
echo.
pause
exit /b

:docker_ok
echo  [OK] Docker is running.

:: ════════════════════════════════════════════════
:: STEP 2  ENSURE NGROK AUTH TOKEN (ngrok now runs INSIDE Docker)
:: ════════════════════════════════════════════════
echo.
echo  [2/4] Checking ngrok auth token...

set "NGROK_AUTHTOKEN="
if exist .env.docker (
    for /f "tokens=1,* delims==" %%A in ('findstr /B "NGROK_AUTHTOKEN=" .env.docker') do set "NGROK_AUTHTOKEN=%%B"
)

if defined NGROK_AUTHTOKEN (
    echo  [OK] ngrok auth token found in .env.docker.
    goto token_done
)

echo.
echo  [!] No ngrok auth token set in .env.docker.
echo      ngrok runs inside Docker now and needs your authtoken.
echo.
echo      1. Go to: https://dashboard.ngrok.com/get-started/your-authtoken
echo      2. Copy your authtoken
echo.
set "TOK="
set /p TOK="Paste your ngrok authtoken here (or press Enter to skip): "
if not defined TOK (
    echo  [!] Skipped. The public URL will NOT work until you set NGROK_AUTHTOKEN
    echo      in .env.docker. Local access on this PC will still work.
    goto token_done
)
:: Append (env_file uses the last value, so this overrides the empty one safely)
>>.env.docker echo NGROK_AUTHTOKEN=!TOK!
echo  [OK] Saved ngrok auth token to .env.docker.

:token_done

:: Pass only Compose's two tunnel settings through the current process. The
:: application consumes .env.docker in raw mode so credentials stay literal.
set "NGROK_AUTHTOKEN="
set "NGROK_DOMAIN="
if exist .env.docker (
    for /f "tokens=1,* delims==" %%A in ('findstr /B "NGROK_AUTHTOKEN= NGROK_DOMAIN=" .env.docker') do set "%%A=%%B"
)

:: ════════════════════════════════════════════════
:: STEP 3  BUILD + START THE WHOLE STACK (app + ngrok + autoheal)
:: ════════════════════════════════════════════════
echo.
echo  [3/4] Building and starting ShareT...
echo        (first build: ~2 min  /  restart: ~20 sec)
echo.

:: Kill any stray host ngrok so it doesn't fight the container's session
:: (free ngrok allows only one agent session at a time).
taskkill /F /IM ngrok.exe /T >nul 2>&1

docker compose up -d --build
if !errorlevel! neq 0 (
    echo.
    echo  [!] Docker build failed. See errors above.
    echo.
    pause
    exit /b
)

echo.
echo  [..] Waiting for ShareT to be ready...
set _h=0

:waithealth
timeout /t 3 /nobreak >nul
set /a _h+=3
curl -sf http://127.0.0.1:%PORT%/ready >nul 2>&1
if !errorlevel! equ 0 goto health_ok
if !_h! lss 120 goto waithealth
echo  [WARN] Health check timed out - ShareT may still be starting.

:health_ok
echo  [OK] ShareT is running.

:: ════════════════════════════════════════════════
:: STEP 4  VERIFY TUNNEL + AUTO-HEAL WATCHDOG
:: ════════════════════════════════════════════════
echo.
echo  [4/4] Checking tunnel + watchdog...

:: ngrok is a container now - confirm it is up (no separate window needed)
docker ps --filter "name=sharet-ngrok" --filter "status=running" --format "{{.Names}}" | findstr "sharet-ngrok" >nul 2>&1
if !errorlevel! equ 0 (
    echo  [OK] ngrok tunnel container is running.
) else (
    echo  [WARN] ngrok container not running. If the public URL is down,
    echo         check NGROK_AUTHTOKEN in .env.docker, then run this again.
)

:: Offer to install the background watchdog if it isn't installed yet
schtasks /Query /TN "ShareT Watchdog" >nul 2>&1
if !errorlevel! equ 0 (
    echo  [OK] Background watchdog already installed.
) else (
    echo.
    echo  [?] Install the background watchdog? It keeps Docker + ShareT
    echo      running automatically (checks every 2 min, survives reboots,
    echo      no error popups).
    set "WD="
    set /p WD="Install watchdog now? (Y/N): "
    if /i "!WD!"=="Y" call "%~dp0install-watchdog.bat"
)

:: Open browser
start "" http://localhost:%PORT%

:: ════════════════════════════════════════════════
:: DONE
:: ════════════════════════════════════════════════
cls
echo.
echo  ============================================================
echo    ShareT is RUNNING
echo  ============================================================
echo.
echo    Local:   http://localhost:%PORT%
if defined PUBLIC_URL (
    echo    Public:  !PUBLIC_URL!
    echo             Served by the ngrok container - it restarts automatically.
) else (
    echo    Public:  Set PUBLIC_URL + NGROK_AUTHTOKEN in .env.docker
)
echo.
echo  ============================================================
echo    Everything runs under Docker with auto-restart.
echo    To STOP:     docker compose down
echo    To RESTART:  run this file again
echo    Watchdog log: watchdog.log
echo  ============================================================
echo.
pause
