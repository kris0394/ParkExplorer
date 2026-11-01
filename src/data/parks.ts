/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Season } from './seasons.ts';
import type { TrailPath, TrailBridge, WaterMode } from './parkStructure.ts';

export type { TrailPath, TrailBridge, WaterMode };

/** A roped-off area. 'closed' = cannot enter. 'sensitive' = can enter but staying off-trail costs Stewardship. */
export interface ParkZone {
  id: string;
  kind: 'closed' | 'sensitive';
  name: string;
  x: number;
  z: number;
  radius: number;
  /** Short explanation shown to the player (mistakes teach). */
  reason: string;
  /** If set, the zone only exists in these seasons (seasonal closures). */
  seasons?: Season[];
}

/** One piece of litter, placed beside a trail. Positions are fixed so rewards cannot be farmed. */
export interface ParkLitter {
  id: string;
  label: string;
  tip: string;
  kind: 'can' | 'bottle' | 'wrapper' | 'peel' | 'bag';
  /** Id of the trail path it lies beside (Task 22). Older parks use 'west' and 'east'. */
  trail: string;
  /** 0 to 1 along that trail. */
  at: number;
  /** Which side of the trail (1 left, -1 right). */
  side: 1 | -1;
}

export interface ParkWildlifeSpawn {
  species: 'white-tailed-deer' | 'elk' | 'black-bear';
  isBuck: boolean;
  isFawn?: boolean;
  x: number;
  z: number;
  roamRadius: number;
}

/** A real fact about a real park, with where it came from. */
export interface ParkFact {
  id: string;
  title: string;
  text: string;
  /** Page the fact was checked against. */
  sourceUrl: string;
  sourceLabel: string;
}

/** Task 13: honest, sourced information for REAL parks. Fictional parks leave this out. */
export interface ParkAbout {
  /** How the game models this park (so nobody mistakes it for a survey map). */
  designNote: string;
  /** What the park itself says about viewing wildlife. */
  wildlifeGuidance: { text: string; caveat: string; sourceUrl: string; sourceLabel: string };
  facts: ParkFact[];
  /** Date the facts and guidance were last checked (YYYY-MM-DD). */
  checkedOn: string;
}

/** Treated drinking-water stations where the canteen can be refilled. */
export interface ParkWaterStation {
  id: string;
  name: string;
  x: number;
  z: number;
  radius: number;
}

/** Task 19: a road, parking area or driveway. Terrain is levelled under it and trees/rocks keep off it. */
export interface ParkRoad {
  id: string;
  name: string;
  kind: 'road' | 'lot' | 'drive';
  /** Take this level from another road (by id), so a parking area and its entrance sit level with the road they join. */
  levelFrom?: string;
  /** Optional surface colours (hex) and whether to paint lane lines. Default: grey asphalt with lines. */
  surface?: { paved?: number; shoulder?: number; lines?: boolean; wallColors?: number[] };
  /** Width of the paved surface in metres. */
  width: number;
  nodes: { x: number; z: number }[];
  /** Low stone walls along the road edge. from/to are 0 to 1 along the road; side 1 or -1 picks the edge. */
  walls?: { side: 1 | -1; from: number; to: number }[];
}

/** Optional scenery that makes one park look like itself (everything here is optional). */
export interface ParkFeatures {
  roads?: ParkRoad[];
  /** Parked cars (colour is a hex number). */
  cars?: { x: number; z: number; yaw: number; color: number }[];
  /** Fields of angular boulders, for example greenstone scree. */
  talusFields?: {
    x: number; z: number; radius: number; innerRadius?: number; count: number;
    /** Rock colours (hex). Default: grey-green greenstone. */
    colors?: number[];
    /** Smallest and largest rock size in metres (default 0.35 to 1.6). */
    sizeRange?: [number, number];
    /** Rounded boulders (glacial erratics) instead of angular scree. */
    round?: boolean;
  }[];
  /** Tall balancing-rock pillars (Chiricahua's rhyolite "standing-up rocks"). */
  pinnacles?: {
    x: number; z: number; radius: number; innerRadius?: number; count: number;
    minHeight: number; maxHeight: number;
    /** Rock colours (hex). */
    colors?: number[];
  }[];
  /** Desert plants: agave, sotol/yucca and prickly pear, scattered over open dry ground. */
  succulents?: { count: number; spread: number; maxHeight: number };
  /** A small stone fire-lookout hut beside the summit deck. */
  lookoutHut?: boolean;
  /** Task 24: a tall steel fire tower (you cannot climb it) at the given spot, as at Rankin Ridge. */
  fireTower?: { x: number; z: number; height?: number };
  /** Trail cairns (small stacks of stones) on bare ground above this height, one every `every` metres. */
  cairns?: { minHeight: number; every: number; /** Which trail paths get cairns (default: the path that climbs to the summit). */ pathIds?: string[] };
  /** The sea (needs terrain.coast) and rocky islands out in it. */
  sea?: { color: number };
  islands?: { x: number; z: number; radius: number; height: number }[];
  /** A low stone wall around the summit deck, with a gap (in degrees) where the trail arrives. */
  summitWall?: { gapDeg: number };
  /** Layered blue ridgelines on the horizon. */
  distantRidges?: boolean;
}

export interface ParkDefinition {
  id: string;
  name: string;
  subtitle: string;
  parkServiceUnit: string; // e.g. "National Park"
  state: string;
  region: string;
  /** Real NPS park code (e.g. 'grsm'). Leave out for fictional parks. Used to show live NPS info and alerts. */
  npsParkCode?: string;
  /**
   * Task 15: optional real elevation relief for part of the terrain (made at build time from free elevation data).
   * Leave out for parks that use only the procedural landscape.
   */
  realTerrain?: {
    /** File name stem: public/terrain/<id>.json */
    id: string;
    featureName: string;
    centerLat: number;
    centerLon: number;
    /** Tile zoom level (13 is about 15 m per pixel). */
    zoom: number;
    /** Width of the real window in metres, and grid spacing. */
    sizeM: number;
    stepM: number;
    /** World position where the centre of the window is placed (the real feature lines up with this). */
    originX: number;
    originZ: number;
    /** How strongly real relief replaces the procedural hills away from the trail (0 to 1). */
    mix: number;
    /** Overall slopes larger than this (metres) are removed. */
    detrendSigmaM: number;
  };
  /** Task 19: park-specific scenery (roads, cars, boulder fields, summit wall, distant ridges). */
  features?: ParkFeatures;
  /** Optional: changes where trees, rocks and logs are scattered, so each park's forest is its own. Leave out for the original pattern. */
  layoutSeed?: number;
  /** True for fictional demo parks (shown as "Practice park"). */
  isPracticePark?: boolean;
  /** Task 13: sourced real-park information (real parks only). */
  about?: ParkAbout;
  description: string;
  elevationRange: { min: number; max: number };
  spawn: {
    x: number;
    y: number;
    z: number;
    yaw: number;
  };
  terrain: {
    baseScale: number;
    heightScale: number;
    /** Optional: shifts the hill pattern so this park's hills differ from other parks. */
    noiseX?: number;
    noiseZ?: number;
    /** Optional: land slopes down into the sea on the east side. x0 is roughly where the shore is; wiggle bends the shoreline. */
    coast?: { x0: number; wiggle: number; seaY: number; floorY: number };
    mountain: {
      x: number;
      z: number;
      height: number;
      radius: number;
      plateauRadius: number;
      name: string;
    };
    /**
     * Task 24 "ground look": patchy ground colour (opt-in). Big soft patches of several colours (green, gold, sage,
     * tan), some bare soil, and fine speckle, so the ground no longer looks like one smooth lawn.
     */
    groundLook?: {
      /** Patch size (smaller = bigger patches), e.g. 0.018. */
      patchScale: number;
      /** 0 to 1: how strongly the patch colours show. */
      strength: number;
      /** Patch colours, blended across the land in order. */
      patches: number[];
      /** 0 to 0.4: fine brightness speckle. */
      speckle: number;
      /** Bare soil showing through (optional). */
      soil?: { color: number; amount: number };
      /** How much dark forest-floor mulch shows (1 = as in forest parks, 0 = none). Prairie parks use a small number. */
      mulch?: number;
    };
    colors: {
      valley: number;
      meadow: number;
      dryGrass: number;
      steepSlope: number;
      summitRock: number;
      riverbed: number;
      riverbank: number;
    };
  };
  water: {
    /** True only for a flowing river. Kept so older parks keep working; new parks should set `mode`. */
    hasRiver: boolean;
    /**
     * Task 22: 'river' = flowing water with a water surface (default when hasRiver is true).
     * 'dry-wash' = a shallow gravel channel with no water, crossed at ground level.
     * 'none' = no channel at all.
     */
    mode?: WaterMode;
    /** Task 22: the z position the winding channel is measured from (default: the first bridge's centerZ, else 0). */
    refZ?: number;
    /** Task 22: flat stepping stones across a dry wash, one set per crossing (z is where the trail crosses). */
    stones?: { z: number; count?: number }[];
    /** Task 22: how deep a dry wash is cut below the land, in metres (default 0.55). */
    washDepth?: number;
    name: string;
    surfaceY: number;
    halfWidth: number;
    bankWidth: number;
    valleyWidth: number;
    gradient: number;
    deepColor: number;
    shallowColor: number;
    skyReflectColor: number;
    /** Optional: the winding shape of the river (defaults to the original wide river). */
    course?: { baseX?: number; amp1?: number; freq1?: number; amp2?: number; freq2?: number; phase2?: number };
  };
  trail: {
    name: string;
    width: number;
    /** Optional trail surface colours (hex). Defaults to packed dirt. */
    surface?: { center: number; mid: number; edge: number };
    /**
     * Task 22: any number of trail paths (loops and branches allowed). When this is present it is used
     * instead of westNodes and eastNodes.
     */
    paths?: TrailPath[];
    /** Older parks: the two trail pieces. Optional when `paths` is given. */
    westNodes?: { x: number; z: number }[];
    eastNodes?: { x: number; z: number }[];
    /** One footbridge (older parks). Leave out for parks without a bridge. */
    bridge?: TrailBridge;
    /** Task 22: several footbridges. */
    bridges?: TrailBridge[];
  };
  overlook: {
    name: string;
    elevationLabel: string;
    deckRadius: number;
    hasBench: boolean;
    hasTelescope: boolean;
    signHeading: string;
    signSubheading: string;
  };
  vegetation: {
    treeCount: number;
    shrubCount: number;
    /** Task 19: how this park's plant life LOOKS (all optional; leave out for the original look). */
    look?: {
      /** Leaf colours by tree kind (replaces the default greens in summer; autumn and winter still apply). */
      palettes?: Partial<Record<'conifer' | 'pine' | 'broadleaf' | 'oak' | 'birch' | 'poplar', number[]>>;
      /** Tree size multiplier (1 = normal). */
      treeScale?: number;
      /** Height (m) above which no trees grow, leaving bare granite summits. */
      treeLine?: number;
      /** 0 to 1: share of the land left as open sunny glades between woods (0 = unbroken forest). */
      glades?: number;
      /**
       * Task 24 "grassland look": a richer, less lawn-like grass (opt-in; leave out for the original look).
       * More and varied tufts (taller in some patches, shorter in others, golden or green), a carpet of short
       * grass, and gentle wind sway.
       */
      grassland?: {
        /** Tuft count compared with the original (1 = same, 1.8 = 80% more). */
        density: number;
        /** How far from you tufts are drawn, in metres (original 46). */
        radius: number;
        /** Height multiplier range between short and tall patches, e.g. [0.55, 1.7]. */
        heightRange: [number, number];
        /** How big the tall and short patches are (smaller = bigger patches), e.g. 0.035. */
        patchScale: number;
        /** Colour multipliers blended across the land (greenish, golden, straw...). */
        tints: number[];
        /** Wind sway, 0 (none) to 1 (strong). */
        sway: number;
        /** A carpet of short grass underfoot. */
        carpet?: { count: number; radius: number; height: number; root: number; tip: number; tipDry: number };
      };
      /** Task 23: treeless grassy meadows (like the Smokies' grassy balds). No trees or fallen logs grow inside. */
      balds?: { x: number; z: number; radius: number }[];
      /** Bush colours in summer. */
      shrubPalette?: number[];
      /** Grass, fern and wildflower colours. */
      grass?: { root?: number; stalk?: number; dry?: number; fern?: number; flowerA?: number; flowerB?: number };
    };
    speciesWeights: {
      conifer: number;
      pine: number;
      broadleaf: number;
      oak: number;
      birch: number;
      poplar: number;
      snag: number;
    };
  };
  atmosphere: {
    fogColor: number;
    fogDensity: number;
    hemiSky: number;
    hemiGround: number;
    sunColor: number;
    sunIntensity: number;
    skyHorizon: number;
    skyMid: number;
    skyZenith: number;
    skySun: number;
  };
  landmarks: {
    id: string;
    name: string;
    description: string;
    x: number;
    y: number;
    z: number;
    yaw: number;
    /** Task 22: short label for the "Jump to" bar (default: a plain word for the old ids, else the first word of the name). */
    shortName?: string;
  }[];
  /** Task 11: everything below used to be hard-coded in game code. */
  wildlife: {
    spawns: ParkWildlifeSpawn[];
    /** Safe viewing distance per species (metres). Species defaults apply when a species is not listed. */
    safeDistanceOverrides?: Record<string, number>;
  };
  rules: {
    zones: ParkZone[];
    litter: ParkLitter[];
  };
  waterStations: ParkWaterStation[];
}

/**
 * Shared, reusable pieces. A new park can reuse these or define its own.
 */
const STANDARD_LITTER: ParkLitter[] = [
  { id: 'can-1', label: 'Crushed soda can', tip: 'Pack it out. Metal does not break down on the trail.', kind: 'can', trail: 'west', at: 0.55, side: 1 },
  { id: 'bottle-1', label: 'Plastic water bottle', tip: 'Plastic lasts for centuries and can harm animals that nibble it.', kind: 'bottle', trail: 'east', at: 0.14, side: -1 },
  { id: 'wrapper-1', label: 'Snack wrapper', tip: 'Wrappers blow away easily. Keep trash zipped in your pack.', kind: 'wrapper', trail: 'east', at: 0.34, side: 1 },
  { id: 'peel-1', label: 'Banana peel', tip: 'Peels rot slowly and teach animals to look for human food. Pack them out too.', kind: 'peel', trail: 'east', at: 0.56, side: -1 },
  { id: 'bag-1', label: 'Plastic bag', tip: 'Loose bags can trap or choke wildlife. Always carry them out.', kind: 'bag', trail: 'east', at: 0.78, side: 1 },
];

