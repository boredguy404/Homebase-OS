/* Keeps Utility Desk’s visible summary tied to the current local API shape. */
(()=>{
  const boot=()=>{
    const $=selector=>document.querySelector(selector),refreshButton=$('#refresh');
    if(!refreshButton||refreshButton.dataset.liveSnapshot)return;
    refreshButton.dataset.liveSnapshot='true';
    async function refresh(){
      try{
        const [insights,apps,games,assistant]=await Promise.all([
          fetch('/api/insights',{cache:'no-store'}).then(response=>response.json()),
          fetch('/api/apps').then(response=>response.json()),
          fetch('/api/games').then(response=>response.json()),
          fetch('/api/assistant/status').then(response=>response.json())
        ]);
        const memory=insights.memory||{},disk=insights.disk||{};
        $('#memory').textContent=memory.MemTotal&&memory.MemAvailable?Math.round((memory.MemTotal-memory.MemAvailable)/memory.MemTotal*100)+'% used':'Unavailable';
        $('#storage').textContent=disk.free!=null?(disk.free/1073741824).toFixed(1)+' GB free':'Unavailable';
        $('#load').textContent=Array.isArray(insights.load)?Number(insights.load[0]).toFixed(2)+' load':'Unavailable';
        $('#games').textContent=Array.isArray(games)?games.length+' found':'—';
        $('#apps').textContent=Array.isArray(apps)?apps.length+' found':'—';
        $('#relay').textContent=assistant.connected?'AI ready':'Local guide';
        $('#snapshot-note').textContent='Updated '+new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})+' · actual local readings.';
      }catch{$('#snapshot-note').textContent='Local server unavailable. Restart NovaShell, then refresh.'}
    }
    refreshButton.onclick=refresh;refresh();
  };
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
