const $ = s => document.querySelector(s);
const requestedOrbitTheme=new URLSearchParams(location.search).get('theme');if(requestedOrbitTheme)document.documentElement.dataset.theme=requestedOrbitTheme;
if(localStorage.getItem('radio-visual-version')!=='2'){localStorage.setItem('radio-visual','wave');localStorage.setItem('radio-visual-version','2')}
const state = { stations: [], current: null, playing: false, mode: 'orbit', favorites: JSON.parse(localStorage.getItem('radio-favorites') || '[]'), favoritesOnly: false, energy: 0 };
state.mode=localStorage.getItem('radio-visual')||'orbit';const audio = $('#audio'), canvas = $('#visualizer'), ctx = canvas.getContext('2d');
let raf, searchTimer, audioContext, analyser, frequencyData, audioSource, bass=0, mids=0, treble=0, beat=0, localPlaylist=[], localIndex=-1, coverUrl='', compactMode=false, lastVisualFrame=0, orbitColor='91,213,255';
addEventListener('message',event=>{if(event.data?.type==='orbit-theme'){document.documentElement.dataset.theme=event.data.id;document.documentElement.style.setProperty('--signal-rgb',event.data.signal);document.documentElement.style.setProperty('--signal-alt-rgb',event.data.alt);orbitColor=(event.data.signal||orbitColor).trim()}if(event.data?.type==='orbit-compact')compactMode=!!event.data.compact;if(event.data?.type==='orbit-command'){if(event.data.command==='play')$('#play').click();if(event.data.command==='previous'){if(localPlaylist.length)$('#previousTrack').click();else stepStation(-1)}if(event.data.command==='next'){if(localPlaylist.length)$('#nextTrack').click();else stepStation(1)}}});parent.postMessage({type:'orbit-ready'},'*');
function applyOrbitThemeLabels(id){const retro=id==='ultra-retro',labels=retro?{wave:'SCOPE',bars:'VU METERS',tunnel:'WIREFRAME',orbit:'STAR TERM',radar:'RADAR CRT',nebula:'MOIRÉ'}:{wave:'WAVE',bars:'SPECTRUM',tunnel:'TUNNEL',orbit:'ORBIT',radar:'RADAR',nebula:'NEBULA'};document.querySelectorAll('[data-mode]').forEach(button=>{if(labels[button.dataset.mode])button.textContent=labels[button.dataset.mode];button.hidden=retro&&button.dataset.mode==='club'});document.querySelector('.modes>span').textContent=retro?'DISPLAY PROGRAM · SWIPE BACKGROUND':'VISUAL MODE · SWIPE BACKGROUND'}
addEventListener('message',event=>{if(event.data?.type==='orbit-theme')applyOrbitThemeLabels(event.data.id)});applyOrbitThemeLabels(document.documentElement.dataset.theme);
function stepStation(direction){const list=visibleStations();if(!list.length)return;const index=Math.max(0,list.findIndex(item=>state.current&&stationId(item)===stationId(state.current)));select(list[(index+direction+list.length)%list.length])}
if(window.parent!==window) document.body.classList.add('embedded');
audio.crossOrigin='anonymous';
function ensureAudioGraph(){if(!audioContext){audioContext=new (window.AudioContext||window.webkitAudioContext)();analyser=audioContext.createAnalyser();analyser.fftSize=512;analyser.smoothingTimeConstant=.58;frequencyData=new Uint8Array(analyser.frequencyBinCount);audioSource=audioContext.createMediaElementSource(audio);audioSource.connect(analyser);analyser.connect(audioContext.destination)}if(audioContext.state==='suspended')audioContext.resume()}

