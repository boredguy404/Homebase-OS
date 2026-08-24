(() => {
  let level = 500;
  const orbit = () => document.querySelector('#orbit-player');
  const app = () => document.querySelector('#pocket-layer');
  const relay = () => document.querySelector('#assistant-window');
  const raise = target => {
    const node = target === 'orbit' ? orbit() : target === 'relay' ? relay() : app();
    if (!node) return;
    level += 10;
    node.style.zIndex = String(level);
    node.classList.add('homebase-window-active');
    [orbit(), app(), relay()].filter(Boolean).filter(item => item !== node).forEach(item => item.classList.remove('homebase-window-active'));
  };
  window.raiseHomebaseWindow = raise;
  document.addEventListener('pointerdown', event => {
    if (event.target.closest?.('#orbit-player')) raise('orbit');
    if (event.target.closest?.('#pocket-layer')) raise('app');
    if (event.target.closest?.('#assistant-window')) raise('relay');
  }, true);
  addEventListener('message', event => {
    if (event.data?.type === 'homebase-window-active') {
      if (relay()?.querySelector('iframe')?.contentWindow === event.source) raise('relay'); else raise('app');
    }
    if (event.data?.type === 'orbit-window-active') raise('orbit');
  });
})();
