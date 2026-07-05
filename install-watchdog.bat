@echo off
:: ============================================================
::  ShareT - Install Watchdog
::  Registers a Windows Scheduled Task that keeps Docker + ShareT
::  running automatically. Runs as the current user (Docker Desktop
::  lives in the user session), every 2 minutes and at each logon.
::  No admin rights required.
:: ============================================================
cd /d "%~dp0"
title ShareT - Install Watchdog
color 0A

set "VBS=%~dp0watchdog-hidden.vbs"

echo.
echo  Installing the ShareT watchdog...
echo  It will silently check every 2 minutes (and at logon) that
echo  Docker Desktop and ShareT are running, and restart them if not.
echo.

set "ERR=0"
:: Repeating check every 2 minutes (also covers post-reboot within 2 min)
schtasks /Create /TN "ShareT Watchdog" /TR "wscript.exe \"%VBS%\"" /SC MINUTE /MO 2 /RL LIMITED /F || set "ERR=1"
:: Instant start right after the user logs in
schtasks /Create /TN "ShareT Watchdog (logon)" /TR "wscript.exe \"%VBS%\"" /SC ONLOGON /RL LIMITED /F || set "ERR=1"

echo.
if "%ERR%"=="1" (
    echo  [!] Something went wrong registering the task. See messages above.
) else (
    echo  [OK] Watchdog installed.
    echo       It is now running in the background and survives reboots.
    echo       Activity is logged to: watchdog.log
    echo       To remove it later, run: uninstall-watchdog.bat
)
echo.
pause
