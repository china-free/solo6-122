import React, { useEffect } from 'react';
import { useSynthStore } from '@/store/useSynthStore';
import { getCableGradient } from '@/utils/colorPalette';

interface CableCanvasProps {
  panelEl: HTMLElement | null;
  width: number;
  height: number;
}

function buildPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const base = Math.max(80, Math.min(200, (dx + dy) * 0.6));
  const cp1x = x1 + base;
  const cp1y = y1;
  const cp2x = x2 - base;
  const cp2y = y2;
  return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
}

export const CableCanvas: React.FC<CableCanvasProps> = ({ panelEl, width, height }) => {
  const {
    cables,
    jackPositions,
    dragFrom,
    dragTo,
    isVictory,
    removeCable,
    updateDrag,
    endDrag,
  } = useSynthStore();

  useEffect(() => {
    if (!dragFrom) return;
    const handleMove = (e: PointerEvent) => {
      if (!panelEl) return;
      const r = panelEl.getBoundingClientRect();
      updateDrag(e.clientX - r.left, e.clientY - r.top);
    };
    const handleUp = (e: PointerEvent) => {
      endDrag(null);
      e.preventDefault();
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragFrom, panelEl, updateDrag, endDrag]);

  const defs = (
    <defs>
      {cables.map(c => {
        const [c1, c2] = getCableGradient(c.color);
        return (
          <linearGradient key={`g-${c.id}`} id={`grad-${c.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="45%" stopColor={c.color} />
            <stop offset="55%" stopColor={c2} />
            <stop offset="100%" stopColor={c1} />
          </linearGradient>
        );
      })}
      <filter id="cable-glow">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );

  const fromPos = dragFrom ? jackPositions.get(dragFrom) : null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      style={{ zIndex: 50 }}
    >
      {defs}
      {cables.map(c => {
        const from = jackPositions.get(c.from);
        const to = jackPositions.get(c.to);
        if (!from || !to) return null;
        const d = buildPath(from.x, from.y, to.x, to.y);
        return (
          <g key={c.id} style={{ pointerEvents: 'auto' }}>
            <path
              d={d}
              stroke="rgba(0,0,0,0.5)"
              strokeWidth={8}
              fill="none"
              strokeLinecap="round"
              transform="translate(0, 2)"
            />
            <path
              className={`cable-path ${isVictory ? 'victory' : ''}`}
              d={d}
              stroke={`url(#grad-${c.id})`}
              filter="url(#cable-glow)"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (confirm('删除这条连线？')) removeCable(c.id);
              }}
            />
            <circle cx={from.x} cy={from.y} r={5} fill={c.color} stroke="#000" strokeWidth={1} />
            <circle cx={to.x} cy={to.y} r={5} fill={c.color} stroke="#000" strokeWidth={1} />
          </g>
        );
      })}

      {dragFrom && fromPos && dragTo && (
        <path
          className="cable-path preview"
          d={buildPath(fromPos.x, fromPos.y, dragTo.x, dragTo.y)}
          stroke="#ffcc00"
          strokeDasharray="8 4"
        />
      )}
    </svg>
  );
};
