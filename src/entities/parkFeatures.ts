/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TASK 19: park-specific scenery, built from park.features (roads, parked cars, stone walls,
 * boulder fields, a summit wall and distant ridgelines). A park with no features gets an empty group.
 */
import * as THREE from 'three';
import { getActivePark } from '../data/parks.ts';
import { heightAt, getRiverDistance } from '../terrain/riverTerrain.ts';
import { getRoadPaths, type RoadPath } from '../terrain/roadTerrain.ts';
import { getDistanceToTrail } from './trailMesh.ts';
import { registerObstacle } from './rocks.ts';
import { mulberry32 } from '../utils/noise.ts';
import { isNearRoad } from '../terrain/roadTerrain.ts';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const GRAVEL = 0x77735f;
const ASPHALT = 0x3b3d41;
const LOT_ASPHALT = 0x45474b;

function ribbonMesh(rp: RoadPath, o0: number, o1: number, lift: number, color: number, layer: number): THREE.Mesh {
  const positions: number[] = [];
  const indices: number[] = [];
  const pts = rp.pts;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    let tx = b.x - a.x;
    let tz = b.z - a.z;
    const len = Math.hypot(tx, tz) || 1;
    tx /= len;
    tz /= len;
    const nx = -tz;
    const nz = tx;
    for (const o of [o0, o1]) {
      const x = pts[i].x + nx * o;
      const z = pts[i].z + nz * o;
      positions.push(x, heightAt(x, z) + lift, z);
    }
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const k = i * 2;
    indices.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({
    color,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2 - layer,
    polygonOffsetUnits: -4 - layer * 2,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

function buildRoads(group: THREE.Group, rand: () => number): void {
  const wallGeoSource = new THREE.BoxGeometry(1, 1, 1);
  const wallItems: { x: number; y: number; z: number; sx: number; sy: number; sz: number; yaw: number; color: number }[] = [];
  const wallColors = [0x7b7a6e, 0x6c6d62, 0x8a8472, 0x62655c, 0x7d7c70];

  for (const rp of getRoadPaths()) {
    const w = rp.road.width;
    // gravel shoulder, asphalt, then painted lines
    const sf = rp.road.surface;
    group.add(ribbonMesh(rp, -(w / 2 + 0.9), w / 2 + 0.9, 0.04, sf?.shoulder ?? GRAVEL, 0));
    group.add(ribbonMesh(rp, -w / 2, w / 2, 0.06, sf?.paved ?? (rp.road.kind === 'lot' ? LOT_ASPHALT : ASPHALT), 1));
    if (rp.road.kind === 'road' && sf?.lines !== false) {
      group.add(ribbonMesh(rp, 0.1, 0.2, 0.075, 0xd6ad2a, 2));
      group.add(ribbonMesh(rp, -0.2, -0.1, 0.075, 0xd6ad2a, 2));
      group.add(ribbonMesh(rp, w / 2 - 0.45, w / 2 - 0.3, 0.075, 0xdddbd0, 2));
      group.add(ribbonMesh(rp, -(w / 2 - 0.3), -(w / 2 - 0.45), 0.075, 0xdddbd0, 2));
    }

    // Low stone walls along the road edge
    for (const wall of rp.road.walls ?? []) {
      const total = rp.curve.getLength();
      const steps = Math.max(1, Math.floor(((wall.to - wall.from) * total) / 1.0));
      for (let s = 0; s <= steps; s++) {
        const u = wall.from + ((wall.to - wall.from) * s) / steps;
        const p = rp.curve.getPointAt(u);
        const t = rp.curve.getTangentAt(u);
        const nx = -t.z;
        const nz = t.x;
        const off = wall.side * (w / 2 + 1.3);
        const x = p.x + nx * off;
        const z = p.z + nz * off;
        const gy = heightAt(x, z);
        const sy = 0.55 + rand() * 0.3;
        wallItems.push({
          x, y: gy + sy / 2 - 0.08, z,
          sx: 1.0 + rand() * 0.2, sy, sz: 0.55 + rand() * 0.15,
          yaw: Math.atan2(-t.z, t.x) + (rand() - 0.5) * 0.12,
          color: (rp.road.surface?.wallColors ?? wallColors)[Math.floor(rand() * (rp.road.surface?.wallColors ?? wallColors).length)],
        });
        if (s % 2 === 0) registerObstacle(x, z, 0.8);
      }
    }
  }

  if (wallItems.length > 0) {
    const mat = new THREE.MeshLambertMaterial({ vertexColors: false });
    const mesh = new THREE.InstancedMesh(wallGeoSource, mat, wallItems.length);
    const dummy = new THREE.Object3D();
    wallItems.forEach((it, i) => {
      dummy.position.set(it.x, it.y, it.z);
      dummy.rotation.set(0, it.yaw, 0);
      dummy.scale.set(it.sx, it.sy, it.sz);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, new THREE.Color(it.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
}

function buildCars(group: THREE.Group): void {
  const park = getActivePark();
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x1c1d20 });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x4a5a66 });
  for (const car of park.features?.cars ?? []) {
    const g = new THREE.Group();
    const bodyMat = new THREE.MeshLambertMaterial({ color: car.color });
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.75, 1.8), bodyMat);
    body.position.y = 0.72;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.62, 1.62), glassMat);
    cabin.position.set(-0.2, 1.38, 0);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 1.6), bodyMat);
    roof.position.set(-0.2, 1.72, 0);
    g.add(body, cabin, roof);
    for (const wx of [-1.4, 1.4]) {
      for (const wz of [-0.85, 0.85]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 12), darkMat);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(wx, 0.36, wz);
        g.add(wheel);
      }
    }
    g.traverse(o => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    const y = heightAt(car.x, car.z);
    g.position.set(car.x, y, car.z);
    g.rotation.y = car.yaw;
    group.add(g);
    // Cars are solid: two circles along the length
    const ax = Math.cos(car.yaw);
    const az = -Math.sin(car.yaw);
    registerObstacle(car.x + ax * 1.2, car.z + az * 1.2, 1.0);
    registerObstacle(car.x - ax * 1.2, car.z - az * 1.2, 1.0);
  }
}

