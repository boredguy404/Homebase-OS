(()=>{
  document.head.insertAdjacentHTML('beforeend','<style>html[data-theme="ultra-retro"] .assistant-terminal{background:#d4d4d4!important;color:#111!important}html[data-theme="ultra-retro"] .assistant-terminal>div{background:#000080!important;color:#fff!important}html[data-theme="ultra-retro"] .assistant-terminal>div b,html[data-theme="ultra-retro"] .assistant-terminal>div span{background:transparent!important;color:#fff!important}html[data-theme="ultra-retro"] .assistant-terminal p,html[data-theme="ultra-retro"] .assistant-terminal small,html[data-theme="ultra-retro"] .assistant-terminal label{background:#eee!important;color:#111!important}html[data-theme="ultra-retro"] .assistant-terminal form{background:#d4d4d4!important}</style>');
  const boot=()=>{
    const form=document.querySelector('#assistant-key');if(!form||form.dataset.providerConfig)return false;
    form.dataset.providerConfig='true';
    const terminal=form.closest('.assistant-terminal'),title=terminal?.querySelector(':scope > div');
    if(terminal&&document.documentElement.dataset.theme==='ultra-retro'){terminal.style.setProperty('background','#d4d4d4','important');title?.style.setProperty('background','#000080','important');title?.querySelectorAll('b,span').forEach(node=>{node.style.setProperty('color','#fff','important');node.style.setProperty('background','transparent','important')});terminal.querySelectorAll('p,small,label').forEach(node=>{node.style.setProperty('color','#111','important');node.style.setProperty('background','#eee','important')})}
    document.querySelectorAll('#relay-brain a').forEach(link=>{if(link.href.includes('openrouter.ai'))link.textContent='OpenRouter free models ↗'});
    const input=form.querySelector('input'),button=form.querySelector('button'),note=form.querySelector('#key-status');
    const provider=document.createElement('select');provider.innerHTML='<option value="openai">OpenAI</option><option value="openrouter">OpenRouter · free router</option>';provider.setAttribute('aria-label','AI provider');
    const model=document.createElement('input');model.type='text';model.value='gpt-4.1-mini';model.placeholder='Model';model.setAttribute('aria-label','AI model');
    input.closest('label').before(provider);input.closest('label').after(model);
    const sync=()=>{const free=provider.value==='openrouter';model.value=free?'openrouter/free':'gpt-4.1-mini';model.placeholder=free?'openrouter/free or a :free model':'gpt-4.1-mini';note.textContent=free?'OpenRouter free router selected. It needs an OpenRouter API key and may be rate-limited.':'OpenAI selected. The key remains local to this computer.'};
    provider.onchange=sync;sync();
    form.onsubmit=async event=>{event.preventDefault();if(!input.value.trim()){input.focus();note.textContent='Paste a provider key first.';return}button.disabled=true;note.textContent='Saving provider profile locally…';try{const response=await fetch('/api/assistant/key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:provider.value,key:input.value,model:model.value})}),data=await response.json();if(!response.ok)throw Error(data.error||'Could not save provider');input.value='';note.textContent=data.provider==='openrouter'?'OpenRouter free/custom route is ready locally.':'OpenAI route is ready locally.';document.querySelector('#connection').textContent='AI connected · '+data.model;document.querySelector('#connection').classList.add('online')}catch(error){note.textContent=error.message}finally{button.disabled=false}};
    return true;
  };
  const wait=()=>{if(!boot())setTimeout(wait,120)};
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',wait,{once:true});else wait();
})();
