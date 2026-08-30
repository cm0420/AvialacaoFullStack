export interface TypeStyle {
  label: string;
  fg: string;
  accent: string;
  glow: string;
}

export const POKEMON_TYPE_STYLES: Record<string, TypeStyle> = {
  normal: { label: 'Normal', fg: '#a8a5a0', accent: '#8a8a8a', glow: 'rgba(138,138,138,.16)' },
  fire: { label: 'Fogo', fg: '#ff8a4c', accent: '#d4562a', glow: 'rgba(212,86,42,.22)' },
  water: { label: 'Água', fg: '#7fb0ee', accent: '#3f7fd4', glow: 'rgba(63,127,212,.22)' },
  electric: { label: 'Elétrico', fg: '#e6c452', accent: '#d4a52a', glow: 'rgba(212,165,42,.22)' },
  grass: { label: 'Planta', fg: '#79c98a', accent: '#4f9e5a', glow: 'rgba(79,158,90,.22)' },
  ice: { label: 'Gelo', fg: '#8fd8e0', accent: '#5cb8c4', glow: 'rgba(92,184,196,.2)' },
  fighting: { label: 'Lutador', fg: '#e0876f', accent: '#c1533a', glow: 'rgba(193,83,58,.22)' },
  poison: { label: 'Veneno', fg: '#c193d6', accent: '#9a5fb0', glow: 'rgba(154,95,176,.22)' },
  ground: { label: 'Terra', fg: '#e0c68f', accent: '#c4a04f', glow: 'rgba(196,160,79,.2)' },
  flying: { label: 'Voador', fg: '#a8c0ea', accent: '#7f9fd4', glow: 'rgba(127,159,212,.18)' },
  psychic: { label: 'Psíquico', fg: '#e08099', accent: '#cc5f7f', glow: 'rgba(204,95,127,.2)' },
  bug: { label: 'Inseto', fg: '#a9c464', accent: '#7a9a3a', glow: 'rgba(122,154,58,.2)' },
  rock: { label: 'Pedra', fg: '#c9b98a', accent: '#a89150', glow: 'rgba(168,145,80,.2)' },
  ghost: { label: 'Fantasma', fg: '#a292c9', accent: '#7a5fa0', glow: 'rgba(122,95,160,.22)' },
  dragon: { label: 'Dragão', fg: '#9a7fe0', accent: '#7350c4', glow: 'rgba(115,80,196,.22)' },
  dark: { label: 'Sombrio', fg: '#a89a8a', accent: '#6e5f52', glow: 'rgba(110,95,82,.24)' },
  steel: { label: 'Metal', fg: '#b8c4cc', accent: '#8a99a4', glow: 'rgba(138,153,164,.2)' },
  fairy: { label: 'Fada', fg: '#dfa3c4', accent: '#c47fa8', glow: 'rgba(196,127,168,.2)' },
};

const FALLBACK_TYPE_STYLE: TypeStyle = {
  label: 'Desconhecido',
  fg: '#a8a5a0',
  accent: '#8a8a8a',
  glow: 'rgba(138,138,138,.16)',
};

export function getTypeStyle(typeName: string): TypeStyle {
  return POKEMON_TYPE_STYLES[typeName] ?? FALLBACK_TYPE_STYLE;
}
