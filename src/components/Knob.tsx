import React, { useRef, useCallback, useEffect, useState } from 'react';

interface KnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
  size?: number;
}

export const Knob: React.FC<KnobProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  size = 48,
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startY: number; startVal: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const range = max - min;
  const normalized = (value - min) / range;
  const angle = -140 + normalized * 280;

  const formatValue = (v: number): string => {
    if (step >= 1) return Math.round(v).toString();
    if (step >= 0.1) return v.toFixed(1);
    if (step >= 0.01) return v.toFixed(2);
    return v.toFixed(3);
  };

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    dragState.current = { startY: e.clientY, startVal: value };
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [value]);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!dragState.current) return;
      const delta = dragState.current.startY - e.clientY;
      const sensitivity = range / 200;
      let newVal = dragState.current.startVal + delta * sensitivity;
      newVal = Math.round(newVal / step) * step;
      newVal = Math.min(max, Math.max(min, newVal));
      if (newVal !== value) onChange(newVal);
    };
    const handleUp = (e: PointerEvent) => {
      dragState.current = null;
      setIsDragging(false);
      try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [min, max, step, range, value, onChange]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="knob-outer"
        ref={knobRef}
        onPointerDown={onPointerDown}
        style={{
          width: size,
          height: size,
          ['--knob-angle' as any]: `${Math.max(0, Math.min(280, normalized * 280))}deg`,
          transform: isDragging ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.1s',
        }}
      >
        <div
          className="knob-inner"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <div className="knob-pointer" />
        </div>
      </div>
      <div className="label-tag">{label}</div>
      <div
        className="font-mono text-[10px] leading-none"
        style={{ color: '#ffcc00', textShadow: '0 0 4px rgba(255,204,0,0.3)' }}
      >
        {formatValue(value)}{unit ?? ''}
      </div>
    </div>
  );
};
