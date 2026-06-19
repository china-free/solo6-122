import React from 'react';
import { Lock, Check, Star, Volume2 } from 'lucide-react';
import { useSynthStore } from '@/store/useSynthStore';
import { Screw } from './common/Screw';

export const LevelSelect: React.FC = () => {
  const { levels, setCurrentLevel, playTargetSound, initAudio } = useSynthStore();

  const completedCount = levels.filter(l => l.completed).length;
  const unlockedCount = levels.filter(l => l.unlocked).length;
  const progress = (completedCount / levels.length) * 100;

  const handleSelect = async (id: number) => {
    await initAudio();
    setCurrentLevel(id);
  };

  const handlePreview = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    initAudio().then(() => {
      const level = levels.find(l => l.id === id);
      if (level) playTargetSound();
    });
  };

  return (
    <div className="w-full h-full overflow-y-auto scrollbar-thin flex flex-col items-center py-8 bg-noise">
      <div className="w-full max-w-5xl px-8">
        <div className="module-panel p-6 mb-8 relative">
          <div className="absolute top-2 left-2"><Screw /></div>
          <div className="absolute top-2 right-2"><Screw rotation={90} /></div>
          <div className="absolute bottom-2 left-2"><Screw rotation={180} /></div>
          <div className="absolute bottom-2 right-2"><Screw rotation={270} /></div>

          <div className="text-center py-4">
            <div className="inline-block px-8 py-1 border-y border-bronze-500/40 mb-3">
              <h1
                className="font-display text-5xl tracking-[0.3em] text-bronze-100"
                style={{ textShadow: '0 0 20px rgba(192, 140, 64, 0.4), 0 2px 0 rgba(0,0,0,0.8)' }}
              >
                MODULAR PATCH LAB
              </h1>
            </div>
            <p className="font-mono text-xs tracking-widest text-zinc-400 mb-6">
              ━━━ 1972 ANALOG SYNTHESIZER SIMULATOR ━━━
            </p>
            <p className="font-body text-sm text-zinc-300 max-w-xl mx-auto leading-relaxed">
              穿越回70年代的电子音乐实验室。在这台布满旋钮的巨型机器上，
              用五颜六色的跳线连接 VCO、VCF、VCA 和 LFO，重现那些定义了时代的传奇音色。
              调节每一个参数，让示波器的绿光电光与目标完美重合。
            </p>
          </div>

          <div className="mt-6 px-8">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs tracking-wider text-zinc-400">
                通关进度 {completedCount}/{levels.length} · 解锁 {unlockedCount}/{levels.length}
              </span>
              <span className="font-display text-sm text-bronze-200 tracking-wider">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 bg-black/60 rounded-full border border-black/80 overflow-hidden relative">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #6e520e 0%, #c08c40 50%, #e8d0a0 100%)',
                  boxShadow: '0 0 10px rgba(192, 140, 64, 0.5)',
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {levels.map(level => (
            <div
              key={level.id}
              className={`module-panel relative transition-all duration-200 ${
                level.unlocked
                  ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)]'
                  : 'opacity-50 cursor-not-allowed'
              }`}
              style={{ minHeight: 220 }}
              onClick={() => level.unlocked && handleSelect(level.id)}
            >
              <div className="absolute top-1 left-1"><Screw size={8} /></div>
              <div className="absolute top-1 right-1"><Screw size={8} rotation={90} /></div>
              <div className="absolute bottom-1 left-1"><Screw size={8} rotation={180} /></div>
              <div className="absolute bottom-1 right-1"><Screw size={8} rotation={270} /></div>

              <div className="p-4 pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-mono text-[10px] tracking-wider text-zinc-500">LEVEL</div>
                    <div
                      className="font-display text-4xl leading-none"
                      style={{
                        color: level.unlocked ? '#c08c40' : '#666',
                        textShadow: level.unlocked ? '0 0 10px rgba(192,140,64,0.4)' : 'none',
                      }}
                    >
                      {level.id.toString().padStart(2, '0')}
                    </div>
                  </div>
                  {!level.unlocked && <Lock size={18} className="text-zinc-500 mt-1" />}
                  {level.completed && (
                    <div className="w-7 h-7 rounded-full bg-neon-green/20 border border-neon-green/50 flex items-center justify-center">
                      <Check size={16} className="text-neon-green" />
                    </div>
                  )}
                </div>

                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(s => (
                    <Star
                      key={s}
                      size={12}
                      fill={s <= level.difficulty ? '#ffd93d' : 'none'}
                      className={s <= level.difficulty ? 'text-neon-yellow' : 'text-zinc-600'}
                    />
                  ))}
                </div>

                <div className="font-display text-lg tracking-wider text-zinc-100 mb-1 leading-tight">
                  {level.name}
                </div>
                <p className="font-body text-[11px] text-zinc-400 leading-snug mb-3 line-clamp-2">
                  {level.description}
                </p>

                {level.completed && (
                  <div className="absolute bottom-10 right-4 font-mono text-[10px] text-neon-green">
                    BEST: {level.bestScore}%
                  </div>
                )}

                {level.unlocked && (
                  <button
                    className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-black/50 border border-zinc-600 flex items-center justify-center hover:border-neon-yellow hover:text-neon-yellow transition-colors"
                    onClick={(e) => handlePreview(e, level.id)}
                    title="预览目标音效"
                  >
                    <Volume2 size={12} className="text-zinc-400 hover:text-neon-yellow" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center pb-8">
          <div className="inline-block font-mono text-[10px] tracking-widest text-zinc-600 px-4 py-2 border border-zinc-700/50 rounded">
            CLICK A LEVEL · DRAG KNOBS VERTICALLY · PATCH OUT → IN · EARS OPEN!
          </div>
        </div>
      </div>
    </div>
  );
};
