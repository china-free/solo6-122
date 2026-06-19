export const CABLE_COLORS = [
  { name: 'red', stroke: '#ff4d4d', gradient: ['#ff6b6b', '#cc3333'] },
  { name: 'yellow', stroke: '#ffd93d', gradient: ['#ffe66d', '#e6b800'] },
  { name: 'blue', stroke: '#4da6ff', gradient: ['#6bb3ff', '#1a7acc'] },
  { name: 'green', stroke: '#6bcb77', gradient: ['#8ed995', '#2d9940'] },
  { name: 'purple', stroke: '#c780e8', gradient: ['#d9a3f0', '#8b3fbb'] },
  { name: 'orange', stroke: '#ff8c42', gradient: ['#ffa86b', '#d65a00'] },
];

export function getRandomCableColor(): string {
  const idx = Math.floor(Math.random() * CABLE_COLORS.length);
  return CABLE_COLORS[idx].stroke;
}

export function getCableGradient(color: string): [string, string] {
  const found = CABLE_COLORS.find(c => c.stroke === color);
  if (found) return found.gradient as [string, string];
  return [color, color];
}

export const MODULE_ACCENTS: Record<string, string> = {
  vco1: '#ff4d4d',
  vco2: '#ff8c42',
  vcf: '#4da6ff',
  vca: '#6bcb77',
  lfo1: '#c780e8',
  lfo2: '#ffd93d',
  output: '#8b6914',
};

export const WAVEFORM_COLORS = {
  target: 'rgba(120, 120, 130, 0.5)',
  current: '#34c759',
  currentGlow: 'rgba(52, 199, 89, 0.3)',
  grid: 'rgba(52, 199, 89, 0.12)',
};
