import { profile, history, stack, projects, medals, currentLog } from './data.js';
import { mountModel } from './models.js';
import { piano, note, arp, playSong, stopSong, noteName, SCALE } from './piano.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let scene = null; // carregado de forma preguiçosa; o site funciona sem WebGL

// ── boot ──────────────────────────────────────────────────────
async function boot() {
  const log = $('#boot-log'), bar = $('.boot-bar i');
  const lines = [
    '<b>cortez-os</b> v26.11 · build 1-0',
    '[ ok ] mounting /dev/ink (suminagashi.glsl)',
    '[ ok ] loading engine · 64 squares · 32 pieces',
    '[ ok ] 13 project models · bayer dithering',
    '[ ok ] piano · 49 keys · 7 partials · reverb 2.6s',
    '[ ok ] 1. e4 e5  2. Nf3 Nc6  3. Bb5',
    '<b>ready.</b> good luck, have fun'
  ];
  const sceneP = import('./scene.js')
    .then((m) => { scene = m.createScene($('#gl')); scene.onMove = onMove; scene.onKey = (k) => pianoHit(k); })
    .catch((e) => { console.warn('WebGL indisponível', e); document.body.classList.add('no-gl'); });
  for (let i = 0; i < lines.length; i++) {
    log.innerHTML += lines[i] + '\n';
    bar.style.width = ((i + 1) / lines.length) * 100 + '%';
    await sleep(reduced ? 0 : 120 + Math.random() * 100);
    if (i === 2) await sceneP;
  }
  await sceneP;
  await sleep(reduced ? 0 : 250);
  $('#boot').classList.add('done');
}

// ── som ───────────────────────────────────────────────────────
// cada lance jogado no tabuleiro toca uma nota
function onMove(ply) {
  note(SCALE[(ply + 3) % SCALE.length], 0.4, 2.4);
}

function soundUI() {
  const b = $('#sound-btn');
  const sync = (on) => { b.setAttribute('aria-pressed', on); $('em', b).textContent = on ? 'on' : 'off'; };
  b.addEventListener('click', () => { const on = piano.toggle(); if (on) arp([55, 62, 67, 71, 74], 0.08, 0.35); });
  piano.onChange(sync);
  // gota de tinta no fundo = nota grave
  addEventListener('pointerdown', (e) => {
    if (e.target.closest('a,button,input,.card,.medal,.tile,.term,.modal,.medal-stage') || inPiano) return;
    note([43, 50, 55, 59, 62][Math.floor(Math.random() * 5)], 0.3, 3);
  });
}

// ── digitação ─────────────────────────────────────────────────
async function typeInto(el, text, speed = 45) {
  el.textContent = '';
  for (const ch of text) { el.textContent += ch; if (!reduced) await sleep(speed + Math.random() * 30); }
}

async function hero() {
  await typeInto($('#type-name'), profile.name.toUpperCase(), 70);
  await typeInto($('#role'), profile.role, 18);
  const pgn = $('#pgn');
  const moves = profile.opening.split(/\s+/);
  pgn.innerHTML = moves.map((m) => `<span class="mv">${esc(m)}</span>`).join(' ');
  for (const s of $$('.mv', pgn)) { s.classList.add('lit'); await sleep(reduced ? 0 : 220); }
}

function setupCommands() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(async (e) => {
      if (!e.isIntersecting || e.target.dataset.done) return;
      e.target.dataset.done = 1;
      const span = document.createElement('span');
      const caret = document.createElement('i'); caret.className = 'caret';
      e.target.append(span, caret);
      await typeInto(span, e.target.dataset.cmd, 35);
      setTimeout(() => caret.remove(), 1600);
    });
  }, { threshold: .6 });
  $$('.cmd').forEach((h) => io.observe(h));
}

