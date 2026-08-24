(() => {
  const retireLegacyVisuals = () => {
    if (document.documentElement.dataset.theme !== 'ultra-retro') return;
    document.querySelectorAll('.gyro-stage,.nightglass-mark,.gesture-pad,.gesture-hint').forEach(node => node.remove());
  };
  const esc = value => String(value ?? '—').replace(/[&<>]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[character]));
  const render = async () => {
    if (document.querySelector('#neofetch-ambient')) return;
    const panel = document.createElement('aside');
    panel.id = 'neofetch-ambient';
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = `<pre class="neofetch-mark">   ▄▄▄
  █ ▄ █
  ███ █
  █▄▄▄█</pre><pre class="neofetch-lines">NOVASHELL@LOCAL
----------------
OS      reading…
ARCH    reading…
MEM     reading…
DISK    reading…
LOAD    reading…
INPUT   reading…
<span class="neofetch-cursor">█</span></pre>`;
    document.body.prepend(panel);
    retireLegacyVisuals();
    try {
      const [system, setup] = await Promise.all([
        fetch('/api/insights', {cache: 'no-store'}).then(response => response.json()),
        fetch('/api/setup/status', {cache: 'no-store'}).then(response => response.json())
      ]);
      const used = Math.round((system.memory.MemTotal - system.memory.MemAvailable) / system.memory.MemTotal * 100);
      const disk = (system.disk.free / 1073741824).toFixed(1) + 'G free';
      panel.querySelector('.neofetch-lines').innerHTML = 'NOVASHELL@LOCAL\n----------------\nOS      ' + esc(setup.os) + '\nARCH    ' + esc(setup.architecture) + '\nMEM     ' + used + '% used\nDISK    ' + disk + '\nLOAD    ' + Number(system.load[0]).toFixed(2) + ' / ' + esc(system.cpu_count) + '\nINPUT   ' + esc(setup.controllers || 0) + ' controller' + ((setup.controllers || 0) === 1 ? '' : 's') + '\n<span class="neofetch-cursor">█</span>';
    } catch {
      panel.querySelector('.neofetch-lines').firstChild.textContent = 'NOVASHELL@LOCAL\n----------------\nLOCAL READOUT UNAVAILABLE\n\n';
    }
  };
  addEventListener('DOMContentLoaded', render);
  addEventListener('nightglass-theme', retireLegacyVisuals);
})();
