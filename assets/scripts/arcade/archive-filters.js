(()=>{
  const boot=()=>{
    const library=document.querySelector('#library');if(!library||document.querySelector('#archive-filters'))return;
    const cards=()=>[...library.querySelectorAll('.game[data-rom]')];
    const infer=card=>{
      const tag=String(card.querySelector('.tag')?.textContent||'').trim(),core=card.dataset.core||'',rom=card.dataset.rom||'';
      const system=card.dataset.system||(/\.z64$|\.n64$|\.v64$/i.test(rom)||core==='n64'?'N64':core==='psx'?'PlayStation':/\.nes$/i.test(rom)||core==='nes'?'NES':/\.gbc?$/i.test(rom)?'Game Boy':/\.sfc$|\.smc$/i.test(rom)?'SNES':'Game Boy Advance');
      const type=card.dataset.genre||tag.split('·').map(x=>x.trim()).find(x=>!/^n64$|^gba$|^game boy|^playstation|^nes$/i.test(x))||'Game';
      card.dataset.system=system;card.dataset.type=type;return {system,type};
    };
    const shell=document.createElement('section');shell.id='archive-filters';shell.innerHTML='<span>Filter shelf</span><label>System <select data-system></select></label><label>Type <select data-type></select></label><button type="button">Show all</button><small aria-live="polite"></small>';
    library.querySelector('.intro')?.insertAdjacentElement('afterend',shell);
    const system=shell.querySelector('[data-system]'),type=shell.querySelector('[data-type]'),note=shell.querySelector('small');
    const options=(select,values,label)=>select.innerHTML='<option value="">'+label+'</option>'+values.map(value=>'<option value="'+value.replace(/[&<>"]/g,'')+'">'+value+'</option>').join('');
    const rebuild=()=>{const data=cards().map(infer);options(system,[...new Set(data.map(x=>x.system))].sort(),'All systems');options(type,[...new Set(data.map(x=>x.type))].sort(),'All types')};
    const apply=()=>{let visible=0;cards().forEach(card=>{const value=infer(card),show=(!system.value||value.system===system.value)&&(!type.value||value.type===type.value);card.hidden=!show;visible+=show?1:0});note.textContent=visible+' game'+(visible===1?'':'s')+' shown'};
    rebuild();apply();shell.addEventListener('change',apply);shell.querySelector('button').onclick=()=>{system.value='';type.value='';apply()};
  };
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
