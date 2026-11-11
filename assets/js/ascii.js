// ════════════════════════════════════════════════════════════════
//  ascii.js — motor de animações ASCII.
//  · cenas 3D via raymarching de SDF (ESP32, cavalo, troféu)
//  · cenas 2D desenhadas numa grade de caracteres
//  Um único loop anima só o que está visível.
// ════════════════════════════════════════════════════════════════

const RAMP = ' .,:;-=+*#%@';
const ASPECT = 0.6; // largura/altura de um caractere monoespaçado (line-height: 1)

// ── grade ───────────────────────────────────────────────────────
class Grid {
  constructor(c, r) {
    this.c = c; this.r = r;
    this.ch = Array.from({ length: r }, () => Array(c).fill(' '));
    this.cl = Array.from({ length: r }, () => Array(c).fill(''));
  }
  put(x, y, ch, cls = '') {
    x = Math.round(x); y = Math.round(y);
    if (x >= 0 && y >= 0 && x < this.c && y < this.r) { this.ch[y][x] = ch; this.cl[y][x] = cls; }
  }
  text(x, y, s, cls = '') { [...s].forEach((ch, i) => this.put(x + i, y, ch, cls)); }
  center(y, s, cls = '') { this.text(Math.floor((this.c - [...s].length) / 2), y, s, cls); }
  hline(x0, x1, y, ch = '─', cls = '') { for (let x = x0; x <= x1; x++) this.put(x, y, ch, cls); }
  vline(x, y0, y1, ch = '│', cls = '') { for (let y = y0; y <= y1; y++) this.put(x, y, ch, cls); }
  box(x, y, w, h, title = '', cls = '') {
    this.hline(x + 1, x + w - 2, y, '─', cls); this.hline(x + 1, x + w - 2, y + h - 1, '─', cls);
    this.vline(x, y + 1, y + h - 2, '│', cls); this.vline(x + w - 1, y + 1, y + h - 2, '│', cls);
    this.put(x, y, '┌', cls); this.put(x + w - 1, y, '┐', cls); this.put(x, y + h - 1, '└', cls); this.put(x + w - 1, y + h - 1, '┘', cls);
    if (title) this.text(x + 2, y, ` ${title.slice(0, w - 6)} `, cls || 'b');
  }
  fill(x, y, w, h, ch = ' ', cls = '') { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.put(x + i, y + j, ch, cls); }
  html() {
    let out = '';
    for (let y = 0; y < this.r; y++) {
      let cur = null, run = '';
      for (let x = 0; x < this.c; x++) {
        const cls = this.cl[y][x];
        if (cls !== cur) { if (run) out += cur ? `<i class="${cur}">${run}</i>` : run; run = ''; cur = cls; }
        const c = this.ch[y][x];
        run += c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c;
      }
      if (run) out += cur ? `<i class="${cur}">${run}</i>` : run;
      if (y < this.r - 1) out += '\n';
    }
    return out;
  }
}

// ── SDF ─────────────────────────────────────────────────────────
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const len2 = (x, y) => Math.hypot(x, y);
function sdBox(x, y, z, bx, by, bz) {
  const qx = Math.abs(x) - bx, qy = Math.abs(y) - by, qz = Math.abs(z) - bz;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0);
}
function sdCyl(x, y, z, r, h) { // eixo y
  const dx = len2(x, z) - r, dy = Math.abs(y) - h;
  return Math.min(Math.max(dx, dy), 0) + len2(Math.max(dx, 0), Math.max(dy, 0));
}
function sdSeg2(px, py, ax, ay, bx, by) {
  const pax = px - ax, pay = py - ay, bax = bx - ax, bay = by - ay;
  const h = clamp((pax * bax + pay * bay) / (bax * bax + bay * bay), 0, 1);
  return len2(pax - bax * h, pay - bay * h);
}
function sdPoly(px, py, V) {
  let d = (px - V[0][0]) ** 2 + (py - V[0][1]) ** 2, s = 1;
  for (let i = 0, j = V.length - 1; i < V.length; j = i++) {
    const ex = V[j][0] - V[i][0], ey = V[j][1] - V[i][1], wx = px - V[i][0], wy = py - V[i][1];
    const h = clamp((wx * ex + wy * ey) / (ex * ex + ey * ey), 0, 1);
    const bx = wx - ex * h, by = wy - ey * h;
    d = Math.min(d, bx * bx + by * by);
    const c1 = py >= V[i][1], c2 = py < V[j][1], c3 = ex * wy > ey * wx;
    if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
  }
  return s * Math.sqrt(d);
}

