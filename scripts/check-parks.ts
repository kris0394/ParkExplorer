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
import { getRiverDistance, heightAt, getBridgeAt } from '../src/terrain/riverTerrain.ts';
import { getTrailPaths, getPathLine, getWaterMode, getBridges } from '../src/data/parkStructure.ts';
import { getDistanceToTrail, initializeTrailPoints } from '../src/entities/trailMesh.ts';
import { getRoadPaths } from '../src/terrain/roadTerrain.ts';
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
  // Task 22: a river and a dry wash both count as "the channel" (keep things out of it); 'none' has no channel
  const waterMode = getWaterMode(park);
  const hw = waterMode !== 'none' ? park.water.halfWidth : 0;
  const river = (x: number, z: number) => (waterMode !== 'none' ? getRiverDistance(x, z) : Infinity);
  const paths = getTrailPaths(park);
  console.log(`  ${paths.length} trail path(s): ${paths.map(p => p.id + (p.closed ? ' (loop)' : '')).join(', ')}; ${getBridges(park).length} bridge(s); water: ${waterMode}`);

  // Task 22: every trail path must be walkable: out of the channel (except on a bridge) and not too steep
  for (const path of paths) {
    const line = getPathLine(path);
    let steepest = 0;
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i], b = line[i + 1];
      const len = Math.hypot(b.x - a.x, b.z - a.z);
      const steps = Math.max(1, Math.ceil(len / 3));
      for (let k = 0; k <= steps; k++) {
        const x = a.x + (b.x - a.x) * (k / steps);
        const z = a.z + (b.z - a.z) * (k / steps);
        if (waterMode === 'river' && river(x, z) < hw + 0.5 && !getBridgeAt(x, z)) { fail(`trail path "${path.id}" runs through the river near (${x.toFixed(0)}, ${z.toFixed(0)}) with no bridge`); break; }
        // the final steps up to the summit deck are built as a short stairway, so they are not counted
        const mtn = park.terrain.mountain;
        if (Math.hypot(x - mtn.x, z - mtn.z) < park.overlook.deckRadius + 8) continue;
        if (k > 0) {
          const px = a.x + (b.x - a.x) * ((k - 1) / steps);
          const pz = a.z + (b.z - a.z) * ((k - 1) / steps);
          const step = Math.hypot(x - px, z - pz) || 1;
          steepest = Math.max(steepest, Math.abs(heightAt(x, z) - heightAt(px, pz)) / step);
        }
      }
    }
    if (steepest > 1.0) warn(`trail path "${path.id}" is steep in places (${(steepest * 100).toFixed(0)}% grade)`);
  }
  if (paths.length > 0) {
    const nearSpawn = Math.min(...paths.flatMap(p => getPathLine(p)).map(n => Math.hypot(n.x - park.spawn.x, n.z - park.spawn.z)));
    if (nearSpawn > 25) warn(`the spawn point is ${nearSpawn.toFixed(0)} m from the nearest trail node`);
  }

  const sp = park.spawn;
  if (river(sp.x, sp.z) < hw + 1) fail('spawn is in the river');

  // Roads (Task 19): must stay out of the river and away from the spawn point
  for (const rp of getRoadPaths()) {
    for (const pt of rp.pts) {
      if (river(pt.x, pt.z) < hw + rp.road.width / 2 + 2) { fail(`road "${rp.road.id}" runs into the river near (${pt.x.toFixed(0)}, ${pt.z.toFixed(0)})`); break; }
    }
    if (Math.hypot(sp.x - rp.pts[0].x, sp.z - rp.pts[0].z) < 1 && rp.road.kind === 'road') warn(`road "${rp.road.id}" starts at the spawn point`);
  }

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
