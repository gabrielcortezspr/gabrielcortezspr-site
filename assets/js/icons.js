// Ícones em pixel art (12×12) usados na vitrine e nas faces 3D.
//  #  cor principal (var(--g) na moeda)   +  cinza   r  vermelho-selo
//  o  bastão escuro   p  papel   l  linha de texto
export const ICONS = {
  rocket: [
    '.....##.....',
    '....####....',
    '....#rr#....',
    '....####....',
    '....####....',
    '...######...',
    '..##.##.##..',
    '..#..##..#..',
    '.....rr.....',
    '....r++r....',
    '.....++.....',
    '......+.....'
  ],
  planet: [
    '........+...',
    '....####....',
    '...######...',
    '..########..',
    '+++######+++',
    '..########..',
    '...######...',
    '....####....',
    '............',
    '.+..........',
    '..........+.',
    '............'
  ],
  flask: [
    '....####....',
    '.....##.....',
    '.....##.....',
    '.....##.....',
    '....#..#....',
    '...#....#...',
    '..#......#..',
    '..#rrrrrr#..',
    '.#rrrrrrrr#.',
    '.#rr.rrr.r#.',
    '.##########.',
    '............'
  ],
  atom: [
    '............',
    '...##..##...',
    '..#..##..#..',
    '.#...##...#.',
    '.#..#rr#..#.',
    '..##rrrr##..',
    '..##rrrr##..',
    '.#..#rr#..#.',
    '.#...##...#.',
    '..#..##..#..',
    '...##..##...',
    '............'
  ],
  trophy: [
    '############',
    '##.######.##',
    '#..##r###..#',
    '#..#rrr##..#',
    '##.##r###.##',
    '...######...',
    '....####....',
    '.....##.....',
    '.....##.....',
    '....++++....',
    '...######...',
    '...######...'
  ],
  scroll: [
    'oooooooooooo',
    '.pppppppppp.',
    '.pllllllllp.',
    '.pppppppppp.',
    '.plllllpppp.',
    '.pppppppppp.',
    '.pllllllllp.',
    '.pppppppppp.',
    '.pppppprrpp.',
    '.ppppprrrrp.',
    '.pppppprrpp.',
    'oooooooooooo'
  ]
};

const BASE = { '+': '#6c6c6c', r: '#e0443a', o: '#2a2a2a', p: '#e8e4da', l: '#9a9a9a' };

// SVG nítido para o HTML; `main` é a cor do "#"
export function pixelSvg(name, main = 'currentColor') {
  const grid = ICONS[name]; if (!grid) return '';
  const C = { ...BASE, '#': main };
  let r = '';
  grid.forEach((row, y) => [...row].forEach((ch, x) => { if (C[ch]) r += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${C[ch]}"/>`; }));
  return `<svg viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
}

// desenha o ícone num canvas 2D (faces das medalhas 3D)
export function drawIcon(g, name, cx, cy, size, main) {
  const grid = ICONS[name]; if (!grid) return false;
  const C = { ...BASE, '#': main };
  const s = size / 12, x0 = cx - size / 2, y0 = cy - size / 2;
  grid.forEach((row, y) => [...row].forEach((ch, x) => { if (C[ch]) { g.fillStyle = C[ch]; g.fillRect(x0 + x * s, y0 + y * s, s + .5, s + .5); } }));
  return true;
}
