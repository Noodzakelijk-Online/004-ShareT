@echo off
:: Removes the ShareT watchdog scheduled tasks.
cd /d "%~dp0"
title ShareT - Uninstall Watchdog

echo.
echo  Removing the ShareT watchdog tasks...
schtasks /Delete /TN "ShareT Watchdog" /F
schtasks /Delete /TN "ShareT Watchdog (logon)" /F
echo.
echo  Done. ShareT and Docker will no longer be auto-restarted.
echo.
pause
