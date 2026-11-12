// ════════════════════════════════════════════════════════════════
//  i18n.js — português ou inglês.
//  Escolha: ?lang= na URL > preferência salva > idioma do navegador
//  (qualquer pt-*) > fuso horário do Brasil > inglês.
//  O conteúdo em português fica em data.js; aqui ficam as traduções.
// ════════════════════════════════════════════════════════════════
import { profile, history, stack, projects, medals, currentLog, experiences } from './data.js';

const BR_TZ = /^America\/(Sao_Paulo|Manaus|Fortaleza|Recife|Bahia|Belem|Maceio|Araguaina|Cuiaba|Campo_Grande|Porto_Velho|Boa_Vista|Rio_Branco|Eirunepe|Santarem|Noronha)$/;

function detect() {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'pt' || q === 'en') { localStorage.setItem('gc-lang', q); return q; }
    const saved = localStorage.getItem('gc-lang');
    if (saved === 'pt' || saved === 'en') return saved;
  } catch {}
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language || ''];
  if (langs.some((l) => /^pt/i.test(l))) return 'pt';
  try { if (BR_TZ.test(Intl.DateTimeFormat().resolvedOptions().timeZone)) return 'pt'; } catch {}
  return 'en';
}

export const LANG = detect();
export function setLang(l) {
  try { localStorage.setItem('gc-lang', l); } catch {}
  const u = new URL(location.href); u.searchParams.delete('lang');
  location.href = u.pathname + u.search + u.hash;
}

// ── textos da interface ─────────────────────────────────────────
const UI = {
  pt: {
    'nav.exp': 'experiências', 'nav.projects': 'projetos', 'nav.medals': 'conquistas', 'nav.stack': 'stack', 'nav.piano': 'piano', 'nav.contact': 'ping',
    'top.about': 'sobre', 'hero.now': 'Software Engineer na <b>Samsung Electronics</b> · Manaus, AM',
    'hero.cta': 'ver trabalho', 'hero.about': 'sobre mim',
    'piano.lead': 'Entre um lance e outro, Satie no piano ao fundo.', 'piano.play': '▶ gymnopédie nº1', 'piano.stop': '■ parar',
    'close': 'fechar ×', 'footer': 'three.js, glsl, web audio e tinta digital',
    'cv.btn': 'currículo completo (PDF)', 'cv.note': 'versão estendida, com tudo que tem no site e mais detalhes',
    'now': 'agora', 'usedIn': 'usado em', 'stackNote': (n, k) => `${n} ferramentas · ${k} frentes · todas usadas em projeto real`,
    'rarity': { common: 'COMUM', uncommon: 'INCOMUM', rare: 'RARA', legendary: 'LENDÁRIA' },
    'pfilters': [['all', 'TODOS'], ['ia', 'IA'], ['hw', 'HARDWARE'], ['web', 'WEB'], ['data', 'DADOS'], ['gfx', 'GRÁFICOS']],
    'github': 'abrir no github', 'demo': 'pedir uma demo', 'private': 'repositório privado',
    'tier': { gold: 'ouro', silver: 'prata', bronze: 'bronze', honor: 'honra', trophy: 'troféu', seal: 'evento' },
    'tally': { trophy: 'troféu', gold: 'ouro', silver: 'prata', bronze: 'bronze', honor: 'honra', seal: 'certificados' },
    'mfilters': [['all', 'TODAS'], ['intl', 'INTERNACIONAIS'], ['nac', 'NACIONAIS'], ['evt', 'COMPETIÇÕES'], ['talk', 'APRESENTAÇÕES']],
    'tierLong': { trophy: 'troféu · campeão', gold: 'medalha de ouro', silver: 'medalha de prata', bronze: 'medalha de bronze', honor: 'honra ao mérito', seal: 'certificado' },
    'copy': 'copiar e-mail', 'copied': 'copiado ✓', 'pong': 'respondo rápido'
  },
  en: {
    'nav.exp': 'experience', 'nav.projects': 'projects', 'nav.medals': 'awards', 'nav.stack': 'stack', 'nav.piano': 'piano', 'nav.contact': 'ping',
    'top.about': 'about', 'hero.now': 'Software Engineer at <b>Samsung Electronics</b> · Manaus, Brazil',
    'hero.cta': 'see my work', 'hero.about': 'about me',
    'piano.lead': 'Between moves, Satie on the piano in the background.', 'piano.play': '▶ gymnopédie no.1', 'piano.stop': '■ stop',
    'close': 'close ×', 'footer': 'three.js, glsl, web audio and digital ink',
    'cv.btn': 'full résumé (PDF)', 'cv.note': 'extended version, with everything on this site and more detail',
    'now': 'now', 'usedIn': 'used at', 'stackNote': (n, k) => `${n} tools · ${k} areas · all used in real projects`,
    'rarity': { common: 'COMMON', uncommon: 'UNCOMMON', rare: 'RARE', legendary: 'LEGENDARY' },
    'pfilters': [['all', 'ALL'], ['ia', 'AI'], ['hw', 'HARDWARE'], ['web', 'WEB'], ['data', 'DATA'], ['gfx', 'GRAPHICS']],
    'github': 'open on github', 'demo': 'request a demo', 'private': 'private repository',
    'tier': { gold: 'gold', silver: 'silver', bronze: 'bronze', honor: 'honor', trophy: 'trophy', seal: 'event' },
    'tally': { trophy: 'trophy', gold: 'gold', silver: 'silver', bronze: 'bronze', honor: 'honor', seal: 'certificates' },
    'mfilters': [['all', 'ALL'], ['intl', 'INTERNATIONAL'], ['nac', 'NATIONAL'], ['evt', 'COMPETITIONS'], ['talk', 'TALKS']],
    'tierLong': { trophy: 'trophy · champion', gold: 'gold medal', silver: 'silver medal', bronze: 'bronze medal', honor: 'honorable mention', seal: 'certificate' },
    'copy': 'copy e-mail', 'copied': 'copied ✓', 'pong': 'I reply fast'
  }
};
export const t = (k) => UI[LANG][k] ?? UI.pt[k] ?? k;
export const cvUrl = () => `assets/cv/gabriel-cortez-cv-${LANG}.pdf`;

