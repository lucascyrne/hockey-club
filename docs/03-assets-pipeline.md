# Pipeline de Assets

## Sistema de coordenadas

- **Y up** (padrão Three.js)
- Mesa no plano **XZ**, superfície em `Y = 0` (ou leve offset 0.01 para evitar z-fighting)
- Origem no **centro da mesa**
- Unidade: **1 unidade = 1 metro** (convenção para física Rapier)

## Dimensões de referência (MVP)

| Entidade | Dimensão | Notas |
|----------|----------|-------|
| Mesa (jogável) | 2.0 × 1.0 m (X × Z) | Proporção arcade padrão ~2:1 |
| Altura borda | 0.05 m | Visual; collider mais alto se necessário |
| Gol (largura) | 0.35 m | Centrado em cada extremidade Z |
| Raquete (diâmetro) | 0.12 m | Collider: cilindro → `cuboid` aproximado ou `ball` achatado |
| Disco (diâmetro) | 0.05 m | Altura 0.007 m; collider `cylinder` r=0.025; folga ar ~1.5 mm |
| Câmera | pos ~(0, 2.2, 1.8), lookAt (0, 0, 0) | FOV 45–50° |

## Estratégia por fase

| Fase | Assets | Motivo |
|------|--------|--------|
| P0 | Primitivos (`box`, `cylinder`, `sphere`) + cores sólidas | Validar escala, câmera, iluminação |
| P1 | Mesmos primitivos + colliders Rapier | Física antes de arte |
| P2+ | GLB opcional: `table.glb`, `paddle.glb`, `puck.glb` | Substituir visual sem mudar colliders |

Detalhes de mesa realista, rastro neon e gol contínuo: [09-visual-polish-deferred.md](./09-visual-polish-deferred.md).

## Limites de performance (MVP)

| Asset | Triângulos máx. | Texturas |
|-------|-----------------|----------|
| Mesa | 15 000 | 1× 1024² ou cor sólida |
| Raquete ×2 | 2 000 cada | 512² ou vertex color |
| Disco | 500 | cor sólida |
| **Total cena** | < 25 000 | — |

## Formato e exportação

- **glTF 2.0 / GLB** preferido
- **Draco** se GLB > 500 KB
- Escala aplicada no Blender antes do export (não escalar no runtime)
- Nomes de nós estáveis: `Table_Surface`, `Table_Wall_*`

## Checklist ao adicionar modelo

1. Confirmar escala no Blender (2 m × 1 m)
2. Centro de pivô no centro geométrico
3. Collider definido em código (não mesh de física)
4. `useGLTF.preload('/models/table.glb')`
5. Atualizar esta tabela de polígonos
