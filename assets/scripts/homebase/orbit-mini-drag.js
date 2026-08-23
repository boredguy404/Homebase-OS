/* Compact Orbit is draggable, with four edge docks plus deliberate top/bottom
   center docks. A saved center point must never be reinterpreted as right. */
(()=>{
  const key='homebase-orbit-mini-position-v1',gap=12,topSafe=38,bottomSafe=64;
  let active=null,lastDrag=0;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const player=()=>document.querySelector('#orbit-player:not(.expanded)');
  const saved=()=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
  function place(node,point,animate=false){
    if(!node||node.classList.contains('expanded'))return;
    const box=node.getBoundingClientRect(),maxX=Math.max(gap,innerWidth-box.width-gap),maxY=Math.max(topSafe,innerHeight-box.height-bottomSafe);
    const side=point?.side||'right',vertical=point?.vertical||'free';
    const left=side==='left'?gap:side==='center'?clamp((innerWidth-box.width)/2,gap,maxX):maxX;
    const top=vertical==='top'?topSafe:vertical==='bottom'?maxY:clamp(Number(point?.top)||box.top,topSafe,maxY);
    node.classList.toggle('mini-docked',animate);node.style.left=Math.round(left)+'px';node.style.top=Math.round(top)+'px';node.style.right='auto';node.style.bottom='auto';
  }
  function restore(){const node=player(),point=saved();if(node&&point)place(node,point,false)}
  function dock(node){
    const box=node.getBoundingClientRect(),maxY=Math.max(topSafe,innerHeight-box.height-bottomSafe),centerX=(innerWidth-box.width)/2;
    const isLeft=box.left+box.width/2<innerWidth/2;
    const targets=[
      {side:'left',vertical:'free',x:gap,y:box.top},{side:'right',vertical:'free',x:innerWidth-box.width-gap,y:box.top},
      {side:'center',vertical:'top',x:centerX,y:topSafe},{side:'center',vertical:'bottom',x:centerX,y:maxY},
      {side:isLeft?'left':'right',vertical:'top',x:isLeft?gap:innerWidth-box.width-gap,y:topSafe},
      {side:isLeft?'left':'right',vertical:'bottom',x:isLeft?gap:innerWidth-box.width-gap,y:maxY}
    ];
    const target=targets.map(item=>({...item,distance:Math.hypot(box.left-item.x,box.top-item.y)})).sort((a,b)=>a.distance-b.distance)[0];
    const point={side:target.side,vertical:target.vertical,top:Math.round(clamp(box.top,topSafe,maxY))};
    place(node,point,true);localStorage.setItem(key,JSON.stringify(point));
  }
  document.addEventListener('pointerdown',event=>{
    const handle=event.target.closest?.('#orbit-player:not(.expanded) .orbit-mini');if(!handle||event.target.closest('button'))return;
    const node=handle.closest('#orbit-player'),box=node.getBoundingClientRect();node.classList.remove('mini-peek-centered');
    active={node,id:event.pointerId,x:event.clientX,y:event.clientY,left:box.left,top:box.top,moved:false};handle.setPointerCapture?.(event.pointerId);
  },true);
  document.addEventListener('pointermove',event=>{
    if(!active||event.pointerId!==active.id)return;const dx=event.clientX-active.x,dy=event.clientY-active.y;
    if(!active.moved&&Math.hypot(dx,dy)<7)return;active.moved=true;const {node}=active,box=node.getBoundingClientRect();node.classList.remove('mini-docked');node.classList.add('mini-dragging');
    node.style.left=clamp(active.left+dx,gap,Math.max(gap,innerWidth-box.width-gap))+'px';node.style.top=clamp(active.top+dy,topSafe,Math.max(topSafe,innerHeight-box.height-bottomSafe))+'px';node.style.right='auto';node.style.bottom='auto';event.preventDefault();
  },true);
  const finish=event=>{if(!active||event.pointerId!==active.id)return;const {node,moved}=active;active=null;node.classList.remove('mini-dragging');if(moved){dock(node);lastDrag=Date.now()}};
  document.addEventListener('pointerup',finish,true);document.addEventListener('pointercancel',finish,true);
  document.addEventListener('click',event=>{if(Date.now()-lastDrag<500&&event.target.closest?.('#orbit-player')){event.preventDefault();event.stopImmediatePropagation()}},true);
  document.addEventListener('click',event=>{const mini=event.target.closest?.('#orbit-player:not(.expanded) .orbit-mini');if(mini&&!event.target.closest('button'))setTimeout(()=>mini.closest('#orbit-player')?.classList.toggle('mini-peek-centered',mini.closest('#orbit-player')?.classList.contains('peek')),0);else if(!event.target.closest?.('#orbit-player'))document.querySelector('#orbit-player')?.classList.remove('mini-peek-centered')});
  new MutationObserver(()=>requestAnimationFrame(restore)).observe(document.body,{childList:true,subtree:true});addEventListener('resize',restore);addEventListener('DOMContentLoaded',restore);
})();
