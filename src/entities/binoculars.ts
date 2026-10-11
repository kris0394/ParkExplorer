/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { DeerEntity } from './deer.ts';
import { checkSightline } from './sightline.ts';

export interface SightingRecord {
  id: string;
  species: string;
  detail: string;
  distance: number;
  /** Safe viewing distance for this animal (m). */
  safeDistance: number;
  responsible: boolean;
  time: number;
}

export interface BinocularTarget {
  id: string;
  species: string;
  detail: string;
  distance: number;
  condition: 'calm' | 'alert' | 'fleeing';
  progress: number; // 0 to 1
  identified: boolean;
  tooFar: boolean;
  tooClose: boolean;
  /** Safe viewing distance for this animal (m). */
  safeDistance: number;
}

export const BINOCULAR_RULES = {
  maxRange: 110,
  searchRange: 220,
  comfortRange: 23, // default only; each animal has its own safeDistanceM
  identifySeconds: 2.8,
  baseZoom: 4,
  reticleRadius: 0.18,
};

export class BinocularsSystem {
  public sightings: SightingRecord[] = [];
  public known = new Set<string>();
  public speciesSeen = new Set<string>();

  private candidateId: string | null = null;
  private progress = 0;
  private disturbed = false;
  private clock = 0;

  private forward = new THREE.Vector3();
  private camPos = new THREE.Vector3();
  private toAnimal = new THREE.Vector3();

  constructor(
    private onSighting: (sighting: SightingRecord, isNewSpecies: boolean) => void
  ) {}

  public reset(): void {
    this.candidateId = null;
    this.progress = 0;
    this.disturbed = false;
  }

  public update(
    dt: number,
    camera: THREE.PerspectiveCamera,
    animals: DeerEntity[],
    active: boolean,
    zoomFactor: number,
    identificationSpeedMultiplier: number = 1.0
  ): BinocularTarget | null {
    if (!active) {
      this.reset();
      return null;
    }

    this.clock += dt;
    camera.getWorldDirection(this.forward);
    camera.getWorldPosition(this.camPos);

    const fovRad = (camera.fov * Math.PI) / 360;
    const halfAngle = Math.atan(BINOCULAR_RULES.reticleRadius * Math.tan(fovRad));

    let bestAnimal: DeerEntity | null = null;
    let minAngle = Infinity;
    let bestDist = 0;

    for (const a of animals) {
      const visualH = a.pos.y + (a.isElk ? 1.6 : a.isFawn ? 0.75 : 1.1);
      this.toAnimal.set(a.pos.x - this.camPos.x, visualH - this.camPos.y, a.pos.z - this.camPos.z);
      const dist = this.toAnimal.length();
      if (dist > BINOCULAR_RULES.searchRange || dist < 0.5) continue;

      this.toAnimal.divideScalar(dist);
      const angle = Math.acos(Math.min(1, Math.max(-1, this.forward.dot(this.toAnimal))));
      if (angle > halfAngle) continue;

      if (angle < minAngle) {
        if (!checkSightline(this.camPos.x, this.camPos.y, this.camPos.z, a.pos.x, visualH, a.pos.z)) {
          continue;
        }
        bestAnimal = a;
        minAngle = angle;
        bestDist = dist;
      }
    }

    if (!bestAnimal) {
      this.candidateId = null;
      this.progress = 0;
      this.disturbed = false;
      return null;
    }

    if (bestAnimal.id !== this.candidateId) {
      this.candidateId = bestAnimal.id;
      this.progress = 0;
      this.disturbed = false;
    }

    const cond: 'calm' | 'alert' | 'fleeing' =
      bestAnimal.state === 'FLEE' ? 'fleeing' : bestAnimal.state === 'ALERT' ? 'alert' : 'calm';

    const isTooFar = bestDist > BINOCULAR_RULES.maxRange;
    const isTooClose = bestDist < bestAnimal.safeDistanceM;
    let isIdentified = this.known.has(bestAnimal.id);

    if (cond !== 'calm') {
      this.disturbed = true;
    }

    if (!isIdentified && !isTooFar && cond !== 'fleeing') {
      const zoomMul = Math.min(1.6, Math.max(0.75, zoomFactor / BINOCULAR_RULES.baseZoom));
      const alertSlowdown = cond === 'alert' ? 0.35 : 1.0;
      const rate = (dt / BINOCULAR_RULES.identifySeconds) * zoomMul * alertSlowdown * identificationSpeedMultiplier;
      this.progress += rate;

      if (this.progress >= 1.0) {
        this.progress = 1.0;
        isIdentified = true;
        this.known.add(bestAnimal.id);

        const isNew = !this.speciesSeen.has(bestAnimal.speciesName);
        this.speciesSeen.add(bestAnimal.speciesName);

        const record: SightingRecord = {
          id: bestAnimal.id,
          species: bestAnimal.speciesName,
          detail: bestAnimal.detailLabel,
          distance: bestDist,
          safeDistance: bestAnimal.safeDistanceM,
          responsible: !this.disturbed && !isTooClose,
          time: this.clock,
        };
        this.sightings.push(record);
        this.onSighting(record, isNew);
      }
    } else if (!isIdentified && cond === 'fleeing') {
      this.progress = Math.max(0, this.progress - dt * 0.8);
    }

    return {
      id: bestAnimal.id,
      species: bestAnimal.speciesName,
      detail: bestAnimal.detailLabel,
      distance: bestDist,
      condition: cond,
      progress: isIdentified ? 1.0 : this.progress,
      identified: isIdentified,
      tooFar: isTooFar,
      tooClose: isTooClose,
      safeDistance: bestAnimal.safeDistanceM,
    };
  }
}
