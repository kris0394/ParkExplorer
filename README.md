# Park Explorer: Status, Limitations and Next Steps

## 1. What this project is
A browser-based 3D national park exploration and responsible-recreation simulation. You explore real and prototype parks, identify and photograph wildlife from respectful safe distances (25 yards / 23 m), manage backcountry hydration and gear, keep a Field Journal, and earn Park Credits and Stewardship reputation.

---

## 2. Progress Tracker

| Task | Feature | Status | Notes |
|---|---|---|---|
| 1 | Walkable 3D world (sky, lighting, procedural terrain, WASD, mouse look, sprint, stamina) | Done | Smooth slope physics, footstep audio |
| 2 | Environment: trail ribbons, water shader, river, rocks, grass, footbridge, summit overlook & telescope | Done | Procedural flora and landmarks |
| 3 | Wildlife: White-tailed deer (grazing, does, bucks, fawns, chew animation, tolerance) | Done | Realistic ground grazing and chewing |
| 4 | Field Binoculars & wildlife identification | Done | Target reticle, zoom, 1.8s-2.8s study timer |
| 5 | Camera, photography, scoring & gallery | Done | Rule of thirds, lighting, safe distance rewards |
| 6 | Field journal, Park Credits, Stewardship rank & persistence | Done | LocalStorage + IndexedDB backup |
| 7 | Equipment shop, water/hydration, equippable handheld compass & topo map | **Done** | Equippable compass [K], canteen hydration [X], potable stations [R], outfitter gear |
| 8 | Responsible recreation rules: wildlife distance alerts, closed and fragile areas, litter | **Done** | Distance banner [23 m], closed-area rope and sign, fragile-area warning, litter pick-up [Q] |
| 9 | Time of day (day, sunset, dawn, twilight) | **Done** | Toggle in the HUD. Weather (rain, wind, birds) not built yet |
| 10 | Season selector (spring, summer, autumn, winter) | **Done** | Start-screen selector; changes leaves, snow, grass, deer behaviour, summit trail closure |
| 11 | Park content moved into data (ParkDefinition) | **Done** | Wildlife spawns, closed/fragile areas, litter and water stations now live in each park's data. Checker: `npm run check:parks`. Guide: `docs/ADDING_A_PARK.md` |
| 12 | Real NPS information and alerts | **Done** (needs one-time key setup) | Downloaded at build time with a private GitHub secret. Start screen shows real park info and alerts. Guide: `docs/NPS_SETUP.md` |
| 13 | First real park (Great Smoky Mountains) | **Done (first pass)** | Opens on the real park. Sourced NPS wildlife guidance and facts, Kuwohi naming, Whispering Valley kept as a labelled practice park. Checklist: `docs/REAL_PARK_CHECKLIST.md` |
| 14 | Elk and per-species safe distances | **Done (first pass)** | Elk herd in the Smokies. Deer keep 23 m, elk use the park's 50 yards (46 m). Bears still to do |
| 15 | Real terrain pilot from elevation data | **Done (first pass, needs first real download)** | Real Kuwohi-area relief blended into the Smokies hills, away from the trail. Guide: `docs/REAL_TERRAIN.md` |
| 16 | Black bears (calm-and-back-away lesson) | **Done (first pass)** | One bear in the Smokies; approach, back away, never run. Winter: no bears |
| 17 | Shenandoah (second real park) | **Done (first pass)** | Hawksbill area, NPS code `shen`, six sourced facts, real wildlife guidance (75 ft / 150 ft), Hawksbill real relief, deer and one bear |
| 18 | Shenandoah's own layout, unique Jump-to labels, redesigned landing page, clone guard | **Done (first pass)** | Own trail, brook, summit spot, hills and forest pattern. Park list with search and tabs. `npm run check:parks` errors if two real parks share a trail |
| 19 | Shenandoah scenery: Skyline Drive, parking area, stone walls, greenstone scree, summit wall, Blue Ridge ridgelines | **Done (first pass)** | Data-driven `features` block any park can use. Yellow-rope (fragile) vs red-rope (closed) warnings made clearer |
| 20 | More real parks (Acadia next) and a full real level | Next | Follow `docs/REAL_PARK_CHECKLIST.md`; give each park its own layout and features. Chiricahua (Arizona, the 64th national park since 20 Oct 2026) is on the list |

---

## 3. Controls

