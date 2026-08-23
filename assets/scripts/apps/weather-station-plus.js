(()=>{
  const $=s=>document.querySelector(s),labels={0:'Clear',1:'Mostly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Rime fog',51:'Drizzle',61:'Rain',71:'Snow',80:'Showers',95:'Thunderstorms'};
  const number=value=>value==null?'—':Math.round(Number(value));
  const direction=value=>['N','NE','E','SE','S','SW','W','NW'][Math.round((Number(value)||0)/45)%8];
  const card=([label,value])=>'<article><small>'+label+'</small><b>'+value+'</b></article>';
  function ensure(className,before){let node=document.querySelector('.'+className);if(!node){node=document.createElement('section');node.className=className;before.insertAdjacentElement('beforebegin',node)}return node}
  async function show(){
    const place=$('#place')?.value.trim();if(!place)return;
    document.querySelector('.mast small')?.replaceChildren(document.createTextNode('LIVE LOCAL FORECAST'));
    document.querySelector('.mast>span')?.remove();
    try{
      const geo=await fetch('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(place)+'&count=1&language=en&format=json').then(r=>r.json()),hit=geo.results?.[0];if(!hit)return;
      const params=new URLSearchParams({latitude:hit.latitude,longitude:hit.longitude,timezone:'auto',temperature_unit:'fahrenheit',wind_speed_unit:'mph',precipitation_unit:'inch',current:'apparent_temperature,relative_humidity_2m,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility',hourly:'temperature_2m,precipitation_probability,weather_code',daily:'sunrise,sunset,uv_index_max,precipitation_probability_max'});
      const [data,air]=await Promise.all([fetch('https://api.open-meteo.com/v1/forecast?'+params).then(r=>r.json()),fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude='+hit.latitude+'&longitude='+hit.longitude+'&current=us_aqi,pm10,pm2_5,carbon_monoxide,ozone&timezone=auto').then(r=>r.json()).catch(()=>({}))]),now=data.current,forecast=$('#forecast');
      const instruments=ensure('weather-instruments',forecast);
      instruments.innerHTML=[['FEELS LIKE',number(now.apparent_temperature)+'°'],['HUMIDITY',number(now.relative_humidity_2m)+'%'],['WIND',number(now.wind_speed_10m)+' mph '+direction(now.wind_direction_10m)],['GUSTS',number(now.wind_gusts_10m)+' mph'],['PRECIP NOW',Number(now.precipitation||0).toFixed(2)+' in'],['RAIN CHANCE',number(data.daily?.precipitation_probability_max?.[0])+'%'],['VISIBILITY',((Number(now.visibility)||0)/1609.344).toFixed(1)+' mi'],['PRESSURE',number(now.pressure_msl)+' hPa'],['UV TODAY',number(data.daily?.uv_index_max?.[0])],['US AQI',number(air.current?.us_aqi)],['PM2.5',number(air.current?.pm2_5)+' μg/m³'],['OZONE',number(air.current?.ozone)+' μg/m³'],['SUNRISE',data.daily?.sunrise?.[0]?new Date(data.daily.sunrise[0]).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):'—'],['SUNSET',data.daily?.sunset?.[0]?new Date(data.daily.sunset[0]).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):'—'],['LOCATION',hit.name+(hit.admin1?' · '+hit.admin1:'')],['TIME ZONE',data.timezone_abbreviation||hit.timezone||'Local'],['SKY',labels[now.weather_code]||'Changing skies']].map(card).join('');
      let outlook=document.querySelector('.weather-outlook');if(!outlook){outlook=document.createElement('section');outlook.className='weather-outlook';forecast.insertAdjacentElement('afterend',outlook)}
      const start=Math.max(0,(data.hourly?.time||[]).findIndex(time=>time>=now.time));
      outlook.innerHTML='<h2>Next 12 hours</h2><div class="weather-hours">'+data.hourly.time.slice(start,start+12).map((time,offset)=>{const i=start+offset;return '<article><b>'+new Date(time).toLocaleTimeString([],{hour:'numeric'})+'</b><span>'+number(data.hourly.temperature_2m[i])+'°</span><small>'+labels[data.hourly.weather_code[i]]+' · '+number(data.hourly.precipitation_probability[i])+'% rain</small></article>'}).join('')+'</div>';
      $('#status').textContent='Updated '+new Intl.DateTimeFormat([],{hour:'numeric',minute:'2-digit'}).format(new Date())+' · '+hit.name+', '+(hit.country||'local forecast');
    }catch{}
  }
  const start=()=>{setTimeout(show,1000);$('#search')?.addEventListener('submit',()=>setTimeout(show,1000))};
  document.readyState==='loading'?addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
