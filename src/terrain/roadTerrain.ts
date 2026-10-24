/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TASK 19: roads, parking areas and driveways for parks that have them (park.features.roads).
 *
 * Each road is turned into a smooth path whose height is the land's own height, averaged along the road
 * so it does not roller-coaster. The terrain is then levelled to that path, so cars, walkers and the
 * painted road surface all sit on the same ground. Parks without roads pay almost nothing: one quick check.
 */
import * as THREE from 'three';
import { getActivePark, type ParkRoad } from '../data/parks.ts';
import { sstep } from '../utils/noise.ts';
import { proceduralBaseHeight } from './riverTerrain.ts';
import { getActiveReliefData } from './realRelief.ts';

export interface RoadPath {
  road: ParkRoad;
  curve: THREE.CatmullRomCurve3;
  pts: { x: number; z: number; y: number }[];
  /** Half the paved width plus a little shoulder: terrain is perfectly level out to here. */
  flatHalf: number;
  /** Distance over which the level road blends back into the natural hills. */
  blend: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const NONE: RoadPath[] = [];
let cache: { key: string; paths: RoadPath[] } | null = null;

function buildPath(road: ParkRoad, built: RoadPath[]): RoadPath {
  const curve = new THREE.CatmullRomCurve3(
    road.nodes.map(n => new THREE.Vector3(n.x, 0, n.z)),
    false,
    'centripetal',
    0.5
  );
  const length = curve.getLength();
  const count = Math.max(2, Math.ceil(length / 3));
  const spaced = curve.getSpacedPoints(count);
  let ys = spaced.map(p => proceduralBaseHeight(p.x, p.z));

  const parent = road.levelFrom ? built.find(b => b.road.id === road.levelFrom) : undefined;
  if (parent) {
    // Level with the road it joins
    const mid = spaced[Math.floor(spaced.length / 2)];
    const level = nearest(parent, mid.x, mid.z).y;
    ys = ys.map(() => level);
  } else if (road.kind === 'lot') {
    // A parking area is one flat level
    const avg = ys.reduce((a, b) => a + b, 0) / ys.length;
    ys = ys.map(() => avg);
  } else {
    // Smooth the profile (moving average, several passes) so the road follows the land without bumps
    for (let pass = 0; pass < 5; pass++) {
      const next = ys.slice();
      for (let i = 0; i < ys.length; i++) {
        let s = 0;
        let c = 0;
        for (let k = -4; k <= 4; k++) {
          const j = Math.min(ys.length - 1, Math.max(0, i + k));
          s += ys[j];
          c++;
        }
        next[i] = s / c;
      }
      ys = next;
    }
  }

  const pts = spaced.map((p, i) => ({ x: p.x, z: p.z, y: ys[i] }));
  const flatHalf = road.width / 2 + 1.6;
  const blend = road.kind === 'lot' ? 13 : 9; // a parking area eases gently into the hillside
  const margin = flatHalf + blend;
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
  }
  return { road, curve, pts, flatHalf, blend, minX: minX - margin, maxX: maxX + margin, minZ: minZ - margin, maxZ: maxZ + margin };
}

/** Road paths for the active park (rebuilt when the park, or its real relief, changes). */
export function getRoadPaths(): RoadPath[] {
  const park = getActivePark();
  const roads = park.features?.roads;
  if (!roads || roads.length === 0) return NONE;
  const key = `${park.id}|${getActiveReliefData(park.id) ? 'relief' : 'plain'}`;
  if (cache && cache.key === key) return cache.paths;
  const paths: RoadPath[] = [];
  for (const r of roads) paths.push(buildPath(r, paths));
  cache = { key, paths };
  return paths;
}

function nearest(rp: RoadPath, x: number, z: number): { d: number; y: number } {
  let bestD2 = Infinity;
  let bestY = 0;
  const pts = rp.pts;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len2 = dx * dx + dz * dz;
    const t = len2 > 0 ? Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / len2)) : 0;
    const px = a.x + t * dx - x;
    const pz = a.z + t * dz - z;
    const d2 = px * px + pz * pz;
    if (d2 < bestD2) {
      bestD2 = d2;
      bestY = a.y + (b.y - a.y) * t;
    }
  }
  return { d: Math.sqrt(bestD2), y: bestY };
}

/** Levels the ground under roads. Called from heightAt; returns the height unchanged away from roads. */
export function applyRoads(x: number, z: number, baseH: number): number {
  const paths = getRoadPaths();
  if (paths.length === 0) return baseH;
  let h = baseH;
  for (const rp of paths) {
    if (x < rp.minX || x > rp.maxX || z < rp.minZ || z > rp.maxZ) continue;
    const { d, y } = nearest(rp, x, z);
    const edge = rp.flatHalf + rp.blend;
    if (d >= edge) continue;
    const w = 1 - sstep(rp.flatHalf, edge, d);
    h = h * (1 - w) + y * w;
  }
  return h;
}

/** True if the point is on or within `margin` metres of a paved surface (used to keep trees, rocks and grass off roads). */
export function isNearRoad(x: number, z: number, margin: number): boolean {
  const paths = getRoadPaths();
  if (paths.length === 0) return false;
  for (const rp of paths) {
    if (x < rp.minX || x > rp.maxX || z < rp.minZ || z > rp.maxZ) continue;
    if (nearest(rp, x, z).d < rp.road.width / 2 + margin) return true;
  }
  return false;
}
