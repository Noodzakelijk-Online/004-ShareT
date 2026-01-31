# ShareT Windows Setup Script
# Run this script as Administrator

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ShareT Windows 11 Setup" -ForegroundColor Cyan
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

# Check Node.js installation
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    Write-Host "   Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check npm installation
try {
    $npmVersion = npm --version
    Write-Host "✅ npm $npmVersion installed" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check MongoDB installation
Write-Host "Checking MongoDB installation..." -ForegroundColor Yellow
$mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
if ($mongoService) {
    Write-Host "✅ MongoDB service found" -ForegroundColor Green
    if ($mongoService.Status -eq "Running") {
        Write-Host "✅ MongoDB is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️  MongoDB is not running, starting..." -ForegroundColor Yellow
        Start-Service -Name "MongoDB"
        Write-Host "✅ MongoDB started" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  MongoDB service not found" -ForegroundColor Yellow
    Write-Host "   Will attempt to install MongoDB..." -ForegroundColor Yellow
    
    # Check if Chocolatey is installed
    try {
        choco --version | Out-Null
        Write-Host "✅ Chocolatey found, installing MongoDB..." -ForegroundColor Green
        choco install mongodb -y
        Write-Host "✅ MongoDB installed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Please install MongoDB manually:" -ForegroundColor Red
        Write-Host "   Option 1: Install Chocolatey, then run: choco install mongodb" -ForegroundColor Yellow
        Write-Host "   Option 2: Download from: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
        Write-Host ""
        $continue = Read-Host "Continue without MongoDB? (y/n)"
        if ($continue -ne "y") {
            exit 1
        }
    }
}

Write-Host ""

# Install PM2 globally
Write-Host "Installing PM2 globally..." -ForegroundColor Yellow
try {
    npm install -g pm2
    npm install -g pm2-windows-startup
    Write-Host "✅ PM2 installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install PM2" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install project dependencies
Write-Host "Installing project dependencies..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray
try {
    npm run install:all
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Build frontend
Write-Host "Building frontend..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "✅ Frontend built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to build frontend" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Configure PM2 startup
Write-Host "Configuring PM2 to start on Windows boot..." -ForegroundColor Yellow
try {
    pm2-startup install
    Write-Host "✅ PM2 startup configured" -ForegroundColor Green
} catch {
    Write-Host "⚠️  PM2 startup configuration failed" -ForegroundColor Yellow
    Write-Host "   You may need to run: pm2-startup install" -ForegroundColor Gray
}

Write-Host ""

# Create logs directory
Write-Host "Creating logs directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path ".\logs" | Out-Null
Write-Host "✅ Logs directory created" -ForegroundColor Green

Write-Host ""

# Configure Windows Firewall
Write-Host "Configuring Windows Firewall..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "ShareT Backend" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
    Write-Host "✅ Firewall rule added for port 5000" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not add firewall rule automatically" -ForegroundColor Yellow
    Write-Host "   You may need to allow port 5000 manually" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Configure .env files (backend\.env)" -ForegroundColor White
Write-Host "2. Start the server: npm run pm2:start" -ForegroundColor White
Write-Host "3. Save PM2 config: npm run pm2:save" -ForegroundColor White
Write-Host "4. Check status: npm run pm2:monit" -ForegroundColor White
Write-Host ""
Write-Host "The server will automatically start on Windows boot!" -ForegroundColor Green
Write-Host ""
