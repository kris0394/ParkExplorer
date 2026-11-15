/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TASK 22: flexible park structure.
 *
 * Older parks describe their trail as exactly two lists of points (west and east) with one footbridge,
 * and use a fixed set of landmark ids. Newer parks can describe ANY number of trail paths (loops and
 * branches), zero or several bridges, and any landmarks. All the game code asks the small helpers in
 * this file instead of reading those fields directly, so both kinds of park work.
 *
 * This file only holds plain data helpers (no 3D code), so the validator and scripts can use it too.
 */

import { mulberry32 } from '../utils/noise.ts';

/** A trail point. `y` is optional: parks with a `terrain.badlands` block can pin the ground height under a trail (Task 25). */
export type PathNode = { x: number; z: number; y?: number };

/** One walkable trail. Loops set closed: true (the last node then joins back to the first). */
export interface TrailPath {
  id: string;
  name: string;
  nodes: PathNode[];
  closed?: boolean;
  /** Smoothness of the drawn ribbon (points per segment). Default 16. */
  steps?: number;
  /** Task 25: this path's own surface colours (default: the park's trail surface). */
  surface?: { center: number; mid: number; edge: number };
  /** Task 25: draw this path as a raised wooden boardwalk with planks (Badlands Door and Window trails). */
  boardwalk?: boolean;
  /** Task 25: this path's own width in metres (default: the park's trail width). */
  width?: number;
}

export interface TrailBridge {
  /** 'timber' (default) or 'stone' (granite arch-style bridge with stone parapets). */
  style?: 'timber' | 'stone';
  name: string;
  westX: number;
  eastX: number;
  centerZ: number;
  deckY: number;
  width: number;
}

export type WaterMode = 'river' | 'dry-wash' | 'none';

/** The trail part of a park (kept loose so any ParkDefinition fits). */
interface TrailHolder {
  trail: { paths?: TrailPath[]; westNodes?: PathNode[]; eastNodes?: PathNode[] };
}

/** The parts of a park these helpers read (kept loose so any ParkDefinition fits). */
interface StructurePark {
  trail: {
    paths?: TrailPath[];
    westNodes?: PathNode[];
    eastNodes?: PathNode[];
    bridge?: TrailBridge;
    bridges?: TrailBridge[];
  };
  water: { mode?: WaterMode; hasRiver: boolean; refZ?: number; stones?: unknown };
  terrain: { mountain: { x: number; z: number } };
  overlook: { deckRadius: number };
}

const legacyCache = new WeakMap<object, TrailPath[]>();

/**
 * All trail paths of a park. Parks with trail.paths use it as written. Older parks get two paths,
 * 'west' and 'east', built from westNodes and eastNodes (same smoothness values the game always used).
 */
export function getTrailPaths(park: TrailHolder): TrailPath[] {
  const t = park.trail;
  if (t.paths && t.paths.length > 0) return t.paths;
  const cached = legacyCache.get(t);
  if (cached) return cached;
  const built: TrailPath[] = [];
  if (t.westNodes && t.westNodes.length > 0) built.push({ id: 'west', name: 'West trail', nodes: t.westNodes, steps: 14 });
  if (t.eastNodes && t.eastNodes.length > 0) built.push({ id: 'east', name: 'East trail', nodes: t.eastNodes, steps: 16 });
  legacyCache.set(t, built);
  return built;
}

/** The points of a path as a plain line. A loop gets its first point repeated at the end so it closes. */
export function getPathLine(path: TrailPath): PathNode[] {
  return path.closed && path.nodes.length > 1 ? [...path.nodes, path.nodes[0]] : path.nodes;
}

/** Find one path by id (litter and other data refer to paths by id). */
export function findTrailPath(park: TrailHolder, id: string): TrailPath | undefined {
  return getTrailPaths(park).find(p => p.id === id);
}

/** Every bridge of a park (none, one or several). */
export function getBridges(park: StructurePark): TrailBridge[] {
  const t = park.trail;
  if (t.bridges && t.bridges.length > 0) return t.bridges;
  return t.bridge ? [t.bridge] : [];
}

/** Which kind of water the park has. Older parks only have hasRiver, which still works. */
export function getWaterMode(park: StructurePark): WaterMode {
  return park.water.mode ?? (park.water.hasRiver ? 'river' : 'none');
}

/** The "zero line" the winding channel is measured from: water.refZ, else the first bridge, else 0. */
export function getWaterRefZ(park: StructurePark): number {
  if (typeof park.water.refZ === 'number') return park.water.refZ;
  return getBridges(park)[0]?.centerZ ?? 0;
}

/**
 * The path that leads up to the summit: the open path whose last point is nearest the mountain.
 * (For older parks that is always the 'east' path.) Its last point is where the summit wall opens,
 * where the lookout hut turns its back, and where cairns are laid.
 */
export function getSummitApproach(park: StructurePark): { path: TrailPath; end: PathNode } | null {
  const paths = getTrailPaths(park);
  const m = park.terrain.mountain;
  let best: { path: TrailPath; end: PathNode } | null = null;
  let bestD = Infinity;
  for (const p of paths) {
    if (p.closed || p.nodes.length < 2) continue;
    const end = p.nodes[p.nodes.length - 1];
    const d = Math.hypot(end.x - m.x, end.z - m.z);
    if (d < bestD) { bestD = d; best = { path: p, end }; }
  }
  if (best) return best;
  // Only loops: use the loop point nearest the mountain
  for (const p of paths) {
    for (const n of p.nodes) {
      const d = Math.hypot(n.x - m.x, n.z - m.z);
      if (d < bestD) { bestD = d; best = { path: p, end: n }; }
    }
  }
  return best;
}

