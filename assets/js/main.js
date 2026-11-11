import { profile, history, stack, projects, medals, currentLog } from './data.js';
import { pixelIcon } from './pixelart.js';
import { mountAscii, KNIGHT_ART } from './ascii.js';
import { piano, note, arp, playSong, stopSong, noteName, SCALE } from './piano.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let scene = null; // carregado de forma preguiçosa; o site funciona sem WebGL

// ── boot ──────────────────────────────────────────────────────
async function boot() {
  $('#boot-art').textContent = KNIGHT_ART;
  const log = $('#boot-log'), bar = $('.boot-bar i');
  const lines = [
    '<b>cortez-os</b> v26.11 · build 1-0',
    '[ ok ] mounting /dev/ink (suminagashi.glsl)',
    '[ ok ] loading engine · 64 squares · 32 pieces',
    '[ ok ] ascii renderer · raymarching 3 sdf models',
    '[ ok ] piano · 7 partials · reverb 2.6s',
    '[ ok ] 1. e4 e5  2. Nf3 Nc6  3. Bb5',
    '<b>ready.</b> good luck, have fun'
  ];
  const sceneP = import('./scene.js')
    .then((m) => { scene = m.createScene($('#gl')); scene.onHop = onHop; })
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
function onHop(square) {
  const i = history.findIndex((h) => h.square === square);
  if (i >= 0) note(SCALE[(i + 2) % SCALE.length], 0.45, 2.6);
}

function soundUI() {
  const b = $('#sound-btn');
  const sync = (on) => { b.setAttribute('aria-pressed', on); $('em', b).textContent = on ? 'on' : 'off'; };
  b.addEventListener('click', () => { const on = piano.toggle(); if (on) arp([55, 62, 67, 71, 74], 0.08, 0.35); });
  piano.onChange(sync);
  const a = $('#ascii-btn');
  a.addEventListener('click', () => {
    if (!scene) return;
    const v = scene.ascii === null ? 1 : scene.ascii === 1 ? 0 : null;
    scene.setAscii(v);
    a.setAttribute('aria-pressed', v === 1);
    a.textContent = v === null ? 'A' : v === 1 ? 'A✓' : 'A✗';
    a.title = v === null ? 'Modo ASCII: automático por seção' : v === 1 ? 'Modo ASCII: sempre' : 'Modo ASCII: nunca';
  });
  // gota de tinta no fundo = nota grave
  addEventListener('pointerdown', (e) => {
    if (e.target.closest('a,button,input,.card,.medal,.tile,.term,.modal,.keys')) return;
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
  $('#fetch-art').textContent = KNIGHT_ART;
  const kw = Math.max(...profile.fetch.map(([k]) => k.length));
  $('#fetch-info').innerHTML =
    `<b>gabriel</b><span class="dim">@</span><b>cortez</b>\n<span class="dim">${'─'.repeat(22)}</span>\n` +
    profile.fetch.map(([k, v]) => `<i class="a">${k.padEnd(kw)}</i>  ${esc(v)}`).join('\n') +
    '\n\n<span class="swatch"><i style="color:#0a0a0a">███</i><i style="color:#262626">███</i><i style="color:#7a7a7a">███</i><i style="color:#f2f2f2">███</i><i style="color:#e0443a">███</i></span>';
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

// ── história ──────────────────────────────────────────────────
function timeline() {
  const ol = $('#timeline');
  ol.innerHTML = history.map((h, i) => `
    <li data-i="${i}" data-square="${h.square}">
      <div class="sq">${h.square}</div>
      <div class="meta"><span class="mv">${esc(h.move)}</span><span>${esc(h.year)}</span></div>
      <h3>${esc(h.title)}</h3>
      <p class="place">${esc(h.place)}</p>
      <p class="body">${esc(h.text)}</p>
    </li>`).join('');
  const items = $$('li', ol);
  let active = -1;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const i = +e.target.dataset.i;
      if (i === active) return;
      if (i < active && scene) scene.clearTrail();
      active = i;
      items.forEach((li, j) => li.classList.toggle('active', j === i));
      if (scene) {
        if (i === 0) scene.clearTrail();
        scene.knightTo(e.target.dataset.square, i > 0);
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  items.forEach((li) => io.observe(li));
}

// ── stack board ───────────────────────────────────────────────
function stackBoard() {
  const b = $('#stack-board');
  let html = '', n = 0;
  stack.forEach((row, r) => {
    html += `<div class="rowlbl">${esc(row.row)}</div>`;
    row.items.forEach((it, c) => {
      html += `<div class="tile ${(r + c) % 2 ? 'alt' : ''}" style="--d:${(n++) * 40}ms" data-n="${r * 2 + c}" tabindex="0">${esc(it.toUpperCase())}</div>`;
    });
  });
  html += '<div></div>' + 'abcde'.split('').map((l) => `<div class="collbl">${l}</div>`).join('');
  b.innerHTML = html;
  const tiles = $$('.tile', b);
  tiles.forEach((t) => t.addEventListener('pointerenter', () => note(SCALE[+t.dataset.n % SCALE.length], 0.25, 1.4)));
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    tiles.forEach((t) => t.classList.add('in'));
    let i = 0;
    setInterval(() => {
      tiles.forEach((t) => t.classList.remove('sweep'));
      tiles[i++ % tiles.length].classList.add('sweep');
    }, 260);
  }, { threshold: .25 });
  io.observe(b);
  $('#stack-note').textContent = `${tiles.length}/${tiles.length} modules loaded · no bad moves detected`;
}

// ── cartas de projeto ─────────────────────────────────────────
const RARITY = { common: 'COMUM', uncommon: 'INCOMUM', rare: 'RARA', legendary: 'LENDÁRIA' };
const RCOLOR = { common: '#8f9aa6', uncommon: '#4fb3a2', rare: '#e0443a', legendary: '#b267e6' };
const cardAscii = [];

function cards() {
  const hand = $('#hand');
  hand.innerHTML = projects.map((p, i) => `
    <div class="card ${p.rarity}" tabindex="0" role="button" data-id="${p.id}" data-rarity="${p.rarity}"
         aria-label="${esc(p.name)} — ${RARITY[p.rarity]}" style="--deal:${i * 80}ms; --sway:${-i * .7}s">
      <div class="inner">
        <div class="face">
          <div class="rar"><span>${RARITY[p.rarity]}</span><span>#${String(i + 1).padStart(2, '0')}</span></div>
          <div class="art"><pre class="ascii-art" data-ascii="${p.ascii}" aria-hidden="true"></pre></div>
          <h3>${esc(p.name)}</h3>
          <p class="tl">${esc(p.tagline)}</p>
          <div class="chips">${p.tags.slice(0, 3).map((t) => `<span>${esc(t)}</span>`).join('')}</div>
          <div class="foil"></div><div class="scan"></div>
        </div>
        <div class="back"></div>
      </div>
    </div>`).join('');

  const all = $$('.card', hand);
  $$('.ascii-art', hand).forEach((pre) => cardAscii.push(mountAscii(pre, pre.dataset.ascii, { fps: 12 })));

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
    cardAscii.forEach((a) => a && a.refit());
  });
}

let modalAscii = null;
function openProject(id) {
  const p = projects.find((x) => x.id === id); if (!p) return;
  const m = $('#modal'), card = $('#modal-card');
  card.style.setProperty('--c', RCOLOR[p.rarity]);
  card.innerHTML = `
    <button class="close" aria-label="Fechar">×</button>
    <div class="top-row">${pixelIcon(p.icon)}<div><div class="rar">${RARITY[p.rarity]}</div><h3 id="modal-title">${esc(p.name)}</h3><small class="dim">${esc(p.tagline)}</small></div></div>
    <pre class="ascii-big" aria-hidden="true"></pre>
    <p>${esc(p.text)}</p>
    ${p.facts ? `<ul class="facts">${p.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
    <div class="chips">${p.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
    ${p.url ? `<a class="btn pix" href="${p.url}" target="_blank" rel="noopener">abrir no github <span>→</span></a>` : '<span class="dim">repositório privado · peça uma demo</span>'}`;
  m.hidden = false;
  modalAscii?.destroy();
  modalAscii = mountAscii($('.ascii-big', card), p.ascii, { fps: 24, rows: innerWidth < 600 ? 16 : 20 });
  $('.close', card).focus();
  arp([55, 59, 62, 66, 71], 0.07, 0.3, 2.2);
  if (scene) scene.drop((Math.random() - .5) * .6, (Math.random() - .5) * .6);
}
function closeModal() { $('#modal').hidden = true; modalAscii?.destroy(); modalAscii = null; }

// ── medalhas ──────────────────────────────────────────────────
const TIER = { gold: 'ouro', silver: 'prata', bronze: 'bronze', honor: 'honra', trophy: 'troféu', seal: 'evento' };
function medalRow() {
  const row = $('#medal-row');
  row.innerHTML = medals.map((m, i) => `
    <div class="medal ${m.tier}" tabindex="0" data-cat="${m.cat}" style="--d:${i * 90}ms">
      <div class="ribbon"></div>
      <div class="coin stamp">
        <div class="side front">${esc(m.glyph)}</div>
        <div class="side back">${m.year}<br>${esc(TIER[m.tier])}</div>
      </div>
      <h4>${esc(m.title)}</h4>
      <small>${esc(m.sub)} · ${m.year}</small>
    </div>`).join('');

  // placar em ASCII
  const counts = {};
  medals.forEach((m) => { counts[m.tier] = (counts[m.tier] || 0) + 1; });
  const order = ['trophy', 'gold', 'silver', 'bronze', 'honor', 'seal'];
  const tally = $('#tally');
  const render = (p) => {
    tally.innerHTML = '<span class="dim">┌─ placar ──────────────────────┐</span>\n' + order.filter((k) => counts[k]).map((k) => {
      const n = Math.round(counts[k] * p);
      return `<span class="dim">│</span> ${TIER[k].padEnd(7)} <i class="t-${k}">${'█'.repeat(n * 2).padEnd(14, '·')}</i> ${String(n).padStart(2)} <span class="dim">│</span>`;
    }).join('\n') + '\n<span class="dim">└───────────────────────────────┘</span>';
  };
  render(0);

  const filt = $('#medal-filters');
  const cats = [['all', 'TODAS'], ['intl', 'INTERNACIONAIS'], ['nac', 'NACIONAIS'], ['evt', 'COMPETIÇÕES']];
  filt.innerHTML = cats.map(([k, v]) => `<button role="tab" data-f="${k}" aria-selected="${k === 'all'}">${v}</button>`).join('');
  filt.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', filt).forEach((x) => x.setAttribute('aria-selected', x === b));
    $$('.medal', row).forEach((m) => m.hidden = !(b.dataset.f === 'all' || m.dataset.cat === b.dataset.f));
  });

  const io = new IntersectionObserver(async ([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    $$('.medal', row).forEach((el, i) => {
      el.classList.add('in');
      setTimeout(() => note(SCALE[4 + (i % 10)], 0.18, 1.2), i * 90 + 300);
    });
    for (let k = 1; k <= 20; k++) { render(k / 20); await sleep(reduced ? 0 : 40); }
  }, { threshold: .2 });
  io.observe(row);
  $$('.medal', row).forEach((el) => {
    el.addEventListener('click', () => { el.classList.toggle('flip'); note(el.classList.contains('trophy') || el.classList.contains('gold') ? 86 : 79, 0.3, 2); });
  });
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

// ── piano ─────────────────────────────────────────────────────
function pianoSection() {
  const keys = $('#keys'), tracker = $('#tracker');
  const LO = 36, HI = 84; // C2..C6
  const isBlack = (m) => [1, 3, 6, 8, 10].includes(m % 12);
  const KB = 'awsedftgyhujkolp;'; // C4..E5
  const keyFor = (m) => (m >= 60 && m < 60 + KB.length ? KB[m - 60] : '');
  const whites = [];
  for (let m = LO; m <= HI; m++) if (!isBlack(m)) whites.push(m);
  keys.style.setProperty('--n', whites.length);
  let html = '';
  for (let m = LO; m <= HI; m++) {
    if (isBlack(m)) {
      const wi = whites.indexOf(m - 1) + 1;
      html += `<button class="k b" data-m="${m}" style="--i:${wi}" aria-label="${noteName(m)}"><span>${keyFor(m)}</span></button>`;
    } else {
      html += `<button class="k w" data-m="${m}" aria-label="${noteName(m)}"><span>${keyFor(m) || (m % 12 === 0 ? noteName(m) : '')}</span></button>`;
    }
  }
  keys.innerHTML = html;
  const el = (m) => keys.querySelector(`[data-m="${m}"]`);
  const recent = [];
  const renderTracker = (now) => {
    const bar = String(Math.floor(recent.length / 3) + 1).padStart(2, '0');
    tracker.innerHTML =
      `<span class="dim">♩ = 70 · lent et douloureux · G△7 ⇄ D△7</span>${' '.repeat(4)}<span class="dim">bar ${bar}</span>\n` +
      `<b>▸</b> ${recent.slice(-10).map((n, i, a) => i === a.length - 1 ? `<i class="a">${n}</i>` : n).join(' <span class="dim">─</span> ') || '<span class="dim">toque uma tecla…</span>'}`;
  };
  renderTracker();
  const light = (m, on) => {
    const k = el(m); if (k) k.classList.toggle('on', on);
    if (on && m >= 60) { recent.push(noteName(m)); if (recent.length > 40) recent.shift(); renderTracker(); }
  };
  const hit = (m) => { if (!piano.on) piano.enable(); note(m, 0.6, 3); light(m, true); setTimeout(() => light(m, false), 260); };

  keys.addEventListener('pointerdown', (e) => {
    const k = e.target.closest('.k'); if (!k) return;
    e.preventDefault(); hit(+k.dataset.m);
  });
  keys.addEventListener('pointerover', (e) => {
    if (e.buttons !== 1) return;
    const k = e.target.closest('.k'); if (k) hit(+k.dataset.m);
  });

  let inView = false;
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { threshold: .3 }).observe($('#piano'));
  addEventListener('keydown', (e) => {
    if (!inView || e.repeat || e.ctrlKey || e.metaKey || e.target.closest('input')) return;
    const i = KB.indexOf(e.key.toLowerCase());
    if (i >= 0) hit(60 + i);
  });

  const play = () => {
    $('#play-satie').classList.add('playing');
    playSong(light, () => $('#play-satie').classList.remove('playing'));
  };
  $('#play-satie').addEventListener('click', play);
  $('#stop-satie').addEventListener('click', () => { stopSong(); $$('.k.on', keys).forEach((k) => k.classList.remove('on')); $('#play-satie').classList.remove('playing'); });
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
  const onScroll = () => {
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
      '  ascii [on|off|auto] fundo em caracteres',
      '  pixel <1-12>        tamanho do pixel do tabuleiro',
      '  ink · play · stop   tinta / tour do cavalo',
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
    ascii: (a) => { if (!scene) return print('webgl indisponível', 'e'); const v = a === 'off' ? 0 : a === 'auto' ? null : 1; scene.setAscii(v); print(`ascii = ${v === null ? 'auto' : v ? 'on' : 'off'}`); },
    pixel: (a) => { if (!scene) return print('webgl indisponível', 'e'); print(`pixel = ${scene.setPixel(+a || 4)}`); },
    ink: () => { if (scene) for (let i = 0; i < 4; i++) setTimeout(() => { scene.drop((Math.random() - .5) * 1.6, (Math.random() - .5) * 1.4); note(SCALE[i * 2], 0.3, 2.5); }, i * 180); print('墨 ~ ~ ~'); },
    play: () => { scene?.tour(true); print('tour do cavalo iniciado ♞ (stop para parar)'); },
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
    if (e.key === 'Escape') closeModal();
    kpos = e.key === konami[kpos] ? kpos + 1 : 0;
    if (kpos === konami.length) { kpos = 0; scene?.tour(true); toggle(true); print('♞ knight\'s tour desbloqueado!', 'c'); }
  });
}

function modal() {
  const m = $('#modal');
  m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('.close')) closeModal(); });
}

function waves() { $$('.ascii-wave').forEach((pre) => mountAscii(pre, 'wave', { fps: 12, rows: 1 })); }

// ── init ──────────────────────────────────────────────────────
about(); timeline(); stackBoard(); cards(); medalRow(); tailLog(); contact(); modal(); soundUI(); waves(); setupCommands();
const pianoApi = pianoSection();
terminal(pianoApi);
boot().then(() => { sections(); hero(); });
