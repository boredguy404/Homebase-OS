(()=>{
  const request=async path=>{const response=await fetch(path);const data=await response.json().catch(()=>({}));if(!response.ok)throw Error(data.error||'Local Brain is unavailable.');return data};
  const boot=async()=>{
    const host=document.querySelector('.console-shell');
    const header=host?.querySelector('header');
    if(!host||!header||document.querySelector('#relay-brain'))return;
    const panel=document.createElement('section');
    panel.id='relay-brain';panel.className='relay-brain-deck';
    panel.innerHTML=`<div class="relay-brain-title"><span class="relay-brain-face" aria-hidden="true">[o_o]</span><b>RELAY BRAIN DECK</b><small>LOCAL MEMORY ONLINE</small></div><p class="relay-brain-lede">A reviewable local harness for NovaShell. Build removable apps, inspect guarded core files, and keep every write backed up.</p><nav class="relay-brain-tabs" aria-label="Relay Brain tools"><button type="button" data-tab="workshop" class="is-active">MODULAR APPS</button><button type="button" data-tab="core">CORE REVIEW</button><button type="button" data-tab="routes">AI ROUTES</button></nav><div class="relay-brain-pane" data-pane="workshop"><b>USER-APPS/</b><span>Prompt Relay to draft a removable utility, then preview or delete it from the same folder.</span><button type="button" data-open="app">Open App Workshop</button></div><div class="relay-brain-pane" data-pane="core" hidden><b>GUARDED CORE/</b><span>Load an allowlisted source file, review a draft, and explicitly confirm before saving. A timestamped backup is made first.</span><button type="button" data-open="core">Open Core Editor</button></div><div class="relay-brain-pane" data-pane="routes" hidden><b>CONFIGURED PROVIDER/</b><span>The local API key configured in AI Connection powers both app drafts and reviewed core drafts. Keys remain on this device.</span><button type="button" data-open="key">Configure AI Connection</button><a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">Get an OpenAI API key ↗</a><small class="relay-brain-notes">Reading Brain conventions…</small></div>`;
    header.after(panel);
    const panes=[...panel.querySelectorAll('[data-pane]')];
    panel.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>{const active=button.dataset.tab;panel.querySelectorAll('[data-tab]').forEach(item=>item.classList.toggle('is-active',item===button));panes.forEach(pane=>pane.hidden=pane.dataset.pane!==active)});
    const reveal=selector=>{document.querySelector(selector)?.scrollIntoView({behavior:'smooth',block:'center'});document.querySelector(selector)?.focus?.()};
    panel.querySelector('[data-open="app"]').onclick=()=>reveal('#app-workshop textarea');
    panel.querySelector('[data-open="core"]').onclick=()=>{reveal('#relay-workspace');document.querySelector('#relay-workspace [data-load]')?.click()};
    panel.querySelector('[data-open="key"]').onclick=()=>reveal('#assistant-key input');
    try{const data=await request('/api/relay/knowledge');panel.querySelector('.relay-brain-notes').textContent=(data.entries||[]).map(item=>item.path).join(' · ')||'No local Brain conventions loaded.'}catch(error){panel.querySelector('.relay-brain-notes').textContent=error.message}
  };
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
