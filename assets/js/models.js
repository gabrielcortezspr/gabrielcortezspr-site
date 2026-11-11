// ════════════════════════════════════════════════════════════════
//  models.js — modelos 3D "virtuais" de cada projeto.
//  Mesmo idioma visual do tabuleiro: corpos escuros, arestas de luz,
//  acento vermelho, grade no chão, render em baixa resolução + dithering.
//  Um único WebGLRenderer desenha todas as cartas (copiado para <canvas> 2D).
// ════════════════════════════════════════════════════════════════
import * as THREE from 'three';

// ── peças de xadrez (compartilhadas com a cena principal) ───────
const V = (r, y) => new THREE.Vector2(r, y);
const PROFILES = {
  p: [V(0,0),V(.38,0),V(.38,.07),V(.30,.13),V(.26,.17),V(.18,.23),V(.13,.48),V(.22,.53),V(.22,.57),V(.12,.60),V(.18,.67),V(.21,.76),V(.18,.86),V(.10,.92),V(0,.94)],
  b: [V(0,0),V(.38,0),V(.38,.07),V(.30,.12),V(.26,.16),V(.18,.22),V(.12,.62),V(.22,.67),V(.22,.71),V(.12,.74),V(.17,.84),V(.19,.96),V(.15,1.07),V(.08,1.14),V(.05,1.16),V(.07,1.20),V(0,1.24)],
  r: [V(0,0),V(.40,0),V(.40,.08),V(.32,.14),V(.28,.20),V(.22,.62),V(.32,.67),V(.32,.90),V(.24,.90),V(.24,.84),V(0,.84)],
  q: [V(0,0),V(.40,0),V(.40,.08),V(.31,.14),V(.27,.19),V(.18,.26),V(.12,.78),V(.24,.83),V(.24,.87),V(.14,.90),V(.20,1.10),V(.27,1.22),V(.18,1.20),V(.10,1.24),V(0,1.25)],
  k: [V(0,0),V(.40,0),V(.40,.08),V(.31,.14),V(.27,.19),V(.18,.26),V(.13,.84),V(.25,.89),V(.25,.93),V(.15,.96),V(.22,1.16),V(.25,1.26),V(0,1.26)],
  base: [V(0,0),V(.38,0),V(.38,.08),V(.31,.14),V(.27,.20),V(.20,.24),V(0,.24)]
};

function knightHead() {
  const pts = [[-.30,0],[.32,0],[.28,.22],[.22,.42],[.30,.60],[.38,.80],[.36,.96],[.25,1.10],[.12,1.18],[.07,1.30],[-.01,1.19],[-.15,1.12],[-.32,1.00],[-.46,.86],[-.49,.76],[-.41,.69],[-.25,.73],[-.11,.66],[-.20,.46],[-.30,.24]];
  const shape = new THREE.Shape();
  pts.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: .2, bevelEnabled: true, bevelThickness: .05, bevelSize: .04, bevelSegments: 1 });
  g.translate(0, 0, -.1);
  g.scale(.62, .62, 1);
  return g;
}

export function buildPiece(type, mat, accentMat) {
  const g = new THREE.Group();
  const add = (geo, m = mat) => { const mesh = new THREE.Mesh(geo, m); mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh); return mesh; };
  if (type === 'n') {
    add(new THREE.LatheGeometry(PROFILES.base, 20));
    const head = add(knightHead()); head.position.y = .2;
    const eye = add(new THREE.BoxGeometry(.06, .06, .3), accentMat); eye.position.set(-.06, .78, 0);
  } else {
    add(new THREE.LatheGeometry(PROFILES[type], 20));
    if (type === 'k') {
      add(new THREE.BoxGeometry(.07, .26, .07)).position.y = 1.38;
      add(new THREE.BoxGeometry(.2, .07, .07)).position.y = 1.4;
    }
    if (type === 'q') add(new THREE.SphereGeometry(.07, 8, 6)).position.y = 1.3;
    if (type === 'b') add(new THREE.SphereGeometry(.05, 6, 4)).position.y = 1.24;
    if (type === 'r') for (let i = 0; i < 4; i++) {
      const m = add(new THREE.BoxGeometry(.12, .1, .12));
      const a = i * Math.PI / 2 + Math.PI / 4;
      m.position.set(Math.cos(a) * .22, .95, Math.sin(a) * .22);
    }
  }
  g.scale.setScalar(.82);
  return g;
}

