// ════════════════════════════════════════════════════════════════
//  data.js — todo o conteúdo do site mora aqui (fonte: currículo).
// ════════════════════════════════════════════════════════════════

export const profile = {
  name: 'Gabriel Cortez',
  handle: 'gabrielcortezspr',
  role: 'software engineer · ai · automation · data',
  location: 'Manaus · AM · Brasil',
  opening: '1. e4 e5  2. Nf3 Nc6  3. Bb5',
  whoami: [
    'Software Engineer focado em automação, dados e IA na <b>Samsung Electronics (Visual Display Division)</b>. Construo software interno e soluções de automação para a engenharia de produção de TVs, da ideia e dos requisitos até o deploy e a adoção.',
    'Pipelines de dados em tempo real, dashboards de produção, RPA e sistemas internos usados por times de engenharia e liderança no Brasil e na Coreia: transformo problemas operacionais em software confiável, que reduz trabalho manual e melhora o uso dos dados de produção.',
    'Antes, QA de dispositivos Samsung Galaxy na <b>Sidia</b> e pesquisa em sistemas embarcados com FPGA pela <b>FAPEAM</b>. Cofundei a <b>Kacto</b>, startup de atendimento com IA, e desenvolvo o <b>NarraTer</b>, orquestrador open source de agentes. Estudante de Engenharia de Computação (UEA) e medalhista em olimpíadas científicas.'
  ],
  // bloco estilo neofetch
  fetch: [
    ['os', 'cortez-os · Manaus/AM'],
    ['host', 'Samsung Electronics · Visual Display'],
    ['uptime', 'UEA · Eng. Computação · 2022 → 2027'],
    ['shell', 'python · typescript · rust · verilog'],
    ['ai', 'LLMs · RAG · agents · Scikit-Learn'],
    ['hw', 'ESP32 · FPGA Cyclone IV · Raspberry Pi'],
    ['medals', '9 em olimpíadas · 3 internacionais · 1 troféu'],
    ['lang', 'pt-BR (nativo) · en (avançado, time coreano)']
  ],
  expertise: [
    'software engineering', 'llms · rag · agents',
    'data pipelines · etl', 'ml & computer vision',
    'embedded · fpga · iot', 'qa & ai evaluation',
    'process automation (rpa)', 'full stack development'
  ],
  links: {
    github: 'https://github.com/gabrielcortezspr',
    linkedin: 'https://www.linkedin.com/in/gabrielcortezspr/',
    email: 'gabrielcortezspr@gmail.com'
  },
  quote: {
    text: 'I consider an elegant piece of code or a beautifully designed circuit board to be as much of a work of art as a painting or a poem.',
    author: 'Steve Wozniak'
  }
};

