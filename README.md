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
| 13 | First real park, then more | Next | Build the first fully real park as data |

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

## 9. Known limitations
- Not browser-tested by the assistant: type-checked, built and logic-tested with scripts only.
- The deer spawn within 23 m of the start point, so the distance banner appears early on the first stretch of trail. This is intentional teaching, but may need tuning.
- Trees and rocks do not block binocular or camera views.
- Only one species (white-tailed deer). Desktop browsers only.
- NPS data is a snapshot from build time (up to about a day old) and is not shown inside the 3D world, only on the start screen. The standalone `park-explorer.html` carries the snapshot from when it was built.
- The NPS download was tested against a simulated NPS server only. The first real run happens on GitHub after you add the secret.
- Terrain shape and trail curves still use shared code; new parks reuse the same generated terrain with different numbers.
- The Switchback landmark's stored height (16.5) is higher than the ground there, so fast travel drops you slightly. The checker flags it.
- Seasons are visual and behavioural only: no rain, snowfall or wind yet. Winter trees are bare trunks, which may look sparse.
- Photos do not record which season they were taken in yet.
