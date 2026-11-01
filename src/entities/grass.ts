/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSeasonDef } from '../data/seasons.ts';
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
import { isNearRoad } from '../terrain/roadTerrain.ts';
import { getActivePark } from '../data/parks.ts';

const BASE_GRASS_COUNT = 2200;
const BASE_GRASS_RADIUS = 46.0;

/** Helper to create a single quad blade with exact identical attributes */
function makeBlade(
    wBottom: number,
    wTop: number,
    h: number,
    leanX: number,
    leanZ: number,
    angleY: number,
    rootCol: THREE.Color,
    tipCol: THREE.Color,
    yOffset = 0
  ): THREE.BufferGeometry {
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
  }

/**
 * Builds wild, untamed wilderness grass tufts using consistent quad geometries.
 * Guarantees 100% matched vertex attributes across all merged parts.
 */
function createWildVegetationGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  // Authentic wild nature color palette
  const gl = getActivePark().vegetation.look?.grass; // per-park colours (Task 19)
  const cDeepRoot = new THREE.Color(gl?.root ?? 0x1a3316);       // deep shaded earth root
  const cOliveStalk = new THREE.Color(gl?.stalk ?? 0x486629);    // wild mountain rye
  const cGoldenWheat = new THREE.Color(gl?.dry ?? 0xc4af57);     // dry golden seed awns
  const cFernGreen = new THREE.Color(gl?.fern ?? 0x285427);      // wild cove fern
  const cLupine = new THREE.Color(gl?.flowerA ?? 0x8f62c0);      // wild mountain lupine purple
  const cGoldFlower = new THREE.Color(gl?.flowerB ?? 0xdca236);  // mountain goldenrod amber

  const rand = mulberry32(19283);

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

/** Task 24: a tiny tuft of short blades for the carpet of ground cover. */
function createCarpetGeometry(height: number, root: number, tip: number, tipDry: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const cRoot = new THREE.Color(root);
  const cTip = new THREE.Color(tip);
  const cDry = new THREE.Color(tipDry);
  const rand = mulberry32(777);
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI + (rand() - 0.5) * 0.5;
    const h = height * (0.65 + rand() * 0.5);
    const lean = (rand() - 0.5) * 0.14;
    parts.push(makeBlade(0.1, 0.02, h, lean, (rand() - 0.5) * 0.08, angle, cRoot, i % 2 === 0 ? cTip : cDry));
  }
  return mergeGeometries(parts, false) ?? makeBlade(0.1, 0.02, height, 0, 0, 0, cRoot, cTip);
}

export class GrassSystem {
  public mesh: THREE.InstancedMesh;
  /** Task 24: short-grass carpet (only for parks with look.grassland.carpet). Add it to the scene too. */
  public carpet: THREE.InstancedMesh | null = null;
  private baseOffsets: { dx: number; dz: number; baseScale: number; rotY: number; clusterRoll: number }[] = [];
  private carpetOffsets: { dx: number; dz: number; baseScale: number; rotY: number; clusterRoll: number }[] = [];
  private dummy = new THREE.Object3D();
  private lastUpdatePos = new THREE.Vector2(-9999, -9999);
  private count = BASE_GRASS_COUNT;
  private radius = BASE_GRASS_RADIUS;
  private tints: THREE.Color[] = [];
  private timeUniforms: { value: number }[] = [];
  private tmpColor = new THREE.Color();

