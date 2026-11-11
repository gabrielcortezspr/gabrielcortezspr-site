// ════════════════════════════════════════════════════════════════
//  medal3d.js — a medalha fica suspensa pela fita, como numa vitrine.
//  Arraste para girar (a fita torce e desfaz a torção) e para balançar
//  (pêndulo de verdade). Render pixelado com dithering, sobre tinta.
// ════════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const POST = /* glsl */`
  precision highp float;
  uniform sampler2D tScene;
  uniform vec2 uLow;
  varying vec2 vUv;
  float bayer2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
  float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
  void main(){
    vec2 px = floor(vUv * uLow);
    float ca = 0.6 / uLow.x;
    vec3 col;
    col.r = texture2D(tScene, vUv + vec2(ca, 0.0)).r;
    col.g = texture2D(tScene, vUv).g;
    col.b = texture2D(tScene, vUv - vec2(ca, 0.0)).b;
    col = pow(max(col, 0.0), vec3(1.0 / 2.2));
    col = floor(col * 14.0 + bayer4(px)) / 14.0;
    vec2 c = vUv - 0.5;
    col *= 1.0 - dot(c, c) * 0.9;
    gl_FragColor = vec4(col, 1.0);
  }
`;
// fundo: o mesmo suminagashi do site, bem escuro
const INK = /* glsl */`
  precision highp float;
  uniform float uTime;
  uniform vec2 uAspect;
  varying vec2 vUv;
  void main(){
    vec2 uv = (vUv - .5) * 2.0 * uAspect;
    float t = uTime / 14.0;
    for (float i = 1.0; i < 22.0; i++) {
      uv.x += 0.5 / i * cos(i * 4.0 * uv.y + t);
      uv.y += 0.5 / i * cos(i * 3.0 * uv.x + t);
    }
    float b = 1.0 - abs(sin(t - uv.x - uv.y));
    vec3 col = vec3(0.03) + vec3(0.9) * pow(b, 7.0) * 0.13 + vec3(0.02) * b;
    gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0);
  }
