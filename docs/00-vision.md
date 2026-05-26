# Visão do Projeto — Hockey Table

## Objetivo

Laboratório de experimentação com **Three.js** (via React Three Fiber) que evolui para um **MVP jogável** de air hockey 3D: mesa, raquetes, disco, câmera arcade, placar e partida local completa.

## Não-objetivos (explícitos)

- Multiplayer em rede / WebRTC
- WebGPU como requisito do MVP
- Física com coliders `trimesh` na mesa
- Post-processing pesado (bloom, SSAO, DOF)
- Spin/Magnus, power-ups, modos especiais
- Áudio elaborado e partículas no MVP
- Mobile como alvo primário (desktop primeiro)

## Público e uso

- Desenvolvedores explorando R3F, Rapier e pipeline de assets 3D
- Demo local de partida 1P vs CPU (padrão) com opção 2P teclado

## Critérios de sucesso do MVP

| Critério | Meta |
|----------|------|
| FPS desktop (Chrome) | ≥ 55 FPS médio em cena de partida |
| Draw calls | < 100 por frame |
| Partida completa | Do saque ao vencedor (7 pontos) sem crash |
| Colisões | Zero tunneling disco × raquete em jogabilidade normal |
| Tempo de partida | 2–5 minutos típico |
| Input latency | Movimento da raquete perceptível em < 32 ms |

## Princípios de engenharia

1. React gerencia estrutura e HUD; Three.js/Rapier gerenciam o loop de jogo.
2. Nunca `setState` dentro de `useFrame`.
3. Coliders simples; mesh visual pode ser mais detalhado que o collider.
4. Medir antes de otimizar (`r3f-perf`, `renderer.info`).
