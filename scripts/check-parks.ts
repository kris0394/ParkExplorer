/**
 * Run with:  npm run check:parks
 * Checks every park's data, including placements that need the terrain
 * (litter, zones, wildlife and water stations must be on sensible ground).
 */
(globalThis as any).window = { localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, addEventListener() {}, removeEventListener() {} };
(globalThis as any).localStorage = (globalThis as any).window.localStorage;
(globalThis as any).document = { addEventListener() {}, hidden: false };

import { AVAILABLE_PARKS, setActivePark } from '../src/data/parks.ts';
import { validateAllParks } from '../src/data/parkValidation.ts';
import { SEASON_ORDER, setActiveSeason } from '../src/data/seasons.ts';
import { getRiverDistance, heightAt } from '../src/terrain/riverTerrain.ts';
import { getDistanceToTrail, initializeTrailPoints } from '../src/entities/trailMesh.ts';
import { buildLitterSpots, getZonesForPark, findClosedZoneAt } from '../src/entities/rangerRules.ts';

let errors = 0;
let warnings = 0;
const fail = (m: string) => { console.log('  ERROR  ' + m); errors++; };
const warn = (m: string) => { console.log('  warn   ' + m); warnings++; };

console.log('Checking park data...');
for (const p of validateAllParks(AVAILABLE_PARKS)) fail(p);

for (const park of AVAILABLE_PARKS) {
  console.log(`\n${park.name} (${park.id})`);
  setActivePark(park.id);
  initializeTrailPoints();
  const hw = park.water.hasRiver ? park.water.halfWidth : 0;
  const river = (x: number, z: number) => (park.water.hasRiver ? getRiverDistance(x, z) : Infinity);

  const sp = park.spawn;
  if (river(sp.x, sp.z) < hw + 1) fail('spawn is in the river');

  for (const s of buildLitterSpots(park)) {
    if (river(s.x, s.z) < hw + 1) fail(`litter "${s.id}" is in the river`);
    if (getDistanceToTrail(s.x, s.z) > 4) warn(`litter "${s.id}" is ${getDistanceToTrail(s.x, s.z).toFixed(1)} m from the trail`);
  }

  for (const season of SEASON_ORDER) {
    setActiveSeason(season);
    const zones = getZonesForPark(park.id);
    for (const z of zones) {
      if (z.kind === 'closed' && findClosedZoneAt(sp.x, sp.z, [z])) fail(`closed zone "${z.id}" covers the spawn point in ${season}`);
      if (z.kind === 'sensitive' && Math.hypot(sp.x - z.x, sp.z - z.z) < z.radius) warn(`fragile zone "${z.id}" covers the spawn point`);
    }
    for (const w of park.wildlife.spawns) {
      if (findClosedZoneAt(w.x, w.z, zones)) warn(`a deer spawns inside a closed zone in ${season}`);
    }
  }
  setActiveSeason('summer');

  for (const z of getZonesForPark(park.id)) {
    if (river(z.x, z.z) < z.radius + hw && z.seasons === undefined) warn(`zone "${z.id}" overlaps the river`);
    if (z.seasons === undefined && z.kind === 'sensitive' && getDistanceToTrail(z.x, z.z) > z.radius + 25) warn(`fragile zone "${z.id}" is far from any trail`);
  }
  for (const w of park.wildlife.spawns) {
    if (river(w.x, w.z) < hw + 2) fail('a deer spawns in the river');
  }
  for (const st of park.waterStations) {
    if (river(st.x, st.z) < hw) fail(`water station "${st.id}" is in the river`);
  }
  for (const l of park.landmarks) {
    const h = heightAt(l.x, l.z);
    if (Math.abs(h - l.y) > 3) warn(`landmark "${l.id}" height ${l.y} differs from the ground (${h.toFixed(1)})`);
  }
}

console.log(`\n${errors} error(s), ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);
