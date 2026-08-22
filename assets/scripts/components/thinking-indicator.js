/* Reusable, dependency-free status component for local agent and search work. */
class HomebaseThinking extends HTMLElement{
  connectedCallback(){if(this.dataset.ready)return;this.dataset.ready='true';const label=this.getAttribute('label')||'Scanning local records';this.innerHTML='<span class="thinking-glyph" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span class="thinking-copy"><b></b><small>LOCAL TOOL BUS · NO REMOTE ACTION YET</small></span>';this.querySelector('b').textContent=label;this.setAttribute('role','status');this.setAttribute('aria-live','polite')}
}
customElements.define('homebase-thinking',HomebaseThinking);
