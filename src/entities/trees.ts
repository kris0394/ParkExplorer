/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mulberry32, sstep, fbm, hash2 } from '../utils/noise.ts';
import {
  heightAt,
  slopeAt,
  getRiverDistance,
  isPointOnBridge,
  isPointOnSummitDeck,
} from '../terrain/riverTerrain.ts';
import { getDistanceToTrail } from './trailMesh.ts';
import { getActivePark } from '../data/parks.ts';

const CELL = 8;
const treeGrid = new Map<string, { x: number; z: number; r: number }[]>();

function tKey(cx: number, cz: number): string {
  return `${cx},${cz}`;
}

export function pushOutOfTrees(p: { x: number; z: number }): void {
  const cx = Math.floor(p.x / CELL);
  const cz = Math.floor(p.z / CELL);

  for (let ox = -1; ox <= 1; ox++) {
    for (let oz = -1; oz <= 1; oz++) {
      const list = treeGrid.get(tKey(cx + ox, cz + oz));
      if (!list) continue;

      for (const t of list) {
        const dx = p.x - t.x;
        const dz = p.z - t.z;
        const minD = t.r + 0.38;
        const d2 = dx * dx + dz * dz;

        if (d2 < minD * minD && d2 > 1e-6) {
          const d = Math.sqrt(d2);
          p.x = t.x + (dx / d) * minD;
          p.z = t.z + (dz / d) * minD;
        }
      }
    }
  }
}

const geoRand = mulberry32(2024);

function mottle(g: THREE.BufferGeometry, yBase: number, height: number, lo: number, hi: number): void {
  const p = g.attributes.position;
  const c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i += 3) {
    const v = lo + geoRand() * (hi - lo);
    for (let k = 0; k < 3; k++) {
      const t = Math.min(1, Math.max(0, (p.getY(i + k) - yBase) / height));
      const s = v * (0.6 + 0.4 * t);
      c[(i + k) * 3] = s;
      c[(i + k) * 3 + 1] = s;
      c[(i + k) * 3 + 2] = s;
    }
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
}

function makeBlob(r: number, cx: number, cy: number, cz: number, sy: number, lo: number, hi: number): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(r, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const d = 1 + 0.22 * Math.sin(x * 2.3 + y * 1.7 + cx) * Math.cos(z * 2.9 - y * 1.1 + cz);
    p.setXYZ(i, x * d, y * d * sy, z * d);
  }
  g.translate(cx, cy, cz);
  mottle(g, cy - r * sy, 2 * r * sy, lo, hi);
  return g;
}

function paint(g: THREE.BufferGeometry, hex: number): THREE.BufferGeometry {
  const col = new THREE.Color(hex);
  const n = g.attributes.position.count;
  const c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    c[i * 3] = col.r;
    c[i * 3 + 1] = col.g;
    c[i * 3 + 2] = col.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}

function makeBranch(angle: number, tilt: number, y: number, len: number, hex: number): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(0.06, 0.13, len, 5);
  g.translate(0, len / 2, 0);
  g.rotateZ(-tilt);
  g.rotateY(angle);
  g.translate(0, y, 0);
  return paint(g, hex);
}

const jit = (amt: number) => (geoRand() - 0.5) * amt;

function makeConiferCanopy(layers: { r: number; h: number; y: number }[]): THREE.BufferGeometry {
  const parts = layers.map(L => {
    let g: THREE.BufferGeometry = new THREE.ConeGeometry(L.r, L.h, 8, 1, false);
    g.rotateY(geoRand() * Math.PI * 2);
    g.translate(jit(0.2), L.y, jit(0.2));
    g = g.toNonIndexed();
    mottle(g, L.y - L.h / 2, L.h, 0.8, 1.1);
    return g;
  });
  return mergeGeometries(parts);
}

function makeConiferTrunk(): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(0.14, 0.24, 3.0, 6);
  g.translate(0, 1.5, 0);
  return paint(g, 0x4a3a2c);
}

function makeSpruce() {
  return {
    canopy: makeConiferCanopy([
      { r: 1.75, h: 2.3, y: 2.1 },
      { r: 1.45, h: 2.1, y: 3.4 },
      { r: 1.15, h: 1.9, y: 4.6 },
      { r: 0.85, h: 1.7, y: 5.7 },
      { r: 0.5, h: 1.5, y: 6.7 },
    ]),
    trunk: makeConiferTrunk(),
  };
}

