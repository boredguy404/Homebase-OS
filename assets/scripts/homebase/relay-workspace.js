(() => {
  const request = async (path, options) => {
    const response = await fetch(path, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Error(data.error || 'Local workspace request failed');
    return data;
  };

  const boot = async () => {
    const host = document.querySelector('.console-shell');
    if (!host || document.querySelector('#relay-workspace')) return;
    let files = [];
    try { files = (await request('/api/relay/workspace')).files || []; } catch { return; }

    const panel = document.createElement('section');
    panel.id = 'relay-workspace'; panel.className = 'assistant-terminal relay-workspace';
    panel.innerHTML = '<div><span>RELAY@CORE</span><b> WORKSPACE EDITOR</b></div><p>Review selected NovaShell code here. A model may draft a complete replacement, but only this visible, typed confirmation can write it. Every write creates a timestamped local backup first.</p><select aria-label="Core file"></select><textarea class="relay-task" rows="2" placeholder="Describe the edit for Relay to draft"></textarea><div class="row"><button type="button" data-load>Load</button><button type="button" data-draft disabled>Draft with Relay</button><button type="button" data-save disabled>Review apply step</button></div><textarea class="relay-source" spellcheck="false" placeholder="Choose a file to load its review copy here."></textarea><section class="relay-core-confirm" hidden><b>Apply this complete reviewed file?</b><p>A timestamped local backup is created before the selected allowlisted file changes.</p><label><span>CONFIRM&gt;</span><input autocomplete="off" placeholder="Type APPLY CORE EDIT"></label><div class="row"><button type="button" data-cancel>Cancel</button><button type="button" data-apply>Apply reviewed edit</button></div></section><small class="relay-workspace-note"></small>';
    host.append(panel);
    const select=panel.querySelector('select'),task=panel.querySelector('.relay-task'),area=panel.querySelector('.relay-source'),note=panel.querySelector('.relay-workspace-note'),load=panel.querySelector('[data-load]'),draft=panel.querySelector('[data-draft]'),save=panel.querySelector('[data-save]'),confirmBox=panel.querySelector('.relay-core-confirm'),confirmInput=confirmBox.querySelector('input'),apply=confirmBox.querySelector('[data-apply]');
    let actionId = '';
    select.innerHTML = files.map(file => '<option value="'+file.id+'">'+file.path+'</option>').join('');

    load.onclick = async () => {
      load.disabled=true; note.textContent='Loading a read-only review copy…'; confirmBox.hidden=true; actionId='';
      try { const data=await (window.HomebaseAgent?.readCore?.(select.value)||request('/api/relay/workspace?file='+encodeURIComponent(select.value)));area.value=data.content||'';draft.disabled=false;save.disabled=false;note.textContent='Loaded '+data.path+'. Review it, or ask Relay for a draft.'; }
      catch(error){ note.textContent=error.message; }
      finally{ load.disabled=false; }
    };

    draft.onclick = async () => {
      const instruction=task.value.trim();if(!instruction){task.focus();note.textContent='Describe the edit you want Relay to draft first.';return}if(!area.value){note.textContent='Load a source file first.';return}
      actionId='core-'+crypto.randomUUID().replaceAll('-','').slice(0,16);draft.disabled=true;confirmBox.hidden=true;note.textContent='Stage 1 of 4 · Relay is drafting a complete review copy…';
      try { const data=await (window.HomebaseAgent?.draftCore?.(select.value,instruction,actionId)||request('/api/relay/workspace/draft',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({file:select.value,instruction,action_id:actionId})}));area.value=data.content||area.value;actionId=data.action_id||actionId;note.textContent='Stage 2 of 4 · Draft ready: '+(data.summary||'Review the complete file carefully.');save.disabled=false; }
      catch(error){ note.textContent=error.message; }
      finally{ draft.disabled=false; }
    };

    save.onclick = () => {
      if(!area.value)return;confirmBox.hidden=false;confirmInput.value='';confirmBox.scrollIntoView({behavior:'smooth',block:'center'});confirmInput.focus({preventScroll:true});note.textContent='Stage 3 of 4 · Review the boundary and type the confirmation.';
    };
    confirmBox.querySelector('[data-cancel]').onclick=()=>{confirmBox.hidden=true;confirmInput.value='';note.textContent='Apply cancelled. The review copy remains on screen and no file changed.'};
    apply.onclick = async () => {
      const confirmation=confirmInput.value.trim();if(confirmation!=='APPLY CORE EDIT'){note.textContent='Type APPLY CORE EDIT exactly. Nothing has changed.';confirmInput.focus();return}
      actionId=actionId||'core-'+crypto.randomUUID().replaceAll('-','').slice(0,16);apply.disabled=true;save.disabled=true;note.textContent='Stage 4 of 4 · Creating the backup and saving the reviewed file…';
      try { const data=await (window.HomebaseAgent?.applyCore?.(select.value,area.value,confirmation,actionId)||request('/api/relay/workspace/apply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({file:select.value,content:area.value,confirm:confirmation,action_id:actionId})}));confirmBox.hidden=true;confirmInput.value='';note.textContent='Saved. Local backup: '+data.backup; }
      catch(error){ note.textContent=error.message; }
      finally{ apply.disabled=false;save.disabled=false; }
    };

    document.head.insertAdjacentHTML('beforeend','<style>#relay-workspace{margin-top:14px}#relay-workspace select,#relay-workspace textarea{width:100%;max-width:100%;margin:9px 0}#relay-workspace select{min-height:42px}#relay-workspace textarea{border:1px solid #477084;padding:9px;background:#071016;color:#dff5ff;font:11px ui-monospace,monospace}#relay-workspace .relay-task{min-height:55px;resize:vertical}#relay-workspace .relay-source{min-height:220px;resize:vertical}#relay-workspace .row{display:flex;flex-wrap:wrap;gap:7px}#relay-workspace .row button{min-height:42px}.relay-core-confirm{margin:10px 0;padding:11px;border:1px solid #80dcec;background:#09171d}.relay-core-confirm label{display:flex;align-items:center;gap:8px}.relay-core-confirm input{flex:1;min-height:44px}html[data-theme="ultra-retro"] #relay-workspace textarea{color:#111;background:#fff;border:2px inset #eee}html[data-theme="ultra-retro"] #relay-workspace select{color:#111;background:#d4d4d4}html[data-theme="ultra-retro"] .relay-core-confirm{border:2px inset #eee;background:#d4d4d4;color:#111}</style>');
  };
  addEventListener('DOMContentLoaded', boot, {once:true}); setTimeout(boot, 500);
})();
