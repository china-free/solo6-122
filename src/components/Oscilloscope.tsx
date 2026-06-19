import React, { useEffect, useRef } from 'react';
import { useSynthStore } from '@/store/useSynthStore';
import { audioEngine } from '@/engine/AudioEngine';
import { WAVEFORM_COLORS } from '@/utils/colorPalette';

interface OscilloscopeProps {
  width?: number;
  height?: number;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({ width = 560, height = 220 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const specCanvasRef = useRef<HTMLCanvasElement>(null);
  const targetWaveRef = useRef<HTMLCanvasElement>(null);
  const { matchScore, isVictory } = useSynthStore();
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const specCanvas = specCanvasRef.current;
    const tgtCanvas = targetWaveRef.current;
    if (!canvas || !specCanvas || !tgtCanvas) return;
    const ctx = canvas.getContext('2d');
    const sctx = specCanvas.getContext('2d');
    const tctx = tgtCanvas.getContext('2d');
    if (!ctx || !sctx || !tctx) return;

    const pTime = new Uint8Array(2048);
    const tTime = new Uint8Array(2048);
    const pFreq = new Uint8Array(1024);

    const gridW = width;
    const gridH = height;

    const drawLoop = () => {
      ctx.clearRect(0, 0, gridW, gridH);
      sctx.clearRect(0, 0, gridW, gridH * 0.4);
      tctx.clearRect(0, 0, gridW, gridH);

      ctx.strokeStyle = WAVEFORM_COLORS.grid;
      ctx.lineWidth = 0.5;
      for (let gx = 0; gx <= 8; gx++) {
        const x = (gx / 8) * gridW;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, gridH);
        ctx.stroke();
      }
      for (let gy = 0; gy <= 6; gy++) {
        const y = (gy / 6) * gridH;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(gridW, y);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(52, 199, 89, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, gridH / 2);
      ctx.lineTo(gridW, gridH / 2);
      ctx.stroke();

      if (audioEngine.isInitialized()) {
        audioEngine.getTimeDomainData(pTime, 'player');
        audioEngine.getTimeDomainData(tTime, 'target');
        audioEngine.getFrequencyData(pFreq, 'player');

        tctx.strokeStyle = WAVEFORM_COLORS.target;
        tctx.lineWidth = 1.5;
        tctx.setLineDash([4, 4]);
        tctx.beginPath();
        const tStep = gridW / tTime.length;
        for (let i = 0; i < tTime.length; i++) {
          const x = i * tStep;
          const y = gridH - (tTime[i] / 255) * gridH;
          if (i === 0) tctx.moveTo(x, y);
          else tctx.lineTo(x, y);
        }
        tctx.stroke();
        tctx.setLineDash([]);

        ctx.shadowColor = WAVEFORM_COLORS.currentGlow;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = WAVEFORM_COLORS.current;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const pSlice = gridW / pTime.length;
        for (let i = 0; i < pTime.length; i++) {
          const x = i * pSlice;
          const y = gridH - (pTime[i] / 255) * gridH;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        const barCount = 64;
        const stepSize = Math.floor(pFreq.length / barCount);
        const barW = gridW / barCount;
        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          for (let j = 0; j < stepSize; j++) sum += pFreq[i * stepSize + j];
          const avg = sum / stepSize;
          const barH = (avg / 255) * (gridH * 0.4);
          const hue = 120 - (avg / 255) * 80;
          sctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
          sctx.fillRect(i * barW + 1, (gridH * 0.4) - barH, barW - 2, barH);
        }
      }

      rafRef.current = requestAnimationFrame(drawLoop);
    };
    rafRef.current = requestAnimationFrame(drawLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [width, height]);

  const scoreColor = isVictory ? '#34c759' : matchScore >= 60 ? '#ffcc00' : '#ff3b30';

  return (
    <div className="relative">
      <div className="crt-screen relative" style={{ width, height: height + 80 }}>
        <div className="absolute top-2 left-3 right-3 flex items-center justify-between border-b border-neon-green/20 pb-1">
          <span className="font-mono text-xs text-neon-green/70 tracking-widest">OSCILLOSCOPE / SPECTRUM</span>
          <span
            className="font-display text-2xl tracking-wider"
            style={{
              color: scoreColor,
              textShadow: `0 0 10px ${scoreColor}, 0 0 20px ${scoreColor}55`,
            }}
          >
            {matchScore.toString().padStart(3, '0')}%
          </span>
        </div>

        <canvas
          ref={targetWaveRef}
          width={width - 16}
          height={height}
          className="absolute left-2 top-8"
          style={{ width: width - 16, height }}
        />
        <canvas
          ref={canvasRef}
          width={width - 16}
          height={height}
          className="absolute left-2 top-8"
          style={{ width: width - 16, height }}
        />

        <div className="absolute bottom-2 left-2 right-2 border-t border-neon-green/20 pt-1">
          <canvas
            ref={specCanvasRef}
            width={width - 16}
            height={height * 0.4}
            style={{ width: width - 16, height: height * 0.4 }}
          />
        </div>

        <div
          className="absolute inset-0 rounded-md pointer-events-none"
          style={{
            boxShadow: isVictory
              ? `inset 0 0 60px rgba(52, 199, 89, 0.3), inset 0 0 120px rgba(52, 199, 89, 0.15)`
              : matchScore >= 60
                ? `inset 0 0 40px rgba(255, 204, 0, 0.15)`
                : `inset 0 0 40px rgba(255, 59, 48, 0.1)`,
            transition: 'box-shadow 0.3s',
          }}
        />
      </div>

      <div className="absolute -top-3 left-2 flex items-center gap-2">
        <div className="screw" style={{ width: 8, height: 8 }} />
      </div>
      <div className="absolute -top-3 right-2 flex items-center gap-2">
        <div className="screw" style={{ width: 8, height: 8 }} />
      </div>
    </div>
  );
};
