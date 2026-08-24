/* Local command layer: it only invokes visible NovaShell routes and controls. */
(()=>{
  const entries=[
    ['⌂','NovaShell Desktop','Return to the desktop','HOME',()=>{window.closePocket?.();window.minimizeOrbit?.()}],
    ['▦','Pocket Archive','Open your owned game shelf','GAMES',()=>window.openPanel?.('/pages/arcade.html')],
    ['▤','My Library','Browse local files and imports','FILES',()=>window.openPanel?.('/pages/files.html?path=My%20Library')],
    ['⌕','Browse','Search news, tools, and discovery','BROWSE',()=>window.openPanel?.('/pages/browse.html')],
    ['⌘','Utility Desk','Open offline-capable daily tools','TOOLS',()=>window.openPanel?.('/pages/utility-desk.html')],
    ['＋','Linux apps','See installed apps and install guides','APPS',()=>window.openPanel?.('/pages/apps.html')],
    ['⚙','Settings','Themes, backup, and device options','SYSTEM',()=>window.openPanel?.('/pages/settings.html')],
    ['♫','Orbit Radio','Open the persistent music player','MUSIC',()=>window.openOrbit?.()],
    ['✦','Relay','Open the local assistant window','ASSIST',()=>window.openAssistant?.()],
    ['⛶','Toggle fullscreen','Use NovaShell without browser chrome','DISPLAY',()=>window.toggleFullscreen?.()],
    ['▥','System Activity','Open live local system information','SYSTEM',()=>document.querySelector('.metric')?.click()],
    ['▣','Recent updates','Read the local release notes','INFO',()=>window.openUpdates?.()]
  ];
  let dialog,input,list,filtered=[],index=0,padLatch=false;
  const close=()=>{if(dialog?.open)dialog.close();};
  const run=entry=>{close();setTimeout(()=>entry?.[4]?.(),0)};
  const render=()=>{if(!list)return;const term=(input?.value||'').trim().toLowerCase();filtered=entries.filter(entry=>entry.slice(0,4).join(' ').toLowerCase().includes(term));index=Math.min(index,Math.max(0,filtered.length-1));list.replaceChildren();if(!filtered.length){const empty=document.createElement('p');empty.className='command-palette-empty';empty.textContent='No local command matches that.';list.append(empty);return}filtered.forEach((entry,itemIndex)=>{const button=document.createElement('button');button.className='command-palette-item'+(itemIndex===index?' active':'');button.type='button';button.innerHTML='<i></i><span><b></b><span></span></span><em></em>';button.querySelector('i').textContent=entry[0];button.querySelector('b').textContent=entry[1];button.querySelector('span span').textContent=entry[2];button.querySelector('em').textContent=entry[3];button.onclick=()=>run(entry);list.append(button)});list.querySelector('.active')?.scrollIntoView({block:'nearest'})};
  const build=()=>{if(dialog)return;dialog=document.createElement('dialog');dialog.className='command-palette';dialog.setAttribute('aria-label','NovaShell command palette');dialog.innerHTML='<header><b>⌕ NOVASHELL COMMANDS</b><span>Ctrl / ⌘ + K · B closes</span><button type="button" aria-label="Close commands">×</button></header><input autocomplete="off" placeholder="Search local commands…" aria-label="Search commands"><section class="command-palette-list"></section>';document.body.append(dialog);input=dialog.querySelector('input');list=dialog.querySelector('.command-palette-list');dialog.querySelector('header button').onclick=close;input.oninput=()=>{index=0;render()};dialog.addEventListener('click',event=>{if(event.target===dialog)close()});dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close()}if(event.key==='ArrowDown'){event.preventDefault();index=Math.min(filtered.length-1,index+1);render()}if(event.key==='ArrowUp'){event.preventDefault();index=Math.max(0,index-1);render()}if(event.key==='Enter'){event.preventDefault();run(filtered[index])}})};
  window.openCommandPalette=()=>{build();index=0;input.value='';render();dialog.showModal();setTimeout(()=>input.focus(),0)};
  const addDesktopRoute=()=>{
    const grid=[...document.querySelectorAll('.grid')].find(candidate=>candidate.closest('.shell'));
    if(!grid||document.querySelector('[data-command-palette]'))return;
    const button=document.createElement('button');button.className='tile';button.dataset.commandPalette='true';button.innerHTML='<i>⌕</i><b>Quick commands</b><span>Find a local route, tool, or display action.</span>';
    button.onclick=window.openCommandPalette;grid.prepend(button);
  };
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',()=>setTimeout(addDesktopRoute,160),{once:true});else setTimeout(addDesktopRoute,160);
  addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();window.openCommandPalette()}});
  const pollPad=()=>{if(dialog?.open){const pad=[...(navigator.getGamepads?.()||[])].find(Boolean);if(pad){const up=pad.buttons[12]?.pressed||pad.axes[1]<-.65,down=pad.buttons[13]?.pressed||pad.axes[1]>.65,confirm=pad.buttons[0]?.pressed,back=pad.buttons[1]?.pressed;if((up||down||confirm||back)&&!padLatch){if(up){index=Math.max(0,index-1);render()}if(down){index=Math.min(filtered.length-1,index+1);render()}if(confirm)run(filtered[index]);if(back)close()}padLatch=up||down||confirm||back}else padLatch=false}requestAnimationFrame(pollPad)};requestAnimationFrame(pollPad);
})();
