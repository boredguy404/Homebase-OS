(()=>{
  const host=document.querySelector('#device-center');
  if(!host)return;
  const gb=value=>`${(Number(value||0)/1024**3).toFixed(1)} GB`;
  const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const openFullscreen=async()=>{
    try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}
    catch{document.querySelector('#status').textContent='Fullscreen was blocked by the browser. Use the browser menu → Install app for the address-bar-free PWA.';}
  };
  async function paint(){
    host.innerHTML='<p class="device-center-loading">Reading local device state…</p>';
    const [setupResult,insightResult]=await Promise.allSettled([fetch('/api/setup/status').then(response=>response.json()),fetch('/api/insights').then(response=>response.json())]);
    if(setupResult.status!=='fulfilled'||insightResult.status!=='fulfilled'){host.innerHTML='<p class="device-center-error">Live device readings are unavailable. NovaShell can still use its local preferences, but check that the local server is running.</p>';return;}
    const setup=setupResult.value, insight=insightResult.value;
    const total=Number(insight.memory?.MemTotal||0),available=Number(insight.memory?.MemAvailable||0),used=Math.max(0,total-available),percent=total?Math.round(used/total*100):0;
    const load=Number(insight.load?.[0]||0), cpus=Math.max(1,Number(insight.cpu_count||1)), loadPercent=Math.round(load/cpus*100);
    const folders=(setup.folders||[]).map(folder=>`<li class="${folder.available?'ok':'warn'}"><b>${escape(folder.name)}</b><span>${folder.available?'available':'not found'}</span></li>`).join('');
    host.innerHTML=`
      <div class="device-summary"><div><small>LOCAL HELPER</small><b>${escape(setup.os||'Local system')}</b><span>${escape(setup.architecture||'unknown')} · Python ${escape(setup.python||'')}</span></div><button type="button" data-refresh>Refresh readings</button></div>
      <div class="device-metrics">
        <article><small>MEMORY</small><b>${percent}%</b><span>${gb(used)} used · ${gb(available)} free</span></article>
        <article><small>STORAGE</small><b>${gb(insight.disk?.free)} free</b><span>${gb(insight.disk?.used)} used · ${gb(insight.disk?.total)} total</span></article>
        <article><small>CPU DEMAND</small><b>${load.toFixed(2)} / ${cpus}</b><span>${loadPercent}% of available cores</span></article>
        <article><small>CONTROLLERS</small><b>${Number(setup.controllers||0)}</b><span>${Number(setup.controllers||0)?'Detected by Linux':'Connect then refresh'}</span></article>
      </div>
      <div class="device-columns">
        <article class="device-card"><small>NOVASHELL LOCAL</small><h3>What NovaShell can control</h3><ul><li>Theme, effects, CRT, controller hints, fullscreen, game scan folders, browser saves, and selective backups.</li><li>Files are restricted to your user home folder; installed-app and process readings are local and read-only.</li></ul><div class="actions"><button type="button" data-fullscreen>Toggle fullscreen</button><button type="button" data-open-setup>Choose scan folders</button><a class="setting-link" href="/pages/files.html?path=My%20Library">Open My Library</a></div></article>
        <article class="device-card"><small>CHROMEOS / BROWSER</small><h3>System-owned controls</h3><ul><li>Wi-Fi, brightness, battery, display, Android apps, Linux allocation, keyboard, and accessibility are owned by ChromeOS.</li><li>NovaShell cannot silently change them. These links open the official settings surface when Chrome allows it.</li></ul><div class="actions"><a class="setting-link" href="chrome://settings" target="_blank" rel="noopener">Open Chrome settings</a><a class="setting-link" href="chrome://os-settings/crostini" target="_blank" rel="noopener">Linux environment</a></div></article>
      </div>
      <article class="device-card scan-card"><small>GAME &amp; FILE SCAN</small><h3>${setup.configured?'Configured local folders':'Choose what NovaShell may scan'}</h3><p>${setup.configured?'The local helper uses only the approved folders below.':'No first-run scan choice is saved yet. Run welcome setup to choose local folders explicitly.'}</p><ul class="scan-folders">${folders||'<li><span>No configured folders yet.</span></li>'}</ul></article>`;
    host.querySelector('[data-refresh]').onclick=paint;
    host.querySelector('[data-fullscreen]').onclick=openFullscreen;
    host.querySelector('[data-open-setup]').onclick=()=>parent.openFirstRun?parent.openFirstRun(true):location.assign('/?setup=1');
  }
  paint();
  if(new URLSearchParams(location.search).get('capture')==='device')setTimeout(()=>host.scrollIntoView({block:'start'}),180);
})();
