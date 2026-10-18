/**
 * TASK 15: the "rolling hills" height term used by the procedural terrain, and its average and spread.
 * Kept in its own small file so the build-time script and the game use exactly the same maths.
 */
import { fbm } from '../utils/noise.ts';

export interface HillParams {
  baseScale: number;
  heightScale: number;
}

export function proceduralHills(x: number, z: number, p: HillParams): number {
  return fbm(x * p.baseScale + 105, z * p.baseScale + 95, 4) * p.heightScale;
}

/** Mean and standard deviation of the hill term over the playable area (sampled on a coarse grid). */
export function hillStats(p: HillParams, halfSize = 300, samples = 61): { mean: number; std: number } {
  let sum = 0;
  let sum2 = 0;
  let n = 0;
  for (let i = 0; i < samples; i++) {
    for (let j = 0; j < samples; j++) {
      const x = -halfSize + (2 * halfSize * i) / (samples - 1);
      const z = -halfSize + (2 * halfSize * j) / (samples - 1);
      const h = proceduralHills(x, z, p);
      sum += h;
      sum2 += h * h;
      n++;
    }
  }
  const mean = sum / n;
  return { mean, std: Math.sqrt(Math.max(0, sum2 / n - mean * mean)) };
}
