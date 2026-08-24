import fs from 'node:fs';
import vm from 'node:vm';

const listeners = new Map();
const documentListeners = new Map();
const status = { textContent: '', classList: { toggle() {} } };
const pads = [
  { id: 'Xbox Wireless Controller', index: 2 },
  { id: 'Xbox Wireless Controller', index: 5 }
];
const context = {
  console,
  CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init?.detail; } },
  navigator: { getGamepads: () => pads },
  document: {
    hidden: false,
    querySelector: selector => selector === '#player-pads' ? status : null,
    addEventListener: (type, fn) => documentListeners.set(type, fn)
  },
  addEventListener: (type, fn) => listeners.set(type, fn),
  dispatchEvent() {},
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval
};
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL('../assets/scripts/arcade/emulator-gamepads.js', import.meta.url), 'utf8'), context);

const emulator = {
  gamepad: { gamepads: [...pads].reverse() },
  gamepadSelection: ['', '', '', ''],
  updateGamepadLabels() { this.updated = true; }
};
const count = context.NovaShellGamepads.bind(emulator);
if (count !== 2) throw new Error(`Expected two controllers, got ${count}`);
if (emulator.gamepadSelection[0] !== 'Xbox Wireless Controller_2') throw new Error('Player one did not receive the lowest browser gamepad index.');
if (emulator.gamepadSelection[1] !== 'Xbox Wireless Controller_5') throw new Error('Player two did not receive the second physical gamepad.');
if (emulator.gamepadSelection[0] === emulator.gamepadSelection[1]) throw new Error('Both players were assigned the same controller.');
const controls = context.NovaShellGamepads.controls();
if (controls[0][0].value2 !== controls[1][0].value2) throw new Error('Player mappings differ unexpectedly.');
if ('value' in controls[1][0]) throw new Error('Player two must remain gamepad-only to avoid duplicate keyboard input.');
console.log('Controller runtime test passed: two distinct Xbox-style pads map to N64 players 1 and 2.');
