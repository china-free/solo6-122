import type { Level } from '@/types/synth';
import { generateSyntheticWaveform, generateSyntheticWaveformWithPhase, generateSpectrum } from '@/utils/waveformMatch';

const SAMPLE_RATE = 44100;
const WAVE_LEN = 2048;
const SPEC_LEN = 512;

function buildSignatures(
  oscType: OscillatorType,
  freq: number,
  lfoRate: number,
  lfoDepth: number,
  filterCutoff: number,
  filterQ: number
): { waveform: number[]; spectrum: number[] } {
  const wave = generateSyntheticWaveform(
    oscType, freq, SAMPLE_RATE, WAVE_LEN, lfoRate, lfoDepth, filterCutoff, filterQ
  );
  let spec: Float32Array;
  if (lfoRate > 0 && lfoDepth > 0) {
    const PHASES = 24;
    const acc = new Float64Array(SPEC_LEN);
    for (let p = 0; p < PHASES; p++) {
      const phase = (p / PHASES) * Math.PI * 2;
      const w = generateSyntheticWaveformWithPhase(
        oscType, freq, SAMPLE_RATE, WAVE_LEN, lfoRate, lfoDepth, filterCutoff, filterQ, phase
      );
      const s = generateSpectrum(w, SPEC_LEN);
      for (let i = 0; i < SPEC_LEN; i++) acc[i] += s[i];
    }
    spec = new Float32Array(SPEC_LEN);
    for (let i = 0; i < SPEC_LEN; i++) spec[i] = acc[i] / PHASES;
  } else {
    spec = generateSpectrum(wave, SPEC_LEN);
  }
  return {
    waveform: Array.from(wave),
    spectrum: Array.from(spec),
  };
}

const LEVEL1_SIGS = buildSignatures('sine', 440, 0, 0, 0, 0);
const LEVEL2_SIGS = buildSignatures('square', 220, 0, 0, 1200, 0.5);
const LEVEL3_SIGS = buildSignatures('sawtooth', 330, 0, 0, 800, 1);
const LEVEL4_SIGS = buildSignatures('sine', 220, 5, 80, 0, 0);
const LEVEL5_SIGS = buildSignatures('sawtooth', 440, 0.5, 20, 3000, 3);
const LEVEL6_SIGS = buildSignatures('triangle', 180, 10, 150, 0, 0);
const LEVEL7_SIGS = buildSignatures('square', 660, 0, 0, 600, 5);
const LEVEL8_SIGS = buildSignatures('sawtooth', 550, 2, 120, 1500, 2);
const LEVEL9_SIGS = buildSignatures('sine', 880, 15, 100, 8000, 0.1);
const LEVEL10_SIGS = buildSignatures('triangle', 110, 3, 200, 500, 7);

