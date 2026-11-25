// Warung Kilat — the kitchen itself: wok, plate, ingredient bins, serve
// window, and where each of them sits on the 1280x720 canvas.
// All cooking rules live here: adding to the wok, stirring, burning,
// moving food to the plate, trashing, and serving a finished plate.

import { ingredientById, dishOnPlate } from './recipes.js';

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

// Where things sit. The render and input modules read these so the picture
// and the clicks always agree.
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 56 },
  board: { x: 24, y: 64, w: 1232, h: 112 },
  ticket: { w: 216, h: 100, gap: 14 },
  wok: { x: 330, y: 350, r: 118 },
  plate: { x: 640, y: 350, r: 96 },
  window: { x: 872, y: 200, w: 384, h: 330 },
  trash: { x: 800, y: 470, w: 84, h: 64 },
  counter: { x: 24, y: 552, w: 1232, h: 148 },
  bin: { w: 140, h: 132, gap: 14 },
};

export const WOK_CAPACITY = 4;
export const PLATE_CAPACITY = 4;
export const DONE_WINDOW = 4; // seconds a cooked item stays perfect
export const BURN_TIME = 5; // seconds of burning before it is ruined

export function newWok() {
  return { items: [] };
}

export function newPlate() {
  return { items: [] };
}

// One portion in the wok. `cook` counts up while it fries.
export function addToWok(wok, ingId) {
  if (wok.items.length >= WOK_CAPACITY) return false;
  wok.items.push({ ingId, cook: 0, state: 'raw', burn: 0 });
  return true;
}

// Advance the wok by dt seconds. Returns 'burnt' when an item just ruined.
export function tickWok(wok, dt) {
  let ruined = false;
  for (const item of wok.items) {
    const ing = ingredientById(item.ingId);
    if (item.state === 'burnt') continue;
    item.cook += dt;
    if (item.state === 'raw' && item.cook >= ing.cook * 0.5) item.state = 'cooking';
    if (item.state !== 'burnt' && item.cook >= ing.cook) {
      if (item.cook >= ing.cook + DONE_WINDOW) {
        item.state = 'burning';
        item.burn += dt;
        if (item.burn >= BURN_TIME) {
          item.state = 'burnt';
          ruined = true;
        }
      } else {
        item.state = 'done';
      }
    }
  }
  return ruined;
}

// Stir: every portion cooks a little faster and every burning portion gets
// its burn clock reset. This is the player's active job at the wok.
export function stirWok(wok) {
  for (const item of wok.items) {
    if (item.state === 'burnt') continue;
    const ing = ingredientById(item.ingId);
    if (item.state === 'burning') {
      // A rescued portion gets a fresh done window: its cook clock restarts
      // at the moment it finished cooking.
      item.cook = ing.cook;
      item.burn = 0;
      item.state = 'done';
    } else {
      item.cook += 0.6;
    }
  }
}

export function wokItemAt(wok, index) {
  return wok.items[index] || null;
}

// Lift a finished portion out of the wok onto the plate.
export function moveWokItemToPlate(wok, plate, index) {
  const item = wok.items[index];
  if (!item || item.state !== 'done') return false;
  if (plate.items.length >= PLATE_CAPACITY) return false;
  wok.items.splice(index, 1);
  plate.items.push(item.ingId);
  return true;
}

// Throw a ruined portion away. Returns true when something was trashed.
export function trashWokItem(wok, index) {
  const item = wok.items[index];
  if (!item || item.state !== 'burnt') return false;
  wok.items.splice(index, 1);
  return true;
}

export function clearPlate(plate) {
  plate.items.length = 0;
}

// The dish the plate currently is, or null when the mix is not a dish.
export function plateDish(plate) {
  return dishOnPlate(plate.items);
}

// Ingredient-bin rectangles, left to right in INGREDIENTS order.
export function binRect(index) {
  const { counter, bin } = LAYOUT;
  return {
    x: counter.x + index * (bin.w + bin.gap),
    y: counter.y + 8,
    w: bin.w,
    h: bin.h,
  };
}

// Where portions sit inside the wok, arranged in a ring. The renderer and
// the click tester both use this so a portion is drawn where it is clicked.
export function wokItemPositions(count) {
  const { wok } = LAYOUT;
  const spots = [];
  const ring = 58;
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (i / Math.max(count, 1)) * Math.PI * 2;
    spots.push({
      x: wok.x + Math.cos(angle) * ring,
      y: wok.y + Math.sin(angle) * ring * 0.85,
      r: 30,
    });
  }
  return spots;
}

export function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

export function pointInCircle(px, py, cx, cy, r) {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}