| Key | Action |
|---|---|
| **W A S D / &uarr; &darr; &larr; &rarr;** | Walk forward / back / strafe / turn |
| **Mouse Look** | Look around in 3D |
| **B** | Raise / lower field binoculars (Scroll wheel or `+` / `-` to zoom) |
| **V / Space** | Raise camera / click or Space to shoot photograph |
| **G** | View wildlife photo gallery |
| **K** | Draw / stow handheld liquid-damped compass & topo map |
| **X / R** | Drink from water canteen / Refill at treated potable water station |
| **Q** | Pick up litter when prompted (pack it out) |
| **J** | Field journal (Overview, Ranger Gear Shop, Wildlife, Places, Activity Log) |
| **E** | Summit observation telescope (full 360° pan and pitch into valley) |
| **C** | Crouch / low camera (stealth approach & camera stabilization) |
| **Shift** | Sprint (uses stamina) |
| **Tab** | Free / lock mouse pointer |
| **T** | Cycle lighting (Day, Sunset, Dawn, Twilight) |
| **1, 2, 3, 4** | Fast travel to discovered landmarks |
| **P** | Switch park (Whispering Valley / Great Smoky Mountains) |
| **M** | Mute / unmute nature soundscape |
| **F** | Photo mode (clean HUD view) |
| **Esc** | Pause / release mouse |

---

## 4. Design Tenets
1. **Explore Without Harming Nature:** Wildlife is never an adversary or target. Players are rewarded with credits and stewardship for keeping respectful distances (25 yards / 23 m) and watching quietly.
2. **Real Backcountry Knowledge:** Untreated river water carries risk warnings; hydration must be maintained with clean canteen water or treated potable stations.
3. **Equippable Gear with Real Capabilities:** Outfitter gear (ED glass, telephoto stabilization, electrolyte kits) provides tangible gameplay benefits.

---

## 5. Task 8: Responsible-Recreation Rules (how it works)
All of this is GAME content, not official NPS rules, closures or alerts. Real parks differ.

- **Wildlife distance:** within 23 m (25 yards) of an animal, a banner explains the rule and tells you to back away and zoom instead. If the animal is alert, the message changes to stay calm and back away. The banner starts 15 seconds after you enter a park.
- **Startling wildlife:** rushing or crowding an animal until it flees costs 1 Stewardship (at most once per 20 seconds, never below zero) with an explanation.
- **Closed areas:** a roped-off zone with a sign. You cannot enter it, and the reason is shown. No penalty.
- **Fragile areas:** a roped zone you can enter. A warning shows on approach. Staying off-trail inside it for 6 seconds costs 1 Stewardship (at most once per 45 seconds) with an explanation.
- **Litter:** 5 pieces of trash beside the trails in each park. Press Q within about 2.5 m to pack one out: +3 Credits and +1 Stewardship. Positions are fixed and each piece pays only once per save, so it cannot be farmed.
- Zones and litter are defined in `src/entities/rangerRules.ts`. Numbers are in `REWARDS` in `src/entities/progress.ts`.

## 6. Task 10: Seasons (how it works)
Pick a season on the start screen. Changing it reloads the park. Everything is driven by the table in `src/data/seasons.ts`. Wildlife notes are general natural history for learning, not official NPS information.

| | Spring | Summer | Autumn | Winter |
|---|---|---|---|---|
| Trees | Pale-green leaves, a few blossoms | Full green | Gold, orange and red leaves | Deciduous trees bare, evergreens frosted with snow |
| Ground and grass | Lush, fresh | Default look | Tan grass, warm ground | Snow cover (thicker on flat ground and with height), frosted grass |
| Deer | Notice you a bit sooner (fawn season) | Default | Rut: restless, notice you much sooner | Move less to save energy |
| Startling wildlife | -1 Stewardship | -1 | -1 | **-2** (fleeing burns scarce fat reserves) |
| Trails | Open | Open | Open | **Summit trail closed** (ice and snow), explained on screen. Fast travel to the summit is blocked too |

The last selected season is remembered in the browser. Summer matches the old default look.

## 7. Task 11: Parks as data (how it works)
A park is one object in `src/data/parks.ts`. The game code no longer mentions any specific park by name.
- New in each park's data: `wildlife.spawns`, `rules.zones`, `rules.litter`, `waterStations`.
- The [P] key cycles through every park in `AVAILABLE_PARKS`, so a third park appears automatically.
- `npm run check:parks` validates every park (missing fields, duplicate ids, deer or water stations in the river, closed areas covering the spawn point, and more).
- `docs/ADDING_A_PARK.md` is the step-by-step guide for adding a park.
- Nothing visible changes for players. Both existing parks behave exactly as before.

