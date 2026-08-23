(()=>{
  const seed=[
    {id:'project-game-library',text:'Catalog editing for local and Library ROMs',lane:'done',source:'NovaShell build'},
    {id:'project-relay-brain',text:'Relay Brain files, provider profiles, and safe component boundary',lane:'done',source:'NovaShell build'},
    {id:'project-kanban',text:'Visible local project board with touch-friendly status controls',lane:'done',source:'NovaShell build'},
    {id:'project-public-docs',text:'Refresh the public guide and safe, pixel-blurred product captures',lane:'doing',source:'NovaShell build'},
    {id:'project-visual-qa',text:'Finish visual QA for Browse, Pocket Archive, and Settings',lane:'todo',source:'NovaShell build'}
  ];
  const boot=()=>{const board=document.querySelector('#utility-kanban');if(!board||board.dataset.projectBoard)return;board.dataset.projectBoard='true';const note=board.querySelector('small');if(note)note.textContent='Project delivery board. Move cards as work changes; your own cards and changes stay in this browser.';const key='homebase-kanban-v1',versionKey='homebase-project-board-version';let tasks=[];try{tasks=JSON.parse(localStorage.getItem(key)||'[]')}catch{};if(localStorage.getItem(versionKey)!=='2'){const personal=tasks.filter(task=>!String(task.id||'').startsWith('project-'));tasks=[...seed,...personal];localStorage.setItem(key,JSON.stringify(tasks));localStorage.setItem(versionKey,'2');window.dispatchEvent(new Event('homebase-kanban-refresh'))}const stamp=document.createElement('small');stamp.className='project-board-stamp';stamp.textContent='LOCAL PROJECT FEED · '+new Date().toLocaleString();board.querySelector('h2')?.after(stamp);if(location.hash==='#project-board')requestAnimationFrame(()=>board.scrollIntoView({block:'start',behavior:'smooth'}))};
  const wait=()=>{if(document.querySelector('#utility-kanban'))boot();else setTimeout(wait,150)};
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',wait,{once:true});else wait();
})();
