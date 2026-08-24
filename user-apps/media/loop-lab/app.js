(()=>{
  const $=s=>document.querySelector(s),audio=$('#audio'),canvas=$('#wave'),ctx=canvas.getContext('2d'),seek=$('#seek');
  let url='',buffer=null,looping=true,dragging=false;
  const fmt=value=>{const safe=Number.isFinite(value)?value:0;return `${String(Math.floor(safe/60)).padStart(2,'0')}:${String(Math.floor(safe%60)).padStart(2,'0')}`};
  function bounds(){const duration=audio.duration||0,a=Math.max(0,Math.min(duration,Number($('#start').value)||0)),b=Math.max(a,Math.min(duration,Number($('#end').value)||duration));return [a,b]}
  function draw(){
    const w=canvas.width,h=canvas.height;ctx.fillStyle='#071018';ctx.fillRect(0,0,w,h);
    if(buffer){const data=buffer.getChannelData(0),step=Math.max(1,Math.floor(data.length/w));ctx.strokeStyle='#8de4ec';ctx.lineWidth=2;ctx.beginPath();for(let x=0;x<w;x++){let min=1,max=-1;for(let j=0;j<step;j++){const value=data[x*step+j]||0;min=Math.min(min,value);max=Math.max(max,value)}ctx.moveTo(x,(1+min)*h/2);ctx.lineTo(x,(1+max)*h/2)}ctx.stroke()}
    const [a,b]=bounds(),duration=audio.duration||1;ctx.fillStyle='#8de4ec25';ctx.fillRect(a/duration*w,0,Math.max(2,(b-a)/duration*w),h);ctx.fillStyle='#f9d879';ctx.fillRect((audio.currentTime||0)/duration*w-1,0,3,h)
  }
  async function load(file){
    if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(file);audio.src=url;$('#name').textContent=file.name;$('#play').disabled=false;
    try{const bytes=await file.arrayBuffer(),ac=new (window.AudioContext||window.webkitAudioContext)();buffer=await ac.decodeAudioData(bytes.slice(0));await ac.close()}catch{buffer=null}draw()
  }
  $('#file').onchange=event=>event.target.files[0]&&load(event.target.files[0]);
  audio.onloadedmetadata=()=>{$('#end').value=audio.duration.toFixed(2);seek.max=Math.max(1,Math.round(audio.duration*100));draw()};
  audio.ontimeupdate=()=>{const [a,b]=bounds();if(looping&&b>a&&audio.currentTime>=b)audio.currentTime=a;if(!dragging)seek.value=Math.round(audio.currentTime*100);$('#clock').textContent=`${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;draw()};
  audio.onplay=()=>$('#play').textContent='Pause';audio.onpause=()=>$('#play').textContent='Play';
  $('#play').onclick=()=>audio.paused?audio.play():audio.pause();$('#back').onclick=()=>audio.currentTime=Math.max(0,audio.currentTime-5);$('#forward').onclick=()=>audio.currentTime=Math.min(audio.duration||0,audio.currentTime+5);
  $('#a').onclick=()=>{$('#start').value=audio.currentTime.toFixed(2);draw()};$('#b').onclick=()=>{$('#end').value=audio.currentTime.toFixed(2);draw()};
  $('#loop').onclick=event=>{looping=!looping;event.currentTarget.textContent=looping?'Loop on':'Loop off';event.currentTarget.setAttribute('aria-pressed',String(looping))};
  seek.onpointerdown=()=>dragging=true;seek.oninput=()=>{audio.currentTime=Number(seek.value)/100};seek.onchange=()=>dragging=false;
  $('#speed').oninput=event=>{audio.playbackRate=Number(event.target.value);$('#speed-label').textContent=`${audio.playbackRate.toFixed(2)}×`};
  ['#start','#end'].forEach(id=>$(id).oninput=draw);canvas.onpointerdown=event=>{const rect=canvas.getBoundingClientRect();audio.currentTime=(event.clientX-rect.left)/rect.width*(audio.duration||0)};
  addEventListener('pagehide',()=>{audio.pause();if(url)URL.revokeObjectURL(url)});draw();
})();
