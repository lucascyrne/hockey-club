/** Paleta única — sincronizar com src/styles/tokens.css */
export const THEME = {
  colors: {
    background: '#070612',
    backgroundAlt: '#12082a',
    fog: '#0a0818',

    tableSurface: '#0c3d6e',
    tableSurfaceEmissive: '#052a4a',
    tableSurfaceGloss: '#1e6fd4',
    tableUnderbody: '#041a30',
    tableBorder: '#00f0ff',
    tableBorderDark: '#006880',
    tableNeonPink: '#ff3d8a',
    tableRailCap: '#14d4f0',
    airHole: '#020c18',
    airHoleRim: '#0088aa',

    puck: '#ffe600',
    puckEmissive: '#ff9a00',
    puckRim: '#fff4a8',

    paddleP1: '#ff3d8a',
    paddleP1Emissive: '#ff1a6a',
    paddleP2: '#ffbf00',
    paddleP2Emissive: '#e6a800',
    paddleRim: '#ffffff',

    accentPurple: '#7b5cff',
    goalFlash: '#ff4466',
  },
  materials: {
    tableRoughness: 0.38,
    tableMetalness: 0.14,
    glossRoughness: 0.1,
    glossMetalness: 0.4,
    paddleRoughness: 0.22,
    paddleMetalness: 0.28,
    puckRoughness: 0.12,
    puckMetalness: 0.3,
  },
} as const

export type ThemeColors = typeof THEME.colors
