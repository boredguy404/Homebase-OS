/* One transaction owner for private ROM intake. The catalog identity is based
   on the server-returned file location, never merely on the display title. */
(()=>{
  const form=document.querySelector('#game-import');if(!form)return;
  const status=document.querySelector('#status'),button=form.querySelector('.submit');
  const slug=value=>value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'game';
  async function upload(file,kind,id){
    if(!file)return{skipped:true};status.textContent=`Adding ${file.name}…`;
    const response=await fetch(`/api/game-import/file?kind=${kind}`,{method:'POST',headers:{'X-Homebase-Local':'1','X-File-Name':encodeURIComponent(file.name),'X-Game-Slug':id},body:file}),result=await response.json().catch(()=>({}));
    if(response.status===409)return{existing:true,...result};
    if(!response.ok)throw Error(result.error||`Could not import ${file.name}`);return result;
  }
  form.onsubmit=async event=>{
    event.preventDefault();const rom=document.querySelector('#rom').files[0];if(!rom){status.textContent='Choose an owned game file first.';return}
    const data=Object.fromEntries(new FormData(form)),id=slug(data.title);button.disabled=true;button.textContent='Importing…';
    try{
      const romResult=await upload(rom,'rom',id);if(!romResult.path)throw Error('The local server did not return the imported game location.');
      const artResults=await Promise.all([['cover','cover'],['preview1','preview1'],['preview2','preview2']].map(([element,kind])=>upload(document.querySelector('#'+element).files[0],kind,id)));
      const relative=String(romResult.path).replace(/^roms\//,''),payload={...data,system:data.system==='Auto detect'?'':data.system,slug:id,rom_name:relative.split('/').pop(),catalog_key:'roms:'+relative,source_path:relative};
      status.textContent=romResult.existing?'Game already present · updating its private catalog card…':'Saving the private catalog card…';
      const response=await fetch('/api/game-import/metadata',{method:'POST',headers:{'Content-Type':'application/json','X-Homebase-Local':'1'},body:JSON.stringify(payload)}),result=await response.json().catch(()=>({}));if(!response.ok)throw Error(result.error||'Could not save game details.');
      const kept=artResults.filter(item=>item.existing).length;status.replaceChildren(document.createTextNode((romResult.existing?'Existing game linked; details updated.':'Imported with its catalog details.')+(kept?` ${kept} existing artwork file${kept===1?' was':'s were'} kept.`:'')+' '));
      const open=document.createElement('button');open.type='button';open.className='open-existing';open.textContent='Open it in Pocket Archive';open.onclick=()=>parent!==window&&parent.openPanel?parent.openPanel('/pages/arcade.html'):location.href='/pages/arcade.html';status.append(open);button.textContent='Saved ✓';
    }catch(error){status.textContent=error.message;button.disabled=false;button.textContent='Import into Pocket Archive'}
  };
})();
