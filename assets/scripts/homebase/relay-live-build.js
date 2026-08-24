(() => {
  const stamp = value => new Date((Number(value) || Date.now() / 1000) * 1000).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit', second: '2-digit'});
  const esc = value => String(value ?? '').replace(/[&<>]/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;'}[char]));
  const boot = () => {
    const chat = document.querySelector('#chat');
    if (!chat || chat.querySelector('.relay-live-build')) return false;
    const card = document.createElement('article');
    card.className = 'assistant relay-live-build';
    card.setAttribute('aria-live', 'polite');
    card.innerHTML = '<b><i aria-hidden="true"></i> Relay build link</b><p>Connecting to the local work board…</p><div class="relay-live-counts"></div><div class="relay-live-events"></div>';
    chat.querySelector('.assistant')?.after(card) || chat.prepend(card);
    let lastSignature = '';
    const render = feed => {
      const tasks = Array.isArray(feed.tasks) ? feed.tasks : [];
      const events = Array.isArray(feed.events) ? feed.events.slice(0, 5) : [];
      const doing = tasks.filter(task => task.lane === 'doing').length;
      const todo = tasks.filter(task => task.lane === 'todo').length;
      const done = tasks.filter(task => task.lane === 'done').length;
      card.querySelector('p').textContent = 'Local build board · refreshed ' + stamp(feed.updated) + ' · watching this session.';
      card.querySelector('.relay-live-counts').innerHTML = '<span><b>' + doing + '</b> active</span><span><b>' + todo + '</b> queued</span><span><b>' + done + '</b> shipped</span>';
      const signature = JSON.stringify(events);
      if (signature !== lastSignature) {
        lastSignature = signature;
        card.querySelector('.relay-live-events').innerHTML = events.map(event => '<div><time>' + stamp(event.time) + '</time><span>' + esc(event.message) + '</span></div>').join('') || '<div><time>…</time><span>Waiting for the next local build update.</span></div>';
      }
    };
    const poll = async () => {
      try {
        const response = await fetch('/api/project-feed', {cache: 'no-store'});
        if (!response.ok) throw Error('Local board unavailable');
        render(await response.json());
      } catch {
        card.querySelector('p').textContent = 'Build link paused — waiting for the local NovaShell server.';
      } finally {
        setTimeout(poll, 1200);
      }
    };
    poll();
    return true;
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', () => { if (!boot()) setTimeout(boot, 200); }, {once: true});
  else boot();
})();
