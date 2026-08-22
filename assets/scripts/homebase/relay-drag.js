(()=>{
  function attach(){
    const panel=document.querySelector('#assistant-window');
    if(!panel||panel.dataset.dragReliable)return;
    panel.dataset.dragReliable='true';
    panel.classList.remove('locked');
    localStorage.setItem('homebase-fortify-locked','false');
    const head=panel.querySelector('header');
    if(!head)return;
    head.style.touchAction='none';
    let drag=null;
    const finish=event=>{
      if(!drag||event.pointerId!==drag.id)return;
      head.releasePointerCapture?.(drag.id);
      drag=null;panel.classList.remove('relay-dragging');
      localStorage.setItem('homebase-relay-position',JSON.stringify({left:Math.round(panel.offsetLeft),top:Math.round(panel.offsetTop)}));
    };
    head.addEventListener('pointerdown',event=>{
      if(event.target.closest('button'))return;
      panel.classList.remove('locked');
      const box=panel.getBoundingClientRect();
      drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:box.left,top:box.top};
      panel.style.right='auto';panel.style.bottom='auto';
      head.setPointerCapture?.(event.pointerId);
      event.preventDefault();event.stopImmediatePropagation();
    },true);
    head.addEventListener('pointermove',event=>{
      if(!drag||event.pointerId!==drag.id)return;
      panel.classList.add('relay-dragging');
      panel.style.left=Math.round(Math.max(8,Math.min(innerWidth-panel.offsetWidth-8,drag.left+event.clientX-drag.x)))+'px';
      panel.style.top=Math.round(Math.max(30,Math.min(innerHeight-panel.offsetHeight-8,drag.top+event.clientY-drag.y)))+'px';
      event.preventDefault();event.stopImmediatePropagation();
    },true);
    head.addEventListener('pointerup',finish,true);head.addEventListener('pointercancel',finish,true);
    try{const saved=JSON.parse(localStorage.getItem('homebase-relay-position')||'null');if(saved){panel.style.left=saved.left+'px';panel.style.top=saved.top+'px';panel.style.right='auto';panel.style.bottom='auto'}}catch{}
  }
  new MutationObserver(attach).observe(document.documentElement,{childList:true,subtree:true});attach();
})();
