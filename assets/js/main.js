import { profile, history, stack, projects, medals, currentLog } from './data.js';
import { pixelIcon } from './pixelart.js';

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
    '[ ok ] 1. e4 e5  2. Nf3 Nc6  3. Bb5',
    '[ ok ] dithering bayer4x4 · crt on',
    '<b>ready.</b> good luck, have fun'
  ];
  const sceneP = import('./scene.js')
    .then((m) => { scene = m.createScene($('#gl')); })
    .catch((e) => { console.warn('WebGL indisponível', e); document.body.classList.add('no-gl'); });
  for (let i = 0; i < lines.length; i++) {
    log.innerHTML += lines[i] + '\n';
    bar.style.width = ((i + 1) / lines.length) * 100 + '%';
    await sleep(reduced ? 0 : 140 + Math.random() * 120);
    if (i === 2) await sceneP;
  }
  await sceneP;
  await sleep(reduced ? 0 : 250);
  $('#boot').classList.add('done');
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

// comandos dos títulos são digitados quando aparecem
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

// ── whoami ────────────────────────────────────────────────────
function about() {
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

// ── história (o cavalo salta a cada marco) ────────────────────
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
      // ao voltar na rolagem, refaz o percurso até o lance
      if (i < active && scene) { scene.clearTrail(); }
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
  let html = '';
  let n = 0;
  stack.forEach((row, r) => {
    html += `<div class="rowlbl">${esc(row.row)}</div>`;
    row.items.forEach((it, c) => {
      html += `<div class="tile ${(r + c) % 2 ? 'alt' : ''}" style="--d:${(n++) * 45}ms" tabindex="0">${esc(it.toUpperCase())}</div>`;
    });
  });
  html += '<div></div>' + 'abcde'.split('').map((l) => `<div class="collbl">${l}</div>`).join('');
  b.innerHTML = html;
  const tiles = $$('.tile', b);
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    tiles.forEach((t) => t.classList.add('in'));
    let i = 0;
    setInterval(() => { // varredura como no stack-board.svg
      tiles.forEach((t) => t.classList.remove('sweep'));
      tiles[i++ % tiles.length].classList.add('sweep');
    }, 280);
  }, { threshold: .25 });
  io.observe(b);
  const total = tiles.length;
  $('#stack-note').textContent = `${total}/${total} modules loaded · no bad moves detected`;
}

// ── cartas de projeto (Balatro) ───────────────────────────────
const RARITY = { common: 'COMUM', uncommon: 'INCOMUM', rare: 'RARA', legendary: 'LENDÁRIA' };

function cards() {
  const hand = $('#hand');
  hand.innerHTML = projects.map((p, i) => `
    <div class="card ${p.rarity}" tabindex="0" role="button" data-id="${p.id}" data-rarity="${p.rarity}"
         aria-label="${esc(p.name)} — ${RARITY[p.rarity]}" style="--deal:${i * 90}ms; --sway:${-i * .7}s">
      <div class="inner">
        <div class="face">
          <div class="rar"><span>${RARITY[p.rarity]}</span><span>#${String(i + 1).padStart(2, '0')}</span></div>
          <div class="art">${pixelIcon(p.icon)}</div>
          <h3>${esc(p.name)}</h3>
          <p class="tl">${esc(p.tagline)}</p>
          <div class="chips">${p.tags.slice(0, 3).map((t) => `<span>${esc(t)}</span>`).join('')}</div>
          <div class="foil"></div><div class="scan"></div>
        </div>
        <div class="back"></div>
      </div>
    </div>`).join('');

  const all = $$('.card', hand);
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    all.forEach((c) => c.classList.add('dealt'));
  }, { threshold: .15 });
  io.observe(hand);

  // inclinação 3D + foil seguindo o mouse
  all.forEach((c) => {
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
    c.addEventListener('pointerleave', () => {
      c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg');
      inner.style.transition = '';
    });
    const open = () => openProject(c.dataset.id);
    c.addEventListener('click', open);
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });

  // filtros por raridade
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
  });
}

function openProject(id) {
  const p = projects.find((x) => x.id === id); if (!p) return;
  const m = $('#modal'), card = $('#modal-card');
  const colors = { common: '#8f9aa6', uncommon: '#4fb3a2', rare: '#e0443a', legendary: '#b267e6' };
  card.style.setProperty('--c', colors[p.rarity]);
  card.innerHTML = `
    <button class="close" aria-label="Fechar">×</button>
    <div class="top-row">${pixelIcon(p.icon)}<div><div class="rar">${RARITY[p.rarity]}</div><h3 id="modal-title">${esc(p.name)}</h3><small class="dim">${esc(p.tagline)}</small></div></div>
    <p>${esc(p.text)}</p>
    <div class="chips">${p.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
    <a class="btn pix" href="${p.url}" target="_blank" rel="noopener">abrir no github <span>→</span></a>`;
  m.hidden = false;
  $('.close', card).focus();
  if (scene) scene.drop((Math.random() - .5) * .6, (Math.random() - .5) * .6);
}
function closeModal() { $('#modal').hidden = true; }

// ── medalhas ──────────────────────────────────────────────────
function medalRow() {
  const row = $('#medal-row');
  row.innerHTML = medals.map((m, i) => `
    <div class="medal ${m.tier}" tabindex="0" style="--d:${i * 160}ms">
      <div class="ribbon"></div>
      <div class="coin stamp">
        <div class="side front">${esc(m.glyph)}</div>
        <div class="side back">${esc(m.text)}</div>
      </div>
      <h4>${esc(m.title)}</h4>
      <small>${esc(m.sub)}</small>
    </div>`).join('');
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    $$('.medal', row).forEach((el) => el.classList.add('in'));
  }, { threshold: .3 });
  io.observe(row);
  $$('.medal', row).forEach((el) => el.addEventListener('click', () => el.classList.toggle('flip')));
}

