(()=>{
  const presets=[['classic','Classic Gray'],['amber','Amber CRT'],['aqua','Aqua Desk'],['paper','Paper Wave']],key='orbit-retro-subtheme';
  const apply=id=>{document.documentElement.dataset.retroSubtheme=id;localStorage.setItem(key,id);document.querySelectorAll('[data-retro-preset]').forEach(button=>button.classList.toggle('active',button.dataset.retroPreset===id))};
  const boot=()=>{const modes=document.querySelector('.modes');if(!modes||document.querySelector('.retro-subthemes'))return;const tray=document.createElement('div');tray.className='retro-subthemes';tray.setAttribute('aria-label','Retro sub-theme');tray.innerHTML=presets.map(([id,label])=>'<button data-retro-preset="'+id+'">'+label+'</button>').join('');modes.insertAdjacentElement('afterend',tray);tray.querySelectorAll('button').forEach(button=>button.onclick=()=>apply(button.dataset.retroPreset));apply(localStorage.getItem(key)||'classic')};
  addEventListener('DOMContentLoaded',boot,{once:true});setTimeout(boot,300);
})();