// aplica nos elementos com data-i18n (innerHTML, os textos são nossos)
export function applyStatic() {
  document.documentElement.lang = LANG === 'pt' ? 'pt-BR' : 'en';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.innerHTML = t(el.dataset.i18n); });
}

// ── conteúdo em inglês ──────────────────────────────────────────
const EN = {
  whoami: [
    'Software Engineer focused on automation, data and AI at <b>Samsung Electronics (Visual Display Division)</b>. I build internal software and automation for TV production engineering, from the initial idea and requirements to deployment and adoption.',
    'Real-time data pipelines, production dashboards, RPA and internal systems used by engineering teams and leadership in Brazil and Korea: I turn operational problems into reliable software that reduces manual work and improves how production data is used.',
    'Before that, QA on Samsung Galaxy devices at <b>Sidia</b> and FPGA embedded-systems research funded by <b>FAPEAM</b>. I co-founded <b>Kacto</b>, an AI customer-service startup, and I build <b>NarraTer</b>, an open-source agent orchestrator. Computer Engineering student (UEA) and science olympiad medalist.'
  ],
  fetch: { uptime: 'UEA · Computer Eng. · 2022 → 2027', medals: '9 olympiad medals · 3 international · 1 trophy', lang: 'pt-BR (native) · en (advanced, Korean team)' },
  location: 'Manaus · AM · Brazil',
  history: [
    ['2019 – 2021', 'Science olympiads', 'OBA · ONC · AMO · Singapore Math · MOBFOG'],
    ['jun 2022', 'Computer Engineering — UEA', 'Amazonas State University · until dec 2027'],
    ['aug 2024', 'Embedded research — FAPEAM / SENAI', 'Research fellow · until jul 2025'],
    ['sep 2024', 'Test Developer — Fundação Muraki', 'Fellow · until dec 2024'],
    ['feb 2025', 'QA Intern — Sidia', 'Institute of Science and Technology · until feb 2026'],
    ['2025', 'BusFlow — state finalist, Liga Jovem', 'IoT · ESP32 · MQTT'],
    ['oct 2025', 'Co-founder & AI Dev — Kacto', 'Ocean Launch program · until feb 2026'],
    ['feb 2026', 'Software Engineer — Samsung Electronics', 'Visual Display Division · automation, data and AI'],
    ['sep 2026', 'Pro-Link Challenge winner — CREA-AM', 'II CENATEC · winning team lead'],
    ['now', 'NarraTer, research and freelance', 'tail -f current.log']
  ],
  stack: [
    ['Data & automation', 'Samsung · Fundação Muraki'],
    ['AI & machine learning', 'Kacto · NarraTer · Samsung'],
    ['Back-end & apps', 'Samsung · BusFlow · Pro-Link · freelance'],
    ['Hardware & embedded', 'BusFlow · FAPEAM/SENAI · embedded course'],
    ['Quality & evaluation', 'Sidia · Fundação Muraki · NarraTer']
  ],
  projects: {
    narrater: ['Open-source agent orchestrator', 'Linux app where terminals running agents from different vendors (Claude Code, Codex, Gemini CLI) become nodes on an infinite canvas, and edges define who can talk to whom. The protocol needs no cooperation from the agent: it delivers through the terminal and reads the end of the turn from the screen and transcript.', ['7 protocol versions compared in my own benchmark', 'premature answers: 0 of 40', 'cost per task: US$ 1.02 → US$ 0.65', 'solo agent 2.5× faster and 7× fewer tokens on the sequential task']],
    prolink: ['Winner · CREA-AM · II CENATEC 2026', 'Marketplace connecting engineers registered with CREA to companies, with an evidence engine that matches the job to the professional\'s technical records (ART/CAT). Auditable random tie-breaking, no hidden scoring, and LGPD (data privacy) built into the product.', ['led the winning team', '138 automated portfolio checks', 'HTTPS, Docker and an end-to-end suite']],
    busflow: ['IoT passenger counting', 'ESP32 firmware with proximity sensors counts passengers on the rising edge and publishes over MQTT; a Node/TypeScript + Prisma API stores the history in PostgreSQL; an iOS app counts people with YOLOv3.', ['state finalist at Liga Jovem 2025', 'ESP32 + 2× HC-SR04 + PIR', 'Mosquitto · Express · Prisma · Next.js']],
    fpga: ['Research · FAPEAM · SENAI', 'Automated greenhouse on an FPGA Cyclone IV in Verilog: sensor reading, actuator control, environmental monitoring and hardware-software communication.', ['presented at Chip in the Jungle (international scientific event)', 'FAPEAM research grant · aug 2024 – jul 2025']],
    kacto: ['Customer-service agent for clinics', 'GPT-4o conversational agent for automated clinic support. RAG pipeline: knowledge-base chunking, embeddings and vector indexing on Supabase. Evaluated with regression tests, adversarial testing, hallucination detection and guardrails.', ['in production at 3 clinics', 'startup from the Ocean Launch program', 'n8n + Python for workflow automation']],
    chess: ['Chess & Go in pixel art', 'Chess and Go table in Python with Balatro-style shaders: a pseudo-3D card board, swirling ink background, CRT and captures that explode into pixels. Full official rules and Chinese/Japanese scoring for Go.', ['free mode: set up any position and play from it', 'automatic scoring and match tally']],
    suminagashi: ['墨流し in GLSL', 'Shader recreating the Japanese art of painting on water: recursive harmonic distortions over UV, in grayscale. It is the live background of this site.', ['30 iterations of cosine distortion', 'the same shader runs behind this site']],
    eda: ['Data Science · UEA', 'Exploratory analysis of two Kaggle datasets (Netflix catalog, 8,807 titles; 1,000 students\' performance), with original questions crossing variables, such as the lag of added titles and the combined effect of test prep and subsidized lunch.', ['8,807 titles · 1,000 students', 'pandas + Matplotlib']],
    prediction: ['NLP · 1–5 star classification', 'Hybrid pipeline of word and character n-grams plus numeric features with a regularized LinearSVC. Companion to a gender classifier over 128k B2W reviews.', ['word 1–2 + char_wb 3–5 n-grams', 'ColumnTransformer + LinearSVC']],
    web: ['Websites & design · since aug 2026', 'Building and maintaining websites for companies and professionals, such as Grupo Shamar (security services) and Horizont Rec (video production), plus graphics for event companies.', ['Grupo Shamar', 'Horizont Rec']],
    opengl: ['OpenGL performance', 'Rendering thousands of rotating triangles with lighting and textures, CPU/GPU monitoring and reports generated in Python.', ['C++ · GLFW · GLEW', 'analysis with pandas + matplotlib']],
    grpc: ['Distributed calculator', 'Stateless gRPC service with logging interceptors, input validation (division by zero) and grpcurl tests.', ['unary calls · Add, Sub, Mul, Div']],
    embarcados: ['ESP32 & Arduino', 'Hands-on course from basics to IoT: interrupts, timers, JSON, MQTT brokers. All in PlatformIO.', ['basic · intermediate · iot']]
  },
  projectNames: { embarcados: 'Embedded Course', eda: 'Netflix EDA', web: 'Freelance Web', fpga: 'FPGA Greenhouse' },
  medals: [
    ['Pro-Link Challenge', 'Champion · CREA-AM', 'Led the winning team of the CREA-AM challenge at II CENATEC.'],
    ['Liga Jovem', 'State finalist · BusFlow', 'BusFlow reached the state final: passenger counting with ESP32 and MQTT.'],
    ['Chip in the Jungle', 'Talk · FPGA greenhouse', 'Presented the FPGA automated greenhouse at the international scientific event.'],
    ['American Math Olympiad', 'AMO · bronze', 'International bronze in mathematics.'],
    ['Singapore Math Olympiad', 'SMO · bronze', 'International bronze in mathematics.'],
    ['Mathematics Without Borders', 'bronze', 'Bronze in the international team math competition.'],
    ['Brazilian Astronomy Olympiad', 'OBA · gold', 'Gold at the Brazilian Astronomy and Astronautics Olympiad.'],
    ['National Science Olympiad', 'ONC · silver', 'National silver in science.'],
    ['National Science Olympiad', 'ONC · honorable mention', 'Honorable mention in science.'],
    ['Financial Education Olympiad', 'OBEF · silver', 'Silver in financial education.'],
    ['MOBFOG', 'rockets · silver', 'Brazilian Rocket Show: silver.'],
    ['MOBFOG', 'rockets · bronze', 'Brazilian Rocket Show: bronze.'],
    ['Amazonas Chemistry Olympiad', 'bronze', 'State bronze in chemistry.']
  ],
  log: [
    ['now', 'software engineer @ samsung · visual display division'],
    ['building', 'narrater · agents from different vendors talking to each other'],
    ['studying', 'computer engineering @ uea · graduating 2027'],
    ['learning', 'rust + tauri · evaluating multi-agent systems'],
    ['playing', 'chess · 1.e4 e5 2.Nf3 Nc6 3.Bb5, always'],
    ['making', 'shaders · suminagashi in glsl'],
    ['tinkering', 'esp32 · sensors · mqtt'],
    ['freelance', 'websites for grupo shamar and horizont rec'],
    ['based', 'manaus · amazonas · brazil'],
    ['open to', 'automation, data and ai problems to build from scratch']
  ],
  experiences: {
    samsung: ['Software Engineer', 'feb 2026 → now', 'automation, data and AI for TV production', 'Internal software and automation for TV production engineering in the Visual Display Division, from idea and requirements to deployment and adoption.', ['real-time data pipelines over production line telemetry', 'dashboards used by leadership in Brazil and Korea', 'Python tooling adopted by the engineering team', 'RPA on legacy systems with no API', 'ML models on factory data']],
    kacto: ['Co-founder & AI Dev', 'oct 2025 → feb 2026', 'AI customer-service agent in production', 'AI customer-service startup from the Ocean Launch program. GPT-4o conversational agent serving clinics, with a RAG pipeline and continuous evaluation.', ['in production at 3 clinics', 'RAG with embeddings and vector search on Supabase', 'regression tests, adversarial testing and hallucination detection']],
    sidia: ['QA Intern', 'feb 2025 → feb 2026', 'QA for Samsung Galaxy devices', 'Embedded-software QA on Android in a global program: functional, integration and regression testing, validating firmware, OS and apps.', ['regulatory behaviors', 'log-based investigation with the engineering team in Korea']],
    muraki: ['Test Developer', 'sep 2024 → dec 2024', 'web and API test automation', 'Automated tests in Java with Selenium and JUnit, API testing in Postman and BDD scenarios with Cucumber, in an agile team.', ['UI tests with Selenium + JUnit', 'BDD scenarios with Cucumber']],
    fapeam: ['Embedded Research', 'aug 2024 → jul 2025', 'FPGA automated greenhouse', 'Research grant: automated greenhouse on an FPGA Cyclone IV in Verilog, with sensors, actuator control and hardware-software communication.', ['presented at Chip in the Jungle, an international scientific event']],
    uea: ['Computer Engineering', '2022 → 2027', 'B.Sc. · Amazonas State University', 'Image processing, computer graphics, distributed systems and data science. Additional courses in microelectronics (CI Amazônia), embedded systems (FPF Tech) and STEM Academy.', ['expected graduation: dec 2027']]
  }
};

if (LANG === 'en') {
  profile.whoami = EN.whoami;
  profile.location = EN.location;
  profile.fetch = profile.fetch.map(([k, v]) => [k, EN.fetch[k] ?? v]);
  history.forEach((h, i) => { const e = EN.history[i]; if (e) [h.year, h.title, h.place] = e; });
  stack.forEach((s, i) => { const e = EN.stack[i]; if (e) [s.title, s.where] = e; s.items = s.items.map((x) => (x === 'Agentes' ? 'Agents' : x)); });
  projects.forEach((p) => { const e = EN.projects[p.id]; if (e) [p.tagline, p.text, p.facts] = e; if (EN.projectNames[p.id]) p.name = EN.projectNames[p.id]; });
  medals.forEach((m, i) => { const e = EN.medals[i]; if (e) [m.title, m.sub, m.desc] = e; });
  currentLog.splice(0, currentLog.length, ...EN.log);
  experiences.forEach((x) => { const e = EN.experiences[x.id]; if (e) [x.role, x.period, x.short, x.text, x.facts] = e; });
}
