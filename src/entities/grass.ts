/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mulberry32, sstep, fbm } from '../utils/noise.ts';
import {
  heightAt,
  slopeAt,
  getRiverDistance,
  isPointOnBridge,
  isPointOnSummitDeck,
} from '../terrain/riverTerrain.ts';
import { getDistanceToTrail } from './trailMesh.ts';
import { getActivePark } from '../data/parks.ts';

const GRASS_COUNT = 2200;
const GRASS_RADIUS = 46.0;
const GRASS_AREA = GRASS_RADIUS * 2.0;

/**
 * Builds wild, untamed wilderness grass tufts using consistent quad geometries.
 * Guarantees 100% matched vertex attributes across all merged parts.
 */
function createWildVegetationGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  // Authentic wild nature color palette
  const cDeepRoot = new THREE.Color(0x1a3316);   // deep shaded earth root
  const cOliveStalk = new THREE.Color(0x486629); // wild mountain rye
  const cGoldenWheat = new THREE.Color(0xc4af57);// dry golden seed awns
  const cFernGreen = new THREE.Color(0x285427);  // wild cove fern
  const cLupine = new THREE.Color(0x8f62c0);     // wild mountain lupine purple
  const cGoldFlower = new THREE.Color(0xdca236); // mountain goldenrod amber

  const rand = mulberry32(19283);

  // Helper to create a single quad blade with exact identical attributes
  const makeBlade = (
    wBottom: number,
    wTop: number,
    h: number,
    leanX: number,
    leanZ: number,
    angleY: number,
    rootCol: THREE.Color,
    tipCol: THREE.Color,
    yOffset = 0
  ) => {
    const hwB = wBottom / 2;
    const hwT = wTop / 2;

    const positions = new Float32Array([
      -hwB, yOffset, 0,
      hwB, yOffset, 0,
      hwT + leanX, yOffset + h, leanZ,
      -hwT + leanX, yOffset + h, leanZ,
    ]);

    const colors = new Float32Array([
      rootCol.r, rootCol.g, rootCol.b,
      rootCol.r, rootCol.g, rootCol.b,
      tipCol.r, tipCol.g, tipCol.b,
      tipCol.r, tipCol.g, tipCol.b,
    ]);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.rotateY(angleY);
    geo.computeVertexNormals();
    return geo;
  };

  // 1. Tall Wild Wheatgrass (3 arching blades per tuft)
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI + (rand() - 0.5) * 0.35;
    const h = 0.85 + rand() * 0.45; // 0.85m to 1.3m tall
    const lean = 0.12 + rand() * 0.14;
    parts.push(makeBlade(0.18, 0.04, h, lean, (rand() - 0.5) * 0.1, angle, cDeepRoot, cGoldenWheat));

    // Feathery seed head at tip
    parts.push(makeBlade(0.08, 0.02, 0.18, lean * 0.5, 0, angle, cGoldenWheat, cGoldenWheat.clone().multiplyScalar(1.15), h));
  }

  // 2. Wild Rye & Meadow Grass Blades (3 medium blades)
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI + Math.PI / 6 + (rand() - 0.5) * 0.3;
    const h = 0.55 + rand() * 0.35;
    const lean = -0.12 - rand() * 0.12;
    parts.push(makeBlade(0.22, 0.06, h, lean, (rand() - 0.5) * 0.1, angle, cDeepRoot, cOliveStalk));
  }

  // 3. Low Spreading Fern Fronds (2 fronds arching close to ground)
  for (let i = 0; i < 2; i++) {
    const angle = i * Math.PI + (rand() - 0.5) * 0.6;
    const h = 0.42;
    parts.push(makeBlade(0.28, 0.12, h, (rand() - 0.5) * 0.2, 0.18, angle, cDeepRoot, cFernGreen));
  }

  // 4. Subtle Alpine Wildflower Floret (1 blossom per clump)
  const flowerColor = rand() > 0.5 ? cLupine : cGoldFlower;
  const flowerH = 0.72;
  const fAngle = rand() * Math.PI * 2;
  // Slender flower stem
  parts.push(makeBlade(0.04, 0.03, flowerH, 0, 0, fAngle, cDeepRoot, cOliveStalk));
  // Cross-petal blossom head
  parts.push(makeBlade(0.12, 0.12, 0.12, 0, 0, fAngle, flowerColor, flowerColor, flowerH));
  parts.push(makeBlade(0.12, 0.12, 0.12, 0, 0, fAngle + Math.PI / 2, flowerColor, flowerColor, flowerH));

  const merged = mergeGeometries(parts, false);
  if (!merged) {
    // Fallback guaranteed geometry in unlikely case
    return makeBlade(0.25, 0.05, 0.75, 0.1, 0, 0, cDeepRoot, cOliveStalk);
  }
  return merged;
}

