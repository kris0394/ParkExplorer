# Tasks 18 + 19: every park looks like itself (Shenandoah), clearer rope warnings, 64 parks

This package is cumulative. It includes everything from the earlier Task 18 zip, so upload all of these files whether or not Task 18 was merged.

## Fixes from playtest round 2
1. **Shenandoah still looked like a clone.** Beyond its own trail, brook, summit spot and hills (Task 18), it now has park-specific scenery:
   - Skyline Drive: a paved two-lane road with double yellow lines, gravel shoulders and low stone walls along the edge.
   - Hawksbill Gap parking area with three parked cars, an entrance road, and a short trail from the lot to the trailhead.
   - Greenstone scree (angular grey-green boulder fields) on the upper slopes and around the summit.
   - A stone wall around the summit deck, with a gap where the trail arrives.
   - Layered blue ridgelines on the horizon that follow the haze colour (day, sunset, dawn, twilight).
   - A paler, rocky trail surface.
2. **Roped-off areas.** Working as designed, but the messages were unclear. Red-capped ropes are closed areas and block you. Yellow-capped ropes are fragile areas you can enter, at a cost (Stewardship drops after about 6 seconds inside). The on-screen text now says exactly that. If you walked through a RED rope, tell us the park and season.
3. **Chiricahua.** Chiricahua (Arizona) became the 64th national park on 20 October 2026. Docs and the roadmap now say 64 parks and list Chiricahua. It is not playable yet.

## How it works
- New optional `features` block on a park (`roads`, `cars`, `talusFields`, `summitWall`, `distantRidges`) and `trail.surface`. Parks without it are unchanged (Smokies terrain verified identical).
- New `src/terrain/roadTerrain.ts` levels the ground under roads. New `src/entities/parkFeatures.ts` builds the scenery. Cars, stone walls and big boulders are solid (`registerObstacle` in rocks.ts). Trees, rocks, logs and grass keep off roads.
- `npm run check:parks` also checks that roads stay out of the river.

## Tested
Type check, production build, `npm run check:parks` (0 errors, no Shenandoah warnings), headless run of the scenery builder, collisions (cars and walls push you back), and trail steepness (parking area to trailhead is a gentle slope). A top-down map was drawn and checked. NOT tested in a real browser: please check how Skyline Drive, the cars, walls, scree and ridgelines look, and that nothing floats or sinks.

## Files
src/App.tsx, src/components/HUD.tsx, src/components/NatureWorld.tsx, src/components/RangerNotices.tsx, src/data/parks.ts, src/data/parkValidation.ts, src/entities/bridge.ts, src/entities/forestFloor.ts, src/entities/grass.ts, src/entities/parkFeatures.ts (new), src/entities/rocks.ts, src/entities/trailMesh.ts, src/entities/trees.ts, src/terrain/hillStats.ts, src/terrain/realRelief.ts, src/terrain/riverTerrain.ts, src/terrain/roadTerrain.ts (new), scripts/check-parks.ts, docs/ADDING_A_PARK.md, docs/ELEVATION_DATA.md, README.md