// A história é uma partida: cada marco joga dois meios-lances da variante da troca da Ruy Lopez
// (a partida em si está em scene.js → GAME).
export const history = [
  {
    move: '3…a6  4.Bxc6', year: '2019 – 2021',
    title: 'Olimpíadas científicas',
    place: 'OBA · ONC · AMO · Singapore Math · MOBFOG',
    text: 'Ouro na Olimpíada Brasileira de Astronomia, pratas na ONC, OBEF e MOBFOG e três bronzes internacionais em matemática. A abertura da partida.'
  },
  {
    move: '4…dxc6  5.O-O', year: 'jun 2022',
    title: 'Engenharia de Computação — UEA',
    place: 'Universidade do Estado do Amazonas · até dez 2027',
    text: 'Processamento de imagens, computação gráfica, sistemas distribuídos, ciência de dados. Cursos paralelos: CI Amazônia (microeletrônica), FPF Tech (embarcados) e STEM Academy.'
  },
  {
    move: '5…f6  6.d4', year: 'ago 2024',
    title: 'Pesquisa em Embarcados — FAPEAM / SENAI',
    place: 'Bolsista de pesquisa · até jul 2025',
    text: 'Estufa automatizada com FPGA Cyclone IV em Verilog: sensores, automação, monitoramento ambiental e comunicação hardware-software. Apresentada no evento internacional Chip in the Jungle.'
  },
  {
    move: '6…exd4  7.Nxd4', year: 'set 2024',
    title: 'Desenvolvedor de Testes — Fundação Muraki',
    place: 'Bolsista · até dez 2024',
    text: 'Testes automatizados em Java com Selenium e JUnit, testes de API no Postman e cenários BDD com Cucumber, em ambiente ágil.'
  },
  {
    move: '7…c5  8.Nb3', year: 'fev 2025',
    title: 'Estagiário de QA — Sidia',
    place: 'Instituto de Ciência e Tecnologia · até fev 2026',
    text: 'QA de software embarcado em Android: testes funcionais, de integração e regressão; validação firmware ↔ SO ↔ apps, comportamentos regulatórios e investigação por logs com o time de engenharia na Coreia.'
  },
  {
    move: '8…Qxd1  9.Rxd1', year: '2025',
    title: 'BusFlow — finalista estadual da Liga Jovem',
    place: 'IoT · ESP32 · MQTT',
    text: 'Firmware do ESP32 com sensores de proximidade contando passageiros e publicando via MQTT.'
  },
  {
    move: '9…Bg4  10.f3', year: 'out 2025',
    title: 'Cofundador & Dev de IA — Kacto',
    place: 'Programa Ocean Launch · até fev 2026',
    text: 'Agente conversacional com GPT-4o atendendo clínicas, em produção em 3 clínicas. Pipeline RAG com embeddings no Supabase, testes de regressão, adversarial testing e detecção de alucinação.'
  },
  {
    move: '10…Be6  11.Nc3', year: 'fev 2026',
    title: 'Software Engineer — Samsung Electronics',
    place: 'Visual Display Division · automação, dados e IA',
    text: 'Software interno e automação para a engenharia de produção de TVs: pipelines de dados em tempo real, dashboards usados pela liderança no Brasil e na Coreia, ferramentas Python adotadas pelo time de engenharia, RPA para sistemas legados sem API e modelos de machine learning sobre dados de fábrica.'
  },
  {
    move: '11…Bd6  12.Be3', year: 'set 2026',
    title: 'Campeão do Desafio Pro-Link — CREA-AM',
    place: 'II CENATEC · líder da equipe vencedora',
    text: 'Marketplace que liga profissionais do CREA a empresas com um motor de evidências sobre ART/CAT, desempate com aleatoriedade auditável e LGPD no produto.'
  },
  {
    move: '12…b6  13.a4', year: 'agora',
    title: 'NarraTer, pesquisa e freelance',
    place: 'tail -f current.log',
    text: 'Orquestrador open source de agentes (Tauri 2 + Rust), benchmarks próprios de protocolos multiagente e sites para empresas como Grupo Shamar e Horizont Rec. A partida continua.'
  }
];

// cada grupo: o que eu faço com ele e onde usei
export const stack = [
  {
    title: 'Dados & automação',
    what: 'Pipelines em tempo real, ETL e RPA, inclusive em sistemas legados sem API.',
    where: 'Samsung · Fundação Muraki',
    items: ['Python', 'SQL', 'Pandas', 'NumPy', 'ETL', 'Selenium', 'PyAutoGUI', 'BeautifulSoup', 'OpenCV']
  },
  {
    title: 'IA & machine learning',
    what: 'Agentes, RAG e modelos treinados sobre dados reais, com avaliação de verdade.',
    where: 'Kacto · NarraTer · Samsung',
    items: ['LLMs', 'RAG', 'Embeddings', 'Agentes', 'Scikit-Learn', 'YOLO', 'n8n']
  },
  {
    title: 'Back-end & apps',
    what: 'APIs, dashboards e aplicações de ponta a ponta, do requisito ao deploy.',
    where: 'Samsung · BusFlow · Pro-Link · freelance',
    items: ['FastAPI', 'Flask', 'Node.js', 'TypeScript', 'React', 'Next.js', 'Supabase', 'PostgreSQL', 'Tauri · Rust']
  },
  {
    title: 'Hardware & embarcados',
    what: 'Do sensor ao broker: firmware, FPGA e IoT.',
    where: 'BusFlow · FAPEAM/SENAI · curso de embarcados',
    items: ['ESP32', 'FPGA · Verilog', 'MQTT', 'Arduino', 'Raspberry Pi', 'C/C++']
  },
  {
    title: 'Qualidade & avaliação',
    what: 'Testes funcionais e de regressão, e benchmarks com testes escondidos para agentes.',
    where: 'Sidia · Fundação Muraki · NarraTer',
    items: ['JUnit', 'Selenium', 'Postman', 'Cucumber', 'Benchmarks', 'Git · Linux']
  }
];