// ── shader de tinta (mesmo do fundo) ────────────────────────────
export const INK_GLSL = /* glsl */`
  float suminagashi(vec2 uv, float time){
    float t = time / 12.0;
    for (float i = 1.0; i < 30.0; i++) {
      uv.x += 0.5 / i * cos(i * 4.0 * uv.y + t);
      uv.y += 0.5 / i * cos(i * 3.0 * uv.x + t);
    }
    return 1.0 - abs(sin(t - uv.x - uv.y));
  }
`;

const DITHER_FRAG = /* glsl */`
  precision highp float;
  uniform sampler2D tScene;
  uniform vec2 uLow;
  varying vec2 vUv;
  float bayer2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
  float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
  void main(){
    vec3 col = pow(max(texture2D(tScene, vUv).rgb, 0.0), vec3(1.0 / 2.2));
    vec2 px = floor(vUv * uLow);
    col = floor(col * 12.0 + bayer4(px) - 0.5 + 0.5) / 12.0;
    gl_FragColor = vec4(col, 1.0);
  }
`;

// ── materiais e utilitários ─────────────────────────────────────
const MAT = {};
function mats() {
  if (MAT.body) return MAT;
  MAT.body = new THREE.MeshStandardMaterial({ color: 0x3c3c3c, roughness: .5, metalness: .3, flatShading: true });
  MAT.dark = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: .8, flatShading: true });
  MAT.metal = new THREE.MeshStandardMaterial({ color: 0xa8a8a8, roughness: .3, metalness: .85, flatShading: true });
  MAT.light = new THREE.MeshStandardMaterial({ color: 0xe6e6e6, roughness: .5, flatShading: true });
  MAT.accent = new THREE.MeshStandardMaterial({ color: 0xe0443a, emissive: 0xe0443a, emissiveIntensity: .9 });
  MAT.glow = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf2f2f2, emissiveIntensity: .7 });
  MAT.screen = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: 0x1c1c1c, roughness: .2 });
  MAT.edge = new THREE.LineBasicMaterial({ color: 0xf2f2f2, transparent: true, opacity: .7 });
  MAT.edgeA = new THREE.LineBasicMaterial({ color: 0xe0443a, transparent: true, opacity: .9 });
  return MAT;
}
function edges(mesh, mat = MAT.edge, angle = 25) {
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, angle), mat));
  return mesh;
}
function box(w, h, d, mat = MAT.body, e = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  return e ? edges(m) : m;
}
function at(obj, x, y, z, parent) { obj.position.set(x, y, z); parent && parent.add(obj); return obj; }
const loop = (t, p) => ((t % p) + p) % p;

