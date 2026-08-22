/* Pixel Field must be the final canvas pass: the peek player is deliberately
   wide and short, so fixed 2px cells reveal the actual pattern instead of
   four oversized rows inherited from the compact renderer. */
(() => {
  let signal={energy:.08,bass:.05,treble:.04,beat:0};
  addEventListener('message',event=>{if(event.data?.type==='orbit-energy')signal={...signal,...(event.data.signal||{})}});
  const unit=value=>Math.max(0,Math.min(1,Number(value)||0));
  function paint(now){
    const player=document.querySelector('#orbit-player:not(.expanded)');
    const canvas=player?.querySelector('.orbit-mini-canvas');
    const visual=player?.dataset.visual||localStorage.getItem('radio-visual');
    if(canvas&&visual==='pixel'&&player.classList.contains('peek')){
      const bounds=canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2);
      const width=Math.max(1,Math.round(bounds.width)),height=Math.max(1,Math.round(bounds.height));
      if(canvas.width!==width*ratio||canvas.height!==height*ratio){canvas.width=width*ratio;canvas.height=height*ratio}
      const ctx=canvas.getContext('2d'),retro=document.documentElement.dataset.theme==='ultra-retro';
      const e=unit(signal.energy),bass=unit(signal.bass),treble=unit(signal.treble),beat=unit(signal.beat);
      const rgb=(getComputedStyle(document.documentElement).getPropertyValue('--signal-rgb')||'91,213,255').trim();
      ctx.setTransform(ratio,0,0,ratio,0,0);ctx.globalAlpha=1;
      ctx.fillStyle=retro?'#9eb6c9':'#071019';ctx.fillRect(0,0,width,height);
      const cell=2,threshold=.47-e*.30-bass*.20-beat*.12;
      for(let y=0;y<height;y+=cell)for(let x=0;x<width;x+=cell){
        const field=e+bass*Math.sin(x*.18+now*(.004+bass*.012))+treble*Math.cos(y*.28-now*.007)+beat*Math.sin((x+y)*.12+now*.019);
        if(field>threshold+((x/cell+y/cell)%7)*.014){
          ctx.fillStyle=retro?(field>threshold+.32?'#000080':'#111'):`rgba(${rgb},${Math.min(1,.15+(field-threshold)*1.6+beat*.18)})`;
          ctx.fillRect(x,y,1,1);
        }
      }
    }
    requestAnimationFrame(paint);
  }
  requestAnimationFrame(paint);
})();
