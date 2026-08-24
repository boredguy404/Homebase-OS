(()=>{
  const KEY='novashell-pantry-ledger-v1',DEFAULT_CATEGORIES=['Pantry','Fridge','Freezer','Drinks','Supplies'];
  const $=value=>document.querySelector(value),inventory=$('#inventory'),editor=$('#editor'),remove=$('#remove');
  let items=read(),editing='',removing='';
  function read(){try{return JSON.parse(localStorage.getItem(KEY))||[]}catch{return []}}
  function persist(){localStorage.setItem(KEY,JSON.stringify(items))}
  function clean(value){const node=document.createElement('span');node.textContent=String(value||'');return node.innerHTML}
  function days(date){return date?Math.ceil((new Date(`${date}T23:59:59`).getTime()-Date.now())/86400000):null}
  function categoryOptions(){
    const selected=$('#category').value;
    const categories=[...new Set([...DEFAULT_CATEGORIES,...items.map(item=>item.category).filter(Boolean)])].sort();
    $('#category').innerHTML='<option value="">All categories</option>'+categories.map(value=>`<option>${clean(value)}</option>`).join('');
    $('#category').value=categories.includes(selected)?selected:'';
    $('#categories').innerHTML=categories.map(value=>`<option value="${clean(value)}">`).join('');
  }
  function render(){
    categoryOptions();
    const term=$('#search').value.trim().toLowerCase(),category=$('#category').value,sort=$('#sort').value;
    let shown=items.filter(item=>(!term||`${item.name} ${item.category}`.toLowerCase().includes(term))&&(!category||item.category===category));
    const sorters={newest:(a,b)=>b.created-a.created,name:(a,b)=>a.name.localeCompare(b.name),low:(a,b)=>(a.quantity-a.threshold)-(b.quantity-b.threshold),expiry:(a,b)=>(a.expiry||'9999').localeCompare(b.expiry||'9999')};shown.sort(sorters[sort]);
    $('#types').textContent=items.length;$('#low').textContent=items.filter(item=>item.quantity<=item.threshold).length;$('#soon').textContent=items.filter(item=>{const value=days(item.expiry);return value!==null&&value>=0&&value<=7}).length;
    inventory.innerHTML=shown.length?shown.map(item=>{
      const left=days(item.expiry),expiry=left===null?'No expiry set':left<0?`Expired ${Math.abs(left)}d ago`:left===0?'Expires today':`Expires in ${left}d`;
      const level=item.quantity<=item.threshold?'warning':'',expiryClass=left!==null&&left<0?'danger':left!==null&&left<=7?'warning':'';
      return `<article class="item" data-id="${item.id}"><div class="item-top"><h2>${clean(item.name)}</h2><span class="tag">${clean(item.category||'UNCATEGORIZED')}</span></div><div class="meta ${expiryClass}">${expiry}</div><div class="quantity ${level}"><button data-step="-1" aria-label="Decrease ${clean(item.name)}">−</button><strong>${item.quantity}</strong><button data-step="1" aria-label="Increase ${clean(item.name)}">+</button><span>on hand</span></div><div class="item-actions"><button data-edit>Edit</button><button data-delete>Delete</button></div></article>`
    }).join(''):'<div class="empty"><b>No matching items.</b><br>Add something you want to track locally.</div>';
  }
  function openEditor(id=''){
    editing=id;const item=items.find(value=>value.id===id)||{name:'',category:'',quantity:1,threshold:1,expiry:''};
    $('#editor-title').textContent=id?'EDIT ITEM':'ADD ITEM';$('#name').value=item.name;$('#item-category').value=item.category;$('#quantity').value=item.quantity;$('#threshold').value=item.threshold;$('#expiry').value=item.expiry||'';editor.showModal();$('#name').focus();
  }
  $('#add').onclick=()=>openEditor();
  editor.addEventListener('click',event=>{if(event.target===editor)editor.close()});remove.addEventListener('click',event=>{if(event.target===remove)remove.close()});
  $('#save').onclick=event=>{
    event.preventDefault();const name=$('#name').value.trim();if(!name){$('#name').focus();return}
    const existing=items.find(item=>item.id===editing),next={id:editing||crypto.randomUUID(),name,category:$('#item-category').value.trim(),quantity:Math.max(0,Number($('#quantity').value)||0),threshold:Math.max(0,Number($('#threshold').value)||0),expiry:$('#expiry').value,created:existing?.created||Date.now()};
    items=existing?items.map(item=>item.id===editing?next:item):[next,...items];persist();editor.close();render();
  };
  inventory.onclick=event=>{
    const card=event.target.closest('[data-id]');if(!card)return;const id=card.dataset.id;
    if(event.target.matches('[data-step]')){items=items.map(item=>item.id===id?{...item,quantity:Math.max(0,item.quantity+Number(event.target.dataset.step))}:item);persist();render()}
    if(event.target.matches('[data-edit]'))openEditor(id);
    if(event.target.matches('[data-delete]')){removing=id;remove.showModal()}
  };
  $('#confirm-remove').onclick=event=>{event.preventDefault();items=items.filter(item=>item.id!==removing);persist();remove.close();render()};
  ['#search','#category','#sort'].forEach(selector=>$(selector).addEventListener(selector==='#search'?'input':'change',render));render();
})();
