addEventListener('DOMContentLoaded',()=>{
  const host=document.querySelector('#menu .menu-actions'),rename=document.querySelector('#rename');
  if(!host||!rename||document.querySelector('#rename-editor'))return;
  const editor=document.createElement('div');editor.id='rename-editor';editor.className='rename-editor';editor.hidden=true;editor.innerHTML='<label>New name<input id="rename-name" autocomplete="off" maxlength="180"></label><div><button id="rename-cancel">Cancel</button><button id="rename-save">Save name</button></div>';host.before(editor);
  rename.onclick=()=>{editor.hidden=false;const input=editor.querySelector('input');input.value=selected.name;input.focus();input.select()};
  editor.querySelector('#rename-cancel').onclick=()=>editor.hidden=true;
  editor.querySelector('#rename-save').onclick=async()=>{const button=editor.querySelector('#rename-save'),name=editor.querySelector('input').value.trim();if(!name||name==='.'||name==='..'||/[\\/\0]/.test(name)){notice('Use a plain file or folder name');return}if(name===selected.name){editor.hidden=true;return}button.disabled=true;button.textContent='Renaming…';try{if(await action('rename',{path:selected.path,name})){dialog.close();notice('Renamed to '+name);await load()}}finally{button.disabled=false;button.textContent='Save name'}};
  editor.querySelector('input').onkeydown=event=>{if(event.key==='Enter')editor.querySelector('#rename-save').click();if(event.key==='Escape')editor.hidden=true};dialog.addEventListener('close',()=>editor.hidden=true);
});
