# NovaShell deployment playbook

This is the private handoff for publishing the browser-safe NovaShell build. Keep
this file in the future private deployment repository; do not copy credentials
into the public app repository.

## Begin an agentic deployment safely

Create this **local-only** request file first. `local/` is already ignored by
Git, so it never becomes public:

```bash
mkdir -p local
cp deploy-request.example.json local/deploy-request.json
```

Fill in only non-secret facts: domain, cPanel account name, preferred deploy
shape, Node version, and the remote release folder. Do **not** put passwords,
API tokens, private keys, FTP credentials, or an OpenAI key in this file.

Then run the GitHub login on the Chromebook/PC:

```bash
gh auth login -h github.com
```

Tell Codex: **“NovaShell cPanel deploy request saved; run preflight only.”**
Preflight is read-only: it validates the local build, checks the request shape,
creates a deployment checklist, and shows every credential name and remote
command it would use. It does not create a repository, upload files, change DNS,
or restart anything.

After you inspect that report, say **“approve NovaShell deploy scaffold.”**
Only then may Codex create the private repository, GitHub workflow, cPanel
deployment files, and a dry-run release. A separate explicit approval is
required before the first real upload or process restart.

## cPanel deployment (the intended hosted route)

### Option A — static NovaShell web companion

Use cPanel's **Git Version Control** to clone the private deployment repository
to a non-public release folder such as:

```text
/home/CPANEL_USER/novashell/releases/current
```

Then point the domain document root at its `dist/` folder using cPanel Domains.
This is the simplest and safest cPanel path: no always-running Node process is
needed. Build the static release in GitHub Actions and upload only `dist/` by
SFTP or rsync-over-SSH.

The static edition should keep as much of the local experience as browsers
allow:

- installable PWA, fullscreen, touch targets, controller navigation, themes,
  retro boot sequence, and offline shell;
- Pocket Archive using files the visitor explicitly picks or drops, with
  EmulatorJS running in the browser and saves in that browser's IndexedDB;
- ROM artwork/details supplied by the visitor, plus the non-download discovery
  browser, controller sheets, game performance notes, and local galleries;
- Orbit streams, local MP3/playlist import, visualizers, mini player, notes,
  kanban, calculator, weather, Browse feeds, API catalogue, and settings;
- a browser library backed by IndexedDB/OPFS and, where supported, the File
  System Access API—never a silent scan of a visitor's computer;
- Relay's local guidance, navigation, and optional server-mediated AI mode.

The web build must label these deliberate browser substitutions:

| Local companion capability | Web-safe NovaShell equivalent |
| --- | --- |
| Scan home folders / My Library | User selects a folder or imports files; browser remembers granted handles where supported |
| Installed Linux apps | Curated web/Linux catalogue with install commands and official links; no false installed-state claim |
| Launch Linux apps / terminal | Open a documented external link or copy a command; no remote shell execution |
| Native backup ZIP | Browser export/import for IndexedDB/OPFS data and selected files |
| Local Relay file edits | Sandboxed app drafts and user-downloadable files; core site changes remain a deploy action |
| Local system KPIs | Browser/device capability readout, clearly distinguished from operating-system telemetry |

This gives the hosted app real day-to-day utility while keeping its security
model honest. The local companion remains the only edition that can manage its
own host machine.

### Option B — Node-backed NovaShell companion

Use this only for features that truly need a server-side API proxy or account
data. In cPanel **Setup Node.js App**:

1. Create an application using the Node version in `local/deploy-request.json`.
2. Set the application root to `/home/CPANEL_USER/novashell/current`.
3. Set the startup file to `server.js` (provided by the private deploy repo).
4. Set `NODE_ENV=production`; add public, non-secret app configuration only.
5. Do not expose ROM folders, local library paths, local helper endpoints, or
   a raw model API key through the hosted app.

The deployment workflow uploads a staged release, atomically updates the
`current` symlink, then invokes the cPanel Passenger restart touch-file:

```bash
mkdir -p tmp && touch tmp/restart.txt
```

It verifies `https://novashell.app/health` before marking the release live. If
the health check fails, it restores the previous `current` link and restarts it.

## cPanel credential entry

Create a separate cPanel deployment user if the host allows it. It should have
access only to the NovaShell release directory—never the whole account and
never root/sudo. Prefer an SSH deploy key; use SFTP if SSH is unavailable.

