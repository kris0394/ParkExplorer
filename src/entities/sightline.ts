/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { heightAt } from '../terrain/riverTerrain.ts';

/**
 * Checks if there is an unblocked line of sight between two 3D points
 * considering the natural terrain height.
 */
export function checkSightline(
  x1: number,
  y1: number,
  z1: number,
  x2: number,
  y2: number,
  z2: number
): boolean {
  const dist = Math.hypot(x2 - x1, y2 - y1, z2 - z1);
  const steps = Math.max(2, Math.floor(dist / 2.5));

  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = x1 + (x2 - x1) * t;
    const pz = z1 + (z2 - z1) * t;
    const py = y1 + (y2 - y1) * t;

    // Add small clearance over ground so grass doesn't block
    if (heightAt(px, pz) > py + 0.15) {
      return false;
    }
  }

  return true;
}
