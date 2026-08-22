(() => {
  const run = async () => {
    const library = document.querySelector('#library .grid:not(.featured)');
    if (!library) return;
    try {
      const data = await fetch('/api/games', { cache: 'no-store' }).then(response => response.json());
      for (const game of data.games || []) {
        if (document.querySelector(`[data-rom="${CSS.escape(game.rom)}"]`)) continue;
        const card = document.createElement('button');
        card.className = 'game';
        Object.assign(card.dataset, { rom: game.rom, core: game.core, name: game.name, system: game.system, genre: game.genre, year: game.year, players: game.players, controls: game.controls });
        const art = game.media?.[0] ? `<img src="${game.media[0]}" alt="Local ${game.name} artwork">` : `<div class="system-preview"><strong>${game.system}</strong><span>LOCAL · ADD ARTWORK</span></div>`;
        card.innerHTML = `<div class="art">${art}</div><div class="copy"><h2></h2><p></p><span class="tag"></span></div>`;
        card.querySelector('h2').textContent = game.name;
        card.querySelector('p').textContent = game.description;
        card.querySelector('.tag').textContent = [game.system, game.genre, game.players].filter(Boolean).join(' · ');
        library.append(card);
      }
    } catch (error) { console.warn('Local game scan unavailable', error); }
  };
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', run, { once: true }) : run();
})();
