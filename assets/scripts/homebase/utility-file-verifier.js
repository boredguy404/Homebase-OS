(()=>{
  const grid=document.querySelector('.shell .grid');
  if(!grid||document.querySelector('#file-verifier'))return;
  const card=document.createElement('article');card.id='file-verifier';card.className='card wide';
  card.innerHTML='<h2>Local file verifier</h2><small>Make a SHA-256 fingerprint for a ROM, save, download, or backup. The selected file stays on this device and is never uploaded.</small><input id="verify-files" type="file" multiple hidden><div class="row"><button class="primary" id="choose-verify-files">Choose files</button><button id="copy-verify-results" disabled>Copy fingerprints</button></div><div class="verify-results" aria-live="polite">Choose a file to generate its local SHA-256 fingerprint.</div>';
  const notes=[...grid.children].find(node=>node.querySelector?.('#notes'));
  grid.insertBefore(card,notes||null);
  const fileInput=card.querySelector('#verify-files'),results=card.querySelector('.verify-results'),copy=card.querySelector('#copy-verify-results');
  const human=size=>size<1024*1024?(size/1024).toFixed(1)+' KB':(size/1024/1024).toFixed(1)+' MB';
  const hash=async file=>{
    const bytes=await file.arrayBuffer(),digest=await crypto.subtle.digest('SHA-256',bytes);
    return [...new Uint8Array(digest)].map(value=>value.toString(16).padStart(2,'0')).join('');
  };
  card.querySelector('#choose-verify-files').onclick=()=>fileInput.click();
  copy.onclick=async()=>{await navigator.clipboard.writeText([...results.querySelectorAll('code')].map(code=>code.textContent).join('\n'));copy.textContent='Copied';setTimeout(()=>copy.textContent='Copy fingerprints',1300)};
  fileInput.onchange=async()=>{
    const files=[...fileInput.files];if(!files.length)return;
    results.innerHTML='';copy.disabled=true;
    for(const file of files){
      const row=document.createElement('div');row.className='verify-row';row.textContent='Hashing '+file.name+' ('+human(file.size)+')…';results.append(row);
      try{const value=await hash(file);row.innerHTML='<b></b><code></code>';row.querySelector('b').textContent=file.name+' · '+human(file.size);row.querySelector('code').textContent='SHA-256  '+value}catch{row.textContent='Could not read '+file.name+'. Try choosing it again.'}
    }
    copy.disabled=!results.querySelector('code');fileInput.value='';
  };
})();
