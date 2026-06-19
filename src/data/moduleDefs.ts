import type { JackDefinition, ModuleDefinition, ModuleId } from '@/types/synth';

export const MODULE_DEFS: ModuleDefinition[] = [
  {
    id: 'vco1',
    name: 'VCO-1',
    subtitle: 'VOLTAGE CONTROLLED OSCILLATOR',
    accentColor: '#ff4d4d',
    width: 180,
    height: 380,
    knobs: [
      { name: 'frequency', label: 'FREQ', min: 30, max: 2000, step: 1, default: 220, unit: 'Hz' },
      { name: 'waveform', label: 'WAVE', min: 0, max: 3, step: 1, default: 2 },
    ],
    jacks: [
      { id: 'vco1:OUT', moduleId: 'vco1', name: 'OUT', type: 'audio_out', x: 30, y: 320 },
      { id: 'vco1:FM_IN', moduleId: 'vco1', name: 'FM IN', type: 'cv_in', x: 90, y: 320 },
      { id: 'vco1:PWM_IN', moduleId: 'vco1', name: 'SYNC', type: 'cv_in', x: 150, y: 320 },
    ],
    hasWaveSelector: true,
  },
  {
    id: 'vco2',
    name: 'VCO-2',
    subtitle: 'VOLTAGE CONTROLLED OSCILLATOR',
    accentColor: '#ff8c42',
    width: 180,
    height: 380,
    knobs: [
      { name: 'frequency', label: 'FREQ', min: 30, max: 2000, step: 1, default: 330, unit: 'Hz' },
      { name: 'waveform', label: 'WAVE', min: 0, max: 3, step: 1, default: 1 },
    ],
    jacks: [
      { id: 'vco2:OUT', moduleId: 'vco2', name: 'OUT', type: 'audio_out', x: 30, y: 320 },
      { id: 'vco2:FM_IN', moduleId: 'vco2', name: 'FM IN', type: 'cv_in', x: 90, y: 320 },
      { id: 'vco2:PWM_IN', moduleId: 'vco2', name: 'SYNC', type: 'cv_in', x: 150, y: 320 },
    ],
    hasWaveSelector: true,
  },
  {
    id: 'lfo1',
    name: 'LFO-1',
    subtitle: 'LOW FREQUENCY OSCILLATOR',
    accentColor: '#c780e8',
    width: 180,
    height: 380,
    knobs: [
      { name: 'rate', label: 'RATE', min: 0.1, max: 30, step: 0.1, default: 5, unit: 'Hz' },
      { name: 'depth', label: 'DEPTH', min: 0, max: 500, step: 1, default: 100 },
      { name: 'waveform', label: 'WAVE', min: 0, max: 3, step: 1, default: 0 },
    ],
    jacks: [
      { id: 'lfo1:OUT', moduleId: 'lfo1', name: 'OUT', type: 'cv_out', x: 90, y: 320 },
    ],
    hasWaveSelector: true,
  },
  {
    id: 'lfo2',
    name: 'LFO-2',
    subtitle: 'LOW FREQUENCY OSCILLATOR',
    accentColor: '#ffd93d',
    width: 180,
    height: 380,
    knobs: [
      { name: 'rate', label: 'RATE', min: 0.1, max: 30, step: 0.1, default: 0.5, unit: 'Hz' },
      { name: 'depth', label: 'DEPTH', min: 0, max: 1, step: 0.01, default: 0.3 },
      { name: 'waveform', label: 'WAVE', min: 0, max: 3, step: 1, default: 2 },
    ],
    jacks: [
      { id: 'lfo2:OUT', moduleId: 'lfo2', name: 'OUT', type: 'cv_out', x: 90, y: 320 },
    ],
    hasWaveSelector: true,
  },
  {
    id: 'vcf',
    name: 'VCF',
    subtitle: 'VOLTAGE CONTROLLED FILTER',
    accentColor: '#4da6ff',
    width: 220,
    height: 380,
    knobs: [
      { name: 'cutoff', label: 'CUTOFF', min: 100, max: 12000, step: 10, default: 2000, unit: 'Hz' },
      { name: 'resonance', label: 'RESON', min: 0.1, max: 20, step: 0.1, default: 1 },
      { name: 'filterType', label: 'TYPE', min: 0, max: 3, step: 1, default: 0 },
    ],
    jacks: [
      { id: 'vcf:IN', moduleId: 'vcf', name: 'IN', type: 'audio_in', x: 30, y: 320 },
      { id: 'vcf:OUT', moduleId: 'vcf', name: 'OUT', type: 'audio_out', x: 120, y: 320 },
      { id: 'vcf:CUTOFF_CV', moduleId: 'vcf', name: 'CV', type: 'cv_in', x: 190, y: 320 },
    ],
    hasFilterSelector: true,
  },
  {
    id: 'vca',
    name: 'VCA',
    subtitle: 'VOLTAGE CONTROLLED AMP',
    accentColor: '#6bcb77',
    width: 180,
    height: 380,
    knobs: [
      { name: 'initialGain', label: 'GAIN', min: 0, max: 1, step: 0.01, default: 0.7 },
      { name: 'modAmount', label: 'MOD', min: 0, max: 1, step: 0.01, default: 0 },
    ],
    jacks: [
      { id: 'vca:IN', moduleId: 'vca', name: 'IN', type: 'audio_in', x: 30, y: 320 },
      { id: 'vca:CV_IN', moduleId: 'vca', name: 'CV', type: 'cv_in', x: 90, y: 320 },
      { id: 'vca:OUT', moduleId: 'vca', name: 'OUT', type: 'audio_out', x: 150, y: 320 },
    ],
  },
  {
    id: 'output',
    name: 'OUTPUT',
    subtitle: 'MASTER / MONITOR',
    accentColor: '#8b6914',
    width: 200,
    height: 380,
    knobs: [
      { name: 'masterVolume', label: 'MASTER', min: 0, max: 1, step: 0.01, default: 0.3 },
    ],
    jacks: [
      { id: 'output:IN', moduleId: 'output', name: 'IN', type: 'audio_in', x: 90, y: 320 },
    ],
  },
];

export function getModuleDef(id: ModuleId): ModuleDefinition | undefined {
  return MODULE_DEFS.find(m => m.id === id);
}

const ALL_JACKS: JackDefinition[] = MODULE_DEFS.flatMap(m => m.jacks);

export function getJackDef(jackId: string): JackDefinition | undefined {
  return ALL_JACKS.find(j => j.id === jackId);
}

export function getAllJacksForModule(moduleId: ModuleId): JackDefinition[] {
  return MODULE_DEFS.find(m => m.id === moduleId)?.jacks ?? [];
}

export function isOutputJack(jackId: string): boolean {
  const j = getJackDef(jackId);
  return j?.type === 'audio_out' || j?.type === 'cv_out';
}

export function isInputJack(jackId: string): boolean {
  const j = getJackDef(jackId);
  return j?.type === 'audio_in' || j?.type === 'cv_in';
}