const SUMMIT_WINTER_CLOSURE: ParkZone = {
  id: 'summit-winter-closure',
  kind: 'closed',
  name: 'Summit Trail (Winter Closure)',
  x: 82,
  z: -70,
  radius: 15,
  seasons: ['winter'],
  reason: 'Closed for winter. Ice and snow on the exposed upper steps make slips and falls likely. It reopens in spring.',
};

const TRAILHEAD_AND_SUMMIT_WATER = (spawn: { x: number; z: number }, summit: { x: number; z: number }): ParkWaterStation[] => [
  { id: 'trailhead', name: 'Trailhead Potable Water Station', x: spawn.x, z: spawn.z, radius: 8.5 },
  { id: 'summit', name: 'Summit Overlook Potable Water Fountain', x: summit.x - 2.2, z: summit.z + 1.8, radius: 6.0 },
];

/**
 * PROTOTYPE PARK: Whispering Valley & Pine Ridge
 * The baseline development park used for core physics and environment tests.
 */
export const PROTOTYPE_PARK: ParkDefinition = {
  id: 'whispering-valley',
  isPracticePark: true,
  name: 'Whispering Valley',
  subtitle: 'Alpine Forest & Valley River',
  parkServiceUnit: 'Research Reserve',
  state: 'Pacific Northwest',
  region: 'Pacific Northwest',
  description: 'A tranquil test park featuring rolling glacial hills, a winding mountain stream, wooden footbridge, and a switchback trail leading to Eagle Crest Summit.',
  elevationRange: { min: -1, max: 32 },
  spawn: {
    x: 0.0,
    y: 2.4,
    z: 14.0,
    yaw: 0,
  },
  terrain: {
    baseScale: 0.0055,
    heightScale: 17.0,
    mountain: {
      x: 82.0,
      z: -70.0,
      height: 30.5,
      radius: 58.0,
      plateauRadius: 7.5,
      name: 'Eagle Crest Peak',
    },
    colors: {
      valley: 0x35704f,     // lush fern green
      meadow: 0x6b954b,     // vibrant moss green
      dryGrass: 0xb8b25c,   // dry alpine grass
      steepSlope: 0x7d6444, // dark forest loam
      summitRock: 0x5c574e, // granite crags
      riverbed: 0x3a3328,   // dark wet pebbles
      riverbank: 0x565c40,  // moist silt
    },
  },
  water: {
    hasRiver: true,
    name: 'Whispering Brook',
    surfaceY: -1.0,
    halfWidth: 6.2,
    bankWidth: 7.0,
    valleyWidth: 34.0,
    gradient: 0.0025,
    deepColor: 0x194e54,
    shallowColor: 0x357873,
    skyReflectColor: 0xa0cdd6,
  },
  trail: {
    name: 'Eagle Crest Summit Trail',
    width: 2.3,
    westNodes: [
      { x: 0.0, z: 14.0 },
      { x: 5.5, z: 12.0 },
      { x: 10.0, z: 9.5 },
      { x: 13.5, z: 6.8 },
      { x: 16.5, z: 4.0 },
    ],
    eastNodes: [
      { x: 41.5, z: 4.0 },
      { x: 46.5, z: 2.5 },
      { x: 51.5, z: -1.5 },
      { x: 56.5, z: -6.5 },
      { x: 62.5, z: -13.0 },
      { x: 70.0, z: -22.0 },
      { x: 79.5, z: -31.5 },
      { x: 91.0, z: -39.5 },
      { x: 99.5, z: -52.0 },
      { x: 102.5, z: -65.0 },
      { x: 98.0, z: -78.5 },
      { x: 88.5, z: -86.5 },
      { x: 76.5, z: -84.0 },
      { x: 73.0, z: -75.5 },
      { x: 79.5, z: -70.5 },
    ],
    bridge: {
      name: 'River Crossing Bridge',
      westX: 16.5,
      eastX: 41.5,
      centerZ: 4.0,
      deckY: 1.25,
      width: 3.6,
    },
  },
  overlook: {
    name: 'Eagle Crest Summit Overlook',
    elevationLabel: 'Elev. 30.5m',
    deckRadius: 4.8,
    hasBench: true,
    hasTelescope: true,
    signHeading: 'EAGLE CREST',
    signSubheading: 'SUMMIT OVERLOOK',
  },
  vegetation: {
    treeCount: 1100,
    shrubCount: 1500,
    speciesWeights: {
      conifer: 4.0,
      pine: 2.5,
      broadleaf: 3.0,
      oak: 2.2,
      birch: 1.0,
      poplar: 0.8,
      snag: 0.3,
    },
  },
  atmosphere: {
    fogColor: 0xd5dcc4,
    fogDensity: 0.0105,
    hemiSky: 0xbfe0e8,
    hemiGround: 0x7a8a4a,
    sunColor: 0xffe0ae,
    sunIntensity: 2.6,
    skyHorizon: 0xd5dcc4,
    skyMid: 0xa9d0d2,
    skyZenith: 0x5d9cc2,
    skySun: 0xffe2a8,
  },
  landmarks: [
    {
      id: 'spawn',
      name: 'Trailhead Meadow',
      description: 'The starting meadow sheltered by tall Douglas firs.',
      x: 0,
      y: 2.4,
      z: 14,
      yaw: 0,
    },
    {
      id: 'bridge',
      name: 'Whispering River Footbridge',
      description: 'A heavy timber footbridge spanning the rushing stream.',
      x: 18.0,
      y: 1.35,
      z: 4.0,
      yaw: -Math.PI / 2,
    },
    {
      id: 'switchback',
      name: 'Hillside Spiral Switchback',
      description: 'Midway up the mountain ridge with panoramic river views.',
      x: 95.0,
      y: 16.5,
      z: -55.0,
      yaw: -Math.PI * 0.8,
    },
    {
      id: 'summit',
      name: 'Eagle Crest Summit Overlook',
      description: 'The observation terrace with viewing bench and brass telescope.',
      x: 82.0,
      y: 30.7,
      z: -70.0,
      yaw: Math.PI * 0.8,
    },
  ],
  wildlife: {
    spawns: [
      { species: 'white-tailed-deer', isBuck: false, isFawn: false, x: 6.0, z: 9.5, roamRadius: 16.0 },   // Doe on right
      { species: 'white-tailed-deer', isBuck: true, isFawn: false, x: -8.0, z: 8.5, roamRadius: 18.0 },   // Antlered buck on left
      { species: 'white-tailed-deer', isBuck: false, isFawn: true, x: 8.5, z: 7.0, roamRadius: 12.0 },    // Spotted fawn
      { species: 'white-tailed-deer', isBuck: false, isFawn: false, x: 13.5, z: 5.0, roamRadius: 15.0 }, // Second doe near trees
    ],
  },
  rules: {
    zones: [
      {
        id: 'streambank-restoration',
        kind: 'closed',
        name: 'Streambank Restoration Area',
        x: -8,
        z: -30,
        radius: 9,
        reason: 'Closed while newly planted vegetation takes hold. Roots keep the soil from washing into the river.',
      },
      {
        id: 'wildflower-meadow',
        kind: 'sensitive',
        name: 'Fragile Wildflower Meadow',
        x: 70,
        z: 32,
        radius: 11,
        reason: 'Fragile plants. Walking off the trail crushes flowers and compacts soil, and plants can take years to recover.',
      },
      SUMMIT_WINTER_CLOSURE,
    ],
    litter: STANDARD_LITTER,
  },
  waterStations: TRAILHEAD_AND_SUMMIT_WATER({ x: 0, z: 14 }, { x: 82, z: -70 }),
};

/**
 * FIRST REAL NATIONAL PARK: Great Smoky Mountains National Park
 * Characterized by ancient weathered ridges, characteristic blue mist/haze,
 * sugar maples, yellow birches, mountain streams, and the Kuwohi Ridge Overlook.
 */
