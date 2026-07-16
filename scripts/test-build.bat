@echo off
setlocal
cd /d "%~dp0\.."

where node >nul 2>&1 || (echo Node.js is required. & exit /b 1)
where npm >nul 2>&1 || (echo npm is required. & exit /b 1)
if not exist "src\App.jsx" (echo Frontend source is missing. & exit /b 1)
if not exist "backend\server.js" (echo Backend source is missing. & exit /b 1)

call npm ci || exit /b 1
pushd backend
call npm ci || (popd & exit /b 1)
call npm test || (popd & exit /b 1)
popd
call npm run build || exit /b 1
node scripts\copy-frontend-build.js || exit /b 1

if not exist "dist\index.html" (echo Root build verification failed. & exit /b 1)
if not exist "backend\frontend\dist\index.html" (echo Backend build verification failed. & exit /b 1)
echo ShareT build and backend tests passed.
