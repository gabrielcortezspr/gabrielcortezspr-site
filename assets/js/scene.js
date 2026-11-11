// ════════════════════════════════════════════════════════════════
//  scene.js — um único canvas WebGL fixo atrás do site.
//  camada 1: shader suminagashi (fundo de tinta, reage ao mouse/cliques)
//  camada 2: tabuleiro 3D com a posição da Ruy Lopez (1.e4 e5 2.Nf3 Nc6 3.Bb5)
//  pós:      renderiza em baixa resolução → pixelado, dithering Bayer,
//            aberração cromática, scanlines e curvatura CRT (vibe Balatro)
// ════════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { buildPiece } from './models.js';

const FILES = 'abcdefgh';
const sq = (s) => ({ f: FILES.indexOf(s[0]), r: +s[1] - 1 });
const sqPos = (s) => { const { f, r } = sq(s); return new THREE.Vector3(f - 3.5, 0.1, 3.5 - r); };

// ── shaders ─────────────────────────────────────────────────────
const FULLSCREEN_VERT = /* glsl */`
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

// shader-suminagashi (github.com/gabrielcortezspr/shader-suminagashi)
// + atração do mouse + gotas de tinta concêntricas nos cliques
const INK_FRAG = /* glsl */`
  precision highp float;
  uniform float uTime;
  uniform vec2  uRes;
  uniform vec2  uMouse;
  uniform float uStir;
  uniform vec3  uDrops[8];
  varying vec2 vUv;

  void main(){
    vec2 frag = vUv * uRes;
    vec2 uv = (2.0 * frag - uRes) / min(uRes.x, uRes.y);
    float t = uTime / 12.0;

    vec2 dm = uv - uMouse;
    uv += dm * 0.22 * exp(-dot(dm, dm) * 2.5);

    for (int k = 0; k < 8; k++) {
      vec3 d = uDrops[k];
      float age = uTime - d.z;
      if (age < 0.0 || age > 9.0) continue;
      vec2 dir = uv - d.xy;
      float dist = length(dir);
      float ring = sin(dist * 16.0 - age * 4.0) * exp(-dist * 1.2) * exp(-age * 0.45);
      uv += (dir / (dist + 1e-3)) * ring * 0.10;
    }

    float amp = 0.5 + uStir * 0.12;
    for (float i = 1.0; i < 30.0; i++) {
      uv.x += amp / i * cos(i * 4.0 * uv.y + t);
      uv.y += amp / i * cos(i * 3.0 * uv.x + t);
    }

    float b = 1.0 - abs(sin(t - uv.x - uv.y));
    float line = pow(b, 7.0);
    vec3 col = vec3(0.039) + vec3(0.95) * line * 0.17 + vec3(0.025) * b;
    gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0); // para espaço linear
  }
