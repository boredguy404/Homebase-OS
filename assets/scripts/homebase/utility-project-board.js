/* Local server-backed build feed. Project cards are refreshed in place while
   personal cards remain local-only and editable in the regular board. */
(()=>{
  const key='homebase-kanban-v1';
  const stamp=time=>new Date((time||Date.now()/1000)*1000).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
  const mergeTasks=remote=>{
    let local=[];try{local=JSON.parse(localStorage.getItem(key)||'[]')}catch{}
    const personal=local.filter(task=>!String(task.id||'').startsWith('project-'));
    localStorage.setItem(key,JSON.stringify([...(remote||[]),...personal]));
    window.dispatchEvent(new Event('homebase-kanban-refresh'));
  };
  const boot=()=>{
    const board=document.querySelector('#utility-kanban');if(!board||board.dataset.liveProjectFeed)return false;
    board.dataset.liveProjectFeed='true';
    document.head.insertAdjacentHTML('beforeend','<style>.project-board-stamp{margin:0 0 9px!important;color:#8fe6ef!important;font:700 10px ui-monospace,monospace!important;letter-spacing:.11em}#utility-kanban .kanban-card[data-task^="project-"]{cursor:default}#utility-kanban .kanban-card[data-task^="project-"]>div{display:none}.relay-build-log{margin:16px 0 0;padding:12px;border:1px solid #ffffff25;border-radius:10px;background:#081115}.relay-build-log h3{margin:0 0 7px;font:700 11px ui-monospace,monospace;letter-spacing:.1em;color:#a9f0f5}.relay-build-log p{margin:0 0 10px;color:#b9d5d8;font-size:11px}.relay-build-events{display:grid;gap:6px;max-height:172px;overflow:auto}.relay-build-event{display:grid;grid-template-columns:auto 1fr;gap:8px;padding:7px 8px;border-left:2px solid #72dce7;background:#ffffff08;color:#d5eff1;font-size:11px}.relay-build-event time{color:#8de7f0;font:10px ui-monospace,monospace}.relay-build-event span{overflow-wrap:anywhere}html[data-theme="ultra-retro"] .project-board-stamp{color:#000080!important}html[data-theme="ultra-retro"] .relay-build-log{border:2px inset #eee;border-radius:0;background:#fff;color:#111}html[data-theme="ultra-retro"] .relay-build-log h3{color:#000080}html[data-theme="ultra-retro"] .relay-build-log p{color:#111}html[data-theme="ultra-retro"] .relay-build-event{border-left-color:#000080;background:#eee;color:#111}html[data-theme="ultra-retro"] .relay-build-event time{color:#000080}</style>');
    const note=board.querySelector('small');if(note)note.textContent='Live build status comes from this NovaShell machine. Personal cards still stay in this browser.';
    const title=board.querySelector('h2');const projectStamp=document.createElement('small');projectStamp.className='project-board-stamp';projectStamp.textContent='RELAY BUILD FEED · connecting…';title?.after(projectStamp);
    const log=document.createElement('section');log.className='relay-build-log';log.innerHTML='<h3>RELAY BUILD LOG · ONE WAY</h3><p>Actual implementation milestones arrive automatically while the local project is being worked on.</p><div class="relay-build-events" aria-live="polite"><div class="relay-build-event"><time>…</time><span>Connecting to local build feed…</span></div></div>';
    board.append(log);
    const render=feed=>{
      mergeTasks(feed.tasks);
      projectStamp.textContent='RELAY BUILD FEED · updated '+stamp(feed.updated)+' · auto-refreshing';
      const events=log.querySelector('.relay-build-events');events.replaceChildren();(feed.events||[]).slice().reverse().forEach(event=>{const row=document.createElement('div');row.className='relay-build-event';const time=document.createElement('time'),text=document.createElement('span');time.textContent=stamp(event.time);text.textContent=event.message;row.append(time,text);events.append(row)});
    };
    const poll=async()=>{try{const response=await fetch('/api/project-feed',{cache:'no-store'});if(!response.ok)throw Error();render(await response.json())}catch{projectStamp.textContent='RELAY BUILD FEED · local server unavailable'}finally{setTimeout(poll,3500)}};
    poll();
    if(location.hash==='#project-board')requestAnimationFrame(()=>board.scrollIntoView({block:'start',behavior:'smooth'}));
    return true;
  };
  const wait=()=>{if(!boot())setTimeout(wait,120)};
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',wait,{once:true});else wait();
})();