export const GREAT_SMOKY_MOUNTAINS: ParkDefinition = {
  id: 'great-smoky-mountains',
  // TODO (planned, not done yet): adopt the Task 24 ground look and grassland look here, as Wind Cave does (terrain.groundLook and vegetation.look.grassland)
  npsParkCode: 'grsm',
  // Task 15 pilot: real elevation relief from the Kuwohi (Clingmans Dome) area, placed so the real summit lines up with the game's summit
  realTerrain: {
    id: 'grsm',
    featureName: 'Kuwohi area',
    centerLat: 35.5628,
    centerLon: -83.4986,
    zoom: 13,
    sizeM: 1000,
    stepM: 5,
    originX: 82,
    originZ: -70,
    mix: 0.6,
    detrendSigmaM: 120,
  },
  name: 'Great Smoky Mountains',
  subtitle: 'Blue Mist Ridges & Ancient Forest',
  parkServiceUnit: 'National Park',
  state: 'North Carolina / Tennessee',
  region: 'Southeast / Southern Appalachians',
  description: 'World-renowned for its biodiversity and ancient mountains shrouded in blue mist. Ridge upon ridge of forest straddles the border between North Carolina and Tennessee.',
  elevationRange: { min: 260, max: 2025 },
  spawn: {
    x: 58.0,
    y: 8.1,
    z: -6.0,
    yaw: -0.98, // faces the start of the steep paved Kuwohi Trail
  },
  terrain: {
    baseScale: 0.0048,
    heightScale: 19.5, // taller rolling ridges
    noiseX: -75,       // Task 23: hill pattern chosen so the Forney Ridge Trail walks DOWNHILL from the parking area to Andrews Bald
    noiseZ: 15,
    mountain: {
      x: 82.0,
      z: -70.0,
      height: 33.0,
      radius: 64.0,
      plateauRadius: 8.0,
      name: 'Kuwohi Ridge High Point',
    },
    colors: {
      valley: 0x2b593f,     // deep Appalachian cove forest green
      meadow: 0x56823e,     // rich moss and laurel thicket green
      dryGrass: 0xa8a855,   // mountain balds grass
      steepSlope: 0x6e5239, // rich dark humid loam
      summitRock: 0x635e58, // weathered Thunderhead sandstone
      riverbed: 0x332d26,   // tumbled stream cobbles
      riverbank: 0x4a543b,  // shaded streamside moss
    },
  },
  water: {
    // Task 23: the Kuwohi crest has no stream on the NPS visitor pages, so the park has no river, no footbridge and no
    // flowing water in this map (older versions invented a "Roaring Fork Footbridge" here).
    hasRiver: false,
    mode: 'none',
    name: 'No stream on the crest',
    surfaceY: -1.0,
    halfWidth: 6.5,
    bankWidth: 7.5,
    valleyWidth: 36.0,
    gradient: 0.0028,
    deepColor: 0x143f45,
    shallowColor: 0x2c6863,
    skyReflectColor: 0x8dafc2,
  },
  trail: {
    name: 'Kuwohi Area Trails',
    width: 2.4,
    // Task 23: the trails of the Kuwohi area (NPS "Trails in the Kuwohi Area" map), at game scale:
    // a steep paved trail from the parking area to the tower, the Forney Ridge Trail that DESCENDS from the west end
    // of the parking area to Andrews Bald, the Kuwohi Bypass Trail that climbs from the same trailhead to the
    // Appalachian Trail, and the Appalachian Trail passing north of the tower.
    paths: [
      {
        id: 'kuwohi-trail',
        name: 'Kuwohi Trail (steep paved path to the tower)',
        nodes: [
          { x: 70.0, z: -14.0 },
          { x: 99.0, z: -20.7 },
          { x: 118.4, z: -39.5 },
          { x: 124.5, z: -63.3 },
          { x: 117.9, z: -84.5 },
          { x: 102.7, z: -97.4 },
          { x: 85.1, z: -99.9 },
          { x: 71.1, z: -93.4 },
          { x: 64.1, z: -82.1 },
          { x: 64.6, z: -70.9 },
          { x: 70.3, z: -63.8 },
          { x: 77.3, z: -62.2 },
          { x: 79.5, z: -70.5 },
        ],
      },
      {
        id: 'forney-ridge-trail',
        name: 'Forney Ridge Trail (down to Andrews Bald)',
        nodes: [
          { x: 50.0, z: -6.0 },
          { x: 43.0, z: 3.0 },
          { x: 33.0, z: 8.0 },
          { x: 23.0, z: 6.0 },
          { x: 14.0, z: 12.0 },
          { x: 12.0, z: 23.0 },
          { x: 21.0, z: 31.0 },
          { x: 24.0, z: 42.0 },
          { x: 15.0, z: 50.0 },
          { x: 5.0, z: 47.0 },
          { x: 2.0, z: 37.0 },
        ],
      },
      {
        id: 'kuwohi-bypass-trail',
        name: 'Kuwohi Bypass Trail',
        nodes: [
          { x: 50.0, z: -6.0 },
          { x: 40.0, z: -22.0 },
          { x: 34.0, z: -40.0 },
          { x: 38.0, z: -58.0 },
          { x: 46.0, z: -76.0 },
          { x: 56.0, z: -92.0 },
          { x: 68.0, z: -103.0 },   // joins the Appalachian Trail
        ],
      },
      {
        id: 'appalachian-trail',
        name: 'Appalachian Trail',
        nodes: [
          { x: 8.0, z: -108.0 },
          { x: 30.0, z: -106.0 },
          { x: 52.0, z: -104.0 },
          { x: 70.0, z: -104.0 },
          { x: 90.0, z: -106.0 },
          { x: 112.0, z: -104.0 },
          { x: 135.0, z: -98.0 },
        ],
      },
    ],
  },
  overlook: {
    name: 'Kuwohi Observation Overlook',
    elevationLabel: 'Elev. 2,025m (6,643 ft)',
    deckRadius: 5.2,
    hasBench: true,
    hasTelescope: true,
    signHeading: 'KUWOHI',
    signSubheading: 'FORMERLY CLINGMANS DOME',
  },
  vegetation: {
    treeCount: 1300,
    shrubCount: 1900, // dense rhododendron and laurel understory
    // Task 23: the Kuwohi crest is spruce-fir forest (NPS), so conifers dominate; Andrews Bald is a treeless grassy meadow
    look: {
      balds: [{ x: 0.0, z: 38.0, radius: 14.0 }],
    },
    speciesWeights: {
      conifer: 8.0,     // red spruce & fraser fir
      pine: 0.3,
      broadleaf: 1.2,
      oak: 0.2,
      birch: 1.2,       // yellow birch
      poplar: 0.1,
      snag: 0.9,
    },
  },
  atmosphere: {
    // The famous Smokies blue haze!
    fogColor: 0x9fb6c8,
    fogDensity: 0.0125, // thicker signature mountain mist
    hemiSky: 0xb5d4e8,
    hemiGround: 0x5a7a4a,
    sunColor: 0xffe8c2,
    sunIntensity: 2.5,
    skyHorizon: 0x9fb6c8,
    skyMid: 0x7da4be,
    skyZenith: 0x3d7096,
    skySun: 0xffe2a8,
  },
  // Task 23: landmarks of the Kuwohi area (keys 1 to 5)
  landmarks: [
    {
      id: 'spawn',
      name: 'Kuwohi Parking Area',
      shortName: 'Parking Area',
      description: 'The large parking area at the end of Kuwohi Road, with a small visitor center. The Forney Ridge and Bypass trails start at its west end.',
      x: 58,
      y: 8.1,
      z: -6,
      yaw: -0.98,
    },
    {
      id: 'forney-ridge',
      name: 'Forney Ridge Overlook',
      shortName: 'Forney Ridge',
      description: 'Partway down the Forney Ridge Trail, which leaves the west end of the parking area and descends through spruce-fir forest toward Andrews Bald.',
      x: 12,
      y: 1.5,
      z: 20,
      yaw: Math.PI * 0.2,
    },
    {
      id: 'andrews-bald',
      name: 'Andrews Bald',
      shortName: 'Andrews Bald',
      description: 'A treeless grassy bald reached by walking downhill through spruce-fir forest.',
      x: 4,
      y: 2.1,
      z: 40,
      yaw: Math.PI * 0.8,
    },
    {
      id: 'appalachian-trail',
      name: 'Appalachian Trail Crossing',
      shortName: 'A.T.',
      description: 'The Appalachian Trail passes just north of the observation tower, near the highest point on its whole length.',
      x: 80,
      y: 14.8,
      z: -104,
      yaw: Math.PI,
    },
    {
      id: 'summit',
      name: 'Kuwohi Observation Tower',
      shortName: 'Tower',
      description: 'The highest point in the park, with panoramic views of the Smokies from the observation tower.',
      x: 82,
      y: 33.2,
      z: -70,
      yaw: Math.PI * 0.8,
    },
  ],
  wildlife: {
    spawns: [
      // Deer in the forest south of the parking area (placed for the game)
      { species: 'white-tailed-deer', isBuck: false, isFawn: false, x: 52.0, z: 10.0, roamRadius: 16.0 },   // Doe
      { species: 'white-tailed-deer', isBuck: true, isFawn: false, x: 40.0, z: 14.0, roamRadius: 18.0 },    // Antlered buck
      { species: 'white-tailed-deer', isBuck: false, isFawn: true, x: 54.0, z: 14.0, roamRadius: 12.0 },    // Spotted fawn
      { species: 'white-tailed-deer', isBuck: false, isFawn: false, x: 62.0, z: 12.0, roamRadius: 15.0 },  // Second doe
      // Elk herd grazing in a meadow to the west, well beyond the 50-yard (46 m) guidance from the trails and landmarks (placed for the game: the park lists elk at Cataloochee and Oconaluftee, not at Kuwohi)
      { species: 'elk', isBuck: true, isFawn: false, x: -47.0, z: 60.0, roamRadius: 9.0 },   // Bull elk
      { species: 'elk', isBuck: false, isFawn: false, x: -52.0, z: 56.0, roamRadius: 10.0 }, // Cow elk
      { species: 'elk', isBuck: false, isFawn: false, x: -43.0, z: 65.0, roamRadius: 10.0 }, // Cow elk
      { species: 'elk', isBuck: false, isFawn: false, x: -55.0, z: 63.0, roamRadius: 8.0 },  // Cow elk
      // Black bear foraging on the forested slope east of the summit, well off the trails
      { species: 'black-bear', isBuck: false, isFawn: false, x: 150.0, z: -56.0, roamRadius: 12.0 },
    ],
  },
  rules: {
    zones: [
      {
        id: 'spruce-fir-closure',
        kind: 'closed',
        name: 'Spruce-Fir Forest Closure',
        x: 18,
        z: -22,
        radius: 8,
        reason: 'Closed in this game to protect the fragile floor of the high-elevation spruce-fir forest.',
      },
      {
        id: 'bald-azalea-patch',
        kind: 'sensitive',
        name: 'Azalea Patch',
        x: -8,
        z: 42,
        radius: 7,
        reason: 'Flowering azaleas and grasses on the bald are easily trampled. Stay on the trail.',
      },
      SUMMIT_WINTER_CLOSURE,
    ],
    // litter lies along this park's own paths
    litter: STANDARD_LITTER.map(l => ({
      ...l,
      trail: ({ 'can-1': 'kuwohi-trail', 'bottle-1': 'forney-ridge-trail', 'wrapper-1': 'kuwohi-bypass-trail', 'peel-1': 'appalachian-trail', 'bag-1': 'kuwohi-trail' } as Record<string, string>)[l.id] ?? 'kuwohi-trail',
    })),
  },
  // Task 23: the parking area and Kuwohi Road, as on the NPS Kuwohi area map
  features: {
    roads: [
      {
        id: 'kuwohi-road',
        name: 'Kuwohi Road',
        kind: 'road',
        width: 6.5,
        nodes: [
          { x: 190, z: -18 },
          { x: 150, z: -10 },
          { x: 110, z: -6 },
          { x: 78, z: -6 },
        ],
      },
      {
        id: 'forney-ridge-parking',
        name: 'Kuwohi (Forney Ridge) Parking Area',
        kind: 'lot',
        levelFrom: 'kuwohi-road',
        width: 14.0,
        nodes: [
          { x: 50, z: -6 },
          { x: 76, z: -6 },
        ],
      },
    ],
    cars: [
      { x: 56.0, z: -2.5, yaw: Math.PI / 2, color: 0x9a2a2a },
      { x: 64.0, z: -2.5, yaw: Math.PI / 2, color: 0xd9d6cc },
      { x: 60.0, z: -9.5, yaw: -Math.PI / 2, color: 0x2f4a6b },
      { x: 68.0, z: -9.5, yaw: -Math.PI / 2, color: 0x3d5a40 },
    ],
  },
  about: {
    designNote:
      'A game-scale landscape of the Kuwohi area, following the NPS "Trails in the Kuwohi Area" map: the parking area at the end of Kuwohi Road, the steep paved trail to the observation tower, the Forney Ridge Trail that descends to Andrews Bald, the Kuwohi Bypass Trail and the Appalachian Trail. Distances are shortened a lot (the real paved path is half a mile and the real walk to Andrews Bald is 1.8 miles) and this map is not a survey. The deer and elk are placed for the game: the park lists elk at Cataloochee and Oconaluftee, not at Kuwohi.',
    wildlifeGuidance: {
      text:
        'Great Smoky Mountains National Park says to stay at least 50 yards (150 feet) from bears and elk, or any distance that changes an animal\'s natural behavior. It is illegal to feed, touch, tease, frighten or intentionally disturb wildlife.',
      caveat:
        'NPS pages and news releases have given different distances for elk over time, so check the park\'s current page. In this game the deer rule is 23 m (25 yards), a game rule. The park\'s "any distance that changes behavior" idea is why startling deer costs Stewardship.',
      sourceUrl: 'https://www.nps.gov/grsm/planyourvisit/wildlifeviewing.htm',
      sourceLabel: 'nps.gov: Wildlife Viewing (Great Smoky Mountains)',
    },
    facts: [
      {
        id: 'kuwohi-height',
        title: 'The highest point in the park',
        text: 'At 6,643 feet (2,025 m), this summit is the highest point in the park, the highest point in Tennessee, and the third highest mountain east of the Mississippi. The Appalachian Trail crosses it.',
        sourceUrl: 'https://www.nps.gov/grsm/planyourvisit/clingmansdome.htm',
        sourceLabel: 'nps.gov: Clingmans Dome page',
      },
      {
        id: 'kuwohi-name',
        title: 'A restored name',
        text: 'In September 2024 the U.S. Board on Geographic Names restored the Cherokee name Kuwohi ("mulberry place") for the peak long known as Clingmans Dome. Old maps and pages may still use the old name.',
        sourceUrl: 'https://hellbenderpress.sustainably.org/news/cherokee-name-restored-to-sacred-crest-of-smokies-highest-point',
        sourceLabel: 'Environmental Journal of Southern Appalachia (quotes park staff)',
      },
      {
        id: 'spruce-fir-rainforest',
        title: 'A coniferous rainforest',
        text: 'The cool, wet summit supports a spruce-fir forest that the park describes as a coniferous rainforest. Temperatures there can be 10 to 20 degrees Fahrenheit cooler than in the lowlands.',
        sourceUrl: 'https://www.nps.gov/grsm/planyourvisit/clingmansdome.htm',
        sourceLabel: 'nps.gov: Clingmans Dome page',
      },
      {
        id: 'elk-return',
        title: 'Elk came back in 2001',
        text: 'Elk were once common across the southern Appalachians. The park released the first 25 elk in 2001, and they can be seen from a safe distance on the North Carolina side, such as Cataloochee and Oconaluftee.',
        sourceUrl: 'https://www.nps.gov/grsm/learn/nature/elk.htm',
        sourceLabel: 'nps.gov: Elk (Great Smoky Mountains)',
      },
      {
        id: 'kuwohi-trail',
        title: 'A steep paved path to the tower',
        text: 'From the parking area, a steep paved path of 1 mile round trip (half a mile each way) leads to the observation tower. The bypass trail also reaches the tower: it starts at the Forney Ridge trailhead and climbs toward the Appalachian Trail.',
        sourceUrl: 'https://home.nps.gov/thingstodo/kuwohi.htm',
        sourceLabel: 'nps.gov: Kuwohi (things to do)',
      },
      {
        id: 'andrews-bald',
        title: 'A walk that goes downhill to a grassy bald',
        text: 'The Forney Ridge Trail descends through high-elevation spruce-fir forest to Andrews Bald, 3.6 miles round trip from the Kuwohi parking area. The park describes it as a popular grassy bald known for flowering azaleas in summer and views of the surrounding mountains.',
        sourceUrl: 'https://www.nps.gov/thingstodo/hike-to-andrews-bald.htm',
        sourceLabel: 'nps.gov: Hike to Andrews Bald',
      },
      {
        id: 'andrews-name',
        title: 'Who Andrews Bald is named for',
        text: 'Andrews Bald is named for Andrew Thompson, a cattle herder who brought livestock to the grassy bald in the 1840s.',
        sourceUrl: 'https://www.nps.gov/places/andrews-bald.htm',
        sourceLabel: 'nps.gov: Andrews Bald',
      },
    ],
    checkedOn: '2026-11-01',
  },
  waterStations: TRAILHEAD_AND_SUMMIT_WATER({ x: 58, z: -6 }, { x: 82, z: -70 }),
};

/**
 * REAL PARK: Shenandoah National Park (Virginia)
 * Task 17. A game-scale landscape inspired by the Hawksbill area. Names are real, the layout is not a survey.
 */