// ── modelos ─────────────────────────────────────────────────────
// cada um: () => { group, update(t), dist?, lookY? }
const MODELS = {
  // BusFlow: placa ESP32 DevKit + sensor ultrassônico + pacotes MQTT subindo
  esp32() {
    const g = new THREE.Group();
    const board = new THREE.Group(); g.add(board);
    at(box(2.8, .08, 1.1, MAT.dark), 0, 0, 0, board);
    at(box(.86, .14, .72, MAT.metal), .6, .11, 0, board);                     // shield WROOM
    at(box(.3, .02, .68, MAT.dark), 1.22, .06, 0, board);
    const ant = new THREE.Line(new THREE.BufferGeometry().setFromPoints(
      [[1.1, .3], [1.3, .3], [1.3, .18], [1.12, .18], [1.12, .06], [1.3, .06], [1.3, -.06], [1.12, -.06], [1.12, -.18], [1.3, -.18], [1.3, -.3]]
        .map(([x, z]) => new THREE.Vector3(x, .075, z))), MAT.edgeA);
    board.add(ant);
    at(box(.22, .12, .32, MAT.metal), -1.36, .1, 0, board);                   // micro-usb
    at(box(.12, .1, .12, MAT.light), -1.05, .09, .33, board);                 // EN / BOOT
    at(box(.12, .1, .12, MAT.light), -1.05, .09, -.33, board);
    at(box(.22, .06, .22, MAT.body), -.4, .07, .12, board);                   // regulador
    const led = at(new THREE.Mesh(new THREE.BoxGeometry(.08, .05, .06), MAT.accent), -.75, .07, -.3, board);
    for (const z of [-.47, .47]) {
      at(box(2.45, .1, .1, MAT.dark), 0, -.09, z, board);                     // headers
      const pins = new THREE.InstancedMesh(new THREE.BoxGeometry(.03, .26, .03), MAT.metal, 19);
      const m4 = new THREE.Matrix4();
      for (let i = 0; i < 19; i++) pins.setMatrixAt(i, m4.makeTranslation(-1.14 + i * .127, -.22, z));
      board.add(pins);
    }
    // HC-SR04 ao lado
    const sonar = new THREE.Group(); at(sonar, -.2, .55, -1.25, g);
    at(box(1.2, .5, .06, MAT.body), 0, 0, 0, sonar);
    for (const x of [-.32, .32]) {
      const c = edges(new THREE.Mesh(new THREE.CylinderGeometry(.19, .19, .22, 14), MAT.metal));
      c.rotation.x = Math.PI / 2; at(c, x, 0, .12, sonar);
    }
    // pacotes MQTT
    const packets = [0, 1, 2].map(() => at(box(.1, .1, .1, MAT.accent, false), 1.2, 0, 0, g));
    board.rotation.y = -.25;
    return {
      group: g, dist: 1.05, lookY: .1,
      update(t) {
        led.visible = Math.floor(t * 2) % 2 === 0;
        packets.forEach((p, i) => {
          const k = loop(t * .6 + i / 3, 1);
          p.position.set(1.05 + Math.sin(k * 6 + i) * .1, .2 + k * 1.6, .1 * i);
          p.rotation.set(k * 4, k * 3, 0);
          p.scale.setScalar(1 - k * .7);
        });
      }
    };
  },

  // NarraTer: dois terminais flutuando, ligados por uma aresta onde a mensagem viaja
  narrater() {
    const g = new THREE.Group();
    const screens = [-1, 1].map((s) => {
      const term = new THREE.Group();
      at(box(1.35, .95, .08, MAT.body), 0, 0, 0, term);
      at(new THREE.Mesh(new THREE.PlaneGeometry(1.2, .8), MAT.screen), 0, 0, .045, term);
      const lines = [0, 1, 2, 3, 4].map((i) => {
        const l = new THREE.Mesh(new THREE.PlaneGeometry(1, .06), i === 0 ? MAT.accent : MAT.glow);
        l.geometry.translate(.5, 0, 0);
        return at(l, -.52, .28 - i * .13, .05, term);
      });
      at(box(.08, .5, .08, MAT.body), 0, -.72, 0, term);
      at(box(.6, .05, .35, MAT.body), 0, -.98, 0, term);
      term.position.set(s * 1.3, .5, 0);
      term.rotation.y = -s * .38;
      g.add(term);
      return { term, lines, s };
    });
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-.65, .5, .2), new THREE.Vector3(0, 1.35, .45), new THREE.Vector3(.65, .5, .2)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 30, .018, 5), MAT.glow));
    const nodeA = at(new THREE.Mesh(new THREE.OctahedronGeometry(.07), MAT.light), -.65, .5, .2, g);
    const nodeB = at(new THREE.Mesh(new THREE.OctahedronGeometry(.07), MAT.light), .65, .5, .2, g);
    const pulse = at(new THREE.Mesh(new THREE.OctahedronGeometry(.1), MAT.accent), 0, 0, 0, g);
    return {
      group: g, dist: .9, lookY: .45, baseRot: 0,
      update(t) {
        const p = loop(t, 6);
        // ida (claude → codex) e volta (resposta)
        const k = p < 3 ? p / 3 : 1 - (p - 3) / 3;
        pulse.position.copy(curve.getPoint(Math.min(1, Math.max(0, (k - .1) / .8))));
        pulse.rotation.y = t * 4;
        nodeA.rotation.y = nodeB.rotation.y = t;
        screens.forEach(({ lines, s }, si) => {
          const active = (si === 0) === (p < 3);
          lines.forEach((l, i) => {
            const typed = active ? Math.min(1, Math.max(0.02, (loop(p, 3) * 2.2 - i * .35))) : [.7, .45, .8, .3, .55][i];
            l.scale.x = typed * [.55, .9, .7, .8, .4][i];
          });
        });
      }
    };
  },

  // Pro-Link: troféu de campeão com as evidências (ART/CAT) orbitando
  trophy() {
    const g = new THREE.Group();
    const prof = [V(0, 0), V(.62, 0), V(.62, .14), V(.48, .14), V(.48, .26), V(.12, .3), V(.1, .62), V(.2, .72), V(.14, .8), V(.36, .9), V(.62, 1.55), V(.56, 1.57), V(.3, 1.0), V(0, .96)];
    const cup = edges(new THREE.Mesh(new THREE.LatheGeometry(prof, 18), MAT.metal), MAT.edge, 30);
    g.add(cup);
    for (const s of [-1, 1]) {
      const h = new THREE.Mesh(new THREE.TorusGeometry(.24, .04, 6, 14, Math.PI), MAT.metal);
      h.rotation.z = -s * Math.PI / 2; at(h, s * .55, 1.25, 0, g);
    }
    const star = new THREE.Shape();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? .07 : .17, a = i / 10 * Math.PI * 2 + Math.PI / 2; i ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : star.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const st = at(new THREE.Mesh(new THREE.ExtrudeGeometry(star, { depth: .05, bevelEnabled: false }), MAT.accent), 0, 1.95, 0, g);
    const docs = [0, 1, 2].map((i) => {
      const d = new THREE.Group();
      at(box(.4, .52, .02, MAT.light), 0, 0, 0, d);
      for (let k = 0; k < 4; k++) at(new THREE.Mesh(new THREE.PlaneGeometry(.26 - (k % 2) * .08, .03), MAT.dark), -.02, .14 - k * .09, .012, d);
      g.add(d); return d;
    });
    return {
      group: g, dist: 1.15, lookY: .95, spinFull: true,
      update(t) {
        st.rotation.y = t * 2;
        docs.forEach((d, i) => {
          const a = t * .7 + i * 2.094;
          d.position.set(Math.cos(a) * 1.25, .8 + Math.sin(t + i) * .15, Math.sin(a) * 1.25);
          d.rotation.y = -a + Math.PI / 2;
        });
      }
    };
  },

  // Tabletop: o cavalo saltando num mini-tabuleiro
  knight() {
    const g = new THREE.Group();
    const sq = [];
    for (let f = 0; f < 4; f++) for (let r = 0; r < 4; r++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(.5, .1, .5), new THREE.MeshStandardMaterial({ color: (f + r) % 2 ? 0x2e2e2e : 0x141414, roughness: .7 }));
      at(edges(m, MAT.edge), (f - 1.5) * .5, 0, (r - 1.5) * .5, g); sq.push(m);
    }
    const kn = buildPiece('n', MAT.light, MAT.accent);
    kn.scale.setScalar(.75); g.add(kn);
    const path = [[0, 0], [1, 2], [3, 3], [2, 1], [0, 2], [1, 0], [3, 1], [2, 3]];
    return {
      group: g, dist: .78, lookY: .35, spinFull: true,
      update(t) {
        const n = Math.floor(t / 1.4), p = Math.min(1, loop(t, 1.4) / .6);
        const [a, b] = [path[n % path.length], path[(n + 1) % path.length]];
        const x = (a[0] + (b[0] - a[0]) * p - 1.5) * .5, z = (a[1] + (b[1] - a[1]) * p - 1.5) * .5;
        kn.position.set(x, .05 + Math.sin(Math.PI * p) * .6, z);
        kn.rotation.y = Math.PI / 2 + Math.sin(Math.PI * p) * .5;
        sq.forEach((m, i) => m.material.emissive.setRGB(0, 0, 0));
        const s = sq[b[0] * 4 + b[1]]; if (p >= 1) s.material.emissive.setRGB(.5, .12, .1);
      }
    };
  },

  // Estufa FPGA: chip Cyclone IV + estufa em arame com mudas crescendo
  greenhouse() {
    const g = new THREE.Group();
    const chip = new THREE.Group(); at(chip, 0, 0, .55, g);
    at(box(1.1, .12, 1.1, MAT.dark), 0, 0, 0, chip);
    at(box(.55, .03, .55, MAT.metal), 0, .075, 0, chip);
    const pins = new THREE.InstancedMesh(new THREE.BoxGeometry(.04, .03, .1), MAT.metal, 40);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < 40; i++) {
      const side = Math.floor(i / 10), k = (i % 10 - 4.5) * .1;
      const pos = [[k, 0, .6], [k, 0, -.6], [.6, 0, k], [-.6, 0, k]][side];
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), side > 1 ? Math.PI / 2 : 0);
      pins.setMatrixAt(i, m4.compose(new THREE.Vector3(...pos), q, one));
    }
    chip.add(pins);
    // estufa (meio cilindro em arame)
    const arch = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(.9, .9, 2.2, 10, 3, true, -Math.PI / 2, Math.PI)), MAT.edge);
    arch.rotation.z = Math.PI / 2; at(arch, 0, 0, -.55, g);
    const plants = [-.75, -.25, .25, .75].map((x, i) => {
      const p = new THREE.Group(); at(p, x, 0, -.55, g);
      const stem = at(new THREE.Mesh(new THREE.CylinderGeometry(.02, .03, 1, 5), MAT.light), 0, .5, 0, p);
      const leaf = at(new THREE.Mesh(new THREE.OctahedronGeometry(.1), i % 2 ? MAT.accent : MAT.light), 0, 1, 0, p);
      return { p, stem, leaf, i };
    });
    const drops = [0, 1, 2, 3, 4, 5].map(() => at(new THREE.Mesh(new THREE.BoxGeometry(.03, .08, .03), MAT.glow), 0, 0, 0, g));
    return {
      group: g, dist: 1.1, lookY: .25,
      update(t) {
        plants.forEach(({ stem, leaf, i }) => {
          const h = .25 + .45 * (0.5 + 0.5 * Math.sin(t * .6 + i * 1.3));
          stem.scale.y = h; stem.position.y = h / 2; leaf.position.y = h + .05; leaf.rotation.y = t + i;
        });
        const pump = Math.sin(t * .8) > 0;
        drops.forEach((d, i) => {
          d.visible = pump;
          const k = loop(t * 1.2 + i * .37, 1);
          d.position.set(-.9 + (i / 5) * 1.8, .85 - k * .85, -.55);
        });
      }
    };
  },

  // Kacto: balões de conversa subindo + nuvem de embeddings (RAG)
  chat() {
    const g = new THREE.Group();
    const bubble = (w, tailLeft) => {
      const s = new THREE.Shape(), r = .12, h = .42;
      s.moveTo(r, 0); s.lineTo(w - r, 0); s.quadraticCurveTo(w, 0, w, r); s.lineTo(w, h - r); s.quadraticCurveTo(w, h, w - r, h);
      s.lineTo(r, h); s.quadraticCurveTo(0, h, 0, h - r); s.lineTo(0, r); s.quadraticCurveTo(0, 0, r, 0);
      const tail = new THREE.Shape(); const tx = tailLeft ? .15 : w - .15;
      tail.moveTo(tx - .08, .02); tail.lineTo(tx + (tailLeft ? -.14 : .14), -.14); tail.lineTo(tx + .08, .02);
      const geo = new THREE.ExtrudeGeometry([s, tail], { depth: .08, bevelEnabled: false });
      geo.translate(-w / 2, -h / 2, -.04);
      return geo;
    };
    const msgs = [0, 1, 2, 3].map((i) => {
      const left = i % 2 === 1;
      const b = edges(new THREE.Mesh(bubble(left ? 1.3 : 1.0, left), left ? MAT.body : MAT.light));
      for (let k = 0; k < 2; k++) at(new THREE.Mesh(new THREE.PlaneGeometry((left ? .9 : .6) - k * .25, .04), left ? MAT.glow : MAT.dark), -.05, .06 - k * .12, .05, b);
      g.add(b); return { b, left };
    });
    const pts = new Float32Array(240 * 3);
    for (let i = 0; i < 240; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(.6 + Math.random() * .25);
      pts.set([v.x, v.y, v.z], i * 3);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    const cloud = at(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xe0443a, size: .05 })), 0, .9, -1.2, g);
    return {
      group: g, dist: 1.05, lookY: .6,
      update(t) {
        cloud.rotation.y = t * .4; cloud.rotation.x = t * .15;
        msgs.forEach(({ b, left }, i) => {
          const k = loop(t * .25 + i / 4, 1);
          b.position.set(left ? -.45 : .5, -.1 + k * 1.9, .2);
          b.scale.setScalar(Math.min(1, k * 8) * (k > .9 ? (1 - k) * 10 : 1));
        });
      }
    };
  },

  // Suminagashi: bandeja d'água com o shader de verdade
  ink() {
    const g = new THREE.Group();
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `precision highp float; uniform float uTime; varying vec2 vUv; ${INK_GLSL}
        void main(){ float b = suminagashi((vUv - .5) * vec2(3.0, 2.0), uTime); vec3 c = vec3(.04) + vec3(.9) * pow(b, 5.0) * .8 + vec3(.06) * b; gl_FragColor = vec4(pow(c, vec3(2.2)), 1.0); }`
    });
    const water = at(new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.7), mat), 0, .12, 0, g);
    water.rotation.x = -Math.PI / 2;
    at(box(2.8, .1, 1.9, MAT.dark), 0, 0, 0, g);
    for (const [x, z, w, d] of [[0, .92, 2.8, .06], [0, -.92, 2.8, .06], [1.37, 0, .06, 1.9], [-1.37, 0, .06, 1.9]]) at(box(w, .22, d, MAT.body), x, .1, z, g);
    const brush = new THREE.Group(); at(brush, .6, .9, -.2, g);
    at(new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 1, 6), MAT.light), 0, .3, 0, brush);
    at(new THREE.Mesh(new THREE.ConeGeometry(.06, .22, 6), MAT.dark), 0, -.3, 0, brush).rotation.x = Math.PI;
    brush.rotation.z = .5;
    return { group: g, dist: .95, lookY: .1, update(t) { mat.uniforms.uTime.value = t * 2; brush.position.x = .3 + Math.sin(t * .5) * .5; } };
  },

  // EDA: gráfico de barras 3D (netflix: filmes × séries; notas dos estudantes)
  bars() {
    const g = new THREE.Group();
    const vals = [[6131, 2676], [66.1, 69.2, 68.1]];
    const bars = [0, 1, 2].map((i) => at(box(.42, 1, .42, i === 0 ? MAT.accent : MAT.light), 0, 0, 0, g));
    at(box(2.4, .04, 1, MAT.dark), 0, 0, 0, g);
    for (let k = 1; k <= 4; k++) {
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1.2, k * .38, -.4), new THREE.Vector3(1.2, k * .38, -.4)]), MAT.edge);
      g.add(l);
    }
    return {
      group: g, dist: 1.0, lookY: .7,
      update(t) {
        const set = Math.floor(t / 5) % 2, v = vals[set], mx = Math.max(...v);
        const grow = Math.min(1, loop(t, 5) / 1.2);
        bars.forEach((b, i) => {
          const on = i < v.length;
          const h = on ? Math.max(.02, (v[i] / mx) * (set ? 1.4 : 1.5) * (set ? .2 + grow * .8 : grow)) : .001;
          b.visible = on;
          b.scale.y = h; b.position.set((i - (v.length - 1) / 2) * .62, h / 2 + .02, 0);
        });
      }
    };
  },

  // Review Stars: cinco estrelas, o classificador acende de 1 a 5
  nlp() {
    const g = new THREE.Group();
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? .12 : .28, a = i / 10 * Math.PI * 2 + Math.PI / 2; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const geo = new THREE.ExtrudeGeometry(s, { depth: .08, bevelEnabled: true, bevelSize: .02, bevelThickness: .02, bevelSegments: 1 });
    const stars = [0, 1, 2, 3, 4].map((i) => at(edges(new THREE.Mesh(geo, MAT.body)), (i - 2) * .62, .6, 0, g));
    const seq = [5, 1, 3, 4];
    return {
      group: g, dist: .95, lookY: .55,
      update(t) {
        const n = seq[Math.floor(t / 2.4) % seq.length], p = loop(t, 2.4);
        stars.forEach((st, i) => {
          const on = i < n && p > .3 + i * .12;
          st.material = on ? MAT.accent : MAT.body;
          st.rotation.y = on ? Math.min(1, (p - .3 - i * .12) * 4) * Math.PI * 2 : 0;
          st.position.y = .6 + (on ? .08 : 0);
        });
      }
    };
  },

  // Freelance: páginas em vista explodida (camadas de um site)
  browser() {
    const g = new THREE.Group();
    const layers = [0, 1, 2].map((i) => {
      const l = new THREE.Group();
      at(box(2, 1.3, .03, i === 0 ? MAT.body : MAT.dark), 0, 0, 0, l);
      if (i === 0) { at(new THREE.Mesh(new THREE.PlaneGeometry(2, .14), MAT.light), 0, .58, .02, l); [-.9, -.8, -.7].forEach((x) => at(new THREE.Mesh(new THREE.CircleGeometry(.03, 8), MAT.accent), x, .58, .03, l)); }
      if (i === 1) at(box(1.6, .5, .04, MAT.light), 0, .15, .02, l);
      if (i === 2) for (let k = 0; k < 3; k++) at(new THREE.Mesh(new THREE.PlaneGeometry(1.4 - k * .3, .06), MAT.glow), -.1, -.25 - k * .13, .02, l);
      g.add(l); return l;
    });
    at(box(.5, .12, .04, MAT.accent, false), .55, -.45, .5, g);
    return {
      group: g, dist: 1.05, lookY: .1,
      update(t) {
        const e = .5 + .5 * Math.sin(t * .8);
        layers.forEach((l, i) => l.position.z = -i * (.12 + e * .45));
        g.rotation.y = -.5 + Math.sin(t * .3) * .2;
      }
    };
  },

  // GPU/CPU Bench: triângulos girando (o próprio teste do projeto)
  triangles() {
    const g = new THREE.Group();
    const TRI = [MAT.accent, MAT.light, MAT.body].map((m) => { const c = m.clone(); c.side = THREE.DoubleSide; return c; });
    const tri = new THREE.Shape(); tri.moveTo(0, .4); tri.lineTo(.35, -.2); tri.lineTo(-.35, -.2); tri.lineTo(0, .4);
    const geo = new THREE.ShapeGeometry(tri);
    const ts = Array.from({ length: 26 }, (_, i) => {
      const m = new THREE.Mesh(geo, TRI[i % 5 === 0 ? 0 : i % 2 ? 1 : 2]);
      const a = i / 26 * Math.PI * 2, r = .5 + (i % 3) * .35;
      at(m, Math.cos(a) * r, .6 + Math.sin(i * 1.7) * .4, Math.sin(a) * r, g);
      m.userData = { s: .5 + (i % 4) * .3 };
      return m;
    });
    return { group: g, dist: 1.0, lookY: .6, update(t) { ts.forEach((m) => { m.rotation.y = t * m.userData.s * 2; m.rotation.z = t * m.userData.s; }); g.rotation.y = t * .2; } };
  },

  // gRPC: cliente ⇄ servidor com chamadas unárias
  grpc() {
    const g = new THREE.Group();
    const cli = at(box(.7, .7, .7, MAT.body), -1.1, .5, 0, g);
    const srv = at(box(.7, 1.1, .7, MAT.light), 1.1, .7, 0, g);
    for (let k = 0; k < 3; k++) at(new THREE.Mesh(new THREE.PlaneGeometry(.5, .05), MAT.accent), 0, .3 - k * .2, .36, srv);
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.75, .55, 0), new THREE.Vector3(.75, .55, 0)]), MAT.edge));
    const req = at(new THREE.Mesh(new THREE.OctahedronGeometry(.11), MAT.glow), 0, .55, 0, g);
    const res = at(new THREE.Mesh(new THREE.OctahedronGeometry(.11), MAT.accent), 0, .55, 0, g);
    return {
      group: g, dist: .95, lookY: .55,
      update(t) {
        const p = loop(t, 2.4);
        req.visible = p < 1.1; res.visible = p > 1.2 && p < 2.3;
        req.position.x = -.75 + Math.min(1, p / 1.1) * 1.5;
        res.position.x = .75 - Math.min(1, Math.max(0, (p - 1.2) / 1.1)) * 1.5;
        req.rotation.y = res.rotation.y = t * 5;
        srv.scale.setScalar(p > 1.05 && p < 1.25 ? 1.06 : 1);
      }
    };
  },

  // Curso de embarcados: protoboard + LED piscando
  blink() {
    const g = new THREE.Group();
    at(box(2.4, .12, 1.2, MAT.light), 0, 0, 0, g);
    const holes = new THREE.InstancedMesh(new THREE.BoxGeometry(.04, .02, .04), MAT.dark, 22 * 8);
    const m4 = new THREE.Matrix4(); let n = 0;
    for (let i = 0; i < 22; i++) for (let j = 0; j < 8; j++) holes.setMatrixAt(n++, m4.makeTranslation(-1.05 + i * .1, .065, -.4 + j * .1 + (j > 3 ? .1 : 0)));
    g.add(holes);
    const led = new THREE.Group(); at(led, .35, .1, 0, g);
    const dome = at(new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), MAT.accent), 0, .34, 0, led);
    at(new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .26, 10), MAT.accent), 0, .2, 0, led);
    for (const x of [-.05, .05]) at(new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, .2, 4), MAT.metal), x, 0, 0, led);
    const res = at(edges(new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .35, 8), MAT.body)), -.3, .14, 0, g);
    res.rotation.z = Math.PI / 2;
    const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-1, .07, .3), new THREE.Vector3(-.8, .5, .3), new THREE.Vector3(-.5, .14, 0)]), 16, .02, 4), MAT.accent);
    g.add(wire);
    const halo = at(new THREE.PointLight(0xe0443a, 0, 2), .35, .6, 0, g);
    return {
      group: g, dist: .9, lookY: .15,
      update(t) {
        const on = Math.floor(t * 1.2) % 2 === 0;
        dome.material = on ? MAT.accent : MAT.body;
        led.children[1].material = on ? MAT.accent : MAT.body;
        halo.intensity = on ? 3 : 0;
      }
    };
  }
};