function esc(s=''){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function stationId(s){ return s.stationuuid || s.url_resolved; }
function isFav(s){ return state.favorites.includes(stationId(s)); }
function saveFav(){ localStorage.setItem('radio-favorites', JSON.stringify(state.favorites)); render(); updateNow(); }

async function loadStations(q=''){
  $('#status').textContent='SCANNING THE AIRWAVES…'; $('#stations').innerHTML='';
  try {
    const res=await fetch('/api/orbit-stations?q='+encodeURIComponent(q)); const json=await res.json();
    if(!res.ok) throw new Error(json.error || 'Station service unavailable');
    state.stations=json.filter(s=>s.url_resolved && s.name); render();
  } catch(e){ state.stations=[{stationuuid:'fallback-soma',name:'SomaFM Groove Salad',country:'US',countrycode:'US',tags:'ambient,electronic',bitrate:128,codec:'MP3',url_resolved:'https://ice1.somafm.com/groovesalad-128-mp3'},{stationuuid:'fallback-radio-paradise',name:'Radio Paradise',country:'US',countrycode:'US',tags:'eclectic,rock',bitrate:192,codec:'MP3',url_resolved:'https://stream.radioparadise.com/mp3-192'}];render();$('#status').textContent='OFFLINE DIRECTORY · 2 BACKUP SIGNALS'; }
}
function visibleStations(){ return state.favoritesOnly ? state.stations.filter(isFav) : state.stations; }
function render(){
  const list=visibleStations(); $('#status').textContent=list.length ? `${list.length} SIGNALS FOUND` : 'NO SIGNALS FOUND';
  $('#stations').innerHTML=list.map((s,i)=>`<article class="station ${state.current&&stationId(s)===stationId(state.current)?'active':''}" data-id="${esc(stationId(s))}"><span class="index">${String(i+1).padStart(2,'0')}</span><div><h3>${esc(s.name)}</h3><p>${esc([s.countrycode,s.tags?.split(',').slice(0,2).join(' / '),s.bitrate?s.bitrate+' KBPS':''].filter(Boolean).join(' · '))}</p></div><span class="go">${isFav(s)?'★':'↗'}</span></article>`).join('');
  document.querySelectorAll('.station').forEach(el=>el.onclick=()=>select(state.stations.find(s=>stationId(s)===el.dataset.id)));
}
async function select(s){
  state.current=s; ensureAudioGraph(); audio.src=s.url_resolved;
  try{ await audio.play(); state.playing=true; }catch(e){ state.playing=false; $('#nowPlaying').textContent='PRESS PLAY TO CONNECT'; }
  updateNow(); render();
}
function updateNow(){
  const s=state.current,shortName=s?shortStationName(s.name):''; $('#stationName').innerHTML=s?`${esc(shortName)}<br><em>on air.</em>`:'Find your<br><em>frequency.</em>';
  $('#stationMeta').textContent=s?[s.tags||'Internet radio',s.language,s.codec].filter(Boolean).join(' · '):'Search thousands of independent stations broadcasting from every corner of the planet.';
  $('#nowPlaying').textContent=s?shortName.toUpperCase():'NO SIGNAL SELECTED'; $('#location').textContent=s?(s.country||'WORLDWIDE').toUpperCase():'WORLDWIDE';
  $('#play').textContent=state.playing?'Ⅱ':'▶'; $('#favorite').textContent=s&&isFav(s)?'♥':'♡'; $('#favorite').classList.toggle('saved',!!s&&isFav(s));
  parent.postMessage({type:'orbit-state',name:shortName||'Choose a signal',fullName:s?.name||'',playing:state.playing},'*');
}
function shortStationName(name,max=24){const clean=String(name||'').replace(/\s*[|·–—-]\s*(live|radio|stream|official|online).*$/i,'').replace(/\b(24\/7|official stream)\b/ig,'').replace(/\s+/g,' ').trim();if(clean.length<=max)return clean;const cut=clean.slice(0,max+1),word=cut.slice(0,cut.lastIndexOf(' '));return (word.length>=12?word:clean.slice(0,max-1)).trim()+'…'}
$('#play').onclick=async()=>{ensureAudioGraph();if(!state.current){const first=visibleStations()[0];if(first)select(first);return}if(state.playing)audio.pause();else await audio.play()};
audio.onplay=()=>{state.playing=true;updateNow()}; audio.onpause=()=>{state.playing=false;updateNow()};
audio.onerror=()=>{state.playing=false;$('#nowPlaying').textContent='STREAM UNAVAILABLE — TRY ANOTHER';updateNow()};
$('#favorite').onclick=()=>{if(!state.current)return;const id=stationId(state.current),i=state.favorites.indexOf(id);i<0?state.favorites.push(id):state.favorites.splice(i,1);saveFav()};
$('#favoritesOnly').onclick=()=>{state.favoritesOnly=!state.favoritesOnly;$('#favoritesOnly').classList.toggle('active',state.favoritesOnly);render()};
$('#volume').oninput=e=>{audio.volume=+e.target.value;$('#volumeValue').textContent=Math.round(e.target.value*100)}; audio.volume=.75;
$('#openAudio').onclick=()=>$('#audioFile').click();
async function playLocal(index){if(!localPlaylist.length)return;localIndex=(index+localPlaylist.length)%localPlaylist.length;const file=localPlaylist[localIndex];ensureAudioGraph();if(audio.src?.startsWith('blob:'))URL.revokeObjectURL(audio.src);state.current={name:file.name.replace(/\.[^.]+$/,''),tags:`LOCAL PLAYLIST · ${localIndex+1}/${localPlaylist.length}`,language:'',codec:file.type.split('/')[1]?.toUpperCase()||'AUDIO',country:'THIS DEVICE',url_resolved:URL.createObjectURL(file),stationuuid:'local-'+file.name};audio.src=state.current.url_resolved;await audio.play();state.playing=true;updateNow()}
$('#audioFile').onchange=event=>{const files=[...event.target.files];if(!files.length)return;localPlaylist=files;playLocal(0)};
$('#previousTrack').onclick=()=>playLocal(localIndex-1);$('#nextTrack').onclick=()=>playLocal(localIndex+1);
audio.addEventListener('ended',()=>{if(localPlaylist.length)playLocal(localIndex+1)});
$('#openCover').onclick=()=>$('#coverFile').click();$('#coverFile').onchange=event=>{const file=event.target.files[0];if(!file)return;if(coverUrl)URL.revokeObjectURL(coverUrl);coverUrl=URL.createObjectURL(file);const image=$('#localCover');image.src=coverUrl;image.hidden=false};
$('#searchForm').onsubmit=e=>{e.preventDefault();loadStations($('#search').value)};
$('#search').oninput=e=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>loadStations(e.target.value),500)};
$('#chips').onclick=e=>{if(!e.target.dataset.q&&e.target.dataset.q!=='')return;document.querySelectorAll('.chips button').forEach(b=>b.classList.remove('active'));e.target.classList.add('active');$('#search').value=e.target.dataset.q;loadStations(e.target.dataset.q)};
const visualModes=['orbit','bars','tunnel','wave','radar','nebula'];function setVisual(mode){state.mode=visualModes.includes(mode)?mode:'orbit';localStorage.setItem('radio-visual',state.mode);document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x.dataset.mode===state.mode));parent.postMessage({type:'orbit-visual',mode:state.mode},'*')}document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setVisual(b.dataset.mode));setVisual(state.mode);let visualSwipe=null;canvas.style.pointerEvents='auto';canvas.style.touchAction='none';canvas.addEventListener('pointerdown',e=>visualSwipe={x:e.clientX,y:e.clientY});canvas.addEventListener('pointerup',e=>{if(!visualSwipe)return;const dx=e.clientX-visualSwipe.x,dy=e.clientY-visualSwipe.y;visualSwipe=null;if(Math.max(Math.abs(dx),Math.abs(dy))<42)return;const step=(Math.abs(dx)>Math.abs(dy)?dx:dy)<0?1:-1;setVisual(visualModes[(visualModes.indexOf(state.mode)+step+visualModes.length)%visualModes.length])});
document.querySelector('[data-mode="club"]')?.addEventListener('click',()=>{state.mode='club';localStorage.setItem('radio-visual','club');document.body.dataset.visual='club';document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x.dataset.mode==='club'));parent.postMessage({type:'orbit-visual',mode:'club'},'*')});document.head.insertAdjacentHTML('beforeend','<style>body[data-visual="club"] #visualizer{animation:clubColor 4.5s linear infinite;filter:saturate(1.65) contrast(1.12)}body[data-visual="club"]:after{content:"";position:fixed;pointer-events:none;inset:0;background:radial-gradient(circle at 20% 25%,#00d9ff2e,transparent 30%),radial-gradient(circle at 78% 32%,#ff315c2b,transparent 32%),radial-gradient(circle at 55% 82%,#ffe44b26,transparent 35%);mix-blend-mode:screen;animation:clubWash 5s ease-in-out infinite alternate}@keyframes clubColor{to{filter:hue-rotate(360deg) saturate(1.65) contrast(1.12)}}@keyframes clubWash{to{transform:scale(1.12) rotate(7deg)}}</style>');$('#fullscreen').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();