`;

const POST_FRAG = /* glsl */`
  precision highp float;
  uniform sampler2D tScene;
  uniform vec2  uLow;
  uniform vec2  uRes;
  uniform float uTime;
  uniform float uDim;
  uniform float uLevels;
  uniform sampler2D tGlyph;
  uniform float uAscii;
  uniform vec2  uCell;
  varying vec2 vUv;

  float bayer2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
  float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
  float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  void main(){
    vec2 c = vUv - 0.5;
    float r2 = dot(c, c);
    vec2 uv = 0.5 + c * (1.0 + 0.035 * r2);           // curvatura CRT
    vec2 px = floor(uv * uLow) + 0.5;
    vec2 suv = px / uLow;
    float ca = 0.75 / uLow.x;

    vec3 col;
    col.r = texture2D(tScene, suv + vec2(ca, 0.0)).r;
    col.g = texture2D(tScene, suv).g;
    col.b = texture2D(tScene, suv - vec2(ca, 0.0)).b;
    col = pow(max(col, 0.0), vec3(1.0 / 2.2));

    float d = bayer4(px) - 0.5;                        // dithering ordenado
    col = floor(col * uLevels + d + 0.5) / uLevels;

    // modo ASCII: cada célula vira um caractere pela luminância
    if (uAscii > 0.001) {
      vec2 fc = vUv * uRes;
      vec2 cid = floor(fc / uCell);
      vec3 sc = pow(max(texture2D(tScene, (cid + 0.5) * uCell / uRes).rgb, 0.0), vec3(1.0 / 2.2));
      float lum = dot(sc, vec3(0.299, 0.587, 0.114));
      float gi = floor(clamp(lum * 1.7, 0.0, 0.999) * 10.0);
      vec2 lc = fract(fc / uCell);
      float g = texture2D(tGlyph, vec2((gi + lc.x) / 10.0, lc.y)).r;
      vec3 tint = mix(vec3(0.9), sc / max(lum, 0.08) * 0.75, 0.45);
      col = mix(col, g * tint * (0.55 + lum), uAscii);
    }

    col *= 1.0 - uDim;
    col *= 0.9 + 0.1 * sin(vUv.y * uRes.y * 3.14159);  // scanlines
    col *= 1.0 - r2 * 0.85;                            // vinheta
    col += (hash(vUv * uRes + fract(uTime)) - 0.5) * 0.03;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) col = vec3(0.0);
    gl_FragColor = vec4(col, 1.0);
  }
