@echo off
:: ShareT One-Click Installer
:: Run this first to set up ShareT

title ShareT Installer

echo.
echo  ============================================================
echo  ^|           ShareT One-Click Installer                     ^|
echo  ============================================================
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed!
    echo.
    echo  Please install Node.js first:
    echo  1. Go to https://nodejs.org
    echo  2. Download the LTS version
    echo  3. Run the installer
    echo  4. Run this script again
    echo.
    pause
    exit /b 1
)

for /f "tokens=1" %%v in ('node -v') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% detected

:: Navigate to script directory
cd /d "%~dp0"

echo.
echo  Installing ShareT...
echo  This will take 2-3 minutes.
echo.

:: Install backend
echo  [1/4] Installing backend dependencies...
cd backend
call npm install --silent 2>nul
if %errorlevel% neq 0 (
    call npm install
)
cd ..

:: Install frontend
echo  [2/4] Installing frontend dependencies...
cd ShareT-main
call npm install --silent 2>nul
if %errorlevel% neq 0 (
    call npm install
)

:: Build
echo  [3/4] Building frontend...
call npm run build
cd ..

:: Copy
echo  [4/4] Finalizing installation...
call node scripts/copy-frontend-build.js

echo.
echo  ============================================================
echo  ^|           Installation Complete!                         ^|
echo  ============================================================
echo.
echo  To start ShareT:
echo    1. Double-click "start-sharet.bat"
echo    2. Choose option 1 (Quick Start)
echo    3. Open http://localhost:5000 in your browser
echo.
echo  Before first use, configure your settings:
echo    1. Open "backend\.env" in a text editor
echo    2. Add your Trello API credentials
echo    3. Set a secure JWT_SECRET
echo.
pause
