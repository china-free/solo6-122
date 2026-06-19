export function normalizeArray(arr: Float32Array): Float32Array {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] < min) min = arr[i];
    if (arr[i] > max) max = arr[i];
  }
  const range = max - min || 1;
  const out = new Float32Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    out[i] = (arr[i] - min) / range;
  }
  return out;
}

export function normalizeByte(arr: Uint8Array): Float32Array {
  const out = new Float32Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    out[i] = arr[i] / 255;
  }
  return out;
}

export function computeMSE(a: Float32Array, b: Float32Array): number {
  const len = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < len; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return sum / len;
}

export function computeCosineSimilarity(a: Float32Array, b: Float32Array): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom === 0) return 0;
  return dot / denom;
}

export function computeEnvelope(arr: Float32Array, windowSize: number = 32): Float32Array {
  const len = arr.length;
  const env = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    let max = 0;
    const start = Math.max(0, i - windowSize);
    const end = Math.min(len, i + windowSize);
    for (let j = start; j < end; j++) {
      const abs = Math.abs(arr[j] - 0.5);
      if (abs > max) max = abs;
    }
    env[i] = max;
  }
  return env;
}

export function findBestPhaseShift(target: Float32Array, current: Float32Array, maxShift: number = 200): { shift: number; mse: number } {
  let bestShift = 0;
  let bestMSE = Infinity;
  const len = Math.min(target.length, current.length) - maxShift;
  for (let s = 0; s < maxShift; s++) {
    let sum = 0;
    for (let i = 0; i < len; i++) {
      const d = target[i + s] - current[i];
      sum += d * d;
    }
    const mse = sum / len;
    if (mse < bestMSE) {
      bestMSE = mse;
      bestShift = s;
    }
  }
  return { shift: bestShift, mse: bestMSE };
}

export interface MatchScore {
  total: number;
  waveformMSE: number;
  spectrumCosine: number;
  envelopeCorr: number;
}

export function computeMatchScore(
  targetWave: number[],
  targetSpec: number[],
  currentWaveByte: Uint8Array,
  currentSpecByte: Uint8Array
): MatchScore {
  const tWave = new Float32Array(targetWave);
  const tSpec = new Float32Array(targetSpec);
  const cWave = normalizeByte(currentWaveByte);
  const cSpec = normalizeByte(currentSpecByte);

  const nTWave = normalizeArray(tWave);
  const nCWave = normalizeArray(cWave);
  const nTSpec = normalizeArray(tSpec.slice(0, cSpec.length));
  const nCSpec = normalizeArray(cSpec);

  const phase = findBestPhaseShift(nTWave, nCWave, 256);
  const shiftedC = new Float32Array(nTWave.length);
  for (let i = 0; i < shiftedC.length; i++) {
    shiftedC[i] = nCWave[(i + phase.shift) % nCWave.length] ?? 0.5;
  }
  const waveMSE = computeMSE(nTWave, shiftedC);
  const specCos = computeCosineSimilarity(nTSpec, nCSpec);

  const envT = computeEnvelope(nTWave, 16);
  const envC = computeEnvelope(shiftedC, 16);
  const nEnvT = normalizeArray(envT);
  const nEnvC = normalizeArray(envC);
  const envCorr = Math.max(0, computeCosineSimilarity(nEnvT, nEnvC));

  const maxMSE = 0.05;
  const waveScore = Math.max(0, 1 - waveMSE / maxMSE);
  const specScore = specCos;
  const envScore = envCorr;

  const total = Math.max(0, Math.min(100,
    (waveScore * 30) + (specScore * 50) + (envScore * 20)
  ));

  return {
    total,
    waveformMSE: waveMSE,
    spectrumCosine: specCos,
    envelopeCorr: envCorr,
  };
}

export function generateSyntheticWaveform(
  type: OscillatorType,
  freq: number,
  sampleRate: number,
  length: number,
  lfoRate: number = 0,
  lfoDepth: number = 0,
  filterCutoff: number = 0,
  filterQ: number = 0
): Float32Array {
  const out = new Float32Array(length);
  const dt = 1 / sampleRate;
  for (let i = 0; i < length; i++) {
    const t = i * dt;
    let phase = 2 * Math.PI * freq * t;
    if (lfoRate > 0 && lfoDepth > 0) {
      phase += lfoDepth * Math.sin(2 * Math.PI * lfoRate * t);
    }
    let v = 0;
    switch (type) {
      case 'sine':
        v = Math.sin(phase);
        break;
      case 'square':
        v = Math.sin(phase) >= 0 ? 1 : -1;
        break;
      case 'sawtooth':
        v = 2 * ((phase / (2 * Math.PI)) - Math.floor((phase / (2 * Math.PI)) + 0.5));
        break;
      case 'triangle': {
        const p = (phase / (2 * Math.PI)) % 1;
        v = p < 0.25 ? 4 * p : p < 0.75 ? 2 - 4 * p : 4 * p - 4;
        break;
      }
    }
    out[i] = v;
  }
  if (filterCutoff > 0) {
    simpleLowPass(out, sampleRate, filterCutoff, filterQ);
  }
  return out;
}

function simpleLowPass(arr: Float32Array, sampleRate: number, cutoff: number, q: number): void {
  const rc = 1 / (2 * Math.PI * cutoff);
  const alpha = rc / (rc + 1 / sampleRate);
  let prev = arr[0];
  const resonance = Math.min(0.9, q / 20);
  for (let i = 1; i < arr.length; i++) {
    const filtered = alpha * prev + (1 - alpha) * arr[i];
    arr[i] = filtered + resonance * (filtered - prev);
    prev = filtered;
  }
}

export function generateSpectrum(wave: Float32Array, size: number): Float32Array {
  const spec = new Float32Array(size);
  for (let k = 0; k < size; k++) {
    let re = 0;
    let im = 0;
    for (let n = 0; n < wave.length; n++) {
      const angle = -2 * Math.PI * k * n / wave.length;
      re += wave[n] * Math.cos(angle);
      im += wave[n] * Math.sin(angle);
    }
    spec[k] = Math.sqrt(re * re + im * im) / wave.length;
  }
  return spec;
}
