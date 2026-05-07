@echo off
:: ============================================================
::  ShareT - Ngrok Startup Script
::  Runs ngrok on port 5005 with your static domain
::  Place this file in: C:\...\004-ShareT-main\
:: ============================================================

:: Change to this script's folder
cd /d "%~dp0"

:: ── EDIT THIS LINE: replace with your ngrok static domain ──
set NGROK_DOMAIN=YOUR-STATIC-DOMAIN.ngrok-free.app
:: ────────────────────────────────────────────────────────────

echo.
echo  Starting ngrok tunnel...
echo  Domain : https://%NGROK_DOMAIN%
echo  Port   : 5005
echo.

ngrok http --domain=%NGROK_DOMAIN% 5005
