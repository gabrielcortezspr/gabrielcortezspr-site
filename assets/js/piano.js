// ════════════════════════════════════════════════════════════════
//  piano.js — piano sintetizado com Web Audio (sem samples).
//  duas cordas por parcial, decaimento em dois estágios, abafador, sala.
//  O som só liga após um gesto do usuário (política de autoplay).
// ════════════════════════════════════════════════════════════════
let ctx = null, out = null, wet = null, enabled = false;
const listeners = new Set();
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const noteName = (m) => NAMES[m % 12] + (Math.floor(m / 12) - 1);

// sala: ruído filtrado (agudos morrem antes dos graves), com pré-delay curto
function impulse(sec = 2.4) {
  const sr = ctx.sampleRate, len = Math.floor(sr * sec), pre = Math.floor(sr * 0.012);
  const buf = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = pre; i < len; i++) {
      const k = (i - pre) / (len - pre);
      const a = 0.25 + 0.7 * k;               // filtro de um polo cada vez mais fechado
      lp += (1 - a) * ((Math.random() * 2 - 1) - lp);
      d[i] = lp * Math.pow(1 - k, 2.2) * 1.8;
    }
  }
  return buf;
}

function init() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 2.5; comp.attack.value = 0.01; comp.release.value = 0.25;
  const tone = ctx.createBiquadFilter(); // tira o "brilho de sintetizador"
  tone.type = 'highshelf'; tone.frequency.value = 3500; tone.gain.value = -6;
  out = ctx.createGain(); out.gain.value = 0.9;
  const rev = ctx.createConvolver(); rev.buffer = impulse();
  wet = ctx.createGain(); wet.gain.value = 0.22;
  out.connect(tone); wet.connect(rev); rev.connect(tone); tone.connect(comp); comp.connect(ctx.destination);
}

export const piano = {
  get on() { return enabled; },
  enable() { init(); ctx.resume(); enabled = true; listeners.forEach((f) => f(true)); },
  disable() { enabled = false; stopSong(); listeners.forEach((f) => f(false)); },
  toggle() { enabled ? this.disable() : this.enable(); return enabled; },
  onChange(f) { listeners.add(f); },
  note, uiNote, chord, arp, playSong, stopSong
};

// Uma nota de piano: duas "cordas" levemente desafinadas por parcial (batimento),
// decaimento em dois estágios (ataque que cai rápido + sustentação longa),
// parciais agudos morrendo antes, e abafador (damper) ao soltar.
export function note(m, vel = 0.5, hold = 2.4, when = 0) {
  if (!enabled || !ctx) return null;
  const t = ctx.currentTime + Math.max(0, when);
  const f = 440 * Math.pow(2, (m - 69) / 12);
  // graves soam mais tempo que agudos
  const tau = Math.max(0.7, 4.2 - (m - 36) * 0.07);
  const peak = vel * 0.22;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.007);
  g.gain.setTargetAtTime(peak * 0.42, t + 0.007, 0.11);    // "prompt sound"
  g.gain.setTargetAtTime(0, t + 0.35, tau);                // "aftersound"
  g.gain.setTargetAtTime(0, t + hold, 0.11);               // abafador ao soltar
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.Q.value = 0.3;
  lp.frequency.setValueAtTime(Math.min(12000, f * (4 + vel * 10)), t);
  lp.frequency.setTargetAtTime(Math.max(f * 2.2, 500), t + 0.02, tau * 0.6);
  lp.connect(g); g.connect(out); g.connect(wet);
  const amps = [1, 0.5, 0.28, 0.16, 0.1, 0.06, 0.035, 0.02];
  const oscs = [];
  const end = t + hold + 0.8;
  amps.forEach((a, i) => {
    const n = i + 1, fn = f * n * Math.sqrt(1 + 0.0004 * n * n);
    if (fn > 16000) return;
    const og = ctx.createGain();
    og.gain.setValueAtTime(a / (1 + i * 0.25), t);
    og.gain.setTargetAtTime(0, t + 0.01, tau / (1 + i * 0.7));
    og.connect(lp);
    const strings = i < 3 ? [-1.1, 1.1] : [0];             // cordas duplas nos parciais principais
    strings.forEach((cents) => {
      const o = ctx.createOscillator();
      o.frequency.value = fn; o.detune.value = cents;
      const s = ctx.createGain(); s.gain.value = 1 / strings.length;
      o.connect(s); s.connect(og);
      o.start(t); o.stop(end);
      oscs.push(o);
    });
  });
  // batida do martelo: ruído curto e abafado
  const nb = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.02), ctx.sampleRate);
  const nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / nd.length, 3);
  const ns = ctx.createBufferSource(), ng = ctx.createGain(), nf = ctx.createBiquadFilter();
  nf.type = 'lowpass'; nf.frequency.value = Math.min(3000, f * 3); ng.gain.value = vel * 0.015;
  ns.buffer = nb; ns.connect(nf); nf.connect(ng); ng.connect(out); ns.start(t);
  oscs.push(ns);
  return { g, oscs };
}

