addEventListener('DOMContentLoaded', () => {
  document.head.insertAdjacentHTML('beforeend', '<style>.status{grid-template-columns:repeat(5,minmax(0,1fr))!important}@media(max-width:820px){.status{grid-template-columns:repeat(3,minmax(0,1fr))!important}}@media(max-width:600px){.status{grid-template-columns:repeat(2,minmax(0,1fr))!important}}</style>');
  document.head.insertAdjacentHTML('beforeend', '<style>.metric:after{content:"TAP FOR LIVE DETAILS";display:block;margin-top:9px;color:rgb(var(--signal-alt-rgb));font-size:7px;letter-spacing:.12em}.live-facts{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:18px 0}.live-facts div{padding:13px;border:1px solid #ffffff18;border-radius:12px;background:#ffffff08}.live-facts b,.live-facts span{display:block}.live-facts span{margin-top:4px;color:#a8a8a8;font-size:9px}.readiness{padding:14px;margin:18px 0;border:1px solid #ffffff28;border-radius:13px;background:#0d1519}.readiness h3{margin:0 0 5px}.readiness>p{margin:0;color:#c6d4d9;font-size:11px}.readiness-list{display:grid;gap:7px;margin:12px 0}.readiness-list div{display:grid;grid-template-columns:auto 1fr;gap:8px;align-items:start;padding:9px;border:1px solid #ffffff18;border-radius:9px;background:#ffffff08;font-size:11px}.readiness-list i{font-style:normal;color:rgb(var(--signal-alt-rgb))}.readiness-list b,.readiness-list span{display:block}.readiness-list span{margin-top:2px;color:#a8a8a8;font-size:10px}.readiness-actions{display:flex;gap:7px;flex-wrap:wrap}.readiness-actions button{min-height:38px;padding:0 11px}.insight-list small{color:#777;font-size:8px}.explain{font-size:11px}html[data-theme="ultra-retro"] .readiness{border:2px inset #eee;border-radius:0;background:#fff;color:#111}html[data-theme="ultra-retro"] .readiness>p,html[data-theme="ultra-retro"] .readiness-list span{color:#111}html[data-theme="ultra-retro"] .readiness-list div{border:1px solid #777;border-radius:0;background:#eee}html[data-theme="ultra-retro"] .readiness-list i{color:#000080}@media(max-width:650px){.live-facts{grid-template-columns:1fr 1fr}}</style>');
  const status = document.querySelector('.status');
  if (status && !document.querySelector('#uptime-metric')) status.insertAdjacentHTML('beforeend', '<div class="metric" id="uptime-metric"><b>—</b><span>Linux uptime</span></div><div class="metric" id="process-metric"><b>—</b><span>Live processes</span></div>');
  if (status && !document.querySelector('#system-terminal-card')) {
    status.classList.add('legacy-system-metrics');
    const terminal=document.createElement('button');terminal.type='button';terminal.id='system-terminal-card';terminal.className='system-terminal-card';terminal.setAttribute('aria-label','Open live system activity');
    terminal.innerHTML='<span class="system-mark" aria-hidden="true">◈</span><span class="system-terminal-copy"><small>NOVASHELL · LOCAL SYSTEM</small><b>Reading this machine…</b><em>Tap for system activity, device readiness, storage, processes, and larger-file details.</em></span><span class="system-terminal-stats"><i>MEM —</i><i>DISK —</i><i>LOAD —</i></span><span class="system-terminal-open">OPEN ▸</span>';
    status.before(terminal);
    terminal.addEventListener('click',()=>document.querySelector('.metric')?.click());
  }
  document.head.insertAdjacentHTML('beforeend','<style>.legacy-system-metrics{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;white-space:nowrap!important}.system-terminal-card{width:100%;display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;gap:15px;align-items:center;margin:0 0 30px;padding:15px 18px;border:1px solid var(--line);border-radius:16px;background:linear-gradient(120deg,#0e191fdd,#172a2bca 55%,#101417dc);color:var(--text);text-align:left;cursor:pointer;box-shadow:inset 0 1px #ffffff1f,0 12px 30px #0003}.system-mark{display:grid;place-items:center;width:40px;height:40px;border:1px solid rgb(var(--signal-alt-rgb));border-radius:50%;color:rgb(var(--signal-alt-rgb));font-size:20px;box-shadow:0 0 22px rgba(var(--signal-alt-rgb),.28);animation:systemMark 2.8s steps(2,end) infinite}.system-terminal-copy small,.system-terminal-copy b,.system-terminal-copy em{display:block}.system-terminal-copy small{color:rgb(var(--signal-alt-rgb));font:700 9px ui-monospace,monospace;letter-spacing:.14em}.system-terminal-copy b{margin:3px 0;font:700 16px ui-monospace,monospace}.system-terminal-copy em{color:var(--muted);font:11px Manrope,system-ui,sans-serif;font-style:normal}.system-terminal-stats{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.system-terminal-stats i{padding:4px 6px;border:1px solid #ffffff24;border-radius:5px;color:#d8f1f4;font:10px ui-monospace,monospace;font-style:normal}.system-terminal-open{color:rgb(var(--signal-alt-rgb));font:700 10px ui-monospace,monospace;letter-spacing:.1em}@keyframes systemMark{50%{transform:rotate(45deg);filter:brightness(1.2)}}html[data-theme="ultra-retro"] .system-terminal-card{border:2px solid #111;border-radius:0;background:#d4d4d4;color:#111;box-shadow:inset 2px 2px #fff,inset -2px -2px #666,4px 4px #111}html[data-theme="ultra-retro"] .system-mark{border:2px solid #000080;border-radius:0;color:#000080;box-shadow:2px 2px #111}html[data-theme="ultra-retro"] .system-terminal-copy small,html[data-theme="ultra-retro"] .system-terminal-open{color:#000080}html[data-theme="ultra-retro"] .system-terminal-copy em{color:#222}html[data-theme="ultra-retro"] .system-terminal-stats i{border:1px solid #555;border-radius:0;background:#eee;color:#111}@media(max-width:720px){.system-terminal-card{grid-template-columns:auto 1fr;gap:9px}.system-terminal-stats{justify-content:flex-start;grid-column:2}.system-terminal-open{display:none}}@media(prefers-reduced-motion:reduce){.system-mark{animation:none}}</style>');
  const cards = [...document.querySelectorAll('.metric')];
  const dialog = document.createElement('dialog');
  dialog.className = 'insight-dialog';
  dialog.innerHTML = '<button class="insight-x">×</button><small>LIVE · TAP ANY STATUS CARD</small><h2>System activity</h2><p id="insight-rating">Reading this Chromebook…</p><div id="live-facts" class="live-facts"></div><section id="readiness" class="readiness"><h3>Device readiness</h3><p>Turning local measurements into safe, useful next steps…</p></section><section><h3>Storage composition</h3><div id="composition" class="composition"></div></section><section><h3>Real running processes</h3><p class="explain">Sorted by CPU use. Read-only for touch safety.</p><div id="processes" class="insight-list skeleton-list"></div></section><section><h3>Largest personal files</h3><div id="largest" class="insight-list skeleton-list"></div></section>';
  document.body.appendChild(dialog);
  dialog.querySelector('.insight-x').onclick = () => dialog.close();
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  const human = bytes => bytes > 1073741824 ? (bytes / 1073741824).toFixed(1) + ' GB' : (bytes / 1048576).toFixed(1) + ' MB';
  const duration = seconds => seconds > 86400 ? Math.floor(seconds / 86400) + 'd' : seconds > 3600 ? Math.floor(seconds / 3600) + 'h' : Math.floor(seconds / 60) + 'm';
  function go(url) { if (window.openPanel) window.openPanel(url); else location.href = url; }
  function paintReadiness(data, setup) {
    const memoryPercent = Math.round((data.memory.MemTotal - data.memory.MemAvailable) / data.memory.MemTotal * 100);
    const freeGb = data.disk.free / 1073741824;
    const load = data.load[0] / Math.max(1, data.cpu_count);
    const items = [];
    if (memoryPercent >= 84) items.push(['!', 'Memory is tight', memoryPercent + '% is in use. Close heavy apps or turn on reduced effects before starting a demanding N64 or PlayStation game.', 'settings', 'Open performance settings']);
    else items.push(['✓', 'Memory has headroom', memoryPercent + '% is in use. The system has room for normal Homebase work.', '', '']);
    if (freeGb < 8) items.push(['!', 'Storage is getting low', freeGb.toFixed(1) + ' GB remains. Review the largest personal files before importing more media or games.', 'library', 'Review storage']);
    else items.push(['✓', 'Storage is comfortable', freeGb.toFixed(1) + ' GB remains. Imports and backups have reasonable breathing room.', '', '']);
    if (load >= .9) items.push(['!', 'System is busy', 'Current load is high for this device. Wait for the busy process to settle before launching a game.', '', '']);
    else items.push(['✓', 'System load is calm', 'Current CPU demand is within a comfortable range for this machine.', '', '']);
    if (!setup.configured) items.push(['i', 'Welcome setup is unfinished', 'Choose the folders Homebase may suggest and get the local-first boundaries explained once.', 'setup', 'Run welcome setup']);
    else if (!setup.controllers) items.push(['i', 'No controller is connected', 'Touch and keyboard are ready. Connect an Xbox controller when you want console-style navigation.', '', '']);
    else items.push(['✓', setup.controllers + ' controller' + (setup.controllers === 1 ? '' : 's') + ' detected', 'Controller hints are available where a page supports them.', '', '']);
    const section = dialog.querySelector('#readiness');
    section.querySelector('p').textContent = items.some(item => item[0] === '!') ? 'A few safe actions could make this machine more comfortable.' : 'This device looks ready for regular Homebase use.';
    section.querySelector('.readiness-list')?.remove(); section.querySelector('.readiness-actions')?.remove();
    const list = document.createElement('div'); list.className = 'readiness-list';
    const actionKeys = new Set();
    items.forEach(([mark,title,detail,action,label]) => { const row=document.createElement('div'),icon=document.createElement('i'),copy=document.createElement('span'),heading=document.createElement('b'),body=document.createElement('span');icon.textContent=mark;heading.textContent=title;body.textContent=detail;copy.append(heading,body);row.append(icon,copy);list.append(row);if(action)actionKeys.add(action); });
    section.append(list);
    if (actionKeys.size) { const actions=document.createElement('div');actions.className='readiness-actions';actionKeys.forEach(action=>{const item=items.find(value=>value[3]===action),button=document.createElement('button');button.type='button';button.textContent=item[4];button.onclick=()=>go(action==='settings'?'/pages/settings.html?panel=play':action==='library'?'/pages/files.html?path=My%20Library':'/?setup=1');actions.append(button)});section.append(actions); }
  }
  function paintSystemCard(data, setup) {
    const card=document.querySelector('#system-terminal-card'); if(!card)return;
    const used=Math.round((data.memory.MemTotal-data.memory.MemAvailable)/data.memory.MemTotal*100), free=(data.disk.free/1073741824).toFixed(1), load=data.load[0],cpus=data.cpu_count;
    card.querySelector('.system-terminal-copy b').textContent=(setup.os||'Local system')+' · '+(setup.architecture||'unknown');
    card.querySelector('.system-terminal-copy em').textContent=(setup.controllers||0)+' controller'+(setup.controllers===1?'':'s')+' · '+(setup.configured?'scan folders configured':'welcome setup still needs a folder choice')+' · live local readings';
    const stats=card.querySelectorAll('.system-terminal-stats i');stats[0].textContent='MEM '+used+'%';stats[1].textContent='DISK '+free+'G';stats[2].textContent='LOAD '+load.toFixed(2)+'/'+cpus;
  }
  async function refresh() {
    const [data, setup] = await Promise.all([fetch('/api/insights', {cache: 'no-store'}).then(r => r.json()), fetch('/api/setup/status', {cache: 'no-store'}).then(r => r.ok ? r.json() : ({})).catch(() => ({}))]);
    const uptimeCard=document.querySelector('#uptime-metric b'),processCard=document.querySelector('#process-metric b');if(uptimeCard)uptimeCard.textContent=duration(data.uptime_seconds);if(processCard)processCard.textContent=data.processes.length;
    const load = data.load[0];
    const rating = load < data.cpu_count * .55 ? 'Running comfortably' : load < data.cpu_count ? 'Working, but healthy' : 'Under heavy load';
    const view=Number(dialog.dataset.view||2);dialog.querySelector('#insight-rating').textContent = view===0?'Storage is split by Homebase areas; large-file details are shown below.':view===1?'Memory usage is live; this view focuses on the processes using resources.':rating + ' · ' + load.toFixed(2) + ' load across ' + data.cpu_count + ' CPU threads';
    const usedMemory = data.memory.MemTotal - data.memory.MemAvailable;
    dialog.querySelector('#live-facts').innerHTML = '<div><b>' + human(usedMemory) + '</b><span>memory in use</span></div><div><b>' + human(data.disk.free) + '</b><span>storage free</span></div><div><b>' + duration(data.uptime_seconds) + '</b><span>Linux uptime</span></div><div><b>' + data.processes.length + '</b><span>top processes shown</span></div>';
    const total = Object.values(data.composition).reduce((a,b) => a + b, 0) || 1;
    dialog.querySelector('#composition').innerHTML = Object.entries(data.composition).map(([name, bytes]) => '<div><span>' + name + ' <b>' + human(bytes) + '</b></span><i style="--w:' + (bytes / total * 100) + '%"></i></div>').join('');
    const processList = dialog.querySelector('#processes');
    processList.classList.remove('skeleton-list');
    processList.innerHTML = data.processes.map(item => '<div><b>' + item.name + ' <small>PID ' + item.pid + '</small></b><span>' + item.cpu.toFixed(1) + '% CPU · ' + item.mb + ' MB · ' + duration(item.seconds) + '</span></div>').join('');
    const largest = dialog.querySelector('#largest');
    largest.classList.remove('skeleton-list');
    largest.innerHTML = data.largest.map(file => '<div><b>' + file.name + '</b><span>' + file.path + ' · ' + human(file.bytes) + '</span></div>').join('') || '<p>No personal files yet.</p>';
    paintReadiness(data, setup);
    paintSystemCard(data, setup);
  }
  async function open(index = 2) { const views=[['Storage details','Storage composition and the largest files taking space on this device.'],['Memory details','Live memory pressure and the processes using the most resources.'],['System load details','Live CPU load, uptime, and the busiest current processes.']];const view=views[index]||views[2];dialog.querySelector('h2').textContent=view[0];dialog.querySelector('#insight-rating').textContent=view[1];dialog.dataset.view=index;dialog.showModal();await refresh();const sections=[...dialog.querySelectorAll('section')];sections[0].hidden=index===1;sections[1].hidden=index===0;sections[2].hidden=index!==0; }
  cards.forEach(card => {
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', card.textContent.trim() + '. Open live system details');
    const index=cards.indexOf(card);card.onclick = () => open(index);
    card.onkeydown = event => (event.key === 'Enter' || event.key === ' ') && open(index);
  });
  refresh().catch(()=>{});
  if (new URLSearchParams(location.search).get('capture') === 'system') setTimeout(() => open(2), 180);
});
