/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { DeerEntity } from './deer.ts';
import { getActivePark } from '../data/parks.ts';

export class WildlifeManager {
  public group: THREE.Group;
  public deerList: DeerEntity[] = [];

  /** Task 8: exposed so the world can warn about distance and startled animals. */
  public nearestDist = Infinity;
  public nearestState = 'FEED';
  public totalStartles = 0;
  private prevStates = new Map<string, string>();

  private observationTimer = 0;
  private hasRewardedObservation = false;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.group.name = 'wildlifeGroup';
    scene.add(this.group);
    this.spawnWildlife();
  }

  public spawnWildlife(): void {
    // Clear any existing
    this.deerList.forEach(d => this.group.remove(d.group));
    this.deerList = [];

    const park = getActivePark();

    // Spawn positions come from the park's data (park.wildlife.spawns)
    const configs = park.wildlife.spawns.filter(sp => sp.species === 'white-tailed-deer');

    configs.forEach((cfg, idx) => {
      const deer = new DeerEntity({
        id: `deer_${idx}`,
        isBuck: cfg.isBuck,
        isFawn: cfg.isFawn,
        spawnX: cfg.x,
        spawnZ: cfg.z,
        roamRadius: cfg.roamRadius,
      });
      this.deerList.push(deer);
      this.group.add(deer.group);
    });
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    isSprinting: boolean,
    isCrouching: boolean,
    isLookingThroughTelescope: boolean,
    onObservationToast: (msg: string) => void
  ): void {
    let nearestDist = Infinity;
    let nearestState = 'FEED';
    let nearestIsDoe = false;

    for (const deer of this.deerList) {
      deer.update(dt, playerPos, isSprinting, isCrouching);
      const before = this.prevStates.get(deer.id);
      if (deer.state === 'FLEE' && before !== undefined && before !== 'FLEE') {
        this.totalStartles += 1;
      }
      this.prevStates.set(deer.id, deer.state);
      const d = Math.hypot(deer.pos.x - playerPos.x, deer.pos.z - playerPos.z);
      if (d < nearestDist) {
        nearestDist = d;
        nearestState = deer.state;
        nearestIsDoe = !deer.isBuck;
      }
    }

    this.nearestDist = nearestDist;
    this.nearestState = nearestState;

    // Responsible Observation Reward
    const isObservingCalmly = (nearestDist >= 5.0 && nearestDist <= 32.0 && nearestState === 'FEED') || isLookingThroughTelescope;

    if (isObservingCalmly) {
      this.observationTimer += dt;
      if (this.observationTimer > 3.0 && !this.hasRewardedObservation) {
        this.hasRewardedObservation = true;
        const deerType = nearestIsDoe ? 'White-Tailed Doe' : 'White-Tailed Buck';
        onObservationToast(
          isLookingThroughTelescope
            ? 'Telescope Sighting: Deer spotted grazing in the valley meadow'
            : `Quiet Observer: Watching ${deerType} nibble peacefully`
        );
      }
    } else {
      this.observationTimer = Math.max(0, this.observationTimer - dt * 0.5);
    }
  }

  public dispose(): void {
    this.deerList.forEach(d => this.group.remove(d.group));
    this.deerList = [];
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}
