document.head.insertAdjacentHTML('beforeend','<link rel="stylesheet" href="/assets/styles/homebase/orbit-performance.css"><link rel="stylesheet" href="/assets/styles/homebase/header-actions.css"><link rel="stylesheet" href="/assets/styles/shared/ultra-retro.css">');
addEventListener('DOMContentLoaded',()=>{const clock=document.querySelector('#clock');if(clock&&!document.querySelector('.quick-fullscreen'))clock.insertAdjacentHTML('afterend','<button class="quick-fullscreen" onclick="toggleFullscreen()" aria-label="Enter or leave fullscreen" title="Fullscreen">⛶</button>');[...document.querySelectorAll('.tile')].find(tile=>tile.querySelector('b')?.textContent.includes('Fullscreen'))?.classList.add('fullscreen-feature')});

const requestedTheme=new URLSearchParams(location.search).get('theme');if(['solaris','tidal','cobalt','ultra-retro'].includes(requestedTheme)){localStorage.setItem('nightglass-theme',requestedTheme);localStorage.setItem('homebase-visual-version','3')}
function openPanel(url) {
  const layer = document.querySelector('#pocket-layer');
  const frame = document.querySelector('#pocket-frame');
  frame.src = url;
  layer.classList.add('open');
  document.body.classList.add('app-open');
  minimizeOrbit();
}

function closePocket() {
  document.querySelector('#pocket-layer')?.classList.remove('open');
  document.body.classList.remove('app-open');
}

async function openOrbit() {
  let player = document.querySelector('#orbit-player');
  if (!player) {
    player = document.createElement('section');
    player.id = 'orbit-player';
    player.className = 'orbit-player expanded';
    player.innerHTML = '<div class="orbit-controls"><b>Nightglass / Orbit</b><button onclick="minimizeOrbit()">— Minimize</button><button onclick="closeOrbit()">Close</button></div><iframe title="Orbit Radio" allow="autoplay" src="about:blank"></iframe><div class="orbit-mini"><div class="orbit-mini-copy"><span>ORBIT RADIO</span><b>Choose a signal</b></div><div class="orbit-mini-actions"><button onclick="orbitCommand(\'previous\')" aria-label="Previous">◀</button><button class="orbit-mini-play" onclick="orbitCommand(\'play\')" aria-label="Play or pause">▶</button><button onclick="orbitCommand(\'next\')" aria-label="Next">▶</button><button onclick="openOrbit()" aria-label="Expand">↗</button><button onclick="closeOrbit()" aria-label="Close">×</button></div></div>';
    document.body.appendChild(player);
    player.querySelector('iframe').src='/modules/radio-orbit/index.html?v=56';
  } else {
    player.classList.add('expanded');
    player.querySelector('iframe')?.contentWindow.postMessage({type:'orbit-compact',compact:false},'*');
  }
}

async function openNightglassControl(){await fetch('/api/launch/nightglass_embed',{method:'POST'});setTimeout(()=>openPanel(`http://${location.hostname}:8780/`),500)}
function explainSteamLink(){alert('Steam Link is a ChromeOS/Android app on this ARM Chromebook. Install or open it from the Chromebook launcher; the Linux container cannot directly start Android apps.')}

function minimizeOrbit() { const player=document.querySelector('#orbit-player');player?.classList.remove('expanded');player?.querySelector('iframe')?.contentWindow.postMessage({type:'orbit-compact',compact:true},'*'); }
function closeOrbit() { document.querySelector('#orbit-player')?.remove(); }
function orbitCommand(command){document.querySelector('#orbit-player iframe')?.contentWindow.postMessage({type:'orbit-command',command},'*')}
addEventListener('message',event=>{if(event.data?.type==='orbit-ready'){const theme=getComputedStyle(document.documentElement);event.source.postMessage({type:'orbit-theme',id:document.documentElement.dataset.theme||'cobalt',signal:theme.getPropertyValue('--signal-rgb'),alt:theme.getPropertyValue('--signal-alt-rgb')},'*');return}if(event.data?.type==='orbit-home'){minimizeOrbit();return}if(event.data?.type!=='orbit-state')return;const player=document.querySelector('#orbit-player');if(!player)return;player.querySelector('.orbit-mini-copy b').textContent=event.data.name||'Choose a signal';player.querySelector('.orbit-mini-play').textContent=event.data.playing?'Ⅱ':'▶'});
addEventListener('nightglass-theme',event=>document.querySelector('#orbit-player iframe')?.contentWindow.postMessage({type:'orbit-theme',id:event.detail.id,signal:event.detail.signal,alt:event.detail.alt},'*'));