// ── tail -f ───────────────────────────────────────────────────
function tailLog() {
  const out = $('#log-out');
  let i = 0, timer = null;
  const ts = () => new Date().toTimeString().slice(0, 8);
  const push = () => {
    const [k, v] = currentLog[i++ % currentLog.length];
    out.innerHTML += `<span class="t">${ts()}</span> <span class="k">[${esc(k)}]</span>${' '.repeat(Math.max(1, 10 - k.length))}<span class="v">${esc(v)}</span>\n`;
    const lines = out.innerHTML.split('\n');
    if (lines.length > 14) out.innerHTML = lines.slice(-14).join('\n');
  };
  const io = new IntersectionObserver(([e]) => {
    clearInterval(timer);
    if (e.isIntersecting) { if (!i) for (let j = 0; j < 4; j++) push(); timer = setInterval(push, 1400); }
  });
  io.observe(out);
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
  const out = $('#ping-out');
  const io = new IntersectionObserver(async ([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    out.innerHTML = `PING <b>gabriel</b> (${esc(profile.location)}): 56 data bytes\n`;
    for (let s = 0; s < 4; s++) {
      await sleep(reduced ? 0 : 500);
      out.innerHTML += `64 bytes from gabriel: icmp_seq=${s} ttl=64 time=${(Math.random() * 12 + 3).toFixed(1)} ms\n`;
    }
    out.innerHTML += `--- 4 packets transmitted, 4 received, <b>0% packet loss</b> · disponível para conversar`;
  }, { threshold: .5 });
  io.observe(out);
}

// ── seção ativa → câmera do tabuleiro, nav, trilho ────────────
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

// ── terminal interativo ───────────────────────────────────────
function terminal() {
  const term = $('#term'), out = $('#term-out'), input = $('#term-input');
  const hist = []; let hi = 0;
  const print = (s, cls = '') => { out.innerHTML += (cls ? `<span class="${cls}">${s}</span>` : s) + '\n'; out.scrollTop = out.scrollHeight; };
  const go = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };

  const cmds = {
    help: () => print([
      'comandos:',
      '  whoami            quem sou eu',
      '  ls projects       lista as cartas',
      '  open <projeto>    abre um projeto (ex: open narrater)',
      '  history | medals | stack | contact   vai até a seção',
      '  pixel <1-12>      tamanho do pixel do tabuleiro',
      '  ink               pinga tinta no fundo',
      '  play | stop       tour do cavalo',
      '  clear · exit'
    ].join('\n')),
    whoami: () => print(`${esc(profile.name)} — ${esc(profile.role)}\n${profile.whoami[0].replace(/<[^>]+>/g, '')}`),
    ls: () => print(projects.map((p) => `${p.rarity.padEnd(10)} ${p.id.padEnd(12)} ${esc(p.tagline)}`).join('\n')),
    open: (a) => { const p = projects.find((x) => x.id === a || x.name.toLowerCase() === (a || '').toLowerCase()); if (p) { openProject(p.id); print(`abrindo ${p.name}…`); } else print(`projeto não encontrado: ${esc(a || '')} — tente "ls"`, 'e'); },
    history: () => go('history'), medals: () => go('medals'), stack: () => go('stack'),
    projects: () => go('projects'), contact: () => go('contact'), ping: () => go('contact'), about: () => go('about'),
    pixel: (a) => { if (!scene) return print('webgl indisponível', 'e'); print(`pixel = ${scene.setPixel(+a || 4)}`); },
    ink: () => { if (scene) for (let i = 0; i < 4; i++) setTimeout(() => scene.drop((Math.random() - .5) * 1.6, (Math.random() - .5) * 1.4), i * 180); print('墨 ~ ~ ~'); },
    play: () => { scene?.tour(true); print('tour do cavalo iniciado ♞ (stop para parar)'); },
    stop: () => { scene?.tour(false); print('ok.'); },
    sudo: (a, all) => print(/hire/.test(all) ? 'permissão concedida ✓  →  ' + esc(profile.links.email) : 'gabriel is not in the sudoers file. this incident will be reported.', /hire/.test(all) ? 'c' : 'e'),
    clear: () => { out.innerHTML = ''; },
    exit: () => toggle(false),
    'e4': () => print('e5. boa abertura.'),
    resign: () => { go('contact'); print('1-0'); }
  };

  function run(line) {
    const raw = line.trim(); if (!raw) return;
    print(`<span class="c">$ ${esc(raw)}</span>`);
    const [c, ...rest] = raw.split(/\s+/);
    const fn = cmds[c.toLowerCase()];
    if (fn) fn(rest[0] === 'projects' && c === 'ls' ? undefined : rest[0], raw);
    else print(`comando não encontrado: ${esc(c)} — digite "help"`, 'e');
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

  // atalhos globais + konami → tour
  const konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let kpos = 0;
  addEventListener('keydown', (e) => {
    if (e.key === '`' || e.key === '~' || e.key === "'" && e.ctrlKey) { e.preventDefault(); toggle(); return; }
    if (e.key === 'Escape') { closeModal(); }
    kpos = e.key === konami[kpos] ? kpos + 1 : 0;
    if (kpos === konami.length) { kpos = 0; scene?.tour(true); toggle(true); print('♞ knight\'s tour desbloqueado!', 'c'); }
  });
}

// ── modal ─────────────────────────────────────────────────────
function modal() {
  const m = $('#modal');
  m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('.close')) closeModal(); });
}

// ── init ──────────────────────────────────────────────────────
about(); timeline(); stackBoard(); cards(); medalRow(); tailLog(); contact(); modal(); terminal(); setupCommands();
boot().then(() => { sections(); hero(); });
