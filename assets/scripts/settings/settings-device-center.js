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
      <article class="device-card scan-card"><small>GAME &amp; FILE SCAN</small><h3>${setup.configured?'Configured local folders':'Choose what NovaShell may scan'}</h3><p>${setup.configured?'The local helper uses only the approved folders below.':'No first-run scan choice is saved yet. Run welcome setup to choose local folders explicitly.'}</p><ul class="scan-folders">${folders||'<li><span>No configured folders yet.</span></li>'}</ul></article>
      <article class="device-card controller-smoke"><small>CONTROLLER SMOKE TEST</small><h3>Check browser gamepad routing</h3><p id="controller-smoke-copy">Connect an Xbox controller, then press a button here. NovaShell will show what the browser can actually see before you launch a game.</p><div class="controller-smoke-readout" aria-live="polite"><b id="controller-browser-count">0 browser controllers</b><span id="controller-smoke-state">Waiting for a browser gamepad…</span></div><div class="actions"><button type="button" data-controller-refresh>Refresh controllers</button><button type="button" data-controller-arm>Start button check</button><a class="setting-link" href="/pages/arcade.html">Open Pocket Archive</a></div><ol class="controller-smoke-steps"><li>On the shelf: D-pad moves, A opens, B dismisses a detail sheet or returns Home.</li><li>In a running game: B belongs to the emulator; NovaShell navigation is disabled.</li><li>With two controllers: player one and player two are forwarded when the game supports multiplayer.</li></ol></article>`;
    host.querySelector('[data-refresh]').onclick=paint;
    host.querySelector('[data-fullscreen]').onclick=openFullscreen;
    host.querySelector('[data-open-setup]').onclick=()=>parent.openFirstRun?parent.openFirstRun(true):location.assign('/?setup=1');
    const count=host.querySelector('#controller-browser-count'),state=host.querySelector('#controller-smoke-state'),refreshControllers=()=>{
      const pads=[...(navigator.getGamepads?.()||[])].filter(Boolean),names=pads.map((pad,index)=>'P'+(index+1)+' '+String(pad.id||'controller').replace(/\s*\([^)]*\)/,'')).join(' · ');
      count.textContent=pads.length+' browser controller'+(pads.length===1?'':'s');
      state.textContent=pads.length?(names+(pads.length>1?' · player two can be forwarded in supported games.':' · connect a second pad for player-two routing.')):'Waiting for a browser gamepad…';
      return pads;
    };
    const refreshButton=host.querySelector('[data-controller-refresh]'); refreshButton.onclick=refreshControllers; addEventListener('gamepadconnected',refreshControllers,{once:true}); refreshControllers();
    host.querySelector('[data-controller-arm]').onclick=()=>{
      const button=host.querySelector('[data-controller-arm]');button.disabled=true;button.textContent='Press any controller button…';state.textContent='Listening for A, B, a D-pad direction, or any other controller input…';const until=Date.now()+12000;
      const poll=()=>{const pads=refreshControllers(),hit=pads.flatMap((pad,index)=>[...pad.buttons].map((value,buttonIndex)=>value.pressed?{index,buttonIndex}:null)).find(Boolean);if(hit){state.textContent='Input received from player '+(hit.index+1)+' · button '+hit.buttonIndex+'. Shelf and player routing are ready to test.';button.disabled=false;button.textContent='Start button check';return}if(Date.now()<until){requestAnimationFrame(poll);return}state.textContent='No button was seen. Wake the controller, press A once in Chrome, then try again.';button.disabled=false;button.textContent='Start button check'};poll();
    };
  }
  paint();
  if(new URLSearchParams(location.search).get('capture')==='device')setTimeout(()=>host.scrollIntoView({block:'start'}),180);
})();
