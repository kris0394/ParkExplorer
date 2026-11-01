/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParkDefinition } from './parks.ts';
import { SPECIES_CATALOGUE } from './species.ts';
import { getTrailPaths, getBridges, getWaterMode, jumpLabel, MAX_HOTKEY_LANDMARKS } from './parkStructure.ts';

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
  // Task 22: trail paths (any number, loops allowed). Older parks give westNodes and eastNodes instead.
  const paths = park.trail ? getTrailPaths(park) : [];
  if (paths.length === 0) say('trail needs at least one path (trail.paths, or westNodes and eastNodes)');
  const pathIds = paths.map(p => p.id);
  if (new Set(pathIds).size !== pathIds.length) say('trail path ids must be unique');
  for (const p of paths) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id)) say(`trail path id "${p.id}" must be lowercase words joined by hyphens`);
    if (p.nodes.length < 2) say(`trail path "${p.id}" needs at least 2 nodes`);
    if (p.closed && p.nodes.length < 3) say(`trail loop "${p.id}" needs at least 3 nodes`);
    if (!p.nodes.every(n => Number.isFinite(n.x) && Number.isFinite(n.z))) say(`trail path "${p.id}" has a node without numbers for x and z`);
  }

  // Task 18 (updated in Task 22): every real park needs its own layout. Copying another park's trails makes parks feel like clones.
  if (!park.isPracticePark && paths.length > 0) {
    const sig = (p: ParkDefinition) => JSON.stringify(getTrailPaths(p).map(t => [t.nodes, !!t.closed]));
    const mine = sig(park);
    const twin = allParks.find(p => p.id !== park.id && !p.isPracticePark && p.trail && sig(p) === mine);
    if (twin) say(`has exactly the same trail layout as "${twin.name}". Give it its own trails, bridges and summit position (see docs/ADDING_A_PARK.md, "Making a park feel different")`);
  }

  // Task 24: optional ground look and grassland look must make sense
  const gl = park.terrain?.groundLook;
  if (gl) {
    if (!gl.patches || gl.patches.length < 2) say('terrain.groundLook.patches needs at least 2 colours');
    if (!(gl.strength >= 0 && gl.strength <= 1)) say('terrain.groundLook.strength must be between 0 and 1');
    if (!(gl.patchScale > 0 && gl.patchScale < 0.2)) say('terrain.groundLook.patchScale should be a small number such as 0.016');
    if (gl.speckle < 0 || gl.speckle > 0.4) say('terrain.groundLook.speckle must be between 0 and 0.4');
  }
  const gr = park.vegetation?.look?.grassland;
  if (gr) {
    if (!(gr.density > 0 && gr.density <= 3)) say('vegetation.look.grassland.density must be above 0 and at most 3 (more tufts slow the game)');
    if (!(gr.radius >= 20 && gr.radius <= 70)) say('vegetation.look.grassland.radius must be between 20 and 70 metres');
    if (!(gr.heightRange[0] > 0 && gr.heightRange[1] >= gr.heightRange[0])) say('vegetation.look.grassland.heightRange must be [short, tall] with short above 0');
    if (gr.carpet && gr.carpet.count > 6000) say('vegetation.look.grassland.carpet.count above 6000 will slow the game');
  }

  // Task 22: bridges are optional (none, one or several)
  const bridges = park.trail ? getBridges(park) : [];
  for (const [i, b] of bridges.entries()) {
    if (!(b.eastX > b.westX)) say(`bridge #${i + 1} ("${b.name}") needs eastX to be larger than westX`);
    if (!(b.width > 0)) say(`bridge #${i + 1} ("${b.name}") needs a width above 0`);
  }

  // Task 22: water modes
  const mode = getWaterMode(park);
  if (park.water?.mode && !['river', 'dry-wash', 'none'].includes(park.water.mode)) say('water.mode must be "river", "dry-wash" or "none"');
  if (park.water?.mode === 'river' && !park.water.hasRiver) say('water.mode "river" needs hasRiver: true');
  if (park.water?.mode && park.water.mode !== 'river' && park.water.hasRiver) say(`water.mode "${park.water.mode}" needs hasRiver: false (hasRiver means flowing water)`);
  if (mode !== 'none' && bridges.length === 0 && typeof park.water.refZ !== 'number') say('a park with a river or dry wash but no bridge needs water.refZ (the z the channel is measured from)');
  if (mode === 'river' && bridges.length === 0) say('a flowing river needs at least one bridge (or use mode "dry-wash" for a ground-level crossing)');
  if (mode !== 'dry-wash' && (park.water?.stones?.length ?? 0) > 0) say('water.stones only works with mode "dry-wash"');

  for (const [k, v] of Object.entries(park.vegetation?.speciesWeights ?? {})) {
    if (!finite(v) || (v as number) < 0) say(`tree weight "${k}" must be 0 or more`);
  }

  // Landmarks (hotkeys 1-4 jump to the first four)
  const lm = park.landmarks ?? [];
  if (lm.length === 0) say('needs at least one landmark');
  const lmIds = lm.map(l => l.id);
  if (new Set(lmIds).size !== lmIds.length) say('landmark ids must be unique');
  // Task 22: landmarks are free-form (any ids, any count). Only the spawn landmark is required.
  if (!lmIds.includes('spawn')) say('landmarks should include one with id "spawn"');
  if (lm.length > MAX_HOTKEY_LANDMARKS) say(`only the first ${MAX_HOTKEY_LANDMARKS} landmarks get a number hotkey (1-${MAX_HOTKEY_LANDMARKS}); the rest can only be clicked`);
  const labels = lm.map(l => jumpLabel(l));
  if (new Set(labels).size !== labels.length) say(`two landmarks have the same Jump-to label (${labels.join(', ')}). Give one a distinct shortName`);

  // Real-park information (Task 13)
  if (park.npsParkCode && !park.about) say('real parks (with an npsParkCode) should have an "about" block with sourced facts');
  if (park.isPracticePark && park.npsParkCode) say('a practice (fictional) park should not have an npsParkCode');
  if (park.about) {
    const a = park.about;
    if (!a.designNote?.trim()) say('about.designNote is empty');
    if (!a.wildlifeGuidance?.text?.trim() || !a.wildlifeGuidance.caveat?.trim()) say('about.wildlifeGuidance needs text and a caveat');
    if (!/^https:\/\//.test(a.wildlifeGuidance?.sourceUrl ?? '')) say('about.wildlifeGuidance needs an https sourceUrl');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a.checkedOn ?? '')) say('about.checkedOn must look like 2026-10-10');
    if (!a.facts?.length) say('about.facts needs at least one fact');
    const ids = (a.facts ?? []).map(f => f.id);
    if (new Set(ids).size !== ids.length) say('about.facts ids must be unique');
    for (const f of a.facts ?? []) {
      if (!f.text?.trim() || !f.title?.trim()) say(`fact "${f.id}" needs a title and text`);
      if (!/^https:\/\//.test(f.sourceUrl ?? '') || !f.sourceLabel?.trim()) say(`fact "${f.id}" needs an https sourceUrl and a sourceLabel (no unsourced facts)`);
    }
  }

  // Real terrain (Task 15)
  const rt = park.realTerrain;
  if (rt) {
    if (!/^[a-z0-9-]+$/.test(rt.id)) say('realTerrain.id must be lowercase letters, numbers and hyphens');
    if (!(rt.centerLat >= -90 && rt.centerLat <= 90 && rt.centerLon >= -180 && rt.centerLon <= 180)) say('realTerrain centre latitude or longitude is out of range');
    if (!(rt.zoom >= 10 && rt.zoom <= 15)) say('realTerrain.zoom should be between 10 and 15 (13 is about 15 m per pixel)');
    if (!(rt.sizeM >= 300 && rt.sizeM <= 3000)) say('realTerrain.sizeM should be between 300 and 3000 metres');
    if (!(rt.stepM >= 2 && rt.stepM <= 20)) say('realTerrain.stepM should be between 2 and 20 metres');
    if (!(rt.mix >= 0 && rt.mix <= 1)) say('realTerrain.mix must be between 0 and 1');
    if (!(rt.detrendSigmaM >= 30)) say('realTerrain.detrendSigmaM should be at least 30 metres');
    if (Math.abs(rt.sizeM / rt.stepM - Math.round(rt.sizeM / rt.stepM)) > 1e-9) say('realTerrain.sizeM must be a whole multiple of stepM');
    if (park.isPracticePark) say('a fictional practice park cannot use real terrain');
    if (!park.npsParkCode) say('a park with real terrain should be a real park (needs npsParkCode)');
  }

  // Wildlife species and distances (Task 14)
  for (const sp of park.wildlife?.spawns ?? []) {
    if (!SPECIES_CATALOGUE[sp.species]) say(`wildlife spawn uses unknown species "${sp.species}" (add it to src/data/species.ts)`);
  }
  for (const [id, m] of Object.entries(park.wildlife?.safeDistanceOverrides ?? {})) {
    if (!SPECIES_CATALOGUE[id]) say(`safeDistanceOverrides lists unknown species "${id}"`);
    if (!(m >= 5 && m <= 200)) say(`safeDistanceOverrides "${id}" should be between 5 and 200 metres`);
  }

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
    if (!pathIds.includes(l.trail)) say(`litter "${l.id}" refers to trail path "${l.trail}", which does not exist (paths: ${pathIds.join(', ')})`);
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
