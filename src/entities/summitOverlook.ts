/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { getActivePark } from '../data/parks.ts';

/**
 * Creates the scenic wooden Summit Overlook Platform on the mountain peak,
 * parameterized by the active ParkDefinition.
 */
export function createSummitOverlookGroup(): THREE.Group {
  const park = getActivePark();
  const mtn = park.terrain.mountain;
  const o = park.overlook;

  const group = new THREE.Group();
  group.name = 'summitOverlook';
  group.position.set(mtn.x, mtn.height, mtn.z);

  const woodDeckMat = new THREE.MeshLambertMaterial({
    color: 0x5b4735,
  });

  const railingMat = new THREE.MeshLambertMaterial({
    color: 0x48382b,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc49b45,
    metalness: 0.85,
    roughness: 0.35,
  });

  // 1. Deck Planks
  const deckRadius = o.deckRadius;
  const deckThickness = 0.12;
  const deckGeos: THREE.BufferGeometry[] = [];
  const plankCount = 28;
  const plankWidth = (deckRadius * 2) / plankCount;

  for (let i = 0; i < plankCount; i++) {
    const pz = -deckRadius + (i + 0.5) * plankWidth;
    const halfChord = Math.sqrt(Math.max(0, deckRadius * deckRadius - pz * pz));
    if (halfChord < 0.4) continue;

    const pGeo = new THREE.BoxGeometry(halfChord * 2, deckThickness, plankWidth * 0.92);
    pGeo.translate(0, deckThickness / 2, pz);
    deckGeos.push(pGeo);
  }

  const mergedDeck = mergeGeometries(deckGeos, false);
  if (mergedDeck) {
    const deckMesh = new THREE.Mesh(mergedDeck, woodDeckMat);
    deckMesh.castShadow = true;
    deckMesh.receiveShadow = true;
    group.add(deckMesh);
  }

  // 2. Perimeter Railings and Baluster Posts
  const railingGeos: THREE.BufferGeometry[] = [];
  const numPosts = 14;
  const postHeight = 1.05;
  const entranceIndexStart = 8;

  const postPositions: THREE.Vector3[] = [];

  for (let i = 0; i < numPosts; i++) {
    const angle = (i / numPosts) * Math.PI * 2;
    const px = Math.cos(angle) * (deckRadius - 0.2);
    const pz = Math.sin(angle) * (deckRadius - 0.2);
    postPositions.push(new THREE.Vector3(px, deckThickness + postHeight / 2, pz));

    if (i === entranceIndexStart) continue;

    const postGeo = new THREE.CylinderGeometry(0.065, 0.08, postHeight, 6);
    postGeo.translate(px, deckThickness + postHeight / 2, pz);
    railingGeos.push(postGeo);
  }

  for (let i = 0; i < numPosts; i++) {
    const next = (i + 1) % numPosts;
    if (i === entranceIndexStart - 1 || i === entranceIndexStart) {
      continue;
    }

    const p1 = postPositions[i];
    const p2 = postPositions[next];
    const midX = (p1.x + p2.x) / 2;
    const midZ = (p1.z + p2.z) / 2;
    const span = Math.hypot(p2.x - p1.x, p2.z - p1.z);
    const angleY = Math.atan2(p2.z - p1.z, p2.x - p1.x);

    const topRail = new THREE.CylinderGeometry(0.05, 0.05, span, 6);
    topRail.rotateZ(Math.PI / 2);
    topRail.rotateY(-angleY);
    topRail.translate(midX, deckThickness + postHeight, midZ);
    railingGeos.push(topRail);

    const midRail = new THREE.CylinderGeometry(0.038, 0.038, span, 6);
    midRail.rotateZ(Math.PI / 2);
    midRail.rotateY(-angleY);
    midRail.translate(midX, deckThickness + postHeight * 0.52, midZ);
    railingGeos.push(midRail);
  }

  const mergedRailings = mergeGeometries(railingGeos, false);
  if (mergedRailings) {
    const railingMesh = new THREE.Mesh(mergedRailings, railingMat);
    railingMesh.castShadow = true;
    railingMesh.receiveShadow = true;
    group.add(railingMesh);
  }

  // 3. Rustic Summit Viewing Bench
  if (o.hasBench) {
    const bench = createScenicBench();
    bench.position.set(0.6, deckThickness, -2.4);
    bench.rotation.y = -Math.PI / 3.8;
    group.add(bench);
  }

  // 4. Brass Observation Telescope
  if (o.hasTelescope) {
    const telescope = createObservationTelescope(brassMat);
    telescope.position.set(-2.2, deckThickness, 1.8);
    telescope.rotation.y = Math.PI / 3;
    group.add(telescope);
  }

  // 5. Summit Trail Plaque & Signpost
  const sign = createSummitSign(o.signHeading, o.signSubheading, o.elevationLabel);
  sign.position.set(-2.2, deckThickness, -1.8);
  sign.rotation.y = Math.PI / 5;
  group.add(sign);

  return group;
}

