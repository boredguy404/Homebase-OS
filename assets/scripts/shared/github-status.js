async function checkGithub(){
  const label=document.querySelector('#gh-state');
  label.textContent='Checking…';
  const data=await fetch('/api/github-status').then(response=>response.json()).catch(()=>({connected:false,message:'Status unavailable'}));
  label.textContent=data.connected?`Connected${data.account?' as '+data.account:''}`:(data.installed===false?'GitHub CLI not installed':'Not connected');
}
document.querySelector('#gh-check').onclick=checkGithub;
document.querySelector('#gh-login').onclick=async()=>{
  await fetch('/api/launch/github_login',{method:'POST'});
  document.querySelector('#status').textContent='Complete the browser code in Terminal, then tap Check connection.';
};
checkGithub();
const actions=document.querySelector('.actions');if(actions){const tools=document.createElement('section');tools.className='card';tools.innerHTML='<h2>Free release-media toolkit</h2><p>All options below are free and work locally. Codex can install/configure only the ones you approve.</p><div class="checks"><label><input type="checkbox" name="tool_chrome" checked>Chrome capture · quick screenshots</label><label><input type="checkbox" name="tool_ffmpeg" checked>ffmpeg · automated clips and WebM/MP4 conversion</label><label><input type="checkbox" name="tool_obs">OBS Studio · polished narrated demo</label><label><input type="checkbox" name="tool_kooha">Kooha · simple one-click recorder</label><label><input type="checkbox" name="tool_gh" checked>GitHub CLI · repo, Pages, and Releases</label><label><input type="checkbox" name="tool_actions" checked>GitHub Actions · free public-repo builds</label></div><p><b>Recommended:</b> Chrome capture + ffmpeg + GitHub CLI. Add OBS only for a longer launch video. No paid image/video API is required.</p>';actions.before(tools)}
