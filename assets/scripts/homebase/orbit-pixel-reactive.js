/* Pixel Field is rendered after the compact canvas's generic frame so its density
   follows the real signal instead of an independent looping decoration. */
(() => {
  let signal = { energy: .08, bass: .05, treble: .04 };
  addEventListener('message', event => {
    if (event.data?.type === 'orbit-energy') signal = { ...signal, ...(event.data.signal || {}) };
  });
  function paint(time) {
    const player = document.querySelector('#orbit-player:not(.expanded)');
    const canvas = player?.querySelector('.orbit-mini-canvas');
    if (canvas && player.dataset.visual === 'pixel') {
      const box = canvas.getBoundingClientRect(), ratio = Math.min(devicePixelRatio || 1, 2);
      const width = Math.max(1, box.width), height = Math.max(1, box.height);
      const ctx = canvas.getContext('2d');
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const retro = document.documentElement.dataset.theme === 'ultra-retro';
      const color = retro ? '#000080' : `rgb(${getComputedStyle(document.documentElement).getPropertyValue('--signal-rgb') || '91,213,255'})`;
      const energy = Math.max(0, Math.min(1, Number(signal.energy) || 0));
      const bass = Math.max(0, Math.min(1, Number(signal.bass) || 0));
      const treble = Math.max(0, Math.min(1, Number(signal.treble) || 0));
      const size = Math.max(2, Math.round(width / 44)), threshold = .42 - energy * .24 - bass * .17;
      ctx.fillStyle = retro ? '#ddd' : '#071019'; ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = color;
      for (let y = 0; y < height; y += size) for (let x = 0; x < width; x += size) {
        const wave = energy + bass * Math.sin(x * .24 + time * (.004 + bass * .012)) + treble * Math.cos(y * .3 - time * .006);
        if (wave > threshold + ((x / size + y / size) % 5) * .028) {
          ctx.globalAlpha = Math.min(1, .16 + (wave - threshold) * 1.65);
          ctx.fillRect(x, y, Math.max(1, size - 1), Math.max(1, size - 1));
        }
      }
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(paint);
  }
  requestAnimationFrame(paint);
})();
