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
    // Some older app dialogs put their own X inside a nested article. Adopt it
    // into the shared title bar instead of leaving a second close control in
    // the body. This keeps every retro window to one predictable exit button.
    const closeSelector=':scope>.x,:scope>.close,:scope>.game-detail-x,:scope>.insight-x,:scope>.control-x,:scope>.detail-close,.close,.game-detail-x,.insight-x,.control-x,.detail-close';
    const existingClose=dialog.querySelector(closeSelector);
    let title=dialog.querySelector(':scope>.bulletin-title,:scope>.retro-window-title');
    if(!title){title=document.createElement('div');title.className='retro-window-title';title.innerHTML='<span></span>';title.querySelector('span').textContent=labelFor(dialog).toUpperCase();dialog.prepend(title)}
    let close=title.querySelector('button');if(!close&&existingClose){close=existingClose;title.append(close)}if(!close){close=document.createElement('button');close.type='button';close.setAttribute('aria-label','Close window');title.append(close)}close.textContent='×';close.setAttribute('aria-label','Close window');close.classList.add('retro-window-close');close.onclick=()=>closeDialog(dialog);
    // A dialog can be enhanced after another script has already added chrome.
    // Remove only duplicate icon-close controls; normal Cancel/Back actions stay.
    dialog.querySelectorAll(closeSelector).forEach(button=>{if(button!==close&&button.textContent.trim()==='×')button.remove()});
    dialog.style.resize='both';dialog.style.overflow='auto';makeDraggable(dialog,title);
    dialog.addEventListener('click',event=>{if(event.target===dialog)closeDialog(dialog)});
  }
  const scan=root=>{if(root.matches?.('dialog'))enhance(root);root.querySelectorAll?.('dialog').forEach(enhance)};
  scan(document);new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>node.nodeType===1&&scan(node)))).observe(document.documentElement,{childList:true,subtree:true});
})();
