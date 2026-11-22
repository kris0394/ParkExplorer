/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSeasonDef } from '../data/seasons.ts';
import * as THREE from 'three';
import { heightAt, getRiverDistance } from '../terrain/riverTerrain.ts';
import { getDistanceToTrail } from './trailMesh.ts';
import { pushOutOfTrees } from './trees.ts';
import { pushOutOfRocks } from './rocks.ts';

export type DeerState = 'IDLE' | 'WANDER' | 'FEED' | 'ALERT' | 'FLEE' | 'APPROACH';

export type AnimalSpecies = 'white-tailed-deer' | 'elk' | 'black-bear' | 'bison' | 'prairie-dog' | 'bighorn-sheep' | 'pronghorn' | 'wild-horse' | 'mule-deer' | 'kit-fox' | 'jackrabbit' | 'coyote' | 'mountain-lion' | 'yellow-bellied-marmot' | 'pika';

export interface DeerConfig {
  id: string;
  /** Defaults to white-tailed deer. */
  species?: AnimalSpecies;
  /** Safe viewing distance in metres (set by the wildlife manager from species and park data). */
  safeDistanceM?: number;
  isBuck: boolean;
  isFawn?: boolean;
  spawnX: number;
  spawnZ: number;
  roamRadius: number;
}

/**
 * Procedural 3D White-Tailed Deer (Buck, Doe, and Spotted Fawn variants)
 * Features natural grazing/nibbling animations, authentic ground feeding posture,
 * chewing jaw motion, ear twitches, tail flagging, and park-realistic tolerance.
 */
export class DeerEntity {
  public id: string;
  public group: THREE.Group;
  public pos: THREE.Vector3;
  public yaw: number;
  public state: DeerState = 'FEED';
  public isBuck: boolean;
  public isFawn: boolean;
  public species: AnimalSpecies;
  /** Game safe-viewing distance (m): deer 23, elk 46 (park data can override). */
  public safeDistanceM: number;

  /** Bears (Task 16): how many times the player calmly backed away from an approaching bear / ran from it. */
  public retreatEvents = 0;
  public runEvents = 0;
  private approachTimer = 0;
  /** Prairie dogs: seconds left down the burrow. */
  private hideTimer = 0;
  private minApproachDist = Infinity;
  private approachCooldown = 20;
  /** Height of the body above the ground (deer 1.15, bears sit much lower). */
  private bodyBaseY = 1.15;

  private stateTimer = 0;
  private targetPos: THREE.Vector2;
  private homePos: THREE.Vector2;
  private roamRadius: number;

  // Hierarchical mesh parts for lifelike animation
  private bodyMesh!: THREE.Mesh;
  private neckPivot!: THREE.Group;
  private headPivot!: THREE.Group;
  private muzzlePivot!: THREE.Group;
  private tailPivot!: THREE.Group;
  private leftEar!: THREE.Mesh;
  private rightEar!: THREE.Mesh;

  private legFLPivot!: THREE.Group;
  private legFRPivot!: THREE.Group;
  private legBLPivot!: THREE.Group;
  private legBRPivot!: THREE.Group;

  // Animation phase timers
  private walkPhase = 0;
  private chewPhase = 0;
  private earTwitchPhase = 0;
  private tailFlickPhase = 0;

  get isElk(): boolean {
    return this.species === 'elk';
  }

  get isBear(): boolean {
    return this.species === 'black-bear';
  }

  /** Task 25: American bison (Wind Cave). */
  get isBison(): boolean {
    return this.species === 'bison';
  }

  /** Task 25: black-tailed prairie dog (Wind Cave). */
  get isPrairieDog(): boolean {
    return this.species === 'prairie-dog';
  }

  /** Task 33: yellow-bellied marmot and pika (Rocky Mountain). */
  get isMarmot(): boolean {
    return this.species === 'yellow-bellied-marmot';
  }
  get isPika(): boolean {
    return this.species === 'pika';
  }
  /** Small animals that dive into a burrow or rock pile when you come close (prairie dog, marmot, pika). */
  get isBurrower(): boolean {
    return this.isPrairieDog || this.isMarmot || this.isPika;
  }

  /** Task 25: Rocky Mountain bighorn sheep (Badlands). A "buck" is a ram. */
  get isBighorn(): boolean {
    return this.species === 'bighorn-sheep';
  }

  /** Task 28b: desert animals of Arches. A "buck" is a buck mule deer; fox and jackrabbit have one kind. */
  get isMule(): boolean {
    return this.species === 'mule-deer';
  }
  get isFox(): boolean {
    return this.species === 'kit-fox';
  }
  get isHare(): boolean {
    return this.species === 'jackrabbit';
  }
  /** Task 28c: coyotes and mountain lions (Arches). */
  get isCoyote(): boolean {
    return this.species === 'coyote';
  }
  get isCat(): boolean {
    return this.species === 'mountain-lion';
  }

  /** Task 26: the feral ("wild") horses of Theodore Roosevelt National Park. A "buck" is a stallion. */
  get isHorse(): boolean {
    return this.species === 'wild-horse';
  }

  /** Task 25b: pronghorn (Badlands). A "buck" is a buck with pronged horns; does have small straight horns. */
  get isPronghorn(): boolean {
    return this.species === 'pronghorn';
  }

  /** Big herd animals (elk and bison) tolerate people from farther away and bolt later. */
  get isHerd(): boolean {
    return this.species === 'elk' || this.species === 'bison' || this.species === 'wild-horse';
  }

  /** True while a prairie dog is down its burrow (it cannot be seen or disturbed). */
  get isHidden(): boolean {
    return this.hideTimer > 0;
  }

  /** True while a curious bear is walking toward the player. */
  get isApproaching(): boolean {
    return this.state === 'APPROACH';
  }

  get speciesName(): string {
    return this.isBear ? 'Black Bear' : this.isBighorn ? 'Bighorn Sheep' : this.isPronghorn ? 'Pronghorn' : this.isHorse ? 'Feral Horse' : this.isMule ? 'Mule Deer' : this.isFox ? 'Kit Fox' : this.isHare ? 'Black-tailed Jackrabbit' : this.isCoyote ? 'Coyote' : this.isCat ? 'Mountain Lion' : this.isBison ? 'American Bison' : this.isPrairieDog ? 'Black-tailed Prairie Dog' : this.isMarmot ? 'Yellow-bellied Marmot' : this.isPika ? 'Pika' : this.isElk ? 'Elk' : 'White-tailed Deer';
  }

