// Warung Kilat — mouse and keyboard input.
// Clicks are hit-tested against the kitchen geometry (bins, wok, wok
// portions, plate, trash, serve window) and turned into named actions the
// main loop owns. Keys mirror the clicks so the game plays either way.

import { LAYOUT, binRect, wokItemPositions, pointInRect, pointInCircle } from './kitchen.js';
import { INGREDIENTS } from './recipes.js';

// The canvas is 1280x720 internally but CSS scales it to the page, so
// pointer positions are scaled back into canvas space before hit-testing.
// Without this, clicks would land in the wrong place on any other size.
function canvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

export function bindInput(canvas, actions) {
  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    const p = canvasPoint(canvas, event);
    actions.onPointer(p.x, p.y);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key >= '1' && key <= '8') {
      const index = Number(key) - 1;
      if (index < INGREDIENTS.length) actions.pickBin(index);
      return;
    }
    if (key === ' ') {
      event.preventDefault();
      actions.stir();
      return;
    }
    if (key === 'enter') {
      actions.serve();
      return;
    }
    if (key === 'p') {
      actions.togglePause();
      return;
    }
    if (key === 'm') {
      actions.toggleMute();
      return;
    }
    if (key === 'r') {
      actions.restart();
      return;
    }
    if (key === 'escape') {
      actions.clearHeld();
    }
  });
}

// Decide what a click at (x, y) means, given the live game state.
// Returns one of: {kind:'bin',index} {kind:'wokItem',index} {kind:'wok'}
// {kind:'plate'} {kind:'trash'} {kind:'window'} or {kind:'none'}.
export function hitTest(state, x, y) {
  for (let i = 0; i < INGREDIENTS.length; i++) {
    if (pointInRect(x, y, binRect(i))) return { kind: 'bin', index: i };
  }
  const spots = wokItemPositions(state.wok.items.length);
  for (let i = 0; i < spots.length; i++) {
    if (pointInCircle(x, y, spots[i].x, spots[i].y, spots[i].r)) {
      return { kind: 'wokItem', index: i };
    }
  }
  if (pointInCircle(x, y, LAYOUT.wok.x, LAYOUT.wok.y, LAYOUT.wok.r)) {
    return { kind: 'wok' };
  }
  if (pointInCircle(x, y, LAYOUT.plate.x, LAYOUT.plate.y, LAYOUT.plate.r)) {
    return { kind: 'plate' };
  }
  if (pointInRect(x, y, LAYOUT.trash)) return { kind: 'trash' };
  if (pointInRect(x, y, LAYOUT.window)) return { kind: 'window' };
  return { kind: 'none' };
}
