addEventListener('DOMContentLoaded',()=>{
  let gameName='';
  document.addEventListener('click',event=>{const game=event.target.closest('[data-rom]');if(game)gameName=game.dataset.name||game.querySelector('h2')?.textContent||''},true);
  document.querySelectorAll('[data-rom]').forEach(game=>{const name=game.dataset.name||'',slug=name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');if(localStorage.getItem('nightglass-preview-'+slug+'-1'))game.querySelector('.art').innerHTML='<img src="/covers/'+slug+'-gameplay.gif" alt="Real locally recorded '+name+' gameplay">'});
  const observer=new MutationObserver(()=>{const canvas=document.querySelector('#game canvas');if(!canvas||canvas.dataset.captureScheduled||!gameName)return;canvas.dataset.captureScheduled='1';setTimeout(()=>capture(canvas,gameName,1),6500);setTimeout(()=>capture(canvas,gameName,2),19500)});
  observer.observe(document.querySelector('#game'),{childList:true,subtree:true});
  async function capture(canvas,name,slot){
    const slug=name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    if(localStorage.getItem('nightglass-preview-'+slug+'-'+slot)||!canvas.captureStream||!window.MediaRecorder)return;
    try{
      const stream=canvas.captureStream(15),chunks=[],recorder=new MediaRecorder(stream,{mimeType:'video/webm'});
      recorder.ondataavailable=event=>event.data.size&&chunks.push(event.data);
      recorder.onstop=async()=>{stream.getTracks().forEach(track=>track.stop());const response=await fetch('/api/preview?slug='+encodeURIComponent(slug)+'&slot='+slot,{method:'POST',headers:{'Content-Type':'video/webm'},body:new Blob(chunks,{type:'video/webm'})});if(response.ok){localStorage.setItem('nightglass-preview-'+slug+'-'+slot,'1');if(slot===1){const game=[...document.querySelectorAll('[data-rom]')].find(item=>(item.dataset.name||'')===name);if(game)game.querySelector('.art').innerHTML='<img src="/covers/'+slug+'-gameplay.gif?'+Date.now()+'" alt="Real locally recorded '+name+' gameplay">'}window.toast?.('Real gameplay clip '+slot+' added to gallery')}};
      recorder.start();setTimeout(()=>recorder.state==='recording'&&recorder.stop(),6200);
    }catch(error){console.warn('Local preview capture skipped',error)}
  }
});
