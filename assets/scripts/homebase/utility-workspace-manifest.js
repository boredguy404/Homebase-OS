/* A no-network handoff helper. Browser-selected files never leave this page. */
(()=>{
  const boot=()=>{
    const grid=document.querySelector('.shell .grid');
    if(!grid||document.querySelector('#workspace-handoff'))return;
    document.head.insertAdjacentHTML('beforeend','<style>.workspace-handoff{margin-top:2px}.workspace-handoff .workspace-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.workspace-handoff .workspace-actions button{min-height:42px}.workspace-handoff .manifest-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:14px 0}.workspace-handoff .manifest-summary span{display:grid;gap:3px;padding:10px;border:1px solid #ffffff20;border-radius:9px;background:#0c1115;color:#c8dce4;font:10px ui-monospace,monospace}.workspace-handoff .manifest-summary b{color:#fff;font-size:16px}.workspace-handoff .manifest-list{display:grid;gap:6px;max-height:210px;overflow:auto;padding-right:3px}.workspace-handoff .manifest-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:9px;padding:8px 10px;border:1px solid #ffffff18;border-radius:8px;background:#0c1115;color:#cddbe0;font-size:11px}.workspace-handoff .manifest-row code{overflow:hidden;color:#9ee2c0;text-overflow:ellipsis;white-space:nowrap}.workspace-handoff .manifest-row small{color:#97a8af;white-space:nowrap}.workspace-handoff .manifest-note{min-height:18px;margin:10px 0 0;color:#9ee2c0;font-size:11px}.workspace-handoff details{margin-top:12px;padding:10px;border:1px solid #ffffff1a;border-radius:9px;background:#ffffff06;color:#b6c7cd;font-size:11px}.workspace-handoff summary{cursor:pointer;color:#e9f6fa;font-weight:700}html[data-theme="ultra-retro"] .workspace-handoff .manifest-summary span,html[data-theme="ultra-retro"] .workspace-handoff .manifest-row,html[data-theme="ultra-retro"] .workspace-handoff details{border:2px inset #eee;border-radius:0;background:#eee;color:#111}html[data-theme="ultra-retro"] .workspace-handoff .manifest-summary b,html[data-theme="ultra-retro"] .workspace-handoff summary{color:#000080}html[data-theme="ultra-retro"] .workspace-handoff .manifest-row code,html[data-theme="ultra-retro"] .workspace-handoff .manifest-note{color:#000080}@media(max-width:560px){.workspace-handoff .manifest-summary{grid-template-columns:1fr}.workspace-handoff .manifest-row{grid-template-columns:1fr}.workspace-handoff .manifest-row small{white-space:normal}}</style>');
    const card=document.createElement('article');
    card.id='workspace-handoff';card.className='card wide workspace-handoff';
    card.innerHTML='<h2>Workspace handoff</h2><small>Make a portable inventory for a folder, backup, or game set. NovaShell hashes files in this browser and never uploads their contents.</small><input id="workspace-folder" type="file" webkitdirectory multiple hidden><div class="workspace-actions"><button class="primary" id="workspace-pick">Choose a folder</button><button id="workspace-copy" disabled>Copy manifest</button><button id="workspace-save" disabled>Download JSON</button><button id="workspace-clear" disabled>Clear</button></div><div class="manifest-summary" aria-live="polite"><span><b id="manifest-files">—</b>FILES</span><span><b id="manifest-size">—</b>TOTAL SIZE</span><span><b id="manifest-state">WAITING</b>LOCAL STATUS</span></div><div class="manifest-list" id="manifest-list">Choose a folder to create a local, portable manifest.</div><details><summary>What this includes</summary>Relative filenames, byte sizes, modified timestamps, and SHA-256 fingerprints. It excludes file contents, browser data, secrets, and any absolute path. A manifest helps compare a copied folder or explain exactly what was handed off.</details><p class="manifest-note" id="manifest-note"></p>';
    const place=()=>{const snapshot=grid.querySelector('.card.wide');if(snapshot)snapshot.after(card);else grid.prepend(card)};
    place();setTimeout(place,220);
    const $=selector=>card.querySelector(selector),picker=$('#workspace-folder'),list=$('#manifest-list'),copy=$('#workspace-copy'),save=$('#workspace-save'),clear=$('#workspace-clear');
    let manifest=null;
    const bytes=value=>value<1024?value+' B':value<1024**2?(value/1024).toFixed(1)+' KB':value<1024**3?(value/1024**2).toFixed(1)+' MB':(value/1024**3).toFixed(2)+' GB';
    const digest=async file=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))].map(value=>value.toString(16).padStart(2,'0')).join('');
    const stamp=value=>new Date(value).toISOString();
    const render=()=>{
      if(!manifest)return;
      $('#manifest-files').textContent=String(manifest.files.length);$('#manifest-size').textContent=bytes(manifest.totalBytes);$('#manifest-state').textContent='READY';
      list.replaceChildren();
      manifest.files.slice(0,32).forEach(file=>{const row=document.createElement('div');row.className='manifest-row';const path=document.createElement('code');path.textContent=file.path;const info=document.createElement('small');info.textContent=bytes(file.bytes)+' · '+file.sha256.slice(0,12)+'…';row.append(path,info);list.append(row)});
      if(manifest.files.length>32){const rest=document.createElement('small');rest.textContent='Showing 32 of '+manifest.files.length+' files. The download includes every selected item.';list.append(rest)}
    };
    const reset=()=>{manifest=null;picker.value='';$('#manifest-files').textContent='—';$('#manifest-size').textContent='—';$('#manifest-state').textContent='WAITING';list.textContent='Choose a folder to create a local, portable manifest.';$('#manifest-note').textContent='';[copy,save,clear].forEach(button=>button.disabled=true)};
    $('#workspace-pick').onclick=()=>picker.click();
    picker.onchange=async()=>{
      const files=[...picker.files];if(!files.length)return;[copy,save].forEach(button=>button.disabled=true);clear.disabled=false;$('#manifest-files').textContent=String(files.length);$('#manifest-size').textContent=bytes(files.reduce((total,file)=>total+file.size,0));$('#manifest-state').textContent='HASHING';list.textContent='Reading selected files locally…';$('#manifest-note').textContent='Hashing one file at a time to keep this Chromebook responsive.';
      const entries=[];
      try{
        for(let index=0;index<files.length;index++){
          const file=files[index];$('#manifest-state').textContent=(index+1)+' / '+files.length;$('#manifest-note').textContent='Fingerprinting '+file.webkitRelativePath+'…';
          entries.push({path:file.webkitRelativePath||file.name,bytes:file.size,modified:stamp(file.lastModified),sha256:await digest(file)});
        }
        manifest={format:'novashell-workspace-manifest/v1',created:stamp(Date.now()),files:entries,totalBytes:entries.reduce((total,file)=>total+file.bytes,0)};
        render();[copy,save].forEach(button=>button.disabled=false);$('#manifest-note').textContent='Ready. Keep this JSON with the copied folder, backup, or support handoff.';
      }catch(error){reset();$('#manifest-note').textContent='Could not read that folder. Try a smaller selection or choose it again.'}
    };
    copy.onclick=async()=>{if(!manifest)return;try{await navigator.clipboard.writeText(JSON.stringify(manifest,null,2));copy.textContent='Copied';setTimeout(()=>copy.textContent='Copy manifest',1200)}catch{$('#manifest-note').textContent='Clipboard access was unavailable. Download the JSON instead.'}};
    save.onclick=()=>{if(!manifest)return;const fileName='novashell-workspace-manifest-'+new Date().toISOString().slice(0,10)+'.json',url=URL.createObjectURL(new Blob([JSON.stringify(manifest,null,2)+'\n'],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=fileName;link.click();setTimeout(()=>URL.revokeObjectURL(url),500);$('#manifest-note').textContent='Downloaded '+fileName+'.'};
    clear.onclick=reset;
  };
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