function buildTalus(group: THREE.Group, rand: () => number): void {
  const park = getActivePark();
  const fields = park.features?.talusFields ?? [];
  if (fields.length === 0) return;
  const mtn = park.terrain.mountain;
  const zones = park.rules.zones;
  const items: { x: number; y: number; z: number; sx: number; sy: number; sz: number; rx: number; ry: number; rz: number; color: number }[] = [];
  const defaultColors = [0x667064, 0x5b665a, 0x73796a, 0x6a7468, 0x808674, 0x58605a];

  for (const f of fields) {
    const colors = f.colors ?? defaultColors;
    const [minSize, maxSize] = f.sizeRange ?? [0.35, 1.6];
    let placed = 0;
    let tries = 0;
    while (placed < f.count && tries < f.count * 12) {
      tries++;
      const a = rand() * Math.PI * 2;
      const inner = f.innerRadius ?? 0;
      const r = Math.sqrt(inner * inner + rand() * (f.radius * f.radius - inner * inner));
      const x = f.x + Math.cos(a) * r;
      const z = f.z + Math.sin(a) * r;
      if (getDistanceToTrail(x, z) < 2.4) continue;
      if (Math.hypot(x - mtn.x, z - mtn.z) < park.overlook.deckRadius + 2.2) continue;
      if (zones.some(zn => zn.kind === 'closed' && Math.hypot(x - zn.x, z - zn.z) < zn.radius + 1)) continue;
      const size = minSize + Math.pow(rand(), 2.2) * (maxSize - minSize);
      const sx = size * (f.round ? 0.9 + rand() * 0.3 : 0.8 + rand() * 0.9);
      const sz = size * (f.round ? 0.9 + rand() * 0.3 : 0.8 + rand() * 0.9);
      const sy = size * (f.round ? 0.6 + rand() * 0.3 : 0.45 + rand() * 0.5);
      items.push({
        x, y: heightAt(x, z) + sy * 0.25, z, sx, sy, sz,
        rx: (rand() - 0.5) * 0.5, ry: rand() * Math.PI * 2, rz: (rand() - 0.5) * 0.5,
        color: colors[Math.floor(rand() * colors.length)],
      });
      if (size > 0.9) registerObstacle(x, z, Math.max(sx, sz) * 0.7);
      placed++;
    }
  }

  const mat = new THREE.MeshLambertMaterial({ flatShading: true });
  // Round boulders use a smoother shape than angular scree
  const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, fields.some(f => f.round) ? 1 : 0), mat, items.length);
  const dummy = new THREE.Object3D();
  items.forEach((it, i) => {
    dummy.position.set(it.x, it.y, it.z);
    dummy.rotation.set(it.rx, it.ry, it.rz);
    dummy.scale.set(it.sx, it.sy, it.sz);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, new THREE.Color(it.color));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
}