`;

// Ruy Lopez após 3.Bb5 — exatamente o lance do README
const POSITION = {
  white: { a1:'r', b1:'n', c1:'b', d1:'q', e1:'k', h1:'r', b5:'b', f3:'n', a2:'p', b2:'p', c2:'p', d2:'p', e4:'p', f2:'p', g2:'p', h2:'p', f1: null },
  black: { a8:'r', c8:'b', d8:'q', e8:'k', f8:'b', g8:'n', h8:'r', c6:'n', a7:'p', b7:'p', c7:'p', d7:'p', e5:'p', f7:'p', g7:'p', h7:'p' }
};

// estados de câmera/tabuleiro por seção
const STATES = {
  hero:     { ascii: 0, cam: [0, 10, 17],    look: [0, 0, 0],   off: [4.6, 0, 0],  rotY: -0.55, sink: 0,   dim: 0.0,  spin: 0 },
  about:    { ascii: 0, cam: [9, 8, 12],     look: [0, 0, 0],   off: [4.8, 0, 0],  rotY: 0.35,  sink: 0,   dim: 0.15, spin: 0 },
  history:  { ascii: 0, cam: [0, 17, 9.5],   look: [0, 0, 0.4], off: [5.2, 0, 0],  rotY: 0.0,   sink: 1,   dim: 0.1,  spin: 0 },
  stack:    { ascii: 0, cam: [0, 10, 16],    look: [0, 0, 0],   off: [0, -1, 0],   rotY: 0.6,   sink: 1,   dim: 0.55, spin: 0.08 },
  projects: { ascii: 0, cam: [0, 6, 20],     look: [0, 1, 0],   off: [0, -1, 0],   rotY: 1.2,   sink: 0.4, dim: 0.62, spin: 0.12 },
  medals:   { ascii: 0, cam: [-8, 9, 14],    look: [0, 0, 0],   off: [-4.6, 0, 0], rotY: -0.3,  sink: 0.6, dim: 0.3,  spin: 0 },
  log:      { ascii: 0, cam: [0, 18, 3],     look: [0, 0, 0],   off: [0, 0, 0],    rotY: 0.8,   sink: 0.2, dim: 0.6,  spin: 0.05 },
  piano:    { ascii: 0, cam: [-7, 10.5, -10.5], look: [-5.2, -0.8, -30], off: [0, -0.5, 0], rotY: 0.2, sink: 1, dim: 0.05, spin: 0.04, piano: 1 },
  piano_m:  { ascii: 0, cam: [0, 15, -9], look: [0, -4.5, -30], off: [0, -0.5, 0], rotY: 0.2, sink: 1, dim: 0.05, spin: 0.04, piano: 1 },
  contact:  { ascii: 0, cam: [2, 8, 14],     look: [0, 0.5, 0], off: [4.6, 0, 0],  rotY: -0.2,  sink: 0,   dim: 0.1,  spin: 0, resign: 1 }
};

function glyphAtlas() {
  const chars = ' .:-=+*#%@', gw = 24, gh = 40;
  const c = document.createElement('canvas');
  c.width = gw * chars.length; c.height = gh;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#fff'; g.font = 'bold 34px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
  [...chars].forEach((ch, i) => g.fillText(ch, i * gw + gw / 2, gh / 2 + 2));
  const t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = false;
  return t;
}

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // a gama é aplicada no pós

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pixel = innerWidth < 760 ? 3 : 4;
  let W = innerWidth, H = innerHeight;
  const mobile = () => W < 900;

  const rt = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, type: THREE.HalfFloatType });
  const quadGeo = new THREE.PlaneGeometry(2, 2);
  const orthoCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // fundo de tinta
  const inkUniforms = {
    uTime: { value: 0 }, uRes: { value: new THREE.Vector2() }, uMouse: { value: new THREE.Vector2(9, 9) },
    uStir: { value: 0 }, uDrops: { value: Array.from({ length: 8 }, () => new THREE.Vector3(0, 0, -100)) }
  };
  const inkScene = new THREE.Scene();
  inkScene.add(new THREE.Mesh(quadGeo, new THREE.ShaderMaterial({ vertexShader: FULLSCREEN_VERT, fragmentShader: INK_FRAG, uniforms: inkUniforms, depthWrite: false })));

  // pós-processamento
  const postUniforms = {
    tScene: { value: rt.texture }, uLow: { value: new THREE.Vector2() }, uRes: { value: new THREE.Vector2() },
    uTime: { value: 0 }, uDim: { value: 0 }, uLevels: { value: 14 },
    tGlyph: { value: glyphAtlas() }, uAscii: { value: 0 }, uCell: { value: new THREE.Vector2(8, 13) }
  };
  const postScene = new THREE.Scene();
  postScene.add(new THREE.Mesh(quadGeo, new THREE.ShaderMaterial({ vertexShader: FULLSCREEN_VERT, fragmentShader: POST_FRAG, uniforms: postUniforms })));

  // cena 3D
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  scene.add(new THREE.HemisphereLight(0xdadada, 0x0a0a0a, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(-5, 10, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7 });
  scene.add(key);
  const rim = new THREE.PointLight(0xe0443a, 18, 20, 1.6);
  rim.position.set(5, 3, -5);
  scene.add(rim);

  const root = new THREE.Group();
  const board = new THREE.Group();
  root.add(board);
  scene.add(root);

  // moldura + coordenadas
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = labelCanvas.height = 512;
  const lc = labelCanvas.getContext('2d');
  lc.fillStyle = '#0d0d0d'; lc.fillRect(0, 0, 512, 512);
  lc.fillStyle = '#5a5a5a'; lc.font = 'bold 22px monospace'; lc.textAlign = 'center'; lc.textBaseline = 'middle';
  const cell = 512 / 9.4, pad = 0.7 * cell;
  for (let i = 0; i < 8; i++) {
    lc.fillText(FILES[i], pad + (i + .5) * cell, 512 - pad / 2);
    lc.fillText(String(8 - i), pad / 2, pad + (i + .5) * cell);
  }
  const labelTex = new THREE.CanvasTexture(labelCanvas);
  labelTex.colorSpace = THREE.SRGBColorSpace;
  labelTex.magFilter = THREE.NearestFilter;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(9.4, .4, 9.4), [
    new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: .9 }), new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: .9 }),
    new THREE.MeshStandardMaterial({ map: labelTex, roughness: .9 }), new THREE.MeshStandardMaterial({ color: 0x0d0d0d }),
    new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: .9 }), new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: .9 })
  ]);
  frame.position.y = -.2;
  frame.receiveShadow = true;
  board.add(frame);

  const squares = {};
  const sqGeo = new THREE.BoxGeometry(1, .2, 1);
  for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) {
    const light = (f + r) % 2 === 1;
    const m = new THREE.Mesh(sqGeo, new THREE.MeshStandardMaterial({ color: light ? 0x2e2e2e : 0x141414, roughness: .75, metalness: .05 }));
    m.position.set(f - 3.5, 0, 3.5 - r);
    m.receiveShadow = true;
    m.userData = { name: FILES[f] + (r + 1), heat: 0, visited: 0 };
    squares[m.userData.name] = m;
    board.add(m);
  }

  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xe6e6e6, roughness: .55, flatShading: true });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: .4, flatShading: true });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xe0443a, emissive: 0xe0443a, emissiveIntensity: .6 });

  const pieces = [];
  let heroKnight, blackKing;
  for (const side of ['white', 'black']) {
    for (const [s, type] of Object.entries(POSITION[side])) {
      if (!type) continue;
      const p = buildPiece(type, side === 'white' ? whiteMat : blackMat, accentMat);
      p.position.copy(sqPos(s));
      p.rotation.y = side === 'white' ? Math.PI / 2 : -Math.PI / 2;
      p.userData = { base: p.position.clone(), delay: Math.random() * .6, sink: 0 };
      board.add(p);
      if (side === 'white' && s === 'f3') heroKnight = p; else pieces.push(p);
      if (side === 'black' && type === 'k') blackKing = p;
    }
  }

  // ── piano 3D de fundo (como o tabuleiro) ──────────────────────
  const piano = new THREE.Group();
  piano.position.set(0, 0, -30);
  piano.rotation.y = 0.18;
  scene.add(piano);
  const pianoKeys = new Map();
  const isBlack = (m) => [1, 3, 6, 8, 10].includes(m % 12);
  {
    const LO = 36, HI = 84;
    const whites = []; for (let m = LO; m <= HI; m++) if (!isBlack(m)) whites.push(m);
    const half = (whites.length - 1) / 2;
    const gW = new THREE.BoxGeometry(.47, .3, 2.6); gW.translate(0, 0, 1.3);
    const gB = new THREE.BoxGeometry(.28, .34, 1.6); gB.translate(0, 0, .8);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x0a0a0a, transparent: true, opacity: .6 });
    for (let m = LO; m <= HI; m++) {
      const b = isBlack(m);
      const mat = new THREE.MeshStandardMaterial({ color: b ? 0x161616 : 0xe2e2e2, roughness: b ? .35 : .5, flatShading: true });
      const k = new THREE.Mesh(b ? gB : gW, mat);
      const wi = b ? whites.indexOf(m + 1) - .5 : whites.indexOf(m);
      k.position.set((wi - half) * .5, b ? .2 : 0, -1.3);
      k.castShadow = k.receiveShadow = true;
      if (!b) k.add(new THREE.LineSegments(new THREE.EdgesGeometry(gW), edgeMat));
      k.userData = { midi: m, target: 0, p: 0, black: b, base: mat.color.clone() };
      pianoKeys.set(m, k);
      piano.add(k);
    }
    const W = whites.length * .5 + .7;
    const caseMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: .35, metalness: .4, flatShading: true });
    const caseEdge = new THREE.LineBasicMaterial({ color: 0xf2f2f2, transparent: true, opacity: .35 });
    const part = (w, h, d, x, y, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), caseMat);
      m.position.set(x, y, z); m.receiveShadow = m.castShadow = true;
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), caseEdge));
      piano.add(m); return m;
    };
    part(W, .45, 3.6, 0, -.38, 0);                // base
    part(W, 1.0, .5, 0, .25, -1.6);               // fundo
    part(.35, .8, 3.6, -W / 2 + .17, .05, 0);      // laterais
    part(.35, .8, 3.6, W / 2 - .17, .05, 0);
    part(W, .08, .2, 0, -.12, 1.42).material = caseMat; // frente
    // estante com partitura
    const sheetC = document.createElement('canvas'); sheetC.width = 512; sheetC.height = 256;
    const sg = sheetC.getContext('2d');
    sg.fillStyle = '#e8e8e8'; sg.fillRect(0, 0, 512, 256);
    sg.strokeStyle = '#333'; sg.fillStyle = '#222'; sg.lineWidth = 2;
    for (const top of [40, 150]) {
      for (let l = 0; l < 5; l++) { sg.beginPath(); sg.moveTo(20, top + l * 12); sg.lineTo(492, top + l * 12); sg.stroke(); }
      for (let n = 0; n < 12; n++) {
        const x = 50 + n * 37, y = top + 6 + ((n * 7 + top) % 9) * 6;
        sg.beginPath(); sg.ellipse(x, y, 6, 4.5, -.4, 0, Math.PI * 2); sg.fill();
        sg.fillRect(x + 5, y - 30, 2, 30);
      }
    }
    sg.fillStyle = '#e0443a'; sg.font = 'bold 18px monospace'; sg.fillText('GYMNOPÉDIE Nº1 · SATIE', 150, 24);
    const sheetT = new THREE.CanvasTexture(sheetC); sheetT.colorSpace = THREE.SRGBColorSpace;
    const stand = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.1, .05), [caseMat, caseMat, caseMat, caseMat, new THREE.MeshStandardMaterial({ map: sheetT, roughness: .8 }), caseMat]);
    stand.position.set(0, 1.45, -1.55); stand.rotation.x = -.22;
    piano.add(stand);
  }
  const pianoMeshes = [...pianoKeys.values()];
  const SEAL = new THREE.Color(0xe0443a);
  const pianoLight = new THREE.PointLight(0xe0443a, 30, 30, 1.4);
  pianoLight.position.set(8, 5, -34);
  scene.add(pianoLight);

  // rastro do cavalo (L como no banner do README)
  const trailMat = new THREE.LineBasicMaterial({ color: 0xf2f2f2, transparent: true, opacity: .85 });
  const trail = new THREE.Line(new THREE.BufferGeometry(), trailMat);
  trail.position.y = .13;
  board.add(trail);
  const trailPts = [];

  const hop = { from: sqPos('f3'), to: sqPos('f3'), t: 1, current: 'f3' };
  function knightTo(square, withTrail = true) {
    if (square === hop.current) return;
    const a = sq(hop.current), b = sq(square);
    hop.from = heroKnight.position.clone(); hop.from.y = .1;
    hop.to = sqPos(square); hop.t = 0;
    if (withTrail) {
      if (!trailPts.length) trailPts.push(sqPos(hop.current));
      const corner = Math.abs(b.f - a.f) === 2 ? new THREE.Vector3(b.f - 3.5, .1, 3.5 - a.r) : new THREE.Vector3(a.f - 3.5, .1, 3.5 - b.r);
      trailPts.push(corner, sqPos(square));
      trail.geometry.setFromPoints(trailPts.map((p) => new THREE.Vector3(p.x, 0, p.z)));
    }
    squares[hop.current].userData.visited = 1;
    hop.current = square;
  }
  function clearTrail() { trailPts.length = 0; trail.geometry.setFromPoints([]); Object.values(squares).forEach((s) => (s.userData.visited = 0)); }

  // estado interpolado
  const cur = structuredClone(STATES.hero);
  let target = STATES.hero;
  const mouse = new THREE.Vector2(0, 0), mouseSmooth = new THREE.Vector2();
  let asciiForce = null;
  const api = {};
  let stir = 0, lastScroll = scrollY, dropIdx = 0, resign = 0;

  function resize() {
    W = innerWidth; H = innerHeight;
    renderer.setSize(W, H, false);
    const lw = Math.ceil(W / pixel), lh = Math.ceil(H / pixel);
    rt.setSize(lw, lh);
    inkUniforms.uRes.value.set(lw, lh);
    postUniforms.uLow.value.set(lw, lh);
    postUniforms.uRes.value.set(W, H);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  function ndcToInk(x, y) { const m = Math.min(W, H); return [x * W / m, y * H / m]; }
  function drop(ndcX, ndcY) {
    const [x, y] = ndcToInk(ndcX, ndcY);
    inkUniforms.uDrops.value[dropIdx++ % 8].set(x, y, inkUniforms.uTime.value);
  }
  function dropAtWorld(v) { const p = v.clone(); board.localToWorld(p); p.project(camera); drop(p.x, p.y); }

  addEventListener('pointermove', (e) => {
    mouse.set((e.clientX / W) * 2 - 1, -(e.clientY / H) * 2 + 1);
  }, { passive: true });

  const ray = new THREE.Raycaster();
  addEventListener('pointerdown', (e) => {
    if (e.target.closest('a,button,input,.card,.medal,.tile,.term,.modal')) return;
    const n = new THREE.Vector2((e.clientX / W) * 2 - 1, -(e.clientY / H) * 2 + 1);
    drop(n.x, n.y);
    ray.setFromCamera(n, camera);
    if (target.piano) {
      const k = ray.intersectObjects(pianoMeshes, false)[0];
      if (k) { api.onKey?.(k.object.userData.midi); return; }
    }
    const hit = ray.intersectObjects(Object.values(squares), false)[0];
    if (hit) hit.object.userData.heat = 1;
  });

  // tour do cavalo (easter egg / comando `play`)
  let tourTimer = null;
  function tour(on = true) {
    clearInterval(tourTimer);
    if (!on) return;
    const moves = [[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]];
    tourTimer = setInterval(() => {
      const { f, r } = sq(hop.current);
      const opts = moves.map(([df, dr]) => [f + df, r + dr]).filter(([a, b]) => a >= 0 && a < 8 && b >= 0 && b < 8)
        .map(([a, b]) => FILES[a] + (b + 1)).filter((s) => !squares[s].userData.visited);
      const next = opts.length ? opts[Math.floor(Math.random() * opts.length)] : (clearTrail(), 'f3');
      knightTo(next);
    }, 650);
  }

  const clock = new THREE.Clock();
  const tmpV = new THREE.Vector3();
  const lerp = (a, b, k) => a + (b - a) * k;

  function frame_() {
    const dt = Math.min(clock.getDelta(), .05);
    const t = clock.elapsedTime;
    const k = 1 - Math.pow(.025, dt);

    cur.ascii = lerp(cur.ascii ?? 0, asciiForce ?? target.ascii ?? 0, k * 1.4);
    for (const key of ['rotY', 'sink', 'dim', 'spin']) cur[key] = lerp(cur[key], target[key], k);
    for (const key of ['cam', 'look', 'off']) for (let i = 0; i < 3; i++) cur[key][i] = lerp(cur[key][i], target[key][i], k);
    resign = lerp(resign, target.resign || 0, k * .6);

    const sv = scrollY - lastScroll; lastScroll = scrollY;
    stir = lerp(stir, Math.min(Math.abs(sv) / 40, 3), .08);
    mouseSmooth.lerp(mouse, .08);

    // tabuleiro como carta: inclina para o mouse e flutua
    const offX = mobile() ? 0 : cur.off[0];
    root.position.set(offX, cur.off[1] + Math.sin(t * .7) * .12, cur.off[2]);
    board.rotation.y = cur.rotY + (reduced ? 0 : t * cur.spin) + mouseSmooth.x * .12;
    board.rotation.x = -mouseSmooth.y * .08 + Math.sin(t * .5) * .015;
    board.rotation.z = mouseSmooth.x * .04;

    const camBack = mobile() ? 1.35 : 1;
    camera.position.set(cur.cam[0] * camBack, cur.cam[1] * camBack, cur.cam[2] * camBack);
    camera.lookAt(tmpV.set(cur.look[0] + (mobile() ? 0 : offX * .15), cur.look[1], cur.look[2]));

    for (const p of pieces) {
      const s = Math.max(0, Math.min(1, cur.sink * 1.6 - p.userData.delay));
      p.position.y = p.userData.base.y - s * 1.4;
      p.visible = s < .99;
    }

    // salto do cavalo
    if (hop.t < 1) {
      hop.t = Math.min(1, hop.t + dt / .7);
      const e = hop.t < .5 ? 2 * hop.t * hop.t : 1 - Math.pow(-2 * hop.t + 2, 2) / 2;
      heroKnight.position.lerpVectors(hop.from, hop.to, e);
      heroKnight.position.y = .1 + Math.sin(Math.PI * hop.t) * 1.8;
      heroKnight.rotation.y = Math.PI / 2 + Math.sin(Math.PI * hop.t) * .6;
      if (hop.t === 1) { squares[hop.current].userData.heat = 1; dropAtWorld(hop.to); api.onHop?.(hop.current); }
    } else {
      heroKnight.position.y = .1 + Math.abs(Math.sin(t * 2.2)) * .06;
    }

    // teclas do piano
    for (const k of pianoMeshes) {
      const u = k.userData;
      u.p += (u.target - u.p) * Math.min(1, dt * 30);
      k.rotation.x = u.p * (u.black ? .09 : .065);
      k.material.color.copy(u.base).lerp(SEAL, u.p);
      k.material.emissive.setRGB(.9 * u.p, .2 * u.p, .15 * u.p);
    }
    piano.position.y = Math.sin(t * .6) * .1;

    // rei preto abandona: 1-0
    blackKing.rotation.z = resign * 1.45;
    blackKing.position.y = .1 + resign * .25;
    blackKing.position.x = blackKing.userData.base.x + resign * .4;

    for (const s of Object.values(squares)) {
      const u = s.userData;
      u.heat = Math.max(0, u.heat - dt * .6);
      const isCur = s.userData.name === hop.current && cur.sink > .5;
      s.material.emissive.setRGB(
        .9 * u.heat + (isCur ? .45 : 0) + u.visited * .05,
        .26 * u.heat + u.visited * .05,
        .23 * u.heat + u.visited * .05
      );
    }
    trailMat.opacity = .25 + cur.sink * .6;

    inkUniforms.uTime.value = reduced ? t * .25 : t;
    const [mx, my] = ndcToInk(mouseSmooth.x, mouseSmooth.y);
    inkUniforms.uMouse.value.set(mx, my);
    inkUniforms.uStir.value = stir;
    postUniforms.uTime.value = t;
    postUniforms.uDim.value = cur.dim + (mobile() ? .25 : 0);
    postUniforms.uAscii.value = cur.ascii < 0.02 ? 0 : cur.ascii;

    renderer.setRenderTarget(rt);
    renderer.autoClear = true;
    renderer.render(inkScene, orthoCam);
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.autoClear = true;
    renderer.render(postScene, orthoCam);
  }

  let running = true;
  renderer.setAnimationLoop(frame_);
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    renderer.setAnimationLoop(running ? frame_ : null);
    if (running) clock.getDelta();
  });

  return Object.assign(api, {
    press(m, on = true) {
      const k = pianoKeys.get(m); if (!k) return;
      k.userData.target = on ? 1 : 0;
      if (on) { const p = new THREE.Vector3(k.position.x, .3, 1.2); piano.localToWorld(p); p.project(camera); drop(p.x, p.y); }
    },
    setAscii(v) { asciiForce = v; return v; },
    get ascii() { return asciiForce; },
    setSection(name) {
      target = (mobile() && STATES[name + '_m']) || STATES[name] || STATES.hero;
      if (name === 'hero' || name === 'contact') { clearTrail(); knightTo(name === 'hero' ? 'f3' : 'g5', false); }
    },
    knightTo,
    clearTrail,
    drop,
    tour,
    setPixel(n) { pixel = Math.max(1, Math.min(12, n | 0)); resize(); return pixel; },
    setLevels(n) { postUniforms.uLevels.value = n; },
    get pixel() { return pixel; }
  });
}
