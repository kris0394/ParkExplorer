/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { DeerEntity } from './deer.ts';
import { checkSightline } from './sightline.ts';

export type SubjectKind = 'wildlife' | 'landmark' | 'landscape';
export type AnimalCondition = 'calm' | 'alert' | 'fleeing';

export interface FramingTag {
  text: string;
  good: boolean;
}

export interface PhotoScore {
  kind: SubjectKind;
  subjectId: string;
  subject: string;
  detail: string;
  distance: number;
  u: number | null;
  v: number | null;
  condition: AnimalCondition | null;
  responsible: boolean;
  tooClose: boolean;
  score: number; // 0-100
  grade: string; // 'Exceptional' | 'Great' | 'Good' | 'Fair' | 'Poor'
  tags: FramingTag[];
  hints: FramingTag[];
}

export interface ScoredPhoto {
  id: string;
  dataUrl: string;
  kind: SubjectKind;
  subject: string;
  detail: string;
  distance: number;
  score: number;
  grade: string;
  tags: FramingTag[];
  responsible: boolean;
  isNewSubject: boolean;
  parkName: string;
  timeOfDay: string;
  zoom: number;
  takenAt: number;
}

export interface ViewportFrame {
  halfW: number;
  halfH: number;
}

export const PHOTO_RULES = {
  newSubjectBonus: 10,
  newLandmarkBonus: 15,
  tooCloseScoreCap: 40,
  maxPhotos: 24,
  frameAspect: 1.5,
  safeDistance: 23,
};

const THIRDS_INTERSECTIONS: [number, number][] = [
  [1 / 3, 1 / 3],
  [2 / 3, 1 / 3],
  [1 / 3, 2 / 3],
  [2 / 3, 2 / 3],
];

export function getGrade(score: number): string {
  if (score >= 85) return 'Exceptional';
  if (score >= 70) return 'Great';
  if (score >= 50) return 'Good';
  if (score >= 30) return 'Fair';
  return 'Poor';
}

function scoreComposition(u: number, v: number): { score: number; thirds: boolean } {
  let minThirdsDist = Infinity;
  for (const [tx, ty] of THIRDS_INTERSECTIONS) {
    const d = Math.hypot(u - tx, v - ty);
    if (d < minThirdsDist) minThirdsDist = d;
  }
  const thirdsScore = Math.max(0, 1 - minThirdsDist / 0.28);
  const centerScore = Math.max(0, 1 - Math.hypot(u - 0.5, v - 0.5) / 0.28) * 0.8;
  const best = Math.max(thirdsScore, centerScore);
  return { score: best, thirds: thirdsScore >= centerScore && thirdsScore > 0.6 };
}

function scoreSubjectSize(frac: number): number {
  if (frac < 0.03) return 0;
  if (frac < 0.12) return (frac - 0.03) / 0.09;
  if (frac <= 0.55) return 1.0;
  if (frac <= 0.95) return 1.0 - ((frac - 0.55) / 0.4) * 0.5;
  return 0.5;
}

function scoreLighting(timeOfDay: string): number {
  if (timeOfDay === 'dawn' || timeOfDay === 'sunset') return 1.0;
  if (timeOfDay === 'day') return 0.6;
  return 0.5;
}

function scoreSteadiness(moving: boolean, zoom: number, braced: boolean): number {
  const movePenalty = moving ? 0.3 : 0;
  const zoomPenalty = Math.max(0, zoom - 1) * 0.06 * (braced ? 0.35 : 1);
  return Math.min(1, Math.max(0.4, 1 - movePenalty - zoomPenalty + (braced ? 0.05 : 0)));
}

const _proj = new THREE.Vector3();
const _camFwd = new THREE.Vector3();
const _camPos = new THREE.Vector3();

function projectToFrame(
  camera: THREE.PerspectiveCamera,
  frame: ViewportFrame,
  x: number,
  y: number,
  z: number
): { u: number; v: number; ndcY: number } | null {
  camera.getWorldPosition(_camPos);
  camera.getWorldDirection(_camFwd);
  _proj.set(x - _camPos.x, y - _camPos.y, z - _camPos.z);
  if (_proj.dot(_camFwd) <= 0.1) return null;

  _proj.set(x, y, z).project(camera);
  const u = (_proj.x / frame.halfW + 1) / 2;
  const v = (1 - _proj.y / frame.halfH) / 2;
  return { u, v, ndcY: _proj.y };
}

function getAnimalVisualHeight(deer: DeerEntity): number {
  return deer.isFawn ? 0.8 : deer.isBuck ? 1.55 : 1.35;
}

