(()=>{
  const supported=new Set(['orbit','bars','tunnel','wave','radar','nebula','pixel','terminal','club']);
  const normalize=node=>{
    if(!node||node.classList.contains('expanded'))return;
    const current=node.dataset.visual||localStorage.getItem('radio-visual')||'wave';
    if(current==='aurora')node.dataset.visual='nebula';
    else if(current==='pixel-dense'&&!node.classList.contains('peek'))node.dataset.visual='pixel';
    else if(!supported.has(current)&&current!=='pixel-dense')node.dataset.visual='wave';
  };
  addEventListener('message',event=>{if(event.data?.type==='orbit-visual')queueMicrotask(()=>normalize(document.querySelector('#orbit-player')))});
  new MutationObserver(records=>{for(const record of records){if(record.type==='attributes'&&record.target.id==='orbit-player')normalize(record.target);else if(record.type==='childList')normalize(document.querySelector('#orbit-player'))}}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-visual']});
  addEventListener('pageshow',()=>normalize(document.querySelector('#orbit-player')));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)normalize(document.querySelector('#orbit-player'))});
})();
