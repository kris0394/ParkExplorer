/**
 * TASK 15: runtime store for real elevation relief.
 *
 * The relief grid (made at build time from free elevation data) replaces part of the
 * procedural rolling hills, but NOT near the hand-placed trail, so walking stays gentle.
 * The spawn clearing, summit plateau and river valley are applied after this in heightAt,
 * so they still override it.
 */
import { sstep } from '../utils/noise.ts';
import { hillStats, proceduralHills } from './hillStats.ts';
import type { ReliefData } from '../utils/terrainBuild.ts';

interface ActiveRelief {
  parkId: string;
  data: ReliefData;
  grid: Float32Array;
  segments: number[][]; // [x1, z1, x2, z2]
  hillMean: number;
}

let active: ActiveRelief | null = null;

type NodeList = { x: number; z: number }[];

export function setReliefForPark(
  park: { id: string; terrain: { baseScale: number; heightScale: number }; trail: { westNodes: NodeList; eastNodes: NodeList } },
  data: ReliefData | null
): void {
  if (!data || data.parkId !== park.id || data.reliefCm.length !== data.n * data.n) {
    active = null;
    return;
  }
  const grid = new Float32Array(data.n * data.n);
  for (let i = 0; i < grid.length; i++) grid[i] = data.reliefCm[i] / 100;
  const segments: number[][] = [];
  for (const nodes of [park.trail.westNodes, park.trail.eastNodes]) {
    for (let i = 0; i < nodes.length - 1; i++) segments.push([nodes[i].x, nodes[i].z, nodes[i + 1].x, nodes[i + 1].z]);
  }
  active = { parkId: park.id, data, grid, segments, hillMean: hillStats(park.terrain).mean };
}

export function clearRelief(): void {
  active = null;
}

export function getActiveReliefData(parkId: string): ReliefData | null {
  return active && active.parkId === parkId ? active.data : null;
}

function distToSegments(x: number, z: number, segs: number[][]): number {
  let best = Infinity;
  for (const [x1, z1, x2, z2] of segs) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len2 = dx * dx + dz * dz;
    const t = len2 > 0 ? Math.max(0, Math.min(1, ((x - x1) * dx + (z - z1) * dz) / len2)) : 0;
    const d = Math.hypot(x - (x1 + t * dx), z - (z1 + t * dz));
    if (d < best) best = d;
  }
  return best;
}

/** Bilinear relief (metres) at a world position. Zero outside the grid. */
function sampleRelief(a: ActiveRelief, x: number, z: number): number {
  const d = a.data;
  const half = d.sizeM / 2;
  const fx = (x - (d.originX - half)) / d.stepM;
  const fz = (z - (d.originZ - half)) / d.stepM;
  if (fx < 0 || fz < 0 || fx > d.n - 1 || fz > d.n - 1) return 0;
  const i0 = Math.min(d.n - 2, Math.floor(fx));
  const j0 = Math.min(d.n - 2, Math.floor(fz));
  const tx = fx - i0;
  const tz = fz - j0;
  const g = a.grid;
  const n = d.n;
  return (
    (g[j0 * n + i0] * (1 - tx) + g[j0 * n + i0 + 1] * tx) * (1 - tz) +
    (g[(j0 + 1) * n + i0] * (1 - tx) + g[(j0 + 1) * n + i0 + 1] * tx) * tz
  );
}

/**
 * The rolling-hills height at a point. With no relief loaded this is exactly the old procedural term.
 */
export function rollingHills(
  x: number,
  z: number,
  park: { id: string; terrain: { baseScale: number; heightScale: number } }
): number {
  const proc = proceduralHills(x, z, park.terrain);
  const a = active;
  if (!a || a.parkId !== park.id) return proc;

  // Fade out near the trail so the walking route stays gentle
  const trailMask = sstep(14, 34, distToSegments(x, z, a.segments));
  // Fade out at the edge of the downloaded window
  const half = a.data.sizeM / 2;
  const edge = Math.min(
    half - Math.abs(x - a.data.originX),
    half - Math.abs(z - a.data.originZ)
  );
  const edgeMask = sstep(0, 40, edge);
  const w = a.data.mix * trailMask * edgeMask;
  if (w <= 0) return proc;
  return proc * (1 - w) + (a.hillMean + sampleRelief(a, x, z)) * w;
}
