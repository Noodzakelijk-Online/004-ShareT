# ============================================================
#  ShareT - Register Ngrok as a Windows Startup Task
#
#  HOW TO USE:
#  1. Edit start-ngrok.bat first — set your NGROK_DOMAIN
#  2. Open PowerShell as Administrator
#  3. Run:  .\setup-ngrok-task.ps1
# ============================================================

# Full path to this project folder (edit if different)
$ProjectFolder = Split-Path -Parent $MyInvocation.MyCommand.Path
$BatchFile     = Join-Path $ProjectFolder "start-ngrok.bat"

if (-not (Test-Path $BatchFile)) {
    Write-Error "start-ngrok.bat not found at: $BatchFile"
    exit 1
}

$TaskName    = "ShareT-Ngrok"
$Description = "Starts ngrok tunnel for ShareT on port 5005 at Windows startup"

# Action: run the batch file in the project folder
$Action = New-ScheduledTaskAction `
    -Execute    "cmd.exe" `
    -Argument   "/c `"$BatchFile`"" `
    -WorkingDirectory $ProjectFolder

# Trigger: run at logon of any user
$Trigger = New-ScheduledTaskTrigger -AtLogon

# Settings: no time limit, restart on failure, run if missed
$Settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit          (New-TimeSpan -Seconds 0) `
    -RestartCount                3 `
    -RestartInterval             (New-TimeSpan -Minutes 1) `
    -StartWhenAvailable          $true `
    -RunOnlyIfNetworkAvailable   $false

# Principal: run as current user, elevated (so ngrok can bind)
$Principal = New-ScheduledTaskPrincipal `
    -UserId    $env:USERNAME `
    -LogonType Interactive `
    -RunLevel  Highest

# Register (or overwrite if already exists)
Register-ScheduledTask `
    -TaskName   $TaskName `
    -Description $Description `
    -Action     $Action `
    -Trigger    $Trigger `
    -Settings   $Settings `
    -Principal  $Principal `
    -Force

Write-Host ""
Write-Host "  Task '$TaskName' registered successfully!" -ForegroundColor Green
Write-Host "  Batch file : $BatchFile"
Write-Host "  Working dir: $ProjectFolder"
Write-Host ""
Write-Host "  Ngrok will start automatically on next login." -ForegroundColor Cyan
Write-Host "  To test now, run: start-ngrok.bat"
Write-Host ""
