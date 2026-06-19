import type { Cable, JackType, ModuleId, ParamMap, WaveformType, FilterType } from '@/types/synth';
import { MODULE_DEFS } from '@/data/moduleDefs';
import { getJackDef } from '@/data/moduleDefs';

type AudioJackRef = {
  node?: AudioNode;
  param?: AudioParam;
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyserTime: AnalyserNode | null = null;
  private analyserFreq: AnalyserNode | null = null;
  private nodes: Map<ModuleId, Map<string, AudioNode>> = new Map();
  private jackRefs: Map<string, AudioJackRef> = new Map();
  private connections: Set<string> = new Set();
  private activeOscillators: Set<OscillatorNode> = new Set();

  async init(): Promise<void> {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3;

    this.analyserTime = this.ctx.createAnalyser();
    this.analyserTime.fftSize = 2048;

    this.analyserFreq = this.ctx.createAnalyser();
    this.analyserFreq.fftSize = 1024;

    this.masterGain.connect(this.analyserTime);
    this.masterGain.connect(this.analyserFreq);
    this.analyserTime.connect(this.ctx.destination);

    this.buildAllModules();
  }

  private ensureCtx(): AudioContext {
    if (!this.ctx) throw new Error('AudioEngine not initialized');
    return this.ctx;
  }

  private buildAllModules() {
    const ctx = this.ensureCtx();
    for (const def of MODULE_DEFS) {
      this.buildModule(def.id, ctx);
    }
    this.registerJack('output:IN', { node: this.masterGain });
  }

  private buildModule(id: ModuleId, ctx: AudioContext) {
    const moduleNodes = new Map<string, AudioNode>();

    switch (id) {
      case 'vco1':
      case 'vco2': {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 220;
        const outGain = ctx.createGain();
        outGain.gain.value = 0.6;
        osc.connect(outGain);
        osc.start();
        this.activeOscillators.add(osc);
        moduleNodes.set('osc', osc);
        moduleNodes.set('out', outGain);
        this.registerJack(`${id}:OUT`, { node: outGain });
        this.registerJack(`${id}:FM_IN`, { param: osc.frequency });
        this.registerJack(`${id}:PWM_IN`, { param: osc.frequency });
        break;
      }
      case 'lfo1':
      case 'lfo2': {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 5;
        const depthGain = ctx.createGain();
        depthGain.gain.value = 100;
        osc.connect(depthGain);
        osc.start();
        this.activeOscillators.add(osc);
        moduleNodes.set('osc', osc);
        moduleNodes.set('depth', depthGain);
        this.registerJack(`${id}:OUT`, { node: depthGain });
        break;
      }
      case 'vcf': {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        filter.Q.value = 1;
        moduleNodes.set('filter', filter);
        this.registerJack(`${id}:IN`, { node: filter });
        this.registerJack(`${id}:OUT`, { node: filter });
        this.registerJack(`${id}:CUTOFF_CV`, { param: filter.frequency });
        break;
      }
      case 'vca': {
        const initGain = ctx.createGain();
        initGain.gain.value = 0.7;
        const cvGain = ctx.createGain();
        cvGain.gain.value = 0;
        const sum = ctx.createGain();
        sum.gain.value = 1;
        initGain.connect(sum);
        cvGain.connect(sum.gain);
        moduleNodes.set('init', initGain);
        moduleNodes.set('cv', cvGain);
        moduleNodes.set('sum', sum);
        this.registerJack(`${id}:IN`, { node: initGain });
        this.registerJack(`${id}:CV_IN`, { node: cvGain });
        this.registerJack(`${id}:OUT`, { node: sum });
        break;
      }
      case 'output':
        break;
    }

    this.nodes.set(id, moduleNodes);
  }

  private registerJack(jackId: string, ref: AudioJackRef) {
    this.jackRefs.set(jackId, ref);
  }

  resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setParam(moduleId: ModuleId, paramName: string, value: number): void {
    const ctx = this.ensureCtx();
    const moduleNodes = this.nodes.get(moduleId);
    if (!moduleNodes) return;

    switch (moduleId) {
      case 'vco1':
      case 'vco2': {
        const osc = moduleNodes.get('osc') as OscillatorNode;
        if (!osc) return;
        if (paramName === 'frequency') {
          osc.frequency.setTargetAtTime(value, ctx.currentTime, 0.01);
        } else if (paramName === 'waveform') {
          const types: WaveformType[] = ['sine', 'square', 'sawtooth', 'triangle'];
          osc.type = types[Math.floor(value)] ?? 'sawtooth';
        }
        break;
      }
      case 'lfo1':
      case 'lfo2': {
        const osc = moduleNodes.get('osc') as OscillatorNode;
        const depth = moduleNodes.get('depth') as GainNode;
        if (paramName === 'rate' && osc) {
          osc.frequency.setTargetAtTime(value, ctx.currentTime, 0.01);
        } else if (paramName === 'depth' && depth) {
          depth.gain.setTargetAtTime(value, ctx.currentTime, 0.01);
        } else if (paramName === 'waveform' && osc) {
          const types: WaveformType[] = ['sine', 'square', 'sawtooth', 'triangle'];
          osc.type = types[Math.floor(value)] ?? 'sine';
        }
        break;
      }
      case 'vcf': {
        const filter = moduleNodes.get('filter') as BiquadFilterNode;
        if (!filter) return;
        if (paramName === 'cutoff') {
          filter.frequency.setTargetAtTime(value, ctx.currentTime, 0.01);
        } else if (paramName === 'resonance') {
          filter.Q.setTargetAtTime(value, ctx.currentTime, 0.01);
        } else if (paramName === 'filterType') {
          const types: FilterType[] = ['lowpass', 'highpass', 'bandpass', 'notch'];
          filter.type = types[Math.floor(value)] ?? 'lowpass';
        }
        break;
      }
      case 'vca': {
        const init = moduleNodes.get('init') as GainNode;
        const cv = moduleNodes.get('cv') as GainNode;
        if (paramName === 'initialGain' && init) {
          init.gain.setTargetAtTime(value, ctx.currentTime, 0.01);
        } else if (paramName === 'modAmount' && cv) {
          cv.gain.setTargetAtTime(value, ctx.currentTime, 0.01);
        }
        break;
      }
      case 'output': {
        if (paramName === 'masterVolume' && this.masterGain) {
          this.masterGain.gain.setTargetAtTime(value, ctx.currentTime, 0.01);
        }
        break;
      }
    }
  }

  applyAllParams(params: ParamMap): void {
    for (const [moduleId, modParams] of Object.entries(params)) {
      for (const [name, val] of Object.entries(modParams)) {
        this.setParam(moduleId as ModuleId, name, val);
      }
    }
  }

  applyAllCables(cables: Cable[]): void {
    this.disconnectAll();
    for (const c of cables) {
      this.connect(c);
    }
  }

  connect(cable: Cable): void {
    const key = `${cable.from}->${cable.to}`;
    if (this.connections.has(key)) return;

    const fromJack = this.jackRefs.get(cable.from);
    const toJack = this.jackRefs.get(cable.to);
    const fromDef = getJackDef(cable.from);
    const toDef = getJackDef(cable.to);

    if (!fromJack || !toJack || !fromDef || !toDef) return;
    if (!fromJack.node) return;

    try {
      const fromType = fromDef.type;
      const toType = toDef.type;

      if ((fromType === 'audio_out' || fromType === 'cv_out') &&
          (toType === 'audio_in' || toType === 'cv_in')) {
        if (toJack.param) {
          fromJack.node.connect(toJack.param);
        } else if (toJack.node) {
          fromJack.node.connect(toJack.node);
        }
        this.connections.add(key);
      }
    } catch (e) {
      console.warn('connect failed:', e);
    }
  }

  disconnect(cable: Cable): void {
    const key = `${cable.from}->${cable.to}`;
    if (!this.connections.has(key)) return;

    const fromJack = this.jackRefs.get(cable.from);
    const toJack = this.jackRefs.get(cable.to);
    if (!fromJack?.node) {
      this.connections.delete(key);
      return;
    }
    try {
      if (toJack?.param) {
        fromJack.node.disconnect(toJack.param);
      } else if (toJack?.node) {
        fromJack.node.disconnect(toJack.node);
      }
    } catch (e) {}
    this.connections.delete(key);
  }

  disconnectAll(): void {
    for (const key of Array.from(this.connections)) {
      const [from, to] = key.split('->');
      const fromJack = this.jackRefs.get(from);
      const toJack = this.jackRefs.get(to);
      try {
        if (fromJack?.node && toJack?.param) {
          fromJack.node.disconnect(toJack.param);
        } else if (fromJack?.node && toJack?.node) {
          fromJack.node.disconnect(toJack.node);
        }
      } catch (e) {}
    }
    this.connections.clear();
  }

  getTimeDomainData(arr: Uint8Array): void {
    this.analyserTime?.getByteTimeDomainData(arr);
  }

  getFrequencyData(arr: Uint8Array): void {
    this.analyserFreq?.getByteFrequencyData(arr);
  }

  getTimeDomainFloat(arr: Float32Array): void {
    this.analyserTime?.getFloatTimeDomainData(arr);
  }

  getFrequencyFloat(arr: Float32Array): void {
    this.analyserFreq?.getFloatFrequencyData(arr);
  }

  isInitialized(): boolean {
    return this.ctx !== null;
  }

  destroy(): void {
    this.disconnectAll();
    for (const osc of this.activeOscillators) {
      try { osc.stop(); } catch (e) {}
    }
    this.activeOscillators.clear();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.nodes.clear();
    this.jackRefs.clear();
  }

  previewTargetSound(params: ParamMap, cables: Cable[], duration: number = 2): void {
    const savedParams: ParamMap = JSON.parse(JSON.stringify(this.snapshotParams()));
    const savedCables: Cable[] = this.getAllCablesSnapshot(cables);
    
    this.applyAllCables(cables);
    this.applyAllParams(params);
    
    setTimeout(() => {
      this.applyAllCables(savedCables);
      this.applyAllParams(savedParams);
    }, duration * 1000);
  }

  private snapshotParams(): ParamMap {
    const result: ParamMap = {} as ParamMap;
    const paramNames: Record<ModuleId, string[]> = {
      vco1: ['frequency', 'waveform'],
      vco2: ['frequency', 'waveform'],
      vcf: ['cutoff', 'resonance', 'filterType'],
      vca: ['initialGain', 'modAmount'],
      lfo1: ['rate', 'depth', 'waveform'],
      lfo2: ['rate', 'depth', 'waveform'],
      output: ['masterVolume'],
    };
    for (const [modId, names] of Object.entries(paramNames)) {
      result[modId as ModuleId] = {};
      for (const name of names) {
        result[modId as ModuleId][name] = this.readParamValue(modId as ModuleId, name);
      }
    }
    return result;
  }

  private readParamValue(moduleId: ModuleId, paramName: string): number {
    const moduleNodes = this.nodes.get(moduleId);
    if (!moduleNodes) return 0;
    switch (moduleId) {
      case 'vco1': case 'vco2': {
        const osc = moduleNodes.get('osc') as OscillatorNode;
        if (paramName === 'frequency') return osc?.frequency.value ?? 220;
        if (paramName === 'waveform') {
          const idx = ['sine','square','sawtooth','triangle'].indexOf(osc?.type ?? 'sawtooth');
          return idx >= 0 ? idx : 2;
        }
        break;
      }
      case 'lfo1': case 'lfo2': {
        const osc = moduleNodes.get('osc') as OscillatorNode;
        const depth = moduleNodes.get('depth') as GainNode;
        if (paramName === 'rate') return osc?.frequency.value ?? 5;
        if (paramName === 'depth') return depth?.gain.value ?? 100;
        if (paramName === 'waveform') {
          const idx = ['sine','square','sawtooth','triangle'].indexOf(osc?.type ?? 'sine');
          return idx >= 0 ? idx : 0;
        }
        break;
      }
      case 'vcf': {
        const f = moduleNodes.get('filter') as BiquadFilterNode;
        if (paramName === 'cutoff') return f?.frequency.value ?? 2000;
        if (paramName === 'resonance') return f?.Q.value ?? 1;
        if (paramName === 'filterType') {
          const idx = ['lowpass','highpass','bandpass','notch'].indexOf(f?.type ?? 'lowpass');
          return idx >= 0 ? idx : 0;
        }
        break;
      }
      case 'vca': {
        const init = moduleNodes.get('init') as GainNode;
        const cv = moduleNodes.get('cv') as GainNode;
        if (paramName === 'initialGain') return init?.gain.value ?? 0.7;
        if (paramName === 'modAmount') return cv?.gain.value ?? 0;
        break;
      }
      case 'output': {
        if (paramName === 'masterVolume') return this.masterGain?.gain.value ?? 0.3;
        break;
      }
    }
    return 0;
  }

  private getAllCablesSnapshot(currentCables: Cable[]): Cable[] {
    return [...currentCables];
  }

  checkJackType(jackId: string): JackType | null {
    const def = getJackDef(jackId);
    return def?.type ?? null;
  }
}

export const audioEngine = new AudioEngine();