export function evaluateCurrentFraming(opts: {
  camera: THREE.PerspectiveCamera;
  frame: ViewportFrame;
  animals: DeerEntity[];
  landmarks: { id: string; name: string; description: string; x: number; y: number; z: number }[];
  timeOfDay: string;
  zoom: number;
  moving: boolean;
  braced: boolean;
  cameraStabilityBonus?: boolean;
}): PhotoScore {
  const { camera, frame } = opts;
  camera.getWorldPosition(_camPos);
  const cx = _camPos.x;
  const cy = _camPos.y;
  const cz = _camPos.z;

  const lightScore = scoreLighting(opts.timeOfDay);
  let steadyScore = scoreSteadiness(opts.moving, opts.zoom, opts.braced);
  if (opts.cameraStabilityBonus) {
    steadyScore = Math.min(1.0, steadyScore + 0.15);
  }

  // 1. Detect Wildlife
  let bestAnimal: DeerEntity | null = null;
  let bestAnimalWeight = -1;
  let bestAnimalDetails: { u: number; v: number; sizeFrac: number; cutoff: number; dist: number } | null = null;

  for (const a of opts.animals) {
    const h = getAnimalVisualHeight(a);
    const mid = projectToFrame(camera, frame, a.pos.x, a.pos.y + h * 0.55, a.pos.z);
    if (!mid || mid.u < 0.03 || mid.u > 0.97 || mid.v < 0.03 || mid.v > 0.97) continue;

    if (!checkSightline(cx, cy, cz, a.pos.x, a.pos.y + h * 0.55, a.pos.z)) continue;

    const top = projectToFrame(camera, frame, a.pos.x, a.pos.y + h, a.pos.z);
    const btm = projectToFrame(camera, frame, a.pos.x, a.pos.y, a.pos.z);
    if (!top || !btm) continue;

    const sizeFrac = Math.abs(top.ndcY - btm.ndcY) / (2 * frame.halfH);
    const dist = Math.hypot(a.pos.x - cx, a.pos.z - cz);

    const outside = Math.max(0, -top.v) + Math.max(0, btm.v - 1);
    const cutoff = Math.min(1, outside / Math.max(0.02, btm.v - top.v));

    const weight = sizeFrac * (1 - Math.hypot(mid.u - 0.5, mid.v - 0.5));
    if (weight > bestAnimalWeight) {
      bestAnimalWeight = weight;
      bestAnimal = a;
      bestAnimalDetails = { u: mid.u, v: mid.v, sizeFrac, cutoff, dist };
    }
  }

  if (bestAnimal && bestAnimalDetails) {
    const a = bestAnimal;
    const { u, v, sizeFrac, cutoff, dist } = bestAnimalDetails;

    const sizeScore = scoreSubjectSize(sizeFrac);
    const comp = scoreComposition(u, v);
    const raw = 0.35 * sizeScore + 0.3 * comp.score + 0.2 * steadyScore + 0.15 * lightScore;
    const cutoffMul = 1 - 0.6 * cutoff;

    const cond: AnimalCondition = a.state === 'FLEE' ? 'fleeing' : a.state === 'ALERT' ? 'alert' : 'calm';
    const condMul = cond === 'calm' ? 1.0 : cond === 'alert' ? 0.5 : 0.15;

    const isResponsible = dist >= PHOTO_RULES.safeDistance;
    const distMul = isResponsible ? 1.0 : 0.3 + (dist / PHOTO_RULES.safeDistance) * 0.4;

    let finalScore = Math.round(100 * raw * cutoffMul * condMul * distMul);
    if (!isResponsible) {
      finalScore = Math.min(finalScore, PHOTO_RULES.tooCloseScoreCap);
    }
    finalScore = Math.max(0, Math.min(100, finalScore));

    const tags: FramingTag[] = [];
    const hints: FramingTag[] = [];

    if (isResponsible) {
      tags.push({ text: `Responsible distance (${Math.round(dist)} m)`, good: true });
    } else {
      tags.push({ text: `Too close (${Math.round(dist)} m). Back away to at least 23 m`, good: false });
      hints.push({ text: `Too close! Back away to safe distance (23m+), then zoom in`, good: false });
    }

    if (cond === 'calm') {
      tags.push({ text: `Calm animal, grazing peacefully`, good: true });
    } else if (cond === 'alert') {
      tags.push({ text: `Noticed you and became alert`, good: false });
      hints.push({ text: `Animal is alert. Stay still or back away slowly`, good: false });
    } else {
      tags.push({ text: `Animal running away`, good: false });
      hints.push({ text: `Fleeing. Wait for it to calm down`, good: false });
    }

    if (isResponsible && opts.zoom >= 2.5) {
      tags.push({ text: `Telephoto zoom from safe distance`, good: true });
    }

    if (sizeFrac < 0.08) {
      tags.push({ text: `Subject small in frame`, good: false });
      hints.push({
        text: isResponsible ? `Small in frame: zoom in rather than walking closer` : `Small in frame`,
        good: false,
      });
    }

    if (cutoff > 0.2) {
      tags.push({ text: `Part of animal is cut off`, good: false });
      hints.push({ text: `Adjust framing so the animal is fully in frame`, good: false });
    }

    if (comp.score >= 0.75) {
      tags.push({ text: comp.thirds ? `Rule of thirds composition` : `Well centered`, good: true });
    }

    if (steadyScore >= 0.92) {
      tags.push({ text: `Rock steady shot`, good: true });
    } else if (steadyScore < 0.75) {
      tags.push({ text: `Camera shake: stand still or crouch (C) to brace`, good: false });
      hints.push({ text: `Hold still or crouch (C) to steady the camera`, good: false });
    }

    if (lightScore >= 1.0) {
      tags.push({ text: `Golden-hour lighting`, good: true });
    }

    if (hints.length === 0 && cond === 'calm' && isResponsible) {
      hints.push({ text: `Excellent framing. Click or press Space to take photo`, good: true });
    }

    return {
      kind: 'wildlife',
      subjectId: a.id,
      subject: a.speciesName,
      detail: a.detailLabel,
      distance: dist,
      u,
      v,
      condition: cond,
      responsible: isResponsible,
      tooClose: !isResponsible,
      score: finalScore,
      grade: getGrade(finalScore),
      tags,
      hints,
    };
  }

  // 2. Detect Landmarks
  let bestLandmark: { id: string; name: string; description: string; x: number; y: number; z: number } | null = null;
  let bestLmDetails: { u: number; v: number; dist: number } | null = null;
  let minCenterDist = Infinity;

  for (const lm of opts.landmarks) {
    const dist = Math.hypot(lm.x - cx, lm.z - cz);
    if (dist < 6 || dist > 220) continue;

    const p = projectToFrame(camera, frame, lm.x, lm.y + 2.0, lm.z);
    if (!p || p.u < 0.1 || p.u > 0.9 || p.v < 0.1 || p.v > 0.9) continue;

    if (!checkSightline(cx, cy, cz, lm.x, lm.y + 2.0, lm.z)) continue;

    const cd = Math.hypot(p.u - 0.5, p.v - 0.5);
    if (cd < minCenterDist) {
      minCenterDist = cd;
      bestLandmark = lm;
      bestLmDetails = { u: p.u, v: p.v, dist };
    }
  }

  if (bestLandmark && bestLmDetails) {
    const comp = scoreComposition(bestLmDetails.u, bestLmDetails.v);
    const score = Math.max(
      0,
      Math.min(100, Math.round(30 + 40 * comp.score + 15 * lightScore + 15 * steadyScore))
    );

    const tags: FramingTag[] = [{ text: `Landmark: ${bestLandmark.name}`, good: true }];
    if (comp.score >= 0.75) {
      tags.push({ text: comp.thirds ? `Rule of thirds` : `Well centered`, good: true });
    }
    if (lightScore >= 1.0) tags.push({ text: `Golden-hour light`, good: true });
    if (steadyScore < 0.75) tags.push({ text: `Shaky: crouch (C) to steady`, good: false });

    return {
      kind: 'landmark',
      subjectId: bestLandmark.id,
      subject: bestLandmark.name,
      detail: bestLandmark.description,
      distance: bestLmDetails.dist,
      u: bestLmDetails.u,
      v: bestLmDetails.v,
      condition: null,
      responsible: true,
      tooClose: false,
      score,
      grade: getGrade(score),
      tags,
      hints: [{ text: `${bestLandmark.name} in frame`, good: true }],
    };
  }

  // 3. Landscape
  const base = Math.round(Math.min(40, 12 + 14 * lightScore + 10 * steadyScore));
  return {
    kind: 'landscape',
    subjectId: 'landscape',
    subject: 'Landscape',
    detail: 'Park scenery view',
    distance: 0,
    u: null,
    v: null,
    condition: null,
    responsible: true,
    tooClose: false,
    score: base,
    grade: getGrade(base),
    tags: [
      { text: `Scenery view. Frame wildlife or a landmark for a higher score`, good: false },
      ...(lightScore >= 1.0 ? [{ text: `Golden-hour light`, good: true }] : []),
    ],
    hints: [{ text: `Aim at wildlife or a landmark to compose a subject photo`, good: false }],
  };
}