// ── whoami / neofetch ─────────────────────────────────────────
function about() {
  const kw = Math.max(...profile.fetch.map(([k]) => k.length));
  $('#fetch-info').innerHTML =
    `<b>gabriel</b><span class="dim">@</span><b>cortez</b>\n<span class="dim">${'─'.repeat(22)}</span>\n` +
    profile.fetch.map(([k, v]) => `<i class="a">${k.padEnd(kw)}</i>  ${esc(v)}`).join('\n');
  $('#whoami-text').innerHTML = profile.whoami.map((p) => `<p>${p}</p>`).join('');
  const ex = $('#expertise');
  ex.innerHTML = profile.expertise.map((x) => `<span>[<b>x</b>] ${esc(x)}</span>`).join('');
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    $$('span', ex).forEach((s, i) => setTimeout(() => s.classList.add('on'), i * 120));
  }, { threshold: .4 });
  io.observe(ex);
}

// ── história ──
function timeline() {
  const ol = $('#timeline');
  ol.innerHTML = history.map((h, i) => `
    <li data-i="${i}">
      <div class="when"><b>${esc(h.year)}</b><span>${String(i + 1).padStart(2, '0')}/${history.length}</span></div>
      <div class="what">
        <h3>${esc(h.title)}</h3>
        <p class="place">${esc(h.place)}</p>
        <p class="body">${esc(h.text)}</p>
      </div>
    </li>`).join('');
  const items = $$('li', ol);
  let active = -1;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const i = +e.target.dataset.i;
      if (i === active) return;
      active = i;
      items.forEach((li, j) => { li.classList.toggle('active', j === i); li.classList.toggle('past', j < i); });
      scene?.setPly((i + 1) * 2);
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  items.forEach((li) => io.observe(li));
}

// ── stack: o que eu faço com cada grupo de tecnologia ─────────
function stackBoard() {
  const b = $('#stack-board');
  b.innerHTML = stack.map((g, i) => `
    <article class="kit" style="--d:${i * 90}ms">
      <header><span class="file">${'abcde'[i]}</span><h3>${esc(g.title)}</h3></header>
      <p class="kit-what">${esc(g.what)}</p>
      <ul class="kit-items">${g.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul>
      <p class="kit-where"><span class="dim">usado em</span> ${esc(g.where)}</p>
    </article>`).join('');
  const kits = $$('.kit', b);
  kits.forEach((k, i) => k.addEventListener('pointerenter', () => note(SCALE[(i * 2 + 4) % SCALE.length], 0.22, 1.6)));
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    kits.forEach((k) => k.classList.add('in'));
  }, { threshold: .15 });
  io.observe(b);
  const n = stack.reduce((a, g) => a + g.items.length, 0);
  $('#stack-note').textContent = `${n} ferramentas · ${stack.length} frentes · todas usadas em projeto real`;
}

// ── cartas de projeto ─────────────────────────────────────────
const RARITY = { common: 'COMUM', uncommon: 'INCOMUM', rare: 'RARA', legendary: 'LENDÁRIA' };
const RCOLOR = { common: '#5c5c5c', uncommon: '#9a9a9a', rare: '#e0443a', legendary: '#f2f2f2' };
const cardModels = [];