## 8. Task 12: Real NPS information (how it works)
- The NPS API key is a **GitHub Actions secret** named `NPS_API_KEY`. It is used only while the site is being built, sent in a request header, and never written to any file or into the page.
- `scripts/fetch-nps.ts` downloads each real park's info and alerts and saves clean JSON files (`public/nps/<code>.json`, not committed). The game reads those files. If the key is missing or NPS is down, the build still works and the game shows "not available".
- The site is rebuilt every day (and on every push), so alerts are at most about a day old. The panel shows the download time and always points to nps.gov.
- Start screen: **Official NPS information** panel (park summary, weather note, current alerts). Fictional parks say they have no NPS page.
- Only links to nps.gov are kept, HTML is stripped, and everything is shown as plain text.
- Real alerts are shown for information only. They do **not** change the game, and the game's own closures and rules remain examples, not NPS notices.
- A real park gets its data by adding `npsParkCode: 'grsm'` (the 4-letter NPS code) to its entry in `src/data/parks.ts`.
- Setup steps: `docs/NPS_SETUP.md`.

## 9. Task 13: The first real park (how it works)
- The game opens on **Great Smoky Mountains**. **Whispering Valley** stays as a labelled fictional practice park (second in the list).
- Each real park has an `about` block in `src/data/parks.ts`: a design note (the map is game-scale, not a survey), what the park says about wildlife (with source and caveat) and short sourced facts. It shows on the start screen (Park Rules card and the Official NPS information panel).
- Names follow the real park: the summit is **Kuwohi** (formerly Clingmans Dome), as restored in 2024.
- The validator refuses a real park without sourced facts. Checklist for future parks: `docs/REAL_PARK_CHECKLIST.md`.
- Game rules stay game rules. The deer distance in the game is still 23 m (25 yards). The park's own guidance (50 yards from bears and elk, or any distance that changes behaviour) is shown next to it with a note that NPS pages have given different elk distances over time.

