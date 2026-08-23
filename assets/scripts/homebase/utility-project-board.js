(()=>{
  const seed=[
    {id:'project-relay-provider',text:'Relay free/custom provider adapter',lane:'todo',source:'NovaShell build'},
    {id:'project-brain-browser',text:'Relay Brain archive browser and safe navigation',lane:'doing',source:'NovaShell build'},
    {id:'project-components-only',text:'Web Components-only modular app contract',lane:'done',source:'NovaShell build'},
    {id:'project-pwa-refresh',text:'Retro Relay screen and installed-PWA cache refresh',lane:'done',source:'NovaShell build'}
  ];
  const boot=()=>{const board=document.querySelector('#utility-kanban');if(!board||board.dataset.projectBoard)return;board.dataset.projectBoard='true';const note=board.querySelector('small');if(note)note.textContent='Live local work board. Drag cards on desktop or use arrows on touch; your moves persist only in this browser.';const key='homebase-kanban-v1';let tasks=[];try{tasks=JSON.parse(localStorage.getItem(key)||'[]')}catch{};if(!tasks.length){tasks=seed;localStorage.setItem(key,JSON.stringify(tasks))}const stamp=document.createElement('small');stamp.className='project-board-stamp';stamp.textContent='PROJECT FEED · '+new Date().toLocaleString();board.querySelector('h2')?.after(stamp)};
  const wait=()=>{if(document.querySelector('#utility-kanban'))boot();else setTimeout(wait,150)};
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',wait,{once:true});else wait();
})();