function makeFir() {
  return {
    canopy: makeConiferCanopy([
      { r: 2.2, h: 2.0, y: 1.5 },
      { r: 1.9, h: 1.9, y: 2.6 },
      { r: 1.55, h: 1.8, y: 3.7 },
      { r: 1.15, h: 1.6, y: 4.7 },
      { r: 0.7, h: 1.5, y: 5.6 },
      { r: 0.35, h: 1.2, y: 6.4 },
    ]),
    trunk: makeConiferTrunk(),
  };
}

function makePine() {
  const bark = 0x6b4a34;
  const main = new THREE.CylinderGeometry(0.16, 0.3, 8.5, 7);
  main.translate(0, 4.25, 0);
  paint(main, bark);
  const trunk = mergeGeometries([
    main,
    makeBranch(1.0, 1.0, 6.0, 1.5, bark),
    makeBranch(3.6, 1.0, 6.8, 1.4, bark),
  ]);
  const canopy = mergeGeometries([
    makeBlob(1.7, jit(0.4), 8.8, jit(0.4), 0.6, 0.8, 1.15),
    makeBlob(1.3, 1.3 + jit(0.4), 8.0, 0.3, 0.55, 0.8, 1.15),
    makeBlob(1.3, -1.2 + jit(0.4), 7.8, -0.5, 0.55, 0.8, 1.15),
    makeBlob(1.1, 0.2, 9.9 + jit(0.3), 0.1, 0.6, 0.8, 1.15),
    makeBlob(0.9, 1.8 + jit(0.3), 6.9, 0.8, 0.5, 0.8, 1.15),
  ]);
  return { canopy, trunk };
}

function makeMaple(spread: number, height: number) {
  const base = [
    [2.2, 0, 5.4, 0],
    [1.6, 1.5, 4.5, 0.4],
    [1.7, -1.4, 4.6, -0.6],
    [1.5, 0.3, 4.3, 1.6],
    [1.4, -0.4, 6.5, -0.3],
  ];
  const canopy = mergeGeometries(
    base.map(([r, x, y, z]) =>
      makeBlob(r, x * spread + jit(0.5), y * height, z * spread + jit(0.5), 0.85, 0.8, 1.15)
    )
  );
  const bark = 0x5b4332;
  const main = new THREE.CylinderGeometry(0.2, 0.36, 4.2, 7);
  main.translate(0, 2.1, 0);
  paint(main, bark);
  const trunk = mergeGeometries([
    main,
    makeBranch(0.3, 0.75, 3.0, 1.9, bark),
    makeBranch(2.4, 0.8, 3.3, 1.8, bark),
    makeBranch(4.4, 0.7, 2.8, 1.7, bark),
  ]);
  return { canopy, trunk };
}

function makeOak() {
  const bark = 0x4f3d30;
  const main = new THREE.CylinderGeometry(0.3, 0.55, 3.2, 8);
  main.translate(0, 1.6, 0);
  paint(main, bark);
  const trunk = mergeGeometries([
    main,
    makeBranch(0.2, 1.0, 2.6, 2.4, bark),
    makeBranch(1.7, 1.05, 2.8, 2.3, bark),
    makeBranch(3.3, 1.0, 2.5, 2.4, bark),
    makeBranch(4.8, 1.1, 2.7, 2.2, bark),
  ]);
  const canopy = mergeGeometries([
    makeBlob(2.6, jit(0.5), 4.6, jit(0.5), 0.7, 0.8, 1.15),
    makeBlob(2.0, 2.3 + jit(0.4), 4.0, 0.3, 0.7, 0.8, 1.15),
    makeBlob(2.1, -2.2 + jit(0.4), 4.1, -0.5, 0.7, 0.8, 1.15),
    makeBlob(1.9, 0.3, 3.9, 2.3 + jit(0.4), 0.7, 0.8, 1.15),
    makeBlob(1.9, -0.4, 5.8 + jit(0.3), -0.4, 0.75, 0.8, 1.15),
    makeBlob(1.8, 1.2, 4.6, -2.0 + jit(0.4), 0.7, 0.8, 1.15),
  ]);
  return { canopy, trunk };
}

