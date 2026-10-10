/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TASK 8: Responsible-recreation rules.
 *
 * Everything here is GAME content used to teach good habits (Leave No Trace
 * style). These are NOT official NPS rules, closures or alerts. Real parks
 * differ, so always check each park's own rules before visiting.
 */

import * as THREE from 'three';
import { heightAt } from '../terrain/riverTerrain.ts';
import { ParkDefinition, ParkZone, ParkLitter, AVAILABLE_PARKS, getActivePark } from '../data/parks.ts';
import { getActiveSeason } from '../data/seasons.ts';

/** Game rule: stay at least ~25 yards (23 m) from most wildlife. */
export const SAFE_DISTANCE_M = 23;

/* ------------------------------------------------------------------ */
/* Closed and fragile areas                                           */
/* ------------------------------------------------------------------ */

export type ZoneKind = ParkZone['kind'];
export type RangerZone = ParkZone;

/** Zones that exist in the current season for this park (all content comes from the park's data). */
export function getZonesForPark(parkId: string): RangerZone[] {
  const park = AVAILABLE_PARKS.find(p => p.id === parkId) ?? getActivePark();
  const season = getActiveSeason();
  return park.rules.zones.filter(z => !z.seasons || z.seasons.includes(season));
}

/**
 * Keeps the player out of CLOSED zones (hard rule, always explained).
 * Returns the zone if the player was pushed back this frame.
 */
export function pushOutOfClosedZones(
  pos: { x: number; z: number },
  zones: RangerZone[]
): RangerZone | null {
  let hit: RangerZone | null = null;
  for (const zone of zones) {
    if (zone.kind !== 'closed') continue;
    const dx = pos.x - zone.x;
    const dz = pos.z - zone.z;
    const d = Math.hypot(dx, dz);
    if (d < zone.radius) {
      const nx = d > 0.0001 ? dx / d : 1;
      const nz = d > 0.0001 ? dz / d : 0;
      pos.x = zone.x + nx * zone.radius;
      pos.z = zone.z + nz * zone.radius;
      hit = zone;
    }
  }
  return hit;
}

/** Returns the closed zone containing this point, if any (used to stop fast travel into closures). */
export function findClosedZoneAt(x: number, z: number, zones: RangerZone[]): RangerZone | null {
  for (const zone of zones) {
    if (zone.kind === 'closed' && Math.hypot(x - zone.x, z - zone.z) < zone.radius + 0.5) return zone;
  }
  return null;
}


function makeSignTexture(title: string, line1: string, accent: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 320;
  const g = c.getContext('2d')!;
  g.fillStyle = '#4a3322';
  g.fillRect(0, 0, 512, 320);
  g.fillStyle = '#f1e6cf';
  g.fillRect(12, 12, 488, 296);
  g.fillStyle = accent;
  g.fillRect(12, 12, 488, 80);
  g.fillStyle = '#ffffff';
  g.font = 'bold 46px sans-serif';
  g.textAlign = 'center';
  g.fillText(title, 256, 70);
  g.fillStyle = '#2b2118';
  g.font = 'bold 30px sans-serif';
  g.fillText(line1, 256, 150);
  g.font = '24px sans-serif';
  g.fillText('Game example, not an official', 256, 230);
  g.fillText('NPS notice.', 256, 262);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

function wrapName(name: string): string {
  return name.length > 24 ? name.slice(0, 23) + '…' : name;
}

/** Posts, rope and a sign around each zone so the player can see it. */
export function createZoneMarkersGroup(zones: RangerZone[], park: ParkDefinition): THREE.Group {
  const group = new THREE.Group();
  group.name = 'rangerZoneMarkers';

  const postMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2f });
  const closedMat = new THREE.MeshLambertMaterial({ color: 0xd9472b });
  const sensitiveMat = new THREE.MeshLambertMaterial({ color: 0xe8b52a });
  const ropeClosedMat = new THREE.MeshBasicMaterial({ color: 0xff6a3d });
  const ropeSensitiveMat = new THREE.MeshBasicMaterial({ color: 0xffd35a });

  const postGeo = new THREE.CylinderGeometry(0.05, 0.07, 1.2, 6);
  const capGeo = new THREE.BoxGeometry(0.18, 0.1, 0.18);

  const trailNodes = [...park.trail.westNodes, ...park.trail.eastNodes];

  for (const zone of zones) {
    const isClosed = zone.kind === 'closed';
    const N = isClosed ? 24 : 20;
    const pts: THREE.Vector3[] = [];

    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const x = zone.x + Math.cos(a) * zone.radius;
      const z = zone.z + Math.sin(a) * zone.radius;
      const y = heightAt(x, z);
      pts.push(new THREE.Vector3(x, y, z));

      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(x, y + 0.6, z);
      group.add(post);

      const cap = new THREE.Mesh(capGeo, isClosed ? closedMat : sensitiveMat);
      cap.position.set(x, y + 1.25, z);
      group.add(cap);
    }

    // Rope between neighbouring posts (a thin stretched cylinder)
    for (let i = 0; i < N; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % N];
      const ay = a.y + 1.0;
      const by = b.y + 1.0;
      const start = new THREE.Vector3(a.x, ay, a.z);
      const end = new THREE.Vector3(b.x, by, b.z);
      const len = start.distanceTo(end);
      const rope = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.014, len, 4),
        isClosed ? ropeClosedMat : ropeSensitiveMat
      );
      rope.position.copy(start).add(end).multiplyScalar(0.5);
      rope.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        end.clone().sub(start).normalize()
      );
      group.add(rope);
    }

    // Sign on the side facing the nearest trail node
    let nearest = trailNodes[0];
    let best = Infinity;
    for (const n of trailNodes) {
      const d = Math.hypot(n.x - zone.x, n.z - zone.z);
      if (d < best) {
        best = d;
        nearest = n;
      }
    }
    if (best < zone.radius) {
      // Trail runs into the zone (e.g. summit closure): put the sign where the trail meets the ring
      best = Infinity;
      for (const n of trailNodes) {
        const d = Math.abs(Math.hypot(n.x - zone.x, n.z - zone.z) - zone.radius);
        if (d < best) {
          best = d;
          nearest = n;
        }
      }
    }
    const ang = Math.atan2(nearest.z - zone.z, nearest.x - zone.x);
    const sx = zone.x + Math.cos(ang) * (zone.radius + 0.4);
    const sz = zone.z + Math.sin(ang) * (zone.radius + 0.4);
    const sy = heightAt(sx, sz);

    const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.0, 6), postMat);
    signPost.position.set(sx, sy + 1.0, sz);
    group.add(signPost);

    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.94),
      new THREE.MeshBasicMaterial({
        map: makeSignTexture(
          isClosed ? 'AREA CLOSED' : 'STAY ON TRAIL',
          wrapName(zone.name),
          isClosed ? '#b3341c' : '#b8860b'
        ),
        side: THREE.DoubleSide,
      })
    );
    board.position.set(sx, sy + 1.75, sz);
    board.rotation.y = Math.atan2(Math.cos(ang), Math.sin(ang));
    group.add(board);
  }

  return group;
}