export const SHENANDOAH: ParkDefinition = {
  id: 'shenandoah',
  // TODO (planned, not done yet): adopt the Task 24 ground look and grassland look here (and the planned Shenandoah polish), as Wind Cave does (terrain.groundLook and vegetation.look.grassland)
  npsParkCode: 'shen',
  // Real elevation relief from the Hawksbill area, placed so the real summit lines up with the game's summit
  realTerrain: {
    id: 'shen',
    featureName: 'Hawksbill area',
    centerLat: 38.5553,
    centerLon: -78.395,
    zoom: 13,
    sizeM: 1000,
    stepM: 5,
    originX: 115,
    originZ: -50,
    mix: 0.6,
    detrendSigmaM: 120,
  },
  // Task 18: this park has its own layout (own hills and forest pattern), not a copy of the Smokies. Task 23: trails, parking and landmarks follow the NPS Hawksbill Area map.
  layoutSeed: 7,
  name: 'Shenandoah',
  subtitle: 'Skyline Drive & Blue Ridge Views',
  parkServiceUnit: 'National Park',
  state: 'Virginia',
  region: 'Mid-Atlantic / Blue Ridge Mountains',
  description: 'A long, narrow park along the crest of the Blue Ridge Mountains, with hardwood forest, rocky greenstone summits and far views over the Shenandoah Valley and the Virginia Piedmont.',
  elevationRange: { min: 163, max: 1235 },
  spawn: { x: -50.0, y: 2.4, z: 42.0, yaw: -0.245 }, // in the Hawksbill Gap parking area, facing the connector trail
  terrain: {
    baseScale: 0.0052,
    heightScale: 16.5, // rounder, older ridges than the Smokies
    noiseX: 39.0,      // different hill pattern from the Smokies
    noiseZ: -3.0,
    mountain: {
      x: 115.0,
      z: -50.0,
      height: 30.0,
      radius: 60.0,
      plateauRadius: 8.0,
      name: 'Hawksbill',
    },
    colors: {
      valley: 0x5a8a3e,     // sunlit hardwood hollow green
      meadow: 0x95b04c,     // bright yellow-green glades
      dryGrass: 0xd2c070,
      steepSlope: 0x93724c, // lighter forest loam
      summitRock: 0x86917f, // pale greenstone, grey-green
      riverbed: 0x4a4339,
      riverbank: 0x62704a,
    },
  },
  water: {
    // Task 23: the NPS Hawksbill area map shows no stream or footbridge on the summit trails (older versions invented a
    // "Stream Footbridge" here), so this map has no river.
    hasRiver: false,
    mode: 'none',
    name: 'No stream on the summit trails',
    surfaceY: -1.0,
    halfWidth: 2.4,
    bankWidth: 5.0,
    valleyWidth: 30.0,
    gradient: 0.0035,
    deepColor: 0x17434a,
    shallowColor: 0x336f68,
    skyReflectColor: 0x94b6c9,
  },
  trail: {
    name: 'Hawksbill Loop',
    width: 2.4,
    surface: { center: 0x95938a, mid: 0x7d7b71, edge: 0x58613f }, // pale rocky greenstone path
    // Task 23: the trails of the NPS "Hawksbill Area" map at game scale. The park's own loop hike goes from the parking
    // area on a short connector to the Appalachian Trail, south along it to the Salamander Trail, up to the summit,
    // and back down the Lower Hawksbill Trail.
    paths: [
      {
        id: 'lower-hawksbill-trail',
        name: 'Lower Hawksbill Trail',
        steps: 16,
        nodes: [
          { x: -44.0, z: 47.0 },  // starts at the parking area
          { x: -31.0, z: 46.6 },
          { x: -18.0, z: 46.0 },
          { x: -12.0, z: 41.0 },
          { x: -5.0, z: 35.0 },
          { x: 2.0, z: 29.0 },
          { x: 7.0, z: 24.0 },
          { x: 12.0, z: 20.0 },
          { x: 27.0, z: 20.0 },
          { x: 38.0, z: 19.0 },
          { x: 50.0, z: 15.0 },
          { x: 62.0, z: 9.0 },
          { x: 74.0, z: 3.0 },
          { x: 86.0, z: -3.0 },
          { x: 97.0, z: -6.0 },
          { x: 107.0, z: -10.0 },
          { x: 116.0, z: -14.0 },
          { x: 122.0, z: -20.0 },
          { x: 118.0, z: -27.0 },
          { x: 108.0, z: -29.0 },
          { x: 100.0, z: -33.0 },
          { x: 98.0, z: -40.0 },
          { x: 104.0, z: -44.0 },
          { x: 110.0, z: -47.0 },
          { x: 113.0, z: -47.5 },
        ],
      },
      {
        id: 'connector',
        name: 'Connector to the Appalachian Trail',
        nodes: [
          { x: -50.0, z: 35.0 },  // north end of the parking area
          { x: -40.0, z: 30.0 },
          { x: -30.0, z: 26.0 },
          { x: -22.0, z: 24.0 },
        ],
      },
      {
        id: 'appalachian-trail',
        name: 'Appalachian Trail',
        nodes: [
          { x: -34.0, z: -70.0 },
          { x: -30.0, z: -40.0 },
          { x: -26.0, z: -12.0 },
          { x: -22.0, z: 24.0 },   // the connector arrives here
          { x: -20.0, z: 44.0 },
          { x: -18.0, z: 62.0 },   // the Salamander Trail leaves here
          { x: -10.0, z: 84.0 },
          { x: -4.0, z: 110.0 },
        ],
      },
      {
        id: 'salamander-trail',
        name: 'Salamander Trail',
        nodes: [
          { x: -18.0, z: 62.0 },
          { x: 2.0, z: 66.0 },
          { x: 24.0, z: 62.0 },
          { x: 46.0, z: 52.0 },
          { x: 68.0, z: 38.0 },
          { x: 88.0, z: 22.0 },
          { x: 106.0, z: 4.0 },
          { x: 116.0, z: -14.0 },   // joins the Lower Hawksbill Trail near the summit
        ],
      },
    ],
  },
  overlook: {
    name: 'Hawksbill Summit Observation Platform',
    elevationLabel: 'Elev. 1,235m (4,051 ft)',
    deckRadius: 5.2,
    hasBench: true,
    hasTelescope: true,
    signHeading: 'HAWKSBILL',
    signSubheading: 'HIGHEST POINT IN SHENANDOAH',
  },
  vegetation: {
    treeCount: 880,   // lighter, more open woods than the dense Smokies
    shrubCount: 650,  // far fewer bushes: this is open oak woodland, not rhododendron thicket
    speciesWeights: {
      conifer: 0.5,   // a few hemlocks
      pine: 1.2,
      broadleaf: 4.0, // hickory and maple
      oak: 7.0,       // oak-dominated forest
      birch: 0.6,
      poplar: 1.4,
      snag: 0.3,
    },
    // Task 19: Shenandoah's own look: bright yellow-green oak-hickory woods, sunny glades, bracken and black-eyed Susans
    look: {
      treeScale: 1.12,
      glades: 0.34,
      palettes: {
        oak: [0x7f9c34, 0x8fa83a, 0x6f9230, 0x9bb140, 0x78982f],
        broadleaf: [0x93b03f, 0xa0ba48, 0x84a53a, 0xb0c04c],
        conifer: [0x2b4f3d, 0x305840, 0x25493b],
        poplar: [0x8dad40, 0x9cb84a, 0x7f9f38],
      },
      shrubPalette: [0x7d9a3a, 0x8eab42, 0x6a8a34, 0xa3b24a],
      grass: { root: 0x3b5a22, stalk: 0x8aa83e, dry: 0xd6c46a, fern: 0x6f9a3a, flowerA: 0xf0eedc, flowerB: 0xe8b82a },
    },
  },
  atmosphere: {
    fogColor: 0xbccfdc,
    fogDensity: 0.0082, // thin, bright Blue Ridge haze, so you can see far down the ridges
    hemiSky: 0xc4ddf0,
    hemiGround: 0x7a9658,
    sunColor: 0xfff0d2,
    sunIntensity: 2.7,
    skyHorizon: 0xbccfdc,
    skyMid: 0x8ab4d0,
    skyZenith: 0x4f88b4,
    skySun: 0xffe2a8,
  },
  // Task 23: landmarks from the NPS Hawksbill Area map (keys 1 to 6)
  landmarks: [
    {
      id: 'spawn',
      name: 'Hawksbill Gap Parking Area',
      shortName: 'Parking Area',
      description: 'The parking area beside Skyline Drive. The Lower Hawksbill Trail starts here, and a short connector leads from its north end to the Appalachian Trail.',
      x: -50,
      y: 1.7,
      z: 42,
      yaw: -0.245,
    },
    {
      id: 'appalachian-trail',
      name: 'Appalachian Trail Junction',
      shortName: 'A.T.',
      description: 'Where the short connector from the parking area meets the Appalachian Trail. The park\'s loop hike turns south here.',
      x: -22,
      y: 4.5,
      z: 24,
      yaw: Math.PI,
    },
    {
      id: 'spitler-knoll-overlook',
      name: 'Spitler Knoll Overlook',
      shortName: 'Spitler Knoll',
      description: 'A pull-off on Skyline Drive with a view across the valley. (The Hawksbill area map lists this overlook; its exact spot here is a game placement.)',
      x: -63,
      y: 0.7,
      z: -3,
      yaw: -Math.PI / 2,
    },
    {
      id: 'salamander-trail',
      name: 'Salamander Trail Junction',
      shortName: 'Salamander',
      description: 'Where the blue-blazed Salamander Trail leaves the Appalachian Trail and heads up toward the summit.',
      x: -16,
      y: 3.3,
      z: 62,
      yaw: -Math.PI / 2,
    },
    {
      id: 'byrds-nest-shelter',
      name: 'Byrds Nest 2 Shelter',
      shortName: 'Shelter',
      description: 'Near the top, a day-use shelter stands beside the trail; a short path past it leads to the viewing platform.',
      x: 106,
      y: 28.0,
      z: -45,
      yaw: Math.PI * 0.2,
    },
    {
      id: 'summit',
      name: 'Hawksbill Summit Viewing Platform',
      shortName: 'Summit',
      description: 'A rocky summit with a stone viewing platform and long views of the Blue Ridge.',
      x: 115,
      y: 30.2,
      z: -50,
      yaw: Math.PI * 0.8,
    },
  ],
  wildlife: {
    spawns: [
      // Deer around the trailhead meadow
      { species: 'white-tailed-deer', isBuck: false, isFawn: false, x: -9.0, z: 41.5, roamRadius: 16.0 },   // Doe
      { species: 'white-tailed-deer', isBuck: true, isFawn: false, x: -22.0, z: 28.0, roamRadius: 14.0 },   // Antlered buck
      { species: 'white-tailed-deer', isBuck: false, isFawn: true, x: -6.0, z: 46.5, roamRadius: 12.0 },    // Fawn
      // A second doe and fawn grazing in an open glade, a good distance from the trails
      { species: 'white-tailed-deer', isBuck: false, isFawn: false, x: 40.0, z: -8.0, roamRadius: 12.0 },
      { species: 'white-tailed-deer', isBuck: false, isFawn: true, x: 43.0, z: -5.0, roamRadius: 10.0 },
      // Black bear foraging on the wooded slope north-west of the summit trail, well off the trails
      { species: 'black-bear', isBuck: false, isFawn: false, x: 40.0, z: -55.0, roamRadius: 12.0 },
    ],
  },
  // Task 19: things that belong to Shenandoah. Skyline Drive and its stone walls, the Hawksbill Gap parking area,
  // greenstone scree near the summit, a stone summit wall and layered Blue Ridge ridgelines on the horizon.
  features: {
    roads: [
      {
        id: 'skyline-drive',
        name: 'Skyline Drive',
        kind: 'road',
        width: 7.0,
        nodes: [
          { x: -84, z: -200 },
          { x: -78, z: -100 },
          { x: -72, z: -20 },
          { x: -71, z: 30 },
          { x: -74, z: 80 },
          { x: -84, z: 150 },
          { x: -98, z: 230 },
        ],
        walls: [
          { side: -1, from: 0.46, to: 0.555 },
          { side: -1, from: 0.585, to: 0.69 },
        ],
      },
      {
        id: 'hawksbill-gap-lot',
        name: 'Hawksbill Gap Parking',
        kind: 'lot',
        levelFrom: 'skyline-drive',
        width: 12.0,
        nodes: [
          { x: -52, z: 36 },
          { x: -52, z: 56 },
        ],
      },
      {
        id: 'spitler-knoll-pulloff',
        name: 'Spitler Knoll Overlook',
        kind: 'lot',
        levelFrom: 'skyline-drive',
        width: 7.0,
        nodes: [
          { x: -63, z: -9 },
          { x: -63, z: 3 },
        ],
      },
      {
        id: 'hawksbill-gap-entrance',
        name: 'Parking Entrance',
        kind: 'drive',
        levelFrom: 'skyline-drive',
        width: 6.0,
        nodes: [
          { x: -67, z: 47 },
          { x: -58, z: 47 },
        ],
      },
    ],
    cars: [
      { x: -55.5, z: 40.5, yaw: Math.PI / 2, color: 0x9a2a2a },
      { x: -55.5, z: 51.5, yaw: Math.PI / 2, color: 0xd9d6cc },
      { x: -48.5, z: 44.0, yaw: -Math.PI / 2, color: 0x2f4a6b },
    ],
    talusFields: [
      { x: 104, z: -42, radius: 15, count: 80 },
      { x: 115, z: -50, radius: 26, innerRadius: 9, count: 160 },
      { x: 121, z: -22, radius: 11, count: 45 },
    ],
    summitWall: { gapDeg: 75 },
    distantRidges: true,
  },
  rules: {
    zones: [
      {
        id: 'hawksbill-north-face-closure',
        kind: 'closed',
        name: 'North Face Closure',
        x: 92,
        z: -78,
        radius: 9,
        reason: 'The park closes part of the north and northwest face of Hawksbill to visitors, so stay out of this area.',
      },
      {
        id: 'understory-wildflower-slope',
        kind: 'sensitive',
        name: 'Understory Wildflower Slope',
        x: 74,
        z: -14,
        radius: 8,
        reason: 'Fragile woodland wildflowers. Stepping off the trail tramples them and the soil beneath.',
      },
      {
        id: 'summit-lichen-rocks',
        kind: 'sensitive',
        name: 'Fragile Summit Rocks',
        x: 127,
        z: -58,
        radius: 7,
        reason: 'Lichens and moss grow very slowly on the bare summit rocks. One footstep can destroy decades of growth.',
      },
    ],
    // litter lies along this park's own paths
    litter: STANDARD_LITTER.map(l => ({
      ...l,
      trail: ({ 'can-1': 'lower-hawksbill-trail', 'bottle-1': 'appalachian-trail', 'wrapper-1': 'salamander-trail', 'peel-1': 'lower-hawksbill-trail', 'bag-1': 'lower-hawksbill-trail' } as Record<string, string>)[l.id] ?? 'lower-hawksbill-trail',
    })),
  },
  about: {
    designNote:
      'A game-scale landscape of the Hawksbill area, following the NPS "Hawksbill Area" map: Skyline Drive and the Hawksbill Gap parking area, the connector to the Appalachian Trail, the Salamander Trail, the Lower Hawksbill Trail and the viewing platform. Distances are shortened a lot and this map is not a survey. The Spitler Knoll Overlook is listed on the park map, but where it sits here is a game placement. Elevation relief near Hawksbill is real.',
    wildlifeGuidance: {
      text:
        'Shenandoah National Park asks visitors to stay at least 75 feet (23 m), about two bus-lengths, from all wildlife, and at least 150 feet (46 m), about four bus-lengths, from black bears. If wildlife approaches you, it is your responsibility to back away and keep that distance.',
      caveat:
        'These are the same distances the game uses (deer 23 m, bears 46 m). Other parks use different numbers, so always check each park\'s current page.',
      sourceUrl: 'https://www.nps.gov/shen/planyourvisit/wildlife-viewing.htm',
      sourceLabel: 'nps.gov: Viewing & Photographing Wildlife (Shenandoah)',
    },
    facts: [
      {
        id: 'hawksbill-height',
        title: 'The highest peak',
        text: 'Hawksbill, at 4,051 feet (1,235 m), is the highest peak in the park. The lowest point is 535 feet (163 m) near the north end.',
        sourceUrl: 'https://www.nps.gov/shen/learn/management/statistics.htm',
        sourceLabel: 'nps.gov: Park Statistics (Shenandoah)',
      },
      {
        id: 'skyline-trails',
        title: 'Skyline Drive and the trails',
        text: 'Skyline Drive is 105 miles long with 70 overlooks. The park has 516 miles of hiking trails, including 101 miles of the Appalachian Trail.',
        sourceUrl: 'https://www.nps.gov/shen/learn/management/statistics.htm',
        sourceLabel: 'nps.gov: Park Statistics (Shenandoah)',
      },
      {
        id: 'park-dates',
        title: 'How the park began',
        text: 'Congress authorized the park on May 22, 1926. It was established on December 26, 1935 and dedicated by President Franklin D. Roosevelt on July 3, 1936.',
        sourceUrl: 'https://www.nps.gov/shen/learn/management/statistics.htm',
        sourceLabel: 'nps.gov: Park Statistics (Shenandoah)',
      },
      {
        id: 'wilderness',
        title: 'Protected wilderness',
        text: 'About 79,579 acres of the park are designated wilderness.',
        sourceUrl: 'https://www.nps.gov/shen/learn/management/statistics.htm',
        sourceLabel: 'nps.gov: Park Statistics (Shenandoah)',
      },
      {
        id: 'no-calling',
        title: 'Do not call wildlife',
        text: 'Calling, whistling or making noises of any kind to attract wildlife is illegal in the park. The park also suggests lining an animal up with one of the rule-of-thirds points in your photo for better shots from a distance.',
        sourceUrl: 'https://www.nps.gov/shen/planyourvisit/wildlife-viewing.htm',
        sourceLabel: 'nps.gov: Viewing & Photographing Wildlife (Shenandoah)',
      },
      {
        id: 'bear-curious',
        title: 'A curious bear',
        text: 'If a bear cannot tell what you are, it may come closer or stand on its hind legs to get a better look or smell. The park advises making noise so the bear knows you are there, and moving away slowly without turning your back if it comes closer.',
        sourceUrl: 'https://www.nps.gov/shen/planyourvisit/bear-safety.htm',
        sourceLabel: 'nps.gov: Bear Safety (Shenandoah)',
      },
      {
        id: 'hawksbill-loop',
        title: 'The park\'s own Hawksbill loop',
        text: 'The park map suggests a 2.9-mile circuit with about 860 feet of climbing. From the north end of the Hawksbill Gap parking area, a short connector joins the Appalachian Trail; follow it south to the Salamander Trail, climb to the summit, and return on the Lower Hawksbill Trail.',
        sourceUrl: 'https://www.nps.gov/shen/planyourvisit/upload/Hawksbill_RoadTrail.pdf',
        sourceLabel: 'nps.gov: Hawksbill Area map (Shenandoah)',
      },
      {
        id: 'hawksbill-closure',
        title: 'Parts of Hawksbill are closed',
        text: 'The park closes the summit area and cliff faces of Hawksbill to climbing, and a portion of the northern and northwest face of the mountain is also closed to visitor use.',
        sourceUrl: 'https://www.nps.gov/shen/planyourvisit/upload/Climbing_Guidelines_2017-508.pdf',
        sourceLabel: 'nps.gov: Climbing Guidelines (Shenandoah)',
      },
      {
        id: 'shenandoah-salamander',
        title: 'A salamander found only here',
        text: 'The Shenandoah salamander is an endangered species found only in Shenandoah National Park. It was listed as federally endangered in 1989.',
        sourceUrl: 'https://www.nps.gov/shen/learn/nature/shenandoah_salamander.htm',
        sourceLabel: 'nps.gov: Shenandoah Salamander',
      },
    ],
    checkedOn: '2026-11-01',
  },
  waterStations: TRAILHEAD_AND_SUMMIT_WATER({ x: -50, z: 42 }, { x: 115, z: -50 }),
};

