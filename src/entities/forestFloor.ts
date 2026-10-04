/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mulberry32, fbm, sstep } from '../utils/noise.ts';
import {
  heightAt,
  slopeAt,
  getRiverDistance,
  isPointOnBridge,
  isPointOnSummitDeck,
} from '../terrain/riverTerrain.ts';
import { getDistanceToTrail } from './trailMesh.ts';
import { getActivePark } from '../data/parks.ts';

/**
 * Creates natural wild forest floor debris:
 * Mossy fallen timber logs, decaying nurse logs, and weathered field stones
 * characteristic of untamed national park wilderness.
 */
export function createForestFloorSystem(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'forestFloor';

  const park = getActivePark();
  const rand = mulberry32(441199);

  const barkMat = new THREE.MeshLambertMaterial({
    color: 0x463525,
  });

  const mossMat = new THREE.MeshLambertMaterial({
    color: 0x3d6632,
  });

  const logGeos: THREE.BufferGeometry[] = [];
  const mossGeos: THREE.BufferGeometry[] = [];

  const logCount = 48;
  let placed = 0;
  let tries = 0;

  while (placed < logCount && tries < 400) {
    tries++;
    const x = (rand() - 0.5) * 440;
    const z = (rand() - 0.5) * 440;

    // Exclusions
    if (Math.hypot(x - park.spawn.x, z - park.spawn.z) < 14.0) continue;
    if (getDistanceToTrail(x, z) < 3.2) continue;
    if (getRiverDistance(x, z) < (park.water.halfWidth + 1.8)) continue;
    if (isPointOnBridge(x, z) || isPointOnSummitDeck(x, z)) continue;
    if (slopeAt(x, z) > 0.75) continue;

    // Prefer wooded areas
    const forestDensity = fbm(x * 0.012 + 7, z * 0.012 + 3, 3);
    if (forestDensity < -0.15 && rand() > 0.25) continue;

    const logLength = 3.2 + rand() * 4.8;
    const logRadius = 0.18 + rand() * 0.22;
    const angleY = rand() * Math.PI * 2;

    const yMid = heightAt(x, z);
    const x1 = x - Math.cos(angleY) * (logLength / 2);
    const z1 = z - Math.sin(angleY) * (logLength / 2);
    const x2 = x + Math.cos(angleY) * (logLength / 2);
    const z2 = z + Math.sin(angleY) * (logLength / 2);

    const y1 = heightAt(x1, z1);
    const y2 = heightAt(x2, z2);

    // Main fallen log cylinder
    const logGeo = new THREE.CylinderGeometry(logRadius * 0.85, logRadius * 1.15, logLength, 7);
    logGeo.rotateZ(Math.PI / 2);
    // Align with slope
    const pitch = Math.atan2(y2 - y1, logLength);
    logGeo.rotateY(-angleY);
    logGeo.rotateZ(pitch);
    logGeo.translate(x, yMid + logRadius * 0.65, z);
    logGeos.push(logGeo);

    // Moss blanket on upper surface of log
    const mossCap = new THREE.CylinderGeometry(logRadius * 0.95, logRadius * 1.2, logLength * 0.65, 6, 1, false, 0, Math.PI);
    mossCap.rotateZ(Math.PI / 2);
    mossCap.rotateY(-angleY);
    mossCap.rotateZ(pitch);
    mossCap.translate(x, yMid + logRadius * 0.75, z);
    mossGeos.push(mossCap);

    placed++;
  }

  if (logGeos.length > 0) {
    const mergedLogs = mergeGeometries(logGeos, false);
    if (mergedLogs) {
      const logsMesh = new THREE.Mesh(mergedLogs, barkMat);
      logsMesh.castShadow = true;
      logsMesh.receiveShadow = true;
      group.add(logsMesh);
    }

    const mergedMoss = mergeGeometries(mossGeos, false);
    if (mergedMoss) {
      const mossMesh = new THREE.Mesh(mergedMoss, mossMat);
      mossMesh.castShadow = true;
      mossMesh.receiveShadow = true;
      group.add(mossMesh);
    }
  }

  return group;
}
