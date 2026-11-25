// Warung Kilat — boot, game loop, and the shift itself.
// Owns the game state, the three-day flow, and every player action.
// Rendering lives in render.js, cooking rules in kitchen.js, tickets in
// orders.js, sounds in audio.js, clicks in input.js.

import { CANVAS_W, LAYOUT, newWok, newPlate, addToWok, tickWok, stirWok, moveWokItemToPlate, trashWokItem, clearPlate, plateDish } from './kitchen.js';
import { INGREDIENTS } from './recipes.js';
import { newTicketQueue, tickTickets, matchingTicket, serveTicket } from './orders.js';
import { drawGame } from './render.js';
import { bindInput, hitTest } from './input.js';
import { unlockAudio, setMuted, isMuted, startSizzle, stopSizzle, playPick, playDrop, playStir, playPlating, playReadyBell, playServe, playCoin, playError, playWalkout, playRush } from './audio.js';
import { applyShot, SHOT_NAMES } from './shots.js';

const DAY_LENGTHS = { 1: 90, 2: 105, 3: 120 };
const STAR_COINS = { 3: 500, 2: 350, 1: 200 };

function freshState() {
  return {
    screen: 'title',
    day: 1,
    dayLength: DAY_LENGTHS[1],
    timeLeft: DAY_LENGTHS[1],
    coins: 0,
    served: 0,
    missed: 0,
    combo: 0,
    bestCombo: 0,
    dayCoins: 0,
    dayServed: 0,
    dayMissed: 0,
    stars: 0,
    queue: newTicketQueue(),
    wok: newWok(),
    plate: newPlate(),
    held: null,
    mouse: null,
    particles: [],
    floats: [],
    rushActive: false,
    rushTimer: 0,
    rushDone: false,
    lastServed: null,
    paused: false,
    staged: false,
    shotName: null,
    readyBellPlayed: false,
  };
}

const state = freshState();
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function startShift() {
  const keep = state.staged;
  const stagedName = state.shotName;
  Object.assign(state, freshState());
  state.staged = keep;
  state.shotName = stagedName;
  state.screen = 'play';
}

function beginDay(day) {
  state.day = day;
  state.dayLength = DAY_LENGTHS[day];
  state.timeLeft = DAY_LENGTHS[day];
  state.dayCoins = 0;
  state.dayServed = 0;
  state.dayMissed = 0;
  state.queue = newTicketQueue();
  state.wok = newWok();
  state.plate = newPlate();
  state.held = null;
  state.rushActive = false;
  state.rushTimer = 0;
  state.rushDone = false;
  state.screen = 'play';
}

function endDay() {
  stopSizzle();
  if (state.day >= 3) {
    state.stars = state.coins >= STAR_COINS[3] ? 3
      : state.coins >= STAR_COINS[2] ? 2
      : state.coins >= STAR_COINS[1] ? 1 : 0;
    state.screen = 'results';
  } else {
    state.screen = 'dayEnd';
  }
}

function addFloat(text, x, y, size, color) {
  state.floats.push({ text, x, y, size, color, life: 1.4, maxLife: 1.4 });
}

function addSteamPuff() {
  for (let i = 0; i < 4; i++) {
    state.particles.push({
      x: LAYOUT.wok.x - 24 + Math.random() * 48,
      y: LAYOUT.wok.y - 70,
      size: 5 + Math.random() * 7,
      color: '#ffffff',
      life: 1.1, maxLife: 1.1,
      vx: (Math.random() - 0.5) * 8, vy: -22 - Math.random() * 10,
    });
  }
}

function tryServe() {
  const dish = plateDish(state.plate);
  if (!dish) {
    playError();
    if (state.plate.items.length > 0) {
      addFloat('Bukan menu!', LAYOUT.plate.x, LAYOUT.plate.y - 110, 16, '#d9382b');
    }
    return;
  }
  const ticket = matchingTicket(state.queue, state.plate.items);
  if (!ticket) {
    playError();
    addFloat('Tidak ada yang pesan ini', LAYOUT.plate.x, LAYOUT.plate.y - 110, 16, '#d9382b');
    return;
  }
  const pay = serveTicket(state.queue, ticket, state.combo);
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.coins += pay.total;
  state.dayCoins += pay.total;
  state.served += 1;
  state.dayServed += 1;
  state.lastServed = dish.name;
  state.readyBellPlayed = false;
  clearPlate(state.plate);
  addFloat(`+Rp ${pay.total}`, LAYOUT.window.x + LAYOUT.window.w / 2, LAYOUT.window.y + 130, 26, '#f5b301');
  if (pay.tip > 0) addFloat(`TIP +${pay.tip}`, LAYOUT.window.x + LAYOUT.window.w / 2, LAYOUT.window.y + 160, 16, '#2f9e44');
  playServe();
  setTimeout(playCoin, 180);
}

