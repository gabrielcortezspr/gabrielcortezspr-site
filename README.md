# gabrielcortezspr-site

Portfólio pessoal: **xadrez digital × suminagashi × pixel**, no mesmo visual do [README do perfil](https://github.com/gabrielcortezspr).

- **Tabuleiro 3D (three.js)** na posição da Ruy Lopez (`1. e4 e5 2. Nf3 Nc6 3. Bb5`). Na seção de história a partida continua de verdade: cada marco joga dois lances da variante da troca (com capturas e roque), com súmula PGN fixa; rolar para cima desfaz os lances.
- **Fundo suminagashi**: o shader do [shader-suminagashi](https://github.com/gabrielcortezspr/shader-suminagashi) roda ao vivo, puxa a tinta em direção ao mouse e pinga gotas concêntricas a cada clique.
- **Pós-processamento pixelado**: render em baixa resolução, dithering Bayer 4×4, aberração cromática, scanlines e curvatura CRT.
- **Cartas de projeto estilo Balatro**, monocromáticas, com raridade, inclinação 3D e brilho. Cada carta tem um **modelo 3D próprio** renderizado no mesmo estilo pixelado do tabuleiro: placa ESP32 com sensor ultrassônico e pacotes MQTT (BusFlow), dois terminais trocando mensagens por uma aresta (NarraTer), troféu com evidências orbitando (Pro-Link), chip FPGA com estufa (pesquisa FAPEAM), balões de chat e nuvem de embeddings (Kacto), bandeja com o shader suminagashi, e mais.
- **Piano 3D ao fundo**, como o tabuleiro: a câmera voa até ele na seção `./piano`. Clique nas teclas 3D ou use `a w s e d…`; o botão toca a Gymnopédie nº 1 de Satie (domínio público) e as teclas afundam em vermelho. Som sintetizado em Web Audio, desligado até você clicar em `♪`. O cavalo também toca uma nota a cada salto.
- **ASCII só nos detalhes**: boot, terminal (`~`), `neofetch`, `tail -f`, `ping` e o tabuleiro final.
- **Medalhas** (olimpíadas, competições) com placar e filtros. Vitrine por ano, com as medalhas penduradas; clique numa e ela aparece **suspensa pela fita em 3D pixelado**: arraste para girar (a fita torce e desfaz) e balançar como um pêndulo; `stack.board`, `tail -f current.log`, `ping gabriel` e o final `1-0 · good game`.
- **Terminal interativo**: tecla <kbd>~</kbd> ou botão `>_`. Digite `help`. Tem easter eggs (`sudo hire gabriel`, código Konami).

## Editar conteúdo

Todo o texto fica em [`assets/js/data.js`](assets/js/data.js): perfil, história (cada marco é um lance do cavalo), stack, projetos (`rarity` e `model`, o modelo 3D em [`assets/js/models.js`](assets/js/models.js)) e medalhas (`tier`: gold/silver/bronze/honor/trophy/seal). Ícones novos em pixel art: [`assets/js/pixelart.js`](assets/js/pixelart.js).

## Rodar localmente

Site estático, sem build:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## Deploy

O workflow `.github/workflows/pages.yml` publica no GitHub Pages a cada push na `main`. Para ativar, vá em **Settings → Pages → Source: GitHub Actions**.
