# NovaShell cPanel deployment

NovaShell’s hosted build is a static PWA. Upload only public files: never upload `roms/`, `covers/`, `saves/`, `imports/`, `local/`, `My Library/`, or API keys.

## Fast path

1. In cPanel, create `novashell.app` (or its subdomain) and point its document root to an empty folder such as `public_html/novashell`.
2. Download the public release ZIP or clone the public repository on your computer.
3. Remove local/private folders listed above, then upload the remaining project files through **File Manager → Upload**.
4. Confirm `index.html`, `manifest.webmanifest`, `sw.js`, and `assets/` are directly inside the document root.
5. Open `https://your-domain/`, use the browser’s **Install app** option, and test the mobile navigation bar.

## cPanel checks

- Enable a free Let’s Encrypt/AutoSSL certificate; PWA installation needs HTTPS.
- If cPanel offers it, turn on gzip/Brotli compression and browser caching for immutable `assets/` files.
- Do not use a server rewrite that converts missing JavaScript/CSS files into `index.html`; it breaks the PWA cache.
- After an update, hard-refresh once or use NovaShell’s update prompt so the new service-worker cache activates.

## What remains local

Hosted NovaShell keeps browser-only features such as notes, playlists, visualizers, discovery, and the UI shell. Native Linux launches, full file scanning, emulator ROM access, local app install/uninstall, local backups, and Relay core editing require the local Python server and remain intentionally unavailable on a public host.

## Optional agentic deploy credentials

For a future automated deploy, provide only one scoped path:

- **SFTP** host, port, username, private key, and the exact document root; or
- **cPanel API token** limited to File Manager for that one document root.

Never put these values in the repository. Store them in an ignored local deployment file or a CI secret. Test uploads first against a staging subdomain.
