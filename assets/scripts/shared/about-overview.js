(() => {
  const upgrade = () => {
    if (!window.openNovaShellAbout || window.__novaShellAboutOverview) return !!window.openNovaShellAbout;
    window.__novaShellAboutOverview = true;
    const open = window.openNovaShellAbout;
    window.openNovaShellAbout = () => {
      open();
      const dialog = document.querySelector('#novashell-about');
      if (!dialog || dialog.querySelector('.about-overview')) return;
      const overview = document.createElement('section');
      overview.className = 'about-overview';
      overview.innerHTML = '<b>WHAT NOVASHELL IS</b><p>An installable local dashboard that sits on top of ChromeOS, Linux, or Windows. It organizes your existing apps and files, adds a private shelf for games you add yourself, and makes everything comfortable for touch and controllers.</p><div><span>LOCAL-FIRST</span><span>OWNED GAMES</span><span>TOUCH + XBOX</span><span>OPTIONAL AI</span></div><p class="about-github">The full public guide, screenshots, setup notes, and source live in the Homebase-OS repository.</p>';
      dialog.querySelector('.about-actions')?.before(overview);
      const repo = document.createElement('a');
      repo.href = 'https://github.com/boredguy404/Homebase-OS'; repo.target = '_blank'; repo.rel = 'noopener'; repo.textContent = 'Open Homebase-OS on GitHub ↗';
      dialog.querySelector('.about-actions')?.prepend(repo);
    };
    return true;
  };
  const wait = () => { if (!upgrade()) setTimeout(wait, 100); };
  wait();
})();