function resize(){ const d=devicePixelRatio||1;canvas.width=innerWidth*d;canvas.height=innerHeight*d;ctx.setTransform(d,0,0,d,0,0)} addEventListener('resize',resize);resize();
setInterval(()=>{const reactor=$('#beat-reactor');if(!reactor)return;const live=analyser&&state.playing;reactor.style.setProperty('--beat',(live?beat:.08).toFixed(3));reactor.style.setProperty('--bass',(live?bass:.08).toFixed(3));reactor.style.setProperty('--mids',(live?mids:.06).toFixed(3));reactor.classList.toggle('audio-live',!!live);parent.postMessage({type:'orbit-energy',signal:{energy:state.energy,bass,mids,treble,beat}},'*')},80);
function draw(t){
  if(compactMode&&t-lastVisualFrame<66){raf=requestAnimationFrame(draw);return}lastVisualFrame=t;
  const w=innerWidth,h=innerHeight,cx=w*.38,cy=h*.48;ctx.clearRect(0,0,w,h);ctx.fillStyle='#090b0f';ctx.fillRect(0,0,w,h);
  let bins;if(analyser&&state.playing){analyser.getByteFrequencyData(frequencyData);bins=Array.from(frequencyData.slice(0,128),v=>v/255);const avg=(a,z)=>bins.slice(a,z).reduce((n,v)=>n+v,0)/Math.max(1,z-a),nb=avg(1,12),nm=avg(12,55),nt=avg(55,128);const previousBass=bass;bass+=(nb-bass)*.32;mids+=(nm-mids)*.2;treble+=(nt-treble)*.16;beat=Math.max(beat*.84,Math.max(0,nb-previousBass)*5.5)}else{const live=state.playing?1:.3;bins=Array.from({length:128},(_,i)=>live*(.14+.11*Math.sin(t/310+i*.67)+.07*Math.sin(t/127+i*.19)));bass+=(.16-bass)*.05;mids+=(.12-mids)*.05;treble+=(.08-treble)*.05;beat*=.9}const pulse=bins.reduce((a,b)=>a+b,0)/bins.length;state.energy+=(pulse-state.energy)*.2;
  const acid=state.mode==='bars'?'255,100,174':state.mode==='tunnel'?'255,183,82':state.mode==='wave'?'176,126,255':orbitColor, e=state.energy;
  if(document.documentElement.dataset.theme==='ultra-retro'){
    ctx.fillStyle='#c8c8c8';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#111';ctx.fillStyle='#111';ctx.lineWidth=2;
    if(state.mode==='bars'){const count=24,gap=4,bw=Math.max(5,(w*.62)/count-gap),base=h*.78;for(let i=0;i<count;i++){const v=bins[Math.floor(i/count*100)]||.03,blocks=Math.max(1,Math.floor(v*13));for(let b=0;b<13;b++){ctx.fillStyle=b<blocks?'#000':'#999';ctx.fillRect(w*.08+i*(bw+gap),base-b*12,bw,8)}}ctx.font='12px monospace';ctx.fillStyle='#000';ctx.fillText('LEFT CHANNEL',w*.08,base+28);ctx.fillText('RIGHT CHANNEL',w*.42,base+28)}
    else if(state.mode==='wave'){ctx.strokeStyle='#777';ctx.lineWidth=1;for(let y=0;y<h;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}for(let x=0;x<w;x+=24){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}ctx.strokeStyle='#000';ctx.lineWidth=3;ctx.beginPath();for(let x=0;x<=w;x+=5){const v=bins[Math.floor(x/w*127)]||0,y=h*.5+Math.sin(x*.025+t*.003)*(18+v*h*.28)+Math.sin(x*.009-t*.002)*mids*90;x?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()}
    else if(state.mode==='tunnel'){const horizon=h*.42;ctx.lineWidth=1;for(let i=0;i<18;i++){const y=horizon+(h-horizon)*Math.pow(i/17,2);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}for(let i=-14;i<=14;i++){ctx.beginPath();ctx.moveTo(w*.38,horizon);ctx.lineTo(w*.38+i*w*.09,h);ctx.stroke()}ctx.strokeRect(w*.18,h*.16,w*.4,h*.18);ctx.font='14px monospace';ctx.fillText('VECTOR GRID / '+Math.round((bass+mids)*99),w*.2,h*.2)}
    else if(state.mode==='radar'){const r=Math.min(w,h)*.3;ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.stroke();for(let i=1;i<4;i++){ctx.beginPath();ctx.arc(cx,cy,r*i/4,0,7);ctx.stroke()}const a=t*.0015;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);ctx.stroke();for(let i=0;i<10;i++){const q=i*.91,radius=r*(.2+(bins[i*9]||.2)*.75);ctx.fillRect(cx+Math.cos(q)*radius-3,cy+Math.sin(q)*radius-3,6,6)}}
    else if(state.mode==='nebula'){ctx.lineWidth=1;for(let i=0;i<42;i++){ctx.beginPath();const r=8+i*9+Math.sin(t*.001+i)*18*e;ctx.arc(cx,cy,r,0,7);ctx.stroke()}ctx.font='bold 16px monospace';ctx.fillText('MOIRE MEMORY DISPLAY',32,h-38)}
    else{ctx.font='12px monospace';for(let i=0;i<150;i++){const seed=(i*7919)%997,depth=((t*.00008+seed/997)%1),x=(i*193%w),y=(i*127%h);ctx.globalAlpha=.2+depth*.8;ctx.fillRect(x,y,1+depth*3,1+depth*3)}ctx.globalAlpha=1;ctx.strokeRect(24,24,w-48,h-48);ctx.fillText('STAR TERMINAL  ·  AUDIO '+Math.round(e*100),42,50)}
    raf=requestAnimationFrame(draw);return;
  }
  if(state.mode==='bars'){for(let i=0;i<72;i++){let v=bins[i]||.01,x=i*w/72;ctx.fillStyle=`rgba(${acid},${.16+v*.82})`;ctx.fillRect(x,h/2-v*h*.52,Math.max(2,w/100),v*h*1.04)}}
  else if(state.mode==='wave'){for(let j=0;j<5;j++){ctx.beginPath();for(let x=0;x<=w;x+=8){const sample=bins[Math.floor(x/w*127)]||0;let y=h/2+Math.sin(x*.012+t*.0015+j)*(25+sample*150+mids*80)+Math.sin(x*.003-t*.001)*20;x?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.strokeStyle=`rgba(${acid},${.38-j*.05+treble*.25})`;ctx.lineWidth=1+beat*2;ctx.stroke()}}
  else if(state.mode==='tunnel'){for(let i=0;i<28;i++){let z=(i/28+t*(.0001+bass*.00025))%1,r=20+z*Math.max(w,h)*(.62+beat*.18);ctx.beginPath();for(let p=0;p<6;p++){let a=p*Math.PI/3+t*.0001,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;p?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.strokeStyle=`rgba(${acid},${(1-z)*(.45+treble*.7)})`;ctx.lineWidth=1+beat*3;ctx.stroke()}}
  else {for(let ring=0;ring<4;ring++){let r=90+ring*54+bass*115+beat*45;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.strokeStyle=`rgba(${acid},${.3-ring*.045+mids*.35})`;ctx.lineWidth=1+beat*3;ctx.stroke();for(let i=0;i<18;i++){let a=i*Math.PI/9+t*(.00018+ring*.00003)*(ring%2?1:-1),v=bins[(i*3+ring*9)%128]||.04,rr=r+v*(55+treble*75);ctx.beginPath();ctx.arc(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,1+v*5+beat*2,0,7);ctx.fillStyle=`rgba(${acid},${.25+v*.75})`;ctx.fill()}}}
  raf=requestAnimationFrame(draw);
}requestAnimationFrame(draw);
setInterval(()=>$('#clock').textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+' / LOCAL',1000);
loadStations('Lo');
