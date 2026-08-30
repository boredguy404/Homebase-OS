(()=>{
  const $=selector=>document.querySelector(selector);
  const escape=value=>{const node=document.createElement('span');node.textContent=String(value??'');return node.innerHTML};
  const number=value=>Number.isFinite(Number(value))?Number(value):0;
  const showMetrics=harness=>{
    const items=[['LOCAL NOTES',harness.knowledge.entries],['MODULAR APPS',harness.tools.modular_apps],['WORKFLOWS',harness.tools.persistent_workflows],['LEDGER EVENTS',harness.ledger.entries]];
    $('#metrics').innerHTML=items.map(([label,value])=>`<article><small>${escape(label)}</small><b>${escape(number(value))}</b></article>`).join('');
    $('#knowledge-copy').textContent=`${number(harness.knowledge.entries)} indexed notes are visible to Relay. ${number(harness.knowledge.imported)} optional local imports stay read-only.`;
  };
  const workflowTitle=item=>String(item.title||item.task||'Untitled workflow').replace(/\s+/g,' ').replace(/^(Workflow lifecycle validation only:|Create the approved|Make one small reviewed|Create one removable)/i,'').slice(0,74).replace(/[,:;]$/,'');
  const stateLabel=state=>({completed:'completed',planned:'planned',running:'active','needs-review':'needs review',failed:'failed'})[state]||'unknown';
  const showWorkflows=workflows=>{
    const list=Array.isArray(workflows)?workflows:[];
    const recent=list.slice(0,4);
    const counts=list.reduce((all,item)=>{const state=item.state||'unknown';all[state]=(all[state]||0)+1;return all},{});
    const states=['running','planned','needs-review','completed','failed'].filter(state=>counts[state]);
    $('#workflow-summary').innerHTML=states.map(state=>`<span class="${escape(state)}"><b>${escape(number(counts[state]))}</b>${escape(stateLabel(state))}</span>`).join('')||'<span><b>0</b>tracked</span>';
    $('#workflow-copy').innerHTML=recent.length?recent.map(item=>`<div class="state-${escape(item.state||'unknown')}"><b>${escape(workflowTitle(item))}</b><span>${escape(stateLabel(item.state))} · ${escape(item.scope||'local')}</span></div>`).join(''):'No tracked workflows yet.';
  };
  const load=async()=>{
    $('#status').textContent='Refreshing local signal…';
    try{
      const [harnessResponse,workflowResponse]=await Promise.all([fetch('/api/relay/harness',{cache:'no-store'}),fetch('/api/relay/workflows',{cache:'no-store'})]);
      if(!harnessResponse.ok||!workflowResponse.ok)throw Error('The local helper did not return a complete signal.');
      const [harness,workflowPayload]=await Promise.all([harnessResponse.json(),workflowResponse.json()]);
      showMetrics(harness);showWorkflows(workflowPayload.workflows);$('#status').textContent='Local signal is current.';
    }catch(error){$('#status').textContent=error.message+' Start local NovaShell, then refresh.';$('#metrics').innerHTML='';$('#workflow-copy').textContent='No local workflow data is available.';}
  };
  $('#refresh').addEventListener('click',load);load();
})();
