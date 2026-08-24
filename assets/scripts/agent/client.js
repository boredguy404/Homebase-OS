(()=>{
  const request=async(path,options)=>{const response=await fetch(path,options);const data=await response.json().catch(()=>({}));if(!response.ok)throw Error(data.error||'Local tool request failed');return data};
  window.HomebaseAgent={
    status:()=>request('/api/assistant/status'),tools:()=>request('/api/agent/tools'),taxonomy:()=>request('/api/taxonomy'),
    knowledge:q=>request('/api/relay/knowledge?q='+encodeURIComponent(q||'')),readKnowledge:id=>request('/api/relay/knowledge/'+encodeURIComponent(id)),
    query:(scope,q='')=>request('/api/agent/query?scope='+encodeURIComponent(scope)+'&q='+encodeURIComponent(q)),
    ask:message=>request('/api/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message})}),
    actions:()=>request('/api/relay/actions'),apps:()=>request('/api/user-apps'),draftApp:(description,framework,actionId)=>request('/api/assistant/app/draft',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({description,framework,action_id:actionId})}),createApp:(description,framework,actionId)=>request('/api/assistant/app/draft',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({description,framework,action_id:actionId})}),applyApp:(draftId,actionId,confirm)=>request('/api/assistant/app/apply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({draft_id:draftId,action_id:actionId,confirm})}),deleteApp:(id,confirm)=>request('/api/assistant/app/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,confirm})}),
    workspace:()=>request('/api/relay/workspace'),readCore:id=>request('/api/relay/workspace?file='+encodeURIComponent(id)),
    draftCore:(file,instruction,actionId)=>request('/api/relay/workspace/draft',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({file,instruction,action_id:actionId})}),
    applyCore:(file,content,confirm,actionId)=>request('/api/relay/workspace/apply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({file,content,confirm,action_id:actionId})})
  };
})();
