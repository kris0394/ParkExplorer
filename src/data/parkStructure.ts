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

export type PathNode = { x: number; z: number };

/** One walkable trail. Loops set closed: true (the last node then joins back to the first). */
export interface TrailPath {
  id: string;
  name: string;
  nodes: PathNode[];
  closed?: boolean;
  /** Smoothness of the drawn ribbon (points per segment). Default 16. */
  steps?: number;
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

/** Number keys 1 to 9 jump to the first nine landmarks. */
export const MAX_HOTKEY_LANDMARKS = 9;