## 10. Task 14: Elk and per-species distances (how it works)
- **Elk** live in the Great Smoky Mountains park only (a herd of 1 bull and 3 cows in a meadow to the west of the start, about 65 m away). The practice park has deer only.
- Each animal now carries its own **safe distance**. Defaults are in `src/data/species.ts`: deer 23 m, elk 46 m (50 yards, the park's guidance for elk). A park can override a species with `wildlife.safeDistanceOverrides` in its data.
- The warning banner, binocular "too close" check, photo scoring cap and reward messages all use the distance of the animal you are near.
- Elk behave differently: they notice you from about 22 m (32 m if you run) and only bolt when crowded (about 8 m), so you can get dangerously close without them running. That is the point: the banner and Stewardship penalty teach why you should not.
- The Field Journal now lists only the species that live in the current park. Elk have their own entry with 5 facts, and the Smokies show 5 animal variants in total (3 deer, 2 elk).
- Elk geometry is the deer model enlarged, with a dark neck, cream rump and branching antlers. It is a stand-in and may look rough.

## 11. Task 15: Real terrain pilot (how it works)
- On GitHub the build downloads free elevation tiles (AWS Terrain Tiles) for a 1 km window around Kuwohi and saves a small relief file. Full guide: `docs/REAL_TERRAIN.md`.
- The game blends that real relief into 60% of the rolling hills, but never near the trail, the spawn clearing, the summit plateau or the river valley.
- The start screen shows a Terrain note (source, real elevation range, share of real height shown, attribution). If the download fails, the game uses the built-in landscape and says so.
- The world is built only after the terrain data has loaded (a brief "Loading terrain..." screen).
- The standalone `park-explorer.html` carries the data inside it.

## 12. Task 16: Black bears (how it works)
- One adult black bear forages on the forested ridge below the summit in the Great Smoky Mountains (about 30 m off the trail and 160 m from the start). The practice park has none.
- **Bears are never an enemy.** They never chase or attack. The lesson comes from the park's own bear guidance: stay 50 yards (46 m) away, and if a bear approaches or follows you, change direction, slowly back away facing it, never run and never turn your back.
- A curious bear sometimes starts walking toward you when you are 25 to 70 m away and not sprinting. A banner tells you what to do.
  - **Back away slowly** (10 m of distance gained): the bear loses interest, you get **+5 Credits and +2 Stewardship** ("Bear Aware"). At most once per 90 s.
  - **Stand still:** the bear comes to about 12 m, stops and looks, then carries on. No reward, no penalty.
  - **Run (sprint):** one "Never run from a bear" lesson and -1 Stewardship. The bear does not chase.
  - **Walk up to it** (inside about 10 m): it walks away and counts as startling it.
- A bear may rise onto its hind legs when alert. That is curiosity, not aggression.
- Seasons: bears approach more often in autumn (they feed heavily before winter) and are not shown in winter (a game simplification: they are far less active then).
- The Field Journal has a Black Bear entry with 5 facts, each checked against the park's black bear and bear-safety pages. Smokies now show 6 animal variants (3 deer, 2 elk, 1 bear).
- Settings: `src/data/species.ts` (distance and facts), `src/data/seasons.ts` (`bear`), behaviour in `src/entities/deer.ts` (`updateBearBehavior`), rewards in `REWARDS` in `src/entities/progress.ts`.

## 13. Task 17: Shenandoah (how it works)
- Second real park, listed second in the park tabs ([P] cycles Smokies, Shenandoah, practice park). The game still opens on the Smokies.
- Data: NPS code `shen` (live NPS info and alerts, once the build has downloaded them), a Hawksbill real-relief window (`realTerrain`, id `shen`, centre 38.5553 N, 78.3950 W from Wikipedia and SummitPost) and a sourced `about` block (six facts, each with an nps.gov link, checked 2026-10-19).
- **The park's own distances are the game's distances:** Shenandoah asks for 75 feet (23 m) from all wildlife and 150 feet (46 m) from black bears. Those are exactly the game's deer and bear numbers, so there is no caveat.
- Wildlife: four deer (doe, buck, fawn, second doe) and one black bear. No elk (they do not live in the park). The bear lesson is the same: if a bear comes closer, move away slowly without turning your back, never run. The park's page adds that a bear may stand on its hind legs for a better look or smell, which is curiosity.
- Names: Hawksbill (4,051 ft / 1,235 m, highest peak), Hawksbill Gap trailhead, Lower Hawksbill Trail, Hawksbill Summit observation platform. Elevation range 535 ft (163 m) to 4,051 ft is from the NPS park statistics page.
- No winter summit closure: Hawksbill is a year-round hike, so the game does not invent a closure there. The start-screen trail line says real trails and roads can close and to check nps.gov.
- The map has its own layout (Tasks 18 and 19): a long climb with two hairpins, a narrow brook with a short footbridge, its own hills and forest pattern, Skyline Drive, the Hawksbill Gap parking area, stone walls, greenstone scree, a stone summit wall and layered Blue Ridge ridgelines. It is a game-scale landscape, not a survey.
- Add-a-park steps and honesty rules: `docs/ADDING_A_PARK.md`, `docs/REAL_PARK_CHECKLIST.md`.

## 13b. Tasks 18 and 19: every park gets its own look
- **Own layout:** each real park defines its own `spawn`, `terrain.mountain`, `trail`, `water`, `terrain.noiseX/noiseZ` (hill pattern) and `layoutSeed` (tree, rock and log scatter). `npm run check:parks` reports an error if two real parks share the same trail.
- **Optional `features` block (Task 19):** `roads` (road, parking area, driveway; the ground is levelled under them and trees, rocks and grass keep off), `cars`, `talusFields` (angular boulder fields), `summitWall` and `distantRidges`. Parks without it are unchanged. `trail.surface` recolours the path.
- **Ropes:** red-capped ropes are closed areas and block you. Yellow-capped ropes are fragile areas: you can walk in, but Stewardship drops if you stay about 6 seconds. The on-screen message now says so.
- **Park count:** the long-term goal is every U.S. national park, now **64** (Chiricahua in Arizona became the 64th on 20 October 2026).

## 14. Known limitations
- Not browser-tested by the assistant: type-checked, built and logic-tested with scripts only.
- The deer spawn within 23 m of the start point, so the distance banner appears early on the first stretch of trail. This is intentional teaching, but may need tuning.
- Trees and rocks do not block binocular or camera views.
- Three species (deer, elk, black bear). Desktop browsers only.
- Bears: one bear only, no cubs (a mother with cubs would need extra rules), no food or campsite mechanics yet, and the model is the deer body reshaped, so it may look rough. The "rise onto hind legs" pose is simple.
- Shenandoah's scenery (Task 19) is game-made: the road, cars and walls are simple shapes, and the positions are not a survey of Hawksbill Gap.
- Bear approach is simplified: a bear that is approached by a standing player just stops at about 12 m and carries on.
- The Smokies map is still a game landscape with real names. Real relief from the Kuwohi area is blended into the hills (Task 15), but the trail, river and landmarks are hand-placed, so it is not a map of the real park.
- The terrain download has only been tested with made-up tiles. The first real download happens on GitHub, so check the build log line starting with `[terrain]`.
- Elk have no calves, and their rut behaviour is simplified (they are only more alert in autumn).
- Facts in the `about` block are a snapshot (checked 2026-10-10). Re-check them from time to time.
- NPS data is a snapshot from build time (up to about a day old) and is not shown inside the 3D world, only on the start screen. The standalone `park-explorer.html` carries the snapshot from when it was built.
- The NPS download was tested against a simulated NPS server only. The first real run happens on GitHub after you add the secret.
- Terrain shape and trail curves still use shared code; new parks reuse the same generated terrain with different numbers, but now with their own layout, hill pattern and optional features.
- The Switchback landmark's stored height (16.5) is higher than the ground there, so fast travel drops you slightly. The checker flags it.
- Seasons are visual and behavioural only: no rain, snowfall or wind yet. Winter trees are bare trunks, which may look sparse.
- Photos do not record which season they were taken in yet.