function cards() {
  const hand = $('#hand');
  hand.innerHTML = projects.map((p, i) => `
    <div class="card ${p.rarity}" tabindex="0" role="button" data-id="${p.id}" data-rarity="${p.rarity}"
         aria-label="${esc(p.name)} — ${RARITY[p.rarity]}" style="--deal:${i * 80}ms; --sway:${-i * .7}s">
      <div class="inner">
        <div class="face">
          <div class="rar"><span>${RARITY[p.rarity]}</span><span>#${String(i + 1).padStart(2, '0')}</span></div>
          <div class="art"><canvas data-model="${p.model}" aria-hidden="true"></canvas></div>
          <h3>${esc(p.name)}</h3>
          <p class="tl">${esc(p.tagline)}</p>
          <div class="chips">${p.tags.slice(0, 3).map((t) => `<span>${esc(t)}</span>`).join('')}</div>
          <div class="foil"></div><div class="scan"></div>
        </div>
        <div class="back"></div>
      </div>
    </div>`).join('');

  const all = $$('.card', hand);
  $$('.art canvas', hand).forEach((cv) => cardModels.push(mountModel(cv, cv.dataset.model, { pixel: 1.6, hoverEl: cv.closest('.card') })));

  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    all.forEach((c) => c.classList.add('dealt'));
    // som de cartas sendo distribuídas
    all.forEach((c, i) => setTimeout(() => note(SCALE[8 + (i % 6)], 0.12, 0.8), i * 80));
  }, { threshold: .15 });
  io.observe(hand);

  all.forEach((c, i) => {
    const inner = $('.inner', c);
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--ry', `${(x - .5) * 28}deg`);
      c.style.setProperty('--rx', `${(.5 - y) * 22}deg`);
      c.style.setProperty('--mx', `${x * 100}%`);
      c.style.setProperty('--my', `${y * 100}%`);
      inner.style.transition = 'transform .08s';
    });
    c.addEventListener('pointerenter', () => note(SCALE[6 + (i % 7)], 0.22, 1.6));
    c.addEventListener('pointerleave', () => {
      c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg');
      inner.style.transition = '';
    });
    const open = () => openProject(c.dataset.id);
    c.addEventListener('click', open);
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });

  const f = $('#filters');
  const opts = [['all', 'TODAS'], ...Object.entries(RARITY)];
  f.innerHTML = opts.map(([k, v]) => `<button role="tab" data-f="${k}" aria-selected="${k === 'all'}">${v}</button>`).join('');
  f.addEventListener('click', (e) => {
    const btn = e.target.closest('button'); if (!btn) return;
    $$('button', f).forEach((b) => b.setAttribute('aria-selected', b === btn));
    let k = 0;
    all.forEach((c) => {
      const show = btn.dataset.f === 'all' || c.dataset.rarity === btn.dataset.f;
      c.classList.toggle('hide', !show);
      if (show) { c.classList.remove('dealt'); void c.offsetWidth; c.style.setProperty('--deal', `${k++ * 80}ms`); c.classList.add('dealt'); }
    });
    requestAnimationFrame(() => cardModels.forEach((a) => a && a.refit()));
  });
}