function createScenicBench(): THREE.Group {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshLambertMaterial({ color: 0x5a432f });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x2d2b28, roughness: 0.6, metalness: 0.8 });

  const leg1 = new THREE.BoxGeometry(0.08, 0.5, 0.6);
  leg1.translate(-0.85, 0.25, 0);
  const leg2 = new THREE.BoxGeometry(0.08, 0.5, 0.6);
  leg2.translate(0.85, 0.25, 0);
  const mergedLegs = mergeGeometries([leg1, leg2], false);
  if (mergedLegs) {
    const legsMesh = new THREE.Mesh(mergedLegs, ironMat);
    legsMesh.castShadow = true;
    g.add(legsMesh);
  }

  const slatGeos: THREE.BufferGeometry[] = [];
  for (let s = -0.22; s <= 0.22; s += 0.11) {
    const slat = new THREE.BoxGeometry(1.9, 0.04, 0.085);
    slat.translate(0, 0.48, s);
    slatGeos.push(slat);
  }

  for (let b = 0.62; b <= 0.88; b += 0.12) {
    const bSlat = new THREE.BoxGeometry(1.9, 0.085, 0.035);
    bSlat.translate(0, b, -0.26);
    slatGeos.push(bSlat);
  }

  const mergedSlats = mergeGeometries(slatGeos, false);
  if (mergedSlats) {
    const slatsMesh = new THREE.Mesh(mergedSlats, woodMat);
    slatsMesh.castShadow = true;
    g.add(slatsMesh);
  }

  return g;
}

/**
 * Creates the National Park Observation Viewfinder Telescope.
 * Constructed with pure child meshes to guarantee 100% geometry safety with zero null risks.
 */
