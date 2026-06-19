import { create } from 'zustand';
import type { Cable, Level, ModuleId, ParamMap } from '@/types/synth';
import { LEVELS } from '@/data/levels';
import { MODULE_DEFS, getModuleDef } from '@/data/moduleDefs';
import { audioEngine } from '@/engine/AudioEngine';
import { getRandomCableColor } from '@/utils/colorPalette';
import { computeMatchScore } from '@/utils/waveformMatch';

type View = 'home' | 'play';

interface JackScreenPos {
  id: string;
  x: number;
  y: number;
}

interface SynthState {
  view: View;
  currentLevelId: number;
  levels: Level[];
  params: ParamMap;
  cables: Cable[];
  matchScore: number;
  isVictory: boolean;
  isCheckingMatch: boolean;
  isPlayingTarget: boolean;
  jackPositions: Map<string, JackScreenPos>;
  dragFrom: string | null;
  dragTo: { x: number; y: number } | null;
  hoverJack: string | null;
  setView: (v: View) => void;
  setCurrentLevel: (id: number) => void;
  initAudio: () => Promise<void>;
  setParam: (moduleId: ModuleId, name: string, value: number) => void;
  resetLevel: () => void;
  startDrag: (fromJackId: string) => void;
  updateDrag: (x: number, y: number) => void;
  endDrag: (toJackId: string | null) => void;
  removeCable: (cableId: string) => void;
  setJackPosition: (id: string, x: number, y: number) => void;
  setHoverJack: (id: string | null) => void;
  playTargetSound: () => void;
  checkMatch: () => void;
  completeLevel: (levelId: number, score: number) => void;
  resetVictory: () => void;
  getCurrentLevel: () => Level | undefined;
  getJackPosition: (id: string) => JackScreenPos | undefined;
}

function buildDefaultParams(): ParamMap {
  const result = {} as ParamMap;
  for (const def of MODULE_DEFS) {
    result[def.id] = {};
    for (const knob of def.knobs) {
      result[def.id][knob.name] = knob.default;
    }
  }
  return result;
}