/** Landmark shape used for jump-bar labels. */
interface LabelLandmark { id: string; name: string; shortName?: string }

/** Plain words for the four ids older parks use. */
const LEGACY_JUMP_LABELS: Record<string, string> = {
  spawn: 'Trailhead',
  bridge: 'Bridge',
  switchback: 'Switchback',
  summit: 'Summit',
};

/** Short, readable label for the "Jump to" bar: shortName, else the old map, else the first word of the name. */
export function jumpLabel(lm: LabelLandmark): string {
  return lm.shortName?.trim() || LEGACY_JUMP_LABELS[lm.id] || lm.name.split(' ')[0];
}

/** Is this landmark the high point of the park (the jump-bar highlights it)? */
export function isSummitLandmark(park: StructurePark, lm: { id: string; x: number; z: number }): boolean {
  if (lm.id === 'summit') return true;
  const m = park.terrain.mountain;
  return Math.hypot(lm.x - m.x, lm.z - m.z) <= park.overlook.deckRadius + 6;
}

/** Task 23: is this spot inside one of the park's treeless meadows (look.balds)? margin widens the meadow. */
export function isInBald(
  park: { vegetation: { look?: { balds?: { x: number; z: number; radius: number }[] } } },
  x: number,
  z: number,
  margin = 0
): boolean {
  const balds = park.vegetation.look?.balds;
  if (!balds) return false;
  return balds.some(b => Math.hypot(x - b.x, z - b.z) < b.radius + margin);
}

/**
 * Task 25: the mound positions of a prairie dog town (always the same for the same town, so the mound scenery and the
 * prairie dogs that sit on them agree).
 */
export function getPrairieDogMounds(town: { x: number; z: number; radius: number; mounds: number }): { x: number; z: number; size: number }[] {
  const rand = mulberry32(4242 + Math.round(town.x * 3 + town.z * 7));
  const out: { x: number; z: number; size: number }[] = [];
  for (let i = 0, tries = 0; i < town.mounds && tries < town.mounds * 30; tries++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * town.radius;
    const x = town.x + Math.cos(a) * r;
    const z = town.z + Math.sin(a) * r;
    // keep mounds a little apart
    if (out.some(m => Math.hypot(m.x - x, m.z - z) < 2.6)) continue;
    out.push({ x, z, size: 0.7 + rand() * 0.7 });
    i++;
  }
  return out;
}

/**
 * Task 26: a walk-in cave tour. The passage is described once, in local metres (mouth at the origin, the passage running
 * toward -z), and placed in the world from the park's `features.caveTour` { x, z, yaw }.
 */
export interface CaveLayout {
  mouth: PathNode;
  /** Direction the mouth faces (world), as a unit vector. */
  facing: PathNode;
  /** Centre line of the passage in world coordinates (ends at the edge of the chamber). */
  nodes: PathNode[];
  chamber: { x: number; z: number; radius: number };
  /** Half width of the passage. */
  halfWidth: number;
  /** Roof height above the floor. */
  roof: number;
}

const CAVE_LOCAL: [number, number][] = [[0, 0], [0, -6], [4, -13], [9, -19], [10, -27], [5, -34], [-2, -39]];
const CAVE_CHAMBER_LOCAL = { x: -6, z: -46, radius: 6.5 };
const caveCache = new WeakMap<object, CaveLayout>();

export function getCaveLayout(cfg: { x: number; z: number; yaw?: number }): CaveLayout {
  const hit = caveCache.get(cfg);
  if (hit) return hit;
  const yaw = cfg.yaw ?? 0;
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  const toWorld = (lx: number, lz: number): PathNode => ({ x: cfg.x + lx * rx + lz * fx, z: cfg.z + lx * rz + lz * fz });
  const nodes = CAVE_LOCAL.map(([lx, lz]) => toWorld(lx, lz));
  const chamberC = toWorld(CAVE_CHAMBER_LOCAL.x, CAVE_CHAMBER_LOCAL.z);
  const last = nodes[nodes.length - 1];
  const dx = last.x - chamberC.x;
  const dz = last.z - chamberC.z;
  const d = Math.hypot(dx, dz) || 1;
  nodes.push({ x: chamberC.x + (dx / d) * (CAVE_CHAMBER_LOCAL.radius - 0.3), z: chamberC.z + (dz / d) * (CAVE_CHAMBER_LOCAL.radius - 0.3) });
  const layout: CaveLayout = {
    mouth: { x: cfg.x, z: cfg.z },
    facing: { x: fx, z: fz },
    nodes,
    chamber: { x: chamberC.x, z: chamberC.z, radius: CAVE_CHAMBER_LOCAL.radius },
    halfWidth: 1.7,
    roof: 2.9,
  };
  caveCache.set(cfg, layout);
  return layout;
}

/** Distance from a point to the cave's footprint (the passage centre line or the chamber), 0 or less when inside. */
export function distanceToCave(layout: CaveLayout, x: number, z: number): number {
  let best = Math.hypot(x - layout.chamber.x, z - layout.chamber.z) - layout.chamber.radius;
  for (let i = 0; i < layout.nodes.length - 1; i++) {
    const a = layout.nodes[i];
    const b = layout.nodes[i + 1];
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const len2 = abx * abx + abz * abz || 1;
    const t = Math.max(0, Math.min(1, ((x - a.x) * abx + (z - a.z) * abz) / len2));
    best = Math.min(best, Math.hypot(x - (a.x + abx * t), z - (a.z + abz * t)) - layout.halfWidth);
  }
  return best;
}

/** Number keys 1 to 9 jump to the first nine landmarks. */
export const MAX_HOTKEY_LANDMARKS = 9;
