import React, { useRef } from 'react';
import type { ModuleId } from '@/types/synth';
import { useSynthStore } from '@/store/useSynthStore';
import { getModuleDef } from '@/data/moduleDefs';
import { Screw } from './common/Screw';
import { SynthModule } from './SynthModule';
import { CableCanvas } from './CableCanvas';
import { Oscilloscope } from './Oscilloscope';
import { ControlBar } from './ControlBar';

const MODULE_LAYOUT: { id: ModuleId; col: number; row: number }[] = [
  { id: 'vco1', col: 0, row: 0 },
  { id: 'vco2', col: 1, row: 0 },
  { id: 'lfo1', col: 2, row: 0 },
  { id: 'lfo2', col: 3, row: 0 },
  { id: 'vcf', col: 0, row: 1 },
  { id: 'vca', col: 1, row: 1 },
  { id: 'output', col: 2, row: 1 },
];

export const SynthesizerPanel: React.FC = () => {
  const panelRef = useRef<HTMLDivElement>(null);
  const level = useSynthStore((s) => s.getCurrentLevel());
  const isVictory = useSynthStore((s) => s.isVictory);
  const matchScore = useSynthStore((s) => s.matchScore);

  const available = level?.availableModules ?? [];
  const panelWidth = 1200;
  const panelHeight = 900;
  const colGap = 20;
  const modStartX = 24;
  const modStartY = 80;
  const row1Y = modStartY;
  const row2Y = modStartY + 380 + 20 + 80 + 40;

  function getModulePosition(id: ModuleId): { x: number; y: number } {
    const def = getModuleDef(id);
    if (!def) return { x: 0, y: 0 };
    const layout = MODULE_LAYOUT.find((l) => l.id === id);
    if (!layout) return { x: 0, y: 0 };

    if (layout.row === 0) {
      let x = modStartX;
      for (let i = 0; i < layout.col; i++) {
        const prevLayout = MODULE_LAYOUT.find((l) => l.row === 0 && l.col === i);
        if (prevLayout) {
          const prevDef = getModuleDef(prevLayout.id);
          if (prevDef) x += prevDef.width + colGap;
        }
      }
      return { x, y: row1Y };
    } else {
      const scopeEndX = modStartX + 560 + 20;
      let x = scopeEndX;
      const relCol = layout.col;
      for (let i = 0; i < relCol; i++) {
        const prevLayout = MODULE_LAYOUT.find((l) => l.row === 1 && l.col === i);
        if (prevLayout && prevLayout.id !== id) {
          const prevDef = getModuleDef(prevLayout.id);
          if (prevDef) x += prevDef.width + colGap;
        }
      }
      return { x, y: row2Y };
    }
  }

  const topBarStyle = { textShadow: '0 0 12px rgba(192,140,64,0.4)' };
  const modelStyle = { textShadow: '0 0 8px rgba(192,140,64,0.4)' };
  const victoryTextStyle = { textShadow: '0 0 20px rgba(52, 199, 89, 0.8), 0 0 40px rgba(52, 199, 89, 0.4)' };
  const victoryBoxStyle = { boxShadow: '0 0 60px rgba(52, 199, 89, 0.6)' };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="w-full h-14 flex items-center justify-between px-8 rack-rail brushed-metal-texture border-b-4 border-b-black/60 relative overflow-hidden">
        <div className="absolute top-1 left-3"><Screw /></div>
        <div className="absolute top-1 right-3"><Screw rotation={90} /></div>
        <div className="flex items-center gap-4">
          <div className="font-display text-2xl tracking-[0.25em] text-bronze-100" style={topBarStyle}>
            MODULAR PATCH LAB
          </div>
          <div className="flex items-center gap-1 ml-4">
            <span className="led text-neon-red animate-pulse-led" />
            <span className="label-tag" style={{ fontSize: 10 }}>PWR</span>
          </div>
        </div>
      </div>

      <ControlBar />

      <div className="flex-1 flex items-center justify-center overflow-auto p-4 bg-gradient-to-b from-black/40 to-black/60">
        <div
          ref={panelRef}
          className="rack-rail brushed-metal-texture relative rounded-sm"
          style={{
            width: panelWidth,
            height: panelHeight,
            minWidth: panelWidth,
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
          }}
        >
          <div className="absolute top-3 left-5"><Screw /></div>
          <div className="absolute top-3 right-5"><Screw rotation={90} /></div>
          <div className="absolute bottom-3 left-5"><Screw rotation={180} /></div>
          <div className="absolute bottom-3 right-5"><Screw rotation={270} /></div>

          <div className="absolute left-16 right-16 top-10 h-16 flex items-center justify-between px-6 border border-black/60 bg-black/30 rounded">
            <div className="flex items-center gap-3">
              <div className="font-display text-sm tracking-widest text-zinc-400">MODEL</div>
              <div className="font-display text-xl tracking-[0.3em] text-bronze-200" style={modelStyle}>
                MP-2000 / SERIES
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-0.5">
                    <span className="led text-neon-green" style={{ fontSize: 6, width: 6, height: 6 }} />
                    <span className="led text-neon-yellow" style={{ fontSize: 6, width: 6, height: 6, opacity: 0.3 + 0.7 / i }} />
                  </div>
                ))}
              </div>
              <div className="font-mono text-[10px] text-zinc-500 tracking-widest">MTRX</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="led text-neon-red animate-pulse-led" />
              <span className="font-mono text-[10px] text-zinc-400 tracking-widest">
                LVL {(level?.id ?? 0).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className="absolute" style={{ left: modStartX, top: row2Y }}>
            <Oscilloscope width={560} height={200} />
          </div>

          {MODULE_LAYOUT.map((layout) => {
            if (!available.includes(layout.id)) return null;
            const pos = getModulePosition(layout.id);
            return (
              <SynthModule
                key={layout.id}
                moduleId={layout.id}
                panelEl={panelRef.current}
                x={pos.x}
                y={pos.y}
              />
            );
          })}

          <CableCanvas panelEl={panelRef.current} width={panelWidth} height={panelHeight} />

          {isVictory && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ zIndex: 100 }}
            >
              <div
                className="bg-black/70 border-4 border-neon-green rounded-lg px-12 py-8 flex flex-col items-center animate-bounce"
                style={victoryBoxStyle}
              >
                <div
                  className="font-display text-6xl tracking-[0.2em] text-neon-green mb-2"
                  style={victoryTextStyle}
                >
                  PERFECT MATCH!
                </div>
                <div className="font-mono text-sm tracking-widest text-zinc-300">
                  音色匹配度 {matchScore}% 关卡通过！
                </div>
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-2 bg-black/40 rounded border border-black/60">
            <span className="font-mono text-[10px] tracking-widest text-zinc-500">
              JACKS: OUT TO IN (AUDIO/CV)
            </span>
            <span className="w-px h-3 bg-zinc-600" />
            <span className="font-mono text-[10px] tracking-widest text-zinc-500">
              CLICK CABLE TO DELETE
            </span>
            <span className="w-px h-3 bg-zinc-600" />
            <span className="font-mono text-[10px] tracking-widest text-zinc-500">
              DRAG KNOBS UP/DOWN
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
