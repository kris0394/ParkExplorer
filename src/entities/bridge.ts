/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { heightAt } from '../terrain/riverTerrain.ts';
import { getActivePark } from '../data/parks.ts';
import { clamp } from '../utils/noise.ts';

/**
 * Creates the complete 3D Wooden Footbridge crossing the river,
 * with approach ramps connecting flush to dry land on both riverbanks.
 */
export function createBridgeGroup(): THREE.Group {
  const park = getActivePark();
  const b = park.trail.bridge;

  const group = new THREE.Group();
  group.name = 'bridge';

  const woodMat = new THREE.MeshLambertMaterial({
    color: 0x634f3c,
  });

  const railingMat = new THREE.MeshLambertMaterial({
    color: 0x4e3e30,
  });

  const stoneMat = new THREE.MeshLambertMaterial({
    color: 0x5a554e,
  });

  const length = b.eastX - b.westX;
  const centerX = (b.westX + b.eastX) / 2;
  const halfW = b.width / 2;

  // 1. Deck & Ramp Planks
  const plankGeos: THREE.BufferGeometry[] = [];
  const numPlanks = 60;
  const plankStep = length / numPlanks;
  const plankThickness = 0.09;
  const plankDepth = plankStep * 0.88;
  const rampLen = 4.5;

  const getDeckYAt = (px: number) => {
    if (px < b.westX + rampLen) {
      const t = clamp((px - b.westX) / rampLen, 0, 1);
      return 0.95 * (1.0 - t) + b.deckY * t;
    }
    if (px > b.eastX - rampLen) {
      const t = clamp((b.eastX - px) / rampLen, 0, 1);
      return 1.05 * (1.0 - t) + b.deckY * t;
    }
    return b.deckY;
  };

  for (let i = 0; i < numPlanks; i++) {
    const px = b.westX + (i + 0.5) * plankStep;
    const py = getDeckYAt(px);
    const pGeo = new THREE.BoxGeometry(plankDepth, plankThickness, b.width);
    pGeo.translate(px, py - plankThickness / 2, b.centerZ);
    plankGeos.push(pGeo);
  }

  // 2. Longitudinal Stringers (3 main beams running under planks)
  const stringerHeight = 0.22;
  const stringerWidth = 0.22;
  const stringerZOffsets = [-halfW + 0.25, 0, halfW - 0.25];

  for (const sz of stringerZOffsets) {
    const sGeo = new THREE.BoxGeometry(length + 1.2, stringerHeight, stringerWidth);
    sGeo.translate(centerX, b.deckY - plankThickness - stringerHeight / 2, b.centerZ + sz);
    plankGeos.push(sGeo);
  }

  const mergedDeck = mergeGeometries(plankGeos, false);
  if (mergedDeck) {
    const deckMesh = new THREE.Mesh(mergedDeck, woodMat);
    deckMesh.castShadow = true;
    deckMesh.receiveShadow = true;
    group.add(deckMesh);
  }

  // 3. Timber Pile Columns & Cross-beams in the river channel
  const pileGeos: THREE.BufferGeometry[] = [];
  const pierXs = [24.0, 29.0, 34.0];

  for (const pierX of pierXs) {
    for (const sz of [-halfW + 0.3, halfW - 0.3]) {
      const pz = b.centerZ + sz;
      const bedY = heightAt(pierX, pz);
      const pileHeight = (b.deckY - plankThickness) - bedY + 1.5;
      const colGeo = new THREE.CylinderGeometry(0.14, 0.18, pileHeight, 7);
      colGeo.translate(pierX, bedY + pileHeight / 2 - 0.6, pz);
      pileGeos.push(colGeo);
    }

    const crossBeam = new THREE.BoxGeometry(0.24, 0.22, b.width - 0.2);
    crossBeam.translate(pierX, b.deckY - plankThickness - 0.24, b.centerZ);
    pileGeos.push(crossBeam);
  }

  // 4. Stone Abutments embedded in dry ground
  const abutmentWidth = b.width + 0.9;
  const abutmentHeight = 1.2;
  const abutmentWest = new THREE.BoxGeometry(2.0, abutmentHeight, abutmentWidth);
  abutmentWest.translate(b.westX - 0.6, 0.95 - abutmentHeight / 2, b.centerZ);

  const abutmentEast = new THREE.BoxGeometry(2.0, abutmentHeight, abutmentWidth);
  abutmentEast.translate(b.eastX + 0.6, 1.05 - abutmentHeight / 2, b.centerZ);

  const abutmentsMerged = mergeGeometries([abutmentWest, abutmentEast], false);
  if (abutmentsMerged) {
    const abutmentMesh = new THREE.Mesh(abutmentsMerged, stoneMat);
    abutmentMesh.castShadow = true;
    abutmentMesh.receiveShadow = true;
    group.add(abutmentMesh);
  }

  // 5. Railings & Baluster Posts along the entire span
  const railingGeos: THREE.BufferGeometry[] = [];
  const numPosts = 16;
  const postStep = length / (numPosts - 1);
  const postHeight = 1.08;
  const railRadius = 0.055;

  for (const side of [-1, 1]) {
    const rz = b.centerZ + side * (halfW - 0.08);

    for (let i = 0; i < numPosts; i++) {
      const rx = b.westX + i * postStep;
      const ry = getDeckYAt(rx);
      const postGeo = new THREE.CylinderGeometry(0.065, 0.075, postHeight, 6);
      postGeo.translate(rx, ry + postHeight / 2, rz);
      railingGeos.push(postGeo);
    }

    // Top Handrail
    const topRail = new THREE.CylinderGeometry(railRadius, railRadius, length + 0.2, 6);
    topRail.rotateZ(Math.PI / 2);
    topRail.translate(centerX, b.deckY + postHeight, rz);
    railingGeos.push(topRail);

    // Mid Rail
    const midRail = new THREE.CylinderGeometry(railRadius * 0.75, railRadius * 0.75, length + 0.2, 6);
    midRail.rotateZ(Math.PI / 2);
    midRail.translate(centerX, b.deckY + postHeight * 0.52, rz);
    railingGeos.push(midRail);
  }

  const mergedPiles = mergeGeometries(pileGeos, false);
  if (mergedPiles) {
    const pilesMesh = new THREE.Mesh(mergedPiles, woodMat);
    pilesMesh.castShadow = true;
    pilesMesh.receiveShadow = true;
    group.add(pilesMesh);
  }

  const mergedRailings = mergeGeometries(railingGeos, false);
  if (mergedRailings) {
    const railingMesh = new THREE.Mesh(mergedRailings, railingMat);
    railingMesh.castShadow = true;
    railingMesh.receiveShadow = true;
    group.add(railingMesh);
  }

  // 6. Trail Sign at the West Entrance (on dry land)
  const signGroup = createBridgeTrailSign(b.name);
  signGroup.position.set(b.westX - 1.2, 0.95, b.centerZ + halfW + 0.7);
  group.add(signGroup);

  return group;
}

