(() => {
  document.head.insertAdjacentHTML('beforeend', '<link rel="stylesheet" href="/assets/styles/arcade/game-details.css?v=82">');
  const dialog = document.createElement('dialog');
  dialog.className = 'game-detail-modal';
  dialog.innerHTML = '<button class="game-detail-x" aria-label="Close">×</button><div class="game-detail-gallery"><button class="gallery-left" aria-label="Previous">‹</button><div class="game-detail-track"></div><button class="gallery-right" aria-label="Next">›</button><div class="game-detail-dots"></div></div><div class="game-detail-copy"><small></small><h2></h2><p></p><div class="game-facts"></div><div class="game-save-choice" hidden><b>Autoboot save</b><span>Choose what loads when this game starts.</span><div><button data-save="complete">Complete career</button><button data-save="browser">My browser save</button></div></div><div class="game-detail-actions"><button class="game-more">Controller layout</button><button class="game-versus" hidden>2 players</button><button class="game-play">Play</button></div></div>';
  document.body.appendChild(dialog);
  let active = null, slide = 0, media = [];
  const slug = name => name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  function draw() {
    const track = dialog.querySelector('.game-detail-track'),hasMedia=media.length>0;
    track.innerHTML = hasMedia ? media.map((src, index) => '<img class="' + (index === slide ? 'active' : '') + '" src="' + src + '" alt="Local ' + active.dataset.name + ' preview ' + (index + 1) + '">').join('') : '<div class="game-detail-fallback"><b>'+String(active.dataset.system||active.dataset.core||'LOCAL').toUpperCase()+'</b><strong></strong><span>LOCAL COPY · ADD YOUR OWN COVER OR GAMEPLAY GIF</span></div>';
    if(!hasMedia)track.querySelector('strong').textContent=active.dataset.name;
    track.querySelectorAll('img').forEach(image => image.onerror = () => { media=media.filter(src=>src!==image.getAttribute('src'));slide=0;draw(); });
    dialog.querySelector('.game-detail-dots').innerHTML = hasMedia ? media.map((_, i) => '<i class="' + (i === slide ? 'active' : '') + '"></i>').join('') : '';
    dialog.querySelector('.gallery-left').hidden=!hasMedia;dialog.querySelector('.gallery-right').hidden=!hasMedia;
  }
  function move(direction) { slide = (slide + direction + media.length) % media.length; draw(); }
  const available = src => new Promise(resolve => { const image=new Image();image.onload=()=>resolve(src);image.onerror=()=>resolve(null);image.src=src; });
  async function open(card) {
    active = card; slide = 0;
    const id = slug(card.dataset.name);
    const existing = card.querySelector('img')?.getAttribute('src');
    const candidates=[existing,'/covers/'+id+'-real.png','/covers/'+id+'-gameplay-v2.gif','/covers/'+id+'-gameplay.gif','/covers/'+id+'-gameplay-2.gif','/covers/'+id+'-gameplay-3.gif'].filter(Boolean);
    media=[...new Set((await Promise.all(candidates.map(available))).filter(Boolean))];
    const tag = card.querySelector('.tag')?.textContent || (card.dataset.core || 'GBA').toUpperCase();
    dialog.querySelector('small').textContent = tag + ' · LOCAL COPY';
    dialog.querySelector('h2').textContent = card.dataset.name;
    dialog.querySelector('.game-detail-copy>p').textContent = card.querySelector('.copy p')?.textContent || 'A game from your private local library.';
    const core=card.dataset.core||'gba',bios=core==='psx'?'Required':'Not needed',performance=core==='n64'?'Use fullscreen':'Lightweight';
    dialog.querySelector('.game-facts').innerHTML = '<span><b>' + core.toUpperCase() + '</b>System</span><span><b>Xbox</b>Controller ready</span><span><b>'+bios+'</b>'+ (core==='psx'?'PS1 BIOS':'BIOS') +'</span><span><b>'+performance+'</b>'+ (core==='n64'?'Best N64 speed':'Performance') +'</span><span><b>Autosave</b>Every 7 seconds</span>';
    const saveChoice=dialog.querySelector('.game-save-choice'),isTony=/tony hawk/i.test(card.dataset.name);saveChoice.hidden=!isTony;
    const versus=dialog.querySelector('.game-versus'),title=card.dataset.name||'',mode=/mario kart.*super circuit/i.test(title)?'mario':/street fighter/i.test(title)?'streetfighter':/goldeneye|mortal kombat|super smash|smash bros|mario kart 64/i.test(title)?'local':null;versus.hidden=!mode;versus.textContent=mode==='local'?'2 players · versus':'2 players';versus.onclick=()=>{dialog.close();if(mode==='mario'||mode==='streetfighter'){window.startVersus?.(mode);return}window.launch(card.dataset.rom,card.dataset.name,card.dataset.core||'n64');setTimeout(()=>toast('Two Xbox controllers are enabled. Choose versus or multiplayer in the game menu.'),500)};
    if(isTony){const key='homebase-autoboot-save:'+id,choice=localStorage.getItem(key)||'complete';saveChoice.querySelectorAll('[data-save]').forEach(button=>{button.classList.toggle('selected',button.dataset.save===choice);button.onclick=()=>{localStorage.setItem(key,button.dataset.save);saveChoice.querySelectorAll('[data-save]').forEach(item=>item.classList.toggle('selected',item===button));toast('Autoboot save set to '+(button.dataset.save==='complete'?'complete career':'your browser save'))}})}
    draw();dialog.scrollTop=0;dialog.querySelector('.game-detail-track').scrollLeft=0;dialog.showModal();requestAnimationFrame(()=>{dialog.scrollTop=0;dialog.querySelector('.game-detail-track').scrollLeft=0});
  }
  dialog.querySelector('.game-detail-x').onclick = () => dialog.close();
  dialog.querySelector('.gallery-left').onclick = () => move(-1);
  dialog.querySelector('.gallery-right').onclick = () => move(1);
  let swipeX = 0;
  dialog.querySelector('.game-detail-gallery').onpointerdown = event => swipeX = event.clientX;
  dialog.querySelector('.game-detail-gallery').onpointerup = event => Math.abs(event.clientX - swipeX) > 40 && move(event.clientX < swipeX ? 1 : -1);
  dialog.querySelector('.game-play').onclick = () => { const card = active; dialog.close(); window.launch(card.dataset.rom, card.dataset.name, card.dataset.core || 'gba'); };
  dialog.querySelector('.game-more').onclick = () => { const card=active;dialog.close();window.EJS_gameName=card.dataset.name;window.EJS_core=card.dataset.core||'gba';document.querySelector('.controls-button')?.click(); };
  document.addEventListener('click', event => {
    const card = event.target.closest('.game[data-rom]');
    if (!card || dialog.contains(card)) return;
    event.preventDefault(); event.stopImmediatePropagation(); open(card);
  }, true);
})();
