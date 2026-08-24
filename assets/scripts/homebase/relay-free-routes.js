(() => {
  const boot = () => {
    const panel = document.querySelector('.relay-brain-panel');
    if (!panel || panel.querySelector('[data-tab="free"]')) return false;
    const tabs = panel.querySelector('.relay-brain-tabs');
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.tab = 'free'; button.textContent = 'FREE ROUTES';
    tabs?.append(button);
    const pane = document.createElement('div');
    pane.className = 'relay-brain-pane relay-free-routes'; pane.dataset.pane = 'free'; pane.hidden = true;
    pane.innerHTML = '<b>FREE AI ROUTES</b><span>Bring your own key or free-tier account. Providers change quotas often; Relay keeps all keys local and never puts them in this project.</span><ul><li><strong>OpenRouter</strong> — rotating free models; useful for drafts and experiments.</li><li><strong>Groq</strong> — fast free-tier models; good for short technical answers.</li><li><strong>Google AI Studio</strong> — Gemini free tiers; useful for longer context.</li><li><strong>OpenAI</strong> — paid API route; strongest configured option here.</li></ul><button type="button" data-free-config>Open local AI setup</button><p>Free routes can help draft a modular app or reviewed edit proposal. They never bypass NovaShell’s backup and confirmation rules.</p>';
    panel.append(pane);
    button.onclick = () => { tabs.querySelectorAll('button').forEach(item => item.classList.toggle('is-active', item === button)); panel.querySelectorAll('.relay-brain-pane').forEach(item => item.hidden = item !== pane); };
    pane.querySelector('[data-free-config]').onclick = () => panel.querySelector('[data-tab="routes"]')?.click();
    return true;
  };
  const wait = () => { if (!boot()) setTimeout(wait, 140); };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', wait, {once:true}); else wait();
})();