export const LEVELS: Level[] = [
  {
    id: 1,
    name: '入门第一课',
    difficulty: 1,
    description: '让合成器发出第一个声音：一个纯净的 440Hz 正弦波',
    hint: '将 VCO-1 的 OUT 连接到 OUTPUT 的 IN，选择正弦波，频率调到 440Hz',
    availableModules: ['vco1', 'output'],
    unlocked: true,
    completed: false,
    bestScore: 0,
    target: {
      cables: [{ id: 'l1-1', from: 'vco1:OUT', to: 'output:IN', color: '#ff4d4d' }],
      params: {
        vco1: { frequency: 440, waveform: 0 },
        vco2: { frequency: 330, waveform: 1 },
        lfo1: { rate: 5, depth: 100, waveform: 0 },
        lfo2: { rate: 0.5, depth: 0.3, waveform: 2 },
        vcf: { cutoff: 2000, resonance: 1, filterType: 0 },
        vca: { initialGain: 0.7, modAmount: 0 },
        output: { masterVolume: 0.3 },
      },
      ...LEVEL1_SIGS,
    },
  },
  {
    id: 2,
    name: '方波的低语',
    difficulty: 1,
    description: '经典8位游戏方波，带一点点低通滤波的柔和感',
    hint: 'VCO-1 OUT → VCF IN，VCF OUT → OUTPUT IN。方波，220Hz，截止1200Hz',
    availableModules: ['vco1', 'vcf', 'output'],
    unlocked: false,
    completed: false,
    bestScore: 0,
    target: {
      cables: [
        { id: 'l2-1', from: 'vco1:OUT', to: 'vcf:IN', color: '#ffd93d' },
        { id: 'l2-2', from: 'vcf:OUT', to: 'output:IN', color: '#4da6ff' },
      ],
      params: {
        vco1: { frequency: 220, waveform: 1 },
        vco2: { frequency: 330, waveform: 1 },
        lfo1: { rate: 5, depth: 100, waveform: 0 },
        lfo2: { rate: 0.5, depth: 0.3, waveform: 2 },
        vcf: { cutoff: 1200, resonance: 0.5, filterType: 0 },
        vca: { initialGain: 0.7, modAmount: 0 },
        output: { masterVolume: 0.3 },
      },
      ...LEVEL2_SIGS,
    },
  },
  {
    id: 3,
    name: '锯齿能量',
    difficulty: 2,
    description: '丰满的锯齿波通过锋利的滤波器切割出独特音色',
    hint: 'VCO-1(锯齿,330Hz) → VCF(低通,800Hz,Q=1) → OUTPUT',
    availableModules: ['vco1', 'vcf', 'output'],
    unlocked: false,
    completed: false,
    bestScore: 0,
    target: {
      cables: [
        { id: 'l3-1', from: 'vco1:OUT', to: 'vcf:IN', color: '#6bcb77' },
        { id: 'l3-2', from: 'vcf:OUT', to: 'output:IN', color: '#c780e8' },
      ],
      params: {
        vco1: { frequency: 330, waveform: 2 },
        vco2: { frequency: 330, waveform: 1 },
        lfo1: { rate: 5, depth: 100, waveform: 0 },
        lfo2: { rate: 0.5, depth: 0.3, waveform: 2 },
        vcf: { cutoff: 800, resonance: 1, filterType: 0 },
        vca: { initialGain: 0.7, modAmount: 0 },
        output: { masterVolume: 0.3 },
      },
      ...LEVEL3_SIGS,
    },
  },
  {
    id: 4,
    name: '警报器啸叫',
    difficulty: 3,
    description: '用 LFO 调制 VCO 频率，实现经典的警笛波浪音',
    hint: 'LFO-1 OUT → VCO-1 FM IN。VCO-1 OUT → OUTPUT。正弦波220Hz，LFO正弦5Hz深度100',
    availableModules: ['vco1', 'lfo1', 'output'],
    unlocked: false,
    completed: false,
    bestScore: 0,
    target: {
      cables: [
        { id: 'l4-1', from: 'lfo1:OUT', to: 'vco1:FM_IN', color: '#ff8c42' },
        { id: 'l4-2', from: 'vco1:OUT', to: 'output:IN', color: '#ff4d4d' },
      ],
      params: {
        vco1: { frequency: 220, waveform: 0 },
        vco2: { frequency: 330, waveform: 1 },
        lfo1: { rate: 5, depth: 100, waveform: 0 },
        lfo2: { rate: 0.5, depth: 0.3, waveform: 2 },
        vcf: { cutoff: 2000, resonance: 1, filterType: 0 },
        vca: { initialGain: 0.7, modAmount: 0 },
        output: { masterVolume: 0.3 },
      },
      ...LEVEL4_SIGS,
    },
  },
  {
    id: 5,
    name: '太空飞船启动',
    difficulty: 3,
    description: '慢速 LFO 调制滤波器截止频率，产生飞船启动的呼啸感',
    hint: 'VCO-1 → VCF → OUTPUT，同时 LFO-2 OUT → VCF CUTOFF CV',
    availableModules: ['vco1', 'vcf', 'lfo2', 'output'],
    unlocked: false,
    completed: false,
    bestScore: 0,
    target: {
      cables: [
        { id: 'l5-1', from: 'vco1:OUT', to: 'vcf:IN', color: '#4da6ff' },
        { id: 'l5-2', from: 'lfo2:OUT', to: 'vcf:CUTOFF_CV', color: '#ffd93d' },
        { id: 'l5-3', from: 'vcf:OUT', to: 'output:IN', color: '#6bcb77' },
      ],
      params: {
        vco1: { frequency: 440, waveform: 2 },
        vco2: { frequency: 330, waveform: 1 },
        lfo1: { rate: 5, depth: 100, waveform: 0 },
        lfo2: { rate: 0.5, depth: 0.3, waveform: 2 },
        vcf: { cutoff: 3000, resonance: 3, filterType: 0 },
        vca: { initialGain: 0.7, modAmount: 0 },
        output: { masterVolume: 0.3 },
      },
      ...LEVEL5_SIGS,
    },
  },
  {
    id: 6,
    name: '海底声波',
    difficulty: 3,
    description: '三角波加上快速频率调制，像深海中传来的脉冲信号',
    hint: 'LFO-1(锯齿10Hz,深度150) → VCO-1 FM IN；VCO-1(三角波180Hz) → OUTPUT',
    availableModules: ['vco1', 'lfo1', 'output'],
    unlocked: false,
    completed: false,
    bestScore: 0,
    target: {
      cables: [
        { id: 'l6-1', from: 'lfo1:OUT', to: 'vco1:FM_IN', color: '#c780e8' },
        { id: 'l6-2', from: 'vco1:OUT', to: 'output:IN', color: '#4da6ff' },
      ],
      params: {
        vco1: { frequency: 180, waveform: 3 },
        vco2: { frequency: 330, waveform: 1 },
        lfo1: { rate: 10, depth: 150, waveform: 2 },
        lfo2: { rate: 0.5, depth: 0.3, waveform: 2 },
        vcf: { cutoff: 2000, resonance: 1, filterType: 0 },
        vca: { initialGain: 0.7, modAmount: 0 },
        output: { masterVolume: 0.3 },
      },
      ...LEVEL6_SIGS,
    },
  },
  {
    id: 7,
    name: '金属共振',
    difficulty: 4,
    description: '高 Q 值滤波器在方波上制造出钟铃般的金属共鸣',
    hint: 'VCO-1(方波660Hz) → VCF(低通600Hz,Q=5) → OUTPUT',
    availableModules: ['vco1', 'vcf', 'output'],
    unlocked: false,
    completed: false,
    bestScore: 0,
    target: {
      cables: [
        { id: 'l7-1', from: 'vco1:OUT', to: 'vcf:IN', color: '#ff8c42' },
        { id: 'l7-2', from: 'vcf:OUT', to: 'output:IN', color: '#ffcc00' },
      ],
      params: {
        vco1: { frequency: 660, waveform: 1 },
        vco2: { frequency: 330, waveform: 1 },
        lfo1: { rate: 5, depth: 100, waveform: 0 },
        lfo2: { rate: 0.5, depth: 0.3, waveform: 2 },
        vcf: { cutoff: 600, resonance: 5, filterType: 0 },
        vca: { initialGain: 0.7, modAmount: 0 },
        output: { masterVolume: 0.3 },
      },
      ...LEVEL7_SIGS,
    },
  },
  {
    id: 8,
    name: 'LFO 双重奏',
    difficulty: 4,
    description: '同时使用频率调制和滤波器调制，实现丰富的动态音色',
    hint: 'LFO1→VCO1 FM；VCO1→VCF；LFO2→VCF CV；VCF→OUTPUT。锯齿550Hz',
    availableModules: ['vco1', 'vcf', 'lfo1', 'lfo2', 'output'],
    unlocked: false,
    completed: false,
    bestScore: 0,
    target: {
      cables: [
        { id: 'l8-1', from: 'lfo1:OUT', to: 'vco1:FM_IN', color: '#c780e8' },
        { id: 'l8-2', from: 'vco1:OUT', to: 'vcf:IN', color: '#4da6ff' },
        { id: 'l8-3', from: 'lfo2:OUT', to: 'vcf:CUTOFF_CV', color: '#ffd93d' },
        { id: 'l8-4', from: 'vcf:OUT', to: 'output:IN', color: '#6bcb77' },
      ],
      params: {
        vco1: { frequency: 550, waveform: 2 },
        vco2: { frequency: 330, waveform: 1 },
        lfo1: { rate: 2, depth: 120, waveform: 0 },
        lfo2: { rate: 0.5, depth: 0.3, waveform: 2 },
        vcf: { cutoff: 1500, resonance: 2, filterType: 0 },
        vca: { initialGain: 0.7, modAmount: 0 },
        output: { masterVolume: 0.3 },
      },
      ...LEVEL8_SIGS,
    },
  },
  {
    id: 9,
    name: '高频颤音',
    difficulty: 4,
    description: '快速高频正弦波配合快速 LFO 颤音，像外星昆虫的鸣叫',
    hint: 'LFO-1(方波15Hz深度100) → VCO-1 FM IN；VCO-1(正弦880Hz) → VCF(高通8000Hz) → OUTPUT',
    availableModules: ['vco1', 'vcf', 'lfo1', 'output'],
    unlocked: false,
    completed: false,
    bestScore: 0,
    target: {
      cables: [
        { id: 'l9-1', from: 'lfo1:OUT', to: 'vco1:FM_IN', color: '#ff4d4d' },
        { id: 'l9-2', from: 'vco1:OUT', to: 'vcf:IN', color: '#4da6ff' },
        { id: 'l9-3', from: 'vcf:OUT', to: 'output:IN', color: '#6bcb77' },
      ],
      params: {
        vco1: { frequency: 880, waveform: 0 },
        vco2: { frequency: 330, waveform: 1 },
        lfo1: { rate: 15, depth: 100, waveform: 1 },
        lfo2: { rate: 0.5, depth: 0.3, waveform: 2 },
        vcf: { cutoff: 8000, resonance: 0.1, filterType: 1 },
        vca: { initialGain: 0.7, modAmount: 0 },
        output: { masterVolume: 0.3 },
      },
      ...LEVEL9_SIGS,
    },
  },
  {
    id: 10,
    name: '最终挑战：大师之音',
    difficulty: 5,
    description: '所有技巧的综合考验：调制 + 滤波 + 共振，创造完美大师音色',
    hint: 'VCO-1(三角110Hz) → VCF；LFO1→VCO1 FM；LFO2→VCF CV；VCF低通500Hz Q=7',
    availableModules: ['vco1', 'vcf', 'vca', 'lfo1', 'lfo2', 'output'],
    unlocked: false,
    completed: false,
    bestScore: 0,
    target: {
      cables: [
        { id: 'l10-1', from: 'lfo1:OUT', to: 'vco1:FM_IN', color: '#c780e8' },
        { id: 'l10-2', from: 'vco1:OUT', to: 'vcf:IN', color: '#4da6ff' },
        { id: 'l10-3', from: 'lfo2:OUT', to: 'vcf:CUTOFF_CV', color: '#ffd93d' },
        { id: 'l10-4', from: 'vcf:OUT', to: 'output:IN', color: '#ff8c42' },
      ],
      params: {
        vco1: { frequency: 110, waveform: 3 },
        vco2: { frequency: 330, waveform: 1 },
        lfo1: { rate: 3, depth: 200, waveform: 0 },
        lfo2: { rate: 0.5, depth: 0.3, waveform: 2 },
        vcf: { cutoff: 500, resonance: 7, filterType: 0 },
        vca: { initialGain: 0.7, modAmount: 0 },
        output: { masterVolume: 0.3 },
      },
      ...LEVEL10_SIGS,
    },
  },
];
