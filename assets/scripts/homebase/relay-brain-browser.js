(()=>{
  const request=async path=>{const response=await fetch(path);const data=await response.json().catch(()=>({}));if(!response.ok)throw Error(data.error||'Brain file unavailable');return data};
  const boot=async()=>{
    const deck=document.querySelector('#relay-brain');if(!deck||document.querySelector('#relay-brain-browser'))return;
    const pane=deck.querySelector('[data-pane="routes"]');const tabs=deck.querySelector('.relay-brain-tabs');if(!pane||!tabs)return;
    const open=document.createElement('button');open.type='button';open.className='relay-brain-open';open.textContent='BRAIN FILES';tabs.append(open);
    const dialog=document.createElement('dialog');dialog.id='relay-brain-browser';dialog.className='relay-brain-browser';dialog.innerHTML='<div class="brain-browser-title"><b>RELAY BRAIN · READ ONLY</b><button type="button" aria-label="Close Brain browser">×</button></div><p>Imported locally from your Brain archive. Category folders stay visible even when they are empty.</p><div class="brain-browser-grid"><nav aria-label="Brain files"></nav><pre>Select a Brain note to read it here.</pre></div>';
    document.body.append(dialog);dialog.querySelector('.brain-browser-title button').onclick=()=>dialog.close();dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
    const list=dialog.querySelector('nav'),reader=dialog.querySelector('pre');
    const render=async()=>{try{const data=await request('/api/relay/brain-tree');const categories=new Map((data.categories||[]).map(name=>[name,[]]));(data.files||[]).forEach(file=>{const category=file.path.includes('/')?file.path.split('/')[1]:'.';if(!categories.has(category))categories.set(category,[]);categories.get(category).push(file)});list.replaceChildren();for(const [category,files] of categories){const heading=document.createElement('b');heading.textContent=category.toUpperCase()+' /';list.append(heading);if(!files.length){const empty=document.createElement('small');empty.textContent='(empty)';list.append(empty)}files.forEach(file=>{const button=document.createElement('button');button.type='button';button.textContent=file.path;button.onclick=async()=>{reader.textContent='Reading '+file.path+'…';try{const item=await request('/api/relay/brain-file?path='+encodeURIComponent(file.path));reader.textContent=item.content}catch(error){reader.textContent=error.message}};list.append(button)})}}catch(error){reader.textContent=error.message}};
    open.onclick=async()=>{dialog.showModal();await render()};
  };
  const wait=()=>{if(document.querySelector('#relay-brain'))boot();else setTimeout(wait,120)};
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',wait,{once:true});else wait();
})();