function buildSummitWall(group: THREE.Group, rand: () => number): void {
  const park = getActivePark();
  const sw = park.features?.summitWall;
  if (!sw) return;
  const mtn = park.terrain.mountain;
  const radius = park.overlook.deckRadius + 0.9;
  // The gap faces the end of the trail
  const nodes = park.trail.eastNodes;
  const end = nodes[nodes.length - 1];
  const gapCentre = Math.atan2(end.z - mtn.z, end.x - mtn.x);
  const half = (sw.gapDeg * Math.PI) / 360;
  const count = Math.floor((2 * Math.PI * radius) / 0.95);
  const colors = [0x7b7a6e, 0x6c6d62, 0x8a8472, 0x62655c];
  const mat = new THREE.MeshLambertMaterial({});
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, count);
  const dummy = new THREE.Object3D();
  let n = 0;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    let diff = Math.atan2(Math.sin(a - gapCentre), Math.cos(a - gapCentre));
    if (Math.abs(diff) < half) continue;
    const x = mtn.x + Math.cos(a) * radius;
    const z = mtn.z + Math.sin(a) * radius;
    const sy = 0.6 + rand() * 0.25;
    dummy.position.set(x, mtn.height + sy / 2 - 0.05, z);
    dummy.rotation.set(0, -a + Math.PI / 2 + (rand() - 0.5) * 0.1, 0);
    dummy.scale.set(1.0 + rand() * 0.15, sy, 0.55 + rand() * 0.1);
    dummy.updateMatrix();
    mesh.setMatrixAt(n, dummy.matrix);
    mesh.setColorAt(n, new THREE.Color(colors[Math.floor(rand() * colors.length)]));
    registerObstacle(x, z, 0.7);
    n++;
  }
  mesh.count = n;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
}

