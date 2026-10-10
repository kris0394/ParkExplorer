/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParkDefinition } from './parks.ts';

/**
 * TASK 11: checks a park's data for mistakes that do not need the 3D world
 * (missing fields, duplicate ids, impossible numbers). Returns plain-language
 * problems. An empty list means the data is structurally fine.
 */
export function validateParkData(park: ParkDefinition, allParks: ParkDefinition[] = []): string[] {
  const problems: string[] = [];
  const say = (m: string) => problems.push(`${park.id || '(no id)'}: ${m}`);

  if (!park.id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(park.id)) say('id must be lowercase words joined by hyphens, e.g. "acadia"');
  if (allParks.filter(p => p.id === park.id).length > 1) say('id is used by more than one park');
  if (!park.name?.trim()) say('name is empty');
  if (park.npsParkCode !== undefined && !/^[a-z]{4}$/.test(park.npsParkCode)) say('npsParkCode must be exactly 4 lowercase letters, e.g. "grsm"');
  if (park.npsParkCode && allParks.filter(p => p.npsParkCode === park.npsParkCode).length > 1) say('npsParkCode is used by more than one park');
  if (!park.description?.trim()) say('description is empty');

  const finite = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
  if (![park.spawn?.x, park.spawn?.y, park.spawn?.z, park.spawn?.yaw].every(finite)) say('spawn needs numbers for x, y, z and yaw');

  if (!(park.terrain?.mountain?.radius > park.terrain?.mountain?.plateauRadius)) say('mountain radius must be larger than plateauRadius');
  if (!park.trail || park.trail.westNodes.length < 2) say('trail needs at least 2 west nodes');
  if (!park.trail || park.trail.eastNodes.length < 2) say('trail needs at least 2 east nodes');

  for (const [k, v] of Object.entries(park.vegetation?.speciesWeights ?? {})) {
    if (!finite(v) || (v as number) < 0) say(`tree weight "${k}" must be 0 or more`);
  }

  // Landmarks (hotkeys 1-4 jump to the first four)
  const lm = park.landmarks ?? [];
  if (lm.length === 0) say('needs at least one landmark');
  const lmIds = lm.map(l => l.id);
  if (new Set(lmIds).size !== lmIds.length) say('landmark ids must be unique');
  if (!lmIds.includes('spawn')) say('landmarks should include one with id "spawn"');
  if (!lmIds.includes('summit')) say('landmarks should include one with id "summit"');
  if (lm.length > 4) say('only the first 4 landmarks get a number hotkey (1-4)');

  // Wildlife
  const spawns = park.wildlife?.spawns ?? [];
  if (spawns.length === 0) say('needs at least one wildlife spawn');
  spawns.forEach((s, i) => {
    if (!finite(s.x) || !finite(s.z)) say(`wildlife spawn #${i + 1} needs x and z`);
    if (!(s.roamRadius > 0)) say(`wildlife spawn #${i + 1} needs a roamRadius above 0`);
  });

  // Rules
  const zones = park.rules?.zones ?? [];
  const zoneIds = zones.map(z => z.id);
  if (new Set(zoneIds).size !== zoneIds.length) say('zone ids must be unique');
  for (const z of zones) {
    if (!(z.radius > 0)) say(`zone "${z.id}" needs a radius above 0`);
    if (!z.reason?.trim()) say(`zone "${z.id}" needs a reason (mistakes teach)`);
    if (z.kind !== 'closed' && z.kind !== 'sensitive') say(`zone "${z.id}" kind must be "closed" or "sensitive"`);
  }
  const litter = park.rules?.litter ?? [];
  const litterIds = litter.map(l => l.id);
  if (new Set(litterIds).size !== litterIds.length) say('litter ids must be unique');
  for (const l of litter) {
    if (!(l.at >= 0 && l.at <= 1)) say(`litter "${l.id}": "at" must be between 0 and 1`);
    if (!l.tip?.trim()) say(`litter "${l.id}" needs a tip`);
  }

  // Water
  if ((park.waterStations ?? []).length === 0) say('needs at least one water station');
  for (const w of park.waterStations ?? []) {
    if (!(w.radius > 0)) say(`water station "${w.id}" needs a radius above 0`);
  }

  return problems;
}

export function validateAllParks(parks: ParkDefinition[]): string[] {
  return parks.flatMap(p => validateParkData(p, parks));
}
