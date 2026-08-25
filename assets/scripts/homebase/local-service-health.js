(()=>{
  const command='cd "$HOME/homebase" && ./homebase-maintenance.sh open';
  let notice=null;
  function clear(){notice?.remove();notice=null}
  function show(){
    if(notice)return;
    notice=document.createElement('section');notice.className='local-service-health';notice.setAttribute('role','alert');
    notice.innerHTML='<b>LOCAL SERVICE STOPPED</b><p>The cached desktop is visible, but games, files, installed apps, and local tools need NovaShell running.</p><code></code><div><button data-copy>Copy restart command</button><button data-retry>Try again</button></div>';
    notice.querySelector('code').textContent=command;
    notice.querySelector('[data-copy]').onclick=async event=>{try{await navigator.clipboard.writeText(command);event.currentTarget.textContent='Copied'}catch{event.currentTarget.textContent='Select the command above'}};
    notice.querySelector('[data-retry]').onclick=check;document.body.append(notice);
  }
  async function check(){notice?.classList.add('checking');try{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),3500),response=await fetch('/api/status',{cache:'no-store',signal:controller.signal});clearTimeout(timer);if(!response.ok)throw Error();clear()}catch{show();notice?.classList.remove('checking')}}
  addEventListener('DOMContentLoaded',check,{once:true});addEventListener('online',check);
})();
