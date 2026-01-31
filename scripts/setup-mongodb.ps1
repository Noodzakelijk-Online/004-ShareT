# MongoDB Setup Script for Windows
# Run this script as Administrator

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MongoDB Setup for ShareT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    exit 1
}

# Check if MongoDB is already installed
$mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
if ($mongoService) {
    Write-Host "✅ MongoDB is already installed" -ForegroundColor Green
    Write-Host ""
    Write-Host "Service Status: $($mongoService.Status)" -ForegroundColor Yellow
    
    if ($mongoService.Status -ne "Running") {
        Write-Host "Starting MongoDB..." -ForegroundColor Yellow
        Start-Service -Name "MongoDB"
        Write-Host "✅ MongoDB started" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "MongoDB connection string:" -ForegroundColor Yellow
    Write-Host "mongodb://localhost:27017/sharet" -ForegroundColor White
    Write-Host ""
    exit 0
}

Write-Host "MongoDB not found. Installing..." -ForegroundColor Yellow
Write-Host ""

# Check if Chocolatey is installed
try {
    $chocoVersion = choco --version
    Write-Host "✅ Chocolatey $chocoVersion found" -ForegroundColor Green
} catch {
    Write-Host "Installing Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    Write-Host "✅ Chocolatey installed" -ForegroundColor Green
}

Write-Host ""

# Install MongoDB using Chocolatey
Write-Host "Installing MongoDB Community Edition..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray
Write-Host ""

try {
    choco install mongodb -y
    Write-Host "✅ MongoDB installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install MongoDB via Chocolatey" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install MongoDB manually:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://www.mongodb.com/try/download/community" -ForegroundColor White
    Write-Host "2. Run the installer" -ForegroundColor White
    Write-Host "3. Choose 'Complete' installation" -ForegroundColor White
    Write-Host "4. Install MongoDB as a Windows Service" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""

# Create MongoDB data directory
Write-Host "Creating MongoDB data directory..." -ForegroundColor Yellow
$dataPath = "C:\data\db"
if (-not (Test-Path $dataPath)) {
    New-Item -ItemType Directory -Force -Path $dataPath | Out-Null
    Write-Host "✅ Data directory created: $dataPath" -ForegroundColor Green
} else {
    Write-Host "✅ Data directory exists: $dataPath" -ForegroundColor Green
}

Write-Host ""

# Start MongoDB service
Write-Host "Starting MongoDB service..." -ForegroundColor Yellow
try {
    Start-Service -Name "MongoDB"
    Write-Host "✅ MongoDB service started" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not start MongoDB service automatically" -ForegroundColor Yellow
    Write-Host "   Please start it manually from Services" -ForegroundColor Gray
}

Write-Host ""

# Set MongoDB to start automatically
Write-Host "Configuring MongoDB to start on boot..." -ForegroundColor Yellow
try {
    Set-Service -Name "MongoDB" -StartupType Automatic
    Write-Host "✅ MongoDB will start automatically on boot" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not set automatic startup" -ForegroundColor Yellow
}

Write-Host ""

# Test MongoDB connection
Write-Host "Testing MongoDB connection..." -ForegroundColor Yellow
try {
    $mongoTest = mongosh --eval "db.version()" --quiet
    Write-Host "✅ MongoDB is accessible" -ForegroundColor Green
    Write-Host "   Version: $mongoTest" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  Could not test MongoDB connection" -ForegroundColor Yellow
    Write-Host "   MongoDB may still be starting up" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MongoDB Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Connection String:" -ForegroundColor Yellow
Write-Host "mongodb://localhost:27017/sharet" -ForegroundColor White
Write-Host ""
Write-Host "Add this to your backend\.env file:" -ForegroundColor Yellow
Write-Host "MONGODB_URI=mongodb://localhost:27017/sharet" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  Start:   Start-Service MongoDB" -ForegroundColor White
Write-Host "  Stop:    Stop-Service MongoDB" -ForegroundColor White
Write-Host "  Status:  Get-Service MongoDB" -ForegroundColor White
Write-Host "  Connect: mongosh" -ForegroundColor White
Write-Host ""
