(()=>{
  const esc=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const details=()=>({name:document.querySelector('#detail-name')?.textContent||'Game reference',system:(document.querySelector('#detail-system')?.textContent||'System').split(' · ')[0]});
  const cardGame=card=>({name:card.querySelector('h2')?.textContent||'Game reference',system:(card.querySelector('.discover-copy small')?.textContent||'System').split(' · ')[0]});
  const art=(game,label='OFFLINE CATALOG CARD')=>'<div class="offline-game-art" data-system="'+esc(game.system)+'"><small>'+esc(game.system)+' · '+label+'</small><b>'+esc(game.name)+'</b></div>';
  function repairCard(card){const pending=card.querySelector('.preview-pending');if(pending&&!card.querySelector('.offline-game-art'))pending.outerHTML=art(cardGame(card));const image=card.querySelector('img');if(image&&!image.dataset.discoveryFallback){image.dataset.discoveryFallback='true';image.addEventListener('error',()=>image.outerHTML=art(cardGame(card)),{once:true})}}
  function repairGallery(){const track=document.querySelector('#gallery-track');if(!track)return;const pending=track.querySelector('.preview-pending');if(pending){track.innerHTML=art(details(),'OFFLINE REFERENCE');return}track.querySelectorAll('img').forEach(image=>{if(image.dataset.discoveryFallback)return;image.dataset.discoveryFallback='true';image.addEventListener('error',()=>{image.outerHTML=art(details(),'OFFLINE REFERENCE');track.querySelector('.offline-game-art')?.classList.add('active')},{once:true})})}
  function repair(){document.querySelectorAll('.discover-card').forEach(repairCard);repairGallery()}
  const start=()=>{repair();new MutationObserver(repair).observe(document.body,{subtree:true,childList:true});};
  document.readyState==='loading'?addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
