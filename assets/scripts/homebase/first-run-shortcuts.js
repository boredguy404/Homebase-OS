(()=>{
  const destinations=[
    ['□','My Library','Browse files, folders, saves, and imports.','/pages/files.html?path=My%20Library'],
    ['◫','Add owned games','Open the private ROM, BIOS, art, and controller setup guide.','/pages/game-setup.html'],
    ['▣','Backup & restore','Export or selectively restore NovaShell data.','/pages/settings.html?panel=backup'],
    ['⌁','Controller help','Review Xbox navigation and controller diagnostics.','/pages/settings.html?panel=play']
  ];
  function open(path){
    const dialog=document.querySelector('#first-run');
    dialog?.close();dialog?.remove();
    if(typeof window.openPanel==='function')window.openPanel(path);
    else location.assign(path);
  }
  function enhance(dialog){
    if(!dialog||dialog.dataset.shortcuts)return;
    dialog.dataset.shortcuts='true';
    const last=dialog.querySelector('[data-step="2"]');if(!last)return;
    const section=document.createElement('section');section.className='setup-shortcuts';
    section.innerHTML='<b>START HERE WHEN YOU ENTER</b><div></div><small>These stay available from the desktop—this is simply the quickest first route.</small>';
    const list=section.querySelector('div');
    destinations.forEach(([icon,title,copy,path])=>{const button=document.createElement('button');button.type='button';button.className='setup-shortcut';button.innerHTML='<i aria-hidden="true"></i><span><b></b><small></small></span><em aria-hidden="true">›</em>';button.querySelector('i').textContent=icon;button.querySelector('b').textContent=title;button.querySelector('small').textContent=copy;button.onclick=()=>open(path);list.append(button)});
    last.querySelector('#setup-enter')?.before(section);
  }
  const observe=()=>new MutationObserver(()=>enhance(document.querySelector('#first-run'))).observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',observe,{once:true});else observe();
})();
