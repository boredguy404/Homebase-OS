import * as THREE from './vendor/three.module.js';
import {PixelRenderer} from './engine/pixel-renderer.js';
import {createPixelActor} from './engine/pixel-actor.js';
import {PixelWorld} from './engine/world.js';
import {building} from './content/building.js';

const canvas=document.querySelector('#stage'),status=document.querySelector('#status'),roomLabel=document.querySelector('#room'),prompt=document.querySelector('#prompt'),dialogue=document.querySelector('#dialogue');
const display=new PixelRenderer(THREE,canvas),world=new PixelWorld(THREE,display.scene,building),hero=createPixelActor(THREE),clock=new THREE.Clock(),keys={},touch={forward:false,back:false,left:false,right:false};
display.scene.add(hero.group);hero.group.position.set(building.spawn.x,0,building.spawn.z);let nearby=null,lastA=false;

function openRoute(route){if(parent!==window&&parent.openPanel)parent.openPanel(route);else location.href=route}
function interact(){if(!nearby)return;if(nearby.game){try{sessionStorage.setItem('novashell-world-game',nearby.game.rom||nearby.game.name||'')}catch{}openRoute('/pages/arcade.html');return}if(nearby.action==='orbit'){parent.openOrbit?.();return}if(nearby.action==='relay'){dialogue.hidden=false;dialogue.querySelector('p').textContent='The building is finally using the old pixel engine. I can open Relay without making you hunt for another terminal.';return}if(nearby.route)openRoute(nearby.route)}
dialogue.querySelector('button').onclick=()=>{dialogue.hidden=true;parent.openAssistant?.()};dialogue.addEventListener('click',event=>{if(event.target===dialogue)dialogue.hidden=true});
addEventListener('keydown',event=>{keys[event.code]=true;if(['Space','Enter'].includes(event.code)){event.preventDefault();interact()}});addEventListener('keyup',event=>keys[event.code]=false);
document.querySelectorAll('[data-move]').forEach(button=>{const direction=button.dataset.move;button.onpointerdown=event=>{button.setPointerCapture?.(event.pointerId);touch[direction]=true};button.onpointerup=button.onpointercancel=()=>touch[direction]=false});document.querySelector('[data-action]').onclick=interact;

function input(dt,time){
  const pad=[...(navigator.getGamepads?.()||[])].find(Boolean),dead=value=>Math.abs(value)>.18?value:0;
  let vx=(keys.KeyD||keys.ArrowRight||touch.right?1:0)-(keys.KeyA||keys.ArrowLeft||touch.left?1:0)+dead(pad?.axes?.[0]||0),vz=(keys.KeyS||keys.ArrowDown||touch.back?1:0)-(keys.KeyW||keys.ArrowUp||touch.forward?1:0)+dead(pad?.axes?.[1]||0);
  const length=Math.hypot(vx,vz),moving=length>.08;if(moving){vx/=Math.max(1,length);vz/=Math.max(1,length);const speed=(keys.ShiftLeft||pad?.buttons?.[1]?.pressed?8:5.7)*dt,position=world.resolve(hero.group.position.x+vx*speed,hero.group.position.z+vz*speed,.52);hero.group.position.x=position.x;hero.group.position.z=position.z}
  const pressed=!!pad?.buttons?.[0]?.pressed;if(pressed&&!lastA)interact();lastA=pressed;hero.update(vx,vz,moving,time);
}
function frame(timeMs){requestAnimationFrame(frame);const dt=Math.min(.05,clock.getDelta()),time=timeMs*.001;input(dt,time);display.follow(hero.group.position,dt);nearby=world.nearest(hero.group.position.x,hero.group.position.z);prompt.hidden=!nearby;if(nearby)prompt.querySelector('span').textContent=' OPEN '+nearby.name;const room=world.roomAt(hero.group.position.x,hero.group.position.z);roomLabel.textContent=room;status.textContent=nearby?'NEAR '+nearby.name:'EXPLORE THE BUILDING';for(const station of world.stations){if(station.pad)station.pad.material.emissiveIntensity=(nearby?.id===station.id)?0.75:0.18}display.draw()}

fetch('/api/games').then(response=>response.json()).then(data=>{(data.games||[]).slice(0,8).forEach((game,index)=>world.addArcade(game,index));status.textContent=(data.games||[]).length+' LOCAL CABINETS READY'}).catch(()=>status.textContent='BUILDING READY');
requestAnimationFrame(frame);
