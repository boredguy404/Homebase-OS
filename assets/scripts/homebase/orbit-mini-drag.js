/* Compact Orbit behaves like a small iOS-style floating player: drag it anywhere,
   release it, and it settles against the closest side without covering the chrome. */
(()=>{
  const key='homebase-orbit-mini-position-v1';
  const gap=12,topSafe=38,bottomSafe=64;
  let active=null,lastDrag=0;
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const player=()=>document.querySelector('#orbit-player:not(.expanded)');
  const saved=()=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
  function place(node,point,animate=false){
    if(!node||node.classList.contains('expanded'))return;
    const box=node.getBoundingClientRect(),maxY=Math.max(topSafe,innerHeight-box.height-bottomSafe),side=point?.side==='left'?'left':'right',y=clamp(Number(point?.top)||box.top,topSafe,maxY);
    node.classList.toggle('mini-docked',animate);node.style.left=(side==='left'?gap:Math.max(gap,innerWidth-box.width-gap))+'px';node.style.top=y+'px';node.style.right='auto';node.style.bottom='auto';
  }
  function restore(){const node=player(),point=saved();if(node&&point)place(node,point,false)}
  function dock(node){const box=node.getBoundingClientRect(),point={side:box.left+box.width/2<innerWidth/2?'left':'right',top:Math.round(clamp(box.top,topSafe,Math.max(topSafe,innerHeight-box.height-bottomSafe)))};place(node,point,true);localStorage.setItem(key,JSON.stringify(point))}
  document.addEventListener('pointerdown',event=>{const handle=event.target.closest?.('#orbit-player:not(.expanded) .orbit-mini');if(!handle||event.target.closest('button'))return;const node=handle.closest('#orbit-player'),box=node.getBoundingClientRect();active={node,id:event.pointerId,x:event.clientX,y:event.clientY,left:box.left,top:box.top,moved:false};handle.setPointerCapture?.(event.pointerId)},true);
  document.addEventListener('pointermove',event=>{if(!active||event.pointerId!==active.id)return;const dx=event.clientX-active.x,dy=event.clientY-active.y;if(!active.moved&&Math.hypot(dx,dy)<7)return;active.moved=true;const {node}=active,box=node.getBoundingClientRect();node.classList.remove('mini-docked');node.classList.add('mini-dragging');node.style.left=clamp(active.left+dx,gap,Math.max(gap,innerWidth-box.width-gap))+'px';node.style.top=clamp(active.top+dy,topSafe,Math.max(topSafe,innerHeight-box.height-bottomSafe))+'px';node.style.right='auto';node.style.bottom='auto';event.preventDefault()},true);
  const finish=event=>{if(!active||event.pointerId!==active.id)return;const {node,moved}=active;active=null;node.classList.remove('mini-dragging');if(moved){dock(node);lastDrag=Date.now()}};
  document.addEventListener('pointerup',finish,true);document.addEventListener('pointercancel',finish,true);
  document.addEventListener('click',event=>{if(Date.now()-lastDrag<500&&event.target.closest?.('#orbit-player')){event.preventDefault();event.stopImmediatePropagation()}},true);
  new MutationObserver(()=>requestAnimationFrame(restore)).observe(document.body,{childList:true,subtree:true});addEventListener('resize',()=>{const node=player();if(node&&saved())place(node,saved(),false)});addEventListener('DOMContentLoaded',restore);
})();
