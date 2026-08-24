(() => {
  const esc = value => String(value ?? '').replace(/[&<>]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[char]));
  const boot = () => {
    const board = document.querySelector('#utility-kanban');
    if (!board || board.dataset.projectInteraction) return false;
    board.dataset.projectInteraction = 'true';
    board.addEventListener('click', async event => {
      const card = event.target.closest('.kanban-card[data-task^="project-"]');
      if (!card) return;
      const id = card.dataset.task;
      let task = {id, text: card.querySelector('b')?.textContent || 'NovaShell task', lane: 'todo'};
      try {
        const feed = await fetch('/api/project-feed', {cache: 'no-store'}).then(response => response.json());
        task = (feed.tasks || []).find(item => item.id === id) || task;
      } catch {}
      const dialog = document.createElement('dialog');
      dialog.className = 'project-task-dialog';
      dialog.dataset.windowTitle = 'PROJECT TASK';
      dialog.innerHTML = '<h2>' + esc(task.title || task.text) + '</h2><p class="project-task-lane">' + esc(String(task.lane || 'todo').toUpperCase()) + '</p><p>This task is mirrored from the local build board. Relay updates it while work moves; opening it never changes the task by itself.</p><section><button type="button" class="task-copy">Copy task</button><button type="button" class="task-relay">Ask Relay</button></section>';
      document.body.append(dialog);
      dialog.querySelector('.task-copy').onclick = async () => { try { await navigator.clipboard.writeText(task.title || task.text); } catch {} };
      dialog.querySelector('.task-relay').onclick = () => { dialog.close(); parent.openPanel?.('/pages/console.html?btw=' + encodeURIComponent('Give me the current plain-English status for: ' + (task.title || task.text))); };
      dialog.addEventListener('close', () => dialog.remove());
      dialog.showModal();
    });
    return true;
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', () => { if (!boot()) setTimeout(boot, 180); }, {once: true}); else boot();
})();
