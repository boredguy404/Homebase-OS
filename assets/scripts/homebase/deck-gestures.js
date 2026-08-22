addEventListener('DOMContentLoaded',()=>{
  const stage=document.querySelector('.gyro-stage');if(!stage)return;
  stage.setAttribute('role','region');stage.setAttribute('aria-label','Nightglass visual switcher. Swipe left or right for themes. Swipe up or down for visuals.');
  stage.insertAdjacentHTML('beforeend','<div class="gesture-hint"><b>SWIPE</b><span>↕ Visual&nbsp;&nbsp;↔ Theme</span></div>');
  const gesturePad=document.createElement('div');gesturePad.className='gesture-pad';gesturePad.setAttribute('aria-label','Swipe to change Nightglass visual or theme');document.body.appendChild(gesturePad);
  const themes=[
    {id:'cobalt',name:'Cobalt',signal:'69,137,255',alt:'66,190,255'},
    {id:'tidal',name:'Tidal Glass',signal:'8,189,178',alt:'103,226,211'},
    {id:'solaris',name:'Solaris',signal:'255,126,48',alt:'255,204,102'},
    {id:'ultra-retro',name:'Ultra Retro',signal:'255,176,46',alt:'70,255,149'}
  ],visuals=['Topographic Flow','Radar','Particle Tunnel'];
  if(localStorage.getItem('homebase-visual-version')!=='3'){localStorage.setItem('nightglass-theme','solaris');localStorage.setItem('nightglass-visual','0');localStorage.setItem('homebase-visual-version','3')}
  let theme=Math.max(0,themes.findIndex(item=>item.id===(localStorage.getItem('nightglass-theme')||'solaris')));
  let visual=Number(localStorage.getItem('nightglass-visual')||0)%visuals.length;
  function applyTheme(animate=false){
    document.documentElement.dataset.theme=themes[theme].id;
    document.documentElement.style.setProperty('--signal-rgb',themes[theme].signal);
    document.documentElement.style.setProperty('--signal-alt-rgb',themes[theme].alt);
    localStorage.setItem('nightglass-theme',themes[theme].id);
    if(animate){document.body.classList.remove('theme-switch');void document.body.offsetWidth;document.body.classList.add('theme-switch');toast('Theme · '+themes[theme].name)}
    dispatchEvent(new CustomEvent('nightglass-theme',{detail:themes[theme]}));
  }
  function applyVisual(direction=0){
    localStorage.setItem('nightglass-visual',visual);stage.dataset.visual=visual;
    stage.classList.remove('scene-next','scene-previous');void stage.offsetWidth;stage.classList.add(direction<0?'scene-previous':'scene-next');
    dispatchEvent(new CustomEvent('nightglass-visual',{detail:{index:visual}}));if(direction)toast('Visual · '+visuals[visual]);
  }
  let start=null,taps=[];
  function partyWash(){const enabled=!document.body.classList.contains('rhythm-party');document.body.classList.toggle('rhythm-party',enabled);toast(enabled?'Rhythm unlocked · psychedelic mode':'Psychedelic mode off')}
  function registerTap(){const now=performance.now();taps.push(now);taps=taps.filter(time=>now-time<4200).slice(-7);if(taps.length<7)return;const gaps=taps.slice(1).map((time,index)=>time-taps[index]);const shorts=gaps.slice(0,4).every(gap=>gap>110&&gap<560),pause=gaps[4]>560&&gaps[4]<1700,last=gaps[5]>110&&gaps[5]<650;if(shorts&&pause&&last){taps=[];partyWash()}}
  gesturePad.addEventListener('pointerdown',event=>{start={x:event.clientX,y:event.clientY};gesturePad.setPointerCapture(event.pointerId)});
  gesturePad.addEventListener('pointerup',event=>{if(!start)return;const dx=event.clientX-start.x,dy=event.clientY-start.y;start=null;if(Math.max(Math.abs(dx),Math.abs(dy))<42){registerTap();return}if(Math.abs(dx)>Math.abs(dy)){theme=(theme+(dx<0?1:-1)+themes.length)%themes.length;applyTheme(true)}else{visual=(visual+(dy<0?1:-1)+visuals.length)%visuals.length;applyVisual(dy)}});
  applyTheme();applyVisual();
});
