(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const root = document.documentElement;
  const tiles = [...document.querySelectorAll('.tile')];
  const sections = [...document.querySelectorAll('.section-title')];
  let queued = false;
  function draw() {
    queued = false;
    const height = Math.max(1, root.scrollHeight - innerHeight);
    root.style.setProperty('--scroll-progress', scrollY / height);
    root.style.setProperty('--scroll-px', scrollY + 'px');
    for (const [index, tile] of tiles.entries()) {
      const box = tile.getBoundingClientRect();
      const center = (box.top + box.height / 2 - innerHeight / 2) / innerHeight;
      const visible = box.bottom > -80 && box.top < innerHeight + 80;
      tile.classList.toggle('motion-visible', visible);
      if (visible) {
        tile.style.setProperty('--scroll-y', Math.max(-1, Math.min(1, center)));
        tile.style.setProperty('--phase', index * .73);
      }
    }
    for (const section of sections) {
      const box = section.getBoundingClientRect();
      section.style.setProperty('--section-shift', Math.max(-1, Math.min(1, (box.top - innerHeight / 2) / innerHeight)));
    }
  }
  function request() {
    if (!queued) { queued = true; requestAnimationFrame(draw); }
  }
  addEventListener('scroll', request, {passive: true});
  addEventListener('resize', request, {passive: true});
  request();
})();
