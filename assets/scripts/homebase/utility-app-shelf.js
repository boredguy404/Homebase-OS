(()=>{
  const boot=async()=>{
    const grid=document.querySelector('.grid');if(!grid||document.querySelector('#local-app-shelf'))return;
    const card=document.createElement('article');card.id='local-app-shelf';card.className='card wide';
    card.innerHTML='<div class="app-shelf-heading"><div><h2>Local App Shelf</h2><small>Removable tools and experiments installed with NovaShell or created by Relay.</small></div><span>READING…</span></div><div class="app-shelf-groups"><p>Loading local apps…</p></div>';
    grid.append(card);const host=card.querySelector('.app-shelf-groups'),badge=card.querySelector('.app-shelf-heading>span');
    const clean=value=>{const node=document.createElement('span');node.textContent=String(value||'');return node.innerHTML};
    try{
      const data=await fetch('/api/user-apps',{cache:'no-store'}).then(response=>{if(!response.ok)throw Error('App index unavailable');return response.json()});
      const groups={games:[],productivity:[],utilities:[],wellness:[],media:[],reference:[],other:[]};
      for(const app of data.apps||[]){const group=String(app.id||'').split('/')[0];(groups[group]||groups.other).push(app)}
      host.innerHTML=Object.entries(groups).filter(([,apps])=>apps.length).map(([name,apps])=>`<section><h3>${clean(name.toUpperCase())}</h3><div>${apps.map(app=>`<button data-url="${clean(app.url)}"><i>${clean(app.icon||'□')}</i><span><b>${clean(app.name)}</b><small>${clean(app.description)}</small></span><em>OPEN</em></button>`).join('')}</div></section>`).join('');
      badge.textContent=`${(data.apps||[]).length} INSTALLED`;
      host.querySelectorAll('[data-url]').forEach(button=>button.onclick=()=>parent!==window&&parent.openPanel?parent.openPanel(button.dataset.url):location.href=button.dataset.url);
    }catch(error){host.innerHTML=`<p>${clean(error.message)}. Restart the local NovaShell server and try again.</p>`;badge.textContent='OFFLINE'}
  };
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