/* ------------------------------------------------------------------ */
/* Litter                                                              */
/* ------------------------------------------------------------------ */

export interface LitterSpot {
  id: string;
  label: string;
  tip: string;
  x: number;
  z: number;
  kind: 'can' | 'bottle' | 'wrapper' | 'peel' | 'bag';
}

function pointAlong(nodes: { x: number; z: number }[], f: number) {
  // Walk along the straight-line polyline between nodes
  const segLens: number[] = [];
  let total = 0;
  for (let i = 0; i < nodes.length - 1; i++) {
    const l = Math.hypot(nodes[i + 1].x - nodes[i].x, nodes[i + 1].z - nodes[i].z);
    segLens.push(l);
    total += l;
  }
  let target = f * total;
  for (let i = 0; i < segLens.length; i++) {
    if (target <= segLens[i] || i === segLens.length - 1) {
      const t = segLens[i] > 0 ? Math.min(1, target / segLens[i]) : 0;
      const a = nodes[i];
      const b = nodes[i + 1];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const len = Math.hypot(dx, dz) || 1;
      return {
        x: a.x + dx * t,
        z: a.z + dz * t,
        // unit vector pointing to the left of travel
        px: -dz / len,
        pz: dx / len,
      };
    }
    target -= segLens[i];
  }
  const last = nodes[nodes.length - 1];
  return { x: last.x, z: last.z, px: 0, pz: 1 };
}

/** Fixed litter positions beside the trails (same every visit, so rewards cannot be farmed). */
export function buildLitterSpots(park: ParkDefinition): LitterSpot[] {
  return park.rules.litter.map((t: ParkLitter) => {
    const nodes = t.trail === 'west' ? park.trail.westNodes : park.trail.eastNodes;
    const p = pointAlong(nodes, t.at);
    const offset = 2.1 * t.side;
    return {
      id: t.id,
      label: t.label,
      tip: t.tip,
      kind: t.kind,
      x: p.x + p.px * offset,
      z: p.z + p.pz * offset,
    };
  });
}

function buildLitterMesh(kind: LitterSpot['kind']): THREE.Object3D {
  const g = new THREE.Group();
  let m: THREE.Mesh;
  switch (kind) {
    case 'can':
      m = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.16, 8),
        new THREE.MeshLambertMaterial({ color: 0xd8382c })
      );
      m.rotation.z = Math.PI / 2;
      m.position.y = 0.07;
      break;
    case 'bottle':
      m = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.3, 8),
        new THREE.MeshLambertMaterial({ color: 0x8fd2ee, transparent: true, opacity: 0.85 })
      );
      m.rotation.z = Math.PI / 2;
      m.rotation.y = 0.6;
      m.position.y = 0.06;
      break;
    case 'wrapper':
      m = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.012, 0.16),
        new THREE.MeshLambertMaterial({ color: 0xf2c230 })
      );
      m.rotation.y = 0.5;
      m.position.y = 0.02;
      break;
    case 'peel':
      m = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.035, 0.08),
        new THREE.MeshLambertMaterial({ color: 0xe6c84a })
      );
      m.rotation.y = -0.7;
      m.position.y = 0.03;
      break;
    default:
      m = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.015, 0.22),
        new THREE.MeshLambertMaterial({ color: 0xf3f3f3 })
      );
      m.rotation.y = 1.1;
      m.position.y = 0.025;
  }
  g.add(m);

  // Soft flat ring so the item is easy to spot from the trail
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.28, 0.36, 20),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.015;
  g.add(ring);
  return g;
}

/** Builds the litter meshes. Pieces already collected on this save are left out. */
export function createLitterGroup(
  spots: LitterSpot[],
  collected: Record<string, number>,
  parkId: string
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'litterGroup';
  for (const s of spots) {
    if (collected[`${parkId}:${s.id}`]) continue;
    const obj = buildLitterMesh(s.kind);
    obj.name = `litter:${s.id}`;
    obj.position.set(s.x, heightAt(s.x, s.z) + 0.02, s.z);
    group.add(obj);
  }
  return group;
}
