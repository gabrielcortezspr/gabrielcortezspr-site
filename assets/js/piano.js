// ════════════════════════════════════════════════════════════════
//  piano.js — piano sintetizado com Web Audio (sem samples).
//  parciais inarmônicas + envelope de martelo + filtro + reverb.
//  O som só liga após um gesto do usuário (política de autoplay).
// ════════════════════════════════════════════════════════════════

let ctx = null, out = null, wet = null, enabled = false;
const listeners = new Set();
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const noteName = (m) => NAMES[m % 12] + (Math.floor(m / 12) - 1);

function impulse(sec = 2.6) {
  const len = Math.floor(ctx.sampleRate * sec), buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8);
  }
  return buf;
}

function init() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18; comp.ratio.value = 3;
  out = ctx.createGain(); out.gain.value = 0.8;
  const rev = ctx.createConvolver(); rev.buffer = impulse();
  wet = ctx.createGain(); wet.gain.value = 0.32;
  out.connect(comp); wet.connect(rev); rev.connect(comp); comp.connect(ctx.destination);
}

export const piano = {
  get on() { return enabled; },
  enable() { init(); ctx.resume(); enabled = true; listeners.forEach((f) => f(true)); },
  disable() { enabled = false; stopSong(); listeners.forEach((f) => f(false)); },
  toggle() { enabled ? this.disable() : this.enable(); return enabled; },
  onChange(f) { listeners.add(f); },
  note, chord, arp, playSong, stopSong
};

export function note(m, vel = 0.5, dur = 2.4, when = 0) {
  if (!enabled || !ctx) return;
  const t = ctx.currentTime + when;
  const f = 440 * Math.pow(2, (m - 69) / 12);
  const g = ctx.createGain();
  const peak = vel * 0.28 * (m < 50 ? 1.2 : 1);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.006);
  g.gain.exponentialRampToValueAtTime(peak * 0.35, t + 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(Math.min(14000, f * (5 + vel * 12)), t);
  lp.frequency.exponentialRampToValueAtTime(Math.max(f * 1.6, 280), t + dur);
  lp.connect(g); g.connect(out); g.connect(wet);
  const amps = [1, 0.45, 0.22, 0.14, 0.08, 0.05, 0.03];
  amps.forEach((a, i) => {
    const n = i + 1;
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.frequency.value = f * n * Math.sqrt(1 + 0.00035 * n * n);
    if (n === 1) o.detune.value = 1.5;
    og.gain.value = a / (1 + i * 0.4);
    // parciais altos morrem mais rápido
    og.gain.setValueAtTime(og.gain.value, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + dur / (1 + i * 0.5));
    o.connect(og); og.connect(lp);
    o.start(t); o.stop(t + dur + 0.05);
  });
  // ruído curto do martelo
  const nb = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate);
  const nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nd.length);
  const ns = ctx.createBufferSource(), ng = ctx.createGain(), nf = ctx.createBiquadFilter();
  nf.type = 'bandpass'; nf.frequency.value = Math.min(6000, f * 4); ng.gain.value = vel * 0.05;
  ns.buffer = nb; ns.connect(nf); nf.connect(ng); ng.connect(out); ns.start(t);
}

export function chord(ms, vel = 0.4, dur = 3, when = 0) { ms.forEach((m) => note(m, vel, dur, when)); }
export function arp(ms, gap = 0.09, vel = 0.4, dur = 2.5) { ms.forEach((m, i) => note(m, vel, dur, i * gap)); }

// Gymnopédie nº 1 — Erik Satie (1888, domínio público). Primeira frase, arranjo simplificado.
// [compasso, tempo (0..2), midi, duração em tempos]
function satie() {
  const ev = [];
  const G = [43, [59, 62, 66]], D = [38, [57, 61, 66]];
  for (let bar = 0; bar < 13; bar++) {
    const [bass, ch] = bar % 2 ? D : G;
    ev.push([bar, 0, bass, 3, 0.45]);
    ch.forEach((m) => ev.push([bar, 1, m, 2, 0.22]));
  }
  const mel = [
    [4, 1, 78, 1], [4, 2, 81, 1],
    [5, 0, 79, 1], [5, 1, 78, 1], [5, 2, 73, 1],
    [6, 0, 71, 1], [6, 1, 73, 1], [6, 2, 74, 1],
    [7, 0, 69, 3],
    [8, 0, 66, 9]
  ];
  mel.forEach(([b, beat, m, d]) => ev.push([b, beat, m, d, 0.55]));
  ev.push([12, 0, 62, 6, 0.3], [12, 0, 66, 6, 0.3], [12, 0, 69, 6, 0.35]);
  return ev;
}

let timers = [];
export function stopSong() { timers.forEach(clearTimeout); timers = []; }
export function playSong(onNote, onEnd) {
  if (!enabled) piano.enable();
  stopSong();
  const beat = 0.82;
  let end = 0;
  for (const [bar, b, m, d, v] of satie()) {
    const at = (bar * 3 + b) * beat;
    end = Math.max(end, at + d * beat);
    note(m, v, Math.max(1.6, d * beat * 1.4), at);
    if (onNote) {
      timers.push(setTimeout(() => onNote(m, true), at * 1000));
      timers.push(setTimeout(() => onNote(m, false), (at + Math.min(d, 1.5) * beat) * 1000));
    }
  }
  timers.push(setTimeout(() => onEnd && onEnd(), end * 1000));
}

// escala usada pelos efeitos sonoros (sol maior, como a harmonia de Satie)
export const SCALE = [55, 59, 62, 66, 67, 69, 71, 74, 76, 78, 79, 81, 83, 86];
