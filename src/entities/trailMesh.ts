/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { heightAt } from '../terrain/riverTerrain.ts';
import { Vec2D } from '../types/nature.ts';
import { getActivePark } from '../data/parks.ts';

let sampledTrailPoints: Vec2D[] = [];

function sampleSplinePoints(nodes: Vec2D[], stepsPerSegment = 12): Vec2D[] {
  const points: Vec2D[] = [];
  const curve = new THREE.CatmullRomCurve3(
    nodes.map(n => new THREE.Vector3(n.x, 0, n.z)),
    false,
    'centripetal',
    0.5
  );

  const totalSamples = (nodes.length - 1) * stepsPerSegment;
  for (let i = 0; i <= totalSamples; i++) {
    const t = i / totalSamples;
    const pt = curve.getPoint(t);
    points.push({ x: pt.x, z: pt.z });
  }
  return points;
}

export function initializeTrailPoints(): void {
  const park = getActivePark();
  const westPts = sampleSplinePoints(park.trail.westNodes, 14);
  const eastPts = sampleSplinePoints(park.trail.eastNodes, 16);
  sampledTrailPoints = [...westPts, ...eastPts];
}

/**
 * Fast distance query from any point (x, z) to the nearest trail center.
 */
export function getDistanceToTrail(x: number, z: number): number {
  if (sampledTrailPoints.length === 0) {
    initializeTrailPoints();
  }

  let minDistSq = Infinity;
  for (let i = 0; i < sampledTrailPoints.length; i++) {
    const dx = x - sampledTrailPoints[i].x;
    const dz = z - sampledTrailPoints[i].z;
    const dSq = dx * dx + dz * dz;
    if (dSq < minDistSq) {
      minDistSq = dSq;
    }
  }
  return Math.sqrt(minDistSq);
}

/**
 * Builds a draped polygonal ribbon mesh for a set of trail nodes.
 */
function createRibbonGeometry(nodes: Vec2D[], stepsPerSegment = 16, trailWidth = 2.4): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(
    nodes.map(n => new THREE.Vector3(n.x, 0, n.z)),
    false,
    'centripetal',
    0.5
  );

  const sampleCount = (nodes.length - 1) * stepsPerSegment;
  // 5 vertices across the ribbon for soft blended edges
  const lateralStops = [-0.5, -0.28, 0.0, 0.28, 0.5];
  const numAcross = lateralStops.length;

  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const cCenter = new THREE.Color(0x8a7153); // packed gravel/dirt
  const cMid = new THREE.Color(0x766649);    // worn loam
  const cEdge = new THREE.Color(0x566042);   // mossy transition into grass

  for (let s = 0; s <= sampleCount; s++) {
    const t = s / sampleCount;
    const pt = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    for (let c = 0; c < numAcross; c++) {
      const stop = lateralStops[c];
      const offset = normal.clone().multiplyScalar(stop * trailWidth);
      const vx = pt.x + offset.x;
      const vz = pt.z + offset.z;
      const vy = heightAt(vx, vz) + 0.035;

      positions.push(vx, vy, vz);

      const distFromCenter = Math.abs(stop) * 2.0;
      let col = cCenter.clone();
      if (distFromCenter < 0.56) {
        col.lerp(cMid, distFromCenter / 0.56);
      } else {
        col.copy(cMid).lerp(cEdge, (distFromCenter - 0.56) / 0.44);
      }
      colors.push(col.r, col.g, col.b);
    }
  }

  for (let s = 0; s < sampleCount; s++) {
    for (let c = 0; c < numAcross - 1; c++) {
      const p1 = s * numAcross + c;
      const p2 = (s + 1) * numAcross + c;
      const p3 = (s + 1) * numAcross + (c + 1);
      const p4 = s * numAcross + (c + 1);

      indices.push(p1, p2, p4);
      indices.push(p2, p3, p4);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates the complete Trail system meshes from the active ParkDefinition.
 */
export function createTrailMeshGroup(): THREE.Group {
  initializeTrailPoints();
  const park = getActivePark();

  const group = new THREE.Group();
  group.name = 'trailGroup';

  const material = new THREE.MeshLambertMaterial({
    vertexColors: true,
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -2.0,
  });

  const westGeo = createRibbonGeometry(park.trail.westNodes, 14, park.trail.width);
  const westMesh = new THREE.Mesh(westGeo, material);
  westMesh.receiveShadow = true;
  group.add(westMesh);

  const eastGeo = createRibbonGeometry(park.trail.eastNodes, 16, park.trail.width);
  const eastMesh = new THREE.Mesh(eastGeo, material);
  eastMesh.receiveShadow = true;
  group.add(eastMesh);

  return group;
}
