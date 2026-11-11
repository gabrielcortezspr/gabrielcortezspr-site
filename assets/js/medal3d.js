// ════════════════════════════════════════════════════════════════
//  medal3d.js — a medalha vira um objeto 3D pixelado com física.
//  Cai num tabuleiro, quica, tomba e assenta. Dá para agarrar com o
//  mouse/dedo (mola presa no ponto agarrado), sacudir e arremessar.
//  Física própria: corpo rígido simples (posição, velocidade,
//  quaternion, velocidade angular) com contatos por pontos de amostra.
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
    col *= 1.0 - dot(c, c) * 0.8;
    gl_FragColor = vec4(col, 1.0);
  }
`;

// tons por categoria (mesma escala de tinta do site)
const TIER = {
  trophy: { metal: 0xf2f2f2, glyph: '#e0443a', ribbon: ['#3a3a3a', '#e0443a'] },
  gold:   { metal: 0xededed, glyph: '#151515', ribbon: ['#3a3a3a', '#b8b8b8'] },
  silver: { metal: 0xa9a9a9, glyph: '#151515', ribbon: ['#3a3a3a', '#b8b8b8'] },
  bronze: { metal: 0x6c6c6c, glyph: '#f2f2f2', ribbon: ['#3a3a3a', '#b8b8b8'] },
  honor:  { metal: 0x2a2a2a, glyph: '#f2f2f2', ribbon: ['#3a3a3a', '#7a7a7a'] },
  seal:   { metal: 0x1c1c1c, glyph: '#e0443a', ribbon: ['#3a3a3a', '#e0443a'] }
};
const SIZE = 1.5; // escala da medalha no mundo
const TIER_PT = { trophy: 'CAMPEÃO', gold: 'OURO', silver: 'PRATA', bronze: 'BRONZE', honor: 'HONRA', seal: 'EVENTO' };

function faceTex(draw) {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  draw(g);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function octagon(g, r) {
  g.beginPath();
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.PI / 8; const x = 256 + Math.cos(a) * r, y = 256 + Math.sin(a) * r; i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.closePath();
}

function buildMedal(m) {
  const tier = TIER[m.tier] || TIER.silver;
  const base = '#' + tier.metal.toString(16).padStart(6, '0');
  const front = faceTex((g) => {
    g.fillStyle = base; g.fillRect(0, 0, 512, 512);
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 14; octagon(g, 200); g.stroke();
    g.lineWidth = 4; octagon(g, 176); g.stroke();
    g.fillStyle = tier.glyph; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'bold 190px "Noto Serif JP", "JetBrains Mono", serif'; g.fillText(m.glyph, 256, 250);
  });
  const back = faceTex((g) => {
    g.fillStyle = base; g.fillRect(0, 0, 512, 512);
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 14; octagon(g, 200); g.stroke();
    g.fillStyle = tier.glyph; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'bold 96px "Silkscreen", monospace'; g.fillText(String(m.year), 256, 220);
    g.font = 'bold 44px "Silkscreen", monospace'; g.fillText(TIER_PT[m.tier] || '', 256, 310);
  });
  const metal = new THREE.MeshStandardMaterial({ color: tier.metal, metalness: m.tier === 'seal' || m.tier === 'honor' ? .3 : .9, roughness: .32 });
  // moeda octogonal (como no site): Cylinder com 8 lados, eixo = y local
  const geo = new THREE.CylinderGeometry(1, 1, .24, 8, 1);
  geo.rotateY(Math.PI / 8);
  const coin = new THREE.Mesh(geo, [
    metal,
    new THREE.MeshStandardMaterial({ map: front, metalness: metal.metalness, roughness: .35 }),
    new THREE.MeshStandardMaterial({ map: back, metalness: metal.metalness, roughness: .35 })
  ]);
  // aro + fita presa no topo (no plano da moeda)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.16, .045, 8, 16), metal);
  ring.rotation.y = Math.PI / 2; ring.position.set(0, 0, -1.08);
  const ribbonTex = faceTex((g) => {
    const [a, b] = tier.ribbon;
    g.fillStyle = a; g.fillRect(0, 0, 512, 512);
    g.fillStyle = b; g.fillRect(170, 0, 172, 512);
  });
  ribbonTex.wrapS = THREE.RepeatWrapping;
  const ribbon = new THREE.Mesh(new THREE.BoxGeometry(.55, .03, 1.3), new THREE.MeshStandardMaterial({ map: ribbonTex, roughness: .8 }));
  ribbon.position.set(0, 0, -1.85);
  const group = new THREE.Group();
  group.add(coin, ring, ribbon);
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  // pontos de contato (espaço local): bordas das duas faces + ponta da fita
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + Math.PI / 8;
    for (const y of [-.12, .12]) pts.push(new THREE.Vector3(Math.cos(a), y, Math.sin(a)));
  }
  for (const x of [-.27, .27]) for (const y of [-.02, .02]) pts.push(new THREE.Vector3(x, y, -2.5));
  group.scale.setScalar(SIZE);
  pts.forEach((p) => p.multiplyScalar(SIZE));
  return { group, pts, coin };
}

// tabuleiro de xadrez como chão
function buildFloor() {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(1.25, .3, 1.25);
  const light = new THREE.MeshStandardMaterial({ color: 0x2e2e2e, roughness: .7 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: .7 });
  for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) {
    const s = new THREE.Mesh(geo, (f + r) % 2 ? light : dark);
    s.position.set((f - 3.5) * 1.25, -.15, (r - 3.5) * 1.25);
    s.receiveShadow = true;
    g.add(s);
  }
  const frame = new THREE.Mesh(new THREE.BoxGeometry(10.6, .5, 10.6), new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: .6 }));
  frame.position.y = -.3; frame.receiveShadow = true;
  g.add(frame);
  return g;
}

export function createMedalStage(canvas, { onImpact } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070707);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .7;
  scene.add(new THREE.HemisphereLight(0xdadada, 0x0a0a0a, .5));
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(-4, 9, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 });
  scene.add(key);
  const rim = new THREE.PointLight(0xe0443a, 25, 18, 1.5);
  rim.position.set(5, 3, -5);
  scene.add(rim);
  scene.add(buildFloor());

  const camera = new THREE.PerspectiveCamera(38, 1, .1, 60);
  camera.position.set(0, 7.2, 8);
  camera.lookAt(0, .3, 0);

  const rt = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, type: THREE.HalfFloatType });
  const post = new THREE.Scene();
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postMat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: POST, uniforms: { tScene: { value: rt.texture }, uLow: { value: new THREE.Vector2() } } });
  post.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));

  // ── corpo rígido ──
  const B = {
    pos: new THREE.Vector3(), vel: new THREE.Vector3(),
    q: new THREE.Quaternion(), w: new THREE.Vector3(),
    obj: null, pts: [], grab: null
  };
  const BOUND = { x: 4.6, z: 4.2, top: 9 };
  const GRAV = -22, REST = .38, FRIC = .55, I = .6 * SIZE * SIZE;

  function setMedal(m) {
    if (B.obj) { scene.remove(B.obj.group); }
    B.obj = buildMedal(m);
    B.pts = B.obj.pts;
    scene.add(B.obj.group);
    drop();
  }
  function drop() {
    B.pos.set((Math.random() - .5) * 2, 4.2, (Math.random() - .5) * 1.5);
    B.vel.set((Math.random() - .5) * 3, -2, (Math.random() - .5) * 2);
    B.q.setFromEuler(new THREE.Euler(Math.PI / 2 + (Math.random() - .5), Math.random() * Math.PI, (Math.random() - .5) * .8));
    B.w.set((Math.random() - .5) * 8, (Math.random() - .5) * 4, (Math.random() - .5) * 8);
  }

  const tmp = new THREE.Vector3(), r = new THREE.Vector3(), vp = new THREE.Vector3(), imp = new THREE.Vector3();
  function applyImpulseAt(worldPoint, J) { // J em "velocidade": massa unitária
    B.vel.add(J);
    r.subVectors(worldPoint, B.pos);
    B.w.add(tmp.crossVectors(r, J).multiplyScalar(1 / I));
  }
  function pointVel(worldPoint, out) {
    r.subVectors(worldPoint, B.pos);
    return out.crossVectors(B.w, r).add(B.vel);
  }
  let lastImpact = 0;
  function contact(axis, limit, sign, t) {
    // sign = +1: limite inferior (chão / parede negativa); -1: limite superior
    let deepest = null, depth = 0;
    for (const p of B.pts) {
      tmp.copy(p).applyQuaternion(B.q).add(B.pos);
      const d = sign * (limit - tmp[axis]);
      if (d > depth) { depth = d; deepest = tmp.clone(); }
    }
    if (!deepest) return false;
    B.pos[axis] += sign * depth;
    deepest[axis] += sign * depth;
    pointVel(deepest, vp);
    const vn = vp[axis] * sign;
    if (vn < 0) {
      const n = new THREE.Vector3(); n[axis] = sign;
      r.subVectors(deepest, B.pos);
      // impulso normal com a massa efetiva no ponto: 1 / (1/m + |r×n|²/I)
      const rn = tmp.crossVectors(r, n).lengthSq();
      const e = -vn > 1.5 ? REST : 0;
      const jn = -(1 + e) * vn / (1 + rn / I);
      imp.copy(n).multiplyScalar(jn);
      applyImpulseAt(deepest, imp);
      // atrito de Coulomb, limitado por μ·jn
      pointVel(deepest, vp);
      const vt = vp.clone().addScaledVector(n, -vp.dot(n));
      const vtl = vt.length();
      if (vtl > 1e-5) {
        const tdir = vt.divideScalar(vtl);
        r.subVectors(deepest, B.pos);
        const rt2 = tmp.crossVectors(r, tdir).lengthSq();
        const jt = Math.min(vtl / (1 + rt2 / I), FRIC * jn);
        applyImpulseAt(deepest, tdir.multiplyScalar(-jt));
      }
      if (-vn > 2.5 && t - lastImpact > .08) { lastImpact = t; onImpact && onImpact(Math.min(1, -vn / 14)); }
    }
    return true;
  }

  const plane = new THREE.Plane(), hit = new THREE.Vector3(), ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let W = 1, H = 1;
  function toNdc(e) { const b = canvas.getBoundingClientRect(); ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1); }
  const target = new THREE.Vector3();
  canvas.addEventListener('pointerdown', (e) => {
    toNdc(e);
    ray.setFromCamera(ndc, camera);
    const h = B.obj && ray.intersectObject(B.obj.group, true)[0];
    if (h) {
      const local = h.point.clone().sub(B.pos).applyQuaternion(B.q.clone().invert());
      plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()).negate(), h.point);
      B.grab = { local };
      target.copy(h.point);
      canvas.setPointerCapture(e.pointerId);
      canvas.classList.add('grabbing');
    } else {
      // tocar no tabuleiro dá um peteleco na medalha
      const dir = B.pos.clone().sub(camera.position).setY(0).normalize();
      B.vel.add(new THREE.Vector3(dir.x * 3, 9, dir.z * 3));
      B.w.add(new THREE.Vector3((Math.random() - .5) * 14, (Math.random() - .5) * 6, (Math.random() - .5) * 14));
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    toNdc(e);
    if (!B.grab) {
      ray.setFromCamera(ndc, camera);
      canvas.classList.toggle('can-grab', !!(B.obj && ray.intersectObject(B.obj.group, true)[0]));
      return;
    }
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(plane, hit)) {
      target.copy(hit);
      target.y = Math.max(.3, Math.min(BOUND.top, target.y));
      target.x = Math.max(-BOUND.x, Math.min(BOUND.x, target.x));
      target.z = Math.max(-BOUND.z, Math.min(BOUND.z, target.z));
    }
  });
  const release = () => { B.grab = null; canvas.classList.remove('grabbing'); };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  function step(dt, t) {
    if (B.grab) {
      // mola + amortecedor presos no ponto agarrado → a medalha balança pela fita
      const gp = B.grab.local.clone().applyQuaternion(B.q).add(B.pos);
      const F = target.clone().sub(gp).multiplyScalar(140);
      F.addScaledVector(pointVel(gp, vp), -14);
      F.y -= GRAV * .85; // compensa parte da gravidade
      applyImpulseAt(gp, F.multiplyScalar(dt));
      B.w.multiplyScalar(1 - dt * 2.5);
    }
    B.vel.y += GRAV * dt;
    B.vel.multiplyScalar(1 - dt * .15);
    B.w.multiplyScalar(1 - dt * .35);
    B.pos.addScaledVector(B.vel, dt);
    const wl = B.w.length();
    if (wl > 1e-6) B.q.premultiply(new THREE.Quaternion().setFromAxisAngle(tmp.copy(B.w).divideScalar(wl), wl * dt)).normalize();

    const onFloor = contact('y', 0, 1, t);
    contact('x', -BOUND.x, 1, t); contact('x', BOUND.x, -1, t);
    contact('z', -BOUND.z, 1, t); contact('z', BOUND.z, -1, t);

    if (onFloor && !B.grab) {
      // atrito de rolamento e assentamento: a moeda tende a deitar numa das faces
      B.vel.x *= 1 - dt * 2.2; B.vel.z *= 1 - dt * 2.2;
      B.w.multiplyScalar(1 - dt * 2.6);
      const axis = new THREE.Vector3(0, 1, 0).applyQuaternion(B.q);
      const up = new THREE.Vector3(0, axis.y >= 0 ? 1 : -1, 0);
      const corr = tmp.crossVectors(axis, up);
      if (B.vel.length() < 2.5) B.w.addScaledVector(corr, dt * 26);
    }
  }

  function resize() {
    W = canvas.clientWidth || 1; H = canvas.clientHeight || 1;
    renderer.setSize(W, H, false);
    const px = 3;
    rt.setSize(Math.ceil(W / px), Math.ceil(H / px));
    postMat.uniforms.uLow.value.set(Math.ceil(W / px), Math.ceil(H / px));
    camera.aspect = W / H;
    camera.position.set(0, W < H ? 19 : 7.2, W < H ? 15 : 8);
    camera.lookAt(0, .3, 0);
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
    while (acc >= h) { step(h, clock.elapsedTime); acc -= h; }
    if (B.obj) { B.obj.group.position.copy(B.pos); B.obj.group.quaternion.copy(B.q); }
    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(post, ortho);
  });

  return {
    setMedal, drop,
    shake() { B.vel.add(new THREE.Vector3((Math.random() - .5) * 8, 12, (Math.random() - .5) * 6)); B.w.add(new THREE.Vector3((Math.random() - .5) * 20, (Math.random() - .5) * 10, (Math.random() - .5) * 20)); },
    pause(p) { running = !p; if (!p) clock.getDelta(); },
    get body() { return B; },
    dispose() { running = false; renderer.setAnimationLoop(null); ro.disconnect(); renderer.dispose(); rt.dispose(); pmrem.dispose(); }
  };
}