  get detailLabel(): string {
    if (this.isBear) return 'Adult black bear';
    if (this.isBison) return this.isBuck ? 'Bull bison' : 'Cow bison';
    if (this.isBighorn) return this.isBuck ? 'Bighorn ram (curled horns)' : 'Bighorn ewe';
    if (this.isPronghorn) return this.isBuck ? 'Pronghorn buck (pronged horns)' : 'Pronghorn doe';
    if (this.isHorse) return this.isBuck ? 'Feral horse stallion' : 'Feral horse mare';
    if (this.isMule) return this.isBuck ? 'Mule deer buck (forked antlers)' : 'Mule deer doe';
    if (this.isFox) return 'Kit fox';
    if (this.isHare) return 'Black-tailed jackrabbit';
    if (this.isCoyote) return 'Coyote';
    if (this.isCat) return 'Mountain lion';
    if (this.isPrairieDog) return 'Adult prairie dog';
    if (this.isMarmot) return 'Adult marmot';
    if (this.isPika) return 'Adult pika';
    if (this.isElk) return this.isBuck ? 'Bull elk (antlered)' : 'Cow elk';
    if (this.isFawn) return 'Spotted fawn';
    if (this.isBuck) return 'Adult buck (antlered)';
    return 'Adult doe';
  }

  /** Approximate shoulder-to-antler height in metres, used for binocular and photo framing. */
  get visualHeight(): number {
    if (this.isBear) return 1.1;
    if (this.isBison) return this.isBuck ? 1.9 : 1.6;
    if (this.isBighorn) return this.isBuck ? 1.2 : 1.0;
    if (this.isPronghorn) return this.isBuck ? 1.25 : 1.15;
    if (this.isHorse) return this.isBuck ? 1.9 : 1.75;
    if (this.isMule) return this.isBuck ? 1.5 : 1.3;
    if (this.isFox) return 0.4;
    if (this.isHare) return 0.4;
    if (this.isCoyote) return 0.8;
    if (this.isCat) return 0.9;
    if (this.isPrairieDog) return 0.25;
    if (this.isMarmot) return 0.4;
    if (this.isPika) return 0.15;
    if (this.isElk) return this.isBuck ? 2.7 : 2.1;
    return this.isFawn ? 0.8 : this.isBuck ? 1.55 : 1.35;
  }

  constructor(config: DeerConfig) {
    this.id = config.id;
    this.species = config.species ?? 'white-tailed-deer';
    this.safeDistanceM = config.safeDistanceM ?? (config.species === 'elk' || config.species === 'black-bear' || config.species === 'bison' ? 46 : 23);
    this.isBuck = config.isBuck;
    this.isFawn = this.species === 'white-tailed-deer' ? Boolean(config.isFawn) : false;
    this.group = new THREE.Group();
    this.pos = new THREE.Vector3(config.spawnX, heightAt(config.spawnX, config.spawnZ), config.spawnZ);
    this.homePos = new THREE.Vector2(config.spawnX, config.spawnZ);
    this.targetPos = new THREE.Vector2(config.spawnX, config.spawnZ);
    this.roamRadius = config.roamRadius;
    this.yaw = Math.random() * Math.PI * 2;

    this.group.name = `deer_${config.id}`;
    this.buildMesh();
    this.updatePosition();

    // Start in peaceful FEED state grazing in the glade
    this.state = 'FEED';
    this.stateTimer = 8.0 + Math.random() * 6.0;
  }

  private buildMesh(): void {
    // Distinct palettes for Buck vs Doe vs Fawn
    const isElk = this.isElk;
    const isBear = this.isBear;
    const isBison = this.isBison;
    const isPD = this.isBurrower;
    const isMarmot = this.isMarmot;
    const isPika = this.isPika;
    const isSheep = this.isBighorn;
    const isPronghorn = this.isPronghorn;
    const isHorse = this.isHorse;
    const isMule = this.isMule;
    const isFox = this.isFox;
    const isHare = this.isHare;
    const isCoyote = this.isCoyote;
    const isCat = this.isCat;
    const stocky = isBear || isBison || isPD || isSheep || isHare || isCat; // short, heavy legs and a thick neck
    const furColor = isMule
      ? this.isBuck
        ? 0x8a775e // gray-brown buck
        : 0x927f66
      : isFox
      ? 0xc0a574 // sandy buff, a little darker so it shows against the sand
      : isHare
      ? 0xa88c64 // tan-brown, a little darker so it shows against the sand
      : isCoyote
      ? 0x8f7d60 // gray-tan
      : isCat
      ? 0xc2a074 // tawny
      : isHorse
      ? this.isBuck
        ? 0x4e3425 // dark bay stallion
        : 0x8a5a38 // chestnut mare
      : isPronghorn
      ? this.isBuck
        ? 0xb3703d // tan-rust buck
        : 0xbe7e48 // slightly paler doe
      : isSheep
      ? this.isBuck
        ? 0x8a6a4b // brown ram
        : 0x967a5a // lighter ewe
      : isBison
      ? 0x3f2d21 // dark brown bison
      : isPD
      ? (isMarmot ? 0x8c7350 : isPika ? 0x9a8c78 : 0xb48a5a) // brown marmot, grey-tan pika, sandy tan prairie dog
      : isBear
      ? 0x241d19 // black bear
      : isElk
      ? this.isBuck
        ? 0x8d6b47 // tan-brown bull
        : 0x9c7c58 // lighter cow
      : this.isFawn
      ? 0xc2864c // bright golden fawn
      : this.isBuck
      ? 0x854e2c // deep rich chestnut buck
      : 0xb07548; // sleek warm golden-tan doe

    const furMat = new THREE.MeshLambertMaterial({ color: furColor });
    const bellyMat = new THREE.MeshLambertMaterial({ color: isBear || isBison || isHorse ? furColor : isPD ? (isMarmot ? 0xd9ad55 : isPika ? 0xcfc5b2 : 0xe3cfa8) : isSheep ? 0xe9dcc4 : 0xf5eee6 }); // white underbelly (bears and bison: same fur; prairie dogs: cream)
    const tanMat = new THREE.MeshLambertMaterial({ color: 0x9a7a55 }); // bear muzzle
    const hoofMat = new THREE.MeshLambertMaterial({ color: 0x1f1b17 });
    const antlerMat = new THREE.MeshStandardMaterial({ color: 0xe0d6c5, roughness: 0.75, metalness: 0.1 });
    const noseMat = new THREE.MeshLambertMaterial({ color: 0x161311 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x060504, roughness: 0.15 });

    const scale = isCoyote ? 0.5 : isCat ? 0.8 : isMule ? (this.isBuck ? 1.16 : 1.0) : isFox ? 0.3 : isHare ? 0.3 : isHorse ? (this.isBuck ? 1.0 : 0.94) : isPronghorn ? (this.isBuck ? 0.96 : 0.9) : isSheep ? (this.isBuck ? 1.0 : 0.84) : isPD ? (isMarmot ? 0.4 : isPika ? 0.13 : 0.19) : isBison ? (this.isBuck ? 1.7 : 1.45) : isBear ? 1.0 : isElk ? (this.isBuck ? 1.75 : 1.55) : this.isFawn ? 0.65 : this.isBuck ? 1.08 : 0.94;
    this.bodyBaseY = stocky ? 0.66 : 1.15;
    // Elk: darker neck and mane, cream rump patch, short tail
    const maneMat = new THREE.MeshLambertMaterial({ color: 0x4a3524 });
    const neckFurMat = isElk ? maneMat : furMat;
    const root = new THREE.Group();
    root.scale.set(scale, scale, scale);

    // 1. Torso / Body (barrel with white underbelly)
    const bodyGeo = stocky ? new THREE.CylinderGeometry(0.38, 0.43, 1.15, 8) : new THREE.CylinderGeometry(0.30, 0.33, 1.20, 8);
    bodyGeo.rotateX(Math.PI / 2);
    this.bodyMesh = new THREE.Mesh(bodyGeo, furMat);
    this.bodyMesh.position.set(0, this.bodyBaseY, 0);
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    root.add(this.bodyMesh);

    // White belly patch
    const bellyGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.96, 6, 1, false, Math.PI / 2, Math.PI);
    bellyGeo.rotateX(Math.PI / 2);
    const bellyMesh = new THREE.Mesh(bellyGeo, bellyMat);
    bellyMesh.position.set(0, -0.06, 0);
    this.bodyMesh.add(bellyMesh);

