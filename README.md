# gabrielcortezspr-site

Portfólio pessoal: **xadrez digital × suminagashi × pixel**, no mesmo visual do [README do perfil](https://github.com/gabrielcortezspr).

- **Tabuleiro 3D (three.js)** na posição da Ruy Lopez (`1. e4 e5 2. Nf3 Nc6 3. Bb5`). A câmera muda a cada seção, o tabuleiro inclina para o mouse como uma carta e o cavalo salta pelas casas conforme a história avança.
- **Fundo suminagashi**: o shader do [shader-suminagashi](https://github.com/gabrielcortezspr/shader-suminagashi) roda ao vivo, puxa a tinta em direção ao mouse e pinga gotas concêntricas a cada clique.
- **Pós-processamento pixelado**: render em baixa resolução, dithering Bayer 4×4, aberração cromática, scanlines e curvatura CRT.
- **Cartas de projeto estilo Balatro**: distribuídas do baralho, com raridade, inclinação 3D, foil holográfico e ícones em pixel art.
- **Medalhas** que giram e são carimbadas, `stack.board`, `tail -f current.log`, `ping gabriel` e o final `1-0 · good game`.
- **Terminal interativo**: tecla <kbd>~</kbd> ou botão `>_`. Digite `help`. Tem easter eggs (`sudo hire gabriel`, código Konami).

## Editar conteúdo

Todo o texto fica em [`assets/js/data.js`](assets/js/data.js): perfil, história (cada marco é um lance do cavalo), stack, projetos (`rarity`: common/uncommon/rare/legendary) e medalhas (`tier`: gold/silver/bronze/seal). Ícones novos em pixel art: [`assets/js/pixelart.js`](assets/js/pixelart.js).

## Rodar localmente

Site estático, sem build:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## Deploy

O workflow `.github/workflows/pages.yml` publica no GitHub Pages a cada push na `main`. Para ativar, vá em **Settings → Pages → Source: GitHub Actions**.
