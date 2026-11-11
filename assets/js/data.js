// ════════════════════════════════════════════════════════════════
//  data.js — todo o conteúdo do site mora aqui.
//  Edite este arquivo para atualizar história, projetos, medalhas.
//  Campos marcados com  ⟵ EDITAR  ainda precisam dos dados do currículo.
// ════════════════════════════════════════════════════════════════

export const profile = {
  name: 'Gabriel Cortez',
  handle: 'gabrielcortezspr',
  role: 'software engineer · ai · automation · data',
  location: 'Manaus · AM · Brasil',
  opening: '1. e4 e5  2. Nf3 Nc6  3. Bb5',
  whoami: [
    'Software Engineer na <b>Samsung Electronics (Visual Display Division)</b> e estudante de Engenharia de Computação na <b>UEA/EST</b>. Construo soluções de automação, aplicações com IA e sistemas orientados a dados que sustentam operações de manufatura e negócio.',
    'Co-fundador da <b>Kacto Services</b>, startup de IA focada em automação inteligente de atendimento ao cliente.',
    'Fora do expediente: shaders, xadrez, hardware com ESP32 e ferramentas que fazem agentes de IA trabalharem juntos.'
  ],
  expertise: [
    'software engineering', 'machine learning',
    'ai & intelligent agents', 'process automation (rpa)',
    'data engineering & analytics', 'full stack development',
    'manufacturing analytics', 'enterprise systems integration'
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

// A história é contada como uma partida: cada marco é um lance do cavalo.
// `move` é a notação exibida; o cavalo 3D salta para a casa `square`.
export const history = [
  {
    move: '1. Nf3', square: 'f3', year: '—',
    title: 'Abertura',
    place: 'Manaus · AM',
    text: 'Primeiros programas em C: lógica, laços, recursão. A curiosidade de entender como as coisas funcionam por dentro vira profissão.'
  },
  {
    move: '2. Ng5', square: 'g5', year: '2024',
    title: 'Engenharia de Computação — UEA/EST',
    place: 'Universidade do Estado do Amazonas',
    text: 'Processamento digital de imagens, cadeias de Markov, computação gráfica e sistemas distribuídos. Tutorial de scene graphs no SIBGRAPI.'
  },
  {
    move: '3. Ne6', square: 'e6', year: '2024',
    title: 'IT Talent — Quality Assurance',
    place: 'Programa IT Talent',
    text: 'Testes automatizados com JUnit, Selenium e XPath. Começo da paixão por automação — o mesmo instinto que mais tarde vira RPA.'
  },
  {
    move: '4. Nd4', square: 'd4', year: '2025',
    title: 'Kacto Services — co-fundador',
    place: 'Startup de IA',
    text: 'Automação inteligente de atendimento ao cliente: agentes de IA, integrações e produto do zero ao cliente.'
  },
  {
    move: '5. Nb5', square: 'b5', year: '2025', // ⟵ EDITAR: ano de entrada na Samsung
    title: 'Samsung Electronics — Software Engineer',
    place: 'Visual Display Division',
    text: 'Automação Python para processos de manufatura, analytics de produção, modelagem preditiva, pipelines de dados e integração de sistemas corporativos com os serviços Samsung Gauss AI.'
  },
  {
    move: '6. Nc7+', square: 'c7', year: '2026',
    title: 'Desafio CREA Pro-Link · II CENATEC',
    place: 'CREA-AM · Equipe 49/51',
    text: 'Plataforma que liga demandas técnicas a profissionais registrados usando evidência documental (ARTs, CATs) em vez de autodeclaração.'
  },
  {
    move: '7. Ne8', square: 'e8', year: 'agora',
    title: 'Agentes, IoT e tabuleiros',
    place: 'tail -f current.log',
    text: 'NarraTer (canvas infinito para orquestrar agentes de IA no Linux), BusFlow (IoT com ESP32) e uma mesa de xadrez & Go em pixel art com shaders.'
  }
];

export const stack = [
  { row: 'lang', items: ['Python', 'TypeScript', 'JavaScript', 'Java', 'SQL'] },
  { row: 'web', items: ['React', 'Next.js', 'FastAPI', 'Node.js', 'HTML·CSS'] },
  { row: 'data·ai', items: ['Pandas', 'NumPy', 'Scikit-Learn', 'OpenCV', 'ML'] },
  { row: 'auto·infra', items: ['Selenium', 'Playwright', 'RPA', 'PostgreSQL', 'Git·Linux'] }
];

// rarity: common | uncommon | rare | legendary   (cor da carta, estilo Balatro)
// icon: chave de assets/js/pixelart.js
export const projects = [
  {
    id: 'narrater', name: 'NarraTer', rarity: 'legendary', icon: 'nodes',
    tagline: 'Narrator + Terminal',
    text: 'Canvas infinito (tipo Figma, mas para terminais) onde você posiciona sessões, conecta agentes de IA de qualquer fornecedor e assiste eles colaborarem. Claude pergunta ao Codex, Gemini pergunta ao shell. Portais de navegador ao vivo, modo maestro e cenas que fecham e reabrem.',
    tags: ['Rust', 'TypeScript', 'xterm.js', 'PTY', 'AI agents'],
    url: 'https://github.com/gabrielcortezspr/NarraTer'
  },
  {
    id: 'chess', name: 'Tabletop', rarity: 'legendary', icon: 'knight',
    tagline: 'Xadrez & Go em pixel art',
    text: 'Mesa de xadrez e Go em Python com shaders no estilo Balatro: tabuleiro-carta em pseudo-3D, fundo de tinta em redemoinho, CRT, capturas que explodem em pixels. Regras oficiais completas e contagem chinesa/japonesa no Go.',
    tags: ['Python', 'OpenGL 3.3', 'GLSL', 'Game feel'],
    url: 'https://github.com/gabrielcortezspr/Chess-Tabletop'
  },
  {
    id: 'busflow', name: 'BusFlow', rarity: 'rare', icon: 'bus',
    tagline: 'Ocupação de ônibus em tempo real',
    text: 'Protótipo IoT: ESP32 com sonares e PIR contam passageiros e presença em paradas, publicam via MQTT; API Node/TypeScript + Prisma persiste em PostgreSQL; app iOS conta pessoas com YOLOv3; dashboard Next.js.',
    tags: ['ESP32', 'MQTT', 'Node.js', 'Prisma', 'YOLOv3'],
    url: 'https://github.com/gabrielcortezspr/BusFlow-ESP32'
  },
  {
    id: 'prolink', name: 'Pro-Link', rarity: 'rare', icon: 'seal',
    tagline: 'CREA-AM · II CENATEC 2026',
    text: 'Matching entre demandas técnicas e profissionais registrados no CREA-AM a partir de evidência documental. Docker, HTTPS, suíte e2e e 138 verificações automatizadas do portfólio.',
    tags: ['PHP', 'Docker', 'MySQL', 'E2E'],
    url: 'https://github.com/gabrielcortezspr/Pro-link-4951'
  },
  {
    id: 'suminagashi', name: 'Suminagashi', rarity: 'uncommon', icon: 'ink',
    tagline: '墨流し em GLSL',
    text: 'Shader que replica a arte japonesa de pintar sobre a água: distorções harmônicas recursivas sobre UV, em escala de cinza. É o fundo vivo deste site — clique em qualquer lugar para pingar tinta.',
    tags: ['GLSL', 'Shadertoy', 'Generative'],
    url: 'https://github.com/gabrielcortezspr/shader-suminagashi'
  },
  {
    id: 'prediction', name: 'Prediction Challenge', rarity: 'uncommon', icon: 'brain',
    tagline: 'Classificação de reviews 1–5',
    text: 'Pipeline híbrido de n-gramas de palavra e caractere + features numéricas, LinearSVC com regularização ajustada. Companheiro do classificador de gênero em reviews B2W (128 mil textos).',
    tags: ['Scikit-Learn', 'NLP', 'SVM'],
    url: 'https://github.com/gabrielcortezspr/Prediction-Challenge-2026'
  },
  {
    id: 'opengl', name: 'GPU/CPU Bench', rarity: 'common', icon: 'gpu',
    tagline: 'Teste de desempenho em OpenGL',
    text: 'Renderização de milhares de triângulos com iluminação e texturas, monitoramento de CPU/GPU e relatórios gerados em Python.',
    tags: ['C++', 'OpenGL', 'CMake', 'Pandas'],
    url: 'https://github.com/gabrielcortezspr/Teste-de-desempenho-de-GPU-CPU-com-OpenGL'
  },
  {
    id: 'grpc', name: 'gRPC Calc', rarity: 'common', icon: 'gear',
    tagline: 'Calculadora distribuída',
    text: 'Serviço gRPC stateless com interceptors de log, validação e testes com grpcurl.',
    tags: ['Python', 'gRPC', 'Protobuf'],
    url: 'https://github.com/gabrielcortezspr/grpc'
  },
  {
    id: 'embarcados', name: 'Curso de Embarcados', rarity: 'common', icon: 'chip',
    tagline: 'ESP32 & Arduino',
    text: 'Curso prático do básico à IoT: interrupções, timers, JSON, brokers MQTT — tudo em PlatformIO.',
    tags: ['C++', 'ESP32', 'PlatformIO', 'IoT'],
    url: 'https://github.com/gabrielcortezspr/Embarcados-Curso'
  }
];

// tier: gold | silver | bronze | seal (participação/certificação)
// ⟵ EDITAR: complete com as medalhas e prêmios do seu currículo.
export const medals = [
  {
    tier: 'gold', glyph: '★', title: 'Samsung Electronics',
    sub: 'Software Engineer · VD Division',
    text: 'Automação e IA aplicadas à manufatura.'
  },
  {
    tier: 'silver', glyph: '♞', title: 'Kacto Services',
    sub: 'Co-fundador',
    text: 'Startup de IA para atendimento inteligente.'
  },
  {
    tier: 'seal', glyph: '印', title: 'II CENATEC 2026',
    sub: 'Desafio CREA Pro-Link',
    text: 'Equipe 49/51 · CREA-AM.'
  },
  {
    tier: 'bronze', glyph: '✓', title: 'IT Talent',
    sub: 'Quality Assurance · 2024',
    text: 'Testes automatizados, JUnit e Selenium.'
  },
  {
    tier: 'seal', glyph: '◎', title: 'SIBGRAPI',
    sub: 'Scene graphs tutorial',
    text: 'Computação gráfica e grafos de cena.'
  }
];

export const currentLog = [
  ['ai', 'integrating enterprise systems with samsung gauss ai services'],
  ['agents', 'building intelligent agents for internal operations'],
  ['rpa', 'developing python automation for manufacturing processes'],
  ['data', 'production analytics · predictive modeling · data pipelines'],
  ['web', 'full stack applications — react · next.js · fastapi'],
  ['kacto', 'intelligent customer service automation @ kacto services'],
  ['narrater', 'wiring claude ↔ codex ↔ shell on an infinite canvas'],
  ['iot', 'esp32 sensors publishing to mqtt · busflow'],
  ['gfx', 'tuning suminagashi shader · 30 iterations · 60fps']
];
