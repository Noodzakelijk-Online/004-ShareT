# PM2 Windows Service Setup Script
# This script configures PM2 to run as a Windows service that starts on boot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PM2 Windows Service Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "   Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green
Write-Host ""

# Check if PM2 is installed
Write-Host "Checking PM2 installation..." -ForegroundColor Yellow
try {
    $pm2Version = pm2 --version
    Write-Host "✅ PM2 version $pm2Version installed" -ForegroundColor Green
} catch {
    Write-Host "❌ PM2 not found!" -ForegroundColor Red
    Write-Host "Installing PM2..." -ForegroundColor Yellow
    npm install -g pm2
    Write-Host "✅ PM2 installed" -ForegroundColor Green
}

Write-Host ""

# Check if pm2-windows-startup is installed
Write-Host "Checking pm2-windows-startup..." -ForegroundColor Yellow
try {
    npm list -g pm2-windows-startup | Out-Null
    Write-Host "✅ pm2-windows-startup is installed" -ForegroundColor Green
} catch {
    Write-Host "Installing pm2-windows-startup..." -ForegroundColor Yellow
    npm install -g pm2-windows-startup
    Write-Host "✅ pm2-windows-startup installed" -ForegroundColor Green
}

Write-Host ""

# Install PM2 startup
Write-Host "Configuring PM2 to start on Windows boot..." -ForegroundColor Yellow
try {
    pm2-startup install
    Write-Host "✅ PM2 startup configured" -ForegroundColor Green
} catch {
    Write-Host "⚠️  PM2 startup configuration had issues" -ForegroundColor Yellow
    Write-Host "   Continuing anyway..." -ForegroundColor Gray
}

Write-Host ""

# Start ShareT with PM2
Write-Host "Starting ShareT with PM2..." -ForegroundColor Yellow
$currentDir = Get-Location
Set-Location -Path $PSScriptRoot\..

try {
    # Stop existing instance if running
    pm2 delete sharet -s 2>$null
    
    # Start new instance
    pm2 start ecosystem.config.js
    Write-Host "✅ ShareT started with PM2" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to start ShareT" -ForegroundColor Red
    Write-Host "   Check logs with: pm2 logs" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Save PM2 process list
Write-Host "Saving PM2 process list..." -ForegroundColor Yellow
try {
    pm2 save
    Write-Host "✅ PM2 process list saved" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not save PM2 process list" -ForegroundColor Yellow
}

Write-Host ""

# Show PM2 status
Write-Host "Current PM2 status:" -ForegroundColor Yellow
pm2 list

Write-Host ""

# Test health endpoint
Write-Host "Testing server health..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 5
    $health = $response.Content | ConvertFrom-Json
    
    if ($health.status -eq "healthy") {
        Write-Host "✅ Server is healthy and responding" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Server is running but not fully healthy" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not reach health endpoint yet" -ForegroundColor Yellow
    Write-Host "   Server may still be starting up" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ShareT is now running as a PM2 process and will:" -ForegroundColor Yellow
Write-Host "  ✅ Start automatically on Windows boot" -ForegroundColor Green
Write-Host "  ✅ Restart automatically if it crashes" -ForegroundColor Green
Write-Host "  ✅ Keep logs in the logs/ directory" -ForegroundColor Green
Write-Host ""
Write-Host "Useful PM2 commands:" -ForegroundColor Yellow
Write-Host "  View logs:     pm2 logs sharet" -ForegroundColor White
Write-Host "  Monitor:       pm2 monit" -ForegroundColor White
Write-Host "  Restart:       pm2 restart sharet" -ForegroundColor White
Write-Host "  Stop:          pm2 stop sharet" -ForegroundColor White
Write-Host "  Status:        pm2 status" -ForegroundColor White
Write-Host "  Delete:        pm2 delete sharet" -ForegroundColor White
Write-Host ""
Write-Host "Access your application at:" -ForegroundColor Yellow
Write-Host "  Local:  http://localhost:5000" -ForegroundColor White
Write-Host "  Public: https://your-tunnel-name.trycloudflare.com" -ForegroundColor White
Write-Host ""

Set-Location -Path $currentDir