addEventListener('DOMContentLoaded',()=>{
  document.title='Homebase';
  const wordmark=document.querySelector('.wordmark');if(wordmark)wordmark.textContent='Homebase.';
  const control=[...document.querySelectorAll('.tile')].find(tile=>tile.querySelector('b')?.textContent==='Homebase Control');if(control){control.querySelector('b').textContent='Homebase Control';control.querySelector('span').textContent='Live system health, controller diagnostics, and protected save backups.'}
  document.querySelector('.layer-back')?.replaceChildren(document.createTextNode('← Homebase'));
  const files=[...document.querySelectorAll('.tile')].find(tile=>tile.getAttribute('onclick')==="launch('files')");
  if(files){files.querySelector('b').textContent='My Library';files.querySelector('span').textContent='Your personal drop space for files, media, projects, installers, and owned games.';files.onclick=()=>openPanel('/pages/files.html?path=My%20Library')}
  const computer=document.querySelectorAll('.grid')[1];if(computer&&!document.querySelector('[data-github-setup]'))computer.insertAdjacentHTML('beforeend','<button class="tile" data-github-setup onclick="openPanel(\'/pages/github-setup.html\')"><i>⌂</i><b>Publish Homebase</b><span>Guided GitHub setup, privacy choices, README plan, and release media.</span></button><button class="tile" onclick="openPanel(\'/pages/readme-studio.html\')"><i>▧</i><b>README Studio</b><span>Capture real screenshots and plan a polished presentation with free tools.</span></button>');
  if(computer&&!document.querySelector('[data-settings]'))computer.insertAdjacentHTML('beforeend','<button class="tile" data-settings onclick="openPanel(\'/pages/settings.html\')"><i>⚙</i><b>Settings</b><span>Themes, visuals, private backup, restore, and installed-app inventory.</span></button>');
  const marks={"Pocket Archive":"▦","YouTube":"▶","Orbit Radio":"≈","Files":"▤","My Library":"▤","Chrome Remote Desktop":"⌁","Steam Link":"◉","Explore Linux apps":"＋","XFCE Terminal":"›_","Codex workspace":"✦","VS Code":"{·}","Homebase Control":"⌘","Fullscreen Homebase":"⛶","Publish Homebase":"⌂"};
  document.querySelectorAll('.tile').forEach(tile=>{const name=tile.querySelector('b')?.textContent.trim();tile.dataset.watermark=marks[name]||'•';tile.querySelector('.tile-arrow')?.remove();tile.addEventListener('pointermove',event=>{const box=tile.getBoundingClientRect();tile.style.setProperty('--mx',((event.clientX-box.left)/box.width*100)+'%');tile.style.setProperty('--my',((event.clientY-box.top)/box.height*100)+'%')});tile.addEventListener('pointerleave',()=>{tile.style.removeProperty('--mx');tile.style.removeProperty('--my')})});
});

document.head.insertAdjacentHTML('beforeend','<style>.orbit-player[data-visual="orbit"] .orbit-mini:before{border-radius:50%;background:repeating-radial-gradient(circle,rgba(var(--signal-rgb),.5) 0 2px,transparent 3px 8px)!important}.orbit-player[data-visual="wave"] .orbit-mini:before{background:repeating-linear-gradient(165deg,transparent 0 7px,rgba(var(--signal-rgb),.5) 8px 10px)!important}.orbit-player[data-visual="tunnel"] .orbit-mini:before{border-radius:50%!important;background:repeating-radial-gradient(circle,transparent 0 5px,rgba(var(--signal-alt-rgb),.5) 6px 8px)!important}.orbit-player[data-visual="radar"] .orbit-mini:before{border-radius:50%!important;background:conic-gradient(from 0deg,transparent,rgba(var(--signal-rgb),.7),transparent 18%)!important;animation:miniRadar 2s linear infinite!important}.orbit-player[data-visual="nebula"] .orbit-mini:before{border-radius:50%!important;background:radial-gradient(circle at 35% 30%,#fff,rgba(var(--signal-rgb),.65) 8%,transparent 35%),radial-gradient(circle at 70% 65%,rgba(var(--signal-alt-rgb),.6),transparent 42%)!important}@keyframes miniRadar{to{transform:rotate(1turn)}}</style>');
document.head.insertAdjacentHTML('beforeend','<style>.orbit-player[data-visual="club"] .orbit-mini:before{border-radius:50%!important;background:conic-gradient(#00d9ff,#ff315c,#ffe44b,#53e6bb,#00d9ff)!important;animation:miniRadar 1.2s linear infinite!important}</style>');
addEventListener('message', event => {
  if (event.data?.type === 'orbit-visual') {
    const player = document.querySelector('#orbit-player');
    if (player) player.dataset.visual = event.data.mode;
  }
});

document.addEventListener('click', event => {
  const mini = event.target.closest('.orbit-player:not(.expanded) .orbit-mini');
  if (mini && !event.target.closest('button')) { openOrbit(); return; }
  if (event.target.closest('.tile') && !event.target.closest('[onclick="openOrbit()"]')) minimizeOrbit();
}, true);
