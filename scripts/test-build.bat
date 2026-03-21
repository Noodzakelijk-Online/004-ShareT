@echo off
REM ShareT Build Test Script for Windows
REM This script tests the build process

echo.
echo =========================================
echo   ShareT Build Test Script
echo =========================================
echo.

REM Check Node.js
echo Checking Node.js...
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Node.js not found!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo.

REM Check npm
where npm >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: npm not found!
    pause
    exit /b 1
)
npm --version
echo.

echo Checking project structure...
if not exist "ShareT-main\src" (
    echo ERROR: Frontend source not found!
    pause
    exit /b 1
)

if not exist "backend\server.js" (
    echo ERROR: Backend server.js not found!
    pause
    exit /b 1
)
echo Project structure OK
echo.

echo Installing dependencies...
echo This may take a few minutes...
echo.

echo [1/3] Installing root dependencies...
call npm install
if %errorLevel% neq 0 (
    echo ERROR: Failed to install root dependencies
    pause
    exit /b 1
)

echo [2/3] Installing backend dependencies...
cd backend
call npm install
if %errorLevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..

echo [3/3] Installing frontend dependencies...
cd ShareT-main
call npm install
if %errorLevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

echo Dependencies installed successfully!
echo.

echo Building frontend...
cd ShareT-main
call npm run build
if %errorLevel% neq 0 (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)
cd ..
echo Frontend built successfully!
echo.

echo Checking build output...
if not exist "ShareT-main\dist\index.html" (
    echo ERROR: Build output not found!
    pause
    exit /b 1
)
echo Build output OK
echo.

echo Copying build to backend...
node scripts\copy-frontend-build.js
if %errorLevel% neq 0 (
    echo ERROR: Failed to copy build!
    pause
    exit /b 1
)
echo.

echo Verifying copy...
if not exist "backend\frontend\dist\index.html" (
    echo ERROR: Copy verification failed!
    pause
    exit /b 1
)
echo Copy verified!
echo.

echo =========================================
echo   Build Test Complete!
echo =========================================
echo.
echo Summary:
echo   - Dependencies installed
echo   - Frontend built
echo   - Build copied to backend
echo.
echo File structure:
echo   ShareT-main\dist\          - Original build
echo   backend\frontend\dist\     - Served by backend
echo.
echo Next steps:
echo   1. Configure backend\.env
echo   2. Start server: npm start
echo   3. Or use PM2: pm2 start ecosystem.config.js
echo.
pause
