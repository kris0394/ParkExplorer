# Free elevation data for real park terrain (research notes)

Goal: build a real section of each park from real ground heights instead of the invented landscape.
Checked 2026-10-10. These are notes, nothing here is used by the game yet.

## Best sources (all free, no account needed)

### 1. USGS 3DEP (U.S. Geological Survey, "The National Map")
- Public domain: the USGS says all 3DEP products are public domain and free of charge.
- Resolution: 1/3 arc-second (about 10 m) nearly everywhere in the United States including Hawaii; 1 arc-second (about 30 m) nationwide; 1 m lidar in many areas; Alaska is only partly covered at 1/3 arc-second (5 m radar-based data exists in some places).
- Also has an Elevation Point Query Service for single points.
- Best choice for parks in the lower 48 and Hawaii.
- Landing page: https://www.usgs.gov/3d-elevation-program

### 2. Terrain Tiles on AWS (Mapzen / "Terrarium" PNG tiles)
- Free, global, no key. Public bucket `elevation-tiles-prod` (read without an AWS account).
- Easy to use: each tile is a PNG. Height in metres = (red * 256 + green + blue / 256) - 32768.
- Covers every park, Alaska included. It is built from several open sources, so it needs an attribution line (see the license link on https://registry.opendata.aws/terrain-tiles).
- Caution: where better data is missing, tiles are stretched from coarser data, so detail can look softer than the zoom level suggests.
- Best choice for a first pilot and for Alaska.

## Recommendation
1. Start with Terrain Tiles for the pilot (simplest, one source for every park).
2. Move lower-48 and Hawaii parks to USGS 3DEP 10 m data later if more detail is needed.
3. Trails and rivers are NOT in elevation data. They would come from NPS trail and USGS hydrography data (also public), or be hand-placed as today.

## How it would work in the game (Task 15 idea)
- A build-time script (like `scripts/fetch-nps.ts`) downloads the tiles for one named section of a park and saves a small height grid (a few hundred KB) next to the site. The page never talks to any elevation server.
- The game's terrain function would read that grid, blend it with the current procedural detail, and keep the playable area to one section (about 600 m across at real scale).
- The sandbox where the code is written cannot reach these servers (tested), so the first real download would happen on GitHub, exactly like the NPS download.

## Candidate sections (names only, coordinates to be confirmed against USGS/NPS pages)
| Park | Section |
|---|---|
| Great Smoky Mountains | Kuwohi summit and ridge (the summit is at about 35.56 N, 83.50 W, to be verified) |
| Shenandoah | Hawksbill summit area |
| Acadia | Cadillac Mountain summit |
| Saguaro or Joshua Tree | A desert wash and rock outcrop near a visitor trailhead |
| Badlands or Theodore Roosevelt | Door Trail / Painted Canyon style badlands section |
| Congaree or Everglades | Boardwalk loop (almost flat, so best for a simple test of flat terrain) |
| Rocky Mountain | Bear Lake area |
| Yellowstone | A Lamar Valley meadow (elk country) |
| Zion, Grand Canyon, Arches | A short rim or canyon-floor section |
| Alaska and Hawaii | Use Terrain Tiles (global); check 3DEP coverage first |

Every park is covered by at least one of the two sources. The hard part is not the data, it is turning a 600 m window into a good-looking, walkable game level.