Add secrets in the **private GitHub repository** at Settings → Secrets and
variables → Actions. Do not paste them into Relay, the cPanel terminal history,
or any project file:

```text
CPANEL_HOST            # hostname, no protocol
CPANEL_USER            # restricted cPanel/SFTP deploy user
CPANEL_SSH_KEY         # private deploy key; preferred
CPANEL_SSH_PORT        # usually 22
CPANEL_RELEASE_PATH    # /home/CPANEL_USER/novashell/releases
CPANEL_APP_PATH        # /home/CPANEL_USER/novashell/current (Node only)
CPANEL_KNOWN_HOSTS     # SSH host fingerprint(s), required for strict SSH
```

If the provider only offers SFTP, use `CPANEL_SFTP_PASSWORD` instead of the
key and restrict its folder to the release path. If it only offers FTP, use
FTPS—not plain FTP—and store `CPANEL_FTPS_PASSWORD`; the workflow must refuse
unencrypted FTP by default.

## Choose a deployment shape

### Static site (recommended for novashell.app)

Use this when the hosted edition is a PWA and discovery dashboard. It can use
browser APIs, public feeds, and locally selected files, but it cannot inspect a
visitor's Linux apps, launch native programs, or host private ROMs.

1. Connect the repository to Cloudflare Pages, Netlify, or GitHub Pages.
2. Set the build command to the deployment script supplied with the web build.
3. Set the publish directory to `dist/`.
4. Add `novashell.app` in that provider's domain settings.
5. Enable automatic deploys from `main` and preview deploys from pull requests.

No server credential is needed for this path. The host creates an OAuth/app
connection to GitHub and deploys when `main` changes.

### Generic Node server with SSH/SFTP

Use this only when NovaShell needs server-side proxying, account data, or a
private API. The private repository will include a `deploy/` folder with an
explicit restart script and a GitHub Actions workflow.

Create these GitHub repository secrets (Settings → Secrets and variables →
Actions):

```text
DEPLOY_HOST       # example: app.example.com
DEPLOY_USER       # restricted deployment user, not root
DEPLOY_SSH_KEY    # private SSH key for that user
DEPLOY_PORT       # normally 22
DEPLOY_PATH       # example: /srv/novashell
```

For a password-only host, use an SFTP/FTP provider's GitHub Action and store
its credentials only as `FTP_SERVER`, `FTP_USERNAME`, and `FTP_PASSWORD`
secrets. Prefer SSH keys whenever possible. Never put any of these values in
`.env.example`, screenshots, a commit, or a Relay prompt.

The workflow should do this in order:

1. install the locked Node version;
2. run `npm ci`, lint, tests, and `npm run build`;
3. upload only the built release and deployment files;
4. run the remote `deploy/restart.sh` over SSH;
5. request `/health` and fail the deployment if it does not answer.

The remote service should be a least-privilege `systemd` service or a PM2 app.
It must not run as root. A rollback should retain the previous `releases/`
folder and repoint a `current` symlink if the health check fails.

## Local credential entry for Codex-assisted setup

When ready to let Codex set up the private repository, put only non-secret
hosting details in `local/deploy-request.json` (this location is ignored):

```json
{
  "mode": "cpanel-static | cpanel-node | static | node-ssh | ftps",
  "host": "novashell.app",
  "provider": "cPanel | Cloudflare Pages | Netlify | VPS | other",
  "repository": "boredguy404/novashell-deploy",
  "node_version": "22"
}
```

Then authenticate GitHub CLI on the local machine with:

```bash
gh auth login -h github.com
```

For static hosting, connect the provider account in its own dashboard. For a
cPanel/SSH/SFTP host, add the secrets directly in the GitHub repository UI only
after Codex creates the workflow. Tell Codex **"deploy request saved; run
preflight only"**. Codex can then scaffold the chosen safe deployment route and
show the exact secret names before any deploy occurs.

## What the hosted build deliberately does not do

- upload bundled commercial ROMs, BIOS files, saves, music, or private artwork;
- expose a device's local files or installed Linux apps to the internet;
- store API keys in browser source, repository files, or public configuration;
- silently execute shell commands on a visitor's machine.

The local NovaShell edition remains the full Chromebook/PC companion. The
hosted edition is a safe, installable web companion with clear capability
labels.