// rarity: common | uncommon | rare | legendary  ·  model: modelo 3D em assets/js/models.js
export const projects = [
  {
    id: 'narrater', name: 'NarraTer', rarity: 'legendary', model: 'narrater',
    tagline: 'Orquestrador open source de agentes',
    text: 'App para Linux em que terminais com agentes de vários fornecedores (Claude Code, Codex, Gemini CLI) viram nós num canvas infinito, e as arestas definem quem pode falar com quem. Protocolo que não exige cooperação do agente: entrega pelo terminal e lê o fim do turno pela tela e pelo transcript.',
    facts: ['7 versões do protocolo comparadas em benchmark próprio', 'respostas antes da hora: 0 de 40', 'custo por tarefa: US$ 1,02 → US$ 0,65', 'agente sozinho 2,5× mais rápido e 7× menos tokens na tarefa sequencial'],
    tags: ['Tauri 2', 'Rust', 'React', 'TypeScript', 'Multi-agent'],
    url: 'https://github.com/gabrielcortezspr/NarraTer'
  },
  {
    id: 'prolink', name: 'Pro-Link', rarity: 'legendary', model: 'trophy',
    tagline: 'Campeão · CREA-AM · II CENATEC 2026',
    text: 'Marketplace que conecta profissionais registrados no CREA a empresas, com um motor de evidências que cruza a demanda do serviço com o acervo técnico (ART/CAT) do profissional. Desempate com aleatoriedade auditável, sem pontuação oculta, e LGPD como parte do produto.',
    facts: ['líder da equipe vencedora', '138 verificações automatizadas do portfólio', 'HTTPS, Docker e suíte e2e'],
    tags: ['PHP', 'Docker', 'MySQL', 'LGPD', 'E2E'],
    url: 'https://github.com/gabrielcortezspr/Pro-link-4951'
  },
  {
    id: 'busflow', name: 'BusFlow', rarity: 'rare', model: 'esp32',
    tagline: 'Contagem de passageiros com IoT',
    text: 'Firmware do ESP32 com sensores de proximidade que conta passageiros na borda de subida e publica via MQTT; API Node/TypeScript + Prisma persiste o histórico em PostgreSQL; app iOS conta pessoas com YOLOv3.',
    facts: ['finalista estadual da Liga Jovem 2025', 'ESP32 + 2× HC-SR04 + PIR', 'Mosquitto · Express · Prisma · Next.js'],
    tags: ['ESP32', 'MQTT', 'C++', 'Node.js', 'YOLOv3'],
    url: 'https://github.com/gabrielcortezspr/BusFlow-ESP32'
  },
  {
    id: 'fpga', name: 'Estufa FPGA', rarity: 'rare', model: 'greenhouse',
    tagline: 'Pesquisa FAPEAM · SENAI',
    text: 'Estufa automatizada com FPGA Cyclone IV em Verilog: leitura de sensores, controle de atuadores, monitoramento ambiental e comunicação hardware-software.',
    facts: ['apresentada no Chip in the Jungle (evento científico internacional)', 'bolsa de pesquisa FAPEAM · ago 2024 – jul 2025'],
    tags: ['Verilog', 'FPGA', 'Cyclone IV', 'Sensores'],
    url: null
  },
  {
    id: 'kacto', name: 'Kacto', rarity: 'rare', model: 'chat',
    tagline: 'Agente de atendimento para clínicas',
    text: 'Agente conversacional com GPT-4o para atendimento automatizado de clínicas. Pipeline RAG: chunking da base de conhecimento, embeddings e indexação vetorial no Supabase. Avaliação com testes de regressão, adversarial testing, detecção de alucinação e guardrails.',
    facts: ['em produção em 3 clínicas', 'startup do programa Ocean Launch', 'n8n + Python para automação de fluxos'],
    tags: ['GPT-4o', 'RAG', 'Supabase', 'n8n', 'Python'],
    url: null
  },
  {
    id: 'chess', name: 'Tabletop', rarity: 'rare', model: 'knight',
    tagline: 'Xadrez & Go em pixel art',
    text: 'Mesa de xadrez e Go em Python com shaders no estilo Balatro: tabuleiro-carta em pseudo-3D, fundo de tinta em redemoinho, CRT, capturas que explodem em pixels. Regras oficiais completas e contagem chinesa/japonesa no Go.',
    facts: ['modo livre: monte qualquer posição e jogue a partir dela', 'pontuação automática e placar de partidas'],
    tags: ['Python', 'OpenGL 3.3', 'GLSL', 'Game feel'],
    url: 'https://github.com/gabrielcortezspr/Chess-Tabletop'
  },
  {
    id: 'suminagashi', name: 'Suminagashi', rarity: 'uncommon', model: 'ink',
    tagline: '墨流し em GLSL',
    text: 'Shader que replica a arte japonesa de pintar sobre a água: distorções harmônicas recursivas sobre UV, em escala de cinza. É o fundo vivo deste site: clique em qualquer lugar para pingar tinta.',
    facts: ['30 iterações de distorção cosseno', 'aqui reescrito em ASCII, caractere por caractere'],
    tags: ['GLSL', 'Shadertoy', 'Generative'],
    url: 'https://github.com/gabrielcortezspr/shader-suminagashi'
  },
  {
    id: 'eda', name: 'EDA Netflix', rarity: 'uncommon', model: 'bars',
    tagline: 'Ciência de Dados · UEA',
    text: 'Análise exploratória de duas bases do Kaggle (catálogo da Netflix, 8.807 títulos; desempenho de 1.000 estudantes), com perguntas próprias que cruzam variáveis, como a defasagem dos títulos adicionados e o efeito combinado de curso preparatório e almoço subsidiado.',
    facts: ['8.807 títulos · 1.000 estudantes', 'pandas + Matplotlib'],
    tags: ['Python', 'pandas', 'Matplotlib'],
    url: 'https://github.com/gabrielcortezspr/Ciencia-de-Dados'
  },
  {
    id: 'prediction', name: 'Review Stars', rarity: 'uncommon', model: 'nlp',
    tagline: 'NLP · classificação 1–5',
    text: 'Pipeline híbrido de n-gramas de palavra e caractere com features numéricas e LinearSVC regularizado. Companheiro do classificador de gênero em 128 mil reviews B2W.',
    facts: ['word 1–2 + char_wb 3–5 n-grams', 'ColumnTransformer + LinearSVC'],
    tags: ['Scikit-Learn', 'NLP', 'SVM'],
    url: 'https://github.com/gabrielcortezspr/Prediction-Challenge-2026'
  },
  {
    id: 'web', name: 'Freelance Web', rarity: 'uncommon', model: 'browser',
    tagline: 'Sites & design · desde ago 2026',
    text: 'Criação e manutenção de sites para empresas e profissionais, como Grupo Shamar (segurança e terceirização) e Horizont Rec (produção audiovisual), além de artes e posts para empresas de eventos e buffet.',
    facts: ['Grupo Shamar', 'Horizont Rec'],
    tags: ['Web', 'Design', 'Instagram'],
    url: null
  },
  {
    id: 'opengl', name: 'GPU/CPU Bench', rarity: 'common', model: 'triangles',
    tagline: 'Desempenho em OpenGL',
    text: 'Renderização de milhares de triângulos girando com iluminação e texturas, monitoramento de CPU/GPU e relatórios gerados em Python.',
    facts: ['C++ · GLFW · GLEW', 'análise em pandas + matplotlib'],
    tags: ['C++', 'OpenGL', 'CMake'],
    url: 'https://github.com/gabrielcortezspr/Teste-de-desempenho-de-GPU-CPU-com-OpenGL'
  },
  {
    id: 'grpc', name: 'gRPC Calc', rarity: 'common', model: 'grpc',
    tagline: 'Calculadora distribuída',
    text: 'Serviço gRPC stateless com interceptors de log, validação de entrada (divisão por zero) e testes com grpcurl.',
    facts: ['chamadas unárias · Add, Sub, Mul, Div'],
    tags: ['Python', 'gRPC', 'Protobuf'],
    url: 'https://github.com/gabrielcortezspr/grpc'
  },
  {
    id: 'embarcados', name: 'Curso Embarcados', rarity: 'common', model: 'blink',
    tagline: 'ESP32 & Arduino',
    text: 'Curso prático do básico à IoT: interrupções, timers, JSON, brokers MQTT. Tudo em PlatformIO.',
    facts: ['básico · intermediário · iot'],
    tags: ['C++', 'ESP32', 'PlatformIO'],
    url: 'https://github.com/gabrielcortezspr/Embarcados-Curso'
  }
];

