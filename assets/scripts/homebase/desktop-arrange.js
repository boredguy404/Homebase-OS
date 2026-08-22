(()=>{
  document.head.insertAdjacentHTML('beforeend','<link rel="stylesheet" href="/assets/styles/homebase/desktop-beacon.css?v=82">');
  const key='homebase-desktop-positions',shortcutsKey='homebase-desktop-shortcuts';
  const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return{}}};
  const save=value=>localStorage.setItem(key,JSON.stringify(value));
  const slug=value=>'shortcut-'+value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  function tileKey(tile){return tile.dataset.desktopKey||tile.querySelector('b')?.textContent.trim()||''}
  function apply(tile){const point=read()[tileKey(tile)];if(point){tile.style.setProperty('--desktop-x',point.x+'px');tile.style.setProperty('--desktop-y',point.y+'px');tile.classList.add('desktop-positioned')}}
  function attach(tile){if(tile.dataset.arrangeReady)return;tile.dataset.arrangeReady='true';apply(tile);let timer,start,base,dragging=false;
    tile.addEventListener('pointerdown',event=>{if(event.button&&event.button!==0)return;start={x:event.clientX,y:event.clientY};base=read()[tileKey(tile)]||{x:0,y:0};timer=setTimeout(()=>{dragging=true;tile.classList.add('desktop-dragging');tile.setPointerCapture?.(event.pointerId);navigator.vibrate?.(18)},360)});
    tile.addEventListener('pointermove',event=>{if(!dragging)return;const x=Math.round(base.x+event.clientX-start.x),y=Math.round(base.y+event.clientY-start.y);tile.style.setProperty('--desktop-x',x+'px');tile.style.setProperty('--desktop-y',y+'px');event.preventDefault()});
    const end=event=>{clearTimeout(timer);if(!dragging)return;dragging=false;tile.classList.remove('desktop-dragging');const positions=read();positions[tileKey(tile)]={x:Math.round(base.x+event.clientX-start.x),y:Math.round(base.y+event.clientY-start.y)};save(positions);tile.classList.add('desktop-positioned');setTimeout(()=>tile.dataset.dragged='',0);tile.dataset.dragged='true'};tile.addEventListener('pointerup',end);tile.addEventListener('pointercancel',end);
    tile.addEventListener('click',event=>{if(tile.dataset.dragged){event.preventDefault();event.stopImmediatePropagation()}},true);
  }
  function addShortcuts(){const grid=document.querySelectorAll('.grid')[1];if(!grid||document.querySelector('[data-add-shortcut]'))return;const add=document.createElement('button');add.className='tile desktop-shortcut-add';add.dataset.addShortcut='true';add.innerHTML='<i>＋</i><b>Add shortcut</b><span>Pin a website or Homebase link here.</span>';add.onclick=()=>{const label=prompt('Shortcut name');if(!label?.trim())return;const url=prompt('Web address or Homebase path','https://');if(!url?.trim())return;let list=[];try{list=JSON.parse(localStorage.getItem(shortcutsKey)||'[]')}catch{}list.push({id:slug(label)+Date.now(),label:label.trim().slice(0,42),url:url.trim()});localStorage.setItem(shortcutsKey,JSON.stringify(list));location.reload()};grid.append(add);let list=[];try{list=JSON.parse(localStorage.getItem(shortcutsKey)||'[]')}catch{}list.forEach(item=>{if(document.querySelector('[data-shortcut-id="'+item.id+'"]'))return;const link=document.createElement('a');link.className='tile desktop-shortcut';link.dataset.shortcutId=item.id;link.dataset.desktopKey='shortcut:'+item.id;link.href=item.url;link.target=item.url.startsWith('/')?'_self':'_blank';link.rel='noopener';link.innerHTML='<i>↗</i><b></b><span>Personal shortcut · long-press to move.</span>';link.querySelector('b').textContent=item.label;grid.insertBefore(link,add)});
  }
  function attachDancer(){
    const dancer=document.querySelector('.desktop-dancer-spot');
    if(!dancer||dancer.dataset.arrangeReady)return;
    dancer.innerHTML='<span class="desktop-beacon" aria-hidden="true"><i class="beacon-line"></i><i class="beacon-core"></i><i class="beacon-line"></i></span>';
    dancer.dataset.arrangeReady='true';
    const saved=read()['orbit-dancer'];
    if(saved){dancer.style.left=saved.left+'px';dancer.style.top=saved.top+'px';dancer.style.right='auto';dancer.style.bottom='auto'}
    let pointer=null,moved=false,consume=false;
    const finish=event=>{
      if(!pointer||event.pointerId!==pointer.id)return;
      dancer.releasePointerCapture?.(pointer.id);
      if(moved){
        consume=true;
        const positions=read();
        positions['orbit-dancer']={left:Math.round(dancer.offsetLeft),top:Math.round(dancer.offsetTop)};
        save(positions);
        setTimeout(()=>consume=false,420);
      }
      dancer.classList.remove('desktop-dragging');pointer=null;moved=false;
    };
    dancer.addEventListener('pointerdown',event=>{
      if(event.button&&event.button!==0)return;
      const box=dancer.getBoundingClientRect();
      pointer={id:event.pointerId,startX:event.clientX,startY:event.clientY,left:box.left,top:box.top};
      dancer.setPointerCapture?.(event.pointerId);
    },true);
    dancer.addEventListener('pointermove',event=>{
      if(!pointer||event.pointerId!==pointer.id)return;
      const dx=event.clientX-pointer.startX,dy=event.clientY-pointer.startY;
      if(!moved&&Math.hypot(dx,dy)<5)return;
      if(!moved){moved=true;dancer.classList.add('desktop-dragging');navigator.vibrate?.(12)}
      dancer.style.left=Math.round(Math.max(4,Math.min(innerWidth-dancer.offsetWidth-4,pointer.left+dx)))+'px';
      dancer.style.top=Math.round(Math.max(30,Math.min(innerHeight-dancer.offsetHeight-4,pointer.top+dy)))+'px';
      dancer.style.right='auto';dancer.style.bottom='auto';event.preventDefault();
    },true);
    dancer.addEventListener('pointerup',finish,true);dancer.addEventListener('pointercancel',finish,true);
    dancer.addEventListener('click',event=>{if(consume){event.preventDefault();event.stopImmediatePropagation()}},true);
  }
  function run(){document.querySelectorAll('.tile').forEach(tile=>{if(tile.querySelector('b')?.textContent.trim()==='Explore Linux apps')tile.remove()});addShortcuts();document.querySelectorAll('.tile').forEach(attach);const dancer=document.querySelector('.desktop-dancer-spot');if(dancer&&localStorage.getItem('homebase-dancer-hidden')===null){dancer.classList.add('is-hidden');localStorage.setItem('homebase-dancer-hidden','true')}attachDancer()}
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',()=>setTimeout(run,120));else setTimeout(run,120);new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});
})();