// ESP32 DevKit: placa, blindagem do módulo WROOM, antena, USB, botões e duas fileiras de pinos
function sdEsp32(x, y, z) {
  let d = sdBox(x, y, z, 1.4, 0.035, 0.55);
  d = Math.min(d, sdBox(x - 0.62, y - 0.11, z, 0.42, 0.075, 0.36));      // shield
  d = Math.min(d, sdBox(x - 1.18, y - 0.05, z, 0.16, 0.015, 0.34));      // antena pcb
  d = Math.min(d, sdBox(x + 1.36, y - 0.09, z, 0.1, 0.055, 0.16));       // micro-usb
  d = Math.min(d, sdBox(x + 1.08, y - 0.08, z - 0.32, 0.06, 0.05, 0.06)); // EN
  d = Math.min(d, sdBox(x + 1.08, y - 0.08, z + 0.32, 0.06, 0.05, 0.06)); // BOOT
  d = Math.min(d, sdBox(x + 0.55, y - 0.07, z - 0.05, 0.1, 0.035, 0.1)); // regulador
  const zr = z > 0 ? z - 0.47 : z + 0.47;
  d = Math.min(d, sdBox(x, y + 0.08, zr, 1.2, 0.045, 0.045));             // header
  const px = clamp(Math.round(x / 0.127), -9, 9) * 0.127;
  d = Math.min(d, sdBox(x - px, y + 0.2, zr, 0.018, 0.13, 0.018));        // pinos
  return d;
}

// material no ponto atingido (espaço do objeto): [rampa, classe]
function matEsp32(x, y, z) {
  const zr = z > 0 ? z - 0.47 : z + 0.47;
  const px = clamp(Math.round(x / 0.127), -9, 9) * 0.127;
  const parts = [
    [sdBox(x - 0.62, y - 0.11, z, 0.42, 0.075, 0.36), ' ░▒▓█', 'b'],         // shield metálico
    [sdBox(x - 1.18, y - 0.05, z, 0.16, 0.015, 0.34), '~≈≈≈≈', 'a'],         // antena
    [sdBox(x + 1.36, y - 0.09, z, 0.1, 0.055, 0.16), '▪▪■■■', 'b'],          // usb
    [Math.min(sdBox(x + 1.08, y - 0.08, z - 0.32, 0.06, 0.05, 0.06), sdBox(x + 1.08, y - 0.08, z + 0.32, 0.06, 0.05, 0.06)), '○○●●●', 'a'],
    [sdBox(x + 0.55, y - 0.07, z - 0.05, 0.1, 0.035, 0.1), '▫▫▪▪▪', ''],      // regulador
    [sdBox(x, y + 0.08, zr, 1.2, 0.045, 0.045), '::▪▪▪', 'd'],               // header
    [sdBox(x - px, y + 0.2, zr, 0.018, 0.13, 0.018), "'¦¦||", 'd'],          // pinos
    [sdBox(x, y, z, 1.4, 0.035, 0.55), ' .,:;=+', 'd']                       // pcb
  ];
  let best = parts[0];
  for (const p of parts) if (p[0] < best[0]) best = p;
  return [best[1], best[2]];
}
function matTrophy(x, y) {
  return y < -0.82 ? [' .:-=+#', 'd'] : y > -0.2 ? [' .:-=*#%@', 'a'] : [' .:-=+*#', ''];
}

