/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TASK 25: eroded "badlands" relief (opt-in through park.terrain.badlands).
 *
 * Shape, from north to south (z grows to the south):
 *   prairie  ->  steep, fluted north face of the Wall  ->  broken top  ->  rugged back slopes  ->  low basin.
 * Low gaps in the crest are the Door, the Window and the Notch canyon.
 *
 * Trail paths whose nodes all carry a height `y` are pinned: the ground is levelled under the trail and the
 * land beside it is cut or built up with banks, so a trail through a canyon or along a ledge is always walkable.
 * Parks without terrain.badlands never call into this file, so their ground is unchanged.
 */

import { fbm, sstep, clamp } from '../utils/noise.ts';
import { getActivePark, type BadlandsConfig } from '../data/parks.ts';
import { getTrailPaths } from '../data/parkStructure.ts';

/** The active park's badlands settings, or null. */
export function getBadlands(): BadlandsConfig | null {
  return getActivePark().terrain.badlands ?? null;
}

/** z of the crest line at x (straight pieces between the listed points, bent a little so it is not ruler-straight). */
export function wallZ(cfg: BadlandsConfig, x: number): number {
  const w = cfg.wall;
  let z: number;
  if (x <= w[0].x) z = w[0].z;
  else if (x >= w[w.length - 1].x) z = w[w.length - 1].z;
  else {
    z = w[w.length - 1].z;
    for (let i = 0; i < w.length - 1; i++) {
      if (x >= w[i].x && x <= w[i + 1].x) {
        const t = (x - w[i].x) / (w[i + 1].x - w[i].x || 1);
        z = w[i].z + (w[i + 1].z - w[i].z) * t;
        break;
      }
    }
  }
  return z + 3.2 * Math.sin(x * 0.047) + 1.8 * Math.sin(x * 0.113 + 2);
}

/** Crest height at x, after the gaps (Door, Window, Notch canyon) are cut into it. */
export function crestAt(cfg: BadlandsConfig, x: number): number {
  let cut = 0;
  for (const g of cfg.gaps) {
    const t = (x - g.x) / g.width;
    cut = Math.max(cut, g.depth * Math.exp(-t * t));
  }
  const slow = 1 + 0.16 * fbm(x * 0.017 + 5, 11, 2); // the crest rises and falls a little along its length
  return cfg.crestHeight * slow * (1 - cut);
}

/** 0 on the prairie, 1 once you are in the wall's foot and everything behind it (bare rock and basin). */
export function badlandsBelt(cfg: BadlandsConfig, x: number, z: number): number {
  const u = z - wallZ(cfg, x);
  return sstep(-cfg.faceWidth - 5, -cfg.faceWidth + 7, u);
}

/** True on bare badlands rock and basin: trees, logs and grass keep off it. False for every other park. */
export function isBareBadlands(x: number, z: number): boolean {
  const cfg = getBadlands();
  if (!cfg) return false;
  return badlandsBelt(cfg, x, z) > 0.45;
}

