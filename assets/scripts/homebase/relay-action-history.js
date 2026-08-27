(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const time = stamp => new Date(Number(stamp) * 1000).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
  const boot = () => {
    const brain = document.querySelector('#relay-brain'), workshop = document.querySelector('.relay-workshop');
    if ((!brain && !workshop) || document.querySelector('#relay-action-history')) return false;
    const panel = document.createElement('section');
    panel.id = 'relay-action-history'; panel.className = 'relay-action-history';
    panel.innerHTML = '<header><div><small>LOCAL ACTION LEDGER</small><h2>Plan → preview → confirm → result</h2><p>Real Relay work only. Stored in ignored local data; keys and file contents are never shown here.</p></div><button type="button" data-refresh>Refresh</button></header><div class="relay-action-groups"><p>Reading the local ledger…</p></div>';
    (brain || workshop).after(panel);
    const host = panel.querySelector('.relay-action-groups');
    let last = '';
    const render = actions => {
      const grouped = new Map();
      actions.forEach(entry => { if (!grouped.has(entry.action_id)) grouped.set(entry.action_id, []); grouped.get(entry.action_id).push(entry); });
      const groups = [...grouped.values()].sort((a,b) => Math.max(...b.map(x=>x.time))-Math.max(...a.map(x=>x.time))).slice(0, 10);
      const signature = JSON.stringify(groups);
      if (signature === last) return; last = signature;
      host.innerHTML = groups.map(entries => {
        const ordered = [...entries].sort((a,b)=>a.time-b.time), latest = ordered.at(-1), failed = ordered.some(entry=>entry.state==='failed');
        return '<button type="button" class="relay-action-card'+(failed?' failed':'')+'" data-action="'+esc(latest.action_id)+'"><span class="relay-action-kind">'+esc(latest.kind)+'</span><span class="relay-action-copy"><b>'+esc(latest.title)+'</b><small>'+esc(latest.detail||'No extra detail')+'</small></span><span class="relay-action-stages">'+['plan','preview','confirm','result'].map(stage=>'<i class="'+(ordered.some(entry=>entry.stage===stage)?'done':'')+'">'+stage+'</i>').join('')+'</span><time>'+time(latest.time)+'</time></button>';
      }).join('') || '<p class="relay-action-empty">No actions yet. Draft an app, test an AI route, review a core edit, or make a selective backup.</p>';
      host.querySelectorAll('[data-action]').forEach(button => button.onclick = () => open(groups.find(entries => entries[0].action_id === button.dataset.action)));
    };
    const dialog = document.createElement('dialog'); dialog.className = 'relay-action-dialog'; dialog.dataset.retroWindow = 'true';
    dialog.innerHTML = '<div class="relay-action-title"><b>RELAY ACTION</b><button type="button" aria-label="Close action details">×</button></div><header><small></small><h2></h2><p></p></header><ol></ol><form class="relay-action-comment"><label>Add owner comment <textarea rows="2" placeholder="Context, approval note, or follow-up…"></textarea></label><button type="submit">Save comment</button><small></small></form>';
    document.body.append(dialog); dialog.querySelector('.relay-action-title button').onclick=()=>dialog.close();dialog.onclick=event=>{if(event.target===dialog)dialog.close()};
    const open = entries => {
      const ordered=[...entries].sort((a,b)=>a.time-b.time),latest=ordered.at(-1);dialog.querySelector('header small').textContent=latest.kind.toUpperCase()+' · '+latest.action_id;dialog.querySelector('h2').textContent=latest.title;dialog.querySelector('header p').textContent=latest.target?'Target: '+latest.target:'Local-only action';dialog.querySelector('ol').innerHTML=ordered.map(entry=>'<li class="'+esc(entry.state)+'"><i>'+esc(entry.stage)+'</i><div><b>'+esc(entry.title)+'</b><p>'+esc(entry.detail||'Stage recorded.')+'</p><time>'+time(entry.time)+'</time></div></li>').join('');dialog.showModal();
      const form=dialog.querySelector('.relay-action-comment'),note=form.querySelector('small');form.onsubmit=async event=>{event.preventDefault();const comment=form.querySelector('textarea').value.trim();if(!comment)return;note.textContent='Saving locally…';try{const response=await fetch('/api/relay/actions/comment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action_id:latest.action_id,comment})}),data=await response.json();if(!response.ok)throw Error(data.error||'Could not save comment');form.querySelector('textarea').value='';note.textContent='Comment saved to the local ledger.';last='';refresh()}catch(error){note.textContent=error.message}};
    };
    const refresh = async () => { try { const response=await fetch('/api/relay/actions',{cache:'no-store'}),data=await response.json();if(!response.ok)throw Error();render(data.actions||[]); } catch { host.innerHTML='<p class="relay-action-empty">Local action history is unavailable. Restart NovaShell and refresh Relay.</p>'; } };
    panel.querySelector('[data-refresh]').onclick=refresh;refresh();setInterval(refresh,1800);return true;
  };
  const wait=()=>{if(!boot())setTimeout(wait,120)};if(document.readyState==='loading')addEventListener('DOMContentLoaded',wait,{once:true});else wait();
})();
