/* Pixel Field is rendered after the compact canvas's generic frame so its density
   follows the real signal instead of an independent looping decoration. */
(() => {
  let signal = { energy: .08, bass: .05, treble: .04, beat: 0 };
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
      const beat = Math.max(0, Math.min(1, Number(signal.beat) || 0));
      /* The larger/peek player gets a true fine pixel field: fixed 2px cells,
         not scaled-up blocks. The compact strip stays economical. */
      const size = player.classList.contains('peek') ? 2 : Math.max(2, Math.round(width / 44));
      const threshold = .46 - energy * .29 - bass * .2 - beat * .1;
      ctx.fillStyle = retro ? '#ddd' : '#071019'; ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = color;
      for (let y = 0; y < height; y += size) for (let x = 0; x < width; x += size) {
        const wave = energy + bass * Math.sin(x * .24 + time * (.004 + bass * .012)) + treble * Math.cos(y * .3 - time * .006) + beat * Math.sin((x+y) * .11 + time * .018);
        if (wave > threshold + ((x / size + y / size) % 5) * .028) {
          ctx.globalAlpha = Math.min(1, .12 + (wave - threshold) * 1.9 + beat * .17);
          ctx.fillRect(x, y, Math.max(1, size - 1), Math.max(1, size - 1));
        }
      }
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(paint);
  }
  requestAnimationFrame(paint);
})();
