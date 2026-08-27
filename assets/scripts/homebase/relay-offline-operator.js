(()=>{
  const json=async(response)=>{const data=await response.json().catch(()=>({}));if(!response.ok)throw Error(data.error||'Local operator is unavailable.');return data};
  const esc=value=>{const node=document.createElement('span');node.textContent=String(value||'');return node.innerHTML};
  const boot=()=>{
    const panel=document.querySelector('#relay-brain');if(!panel||panel.dataset.offlineOperator)return;
    panel.dataset.offlineOperator='true';
    const tabs=panel.querySelector('.relay-brain-tabs');
    const tab=document.createElement('button');tab.type='button';tab.dataset.tab='offline';tab.textContent='OFFLINE OPERATOR';tabs?.insertBefore(tab,tabs.querySelector('[data-tab="routes"]'));
    const pane=document.createElement('div');pane.className='relay-brain-pane relay-offline-operator';pane.dataset.pane='offline';pane.hidden=true;
    pane.innerHTML='<b>LOCAL-ONLY/</b><span>Real NovaShell tools without an AI key or provider call. It can inspect safe local metadata and open built-in screens; it cannot run shell commands, read file contents, or make edits.</span><form><textarea rows="3" placeholder="Try: device brief · show my games · open settings · project board"></textarea><button type="submit">Run local tool</button></form><div class="relay-offline-result" aria-live="polite">Loading local tool registry…</div>';
    panel.append(pane);
    const result=pane.querySelector('.relay-offline-result'),form=pane.querySelector('form'),input=pane.querySelector('textarea');
    const navigate=action=>{if(!action)return;const button=document.createElement('button');button.type='button';button.className='relay-offline-action';button.textContent=action.label||'Open';button.onclick=async()=>{if(action.type==='navigate')parent.openPanel?.(action.target);else if(action.type==='system')parent.document.querySelector('.metric')?.click();else if(action.type==='launch'){button.disabled=true;button.textContent='Launching…';try{const response=await fetch(action.target,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}),data=await response.json();if(!response.ok)throw Error(data.error||'Could not launch Steam Link');button.textContent='Steam Link launched'}catch(error){button.textContent=error.message;button.disabled=false}}};result.append(button)};
    const status=async()=>{try{const data=await json(await fetch('/api/relay/offline-operator/status',{cache:'no-store'}));result.innerHTML='<strong>LOCAL TOOL REGISTRY READY</strong><span>'+esc(data.games)+' owned game file(s) · '+esc(data.apps)+' local app(s) · '+esc(data.board.doing)+' active board task(s)</span><small>No provider, model, or network request is involved.</small>'}catch(error){result.textContent=error.message}};
    form.onsubmit=async event=>{event.preventDefault();const task=input.value.trim(),button=form.querySelector('button');if(!task){input.focus();return}button.disabled=true;result.textContent='Checking the allowlisted local tool registry…';try{const data=await json(await fetch('/api/relay/offline-operator/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task})}));result.innerHTML='<strong>LOCAL RESULT</strong><span>'+esc(data.reply)+'</span><ul>'+((data.trace||[]).map(item=>'<li><b>'+esc(item.tool)+'</b> · '+esc(item.access)+' · '+esc(item.result)+'</li>').join('')||'<li>Policy check complete.</li>')+'</ul><small>Network: blocked by design · no provider was called.</small>';navigate(data.action)}catch(error){result.textContent=error.message}finally{button.disabled=false}};
    status();
  };
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',()=>setTimeout(boot,30),{once:true});else setTimeout(boot,30);
})();
