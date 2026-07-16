$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js 18 or newer is required.'
}
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    throw 'npm is required.'
}

Write-Host 'Installing frontend dependencies...'
& npm.cmd ci
Write-Host 'Installing backend dependencies...'
Push-Location backend
try { & npm.cmd ci } finally { Pop-Location }

Write-Host 'Building ShareT...'
& npm.cmd run build
& node scripts/copy-frontend-build.js

if (-not (Test-Path -LiteralPath 'backend/.env')) {
    Copy-Item -LiteralPath 'backend/.env.example' -Destination 'backend/.env'
    Write-Host 'Created backend/.env from backend/.env.example.'
}

New-Item -ItemType Directory -Force -Path 'logs' | Out-Null
Write-Host 'Setup complete. Configure backend/.env, then run start-sharet.bat.'
