# Homebase product readiness

Homebase is a local-first Chromebook dashboard and game/media shell.

## Distribution boundary

The application code can be packaged, but commercial ROMs, game artwork, owned WAD files, and other copyrighted content require separate redistribution rights. A distributable build should ship without those files and provide an import flow for customer-owned content.

## Security model

- Privileged launch/install/uninstall routes accept same-origin browser actions only.
- Uninstall is limited to detected Flatpak applications and requires two confirmations.
- The service is designed for a trusted local network, not direct internet exposure.

## Multiplayer

mGBA creates linked player windows from multiple ROM arguments. Each physical controller must be assigned once from its corresponding player window under Settings → Controllers; mGBA then remembers the profiles.

## Release checklist

- Replace HTTP with a trusted local HTTPS origin before public distribution.
- Remove licensed game content from the distributable package.
- Add automated browser tests across ChromeOS stable releases.
- Code-sign packaged launchers and publish a privacy/support policy.
