import React, { useRef, useEffect } from 'react';
import type { ModuleId } from '@/types/synth';
import { getModuleDef } from '@/data/moduleDefs';
import { useSynthStore } from '@/store/useSynthStore';
import { Screw } from './common/Screw';
import { Knob } from './Knob';
import { Jack } from './Jack';
import { WaveSelector, FilterSelector } from './WaveSelector';

interface SynthModuleProps {
  moduleId: ModuleId;
  panelEl: HTMLElement | null;
  x: number;
  y: number;
}

export const SynthModule: React.FC<SynthModuleProps> = ({ moduleId, panelEl, x, y }) => {
  const moduleRef = useRef<HTMLDivElement>(null);
  const def = getModuleDef(moduleId);
  const { params, setParam, isVictory } = useSynthStore();

  if (!def) return null;
  const modParams = params[moduleId] ?? {};

  return (
    <div
      ref={moduleRef}
      className={`module-panel absolute brushed-metal-texture ${isVictory ? 'animate-victory-flash' : ''}`}
      style={{
        left: x,
        top: y,
        width: def.width,
        height: def.height,
      }}
    >
      <div className="absolute top-1 left-1"><Screw size={10} rotation={0} /></div>
      <div className="absolute top-1 right-1"><Screw size={10} rotation={90} /></div>
      <div className="absolute bottom-1 left-1"><Screw size={10} rotation={180} /></div>
      <div className="absolute bottom-1 right-1"><Screw size={10} rotation={270} /></div>

      <div
        className="absolute top-2 left-3 right-3 h-12 flex flex-col items-center justify-center border-b border-t"
        style={{
          borderColor: 'rgba(0,0,0,0.4)',
          background: `linear-gradient(180deg, ${def.accentColor}22 0%, transparent 100%)`,
        }}
      >
        <div
          className="font-display text-xl tracking-widest leading-none"
          style={{ color: def.accentColor, textShadow: `0 0 8px ${def.accentColor}66` }}
        >
          {def.name}
        </div>
        <div className="font-mono text-[8px] tracking-wider text-zinc-500 mt-0.5">
          {def.subtitle}
        </div>
      </div>

      <div
        className="absolute top-16 left-3 right-3 flex items-center gap-2"
        style={{ height: 10 }}
      >
        <div className="flex gap-1 items-center">
          <span className="led text-neon-green animate-pulse-led" />
          <span className="label-tag" style={{ fontSize: 8 }}>PWR</span>
        </div>
        <div className="flex-1 h-px bg-black/40" />
        <span className="label-tag" style={{ fontSize: 8 }}>CH-{def.id.slice(-1).toUpperCase()}</span>
      </div>

      <div className="absolute top-28 left-0 right-0 flex flex-col gap-4 px-4">
        <div className="flex flex-wrap justify-center gap-3">
          {def.knobs.map(k => (
            (k.name !== 'waveform' && k.name !== 'filterType') && (
              <Knob
                key={k.name}
                label={k.label}
                value={modParams[k.name] ?? k.default}
                min={k.min}
                max={k.max}
                step={k.step}
                unit={k.unit}
                onChange={(v) => setParam(moduleId, k.name, v)}
              />
            )
          ))}
        </div>

        <div className="flex justify-center gap-4">
          {def.hasWaveSelector && (
            <WaveSelector
              value={modParams.waveform ?? 0}
              onChange={(v) => setParam(moduleId, 'waveform', v)}
            />
          )}
          {def.hasFilterSelector && (
            <FilterSelector
              value={modParams.filterType ?? 0}
              onChange={(v) => setParam(moduleId, 'filterType', v)}
            />
          )}
        </div>
      </div>

      <div className="absolute left-0 right-0 bottom-14 h-px bg-black/40 mx-4" />

      <div className="absolute left-0 right-0 bottom-14 mx-2 pt-2" style={{ height: 80 }}>
        {def.jacks.map(j => (
          <Jack
            key={j.id}
            jackId={j.id}
            moduleEl={moduleRef.current}
            panelEl={panelEl}
          />
        ))}
      </div>
    </div>
  );
};
