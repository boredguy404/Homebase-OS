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

# The emulator runtime is intentionally not stored in Git.  Install it locally
# once, alongside the user's own ROMs and saves.
$loader = Join-Path $target "emulatorjs\data\loader.js"
if (-not (Test-Path $loader)) {
    $sevenZip = (Get-Command 7z -ErrorAction SilentlyContinue).Source
    if (-not $sevenZip -and (Test-Path "$env:ProgramFiles\7-Zip\7z.exe")) { $sevenZip = "$env:ProgramFiles\7-Zip\7z.exe" }
    if (-not $sevenZip -and (Get-Command winget -ErrorAction SilentlyContinue)) {
        Write-Host "Installing the free 7-Zip helper needed for EmulatorJS..." -ForegroundColor Cyan
        winget install --id 7zip.7zip --exact --silent --accept-package-agreements --accept-source-agreements
        $sevenZip = (Get-Command 7z -ErrorAction SilentlyContinue).Source
        if (-not $sevenZip -and (Test-Path "$env:ProgramFiles\7-Zip\7z.exe")) { $sevenZip = "$env:ProgramFiles\7-Zip\7z.exe" }
    }
    if (-not $sevenZip) {
        throw "EmulatorJS needs the free 7-Zip helper. Install 7-Zip from https://www.7-zip.org/, then run this same Homebase install command again."
    }
    $runtimeArchive = Join-Path $env:TEMP "EmulatorJS-4.2.3.7z"
    $runtimeFolder = Join-Path $env:TEMP "EmulatorJS-4.2.3"
    if (Test-Path $runtimeFolder) { Remove-Item $runtimeFolder -Recurse -Force }
    Write-Host "Downloading the local EmulatorJS runtime (one-time, about 290 MB)..." -ForegroundColor Cyan
    Invoke-WebRequest "https://github.com/EmulatorJS/EmulatorJS/releases/download/v4.2.3/4.2.3.7z" -OutFile $runtimeArchive
    & $sevenZip x $runtimeArchive "-o$runtimeFolder" -y | Out-Null
    $data = Get-ChildItem $runtimeFolder -Directory -Recurse | Where-Object { $_.Name -eq "data" -and (Test-Path (Join-Path $_.FullName "loader.js")) } | Select-Object -First 1
    if (-not $data) { throw "EmulatorJS unpacked but its data folder was not found." }
    Copy-Item $data.FullName (Join-Path $target "emulatorjs") -Recurse -Force
    Remove-Item $runtimeArchive -Force -ErrorAction SilentlyContinue
    Remove-Item $runtimeFolder -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "Starting Homebase OS..." -ForegroundColor Green
& (Join-Path $target "launch-homebase.ps1")
