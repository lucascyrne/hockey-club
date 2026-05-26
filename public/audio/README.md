# Áudio — Hockey Table

Coloque os ficheiros de som nesta pasta. O motor tenta `.ogg` primeiro e `.mp3` como fallback.

## SFX (`sfx/`)

| Ficheiro | Uso |
|----------|-----|
| `hit-paddle.ogg` | Colisão raquete–disco |
| `hit-wall.ogg` | (reservado) rebate na lateral |
| `goal.ogg` | Gol marcado |
| `faceoff.ogg` | Saque lateral |
| `win.ogg` | Vitória (7 pontos) |

Sons curtos (< 1 s), formato OGG Vorbis ou MP3.

## BGM (`bgm/`)

| Ficheiro | Uso |
|----------|-----|
| `menu.ogg` | Loop no menu principal |
| `match.ogg` | Loop durante a partida |

Música em loop; volume ajustável em **Configurações** no menu.

Se um ficheiro não existir, o jogo continua sem erro (aviso único na consola em desenvolvimento).
