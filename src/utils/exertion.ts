/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TASK 25: climbing is hard work. The steeper the uphill grade (rise over run, 0.5 = a 27 degree slope),
 * the more stamina and water it costs. Flat ground and downhill cost nothing extra, so flat parks play as before.
 */

/** Multiplier on sprint stamina drain and on hydration drain while moving uphill (1 on the flat). */
export function climbEffort(uphillGrade: number): number {
  const g = Math.max(0, Math.min(0.6, uphillGrade));
  return 1 + g * 3.0; // grade 0.2 -> 1.6x, 0.4 -> 2.2x, 0.6 or steeper -> 2.8x
}

/** Stamina per second lost just by WALKING up a steep grade (nothing below a grade of 0.3). */
export function steepWalkDrain(uphillGrade: number): number {
  return Math.max(0, Math.min(0.7, uphillGrade) - 0.3) * 30; // grade 0.4 -> 3 per second, 0.7 -> 12 per second
}
