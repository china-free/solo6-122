export type ModuleId = 'vco1' | 'vco2' | 'vcf' | 'vca' | 'lfo1' | 'lfo2' | 'output';
export type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle';
export type FilterType = 'lowpass' | 'highpass' | 'bandpass' | 'notch';
export type JackType = 'audio_out' | 'audio_in' | 'cv_out' | 'cv_in';

export interface JackDefinition {
  id: string;
  moduleId: ModuleId;
  name: string;
  type: JackType;
  x: number;
  y: number;
}

export interface Cable {
  id: string;
  from: string;
  to: string;
  color: string;
}

export interface KnobDefinition {
  name: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  unit?: string;
}

export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  subtitle: string;
  accentColor: string;
  width: number;
  height: number;
  knobs: KnobDefinition[];
  jacks: JackDefinition[];
  hasWaveSelector?: boolean;
  hasFilterSelector?: boolean;
}

export interface LevelTargetSound {
  cables: Cable[];
  params: Record<ModuleId, Record<string, number>>;
  waveform: number[];
  spectrum: number[];
}

export interface Level {
  id: number;
  name: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  description: string;
  hint: string;
  availableModules: ModuleId[];
  target: LevelTargetSound;
  unlocked: boolean;
  completed: boolean;
  bestScore: number;
}

export interface JackPosition {
  id: string;
  x: number;
  y: number;
}

export interface AudioState {
  isPlaying: boolean;
  masterVolume: number;
}

export type ParamMap = Record<ModuleId, Record<string, number>>;
