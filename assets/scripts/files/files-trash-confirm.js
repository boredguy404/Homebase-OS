(()=>{
  document.head.insertAdjacentHTML('beforeend','<style>.file-trash-confirm{width:min(460px,92vw);padding:24px;border:1px solid #6f8490;border-radius:18px;background:#12191e;color:#eef6f8;box-shadow:0 28px 80px #000b}.file-trash-confirm::backdrop{background:#000a;backdrop-filter:blur(7px)}.trash-confirm-copy small{color:#82d5e7;font:700 10px ui-monospace,monospace;letter-spacing:.12em}.trash-confirm-copy h2{margin:10px 0;font-size:25px}.trash-confirm-copy p{color:#b8c7cc;line-height:1.55}.trash-confirm-copy p b{color:#fff}.trash-confirm-copy>div{display:flex;justify-content:flex-end;gap:9px;margin-top:21px}.trash-confirm-copy button{min-height:46px;padding:0 14px;border:1px solid #ffffff32;border-radius:10px;background:#ffffff0c;color:#fff;font-weight:700}.trash-confirm-copy .continue{border-color:#d57979;background:#782e31;color:#fff}html[data-theme="ultra-retro"] .file-trash-confirm{padding-top:44px!important;border:3px solid #000!important;border-radius:0!important;background:#d4d4d4!important;color:#000!important;box-shadow:inset 3px 3px #fff,inset -3px -3px #666,7px 7px #111!important}html[data-theme="ultra-retro"] .trash-confirm-copy small,html[data-theme="ultra-retro"] .trash-confirm-copy p,html[data-theme="ultra-retro"] .trash-confirm-copy p b{color:#111!important}html[data-theme="ultra-retro"] .trash-confirm-copy .continue{background:#000080!important;color:#fff!important}</style>');
  function attach(){
    const trash=document.querySelector('#trash'),menu=document.querySelector('#menu');
    if(!trash||!menu||trash.dataset.doubleConfirm)return;
    trash.dataset.doubleConfirm='true';
    const confirmTrash=entry=>new Promise(resolve=>{
      const dialog=document.createElement('dialog');
      dialog.className='file-trash-confirm';dialog.dataset.windowTitle='Move to Trash';
      let step=1,finished=false;
      const finish=value=>{if(finished)return;finished=true;dialog.close();resolve(value)};
      const render=()=>{dialog.innerHTML='<div class="trash-confirm-copy"><small>SAFE FILE ACTION · STEP '+step+' OF 2</small><h2>'+(step===1?'Move this item to Trash?':'One final confirmation')+'</h2><p><b>'+entry.name+'</b> will be moved to the system Trash. It remains recoverable there.</p><div><button class="cancel">Keep it</button><button class="continue">'+(step===1?'Continue':'Move to Trash')+'</button></div></div>';dialog.querySelector('.cancel').onclick=()=>finish(false);dialog.querySelector('.continue').onclick=()=>{if(step===1){step=2;render()}else finish(true)}};
      render();dialog.onclick=event=>{if(event.target===dialog)finish(false)};dialog.addEventListener('close',()=>{if(!finished)resolve(false);dialog.remove()},{once:true});document.body.append(dialog);dialog.showModal();
    });
    trash.onclick=async()=>{const name=document.querySelector('#menu-name')?.textContent?.trim();const path=document.querySelector('.file[data-path]')?.dataset.path;if(!name)return;const selectedPath=window.selected?.path||[...document.querySelectorAll('.file')].find(node=>node.querySelector('b')?.textContent===name)?.dataset.path;if(!selectedPath)return;const confirmed=await confirmTrash({name});if(!confirmed)return;const response=await fetch('/api/files/trash',{method:'POST',headers:{'Content-Type':'application/json','X-Homebase-Local':'1'},body:JSON.stringify({path:selectedPath})});if(!response.ok){alert('Could not move this item to Trash.');return}menu.close();location.reload()};
  }
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',attach);else attach();
})();
