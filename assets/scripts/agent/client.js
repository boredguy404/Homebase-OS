(()=>{
  const request=async(path,options)=>{const response=await fetch(path,options);const data=await response.json().catch(()=>({}));if(!response.ok)throw Error(data.error||'Local tool request failed');return data};
  window.HomebaseAgent={
    status:()=>request('/api/assistant/status'),tools:()=>request('/api/agent/tools'),taxonomy:()=>request('/api/taxonomy'),
    knowledge:q=>request('/api/relay/knowledge?q='+encodeURIComponent(q||'')),readKnowledge:id=>request('/api/relay/knowledge/'+encodeURIComponent(id)),
    query:(scope,q='')=>request('/api/agent/query?scope='+encodeURIComponent(scope)+'&q='+encodeURIComponent(q)),
    ask:message=>request('/api/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message})}),
    apps:()=>request('/api/user-apps'),createApp:(description,framework)=>request('/api/assistant/app',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({description,framework})}),deleteApp:(id,confirm)=>request('/api/assistant/app/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,confirm})}),
    workspace:()=>request('/api/relay/workspace'),readCore:id=>request('/api/relay/workspace?file='+encodeURIComponent(id)),
    draftCore:(file,instruction)=>request('/api/relay/workspace/draft',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({file,instruction})}),
    applyCore:(file,content,confirm)=>request('/api/relay/workspace/apply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({file,content,confirm})})
  };
})();