`;

const TIER = {
  trophy: { metal: 0xf2f2f2, glyph: '#e0443a', ribbon: ['#2c2c2c', '#e0443a'] },
  gold:   { metal: 0xededed, glyph: '#151515', ribbon: ['#2c2c2c', '#b8b8b8'] },
  silver: { metal: 0xa9a9a9, glyph: '#151515', ribbon: ['#2c2c2c', '#b8b8b8'] },
  bronze: { metal: 0x6c6c6c, glyph: '#f2f2f2', ribbon: ['#2c2c2c', '#b8b8b8'] },
  honor:  { metal: 0x2a2a2a, glyph: '#f2f2f2', ribbon: ['#2c2c2c', '#7a7a7a'] },
  seal:   { metal: 0x1c1c1c, glyph: '#e0443a', ribbon: ['#2c2c2c', '#e0443a'] }
};
const TIER_PT = { trophy: 'CAMPEÃO', gold: 'OURO', silver: 'PRATA', bronze: 'BRONZE', honor: 'HONRA', seal: 'EVENTO' };
const S = 1.35;       // raio da medalha
const L = 3.4;        // comprimento da fita até o aro
const TOP = 6.2;      // altura dos pontos de fixação da fita

function tex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function octagon(g, r) {
  g.beginPath();
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.PI / 8; const x = 256 + Math.cos(a) * r, y = 256 + Math.sin(a) * r; i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.closePath();
}

function buildCoin(m) {
  const tier = TIER[m.tier] || TIER.silver;
  const base = '#' + tier.metal.toString(16).padStart(6, '0');
  const face = (draw) => tex(512, 512, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, 512, 512);
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 14; octagon(g, 200); g.stroke();
    g.lineWidth = 4; octagon(g, 176); g.stroke();
    g.fillStyle = tier.glyph; g.textAlign = 'center'; g.textBaseline = 'middle';
    draw(g);
  });
  const front = face((g) => { g.font = 'bold 190px "Noto Serif JP", "JetBrains Mono", serif'; g.fillText(m.glyph, 256, 250); });
  const back = face((g) => {
    g.font = 'bold 96px "Silkscreen", monospace'; g.fillText(String(m.year), 256, 220);
    g.font = 'bold 44px "Silkscreen", monospace'; g.fillText(TIER_PT[m.tier] || '', 256, 310);
  });
  const metalness = m.tier === 'seal' || m.tier === 'honor' ? .3 : .9;
  const metal = new THREE.MeshStandardMaterial({ color: tier.metal, metalness, roughness: .3 });
  const geo = new THREE.CylinderGeometry(S, S, .3, 8, 1);
  geo.rotateY(Math.PI / 8);
  const coin = new THREE.Mesh(geo, [
    metal,
    new THREE.MeshStandardMaterial({ map: front, metalness, roughness: .33 }),
    new THREE.MeshStandardMaterial({ map: back, metalness, roughness: .33 })
  ]);
  coin.rotation.x = Math.PI / 2;           // face para a câmera
  coin.position.y = -(S + .22);            // o aro fica na origem
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.2, .055, 8, 18), metal);
  ring.position.y = -.08;
  const g = new THREE.Group();
  g.add(coin, ring);
  const ribbonTex = tex(256, 64, (c) => {
    const [a, b] = tier.ribbon;
    c.fillStyle = a; c.fillRect(0, 0, 256, 64);
    c.fillStyle = b; c.fillRect(92, 0, 72, 64);
  });
  return { group: g, ribbonMat: new THREE.MeshStandardMaterial({ map: ribbonTex, roughness: .85, side: THREE.DoubleSide }) };
}

export function createMedalStage(canvas, { onChime } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .75;
  scene.add(new THREE.HemisphereLight(0xdadada, 0x0a0a0a, .45));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(-3, 5, 6); scene.add(key);
  const rim = new THREE.PointLight(0xe0443a, 30, 16, 1.4); rim.position.set(4, 1, -3); scene.add(rim);

  const camera = new THREE.PerspectiveCamera(36, 1, .1, 60);

  // fundo de tinta (quad atrás de tudo)
  const inkMat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: INK, uniforms: { uTime: { value: 0 }, uAspect: { value: new THREE.Vector2(1, 1) } }, depthWrite: false });
  const inkScene = new THREE.Scene(); inkScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), inkMat));

  const rt = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, type: THREE.HalfFloatType });
  const post = new THREE.Scene();
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postMat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: POST, uniforms: { tScene: { value: rt.texture }, uLow: { value: new THREE.Vector2() } } });
  post.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));

  // hierarquia: pivô (pêndulo) → aro (torção/giro) → moeda
  const pivot = new THREE.Group(); pivot.position.set(0, TOP, 0); scene.add(pivot);
  const hang = new THREE.Group(); hang.position.y = -L; pivot.add(hang);
  const strips = [-1, 1].map(() => { const m = new THREE.Mesh(new THREE.BoxGeometry(.34, 1, .02)); scene.add(m); return m; });
  let coin = null;

  // estado físico
  const st = { yaw: 0, wy: 0, ax: 0, vx: 0, az: 0, vz: 0, drag: null };
  const G = 16, LEN = L + S;   // pêndulo: comprimento efetivo até o centro da moeda

  function setMedal(m) {
    if (coin) hang.remove(coin.group);
    coin = buildCoin(m);
    hang.add(coin.group);
    strips.forEach((s) => (s.material = coin.ribbonMat));
    // entra girando e balançando de leve
    Object.assign(st, { yaw: -1.1, wy: 2.6, ax: .1, vx: 0, az: -.14, vz: .3 });
  }
  function spin() { st.wy += (Math.random() < .5 ? -1 : 1) * 11; st.vz += (Math.random() - .5) * .8; onChime && onChime(.8); }

  // arrastar: horizontal gira, vertical balança para frente/trás
  canvas.addEventListener('pointerdown', (e) => {
    st.drag = { x: e.clientX, y: e.clientY, t: performance.now() };
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('grabbing');
  });
  canvas.addEventListener('pointermove', (e) => {
    const d = st.drag; if (!d) return;
    const now = performance.now(), dt = Math.max(8, now - d.t) / 1000;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    const k = 700 / Math.max(400, canvas.clientWidth);
    st.wy = st.wy * .5 + (dx / dt) * .012 * k;
    st.vz += -dx * .0016 * k;
    st.vx += dy * .0022 * k;
    Object.assign(d, { x: e.clientX, y: e.clientY, t: now });
  });
  const release = () => {
    if (st.drag && Math.abs(st.wy) > 6) onChime && onChime(Math.min(1, Math.abs(st.wy) / 25));
    st.drag = null; canvas.classList.remove('grabbing');
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  function step(dt) {
    // fita torcida volta ao repouso; atrito do ar
    st.wy += (-1.1 * st.yaw - .45 * st.wy) * dt;
    st.yaw += st.wy * dt;
    // pêndulo em dois eixos
    st.vx += (-(G / LEN) * Math.sin(st.ax) - .35 * st.vx) * dt;
    st.vz += (-(G / LEN) * Math.sin(st.az) - .35 * st.vz) * dt;
    st.ax = Math.max(-.9, Math.min(.9, st.ax + st.vx * dt));
    st.az = Math.max(-.9, Math.min(.9, st.az + st.vz * dt));
  }

  const ringW = new THREE.Vector3(), anchor = new THREE.Vector3(), dir = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  function layout() {
    pivot.rotation.set(st.ax, 0, st.az);
    hang.rotation.y = st.yaw;
    hang.updateWorldMatrix(true, false);
    ringW.setFromMatrixPosition(hang.matrixWorld);
    // duas fitas em V até os pontos de fixação; acompanham a torção
    strips.forEach((s, i) => {
      anchor.set((i ? 1 : -1) * .85, TOP + 1, 0);
      const side = new THREE.Vector3((i ? 1 : -1) * .14, 0, 0).applyAxisAngle(up, st.yaw * .6);
      const a = ringW.clone().add(side);
      dir.subVectors(anchor, a);
      const len = dir.length();
      s.scale.set(1, len, 1);
      s.position.copy(a).addScaledVector(dir, .5);
      s.quaternion.setFromUnitVectors(up, dir.normalize());
      s.rotateY(st.yaw * .5 + (i ? .25 : -.25));
    });
  }

  let W = 1, H = 1;
  function resize() {
    W = canvas.clientWidth || 1; H = canvas.clientHeight || 1;
    renderer.setSize(W, H, false);
    const lw = Math.ceil(W / 3), lh = Math.ceil(H / 3);
    rt.setSize(lw, lh);
    postMat.uniforms.uLow.value.set(lw, lh);
    inkMat.uniforms.uAspect.value.set(W > H ? W / H : 1, W > H ? 1 : H / W);
    camera.aspect = W / H;
    const portrait = W < H;
    camera.position.set(0, 2.1, portrait ? 18 : 10.5);
    camera.lookAt(0, portrait ? 2.6 : 2.1, 0);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  resize();

  const clock = new THREE.Clock();
  let acc = 0, running = true;
  renderer.setAnimationLoop(() => {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), .05);
    acc += dt;
    const h = 1 / 240;
    while (acc >= h) { step(h); acc -= h; }
    layout();
    inkMat.uniforms.uTime.value = clock.elapsedTime;
    renderer.setRenderTarget(rt);
    renderer.autoClear = true;
    renderer.render(inkScene, ortho);
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.autoClear = true;
    renderer.render(post, ortho);
  });

  return {
    setMedal, spin,
    pause(p) { running = !p; if (!p) clock.getDelta(); },
    get state() { return st; },
    dispose() { running = false; renderer.setAnimationLoop(null); ro.disconnect(); renderer.dispose(); rt.dispose(); pmrem.dispose(); }
  };
}
