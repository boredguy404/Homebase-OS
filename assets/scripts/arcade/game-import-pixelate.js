/* Opt-in privacy artwork transform. Runs before the existing import handler,
   keeps the original untouched, and only replaces the browser-side upload. */
(() => {
  const form = document.querySelector('#game-import');
  const cover = document.querySelector('#cover');
  if (!form || !cover || document.querySelector('#pixelate-artwork')) return;
  const row = document.createElement('label');
  row.className = 'pixelate-artwork';
  row.innerHTML = '<input id="pixelate-artwork" type="checkbox"><span><b>Pixelate this cover before import</b><small>Optional privacy mosaic for a static cover or screenshot. Off by default; original stays untouched.</small></span>';
  cover.closest('label').after(row);
  const note = document.createElement('p'); note.className = 'pixelate-note'; row.after(note);
  const style = document.createElement('style');
  style.textContent = '.pixelate-artwork{display:flex!important;grid-template-columns:none!important;align-items:flex-start;gap:10px}.pixelate-artwork input{width:20px!important;min-width:20px;margin:2px 0 0}.pixelate-artwork b,.pixelate-artwork small{display:block}.pixelate-artwork small{margin-top:4px;opacity:.78}.pixelate-note{min-height:0;margin:0;font-size:12px}html[data-theme="ultra-retro"] .pixelate-artwork{background:#d4d4d4!important;border-style:solid!important}.pixelate-artwork input{accent-color:#000080}';
  document.head.append(style);
  const pixelate = file => new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') return resolve(file);
    const image = new Image(), url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url); const tiny = document.createElement('canvas'), output = document.createElement('canvas');
      const longest = 40, ratio = Math.min(1, longest / Math.max(image.naturalWidth, image.naturalHeight));
      tiny.width = Math.max(1, Math.round(image.naturalWidth * ratio)); tiny.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      output.width = image.naturalWidth; output.height = image.naturalHeight;
      tiny.getContext('2d').drawImage(image, 0, 0, tiny.width, tiny.height);
      const context = output.getContext('2d'); context.imageSmoothingEnabled = false; context.drawImage(tiny, 0, 0, tiny.width, tiny.height, 0, 0, output.width, output.height);
      output.toBlob(blob => blob ? resolve(new File([blob], file.name.replace(/\.[^.]+$/, '') + '-pixelated.png', { type: 'image/png' })) : reject(Error('Could not pixelate this image')), 'image/png');
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(Error('Could not read this image')); };
    image.src = url;
  });
  form.addEventListener('submit', async event => {
    if (!document.querySelector('#pixelate-artwork').checked || form.dataset.pixelatedReady === 'yes') return;
    const file = cover.files[0]; if (!file) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (file.type === 'image/gif') { note.textContent = 'GIFs stay animated and are not pixelated. Choose a static cover to use the privacy mosaic.'; return; }
    try {
      note.textContent = 'Creating private pixel mosaic…'; const transformed = await pixelate(file), transfer = new DataTransfer(); transfer.items.add(transformed); cover.files = transfer.files;
      form.dataset.pixelatedReady = 'yes'; note.textContent = 'Pixelated private copy ready. Importing now…'; form.requestSubmit();
    } catch (error) { note.textContent = error.message; }
  }, true);
})();