  constructor() {
    const gl = getActivePark().vegetation.look?.grassland;
    if (gl) {
      this.count = Math.round(BASE_GRASS_COUNT * gl.density);
      this.radius = gl.radius;
      this.tints = gl.tints.map(c => new THREE.Color(c));
    }
    const geo = createWildVegetationGeometry();
    const mat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      flatShading: true,
    });
    // Season tint (spring lush, autumn golden, winter frosted)
    const gt = getSeasonDef().grassTint;
    mat.color.setRGB(gt[0], gt[1], gt[2]);
    if (gl && gl.sway > 0) this.addSway(mat, gl.sway);

    this.mesh = new THREE.InstancedMesh(geo, mat, this.count);
    this.mesh.frustumCulled = false;
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = false;

    const rand = mulberry32(54321);

    for (let i = 0; i < this.count; i++) {
      const r = Math.sqrt(rand()) * this.radius;
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

    if (gl?.carpet) {
      const c = gl.carpet;
      const cmat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, flatShading: true });
      cmat.color.setRGB(gt[0], gt[1], gt[2]);
      if (gl.sway > 0) this.addSway(cmat, gl.sway * 0.6);
      this.carpet = new THREE.InstancedMesh(createCarpetGeometry(c.height, c.root, c.tip, c.tipDry), cmat, c.count);
      this.carpet.frustumCulled = false;
      this.carpet.receiveShadow = true;
      this.carpet.castShadow = false;
      const crand = mulberry32(8675309);
      for (let i = 0; i < c.count; i++) {
        const r = Math.sqrt(crand()) * c.radius;
        const theta = crand() * Math.PI * 2;
        this.carpetOffsets.push({
          dx: Math.cos(theta) * r,
          dz: Math.sin(theta) * r,
          baseScale: 0.75 + crand() * 0.6,
          rotY: crand() * Math.PI * 2,
          clusterRoll: crand(),
        });
      }
    }
  }

  /** Gentle wind: blade tips sway more than roots (vertex shader tweak). */
  private addSway(mat: THREE.MeshLambertMaterial, amount: number): void {
    const uTime = { value: 0 };
    this.timeUniforms.push(uTime);
    mat.onBeforeCompile = shader => {
      shader.uniforms.uTime = uTime;
      shader.vertexShader = shader.vertexShader
        .replace('void main() {', 'uniform float uTime;\nvoid main() {')
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          #ifdef USE_INSTANCING
            vec4 swayPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
            float swayAmt = position.y * ${amount.toFixed(3)};
            transformed.x += sin(uTime * 1.7 + swayPos.x * 0.31 + swayPos.z * 0.23) * 0.11 * swayAmt;
            transformed.z += cos(uTime * 1.3 + swayPos.x * 0.19 + swayPos.z * 0.37) * 0.08 * swayAmt;
          #endif`
        );
    };
  }

  /** Call every frame with the clock (seconds) to animate the wind. */
  public tick(t: number): void {
    for (const u of this.timeUniforms) u.value = t;
  }

  private isBlocked(wx: number, wz: number): boolean {
    const park = getActivePark();
    const inRiver = getRiverDistance(wx, wz) < (park.water.halfWidth + 0.8);
    const onTrail = getDistanceToTrail(wx, wz) < 1.45 || isNearRoad(wx, wz, 0.9);
    return inRiver || onTrail || isPointOnBridge(wx, wz) || isPointOnSummitDeck(wx, wz) || slopeAt(wx, wz) > 0.82;
  }

  public update(playerX: number, playerZ: number, force = false): void {
    const gl = getActivePark().vegetation.look?.grassland;
    // The richer grassland look moves more tufts, so it refreshes a little less often
    const movedDistSq = (playerX - this.lastUpdatePos.x) ** 2 + (playerZ - this.lastUpdatePos.y) ** 2;
    if (!force && movedDistSq < (gl ? 1.0 : 0.35)) {
      return;
    }
    this.lastUpdatePos.set(playerX, playerZ);

    const GRASS_RADIUS = this.radius;
    const GRASS_AREA = GRASS_RADIUS * 2.0;
    const GRASS_COUNT = this.count;

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
      const seaY = getActivePark().terrain.coast?.seaY;
      const inRiver = getRiverDistance(wx, wz) < (getActivePark().water.halfWidth + 0.8);
      const onTrail = getDistanceToTrail(wx, wz) < 1.45 || isNearRoad(wx, wz, 0.9);
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
      const finalScale = Math.max(0.1, item.baseScale * edgeFade * ((seaY !== undefined && gy < seaY + 0.8) ? 0 : 1));

      let tall = finalScale;
      if (gl) {
        // Task 24: tall and short patches, and tufts tinted green, golden or straw across the land
        const patch = sstep(-0.5, 0.5, fbm(wx * gl.patchScale + 7, wz * gl.patchScale - 3, 2));
        tall = finalScale * (gl.heightRange[0] + (gl.heightRange[1] - gl.heightRange[0]) * patch);
        if (this.tints.length > 0) {
          const t = sstep(-0.5, 0.5, fbm(wx * 0.021 - 50, wz * 0.021 + 20, 3)) * (this.tints.length - 1);
          const lo = Math.min(this.tints.length - 2, Math.floor(t));
          const k = this.tints.length > 1 ? t - lo : 0;
          this.tmpColor.copy(this.tints[lo]).lerp(this.tints[Math.min(this.tints.length - 1, lo + 1)], k);
          this.tmpColor.multiplyScalar(0.88 + item.clusterRoll * 0.24);
          this.mesh.setColorAt(i, this.tmpColor);
        }
      }

      this.dummy.position.set(wx, gy, wz);
      this.dummy.rotation.set(0, item.rotY, 0);
      this.dummy.scale.set(finalScale, tall, finalScale);
      this.dummy.updateMatrix();

      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;

    if (gl?.carpet && this.carpet) this.updateCarpet(playerX, playerZ, gl.carpet.radius, gl);
  }

  private updateCarpet(
    playerX: number,
    playerZ: number,
    radius: number,
    gl: NonNullable<NonNullable<ReturnType<typeof getActivePark>['vegetation']['look']>['grassland']>
  ): void {
    const mesh = this.carpet!;
    const area = radius * 2;
    for (let i = 0; i < this.carpetOffsets.length; i++) {
      const item = this.carpetOffsets[i];
      const wx = (((playerX + item.dx - playerX) % area) + area) % area - radius + playerX;
      const wz = (((playerZ + item.dz - playerZ) % area) + area) % area - radius + playerZ;
      const edgeFade = sstep(radius, radius - 5.0, Math.hypot(wx - playerX, wz - playerZ));
      if (edgeFade <= 0.01 || this.isBlocked(wx, wz)) {
        this.dummy.position.set(wx, -999, wz);
        this.dummy.scale.set(0.001, 0.001, 0.001);
        this.dummy.updateMatrix();
        mesh.setMatrixAt(i, this.dummy.matrix);
        continue;
      }
      const seaY = getActivePark().terrain.coast?.seaY;
      const gy = heightAt(wx, wz);
      const s = item.baseScale * edgeFade * ((seaY !== undefined && gy < seaY + 0.8) ? 0 : 1);
      // Shorter on the bare patches, a little taller where the big grass is tall
      const patch = sstep(-0.5, 0.5, fbm(wx * gl.patchScale + 7, wz * gl.patchScale - 3, 2));
      this.dummy.position.set(wx, gy, wz);
      this.dummy.rotation.set(0, item.rotY, 0);
      this.dummy.scale.set(Math.max(0.05, s), Math.max(0.05, s * (0.6 + patch * 0.8)), Math.max(0.05, s));
      this.dummy.updateMatrix();
      mesh.setMatrixAt(i, this.dummy.matrix);
      if (this.tints.length > 0) {
        const t = sstep(-0.5, 0.5, fbm(wx * 0.021 - 50, wz * 0.021 + 20, 3));
        this.tmpColor.copy(this.tints[0]).lerp(this.tints[this.tints.length - 1], t).multiplyScalar(0.9 + item.clusterRoll * 0.2);
        mesh.setColorAt(i, this.tmpColor);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
}
