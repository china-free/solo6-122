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
  const mean = signal.reduce((s, v) => s + v, 0) / n;
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
  acfCosine: number;
  envelopeCorr: number;
  lfoFeature: number;
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
  const minSpecLen = Math.min(tSpec.length, cSpec.length);
  const nTSpec = normalizeArray(tSpec.slice(0, minSpecLen));
  const nCSpec = normalizeArray(cSpec.slice(0, minSpecLen));

  const logT = normalizeArray(logSpectrumWarp(nTSpec, 96));
  const logC = normalizeArray(logSpectrumWarp(nCSpec, 96));
  const smoothLogT = smoothArray(logT, 3);
  const smoothLogC = smoothArray(logC, 3);
  const specCos = Math.max(0, computeCosineSimilarity(smoothLogT, smoothLogC));

  const phase = findBestPhaseShift(nTWave, nCWave, 256);
  const shiftedC = new Float32Array(nTWave.length);
  for (let i = 0; i < shiftedC.length; i++) {
    shiftedC[i] = nCWave[(i + phase.shift) % nCWave.length] ?? 0.5;
  }
  const waveMSE = computeMSE(nTWave, shiftedC);
  const maxMSE = 0.08;
  const waveScore = Math.max(0, 1 - waveMSE / maxMSE);

  const acfMaxLag = Math.min(400, Math.floor(Math.min(nTWave.length, nCWave.length) * 0.25));
  const tACF = computeAutoCorrelation(zeroMean(nTWave), acfMaxLag);
  const cACF = computeAutoCorrelation(zeroMean(nCWave), acfMaxLag);
  const smoothTACF = smoothArray(tACF, 4);
  const smoothCACF = smoothArray(cACF, 4);
  const acfCos = Math.max(0, computeCosineSimilarity(smoothTACF, smoothCACF));

  const envT = computeHilbertEnvelope(nTWave);
  const envC = computeHilbertEnvelope(nCWave);
  const nEnvT = normalizeArray(envT);
  const nEnvC = normalizeArray(envC);
  const envPhase = findBestPhaseShift(nEnvT, nEnvC, 300);
  const shiftedEnvC = new Float32Array(nEnvT.length);
  for (let i = 0; i < shiftedEnvC.length; i++) {
    shiftedEnvC[i] = nEnvC[(i + envPhase.shift) % nEnvC.length] ?? 0.5;
  }
  const envCorr = Math.max(0, computeCosineSimilarity(nEnvT, shiftedEnvC));

  const envDemeanT = zeroMean(envT);
  const envDemeanC = zeroMean(envC);
  const envSpecT = generateSpectrum(envDemeanT, Math.min(128, Math.floor(envT.length / 4)));
  const envSpecC = generateSpectrum(envDemeanC, Math.min(128, Math.floor(envC.length / 4)));
  const nEnvSpecT = normalizeArray(envSpecT);
  const nEnvSpecC = normalizeArray(envSpecC);
  const lfoFeature = Math.max(0, computeCosineSimilarity(nEnvSpecT.slice(0, 64), nEnvSpecC.slice(0, 64)));

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
  return generateSyntheticWaveformWithPhase(
    type, freq, sampleRate, length, lfoRate, lfoDepth, filterCutoff, filterQ, 0
  );
}

export function generateSyntheticWaveformWithPhase(
  type: OscillatorType,
  freq: number,
  sampleRate: number,
  length: number,
  lfoRate: number,
  lfoDepth: number,
  filterCutoff: number,
  filterQ: number,
  phaseOffset: number
): Float32Array {
  const out = new Float32Array(length);
  const dt = 1 / sampleRate;
  for (let i = 0; i < length; i++) {
    const t = i * dt;
    let phase = 2 * Math.PI * freq * t + phaseOffset;
    if (lfoRate > 0 && lfoDepth > 0) {
      phase += lfoDepth * Math.sin(2 * Math.PI * lfoRate * t + phaseOffset * 0.7);
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
