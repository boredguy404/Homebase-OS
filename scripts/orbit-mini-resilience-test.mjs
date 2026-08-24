#!/usr/bin/env node
import {readFile} from 'node:fs/promises';

const script=await readFile('assets/scripts/homebase/orbit-mini-resilience.js','utf8');
for(const mode of ['orbit','bars','tunnel','wave','radar','nebula','pixel','terminal','club'])if(!script.includes(`'${mode}'`))throw new Error(`Compact player is missing ${mode}`);
for(const contract of ["current==='aurora'","current==='pixel-dense'","visibilitychange","pageshow"])if(!script.includes(contract))throw new Error(`Compact recovery is missing ${contract}`);
const fluid=await readFile('assets/styles/homebase/desktop-beacon-fluid.css','utf8');
if(!fluid.includes('0%,100%'))throw new Error('Beacon animation endpoints are not identical');
console.log('Orbit compact-player recovery and fluid beacon contracts passed.');
