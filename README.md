# gabrielcortezspr-site

Portfólio pessoal: **xadrez digital × suminagashi × pixel**, no mesmo visual do [README do perfil](https://github.com/gabrielcortezspr).

- **Tabuleiro 3D (three.js)** na posição da Ruy Lopez (`1. e4 e5 2. Nf3 Nc6 3. Bb5`). A câmera muda a cada seção, o tabuleiro inclina para o mouse como uma carta e o cavalo salta pelas casas conforme a história avança.
- **Fundo suminagashi**: o shader do [shader-suminagashi](https://github.com/gabrielcortezspr/shader-suminagashi) roda ao vivo, puxa a tinta em direção ao mouse e pinga gotas concêntricas a cada clique.
- **Pós-processamento pixelado**: render em baixa resolução, dithering Bayer 4×4, aberração cromática, scanlines e curvatura CRT.
- **Cartas de projeto estilo Balatro** com raridade, inclinação 3D e foil. Cada carta tem uma **animação ASCII própria**: ESP32 em 3D (raymarching de SDF) no BusFlow, dois terminais trocando mensagens no NarraTer, troféu 3D no Pro-Link, cavalo 3D no Tabletop, estufa crescendo no projeto FPGA, chat RAG na Kacto, o shader suminagashi em caracteres, e mais.
- **Modo ASCII no fundo**: o pós-processamento troca pixels por caracteres (automático em algumas seções, botão `A` no topo).
- **Piano** sintetizado com Web Audio (parciais inarmônicas + reverb). O cavalo toca notas ao saltar, as cartas e casas soam no hover, e a seção `./piano` tem um teclado jogável (mouse ou `a w s e d…`) que toca a Gymnopédie nº 1 de Satie (domínio público). Som desligado até você clicar em `♪`.
- **Medalhas** (olimpíadas, competições) que giram e são carimbadas, com placar ASCII e filtros; `neofetch`, `stack.board`, `tail -f current.log`, `ping gabriel` e o final `1-0 · good game`.
- **Terminal interativo**: tecla <kbd>~</kbd> ou botão `>_`. Digite `help`. Tem easter eggs (`sudo hire gabriel`, código Konami).

## Editar conteúdo

Todo o texto fica em [`assets/js/data.js`](assets/js/data.js): perfil, história (cada marco é um lance do cavalo), stack, projetos (`rarity` e `ascii`, a cena em [`assets/js/ascii.js`](assets/js/ascii.js)) e medalhas (`tier`: gold/silver/bronze/honor/trophy/seal). Ícones novos em pixel art: [`assets/js/pixelart.js`](assets/js/pixelart.js).

## Rodar localmente

Site estático, sem build:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## Deploy

O workflow `.github/workflows/pages.yml` publica no GitHub Pages a cada push na `main`. Para ativar, vá em **Settings → Pages → Source: GitHub Actions**.