    // White fawn spots (if fawn)
    if (this.isFawn) {
      const spotMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
      for (let s = 0; s < 14; s++) {
        const spotGeo = new THREE.BoxGeometry(0.04, 0.02, 0.04);
        const spotMesh = new THREE.Mesh(spotGeo, spotMat);
        const z = -0.42 + (s % 7) * 0.14;
        const side = s < 7 ? -0.22 : 0.22;
        spotMesh.position.set(side, 0.25, z);
        this.bodyMesh.add(spotMesh);
      }
    }

    if (isPronghorn) {
      // TODO (fix later, reported 15 Nov 2026): these white boxes show as obvious white squares/rectangles on the sides and rump.
      // Pronghorn: a large white rump patch (white patches on rump, side, belly and throat)
      const rumpMat = new THREE.MeshLambertMaterial({ color: 0xf6f0e6 });
      const rump = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.42, 0.10), rumpMat);
      rump.position.set(0, 0.06, -0.60);
      this.bodyMesh.add(rump);
      const flank = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.16, 0.50), rumpMat); // white band low on the side
      flank.position.set(0, -0.10, 0.0);
      this.bodyMesh.add(flank);
    }

    if (isSheep) {
      // TODO (fix later, reported 15 Nov 2026): this white box shows as an obvious white square on the rump.
      // Bighorn: a big white rump patch, pale muzzle, and horns (massive curls on rams, short thin horns on ewes)
      const rumpMat = new THREE.MeshLambertMaterial({ color: 0xf2ece0 });
      const rump = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.46, 0.10), rumpMat);
      rump.position.set(0, 0.04, -0.58);
      this.bodyMesh.add(rump);
    }

    if (isElk) {
      // Cream rump patch
      const rumpGeo = new THREE.BoxGeometry(0.34, 0.30, 0.10);
      const rump = new THREE.Mesh(rumpGeo, new THREE.MeshLambertMaterial({ color: 0xe6d3a8 }));
      rump.position.set(0, 0.04, -0.62);
      this.bodyMesh.add(rump);
    }

    // 2. Neck Pivot (at shoulders: x: 0, y: 0.16, z: 0.48)
    this.neckPivot = new THREE.Group();
    this.neckPivot.position.set(0, 0.16, 0.48);

    // Neck cylinder extending forward-upward
    const neckLen = stocky ? 0.30 : 0.62;
    const neckGeo = stocky ? new THREE.CylinderGeometry(0.20, 0.29, neckLen, 8) : new THREE.CylinderGeometry(0.14, 0.21, neckLen, 8);
    neckGeo.translate(0, neckLen / 2, 0);
    const neckMesh = new THREE.Mesh(neckGeo, neckFurMat);
    neckMesh.castShadow = true;
    this.neckPivot.add(neckMesh);

    // White throat bib
    const throatGeo = new THREE.BoxGeometry(0.12, 0.38, 0.06);
    throatGeo.translate(0, neckLen * 0.45, 0.12);
    const throatMesh = new THREE.Mesh(throatGeo, bellyMat);
    this.neckPivot.add(throatMesh);

    // 3. Head Pivot (at top of neck)
    this.headPivot = new THREE.Group();
    this.headPivot.position.set(0, neckLen, 0);

    // Skull
    const headGeo = stocky ? new THREE.BoxGeometry(0.27, 0.25, 0.26) : new THREE.BoxGeometry(0.20, 0.20, 0.28);
    headGeo.translate(0, 0.02, 0.08);
    const headMesh = new THREE.Mesh(headGeo, furMat);
    headMesh.castShadow = true;
    this.headPivot.add(headMesh);

    // Muzzle / Snout Pivot (allows chewing articulation)
    this.muzzlePivot = new THREE.Group();
    this.muzzlePivot.position.set(0, -0.04, 0.22);

    const muzzleGeo = stocky ? new THREE.BoxGeometry(0.15, 0.12, 0.17) : new THREE.BoxGeometry(0.12, 0.12, 0.24);
    muzzleGeo.translate(0, 0, stocky ? 0.07 : 0.10);
    const muzzleMesh = new THREE.Mesh(muzzleGeo, isBear || isPD ? tanMat : furMat);
    this.muzzlePivot.add(muzzleMesh);

    // Dark nose tip
    const noseGeo = new THREE.BoxGeometry(0.085, 0.065, 0.05);
    noseGeo.translate(0, 0.02, 0.22);
    const noseMesh = new THREE.Mesh(noseGeo, noseMat);
    this.muzzlePivot.add(noseMesh);

    // White chin / lower lip
    const chinGeo = new THREE.BoxGeometry(0.09, 0.03, 0.14);
    chinGeo.translate(0, -0.055, 0.12);
    const chinMesh = new THREE.Mesh(chinGeo, bellyMat);
    this.muzzlePivot.add(chinMesh);

    this.headPivot.add(this.muzzlePivot);

    // Dark attentive eyes with white eyeliner
    for (const side of [-1, 1]) {
      const ringGeo = new THREE.BoxGeometry(0.015, 0.065, 0.065);
      const ringMesh = new THREE.Mesh(ringGeo, bellyMat);
      ringMesh.position.set(side * 0.108, 0.06, 0.14);
      this.headPivot.add(ringMesh);

      const eyeGeo = new THREE.SphereGeometry(0.036, 6, 6);
      eyeGeo.scale(1, 1.2, 1);
      const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
      eyeMesh.position.set(side * 0.115, 0.06, 0.14);
      this.headPivot.add(eyeMesh);
    }

    // Expressive ears (bears: small and round)
    const earGeo = stocky ? new THREE.SphereGeometry(isPika ? 0.075 : isPD ? 0.045 : 0.065, 6, 6) : new THREE.ConeGeometry(0.062, 0.23, 5);
    if (!stocky) {
      earGeo.rotateZ(Math.PI / 2);
      earGeo.translate(0, 0.09, 0);
    }

    this.leftEar = new THREE.Mesh(earGeo, furMat);
    this.leftEar.position.set(stocky ? -0.11 : -0.09, stocky ? 0.15 : 0.13, -0.03);
    this.leftEar.rotation.set(-0.25, 0.35, 0.55);
    this.headPivot.add(this.leftEar);

    this.rightEar = new THREE.Mesh(earGeo.clone(), furMat);
    this.rightEar.position.set(stocky ? 0.11 : 0.09, stocky ? 0.15 : 0.13, -0.03);
    this.rightEar.rotation.set(-0.25, -0.35, -0.55);
    this.headPivot.add(this.rightEar);

    // Task 28b: mule deer have very large ears; kit foxes and jackrabbits get tall, upright ears of their own
    if (isMule) {
      this.leftEar.scale.set(1.5, 1.35, 1.35);
      this.rightEar.scale.set(1.5, 1.35, 1.35);
    }
    if (isFox || isHare || isCoyote) {
      this.leftEar.visible = false;
      this.rightEar.visible = false;
      const eh = isHare ? 0.42 : isCoyote ? 0.24 : 0.26;
      const er = isHare ? 0.055 : 0.06;
      for (const side of [-1, 1]) {
        const eg = new THREE.ConeGeometry(er, eh, 5);
        eg.translate(0, eh / 2, 0);
        const ear = new THREE.Mesh(eg, furMat);
        ear.position.set(side * (isHare ? 0.07 : 0.075), 0.16, -0.02);
        ear.rotation.z = -side * 0.22; // tilt outward
        ear.rotation.x = -0.15;
        this.headPivot.add(ear);
      }
    }

    // Antlers (Only for Buck! Does and Fawns have graceful, sleek heads)
    if (this.isBuck && !stocky && !isPronghorn) {
      for (const side of [-1, 1]) {
        const antlerGroup = new THREE.Group();
        antlerGroup.position.set(side * 0.065, 0.15, 0.01);
        if (isElk) antlerGroup.scale.set(1.3, 1.45, 1.3);

        // Main sweeping beam
        const mainBeam = new THREE.CylinderGeometry(0.020, 0.030, 0.46, 5);
        mainBeam.translate(0, 0.23, 0);
        mainBeam.rotateZ(side * -0.32);
        mainBeam.rotateX(0.18);
        const mBeamMesh = new THREE.Mesh(mainBeam, antlerMat);
        mBeamMesh.castShadow = true;
        antlerGroup.add(mBeamMesh);

        // Brow tine
        const browTine = new THREE.CylinderGeometry(0.011, 0.018, 0.17, 5);
        browTine.translate(0, 0.085, 0);
        browTine.rotateX(0.8);
        const bTineMesh = new THREE.Mesh(browTine, antlerMat);
        bTineMesh.position.set(side * 0.035, 0.13, 0.05);
        antlerGroup.add(bTineMesh);

        // Crown fork tine
        const forkTine = new THREE.CylinderGeometry(0.011, 0.016, 0.18, 5);
        forkTine.translate(0, 0.09, 0);
        forkTine.rotateZ(side * -0.55);
        const fTineMesh = new THREE.Mesh(forkTine, antlerMat);
        fTineMesh.position.set(side * 0.11, 0.34, 0.03);
        antlerGroup.add(fTineMesh);

        if (isElk) {
          // Extra tines for a bigger, branching elk rack
          for (const [yy, rot] of [[0.2, 0.7], [0.3, 0.45]] as [number, number][]) {
            const tine = new THREE.CylinderGeometry(0.010, 0.016, 0.20, 5);
            tine.translate(0, 0.10, 0);
            tine.rotateZ(side * -rot);
            const tm = new THREE.Mesh(tine, antlerMat);
            tm.position.set(side * (0.05 + yy * 0.18), yy, 0.02);
            antlerGroup.add(tm);
          }
        }

        this.headPivot.add(antlerGroup);
      }
    }

    if (isHorse) {
      // a dark mane along the neck and a forelock; the tail is dark too
      const darkMat = new THREE.MeshLambertMaterial({ color: this.isBuck ? 0x1d140e : 0x2c1d14 });
      const mane = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.52, 0.16), darkMat);
      mane.position.set(0, 0.2, -0.06);
      mane.rotation.x = -0.3;
      this.neckPivot.add(mane);
      const fore = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.07), darkMat);
      fore.position.set(0, 0.12, 0.02);
      this.headPivot.add(fore);
    }

    if (isPronghorn) {
      // Black horns: bucks have tall horns with a forward prong (up to a foot long); does only small straight spikes.
      const hornMat = new THREE.MeshLambertMaterial({ color: 0x231d18 });
      const blackMat = new THREE.MeshLambertMaterial({ color: 0x1b1613 });
      const h = this.isBuck ? 0.34 : 0.1;
      for (const side of [-1, 1]) {
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(this.isBuck ? 0.02 : 0.014, this.isBuck ? 0.032 : 0.022, h, 6), hornMat);
        shaft.geometry.translate(0, h / 2, 0);
        shaft.position.set(side * 0.07, 0.14, 0.0);
        shaft.rotation.z = side * -0.12;
        shaft.rotation.x = -0.12;
        this.headPivot.add(shaft);
        if (this.isBuck) {
          const prong = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.12, 5), hornMat);
          prong.geometry.translate(0, 0.06, 0);
          prong.position.set(side * 0.075, 0.27, 0.0);
          prong.rotation.x = 0.9; // splits forward
          this.headPivot.add(prong);
          // black cheek patch on the buck
          const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.09, 0.10), blackMat);
          cheek.position.set(side * 0.105, -0.01, 0.12);
          this.headPivot.add(cheek);
        }
      }
    }

    if (isSheep) {
      const hornMat = new THREE.MeshLambertMaterial({ color: this.isBuck ? 0xb5a07c : 0x3f352b });
      const ram = this.isBuck;
      const R = ram ? 0.2 : 0.11;
      const tube = ram ? 0.052 : 0.02;
      const arc = Math.PI * (ram ? 1.75 : 0.8);
      for (const side of [-1, 1]) {
        // an arc in the up-back-down-forward plane: starts at the head, sweeps up and back, then curls down and forward
        const hornGeo = new THREE.TorusGeometry(R, tube, 6, 20, arc);
        hornGeo.rotateZ(Math.PI - arc);
        hornGeo.rotateY(Math.PI / 2);
        const horn = new THREE.Mesh(hornGeo, hornMat);
        horn.position.set(side * 0.1, 0.12, ram ? -R + 0.03 : -R + 0.02);
        horn.rotation.z = side * -0.3; // flare outward
        horn.castShadow = true;
        this.headPivot.add(horn);
      }
    }

    if (isBison) {
      // Shaggy dark shoulder hump and mane, short curved horns, beard and a tufted tail
      const dark = new THREE.MeshLambertMaterial({ color: 0x2b1e15 });
      const hornMat = new THREE.MeshLambertMaterial({ color: 0x1d1814 });
      const humpGeo = new THREE.SphereGeometry(0.40, 8, 6);
      humpGeo.scale(1.05, 0.85, 1.15);
      const hump = new THREE.Mesh(humpGeo, dark);
      hump.position.set(0, 0.34, 0.30);
      hump.castShadow = true;
      this.bodyMesh.add(hump);
      const maneGeo = new THREE.SphereGeometry(0.34, 8, 6);
      maneGeo.scale(1.0, 1.05, 1.0);
      const mane = new THREE.Mesh(maneGeo, dark);
      mane.position.set(0, 0.08, 0.28);
      this.neckPivot.add(mane);
      const beard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.30, 0.12), dark);
      beard.position.set(0, -0.12, 0.13);
      this.headPivot.add(beard);
      for (const side of [-1, 1]) {
        const hornGeo = new THREE.ConeGeometry(0.045, 0.30, 6);
        hornGeo.translate(0, 0.15, 0);
        const horn = new THREE.Mesh(hornGeo, hornMat);
        horn.position.set(side * 0.14, 0.12, 0.02);
        horn.rotation.z = side * -0.9;
        this.headPivot.add(horn);
      }
      // lighter, shorter-haired rear half
      const rearGeo = new THREE.CylinderGeometry(0.31, 0.33, 0.62, 8);
      rearGeo.rotateX(Math.PI / 2);
      const rear = new THREE.Mesh(rearGeo, new THREE.MeshLambertMaterial({ color: 0x6a4d34 }));
      rear.position.set(0, -0.02, -0.34);
      this.bodyMesh.add(rear);
    }

    this.neckPivot.add(this.headPivot);
    this.bodyMesh.add(this.neckPivot);

    // 4. Tail (flags high when running)
    this.tailPivot = new THREE.Group();
    this.tailPivot.position.set(0, 0.12, -0.60);
    this.tailPivot.rotation.x = -1.2;
    if (isElk) this.tailPivot.scale.set(0.5, 0.5, 0.5);
    if (isBear) this.tailPivot.scale.set(0.4, 0.35, 0.4);
    if (isBison) this.tailPivot.scale.set(0.55, 0.9, 0.55);
    if (isSheep) this.tailPivot.scale.set(0.35, 0.3, 0.35);
    if (isPronghorn) this.tailPivot.scale.set(0.3, 0.3, 0.3);
    if (isFox) this.tailPivot.scale.set(2.2, 3.0, 2.2); // a long, bushy tail
    if (isCoyote) this.tailPivot.scale.set(2.0, 3.2, 2.0); // a bushy tail carried low
    if (isCat) this.tailPivot.scale.set(1.3, 4.2, 1.3); // a long, heavy tail
    if (isHare) this.tailPivot.scale.set(0.6, 0.5, 0.6);
    if (isHorse) {
      this.tailPivot.scale.set(1.5, 2.6, 1.5); // a long, hanging tail, dark like the mane
      const tailMat = new THREE.MeshLambertMaterial({ color: this.isBuck ? 0x1d140e : 0x2c1d14 });
      this.tailPivot.traverse(o => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = tailMat; });
    }
    if (isPD) this.tailPivot.scale.set(0.5, 0.6, 0.5);

    const tailGeo = new THREE.BoxGeometry(0.11, 0.30, 0.08);
    tailGeo.translate(0, -0.13, 0);
    const tailMesh = new THREE.Mesh(tailGeo, bellyMat); // white underside
    this.tailPivot.add(tailMesh);
    this.bodyMesh.add(this.tailPivot);

    // 5. Four articulated legs
    const createLeg = (isFront: boolean, isLeft: boolean): THREE.Group => {
      const hipGroup = new THREE.Group();
      const zOffset = isFront ? 0.40 : -0.44;
      const xOffset = (isLeft ? -1 : 1) * (stocky ? 0.27 : 0.21);
      hipGroup.position.set(xOffset, this.bodyBaseY, zOffset);

      const upperH = stocky ? 0.30 : 0.58;
      const upperGeo = stocky ? new THREE.CylinderGeometry(0.115, 0.085, upperH, 6) : new THREE.CylinderGeometry(0.065, 0.048, upperH, 6);
      upperGeo.translate(0, -upperH / 2, 0);
      const upperMesh = new THREE.Mesh(upperGeo, furMat);
      upperMesh.castShadow = true;
      hipGroup.add(upperMesh);

      const lowerH = stocky ? 0.28 : 0.58;
      const lowerGeo = stocky ? new THREE.CylinderGeometry(0.075, 0.062, lowerH, 6) : new THREE.CylinderGeometry(0.042, 0.032, lowerH, 6);
      lowerGeo.translate(0, -lowerH / 2, 0);
      const lowerMesh = new THREE.Mesh(lowerGeo, furMat);
      lowerMesh.position.set(0, -upperH, 0);
      lowerMesh.castShadow = true;
      hipGroup.add(lowerMesh);

      const hoofGeo = stocky ? new THREE.BoxGeometry(0.13, 0.08, 0.17) : new THREE.BoxGeometry(0.075, 0.08, 0.10);
      hoofGeo.translate(0, -0.04, 0.02);
      const hoofMesh = new THREE.Mesh(hoofGeo, hoofMat);
      hoofMesh.position.set(0, -upperH - lowerH, 0);
      hipGroup.add(hoofMesh);

      return hipGroup;
    };

    this.legFLPivot = createLeg(true, true);
    this.legFRPivot = createLeg(true, false);
    this.legBLPivot = createLeg(false, true);
    this.legBRPivot = createLeg(false, false);

    root.add(this.legFLPivot);
    root.add(this.legFRPivot);
    root.add(this.legBLPivot);
    root.add(this.legBRPivot);

    this.group.add(root);
  }

  private pickNextState(): void {
    if (this.state === 'FLEE') {
      // After sprinting away, stop, listen briefly, then resume feeding
      this.state = 'ALERT';
      this.stateTimer = 2.5;
      return;
    }

    if (this.state === 'ALERT') {
      // Calmed down: back to peaceful grazing
      this.state = 'FEED';
      this.stateTimer = 7.0 + Math.random() * 8.0;
      return;
    }

    const roll = Math.random();
    // Season shifts how often deer wander (winter: conserve energy, autumn: restless)
    const wander = this.isBear ? 0.18 : this.isBurrower ? 0.12 : getSeasonDef().deer.wanderChance;
    const idleEnd = 1 - wander;
    if (roll < 0.70) {
      // Primary state: feeding / nibbling grass
      this.state = 'FEED';
      this.stateTimer = 7.0 + Math.random() * 8.0;
    } else if (roll < idleEnd) {
      // Standing calmly, looking around meadow
      this.state = 'IDLE';
      this.stateTimer = 3.5 + Math.random() * 4.0;
    } else {
      // Meander to another grass patch
      this.state = 'WANDER';
      this.stateTimer = 4.0 + Math.random() * 5.0;
      const angle = Math.random() * Math.PI * 2;
      const dist = (this.isBear ? 4.0 : this.isBurrower ? 1.0 : 3.0) + Math.random() * (this.isBear ? 9.0 : this.isBurrower ? 3.0 : 6.0);
      const tx = this.homePos.x + Math.cos(angle) * dist;
      const tz = this.homePos.y + Math.sin(angle) * dist;
      if (getRiverDistance(tx, tz) > 7.0 && getDistanceToTrail(tx, tz) > 1.8) {
        this.targetPos.set(tx, tz);
      }
    }
  }

  public update(dt: number, playerPos: THREE.Vector3, isPlayerSprinting: boolean, isPlayerCrouching: boolean): void {
    const distToPlayer = Math.hypot(this.pos.x - playerPos.x, this.pos.z - playerPos.z);

    // Prairie dogs dive down their burrow when something comes close, and pop up again later
    if (this.isBurrower) {
      if (this.hideTimer > 0) {
        this.hideTimer -= dt;
        if (this.hideTimer <= 0 && distToPlayer > 14) {
          this.hideTimer = 0;
          this.group.visible = true;
          this.state = 'ALERT';
          this.stateTimer = 4.0;
        } else if (this.hideTimer <= 0) {
          this.hideTimer = 3.0; // still too close: stay down a little longer
        }
        return;
      }
      if (this.state === 'FLEE' && Math.hypot(this.pos.x - this.homePos.x, this.pos.z - this.homePos.y) < 0.9) {
        this.hideTimer = 7.0 + Math.random() * 7.0;
        this.group.visible = false;
        return;
      }
    }

    if (this.isBear) {
      this.updateBearBehavior(dt, playerPos, isPlayerSprinting, isPlayerCrouching, distToPlayer);
    } else {
      // Realistic National Park tolerance:
      // When visitors are on trails or walking quietly, deer tolerate people down to 3.8m (2.2m if crouching!)
      // Only if the player sprints / rushes right at them do they get startled.
      // Elk are bigger and tougher: they notice you from farther away and only bolt when really crowded.
      const skittish = this.isPronghorn || this.isFox || this.isHare || this.isCoyote;
      const fleeDistance = this.isBurrower
        ? (isPlayerSprinting ? 12.0 : isPlayerCrouching ? 3.5 : 7.0)
        : this.isCat
        ? (isPlayerSprinting ? 40.0 : isPlayerCrouching ? 14.0 : 30.0) // a mountain lion avoids people long before you get close
        : skittish
        ? (isPlayerSprinting ? 22.0 : isPlayerCrouching ? 6.0 : this.isHare ? 9.0 : 14.0) // pronghorn, kit fox and jackrabbit are shy and bolt early
        : this.isHerd
        ? (isPlayerSprinting ? 14.0 : isPlayerCrouching ? 5.0 : 8.0)
        : (isPlayerSprinting ? 10.0 : isPlayerCrouching ? 2.2 : 3.8);
      const baseAlert = this.isBurrower
        ? (isPlayerSprinting ? 26.0 : isPlayerCrouching ? 9.0 : 16.0)
        : this.isCat
        ? (isPlayerSprinting ? 70.0 : isPlayerCrouching ? 24.0 : 50.0)
        : skittish
        ? (isPlayerSprinting ? 40.0 : isPlayerCrouching ? 14.0 : 26.0)
        : this.isHerd
        ? (isPlayerSprinting ? 32.0 : isPlayerCrouching ? 14.0 : 22.0)
        : (isPlayerSprinting ? 18.0 : isPlayerCrouching ? 4.5 : 7.5);
      const alertDistance = baseAlert * getSeasonDef().deer.alertMult;

      if (distToPlayer < fleeDistance) {
        if (this.state !== 'FLEE') {
          this.state = 'FLEE';
          this.stateTimer = 3.8;
          const fleeAngle = Math.atan2(this.pos.z - playerPos.z, this.pos.x - playerPos.x) + (Math.random() - 0.5) * 0.4;
          const fleeDist = (this.isElk ? 24.0 : this.isBison ? 14.0 : this.isPronghorn ? 30.0 : this.isFox ? 22.0 : this.isHare ? 18.0 : this.isCoyote ? 24.0 : this.isCat ? 40.0 : 16.0) + Math.random() * 8.0;
          this.targetPos.set(this.pos.x + Math.cos(fleeAngle) * fleeDist, this.pos.z + Math.sin(fleeAngle) * fleeDist);
          // Prairie dogs run back to their burrow and dive in
          if (this.isBurrower) this.targetPos.copy(this.homePos);
        }
      } else if (distToPlayer < alertDistance && this.state !== 'FLEE') {
        if (this.state !== 'ALERT') {
          this.state = 'ALERT';
          this.stateTimer = 3.0;
        }
        // Turn calmly towards player to watch
        const targetLookYaw = Math.atan2(playerPos.x - this.pos.x, playerPos.z - this.pos.z);
        this.yaw += (targetLookYaw - this.yaw) * 0.06;
      } else {
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.pickNextState();
        }
      }
    }

    // Movement
    let moveSpeed = 0;
    if (this.state === 'WANDER') {
      moveSpeed = this.isBear ? 1.2 : this.isHerd ? 1.0 : 1.1;
    } else if (this.state === 'APPROACH') {
      moveSpeed = 1.5;
    } else if (this.state === 'FLEE') {
      moveSpeed = this.isBear ? 5.5 : this.isBison ? 6.0 : this.isElk ? 7.5 : this.isPronghorn ? 9.5 : this.isHorse ? 8.5 : this.isFox ? 8.0 : this.isHare ? 11.0 : this.isCoyote ? 9.0 : this.isCat ? 10.0 : 6.5; // pronghorn: the fastest animal here
    }

    if (moveSpeed > 0) {
      const dx = this.targetPos.x - this.pos.x;
      const dz = this.targetPos.y - this.pos.z;
      const distToTarget = Math.hypot(dx, dz);

      if (distToTarget > 0.6) {
        // jackrabbits bound away on a zigzag course (NPS)
        const zig = this.isHare && this.state === 'FLEE' ? Math.sin(this.walkPhase * 0.7) * 0.65 : 0;
        const targetYaw = Math.atan2(dx, dz) + zig;
        let diff = (targetYaw - this.yaw) % (Math.PI * 2);
        if (diff > Math.PI) diff -= Math.PI * 2;
        if (diff < -Math.PI) diff += Math.PI * 2;
        this.yaw += diff * Math.min(1.0, 7.0 * dt);

        const moveStep = Math.min(moveSpeed * dt, distToTarget);
        this.pos.x += Math.sin(this.yaw) * moveStep;
        this.pos.z += Math.cos(this.yaw) * moveStep;

        pushOutOfTrees(this.pos);
        pushOutOfRocks(this.pos);

        this.walkPhase += dt * (moveSpeed * 3.8);
      } else {
        if (this.isBurrower && this.state === 'FLEE') {
          // reached its burrow: dive in and stay down for a while
          this.hideTimer = 7.0 + Math.random() * 7.0;
          this.group.visible = false;
          return;
        }
        this.state = 'FEED';
        this.stateTimer = 7.0 + Math.random() * 6.0;
      }
    }

    const targetY = heightAt(this.pos.x, this.pos.z);
    this.pos.y += (targetY - this.pos.y) * 0.2;

    this.updatePosition();
    this.updateAnimation(dt, moveSpeed);
  }

  /**
   * Black bear behaviour (Task 16). Bears are never hostile: they never chase or attack.
   * A curious bear may walk toward you. The responsible reaction (from the park's own guidance) is to
   * face it and back away slowly, creating space for it to pass. Running is the wrong reaction.
   */
  private updateBearBehavior(
    dt: number,
    playerPos: THREE.Vector3,
    isPlayerSprinting: boolean,
    isPlayerCrouching: boolean,
    d: number
  ): void {
    const season = getSeasonDef().bear;
    this.approachCooldown = Math.max(0, this.approachCooldown - dt);
    const alertDistance = isPlayerSprinting ? 40 : isPlayerCrouching ? 18 : 30;
    const fleeDistance = isPlayerSprinting ? 22 : isPlayerCrouching ? 6 : 10;
    const lookYaw = Math.atan2(playerPos.x - this.pos.x, playerPos.z - this.pos.z);

    if (this.state === 'APPROACH') {
      this.approachTimer -= dt;
      this.minApproachDist = Math.min(this.minApproachDist, d);
      this.targetPos.set(playerPos.x, playerPos.z);
      if (isPlayerSprinting && d < 60) {
        // Running is the wrong reaction. The bear does not chase, it just stops and watches.
        this.runEvents++;
        this.state = 'ALERT';
        this.stateTimer = 4;
        this.approachCooldown = 60;
      } else if (d - this.minApproachDist >= 10) {
        // The player calmly backed away, so the bear loses interest and goes back to feeding
        this.retreatEvents++;
        this.state = 'ALERT';
        this.stateTimer = 2.5;
        this.approachCooldown = 90;
      } else if (d <= 12 || this.approachTimer <= 0) {
        // It reached a respectful distance and stops to look (it was passing by)
        this.state = 'ALERT';
        this.stateTimer = 4;
        this.approachCooldown = 60;
      }
      return;
    }

    if (d < fleeDistance && this.state !== 'FLEE') {
      this.state = 'FLEE';
      this.stateTimer = 3.8;
      const fleeAngle = Math.atan2(this.pos.z - playerPos.z, this.pos.x - playerPos.x) + (Math.random() - 0.5) * 0.4;
      const fleeDist = 20 + Math.random() * 8;
      this.targetPos.set(this.pos.x + Math.cos(fleeAngle) * fleeDist, this.pos.z + Math.sin(fleeAngle) * fleeDist);
    } else if (d < alertDistance && this.state !== 'FLEE') {
      if (this.state !== 'ALERT') {
        this.state = 'ALERT';
        this.stateTimer = 3.0;
      }
      this.yaw += (lookYaw - this.yaw) * 0.06;
    } else {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) this.pickNextState();
      // A curious bear sometimes walks toward you
      if (
        season.active &&
        this.approachCooldown <= 0 &&
        (this.state === 'FEED' || this.state === 'IDLE' || this.state === 'WANDER') &&
        d >= 25 &&
        d <= 70 &&
        !isPlayerSprinting &&
        Math.random() < dt * 0.08 * season.approachMult
      ) {
        this.state = 'APPROACH';
        this.approachTimer = 18;
        this.minApproachDist = d;
        this.targetPos.set(playerPos.x, playerPos.z);
      }
    }
  }

  private updatePosition(): void {
    this.group.position.copy(this.pos);
    this.group.rotation.y = this.yaw;
  }

  private updateAnimation(dt: number, moveSpeed: number): void {
    const t = performance.now() / 1000;

    // 1. Articulated Legs Animation
    if (moveSpeed > 0) {
      const legAmp = moveSpeed > 4.0 ? 0.65 : 0.36;
      const sinW = Math.sin(this.walkPhase);
      const cosW = Math.cos(this.walkPhase);

      this.legFLPivot.rotation.x = sinW * legAmp;
      this.legBRPivot.rotation.x = -sinW * legAmp;
      this.legFRPivot.rotation.x = -cosW * legAmp;
      this.legBLPivot.rotation.x = cosW * legAmp;

      const bounce = Math.abs(Math.sin(this.walkPhase * 2)) * (moveSpeed > 4.0 ? 0.16 : 0.04);
      this.bodyMesh.position.y = this.bodyBaseY + bounce;
    } else {
      this.legFLPivot.rotation.x *= 0.85;
      this.legFRPivot.rotation.x *= 0.85;
      this.legBLPivot.rotation.x *= 0.85;
      this.legBRPivot.rotation.x *= 0.85;
      this.bodyMesh.position.y = this.bodyBaseY + Math.sin(t * 1.8) * 0.015;
    }

    // Bears sometimes rise onto their hind legs to look and smell. This is curiosity, not aggression.
    if (this.isBear || this.isBurrower) {
      // Prairie dogs stand up tall like sentinels when something draws their attention
      const rise = this.state === 'ALERT' ? (this.isBurrower ? -1.0 : -0.55) : 0;
      this.bodyMesh.rotation.x += (rise - this.bodyMesh.rotation.x) * 0.06;
    }

    // 2. Realistic Ground-Grazing, Chewing & Listening Motions
    if (this.state === 'FEED') {
      // Low neck lowered all the way down to reach grass blades (angle down-forward)
      const targetNeckRot = 1.35 + Math.sin(t * 1.4) * 0.08;
      this.neckPivot.rotation.x += (targetNeckRot - this.neckPivot.rotation.x) * 0.10;

      // Head tilted level with the meadow turf
      this.chewPhase += dt * 6.5;
      const chewMouth = Math.sin(this.chewPhase) * 0.09;
      const headBob = Math.sin(this.chewPhase * 0.5) * 0.06;

      this.headPivot.rotation.x += (-1.05 + headBob - this.headPivot.rotation.x) * 0.12;

      // Active muzzle chewing motion
      this.muzzlePivot.rotation.x = chewMouth;
      this.muzzlePivot.position.y = -0.04 + chewMouth * 0.02;

      // Casual tail swish to shoo flies
      this.tailFlickPhase += dt;
      this.tailPivot.rotation.z = Math.sin(this.tailFlickPhase * 2.5) * 0.25;
      this.tailPivot.rotation.x = -1.2;

      // Relaxed ears listening to ambient meadow
      this.leftEar.rotation.z = 0.55 + Math.sin(t * 2.2) * 0.08;
      this.rightEar.rotation.z = -0.55 - Math.sin(t * 2.4) * 0.08;
    } else if (this.state === 'ALERT') {
      // Freeze, head held high, ears cocked towards viewer
      this.neckPivot.rotation.x += (0.15 - this.neckPivot.rotation.x) * 0.15;
      this.headPivot.rotation.x += (-0.12 - this.headPivot.rotation.x) * 0.15;
      this.muzzlePivot.rotation.x = 0;

      this.leftEar.rotation.z = 0.30 + Math.sin(t * 8.0) * 0.06;
      this.rightEar.rotation.z = -0.30 - Math.sin(t * 7.5) * 0.06;
      this.tailPivot.rotation.z = 0;
      this.tailPivot.rotation.x += (1.35 - this.tailPivot.rotation.x) * 0.2; // white tail flags up
    } else if (this.state === 'FLEE') {
      // Aerodynamic running posture, head forward
      this.neckPivot.rotation.x += (0.55 - this.neckPivot.rotation.x) * 0.15;
      this.headPivot.rotation.x += (-0.45 - this.headPivot.rotation.x) * 0.15;
      this.muzzlePivot.rotation.x = 0;

      this.tailPivot.rotation.z = 0;
      this.tailPivot.rotation.x += (1.45 - this.tailPivot.rotation.x) * 0.25; // full white tail alarm flag
    } else {
      // IDLE: standing calmly, looking around
      this.neckPivot.rotation.x += (0.42 - this.neckPivot.rotation.x) * 0.06;
      this.headPivot.rotation.x += (-0.35 - this.headPivot.rotation.x) * 0.06;
      this.muzzlePivot.rotation.x = Math.sin(t * 2.0) * 0.02; // slow cud chewing

      this.tailPivot.rotation.z = 0;
      this.tailPivot.rotation.x += (-1.15 - this.tailPivot.rotation.x) * 0.08;

      this.earTwitchPhase += dt;
      if (Math.sin(this.earTwitchPhase * 2.5) > 0.8) {
        this.leftEar.rotation.x = -0.25 + Math.sin(t * 16.0) * 0.2;
      }
    }
  }
}
