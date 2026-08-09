@echo off
:: ============================================================
::  ShareT - Ngrok Startup Script
::  Runs ngrok on port 5005 with your static domain
::  Run this file from the ShareT repository root.
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

ngrok http 5005 --url=https://%NGROK_DOMAIN%