function makeBirch() {
  const H = 5.6, rows = 8;
  const g = new THREE.CylinderGeometry(0.09, 0.15, H, 7, rows);
  g.translate(0, H / 2, 0);
  const p = g.attributes.position;
  const c = new Float32Array(p.count * 3);
  const white = new THREE.Color(0xe6e2d6), dark = new THREE.Color(0x3a3430);
  for (let i = 0; i < p.count; i++) {
    const row = Math.round((p.getY(i) / H) * rows);
    const col = hash2(row, 7) > 0.62 ? dark : white;
    c[i * 3] = col.r;
    c[i * 3 + 1] = col.g;
    c[i * 3 + 2] = col.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  const canopy = mergeGeometries([
    makeBlob(1.15, jit(0.3), 5.0, jit(0.3), 1.3, 0.85, 1.15),
    makeBlob(0.9, 0.5 + jit(0.3), 5.9, 0.2, 1.3, 0.85, 1.15),
    makeBlob(0.9, -0.5 + jit(0.3), 4.4, -0.3, 1.2, 0.85, 1.15),
    makeBlob(0.7, 0.1, 6.5 + jit(0.3), -0.2, 1.3, 0.85, 1.15),
  ]);
  return { canopy, trunk: g };
}

function makePoplar() {
  const bark = 0x7a7064;
  const main = new THREE.CylinderGeometry(0.1, 0.22, 6.5, 6);
  main.translate(0, 3.25, 0);
  paint(main, bark);
  const canopy = mergeGeometries([
    makeBlob(0.9, jit(0.2), 3.4, jit(0.2), 1.4, 0.85, 1.15),
    makeBlob(1.0, 0.1 + jit(0.2), 4.7, 0.0, 1.9, 0.85, 1.15),
    makeBlob(0.85, -0.1 + jit(0.2), 6.3, 0.1, 1.8, 0.85, 1.15),
    makeBlob(0.6, 0.1, 7.7 + jit(0.3), 0.0, 1.6, 0.85, 1.15),
  ]);
  return { canopy, trunk: main };
}

function makeSnag() {
  const bark = 0x6b655c;
  const main = new THREE.CylinderGeometry(0.1, 0.28, 5.5, 6);
  main.translate(0, 2.75, 0);
  paint(main, bark);
  const trunk = mergeGeometries([
    main,
    makeBranch(0.5, 0.9, 3.2, 1.6, bark),
    makeBranch(2.2, 1.0, 4.0, 1.4, bark),
    makeBranch(3.9, 0.8, 2.4, 1.7, bark),
    makeBranch(5.3, 1.1, 4.6, 1.0, bark),
    makeBranch(1.4, 0.9, 5.0, 0.8, bark),
  ]);
  return { canopy: null, trunk };
}

function makeShrubGeometry(): THREE.BufferGeometry {
  return mergeGeometries([
    makeBlob(0.6, 0.0, 0.4, 0.0, 0.8, 0.75, 1.15),
    makeBlob(0.45, 0.55, 0.3, 0.2, 0.8, 0.75, 1.15),
    makeBlob(0.42, -0.45, 0.3, -0.25, 0.8, 0.75, 1.15),
  ]);
}

interface TreeSpeciesDef {
  build: (() => { canopy: THREE.BufferGeometry | null; trunk: THREE.BufferGeometry })[];
  palette: number[] | null;
  autumn?: number[];
  tint: [number, number];
  size: [number, number];
  stretch: [number, number];
  trunkRadius: number;
  variants: {
    canopy: THREE.BufferGeometry | null;
    trunk: THREE.BufferGeometry;
    list: { matrix: THREE.Matrix4; color: THREE.Color | null }[];
  }[];
}

export function createForestSystem(scene: THREE.Scene, worldSize = 600): void {
  treeGrid.clear();
  const park = getActivePark();
  const treeCount = park.vegetation.treeCount;
  const shrubCount = park.vegetation.shrubCount;
  const weightsMultiplier = park.vegetation.speciesWeights;

  const SPECIES: Record<string, TreeSpeciesDef> = {
    conifer: {
      build: [makeSpruce, makeFir],
      palette: [0x2f5d45, 0x3a6b4a, 0x2a5a52, 0x426e45],
      tint: [0.85, 1.15],
      size: [0.9, 1.7],
      stretch: [0.85, 1.35],
      trunkRadius: 0.25,
      variants: [],
    },
    pine: {
      build: [makePine, makePine],
      palette: [0x4a6b3a, 0x557a3c, 0x3d5f3a, 0x5d7a35],
      tint: [0.9, 1.15],
      size: [1.0, 1.5],
      stretch: [0.85, 1.25],
      trunkRadius: 0.22,
      variants: [],
    },
    broadleaf: {
      build: [() => makeMaple(1.0, 1.0), () => makeMaple(0.8, 1.15)],
      palette: [0x5f8f3e, 0x4e8a46, 0x769a3c, 0x3f7a45, 0x8ba33f],
      autumn: [0xb7a23a, 0xc08a2e, 0xa9532b],
      tint: [0.9, 1.2],
      size: [0.9, 1.5],
      stretch: [0.85, 1.25],
      trunkRadius: 0.3,
      variants: [],
    },
    oak: {
      build: [makeOak, makeOak],
      palette: [0x4f7f33, 0x5f8a36, 0x6f8f3a, 0x7a8f35, 0x46763a],
      autumn: [0xb08a30, 0x9a6a2a],
      tint: [0.9, 1.15],
      size: [1.0, 1.5],
      stretch: [0.85, 1.15],
      trunkRadius: 0.5,
      variants: [],
    },
    birch: {
      build: [makeBirch, makeBirch],
      palette: [0x9bbf5a, 0x86b04e, 0xb2c35e, 0xa4c060],
      autumn: [0xd6c24a, 0xe0b23a],
      tint: [0.9, 1.2],
      size: [0.9, 1.4],
      stretch: [0.9, 1.3],
      trunkRadius: 0.15,
      variants: [],
    },
    poplar: {
      build: [makePoplar],
      palette: [0x6f9a3c, 0x80a844, 0x5f8f3e, 0xa9b845],
      tint: [0.9, 1.2],
      size: [0.9, 1.4],
      stretch: [0.9, 1.3],
      trunkRadius: 0.15,
      variants: [],
    },
    snag: {
      build: [makeSnag, makeSnag],
      palette: null,
      tint: [1, 1],
      size: [0.8, 1.3],
      stretch: [0.9, 1.2],
      trunkRadius: 0.2,
      variants: [],
    },
  };

  for (const name in SPECIES) {
    const sp = SPECIES[name];
    sp.variants = sp.build.map(fn => ({ ...fn(), list: [] }));
  }

  function chooseKind(zone: number, grove: number, roll: number): string {
    const rawWeights: Record<string, number> = zone > 0.22
      ? { conifer: 5 + grove * 3, pine: 2.5 - grove * 2, birch: 0.4, snag: 0.3, broadleaf: 0.3, oak: 0.2, poplar: 0.2 }
      : { broadleaf: 3 + grove * 2, oak: 2.6 - grove * 2, birch: 1.2, poplar: 0.9 + grove * 0.5, conifer: 0.5, pine: 0.4, snag: 0.25 };
    
    const weights: Record<string, number> = {};
    let total = 0;
    for (const k in rawWeights) {
      const mult = (weightsMultiplier as Record<string, number>)[k] ?? 1.0;
      weights[k] = Math.max(0.1, rawWeights[k] * mult);
      total += weights[k];
    }
    let pick = roll * total;
    for (const k in weights) {
      pick -= weights[k];
      if (pick <= 0) return k;
    }
    return 'broadleaf';
  }

  const rand = mulberry32(12345);
  const dummy = new THREE.Object3D();
  const between = (range: [number, number]) => range[0] + rand() * (range[1] - range[0]);

  let placed = 0;
  let tries = 0;

  while (placed < treeCount && tries < treeCount * 14) {
    tries++;
    const x = (rand() - 0.5) * (worldSize - 60);
    const z = (rand() - 0.5) * (worldSize - 60);

    // --- TREE PLACEMENT EXCLUSION RULES ---
    // 1. Spawn clearing exclusion
    if (Math.hypot(x - park.spawn.x, z - park.spawn.z) < 16.0) continue;

    // 2. River exclusion: no trees in water or immediate shoreline
    if (getRiverDistance(x, z) < (park.water.halfWidth + 3.2)) continue;

    // 3. Trail corridor exclusion: keep trail unobstructed
    if (getDistanceToTrail(x, z) < 3.2) continue;

    // 4. Bridge exclusion zone
    const b = park.trail.bridge;
    if (x >= (b.westX - 3.5) && x <= (b.eastX + 3.5) && Math.abs(z - b.centerZ) < 5.0) continue;

    // 5. Summit platform terrace exclusion
    if (Math.hypot(x - park.terrain.mountain.x, z - park.terrain.mountain.z) < 11.5) continue;

    // 6. Cliff slope exclusion: no trees clinging to vertical cliffs
    if (slopeAt(x, z) > 0.88) continue;

    // 7. Forest density noise
    const density = fbm(x * 0.012 + 7, z * 0.012 + 3, 3);
    if (rand() > sstep(-0.35, 0.35, density) * 0.95 + 0.05) continue;

    const h = heightAt(x, z);
    const zone = fbm(x * 0.008 + 55, z * 0.008 - 33, 2) + h * 0.02 + (rand() - 0.5) * 0.5;
    const grove = fbm(x * 0.03 + 9, z * 0.03 - 4, 2);
    const kind = chooseKind(zone, grove, rand());
    const sp = SPECIES[kind];
    const variant = sp.variants[Math.floor(rand() * sp.variants.length)];

    let s = between(sp.size);
    if (kind !== 'snag' && rand() < 0.1) s *= 0.4 + rand() * 0.25;

    dummy.position.set(x, h - 0.1, z);
    dummy.rotation.set((rand() - 0.5) * 0.06, rand() * Math.PI * 2, (rand() - 0.5) * 0.06);
    const w = s * (0.85 + rand() * 0.3);
    dummy.scale.set(w, s * between(sp.stretch), w);
    dummy.updateMatrix();

    let color: THREE.Color | null = null;
    if (sp.palette) {
      let hex: number;
      if (sp.autumn && rand() < 0.07) {
        hex = sp.autumn[Math.floor(rand() * sp.autumn.length)];
      } else {
        hex = sp.palette[Math.floor(rand() * sp.palette.length)];
      }
      color = new THREE.Color(hex).multiplyScalar(between(sp.tint));
    }

    variant.list.push({ matrix: dummy.matrix.clone(), color });

    const key = tKey(Math.floor(x / CELL), Math.floor(z / CELL));
    if (!treeGrid.has(key)) treeGrid.set(key, []);
    treeGrid.get(key)!.push({ x, z, r: sp.trunkRadius * s });
    placed++;
  }

  // Build instanced meshes for trees
  for (const name in SPECIES) {
    for (const v of SPECIES[name].variants) {
      if (v.list.length === 0) continue;
      if (v.canopy) {
        const canopy = new THREE.InstancedMesh(
          v.canopy,
          new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }),
          v.list.length
        );
        v.list.forEach((item, i) => {
          canopy.setMatrixAt(i, item.matrix);
          if (item.color) canopy.setColorAt(i, item.color);
        });
        canopy.instanceMatrix.needsUpdate = true;
        if (canopy.instanceColor) canopy.instanceColor.needsUpdate = true;
        canopy.castShadow = true;
        canopy.receiveShadow = true;
        scene.add(canopy);
      }
      if (v.trunk) {
        const trunk = new THREE.InstancedMesh(
          v.trunk,
          new THREE.MeshLambertMaterial({ vertexColors: true }),
          v.list.length
        );
        v.list.forEach((item, i) => trunk.setMatrixAt(i, item.matrix));
        trunk.instanceMatrix.needsUpdate = true;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        scene.add(trunk);
      }
    }
  }

  // --- Place low bushes / shrubs ---
  const shrubPalette = [0x3e6b3a, 0x557a35, 0x6f8a3a, 0x2f5a42, 0x7f9a3c];
  const shrubs: { matrix: THREE.Matrix4; color: THREE.Color }[] = [];
  let sPlaced = 0;
  let sTries = 0;

  while (sPlaced < shrubCount && sTries < shrubCount * 8) {
    sTries++;
    const x = (rand() - 0.5) * (worldSize - 60);
    const z = (rand() - 0.5) * (worldSize - 60);

    if (Math.hypot(x - park.spawn.x, z - park.spawn.z) < 6.0) continue;
    if (getRiverDistance(x, z) < (park.water.halfWidth + 1.2)) continue;
    if (getDistanceToTrail(x, z) < 1.6) continue;
    if (isPointOnBridge(x, z) || isPointOnSummitDeck(x, z)) continue;
    if (slopeAt(x, z) > 0.95) continue;

    const density = fbm(x * 0.02 + 90, z * 0.02 + 12, 3);
    if (rand() > sstep(-0.4, 0.4, density) * 0.9 + 0.1) continue;

    const s = 0.7 + rand() * 1.1;
    dummy.position.set(x, heightAt(x, z) - 0.05, z);
    dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    dummy.scale.set(s, s * (0.8 + rand() * 0.5), s);
    dummy.updateMatrix();

    const color = new THREE.Color(
      shrubPalette[Math.floor(rand() * shrubPalette.length)]
    ).multiplyScalar(0.85 + rand() * 0.35);

    shrubs.push({ matrix: dummy.matrix.clone(), color });
    sPlaced++;
  }

  if (shrubs.length > 0) {
    const shrubGeo = makeShrubGeometry();
    const shrubMesh = new THREE.InstancedMesh(
      shrubGeo,
      new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }),
      shrubs.length
    );
    shrubs.forEach((item, i) => {
      shrubMesh.setMatrixAt(i, item.matrix);
      shrubMesh.setColorAt(i, item.color);
    });
    shrubMesh.instanceMatrix.needsUpdate = true;
    if (shrubMesh.instanceColor) shrubMesh.instanceColor.needsUpdate = true;
    shrubMesh.receiveShadow = true;
    scene.add(shrubMesh);
  }
}
