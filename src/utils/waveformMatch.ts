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

export function zeroMean(arr: Float32Array): Float32Array {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) sum += arr[i];
  const mean = sum / arr.length;
  const out = new Float32Array(arr.length);
  for (let i = 0; i < arr.length; i++) out[i] = arr[i] - mean;
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

export function computeAutoCorrelation(signal: Float32Array, maxLag: number = 512): Float32Array {
  const n = signal.length;
  const acf = new Float32Array(maxLag);
  let mean = 0;
  for (let i = 0; i < n; i++) mean += signal[i];
  mean /= n;
  let variance = 0;
  for (let i = 0; i < n; i++) {
    const d = signal[i] - mean;
    variance += d * d;
  }
  if (variance === 0) return acf;
  for (let lag = 0; lag < maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) {
      sum += (signal[i] - mean) * (signal[i + lag] - mean);
    }
    acf[lag] = sum / variance;
  }
  return acf;
}

export function computeHilbertEnvelope(arr: Float32Array): Float32Array {
  const len = arr.length;
  const env = new Float32Array(len);
  let slowPeak = 0;
  const attack = 0.1;
  const release = 0.01;
  for (let i = 0; i < len; i++) {
    const v = Math.abs(arr[i] - 0.5);
    if (v > slowPeak) {
      slowPeak = slowPeak + (v - slowPeak) * attack;
    } else {
      slowPeak = slowPeak + (v - slowPeak) * release;
    }
    env[i] = slowPeak;
  }
  return env;
}

export function smoothArray(arr: Float32Array, window: number = 5): Float32Array {
  const len = arr.length;
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    let sum = 0;
    let cnt = 0;
    for (let j = Math.max(0, i - window); j <= Math.min(len - 1, i + window); j++) {
      sum += arr[j];
      cnt++;
    }
    out[i] = sum / cnt;
  }
  return out;
}

export function logSpectrumWarp(spec: Float32Array, outSize: number = 128): Float32Array {
  const inSize = spec.length;
  const out = new Float32Array(outSize);
  for (let i = 0; i < outSize; i++) {
    const logPos = Math.pow(i / outSize, 2) * (inSize - 1);
    const lo = Math.floor(logPos);
    const hi = Math.min(inSize - 1, lo + 1);
    const t = logPos - lo;
    out[i] = (1 - t) * spec[lo] + t * spec[hi];
  }
  return out;
}

export function findBestPhaseShift(target: Float32Array, current: Float32Array, maxShift: number = 200): { shift: number; mse: number } {
  let bestShift = 0;
  let bestMSE = Infinity;
  const len = Math.min(target.length, current.length) - maxShift;
  if (len <= 0) return { shift: 0, mse: 1 };
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

export function generateSpectrum(wave: Float32Array, size: number): Float32Array {
  const n = wave.length;
  const spec = new Float32Array(size);
  for (let k = 0; k < size; k++) {
    let re = 0;
    let im = 0;
    for (let i = 0; i < n; i++) {
      const angle = -2 * Math.PI * k * i / n;
      re += wave[i] * Math.cos(angle);
      im += wave[i] * Math.sin(angle);
    }
    spec[k] = Math.sqrt(re * re + im * im) / n;
  }
  return spec;
}

export interface MatchScore {
  total: number;
  waveformMSE: number;
  spectrumCosine: number;
  acfCosine: number;
  envelopeCorr: number;
  lfoFeature: number;
}

export interface DualTrackData {
  playerWave: Uint8Array;
  playerSpec: Uint8Array;
  targetWave: Uint8Array;
  targetSpec: Uint8Array;
}

export function computeDualMatchScore(data: DualTrackData): MatchScore {
  const pWave = normalizeByte(data.playerWave);
  const pSpec = normalizeByte(data.playerSpec);
  const tWave = normalizeByte(data.targetWave);
  const tSpec = normalizeByte(data.targetSpec);

  const nPWave = normalizeArray(pWave);
  const nTWave = normalizeArray(tWave);

  const minSpecLen = Math.min(pSpec.length, tSpec.length);
  const nPSpec = normalizeArray(pSpec.slice(0, minSpecLen));
  const nTSpec = normalizeArray(tSpec.slice(0, minSpecLen));

  const logP = normalizeArray(logSpectrumWarp(nPSpec, 96));
  const logT = normalizeArray(logSpectrumWarp(nTSpec, 96));
  const smoothLogP = smoothArray(logP, 3);
  const smoothLogT = smoothArray(logT, 3);
  const specCos = Math.max(0, computeCosineSimilarity(smoothLogP, smoothLogT));

  const phase = findBestPhaseShift(nTWave, nPWave, 256);
  const shiftedP = new Float32Array(nTWave.length);
  for (let i = 0; i < shiftedP.length; i++) {
    shiftedP[i] = nPWave[(i + phase.shift) % nPWave.length] ?? 0.5;
  }
  const waveMSE = computeMSE(nTWave, shiftedP);
  const waveScore = Math.max(0, 1 - waveMSE / 0.08);

  const acfMaxLag = Math.min(400, Math.floor(Math.min(nTWave.length, nPWave.length) * 0.25));
  const tACF = computeAutoCorrelation(zeroMean(nTWave), acfMaxLag);
  const pACF = computeAutoCorrelation(zeroMean(nPWave), acfMaxLag);
  const acfCos = Math.max(0, computeCosineSimilarity(smoothArray(tACF, 4), smoothArray(pACF, 4)));

  const envP = computeHilbertEnvelope(nPWave);
  const envT = computeHilbertEnvelope(nTWave);
  const nEnvP = normalizeArray(envP);
  const nEnvT = normalizeArray(envT);
  const envPhase = findBestPhaseShift(nEnvT, nEnvP, 300);
  const shiftedEnvP = new Float32Array(nEnvT.length);
  for (let i = 0; i < shiftedEnvP.length; i++) {
    shiftedEnvP[i] = nEnvP[(i + envPhase.shift) % nEnvP.length] ?? 0.5;
  }
  const envCorr = Math.max(0, computeCosineSimilarity(nEnvT, shiftedEnvP));

  const envDemeanP = zeroMean(envP);
  const envDemeanT = zeroMean(envT);
  const envSpecP = generateSpectrum(envDemeanP, Math.min(128, Math.floor(envP.length / 4)));
  const envSpecT = generateSpectrum(envDemeanT, Math.min(128, Math.floor(envT.length / 4)));
  const nEnvSpecP = normalizeArray(envSpecP);
  const nEnvSpecT = normalizeArray(envSpecT);
  const lfoFeature = Math.max(0, computeCosineSimilarity(nEnvSpecT.slice(0, 64), nEnvSpecP.slice(0, 64)));

  const total = Math.max(0, Math.min(100,
    (waveScore * 15) +
    (specCos * 35) +
    (acfCos * 30) +
    (envCorr * 10) +
    (lfoFeature * 10)
  ));

  return {
    total,
    waveformMSE: waveMSE,
    spectrumCosine: specCos,
    acfCosine: acfCos,
    envelopeCorr: envCorr,
    lfoFeature,
  };
}
