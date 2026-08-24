(() => {
  const playerOne = {
    0:{value:'x',value2:'BUTTON_2'},1:{value:'s',value2:'BUTTON_4'},2:{value:'v',value2:'SELECT'},3:{value:'enter',value2:'START'},
    4:{value:'up arrow',value2:'DPAD_UP'},5:{value:'down arrow',value2:'DPAD_DOWN'},6:{value:'left arrow',value2:'DPAD_LEFT'},7:{value:'right arrow',value2:'DPAD_RIGHT'},
    8:{value:'z',value2:'BUTTON_1'},9:{value:'a',value2:'BUTTON_3'},10:{value:'q',value2:'LEFT_TOP_SHOULDER'},11:{value:'e',value2:'RIGHT_TOP_SHOULDER'},
    12:{value:'tab',value2:'LEFT_BOTTOM_SHOULDER'},13:{value:'r',value2:'RIGHT_BOTTOM_SHOULDER'},14:{value:'',value2:'LEFT_STICK'},15:{value:'',value2:'RIGHT_STICK'},
    16:{value:'h',value2:'LEFT_STICK_X:+1'},17:{value:'f',value2:'LEFT_STICK_X:-1'},18:{value:'g',value2:'LEFT_STICK_Y:+1'},19:{value:'t',value2:'LEFT_STICK_Y:-1'},
    20:{value:'l',value2:'RIGHT_STICK_X:+1'},21:{value:'j',value2:'RIGHT_STICK_X:-1'},22:{value:'k',value2:'RIGHT_STICK_Y:+1'},23:{value:'i',value2:'RIGHT_STICK_Y:-1'}
  };
  const cloneForPlayer = player => Object.fromEntries(Object.entries(playerOne).map(([key,control]) => [key, player ? {value2:control.value2} : {...control}]));
  const controls = () => ({0:cloneForPlayer(0),1:cloneForPlayer(1),2:cloneForPlayer(2),3:cloneForPlayer(3)});
  const connected = emulator => [...(emulator?.gamepad?.gamepads || navigator.getGamepads?.() || [])].filter(Boolean).sort((a,b)=>(a.index||0)-(b.index||0));
  function renderStatus(count){
    const label=document.querySelector('#player-pads');if(!label)return;
    label.textContent=count>1?`${count} CONTROLLERS · P1 + P2 READY`:count===1?'1 CONTROLLER · P1 READY':'PRESS A ON A CONTROLLER';
    label.classList.toggle('ready',count>1);
  }
  function bind(emulator=window.EJS_emulator){
    if(!emulator?.gamepadSelection)return 0;
    const pads=connected(emulator);for(let player=0;player<4;player++){const pad=pads[player];emulator.gamepadSelection[player]=pad?`${pad.id}_${pad.index}`:''}
    emulator.updateGamepadLabels?.();renderStatus(pads.length);window.dispatchEvent(new CustomEvent('novashell:gamepads-bound',{detail:{count:pads.length}}));return pads.length;
  }
  function bindWhenReady(){
    let tries=0;const timer=setInterval(()=>{if(bind()||tries++>240)clearInterval(timer)},50);
  }
  addEventListener('gamepadconnected',()=>setTimeout(()=>bind(),80));addEventListener('gamepaddisconnected',()=>setTimeout(()=>bind(),80));
  window.NovaShellGamepads={controls,bind,bindWhenReady};
})();
