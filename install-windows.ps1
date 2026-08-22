$ErrorActionPreference = "Stop"
$target = Join-Path $env:USERPROFILE "Homebase-OS"
$archive = Join-Path $env:TEMP "Homebase-OS-main.zip"
$expanded = Join-Path $env:TEMP "Homebase-OS-install"

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Python 3 is required. Install it from python.org, check 'Add Python to PATH', then run this line again." -ForegroundColor Yellow
    Start-Process "https://www.python.org/downloads/windows/"
    return
}

Write-Host "Downloading Homebase OS..." -ForegroundColor Cyan
Invoke-WebRequest "https://github.com/boredguy404/Homebase-OS/archive/refs/heads/main.zip" -OutFile $archive
if (Test-Path $expanded) { Remove-Item $expanded -Recurse -Force }
Expand-Archive $archive -DestinationPath $expanded -Force
if (Test-Path $target) {
    Write-Host "Updating the existing Homebase OS folder..." -ForegroundColor Cyan
    Copy-Item (Join-Path $expanded "Homebase-OS-main\*") $target -Recurse -Force
} else {
    Move-Item (Join-Path $expanded "Homebase-OS-main") $target
}
New-Item (Join-Path $target "roms") -ItemType Directory -Force | Out-Null
New-Item (Join-Path $target "saves") -ItemType Directory -Force | Out-Null
New-Item (Join-Path $target "covers") -ItemType Directory -Force | Out-Null
New-Item (Join-Path $env:USERPROFILE "My Library") -ItemType Directory -Force | Out-Null
Write-Host "Starting Homebase OS..." -ForegroundColor Green
& (Join-Path $target "launch-homebase.ps1")
