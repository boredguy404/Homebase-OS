(()=>{
  const key='homebase-fake-virus-enabled';
  const enabled=()=>localStorage.getItem(key)==='true';
  const visible=()=>document.visibilityState==='visible'&&document.documentElement.dataset.theme==='ultra-retro';
  const messages=[
    ['TOTALLY REAL ALERT','Your beige desktop has been identified as dangerously retro. No action has been taken.'],
    ['RAM ACQUISITION FAILED','The internet refuses to mail you more RAM through this button. Frankly, rude.'],
    ['FAKE VIRUS DETECTED','It is this popup. It has been contained inside a joke.'],
    ['SYSTEM NOTICE','Your files are fine. Your computer is merely being dramatic.']
  ];
  let timer=0, active=false;
  function remove(){document.querySelector('#fake-virus-lab')?.remove();active=false}
  function show(force=false){
    if(active||(!force&&!enabled())||!visible())return;
    active=true;
    const [title,copy]=messages[Math.floor(Math.random()*messages.length)];
    const box=document.createElement('section');
    box.id='fake-virus-lab'; box.setAttribute('role','dialog'); box.setAttribute('aria-modal','true');
    box.innerHTML='<div class="fake-virus-window"><button class="fake-virus-close" aria-label="Close fake alert">×</button><b class="fake-virus-title">'+title+'</b><p>'+copy+'</p><small>FAKE ALERT · LOCAL ONLY · NOTHING HAS CHANGED</small><button class="fake-virus-ok">Okay, machine</button></div>';
    document.body.append(box);
    box.querySelectorAll('button').forEach(button=>button.onclick=remove);
    setTimeout(()=>box.classList.add('show'),20);
  }
  function schedule(){clearTimeout(timer);if(!enabled())return;timer=setTimeout(()=>{show();schedule()},45000+Math.random()*45000)}
  addEventListener('storage',event=>{if(event.key===key)schedule()});
  addEventListener('DOMContentLoaded',()=>{
    document.querySelector('#download-more-ram')?.addEventListener('click',()=>{localStorage.setItem(key,'true');const toggle=document.querySelector('[data-setting="'+key+'"]');if(toggle)toggle.checked=true;show(true);schedule()});
    schedule();
  });
  window.homebaseFakeVirus={show,remove};
})();
