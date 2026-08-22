(()=>{
  if(!document.querySelector('link[href$="assets/styles/shared/ultra-retro.css"]'))document.head.insertAdjacentHTML('beforeend','<link rel="stylesheet" href="/assets/styles/shared/ultra-retro.css"><link rel="stylesheet" href="/assets/styles/shared/modal-global.css">');
  document.addEventListener('click',event=>{if(event.target instanceof HTMLDialogElement&&event.target.open)event.target.close();const overlay=event.target.closest?.('.detail,#uninstall-confirm');if(overlay&&event.target===overlay)overlay.hidden=true});
  const apply=()=>document.documentElement.dataset.theme=localStorage.getItem('nightglass-theme')||'solaris';
  apply();document.title=document.title.replace(/Homebase|Homebase/g,'Homebase');addEventListener('DOMContentLoaded',()=>{const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(node=>node.nodeValue=node.nodeValue.replace(/Homebase|Homebase/g,'Homebase'))});addEventListener('storage',event=>{if(event.key==='nightglass-theme')apply()});
})();
