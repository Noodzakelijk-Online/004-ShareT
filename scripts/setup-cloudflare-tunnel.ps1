# Cloudflare Tunnel Setup Script for Windows
# Run this script as Administrator

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Cloudflare Tunnel Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    exit 1
}

Write-Host "This script will help you set up Cloudflare Tunnel for ShareT" -ForegroundColor Yellow
Write-Host ""

# Check if cloudflared is installed
Write-Host "Checking for cloudflared..." -ForegroundColor Yellow
try {
    $cloudflaredVersion = cloudflared --version
    Write-Host "✅ cloudflared is installed: $cloudflaredVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ cloudflared not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing cloudflared..." -ForegroundColor Yellow
    
    # Download cloudflared
    $downloadUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
    $installPath = "C:\Program Files\cloudflared"
    $exePath = "$installPath\cloudflared.exe"
    
    # Create directory
    if (-not (Test-Path $installPath)) {
        New-Item -ItemType Directory -Force -Path $installPath | Out-Null
    }
    
    # Download
    Write-Host "Downloading cloudflared..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $downloadUrl -OutFile $exePath
    
    # Add to PATH
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    if ($currentPath -notlike "*$installPath*") {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$installPath", "Machine")
        $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine")
    }
    
    Write-Host "✅ cloudflared installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Manual Setup Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Login to Cloudflare" -ForegroundColor Yellow
Write-Host "Run this command to authenticate:" -ForegroundColor White
Write-Host "  cloudflared tunnel login" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will open your browser. Login to Cloudflare and authorize the tunnel." -ForegroundColor Gray
Write-Host ""

$continue = Read-Host "Have you completed Step 1? (y/n)"
if ($continue -ne "y") {
    Write-Host "Please run: cloudflared tunnel login" -ForegroundColor Yellow
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Step 2: Create a Named Tunnel" -ForegroundColor Yellow
Write-Host "Run this command to create a persistent tunnel:" -ForegroundColor White
Write-Host "  cloudflared tunnel create sharet-tunnel" -ForegroundColor Cyan
Write-Host ""
Write-Host "This creates a tunnel that persists across restarts." -ForegroundColor Gray
Write-Host ""

$continue = Read-Host "Have you completed Step 2? (y/n)"
if ($continue -ne "y") {
    Write-Host "Please run: cloudflared tunnel create sharet-tunnel" -ForegroundColor Yellow
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Step 3: Get your Tunnel ID" -ForegroundColor Yellow
Write-Host "Run this command to list your tunnels:" -ForegroundColor White
Write-Host "  cloudflared tunnel list" -ForegroundColor Cyan
Write-Host ""

$tunnelId = Read-Host "Enter your Tunnel ID (from the list above)"
if (-not $tunnelId) {
    Write-Host "❌ Tunnel ID is required" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 4: Configure DNS" -ForegroundColor Yellow
Write-Host "Choose your domain setup:" -ForegroundColor White
Write-Host "  1. Use a custom domain (e.g., sharet.yourdomain.com)" -ForegroundColor White
Write-Host "  2. Use Cloudflare's free subdomain (e.g., sharet-tunnel.trycloudflare.com)" -ForegroundColor White
Write-Host ""

$dnsChoice = Read-Host "Enter your choice (1 or 2)"

if ($dnsChoice -eq "1") {
    $hostname = Read-Host "Enter your full domain (e.g., sharet.yourdomain.com)"
    Write-Host ""
    Write-Host "Run this command to configure DNS:" -ForegroundColor White
    Write-Host "  cloudflared tunnel route dns $tunnelId $hostname" -ForegroundColor Cyan
    Write-Host ""
    $continue = Read-Host "Have you run the DNS command? (y/n)"
} else {
    $hostname = "$tunnelId.trycloudflare.com"
    Write-Host "Your tunnel URL will be: https://$hostname" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 5: Update Configuration File" -ForegroundColor Yellow

# Update config file
$configPath = ".\cloudflare\config.yml"
if (Test-Path $configPath) {
    $config = Get-Content $configPath -Raw
    $config = $config -replace "tunnel: sharet-tunnel", "tunnel: $tunnelId"
    $config = $config -replace "your-tunnel-name.trycloudflare.com", $hostname
    Set-Content -Path $configPath -Value $config
    Write-Host "✅ Configuration file updated" -ForegroundColor Green
} else {
    Write-Host "⚠️  Configuration file not found at: $configPath" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 6: Install Tunnel as Windows Service" -ForegroundColor Yellow
Write-Host "Run this command to install the tunnel as a service:" -ForegroundColor White
Write-Host "  cloudflared service install" -ForegroundColor Cyan
Write-Host ""

$continue = Read-Host "Install tunnel as Windows service now? (y/n)"
if ($continue -eq "y") {
    try {
        cloudflared service install
        Write-Host "✅ Tunnel installed as Windows service" -ForegroundColor Green
        
        # Start the service
        Write-Host "Starting tunnel service..." -ForegroundColor Yellow
        Start-Service -Name "cloudflared"
        Write-Host "✅ Tunnel service started" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not install service automatically" -ForegroundColor Yellow
        Write-Host "   Run manually: cloudflared service install" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your ShareT application is now accessible at:" -ForegroundColor Yellow
Write-Host "  https://$hostname" -ForegroundColor White
Write-Host ""
Write-Host "The tunnel will:" -ForegroundColor Yellow
Write-Host "  ✅ Start automatically on Windows boot" -ForegroundColor Green
Write-Host "  ✅ Reconnect automatically if connection drops" -ForegroundColor Green
Write-Host "  ✅ Use the same URL forever (never changes)" -ForegroundColor Green
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  Start:   Start-Service cloudflared" -ForegroundColor White
Write-Host "  Stop:    Stop-Service cloudflared" -ForegroundColor White
Write-Host "  Status:  Get-Service cloudflared" -ForegroundColor White
Write-Host "  Logs:    cloudflared tunnel info $tunnelId" -ForegroundColor White
Write-Host ""