/** Banded rock colour for a height (a little warped so the bands tilt and wander instead of lying like a ruler). */
export function strataBand(cfg: BadlandsConfig, x: number, y: number, z: number): number {
  const cols = cfg.strata.colors;
  const warp = fbm(x * 0.021 + 3, z * 0.021 - 9, 2) * 2.6 + x * 0.012 + z * 0.006;
  const k = (y + warp) / cfg.strata.bandHeight;
  const i = Math.floor(k);
  const f = k - i;
  const a = cols[((i % cols.length) + cols.length) % cols.length];
  const b = cols[(((i + 1) % cols.length) + cols.length) % cols.length];
  // crisp edges between bands: the colour holds, then changes quickly near the top of each layer
  const t = sstep(0.86, 1.0, f);
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

// ---------------------------------------------------------------------------------------------------------------------
// Pinned trails
// ---------------------------------------------------------------------------------------------------------------------

interface PinnedPath {
  /** [x1, z1, y1, x2, z2, y2] */
  segs: number[][];
  halfWidth: number;
}

let pinnedCache: { id: string; paths: PinnedPath[] } | null = null;

function getPinned(): PinnedPath[] {
  const park = getActivePark();
  if (pinnedCache && pinnedCache.id === park.id) return pinnedCache.paths;
  const out: PinnedPath[] = [];
  for (const path of getTrailPaths(park)) {
    if (path.nodes.length < 2) continue;
    if (!path.nodes.every(n => typeof n.y === 'number')) continue;
    const segs: number[][] = [];
    for (let i = 0; i < path.nodes.length - 1; i++) {
      const a = path.nodes[i];
      const b = path.nodes[i + 1];
      segs.push([a.x, a.z, a.y as number, b.x, b.z, b.y as number]);
    }
    out.push({ segs, halfWidth: (path.width ?? park.trail.width) / 2 });
  }
  pinnedCache = { id: park.id, paths: out };
  return out;
}

/** Height a pinned trail wants at (x, z) and how far (x, z) is from it (nearest point on any pinned path). */
export function pinnedTrailAt(x: number, z: number): { d: number; y: number; halfWidth: number } | null {
  let best: { d: number; y: number; halfWidth: number } | null = null;
  for (const p of getPinned()) {
    for (const [x1, z1, y1, x2, z2, y2] of p.segs) {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len2 = dx * dx + dz * dz;
      const t = len2 > 0 ? clamp(((x - x1) * dx + (z - z1) * dz) / len2, 0, 1) : 0;
      const px = x1 + t * dx - x;
      const pz = z1 + t * dz - z;
      const d = Math.sqrt(px * px + pz * pz);
      if (!best || d < best.d) best = { d, y: y1 + (y2 - y1) * t, halfWidth: p.halfWidth };
    }
  }
  return best;
}

// ---------------------------------------------------------------------------------------------------------------------
// Ground height
// ---------------------------------------------------------------------------------------------------------------------

function ridgeness(x: number, z: number, f: number, oct: number, seed: number): number {
  const n = fbm(x * f + seed, z * f - seed * 0.7, oct);
  return clamp(1 - Math.abs(n) * 3.2, 0, 1); // 1 along a ridge line, 0 in a gully
}

/**
 * The finished ground height for a badlands park. `prairie` is the park's ordinary gentle rolling land at this spot
 * (rolling hills and micro-topography); the wall, back slopes, basin, butte and pinned trails are built on top of it.
 */
export function applyBadlands(cfg: BadlandsConfig, x: number, z: number, prairie: number): number {
  const park = getActivePark();
  const zw = wallZ(cfg, x);
  const u = z - zw; // metres south of the crest line
  const crest = crestAt(cfg, x);
  const belt = badlandsBelt(cfg, x, z);

  // 1. Broad profile: flat prairie, steep face, broken top, falling back slopes, basin
  let profile: number;
  if (u <= -cfg.faceWidth) {
    profile = 0;
  } else if (u <= 0) {
    const t = (u + cfg.faceWidth) / cfg.faceWidth;
    profile = crest * sstep(0, 1, t);
  } else {
    const s = sstep(cfg.topWidth, cfg.topWidth + cfg.backWidth, u);
    profile = crest * (1 - s) - cfg.basinDrop * s;
  }

  // 2. Erosion: fluted gullies down the face, then sharp ridges and gullies on the back slopes
  const wFace = sstep(-cfg.faceWidth, -cfg.faceWidth * 0.72, u) * (1 - sstep(-3, 7, u));
  const wBack = sstep(0, 16, u);
  const depthIn = sstep(0, cfg.backWidth, u);
  const flute = ridgeness(x, z, 0.1, 3, 17) * 0.7 + ridgeness(x, z, 0.047, 2, 41) * 0.3;
  const ridgeA = ridgeness(x, z, 0.034, 4, 7);
  const ridgeB = ridgeness(x, z, 0.082, 3, 29);
  const rug = cfg.ruggedness;
  // some stretches are spikier, others broad and benchy, so the badlands do not look like one repeating pattern
  const spiky = 0.5 + 0.95 * sstep(-0.3, 0.35, fbm(x * 0.011 + 9, z * 0.011 - 4, 2));
  let h = profile;
  h += rug * wFace * 6.5 * (flute - 0.45) * (0.7 + 0.5 * spiky);
  h += rug * wBack * (5.0 + 8.5 * depthIn) * (ridgeA - 0.45) * spiky;
  h += rug * wBack * (2.2 + 2.6 * depthIn) * (ridgeB - 0.45) * spiky;
  // the broken top and the face are also cut by small gullies and knobs (the crest is never a smooth dome)
  const wTop = sstep(-cfg.faceWidth * 0.6, -2, u);
  h += rug * wTop * 2.8 * (ridgeness(x, z, 0.065, 3, 13) - 0.5) + rug * wTop * 1.2 * (ridgeness(x, z, 0.15, 2, 3) - 0.5);
  // fine surface roughness so slopes are not smooth plaster
  h += belt * 0.35 * fbm(x * 0.21, z * 0.21, 2);

  // 3. Rock layers: slopes break into benches with short risers
  if (cfg.terraceStep > 0 && belt > 0) {
    const k = h / cfg.terraceStep;
    const fl = Math.floor(k);
    const stepped = (fl + sstep(0.5, 0.92, k - fl)) * cfg.terraceStep;
    h = h + (stepped - h) * 0.62 * belt;
  }

  // 4. Ordinary gentle prairie rolls (mostly on the prairie side)
  h += prairie * (1 - 0.7 * belt);

  // 5. The butte under the Notch viewpoint (the park's "mountain" deck sits flat on top of it)
  const mtn = park.terrain.mountain;
  const dB = Math.hypot(x - mtn.x, z - mtn.z);
  const flatR = park.overlook.deckRadius + 3.0;
  if (dB < flatR + 12) {
    const w = 1 - sstep(flatR, flatR + 12, dB);
    h = h * (1 - w) + mtn.height * w;
  }

  // 6. Pinned trails: levelled under the trail, banks cut or built up beside it
  const k = cfg.bankSlope ?? 0.9;
  for (const p of getPinned()) {
    let bestD = Infinity;
    let bestY = 0;
    for (const [x1, z1, y1, x2, z2, y2] of p.segs) {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len2 = dx * dx + dz * dz;
      const t = len2 > 0 ? clamp(((x - x1) * dx + (z - z1) * dz) / len2, 0, 1) : 0;
      const px = x1 + t * dx - x;
      const pz = z1 + t * dz - z;
      const d2 = px * px + pz * pz;
      if (d2 < bestD) { bestD = d2; bestY = y1 + (y2 - y1) * t; }
    }
    const d = Math.sqrt(bestD);
    const w0 = p.halfWidth + 0.9;
    if (d <= w0) {
      h = bestY;
    } else {
      const over = d - w0;
      const bounded = clamp(h, bestY - k * over, bestY + k * over);
      h = bestY + (bounded - bestY) * sstep(0, 2.6, over);
    }
  }
  return h;
}
