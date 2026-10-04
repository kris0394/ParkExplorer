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
| 8 | Responsible recreation rules & wildlife distance alerts | Next | Trail warnings, educational closures |

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
