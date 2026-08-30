(() => {
  'use strict';

  const STORAGE_KEY = 'novashell-workflow-proof-v1';
  const DEFAULT_ITEMS = [
    'Define the workflow outcome',
    'Run the first step',
    'Capture the evidence',
    'Review the result'
  ];

  class WorkflowProof extends HTMLElement {
    constructor() {
      super();
      this.items = this.load();
    }

    connectedCallback() {
      this.render();
      this.addEventListener('submit', (event) => this.addItem(event));
      this.addEventListener('change', (event) => this.toggleItem(event));
      this.addEventListener('click', (event) => this.handleClick(event));
    }

    load() {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(saved) ? saved : DEFAULT_ITEMS.map((text, id) => ({ id: String(id), text, done: false }));
      } catch {
        return DEFAULT_ITEMS.map((text, id) => ({ id: String(id), text, done: false }));
      }
    }

    save() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items)); } catch { /* Storage may be unavailable. */ }
    }

    render() {
      const completed = this.items.filter((item) => item.done).length;
      this.replaceChildren(this.makeShell(completed));
    }

    makeShell(completed) {
      const shell = document.createElement('section');
      shell.className = 'shell';
      shell.innerHTML = `<header><p class="eyebrow">OFFLINE CHECKLIST</p><h1>Workflow Proof</h1><p class="subtitle">Turn a repeatable job into a small, local checklist: define the outcome, do each step, and leave a clear record of what was verified.</p></header><div class="body"><aside class="privacy"><span aria-hidden="true">⌂</span><div><strong>What this is for</strong><br>Use it for a launch, backup, install, or handoff you want to repeat without forgetting a step. Checkmarks and custom steps stay only in this browser—nothing is sent, synced, or shared.</div></aside><form class="add-row"><input name="item" maxlength="120" autocomplete="off" placeholder="Add a workflow step" aria-label="New workflow step" required><button class="primary" type="submit">Add step</button></form><ul class="checklist" aria-live="polite"></ul><div class="footer"><output id="progress">${completed} of ${this.items.length} complete</output><button class="reset" type="button">Reset checklist</button></div></div>`;
      const list = shell.querySelector('.checklist');
      if (!this.items.length) {
        const empty = document.createElement('li');
        empty.className = 'empty';
        empty.textContent = 'No steps yet. Add one above to start your proof.';
        list.append(empty);
      } else {
        this.items.forEach((item) => list.append(this.makeItem(item)));
      }
      return shell;
    }

    makeItem(item) {
      const row = document.createElement('li');
      row.className = `item${item.done ? ' done' : ''}`;
      const check = document.createElement('input');
      check.className = 'toggle'; check.type = 'checkbox'; check.checked = item.done; check.dataset.id = item.id;
      check.setAttribute('aria-label', `Mark ${item.text} complete`);
      const label = document.createElement('label');
      const labelId = `step-${item.id}`; label.id = labelId; label.htmlFor = labelId;
      check.id = labelId; label.textContent = item.text;
      const remove = document.createElement('button');
      remove.className = 'remove'; remove.type = 'button'; remove.dataset.remove = item.id; remove.setAttribute('aria-label', `Remove ${item.text}`); remove.textContent = '×';
      row.append(check, label, remove);
      return row;
    }

    addItem(event) {
      if (!event.target.matches('form')) return;
      event.preventDefault();
      const input = event.target.elements.item;
      const text = input.value.trim();
      if (!text) return;
      this.items.push({ id: String(Date.now()), text, done: false });
      this.save(); this.render(); this.querySelector('[name="item"]').focus();
    }

    toggleItem(event) {
      if (!event.target.matches('.toggle')) return;
      const item = this.items.find((entry) => entry.id === event.target.dataset.id);
      if (item) { item.done = event.target.checked; this.save(); this.render(); }
    }

    handleClick(event) {
      const remove = event.target.closest('[data-remove]');
      if (remove) { this.items = this.items.filter((item) => item.id !== remove.dataset.remove); this.save(); this.render(); }
      if (event.target.closest('.reset')) { this.items = DEFAULT_ITEMS.map((text, id) => ({ id: String(id), text, done: false })); this.save(); this.render(); }
    }
  }

  customElements.define('workflow-proof', WorkflowProof);
})();