function onPointer(x, y) {
  unlockAudio();
  state.mouse = { x, y };
  if (state.screen === 'title') {
    startShift();
    return;
  }
  if (state.screen === 'dayEnd') {
    beginDay(state.day + 1);
    return;
  }
  if (state.screen !== 'play' || state.paused) return;
  const hit = hitTest(state, x, y);
  if (hit.kind === 'bin') {
    const ing = INGREDIENTS[hit.index];
    state.held = state.held === ing.id ? null : ing.id;
    playPick();
    return;
  }
  if (hit.kind === 'wokItem') {
    const item = state.wok.items[hit.index];
    if (!item) return;
    if (item.state === 'done') {
      if (moveWokItemToPlate(state.wok, state.plate, hit.index)) {
        playPlating();
        const dish = plateDish(state.plate);
        if (dish && !state.readyBellPlayed) {
          state.readyBellPlayed = true;
          playReadyBell();
        }
      } else {
        playError();
      }
    } else if (item.state === 'burnt') {
      trashWokItem(state.wok, hit.index);
      playDrop();
      addFloat('Dibuang', LAYOUT.wok.x, LAYOUT.wok.y - 130, 15, '#d9382b');
    } else {
      playStir();
      stirWok(state.wok);
    }
    return;
  }
  if (hit.kind === 'wok') {
    if (state.held) {
      if (addToWok(state.wok, state.held)) {
        playDrop();
        addSteamPuff();
        state.held = null;
      } else {
        playError();
        addFloat('Wok penuh!', LAYOUT.wok.x, LAYOUT.wok.y - 130, 15, '#d9382b');
      }
    } else {
      stirWok(state.wok);
      playStir();
      addSteamPuff();
    }
    return;
  }
  if (hit.kind === 'plate' || hit.kind === 'window') {
    tryServe();
    return;
  }
  if (hit.kind === 'trash') {
    if (state.plate.items.length > 0) {
      clearPlate(state.plate);
      state.readyBellPlayed = false;
      playDrop();
    }
    return;
  }
  state.held = null;
}

const actions = {
  onPointer,
  pickBin(index) {
    if (state.screen !== 'play' || state.paused) return;
    unlockAudio();
    const ing = INGREDIENTS[index];
    state.held = state.held === ing.id ? null : ing.id;
    playPick();
  },
  stir() {
    if (state.screen !== 'play' || state.paused) return;
    unlockAudio();
    stirWok(state.wok);
    playStir();
    addSteamPuff();
  },
  serve() {
    if (state.screen !== 'play' || state.paused) return;
    tryServe();
  },
  togglePause() {
    if (state.screen === 'play') state.paused = !state.paused;
  },
  toggleMute() {
    unlockAudio();
    setMuted(!isMuted());
  },
  restart() {
    if (state.screen === 'results' || state.screen === 'title') startShift();
  },
  clearHeld() {
    state.held = null;
  },
};

bindInput(canvas, actions);
canvas.addEventListener('pointermove', (event) => {
  const rect = canvas.getBoundingClientRect();
  state.mouse = {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
});

function update(dt) {
  // Ambient particles and floats always move, even on menus.
  for (const p of state.particles) {
    p.life -= dt;
    p.x += (p.vx || 0) * dt;
    p.y += (p.vy || 0) * dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
  for (const f of state.floats) {
    f.life -= dt;
    f.y -= 26 * dt;
  }
  state.floats = state.floats.filter((f) => f.life > 0);
  if (state.screen !== 'play' || state.paused || state.staged) return;

  state.timeLeft -= dt;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    endDay();
    return;
  }
  // Rush hour starts halfway through the shift and lasts 20 seconds.
  if (!state.rushDone && state.timeLeft <= state.dayLength / 2) {
    state.rushActive = true;
    state.rushDone = true;
    state.rushTimer = 20;
    playRush();
    addFloat('JAM SIBUK!', CANVAS_W / 2, 300, 30, '#d9382b');
  }
  if (state.rushActive) {
    state.rushTimer -= dt;
    if (state.rushTimer <= 0) state.rushActive = false;
  }
  const ruined = tickWok(state.wok, dt);
  if (ruined) {
    state.combo = 0;
    playError();
    addFloat('Ada yang gosong!', LAYOUT.wok.x, LAYOUT.wok.y - 130, 16, '#d9382b');
  }
  const walkedOut = tickTickets(state.queue, state.day, dt, Math.random, state.rushActive);
  for (const ticket of walkedOut) {
    state.combo = 0;
    state.missed += 1;
    state.dayMissed += 1;
    playWalkout();
    addFloat('Pelanggan pergi!', 300, 200, 17, '#d9382b');
  }
  if (state.wok.items.length > 0) startSizzle();
  else stopSizzle();
  if (state.wok.items.length > 0 && Math.random() < dt * 2) addSteamPuff();
}

let last = performance.now();
let shotReadySent = false;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  drawGame(ctx, state);
  if (state.staged && !shotReadySent) {
    shotReadySent = true;
    window.__shotReady = true;
  }
  requestAnimationFrame(frame);
}

// Screenshot mode: ?shot=kitchen | serve | rush | combo stages one frozen
// moment for the entry screenshots and tells the harness it is ready.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot && SHOT_NAMES.includes(shot)) {
  state.staged = true;
  state.shotName = shot;
  state.screen = 'play';
  applyShot(state, shot);
}

requestAnimationFrame(frame);