// ── renderer compartilhado ──────────────────────────────────────
const MAXW = 760, MAXH = 420;
let shared = null;

function getShared() {
  if (shared) return shared;
  mats();
  const canvas = document.createElement('canvas');
  const gl = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
  gl.setPixelRatio(1);
  gl.setSize(MAXW, MAXH, false);
  gl.outputColorSpace = THREE.LinearSRGBColorSpace;
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: DITHER_FRAG,
    uniforms: { tScene: { value: null }, uLow: { value: new THREE.Vector2() } }
  }));
  const post = new THREE.Scene(); post.add(quad);
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const items = new Set();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let last = 0;
  const t0 = performance.now();
  function tick(now) {
    requestAnimationFrame(tick);
    if (document.hidden || now - last < 33) return;
    last = now;
    const t = (now - t0) / 1000 * (reduced ? .2 : 1);
    for (const it of items) {
      if (!it.visible || !it.w) continue;
      it.m.update(t + it.offset);
      it.hx += (it.tx - it.hx) * .12; it.hy += (it.ty - it.hy) * .12;
      it.pivot.rotation.y = (it.m.spinFull ? t * it.spin : it.baseRot + Math.sin(t * it.spin * 1.6) * .45) + it.hx * .9;
      it.pivot.rotation.x = it.hy * .35;
      gl.setRenderTarget(it.rt);
      gl.render(it.scene, it.cam);
      gl.setRenderTarget(null);
      gl.setViewport(0, 0, it.w, it.h);
      quad.material.uniforms.tScene.value = it.rt.texture;
      quad.material.uniforms.uLow.value.set(it.w, it.h);
      gl.render(post, ortho);
      it.ctx.drawImage(canvas, 0, MAXH - it.h, it.w, it.h, 0, 0, it.w, it.h);
    }
  }
  requestAnimationFrame(tick);
  addEventListener('resize', () => items.forEach((it) => it.fit()));
  shared = { gl, items };
  return shared;
}

