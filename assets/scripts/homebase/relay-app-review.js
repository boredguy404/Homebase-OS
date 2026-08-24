(() => {
  const request = async (path, options) => {
    const response = await fetch(path, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Error(data.error || 'Relay app request failed');
    return data;
  };

  const boot = () => {
    const form = document.querySelector('#app-workshop');
    if (!form || form.dataset.reviewFlow) return false;
    form.dataset.reviewFlow = 'true';
    const submit = form.querySelector('button[type="submit"], button:not([type])');
    const note = [...form.querySelectorAll('small')].at(-1);
    submit.textContent = 'Draft preview';

    const review = document.createElement('section');
    review.className = 'relay-app-review';
    review.hidden = true;
    review.innerHTML = '<header><div><small>STAGE 2 · REVIEW</small><b></b><p></p></div><button type="button" data-cancel aria-label="Discard app draft">×</button></header><div class="relay-app-files"></div><iframe title="Sandboxed generated app preview" sandbox="allow-scripts"></iframe><label><span>CONFIRM&gt;</span><input autocomplete="off" placeholder="Type CREATE APP"></label><div class="relay-app-review-actions"><button type="button" data-discard>Discard draft</button><button type="button" data-create>Create four-file app</button></div><small data-review-note>Nothing has been installed yet.</small>';
    form.after(review);
    let draft = null;

    const close = () => {
      review.hidden = true;
      review.querySelector('iframe').removeAttribute('src');
      review.querySelector('input').value = '';
      draft = null;
    };
    review.querySelector('[data-cancel]').onclick = close;
    review.querySelector('[data-discard]').onclick = close;

    form.onsubmit = async event => {
      event.preventDefault();
      const description = form.querySelector('textarea').value.trim();
      if (!description) return form.querySelector('textarea').focus();
      const actionId = 'app-' + crypto.randomUUID().replaceAll('-', '').slice(0, 16);
      submit.disabled = true;
      note.textContent = 'Stage 1 of 4 · Relay is drafting a contained Web Components module…';
      try {
        const data = await (window.HomebaseAgent?.draftApp?.(description, 'Web Components', actionId) || request('/api/assistant/app/draft', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({description, framework: 'Web Components', action_id: actionId})}));
        draft = {...data.draft, actionId: data.action_id};
        review.querySelector('header b').textContent = draft.icon + ' ' + draft.name;
        review.querySelector('header p').textContent = draft.description;
        review.querySelector('.relay-app-files').innerHTML = draft.files.map(file => '<span><b>' + file.name + '</b><small>' + file.bytes + ' bytes</small></span>').join('');
        review.querySelector('iframe').src = '/api/assistant/app/draft/' + encodeURIComponent(draft.id) + '/preview';
        review.querySelector('[data-review-note]').textContent = 'Sandboxed preview · scripts may run, network access is blocked, and no app folder exists yet.';
        review.hidden = false;
        review.scrollIntoView({behavior: 'smooth', block: 'center'});
        review.querySelector('input').focus({preventScroll: true});
        note.textContent = 'Stage 2 of 4 · Review the preview and four output files.';
      } catch (error) {
        note.textContent = error.message;
      } finally {
        submit.disabled = false;
      }
    };

    review.querySelector('[data-create]').onclick = async () => {
      const input = review.querySelector('input'), button = review.querySelector('[data-create]'), status = review.querySelector('[data-review-note]');
      if (!draft || input.value.trim() !== 'CREATE APP') {
        status.textContent = 'Stage 3 of 4 · Type CREATE APP exactly after reviewing the preview.';
        input.focus();
        return;
      }
      button.disabled = true;
      status.textContent = 'Stage 4 of 4 · Writing the reviewed four-file module…';
      try {
        const data = await (window.HomebaseAgent?.applyApp?.(draft.id, draft.actionId, input.value.trim()) || request('/api/assistant/app/apply', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({draft_id: draft.id, action_id: draft.actionId, confirm: input.value.trim()})}));
        note.textContent = data.app.name + ' installed as removable user-apps/' + data.app.id + '/.';
        form.querySelector('textarea').value = '';
        document.dispatchEvent(new CustomEvent('relay:apps-changed'));
        close();
      } catch (error) {
        status.textContent = error.message;
      } finally {
        button.disabled = false;
      }
    };
    return true;
  };

  const wait = () => { if (!boot()) setTimeout(wait, 120); };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', wait, {once: true}); else wait();
})();
