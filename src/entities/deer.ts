/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { heightAt, getRiverDistance } from '../terrain/riverTerrain.ts';
import { getDistanceToTrail } from './trailMesh.ts';
import { pushOutOfTrees } from './trees.ts';
import { pushOutOfRocks } from './rocks.ts';

export type DeerState = 'IDLE' | 'WANDER' | 'FEED' | 'ALERT' | 'FLEE';

export interface DeerConfig {
  id: string;
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

  get speciesName(): string {
    return 'White-tailed Deer';
  }

  get detailLabel(): string {
    if (this.isFawn) return 'Spotted fawn';
    if (this.isBuck) return 'Adult buck (antlered)';
    return 'Adult doe';
  }

  constructor(config: DeerConfig) {
    this.id = config.id;
    this.isBuck = config.isBuck;
    this.isFawn = Boolean(config.isFawn);
    this.pos = new THREE.Vector3(config.spawnX, heightAt(config.spawnX, config.spawnZ), config.spawnZ);
    this.homePos = new THREE.Vector2(config.spawnX, config.spawnZ);
    this.targetPos = new THREE.Vector2(config.spawnX, config.spawnZ);
    this.roamRadius = config.roamRadius;
    this.yaw = Math.random() * Math.PI * 2;

    this.group = new THREE.Group();
    this.group.name = `deer_${config.id}`;
    this.buildMesh();
    this.updatePosition();

    // Start in peaceful FEED state grazing in the glade
    this.state = 'FEED';
    this.stateTimer = 8.0 + Math.random() * 6.0;
  }