/**
 * Task 20: Acadia National Park (Maine). Its own layout and look: a bare pink-granite summit with a long open climb,
 * cairns, granite boulders (glacial erratics), a stone bridge, a coast with islands, and cool maritime light.
 */
export const ACADIA: ParkDefinition = {
  id: 'acadia',
  // TODO (planned, not done yet): adopt the Task 24 ground look and grassland look here, as Wind Cave does (terrain.groundLook and vegetation.look.grassland)
  npsParkCode: 'acad',
  // Real elevation relief from the Cadillac Mountain area (summit 44.35127 N, 68.22649 W), lined up with the game's summit
  realTerrain: {
    id: 'acad',
    featureName: 'Cadillac Mountain area',
    centerLat: 44.35127,
    centerLon: -68.22649,
    zoom: 13,
    sizeM: 1000,
    stepM: 5,
    originX: 95,
    originZ: -85,
    mix: 0.45,
    detrendSigmaM: 120,
  },
  layoutSeed: 11,
  name: 'Acadia',
  subtitle: 'Granite Summits & the Maine Coast',
  parkServiceUnit: 'National Park',
  state: 'Maine',
  region: 'New England / Coastal Maine',
  description: 'Rounded pink-granite mountains rising straight from the Atlantic, with spruce and fir woods, bare summits, stone carriage-road bridges and rocky shores on Mount Desert Island.',
  elevationRange: { min: 0, max: 466 },
  spawn: { x: -95.0, y: 5.2, z: 72.0, yaw: -1.0 }, // faces the stone bridge
  terrain: {
    baseScale: 0.0056,
    heightScale: 15.0,
    noiseX: 10,
    noiseZ: 196,
    coast: { x0: 175, wiggle: 14, seaY: -0.8, floorY: -8 },
    mountain: {
      x: 95.0,
      z: -85.0,
      height: 34.0,
      radius: 72.0,
      plateauRadius: 9.0,
      name: 'Cadillac Mountain',
    },
    colors: {
      valley: 0x35553a,     // cool spruce-fir green
      meadow: 0x6e8d52,
      dryGrass: 0xb8ac80,   // blueberry heath and dry grass
      steepSlope: 0x8a7b72, // thin granite soil
      summitRock: 0xbca79c, // pink granite
      riverbed: 0x4a4440,
      riverbank: 0x70675c,
    },
  },
  water: {
    // Task 23: the NPS Cadillac Mountain pages describe the summit, its road and its trails, with no stream or bridge on the
    // North Ridge route (older versions invented a "Stone Bridge" and "Mountain Brook" here), so there is no river on this map.
    hasRiver: false,
    mode: 'none',
    name: 'No stream on the ridge',
    surfaceY: -1.0,
    halfWidth: 5.0,
    bankWidth: 6.0,
    valleyWidth: 44.0,
    gradient: 0.003,
    deepColor: 0x1a3d4a,
    shallowColor: 0x3d7a80,
    skyReflectColor: 0xa8c4d6,
  },
  trail: {
    name: 'Cadillac Mountain Trails',
    width: 2.4,
    surface: { center: 0xb9aca2, mid: 0xa09188, edge: 0x5e6c47 }, // pink granite path
    // Task 23: the trails the NPS describes on Cadillac Mountain, at game scale: the North Ridge Trail climbs from a pull-out on
    // the Park Loop Road to the north side of the summit parking lot; the South Ridge Trail leaves the south side of the
    // lot; the short paved Summit Loop Trail circles the top; and a short path leads to the summit marker.
    paths: [
      {
        id: 'north-ridge-trail',
        name: 'Cadillac North Ridge Trail',
        steps: 16,
        nodes: [
          { x: -104.0, z: 73.0 }, // starts at the pull-out on the Park Loop Road
          { x: -95.0, z: 72.0 },
          { x: -84.0, z: 67.0 },
          { x: -72.0, z: 60.0 },
          { x: -60.0, z: 53.0 },
          { x: -48.0, z: 45.0 },
          { x: -37.0, z: 36.0 },
          { x: -28.0, z: 29.0 },
          { x: -21.0, z: 24.0 },
          { x: -0.5, z: 24.0 },
          { x: 8.0, z: 18.0 },
          { x: 19.0, z: 9.0 },
          { x: 31.0, z: -1.0 },
          { x: 41.0, z: -14.0 },
          { x: 48.0, z: -29.0 },
          { x: 55.0, z: -41.0 },
          { x: 66.0, z: -49.0 },
          { x: 77.0, z: -55.0 },
          { x: 83.0, z: -64.0 },
          { x: 84.4, z: -74.4 }, // arrives at the summit loop
        ],
      },
      {
        // The short paved loop around the top
        id: 'summit-loop-trail',
        name: 'Cadillac Summit Loop Trail',
        closed: true,
        nodes: [
          { x: 95.0, z: -70.0 },
          { x: 105.6, z: -74.4 },
          { x: 110.0, z: -85.0 },
          { x: 105.6, z: -95.6 },
          { x: 95.0, z: -100.0 },
          { x: 84.4, z: -95.6 },
          { x: 80.0, z: -85.0 },
          { x: 84.4, z: -74.4 },
        ],
      },
      {
        // A few steps up to the summit marker
        id: 'summit-marker-path',
        name: 'Path to the Summit Marker',
        nodes: [
          { x: 95.0, z: -70.0 },
          { x: 94.5, z: -76.0 },
          { x: 93.5, z: -81.5 },
        ],
      },
      {
        // A short steep paved path from the summit parking lot up to the loop (game scale)
        id: 'summit-lot-path',
        name: 'Path from the Summit Parking Lot',
        nodes: [
          { x: 122.0, z: -106.0 },
          { x: 112.0, z: -115.0 },
          { x: 100.0, z: -115.0 },
          { x: 91.0, z: -109.0 },
          { x: 95.0, z: -100.0 },
        ],
      },
      {
        // Leaves the south side of the summit parking lot
        id: 'south-ridge-trail',
        name: 'Cadillac South Ridge Trail',
        nodes: [
          { x: 95.0, z: -70.0 },
          { x: 100.0, z: -52.0 },
          { x: 104.0, z: -30.0 },
          { x: 108.0, z: -8.0 },
          { x: 114.0, z: 14.0 },
          { x: 118.0, z: 36.0 },
          { x: 116.0, z: 58.0 },
        ],
      },
    ],
  },
  overlook: {
    name: 'Cadillac Mountain Summit',
    elevationLabel: 'Elev. 466m (1,530 ft)',
    deckRadius: 5.2,
    hasBench: true,
    hasTelescope: true,
    signHeading: 'CADILLAC MOUNTAIN',
    signSubheading: 'TALLEST MOUNTAIN ON THE EAST COAST',
  },
  vegetation: {
    treeCount: 820,
    shrubCount: 1300,
    speciesWeights: {
      conifer: 8.0,   // spruce and fir
      pine: 3.5,      // pitch pine on the ledges
      broadleaf: 1.2, // red maple
      oak: 0.3,
      birch: 2.2,     // paper birch
      poplar: 0.4,
      snag: 0.6,
    },
    // Task 20: dark spruce-fir woods, bare granite above the tree line, blueberry heath and lupines
    look: {
      treeScale: 0.92,
      treeLine: 16,
      glades: 0.18,
      palettes: {
        conifer: [0x1f4538, 0x254f3f, 0x1b3d33, 0x2b5946],
        pine: [0x4a6b3a, 0x56783f, 0x3f5f35],
        birch: [0xa9c25a, 0xb8cf66, 0x9ab552],
        broadleaf: [0x6f9040, 0x7e9d48, 0x5f8238],
      },
      shrubPalette: [0x5b7338, 0x6a8040, 0x8a6a3c, 0x7a5e3a],
      grass: { root: 0x26402a, stalk: 0x6c8744, dry: 0xbeae78, fern: 0x3a6a3d, flowerA: 0xb878d6, flowerB: 0xf1efe4 },
    },
  },
  atmosphere: {
    fogColor: 0xc6d6de,
    fogDensity: 0.0072, // clear, cool sea air
    hemiSky: 0xd3e6f2,
    hemiGround: 0x6e7c63,
    sunColor: 0xfff3dc,
    sunIntensity: 2.6,
    skyHorizon: 0xc6d6de,
    skyMid: 0x8fb8d6,
    skyZenith: 0x3d7db5,
    skySun: 0xffdca0,
  },
  // Task 23: landmarks from the NPS description of Cadillac Mountain (keys 1 to 6)
  landmarks: [
    {
      id: 'spawn',
      name: 'North Ridge Trailhead',
      shortName: 'Trailhead',
      description: 'A pull-out on the Park Loop Road where the Cadillac North Ridge Trail begins.',
      x: -95,
      y: 5.7,
      z: 72,
      yaw: -1.0,
    },
    {
      id: 'granite-ledge',
      name: 'Bald Granite Ledge',
      shortName: 'Granite Ledge',
      description: 'Trees give way to bare pink granite here. Look for the stacked-stone cairns that mark the route.',
      x: 55.0,
      y: 7.4,
      z: -41.0,
      yaw: Math.PI * 0.75,
    },
    {
      id: 'summit-lot',
      name: 'Cadillac Summit Parking Lot',
      shortName: 'Summit Lot',
      description: 'The summit road ends here. The park says the top is often crowded with vehicles and visitors. The North and South Ridge Trails both meet this lot.',
      x: 124,
      y: 16.0,
      z: -103,
      yaw: Math.PI * 0.6,
    },
    {
      id: 'summit-loop',
      name: 'Summit Loop Trail',
      shortName: 'Summit Loop',
      description: 'A short paved loop around the top with sweeping views of the east side of the mountain.',
      x: 110,
      y: 30.9,
      z: -85,
      yaw: -Math.PI / 2,
    },
    {
      id: 'south-ridge',
      name: 'South Ridge Trail',
      shortName: 'South Ridge',
      description: 'The longer, more exposed route down the bare southern ridge, with views of the ocean and islands.',
      x: 100,
      y: 14.2,
      z: -52,
      yaw: Math.PI,
    },
    {
      id: 'summit',
      name: 'Cadillac Summit',
      shortName: 'Summit',
      description: 'A bare granite summit with long views over the islands and the Atlantic.',
      x: 95,
      y: 34.2,
      z: -85,
      yaw: Math.PI * 0.6,
    },
  ],
  wildlife: {
    spawns: [
      { species: 'white-tailed-deer', isBuck: false, isFawn: false, x: -90.0, z: 66.0, roamRadius: 14.0 },
      { species: 'white-tailed-deer', isBuck: true, isFawn: false, x: -86.0, z: 48.0, roamRadius: 14.0 },
      { species: 'white-tailed-deer', isBuck: false, isFawn: true, x: -88.0, z: 70.0, roamRadius: 10.0 },
      // A doe grazing in the coastal heath, far from the trail
      { species: 'white-tailed-deer', isBuck: false, isFawn: false, x: 135.0, z: 20.0, roamRadius: 12.0 },
    ],
  },
  features: {
    roads: [
      {
        id: 'park-loop-road',
        name: 'Park Loop Road',
        kind: 'road',
        width: 7.5,
        nodes: [
          { x: -260, z: -70 },
          { x: -190, z: 10 },
          { x: -140, z: 55 },
          { x: -128, z: 110 },
          { x: -150, z: 210 },
          { x: -190, z: 290 },
        ],
        surface: { wallColors: [0xb09b91, 0xa38f86, 0xbba79d, 0x9a8880] }, // pink granite coping stones
        walls: [
          { side: -1, from: 0.40, to: 0.45 },
          { side: -1, from: 0.475, to: 0.58 },
        ],
      },
      {
        id: 'trailhead-lot',
        name: 'North Ridge Trailhead Pull-out',
        kind: 'lot',
        levelFrom: 'park-loop-road',
        width: 12.0,
        nodes: [
          { x: -112, z: 62 },
          { x: -112, z: 84 },
        ],
      },
      {
        // Task 23: the 3.5-mile paved Cadillac Summit Road (NPS) winds up from the Park Loop Road to the summit parking lot
        id: 'cadillac-summit-road',
        name: 'Cadillac Summit Road',
        kind: 'road',
        width: 6.5,
        nodes: [
          { x: -190, z: 10 },
          { x: -150, z: -50 },
          { x: -95, z: -95 },
          { x: -30, z: -125 },
          { x: 40, z: -135 },
          { x: 95, z: -130 },
          { x: 125, z: -118 },
          { x: 132, z: -104 },
        ],
        surface: { wallColors: [0xb09b91, 0xa38f86, 0xbba79d, 0x9a8880] },
        walls: [{ side: -1, from: 0.72, to: 0.96 }],
      },
      {
        id: 'cadillac-summit-lot',
        name: 'Cadillac Summit Parking Lot',
        kind: 'lot',
        levelFrom: 'cadillac-summit-road',
        width: 11.0,
        nodes: [
          { x: 126, z: -98 },
          { x: 134, z: -112 },
        ],
      },
      {
        id: 'trailhead-entrance',
        name: 'Parking Entrance',
        kind: 'drive',
        levelFrom: 'park-loop-road',
        width: 6.0,
        nodes: [
          { x: -131, z: 74 },
          { x: -118, z: 74 },
        ],
      },
    ],
    cars: [
      { x: 129.0, z: -102.0, yaw: Math.PI / 2, color: 0x2d5a3d },
      { x: 131.5, z: -108.0, yaw: -Math.PI / 2, color: 0xc9c4b8 },
      { x: -115.5, z: 68.0, yaw: Math.PI / 2, color: 0x2d5a3d },
      { x: -108.5, z: 79.0, yaw: -Math.PI / 2, color: 0xc9c4b8 },
      { x: -115.5, z: 80.5, yaw: Math.PI / 2, color: 0x8a2f35 },
    ],
    talusFields: [
      // Bare-summit glacial erratics, pink granite
      { x: 95, z: -85, radius: 30, innerRadius: 10, count: 70, round: true, sizeRange: [0.5, 2.2], colors: [0xb59f95, 0xa8948a, 0xc0aea4, 0x9c8b83, 0x8f817b] },
      // One big perched boulder beside the trail, like Bubble Rock
      { x: 61, z: -33, radius: 0.4, count: 1, round: true, sizeRange: [2.8, 3.0], colors: [0xb8a398] },
      { x: 50, z: -45, radius: 22, count: 40, round: true, sizeRange: [0.4, 1.4], colors: [0xb59f95, 0xa8948a, 0xc0aea4] },
      // Rocky shore
      { x: 152, z: -60, radius: 20, count: 35, round: true, sizeRange: [0.6, 1.8], colors: [0xa89488, 0x9a8a80, 0xb7a69b] },
      { x: 156, z: 10, radius: 24, count: 40, round: true, sizeRange: [0.6, 1.8], colors: [0xa89488, 0x9a8a80, 0xb7a69b] },
      { x: 160, z: 70, radius: 22, count: 35, round: true, sizeRange: [0.6, 1.8], colors: [0xa89488, 0x9a8a80, 0xb7a69b] },
    ],
    cairns: { minHeight: 11, every: 13, pathIds: ['north-ridge-trail'] },
    sea: { color: 0x246a8f },
    islands: [
      { x: 255, z: -130, radius: 42, height: 24 },
      { x: 300, z: -55, radius: 30, height: 17 },
      { x: 275, z: 25, radius: 26, height: 13 },
      { x: 335, z: -175, radius: 52, height: 30 },
      { x: 360, z: 45, radius: 36, height: 18 },
    ],
  },
  rules: {
    zones: [
      {
        id: 'granite-restoration',
        kind: 'closed',
        name: 'Plant Restoration Area',
        x: -62,
        z: 68,
        radius: 7,
        reason: 'Closed so thin granite soil and young plants can recover. In the game this is an example closure, not a real one.',
      },
      {
        id: 'summit-heath',
        kind: 'sensitive',
        name: 'Fragile Summit Heath',
        x: 70,
        z: -100,
        radius: 7,
        reason: 'Low summit plants grow slowly in thin soil in the cracks of the granite. Stay on the bare rock and the trail.',
      },
      {
        id: 'coastal-heath',
        kind: 'sensitive',
        name: 'Coastal Heath',
        x: 128,
        z: -8,
        radius: 9,
        reason: 'Fragile heath plants on the shore. Trampling them exposes the thin soil to wind and waves.',
      },
    ],
    // litter lies along this park's own paths
    litter: STANDARD_LITTER.map(l => ({
      ...l,
      trail: ({ 'can-1': 'north-ridge-trail', 'bottle-1': 'summit-loop-trail', 'wrapper-1': 'south-ridge-trail', 'peel-1': 'north-ridge-trail', 'bag-1': 'north-ridge-trail' } as Record<string, string>)[l.id] ?? 'north-ridge-trail',
    })),
  },
  about: {
    designNote:
      'A game-scale landscape of Cadillac Mountain and the Mount Desert Island coast, following the NPS description: the Park Loop Road, the Cadillac Summit Road that winds up to the summit parking lot, the North Ridge and South Ridge Trails that meet that lot, and the short paved Summit Loop Trail. Distances are shortened a lot (the real summit road is 3.5 miles) and this map is not a survey. The islands, sea and granite are real kinds of features here. Elevation relief near Cadillac Mountain is real. Acadia\'s famous carriage roads and their stone bridges are not on this map.',
    wildlifeGuidance: {
      text:
        'Acadia National Park asks visitors to give animals the space they need, to stay on the trail rather than step off for a closer view, never to feed wildlife, and to back away if an animal approaches.',
      caveat:
        'The park\'s page says the recommended distance depends on the animal and shows it in a picture, not in text, so the game uses the National Park Service\'s general guidance of about 75 feet (23 m) from deer. Always check the park\'s current page and signs.',
      sourceUrl: 'https://www.nps.gov/acad/planyourvisit/viewing_wildlife.htm',
      sourceLabel: 'nps.gov: Wildlife Viewing (Acadia)',
    },
    facts: [
      {
        id: 'cadillac',
        title: 'Tallest mountain on the east coast',
        text: 'Cadillac Mountain, at 1,530 feet (466 m), is the highest mountain on the east coast. It is made of pink granite.',
        sourceUrl: 'https://www.nps.gov/hdp/exhibits/lll/post/acadia.htm',
        sourceLabel: 'nps.gov: Acadia National Park postcard tour',
      },
      {
        id: 'first-eastern',
        title: 'First in the east',
        text: 'Acadia was the first national park established in the eastern United States.',
        sourceUrl: 'https://www.nps.gov/hdp/exhibits/lll/post/acadia.htm',
        sourceLabel: 'nps.gov: Acadia National Park postcard tour',
      },
      {
        id: 'roads-trails',
        title: 'Roads and trails',
        text: 'Visitors enjoy 27 miles of historic motor roads, 158 miles of hiking trails and 45 miles of carriage roads.',
        sourceUrl: 'https://www.nps.gov/acad/index.htm',
        sourceLabel: 'nps.gov: Acadia National Park home page',
      },
      {
        id: 'visits',
        title: 'A very popular park',
        text: 'Acadia has about 4 million visits a year, which makes it one of the 10 most-visited national parks in the United States.',
        sourceUrl: 'https://www.nps.gov/acad/index.htm',
        sourceLabel: 'nps.gov: Acadia National Park home page',
      },
      {
        id: 'rare-big-animals',
        title: 'Bears and moose are rare here',
        text: 'Black bears are present throughout Acadia but are rarely seen, and on Mount Desert Island many years can pass between confirmed moose sightings.',
        sourceUrl: 'https://www.nps.gov/acad/planyourvisit/viewing_wildlife.htm',
        sourceLabel: 'nps.gov: Wildlife Viewing (Acadia)',
      },
      {
        id: 'stay-on-trail',
        title: 'Stay on the trail',
        text: 'Stepping off the trail for a closer look can disrupt wildlife and damage the park\'s fragile ecosystems.',
        sourceUrl: 'https://www.nps.gov/acad/planyourvisit/viewing_wildlife.htm',
        sourceLabel: 'nps.gov: Wildlife Viewing (Acadia)',
      },
      {
        id: 'summit-road',
        title: 'A road to the top',
        text: 'The Cadillac Summit Road leaves the Park Loop Road and winds 3.5 miles up a paved route to the summit. The park warns about road cyclists and visitors on and beside it.',
        sourceUrl: 'https://www.nps.gov/acad/planyourvisit/cadillac-mountain.htm',
        sourceLabel: 'nps.gov: Cadillac Mountain (Acadia)',
      },
      {
        id: 'summit-trails',
        title: 'Trails that meet at the top',
        text: 'The short, paved Cadillac Summit Loop Trail, waysides, restrooms and a gift shop are at the summit. The Cadillac North Ridge Trail (4.4 miles round trip) and the Cadillac South Ridge Trail (7.1 miles round trip) both connect to the summit parking lot.',
        sourceUrl: 'https://www.nps.gov/places/cadillac-mountain.htm',
        sourceLabel: 'nps.gov: Cadillac Mountain (place page)',
      },
    ],
    checkedOn: '2026-11-01',
  },
  waterStations: TRAILHEAD_AND_SUMMIT_WATER({ x: -95, z: 72 }, { x: 95, z: -85 }),
};

