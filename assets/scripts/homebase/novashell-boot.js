(()=>{
  const key='novashell-boot-seen';
  const boot=()=>{
    if(sessionStorage.getItem(key))return;
    const splash=document.createElement('section');
    splash.className='novashell-boot';
    splash.setAttribute('role','status');
    splash.innerHTML='<div class="novashell-boot-window"><div class="novashell-boot-title"><span>NovaShell boot</span><button aria-label="Skip boot">Skip</button></div><div class="novashell-boot-body"><div class="novashell-mark" aria-hidden="true"><i></i><i></i><i></i></div><p>NOVASHELL LOCAL DESKTOP</p><b>Loading your device…</b><div class="novashell-progress"><i></i></div><small>Touch-first · local-first · ready for old hardware</small></div></div>';
    const close=()=>{sessionStorage.setItem(key,'1');splash.classList.add('is-leaving');setTimeout(()=>splash.remove(),280)};
    splash.querySelector('button').onclick=close;
    document.body.append(splash);
    setTimeout(close,1500);
  };
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
