/* Archive owns normal document scrolling when no game player is open. */
(()=>{
  let settling=false;
  const restore=()=>{
    if(settling)return;
    const player=document.querySelector('#player');
    if(player&&getComputedStyle(player).display!=='none')return;
    settling=true;
    for(const node of [document.documentElement,document.body]){
      node.style.removeProperty('height');node.style.removeProperty('max-height');
      node.style.removeProperty('position');node.style.removeProperty('overflow');
      node.style.overflowY='auto';node.style.overflowX='clip';
      node.style.overscrollBehaviorY='auto';node.style.webkitOverflowScrolling='touch';
    }
    document.body.style.touchAction='pan-y';
    document.scrollingElement?.classList.add('pocket-scroll-owner');
    requestAnimationFrame(()=>settling=false);
  };
  addEventListener('DOMContentLoaded',restore);addEventListener('pageshow',restore);
  addEventListener('focus',restore,true);addEventListener('pointerup',restore,{passive:true});
  new MutationObserver(restore).observe(document.body,{attributes:true,attributeFilter:['style'],subtree:false});
  setInterval(restore,1000);
})();
