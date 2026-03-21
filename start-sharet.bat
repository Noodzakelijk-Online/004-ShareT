@echo off
setlocal enabledelayedexpansion

:: ShareT Windows Startup Script
:: Easy-to-use menu for running ShareT on Windows 11

title ShareT - Trello Card Sharing Tool

:header
cls
echo.
echo  ============================================================
echo  ^|                                                          ^|
echo  ^|   ____  _                    _____                       ^|
echo  ^|  / ___^|^| ^|__   __ _ _ __ ___^|_   _^|                      ^|
echo  ^|  \___ \^| '_ \ / _` ^| '__/ _ \ ^| ^|                        ^|
echo  ^|   ___) ^| ^| ^| ^| (_^| ^| ^| ^|  __/ ^| ^|                        ^|
echo  ^|  ^|____/^|_^| ^|_^|\__,_^|_^|  \___^| ^|_^|                        ^|
echo  ^|                                                          ^|
echo  ^|          Trello Card Sharing Made Easy                   ^|
echo  ^|                                                          ^|
echo  ============================================================
echo.

:: Check for Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js 18+ from https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Navigate to script directory
cd /d "%~dp0"

:menu
echo.
echo  What would you like to do?
echo  ----------------------------------------------------------
echo.
echo  [1] Start ShareT (Quick Start)
echo  [2] Full Setup (Install + Build + Start)
echo  [3] Install Dependencies
echo  [4] Build Frontend
echo  [5] Start in Development Mode
echo  [6] Start in Cluster Mode (Multi-core)
echo  [7] Check Server Health
echo  [8] Open in Browser
echo  [9] Exit
echo.
set /p choice="  Enter your choice (1-9): "

if "%choice%"=="1" goto quickstart
if "%choice%"=="2" goto fullsetup
if "%choice%"=="3" goto install
if "%choice%"=="4" goto build
if "%choice%"=="5" goto dev
if "%choice%"=="6" goto cluster
if "%choice%"=="7" goto health
if "%choice%"=="8" goto browser
if "%choice%"=="9" goto end
goto header

:quickstart
cls
echo.
echo  Starting ShareT...
echo  ----------------------------------------------------------
echo.
echo  Server will be available at:
echo    Local:  http://localhost:5000
echo    Health: http://localhost:5000/health
echo.
echo  Press Ctrl+C to stop the server
echo.
cd backend
if exist ".env" (
    node server.js
) else (
    echo [WARNING] .env file not found. Using defaults.
    node server.js
)
cd ..
pause
goto header

:fullsetup
cls
echo.
echo  Full Setup Starting...
echo  ----------------------------------------------------------
echo.

:: Install backend
echo  [1/4] Installing backend dependencies...
cd backend
call npm install --silent
if %errorlevel% neq 0 (
    echo  [ERROR] Backend installation failed!
    cd ..
    pause
    goto header
)
echo  [OK] Backend dependencies installed
cd ..

:: Install frontend
echo  [2/4] Installing frontend dependencies...
cd ShareT-main
call npm install --silent
if %errorlevel% neq 0 (
    echo  [ERROR] Frontend installation failed!
    cd ..
    pause
    goto header
)
echo  [OK] Frontend dependencies installed

:: Build frontend
echo  [3/4] Building frontend (this may take a minute)...
call npm run build
if %errorlevel% neq 0 (
    echo  [ERROR] Frontend build failed!
    cd ..
    pause
    goto header
)
echo  [OK] Frontend built successfully
cd ..

:: Copy build
echo  [4/4] Copying frontend to backend...
call node scripts/copy-frontend-build.js
echo  [OK] Frontend copied to backend

echo.
echo  ============================================================
echo  ^|                   Setup Complete!                        ^|
echo  ============================================================
echo.
echo  ShareT is ready. Press any key to start the server...
pause >nul
goto quickstart

:install
cls
echo.
echo  Installing dependencies...
echo  ----------------------------------------------------------
echo.
cd backend
echo  Installing backend...
call npm install
cd ..\ShareT-main
echo  Installing frontend...
call npm install
cd ..
echo.
echo  [OK] All dependencies installed!
pause
goto header

:build
cls
echo.
echo  Building frontend...
echo  ----------------------------------------------------------
echo.
cd ShareT-main
call npm run build
cd ..
call node scripts/copy-frontend-build.js
echo.
echo  [OK] Frontend built and copied!
pause
goto header

:dev
cls
echo.
echo  Starting in development mode...
echo  ----------------------------------------------------------
echo.
echo  Backend: http://localhost:5000
echo  Frontend: http://localhost:5173 (if running separately)
echo.
cd backend
call npm run dev
cd ..
pause
goto header

:cluster
cls
echo.
echo  Starting in cluster mode (using all CPU cores)...
echo  ----------------------------------------------------------
echo.
cd backend
node cluster.js
cd ..
pause
goto header

:health
cls
echo.
echo  Checking server health...
echo  ----------------------------------------------------------
echo.
curl -s http://localhost:5000/health 2>nul
if %errorlevel% neq 0 (
    echo  [ERROR] Server is not responding.
    echo  Make sure the server is running (option 1).
) else (
    echo.
)
echo.
pause
goto header

:browser
start http://localhost:5000
goto header

:end
cls
echo.
echo  Thank you for using ShareT!
echo.
echo  For support, visit: https://github.com/Noodzakelijk-Online/004-ShareT
echo.
timeout /t 2 >nul
exit /b 0
