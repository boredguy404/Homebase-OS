# Homebase on Windows

Homebase has a useful Windows mode, but it is not identical to the original Chromebook build.

## What works

- The Homebase PWA interface in Edge or Chrome
- Pocket Archive and the local EmulatorJS runtime
- User-provided ROMs and the game detail/gallery interface
- Xbox controllers through the browser Gamepad API
- Orbit internet radio and local audio playlists
- Browser-save export/import
- My Library browsing, previews, folders, and imports inside your Windows user folder
- Themes, visuals, system information, and selective Homebase backups

## Linux-only features

Flatpak app installation, Crostini app discovery, Linux desktop launchers, mGBA link-cable helpers, and native Linux games need Linux. Their tiles may be hidden or unavailable on Windows.

## Quick setup

1. Install [Python 3 for Windows](https://www.python.org/downloads/windows/) and enable **Add Python to PATH**.
2. Download or clone this repository.
3. Right-click `launch-homebase.ps1` and choose **Run with PowerShell**.
4. If Windows blocks the local script, open PowerShell in this folder and run:

```powershell
powershell -ExecutionPolicy Bypass -File .\launch-homebase.ps1
```

Homebase opens at `http://127.0.0.1:8765/`. In Edge or Chrome, use **Install Homebase** / **Install this site as an app** to remove the URL bar.

## Add your own games

Place legally obtained files in `roms\`, or use Pocket Archive’s local file picker. ROMs, BIOS files, saves, and private media are ignored by Git and are never included in the public repository.