const KNIGHT = [[-.30,0],[.32,0],[.28,.22],[.22,.42],[.30,.60],[.38,.80],[.36,.96],[.25,1.10],[.12,1.18],[.07,1.30],[-.01,1.19],[-.15,1.12],[-.32,1.00],[-.46,.86],[-.49,.76],[-.41,.69],[-.25,.73],[-.11,.66],[-.20,.46],[-.30,.24]];
function sdKnight(x, y, z) {
  y += 0.75;
  let d = sdCyl(x, y - 0.06, z, 0.62, 0.06);
  d = Math.min(d, sdCyl(x, y - 0.2, z, 0.5, 0.08));
  const d2 = sdPoly(x / 1.15, (y - 0.26) / 1.15, KNIGHT) * 1.15;
  const wz = Math.abs(z) - 0.18;
  d = Math.min(d, Math.min(Math.max(d2, wz), 0) + len2(Math.max(d2, 0), Math.max(wz, 0)) - 0.02);
  return d;
}

function sdTrophy(x, y, z) {
  let d = sdBox(x, y + 1.05, z, 0.55, 0.1, 0.55);               // pedestal
  d = Math.min(d, sdBox(x, y + 0.88, z, 0.4, 0.07, 0.4));
  d = Math.min(d, sdCyl(x, y + 0.55, z, 0.08, 0.3));            // haste
  d = Math.min(d, Math.hypot(x, y + 0.27, z) - 0.15);           // nó
  const r = len2(x, z);
  d = Math.min(d, sdSeg2(r, y, 0.18, -0.15, 0.62, 0.65) - 0.05); // taça
  d = Math.min(d, sdCyl(x, y + 0.13, z, 0.22, 0.04));
  for (const s of [-1, 1]) {                                     // alças
    const hx = x - s * 0.62, hy = y - 0.3;
    const t = Math.hypot(len2(hx, hy) - 0.22, z) - 0.045;
    d = Math.min(d, Math.max(t, -(s * x - 0.6)));
  }
  return d;
}

// view → objeto: primeiro desfaz a inclinação (eixo x da câmera), depois o giro (eixo y do objeto)
function rot(x, y, z, ay, ax) {
  const cx = Math.cos(ax), sx = Math.sin(ax);
  const y1 = y * cx - z * sx, z1 = y * sx + z * cx;
  const cy = Math.cos(ay), sy = Math.sin(ay);
  return [x * cy - z1 * sy, y1, x * sy + z1 * cy];
}

// fit = meia-extensão do mundo que cabe na menor dimensão da grade
function raymarch(G, sdf, ay, ax, fit, rows = G.r, top = 0, mat = null) {
  const sc = fit / Math.min(G.c / 2 * ASPECT, rows / 2);
  const L = [-0.45, 0.75, -0.5], ll = Math.hypot(...L); L[0] /= ll; L[1] /= ll; L[2] /= ll;
  const f = (x, y, z) => { const p = rot(x, y, z, ay, ax); return sdf(p[0], p[1], p[2]); };
  const e = 0.004;
  for (let j = 0; j < rows; j++) for (let i = 0; i < G.c; i++) {
    const u = (i + 0.5 - G.c / 2) * ASPECT * sc;
    const v = (rows / 2 - j - 0.5) * sc;
    let t = 0, hit = false;
    for (let s = 0; s < 48; s++) {
      const d = f(u, v, -3 + t);
      if (d < 0.004) { hit = true; break; }
      t += d; if (t > 6) break;
    }
    if (!hit) continue;
    const z = -3 + t;
    const nx = f(u + e, v, z) - f(u - e, v, z), ny = f(u, v + e, z) - f(u, v - e, z), nz = f(u, v, z + e) - f(u, v, z - e);
    const nl = Math.hypot(nx, ny, nz) || 1;
    const dif = Math.max(0, (nx * L[0] + ny * L[1] + nz * L[2]) / nl);
    const rim = Math.pow(1 - Math.abs(nz / nl), 3) * 0.25;
    const lum = clamp(0.12 + dif * 0.8 + rim, 0, 1);
    if (mat) {
      const [ramp, cls] = mat(...rot(u, v, z, ay, ax));
      G.put(i, j + top, ramp[1 + Math.floor(lum * (ramp.length - 1.001 - 1))] || ramp[ramp.length - 1], cls);
    } else G.put(i, j + top, RAMP[1 + Math.floor(lum * (RAMP.length - 2))], lum > 0.82 ? 'b' : '');
  }
}