function createObservationTelescope(brassMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  g.name = 'observationTelescope';

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x2e3033,
    roughness: 0.55,
    metalness: 0.8,
  });

  // 1. Bolted Base Flange on deck floor (Y: 0.0 -> 0.08)
  const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.08, 12), ironMat);
  baseMesh.position.set(0, 0.04, 0);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  g.add(baseMesh);

  // 2. Pedestal Column (Y: 0.08 -> 1.12)
  const colBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 0.22, 10), ironMat);
  colBase.position.set(0, 0.19, 0);
  colBase.castShadow = true;
  g.add(colBase);

  const mainCol = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 0.76, 10), ironMat);
  mainCol.position.set(0, 0.68, 0);
  mainCol.castShadow = true;
  g.add(mainCol);

  const colCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.12, 10), ironMat);
  colCrown.position.set(0, 1.12, 0);
  colCrown.castShadow = true;
  g.add(colCrown);

  // 3. Azimuth Turntable Ring (Y: 1.18 -> 1.28)
  const turntable = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 10), ironMat);
  turntable.position.set(0, 1.23, 0);
  turntable.castShadow = true;
  g.add(turntable);

  // 4. Dual Fork Yoke Arms (Y: 1.28 -> 1.54)
  const yokeBase = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.14), ironMat);
  yokeBase.position.set(0, 1.32, 0);
  yokeBase.castShadow = true;
  g.add(yokeBase);

  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.26, 0.1), ironMat);
  leftArm.position.set(-0.16, 1.45, 0);
  leftArm.castShadow = true;
  g.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.26, 0.1), ironMat);
  rightArm.position.set(0.16, 1.45, 0);
  rightArm.castShadow = true;
  g.add(rightArm);

  const trunnion = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.42, 8), ironMat);
  trunnion.rotation.z = Math.PI / 2;
  trunnion.position.set(0, 1.54, 0);
  trunnion.castShadow = true;
  g.add(trunnion);

  // 5. Optical Telescope Barrel (Pivoted slightly downward to view the valley floor)
  const barrelGroup = new THREE.Group();
  barrelGroup.position.set(0, 1.54, 0);
  barrelGroup.rotation.x = 0.08;

  // Central pivot housing
  const pivotHub = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 10), brassMat);
  pivotHub.rotation.z = Math.PI / 2;
  pivotHub.castShadow = true;
  barrelGroup.add(pivotHub);

  // Main optical tube (forward)
  const forwardTube = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.07, 0.65, 12), brassMat);
  forwardTube.rotation.x = Math.PI / 2;
  forwardTube.position.set(0, 0, 0.36);
  forwardTube.castShadow = true;
  barrelGroup.add(forwardTube);

  // Objective lens dew shield / hood
  const objectiveHood = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.085, 0.22, 12), brassMat);
  objectiveHood.rotation.x = Math.PI / 2;
  objectiveHood.position.set(0, 0, 0.76);
  objectiveHood.castShadow = true;
  barrelGroup.add(objectiveHood);

  // Objective glass lens
  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.095, 0.02, 12),
    new THREE.MeshStandardMaterial({ color: 0x112233, roughness: 0.1, metalness: 0.9 })
  );
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 0, 0.82);
  barrelGroup.add(lens);

  // Rear focusing tube & eyepiece housing
  const rearTube = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.35, 10), brassMat);
  rearTube.rotation.x = Math.PI / 2;
  rearTube.position.set(0, 0, -0.22);
  rearTube.castShadow = true;
  barrelGroup.add(rearTube);

  // Rubber eyecups
  const eyecupMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
  const leftEyecup = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.032, 0.05, 8), eyecupMat);
  leftEyecup.rotation.x = Math.PI / 2;
  leftEyecup.position.set(-0.045, 0, -0.45);
  leftEyecup.castShadow = true;
  barrelGroup.add(leftEyecup);

  const rightEyecup = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.032, 0.05, 8), eyecupMat);
  rightEyecup.rotation.x = Math.PI / 2;
  rightEyecup.position.set(0.045, 0, -0.45);
  rightEyecup.castShadow = true;
  barrelGroup.add(rightEyecup);

  g.add(barrelGroup);

  // 6. Stepping platform for viewers
  const stepMat = new THREE.MeshLambertMaterial({ color: 0x483828 });
  const stepMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.16, 8), stepMat);
  stepMesh.position.set(0, 0.08, -0.46);
  stepMesh.receiveShadow = true;
  g.add(stepMesh);

  return g;
}

function createSummitSign(heading: string, subheading: string, elevationText: string): THREE.Group {
  const g = new THREE.Group();

  const postGeo = new THREE.CylinderGeometry(0.07, 0.08, 1.7, 6);
  const woodMat = new THREE.MeshLambertMaterial({ color: 0x4a3625 });
  const post = new THREE.Mesh(postGeo, woodMat);
  post.position.set(0, 0.85, 0);
  post.castShadow = true;
  g.add(post);

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#5c432d';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#e2d3b8';
  ctx.lineWidth = 5;
  ctx.strokeRect(6, 6, 244, 116);
  ctx.fillStyle = '#f7eedb';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(heading, 128, 44);
  ctx.font = '15px Georgia, serif';
  ctx.fillText(subheading, 128, 74);
  ctx.font = 'italic 13px Georgia, serif';
  ctx.fillText(elevationText, 128, 104);

  const tex = new THREE.CanvasTexture(canvas);
  const boardGeo = new THREE.BoxGeometry(1.0, 0.5, 0.07);
  const board = new THREE.Mesh(boardGeo, woodMat);
  board.position.set(0, 1.48, 0);
  board.castShadow = true;
  g.add(board);

  const plateGeo = new THREE.PlaneGeometry(0.96, 0.46);
  const plateMat = new THREE.MeshLambertMaterial({ map: tex });
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.position.set(0, 1.48, 0.038);
  g.add(plate);

  return g;
}
