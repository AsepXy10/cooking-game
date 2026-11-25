// Warung Kilat — everything the player sees, drawn on one canvas.
// All art is vector shapes in code: no image files, no fonts from the
// network. The layout matches kitchen.js so clicks land where things are.

import { CANVAS_W, CANVAS_H, LAYOUT, binRect, wokItemPositions } from './kitchen.js';
import { INGREDIENTS, ingredientById, recipeById, dishOnPlate } from './recipes.js';

const WALL = '#f6e3bd';
const FLOOR_A = '#eec493';
const FLOOR_B = '#e3b47f';
const WOOD = '#8a5a2e';
const WOOD_DARK = '#6b4423';
const INK = '#33241a';
const CREAM = '#fff8e8';
const RED = '#d9382b';
const GREEN = '#3f9e4d';
const GOLD = '#f5b301';

export function drawGame(ctx, state) {
  drawRoom(ctx);
  drawTopBar(ctx, state);
  if (state.rushActive) drawRushBanner(ctx);
  drawOrderBoard(ctx, state);
  drawWokStation(ctx, state);
  drawPlateStation(ctx, state);
  drawServeWindow(ctx, state);
  drawTrashBin(ctx, state);
  drawIngredientCounter(ctx, state);
  drawParticles(ctx, state);
  drawFloats(ctx, state);
  drawHeldIngredient(ctx, state);
  if (state.screen === 'title') drawTitleScreen(ctx, state);
  if (state.screen === 'dayEnd') drawDayEndScreen(ctx, state);
  if (state.screen === 'results') drawResultsScreen(ctx, state);
  if (state.paused && state.screen === 'play') drawPausedOverlay(ctx);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

function text(ctx, str, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 'bold'} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function drawRoom(ctx) {
  ctx.fillStyle = WALL;
  ctx.fillRect(0, 0, CANVAS_W, 184);
  ctx.fillStyle = '#e8b48a';
  ctx.fillRect(0, 176, CANVAS_W, 8);
  // Floor tiles.
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 16; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(col * 80, 184 + row * 74, 80, 74);
    }
  }
  // Wooden counter band at the bottom.
  ctx.fillStyle = WOOD;
  ctx.fillRect(0, 552, CANVAS_W, 168);
  ctx.fillStyle = '#a06a35';
  ctx.fillRect(0, 552, CANVAS_W, 10);
}

function drawTopBar(ctx, state) {
  ctx.fillStyle = '#3a2415';
  ctx.fillRect(0, 0, CANVAS_W, 56);
  // Shift clock: a sweeping hand plus mm:ss.
  const frac = state.dayLength > 0 ? state.timeLeft / state.dayLength : 1;
  const mm = Math.max(0, Math.floor(state.timeLeft / 60));
  const ss = Math.max(0, Math.floor(state.timeLeft % 60));
  circle(ctx, 40, 28, 18);
  ctx.fillStyle = CREAM;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.stroke();
  const angle = -Math.PI / 2 + (1 - frac) * Math.PI * 2;
  ctx.beginPath();
  ctx.moveTo(40, 28);
  ctx.lineTo(40 + Math.cos(angle) * 13, 28 + Math.sin(angle) * 13);
  ctx.stroke();
  text(ctx, `${mm}:${String(ss).padStart(2, '0')}`, 66, 29, 22, CREAM);
  // Shift progress bar.
  ctx.fillStyle = '#5d4026';
  roundRect(ctx, 140, 20, 180, 16, 8);
  ctx.fill();
  ctx.fillStyle = frac > 0.33 ? GOLD : RED;
  roundRect(ctx, 140, 20, 180 * frac, 16, 8);
  ctx.fill();
  text(ctx, 'WARUNG KILAT', 640, 24, 26, '#ffd66e', 'bold', 'center');
  text(ctx, `Hari ${state.day} / 3`, 640, 45, 13, '#e8c9a0', 'bold', 'center');
  // Coins and combo, right side.
  circle(ctx, 1010, 28, 14);
  ctx.fillStyle = GOLD;
  ctx.fill();
  ctx.strokeStyle = '#a37000';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'Rp', 1010, 29, 11, '#7a5200', 'bold', 'center');
  text(ctx, `${state.coins}`, 1032, 29, 22, CREAM);
  if (state.combo >= 2) {
    ctx.fillStyle = '#ff5a3c';
    roundRect(ctx, 1120, 12, 130, 32, 16);
    ctx.fill();
    text(ctx, `KOMBO x${state.combo}`, 1185, 29, 18, '#fff', 'bold', 'center');
  }
}