// sons da interface: mais baixos e sem empilhar (no máximo um a cada 90 ms)
let lastUi = 0;
export function uiNote(m, vel = 0.3, hold = 1.6, when = 0) {
  if (!enabled || !ctx) return null;
  const now = performance.now();
  if (when === 0 && now - lastUi < 90) return null;
  if (when === 0) lastUi = now;
  return note(m, vel * 0.6, hold, when);
}

export function chord(ms, vel = 0.4, dur = 3, when = 0) { ms.forEach((m) => note(m, vel, dur, when)); }
export function arp(ms, gap = 0.09, vel = 0.4, dur = 2.5) { ms.forEach((m, i) => note(m, vel * 0.7, dur, i * gap)); }

// Gymnopédie nº 1 — Erik Satie (1888, domínio público). Primeira frase, arranjo simplificado.
// [compasso, tempo (0..2), midi, duração em tempos, intensidade]
function satie() {
  const ev = [];
  const G = [43, [59, 62, 66]], D = [38, [57, 61, 66]];
  for (let bar = 0; bar < 13; bar++) {
    const [bass, ch] = bar % 2 ? D : G;
    ev.push([bar, 0, bass, 3, 0.42]);
    ch.forEach((m) => ev.push([bar, 1, m, 2, 0.2]));
  }
  const mel = [
    [4, 1, 78, 1], [4, 2, 81, 1],
    [5, 0, 79, 1], [5, 1, 78, 1], [5, 2, 73, 1],
    [6, 0, 71, 1], [6, 1, 73, 1], [6, 2, 74, 1],
    [7, 0, 69, 3],
    [8, 0, 66, 12]
  ];
  mel.forEach(([b, beat, m, d]) => ev.push([b, beat, m, d, 0.5]));
  ev.push([12, 0, 62, 6, 0.26], [12, 0, 66, 6, 0.26], [12, 0, 69, 6, 0.3]);
  return ev;
}

let timers = [], voices = [];
export function stopSong() {
  timers.forEach(clearTimeout); timers = [];
  if (ctx) {
    const now = ctx.currentTime;
    voices.forEach((v) => {
      if (!v) return;
      v.g.gain.cancelScheduledValues(now);
      v.g.gain.setTargetAtTime(0, now, 0.06);
      v.oscs.forEach((o) => { try { o.stop(now + 0.4); } catch {} });
    });
  }
  voices = [];
}
export function playSong(onNote, onEnd) {
  if (!enabled) piano.enable();
  stopSong();
  const beat = 0.86;
  let end = 0;
  for (const [bar, b, m, d, v] of satie()) {
    const at = (bar * 3 + b) * beat;
    // pedal: tudo do compasso soa até a troca de pedal no compasso seguinte
    const toBarEnd = 3 - b;
    const hold = Math.max(d, toBarEnd) * beat + 0.06;
    end = Math.max(end, at + hold);
    voices.push(note(m, v, hold, at + 0.05));
    if (onNote) {
      timers.push(setTimeout(() => onNote(m, true), (at + 0.05) * 1000));
      timers.push(setTimeout(() => onNote(m, false), (at + 0.05 + Math.min(d, 1.5) * beat) * 1000));
    }
  }
  timers.push(setTimeout(() => { voices = []; onEnd && onEnd(); }, (end + 1) * 1000));
}

// escala usada pelos efeitos sonoros (sol maior, como a harmonia de Satie)
export const SCALE = [55, 59, 62, 66, 67, 69, 71, 74, 76, 78, 79, 81, 83, 86];
