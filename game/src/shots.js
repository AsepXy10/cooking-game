// Warung Kilat — staged scenes for the entry screenshots.
// ?shot=kitchen / serve / rush / combo freezes a mid-game moment so the
// screenshots show the game at its best: a full order board, a dish
// mid-assembly, a timer, and a plate ready to serve. No randomness here —
// the same shot always stages the same scene.

import { newTicketQueue } from './orders.js';

export const SHOT_NAMES = ['kitchen', 'serve', 'rush', 'combo'];

function baseStagedState(state) {
  state.screen = 'play';
  state.paused = false;
  state.queue = newTicketQueue();
  state.wok.items = [];
  state.plate.items = [];
  state.particles = [];
  state.floats = [];
  state.held = null;
  state.combo = 0;
  state.rushActive = false;
  state.lastServed = null;
  return state;
}

function ticket(dishId, patience, patienceMax, price) {
  return { id: 0, dishId, patience, patienceMax, price };
}

function wokItem(ingId, cook, itemState) {
  return { ingId, cook, state: itemState, burn: 0 };
}

function steam(state, x, y) {
  for (let i = 0; i < 6; i++) {
    state.particles.push({
      x: x - 30 + i * 12, y: y - 40 - i * 8, size: 7 + i,
      color: '#ffffff', life: 1.4, maxLife: 1.4, vy: -14, vx: 2,
    });
  }
}

export function applyShot(state, name) {
  baseStagedState(state);
  if (name === 'kitchen') {
    // The cover: everything the judge wants in one frame.
    state.day = 1;
    state.dayLength = 90;
    state.timeLeft = 62;
    state.coins = 74;
    state.combo = 3;
    state.served = 4;
    state.missed = 1;
    state.queue.tickets = [
      ticket('nasi-ayam', 38, 65, 26),
      ticket('mie-sayur', 52, 70, 22),
      ticket('nasi-telur', 14, 60, 18),
    ];
    state.wok.items = [
      wokItem('rice', 4.5, 'cooking'),
      wokItem('chicken', 8.2, 'done'),
      wokItem('egg', 4.1, 'done'),
    ];
    state.plate.items = ['rice', 'egg', 'kecap'];
    state.held = 'sambal';
    state.mouse = { x: 330, y: 300 };
    steam(state, 330, 350);
  } else if (name === 'serve') {
    // The serve moment: a finished plate, coins flying, the bell just rung.
    state.day = 2;
    state.dayLength = 105;
    state.timeLeft = 48;
    state.coins = 132;
    state.combo = 4;
    state.served = 9;
    state.missed = 1;
    state.queue.tickets = [
      ticket('mie-spesial', 30, 60, 30),
      ticket('nasi-kerupuk', 44, 62, 28),
    ];
    state.wok.items = [wokItem('noodle', 5.2, 'cooking'), wokItem('veg', 4.4, 'done')];
    state.plate.items = ['noodle', 'chicken', 'veg', 'sambal'];
    state.lastServed = 'Nasi Goreng Ayam';
    state.mouse = { x: 640, y: 350 };
    state.floats.push({ text: '+30', x: 640, y: 260, size: 28, color: '#f5b301', life: 1.2, maxLife: 1.2 });
    state.floats.push({ text: 'TIP +8', x: 640, y: 290, size: 18, color: '#2f9e44', life: 1.2, maxLife: 1.2 });
    for (let i = 0; i < 5; i++) {
      state.particles.push({
        x: 900 + i * 26, y: 330 - i * 10, size: 9,
        color: '#f5b301', life: 1.1, maxLife: 1.1, vy: -30, vx: 40,
      });
    }
    steam(state, 330, 350);
  } else if (name === 'rush') {
    // Rush hour: four tickets, one almost out of patience, a full wok with
    // one portion about to burn.
    state.day = 3;
    state.dayLength = 120;
    state.timeLeft = 38;
    state.coins = 168;
    state.combo = 2;
    state.served = 14;
    state.missed = 3;
    state.rushActive = true;
    state.queue.tickets = [
      ticket('mie-ayam', 8, 55, 32),
      ticket('nasi-ayam', 22, 58, 26),
      ticket('mie-spesial', 35, 60, 30),
      ticket('nasi-kerupuk', 47, 58, 28),
    ];
    state.wok.items = [
      wokItem('noodle', 6.4, 'done'),
      wokItem('chicken', 8.1, 'done'),
      wokItem('veg', 8.9, 'burning'),
      wokItem('sambal', 2.6, 'cooking'),
    ];
    state.wok.items[2].burn = 2.5;
    state.plate.items = ['rice', 'chicken'];
    state.held = 'egg';
    state.mouse = { x: 330, y: 300 };
    steam(state, 330, 350);
  } else if (name === 'combo') {
    // Late game: a long combo chain, big coins, day three menu.
    state.day = 3;
    state.dayLength = 120;
    state.timeLeft = 52;
    state.coins = 214;
    state.combo = 6;
    state.bestCombo = 6;
    state.served = 18;
    state.missed = 2;
    state.queue.tickets = [
      ticket('mie-ayam', 40, 55, 32),
      ticket('nasi-kerupuk', 28, 58, 28),
    ];
    state.wok.items = [wokItem('rice', 5.5, 'done'), wokItem('egg', 4.2, 'done')];
    state.plate.items = ['noodle', 'chicken', 'veg', 'kecap'];
    state.lastServed = 'Mie Goreng Spesial';
    state.floats.push({ text: '+32', x: 640, y: 250, size: 30, color: '#f5b301', life: 1.2, maxLife: 1.2 });
    state.floats.push({ text: 'KOMBO x6!', x: 640, y: 285, size: 20, color: '#ff5a3c', life: 1.2, maxLife: 1.2 });
    steam(state, 330, 350);
  }
  return state;
}
