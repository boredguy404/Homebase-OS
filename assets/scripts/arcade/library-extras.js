(() => {
  document.head.insertAdjacentHTML('beforeend','<link rel="stylesheet" href="/assets/styles/arcade/archive-taskbar.css">');
  const publicCapture = new URLSearchParams(location.search).has('public');
  if(!document.querySelector('.archive-taskbar')){const bar=document.createElement('nav');bar.className='archive-taskbar';bar.setAttribute('aria-label','Pocket Archive taskbar');bar.innerHTML='<b>POCKET ARCHIVE</b><button data-archive-go="home">⌂ Homebase</button><button data-archive-go="games">▦ Games</button><button data-archive-go="apps">＋ Apps</button><button data-archive-go="full">⛶ Fullscreen</button>';bar.onclick=event=>{const action=event.target.closest('[data-archive-go]')?.dataset.archiveGo;if(action==='home')parent.closePocket?.();if(action==='games')document.querySelector('#library')?.scrollIntoView({behavior:'smooth'});if(action==='apps')document.querySelector('#apps')?.scrollIntoView({behavior:'smooth'});if(action==='full'){const shell=parent!==window?parent.document.documentElement:document.documentElement;shell.requestFullscreen?.()}};document.body.append(bar)}
  const apps=document.querySelector('#apps .app-grid');if(apps&&!document.querySelector('[data-game-setup]'))apps.insertAdjacentHTML('afterbegin','<button class="app-card" data-game-setup onclick="parent.openPanel?parent.openPanel(\'/pages/game-setup.html\'):location.href=\'/pages/game-setup.html\'"><i>＋</i><b>Add your games</b><span>Simple private-file guide for ROMs, BIOS files, cover art, real gameplay GIFs, and controller layouts.</span></button>');
  if(publicCapture)document.head.insertAdjacentHTML('beforeend','<style>.game .art .public-art-blur{display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;filter:blur(18px) saturate(.65) brightness(.72)!important;transform:scale(1.14)!important}.game .art:has(.public-art-blur){overflow:hidden!important;background:#202020}.public-system-art{width:100%;height:100%;display:grid;place-content:center;gap:7px;text-align:center;background:radial-gradient(circle at 25% 15%,rgba(var(--signal-rgb),.28),transparent 45%),linear-gradient(145deg,#18252d,#090d11)}.public-system-art b{font-size:28px;letter-spacing:.12em}.public-system-art span{color:#afbdc5;font-size:10px;text-transform:uppercase;letter-spacing:.08em}</style>');
  const originalLaunch = window.launch;
  if (typeof originalLaunch !== 'function') return;
  window.launch = function (url, name, core = 'gba') {
    document.querySelector('#player')?.classList.toggle('n64-session', core === 'n64');
    window.EJS_biosUrl = core === 'psx' ? '/bios/scph1001.bin' : undefined;
    if(core==='psx'){window.EJS_disableCue=false;window.EJS_threads=false;window.EJS_CacheLimit=800*1024*1024}
    originalLaunch(url, name, core);
    if (core === 'n64') {
      window.EJS_defaultOptions = {...window.EJS_defaultOptions, 'mupen64plus-pak1': 'memory'};
      if(name==='GoldenEye 007') toast('GoldenEye preset: choose 1.2 Solitaire once · left stick aims, right stick moves');
    }
    if (name !== "Tony Hawk's Pro Skater 3" || localStorage.getItem('homebase-autoboot-save:tony-hawk-s-pro-skater-3') === 'browser' || sessionStorage.getItem('homebase-thps3-complete-v2')) return;
    let attempts = 0;
    const timer = setInterval(async () => {
      const manager = window.EJS_emulator?.gameManager;
      if (!manager && attempts++ < 160) return;
      clearInterval(timer);
      if (!manager) return;
      try {
        const response = await fetch('/saves/tony-hawk-pro-skater-3-complete.srm');
        if (!response.ok) throw new Error('save unavailable');
        const save = new Uint8Array(await response.arrayBuffer());
        const path = manager.getSaveFilePath();
        if (manager.FS.analyzePath(path).exists) manager.FS.unlink(path);
        manager.FS.writeFile(path, save);
        manager.loadSaveFiles();
        manager.saveSaveFiles();
        const written=manager.FS.analyzePath(path);if(!written.exists||manager.FS.stat(path).size!==save.length)throw new Error('save verification failed');
        sessionStorage.setItem('homebase-thps3-complete-v2', '1');
        toast('THPS3 complete career loaded · all levels and skaters');
      } catch { toast('Complete career import needs retry'); }
    }, 100);
  };
  const library = document.querySelector('#library .grid:not(.featured)');
  const realArt={'/roms/mario-kart-64.z64':'mario-kart-64-real.png','/roms/super-mario-64.z64':'super-mario-64-real.png','/roms/ocarina-of-time.z64':'ocarina-of-time-real.png','/roms/tekken-3.chd':'tekken-3-real.png'};
  if(publicCapture)document.querySelectorAll('.game[data-rom]').forEach(card=>{const art=card.querySelector('.art'),image=art?.querySelector('img'),source=image?.getAttribute('src');if(source)art.innerHTML='<img class="public-art-blur" src="'+source+'" alt="Blurred local game artwork for public documentation">';else{const system=card.dataset.core==='n64'?'N64':card.dataset.core==='psx'?'PS1':card.dataset.core==='nes'?'NES':'GBA';art.innerHTML='<div class="public-system-art"><b>'+system+'</b><span>User adds their own legal copy</span></div>'}});
  else Object.entries(realArt).forEach(([rom,file])=>{const art=document.querySelector('[data-rom="'+rom+'"] .art');if(art)art.innerHTML='<img src="/covers/'+file+'" alt="Real in-game screenshot">'});
  if (library && !document.querySelector('[data-rom="/roms/super-mario-bros.nes"]')) {
    const card = document.createElement('button');
    card.className = 'game';
    card.dataset.rom = '/roms/super-mario-bros.nes';
    card.dataset.core = 'nes';
    card.dataset.name = 'Super Mario Bros.';
    card.innerHTML = '<div class="art system-preview"><strong>SMB</strong><span>NES · LOCAL LIBRARY</span></div><div class="copy"><h2>Super Mario Bros.</h2><p>The original side-scrolling Mushroom Kingdom adventure.</p><span class="tag">NES · platformer · lightweight</span></div>';
    card.onclick = () => window.launch(card.dataset.rom, card.dataset.name, card.dataset.core);
    library.appendChild(card);
    card.querySelector('.art').innerHTML='<img src="/covers/super-mario-bros-real.png" alt="Real Super Mario Bros. gameplay">';
  }
})();