/** Layered blue ridgelines on the horizon. They follow the camera and take their colour from the fog. */
function buildDistantRidges(group: THREE.Group): void {
  const layers = [
    { radius: 470, height: 100, shade: 0.97, seed: 1.3 },
    { radius: 430, height: 75, shade: 0.9, seed: 4.1 },
    { radius: 395, height: 52, shade: 0.8, seed: 2.2 },
  ];
  const segs = 220;
  for (const L of layers) {
    const positions: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const prof =
        0.62 +
        0.2 * Math.sin(3 * a + L.seed) +
        0.12 * Math.sin(7 * a + L.seed * 2.1) +
        0.07 * Math.sin(13 * a + L.seed * 3.3) +
        0.04 * Math.sin(29 * a + L.seed * 1.7);
      const top = L.height * Math.max(0.15, prof);
      const x = Math.cos(a) * L.radius;
      const z = Math.sin(a) * L.radius;
      positions.push(x, -60, z, x, top, z);
    }
    for (let i = 0; i < segs; i++) {
      const k = i * 2;
      indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    const mat = new THREE.MeshBasicMaterial({ color: 0x8aa0b4, fog: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    const tint = new THREE.Color();
    mesh.onBeforeRender = (_r, scene, camera) => {
      mesh.position.set(camera.position.x, 0, camera.position.z);
      mesh.updateMatrixWorld();
      const fog = scene.fog as THREE.FogExp2 | null;
      if (fog) {
        // darker and bluer than the haze, nearer ridges darker still
        tint.copy(fog.color).multiplyScalar(L.shade);
        tint.r *= 0.93;
        tint.g *= 0.98;
        tint.b *= 1.04;
        mat.color.copy(tint);
      }
    };
    group.add(mesh);
  }
}

/** Cairns: small stacks of stones marking the route across bare granite, as on Acadia's open summits. */
function buildCairns(group: THREE.Group, rand: () => number): void {
  const park = getActivePark();
  const cfg = park.features?.cairns;
  if (!cfg) return;
  const curve = new THREE.CatmullRomCurve3(park.trail.eastNodes.map(n => new THREE.Vector3(n.x, 0, n.z)), false, 'centripetal', 0.5);
  const total = curve.getLength();
  const count = Math.floor(total / cfg.every);
  const slabs: { x: number; y: number; z: number; sx: number; sy: number; sz: number; ry: number }[] = [];
  let side = 1;
  for (let i = 1; i < count; i++) {
    const u = (i * cfg.every) / total;
    const p = curve.getPointAt(u);
    const t = curve.getTangentAt(u);
    const x = p.x + -t.z * side * 2.3;
    const z = p.z + t.x * side * 2.3;
    side = -side;
    const base = heightAt(x, z);
    if (base < cfg.minHeight) continue;
    if (getDistanceToTrail(x, z) < 1.5) continue;
    const layers = [ [0.55, 0.22], [0.44, 0.2], [0.34, 0.18], [0.24, 0.16] ];
    let y = base - 0.04;
    for (const [r, h] of layers) {
      slabs.push({ x: x + (rand() - 0.5) * 0.08, y: y + h / 2, z: z + (rand() - 0.5) * 0.08, sx: r * (0.9 + rand() * 0.2), sy: h, sz: r * (0.9 + rand() * 0.2), ry: rand() * Math.PI });
      y += h * 0.95;
    }
    registerObstacle(x, z, 0.45);
  }
  if (slabs.length === 0) return;
  const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshLambertMaterial({ flatShading: true }), slabs.length);
  const dummy = new THREE.Object3D();
  const cols = [0xb7a69c, 0xa8978d, 0xc2b2a8];
  slabs.forEach((s, i) => {
    dummy.position.set(s.x, s.y, s.z);
    dummy.rotation.set(0, s.ry, 0);
    dummy.scale.set(s.sx, s.sy, s.sz);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, new THREE.Color(cols[Math.floor(rand() * cols.length)]));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
}

/** The sea, east of the coast, with rocky islands (like the Porcupine Islands). */
function buildSea(group: THREE.Group, rand: () => number): void {
  const park = getActivePark();
  const coast = park.terrain.coast;
  const sea = park.features?.sea;
  if (!coast || !sea) return;
  const geo = new THREE.PlaneGeometry(4000, 4000);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshPhongMaterial({ color: sea.color, shininess: 90, specular: 0x9fc4d8, transparent: true, opacity: 0.94 });
  const mesh = new THREE.Mesh(geo, mat);
  // Covers only the land-ward edge of the sea and everything east of it
  mesh.position.set(coast.x0 - 60 + 2000, coast.seaY, 0);
  mesh.receiveShadow = true;
  mesh.renderOrder = 1;
  group.add(mesh);

  for (const isl of park.features?.islands ?? []) {
    const geoI = new THREE.IcosahedronGeometry(1, 2);
    const pos = geoI.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const rock = new THREE.Color(0x8a8079);
    const wood = new THREE.Color(0x2b4a35);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const bump = 0.86 + rand() * 0.28;
      pos.setXYZ(i, pos.getX(i) * bump, pos.getY(i) * (0.9 + rand() * 0.2), pos.getZ(i) * bump);
      const y = pos.getY(i);
      c.copy(rock).lerp(wood, Math.min(1, Math.max(0, (y + 0.1) * 2.2)));
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    geoI.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geoI.computeVertexNormals();
    const m = new THREE.Mesh(geoI, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
    m.scale.set(isl.radius, isl.height, isl.radius * (0.7 + rand() * 0.4));
    m.rotation.y = rand() * Math.PI;
    m.position.set(isl.x, coast.seaY + isl.height * 0.25, isl.z);
    m.castShadow = true;
    group.add(m);
  }
}

/** Is this spot clear of the trail, roads, bridge, closed zones and the summit deck? (used when scattering big props) */
function isClearGround(x: number, z: number, clearance: number): boolean {
  const park = getActivePark();
  if (getDistanceToTrail(x, z) < clearance) return false;
  if (isNearRoad(x, z, clearance)) return false;
  const mtn = park.terrain.mountain;
  if (Math.hypot(x - mtn.x, z - mtn.z) < park.overlook.deckRadius + clearance + 2) return false;
  const b = park.trail.bridge;
  if (x > b.westX - 6 && x < b.eastX + 6 && Math.abs(z - b.centerZ) < 8) return false;
  for (const zn of park.rules.zones) {
    if (Math.hypot(x - zn.x, z - zn.z) < zn.radius + 1.5) return false;
  }
  return true;
}

/** Chiricahua's balancing rhyolite pillars: tall, lumpy columns, some with a narrow "neck" under a wider cap. */
function buildPinnacles(group: THREE.Group, rand: () => number): void {
  const park = getActivePark();
  const fields = park.features?.pinnacles ?? [];
  if (fields.length === 0) return;
  const positions: number[] = [];
  const colors: number[] = [];
  const RING = 9;
  const defaultColors = [0xb39a86, 0xa8907e, 0xc2aa94, 0x9c8574, 0xb8a08a, 0xa59384];
  const lichen = new THREE.Color(0x93b06a);
  const c = new THREE.Color();

  for (const f of fields) {
    const palette = f.colors ?? defaultColors;
    let placed = 0;
    let tries = 0;
    while (placed < f.count && tries < f.count * 25) {
      tries++;
      const a = rand() * Math.PI * 2;
      const inner = f.innerRadius ?? 0;
      const r = Math.sqrt(inner * inner + rand() * (f.radius * f.radius - inner * inner));
      const x = f.x + Math.cos(a) * r;
      const z = f.z + Math.sin(a) * r;
      const width = 0.9 + rand() * 1.9;
      if (!isClearGround(x, z, 3.4 + width)) continue;
      if (getRiverDistance(x, z) < park.water.halfWidth + width + 3) continue;
      const height = f.minHeight + Math.pow(rand(), 1.6) * (f.maxHeight - f.minHeight);
      // sit on the lowest ground under the pillar so it never floats on a slope
      let base = heightAt(x, z);
      for (const [dx, dz] of [[width, 0], [-width, 0], [0, width], [0, -width]]) base = Math.min(base, heightAt(x + dx, z + dz));
      base -= 0.5;

      const levels = 7;
      const neckAt = rand() < 0.45 ? 1 + Math.floor(rand() * 3) : -1; // a narrow neck gives the "balanced rock" look
      const baseColor = palette[Math.floor(rand() * palette.length)];
      const phase = rand() * 6.28;
      const rings: { y: number; cx: number; cz: number; rad: number[] }[] = [];
      let driftX = 0;
      let driftZ = 0;
      for (let i = 0; i <= levels; i++) {
        const t = i / levels;
        let rw = width * (0.8 + 0.28 * Math.sin(i * 1.9 + phase) + (1 - t) * 0.18);
        if (i === neckAt) rw *= 0.55;
        if (i === neckAt + 1 && neckAt >= 0) rw *= 1.25;
        if (i === levels) rw *= 0.62; // rounded top
        driftX += (rand() - 0.5) * width * 0.16;
        driftZ += (rand() - 0.5) * width * 0.16;
        const rad: number[] = [];
        for (let k = 0; k < RING; k++) rad.push(rw * (0.86 + rand() * 0.28));
        rings.push({ y: base + t * height, cx: x + driftX, cz: z + driftZ, rad });
      }
      const vert = (ri: number, k: number) => {
        const ring = rings[ri];
        const ang = (k / RING) * Math.PI * 2;
        return [ring.cx + Math.cos(ang) * ring.rad[k % RING], ring.y, ring.cz + Math.sin(ang) * ring.rad[k % RING]] as const;
      };
      const pushTri = (p: readonly number[][], shade: number, ringIndex: number) => {
        for (const v of p) {
          positions.push(v[0], v[1], v[2]);
          c.set(baseColor).multiplyScalar(shade);
          // pale lichen patches higher up
          if (ringIndex > 1 && rand() < 0.05) c.lerp(lichen, 0.55);
          colors.push(c.r, c.g, c.b);
        }
      };
      for (let i = 0; i < levels; i++) {
        for (let k = 0; k < RING; k++) {
          const a0 = vert(i, k), a1 = vert(i, k + 1), b0 = vert(i + 1, k), b1 = vert(i + 1, k + 1);
          const shade = 0.78 + (i / levels) * 0.32 + (rand() - 0.5) * 0.08;
          pushTri([[...a0], [...b0], [...a1]], shade, i);
          pushTri([[...a1], [...b0], [...b1]], shade, i);
        }
      }
      // top cap
      const top = rings[levels];
      for (let k = 0; k < RING; k++) {
        const p0 = vert(levels, k), p1 = vert(levels, k + 1);
        pushTri([[...p0], [top.cx, top.y + width * 0.28, top.cz], [...p1]], 1.05, levels);
      }
      registerObstacle(x, z, width * 0.9);
      placed++;
    }
  }
  if (positions.length === 0) return;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
}

/** Agave, sotol/yucca and prickly pear on open dry ground. */
function buildSucculents(group: THREE.Group, rand: () => number): void {
  const park = getActivePark();
  const cfg = park.features?.succulents;
  if (!cfg) return;

  const leafGeo = (n: number, len: number, wid: number, tilt: number) => {
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < n; i++) {
      const g = new THREE.ConeGeometry(wid, len, 4);
      g.translate(0, len / 2, 0);
      g.rotateZ(tilt + (i % 2) * 0.25);
      g.rotateY((i / n) * Math.PI * 2 + (i % 3) * 0.2);
      parts.push(g);
    }
    return mergeGeometries(parts);
  };
  const agaveGeo = leafGeo(11, 1.5, 0.17, 0.95);
  const sotolGeo = leafGeo(16, 1.9, 0.07, 0.75);
  const padGeos: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 4; i++) {
    const g = new THREE.SphereGeometry(0.42, 7, 5);
    g.scale(1, 1.05, 0.2);
    g.rotateZ((i - 1.5) * 0.45);
    g.rotateY(i * 0.9);
    g.translate((i - 1.5) * 0.35, 0.5 + (i % 2) * 0.5, (i % 2) * 0.2);
    padGeos.push(g);
  }
  const pearGeo = mergeGeometries(padGeos);

  const kinds = [
    { geo: agaveGeo, cols: [0x6f9a82, 0x7aa58a, 0x628c76], weight: 0.34, scale: [0.8, 1.7] },
    { geo: sotolGeo, cols: [0x8a9f58, 0x95a860, 0x7d9150], weight: 0.33, scale: [0.9, 1.7] },
    { geo: pearGeo, cols: [0x6a8a48, 0x75964f, 0x5e7d40], weight: 0.33, scale: [0.8, 1.5] },
  ];
  const items: { k: number; x: number; y: number; z: number; s: number; ry: number }[] = [];
  let tries = 0;
  while (items.length < cfg.count && tries < cfg.count * 12) {
    tries++;
    const x = (rand() * 2 - 1) * cfg.spread;
    const z = (rand() * 2 - 1) * cfg.spread;
    const h = heightAt(x, z);
    if (h > cfg.maxHeight) continue;
    if (!isClearGround(x, z, 2.0)) continue;
    if (getRiverDistance(x, z) < park.water.halfWidth + 2.5) continue;
    const roll = rand();
    const k = roll < kinds[0].weight ? 0 : roll < kinds[0].weight + kinds[1].weight ? 1 : 2;
    const [s0, s1] = kinds[k].scale;
    items.push({ k, x, y: h, z, s: s0 + rand() * (s1 - s0), ry: rand() * Math.PI * 2 });
  }
  kinds.forEach((kind, ki) => {
    const mine = items.filter(it => it.k === ki);
    if (mine.length === 0) return;
    const mesh = new THREE.InstancedMesh(kind.geo, new THREE.MeshLambertMaterial({ flatShading: true }), mine.length);
    const dummy = new THREE.Object3D();
    mine.forEach((it, i) => {
      dummy.position.set(it.x, it.y - 0.05, it.z);
      dummy.rotation.set(0, it.ry, 0);
      dummy.scale.setScalar(it.s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, new THREE.Color(kind.cols[Math.floor(rand() * kind.cols.length)]));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = true;
    group.add(mesh);
  });
}

/** A small stone fire-lookout hut beside the summit deck, like the one built by the CCC on Sugarloaf Mountain. */
function buildLookoutHut(group: THREE.Group): void {
  const park = getActivePark();
  if (!park.features?.lookoutHut) return;
  const mtn = park.terrain.mountain;
  const nodes = park.trail.eastNodes;
  const end = nodes[nodes.length - 1];
  // opposite side of the summit from where the trail arrives
  const dx = mtn.x - end.x;
  const dz = mtn.z - end.z;
  const len = Math.hypot(dx, dz) || 1;
  const x = mtn.x + (dx / len) * 7.2;
  const z = mtn.z + (dz / len) * 7.2;
  const y = mtn.height;
  const g = new THREE.Group();
  const wall = new THREE.MeshLambertMaterial({ color: 0xa89a82 });
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x4a3f36 });
  const dark = new THREE.MeshLambertMaterial({ color: 0x2a2622 });
  const glass = new THREE.MeshLambertMaterial({ color: 0x5b7184 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.5, 3.4), wall);
  body.position.y = 1.25;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.25, 4.0), roofMat);
  roof.position.y = 2.62;
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.7, 0.1), dark);
  door.position.set(0, 0.85, 1.72);
  const win1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 0.1), glass);
  win1.position.set(1.7, 1.5, 0.6);
  win1.rotation.y = Math.PI / 2;
  const win2 = win1.clone();
  win2.position.set(-1.7, 1.5, 0.6);
  g.add(body, roof, door, win1, win2);
  g.traverse(o => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.position.set(x, y, z);
  g.rotation.y = Math.atan2(end.x - x, end.z - z); // door faces the trail
  group.add(g);
  registerObstacle(x, z, 1.9);
  registerObstacle(x + 1.0, z, 1.4);
  registerObstacle(x - 1.0, z, 1.4);
}

export function createParkFeaturesGroup(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'parkFeatures';
  const park = getActivePark();
  const f = park.features;
  if (!f) return group;
  const rand = mulberry32(7771 + (park.layoutSeed ?? 0));
  buildRoads(group, rand);
  buildCars(group);
  buildTalus(group, rand);
  buildSummitWall(group, rand);
  buildCairns(group, rand);
  buildPinnacles(group, rand);
  buildSucculents(group, rand);
  buildLookoutHut(group);
  buildSea(group, rand);
  if (f.distantRidges) buildDistantRidges(group);
  return group;
}
