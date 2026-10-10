# Checklist for adding a REAL park

A real park must be honest. Work through this list before it ships.

1. **Pick the park code.** The 4-letter NPS code (for example `grsm`). Put it in `npsParkCode` so live NPS info and alerts appear.
2. **Copy a park entry** and follow `docs/ADDING_A_PARK.md` for the numbers (terrain, trail, vegetation, spawns, zones, litter, water).
3. **Use real names, and check them.** Place names change (Clingmans Dome became Kuwohi in 2024). Check the park's own pages.
4. **Fill the `about` block**, with no unsourced facts:
   - `designNote`: say plainly that the map is a game-scale landscape inspired by the park, not a survey.
   - `wildlifeGuidance`: what the park itself says about viewing wildlife, with the page it came from. If NPS pages disagree, say so in `caveat`.
   - `facts`: 3 to 6 short facts. Each needs a `sourceUrl` and `sourceLabel`. Prefer nps.gov pages.
   - `checkedOn`: the date you checked them.
5. **Do not invent rules, closures or alerts.** The game's own zones are examples. Real alerts come only from the NPS download.
6. **Species.** Only add an animal to `wildlife.spawns` if it really lives in that park. Dangerous animals (bears, wolves) are never enemies. They need larger distances and calm, educational handling.
7. **Run `npm run check:parks`** and fix every error. Look at every warning.
8. **Play it** in the browser and write down anything odd.

## Decision log
- **Great Smoky Mountains** is the first real park (Task 13): the engine already had it, it has an NPS code, and white-tailed deer are real Smokies wildlife.
- **Whispering Valley** is kept as a clearly labelled fictional **practice park** (fallback and testing baseline). Revisit removing it, or hiding it from the park list, once there are three or more real parks.