export class GrassSystem {
  public mesh: THREE.InstancedMesh;
  private baseOffsets: { dx: number; dz: number; baseScale: number; rotY: number; clusterRoll: number }[] = [];
  private dummy = new THREE.Object3D();
  private lastUpdatePos = new THREE.Vector2(-9999, -9999);

  constructor() {
    const geo = createWildVegetationGeometry();
    const mat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      flatShading: true,
    });

    this.mesh = new THREE.InstancedMesh(geo, mat, GRASS_COUNT);
    this.mesh.frustumCulled = false;
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = false;

    const rand = mulberry32(54321);

    for (let i = 0; i < GRASS_COUNT; i++) {
      const r = Math.sqrt(rand()) * GRASS_RADIUS;
      const theta = rand() * Math.PI * 2;
      const dx = Math.cos(theta) * r;
      const dz = Math.sin(theta) * r;

      this.baseOffsets.push({
        dx,
        dz,
        baseScale: 0.7 + rand() * 0.65,
        rotY: rand() * Math.PI * 2,
        clusterRoll: rand(),
      });
    }
  }

  public update(playerX: number, playerZ: number, force = false): void {
    const movedDistSq = (playerX - this.lastUpdatePos.x) ** 2 + (playerZ - this.lastUpdatePos.y) ** 2;
    if (!force && movedDistSq < 0.35) {
      return;
    }
    this.lastUpdatePos.set(playerX, playerZ);

    for (let i = 0; i < GRASS_COUNT; i++) {
      const item = this.baseOffsets[i];
      const rawX = playerX + item.dx;
      const rawZ = playerZ + item.dz;

      let wx = (((rawX - playerX) % GRASS_AREA) + GRASS_AREA) % GRASS_AREA - GRASS_RADIUS + playerX;
      let wz = (((rawZ - playerZ) % GRASS_AREA) + GRASS_AREA) % GRASS_AREA - GRASS_RADIUS + playerZ;

      const distToPlayer = Math.hypot(wx - playerX, wz - playerZ);
      const edgeFade = sstep(GRASS_RADIUS, GRASS_RADIUS - 7.0, distToPlayer);

      // Natural wilderness clumping noise
      const clump = fbm(wx * 0.065 + 18, wz * 0.065 - 42, 2);
      if (item.clusterRoll > (sstep(-0.4, 0.4, clump) * 0.75 + 0.25)) {
        this.dummy.position.set(wx, -999, wz);
        this.dummy.scale.set(0.001, 0.001, 0.001);
        this.dummy.updateMatrix();
        this.mesh.setMatrixAt(i, this.dummy.matrix);
        continue;
      }

      // --- EXCLUSION RULES ---
      const inRiver = getRiverDistance(wx, wz) < (getActivePark().water.halfWidth + 0.8);
      const onTrail = getDistanceToTrail(wx, wz) < 1.45;
      const onBridge = isPointOnBridge(wx, wz);
      const onSummit = isPointOnSummitDeck(wx, wz);
      const slope = slopeAt(wx, wz);
      const onCliff = slope > 0.82;

      if (inRiver || onTrail || onBridge || onSummit || onCliff || edgeFade <= 0.01) {
        this.dummy.position.set(wx, -999, wz);
        this.dummy.scale.set(0.001, 0.001, 0.001);
        this.dummy.updateMatrix();
        this.mesh.setMatrixAt(i, this.dummy.matrix);
        continue;
      }

      const gy = heightAt(wx, wz);
      const finalScale = Math.max(0.1, item.baseScale * edgeFade);

      this.dummy.position.set(wx, gy, wz);
      this.dummy.rotation.set(0, item.rotY, 0);
      this.dummy.scale.set(finalScale, finalScale, finalScale);
      this.dummy.updateMatrix();

      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