let modalModel = null;
function openProject(id) {
  const p = projects.find((x) => x.id === id); if (!p) return;
  const m = $('#modal'), card = $('#modal-card');
  card.style.setProperty('--c', RCOLOR[p.rarity]);
  card.innerHTML = `
    <button class="close" aria-label="Fechar">×</button>
    <div class="top-row"><div><div class="rar">${RARITY[p.rarity]}</div><h3 id="modal-title">${esc(p.name)}</h3><small class="dim">${esc(p.tagline)}</small></div></div>
    <canvas class="model-big" aria-hidden="true"></canvas>
    <p>${esc(p.text)}</p>
    ${p.facts ? `<ul class="facts">${p.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
    <div class="chips">${p.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
    ${p.url ? `<a class="btn pix" href="${p.url}" target="_blank" rel="noopener">abrir no github <span>→</span></a>` : '<span class="dim">repositório privado · peça uma demo</span>'}`;
  m.hidden = false;
  modalModel?.destroy();
  const big = $('.model-big', card);
  modalModel = mountModel(big, p.model, { pixel: 2, spin: .3, hoverEl: big });
  $('.close', card).focus();
  arp([55, 59, 62, 66, 71], 0.07, 0.3, 2.2);
  if (scene) scene.drop((Math.random() - .5) * .6, (Math.random() - .5) * .6);
}
function closeModal() { $('#modal').hidden = true; modalModel?.destroy(); modalModel = null; }

// ── medalhas ──────────────────────────────────────────────────
const TIER = { gold: 'ouro', silver: 'prata', bronze: 'bronze', honor: 'honra', trophy: 'troféu', seal: 'evento' };
function medalRow() {
  const row = $('#medal-row');
  // vitrine: medalhas penduradas, agrupadas por ano
  const years = [...new Set(medals.map((m) => m.year))].sort((a, b) => b - a);
  let k = 0;
  row.innerHTML = years.map((y) => `
    <div class="year" data-year="${y}">
      <h4 class="y">${y}</h4>
      <div class="hang">
        ${medals.map((m, i) => ({ m, i })).filter(({ m }) => m.year === y).map(({ m, i }) => `
          <button class="medal ${m.tier}" data-i="${i}" data-cat="${m.cat}" style="--d:${(k++) * 80}ms; --sw:${(i % 3) * .4}s" aria-label="${esc(m.title)}: ${esc(m.sub)}">
            <span class="ribbon"></span>
            ${m.tier === 'trophy' ? `<span class="obj">${pixelSvg(TROPHY)}</span>` : m.tier === 'seal' ? `<span class="obj">${pixelSvg(SCROLL)}</span>` : `<span class="coin"><span class="side">${esc(m.glyph)}</span></span>`}
            <span class="lbl"><b>${esc(m.title)}</b><small>${esc(m.sub)}</small></span>
          </button>`).join('')}
      </div>
    </div>`).join('');

  const counts = {};
  medals.forEach((m) => { counts[m.tier] = (counts[m.tier] || 0) + 1; });
  const LBL = { trophy: 'troféu', gold: 'ouro', silver: 'prata', bronze: 'bronze', honor: 'honra', seal: 'certificados' };
  $('#tally').innerHTML = Object.keys(LBL).filter((k) => counts[k]).map((k) => `<span class="t t-${k}"><b>${counts[k]}</b> ${LBL[k]}</span>`).join('');

  const filt = $('#medal-filters');
  const cats = [['all', 'TODAS'], ['intl', 'INTERNACIONAIS'], ['nac', 'NACIONAIS'], ['evt', 'COMPETIÇÕES'], ['talk', 'APRESENTAÇÕES']];
  filt.innerHTML = cats.map(([k, v]) => `<button role="tab" data-f="${k}" aria-selected="${k === 'all'}">${v}</button>`).join('');
  filt.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', filt).forEach((x) => x.setAttribute('aria-selected', x === b));
    $$('.medal', row).forEach((m) => m.hidden = !(b.dataset.f === 'all' || m.dataset.cat === b.dataset.f));
    $$('.year', row).forEach((y) => y.hidden = !$$('.medal', y).some((m) => !m.hidden));
  });

  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    $$('.medal', row).forEach((el, i) => {
      el.classList.add('in');
      setTimeout(() => note(SCALE[4 + (i % 10)], 0.16, 1.2), i * 80 + 300);
    });
  }, { threshold: .15 });
  io.observe(row);
  $$('.medal', row).forEach((el) => {
    el.addEventListener('pointerenter', () => note(SCALE[9 + (+el.dataset.i % 4)], 0.14, 1.4));
    el.addEventListener('click', () => openMedal(medals[+el.dataset.i]));
  });
}

// medalha 3D com física (carregada só quando alguém clica)
let medalStage = null, medalStageP = null;
const TIER_PT = { trophy: 'troféu · campeão', gold: 'medalha de ouro', silver: 'medalha de prata', bronze: 'medalha de bronze', honor: 'honra ao mérito', seal: 'certificado' };
const HINT = {
  stand: 'arraste para girar o troféu no expositor · puxe para cima/baixo para inclinar',
  scroll: 'arraste para girar e balançar o pergaminho pelos cordões',
  medal: 'arraste para girar e balançar · ela fica pendurada pela fita'
};
// ícones em pixel art para a vitrine (troféu e pergaminho)
const TROPHY = [
  '############',
  '##.######.##',
  '#..##r###..#',
  '#..#rrr##..#',
  '##.##r###.##',
  '...######...',
  '....####....',
  '.....##.....',
  '.....##.....',
  '....++++....',
  '...######...',
  '...######...'
];
const SCROLL = [
  'oooooooooooo',
  '.pppppppppp.',
  '.pllllllllp.',
  '.pppppppppp.',
  '.plllllpppp.',
  '.pppppppppp.',
  '.pllllllllp.',
  '.pppppppppp.',
  '.pppppprrpp.',
  '.ppppprrrrp.',
  '.pppppprrpp.',
  'oooooooooooo'
];
function pixelSvg(grid) {
  const C = { '#': 'var(--m)', '+': '#6c6c6c', r: '#e0443a', o: '#2a2a2a', p: '#e8e4da', l: '#9a9a9a' };
  let r = '';
  grid.forEach((row, y) => [...row].forEach((ch, x) => { if (C[ch]) r += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${C[ch]}"/>`; }));
  return `<svg viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
}
async function openMedal(m) {
  const st = $('#medal-stage');
  $('#ms-tier').textContent = TIER_PT[m.tier] || '';
  $('#ms-title').textContent = m.title;
  $('#ms-sub').textContent = `${m.sub} · ${m.year}`;
  $('#ms-desc').textContent = m.desc || '';
  st.hidden = false;
  document.body.style.overflow = 'hidden';
  if (!medalStageP) {
    medalStageP = import('./medal3d.js').then((mod) => {
      medalStage = mod.createMedalStage($('#medal-canvas'), {
        onChime: (v) => note([86, 90, 93, 98][Math.floor(Math.random() * 4)], 0.12 + v * 0.4, 1.8)
      });
      $('#ms-drop').addEventListener('click', () => medalStage.spin());
      $('#ms-close').addEventListener('click', closeMedal);
    });
  }
  await medalStageP;
  medalStage.pause(false);
  const kind = medalStage.setMedal(m);
  $('.ms-hint').textContent = HINT[kind] || HINT.medal;
  $('#ms-drop').textContent = kind === 'stand' ? '↻ girar troféu' : '↻ girar';
  $('#ms-close').focus();
}
function closeMedal() {
  const st = $('#medal-stage');
  if (st.hidden) return;
  st.hidden = true;
  document.body.style.overflow = '';
  medalStage?.pause(true);
}

// ── tail -f ───────────────────────────────────────────────────
function tailLog() {
  const out = $('#log-out');
  let i = 0, timer = null;
  const ts = () => new Date().toTimeString().slice(0, 8);
  const push = () => {
    const [k, v] = currentLog[i++ % currentLog.length];
    out.innerHTML += `<span class="t">${ts()}</span> <span class="k">[${esc(k)}]</span>${' '.repeat(Math.max(1, 11 - k.length))}<span class="v">${esc(v)}</span>\n`;
    const lines = out.innerHTML.split('\n');
    if (lines.length > 14) out.innerHTML = lines.slice(-14).join('\n');
  };
  const io = new IntersectionObserver(([e]) => {
    clearInterval(timer);
    if (e.isIntersecting) { if (!i) for (let j = 0; j < 4; j++) push(); timer = setInterval(push, 1400); }
  });
  io.observe(out);
}

// ── piano (o teclado é 3D, no fundo) ──────────────────────────
let inPiano = false;
const recent = [];
function renderTracker() {
  const t = $('#tracker'); if (!t) return;
  t.innerHTML = `<span class="dim">♩ = 70 · lent et douloureux · G△7 ⇄ D△7</span>\n<b>▸</b> ${
    recent.slice(-8).map((n, i, a) => i === a.length - 1 ? `<i class="a">${n}</i>` : n).join(' <span class="dim">─</span> ') || '<span class="dim">clique nas teclas do piano…</span>'}`;
}
function pianoLight(m, on) {
  scene?.press(m, on);
  if (on && m >= 55) { recent.push(noteName(m)); if (recent.length > 30) recent.shift(); renderTracker(); }
}
function pianoHit(m) {
  if (!piano.on) piano.enable();
  note(m, 0.6, 3);
  pianoLight(m, true);
  setTimeout(() => pianoLight(m, false), 240);
}
function pianoSection() {
  renderTracker();
  const KB = 'awsedftgyhujkolp;'; // C4..E5
  new IntersectionObserver(([e]) => { inPiano = e.isIntersecting; }, { rootMargin: '-40% 0px -40% 0px' }).observe($('#piano'));
  addEventListener('keydown', (e) => {
    if (!inPiano || e.repeat || e.ctrlKey || e.metaKey || e.target.closest('input')) return;
    const i = KB.indexOf(e.key.toLowerCase());
    if (i >= 0) pianoHit(60 + i);
  });
  const btn = $('#play-satie');
  const play = () => { btn.classList.add('playing'); playSong(pianoLight, () => btn.classList.remove('playing')); };
  btn.addEventListener('click', play);
  $('#stop-satie').addEventListener('click', () => { stopSong(); for (let m = 36; m <= 84; m++) scene?.press(m, false); btn.classList.remove('playing'); });
  return { play };
}

// ── contato ───────────────────────────────────────────────────
function contact() {
  const L = profile.links;
  $('#links').innerHTML = `
    <a href="${L.linkedin}" target="_blank" rel="noopener">linkedin</a>
    <a href="mailto:${L.email}">email</a>
    <a href="${L.github}" target="_blank" rel="noopener">github</a>`;
  $('#quote').innerHTML = `“${esc(profile.quote.text)}”<cite>— ${esc(profile.quote.author)}</cite>`;
  $('#year').textContent = new Date().getFullYear();

  // tabuleiro final em ASCII: o cavalo de f3 deu mate em f4
  const rows = ['r.bq#bnr', 'pppp.ppp', '..n.....', '.B..p...', '....PN..', '........', 'PPPP.PPP', 'RNBQK..R'];
  $('#final-board').innerHTML =
    '  ┌─────────────────┐\n' +
    rows.map((r, i) => `${8 - i} │ ${[...r].map((c) => c === '#' ? '<i class="a">#</i>' : c === 'N' && i === 4 ? '<b>N</b>' : c === '.' ? '<span class="dim">·</span>' : c).join(' ')} │`).join('\n') +
    '\n  └─────────────────┘\n    a b c d e f g h\n   <span class="dim">10. Nf4#  1-0</span>';

  const out = $('#ping-out');
  const io = new IntersectionObserver(async ([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    out.innerHTML = `PING <b>gabriel</b> (${esc(profile.location)}): 56 data bytes\n`;
    for (let s = 0; s < 4; s++) {
      await sleep(reduced ? 0 : 500);
      note(SCALE[5 + s * 2], 0.25, 1.5);
      out.innerHTML += `64 bytes from gabriel: icmp_seq=${s} ttl=64 time=${(Math.random() * 12 + 3).toFixed(1)} ms\n`;
    }
    out.innerHTML += `--- 4 packets transmitted, 4 received, <b>0% packet loss</b> · disponível para conversar`;
  }, { threshold: .5 });
  io.observe(out);

  // 1-0: acorde final
  const io2 = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io2.disconnect();
    arp([43, 55, 62, 67, 71, 74, 79], 0.11, 0.35, 4);
  }, { threshold: .8 });
  io2.observe($('.result'));
}

// ── seção ativa ───────────────────────────────────────────────
function sections() {
  const secs = $$('section[data-scene]');
  const rail = $('#rail');
  rail.innerHTML = secs.map((s) => `<a href="#${s.id}" title="${s.id}"></a>`).join('');
  const navs = $$('.moves a');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      if (scene) scene.setSection(e.target.dataset.scene);
      navs.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
      $$('a', rail).forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
    });
  }, { rootMargin: '-50% 0px -50% 0px' });
  secs.forEach((s) => io.observe(s));

  const bar = $('#clock-bar');
  const top = $('.top');
  const onScroll = () => {
    top.classList.toggle('scrolled', scrollY > 40);
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (scrollY / Math.max(1, max)) * 100 + '%';
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ── terminal ──────────────────────────────────────────────────
function terminal(pianoApi) {
  const term = $('#term'), out = $('#term-out'), input = $('#term-input');
  const hist = []; let hi = 0;
  const print = (s, cls = '') => { out.innerHTML += (cls ? `<span class="${cls}">${s}</span>` : s) + '\n'; out.scrollTop = out.scrollHeight; };
  const go = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };

  const cmds = {
    help: () => print([
      'comandos:',
      '  whoami | neofetch   quem sou eu',
      '  ls projects         lista as cartas',
      '  open <projeto>      abre um projeto (ex: open busflow)',
      '  medals              placar de medalhas',
      '  piano | satie       toca gymnopédie nº1',
      '  sound               liga/desliga o som',
      '  pixel <1-12>        tamanho do pixel do tabuleiro',
      '  ink · play · stop   tinta / partida automática',
      '  history | stack | contact   vai até a seção',
      '  clear · exit'
    ].join('\n')),
    whoami: () => print(`${esc(profile.name)} — ${esc(profile.role)}\n${profile.whoami[0].replace(/<[^>]+>/g, '')}`),
    neofetch: () => print(profile.fetch.map(([k, v]) => `${k.padEnd(7)} ${esc(v)}`).join('\n')),
    ls: () => print(projects.map((p) => `${p.rarity.padEnd(10)} ${p.id.padEnd(12)} ${esc(p.tagline)}`).join('\n')),
    open: (a) => { const p = projects.find((x) => x.id === a || x.name.toLowerCase() === (a || '').toLowerCase()); if (p) { openProject(p.id); print(`abrindo ${p.name}…`); } else print(`projeto não encontrado: ${esc(a || '')} (tente "ls")`, 'e'); },
    medals: () => { print(medals.map((m) => `${String(m.year)}  ${TIER[m.tier].padEnd(7)} ${esc(m.title)}`).join('\n')); go('medals'); },
    history: () => go('history'), stack: () => go('stack'), projects: () => go('projects'), contact: () => go('contact'), ping: () => go('contact'), about: () => go('about'),
    piano: () => { go('piano'); setTimeout(() => pianoApi.play(), 700); print('♪ Erik Satie · Gymnopédie nº1 (1888)'); },
    satie: () => cmds.piano(),
    sound: () => print(`som ${piano.toggle() ? 'ligado ♪' : 'desligado'}`),
    ascii: (a) => { if (!scene) return print('webgl indisponível', 'e'); const v = a === 'off' ? null : 1; scene.setAscii(v); print(`ascii = ${v ? 'on' : 'off'} (easter egg)`); },
    pixel: (a) => { if (!scene) return print('webgl indisponível', 'e'); print(`pixel = ${scene.setPixel(+a || 4)}`); },
    ink: () => { if (scene) for (let i = 0; i < 4; i++) setTimeout(() => { scene.drop((Math.random() - .5) * 1.6, (Math.random() - .5) * 1.4); note(SCALE[i * 2], 0.3, 2.5); }, i * 180); print('墨 ~ ~ ~'); },
    play: () => { scene?.tour(true); go('history'); print('partida automática ♞ (stop para parar)'); },
    stop: () => { scene?.tour(false); stopSong(); print('ok.'); },
    sudo: (a, all) => print(/hire/.test(all) ? 'permissão concedida ✓  →  ' + esc(profile.links.email) : 'gabriel is not in the sudoers file. this incident will be reported.', /hire/.test(all) ? 'c' : 'e'),
    clear: () => { out.innerHTML = ''; },
    exit: () => toggle(false),
    e4: () => print('e5. boa abertura.'),
    resign: () => { go('contact'); print('1-0'); }
  };

  function run(line) {
    const raw = line.trim(); if (!raw) return;
    print(`<span class="c">$ ${esc(raw)}</span>`);
    const [c, ...rest] = raw.split(/\s+/);
    const fn = cmds[c.toLowerCase()];
    if (fn) fn(c === 'ls' ? undefined : rest[0], raw);
    else print(`comando não encontrado: ${esc(c)} (digite "help")`, 'e');
  }

  function toggle(on = term.hidden) {
    term.hidden = !on;
    if (on) { if (!out.innerHTML) print('cortez-os · digite <span class="c">help</span>'); input.focus(); }
  }
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { hist.push(input.value); hi = hist.length; run(input.value); input.value = ''; }
    else if (e.key === 'ArrowUp') { hi = Math.max(0, hi - 1); input.value = hist[hi] || ''; e.preventDefault(); }
    else if (e.key === 'ArrowDown') { hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ''; }
    else if (e.key === 'Escape') toggle(false);
    e.stopPropagation();
  });
  $('#open-term').addEventListener('click', () => toggle());
  $('#close-term').addEventListener('click', () => toggle(false));

  const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let kpos = 0;
  addEventListener('keydown', (e) => {
    if (e.key === '`' || e.key === '~') { e.preventDefault(); toggle(); return; }
    if (e.key === 'Escape') { closeModal(); closeMedal(); }
    kpos = e.key === konami[kpos] ? kpos + 1 : 0;
    if (kpos === konami.length) { kpos = 0; scene?.tour(true); toggle(true); print('♞ knight\'s tour desbloqueado!', 'c'); }
  });
}

function modal() {
  const m = $('#modal');
  m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('.close')) closeModal(); });
}


// ── init ──────────────────────────────────────────────────────
about(); timeline(); stackBoard(); cards(); medalRow(); tailLog(); contact(); modal(); soundUI(); setupCommands();
const pianoApi = pianoSection();
terminal(pianoApi);
boot().then(() => { sections(); hero(); });
