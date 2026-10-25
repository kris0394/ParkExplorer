/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Season } from './seasons.ts';

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
  trail: 'west' | 'east';
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
  /** Trail cairns (small stacks of stones) on bare ground above this height, one every `every` metres. */
  cairns?: { minHeight: number; every: number };
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
    hasRiver: boolean;
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
    westNodes: { x: number; z: number }[];
    eastNodes: { x: number; z: number }[];
    bridge: {
      /** 'timber' (default) or 'stone' (granite arch-style bridge with stone parapets). */
      style?: 'timber' | 'stone';
      name: string;
      westX: number;
      eastX: number;
      centerZ: number;
      deckY: number;
      width: number;
    };
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
    x: 0.0,
    y: 2.4,
    z: 14.0,
    yaw: 0,
  },
  terrain: {
    baseScale: 0.0048,
    heightScale: 19.5, // taller rolling ridges
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
    hasRiver: true,
    name: 'Little River & Roaring Fork',
    surfaceY: -1.0,
    halfWidth: 6.5,
    bankWidth: 7.5,
    valleyWidth: 36.0,
    gradient: 0.0028,
    deepColor: 0x143f45,   // deep cold mountain stream
    shallowColor: 0x2c6863,
    skyReflectColor: 0x8dafc2,
  },
  trail: {
    name: 'Alum Cave to Ridge Trail',
    width: 2.4,
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
      name: 'Roaring Fork Footbridge',
      westX: 16.5,
      eastX: 41.5,
      centerZ: 4.0,
      deckY: 1.25,
      width: 3.6,
    },
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
    shrubCount: 1900, // famous dense rhododendron and mountain laurel understory
    speciesWeights: {
      conifer: 3.5,     // red spruce & fraser fir on ridges
      pine: 1.5,
      broadleaf: 5.0,   // lush sugar maples, tuliptrees, yellow buckeyes
      oak: 3.5,         // chestnut oaks
      birch: 2.2,       // yellow birch
      poplar: 1.8,      // tulip poplar
      snag: 0.4,
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
  landmarks: [
    {
      id: 'spawn',
      name: 'Cove Hardwoods Trailhead',
      description: 'Sheltered cove forest floor carpeted with wild ferns.',
      x: 0,
      y: 2.4,
      z: 14,
      yaw: 0,
    },
    {
      id: 'bridge',
      name: 'Roaring Fork Footbridge',
      description: 'Moss-covered timber bridge spanning the cold mountain stream.',
      x: 18.0,
      y: 1.35,
      z: 4.0,
      yaw: -Math.PI / 2,
    },
    {
      id: 'switchback',
      name: 'Appalachian Ridge Switchback',
      description: 'Climbing through laurel slicks with layers of misty blue ridges.',
      x: 95.0,
      y: 16.5,
      z: -55.0,
      yaw: -Math.PI * 0.8,
    },
    {
      id: 'summit',
      name: 'Kuwohi Ridge Overlook',
      description: 'High vantage point looking across endless waves of blue smoky ridges.',
      x: 82.0,
      y: 33.2,
      z: -70.0,
      yaw: Math.PI * 0.8,
    },
  ],
  wildlife: {
    spawns: [
      { species: 'white-tailed-deer', isBuck: false, isFawn: false, x: 5.5, z: 9.0, roamRadius: 16.0 },   // Doe on right
      { species: 'white-tailed-deer', isBuck: true, isFawn: false, x: -7.5, z: 8.0, roamRadius: 18.0 },   // Antlered buck on left
      { species: 'white-tailed-deer', isBuck: false, isFawn: true, x: 8.0, z: 6.5, roamRadius: 12.0 },    // Spotted fawn
      { species: 'white-tailed-deer', isBuck: false, isFawn: false, x: 14.0, z: 4.5, roamRadius: 15.0 }, // Second doe
      // Elk herd grazing in a meadow to the west, well beyond the 50-yard (46 m) guidance from the start point
      { species: 'elk', isBuck: true, isFawn: false, x: -47.0, z: 60.0, roamRadius: 9.0 },   // Bull elk
      { species: 'elk', isBuck: false, isFawn: false, x: -52.0, z: 56.0, roamRadius: 10.0 }, // Cow elk
      { species: 'elk', isBuck: false, isFawn: false, x: -43.0, z: 65.0, roamRadius: 10.0 }, // Cow elk
      { species: 'elk', isBuck: false, isFawn: false, x: -55.0, z: 63.0, roamRadius: 8.0 },  // Cow elk
      // Black bear foraging on the forested ridge below the summit, about 30 m off the trail
      { species: 'black-bear', isBuck: false, isFawn: false, x: 130.0, z: -86.0, roamRadius: 12.0 },
    ],
  },
  rules: {
    zones: [
      {
        id: 'stream-habitat-closure',
        kind: 'closed',
        name: 'Stream Habitat Closure',
        x: -8,
        z: -30,
        radius: 9,
        reason: 'Closed to protect small stream life, such as salamanders, that live under rocks and leaf litter here.',
      },
      {
        id: 'understory-wildflower-slope',
        kind: 'sensitive',
        name: 'Understory Wildflower Slope',
        x: 70,
        z: 32,
        radius: 11,
        reason: 'Fragile spring wildflowers. Stepping off the trail tramples them and the soil beneath.',
      },
      SUMMIT_WINTER_CLOSURE,
    ],
    litter: STANDARD_LITTER,
  },
  about: {
    designNote:
      'A game-scale landscape inspired by the Smokies. Kuwohi, Roaring Fork and Alum Cave are real places, but this map is not a survey: real distances, trails and layouts differ.',
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
        id: 'roaring-fork-wildlife',
        title: 'Roaring Fork wildlife',
        text: 'The park lists the Roaring Fork Motor Nature Trail as a place where black bears, white-tailed deer and turkeys are often seen.',
        sourceUrl: 'https://www.nps.gov/grsm/planyourvisit/wildlifeviewing.htm',
        sourceLabel: 'nps.gov: Wildlife Viewing (Great Smoky Mountains)',
      },
    ],
    checkedOn: '2026-10-10',
  },
  waterStations: TRAILHEAD_AND_SUMMIT_WATER({ x: 0, z: 14 }, { x: 82, z: -70 }),
};

