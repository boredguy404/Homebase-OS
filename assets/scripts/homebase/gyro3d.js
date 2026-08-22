addEventListener('DOMContentLoaded', () => {
  const stage = document.querySelector('.gyro-stage');
  if (!stage) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'gyro3d signal-field';
  stage.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, dpr = 1, mode = Number(localStorage.getItem('nightglass-visual') || 1) % 3;
  addEventListener('nightglass-visual', event => { mode = event.detail.index; });
  const particles = Array.from({length: 18}, (_, i) => ({
    x: (i * 0.61803398875) % 1, y: (i * 0.38196601125) % 1,
    size: 0.7 + (i % 5) * 0.36, speed: 0.035 + (i % 7) * 0.006, phase: i * 1.73
  }));
  function resize() {
    dpr = 1;
    width = canvas.clientWidth; height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function ribbon(time, layer) {
    const base = height * (0.25 + layer * 0.14);
    const amplitude = height * (0.045 + layer * 0.012);
    ctx.beginPath(); ctx.moveTo(-30, height + 40);
    for (let x = -30; x <= width + 30; x += 18) {
      const wave = Math.sin(x * (0.009 + layer * 0.0018) + time * (0.00045 + layer * 0.00007) + layer * 1.8);
      const cross = Math.sin(x * 0.0035 - time * 0.00025 + layer) * amplitude * 0.55;
      ctx.lineTo(x, base + wave * amplitude + cross);
    }
    ctx.lineTo(width + 30, height + 40); ctx.closePath();
    const gradient = ctx.createLinearGradient(0, base - amplitude, width, base + amplitude * 3);
    const alpha = 0.08 + layer * 0.009;
    gradient.addColorStop(0, `rgba(59,181,255,${alpha})`);
    gradient.addColorStop(0.55, `rgba(58,220,203,${alpha * 0.75})`);
    gradient.addColorStop(1, `rgba(255,177,74,${alpha * 0.85})`);
    ctx.fillStyle = gradient; ctx.fill();
    ctx.strokeStyle = layer === 1 ? '#8bdcff60' : layer === 3 ? '#ffc06a44' : '#75e7d02d';
    ctx.lineWidth = 0.8 + layer * 0.28; ctx.stroke();
  }
  let lastFrame=0;
  function draw(time) {
    if(document.hidden||time-lastFrame<34){requestAnimationFrame(draw);return}lastFrame=time;
    ctx.clearRect(0, 0, width, height);
    if (!document.body.classList.contains('app-open')) {
      const glow = ctx.createRadialGradient(width * 0.58, height * 0.42, 0, width * 0.58, height * 0.42, width * 0.58);
      glow.addColorStop(0, '#3abfff24'); glow.addColorStop(0.48, '#31cdb814'); glow.addColorStop(1, '#00000000');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
      if (mode === 0) {
        for(let line=0;line<15;line++){ctx.beginPath();for(let x=0;x<=width;x+=18){const y=height*(.18+line*.047)+Math.sin(x*.012+time*.00045+line*.65)*18+Math.sin(x*.003-time*.0002)*22;x?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.strokeStyle=`rgba(110,205,255,${.06+line*.008})`;ctx.lineWidth=line%5===0?1.5:.7;ctx.stroke()}
      }
      if (mode === 1) {
        const cx=width*.58,cy=height*.46;
        for(let ring=0;ring<7;ring++){ctx.beginPath();ctx.ellipse(cx,cy,55+ring*31,(55+ring*31)*.42,Math.sin(time*.00018+ring)*.18,0,Math.PI*2);ctx.strokeStyle=`rgba(120,210,255,${.08+ring*.018})`;ctx.lineWidth=1+ring*.12;ctx.stroke()}
        for(let arm=0;arm<5;arm++){const angle=time*.00012+arm*Math.PI*.4;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(angle)*width*.42,cy+Math.sin(angle)*height*.27);ctx.strokeStyle='rgba(210,238,255,.15)';ctx.stroke()}
        const sweep=time*.00055;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,width*.32,sweep-.25,sweep);ctx.closePath();const beam=ctx.createRadialGradient(cx,cy,0,cx,cy,width*.32);beam.addColorStop(0,'rgba(130,220,255,.22)');beam.addColorStop(1,'rgba(80,170,255,0)');ctx.fillStyle=beam;ctx.fill();
      }
      if (mode === 2) {
        const cx=width*.58,cy=height*.46;for(let ring=0;ring<12;ring++){const phase=(ring/12+time*.00008)%1,radius=18+phase*width*.42;ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.strokeStyle=`rgba(130,210,255,${(1-phase)*.22})`;ctx.lineWidth=1+phase*2;ctx.stroke()}particles.forEach((particle,index)=>{const angle=particle.phase+time*.00008,distance=(.08+((particle.x+time*.00002)%1))*width*.42;ctx.beginPath();ctx.moveTo(cx+Math.cos(angle)*distance*.82,cy+Math.sin(angle)*distance*.35);ctx.lineTo(cx+Math.cos(angle)*distance,cy+Math.sin(angle)*distance*.43);ctx.strokeStyle='rgba(210,238,255,.26)';ctx.stroke()})
      }
      particles.forEach((particle) => {
        const x = ((particle.x + time * 0.00001 * particle.speed * 30) % 1.12) * width - width * 0.06;
        const y = particle.y * height + Math.sin(time * 0.0007 + particle.phase) * 12;
        const pulse = 0.45 + Math.sin(time * 0.0016 + particle.phase) * 0.3;
        ctx.beginPath(); ctx.arc(x, y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(190,235,255,${pulse})`; ctx.fill();
      });
    }
    requestAnimationFrame(draw);
  }
  new ResizeObserver(resize).observe(stage); resize(); requestAnimationFrame(draw);
});
