(() => {
  /* EmulatorJS does not consistently fire EJS_ready for every core/container.
     Treat an actual emulator surface or toolbar as the source of truth, so a
     successful PS1/N64 launch is never hidden behind NovaShell's loader. */
  const ready = () => {
    const player = document.querySelector('#player');
    const loading = document.querySelector('#loading');
    const game = document.querySelector('#game');
    if (!player || !loading || !game || player.style.display !== 'grid' || loading.classList.contains('done')) return;
    const surface = game.querySelector('canvas, iframe, .ejs_canvas, [class*="emulator"]');
    const toolbar = /Exit Emulation|Control Settings|Save State/.test(game.innerText || '');
    if (surface || toolbar) loading.classList.add('done');
  };
  new MutationObserver(ready).observe(document.body, {childList:true, subtree:true, characterData:true});
  addEventListener('homebase-game-launch', () => {
    const until = Date.now() + 30000;
    const poll = () => { ready(); if (Date.now() < until && !document.querySelector('#loading.done')) setTimeout(poll, 350); };
    poll();
  });
})();