// tier: gold | silver | bronze | honor | trophy | seal   ·  cat: intl | nac | evt
export const medals = [
  { tier: 'trophy', cat: 'evt', glyph: '♛', title: 'Desafio Pro-Link', desc: 'Liderei a equipe vencedora do desafio do CREA-AM no II CENATEC.', sub: 'Campeão · CREA-AM', year: 2026 },
  { tier: 'seal', cat: 'evt', glyph: '♞', title: 'Liga Jovem', desc: 'BusFlow chegou à final estadual: contagem de passageiros com ESP32 e MQTT.', sub: 'Finalista estadual · BusFlow', year: 2025 },
  { tier: 'seal', cat: 'evt', glyph: '◈', title: 'Chip in the Jungle', desc: 'Apresentei a estufa automatizada em FPGA no evento científico internacional.', sub: 'Apresentação · estufa FPGA', year: 2025 },
  { tier: 'bronze', cat: 'intl', glyph: '∑', title: 'American Math Olympiad', desc: 'Bronze internacional em matemática.', sub: 'AMO · bronze', year: 2021 },
  { tier: 'bronze', cat: 'intl', glyph: 'π', title: 'Singapore Math Olympiad', desc: 'Bronze internacional em matemática.', sub: 'SMO · bronze', year: 2021 },
  { tier: 'bronze', cat: 'intl', glyph: '∞', title: 'Matemática sem Fronteiras', desc: 'Bronze na competição internacional de matemática em equipe.', sub: 'bronze', year: 2021 },
  { tier: 'gold', cat: 'nac', glyph: '✦', title: 'Olimp. Bras. de Astronomia', desc: 'Ouro na Olimpíada Brasileira de Astronomia e Astronáutica.', sub: 'OBA · ouro', year: 2020 },
  { tier: 'silver', cat: 'nac', glyph: '⚛', title: 'Olimp. Nacional de Ciências', desc: 'Prata nacional em ciências.', sub: 'ONC · prata', year: 2019 },
  { tier: 'honor', cat: 'nac', glyph: '✓', title: 'Olimp. Nacional de Ciências', desc: 'Honra ao mérito em ciências.', sub: 'ONC · honra ao mérito', year: 2021 },
  { tier: 'silver', cat: 'nac', glyph: '$', title: 'Olimp. Bras. Educação Financeira', desc: 'Prata em educação financeira.', sub: 'OBEF · prata', year: 2020 },
  { tier: 'silver', cat: 'nac', glyph: '⊕', title: 'MOBFOG', desc: 'Mostra Brasileira de Foguetes: prata.', sub: 'foguetes · prata', year: 2020 },
  { tier: 'bronze', cat: 'nac', glyph: '⊕', title: 'MOBFOG', desc: 'Mostra Brasileira de Foguetes: bronze.', sub: 'foguetes · bronze', year: 2021 },
  { tier: 'bronze', cat: 'nac', glyph: '⚗', title: 'Olimp. Amazonense de Química', desc: 'Bronze estadual em química.', sub: 'bronze', year: 2020 }
];

// tail -f: o que está acontecendo comigo agora
export const currentLog = [
  ['now', 'software engineer @ samsung · visual display division'],
  ['building', 'narrater · agentes de vários fornecedores conversando entre si'],
  ['studying', 'engenharia de computação @ uea · formatura em 2027'],
  ['learning', 'rust + tauri · avaliação de sistemas multiagente'],
  ['playing', 'xadrez · 1.e4 e5 2.Nf3 Nc6 3.Bb5, sempre'],
  ['making', 'shaders · suminagashi em glsl'],
  ['tinkering', 'esp32 · sensores · mqtt'],
  ['freelance', 'sites para grupo shamar e horizont rec'],
  ['based', 'manaus · amazonas · brasil'],
  ['open to', 'problemas de automação, dados e ia para construir do zero']
];