// ── cenas ───────────────────────────────────────────────────────
const loopT = (t, p) => (t % p + p) % p;
const typed = (s, k) => s.slice(0, Math.max(0, Math.floor(k)));

const SCENES = {
  esp32(G, t) {
    const hud = G.r >= 16;
    raymarch(G, sdEsp32, t * 0.6, 0.75 + Math.sin(t * 0.4) * 0.15, G.c * ASPECT > G.r * 1.6 ? 0.85 : 1.45, hud ? G.r - 2 : G.r, 0, matEsp32);
    if (hud) {
      const n = Math.floor(t / 1.3);
      const occ = 12 + (n * 7) % 23;
      G.text(1, G.r - 1, `mqtt ▸ bus/${n % 3 ? 'in ' : 'out'} · ocupação ${String(occ).padStart(2)}`, 'd');
      G.put(G.c - 2, G.r - 1, n % 2 ? '●' : '○', 'a');
    }
  },
  knight(G, t) {
    raymarch(G, sdKnight, t * 0.8, 0.25, 1.15);
    if (G.r >= 16) G.text(1, G.r - 1, '1. e4 e5 2. Nf3', 'd');
  },
  trophy(G, t) {
    const hud = G.r >= 16;
    raymarch(G, sdTrophy, t * 0.9, 0.18, 1.25, hud ? G.r - 1 : G.r, 0, matTrophy);
    if (hud) G.center(G.r - 1, '★ CAMPEÃO · PRO-LINK 2026 ★', 'a');
  },

  narrater(G, t) {
    const lw = Math.max(13, Math.floor(G.c * 0.4)), h = G.r - 1, rx = G.c - lw;
    const p = loopT(t, 9);
    const L = ['claude', 'codex'];
    G.box(0, 0, lw, h, L[0], ''); G.box(rx, 0, lw, h, L[1], '');
    const iw = lw - 3;
    const leftLines = ['$ narrater ask', '  codex "review"'];
    const rightLines = ['reviewing diff…', '2 issues found', '✓ done'];
    // esquerda digita o pedido
    let y = 1;
    leftLines.forEach((s, i) => { G.text(2, y + i, typed(s, (p - i * 1.0) * 14).slice(0, iw), i ? '' : 'b'); });
    // pacote de ida
    const mid = Math.floor(h / 2), x0 = lw, x1 = rx - 1;
    G.hline(x0, x1, mid, '─', 'd');
    G.put(x0, mid, '├', 'd'); G.put(x1, mid, '┤', 'd');
    if (x1 - x0 > 8) G.text(Math.floor((x0 + x1) / 2) - 2, mid - 1, '⇄ ask', 'd');
    const go = (p - 2.2) / 1.4, back = (p - 6.0) / 1.4;
    if (go > 0 && go < 1) G.put(x0 + (x1 - x0) * go, mid, '●', 'a');
    if (back > 0 && back < 1) G.put(x1 - (x1 - x0) * back, mid, '●', 'b');
    // direita responde
    if (p > 3.6) rightLines.forEach((s, i) => G.text(rx + 2, 1 + i, typed(s, (p - 3.6 - i * 0.8) * 16).slice(0, iw), i === 2 ? 'a' : ''));
    if (p > 7.4) G.text(2, 1 + leftLines.length, '← 2 issues'.slice(0, iw), 'a');
    // cursores piscando
    if (Math.floor(t * 2) % 2) { G.put(2, h - 2, '▌', 'b'); G.put(rx + 2, h - 2, '▌', 'b'); }
    if (G.r > 12 && G.c > 50) G.center(G.r - 1, 'canvas infinito · arestas = quem fala com quem', 'd');
  },

  greenhouse(G, t) {
    const gy = G.r - 2, apex = 1, cx = Math.floor(G.c / 2);
    const half = Math.min(cx - 1, Math.floor((gy - apex) * 1.6));
    const wallTop = apex + Math.ceil(half / 2);
    for (let i = 0; i <= half; i++) {
      const y = apex + Math.floor(i / 2);
      if (y <= wallTop) { G.put(cx - i, y, '/', ''); G.put(cx + i, y, '\\', ''); }
    }
    G.vline(cx - half, wallTop, gy - 1, '│'); G.vline(cx + half, wallTop, gy - 1, '│');
    G.hline(0, G.c - 1, gy, '▀', 'd');
    G.put(cx, apex - 1 < 0 ? apex : apex, '^', 'b');
    // aspersor + gotas quando a bomba liga
    const pump = Math.sin(t * 0.7) > 0;
    G.hline(cx - half + 2, cx + half - 2, wallTop + 1, '┄', 'd');
    if (pump) for (let k = 0; k < 10; k++) {
      const dx = cx - half + 3 + ((k * 7) % Math.max(1, 2 * half - 5));
      const dy = wallTop + 2 + Math.floor(loopT(t * 6 + k * 1.7, gy - wallTop - 2));
      G.put(dx, dy, '\'', 'd');
    }
    // plantas crescendo
    const n = Math.max(2, Math.floor(half / 3));
    for (let k = 0; k < n; k++) {
      const x = cx - half + 2 + Math.round(((k + 0.5) / n) * (2 * half - 4));
      const hh = Math.max(1, Math.round((gy - wallTop - 3) * (0.55 + 0.4 * Math.sin(t * 0.5 + k * 1.3))));
      for (let j = 1; j <= hh; j++) G.put(x, gy - j, j % 2 ? '│' : '┼', '');
      G.put(x, gy - hh - 1, k % 2 ? '❀' : '✿', 'a');
    }
    const T = (26.5 + Math.sin(t * 0.3) * 1.4).toFixed(1), H = Math.round(64 + Math.cos(t * 0.4) * 6);
    G.text(0, G.r - 1, `T ${T}°C  H ${H}%  ${pump ? 'pump ON ' : 'pump off'}`.slice(0, G.c), pump ? 'a' : 'd');
    if (G.c > 34) G.text(G.c - 13, 0, '[cyclone iv]', 'd');
  },

  chat(G, t) {
    const msgs = [
      ['u', 'oi, tem horário amanhã?'],
      ['s', '[rag] 3 chunks · supabase'],
      ['b', 'temos 9h e 14h :)'],
      ['u', '14h, por favor'],
      ['s', '[tool] agenda.reservar()'],
      ['b', 'agendado ✓ 14h, dra. ana']
    ];
    const p = loopT(t, 11), step = 1.6;
    const shown = msgs.slice(0, Math.min(msgs.length, Math.floor(p / step) + 1));
    const w = G.c;
    let lines = [];
    shown.forEach(([who, s], i) => {
      const isLast = i === shown.length - 1;
      const txt = isLast ? typed(s, (p - i * step) * 22) : s;
      if (who === 'u') lines.push([Math.max(0, w - [...txt].length - 2), txt + ' ◂', 'b']);
      else if (who === 'b') lines.push([0, '▸ ' + txt, 'a']);
      else lines.push([2, txt, 'd']);
    });
    if (Math.floor(p / step) < msgs.length && Math.floor(t * 3) % 2) lines.push([0, '▸ ···', 'd']);
    lines = lines.slice(-(G.r - 2));
    G.text(0, 0, 'kacto · gpt-4o · clínica'.slice(0, w), 'd');
    G.hline(0, w - 1, 1, '─', 'd');
    lines.forEach(([x, s, c], i) => G.text(x, 2 + i, s.slice(0, w), c));
  },

  ink(G, t) {
    const ramp = ' .·:-~=≈*#';
    const ts = t / 6;
    for (let j = 0; j < G.r; j++) for (let i = 0; i < G.c; i++) {
      let x = (i - G.c / 2) * ASPECT / (G.r / 2), y = (G.r / 2 - j) / (G.r / 2);
      for (let k = 1; k < 18; k++) { x += 0.5 / k * Math.cos(k * 4 * y + ts); y += 0.5 / k * Math.cos(k * 3 * x + ts); }
      const b = Math.pow(1 - Math.abs(Math.sin(ts - x - y)), 3);
      const ch = ramp[Math.min(ramp.length - 1, Math.floor(b * ramp.length))];
      G.put(i, j, ch, b > 0.85 ? 'b' : b > 0.5 ? '' : 'd');
    }
    if (G.r > 12) G.text(G.c - 6, G.r - 2, '墨流し', 'a');
  },

  bars(G, t) {
    const charts = [
      { title: 'netflix · tipo (8.807)', rows: [['movie', 6131], ['tv show', 2676]], max: 6131 },
      { title: 'students · média das notas', rows: [['math', 66.1], ['reading', 69.2], ['writing', 68.1]], max: 100 }
    ];
    const k = Math.floor(t / 6) % 2, p = Math.min(1, loopT(t, 6) / 1.6);
    const c = charts[k];
    G.text(0, 0, '$ python tp1.py'.slice(0, G.c), 'd');
    G.text(0, 2, c.title.slice(0, G.c), 'b');
    const lab = 9, bw = G.c - lab - 7;
    c.rows.forEach(([name, v], i) => {
      const y = 4 + i * 2;
      const n = Math.round(bw * (v / c.max) * p);
      G.text(0, y, name.padEnd(lab - 1).slice(0, lab - 1), '');
      G.text(lab, y, '█'.repeat(n), i === 0 ? 'a' : '');
      G.text(lab + n + 1, y, String(p === 1 ? v : Math.round(v * p * 10) / 10), 'd');
    });
    G.text(0, G.r - 1, 'pandas · matplotlib'.slice(0, G.c), 'd');
  },

  nlp(G, t) {
    const data = [
      ['chegou rápido, recomendo', 5], ['veio quebrado, péssimo', 1], ['ok, nada demais', 3], ['bom, mas atrasou', 4]
    ];
    const k = Math.floor(t / 4.5) % data.length, p = loopT(t, 4.5);
    const [txt, stars] = data[k];
    G.text(0, 0, '> review'.slice(0, G.c), 'd');
    G.text(0, 1, ('"' + typed(txt, p * 18) + '"').slice(0, G.c), 'b');
    if (p > 1.6) {
      const words = txt.replace(/[,]/g, '').split(' ');
      const grams = words.slice(0, -1).map((w, i) => `[${w} ${words[i + 1]}]`);
      let x = 0, y = 3;
      grams.forEach((g, i) => {
        if ((p - 1.6) * 3 < i) return;
        if (x + g.length > G.c) { x = 0; y++; }
        G.text(x, y, g, 'd'); x += g.length + 1;
      });
    }
    if (p > 2.8) {
      const y = G.r - 2;
      G.text(0, y, 'LinearSVC ▸ ', '');
      G.text(12, y, '★'.repeat(stars), 'a');
      G.text(12 + stars, y, '☆'.repeat(5 - stars), 'd');
    }
  },

  browser(G, t) {
    const sites = ['grupo-shamar', 'horizont-rec'];
    const s = sites[Math.floor(t / 7) % 2], p = loopT(t, 7);
    G.box(0, 0, G.c, G.r, '', '');
    G.text(2, 1, '● ● ●', 'a');
    G.text(8, 1, (' ' + s + '.com.br').slice(0, G.c - 10), 'd');
    G.hline(1, G.c - 2, 2, '─', 'd');
    const w = G.c - 4, steps = [
      () => { G.text(2, 3, '▀▀▀', 'b'); G.text(G.c - 2 - 15, 3, 'home sobre ctt'.slice(0, w), 'd'); },
      () => G.fill(2, 5, w, Math.max(2, Math.floor((G.r - 9) / 2)), '▓', ''),
      () => G.center(5 + Math.floor((G.r - 9) / 4), s === 'grupo-shamar' ? ' SEGURANÇA ' : ' AUDIOVISUAL ', 'b'),
      () => { const y = 6 + Math.max(2, Math.floor((G.r - 9) / 2)); G.text(2, y, '▬'.repeat(Math.floor(w * 0.8)), ''); G.text(2, y + 1, '▬'.repeat(Math.floor(w * 0.6)), 'd'); },
      () => G.text(2, G.r - 2, '[ fale conosco ]'.slice(0, w), 'a')
    ];
    steps.forEach((f, i) => { if (p > 0.6 + i * 0.9) f(); });
  },

  triangles(G, t) {
    const zb = Array.from({ length: G.r }, () => Array(G.c).fill(-1e9));
    const fills = ['@', '#', '+', '*', '%', '='];
    const n = G.r >= 16 ? 6 : 4, hud = G.r >= 10;
    const rows = hud ? G.r - 1 : G.r;
    for (let k = 0; k < n; k++) {
      const a = t * (0.6 + k * 0.17) + k * 1.1, R = 0.55 + (k % 3) * 0.15;
      const cxw = Math.cos(k * 2.4) * 0.9, cyw = Math.sin(k * 1.7) * 0.45;
      const pts = [0, 1, 2].map((v) => {
        const ang = v * 2.094 + k;
        let x = Math.cos(ang) * R, y = Math.sin(ang) * R, z = 0;
        const x2 = x * Math.cos(a) - z * Math.sin(a), z2 = x * Math.sin(a) + z * Math.cos(a);
        return [(cxw + x2) / ASPECT * (rows / 2) / 1.5 + G.c / 2, rows / 2 - (cyw + y) * (rows / 2) / 1.2, z2];
      });
      const [A, B, C] = pts;
      const area = (B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1]);
      if (Math.abs(area) < 0.5) continue;
      const minx = Math.max(0, Math.floor(Math.min(A[0], B[0], C[0]))), maxx = Math.min(G.c - 1, Math.ceil(Math.max(A[0], B[0], C[0])));
      const miny = Math.max(0, Math.floor(Math.min(A[1], B[1], C[1]))), maxy = Math.min(rows - 1, Math.ceil(Math.max(A[1], B[1], C[1])));
      for (let y = miny; y <= maxy; y++) for (let x = minx; x <= maxx; x++) {
        const px = x + 0.5, py = y + 0.5;
        const w0 = ((B[0] - px) * (C[1] - py) - (C[0] - px) * (B[1] - py)) / area;
        const w1 = ((C[0] - px) * (A[1] - py) - (A[0] - px) * (C[1] - py)) / area;
        const w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const z = w0 * A[2] + w1 * B[2] + w2 * C[2] + k * 0.01;
        if (z > zb[y][x]) { zb[y][x] = z; G.put(x, y, fills[k % fills.length], k % 3 === 0 ? 'a' : k % 3 === 1 ? 'b' : ''); }
      }
    }
    if (hud) G.text(0, G.r - 1, `fps ${58 + Math.round(Math.sin(t * 3) * 2)} · tris ${1 << (10 + Math.floor(t / 3) % 4)}`.slice(0, G.c), 'd');
  },

  grpc(G, t) {
    const ops = [['Add(2, 3)', '5'], ['Mul(6, 7)', '42'], ['Div(8, 0)', 'INVALID_ARG'], ['Sub(9, 4)', '5']];
    const k = Math.floor(t / 4) % ops.length, p = loopT(t, 4);
    const bw = Math.max(8, Math.floor(G.c * 0.28)), bh = Math.min(5, G.r - 3), y0 = 1;
    G.box(0, y0, bw, bh, 'client'); G.box(G.c - bw, y0, bw, bh, 'server');
    const mid = y0 + Math.floor(bh / 2), x0 = bw, x1 = G.c - bw - 1;
    G.hline(x0, x1, mid, '─', 'd');
    const [req, res] = ops[k], err = res.startsWith('INV');
    if (p < 1.4) { const q = p / 1.4; G.put(x0 + (x1 - x0) * q, mid, '►', 'b'); }
    else if (p > 1.8 && p < 3.2) { const q = (p - 1.8) / 1.4; G.put(x1 - (x1 - x0) * q, mid, '◄', err ? 'a' : 'b'); }
    G.text(1, y0 + bh, req.slice(0, G.c - 1), 'b');
    if (p > 3.2) G.text(G.c - 1 - res.length, y0 + bh, res, err ? 'a' : 'b');
    if (G.r > y0 + bh + 2) G.text(0, G.r - 1, `[interceptor] /Calculator/${req.split('(')[0]} ${(0.8 + (k * 0.37) % 1).toFixed(1)}ms`.slice(0, G.c), 'd');
  },

  blink(G, t) {
    const on = Math.floor(t * 1.2) % 2 === 0;
    const bw = Math.min(14, Math.floor(G.c * 0.4)), bh = Math.min(6, G.r - 5);
    G.box(0, 0, bw, bh, 'esp32');
    for (let y = 1; y < bh - 1; y++) { G.put(bw - 1, y, '┤', 'd'); }
    G.text(2, 2, 'GPIO2', 'd');
    G.hline(bw, bw + 6, 2, '─', 'd');
    G.text(bw + 7, 2, on ? '(@)' : '( )', on ? 'a' : 'd');
    if (on) { G.text(bw + 6, 1, '\\ /', 'a'); G.text(bw + 6, 3, '/ \\', 'a'); }
    const code = ['digitalWrite(LED, HIGH);', 'delay(500);', 'digitalWrite(LED, LOW);', 'delay(500);'];
    const cur = Math.floor(t * 2.4) % 4;
    code.forEach((s, i) => { const y = bh + i; if (y < G.r) G.text(0, y, ((i === cur ? '▸ ' : '  ') + s).slice(0, G.c), i === cur ? 'b' : 'd'); });
  },

  wave(G, t) {
    const ramp = ' .-~=≈';
    for (let i = 0; i < G.c; i++) {
      const v = Math.sin(i * 0.11 + t * 1.3) * 0.5 + Math.sin(i * 0.031 - t * 0.7) * 0.5;
      const k = Math.floor((v * 0.5 + 0.5) * ramp.length);
      G.put(i, 0, ramp[Math.min(ramp.length - 1, k)], k > 4 ? 'b' : 'd');
    }
  }
};

