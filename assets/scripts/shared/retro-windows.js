(()=>{
  if(window.__homebaseRetroWindows)return;
  window.__homebaseRetroWindows=true;
  const isRetro=()=>document.documentElement.dataset.theme==='ultra-retro';
  const closeDialog=dialog=>{
    if(typeof dialog.close==='function'&&dialog.open)dialog.close();
    else dialog.removeAttribute('open');
    dialog.dispatchEvent(new CustomEvent('homebase-window-close'));
    if(dialog.classList.contains('retro-bulletin'))dialog.remove();
  };
  const labelFor=dialog=>dialog.dataset.windowTitle||dialog.querySelector('h1,h2,h3')?.textContent?.trim()||document.title.split('·')[0].trim()||'HOMEBASE';
  function makeDraggable(dialog,title){
    let drag=null;
    title.addEventListener('pointerdown',event=>{
      if(event.target.closest('button'))return;
      const box=dialog.getBoundingClientRect();
      dialog.style.position='fixed';dialog.style.margin='0';dialog.style.left=box.left+'px';dialog.style.top=box.top+'px';dialog.style.right='auto';dialog.style.bottom='auto';
      drag={x:event.clientX,y:event.clientY,left:box.left,top:box.top};
      title.setPointerCapture?.(event.pointerId);event.preventDefault();
    });
    title.addEventListener('pointermove',event=>{
      if(!drag)return;
      const box=dialog.getBoundingClientRect(),left=Math.max(4,Math.min(innerWidth-box.width-4,drag.left+event.clientX-drag.x)),top=Math.max(29,Math.min(innerHeight-box.height-4,drag.top+event.clientY-drag.y));
      dialog.style.left=left+'px';dialog.style.top=top+'px';
    });
    const end=()=>drag=null;title.addEventListener('pointerup',end);title.addEventListener('pointercancel',end);
  }
  function enhance(dialog){
    if(!(dialog instanceof HTMLDialogElement)||dialog.dataset.retroWindow)return;
    dialog.dataset.retroWindow='true';dialog.classList.add('retro-window-ready');
    const existingClose=dialog.querySelector(':scope>.x,:scope>.close,:scope>.game-detail-x,:scope>.insight-x,:scope>.control-x,:scope>.detail-close');
    let title=dialog.querySelector(':scope>.bulletin-title,:scope>.retro-window-title');
    if(!title){title=document.createElement('div');title.className='retro-window-title';title.innerHTML='<span></span>';title.querySelector('span').textContent=labelFor(dialog).toUpperCase();dialog.prepend(title)}
    let close=title.querySelector('button');if(!close&&existingClose){close=existingClose;title.append(close)}if(!close){close=document.createElement('button');close.type='button';close.setAttribute('aria-label','Close window');close.textContent='×';title.append(close);close.addEventListener('click',()=>closeDialog(dialog))}makeDraggable(dialog,title);
    dialog.addEventListener('click',event=>{const box=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom))closeDialog(dialog)});
  }
  const scan=root=>{if(root.matches?.('dialog'))enhance(root);root.querySelectorAll?.('dialog').forEach(enhance)};
  scan(document);new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>node.nodeType===1&&scan(node)))).observe(document.documentElement,{childList:true,subtree:true});
})();