/**
 * Task 21: Chiricahua National Park (Arizona), the 64th national park (20 Oct 2026; formerly a national monument).
 * A desert "sky island": balancing rhyolite pinnacles, oak and pine woods above grassland, agave and prickly pear,
 * a dry wash with small seeps, a CCC fire lookout on Sugarloaf Mountain, and warm dry light.
 * Task 22: its own structure instead of the old trailhead / bridge / switchback / summit template: a trail to a dry wash
 * (crossed at ground level, no bridge), an Echo Canyon-style loop through the pinnacle fields, and a spur up to the lookout.
 */
export const CHIRICAHUA: ParkDefinition = {
  id: 'chiricahua',
  npsParkCode: 'chir',
  // Real relief around Sugarloaf Mountain (NPS photo-gallery location 32.0122 N, 109.3410 W; check the real max is about 2,228 m)
  realTerrain: {
    id: 'chir',
    featureName: 'Sugarloaf Mountain area',
    centerLat: 32.0122,
    centerLon: -109.341,
    zoom: 13,
    sizeM: 1000,
    stepM: 5,
    originX: 64,
    originZ: 76,
    mix: 0.5,
    detrendSigmaM: 120,
  },
  layoutSeed: 23,
  name: 'Chiricahua',
  subtitle: 'Wonderland of Rocks',
  parkServiceUnit: 'National Park',
  state: 'Arizona',
  region: 'Southwest / Sky Islands',
  description: 'A desert "sky island" in southeastern Arizona, where balancing pillars of volcanic rhyolite rise out of oak and pine woods, grassland and agave, high above the surrounding desert valleys.',
  elevationRange: { min: 1562, max: 2228 },
  spawn: { x: -122.0, y: 2.5, z: -84.0, yaw: -1.35 }, // faces the trail
  terrain: {
    baseScale: 0.0062,
    heightScale: 14.0,
    noiseX: -86,
    noiseZ: -62,
    mountain: {
      x: 64.0,
      z: 76.0,
      height: 30.0,
      radius: 60.0,
      plateauRadius: 9.0,
      name: 'Sugarloaf Mountain',
    },
    colors: {
      valley: 0x8e8c52,     // dry olive grass
      meadow: 0xb7aa68,     // golden grassland
      dryGrass: 0xd4c288,
      steepSlope: 0x9c7f63, // red-brown rhyolite soil
      summitRock: 0xb59c86, // pale pink-tan rhyolite
      riverbed: 0xbcab8c,   // pale sand and gravel of the dry wash
      riverbank: 0xa39274,
    },
  },
  water: {
    // Task 22: NPS says water flows on the surface here only now and then, so there is no stream:
    // a dry wash (shallow gravel channel, no water) crossed at ground level, plus small seeps (see features.roads).
    hasRiver: false,
    mode: 'dry-wash',
    name: 'Dry Wash',
    refZ: -40.0,        // the wash is measured from where the trail crosses it
    stones: [{ z: -40.0, count: 5 }],
    washDepth: 0.55,
    surfaceY: -1.0,
    halfWidth: 2.2,
    bankWidth: 4.0,
    valleyWidth: 40.0,
    gradient: 0.004,
    course: { baseX: -20.0, amp1: 6.0, freq1: 0.022, amp2: 2.5, freq2: 0.055 },
    deepColor: 0x3f4a42,
    shallowColor: 0x7a8a6a,
    skyReflectColor: 0xc8d0c0,
  },
  trail: {
    name: 'Sugarloaf and Echo Loop Trails',
    width: 2.2,
    surface: { center: 0xc2ab90, mid: 0xa98f76, edge: 0x7c7a4a }, // pale gravel path
    // Task 22: three paths instead of the old west/east pair. No footbridge: the wash is crossed on the ground.
    paths: [
      {
        id: 'approach',
        name: 'Sugarloaf Trail',
        steps: 14,
        nodes: [
          { x: -130.0, z: -90.0 }, // starts at the parking area
          { x: -122.0, z: -84.0 },
          { x: -112.0, z: -76.0 },
          { x: -100.0, z: -70.0 },
          { x: -88.0, z: -62.0 },
          { x: -76.0, z: -55.0 },
          { x: -64.0, z: -50.0 },
          { x: -52.0, z: -46.0 },
          { x: -40.0, z: -43.0 },
          { x: -26.5, z: -40.0 },
          { x: -14.5, z: -40.0 }, // across the dry wash
          { x: -5.0, z: -33.0 },  // loop junction
        ],
      },
      {
        // An Echo Canyon-style loop through the pinnacle fields
        id: 'echo-loop',
        name: 'Echo Loop',
        closed: true,
        nodes: [
          { x: -5.0, z: -33.0 },  // junction with the approach
          { x: 7.0, z: -22.0 },
          { x: 18.0, z: -8.0 },
          { x: 26.0, z: 6.0 },    // Pinnacle Gallery
          { x: 37.0, z: 15.0 },
          { x: 41.0, z: 28.0 },   // junction with the Sugarloaf spur
          { x: 28.0, z: 40.0 },
          { x: 8.0, z: 38.0 },
          { x: -1.0, z: 27.0 },   // the west side stays east of the dry wash
          { x: -3.0, z: 11.0 },
          { x: -5.0, z: -8.0 },
          { x: -9.0, z: -21.0 },
        ],
      },
      {
        // The spur up to the fire lookout
        id: 'sugarloaf-spur',
        name: 'Sugarloaf Spur',
        nodes: [
          { x: 41.0, z: 28.0 },
          { x: 48.0, z: 38.0 },
          { x: 54.0, z: 50.0 },
          { x: 58.0, z: 60.0 },
          { x: 61.0, z: 69.0 },
        ],
      },
    ],
  },
  overlook: {
    name: 'Sugarloaf Mountain Lookout',
    elevationLabel: 'Elev. 2,228m (7,310 ft)',
    deckRadius: 5.2,
    hasBench: true,
    hasTelescope: true,
    signHeading: 'SUGARLOAF MOUNTAIN',
    signSubheading: 'HIGHEST POINT IN THE PARK',
  },
  vegetation: {
    treeCount: 560,   // open oak and pine woodland with wide grassy gaps
    shrubCount: 800,
    speciesWeights: {
      conifer: 2.0,   // Arizona cypress and juniper
      pine: 4.5,      // Apache and Mexican pinyon pine
      broadleaf: 0.8, // sycamore in the canyon
      oak: 6.0,       // evergreen Emory and silverleaf oak
      birch: 0.0,
      poplar: 0.0,
      snag: 0.8,
    },
    // Task 21: sun-baked, open woodland of dull-green evergreen oak and pine, golden grassland, red paintbrush
    look: {
      treeScale: 0.82,
      glades: 0.55,
      palettes: {
        oak: [0x5b6b3a, 0x667740, 0x50602f, 0x6f7d45],
        pine: [0x4d6b4a, 0x5a7a52, 0x426044],
        conifer: [0x5c7566, 0x66806f, 0x52695a],
        broadleaf: [0xa8b45a, 0x98a84d, 0xb4bd66],
      },
      shrubPalette: [0x8a8a55, 0x77824a, 0x9a9460, 0x6b7a50],
      grass: { root: 0x6b5a30, stalk: 0xb8a95a, dry: 0xe0cf8a, fern: 0x8a9a4a, flowerA: 0xd8472f, flowerB: 0xf2d34a },
    },
  },
  atmosphere: {
    fogColor: 0xd9d2bf,
    fogDensity: 0.0048, // dry, clear desert air: you can see far
    hemiSky: 0xd6e4f0,
    hemiGround: 0x9a8a60,
    sunColor: 0xfff0c8,
    sunIntensity: 3.0,
    skyHorizon: 0xdcd3bd,
    skyMid: 0x7fb0d8,
    skyZenith: 0x2c68b0,
    skySun: 0xffe0a0,
  },
  // Task 22: landmarks chosen for this park (any ids, any number; keys 1 to 5 jump to them)
  landmarks: [
    {
      id: 'spawn',
      name: 'Sugarloaf Trailhead',
      shortName: 'Trailhead',
      description: 'Parking area and trailhead beside the scenic drive.',
      x: -122,
      y: 2.5,
      z: -84,
      yaw: -1.35,
    },
    {
      id: 'dry-wash',
      name: 'Dry Wash',
      shortName: 'Dry Wash',
      description: 'A gravel channel that carries water only now and then. The trail simply crosses it on the ground.',
      x: -29.0,
      y: 3.0,
      z: -40.0,
      yaw: -Math.PI / 2,
    },
    {
      id: 'pinnacle-gallery',
      name: 'Pinnacle Gallery',
      shortName: 'Pinnacles',
      description: 'Pillars of rhyolite tower over the Echo Loop, many balanced on a small base.',
      x: 24.0,
      y: 5.1,
      z: 6.0,
      yaw: Math.PI * 0.3,
    },
    {
      id: 'spring-seep',
      name: 'Spring Seep',
      shortName: 'Seep',
      description: 'Small wet patches where water seeps out of the ground. Rare and precious in this dry land, so look from a distance.',
      x: 49.0,
      y: 4.8,
      z: 12.0,
      yaw: -Math.PI / 2,
    },
    {
      id: 'summit',
      name: 'Sugarloaf Lookout',
      shortName: 'Lookout',
      description: 'A flat summit with a stone fire lookout and views across the pinnacles and the desert valleys.',
      x: 64.0,
      y: 30.2,
      z: 76.0,
      yaw: Math.PI * 1.2,
    },
  ],
  wildlife: {
    spawns: [
      { species: 'white-tailed-deer', isBuck: false, isFawn: false, x: -116.0, z: -76.0, roamRadius: 14.0 },
      { species: 'white-tailed-deer', isBuck: true, isFawn: false, x: -108.0, z: -96.0, roamRadius: 14.0 },
      { species: 'white-tailed-deer', isBuck: false, isFawn: true, x: -112.0, z: -82.0, roamRadius: 10.0 },
      // A black bear foraging well off the trail on the south slope
      { species: 'black-bear', isBuck: false, isFawn: false, x: 4.0, z: 66.0, roamRadius: 12.0 },
    ],
  },
  features: {
    roads: [
      {
        id: 'scenic-drive',
        name: 'Bonita Canyon Drive',
        kind: 'road',
        width: 6.5,
        nodes: [
          { x: -290, z: -90 },
          { x: -220, z: -120 },
          { x: -160, z: -120 },
          { x: -110, z: -160 },
          { x: -80, z: -230 },
          { x: -60, z: -300 },
        ],
        surface: { wallColors: [0xb39a82, 0xa38b74, 0xbfa88f, 0x9a8470] }, // rough CCC-style rubble walls
        walls: [{ side: 1, from: 0.18, to: 0.3 }],
      },
      {
        id: 'sugarloaf-lot',
        name: 'Sugarloaf Parking',
        kind: 'lot',
        levelFrom: 'scenic-drive',
        width: 12.0,
        nodes: [
          { x: -152, z: -94 },
          { x: -134, z: -94 },
        ],
      },
      {
        id: 'sugarloaf-entrance',
        name: 'Parking Entrance',
        kind: 'drive',
        levelFrom: 'scenic-drive',
        width: 6.0,
        nodes: [
          { x: -158, z: -118 },
          { x: -146, z: -100 },
        ],
      },
      // Task 22: small seeps (wet patches), made with the road system's 'lot' kind in a water-green colour.
      // That gives them levelled ground, no trees on them, and cheap rendering.
      {
        id: 'seep-main',
        name: 'Spring Seep',
        kind: 'lot',
        width: 3.6,
        surface: { paved: 0x4f6e58, shoulder: 0x6b6040, lines: false },
        nodes: [
          { x: 57, z: 10 },
          { x: 61, z: 11.5 },
        ],
      },
      {
        id: 'seep-small',
        name: 'Small Seep',
        kind: 'lot',
        levelFrom: 'seep-main',
        width: 2.4,
        surface: { paved: 0x56755f, shoulder: 0x6b6040, lines: false },
        nodes: [
          { x: 63.5, z: 15 },
          { x: 65.5, z: 17.5 },
        ],
      },
      {
        id: 'seep-low',
        name: 'Low Seep',
        kind: 'lot',
        levelFrom: 'seep-main',
        width: 2.2,
        surface: { paved: 0x4a6852, shoulder: 0x6b6040, lines: false },
        nodes: [
          { x: 55, z: 14.5 },
          { x: 57.5, z: 16.5 },
        ],
      },
    ],
    cars: [

      { x: -148.5, z: -97.5, yaw: 0, color: 0xd9d6cc },
      { x: -140.5, z: -90.0, yaw: Math.PI, color: 0x7a2c2c },
    ],
    pinnacles: [
      { x: -8, z: -5, radius: 34, count: 50, minHeight: 6, maxHeight: 20 },
      { x: 30, z: 28, radius: 30, innerRadius: 4, count: 55, minHeight: 6, maxHeight: 22 },
      { x: -75, z: -40, radius: 24, count: 24, minHeight: 4, maxHeight: 14 },
      { x: 62, z: 52, radius: 22, count: 30, minHeight: 5, maxHeight: 16 },
      // a distant field, like the Heart of Rocks
      { x: 120, z: -50, radius: 40, count: 70, minHeight: 7, maxHeight: 24 },
    ],
    talusFields: [
      { x: 10, z: -10, radius: 36, count: 50, sizeRange: [0.3, 1.2], colors: [0xb39a86, 0xa8907e, 0xc2aa94] },
      { x: 40, z: 40, radius: 30, count: 45, sizeRange: [0.3, 1.2], colors: [0xb39a86, 0xa8907e, 0xc2aa94] },
    ],
    succulents: { count: 300, spread: 230, maxHeight: 12 },
    lookoutHut: true,
    distantRidges: true,
  },
  rules: {
    zones: [
      {
        id: 'pinnacle-base-closure',
        kind: 'closed',
        name: 'Pinnacle Base Closure',
        x: -92,
        z: -48,
        radius: 6,
        reason: 'Closed to protect the loose, crumbling base of the rock pillars. In the game this is an example closure, not a real one.',
      },
      {
        id: 'lichen-rock-garden',
        kind: 'sensitive',
        name: 'Lichen Rock Garden',
        x: 14,
        z: 28,
        radius: 8,
        reason: 'Colourful lichens and ferns grow very slowly on and between the rocks. Stay on the trail so you do not scrape them off.',
      },
      {
        id: 'spring-seep',
        kind: 'sensitive',
        name: 'Spring Seep',
        x: 60,
        z: 12,
        radius: 7,
        reason: 'Small wet seeps are rare here and are home to tiger salamanders. Stay out so the damp ground is not trampled.',
      },
    ],
    // litter lies along this park's own paths
    litter: STANDARD_LITTER.map(l => ({
      ...l,
      trail: ({ 'can-1': 'approach', 'bottle-1': 'echo-loop', 'wrapper-1': 'echo-loop', 'peel-1': 'echo-loop', 'bag-1': 'sugarloaf-spur' } as Record<string, string>)[l.id] ?? 'approach',
    })),
  },
  about: {
    designNote:
      'A game-scale landscape inspired by the Sugarloaf Mountain and Echo Canyon part of Chiricahua National Park. The rhyolite pinnacles, the dry washes and small seeps, the oak and pine woods and the CCC fire lookout are real kinds of features here, but this map is not a survey: real trails, distances and layouts differ.',
    wildlifeGuidance: {
      text:
        'Chiricahua National Park asks visitors to keep a safe distance from all wildlife, never to feed animals, and to remember that coatis, which are related to raccoons, are wild and should not be approached.',
      caveat:
        'The park\'s pages say to keep a safe distance but give no number, so the game uses the National Park Service\'s general guidance: about 75 feet (23 m) from most animals and 150 feet (46 m) from black bears. Always check the park\'s current page and signs.',
      sourceUrl: 'https://home.nps.gov/chir/learn/nature/animals.htm',
      sourceLabel: 'nps.gov: Animals (Chiricahua)',
    },
    facts: [
      {
        id: 'newest-park',
        title: 'America\'s newest national park',
        text: 'Chiricahua, long a national monument, became the 64th U.S. national park on 20 October 2026.',
        sourceUrl: 'https://www.kold.com/2026/10/21/chiricahua-national-monument-officially-named-countrys-newest-national-park/',
        sourceLabel: 'KOLD News: Chiricahua named newest national park',
      },
      {
        id: 'pinnacles',
        title: 'Balancing pillars',
        text: 'The most noticeable natural features are rhyolite pinnacles that rise sometimes hundreds of feet, many balancing on a small base. The Civilian Conservation Corps named many of the formations in the 1930s.',
        sourceUrl: 'https://www.nps.gov/chir/learn/nature/geologicformations.htm',
        sourceLabel: 'nps.gov: Geologic Formations (Chiricahua)',
      },
      {
        id: 'volcano',
        title: 'A giant volcano made the rocks',
        text: 'About 27 million years ago a huge eruption formed the Turkey Creek Caldera, roughly 12 miles wide. Its ash settled into a thick layer of rhyolite tuff that has since cracked and eroded into the rock pillars.',
        sourceUrl: 'https://www.nps.gov/chir/learn/nature/geologicformations.htm',
        sourceLabel: 'nps.gov: Geologic Formations (Chiricahua)',
      },
      {
        id: 'sky-island',
        title: 'A sky island',
        text: 'The Chiricahua Mountains are one of many sky islands in southern Arizona: mountains rising from the surrounding desert, with their own mix of plants and animals.',
        sourceUrl: 'https://www.nps.gov/chir/learn/nature/geologicformations.htm',
        sourceLabel: 'nps.gov: Geologic Formations (Chiricahua)',
      },
      {
        id: 'water',
        title: 'Water is rare and precious',
        text: 'Water flows on the surface only now and then, but seeps and springs are vital to most of the park\'s animals. Underground faults let water rise in places, making small wetlands where tiger salamanders live.',
        sourceUrl: 'https://www.nps.gov/chir/learn/nature/geologicformations.htm',
        sourceLabel: 'nps.gov: Geologic Formations (Chiricahua)',
      },
      {
        id: 'animals',
        title: 'Lots of animal life',
        text: 'At least 71 kinds of mammals, 46 reptiles, 8 amphibians and 171 birds regularly occur here. Visitors often see deer and wild turkeys on the scenic drive, and lucky ones may see coatis or a black bear.',
        sourceUrl: 'https://home.nps.gov/chir/learn/nature/animals.htm',
        sourceLabel: 'nps.gov: Animals (Chiricahua)',
      },
      {
        id: 'elevation',
        title: 'From desert to lookout',
        text: 'The park rises from 5,124 feet (1,562 m) at the entrance station to 7,310 feet (2,228 m) at the top of Sugarloaf Mountain.',
        sourceUrl: 'https://www.nps.gov/chir/espanol/index.htm',
        sourceLabel: 'nps.gov: Chiricahua (Spanish home page)',
      },
    ],
    checkedOn: '2026-10-25',
  },
  waterStations: TRAILHEAD_AND_SUMMIT_WATER({ x: -122, z: -84 }, { x: 64, z: 76 }),
};

