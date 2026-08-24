(()=>{
  const DIRECTORY='/api/transit/stations',PUBLIC_DIRECTORY='https://data.cityofchicago.org/resource/8pix-ypme.json?$limit=1200',CACHE='novashell-rail-stations-v1';
  const $=selector=>document.querySelector(selector),host=$('#stations');
  const routes={red:['Red','#c60c30'],blue:['Blue','#00a1de'],g:['Green','#009b3a'],brn:['Brown','#8b5a2b'],o:['Orange','#f57c00'],p:['Purple','#7b4ab4'],pnk:['Pink','#d96d9e'],y:['Yellow','#b89b00']};
  let stations=[],locationPoint=null,transit={cta_configured:false,metra_configured:false};
  document.head.insertAdjacentHTML('beforeend','<link rel="stylesheet" href="live.css?v=1">');
  const dialog=document.createElement('dialog');dialog.className='arrival-dialog';dialog.innerHTML='<div class="arrival-title"><b>LIVE TRAIN BOARD</b><button aria-label="Close arrivals">×</button></div><section class="arrival-head"><h2>Station</h2><p>Contacting CTA Train Tracker…</p><div class="transit-status"></div></section><section class="arrival-list"><div class="arrival-empty">Loading predictions…</div></section><footer class="arrival-foot"><span>Predictions can change.</span><button id="arrival-refresh">Refresh</button></footer>';document.body.append(dialog);
  function clean(value){const node=document.createElement('span');node.textContent=String(value||'');return node.innerHTML}
  function distance(a,b,c,d){const r=3959,toRad=value=>value*Math.PI/180,x=toRad(c-a),y=toRad(d-b),q=Math.sin(x/2)**2+Math.cos(toRad(a))*Math.cos(toRad(c))*Math.sin(y/2)**2;return 2*r*Math.asin(Math.sqrt(q))}
  function normalize(rows){const by=new Map;for(const row of rows){if(!row.map_id)continue;const found=by.get(row.map_id)||{id:row.map_id,name:row.station_name,description:row.station_descriptive_name,ada:Boolean(row.ada),lat:Number(row.location?.latitude),lon:Number(row.location?.longitude),lines:[]};for(const key of Object.keys(routes))if(row[key]===true&&!found.lines.includes(key))found.lines.push(key);by.set(row.map_id,found)}return [...by.values()].sort((a,b)=>a.name.localeCompare(b.name))}
  function render(){
    const term=$('#search').value.trim().toLowerCase(),line=$('#line').value,ada=$('#ada').checked;
    let shown=stations.filter(station=>(!term||`${station.name} ${station.description}`.toLowerCase().includes(term))&&(!line||station.lines.includes(line))&&(!ada||station.ada));
    if(locationPoint)shown.sort((a,b)=>distance(locationPoint[0],locationPoint[1],a.lat,a.lon)-distance(locationPoint[0],locationPoint[1],b.lat,b.lon));
    host.innerHTML=shown.length?shown.map(station=>`<article class="station"><h2>${clean(station.name)}</h2><p>${clean(station.description)}</p><div class="lines">${station.lines.map(key=>`<span class="line" style="color:${routes[key]?.[1]||'#526e7a'}">${routes[key]?.[0]||clean(key)}</span>`).join('')}</div><footer><span>${station.ada?'ACCESSIBLE':'ACCESS VARIES'}</span><span>${locationPoint?distance(locationPoint[0],locationPoint[1],station.lat,station.lon).toFixed(1)+' mi away':'MAP ID '+station.id}</span></footer><button data-arrivals="${station.id}" ${transit.cta_configured?'':'disabled'}>${transit.cta_configured?'Live arrivals':'CTA key unavailable'}</button></article>`).join(''):'<div class="empty">No stations match those filters.</div>';
    $('#status').textContent=`${shown.length} of ${stations.length} stations · ${locationPoint?'sorted nearest first':'alphabetical'}`;
  }
  function fillTripSelectors(){
    const options=stations.map(station=>`<option value="${station.id}">${clean(station.name)} · ${station.lines.map(key=>routes[key]?.[0]||key).join('/')}</option>`).join('');
    $('#trip-from').insertAdjacentHTML('beforeend',options);$('#trip-to').insertAdjacentHTML('beforeend',options);
  }
  function tripMessage(title,body,kind=''){$('#trip-result').className=`trip-result ${kind}`;$('#trip-result').innerHTML=`<h3>${clean(title)}</h3><p>${clean(body)}</p>`}
  async function planTrip(){
    const from=stations.find(station=>station.id===$('#trip-from').value),to=stations.find(station=>station.id===$('#trip-to').value);
    if(!from||!to){tripMessage('Choose both stations','Select a departure and arrival station first.','warn');return}if(from.id===to.id){tripMessage('Same station selected','Choose two different stations to build a useful departure board.','warn');return}
    const shared=from.lines.filter(line=>to.lines.includes(line));if(!shared.length){tripMessage(`${from.name} → ${to.name}`,'These stations do not share a direct L line. NovaShell will not invent an unverified transfer route; use the station cards below to inspect each leg.','transfer');return}
    const lineNames=shared.map(key=>routes[key]?.[0]||key),result=$('#trip-result');result.className='trip-result loading';result.innerHTML=`<h3>${clean(from.name)} → ${clean(to.name)}</h3><p>Checking ${clean(lineNames.join(' / '))} departures…</p>`;
    if(!transit.cta_configured){result.className='trip-result warn';result.innerHTML=`<h3>${clean(from.name)} → ${clean(to.name)}</h3><p>Direct via ${clean(lineNames.join(' / '))}. Add your CTA Train Tracker key locally to show upcoming departures.</p>`;return}
    try{
      const response=await fetch(`/api/transit/cta/arrivals?station=${encodeURIComponent(from.id)}`,{cache:'no-store'}),data=await response.json();if(!response.ok)throw Error(data.error||'Predictions unavailable');
      const matching=(data.arrivals||[]).filter(item=>lineNames.some(name=>String(item.line).startsWith(name)));
      result.className='trip-result';result.innerHTML=`<h3>${clean(from.name)} → ${clean(to.name)}</h3><p class="trip-direct">DIRECT · ${clean(lineNames.join(' / '))}</p>${matching.length?matching.map(item=>`<article class="trip-train"><i style="--line:${item.color}"></i><span><b>Toward ${clean(item.destination)}</b><small>${clean(item.line)} · Run ${clean(item.run||'—')}</small></span><strong>${item.approaching?'DUE':item.due==null?'—':item.due+' min'}</strong></article>`).join(''):'<p>No matching departures are predicted right now.</p>'}<p class="trip-hint">Confirm the train destination is traveling toward ${clean(to.name)}. This board shows direct-line predictions, not turn-by-turn navigation.</p>`;
    }catch(error){tripMessage(`${from.name} → ${to.name}`,`${lineNames.join(' / ')} is direct, but live predictions are temporarily unavailable: ${error.message}.`,'warn')}
  }
  async function openArrivals(stationId){
    const station=stations.find(item=>item.id===stationId);dialog.dataset.station=stationId;dialog.querySelector('h2').textContent=station?.name||'CTA station';dialog.querySelector('.arrival-head p').textContent='Contacting CTA Train Tracker…';dialog.querySelector('.arrival-list').innerHTML='<div class="arrival-empty">Loading predictions…</div>';dialog.showModal();
    try{
      const response=await fetch(`/api/transit/cta/arrivals?station=${encodeURIComponent(stationId)}`,{cache:'no-store'}),data=await response.json();if(!response.ok)throw Error(data.error||'Predictions unavailable');
      dialog.querySelector('.arrival-head p').textContent=`Generated ${data.generated||'just now'} · ${data.source}`;
      dialog.querySelector('.arrival-list').innerHTML=data.arrivals.length?data.arrivals.map(item=>`<article class="arrival ${item.delayed?'delayed':''} ${item.approaching?'approaching':''}"><i style="--line:${item.color}"></i><div><b>${clean(item.line)} toward ${clean(item.destination)}</b><span>Run ${clean(item.run||'—')} · ${item.delayed?'DELAYED':item.scheduled?'SCHEDULED':'PREDICTED'}</span></div><strong>${item.approaching?'DUE':item.due==null?'—':item.due+' min'}</strong></article>`).join(''):'<div class="arrival-empty">CTA returned no current predictions for this station.</div>';
    }catch(error){dialog.querySelector('.arrival-head p').textContent='Live feed unavailable';dialog.querySelector('.arrival-list').innerHTML=`<div class="arrival-empty">${clean(error.message)}. The station directory still works.</div>`}
  }
  async function load(){
    try{transit=await fetch('/api/transit/status',{cache:'no-store'}).then(response=>response.json())}catch{}
    const badges=document.createElement('div');badges.className='transit-status';badges.innerHTML=`<span>CTA ${transit.cta_configured?'LIVE KEY READY':'DIRECTORY ONLY'}</span><span>METRA ${transit.metra_configured?'TOKEN STORED':'NOT CONFIGURED'}</span>`;document.querySelector('.notice').append(badges);
    let source='local server';
    try{const response=await fetch(DIRECTORY,{cache:'no-store'}),data=await response.json();if(!response.ok)throw Error();stations=data.stations||[];localStorage.setItem(CACHE,JSON.stringify({saved:Date.now(),stations}))}
    catch{try{const rows=await fetch(PUBLIC_DIRECTORY).then(response=>response.json());stations=normalize(rows);localStorage.setItem(CACHE,JSON.stringify({saved:Date.now(),stations}));source='public fallback'}catch{let cached=null;try{cached=JSON.parse(localStorage.getItem(CACHE)||'null')}catch{}stations=cached?.stations||[];source=stations.length?'cached copy':'unavailable'}}
    for(const [key,[name]] of Object.entries(routes))$('#line').insertAdjacentHTML('beforeend',`<option value="${key}">${name} Line</option>`);if(!stations.length){$('#status').textContent='Station directory unavailable and no local cache exists.';return}fillTripSelectors();render();$('#status').textContent+=` · ${source}`;
  }
  ['#search','#line','#ada'].forEach(selector=>$(selector).addEventListener(selector==='#search'?'input':'change',render));$('#plan-trip').onclick=planTrip;host.onclick=event=>{const button=event.target.closest('[data-arrivals]');if(button)openArrivals(button.dataset.arrivals)};dialog.querySelector('.arrival-title button').onclick=()=>dialog.close();dialog.onclick=event=>{if(event.target===dialog)dialog.close()};dialog.querySelector('#arrival-refresh').onclick=()=>openArrivals(dialog.dataset.station);
  $('#nearest').onclick=()=>{if(!navigator.geolocation){$('#status').textContent='Location is not available in this browser.';return}$('#status').textContent='Requesting this device location…';navigator.geolocation.getCurrentPosition(position=>{locationPoint=[position.coords.latitude,position.coords.longitude];render()},()=>{$('#status').textContent='Location permission was not granted. The alphabetical directory still works.'},{timeout:8000,maximumAge:300000})};load();
})();
