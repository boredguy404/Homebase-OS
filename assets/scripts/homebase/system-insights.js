addEventListener('DOMContentLoaded', () => {
  document.head.insertAdjacentHTML('beforeend', '<style>.status{grid-template-columns:repeat(5,minmax(0,1fr))!important}@media(max-width:820px){.status{grid-template-columns:repeat(3,minmax(0,1fr))!important}}@media(max-width:600px){.status{grid-template-columns:repeat(2,minmax(0,1fr))!important}}</style>');
  document.head.insertAdjacentHTML('beforeend', '<style>.metric:after{content:"TAP FOR LIVE DETAILS";display:block;margin-top:9px;color:rgb(var(--signal-alt-rgb));font-size:7px;letter-spacing:.12em}.live-facts{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:18px 0}.live-facts div{padding:13px;border:1px solid #ffffff18;border-radius:12px;background:#ffffff08}.live-facts b,.live-facts span{display:block}.live-facts span{margin-top:4px;color:#a8a8a8;font-size:9px}.insight-list small{color:#777;font-size:8px}.explain{font-size:11px}@media(max-width:650px){.live-facts{grid-template-columns:1fr 1fr}}</style>');
  const status = document.querySelector('.status');
  if (status && !document.querySelector('#uptime-metric')) status.insertAdjacentHTML('beforeend', '<div class="metric" id="uptime-metric"><b>—</b><span>Linux uptime</span></div><div class="metric" id="process-metric"><b>—</b><span>Live processes</span></div>');
  const cards = [...document.querySelectorAll('.metric')];
  const dialog = document.createElement('dialog');
  dialog.className = 'insight-dialog';
  dialog.innerHTML = '<button class="insight-x">×</button><small>LIVE · TAP ANY STATUS CARD</small><h2>System activity</h2><p id="insight-rating">Reading this Chromebook…</p><div id="live-facts" class="live-facts"></div><section><h3>Storage composition</h3><div id="composition" class="composition"></div></section><section><h3>Real running processes</h3><p class="explain">Sorted by CPU use. Read-only for touch safety.</p><div id="processes" class="insight-list skeleton-list"></div></section><section><h3>Largest personal files</h3><div id="largest" class="insight-list skeleton-list"></div></section>';
  document.body.appendChild(dialog);
  dialog.querySelector('.insight-x').onclick = () => dialog.close();
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  const human = bytes => bytes > 1073741824 ? (bytes / 1073741824).toFixed(1) + ' GB' : (bytes / 1048576).toFixed(1) + ' MB';
  const duration = seconds => seconds > 86400 ? Math.floor(seconds / 86400) + 'd' : seconds > 3600 ? Math.floor(seconds / 3600) + 'h' : Math.floor(seconds / 60) + 'm';
  async function refresh() {
    const data = await fetch('/api/insights', {cache: 'no-store'}).then(r => r.json());
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
  }
  async function open(index = 2) { const views=[['Storage details','Storage composition and the largest files taking space on this device.'],['Memory details','Live memory pressure and the processes using the most resources.'],['System load details','Live CPU load, uptime, and the busiest current processes.']];const view=views[index]||views[2];dialog.querySelector('h2').textContent=view[0];dialog.querySelector('#insight-rating').textContent=view[1];dialog.dataset.view=index;dialog.showModal();await refresh();const sections=[...dialog.querySelectorAll('section')];sections[0].hidden=index===1;sections[1].hidden=index===0;sections[2].hidden=index!==0; }
  cards.forEach(card => {
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', card.textContent.trim() + '. Open live system details');
    const index=cards.indexOf(card);card.onclick = () => open(index);
    card.onkeydown = event => (event.key === 'Enter' || event.key === ' ') && open(index);
  });
});