function drawRushBanner(ctx) {
  ctx.fillStyle = '#d9382b';
  roundRect(ctx, 470, 512, 340, 28, 14);
  ctx.fill();
  text(ctx, 'JAM SIBUK! Pesanan datang lebih cepat!', 640, 527, 15, '#fff', 'bold', 'center');
}

function patienceColor(frac) {
  if (frac > 0.5) return GREEN;
  if (frac > 0.25) return '#e8910c';
  return RED;
}

function drawOrderBoard(ctx, state) {
  const { board, ticket } = LAYOUT;
  const tickets = state.queue.tickets;
  ctx.fillStyle = '#5d4026';
  roundRect(ctx, board.x, board.y, board.w, board.h, 12);
  ctx.fill();
  ctx.fillStyle = '#7a5230';
  roundRect(ctx, board.x + 6, board.y + 6, board.w - 12, board.h - 12, 8);
  ctx.fill();
  text(ctx, 'PESANAN', board.x + 16, board.y + 20, 13, '#ffd66e');
  if (tickets.length === 0) {
    text(ctx, 'Belum ada pesanan — pelanggan segera datang…', board.x + 120, board.y + 62, 18, '#e8c9a0', 'bold');
    return;
  }
  tickets.forEach((t, i) => {
    const dish = recipeById(t.dishId);
    const x = board.x + 110 + i * (ticket.w + ticket.gap);
    const y = board.y + 8;
    const frac = Math.max(0, t.patience / t.patienceMax);
    ctx.fillStyle = CREAM;
    roundRect(ctx, x, y, ticket.w, ticket.h, 10);
    ctx.fill();
    ctx.fillStyle = patienceColor(frac);
    roundRect(ctx, x, y, ticket.w, 10, 5);
    ctx.fill();
    text(ctx, dish.name, x + 10, y + 26, 14, INK);
    dish.ing.forEach((ingId, j) => {
      drawIngredientIcon(ctx, ingId, x + 22 + j * 36, y + 56, 14);
    });
    text(ctx, `Rp ${dish.price}`, x + 10, y + 84, 15, '#7a5200');
    // Patience bar.
    ctx.fillStyle = '#e0cba6';
    roundRect(ctx, x + 92, y + 78, 112, 10, 5);
    ctx.fill();
    ctx.fillStyle = patienceColor(frac);
    roundRect(ctx, x + 92, y + 78, 112 * frac, 10, 5);
    ctx.fill();
  });
}

function drawWokStation(ctx, state) {
  const { wok } = LAYOUT;
  // Flame glow under the wok while it holds food.
  if (state.wok.items.length > 0) {
    const grad = ctx.createRadialGradient(wok.x, wok.y + 96, 10, wok.x, wok.y + 96, 130);
    grad.addColorStop(0, 'rgba(255,120,30,0.55)');
    grad.addColorStop(1, 'rgba(255,120,30,0)');
    ctx.fillStyle = grad;
    circle(ctx, wok.x, wok.y + 96, 130);
    ctx.fill();
  }
  // Stove ring.
  circle(ctx, wok.x, wok.y + 8, wok.r + 14);
  ctx.fillStyle = '#4a4a52';
  ctx.fill();
  // The wok itself.
  const grad = ctx.createRadialGradient(wok.x - 30, wok.y - 30, 10, wok.x, wok.y, wok.r);
  grad.addColorStop(0, '#55555f');
  grad.addColorStop(1, '#232327');
  circle(ctx, wok.x, wok.y, wok.r);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 4;
  ctx.stroke();
  // Portions in the wok.
  const spots = wokItemPositions(state.wok.items.length);
  state.wok.items.forEach((item, i) => {
    drawWokPortion(ctx, item, spots[i].x, spots[i].y, spots[i].r);
  });
  if (state.wok.items.length === 0) {
    text(ctx, 'WOK KOSONG', wok.x, wok.y - 6, 16, '#8a8a92', 'bold', 'center');
    text(ctx, 'klik bahan di bawah,', wok.x, wok.y + 16, 13, '#8a8a92', 'bold', 'center');
    text(ctx, 'lalu klik wok', wok.x, wok.y + 34, 13, '#8a8a92', 'bold', 'center');
  }
  text(ctx, 'WOK  •  klik / spasi = aduk', wok.x, wok.y + wok.r + 24, 14, INK, 'bold', 'center');
}

