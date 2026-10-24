# Adding a new park to Park Explorer

The long-term goal is every U.S. national park (64 now that Chiricahua in Arizona became the 64th on 20 October 2026). A park is data, not code. Everything for one park lives in one object in `src/data/parks.ts`.
All the game systems (deer, trails, closed areas, litter, water stations, hotkeys, seasons) read from it.

## Steps
1. In `src/data/parks.ts`, copy the whole `SHENANDOAH` block (the most recent real park) and rename the copy (for example `ACADIA`). Then change the layout too (see "Making a park feel different" below). Only changing names and colours leaves a park looking like a clone.
2. Change `id` (lowercase words joined by hyphens, e.g. `acadia`), `name`, `description`, `region`, `state` and the other text fields.
3. Edit the pieces below (all are plain numbers and text).
4. Add your new park to the `AVAILABLE_PARKS` list at the bottom of the file.
5. Run `npm run check:parks`. It lists mistakes in plain language (errors must be fixed, warnings are worth a look).
6. Run `npm run build`, then play the park in the browser.

## What each part controls
| Part | Controls |
|---|---|
| `spawn` | Where you start (also the first water station) |
| `terrain` and `terrain.colors` | Mountain position, height and the ground colours. Optional `noiseX` / `noiseZ` shift the pattern of the hills |
| `layoutSeed` | Optional whole number. Changes where trees, rocks and logs are scattered, so the forest is not the same as another park's |
| `water` | River on or off, width and name. Optional `course` changes how much the river winds (a narrow brook winds less than a wide river) |
| `trail.westNodes` / `eastNodes` | The trail path (litter is placed along these) |
| `vegetation` | Tree and shrub counts and the mix of species |
| `atmosphere` | Fog and sky look |
| `landmarks` | Fast-travel points. Keep ids `spawn` and `summit`. Only the first 4 get hotkeys 1 to 4 |
| `wildlife.spawns` | Where each animal starts and how far it roams. Species can be `white-tailed-deer` or `elk` |
| `wildlife.safeDistanceOverrides` | Optional. Safe viewing distance in metres per species for this park (for example `{ elk: 46 }`). Defaults come from `src/data/species.ts` |
| `rules.zones` | Closed areas and fragile areas (each needs a short `reason`). Add `seasons: ['winter']` to make one seasonal |
| `rules.litter` | Pieces of litter along the trails. Positions are fixed so rewards cannot be farmed |
| `waterStations` | Treated drinking-water points where the canteen refills |

## Making a park feel different
Real parks must not look like copies of each other. `npm run check:parks` reports an error if two real parks share the exact same trail. Things to change for every new park:
1. **Trail and summit position.** Move `terrain.mountain` (and `realTerrain.originX/originZ`, which must match it), write new `trail.westNodes` / `eastNodes`, and move `spawn`. Give the trail its own shape (long climb, hairpins, loop, ridge walk).
2. **Water.** Change width and winding. A mountain brook might use `halfWidth: 2.4`, `valleyWidth: 30` and a `course` with small `amp1` / `amp2`. Keep `bridge.centerZ` and the bridge ends on the river (the river is centred near `course.baseX` at `bridge.centerZ`). Keep the valley wide enough (about 12 x `halfWidth` or more) so the land beside the bridge does not jump up steeply.
3. **Ground.** Give `terrain` its own `noiseX`, `noiseZ` and `layoutSeed`. A quick way to choose `noiseX` / `noiseZ` is to try a few values and look for hills near the spawn and trail of roughly 2 to 5 metres.
4. **Zones, litter, wildlife, landmarks, water stations.** Place them for the new trail (they are not moved for you). Landmark heights (`y`) should be close to the ground, and `npm run check:parks` warns when they are not.
5. **Landmark ids.** Keep `spawn`, `bridge`, `switchback` and `summit` as ids. The "Jump to" bar labels them Trailhead, Bridge, Switchback and Summit, so two buttons can never share a name.

## Rules to keep
- Real parks differ. Never copy something as if it were an official NPS rule, closure or alert. Mark game examples as game examples.
- Keep every closure explained (`reason`) so mistakes teach.
- Check each real park's own rules and wildlife guidance (bears and wolves need far more than 25 yards).
