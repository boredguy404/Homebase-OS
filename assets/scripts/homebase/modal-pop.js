(()=>{
  let origin={x:innerWidth/2,y:innerHeight/2};
  document.addEventListener('pointerdown',event=>{const target=event.target.closest?.('.tile,.game,.app-card,.file,button,a');if(target){const box=target.getBoundingClientRect();origin={x:box.left+box.width/2,y:box.top+box.height/2}}},true);
  new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(!(node instanceof HTMLDialogElement))return;const style=node.style;style.setProperty('--pop-x',Math.max(0,Math.min(innerWidth,origin.x))+'px');style.setProperty('--pop-y',Math.max(0,Math.min(innerHeight,origin.y))+'px');node.classList.add('modal-pop-ready')}))).observe(document.documentElement,{childList:true,subtree:true});
})();