function drawWokPortion(ctx, item, x, y, r) {
  const ing = ingredientById(item.ingId);
  const stateColor = item.state === 'burnt' ? '#1a1a1a'
    : item.state === 'burning' ? '#8a3a10'
    : item.state === 'done' ? '#2f9e44' : '#d8c49a';
  circle(ctx, x, y, r);
  ctx.fillStyle = stateColor;
  ctx.fill();
  ctx.strokeStyle = item.state === 'done' ? '#fff' : '#00000055';
  ctx.lineWidth = 3;
  ctx.stroke();
  drawIngredientIcon(ctx, item.ingId, x, y, r - 9);
  // Cook progress ring.
  const frac = Math.min(1, item.cook / ing.cook);
  ctx.beginPath();
  ctx.arc(x, y, r + 4, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
  ctx.strokeStyle = item.state === 'burnt' ? '#ff3b30' : GOLD;
  ctx.lineWidth = 4;
  ctx.stroke();
  if (item.state === 'done') {
    text(ctx, 'SIAP!', x, y - r - 12, 13, '#2f9e44', 'bold', 'center');
  } else if (item.state === 'burning') {
    text(ctx, 'GOSONG!', x, y - r - 12, 13, '#ff3b30', 'bold', 'center');
  } else if (item.state === 'burnt') {
    text(ctx, 'BUANG', x, y - r - 12, 13, '#ff3b30', 'bold', 'center');
  }
}

function drawPlateStation(ctx, state) {
  const { plate } = LAYOUT;
  const dish = state.plate.items.length > 0 ? dishOnPlate(state.plate.items) : null;
  const ready = !!dish;
  // Glow when the plate is a complete dish.
  if (ready) {
    const grad = ctx.createRadialGradient(plate.x, plate.y, 10, plate.x, plate.y, plate.r + 42);
    grad.addColorStop(0, 'rgba(80,220,110,0.5)');
    grad.addColorStop(1, 'rgba(80,220,110,0)');
    ctx.fillStyle = grad;
    circle(ctx, plate.x, plate.y, plate.r + 42);
    ctx.fill();
  }
  circle(ctx, plate.x, plate.y, plate.r);
  ctx.fillStyle = '#fdfdf6';
  ctx.fill();
  ctx.strokeStyle = ready ? '#2f9e44' : '#b8a98a';
  ctx.lineWidth = 5;
  ctx.stroke();
  circle(ctx, plate.x, plate.y, plate.r - 16);
  ctx.strokeStyle = '#e5dcc4';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Portions on the plate, in a small row.
  const n = state.plate.items.length;
  state.plate.items.forEach((ingId, i) => {
    const px = plate.x + (i - (n - 1) / 2) * 44;
    drawIngredientIcon(ctx, ingId, px, plate.y, 19);
  });
  if (n === 0) {
    text(ctx, 'PIRING', plate.x, plate.y - 8, 15, '#b8a98a', 'bold', 'center');
    text(ctx, 'klik bahan matang', plate.x, plate.y + 14, 12, '#b8a98a', 'bold', 'center');
    text(ctx, 'di wok untuk menata', plate.x, plate.y + 30, 12, '#b8a98a', 'bold', 'center');
  }
  if (ready) {
    text(ctx, `${dish.name} — SIAP!`, plate.x, plate.y + plate.r + 22, 15, '#2f9e44', 'bold', 'center');
    text(ctx, 'klik piring untuk mengantar', plate.x, plate.y + plate.r + 42, 13, INK, 'bold', 'center');
  } else if (n > 0) {
    text(ctx, 'Belum jadi satu menu…', plate.x, plate.y + plate.r + 22, 14, '#8a6a3a', 'bold', 'center');
  }
}

function drawServeWindow(ctx, state) {
  const { window: win } = LAYOUT;
  ctx.fillStyle = WOOD_DARK;
  roundRect(ctx, win.x, win.y, win.w, win.h, 12);
  ctx.fill();
  ctx.fillStyle = '#ffe9b8';
  roundRect(ctx, win.x + 10, win.y + 10, win.w - 20, win.h - 70, 8);
  ctx.fill();
  text(ctx, 'JENDELA SAJI', win.x + win.w / 2, win.y + 34, 16, '#7a5200', 'bold', 'center');
  // The bell.
  circle(ctx, win.x + win.w / 2, win.y + 108, 34);
  ctx.fillStyle = GOLD;
  ctx.fill();
  ctx.strokeStyle = '#a37000';
  ctx.lineWidth = 3;
  ctx.stroke();
  circle(ctx, win.x + win.w / 2, win.y + 78, 8);
  ctx.fillStyle = GOLD;
  ctx.fill();
  text(ctx, 'DING!', win.x + win.w / 2, win.y + 168, 15, '#7a5200', 'bold', 'center');
  if (state.lastServed) {
    text(ctx, `Terakhir: ${state.lastServed}`, win.x + win.w / 2, win.y + 196, 15, INK, 'bold', 'center');
  }
  text(ctx, 'Pesanan selesai diantar ke sini', win.x + win.w / 2, win.y + 224, 13, '#8a6a3a', 'bold', 'center');
  ctx.fillStyle = WOOD;
  roundRect(ctx, win.x + 10, win.y + win.h - 52, win.w - 20, 42, 8);
  ctx.fill();
  text(ctx, `Disajikan: ${state.served}   •   Terlewat: ${state.missed}`, win.x + win.w / 2, win.y + win.h - 30, 14, CREAM, 'bold', 'center');
}

function drawTrashBin(ctx, state) {
  const { trash } = LAYOUT;
  ctx.fillStyle = '#5a5a62';
  roundRect(ctx, trash.x, trash.y, trash.w, trash.h, 8);
  ctx.fill();
  ctx.fillStyle = '#3a3a40';
  roundRect(ctx, trash.x + 6, trash.y - 8, trash.w - 12, 12, 6);
  ctx.fill();
  text(ctx, 'SAMPAH', trash.x + trash.w / 2, trash.y + trash.h / 2, 13, '#fff', 'bold', 'center');
  if (state.plate.items.length > 0) {
    text(ctx, 'klik untuk buang isi piring', trash.x + trash.w / 2, trash.y + trash.h + 14, 11, INK, 'bold', 'center');
  }
}

function drawIngredientCounter(ctx, state) {
  INGREDIENTS.forEach((ing, i) => {
    const rect = binRect(i);
    const held = state.held === ing.id;
    ctx.fillStyle = held ? '#ffd66e' : '#a06a35';
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
    ctx.fill();
    ctx.fillStyle = '#f3e2bd';
    roundRect(ctx, rect.x + 5, rect.y + 5, rect.w - 10, rect.h - 10, 8);
    ctx.fill();
    drawIngredientIcon(ctx, ing.id, rect.x + rect.w / 2, rect.y + 52, 30);
    text(ctx, ing.name, rect.x + rect.w / 2, rect.y + 100, 15, INK, 'bold', 'center');
    text(ctx, `${i + 1}`, rect.x + 12, rect.y + 16, 12, '#8a6a3a', 'bold');
    if (held) {
      text(ctx, 'DIPEGANG', rect.x + rect.w / 2, rect.y + 122, 11, '#a35a00', 'bold', 'center');
    }
  });
}

function drawParticles(ctx, state) {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    circle(ctx, p.x, p.y, p.size);
    ctx.fillStyle = p.color;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFloats(ctx, state) {
  for (const f of state.floats) {
    ctx.globalAlpha = Math.max(0, f.life / f.maxLife);
    text(ctx, f.text, f.x, f.y, f.size, f.color, 'bold', 'center');
  }
  ctx.globalAlpha = 1;
}

function drawHeldIngredient(ctx, state) {
  if (!state.held || !state.mouse) return;
  ctx.globalAlpha = 0.9;
  drawIngredientIcon(ctx, state.held, state.mouse.x, state.mouse.y - 28, 22);
  ctx.globalAlpha = 1;
}

function drawTitleScreen(ctx, state) {
  ctx.fillStyle = 'rgba(30,16,8,0.82)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'WARUNG KILAT', 640, 150, 72, '#ffd66e', 'bold', 'center');
  text(ctx, 'Warung nasi goreng paling sibuk di kota — masak cepat, antar tepat!', 640, 210, 22, CREAM, 'bold', 'center');
  // How to play, three steps.
  const steps = [
    ['1. AMBIL BAHAN', 'Klik bahan di meja bawah (atau tombol 1–8).'],
    ['2. MASAK DI WOK', 'Klik wok untuk memasukkan, aduk dengan Spasi supaya tidak gosong.'],
    ['3. TATA & ANTAR', 'Klik bahan matang ke piring, lalu klik piring saat menunya lengkap.'],
  ];
  steps.forEach((s, i) => {
    const y = 280 + i * 64;
    ctx.fillStyle = '#fff8e8';
    roundRect(ctx, 330, y, 620, 52, 10);
    ctx.fill();
    text(ctx, s[0], 352, y + 18, 16, '#a35a00', 'bold');
    text(ctx, s[1], 352, y + 38, 14, INK);
  });
  text(ctx, '3 hari kerja • menu makin banyak • jam sibuk makin ramai', 640, 500, 17, '#ffd66e', 'bold', 'center');
  text(ctx, 'Klik di mana saja untuk mulai  •  P jeda  •  M suara', 640, 540, 16, CREAM, 'bold', 'center');
}

function drawDayEndScreen(ctx, state) {
  ctx.fillStyle = 'rgba(30,16,8,0.82)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, `Hari ${state.day} selesai!`, 640, 220, 52, '#ffd66e', 'bold', 'center');
  text(ctx, `Disajikan: ${state.dayServed}  •  Terlewat: ${state.dayMissed}  •  Koin hari ini: Rp ${state.dayCoins}`, 640, 300, 22, CREAM, 'bold', 'center');
  text(ctx, state.day < 3 ? 'Besok menu baru masuk dan pelanggan makin tidak sabar.' : '', 640, 350, 18, '#ffd66e', 'bold', 'center');
  text(ctx, 'Klik untuk lanjut', 640, 430, 20, CREAM, 'bold', 'center');
}

function drawResultsScreen(ctx, state) {
  ctx.fillStyle = 'rgba(30,16,8,0.86)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'WARUNG TUTUP!', 640, 150, 56, '#ffd66e', 'bold', 'center');
  const stars = state.stars;
  for (let i = 0; i < 3; i++) {
    drawStar(ctx, 560 + i * 80, 240, 30, i < stars ? GOLD : '#5d4026');
  }
  text(ctx, `Total koin: Rp ${state.coins}`, 640, 320, 26, CREAM, 'bold', 'center');
  text(ctx, `Pesanan disajikan: ${state.served}  •  Terlewat: ${state.missed}  •  Kombo terbaik: x${state.bestCombo}`, 640, 370, 20, CREAM, 'bold', 'center');
  text(ctx, stars === 3 ? 'Warung legendaris! Pelanggan antre sampai ke ujung jalan.'
    : stars === 2 ? 'Warung ramai! Sedikit lagi jadi legenda.'
    : 'Warung tetap buka — latihan lagi besok!', 640, 420, 18, '#ffd66e', 'bold', 'center');
  text(ctx, 'Tekan R untuk main lagi', 640, 500, 20, CREAM, 'bold', 'center');
}

function drawStar(ctx, x, y, r, color) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = x + Math.cos(ang) * rad;
    const py = y + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawPausedOverlay(ctx) {
  ctx.fillStyle = 'rgba(30,16,8,0.6)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'JEDA — tekan P untuk lanjut', 640, 360, 32, CREAM, 'bold', 'center');
}

// One ingredient, drawn as a small pictogram. Used in bins, tickets, the
// wok, and the plate, so the player reads a dish at a glance anywhere.
export function drawIngredientIcon(ctx, ingId, x, y, r) {
  const ing = ingredientById(ingId);
  if (!ing) return;
  ctx.save();
  ctx.translate(x, y);
  if (ingId === 'rice') {
    ctx.fillStyle = '#fff8e8';
    ctx.beginPath();
    ctx.ellipse(0, 2, r, r * 0.72, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fffdf4';
    ctx.beginPath();
    ctx.ellipse(0, -2, r * 0.8, r * 0.6, 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#d9c48f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.2);
    ctx.lineTo(r * 0.4, -r * 0.35);
    ctx.moveTo(-r * 0.3, r * 0.1);
    ctx.lineTo(r * 0.55, -r * 0.05);
    ctx.stroke();
  } else if (ingId === 'noodle') {
    ctx.strokeStyle = '#e8a91c';
    ctx.lineWidth = r * 0.28;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, i * r * 0.45);
      ctx.bezierCurveTo(-r * 0.3, i * r * 0.45 - r * 0.4, r * 0.3, i * r * 0.45 + r * 0.4, r * 0.8, i * r * 0.45);
      ctx.stroke();
    }
  } else if (ingId === 'chicken') {
    ctx.fillStyle = '#e08a3c';
    ctx.beginPath();
    ctx.ellipse(-r * 0.15, r * 0.1, r * 0.75, r * 0.6, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f6e3bd';
    ctx.lineWidth = r * 0.22;
    ctx.beginPath();
    ctx.moveTo(r * 0.35, -r * 0.35);
    ctx.lineTo(r * 0.8, -r * 0.85);
    ctx.stroke();
    ctx.fillStyle = '#fff8e8';
    circle(ctx, r * 0.85, -r * 0.9, r * 0.22);
    ctx.fill();
    circle(ctx, r * 0.6, -r * 0.95, r * 0.18);
    ctx.fill();
  } else if (ingId === 'egg') {
    ctx.fillStyle = '#fffdf4';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.95, r * 0.75, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5a623';
    circle(ctx, r * 0.1, 0, r * 0.42);
    ctx.fill();
    ctx.fillStyle = '#ffd66e';
    circle(ctx, r * 0.02, -r * 0.08, r * 0.18);
    ctx.fill();
  } else if (ingId === 'veg') {
    ctx.fillStyle = '#4da337';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.ellipse(i * r * 0.45, -i * r * 0.15, r * 0.42, r * 0.6, i * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#2f7d2a';
    ctx.lineWidth = r * 0.14;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.2);
    ctx.lineTo(0, r * 0.8);
    ctx.stroke();
  } else if (ingId === 'sambal') {
    ctx.fillStyle = '#d9382b';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.15, r * 0.9, r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff6a4d';
    ctx.beginPath();
    ctx.ellipse(-r * 0.2, -r * 0.1, r * 0.45, r * 0.3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2f7d2a';
    ctx.lineWidth = r * 0.16;
    ctx.beginPath();
    ctx.moveTo(r * 0.5, -r * 0.4);
    ctx.quadraticCurveTo(r * 0.8, -r * 0.8, r * 0.4, -r * 0.95);
    ctx.stroke();
  } else if (ingId === 'kecap') {
    ctx.fillStyle = '#3a2415';
    roundRect(ctx, -r * 0.45, -r * 0.7, r * 0.9, r * 1.4, r * 0.25);
    ctx.fill();
    ctx.fillStyle = '#5a3a22';
    roundRect(ctx, -r * 0.3, -r * 0.95, r * 0.6, r * 0.35, r * 0.12);
    ctx.fill();
    ctx.fillStyle = '#f5b301';
    roundRect(ctx, -r * 0.45, -r * 0.15, r * 0.9, r * 0.5, r * 0.1);
    ctx.fill();
  } else if (ingId === 'cracker') {
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const rad = r * (i % 2 === 0 ? 0.95 : 0.75);
      const px = Math.cos(ang) * rad;
      const py = Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c98f2e';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#c98f2e';
    circle(ctx, -r * 0.3, -r * 0.2, r * 0.1);
    ctx.fill();
    circle(ctx, r * 0.3, r * 0.25, r * 0.1);
    ctx.fill();
    circle(ctx, r * 0.1, -r * 0.4, r * 0.08);
    ctx.fill();
  }
  ctx.restore();
}
