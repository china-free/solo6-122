import React from 'react';

interface WaveSelectorProps {
  value: number;
  onChange: (v: number) => void;
}

const WAVES: { idx: number; label: string; path: React.ReactNode }[] = [
  {
    idx: 0,
    label: 'SIN',
    path: <path d="M 4 12 Q 8 2 12 12 T 20 12 T 28 12" fill="none" stroke="#a0a0a8" strokeWidth="1.5" strokeLinecap="round" />,
  },
  {
    idx: 1,
    label: 'SQR',
    path: <path d="M 4 18 L 4 6 L 10 6 L 10 18 L 16 18 L 16 6 L 22 6 L 22 18 L 28 18" fill="none" stroke="#a0a0a8" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />,
  },
  {
    idx: 2,
    label: 'SAW',
    path: <path d="M 4 18 L 10 6 L 10 18 L 16 6 L 16 18 L 22 6 L 22 18 L 28 6" fill="none" stroke="#a0a0a8" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />,
  },
  {
    idx: 3,
    label: 'TRI',
    path: <path d="M 4 14 L 8 6 L 14 18 L 20 6 L 26 18 L 28 16" fill="none" stroke="#a0a0a8" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />,
  },
];

export const WaveSelector: React.FC<WaveSelectorProps> = ({ value, onChange }) => (
  <div className="flex flex-col items-center gap-1">
    <span className="label-tag">SHAPE</span>
    <div className="flex gap-1">
      {WAVES.map(w => (
        <button
          key={w.idx}
          className={`btn-wave ${value === w.idx ? 'active' : ''}`}
          onClick={() => onChange(w.idx)}
          title={w.label}
        >
          <svg viewBox="0 0 32 24" width="26" height="18">
            {w.path}
          </svg>
        </button>
      ))}
    </div>
  </div>
);

interface FilterSelectorProps {
  value: number;
  onChange: (v: number) => void;
}

const FILTERS: { idx: number; label: string }[] = [
  { idx: 0, label: 'LP' },
  { idx: 1, label: 'HP' },
  { idx: 2, label: 'BP' },
  { idx: 3, label: 'NO' },
];

export const FilterSelector: React.FC<FilterSelectorProps> = ({ value, onChange }) => (
  <div className="flex flex-col items-center gap-1">
    <span className="label-tag">MODE</span>
    <div className="flex gap-1">
      {FILTERS.map(f => (
        <button
          key={f.idx}
          className={`btn-wave font-mono text-[10px] ${value === f.idx ? 'active' : ''}`}
          onClick={() => onChange(f.idx)}
          style={{ width: 30 }}
        >
          {f.label}
        </button>
      ))}
    </div>
  </div>
);
