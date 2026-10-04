/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { fbm, sstep, clamp } from '../utils/noise.ts';
import { getActivePark } from '../data/parks.ts';

/**
 * Calculates the X coordinate of the river centerline for any Z.
 * Tuned so at the bridge center, X_river aligns with the bridge crossing.
 */
export function getRiverCenterX(z: number): number {
  const park = getActivePark();
  const dz = z - park.trail.bridge.centerZ;
  return 29.0 + 14.5 * Math.sin(dz * 0.017) + 7.2 * Math.sin(dz * 0.041 - 0.2);
}

/**
 * Tangent angle (in radians) of the river flow direction at Z.
 */
export function getRiverTangentAngle(z: number): number {
  const park = getActivePark();
  const dz = z - park.trail.bridge.centerZ;
  const dx_dz = 14.5 * 0.017 * Math.cos(dz * 0.017) + 7.2 * 0.041 * Math.cos(dz * 0.041 - 0.2);
  return Math.atan2(1.0, dx_dz);
}

/**
 * River water surface elevation at Z.
 */
export function getRiverWaterY(z: number): number {
  const park = getActivePark();
  return park.water.surfaceY - (z - park.trail.bridge.centerZ) * park.water.gradient;
}

/**
 * Signed distance from point (x, z) to river centerline.
 * Positive = East of river, Negative = West of river.
 */
export function getRiverSignedDistance(x: number, z: number): number {
  const rx = getRiverCenterX(z);
  return x - rx;
}

/**
 * Absolute distance from (x, z) to the river centerline.
 */
export function getRiverDistance(x: number, z: number): number {
  return Math.abs(getRiverSignedDistance(x, z));
}

/**
 * Comprehensive terrain elevation function.
 * Driven directly by the active ParkDefinition data block.
 */
export function heightAt(x: number, z: number): number {
  const park = getActivePark();

  // 1. Base rolling hills and natural micro-topography from park definition
  let baseH = fbm(x * park.terrain.baseScale + 105, z * park.terrain.baseScale + 95, 4) * park.terrain.heightScale +
              fbm(x * 0.022, z * 0.022, 3) * 2.4 +
              fbm(x * 0.055 + 13, z * 0.055 - 71, 3) * 1.05 + // natural micro hummocks and knolls
              fbm(x * 0.12, z * 0.12, 2) * 0.32;

  // 2. Mountain Peak from park definition
  const mtn = park.terrain.mountain;
  const dxSummit = x - mtn.x;
  const dzSummit = z - mtn.z;
  const distSummit = Math.hypot(dxSummit, dzSummit);

  if (distSummit < mtn.radius) {
    const t = 1.0 - distSummit / mtn.radius;
    const hillRise = Math.pow(Math.max(0, t), 1.7) * (mtn.height - 1.0);
    if (distSummit < mtn.plateauRadius) {
      baseH = mtn.height;
    } else if (distSummit < mtn.plateauRadius + 4.5) {
      const blend = sstep(mtn.plateauRadius, mtn.plateauRadius + 4.5, distSummit);
      baseH = (mtn.height * (1.0 - blend)) + ((baseH + hillRise) * blend);
    } else {
      baseH += hillRise;
    }
  }

  // 3. Spawn clearing flattening from park definition
  const distSpawn = Math.hypot(x - park.spawn.x, z - park.spawn.z);
  if (distSpawn < 42.0) {
    const spawnWeight = 1.0 - sstep(12.0, 42.0, distSpawn);
    baseH = baseH * (1.0 - spawnWeight) + park.spawn.y * spawnWeight;
  }

  // 4. River Valley carving and bank shaping from park definition
  if (park.water.hasRiver) {
    const b = park.trail.bridge;
    const waterY = getRiverWaterY(z);
    const riverHalfW = park.water.halfWidth;
    const bankEndW = park.water.halfWidth + park.water.bankWidth;
    const valleyEndW = park.water.valleyWidth;

    // Bridge approach causeway: ensure solid dry land connects seamlessly to bridge
    const isBridgeApproachWest = (x >= b.westX - 5.0 && x <= b.westX + 4.5) && Math.abs(z - b.centerZ) < 3.4;
    const isBridgeApproachEast = (x >= b.eastX - 4.5 && x <= b.eastX + 5.0) && Math.abs(z - b.centerZ) < 3.4;

    if (isBridgeApproachWest) {
      return Math.max(0.92, waterY + 1.8);
    }
    if (isBridgeApproachEast) {
      return Math.max(1.05, waterY + 1.85);
    }

    const rDist = getRiverDistance(x, z);

    if (rDist < riverHalfW) {
      // Under river water: parabolic riverbed
      const normalizedD = rDist / riverHalfW;
      const bedDepth = 2.4 * (1.0 - normalizedD * normalizedD);
      const bedH = waterY - bedDepth;
      return bedH;
    } else if (rDist < bankEndW) {
      // River bank transition: smoothstep from water edge up to valley floor
      const bankT = sstep(riverHalfW, bankEndW, rDist);
      const bankTopH = waterY + 0.95;
      const naturalH = Math.min(baseH, waterY + 2.5);
      const bankH = (waterY - 0.1) * (1.0 - bankT) + Math.max(bankTopH, naturalH) * bankT;
      return bankH;
    } else if (rDist < valleyEndW) {
      // Valley floor
      const valleyT = sstep(bankEndW, valleyEndW, rDist);
      const valleyFloorH = waterY + 0.95;
      return valleyFloorH * (1.0 - valleyT) + baseH * valleyT;
    }
  }

  return baseH;
}