function createBridgeTrailSign(bridgeName: string): THREE.Group {
  const g = new THREE.Group();

  const postGeo = new THREE.CylinderGeometry(0.06, 0.07, 1.6, 6);
  const woodMat = new THREE.MeshLambertMaterial({ color: 0x4a3625 });
  const post = new THREE.Mesh(postGeo, woodMat);
  post.position.set(0, 0.8, 0);
  post.castShadow = true;
  g.add(post);

  const boardGeo = new THREE.BoxGeometry(0.85, 0.35, 0.06);
  const board = new THREE.Mesh(boardGeo, woodMat);
  board.position.set(0, 1.45, 0);
  board.rotation.y = -Math.PI / 8;
  board.castShadow = true;
  g.add(board);

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 106;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#6e5138';
  ctx.fillRect(0, 0, 256, 106);
  ctx.strokeStyle = '#d7c7aa';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 244, 94);
  ctx.fillStyle = '#f6edd9';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('FOOTBRIDGE', 128, 42);
  ctx.font = '13px Georgia, serif';
  ctx.fillText(bridgeName.length > 20 ? bridgeName.substring(0, 18) + '...' : bridgeName, 128, 74);

  const texture = new THREE.CanvasTexture(canvas);
  const plateGeo = new THREE.PlaneGeometry(0.82, 0.32);
  const plateMat = new THREE.MeshLambertMaterial({ map: texture });
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.position.set(0, 1.45, 0.035);
  plate.rotation.y = -Math.PI / 8;
  g.add(plate);

  return g;
}
