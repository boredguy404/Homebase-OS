#!/usr/bin/env node
import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';

async function indexes(dir){
  const found=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const path=join(dir,entry.name);
    if(entry.isDirectory())found.push(...await indexes(path));
    else if(entry.name==='index.html')found.push(path);
  }
  return found;
}

const pages=await indexes('user-apps');
if(!pages.length)throw new Error('No built-in user apps found');
for(const page of pages){
  const html=await readFile(page,'utf8');
  if(!html.includes('/assets/scripts/shared/theme-sync.js'))throw new Error(`${page} does not load the shared app shell`);
}
const script=await readFile('assets/scripts/shared/user-app-navigation.js','utf8');
const style=(await readFile('assets/styles/shared/user-app-navigation.css','utf8')).replaceAll(' ','');
for(const contract of ['data-novashell-app-back','Back to NovaShell','parent.closePocket','history.back'])if(!script.includes(contract))throw new Error(`Navigation script is missing ${contract}`);
for(const contract of ['align-items:center','justify-content:center','min-height:48px','novashell-app-back__arrow','ultra-retro'])if(!style.includes(contract))throw new Error(`Navigation style is missing ${contract}`);
console.log(`User-app navigation contract passed for ${pages.length} built-in apps.`);