  private buildMesh(): void {
    // Distinct palettes for Buck vs Doe vs Fawn
    const furColor = this.isFawn
      ? 0xc2864c // bright golden fawn
      : this.isBuck
      ? 0x854e2c // deep rich chestnut buck
      : 0xb07548; // sleek warm golden-tan doe

    const furMat = new THREE.MeshLambertMaterial({ color: furColor });
    const bellyMat = new THREE.MeshLambertMaterial({ color: 0xf5eee6 }); // clean white underbelly
    const hoofMat = new THREE.MeshLambertMaterial({ color: 0x1f1b17 });
    const antlerMat = new THREE.MeshStandardMaterial({ color: 0xe0d6c5, roughness: 0.75, metalness: 0.1 });
    const noseMat = new THREE.MeshLambertMaterial({ color: 0x161311 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x060504, roughness: 0.15 });

    const scale = this.isFawn ? 0.65 : this.isBuck ? 1.08 : 0.94;
    const root = new THREE.Group();
    root.scale.set(scale, scale, scale);

    // 1. Torso / Body (barrel with white underbelly)
    const bodyGeo = new THREE.CylinderGeometry(0.30, 0.33, 1.20, 8);
    bodyGeo.rotateX(Math.PI / 2);
    this.bodyMesh = new THREE.Mesh(bodyGeo, furMat);
    this.bodyMesh.position.set(0, 1.15, 0);
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

    // 2. Neck Pivot (at shoulders: x: 0, y: 0.16, z: 0.48)
    this.neckPivot = new THREE.Group();
    this.neckPivot.position.set(0, 0.16, 0.48);

    // Neck cylinder extending forward-upward
    const neckLen = 0.62;
    const neckGeo = new THREE.CylinderGeometry(0.14, 0.21, neckLen, 8);
    neckGeo.translate(0, neckLen / 2, 0);
    const neckMesh = new THREE.Mesh(neckGeo, furMat);
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
    const headGeo = new THREE.BoxGeometry(0.20, 0.20, 0.28);
    headGeo.translate(0, 0.02, 0.08);
    const headMesh = new THREE.Mesh(headGeo, furMat);
    headMesh.castShadow = true;
    this.headPivot.add(headMesh);

    // Muzzle / Snout Pivot (allows chewing articulation)
    this.muzzlePivot = new THREE.Group();
    this.muzzlePivot.position.set(0, -0.04, 0.22);

    const muzzleGeo = new THREE.BoxGeometry(0.12, 0.12, 0.24);
    muzzleGeo.translate(0, 0, 0.10);
    const muzzleMesh = new THREE.Mesh(muzzleGeo, furMat);
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

    // Expressive ears
    const earGeo = new THREE.ConeGeometry(0.062, 0.23, 5);
    earGeo.rotateZ(Math.PI / 2);
    earGeo.translate(0, 0.09, 0);

    this.leftEar = new THREE.Mesh(earGeo, furMat);
    this.leftEar.position.set(-0.09, 0.13, -0.03);
    this.leftEar.rotation.set(-0.25, 0.35, 0.55);
    this.headPivot.add(this.leftEar);

    this.rightEar = new THREE.Mesh(earGeo.clone(), furMat);
    this.rightEar.position.set(0.09, 0.13, -0.03);
    this.rightEar.rotation.set(-0.25, -0.35, -0.55);
    this.headPivot.add(this.rightEar);

    // Antlers (Only for Buck! Does and Fawns have graceful, sleek heads)
    if (this.isBuck) {
      for (const side of [-1, 1]) {
        const antlerGroup = new THREE.Group();
        antlerGroup.position.set(side * 0.065, 0.15, 0.01);

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

        this.headPivot.add(antlerGroup);
      }
    }

    this.neckPivot.add(this.headPivot);
    this.bodyMesh.add(this.neckPivot);

    // 4. Tail (flags high when running)
    this.tailPivot = new THREE.Group();
    this.tailPivot.position.set(0, 0.12, -0.60);
    this.tailPivot.rotation.x = -1.2;

    const tailGeo = new THREE.BoxGeometry(0.11, 0.30, 0.08);
    tailGeo.translate(0, -0.13, 0);
    const tailMesh = new THREE.Mesh(tailGeo, bellyMat); // white underside
    this.tailPivot.add(tailMesh);
    this.bodyMesh.add(this.tailPivot);

    // 5. Four articulated legs
    const createLeg = (isFront: boolean, isLeft: boolean): THREE.Group => {
      const hipGroup = new THREE.Group();
      const zOffset = isFront ? 0.40 : -0.44;
      const xOffset = (isLeft ? -1 : 1) * 0.21;
      hipGroup.position.set(xOffset, 1.15, zOffset);

      const upperH = 0.58;
      const upperGeo = new THREE.CylinderGeometry(0.065, 0.048, upperH, 6);
      upperGeo.translate(0, -upperH / 2, 0);
      const upperMesh = new THREE.Mesh(upperGeo, furMat);
      upperMesh.castShadow = true;
      hipGroup.add(upperMesh);

      const lowerH = 0.58;
      const lowerGeo = new THREE.CylinderGeometry(0.042, 0.032, lowerH, 6);
      lowerGeo.translate(0, -lowerH / 2, 0);
      const lowerMesh = new THREE.Mesh(lowerGeo, furMat);
      lowerMesh.position.set(0, -upperH, 0);
      lowerMesh.castShadow = true;
      hipGroup.add(lowerMesh);

      const hoofGeo = new THREE.BoxGeometry(0.075, 0.08, 0.10);
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
    if (roll < 0.70) {
      // Primary state: feeding / nibbling grass
      this.state = 'FEED';
      this.stateTimer = 7.0 + Math.random() * 8.0;
    } else if (roll < 0.88) {
      // Standing calmly, looking around meadow
      this.state = 'IDLE';
      this.stateTimer = 3.5 + Math.random() * 4.0;
    } else {
      // Meander to another grass patch
      this.state = 'WANDER';
      this.stateTimer = 4.0 + Math.random() * 5.0;
      const angle = Math.random() * Math.PI * 2;
      const dist = 3.0 + Math.random() * 6.0;
      const tx = this.homePos.x + Math.cos(angle) * dist;
      const tz = this.homePos.y + Math.sin(angle) * dist;
      if (getRiverDistance(tx, tz) > 7.0 && getDistanceToTrail(tx, tz) > 1.8) {
        this.targetPos.set(tx, tz);
      }
    }
  }

  public update(dt: number, playerPos: THREE.Vector3, isPlayerSprinting: boolean, isPlayerCrouching: boolean): void {
    const distToPlayer = Math.hypot(this.pos.x - playerPos.x, this.pos.z - playerPos.z);

    // Realistic National Park tolerance:
    // When visitors are on trails or walking quietly, deer tolerate people down to 3.8m (2.2m if crouching!)
    // Only if the player sprints / rushes right at them do they get startled.
    const fleeDistance = isPlayerSprinting ? 10.0 : isPlayerCrouching ? 2.2 : 3.8;
    const alertDistance = isPlayerSprinting ? 18.0 : isPlayerCrouching ? 4.5 : 7.5;

    if (distToPlayer < fleeDistance) {
      if (this.state !== 'FLEE') {
        this.state = 'FLEE';
        this.stateTimer = 3.8;
        const fleeAngle = Math.atan2(this.pos.z - playerPos.z, this.pos.x - playerPos.x) + (Math.random() - 0.5) * 0.4;
        const fleeDist = 16.0 + Math.random() * 8.0;
        this.targetPos.set(this.pos.x + Math.cos(fleeAngle) * fleeDist, this.pos.z + Math.sin(fleeAngle) * fleeDist);
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

    // Movement
    let moveSpeed = 0;
    if (this.state === 'WANDER') {
      moveSpeed = 1.1;
    } else if (this.state === 'FLEE') {
      moveSpeed = 6.5;
    }

    if (moveSpeed > 0) {
      const dx = this.targetPos.x - this.pos.x;
      const dz = this.targetPos.y - this.pos.z;
      const distToTarget = Math.hypot(dx, dz);

      if (distToTarget > 0.6) {
        const targetYaw = Math.atan2(dx, dz);
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
        this.state = 'FEED';
        this.stateTimer = 7.0 + Math.random() * 6.0;
      }
    }

    const targetY = heightAt(this.pos.x, this.pos.z);
    this.pos.y += (targetY - this.pos.y) * 0.2;

    this.updatePosition();
    this.updateAnimation(dt, moveSpeed);
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
      this.bodyMesh.position.y = 1.15 + bounce;
    } else {
      this.legFLPivot.rotation.x *= 0.85;
      this.legFRPivot.rotation.x *= 0.85;
      this.legBLPivot.rotation.x *= 0.85;
      this.legBRPivot.rotation.x *= 0.85;
      this.bodyMesh.position.y = 1.15 + Math.sin(t * 1.8) * 0.015;
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