/**
 * WIND CAVE NATIONAL PARK (South Dakota) - Task 24
 * The park's surface is mostly mixed-grass prairie with ponderosa pine on the ridges, so this is the first park to use the
 * new "ground look" and "grassland look" (patchy ground colour, varied tall and short grass, a carpet of short grass and
 * gentle wind). The map follows the NPS Rankin Ridge Nature Trail: a one-mile loop from the Rankin Ridge parking lot up to
 * the historic fire tower, the highest point in the park.
 */
export const WIND_CAVE: ParkDefinition = {
  id: 'wind-cave',
  npsParkCode: 'wica',
  layoutSeed: 31,
  name: 'Wind Cave',
  subtitle: 'Where the Prairie Meets the Pines',
  parkServiceUnit: 'National Park',
  state: 'South Dakota',
  region: 'Great Plains / Black Hills',
  description: 'In the southern Black Hills of South Dakota, one of the best remaining areas of mixed-grass prairie rolls up to ridges of ponderosa pine, while one of the world\'s longest caves lies hidden underground.',
  elevationRange: { min: 1085, max: 1528 },
  spawn: { x: -60.0, y: 0.0, z: 34.0, yaw: -1.1 }, // in the Rankin Ridge parking lot, facing the trail
  terrain: {
    baseScale: 0.0046,
    heightScale: 6.5, // gentle rolling prairie
    noiseX: 20,
    noiseZ: -40,
    mountain: {
      x: 30.0,
      z: -30.0,
      height: 20.0,
      radius: 68.0,
      plateauRadius: 8.0,
      name: 'Rankin Ridge',
    },
    // Task 24: patchy prairie ground (green, gold, straw, sage and tan patches, some bare soil)
    groundLook: {
      patchScale: 0.016,
      strength: 0.85,
      patches: [0x6c9440, 0x8caa48, 0xb2b156, 0xd2bb68, 0xa98f55, 0x8c9c64],
      speckle: 0.22,
      soil: { color: 0xa98a5a, amount: 0.45 },
      mulch: 0.1,
    },
    colors: {
      valley: 0x7f9a46,     // fresh prairie green
      meadow: 0xa9ae52,     // green-gold grass
      dryGrass: 0xd2bd6c,   // cured golden grass
      steepSlope: 0x9a8a5e, // tan prairie soil
      summitRock: 0xb0a794, // pale limestone
      riverbed: 0xa89a78,
      riverbank: 0x9d9264,
    },
  },
  water: {
    // The Rankin Ridge area on the NPS pages has no stream, so this map has none.
    hasRiver: false,
    mode: 'none',
    name: 'No stream on the ridge',
    surfaceY: -1.0,
    halfWidth: 3.0,
    bankWidth: 5.0,
    valleyWidth: 30.0,
    gradient: 0.003,
    deepColor: 0x1f4448,
    shallowColor: 0x3d746b,
    skyReflectColor: 0xa8c6d8,
  },
  trail: {
    name: 'Rankin Ridge Nature Trail',
    width: 2.2,
    surface: { center: 0xb9ab8a, mid: 0xa0926f, edge: 0x7d8e48 }, // pale gravel with grass edges
    paths: [
      {
        // NPS: a one-mile loop that begins and ends at the Rankin Ridge parking lot
        id: 'rankin-ridge-loop',
        name: 'Rankin Ridge Nature Trail',
        closed: true,
        nodes: [
          { x: -52.0, z: 30.0 },  // trailhead, beside the parking lot
          { x: -40.0, z: 22.0 },
          { x: -26.0, z: 12.0 },  // ponderosa pine woods
          { x: -13.0, z: 0.0 },
          { x: 0.0, z: -10.0 },
          { x: 12.0, z: -20.0 },  // the summit spur leaves here
          { x: 22.0, z: -12.0 },
          { x: 36.0, z: -8.0 },
          { x: 50.0, z: -4.0 },
          { x: 48.0, z: 8.0 },    // open prairie on the way down
          { x: 34.0, z: 14.0 },
          { x: 16.0, z: 24.0 },
          { x: -4.0, z: 32.0 },
          { x: -24.0, z: 40.0 },
          { x: -42.0, z: 42.0 },
        ],
      },
      {
        // A few steps to the viewing deck by the tower
        id: 'summit-spur',
        name: 'Path to the Viewpoint',
        nodes: [
          { x: 12.0, z: -20.0 },
          { x: 19.0, z: -25.0 },
          { x: 25.0, z: -28.5 },
          { x: 29.0, z: -30.0 },
        ],
      },
    ],
  },
  overlook: {
    name: 'Rankin Ridge Viewpoint',
    elevationLabel: 'Elev. 1,528m (5,013 ft)',
    deckRadius: 5.2,
    hasBench: true,
    hasTelescope: true,
    signHeading: 'RANKIN RIDGE',
    signSubheading: 'HIGHEST POINT IN THE PARK',
  },
  vegetation: {
    treeCount: 260,   // mostly open prairie, with ponderosa pine on the ridge
    shrubCount: 900,
    speciesWeights: {
      conifer: 0.4,
      pine: 9.0,      // ponderosa pine
      broadleaf: 0.3,
      oak: 0.4,
      birch: 0.0,
      poplar: 0.0,
      snag: 0.4,
    },
    look: {
      treeScale: 1.0,
      glades: 0.6,
      palettes: {
        pine: [0x3f6a3c, 0x4d7a45, 0x35603a, 0x57804a],
        conifer: [0x4f7358, 0x5a7f62],
        broadleaf: [0xa4b552, 0x93a84a],
        oak: [0x6b7f3c, 0x5f7335],
      },
      shrubPalette: [0x8a9a5c, 0x7b8f55, 0xa09c62, 0x6f8a52],
      grass: { root: 0x44602a, stalk: 0x8aa648, dry: 0xd8c37c, fern: 0x6f8f3c, flowerA: 0xc86aa0, flowerB: 0xe8c83a },
      // Task 24: the richer grass
      grassland: {
        density: 1.8,
        radius: 54,
        heightRange: [0.55, 1.9],
        patchScale: 0.03,
        tints: [0xb9d48a, 0xfff0c0, 0xe8d9a8],
        sway: 0.9,
        carpet: { count: 3200, radius: 22, height: 0.28, root: 0x4a6a2c, tip: 0x8aa84a, tipDry: 0xcdb86a },
      },
    },
  },
  atmosphere: {
    fogColor: 0xd8dfd2,
    fogDensity: 0.0042, // clear, dry prairie air
    hemiSky: 0xd0e4f2,
    hemiGround: 0x9a9a5c,
    sunColor: 0xfff2d2,
    sunIntensity: 3.1,
    skyHorizon: 0xe2e6da,
    skyMid: 0x86b8e0,
    skyZenith: 0x2f72c0,
    skySun: 0xffe8b0,
  },
  landmarks: [
    {
      id: 'spawn',
      name: 'Rankin Ridge Parking Area',
      shortName: 'Parking Area',
      description: 'The parking lot where the Rankin Ridge Nature Trail begins and ends.',
      x: -60,
      y: 0.0,
      z: 34,
      yaw: -1.1,
    },
    {
      id: 'pine-woods',
      name: 'Ponderosa Pine Woods',
      shortName: 'Pine Woods',
      description: 'The lower trail winds through ponderosa pines with grass and low shrubs beneath.',
      x: -26,
      y: 0.3,
      z: 12,
      yaw: Math.PI * 0.8,
    },
    {
      id: 'prairie-slope',
      name: 'Prairie Slope',
      shortName: 'Prairie',
      description: 'Open mixed-grass prairie rolls away on the way down. Watch the grass ripple in the wind.',
      x: 40,
      y: 4.3,
      z: 6,
      yaw: -Math.PI / 2,
    },
    {
      id: 'summit',
      name: 'Rankin Ridge Fire Tower',
      shortName: 'Fire Tower',
      description: 'The highest point in the park. A historic steel fire tower stands on the ridge; climbing it is not permitted.',
      x: 30,
      y: 20.2,
      z: -30,
      yaw: Math.PI * 0.3,
    },
  ],
  wildlife: {
    spawns: [
      { species: 'white-tailed-deer', isBuck: false, isFawn: false, x: -30.0, z: 62.0, roamRadius: 14.0 },
      { species: 'white-tailed-deer', isBuck: true, isFawn: false, x: -20.0, z: 70.0, roamRadius: 14.0 },
      { species: 'white-tailed-deer', isBuck: false, isFawn: true, x: -26.0, z: 66.0, roamRadius: 10.0 },
      // An elk herd grazing on the open prairie east of the ridge, well away from the trail
      { species: 'elk', isBuck: true, isFawn: false, x: 96.0, z: 40.0, roamRadius: 9.0 },
      { species: 'elk', isBuck: false, isFawn: false, x: 90.0, z: 48.0, roamRadius: 10.0 },
      { species: 'elk', isBuck: false, isFawn: false, x: 102.0, z: 50.0, roamRadius: 10.0 },
      { species: 'elk', isBuck: false, isFawn: false, x: 94.0, z: 56.0, roamRadius: 8.0 },
    ],
    // Wind Cave asks visitors to stay at least 25 yards (23 m) from all wildlife
    safeDistanceOverrides: { elk: 23 },
  },
  features: {
    roads: [
      {
        id: 'highway-87',
        name: 'Highway 87',
        kind: 'road',
        width: 7.0,
        nodes: [
          { x: -160, z: -140 },
          { x: -154, z: -40 },
          { x: -150, z: 34 },
          { x: -156, z: 140 },
        ],
      },
      {
        id: 'rankin-ridge-road',
        name: 'Rankin Ridge Road',
        kind: 'drive',
        levelFrom: 'highway-87',
        width: 5.5,
        nodes: [
          { x: -150, z: 34 },
          { x: -110, z: 34 },
          { x: -72, z: 34 },
        ],
      },
      {
        id: 'rankin-ridge-parking',
        name: 'Rankin Ridge Parking Lot',
        kind: 'lot',
        levelFrom: 'highway-87',
        width: 14.0,
        nodes: [
          { x: -66, z: 28 },
          { x: -66, z: 42 },
        ],
      },
    ],
    cars: [
      { x: -62.0, z: 31.0, yaw: Math.PI, color: 0x9a2a2a },
      { x: -62.0, z: 38.0, yaw: 0, color: 0xd9d6cc },
      { x: -69.0, z: 40.0, yaw: Math.PI, color: 0x2f4a6b },
    ],
    fireTower: { x: 38, z: -34, height: 14 },
    distantRidges: true,
  },
  rules: {
    zones: [
      {
        id: 'fire-tower-base',
        kind: 'closed',
        name: 'Fire Tower Base',
        x: 38,
        z: -34,
        radius: 5,
        reason: 'The park does not permit climbing the historic fire tower.',
      },
      {
        id: 'native-prairie-patch',
        kind: 'sensitive',
        name: 'Native Prairie Patch',
        x: -6,
        z: 47,
        radius: 7,
        reason: 'Slow-growing native prairie plants live here. (In the game this is an example area. Wind Cave is an open-hike park where walking off trail is allowed, but staying on the trail still protects plants.)',
      },
    ],
    // litter lies along this park's own paths
    litter: STANDARD_LITTER.map(l => ({
      ...l,
      trail: ({ 'can-1': 'rankin-ridge-loop', 'bottle-1': 'rankin-ridge-loop', 'wrapper-1': 'rankin-ridge-loop', 'peel-1': 'rankin-ridge-loop', 'bag-1': 'summit-spur' } as Record<string, string>)[l.id] ?? 'rankin-ridge-loop',
    })),
  },
  about: {
    designNote:
      'A game-scale landscape of the Rankin Ridge area, following the NPS description of the Rankin Ridge Nature Trail: a one-mile loop from the parking lot to the historic fire tower. The prairie, ponderosa pines and elk are real kinds of features here, but bison, prairie dogs and the cave are not in the game, and this map is not a survey: real distances, trails and layouts differ. The elevation numbers are commonly published figures and were not checked against an NPS page. This is the first park to use the new ground and grass look.',
    wildlifeGuidance: {
      text:
        'Wind Cave requires visitors to stay at least 25 yards (23 meters) from all wildlife, and strongly recommends staying farther away from bison.',
      caveat:
        'The game has deer and elk but no bison. Always check the park\'s current page and signs.',
      sourceUrl: 'https://www.nps.gov/wica/planyourvisit/hiking.htm',
      sourceLabel: 'nps.gov: Hiking (Wind Cave)',
    },
    facts: [
      {
        id: 'prairie',
        title: 'Prairie above, cave below',
        text: 'More than 30 miles of hiking trails wander through mixed-grass prairie and ponderosa pine forest. Beneath it all lies Wind Cave, one of the most complex caves in the world.',
        sourceUrl: 'https://www.nps.gov/wica/planyourvisit/hiking.htm',
        sourceLabel: 'nps.gov: Hiking (Wind Cave)',
      },
      {
        id: 'open-hike',
        title: 'An open-hike park',
        text: 'Wind Cave is an open-hike park, so visitors are welcome to hike off designated trails across thousands of acres.',
        sourceUrl: 'https://www.nps.gov/wica/planyourvisit/hiking.htm',
        sourceLabel: 'nps.gov: Hiking (Wind Cave)',
      },
      {
        id: 'rankin-ridge',
        title: 'The Rankin Ridge loop',
        text: 'The Rankin Ridge Nature Trail is a one-mile loop that begins and ends at the Rankin Ridge parking lot, with interpretive stops along the way. Climbing the historic fire tower is not permitted.',
        sourceUrl: 'https://www.nps.gov/places/rankin-ridge-nature-trail.htm',
        sourceLabel: 'nps.gov: Rankin Ridge Nature Trail',
      },
      {
        id: 'managed-by-fire',
        title: 'Grass kept healthy by fire and grazers',
        text: 'The prairie is managed mainly with native grazing animals and fire, the two forces that shaped the vegetation of the Black Hills long before settlement.',
        sourceUrl: 'https://www.nps.gov/im/ngpn/wica.htm',
        sourceLabel: 'nps.gov: Inventory and Monitoring (Wind Cave)',
      },
      {
        id: 'wildlife',
        title: 'Hoofed neighbours',
        text: 'Deer, bison, elk and pronghorn live throughout the park, along with large prairie dog towns, coyotes, bobcats, mountain lions and eagles.',
        sourceUrl: 'https://www.nps.gov/im/ngpn/wica.htm',
        sourceLabel: 'nps.gov: Inventory and Monitoring (Wind Cave)',
      },
    ],
    checkedOn: '2026-11-01',
  },
  waterStations: TRAILHEAD_AND_SUMMIT_WATER({ x: -60, z: 34 }, { x: 30, z: -30 }),
};

/** Real parks first. Practice (fictional) parks come last. */
export const AVAILABLE_PARKS: ParkDefinition[] = [
  GREAT_SMOKY_MOUNTAINS,
  SHENANDOAH,
  ACADIA,
  CHIRICAHUA,
  WIND_CAVE,
  PROTOTYPE_PARK,
];

let activePark: ParkDefinition = GREAT_SMOKY_MOUNTAINS;

export function getActivePark(): ParkDefinition {
  return activePark;
}

export function setActivePark(parkId: string): ParkDefinition {
  const found = AVAILABLE_PARKS.find(p => p.id === parkId);
  if (found) {
    activePark = found;
  }
  return activePark;
}

/** Id of the park after the given one (used by the [P] hotkey). */
export function getNextParkId(currentId: string): string {
  const i = AVAILABLE_PARKS.findIndex(p => p.id === currentId);
  return AVAILABLE_PARKS[(i + 1) % AVAILABLE_PARKS.length].id;
}
