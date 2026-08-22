(() => {
  const status = document.querySelector('#browser-save-status');
  const picker = document.querySelector('#browser-save-file');
  const wanted = name => name === '/data/saves' || name.startsWith('EmulatorJS-') || /IDBFS|saves/i.test(name);
  const binaryToBase64 = bytes => { let text=''; for(let offset=0;offset<bytes.length;offset+=32768)text+=String.fromCharCode(...bytes.subarray(offset,offset+32768));return btoa(text); };
  const encode = value => {
    if (value instanceof ArrayBuffer) return {__binary: binaryToBase64(new Uint8Array(value))};
    if (ArrayBuffer.isView(value)) return {__binary: binaryToBase64(new Uint8Array(value.buffer, value.byteOffset, value.byteLength))};
    if (Array.isArray(value)) return value.map(encode);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key,item]) => [key, encode(item)]));
    return value;
  };
  const decode = value => {
    if (value?.__binary) { const raw=atob(value.__binary), bytes=new Uint8Array(raw.length); for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i); return bytes.buffer; }
    if (Array.isArray(value)) return value.map(decode);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key,item]) => [key, decode(item)]));
    return value;
  };
  const open = (name, version) => new Promise((resolve,reject) => { const request=indexedDB.open(name,version);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error); });
  const all = request => new Promise((resolve,reject) => { request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error); });
  document.querySelector('#export-browser-saves').onclick = async () => {
    status.textContent='Reading private browser saves…';
    const databases=(await indexedDB.databases()).filter(db=>db.name&&wanted(db.name)), payload={format:'homebase-emulator-indexeddb-v1',created:new Date().toISOString(),databases:[]};
    for(const info of databases){const db=await open(info.name);const stores=[];for(const name of db.objectStoreNames){const tx=db.transaction(name,'readonly'),store=tx.objectStore(name),keys=await all(store.getAllKeys()),values=await all(store.getAll());stores.push({name,keyPath:store.keyPath,autoIncrement:store.autoIncrement,records:values.map((value,i)=>({key:encode(keys[i]),value:encode(value)}))})}payload.databases.push({name:db.name,version:db.version,stores});db.close()}
    const blob=new Blob([JSON.stringify(payload)],{type:'application/json'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='homebase-browser-saves-'+new Date().toISOString().slice(0,10)+'.json';link.click();URL.revokeObjectURL(link.href);status.textContent='Exported '+databases.length+' emulator databases.';
  };
  document.querySelector('#import-browser-saves').onclick=()=>picker.click();
  picker.onchange=async()=>{try{const payload=JSON.parse(await picker.files[0].text());if(payload.format!=='homebase-emulator-indexeddb-v1')throw new Error('not a Homebase browser-save package');if(!confirm('Merge '+payload.databases.length+' browser save databases? Existing unrelated saves remain.'))return;for(const item of payload.databases){let db;const request=indexedDB.open(item.name,item.version);request.onupgradeneeded=()=>item.stores.forEach(store=>{if(!request.result.objectStoreNames.contains(store.name))request.result.createObjectStore(store.name,{keyPath:store.keyPath||undefined,autoIncrement:store.autoIncrement})});db=await new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});for(const itemStore of item.stores){const tx=db.transaction(itemStore.name,'readwrite'),store=tx.objectStore(itemStore.name);for(const record of itemStore.records){const value=decode(record.value),key=decode(record.key);store.keyPath?store.put(value):store.put(value,key)}await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}db.close()}status.textContent='Browser saves merged. Reload a game to use them.'}catch(error){status.textContent='Import failed: '+error.message}};
})();
