@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title ShareT - One-Click Setup
color 0A

:: ── SETTINGS (edit if needed) ─────────────────────────────────
set PORT=5005
set "DOCKER_EXE=C:\Program Files\Docker\Docker\Docker Desktop.exe"
set "NGROK_INSTALL_DIR=%USERPROFILE%\AppData\Local\ngrok"
:: ──────────────────────────────────────────────────────────────

:: Read PUBLIC_URL from .env.docker for ngrok domain
set "PUBLIC_URL="
if exist .env.docker (
    for /f "tokens=1,2 delims==" %%A in ('type .env.docker ^| findstr /B "PUBLIC_URL="') do (
        set "PUBLIC_URL=%%B"
    )
)
:: Extract domain from PUBLIC_URL (remove https:// / http://)
set "NGROK_DOMAIN="
if defined PUBLIC_URL (
    set "NGROK_DOMAIN=!PUBLIC_URL:https://=!"
    set "NGROK_DOMAIN=!NGROK_DOMAIN:http://=!"
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
    echo      Install Docker Desktop, restart your PC, then run this again.
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
echo  [..] Waiting up to 90s for Docker to start...
set _t=0

:waitdocker
timeout /t 3 /nobreak >nul
set /a _t+=3
docker info >nul 2>&1
if !errorlevel! equ 0 goto docker_ok
if !_t! lss 90 goto waitdocker

echo.
echo  [!] Docker did not start in time.
echo      Please open Docker Desktop manually, wait for it to load,
echo      then run this file again.
echo.
pause
exit /b

:docker_ok
echo  [OK] Docker is running.

:: ════════════════════════════════════════════════
:: STEP 2  FIND OR AUTO-INSTALL NGROK
:: ════════════════════════════════════════════════
echo.
echo  [2/4] Checking ngrok...

set "NGROK_EXE="

:: PATH
where ngrok >nul 2>&1
if !errorlevel! equ 0 (
    for /f "delims=" %%X in ('where ngrok') do set "NGROK_EXE=%%X"
    goto ngrok_ok
)

:: Common locations
if exist "%NGROK_INSTALL_DIR%\ngrok.exe"  ( set "NGROK_EXE=%NGROK_INSTALL_DIR%\ngrok.exe"  & goto ngrok_ok )
if exist "%USERPROFILE%\ngrok.exe"        ( set "NGROK_EXE=%USERPROFILE%\ngrok.exe"        & goto ngrok_ok )
if exist "C:\ngrok\ngrok.exe"             ( set "NGROK_EXE=C:\ngrok\ngrok.exe"             & goto ngrok_ok )
if exist "C:\tools\ngrok\ngrok.exe"       ( set "NGROK_EXE=C:\tools\ngrok\ngrok.exe"       & goto ngrok_ok )
if exist "%ProgramFiles%\ngrok\ngrok.exe" ( set "NGROK_EXE=%ProgramFiles%\ngrok\ngrok.exe" & goto ngrok_ok )
if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe" (
    set "NGROK_EXE=%LOCALAPPDATA%\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe"
    goto ngrok_ok
)

:: Not found — auto download
echo  [..] ngrok not found. Downloading automatically...
mkdir "%NGROK_INSTALL_DIR%" 2>nul
powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip' -OutFile '%TEMP%\ngrok.zip' -UseBasicParsing"
if !errorlevel! neq 0 (
    echo  [!] Download failed. Check your internet connection.
    echo      Manual install: https://ngrok.com/download
    goto ngrok_done
)
powershell -NoProfile -Command "Expand-Archive -Path '%TEMP%\ngrok.zip' -DestinationPath '%NGROK_INSTALL_DIR%' -Force"
set "NGROK_EXE=%NGROK_INSTALL_DIR%\ngrok.exe"
if not exist "!NGROK_EXE!" (
    echo  [!] Extract failed. Install manually: https://ngrok.com/download
    set "NGROK_EXE="
    goto ngrok_done
)
echo  [OK] ngrok downloaded to %NGROK_INSTALL_DIR%

:ngrok_ok
echo  [OK] ngrok ready.

:ngrok_done

:: ════════════════════════════════════════════════
:: STEP 2b  CHECK NGROK AUTH TOKEN
:: ════════════════════════════════════════════════
echo.
echo  [2b/4] Checking ngrok auth token...

if not defined NGROK_EXE goto token_skip

:: Check if config file exists and has authtoken
set "NGROK_CONFIG=%NGROK_INSTALL_DIR%\ngrok.yml"
if exist "%NGROK_CONFIG%" (
    findstr /C:"authtoken" "%NGROK_CONFIG%" >nul 2>&1
    if !errorlevel! equ 0 (
        echo  [OK] ngrok auth token found.
        goto token_ok
    )
)

:: No token found - prompt user
echo.
echo  [!] ngrok auth token not found.
echo      You need your authtoken from your ngrok subscription.
echo.
echo      1. Go to: https://dashboard.ngrok.com/get-started/your-authtoken
echo      2. Copy your authtoken (starts with something like: 2abc...)
echo.
set "NGROK_TOKEN="
set /p NGROK_TOKEN="Paste your ngrok authtoken here: "
if not defined NGROK_TOKEN (
    echo  [!] No token entered. ngrok will run in free mode (random URL).
    goto token_skip
)

:: Add the token to ngrok config
echo  [..] Adding authtoken to ngrok config...
"!NGROK_EXE!" config add-authtoken !NGROK_TOKEN!
if !errorlevel! neq 0 (
    echo  [!] Failed to add authtoken. Token may be invalid.
    echo      ngrok will run in free mode (random URL).
    goto token_skip
)
echo  [OK] ngrok auth token saved.

:token_ok
:token_skip

:: ════════════════════════════════════════════════
:: STEP 3  BUILD + START SHARETT
:: ════════════════════════════════════════════════
echo.
echo  [3/4] Building and starting ShareT...
echo        (first build: ~2 min  /  restart: ~20 sec)
echo.

taskkill /F /IM ngrok.exe /T >nul 2>&1

docker-compose down >nul 2>&1
docker-compose up -d --build
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
curl -sf http://localhost:%PORT%/health >nul 2>&1
if !errorlevel! equ 0 goto health_ok
if !_h! lss 60 goto waithealth
echo  [WARN] Health check timed out - ShareT may still be starting.

:health_ok
echo  [OK] ShareT is running.

:: ════════════════════════════════════════════════
:: STEP 4  START NGROK
:: ════════════════════════════════════════════════
echo.
echo  [4/4] Starting ngrok...
if defined NGROK_EXE (
    if defined NGROK_DOMAIN (
        echo  [..] Using domain from .env.docker: !NGROK_DOMAIN!
        start "ngrok - ShareT" cmd /k """!NGROK_EXE!"" http --domain=!NGROK_DOMAIN! %PORT%"
    ) else (
        echo  [..] Using random ngrok URL (free mode)
        echo      Set PUBLIC_URL in .env.docker to use your fixed domain
        start "ngrok - ShareT" cmd /k """!NGROK_EXE!"" http %PORT%"
    )
    timeout /t 3 /nobreak >nul
    echo  [OK] ngrok window opened.
) else (
    echo  [SKIP] ngrok unavailable - ShareT running locally only.
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
echo.
if defined NGROK_EXE (
    if defined NGROK_DOMAIN (
        echo    Public:  https://!NGROK_DOMAIN!
        echo             This is the URL from your .env.docker PUBLIC_URL setting.
        echo             Share this URL with clients - it never changes.
    ) else (
        echo    Public:  Check the [ngrok - ShareT] window for your URL
        echo             It looks like: https://xxxx-xx-xx.ngrok-free.app
        echo             Set PUBLIC_URL in .env.docker to use your fixed domain.
    )
) else (
    echo    Public:  ngrok not available - local only
    echo             Install ngrok: https://ngrok.com/download
)
echo.
echo  ============================================================
echo    To STOP ShareT:   docker-compose down
echo    To RESTART:       run this file again
echo  ============================================================
echo.
pause
