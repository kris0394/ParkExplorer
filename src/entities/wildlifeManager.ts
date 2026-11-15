/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { DeerEntity } from './deer.ts';
import { getActivePark } from '../data/parks.ts';
import { getSafeDistanceM } from '../data/species.ts';
import { getSeasonDef } from '../data/seasons.ts';
import { getPrairieDogMounds } from '../data/parkStructure.ts';

export class WildlifeManager {
  public group: THREE.Group;
  public deerList: DeerEntity[] = [];

  /** Task 8: exposed so the world can warn about distance and startled animals. */
  public nearestDist = Infinity;
  public nearestState = 'FEED';
  /** The animal you are most inside the safe distance of (null when you are far enough from all). */
  public nearestViolation: { dist: number; safeDist: number; alert: boolean; species: string } | null = null;
  public totalStartles = 0;
  /** Bears (Task 16): total calm retreats and total times the player ran, and the nearest approaching bear. */
  public bearRetreats = 0;
  public bearRuns = 0;
  public bearApproach: { dist: number } | null = null;
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

    // Spawn positions and species come from the park's data (park.wildlife.spawns)
    park.wildlife.spawns.forEach((cfg, idx) => {
      // Bears are far less active in winter, so none are shown then
      if (cfg.species === 'black-bear' && !getSeasonDef().bear.active) return;
      const prefix = cfg.species === 'elk' ? 'elk' : cfg.species === 'black-bear' ? 'bear' : cfg.species === 'bison' ? 'bison' : cfg.species === 'prairie-dog' ? 'pdog' : cfg.species === 'bighorn-sheep' ? 'sheep' : 'deer';
      const deer = new DeerEntity({
        id: `${prefix}_${idx}`,
        species: cfg.species,
        safeDistanceM: getSafeDistanceM(cfg.species, park),
        isBuck: cfg.isBuck,
        isFawn: cfg.isFawn,
        spawnX: cfg.x,
        spawnZ: cfg.z,
        roamRadius: cfg.roamRadius,
      });
      this.deerList.push(deer);
      this.group.add(deer.group);
    });

    // Task 25: prairie dogs sit on the mounds of the park's prairie dog town
    const town = park.features?.prairieDogTown;
    if (town) {
      const mounds = getPrairieDogMounds(town);
      const dogs = Math.min(mounds.length, town.dogs ?? Math.ceil(mounds.length / 2));
      for (let i = 0; i < dogs; i++) {
        const m = mounds[i * Math.floor(mounds.length / Math.max(1, dogs))] ?? mounds[i];
        const pd = new DeerEntity({
          id: `pdog_town_${i}`,
          species: 'prairie-dog',
          safeDistanceM: getSafeDistanceM('prairie-dog', park),
          isBuck: false,
          spawnX: m.x,
          spawnZ: m.z,
          roamRadius: 3,
        });
        this.deerList.push(pd);
        this.group.add(pd.group);
      }
    }
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
    let nearestSafe = 23;
    let nearestSpeciesName = 'White-tailed Deer';
    let violation: { dist: number; safeDist: number; alert: boolean; species: string } | null = null;
    let worstRatio = Infinity;
    let retreats = 0;
    let runs = 0;
    let approach: { dist: number } | null = null;

    for (const deer of this.deerList) {
      deer.update(dt, playerPos, isSprinting, isCrouching);
      if (deer.isHidden) continue; // a prairie dog down its burrow cannot be disturbed or seen
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
        nearestSafe = deer.safeDistanceM;
        nearestSpeciesName = deer.speciesName;
      }
      if (deer.isBear) {
        retreats += deer.retreatEvents;
        runs += deer.runEvents;
        if (deer.isApproaching && (!approach || d < approach.dist)) approach = { dist: d };
      }
      // Each animal has its own safe distance (deer 23 m, elk 46 m, bear 46 m)
      const ratio = d / deer.safeDistanceM;
      if (ratio < 1 && ratio < worstRatio) {
        worstRatio = ratio;
        violation = {
          dist: d,
          safeDist: deer.safeDistanceM,
          alert: deer.state === 'ALERT' || deer.state === 'FLEE',
          species: deer.speciesName,
        };
      }
    }

    this.nearestDist = nearestDist;
    this.nearestState = nearestState;
    this.nearestViolation = violation;
    this.bearRetreats = retreats;
    this.bearRuns = runs;
    this.bearApproach = approach;

    // Responsible Observation Reward
    const isObservingCalmly =
      (nearestDist >= 5.0 && nearestDist <= nearestSafe * 1.4 && nearestState === 'FEED') || isLookingThroughTelescope;

    if (isObservingCalmly) {
      this.observationTimer += dt;
      if (this.observationTimer > 3.0 && !this.hasRewardedObservation) {
        this.hasRewardedObservation = true;
        const animalType =
          nearestSpeciesName === 'Black Bear'
            ? 'Black Bear'
            : nearestSpeciesName === 'Elk'
            ? nearestIsDoe ? 'Cow Elk' : 'Bull Elk'
            : nearestSpeciesName === 'Bighorn Sheep'
            ? nearestIsDoe ? 'Bighorn Ewe' : 'Bighorn Ram'
            : nearestSpeciesName === 'American Bison'
            ? nearestIsDoe ? 'Cow Bison' : 'Bull Bison'
            : nearestSpeciesName === 'Black-tailed Prairie Dog'
            ? 'Prairie Dog'
            : nearestIsDoe ? 'White-Tailed Doe' : 'White-Tailed Buck';
        onObservationToast(
          isLookingThroughTelescope
            ? 'Telescope Sighting: Wildlife spotted grazing in the valley meadow'
            : `Quiet Observer: Watching ${animalType} graze peacefully`
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
