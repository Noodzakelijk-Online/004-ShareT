@echo off
setlocal
title ShareT Installer
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js 18 or newer is required.
  echo Install the current LTS release from https://nodejs.org and try again.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm was not found in PATH.
  pause
  exit /b 1
)

echo [1/4] Installing frontend dependencies...
call npm ci
if errorlevel 1 goto failed

echo [2/4] Installing backend dependencies...
pushd backend
call npm ci
if errorlevel 1 (
  popd
  goto failed
)
popd

echo [3/4] Building the frontend...
call npm run build
if errorlevel 1 goto failed

echo [4/4] Copying the production build...
node scripts\copy-frontend-build.js
if errorlevel 1 goto failed

if not exist "backend\.env" (
  copy "backend\.env.example" "backend\.env" >nul
  echo Created backend\.env from the example file.
)

echo.
echo ShareT is installed. Configure backend\.env, then run start-sharet.bat.
pause
exit /b 0

:failed
echo.
echo [ERROR] ShareT installation failed. Review the output above.
pause
exit /b 1
