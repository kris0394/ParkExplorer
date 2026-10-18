/**
 * TASK 15: loads the real-relief file made at build time.
 * It is a plain JSON file next to the page, or (for the standalone park-explorer.html) copied into the page.
 */
import type { ReliefData } from './terrainBuild.ts';
import { setReliefForPark, clearRelief } from '../terrain/realRelief.ts';

declare global {
  interface Window {
    __TERRAIN_DATA__?: Record<string, ReliefData>;
  }
}

type TerrainPark = {
  id: string;
  realTerrain?: { id: string };
  terrain: { baseScale: number; heightScale: number };
  trail: { westNodes: { x: number; z: number }[]; eastNodes: { x: number; z: number }[] };
};

const cache = new Map<string, ReliefData | null>();

function looksValid(d: any, parkId: string): d is ReliefData {
  return (
    d &&
    d.version === 1 &&
    d.parkId === parkId &&
    Number.isInteger(d.n) &&
    d.n > 2 &&
    Array.isArray(d.reliefCm) &&
    d.reliefCm.length === d.n * d.n &&
    typeof d.sizeM === 'number' &&
    typeof d.stepM === 'number' &&
    typeof d.mix === 'number'
  );
}

/** undefined = not tried yet, null = tried and not available. */
export function getCachedRelief(parkId: string): ReliefData | null | undefined {
  return cache.get(parkId);
}

export async function loadRelief(park: TerrainPark): Promise<ReliefData | null> {
  if (!park.realTerrain) return null;
  if (cache.has(park.id)) return cache.get(park.id)!;
  let result: ReliefData | null = null;
  try {
    const res = await fetch(`./terrain/${park.realTerrain.id}.json`, { cache: 'no-cache' });
    if (res.ok) {
      const json = await res.json();
      if (looksValid(json, park.id)) result = json;
    }
  } catch {
    /* offline, or opened as a local file */
  }
  if (!result && typeof window !== 'undefined') {
    const embedded = window.__TERRAIN_DATA__?.[park.realTerrain.id];
    if (looksValid(embedded, park.id)) result = embedded;
  }
  cache.set(park.id, result);
  return result;
}

/** Apply (or clear) the relief for a park right now, using only what is already loaded. */
export function applyCachedRelief(park: TerrainPark): void {
  const cached = park.realTerrain ? cache.get(park.id) : null;
  if (cached) setReliefForPark(park, cached);
  else clearRelief();
}

/** True when the park wants real relief and we have not tried to load it yet. */
export function needsReliefLoad(park: TerrainPark): boolean {
  return !!park.realTerrain && !cache.has(park.id);
}
