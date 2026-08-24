(()=>{
  if(!location.pathname.startsWith('/user-apps/'))return;
  const closeApp=event=>{
    event.preventDefault();
    if(parent!==window){
      if(typeof parent.closePocket==='function'){parent.closePocket();return}
      parent.postMessage({type:'homebase-close-panel'},'*');
      return;
    }
    if(history.length>1){history.back();return}
    location.assign('/');
  };
  const mount=()=>{
    let control=document.querySelector('[data-novashell-app-back],a[href="/"],a[href="/index.html"],button.back');
    if(!control){
      control=document.createElement('button');control.type='button';control.className='back';
      const host=document.querySelector('main,body'),firstHeader=host?.querySelector(':scope > header');
      host?.insertBefore(control,firstHeader||host.firstChild);
    }
    if(!control)return;
    control.classList.add('novashell-app-back');control.dataset.novashellAppBack='';
    control.setAttribute('aria-label','Back to NovaShell');control.removeAttribute('onclick');
    if(control.tagName==='A')control.setAttribute('href','/');
    control.replaceChildren();
    const arrow=document.createElement('span');arrow.className='novashell-app-back__arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent='←';
    const label=document.createElement('span');label.className='novashell-app-back__label';label.textContent='NovaShell';
    control.append(arrow,label);control.addEventListener('click',closeApp);
  };
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
