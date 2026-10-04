/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mulberry32, sstep, fbm } from '../utils/noise.ts';
import {
  heightAt,
  getRiverCenterX,
  getRiverWaterY,
  getRiverDistance,
  isPointOnBridge,
  isPointOnSummitDeck,
} from '../terrain/riverTerrain.ts';
import { getDistanceToTrail } from './trailMesh.ts';
import { RockInstance } from '../types/nature.ts';
import { getActivePark } from '../data/parks.ts';

// Spatial grid for fast collision check
const ROCK_CELL = 10;
const rockGrid = new Map<string, { x: number; z: number; r: number }[]>();

function rKey(cx: number, cz: number): string {
  return `${cx},${cz}`;
}

export function pushOutOfRocks(p: { x: number; z: number }): void {
  const cx = Math.floor(p.x / ROCK_CELL);
  const cz = Math.floor(p.z / ROCK_CELL);

  for (let ox = -1; ox <= 1; ox++) {
    for (let oz = -1; oz <= 1; oz++) {
      const list = rockGrid.get(rKey(cx + ox, cz + oz));
      if (!list) continue;

      for (const r of list) {
        const dx = p.x - r.x;
        const dz = p.z - r.z;
        const minD = r.r + 0.35;
        const d2 = dx * dx + dz * dz;

        if (d2 < minD * minD && d2 > 1e-6) {
          const d = Math.sqrt(d2);
          p.x = r.x + (dx / d) * minD;
          p.z = r.z + (dz / d) * minD;
        }
      }
    }
  }
}

/**
 * Builds a sculpted low-poly rock geometry with irregular facets.
 */
function createSculptedRockGeometry(seed: number): THREE.BufferGeometry {
  const rand = mulberry32(seed);
  const geo = new THREE.DodecahedronGeometry(1.0, 1);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // Organic deformation
    const n = Math.sin(x * 3.1 + y * 2.7 + seed) * Math.cos(z * 3.4 - x * 1.8);
    const distFactor = 0.85 + 0.3 * (rand() - 0.5) + n * 0.15;
    pos.setXYZ(i, x * distFactor, y * (0.8 + 0.3 * rand()) * distFactor, z * distFactor);
  }

  geo.computeVertexNormals();

  // Vertex colors for stone mottling and moss
  const colors = new Float32Array(pos.count * 3);
  const baseCol = new THREE.Color(0x605c54);
  const darkCol = new THREE.Color(0x423e38);
  const mossCol = new THREE.Color(0x566042);

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const m = (rand() - 0.5) * 0.2;
    const col = baseCol.clone().lerp(darkCol, rand() * 0.5);
    // Green moss on top-facing facets
    if (y > 0.2) {
      col.lerp(mossCol, (y - 0.2) * 0.45);
    }
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

/**
 * Creates foam ring geometry around river rocks.
 */
function createFoamRingGeometry(radius: number): THREE.BufferGeometry {
  const innerR = radius * 0.9;
  const outerR = radius * 1.55;
  const geo = new THREE.RingGeometry(innerR, outerR, 16);
  geo.rotateX(-Math.PI / 2);
  return geo;
}

/**
 * Places boulders and river rocks across the terrain.
 */