// monta um modelo num <canvas>. pixel = tamanho do pixel em CSS px
export function mountModel(canvas, kind, { pixel = 1.6, spin = .25, hoverEl = canvas } = {}) {
  const build = MODELS[kind]; if (!build) return null;
  const { items } = getShared();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 6, 12);
  scene.add(new THREE.HemisphereLight(0xe8e8e8, 0x101010, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.8); key.position.set(-3, 5, 4); scene.add(key);
  const rim = new THREE.PointLight(0xe0443a, 10, 10, 1.5); rim.position.set(3, 2, -3); scene.add(rim);
  const grid = new THREE.GridHelper(8, 16, 0x262626, 0x262626); grid.position.y = -.35; scene.add(grid);
  const m = build();
  const pivot = new THREE.Group(); pivot.add(m.group); scene.add(pivot);
  const cam = new THREE.PerspectiveCamera(32, 1, .1, 40);
  const d = m.dist || 1;
  cam.position.set(0, 2.4 * d, 5.6 * d);
  cam.lookAt(0, m.lookY ?? .3, 0);
  const it = {
    canvas, ctx: canvas.getContext('2d'), scene, cam, m, pivot, rt: new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter }),
    visible: false, w: 0, h: 0, spin, baseRot: m.baseRot ?? -.15, hx: 0, hy: 0, tx: 0, ty: 0, offset: Math.random() * 10
  };
  it.fit = () => {
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    if (!cw || !ch) return;
    let px = pixel;
    while (cw / px > MAXW || ch / px > MAXH) px++;
    it.w = Math.round(cw / px); it.h = Math.round(ch / px);
    canvas.width = it.w; canvas.height = it.h;
    it.rt.setSize(it.w, it.h);
    cam.aspect = it.w / it.h;
    cam.updateProjectionMatrix();
  };
  it.fit();
  const io = new IntersectionObserver(([e]) => { it.visible = e.isIntersecting; if (it.visible && !it.w) it.fit(); }, { rootMargin: '60px' });
  io.observe(canvas);
  const onMove = (e) => { const r = hoverEl.getBoundingClientRect(); it.tx = (e.clientX - r.left) / r.width - .5; it.ty = (e.clientY - r.top) / r.height - .5; };
  const onLeave = () => { it.tx = it.ty = 0; };
  hoverEl.addEventListener('pointermove', onMove);
  hoverEl.addEventListener('pointerleave', onLeave);
  items.add(it);
  return {
    refit: () => it.fit(),
    destroy() {
      io.disconnect(); items.delete(it); it.rt.dispose();
      hoverEl.removeEventListener('pointermove', onMove); hoverEl.removeEventListener('pointerleave', onLeave);
    }
  };
}
