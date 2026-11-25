// Warung Kilat — all sounds are synthesized with WebAudio, so the game
// ships no audio files. A tiny synth: short blips for actions, a bell for a
// ready plate, and a looping sizzle while anything fries in the wok.

let ctx = null;
let muted = false;
let sizzleNodes = null;

export function setMuted(value) {
  muted = value;
  if (muted) stopSizzle();
}

export function isMuted() {
  return muted;
}

// Browsers only let audio start after a gesture; call this from input.
// The sizzle loop is started by the main loop while the wok holds food and
// stopped when it is empty or the shift ends, so it never hisses on menus.
export function unlockAudio() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (err) {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

function tone(freq, dur, type, volume, slideTo) {
  if (!ctx || muted) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + dur);
}

function noiseBurst(dur, volume, filterFreq) {
  if (!ctx || muted) return;
  const now = ctx.currentTime;
  const length = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(now);
}

export function playPick() {
  tone(520, 0.07, 'triangle', 0.18, 700);
}

export function playDrop() {
  noiseBurst(0.12, 0.25, 1800);
  tone(240, 0.09, 'sine', 0.2, 160);
}

export function playStir() {
  noiseBurst(0.09, 0.16, 2600);
}

export function playPlating() {
  tone(660, 0.08, 'triangle', 0.2);
  setTimeout(() => tone(880, 0.1, 'triangle', 0.2), 70);
}

export function playReadyBell() {
  tone(1175, 0.35, 'sine', 0.22);
  tone(1568, 0.5, 'sine', 0.14);
}

export function playServe() {
  tone(880, 0.1, 'triangle', 0.22);
  setTimeout(() => tone(1108, 0.12, 'triangle', 0.22), 90);
  setTimeout(() => tone(1318, 0.2, 'triangle', 0.22), 180);
}

export function playCoin() {
  tone(1320, 0.08, 'square', 0.08);
  setTimeout(() => tone(1760, 0.14, 'square', 0.08), 70);
}

export function playError() {
  tone(160, 0.16, 'sawtooth', 0.14, 110);
}

export function playWalkout() {
  tone(330, 0.18, 'sawtooth', 0.12, 220);
  setTimeout(() => tone(220, 0.22, 'sawtooth', 0.12, 165), 140);
}

export function playRush() {
  tone(440, 0.12, 'square', 0.12, 660);
  setTimeout(() => tone(660, 0.12, 'square', 0.12, 880), 120);
}

// A soft frying hiss while the wok holds food. Started and stopped by the
// main loop; cheap enough to leave running through a whole shift.
export function startSizzle() {
  if (!ctx || muted || sizzleNodes) return;
  const length = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 3200;
  const gain = ctx.createGain();
  gain.gain.value = 0.035;
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start();
  sizzleNodes = { src, gain };
}

export function stopSizzle() {
  if (!sizzleNodes) return;
  try { sizzleNodes.src.stop(); } catch (err) { /* already stopped */ }
  sizzleNodes = null;
}
