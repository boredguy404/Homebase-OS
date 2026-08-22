/* A preloaded ROM is still a valid game: update its card instead of treating it
   as invisible duplicate content. */
(() => {
  const form = document.querySelector('#game-import');
  if (!form) return;
  const status = document.querySelector('#status');
  const slug = value => value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'game';
  async function upload(file, kind, id) {
    if (!file) return { skipped: true };
    status.textContent = `Adding ${file.name}…`;
    const response = await fetch(`/api/game-import/file?kind=${kind}`, { method: 'POST', headers: { 'X-Homebase-Local': '1', 'X-File-Name': encodeURIComponent(file.name), 'X-Game-Slug': id }, body: file });
    const result = await response.json().catch(() => ({}));
    if (response.status === 409 && kind === 'rom') return { existing: true, ...result };
    if (!response.ok) throw Error(result.error || `Could not import ${file.name}`);
    return result;
  }
  form.onsubmit = async event => {
    event.preventDefault();
    const button = form.querySelector('.submit'), data = Object.fromEntries(new FormData(form));
    const rom = document.querySelector('#rom').files[0], id = slug(data.title);
    if (!rom) { status.textContent = 'Choose an owned game file first.'; return; }
    button.disabled = true; button.textContent = 'Importing…';
    try {
      const romResult = await upload(rom, 'rom', id);
      await upload(document.querySelector('#cover').files[0], 'cover', id);
      await upload(document.querySelector('#preview1').files[0], 'preview1', id);
      await upload(document.querySelector('#preview2').files[0], 'preview2', id);
      status.textContent = romResult.existing ? 'Game already in Pocket Archive — updating its details…' : 'Saving game details…';
      const response = await fetch('/api/game-import/metadata', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Homebase-Local': '1' }, body: JSON.stringify({ ...data, slug: id, rom_name: rom.name }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw Error(result.error || 'Could not save details');
      status.innerHTML = (romResult.existing ? 'Already in Pocket Archive; details updated. ' : 'Imported. ') + '<button type="button" class="open-existing">Open it in Pocket Archive</button>';
      status.querySelector('.open-existing').onclick = () => parent !== window && parent.openPanel ? parent.openPanel('/pages/arcade.html') : location.href = '/pages/arcade.html';
      button.textContent = 'Saved ✓';
    } catch (error) { status.textContent = error.message; button.disabled = false; button.textContent = 'Import into Pocket Archive'; }
  };
})();
