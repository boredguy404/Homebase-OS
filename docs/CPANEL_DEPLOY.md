# NovaShell cPanel deployment

NovaShell’s hosted build is a static PWA. Upload only public files: never upload `roms/`, `covers/`, `saves/`, `imports/`, `local/`, `My Library/`, or API keys.

## Fast path

1. In cPanel, create `novashell.app` (or its subdomain) and point its document root to an empty folder such as `public_html/novashell`.
2. In the private hosted-companion source, run `npm ci && npm test`.
3. Upload only the generated `dist/` contents through **File Manager → Upload** or the approved restricted release script.
4. Confirm `index.html`, `manifest.webmanifest`, `sw.js`, `app.js`, `app.css`, and `icon.svg` are directly inside the document root.
5. Open `https://your-domain/`, use the browser’s **Install app** option, and test the mobile navigation bar.

## cPanel checks

- Enable a free Let’s Encrypt/AutoSSL certificate; PWA installation needs HTTPS.
- If cPanel offers it, turn on gzip/Brotli compression and browser caching for immutable `assets/` files.
- Do not use a server rewrite that converts missing JavaScript/CSS files into `index.html`; it breaks the PWA cache.
- After an update, hard-refresh once or use NovaShell’s update prompt so the new service-worker cache activates.

## What remains local

Hosted NovaShell keeps browser-only features such as explicit IndexedDB game selection, local audio, streams, visualizers, notes, Kanban, live/cached weather, discovery, Relay guidance, and portable browser-data backup. Native Linux launches, automatic ROM/filesystem scans, a bundled emulator runtime, local app install/uninstall, operating-system readings, native backups, and Relay core editing require the local Python server and remain intentionally unavailable on a public host.

## Optional agentic deploy credentials

For a future automated deploy, provide only one scoped path:

- **SFTP** host, port, username, private key, and the exact document root; or
- **cPanel API token** limited to File Manager for that one document root.

Never put these values in the repository. Store them in an ignored local deployment file or a CI secret. Test uploads first against a staging subdomain.
