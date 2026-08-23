/* Keep the game shelf in normal document flow. This intentionally avoids
   style observers and timers: mutating the attributes being observed was able
   to cause an endless mutation loop on lower-power Chromebooks. */
(()=>{
  const restore=()=>{
    const player=document.querySelector('#player');
    if(player&&getComputedStyle(player).display!=='none')return;
    document.documentElement.classList.add('pocket-scroll-owner');
    document.documentElement.style.overflowY='auto';
    document.body.style.overflowY='auto';
    document.body.style.touchAction='pan-y';
  };
  addEventListener('DOMContentLoaded',restore,{once:true});
  addEventListener('pageshow',restore);
  addEventListener('focus',restore,true);
})();