export const useSynthStore = create<SynthState>((set, get) => ({
  view: 'home',
  currentLevelId: 1,
  levels: LEVELS,
  params: buildDefaultParams(),
  cables: [],
  matchScore: 0,
  isVictory: false,
  isCheckingMatch: false,
  isPlayingTarget: false,
  jackPositions: new Map(),
  dragFrom: null,
  dragTo: null,
  hoverJack: null,

  setView: (v) => set({ view: v }),

  setCurrentLevel: (id) => {
    const state = get();
    const lvl = state.levels.find(l => l.id === id);
    if (!lvl || !lvl.unlocked) return;
    const defParams = buildDefaultParams();
    set({
      currentLevelId: id,
      params: defParams,
      cables: [],
      matchScore: 0,
      isVictory: false,
      view: 'play',
    });
    if (audioEngine.isInitialized()) {
      audioEngine.applyAllParams(defParams);
      audioEngine.disconnectAll();
    }
  },

  initAudio: async () => {
    if (!audioEngine.isInitialized()) {
      await audioEngine.init();
      const { params, cables } = get();
      audioEngine.applyAllParams(params);
      audioEngine.applyAllCables(cables);
    }
    audioEngine.resume();
  },

  setParam: (moduleId, name, value) => {
    const state = get();
    const def = getModuleDef(moduleId);
    if (!def) return;
    const knob = def.knobs.find(k => k.name === name);
    if (!knob) return;
    const clamped = Math.min(knob.max, Math.max(knob.min, Math.round(value / knob.step) * knob.step));
    const newParams = {
      ...state.params,
      [moduleId]: { ...state.params[moduleId], [name]: clamped },
    };
    set({ params: newParams });
    audioEngine.setParam(moduleId, name, clamped);
  },

  resetLevel: () => {
    const defParams = buildDefaultParams();
    set({
      params: defParams,
      cables: [],
      matchScore: 0,
      isVictory: false,
    });
    if (audioEngine.isInitialized()) {
      audioEngine.applyAllParams(defParams);
      audioEngine.disconnectAll();
    }
  },

  startDrag: (fromJackId) => {
    set({ dragFrom: fromJackId, dragTo: null });
  },

  updateDrag: (x, y) => {
    set({ dragTo: { x, y } });
  },

  endDrag: (toJackId) => {
    const state = get();
    const from = state.dragFrom;
    set({ dragFrom: null, dragTo: null, hoverJack: null });
    if (!from || !toJackId || from === toJackId) return;
    const fromDef = MODULE_DEFS.flatMap(m => m.jacks).find(j => j.id === from);
    const toDef = MODULE_DEFS.flatMap(m => m.jacks).find(j => j.id === toJackId);
    if (!fromDef || !toDef) return;
    const fromIsOut = fromDef.type === 'audio_out' || fromDef.type === 'cv_out';
    const toIsIn = toDef.type === 'audio_in' || toDef.type === 'cv_in';
    let realFrom = from;
    let realTo = toJackId;
    if (!fromIsOut && toIsIn) {
      return;
    }
    if (fromIsOut && !toIsIn) {
      return;
    }
    if (!fromIsOut && !toIsIn) {
      return;
    }
    const exists = state.cables.find(c => 
      (c.from === realFrom && c.to === realTo) ||
      (c.to === realTo)
    );
    if (exists) return;
    const newCable: Cable = {
      id: `cable-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      from: realFrom,
      to: realTo,
      color: getRandomCableColor(),
    };
    const newCables = [...state.cables, newCable];
    set({ cables: newCables });
    audioEngine.connect(newCable);
  },

  removeCable: (cableId) => {
    const state = get();
    const cable = state.cables.find(c => c.id === cableId);
    if (!cable) return;
    set({ cables: state.cables.filter(c => c.id !== cableId) });
    audioEngine.disconnect(cable);
  },

  setJackPosition: (id, x, y) => {
    set(state => {
      const newMap = new Map(state.jackPositions);
      newMap.set(id, { id, x, y });
      return { jackPositions: newMap };
    });
  },

  setHoverJack: (id) => set({ hoverJack: id }),

  playTargetSound: () => {
    const state = get();
    const lvl = state.getCurrentLevel();
    if (!lvl) return;
    set({ isPlayingTarget: true });
    audioEngine.previewTargetSound(lvl.target.params, lvl.target.cables, 2);
    setTimeout(() => set({ isPlayingTarget: false }), 2200);
  },

  checkMatch: () => {
    const state = get();
    const lvl = state.getCurrentLevel();
    if (!lvl || !audioEngine.isInitialized()) return;
    set({ isCheckingMatch: true });

    let samples = 0;
    let totalScore = 0;
    const timeBuf = new Uint8Array(2048);
    const freqBuf = new Uint8Array(1024);

    const sample = () => {
      audioEngine.getTimeDomainData(timeBuf);
      audioEngine.getFrequencyData(freqBuf);
      const s = computeMatchScore(
        lvl.target.waveform,
        lvl.target.spectrum,
        timeBuf,
        freqBuf
      );
      totalScore += s.total;
      samples++;
      set({ matchScore: Math.round(totalScore / samples) });
      if (samples < 15) {
        requestAnimationFrame(sample);
      } else {
        const finalScore = Math.round(totalScore / samples);
        set({
          matchScore: finalScore,
          isCheckingMatch: false,
          isVictory: finalScore >= 85,
        });
        if (finalScore >= 85) {
          get().completeLevel(lvl.id, finalScore);
        }
      }
    };
    requestAnimationFrame(sample);
  },

  completeLevel: (levelId, score) => {
    set(state => ({
      levels: state.levels.map(l => {
        if (l.id === levelId) {
          return {
            ...l,
            completed: true,
            bestScore: Math.max(l.bestScore, score),
          };
        }
        if (l.id === levelId + 1) {
          return { ...l, unlocked: true };
        }
        return l;
      }),
    }));
  },

  resetVictory: () => set({ isVictory: false }),

  getCurrentLevel: () => {
    const state = get();
    return state.levels.find(l => l.id === state.currentLevelId);
  },

  getJackPosition: (id) => get().jackPositions.get(id),
}));