export function createRocksSystem(): THREE.Group {
  rockGrid.clear();
  const group = new THREE.Group();
  group.name = 'rocksSystem';

  const rockMat = new THREE.MeshLambertMaterial({
    vertexColors: true,
    flatShading: true,
  });

  const foamMat = new THREE.MeshBasicMaterial({
    color: 0xebf7ee,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  // Base rock variants
  const rockGeos = [
    createSculptedRockGeometry(101),
    createSculptedRockGeometry(202),
    createSculptedRockGeometry(303),
  ];

  const rockList: RockInstance[] = [];
  const foamGeos: THREE.BufferGeometry[] = [];
  const rand = mulberry32(98765);

  const park = getActivePark();

  // 1. Riverbed & Riverbank Rocks (Cluster along the river flow)
  for (let z = -240; z <= 240; z += 6.5) {
    const rCount = 1 + Math.floor(rand() * 3);
    for (let c = 0; c < rCount; c++) {
      const rx = getRiverCenterX(z);
      // Span from riverbed to banks
      const offset = (rand() - 0.5) * (park.water.halfWidth * 2.4);
      const x = rx + offset;
      const rz = z + (rand() - 0.5) * 4.0;

      // Skip right near bridge
      if (Math.abs(rz - 4.0) < 3.2 && x >= 20.0 && x <= 38.0) continue;

      const groundY = heightAt(x, rz);
      const waterY = getRiverWaterY(rz);
      const isRiver = Math.abs(offset) < park.water.halfWidth;

      const scale = isRiver ? (0.6 + rand() * 1.1) : (1.0 + rand() * 1.8);
      const rockRadius = scale * 0.9;

      // River rocks protrude through water
      const y = isRiver ? Math.max(groundY - 0.2, waterY - scale * 0.3) : groundY - scale * 0.25;

      rockList.push({
        x,
        y,
        z: rz,
        radius: rockRadius,
        scaleX: scale * (0.8 + rand() * 0.4),
        scaleY: scale * (0.7 + rand() * 0.5),
        scaleZ: scale * (0.8 + rand() * 0.4),
        rotX: rand() * Math.PI,
        rotY: rand() * Math.PI * 2,
        rotZ: rand() * Math.PI,
        colorHex: isRiver ? 0x3d3934 : 0x5a564e,
        isRiverRock: isRiver,
      });

      // If protruding above water, add foam ring at water surface
      if (isRiver && (y + scale * 0.6) > waterY) {
        const ring = createFoamRingGeometry(rockRadius * 1.1);
        ring.translate(x, waterY + 0.02, rz);
        foamGeos.push(ring);
      }

      // Add to collision grid if large enough to block player
      if (scale > 0.95 && !isRiver) {
        const cx = Math.floor(x / ROCK_CELL);
        const cz = Math.floor(rz / ROCK_CELL);
        const key = rKey(cx, cz);
        if (!rockGrid.has(key)) rockGrid.set(key, []);
        rockGrid.get(key)!.push({ x, z: rz, r: rockRadius * 0.75 });
      }
    }
  }

  // 2. Hillside & Summit Boulders (Framing the spiral trail and peak)
  for (let i = 0; i < 90; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 10.0 + rand() * 45.0;
    const x = park.terrain.mountain.x + Math.cos(angle) * dist;
    const z = park.terrain.mountain.z + Math.sin(angle) * dist;

    // Skip trail center
    if (getDistanceToTrail(x, z) < 2.5) continue;
    // Skip summit deck
    if (isPointOnSummitDeck(x, z)) continue;

    const groundY = heightAt(x, z);
    const scale = 1.2 + rand() * 2.4;
    const rockRadius = scale * 0.85;

    rockList.push({
      x,
      y: groundY - scale * 0.3,
      z,
      radius: rockRadius,
      scaleX: scale * (0.85 + rand() * 0.35),
      scaleY: scale * (0.75 + rand() * 0.55),
      scaleZ: scale * (0.85 + rand() * 0.35),
      rotX: rand() * Math.PI,
      rotY: rand() * Math.PI * 2,
      rotZ: rand() * Math.PI,
      colorHex: 0x58534b,
    });

    const cx = Math.floor(x / ROCK_CELL);
    const cz = Math.floor(z / ROCK_CELL);
    const key = rKey(cx, cz);
    if (!rockGrid.has(key)) rockGrid.set(key, []);
    rockGrid.get(key)!.push({ x, z, r: rockRadius * 0.75 });
  }

  // Build instanced meshes
  // Divide rocks evenly between the 3 base geometries
  const variants: { geo: THREE.BufferGeometry; items: RockInstance[] }[] = rockGeos.map(geo => ({
    geo,
    items: [],
  }));

  rockList.forEach((r, idx) => {
    variants[idx % variants.length].items.push(r);
  });

  const dummy = new THREE.Object3D();
  for (const v of variants) {
    if (v.items.length === 0) continue;
    const mesh = new THREE.InstancedMesh(v.geo, rockMat, v.items.length);
    v.items.forEach((item, i) => {
      dummy.position.set(item.x, item.y, item.z);
      dummy.rotation.set(item.rotX, item.rotY, item.rotZ);
      dummy.scale.set(item.scaleX, item.scaleY, item.scaleZ);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, new THREE.Color(item.colorHex));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // Add merged foam rings around protruding river rocks
  if (foamGeos.length > 0) {
    const mergedFoam = mergeGeometries(foamGeos, false);
    if (mergedFoam) {
      const foamMesh = new THREE.Mesh(mergedFoam, foamMat);
      foamMesh.renderOrder = 2;
      group.add(foamMesh);
    }
  }

  return group;
}
