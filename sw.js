const CACHE='homebase-v85';
const SHELL=[
  '/', '/index.html', '/manifest.webmanifest', '/assets/icons/homebase-icon.svg',
  '/pages/arcade.html', '/pages/discover.html', '/pages/files.html', '/pages/apps.html',
  '/pages/settings.html', '/pages/github-setup.html', '/pages/readme-studio.html',
  '/pages/browse.html', '/pages/game-setup.html', '/pages/game-manager.html', '/pages/console.html', '/version.json', '/assets/styles/discovery/browse.css', '/assets/scripts/discovery/browse.js',
  '/assets/styles/homebase/visual-deck.css', '/assets/styles/homebase/shell.css',
  '/assets/styles/homebase/tiles.css', '/assets/styles/homebase/clock.css',
  '/assets/styles/homebase/gestures.css', '/assets/styles/homebase/indicators.css',
  '/assets/styles/homebase/system-insights.css', '/assets/styles/homebase/scroll-motion.css',
  '/assets/styles/homebase/themes.css', '/assets/styles/homebase/mini-player.css',
  '/assets/styles/homebase/tile-layout.css', '/assets/styles/homebase/glass.css',
  '/assets/styles/homebase/header-actions.css', '/assets/styles/homebase/orbit-performance.css',
  '/assets/styles/arcade/archive.css', '/assets/styles/arcade/emulator-performance.css',
  '/assets/styles/arcade/game-details.css', '/assets/styles/arcade/multiplayer.css',
  '/assets/styles/arcade/performance.css', '/assets/styles/discovery/discover.css',
  '/assets/styles/discovery/discover-gallery.css', '/assets/styles/discovery/discover-offline-art.css', '/assets/styles/files/files.css',
  '/assets/styles/files/dialog.css', '/assets/styles/apps/catalog.css',
  '/assets/styles/apps/apps-install-modal.css', '/assets/styles/settings/settings.css', '/assets/styles/settings/settings-desktop-theme-sync.css', '/assets/styles/settings/settings-device-center.css',
  '/assets/styles/settings/settings-dialog.css', '/assets/styles/shared/modal-global.css',
  '/assets/styles/shared/ultra-retro.css', '/assets/styles/shared/back-button-spacing.css', '/assets/styles/homebase/fake-virus-lab.css', '/assets/styles/apps/apps-icon-alignment.css', '/assets/scripts/homebase/deck.js', '/assets/scripts/shared/about-novashell.js',
  '/assets/scripts/homebase/deck-gestures.js', '/assets/scripts/homebase/gyro3d.js', '/assets/scripts/homebase/console.js', '/assets/scripts/homebase/relay-brain-panel.js', '/assets/scripts/homebase/relay-brain-browser.js', '/assets/scripts/homebase/relay-workshop-components.js', '/assets/scripts/homebase/relay-provider-config.js', '/assets/scripts/homebase/relay-workspace.js', '/assets/scripts/homebase/utility-project-board.js', '/assets/scripts/homebase/update-check.js', '/assets/styles/homebase/console.css', '/assets/styles/homebase/relay-brain-deck.css', '/assets/styles/homebase/relay-brain-browser.css', '/assets/styles/homebase/relay-contrast-guard.css', '/assets/styles/homebase/relay-provider-config.css', '/assets/styles/homebase/relay-codex-runner.css',
  '/assets/scripts/homebase/clock.js', '/assets/scripts/homebase/system-insights.js', '/assets/scripts/homebase/utility-workspace-manifest.js', '/assets/scripts/homebase/utility-live-snapshot.js',
  '/assets/scripts/homebase/scroll-motion.js', '/assets/scripts/arcade/game-controls.js',
  '/assets/scripts/arcade/game-capture.js', '/assets/scripts/arcade/game-details.js',
  '/assets/scripts/arcade/library-extras.js', '/assets/scripts/arcade/performance.js',
  '/assets/scripts/arcade/multiplayer.js', '/assets/scripts/arcade/browser-saves.js',
  '/assets/scripts/discovery/discover.js', '/assets/scripts/discovery/discover-resilience.js', '/assets/scripts/homebase/fake-virus-lab.js', '/assets/scripts/files/files.js',
  '/assets/scripts/apps/apps-enhance.js', '/assets/scripts/apps/apps-install-modal.js',
  '/assets/scripts/apps/install-jobs.js',
  '/assets/scripts/settings/settings.js', '/assets/scripts/settings/settings-restore.js', '/assets/scripts/settings/settings-device-center.js',
  '/assets/scripts/settings/settings-options.js', '/assets/scripts/shared/theme-sync.js',
  '/assets/scripts/shared/github-status.js'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request))) });
