import React from 'react';
import { Play, RotateCcw, CheckCircle2, Home, Volume2, Lightbulb } from 'lucide-react';
import { useSynthStore } from '@/store/useSynthStore';

export const ControlBar: React.FC = () => {
  const {
    getCurrentLevel,
    playTargetSound,
    resetLevel,
    checkMatch,
    setView,
    isPlayingTarget,
    isCheckingMatch,
  } = useSynthStore();
  const level = getCurrentLevel();
  const diffStars = level ? '★'.repeat(level.difficulty) : '';

  return (
    <div className="w-full flex items-center justify-between px-8 py-3 rack-rail brushed-metal-texture">
      <div className="flex items-center gap-3">
        <button
          className="btn-rack px-4 py-2 flex items-center gap-2 text-sm"
          onClick={() => setView('home')}
        >
          <Home size={14} />
          <span>LEVELS</span>
        </button>

        <div className="h-8 w-px bg-black/50 mx-2" />

        <div className="flex flex-col justify-center">
          <span className="font-display text-lg tracking-widest text-bronze-100 leading-none">
            LV {level?.id.toString().padStart(2, '0')} · {level?.name}
          </span>
          <span className="font-mono text-[10px] tracking-wider text-zinc-400 mt-0.5 leading-none">
            难度 {diffStars}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-black/30 rounded px-2 py-1 border border-black/50">
          <Lightbulb size={12} className="text-neon-yellow" />
          <span className="font-mono text-[10px] text-neon-yellow/90 max-w-[280px] truncate">
            {level?.hint}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="btn-rack px-4 py-2 flex items-center gap-2 text-sm"
          onClick={playTargetSound}
          disabled={isPlayingTarget}
        >
          <Volume2 size={14} className={isPlayingTarget ? 'animate-pulse text-neon-green' : ''} />
          <span>{isPlayingTarget ? 'PLAYING...' : 'TARGET'}</span>
        </button>

        <button
          className="btn-rack px-4 py-2 flex items-center gap-2 text-sm"
          onClick={resetLevel}
        >
          <RotateCcw size={14} />
          <span>RESET</span>
        </button>

        <button
          className="btn-rack primary px-6 py-2 flex items-center gap-2 text-sm"
          onClick={checkMatch}
          disabled={isCheckingMatch}
          style={{ minWidth: 140 }}
        >
          {isCheckingMatch ? (
            <>
              <div className="w-3 h-3 border-2 border-white/60 border-t-white rounded-full animate-spin" />
              <span>ANALYZING...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={14} />
              <span>CHECK MATCH</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