// ── montagem + loop compartilhado ───────────────────────────────
let charW = 0, charH = 0;
function measure(pre) {
  const s = document.createElement('span');
  s.textContent = 'M'.repeat(20);
  s.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
  pre.appendChild(s);
  // offsetWidth ignora transforms (o modal entra com scale animado)
  const w = s.offsetWidth, h = s.offsetHeight;
  s.remove();
  return [w / 20 || 6, parseFloat(getComputedStyle(pre).lineHeight) || h || 10];
}

const live = new Set();
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mountAscii(pre, kind, { fps = 15, cols, rows } = {}) {
  const scene = SCENES[kind]; if (!scene) return null;
  const inst = { pre, scene, fps, cols, rows, last: 0, visible: false, t0: performance.now() - Math.random() * 4000 };
  inst.fit = () => {
    if (cols && rows) { inst.c = cols; inst.r = rows; return; }
    const [w, h] = measure(pre);
    const cs = getComputedStyle(pre);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    inst.c = Math.max(8, Math.floor((pre.clientWidth - padX) / w));
    inst.r = Math.max(1, rows || Math.floor((pre.clientHeight - padY) / h));
  };
  inst.fit();
  inst.draw = (now) => {
    const G = new Grid(inst.c, inst.r);
    scene(G, (now - inst.t0) / 1000);
    pre.innerHTML = G.html();
  };
  inst.io = new IntersectionObserver(([e]) => { inst.visible = e.isIntersecting; }, { rootMargin: '80px' });
  inst.io.observe(pre);
  inst.draw(performance.now());
  live.add(inst);
  return {
    destroy() { inst.io.disconnect(); live.delete(inst); },
    refit() { inst.fit(); inst.draw(performance.now()); }
  };
}

function tick(now) {
  for (const inst of live) {
    if (!inst.visible || document.hidden) continue;
    if (now - inst.last < 1000 / (reduced ? 2 : inst.fps)) continue;
    inst.last = now;
    inst.draw(now);
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
addEventListener('resize', () => { for (const i of live) if (!(i.cols && i.rows)) i.fit(); });

export const KNIGHT_ART = String.raw`
       ▄▄██▄
     ▄██████▄
    ███▀▄█████
   ████████████
  █████▀ ▀█████
   ▀▀▀   ▄█████
        ▄██████
       ████████
      ▄████████▄
     ▀▀▀▀▀▀▀▀▀▀▀
    ██████████████`.slice(1);
