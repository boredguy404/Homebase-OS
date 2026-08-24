/* Stable, one-window task details for the live local Project Board. */
(()=>{
  const esc=value=>String(value??'').replace(/[&<>]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[char]));
  const stage=lane=>({todo:'NEXT UP',doing:'IN PROGRESS',done:'SHIPPED'})[lane]||'LOCAL TASK';
  const stamp=time=>time?new Date(time*1000).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):'just now';
  const plain=value=>String(value||'No update has been recorded yet.').replace(/\b(Codex|API|endpoint|cache|syntax)\b/gi,word=>({codex:'Relay',api:'connection',endpoint:'route',cache:'local copy',syntax:'code check'}[word.toLowerCase()]||word));
  const close=dialog=>{if(dialog?.open)dialog.close();else dialog?.remove()};
  const openTask=async card=>{
    if(card.dataset.opening||document.querySelector('.project-task-dialog[open]'))return;
    card.dataset.opening='true';
    const id=card.dataset.task;
    let task={id,text:card.querySelector('b')?.textContent||'NovaShell task',lane:'todo'},events=[];
    try{const response=await fetch('/api/project-feed',{cache:'no-store'});if(!response.ok)throw Error();const feed=await response.json();task=(feed.tasks||[]).find(item=>item.id===id)||task;events=(feed.events||[]).filter(event=>event.task===id).slice(-3).reverse()}catch{}finally{delete card.dataset.opening}
    if(document.querySelector('.project-task-dialog[open]'))return;
    const dialog=document.createElement('dialog');
    dialog.className='project-task-dialog';dialog.dataset.windowTitle='PROJECT TASK';dialog.dataset.retroWindow='true';
    const updates=events.length?events.map(event=>'<li><time>'+esc(stamp(event.time))+'</time><span>'+esc(plain(event.message))+'</span></li>').join(''):'<li><span>Relay is watching this task locally. The next real change will appear here.</span></li>';
    dialog.innerHTML='<header class="project-task-title"><span>PROJECT TASK</span><button type="button" class="task-x" aria-label="Close task details">×</button></header><main><p class="project-task-lane">'+esc(stage(task.lane))+'</p><h2>'+esc(task.title||task.text)+'</h2><p class="project-task-explainer">This is a local NovaShell work item. Opening it only shows its progress—it does not start, change, or delete anything.</p><section class="project-task-facts"><div><small>STATUS</small><b>'+esc(stage(task.lane))+'</b></div><div><small>LOCATION</small><b>THIS DEVICE</b></div><div><small>UPDATES</small><b>'+events.length+'</b></div></section><h3>Latest updates</h3><ol class="project-task-updates">'+updates+'</ol><section class="project-task-actions"><button type="button" class="task-copy">Copy task</button><button type="button" class="task-relay">Ask Relay</button><button type="button" class="task-close">Close</button></section></main>';
    document.body.append(dialog);
    dialog.querySelector('.task-x').onclick=()=>close(dialog);dialog.querySelector('.task-close').onclick=()=>close(dialog);
    dialog.querySelector('.task-copy').onclick=async()=>{try{await navigator.clipboard.writeText(task.title||task.text);dialog.querySelector('.task-copy').textContent='Copied'}catch{dialog.querySelector('.task-copy').textContent='Copy unavailable'}};
    dialog.querySelector('.task-relay').onclick=()=>{close(dialog);parent.openPanel?.('/pages/console.html?btw='+encodeURIComponent('Give me a clear, non-technical progress update for: '+(task.title||task.text)));};
    dialog.addEventListener('click',event=>{if(event.target===dialog)close(dialog)});dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
  };
  const boot=()=>{const board=document.querySelector('#utility-kanban');if(!board||board.dataset.projectInteraction)return false;board.dataset.projectInteraction='true';board.addEventListener('click',event=>{if(event.target.closest('button,a,input,select,textarea'))return;const card=event.target.closest('.kanban-card[data-task^="project-"]');if(card){event.preventDefault();event.stopPropagation();openTask(card)}});return true};
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',()=>{if(!boot())setTimeout(boot,180)},{once:true});else boot();
})();
