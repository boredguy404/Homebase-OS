(()=>{
  const query=matchMedia('(max-width: 760px), (pointer: coarse)');
  const routes=[['⌂','Home',()=>window.closePocket?.()],['▦','Games',()=>window.openPanel?.('/pages/arcade.html')],['⌕','Browse',()=>window.openPanel?.('/pages/browse.html')],['▤','Library',()=>window.openPanel?.('/pages/files.html?path=My%20Library')],['⚙','Settings',()=>window.openPanel?.('/pages/settings.html')]];
  const update=()=>{
    document.documentElement.classList.toggle('novashell-mobile',query.matches);
    if(!query.matches){document.querySelector('#novashell-mobile-nav')?.remove();return}
    if(document.querySelector('#novashell-mobile-nav'))return;
    const nav=document.createElement('nav');nav.id='novashell-mobile-nav';nav.setAttribute('aria-label','NovaShell mobile navigation');
    for(const [icon,label,go] of routes){const button=document.createElement('button');button.type='button';button.innerHTML='<i aria-hidden="true">'+icon+'</i><span>'+label+'</span>';button.onclick=go;nav.append(button)}
    document.body.append(nav);
  };
  query.addEventListener?.('change',update);addEventListener('DOMContentLoaded',update,{once:true});update();
})();
