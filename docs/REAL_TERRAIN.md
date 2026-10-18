# Real terrain pilot (Task 15)

The Great Smoky Mountains park now blends **real elevation relief** into its rolling hills.
Sources and background: `docs/ELEVATION_DATA.md`.

## What it does (and does not do)
- At build time (on GitHub) a script downloads a few free elevation tiles (AWS Terrain Tiles) for a 1 km window around Kuwohi.
- It removes the overall slope, keeps the hills and hollows, scales them down so they are about as lively as the old procedural hills, and saves a small file (`terrain/grsm.json`, about 180 KB).
- In the game, those real hills replace 60% of the procedural hills **away from the trail**. Near the trail (within 14 m, fading out by 34 m) the ground is exactly as before, so walking stays gentle.
- The spawn clearing, the summit plateau and the river valley are applied afterwards, so they are never changed.
- The real summit is lined up with the game's summit position.
- It does **not** move the trail, river, bridge or landmarks. Those are still hand-placed. It is relief from the real place, not a map of it.

## Where it shows
- Start screen: a "Terrain" note says the relief is real, the window size, the real elevation range, how much of its real height is shown, and the data attribution.
- If the download failed, or in a copy without the data, the note says the built-in landscape is used and the game works as before.

## How it is wired
| Piece | File |
|---|---|
| Park settings (`realTerrain` block) | `src/data/parks.ts` |
| Tile maths, decoding, relief building | `src/utils/terrainBuild.ts` |
| Build-time download script | `scripts/fetch-terrain.ts` (runs inside `npm run build`) |
| Game-side blending | `src/terrain/realRelief.ts`, used by `heightAt` in `src/terrain/riverTerrain.ts` |
| Hill maths shared by script and game | `src/terrain/hillStats.ts` |
| Loading before the world is built | `src/utils/terrainData.ts`, `src/App.tsx` |
| Standalone offline copy | `bundle-singlefile.js` embeds the data |

## Settings you can change (in the park's `realTerrain` block)
| Setting | Meaning |
|---|---|
| `centerLat`, `centerLon` | Centre of the real window (check on a map) |
| `zoom` | Tile detail. 13 is about 15 m per pixel |
| `sizeM`, `stepM` | Window width and grid spacing. `sizeM` must be a multiple of `stepM` |
| `originX`, `originZ` | Where in the game world the window centre is placed |
| `mix` | 0 to 1. How much real relief replaces the procedural hills (0.6 now). Lower it if the ground feels too rough |
| `detrendSigmaM` | Overall slopes larger than this are removed (120 m now) |

The vertical size is set automatically: real relief is scaled so its spread matches the procedural hills, and never exaggerated. The scale used is printed in the build log and shown on the start screen.

## Checking that it worked on GitHub
Open the Actions run, then the **Build project** step. You should see a line like:
`[terrain] grsm: saved. 2 tiles, real elevation 1xxx to 20xx m, relief rms ... m (target ... m, shown at NN%), steepest NN%`
If you see `could not build (...)`, the game still works and uses the built-in landscape. Send me the text in the brackets.

## Adding a real window to another park
1. Add a `realTerrain` block to the park (centre from a map, same other numbers).
2. `npm run check:parks` must show no errors.
3. Build on GitHub and read the `[terrain]` line.

## Known limits of the pilot
- Tested only with made-up tiles (decoding, orientation, units and all fallbacks were checked). The first real download happens on GitHub.
- The window centre uses an approximate summit coordinate. A few tens of metres of error does not matter for relief.
- Real terrain is only blended into the hills. A full real level (trail and landmarks laid out on the real ground, from NPS trail data) is a later step.
- Elevation attribution is required: see https://registry.opendata.aws/terrain-tiles
