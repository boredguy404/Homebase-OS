(()=>{
  const boot=()=>{
    const pane=document.querySelector('#relay-brain [data-pane="brain"]');if(!pane||pane.querySelector('.brain-launcher'))return;
    const card=document.createElement('div');card.className='brain-launcher';card.innerHTML='<div><b>BROWSE THE SECOND BRAIN</b><span>Searchable local context, decisions, conventions, and imported notes. Read-only by design.</span></div><button type="button">Open browser</button><small>Loading note index…</small>';
    pane.append(card);const button=card.querySelector('button'),note=card.querySelector('small');button.onclick=()=>{if(parent!==window&&parent.openPanel)parent.openPanel('/pages/second-brain.html');else location.href='/pages/second-brain.html'};
    fetch('/api/relay/knowledge',{cache:'no-store'}).then(response=>response.json()).then(data=>{const entries=data.entries||[],imports=entries.filter(item=>item.source==='Optional local import').length;note.textContent=entries.length+' indexed notes · '+imports+' local import'+(imports===1?'':'s')+' · no hidden authority.'}).catch(()=>note.textContent='Note index unavailable — restart NovaShell, then try again.');
  };const wait=()=>document.querySelector('#relay-brain')?boot():setTimeout(wait,100);if(document.readyState==='loading')addEventListener('DOMContentLoaded',wait,{once:true});else wait();
})();
