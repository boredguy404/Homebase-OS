const status = document.querySelector('#status');
let theme = localStorage.getItem('nightglass-theme') || 'ultra-retro';
let visual = localStorage.getItem('nightglass-visual') || '0';
let wallpaper = localStorage.getItem('homebase-retro-wallpaper') || 'classic';

const visualNames = ['Topographic Flow', 'Radar', 'Particle Tunnel'];
const visualChoices = document.querySelector('[data-visual-choice]')?.parentElement;

if (visualChoices && !document.querySelector('#visual-preview')) {
  visualChoices.insertAdjacentHTML('afterend', `
    <div id="visual-preview" data-visual="${visual}" aria-live="polite">
      <canvas aria-hidden="true"></canvas>
      <b></b><span></span>
    </div>`);
}

const preview = document.querySelector('#visual-preview');
const previewCanvas = preview?.querySelector('canvas');
const previewContext = previewCanvas?.getContext('2d');
let previewFrame = 0;

function tellDesktop(message) {
  if (parent && parent !== window) parent.postMessage(message, '*');
}

function drawPreview(time = 0) {
  if (!previewContext || !previewCanvas || theme === 'ultra-retro') return;
  const bounds = previewCanvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(bounds.width * ratio));
  const height = Math.max(1, Math.round(bounds.height * ratio));
  if (previewCanvas.width !== width || previewCanvas.height !== height) {
    previewCanvas.width = width;
    previewCanvas.height = height;
  }
  const ctx = previewContext;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const w = bounds.width, h = bounds.height, t = time / 1000;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#071116';
  ctx.fillRect(0, 0, w, h);

  if (visual === '0') {
    for (let line = 0; line < 15; line += 1) {
      const y = h * .2 + line * (h / 17);
      ctx.beginPath();
      for (let x = -8; x <= w + 8; x += 7) {
        const wave = Math.sin(x / 42 + t * 1.3 + line * .55) * (5 + line * .13)
          + Math.sin(x / 18 - t * .75) * 2;
        x === -8 ? ctx.moveTo(x, y + wave) : ctx.lineTo(x, y + wave);
      }
      ctx.strokeStyle = `hsla(${175 + line * 2}, 72%, ${42 + line * 1.6}%, .72)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  } else if (visual === '1') {
    const cx = w * .5, cy = h * .53, radius = Math.min(w, h) * .43;
    ctx.strokeStyle = '#55caff'; ctx.lineWidth = 1;
    for (let ring = 1; ring <= 5; ring += 1) {
      ctx.globalAlpha = .26 + ring * .08;
      ctx.beginPath(); ctx.arc(cx, cy, radius * ring / 5, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = .5;
    for (let arm = 0; arm < 8; arm += 1) {
      const angle = arm * Math.PI / 4;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius); ctx.stroke();
    }
    const sweep = t * 1.8;
    const beam = ctx.createConicalGradient?.(sweep - .7, cx, cy);
    if (beam) { beam.addColorStop(0, '#55caff00'); beam.addColorStop(1, '#55caff55'); ctx.fillStyle = beam; }
    else ctx.fillStyle = '#55caff22';
    ctx.globalAlpha = 1; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, radius, sweep - .75, sweep); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#b6efff'; ctx.beginPath(); ctx.arc(cx + Math.cos(sweep) * radius * .73, cy + Math.sin(sweep) * radius * .73, 2, 0, Math.PI * 2); ctx.fill();
  } else {
    const cx = w / 2, cy = h / 2;
    for (let ring = 13; ring > 0; ring -= 1) {
      const phase = (ring / 13 + (t * .38 % 1)) % 1;
      const radius = 7 + phase * Math.min(w, h) * .7;
      ctx.globalAlpha = .12 + (1 - phase) * .65;
      ctx.strokeStyle = `hsl(${195 + ring * 7}, 85%, 69%)`;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(cx, cy, radius, radius * .48, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  previewFrame = requestAnimationFrame(drawPreview);
}

function syncVisualPreview() {
  if (!preview) return;
  const retro = theme === 'ultra-retro';
  if (visualChoices) visualChoices.hidden = retro;
  document.querySelector('.retro-wallpapers').hidden = !retro;
  preview.dataset.visual = visual;
  preview.dataset.retro = String(retro);
  preview.querySelector('b').textContent = retro ? `ULTRA RETRO · ${wallpaper.toUpperCase()} DESKTOP` : `DESKTOP VISUAL · ${visualNames[Number(visual)]}`;
  preview.querySelector('span').textContent = retro
    ? 'Ultra Retro uses the selected desktop wallpaper and pixel motion. Modern visual programs are not applied here.'
    : 'This is the same live visual program used behind the Homebase desktop.';
  document.querySelectorAll('[data-visual-choice]').forEach(button => {
    button.disabled = retro;
    button.classList.toggle('active', !retro && button.dataset.visualChoice === visual);
    button.setAttribute('aria-disabled', String(retro));
  });
  cancelAnimationFrame(previewFrame);
  if (!retro) previewFrame = requestAnimationFrame(drawPreview);
}

document.documentElement.dataset.theme = theme;
document.documentElement.dataset.retroWallpaper = wallpaper;

document.querySelectorAll('[data-theme-choice]').forEach(button => {
  button.classList.toggle('active', button.dataset.themeChoice === theme);
  button.onclick = () => {
    const id = button.dataset.themeChoice;
    const previous = theme;
    theme = id;
    localStorage.setItem('nightglass-theme', id);
    if (previous === 'ultra-retro' && id === 'cobalt') {
      visual = '1';
      localStorage.setItem('nightglass-visual', visual);
    }
    document.documentElement.dataset.theme = id;
    document.querySelectorAll('[data-theme-choice]').forEach(item => item.classList.toggle('active', item === button));
    syncVisualPreview();
    tellDesktop({ type: 'homebase-theme-choice', id });
    if (previous === 'ultra-retro' && id === 'cobalt') tellDesktop({ type: 'homebase-visual-choice', index: 1 });
    status.textContent = previous === 'ultra-retro' && id === 'cobalt'
      ? 'Cobalt + Radar applied everywhere.'
      : id === 'ultra-retro' ? 'Ultra Retro desktop wallpaper preview applied.' : 'Theme preview applied here and to the desktop.';
  };
});

document.querySelectorAll('[data-visual-choice]').forEach(button => {
  button.onclick = () => {
    if (theme === 'ultra-retro') return;
    visual = button.dataset.visualChoice;
    localStorage.setItem('nightglass-visual', visual);
    localStorage.setItem('homebase-visual-version', '3');
    syncVisualPreview();
    tellDesktop({ type: 'homebase-visual-choice', index: Number(visual) });
    status.textContent = 'This exact visual is now running on the desktop.';
  };
});

document.querySelectorAll('[data-retro-wallpaper]').forEach(button => {
  button.classList.toggle('active', button.dataset.retroWallpaper === wallpaper);
  button.onclick = () => {
    wallpaper = button.dataset.retroWallpaper;
    localStorage.setItem('homebase-retro-wallpaper', wallpaper);
    document.documentElement.dataset.retroWallpaper = wallpaper;
    document.querySelectorAll('[data-retro-wallpaper]').forEach(item => item.classList.toggle('active', item === button));
    syncVisualPreview();
    tellDesktop({ type: 'homebase-retro-wallpaper', id: wallpaper });
    status.textContent = 'Retro wallpaper applied to the desktop.';
  };
});

document.querySelector('#reset-dancer')?.addEventListener('click', () => {
  localStorage.removeItem('homebase-dancer-hidden');
  const positions = (() => { try { return JSON.parse(localStorage.getItem('homebase-desktop-positions') || '{}'); } catch { return {}; } })();
  delete positions['orbit-dancer'];
  localStorage.setItem('homebase-desktop-positions', JSON.stringify(positions));
  tellDesktop({ type: 'homebase-reset-dancer' });
  status.textContent = 'Orbit dancer restored to its default desktop position.';
});

const preferences = () => Object.fromEntries(Object.keys(localStorage)
  .filter(key => key.startsWith('nightglass-') || key.startsWith('homebase-') || key.startsWith('radio-'))
  .map(key => [key, localStorage.getItem(key)]));

document.querySelector('#export').onclick = async () => {
  const areas = [...document.querySelectorAll('.checks input:checked')].map(input => input.value).filter(value => value !== 'preferences');
  status.textContent = 'Building private backup…';
  const response = await fetch('/api/backup/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ areas, preferences: document.querySelector('input[value=preferences]').checked ? preferences() : {} }) });
  if (!response.ok) { status.textContent = 'Export failed.'; return; }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(await response.blob());
  link.download = `homebase-backup-${new Date().toISOString().slice(0, 10)}.zip`;
  link.click(); URL.revokeObjectURL(link.href); status.textContent = 'Backup exported to Downloads.';
};

const picker = document.querySelector('#backup');
document.querySelector('#import').onclick = () => picker.click();
picker.onchange = async () => {
  const file = picker.files[0];
  if (!file || !confirm('Merge this Homebase backup into this device? Existing files with the same names may be replaced.')) return;
  status.textContent = 'Restoring backup…';
  const response = await fetch('/api/backup/import', { method: 'POST', body: file });
  const result = await response.json();
  if (!response.ok) { status.textContent = `Import failed: ${result.error || 'invalid archive'}`; return; }
  Object.entries(result.preferences || {}).forEach(([key, value]) => localStorage.setItem(key, value));
  status.textContent = `Restored ${result.restored.join(', ')}. Backup remembers ${(result.installed_apps || []).length} installed apps. Reload Homebase to apply preferences.`;
};

document.querySelectorAll('[data-setting]').forEach(input => {
  const key = input.dataset.setting, stored = localStorage.getItem(key);
  if (stored !== null) input.checked = stored === 'true';
  input.onchange = () => { localStorage.setItem(key, String(input.checked)); status.textContent = 'Setting saved.'; };
});

syncVisualPreview();