/**
 * Calculates surface slope steepness at (x, z).
 */
export function slopeAt(x: number, z: number): number {
  const d = 1.0;
  const hL = heightAt(x - d, z);
  const hR = heightAt(x + d, z);
  const hD = heightAt(x, z - d);
  const hU = heightAt(x, z + d);
  const gx = (hR - hL) / (2 * d);
  const gz = (hU - hD) / (2 * d);
  return Math.hypot(gx, gz);
}

/**
 * Check if player is on the wooden bridge deck or approach ramps.
 */
export function isPointOnBridge(x: number, z: number): boolean {
  const park = getActivePark();
  const b = park.trail.bridge;
  return (
    x >= b.westX - 0.5 &&
    x <= b.eastX + 0.5 &&
    Math.abs(z - b.centerZ) <= 2.2
  );
}

/**
 * Check if player is in the river water (and NOT on the bridge).
 */
export function isPointInRiver(x: number, z: number): boolean {
  const park = getActivePark();
  if (!park.water.hasRiver) return false;
  if (isPointOnBridge(x, z)) return false;
  return getRiverDistance(x, z) < park.water.halfWidth;
}

/**
 * Get water depth at (x, z). Returns 0 if not in water.
 */
export function getWaterDepth(x: number, z: number): number {
  if (!isPointInRiver(x, z)) return 0;
  const waterY = getRiverWaterY(z);
  const groundY = heightAt(x, z);
  return Math.max(0, waterY - groundY);
}

/**
 * Checks if point is on the summit platform deck.
 */
export function isPointOnSummitDeck(x: number, z: number): boolean {
  const park = getActivePark();
  const mtn = park.terrain.mountain;
  return Math.hypot(x - mtn.x, z - mtn.z) <= (park.overlook.deckRadius + 0.3);
}

/**
 * Effective walkable surface elevation for player.
 * Perfectly connects the trail into the bridge approach ramps with zero height step.
 */
export function getWalkableHeight(x: number, z: number): number {
  const park = getActivePark();
  const b = park.trail.bridge;

  if (isPointOnBridge(x, z)) {
    const rampLength = 4.5;
    // West approach ramp: ramps smoothly up from dry bank into deck
    if (x < b.westX + rampLength) {
      const t = clamp((x - b.westX) / rampLength, 0, 1);
      const groundH = heightAt(b.westX - 0.5, b.centerZ);
      return groundH * (1.0 - t) + b.deckY * t;
    }
    // East approach ramp: ramps smoothly down into dry hillside trail
    if (x > b.eastX - rampLength) {
      const t = clamp((b.eastX - x) / rampLength, 0, 1);
      const groundH = heightAt(b.eastX + 0.5, b.centerZ);
      return groundH * (1.0 - t) + b.deckY * t;
    }
    return b.deckY;
  }

  if (isPointOnSummitDeck(x, z)) {
    return park.terrain.mountain.height + 0.15;
  }

  return heightAt(x, z);
}
