(()=>{
  const SESSION_KEY='novashell-focus-session-v1';
  const LOG_KEY='novashell-focus-log-v1';
  const $=selector=>document.querySelector(selector);
  const time=$('#time'),state=$('#state'),label=$('#label');
  const start=$('#start'),pause=$('#pause'),finish=$('#finish'),entries=$('#entries');
  let minutes=25,timer=null,session=read(SESSION_KEY,null),log=read(LOG_KEY,[]);

  function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
  function write(key,value){localStorage.setItem(key,JSON.stringify(value))}
  function elapsed(now=Date.now()){
    if(!session)return 0;
    const end=session.pausedAt||now;
    return Math.max(0,end-session.startedAt-(session.pausedTotal||0));
  }
  function remaining(){return Math.max(0,session.duration-elapsed())}
  function clock(ms){
    const seconds=Math.ceil(ms/1000),m=Math.floor(seconds/60),s=seconds%60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  function saveSession(){session?write(SESSION_KEY,session):localStorage.removeItem(SESSION_KEY)}
  function addLog(completed){
    const used=Math.max(1,Math.round(elapsed()/60000));
    log.unshift({id:Date.now(),label:session.label||'Focus session',minutes:used,completed,at:new Date().toISOString()});
    log=log.slice(0,100);write(LOG_KEY,log);
  }
  function complete(auto=false){
    if(!session)return;
    addLog(auto||remaining()===0);session=null;saveSession();minutes=25;label.value='';render();
  }
  function renderLog(){
    const now=new Date(),day=now.toDateString(),weekAgo=Date.now()-7*86400000;
    const today=log.filter(item=>new Date(item.at).toDateString()===day);
    $('#today').textContent=`${today.reduce((n,item)=>n+item.minutes,0)} min`;
    $('#count').textContent=String(today.length);
    $('#week').textContent=`${log.filter(item=>new Date(item.at).getTime()>=weekAgo).reduce((n,item)=>n+item.minutes,0)} min`;
    entries.innerHTML=log.length?log.slice(0,12).map(item=>`<article class="entry"><div><b>${escapeHtml(item.label)}</b><br><small>${new Date(item.at).toLocaleString()}</small></div><strong>${item.minutes} min</strong></article>`).join(''):'<p class="empty">Completed and stopped sessions stay private in this browser.</p>';
  }
  function escapeHtml(value){const node=document.createElement('span');node.textContent=String(value);return node.innerHTML}
  function render(){
    if(session&&remaining()===0){complete(true);return}
    time.textContent=session?clock(remaining()):`${String(minutes).padStart(2,'0')}:00`;
    const paused=Boolean(session?.pausedAt);
    state.textContent=session?(paused?'PAUSED':'FOCUSING'):'READY';
    start.disabled=Boolean(session);pause.disabled=!session;finish.disabled=!session;
    pause.textContent=paused?'Resume':'Pause';label.disabled=Boolean(session);
    document.querySelectorAll('[data-min]').forEach(button=>button.classList.toggle('active',Number(button.dataset.min)===minutes));
    renderLog();
  }
  document.querySelectorAll('[data-min]').forEach(button=>button.onclick=()=>{if(session)return;minutes=Number(button.dataset.min);render()});
  start.onclick=()=>{
    session={startedAt:Date.now(),duration:minutes*60000,pausedAt:0,pausedTotal:0,label:label.value.trim()||'Focus session'};
    saveSession();render();
  };
  pause.onclick=()=>{
    if(!session)return;
    if(session.pausedAt){session.pausedTotal+=Date.now()-session.pausedAt;session.pausedAt=0}else session.pausedAt=Date.now();
    saveSession();render();
  };
  finish.onclick=()=>complete(false);
  if(session){minutes=Math.max(1,Math.round(session.duration/60000));label.value=session.label||''}
  render();timer=setInterval(render,500);
  addEventListener('pagehide',()=>clearInterval(timer));
})();
