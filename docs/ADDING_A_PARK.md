# Adding a new park to Park Explorer

A park is data, not code. Everything for one park lives in one object in `src/data/parks.ts`.
All the game systems (deer, trails, closed areas, litter, water stations, hotkeys, seasons) read from it.

## Steps
1. In `src/data/parks.ts`, copy the whole `GREAT_SMOKY_MOUNTAINS` block and rename the copy (for example `ACADIA`).
2. Change `id` (lowercase words joined by hyphens, e.g. `acadia`), `name`, `description`, `region`, `state` and the other text fields.
3. Edit the pieces below (all are plain numbers and text).
4. Add your new park to the `AVAILABLE_PARKS` list at the bottom of the file.
5. Run `npm run check:parks`. It lists mistakes in plain language (errors must be fixed, warnings are worth a look).
6. Run `npm run build`, then play the park in the browser.

## What each part controls
| Part | Controls |
|---|---|
| `spawn` | Where you start (also the first water station) |
| `terrain` and `terrain.colors` | Mountain position, height and the ground colours |
| `water` | River on or off, width and name |
| `trail.westNodes` / `eastNodes` | The trail path (litter is placed along these) |
| `vegetation` | Tree and shrub counts and the mix of species |
| `atmosphere` | Fog and sky look |
| `landmarks` | Fast-travel points. Keep ids `spawn` and `summit`. Only the first 4 get hotkeys 1 to 4 |
| `wildlife.spawns` | Where each animal starts and how far it roams. Species can be `white-tailed-deer` or `elk` |
| `wildlife.safeDistanceOverrides` | Optional. Safe viewing distance in metres per species for this park (for example `{ elk: 46 }`). Defaults come from `src/data/species.ts` |
| `rules.zones` | Closed areas and fragile areas (each needs a short `reason`). Add `seasons: ['winter']` to make one seasonal |
| `rules.litter` | Pieces of litter along the trails. Positions are fixed so rewards cannot be farmed |
| `waterStations` | Treated drinking-water points where the canteen refills |

## Rules to keep
- Real parks differ. Never copy something as if it were an official NPS rule, closure or alert. Mark game examples as game examples.
- Keep every closure explained (`reason`) so mistakes teach.
- Check each real park's own rules and wildlife guidance (bears and wolves need far more than 25 yards).