/**
 * REAL PARK: Shenandoah National Park (Virginia)
 * Task 17. A game-scale landscape inspired by the Hawksbill area. Names are real, the layout is not a survey.
 */
export const SHENANDOAH: ParkDefinition = {
  id: 'shenandoah',
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
  // Task 18: this park has its own layout (own trail, brook, summit spot, hills and forest pattern), not a copy of the Smokies
  layoutSeed: 7,
  name: 'Shenandoah',
  subtitle: 'Skyline Drive & Blue Ridge Views',
  parkServiceUnit: 'National Park',
  state: 'Virginia',
  region: 'Mid-Atlantic / Blue Ridge Mountains',
  description: 'A long, narrow park along the crest of the Blue Ridge Mountains, with hardwood forest, rocky greenstone summits and far views over the Shenandoah Valley and the Virginia Piedmont.',
  elevationRange: { min: 163, max: 1235 },
  spawn: { x: -18.0, y: 2.4, z: 46.0, yaw: -0.855 }, // faces the footbridge
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
    hasRiver: true,
    name: 'Mountain Stream',
    surfaceY: -1.0,
    halfWidth: 2.4,    // a narrow mountain brook, not a wide river
    bankWidth: 5.0,
    valleyWidth: 30.0,
    gradient: 0.0035,
    course: { baseX: 20.0, amp1: 5.0, freq1: 0.026, amp2: 2.0, freq2: 0.06 },
    deepColor: 0x17434a,
    shallowColor: 0x336f68,
    skyReflectColor: 0x94b6c9,
  },
  trail: {
    name: 'Lower Hawksbill Trail',
    width: 2.4,
    surface: { center: 0x95938a, mid: 0x7d7b71, edge: 0x58613f }, // pale rocky greenstone path
    westNodes: [
      { x: -44.0, z: 47.0 }, // starts at the parking area
      { x: -31.0, z: 46.6 },
      { x: -18.0, z: 46.0 },
      { x: -12.0, z: 41.0 },
      { x: -5.0, z: 35.0 },
      { x: 2.0, z: 29.0 },
      { x: 7.0, z: 24.0 },
      { x: 12.0, z: 20.0 },
    ],
    // A long, steady climb with two hairpins near the top (the real Lower Hawksbill Trail is a steady, rocky climb)
    eastNodes: [
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
    bridge: {
      name: 'Stream Footbridge',
      westX: 12.0,
      eastX: 27.0,
      centerZ: 20.0,
      deckY: 1.25,
      width: 3.4,
    },
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
  landmarks: [
    {
      id: 'spawn',
      name: 'Hawksbill Gap Trailhead',
      description: 'Trailhead beside Skyline Drive where the Lower Hawksbill Trail begins.',
      x: -18,
      y: 2.4,
      z: 46,
      yaw: -0.855,
    },
    {
      id: 'bridge',
      name: 'Stream Footbridge',
      description: 'A short timber footbridge over a clear mountain brook.',
      x: 14.0,
      y: 1.3,
      z: 20.0,
      yaw: -Math.PI / 2,
    },
    {
      id: 'switchback',
      name: 'Oak Woods Hairpin',
      description: 'The trail doubles back on itself as it climbs through oak woods with filtered views of the ridges.',
      x: 122.0,
      y: 13.9,
      z: -20.0,
      yaw: Math.PI * 0.9,
    },
    {
      id: 'summit',
      name: 'Hawksbill Summit',
      description: 'A rocky summit with a stone observation platform and long views of the Blue Ridge.',
      x: 115.0,
      y: 30.2,
      z: -50.0,
      yaw: Math.PI * 0.8,
    },
  ],
  wildlife: {
    spawns: [
      // Deer around the trailhead meadow
      { species: 'white-tailed-deer', isBuck: false, isFawn: false, x: -9.0, z: 41.5, roamRadius: 16.0 },   // Doe
      { species: 'white-tailed-deer', isBuck: true, isFawn: false, x: -22.0, z: 28.0, roamRadius: 14.0 },   // Antlered buck
      { species: 'white-tailed-deer', isBuck: false, isFawn: true, x: -6.0, z: 46.5, roamRadius: 12.0 },    // Fawn
      // A second doe and fawn grazing in the brook meadow, a good distance from the trail
      { species: 'white-tailed-deer', isBuck: false, isFawn: false, x: 46.0, z: 38.0, roamRadius: 12.0 },
      { species: 'white-tailed-deer', isBuck: false, isFawn: true, x: 49.0, z: 41.0, roamRadius: 10.0 },
      // Black bear foraging on the slope south of the trail, well beyond the 46 m guidance from the start
      { species: 'black-bear', isBuck: false, isFawn: false, x: 78.0, z: 40.0, roamRadius: 12.0 },
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
        id: 'stream-habitat-closure',
        kind: 'closed',
        name: 'Stream Habitat Closure',
        x: -6,
        z: 12,
        radius: 7,
        reason: 'Closed to protect small stream life, such as salamanders, that live under rocks and leaf litter here.',
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
    litter: STANDARD_LITTER,
  },
  about: {
    designNote:
      'A game-scale landscape inspired by the Hawksbill area. Hawksbill, Skyline Drive and the Lower Hawksbill Trail are real, but this map is not a survey: real distances, trails and layouts differ. Elevation relief near Hawksbill is real.',
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
    ],
    checkedOn: '2026-10-19',
  },
  waterStations: TRAILHEAD_AND_SUMMIT_WATER({ x: -18, z: 46 }, { x: 115, z: -50 }),
};

/**
 * Task 20: Acadia National Park (Maine). Its own layout and look: a bare pink-granite summit with a long open climb,
 * cairns, granite boulders (glacial erratics), a stone bridge, a coast with islands, and cool maritime light.
 */
export const ACADIA: ParkDefinition = {
  id: 'acadia',
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
    hasRiver: true,
    name: 'Mountain Brook',
    surfaceY: -1.0,
    halfWidth: 5.0,
    bankWidth: 6.0,
    valleyWidth: 44.0,
    gradient: 0.003,
    course: { baseX: -10.0, amp1: 7.0, freq1: 0.02, amp2: 3.0, freq2: 0.05 },
    deepColor: 0x1a3d4a,
    shallowColor: 0x3d7a80,
    skyReflectColor: 0xa8c4d6,
  },
  trail: {
    name: 'Cadillac North Ridge Trail',
    width: 2.4,
    surface: { center: 0xb9aca2, mid: 0xa09188, edge: 0x5e6c47 }, // pink granite path
    westNodes: [
      { x: -104.0, z: 73.0 }, // starts at the parking area
      { x: -95.0, z: 72.0 },
      { x: -84.0, z: 67.0 },
      { x: -72.0, z: 60.0 },
      { x: -60.0, z: 53.0 },
      { x: -48.0, z: 45.0 },
      { x: -37.0, z: 36.0 },
      { x: -28.0, z: 29.0 },
      { x: -21.0, z: 24.0 },
    ],
    // A long open climb across bare granite, marked by cairns
    eastNodes: [
      { x: -0.5, z: 24.0 },
      { x: 8.0, z: 18.0 },
      { x: 19.0, z: 9.0 },
      { x: 31.0, z: -1.0 },
      { x: 41.0, z: -14.0 },
      { x: 48.0, z: -29.0 },
      { x: 55.0, z: -41.0 },
      { x: 66.0, z: -49.0 },
      { x: 77.0, z: -55.0 },
      { x: 86.0, z: -64.0 },
      { x: 90.0, z: -74.0 },
      { x: 93.5, z: -81.5 },
    ],
    bridge: {
      style: 'stone',
      name: 'Stone Bridge',
      westX: -21.0,
      eastX: -0.5,
      centerZ: 24.0,
      deckY: 1.4,
      width: 3.8,
    },
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
  landmarks: [
    {
      id: 'spawn',
      name: 'North Ridge Trailhead',
      description: 'Trailhead beside the loop road where a trail climbs toward Cadillac Mountain.',
      x: -95,
      y: 5.2,
      z: 72,
      yaw: -1.0,
    },
    {
      id: 'bridge',
      name: 'Granite Stone Bridge',
      description: 'A granite bridge with stone parapets, in the style of Acadia\'s carriage-road bridges.',
      x: -23.0,
      y: 1.0,
      z: 24.0,
      yaw: -Math.PI / 2,
    },
    {
      id: 'switchback',
      name: 'Bald Granite Ledge',
      description: 'Trees give way to bare pink granite here. Look for the stacked-stone cairns that mark the route.',
      x: 55.0,
      y: 7.2,
      z: -41.0,
      yaw: Math.PI * 0.75,
    },
    {
      id: 'summit',
      name: 'Cadillac Summit',
      description: 'A bare granite summit with long views over the islands and the Atlantic.',
      x: 95.0,
      y: 34.2,
      z: -85.0,
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
        name: 'Trailhead Parking',
        kind: 'lot',
        levelFrom: 'park-loop-road',
        width: 12.0,
        nodes: [
          { x: -112, z: 62 },
          { x: -112, z: 84 },
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
    cairns: { minHeight: 11, every: 13 },
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
        x: 108,
        z: -74,
        radius: 8,
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
    litter: STANDARD_LITTER,
  },
  about: {
    designNote:
      'A game-scale landscape inspired by Cadillac Mountain and the Mount Desert Island coast. Cadillac Mountain, Acadia\'s granite, carriage-road bridges and the islands in the bay are real, but this map is not a survey: real distances, trails and layouts differ. Elevation relief near Cadillac Mountain is real.',
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
    ],
    checkedOn: '2026-10-25',
  },
  waterStations: TRAILHEAD_AND_SUMMIT_WATER({ x: -95, z: 72 }, { x: 95, z: -85 }),
};

/** Real parks first. Practice (fictional) parks come last. */
export const AVAILABLE_PARKS: ParkDefinition[] = [
  GREAT_SMOKY_MOUNTAINS,
  SHENANDOAH,
  ACADIA,
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
