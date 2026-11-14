/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TASK 26: a walk-in cave tour (Wind Cave).
 *
 * The NPS only lets visitors see the inside of Wind Cave on ranger-guided tours, so this is a game version: a rocky mound
 * with a mouth you can walk into. Inside is a dark winding passage with boxwork (the cave's signature thin honeycomb fins of
 * calcite), popcorn and frostwork, small lamps, and a chamber at the end. The inside is "baked" dim lighting (plain
 * colours, no real lights), so it costs almost nothing to draw. Passage walls and the mound are solid (obstacles).
 *
 * The floor, walls and roof follow the ground height, so the player simply walks on the normal terrain.
 */
import * as THREE from 'three';
import { getActivePark } from '../data/parks.ts';
import { heightAt } from '../terrain/riverTerrain.ts';
import { getCaveLayout, type PathNode } from '../data/parkStructure.ts';
import { registerObstacle } from './rocks.ts';
import { mulberry32 } from '../utils/noise.ts';

interface Sample { x: number; z: number; tx: number; tz: number; nx: number; nz: number; y: number; s: number }

export function buildCaveTour(group: THREE.Group): void {
  const park = getActivePark();
  const cfg = park.features?.caveTour;
  if (!cfg) return;
  const L = getCaveLayout(cfg);
  const HW = L.halfWidth;
  const ROOF = L.roof;
  const rand = mulberry32(5150);
  const root = new THREE.Group();
  root.name = 'cave-tour';

  // --- centre line samples, one metre apart ---
  const curve = new THREE.CatmullRomCurve3(L.nodes.map(n => new THREE.Vector3(n.x, 0, n.z)), false, 'centripetal', 0.5);
  const total = curve.getLength();
  const count = Math.max(8, Math.round(total));
  const samples: Sample[] = [];
  for (let i = 0; i <= count; i++) {
    const u = i / count;
    const p = curve.getPointAt(u);
    const t = curve.getTangentAt(u);
    const len = Math.hypot(t.x, t.z) || 1;
    const tx = t.x / len;
    const tz = t.z / len;
    samples.push({ x: p.x, z: p.z, tx, tz, nx: -tz, nz: tx, y: heightAt(p.x, p.z), s: u * total });
  }

  // --- baked lighting: lamps along the passage and in the chamber ---
  const lamps: PathNode[] = [];
  for (let s = 4; s < total; s += 9) {
    const smp = samples[Math.min(samples.length - 1, Math.round(s))];
    lamps.push({ x: smp.x - smp.nx * (HW - 0.15), z: smp.z - smp.nz * (HW - 0.15) });
  }
  const C = L.chamber;
  lamps.push({ x: C.x, z: C.z });
  for (let k = 0; k < 4; k++) lamps.push({ x: C.x + Math.cos(k * 1.57 + 0.4) * (C.radius - 1.2), z: C.z + Math.sin(k * 1.57 + 0.4) * (C.radius - 1.2) });
  const light = (x: number, z: number): number => {
    let best = 0;
    for (const l of lamps) {
      const d = Math.hypot(x - l.x, z - l.z);
      best = Math.max(best, Math.pow(Math.max(0, 1 - d / 8.0), 1.3));
    }
    return 0.26 + 0.74 * best;
  };

  const interiorMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });

  // Builds a strip of quads between two rows of points, with a colour per point.
  const strip = (rowA: THREE.Vector3[], rowB: THREE.Vector3[], colA: THREE.Color[], colB: THREE.Color[]): THREE.Mesh => {
    const pos: number[] = [];
    const col: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i < rowA.length; i++) {
      pos.push(rowA[i].x, rowA[i].y, rowA[i].z, rowB[i].x, rowB[i].y, rowB[i].z);
      col.push(colA[i].r, colA[i].g, colA[i].b, colB[i].r, colB[i].g, colB[i].b);
      if (i > 0) {
        const a = (i - 1) * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    return new THREE.Mesh(geo, interiorMat);
  };
  const shade = (hex: number, k: number): THREE.Color => new THREE.Color(hex).multiplyScalar(k);

  const FLOOR_LIFT = 0.12; // cover the small difference between the ground mesh and the exact height
  const leftFloor: THREE.Vector3[] = [], rightFloor: THREE.Vector3[] = [];
  const leftTop: THREE.Vector3[] = [], rightTop: THREE.Vector3[] = [];
  const cLeftFloor: THREE.Color[] = [], cRightFloor: THREE.Color[] = [];
  const cLeftWall: THREE.Color[] = [], cRightWall: THREE.Color[] = [], cRoof: THREE.Color[] = [], cTopL: THREE.Color[] = [], cTopR: THREE.Color[] = [];
  for (const sm of samples) {
    const lx = sm.x - sm.nx * HW, lz = sm.z - sm.nz * HW;
    const rx = sm.x + sm.nx * HW, rz = sm.z + sm.nz * HW;
    const yl = heightAt(lx, lz) + FLOOR_LIFT;
    const yr = heightAt(rx, rz) + FLOOR_LIFT;
    const yc = sm.y + FLOOR_LIFT;
    const roofY = Math.max(yl, yr, yc) + ROOF;
    leftFloor.push(new THREE.Vector3(lx, yl, lz));
    rightFloor.push(new THREE.Vector3(rx, yr, rz));
    leftTop.push(new THREE.Vector3(lx, roofY, lz));
    rightTop.push(new THREE.Vector3(rx, roofY, rz));
    const b = light(sm.x, sm.z);
    const n = 0.85 + rand() * 0.3;
    cLeftFloor.push(shade(0x6b5f50, b * n));
    cRightFloor.push(shade(0x6b5f50, b * n));
    cLeftWall.push(shade(0x9a8466, b * (0.8 + rand() * 0.4)));
    cRightWall.push(shade(0x9a8466, b * (0.8 + rand() * 0.4)));
    cTopL.push(shade(0x5a4a3a, b * 0.8));
    cTopR.push(shade(0x5a4a3a, b * 0.8));
    cRoof.push(shade(0x4f4337, b * 0.7));
  }
  // floor, two walls (floor edge up to the roof line) and the roof
  root.add(strip(leftFloor, rightFloor, cLeftFloor, cRightFloor));
  root.add(strip(leftFloor, leftTop, cLeftFloor, cTopL));
  root.add(strip(rightFloor, rightTop, cRightFloor, cTopR));
  root.add(strip(leftTop, rightTop, cTopL, cTopR));

  // --- the chamber at the end ---
  const chamberFloorY = (() => {
    let m = -1e9;
    for (let a = 0; a < 16; a++) for (const rr of [0, C.radius * 0.5, C.radius]) m = Math.max(m, heightAt(C.x + Math.cos(a * 0.3927) * rr, C.z + Math.sin(a * 0.3927) * rr));
    return m + FLOOR_LIFT;
  })();
  const CH = 3.8;
  const colorize = (geo: THREE.BufferGeometry, base: number, kBase: number): void => {
    const p = geo.attributes.position;
    const c: number[] = [];
    for (let i = 0; i < p.count; i++) {
      const col = shade(base, kBase * light(C.x + p.getX(i), C.z + p.getZ(i)) * (0.85 + rand() * 0.3));
      c.push(col.r, col.g, col.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
  };
  const floorGeo = new THREE.CircleGeometry(C.radius + 0.4, 28);
  floorGeo.rotateX(-Math.PI / 2);
  colorize(floorGeo, 0x6b5f50, 1);
  const floorMesh = new THREE.Mesh(floorGeo, interiorMat);
  floorMesh.position.set(C.x, chamberFloorY, C.z);
  const roofGeo = new THREE.CircleGeometry(C.radius + 0.4, 28);
  roofGeo.rotateX(Math.PI / 2);
  colorize(roofGeo, 0x4f4337, 0.7);
  const roofMesh = new THREE.Mesh(roofGeo, interiorMat);
  roofMesh.position.set(C.x, chamberFloorY + CH, C.z);
  // wall with a gap where the passage comes in
  const last = L.nodes[L.nodes.length - 1];
  const theta0 = Math.atan2(last.x - C.x, last.z - C.z);
  const gapHalf = Math.atan2(HW + 0.15, C.radius);
  const wallGeo = new THREE.CylinderGeometry(C.radius, C.radius, CH, 30, 1, true, theta0 + gapHalf, Math.PI * 2 - 2 * gapHalf);
  colorize(wallGeo, 0x9a8466, 1);
  const wallMesh = new THREE.Mesh(wallGeo, interiorMat);
  wallMesh.position.set(C.x, chamberFloorY + CH / 2, C.z);
  root.add(floorMesh, roofMesh, wallMesh);

  // --- formations: boxwork fins, popcorn and frostwork ---
  const finCells: { x: number; y: number; z: number; ang: number; w: number; h: number; d: number; b: number }[] = [];
  const addPanel = (x: number, groundY: number, z: number, tx: number, tz: number, nx: number, nz: number, b: number): void => {
    const ang = Math.atan2(-tz, tx);
    for (let row = 0; row < 5; row++) {
      const y = groundY + 0.35 + row * 0.55;
      if (rand() < 0.78) finCells.push({ x: x + nx * 0.1, y, z: z + nz * 0.1, ang, w: 0.55, h: 0.045, d: 0.12 + rand() * 0.18, b: b * (0.8 + rand() * 0.4) });
      if (rand() < 0.78) finCells.push({ x: x + nx * 0.1, y: y + 0.27, z: z + nz * 0.1, ang, w: 0.045, h: 0.55, d: 0.12 + rand() * 0.18, b: b * (0.8 + rand() * 0.4) });
    }
  };
  for (let i = 3; i < samples.length - 1; i++) {
    const sm = samples[i];
    for (const side of [-1, 1]) {
      const wx = sm.x + sm.nx * HW * side;
      const wz = sm.z + sm.nz * HW * side;
      // fins stick out of the wall toward the passage
      addPanel(wx, heightAt(wx, wz) + FLOOR_LIFT, wz, sm.tx, sm.tz, -sm.nx * side, -sm.nz * side, light(wx, wz));
    }
  }
  for (let a = theta0 + gapHalf + 0.1; a < theta0 + Math.PI * 2 - gapHalf - 0.1; a += 0.55 / C.radius) {
    const wx = C.x + Math.sin(a) * (C.radius - 0.05);
    const wz = C.z + Math.cos(a) * (C.radius - 0.05);
    // tangent around the circle, normal pointing in to the centre
    addPanel(wx, chamberFloorY, wz, Math.cos(a), -Math.sin(a), -Math.sin(a), -Math.cos(a), light(wx, wz));
  }
  const fins = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial(), finCells.length);
  const dummy = new THREE.Object3D();
  finCells.forEach((f, i) => {
    dummy.position.set(f.x, f.y, f.z);
    dummy.rotation.set(0, f.ang, 0);
    dummy.scale.set(f.w, f.h, f.d);
    dummy.updateMatrix();
    fins.setMatrixAt(i, dummy.matrix);
    fins.setColorAt(i, shade(0xc79a5e, f.b));
  });
  fins.instanceMatrix.needsUpdate = true;
  if (fins.instanceColor) fins.instanceColor.needsUpdate = true;
  root.add(fins);

  // popcorn (small round lumps low on the walls) and frostwork (pale needle clusters in the chamber and passage)
  const lumps: { x: number; y: number; z: number; r: number; b: number }[] = [];
  const needles: { x: number; y: number; z: number; s: number; b: number }[] = [];
  for (let i = 4; i < samples.length - 1; i += 1) {
    const sm = samples[i];
    for (const side of [-1, 1]) {
      if (rand() < 0.5) {
        const wx = sm.x + sm.nx * (HW - 0.08) * side, wz = sm.z + sm.nz * (HW - 0.08) * side;
        lumps.push({ x: wx, y: heightAt(wx, wz) + 0.2 + rand() * 0.5, z: wz, r: 0.05 + rand() * 0.07, b: light(wx, wz) });
      }
      if (rand() < 0.12) {
        const wx = sm.x + sm.nx * (HW - 0.12) * side, wz = sm.z + sm.nz * (HW - 0.12) * side;
        needles.push({ x: wx, y: heightAt(wx, wz) + 1.3 + rand() * 1.0, z: wz, s: 0.5 + rand() * 0.6, b: light(wx, wz) });
      }
    }
  }
  for (let k = 0; k < 220; k++) {
    const a = theta0 + gapHalf + 0.2 + rand() * (Math.PI * 2 - 2 * gapHalf - 0.4);
    const wx = C.x + Math.sin(a) * (C.radius - 0.2);
    const wz = C.z + Math.cos(a) * (C.radius - 0.2);
    // a "frostwork ledge" at about shoulder height all round the chamber
    needles.push({ x: wx, y: chamberFloorY + 0.9 + rand() * 1.1, z: wz, s: 0.5 + rand() * 0.9, b: light(wx, wz) });
  }
  const popcorn = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 5), new THREE.MeshBasicMaterial(), lumps.length);
  lumps.forEach((l, i) => {
    dummy.position.set(l.x, l.y, l.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(l.r, l.r, l.r);
    dummy.updateMatrix();
    popcorn.setMatrixAt(i, dummy.matrix);
    popcorn.setColorAt(i, shade(0xd9c6a4, l.b * (0.9 + rand() * 0.2)));
  });
  const frost = new THREE.InstancedMesh(new THREE.ConeGeometry(0.05, 0.3, 5), new THREE.MeshBasicMaterial(), needles.length);
  needles.forEach((n, i) => {
    dummy.position.set(n.x, n.y, n.z);
    dummy.rotation.set((rand() - 0.5) * 1.6, rand() * 6.28, (rand() - 0.5) * 1.6);
    dummy.scale.set(n.s, n.s, n.s);
    dummy.updateMatrix();
    frost.setMatrixAt(i, dummy.matrix);
    frost.setColorAt(i, shade(0xf4f6f8, n.b * (0.9 + rand() * 0.2)));
  });
  for (const m of [popcorn, frost]) {
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    root.add(m);
  }

  // lamps: small glowing bulbs on the left wall
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe3a8 }), lamps.length);
  lamps.forEach((l, i) => {
    const high = i < lamps.length - 5 ? 2.2 : 3.3;
    const gy = i < lamps.length - 5 ? heightAt(l.x, l.z) : chamberFloorY;
    dummy.position.set(l.x, gy + high, l.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    bulbs.setMatrixAt(i, dummy.matrix);
  });
  bulbs.instanceMatrix.needsUpdate = true;
  root.add(bulbs);

  // --- the outside: a grassy limestone mound over the passage, with a timber portal at the mouth ---
  const moundMat = new THREE.MeshLambertMaterial({ flatShading: true });
  const spheres: { x: number; z: number; r: number; ry: number }[] = [];
  for (let s = 5.5; s < total - 3; s += 5.0) {
    const smp = samples[Math.min(samples.length - 1, Math.round(s))];
    spheres.push({ x: smp.x, z: smp.z, r: 5.4, ry: 3.4 });
  }
  spheres.push({ x: C.x, z: C.z, r: C.radius + 3.2, ry: 8.0 });
  const mound = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 9), moundMat, spheres.length);
  const earth = [0x8f8a76, 0x9a9480, 0x86876a, 0x8d8f6b];
  spheres.forEach((sp, i) => {
    const y = heightAt(sp.x, sp.z);
    dummy.position.set(sp.x, y + 0.2, sp.z);
    dummy.rotation.set(0, rand() * 6.28, 0);
    dummy.scale.set(sp.r, sp.ry, sp.r);
    dummy.updateMatrix();
    mound.setMatrixAt(i, dummy.matrix);
    mound.setColorAt(i, new THREE.Color(earth[i % earth.length]));
  });
  mound.instanceMatrix.needsUpdate = true;
  if (mound.instanceColor) mound.instanceColor.needsUpdate = true;
  mound.castShadow = true;
  mound.receiveShadow = true;
  root.add(mound);

  // timber portal (two posts and a lintel) and a sign board at the mouth
  const wood = new THREE.MeshLambertMaterial({ color: 0x6b4a30, flatShading: true });
  const m0 = samples[0];
  const mouthY = heightAt(m0.x, m0.z);
  const portalAng = Math.atan2(-m0.tz, m0.tx);
  const portal = new THREE.Group();
  portal.position.set(m0.x, mouthY, m0.z);
  portal.rotation.y = portalAng;
  const postA = new THREE.Mesh(new THREE.BoxGeometry(0.28, ROOF + 0.35, 0.28), wood);
  postA.position.set(-HW - 0.15, (ROOF + 0.35) / 2, 0.4);
  const postB = postA.clone();
  postB.position.x = HW + 0.15;
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(HW * 2 + 0.9, 0.3, 0.32), wood);
  lintel.position.set(0, ROOF + 0.45, 0.4);
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 0.06), new THREE.MeshLambertMaterial({ color: 0x4a3322 }));
  board.position.set(0, ROOF + 0.95, 0.45);
  const mouthLamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe3a8 }));
  mouthLamp.position.set(HW - 0.1, ROOF - 0.4, 0.4);
  portal.add(postA, postB, lintel, board, mouthLamp);
  portal.traverse(o => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; } });
  root.add(portal);
  group.add(root);

  // --- solid walls and mound (circles), leaving the passage open ---
  const addWallCircles = (): void => {
    const cDist = (x: number, z: number): number => Math.hypot(x - C.x, z - C.z);
    for (let i = 0; i < samples.length; i++) {
      const sm = samples[i];
      for (const side of [-1, 1]) {
        const wx = sm.x + sm.nx * (HW + 0.6) * side;
        const wz = sm.z + sm.nz * (HW + 0.6) * side;
        if (cDist(wx, wz) < C.radius + 0.25) continue;
        registerObstacle(wx, wz, 0.6);
        if (i % 2 === 0) {
          const ox = sm.x + sm.nx * (HW + 2.0) * side;
          const oz = sm.z + sm.nz * (HW + 2.0) * side;
          if (cDist(ox, oz) >= C.radius + 2.0) registerObstacle(ox, oz, 1.3);
        }
      }
    }
    // the chamber ring, leaving a gap for the passage
    const step = 0.6 / (C.radius + 0.6);
    for (let a = 0; a < Math.PI * 2; a += step) {
      let da = Math.abs(((a - theta0 + Math.PI) % (Math.PI * 2)) - Math.PI);
      if (da > Math.PI) da = Math.PI * 2 - da;
      if (da < gapHalf + 0.12) continue;
      registerObstacle(C.x + Math.sin(a) * (C.radius + 0.6), C.z + Math.cos(a) * (C.radius + 0.6), 0.6);
      if (Math.round(a / step) % 3 === 0) registerObstacle(C.x + Math.sin(a) * (C.radius + 2.0), C.z + Math.cos(a) * (C.radius + 2.0), 1.3);
    }
  };
  addWallCircles();
}
