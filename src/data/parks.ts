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
  species: 'white-tailed-deer' | 'elk' | 'black-bear' | 'bison' | 'prairie-dog' | 'bighorn-sheep' | 'pronghorn' | 'wild-horse' | 'mule-deer' | 'kit-fox' | 'jackrabbit' | 'coyote' | 'mountain-lion';
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

/**
 * Task 25: eroded "badlands" relief (opt-in). A steep, gullied wall (the Badlands Wall) rises from the prairie, a rugged belt
 * of buttes and benches falls away behind it to a low basin, and trail paths whose nodes have a `y` are cut or built up
 * so they stay walkable. Leave out for every other park (their ground is unchanged).
 */
export interface BadlandsConfig {
  /**
   * Which way the badlands fall away from the prairie. 'south' (default): prairie in the north, badlands to the south.
   * 'west': prairie in the east, badlands (and the river) to the west; 'east' and 'north' likewise.
   * `wall` and `gaps` are written in that turned frame (see wall).
   */
  facing?: 'south' | 'west' | 'east' | 'north';
  /**
   * The crest line of the wall, written in the turned frame: x runs ALONG the wall and z is how far the crest is from the prairie
   * edge of the frame. For facing 'south' that is simply world x and z (z grows to the south). For 'west' x is world z and z is minus world x.
   */
  wall: { x: number; z: number }[];
  /** Height of the crest above the prairie (m). */
  crestHeight: number;
  /** Distance in front of the crest over which the steep north face rises (m). */
  faceWidth: number;
  /** Width of the broken, bench-like top behind the crest before the land falls away (m). */
  topWidth: number;
  /** Distance over which the land then falls to the basin (m). */
  backWidth: number;
  /** How far below the prairie the basin floor lies (m). */
  basinDrop: number;
  /** Low gaps in the crest (the Door, the Window, the Notch canyon). x is along the wall; depth 0 to 1 is how much of the crest is cut away. */
  gaps: { x: number; depth: number; width: number }[];
  /** 0 to 1: how deeply the faces are gullied and how sharp the ridges are. */
  ruggedness: number;
  /** Height of one rock layer (m). Slopes break into benches this tall. 0 = none. */
  terraceStep: number;
  /** Steepness of the banks cut beside a pinned trail (1 = 45 degrees). Default 0.9. */
  bankSlope?: number;
  /** false = trees and grass may grow on the slopes and benches (a vegetated badlands such as Theodore Roosevelt). Default true: bare rock. */
  bare?: boolean;
  /** 0 to 1: how much of the grass colour flat benches keep under the rock bands (default 0). */
  flatGrass?: number;
  /** Banded rock colours and how thick a band is (m). */
  strata: { colors: number[]; bandHeight: number; strength: number };
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
  /** Task 25: a small stone-and-timber cave entrance building with a railed hole, as at Wind Cave's natural entrance. */
  naturalEntrance?: { x: number; z: number; yaw?: number };
  /** Task 26: a walk-in cave tour (a rocky mound with a dark passage, boxwork and frostwork, and a chamber). The mouth is at x, z and faces the direction given by yaw. */
  caveTour?: { x: number; z: number; yaw?: number };
  /** Task 25: a notched log ladder up a steep step in a trail (Badlands Notch Trail). The foot is at x, z and it climbs toward yaw (0 = south) for `run` metres. Its height comes from the ground. */
  logLadder?: { x: number; z: number; yaw: number; run: number }[];
  /** Task 25: a natural rock window you can walk or look through (rock jambs and a lintel standing on the trail). The ground itself cannot have holes, so the window is built as a rock frame. yaw 0 = the way through points south. */
  rockWindows?: { x: number; z: number; yaw: number; /** Clear width of the opening (m) */ opening: number; /** Clear height of the opening (m) */ height: number; /** Size of the rock blobs (1 = a small window, 2 = a big arch) */ scale?: number; colors?: number[] }[];
  /** Task 25: wooden railings along both sides and across the end of a path's last stretch (a railed viewpoint, as at the Window Trail). Players cannot walk through them. */
  railings?: { path: string; length: number; endCap?: boolean }[];
  /** Task 25: a prairie dog town: bare dirt mounds with burrow holes. Prairie dogs themselves come from wildlife.spawns. */
  prairieDogTown?: { x: number; z: number; radius: number; mounds: number; /** How many prairie dogs live on the mounds (default: one for every second mound). */ dogs?: number };
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
    /** Task 25: eroded badlands relief and banded rock colours (opt-in; see BadlandsConfig). */
    badlands?: BadlandsConfig;
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
    /** Task 26: true = no trail goes near the river, so a flowing river needs no bridge (the river is scenery, as at Wind Canyon). */
    noCrossing?: boolean;
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
      /**
       * Task 25: dense stands of trees (woods) inside open land. Each grove gets extra trees; the open-glade rule is ignored inside it.
       */
      groves?: { x: number; z: number; radius: number }[];
      /**
       * Task 25: scattered bushes and wildflowers so open ground does not look bare: clumps of shrubs (sagebrush, chokecherry...)
       * and small patches of wildflowers.
       */
      groundCover?: {
        clumps: number;
        flowerPatches: number;
        clumpPalette: number[];
        flowerPalette: number[];
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
        // A short gravel path from the visitor center parking lot to the cave's natural entrance
        id: 'natural-entrance-path',
        name: 'Path to the Natural Entrance',
        nodes: [
          { x: -62.0, z: -88.0 },
          { x: -66.0, z: -78.0 },
          { x: -72.0, z: -68.0 },
          { x: -76.0, z: -60.5 },
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
    treeCount: 380,   // mostly open prairie, with ponderosa pine woods on the ridge
    shrubCount: 1600,
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
      // Task 25: real pine woods along the lower trail, and bushes and wildflowers scattered over the prairie
      groves: [
        { x: -14, z: 2, radius: 22 },
        { x: 4, z: -12, radius: 15 },
        { x: 70, z: 20, radius: 12 },
      ],
      groundCover: {
        clumps: 420,
        flowerPatches: 150,
        clumpPalette: [0x8a9a78, 0x7f9373, 0x9aa686, 0x6f8a55, 0x5d7a45, 0x9a5a3a],
        flowerPalette: [0xc86aa0, 0xe8c83a, 0xf0efe0, 0x9a70c8],
      },
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
      description: 'Higher up the loop, the trail winds through ponderosa pines with grass and bushes beneath.',
      x: -4,
      y: 1.5,
      z: -4,
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
    {
      id: 'natural-entrance',
      name: 'Wind Cave Natural Entrance',
      shortName: 'Cave Entrance',
      description: 'The cave\'s natural entrance is only about ten inches wide. The wind that gave the cave its name blows in or out depending on the air pressure.',
      x: -70,
      y: -0.6,
      z: -62,
      yaw: Math.PI * 0.5,
    },
    {
      id: 'cave-tour',
      name: 'Cave Tour Entrance',
      shortName: 'Cave Tour',
      description: 'A game version of a cave tour: walk into the dark passage and look for boxwork (thin honeycomb fins of calcite), popcorn and frostwork. In real life visitors see the inside of Wind Cave on ranger-guided tours.',
      x: -51.5,
      y: 0.4,
      z: -72.5,
      yaw: -2.62,
    },
    {
      id: 'prairie-dog-town',
      name: 'Prairie Dog Town',
      shortName: 'Prairie Dogs',
      description: 'A viewpoint at the edge of a prairie dog town. Watch the sentinels stand up, and keep your distance.',
      x: -20,
      y: -0.3,
      z: -78,
      yaw: Math.PI,
    },
    {
      id: 'bison-flats',
      name: 'Bison Flats',
      shortName: 'Bison',
      description: 'Wide open prairie where a bison herd grazes. Bison look calm but are unpredictable, so stay far back.',
      x: 8,
      y: -0.6,
      z: -84,
      yaw: -Math.PI / 2,
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
      // A bison herd on the flat prairie in the north, well away from the trails (the real herd is several hundred strong)
      { species: 'bison', isBuck: true, isFawn: false, x: 66.0, z: -98.0, roamRadius: 9.0 },
      { species: 'bison', isBuck: false, isFawn: false, x: 72.0, z: -92.0, roamRadius: 10.0 },
      { species: 'bison', isBuck: false, isFawn: false, x: 60.0, z: -92.0, roamRadius: 10.0 },
      { species: 'bison', isBuck: false, isFawn: false, x: 76.0, z: -102.0, roamRadius: 9.0 },
      { species: 'bison', isBuck: true, isFawn: false, x: 54.0, z: -100.0, roamRadius: 9.0 },
      { species: 'bison', isBuck: false, isFawn: false, x: 68.0, z: -108.0, roamRadius: 8.0 },
    ],
    // Wind Cave asks visitors to stay at least 25 yards (23 m) from all wildlife and strongly recommends more room for bison
    safeDistanceOverrides: { elk: 23, bison: 46, 'prairie-dog': 23 },
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
      {
        // Task 25: Highway 385 runs along the north of the map, past the prairie dog town and Bison Flats
        id: 'highway-385',
        name: 'Highway 385',
        kind: 'road',
        width: 7.0,
        nodes: [
          { x: -170, z: -124 },
          { x: -90, z: -120 },
          { x: 0, z: -114 },
          { x: 100, z: -120 },
          { x: 180, z: -130 },
        ],
      },
      {
        id: 'visitor-center-road',
        name: 'Visitor Center Road',
        kind: 'drive',
        levelFrom: 'highway-385',
        width: 5.5,
        nodes: [
          { x: -60, z: -118 },
          { x: -60, z: -100 },
        ],
      },
      {
        id: 'visitor-center-lot',
        name: 'Visitor Center Parking',
        kind: 'lot',
        levelFrom: 'highway-385',
        width: 12.0,
        nodes: [
          { x: -70, z: -94 },
          { x: -50, z: -94 },
        ],
      },
    ],
    cars: [
      { x: -66.0, z: -91.0, yaw: Math.PI / 2, color: 0x2f4a6b },
      { x: -58.0, z: -97.0, yaw: -Math.PI / 2, color: 0xd9d6cc },
      { x: -52.0, z: -91.0, yaw: Math.PI / 2, color: 0x9a2a2a },
      { x: -62.0, z: 31.0, yaw: Math.PI, color: 0x9a2a2a },
      { x: -62.0, z: 38.0, yaw: 0, color: 0xd9d6cc },
      { x: -69.0, z: 40.0, yaw: Math.PI, color: 0x2f4a6b },
    ],
    fireTower: { x: 38, z: -34, height: 14 },
    // Task 25: the natural entrance of the cave and a prairie dog town (the real ones are elsewhere in the park; placed together here for the game)
    naturalEntrance: { x: -76, z: -58, yaw: Math.PI * 0.5 },
    // Task 26: a walk-in cave tour (a game version: the real cave is only open on ranger-guided tours)
    caveTour: { x: -50, z: -70, yaw: -2.62 },
    prairieDogTown: { x: -20, z: -104, radius: 11, mounds: 15, dogs: 9 },
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
      'A game-scale landscape of the Rankin Ridge area, following the NPS description of the Rankin Ridge Nature Trail: a one-mile loop from the parking lot to the historic fire tower. The prairie, ponderosa pines, elk, bison, prairie dogs and the cave\'s natural entrance are real features of the park, but in reality they are spread across the park (the Rankin Ridge trail, Highway 385 with its prairie dog towns, and the visitor center and natural entrance are miles apart); the game packs them into one small map. The cave tour in the game is an invented, much shorter passage built to show the kinds of formations the park describes; in real life visitors explore the cave on ranger-guided tours. This map is not a survey: real distances, trails and layouts differ. The elevation numbers are commonly published figures and were not checked against an NPS page. This is the first park to use the new ground and grass look.',
    wildlifeGuidance: {
      text:
        'Wind Cave requires visitors to stay at least 25 yards (23 meters) from all wildlife, and strongly recommends staying farther away from bison.',
      caveat:
        'The game uses 46 m for bison because the park strongly recommends staying farther away from them. Always check the park\'s current page and signs.',
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
        text: 'Several hundred bison and many other animals call Wind Cave home, including elk, pronghorn and prairie dogs. The park is one of the smallest, at over 33,000 acres.',
        sourceUrl: 'https://www.nps.gov/thingstodo/view-wildlife-wica.htm',
        sourceLabel: 'nps.gov: Watch Wind Cave Wildlife',
      },
      {
        id: 'natural-entrance',
        title: 'A hole that breathes',
        text: 'Despite its length and complexity, Wind Cave has very few natural entrances. The largest and best known is only about ten inches wide. Wind blows into the cave when the air pressure outside rises and out when it falls, and some days you can hear it.',
        sourceUrl: 'https://www.nps.gov/thingstodo/wind-cave-natural-entrance.htm',
        sourceLabel: 'nps.gov: Visit Wind Cave\'s Natural Entrance',
      },
      {
        id: 'boxwork',
        title: 'Boxwork: the cave\'s signature',
        text: 'Boxwork, thin honeycomb-shaped blades of calcite that stick out from the walls and ceilings, is what Wind Cave is most famous for. Boxwork exists in small amounts in other caves, but perhaps nowhere else is it so well formed and so abundant.',
        sourceUrl: 'https://www.nps.gov/wica/learn/nature/cave-formations-speleothems.htm',
        sourceLabel: 'nps.gov: Cave Formations (Speleothems)',
      },
      {
        id: 'frostwork-popcorn',
        title: 'Frostwork and popcorn',
        text: 'Frostwork is made of delicate needle-like growths of calcite or aragonite, and cave popcorn is made of small, rounded growths. Both can be seen along the cave tours, sometimes on top of boxwork.',
        sourceUrl: 'https://www.nps.gov/wica/learn/nature/cave-formations-speleothems.htm',
        sourceLabel: 'nps.gov: Cave Formations (Speleothems)',
      },
      {
        id: 'prairie-dog-towns',
        title: 'Prairie dog towns',
        text: 'Most of the park\'s prairie dog towns are along park roads, especially Highway 385. Bison and pronghorn like to graze among the prairie dogs because the grass there is more tender, and bison wallow in the bare dirt at burrow entrances.',
        sourceUrl: 'https://www.nps.gov/thingstodo/view-wildlife-wica.htm',
        sourceLabel: 'nps.gov: Watch Wind Cave Wildlife',
      },
    ],
    checkedOn: '2026-11-01',
  },
  waterStations: TRAILHEAD_AND_SUMMIT_WATER({ x: -60, z: 34 }, { x: 30, z: -30 }),
};

/**
 * Task 25: Badlands National Park (South Dakota). Laid out from the NPS pages for the Door, Window, Notch and Castle
 * trails and the NPS park map description (the Badlands Loop Road runs along the north side of the Badlands Wall).
 * Game-scale, not a survey: see about.designNote.
 */
export const BADLANDS: ParkDefinition = {
  id: 'badlands',
  npsParkCode: 'badl',
  layoutSeed: 47,
  name: 'Badlands',
  subtitle: 'Walls of Layered Stone',
  parkServiceUnit: 'National Park',
  state: 'South Dakota',
  region: 'Great Plains',
  description: 'In South Dakota, a long wall of banded, gullied rock rises out of mixed-grass prairie. Walk through the Door, look out from the Window, and climb the log ladder on the Notch Trail to a view over the White River Valley.',
  elevationRange: { min: 745, max: 1000 },
  spawn: { x: -6.0, y: 0.4, z: -68.0, yaw: Math.PI }, // in the Door and Window parking area, facing the Wall
  terrain: {
    baseScale: 0.004,
    heightScale: 2.6, // the prairie only rolls gently
    noiseX: -35,
    noiseZ: 60,
    // The Notch viewpoint sits on a butte (the "mountain" here): the flat deck is at this height above the parking area
    mountain: {
      x: -50.0,
      z: 18.0,
      height: 8.0,
      radius: 30.0,
      plateauRadius: 6.0,
      name: 'The Notch',
    },
    badlands: {
      wall: [
        { x: -240, z: -14 }, { x: -170, z: -24 }, { x: -100, z: -16 }, { x: -40, z: -20 },
        { x: 30, z: -14 }, { x: 100, z: -24 }, { x: 170, z: -12 }, { x: 240, z: -20 },
      ],
      crestHeight: 16.0,
      faceWidth: 24.0,
      topWidth: 10.0,
      backWidth: 90.0,
      basinDrop: 30.0,
      gaps: [
        { x: -8, depth: 0.88, width: 8 },   // the Door
        { x: 35, depth: 0.66, width: 10 },  // the Window
        { x: -60, depth: 0.6, width: 13 },  // the Notch Trail canyon
      ],
      ruggedness: 0.9,
      terraceStep: 2.2,
      bankSlope: 0.95,
      strata: {
        colors: [0xd8c8a2, 0xb99a6e, 0xc9a08a, 0xcfc6b0, 0xc9a65a, 0xa68a72, 0xe0d9c6, 0xb27a62, 0xd2b455],
        bandHeight: 1.5,
        strength: 0.95,
      },
    },
    // the prairie: dry mixed-grass tones with bare soil showing through
    groundLook: {
      patchScale: 0.016,
      strength: 0.85,
      patches: [0x8d9a52, 0xa4a95a, 0xc2b266, 0xd0bd78, 0xa99560, 0x929a68],
      speckle: 0.22,
      soil: { color: 0xb09a6c, amount: 0.4 },
      mulch: 0.05,
    },
    colors: {
      valley: 0x8d9a56,
      meadow: 0xa5aa5a,
      dryGrass: 0xcdb96d,
      steepSlope: 0xb59a76,
      summitRock: 0xc9b08c,
      riverbed: 0xb8a583,
      riverbank: 0xa89874,
    },
  },
  water: {
    // The NPS pages for these trails mention no stream, so this map has none.
    hasRiver: false,
    mode: 'none',
    name: 'No stream here',
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
    name: 'Door, Window, Notch and Castle Trails',
    width: 2.0,
    surface: { center: 0xc4b392, mid: 0xad9d7c, edge: 0x9a9a62 }, // pale, dusty path
    paths: [
      {
        // NPS: an accessible boardwalk leads through a break in the Badlands Wall ("the Door") to a view; the maintained trail ends there
        id: 'door-trail',
        name: 'Door Trail',
        boardwalk: true,
        width: 2.2,
        steps: 70,
        surface: { center: 0x8a7658, mid: 0x7a6849, edge: 0x6c5b42 },
        nodes: [
          { x: -4, z: -58, y: 0.4 },
          { x: -3, z: -48, y: 0.4 },
          { x: -5, z: -39, y: 0.4 },
          { x: -7, z: -31, y: 1.0 },
          { x: -8, z: -23, y: 2.0 },
          { x: -8, z: -16, y: 2.4 },
          { x: -7, z: -9, y: 2.4 },
        ],
      },
      {
        // NPS: a short boardwalk to a natural window in the Badlands Wall, with a view of an eroded canyon
        id: 'window-trail',
        name: 'Window Trail',
        boardwalk: true,
        width: 2.2,
        steps: 70,
        surface: { center: 0x8a7658, mid: 0x7a6849, edge: 0x6c5b42 },
        nodes: [
          { x: 0, z: -58, y: 0.4 },
          { x: 9, z: -53, y: 0.4 },
          { x: 18, z: -47, y: 0.4 },
          { x: 26, z: -39, y: 1.0 },
          { x: 32, z: -30, y: 2.4 },
          { x: 35, z: -22, y: 3.5 },
          { x: 36, z: -16, y: 3.6 },
        ],
      },
      {
        // NPS: begins at the south end of the Door and Window parking area, meanders through a canyon, climbs a log ladder,
        // then follows a ledge to "the Notch" for a view of the White River Valley
        id: 'notch-trail',
        name: 'Notch Trail',
        steps: 24,
        width: 1.8,
        nodes: [
          { x: -8, z: -58, y: 0.4 },
          { x: -20, z: -55, y: 0.4 },
          { x: -33, z: -51, y: 0.4 },
          { x: -44, z: -46, y: 0.4 },
          { x: -52, z: -40, y: 1.2 },  // the mouth of the canyon
          { x: -58, z: -33, y: 2.2 },
          { x: -56, z: -26, y: 3.2 },
          { x: -60, z: -20, y: 4.2 },
          { x: -63, z: -14, y: 5.0 },  // foot of the log ladder
          { x: -63, z: -8.6, y: 8.6 }, // top of the log ladder
          { x: -60, z: -3, y: 8.6 },   // the ledge
          { x: -56, z: 3, y: 8.6 },
          { x: -53, z: 10, y: 8.2 },
          { x: -50, z: 18, y: 8.0 },   // the Notch viewpoint
        ],
      },
      {
        // NPS: the longest trail starts at the same parking area and runs five miles one way to the Fossil Exhibit Trail;
        // only its first stretch fits on this map
        id: 'castle-trail',
        name: 'Castle Trail',
        steps: 20,
        nodes: [
          { x: 4, z: -60, y: 0.4 },
          { x: 22, z: -64, y: 0.4 },
          { x: 48, z: -62, y: 0.4 },
          { x: 76, z: -58, y: 0.4 },
          { x: 104, z: -58, y: 0.4 },
          { x: 132, z: -54, y: 0.4 },
          { x: 158, z: -52, y: 0.4 },
          { x: 184, z: -50, y: 0.4 },
        ],
      },
    ],
  },
  overlook: {
    name: 'The Notch',
    elevationLabel: 'The end of the Notch Trail',
    deckRadius: 4.2,
    hasBench: false,
    hasTelescope: false,
    signHeading: 'THE NOTCH',
    signSubheading: 'WHITE RIVER VALLEY VIEW',
  },
  vegetation: {
    treeCount: 70,
    shrubCount: 900,
    speciesWeights: {
      conifer: 4.0, // junipers
      pine: 0.6,
      broadleaf: 0.1,
      oak: 0.0,
      birch: 0.0,
      poplar: 0.0,
      snag: 0.3,
    },
    look: {
      treeScale: 0.85,
      glades: 0.9,
      palettes: {
        conifer: [0x5f7a5a, 0x6c8466, 0x587258],
        pine: [0x4f7048, 0x5d7e52],
      },
      groundCover: {
        clumps: 260,
        flowerPatches: 70,
        clumpPalette: [0x9aa37c, 0x88976c, 0xa9ae8a, 0x7d8f5f, 0xb4a778],
        flowerPalette: [0xe8c83a, 0xf0efe0, 0xb48ad0],
      },
      shrubPalette: [0x929d68, 0x808f5c, 0xa4a470, 0x77885a],
      grass: { root: 0x56662f, stalk: 0x9aab55, dry: 0xd6c47e, fern: 0x7b9340, flowerA: 0xe8c83a, flowerB: 0xf0efe0 },
      grassland: {
        density: 1.5,
        radius: 50,
        heightRange: [0.5, 1.6],
        patchScale: 0.03,
        tints: [0xc4d890, 0xfff0c0, 0xe6d8a4],
        sway: 0.9,
        carpet: { count: 2400, radius: 20, height: 0.26, root: 0x56662f, tip: 0x9aab55, tipDry: 0xd0bd72 },
      },
    },
  },
  atmosphere: {
    fogColor: 0xe6ddc8,
    fogDensity: 0.0036, // dry, clear air
    hemiSky: 0xdbe6f0,
    hemiGround: 0xb09a72,
    sunColor: 0xfff0d0,
    sunIntensity: 3.2,
    skyHorizon: 0xece4d0,
    skyMid: 0x8dbbe2,
    skyZenith: 0x3478c4,
    skySun: 0xffe6b0,
  },
  landmarks: [
    {
      id: 'spawn',
      name: 'Door and Window Parking Area',
      shortName: 'Parking Area',
      description: 'One parking area serves the Door, Window, Notch and Castle trails. The Notch Trail starts at its south end.',
      x: -6, y: 0.5, z: -68, yaw: Math.PI,
    },
    {
      id: 'the-door',
      name: 'The Door',
      shortName: 'Door',
      description: 'A boardwalk leads through a break in the Badlands Wall known as "the Door", to a view of the Badlands. Past the end of the boardwalk, travel is at your own risk. Watch for drop-offs.',
      x: -8, y: 2.4, z: -14, yaw: Math.PI,
    },
    {
      id: 'the-window',
      name: 'The Window',
      shortName: 'Window',
      description: 'A short boardwalk leads to a natural window in the Badlands Wall, with a railed viewpoint and a view of an intricately eroded canyon. Please stay on the trail.',
      x: 36, y: 3.6, z: -16, yaw: Math.PI,
    },
    {
      id: 'notch-canyon',
      name: 'Notch Trail Canyon',
      shortName: 'Canyon',
      description: 'The Notch Trail meanders up a narrow canyon between banded walls of rock.',
      x: -57, y: 2.7, z: -30, yaw: Math.PI,
    },
    {
      id: 'log-ladder',
      name: 'The Log Ladder',
      shortName: 'Ladder',
      description: 'The trail climbs a log ladder out of the canyon. The Notch Trail is not recommended for anyone with a fear of heights, and it is treacherous during or after heavy rain or snow.',
      x: -63, y: 5.0, z: -15.5, yaw: Math.PI,
    },
    {
      id: 'summit',
      name: 'The Notch',
      shortName: 'Notch',
      description: 'After the ledge, the trail ends at "the Notch", a dramatic view of the White River Valley. Watch for drop-offs.',
      x: -50, y: 8.0, z: 16, yaw: Math.PI,
    },
    {
      id: 'castle-trail',
      name: 'Castle Trail',
      shortName: 'Castle',
      description: 'The longest trail in the park starts at this parking area and runs five miles one way to the Fossil Exhibit Trail. Only its first stretch is on this map.',
      x: 120, y: 0.4, z: -56, yaw: Math.PI * 0.5,
    },
    {
      id: 'prairie-dogs',
      name: 'Prairie Dog Town',
      shortName: 'Prairie Dogs',
      description: 'A small prairie dog town on the mixed-grass prairie. Keep your distance, and never feed them.',
      x: -112, y: 1.0, z: -70, yaw: Math.PI * 1.5,
    },
    {
      id: 'bison-prairie',
      name: 'Bison on the Prairie',
      shortName: 'Bison',
      description: 'Open mixed-grass prairie north of the Loop Road, where bison graze. Stay far back.',
      x: 96, y: 0.8, z: -122, yaw: Math.PI * 0.5,
    },
  ],
  wildlife: {
    spawns: [
      // bison herd on the prairie north of the road (the real herd is much larger)
      { species: 'bison', isBuck: true, isFawn: false, x: 150.0, z: -170.0, roamRadius: 10.0 },
      { species: 'bison', isBuck: false, isFawn: false, x: 158.0, z: -162.0, roamRadius: 10.0 },
      { species: 'bison', isBuck: false, isFawn: false, x: 144.0, z: -160.0, roamRadius: 9.0 },
      { species: 'bison', isBuck: false, isFawn: false, x: 164.0, z: -176.0, roamRadius: 9.0 },
      { species: 'bison', isBuck: true, isFawn: false, x: 136.0, z: -176.0, roamRadius: 9.0 },
      // bighorn sheep. NPS: they come down to the grasslands to feed, then retreat to the cliffs. Ewes and rams live in separate groups.
      // Grazing on the prairie below the Wall, in view of the parking area and the trails (all at least 33 m from any trail):
      { species: 'bighorn-sheep', isBuck: false, isFawn: false, x: 72.0, z: -96.0, roamRadius: 5.0 },
      { species: 'bighorn-sheep', isBuck: false, isFawn: false, x: 78.0, z: -99.0, roamRadius: 5.0 },
      { species: 'bighorn-sheep', isBuck: false, isFawn: false, x: 66.0, z: -98.0, roamRadius: 5.0 },
      { species: 'bighorn-sheep', isBuck: true, isFawn: false, x: -46.0, z: -92.0, roamRadius: 5.0 },
      { species: 'bighorn-sheep', isBuck: true, isFawn: false, x: -40.0, z: -98.0, roamRadius: 5.0 },
      // and two that have already retreated to high benches on top of the Wall (you have to look for these)
      { species: 'bighorn-sheep', isBuck: false, isFawn: false, x: 72.0, z: -12.0, roamRadius: 5.0 },
      { species: 'bighorn-sheep', isBuck: true, isFawn: false, x: 126.0, z: -6.0, roamRadius: 5.0 },
      // pronghorn on the open grassland north of the Loop Road (NPS: that is where they are most often seen)
      { species: 'pronghorn', isBuck: true, isFawn: false, x: 30.0, z: -152.0, roamRadius: 9.0 },
      { species: 'pronghorn', isBuck: false, isFawn: false, x: 38.0, z: -146.0, roamRadius: 9.0 },
      { species: 'pronghorn', isBuck: false, isFawn: false, x: 22.0, z: -158.0, roamRadius: 9.0 },
      { species: 'pronghorn', isBuck: false, isFawn: false, x: 42.0, z: -160.0, roamRadius: 9.0 },
      // deer out on the prairie to the east
      { species: 'white-tailed-deer', isBuck: false, isFawn: false, x: 200.0, z: -90.0, roamRadius: 14.0 },
      { species: 'white-tailed-deer', isBuck: true, isFawn: false, x: 210.0, z: -82.0, roamRadius: 14.0 },
    ],
    // Badlands asks visitors to keep at least 100 feet (30.5 m) from ALL wildlife
    safeDistanceOverrides: { 'white-tailed-deer': 30.5, bison: 30.5, 'prairie-dog': 30.5, 'bighorn-sheep': 30.5, pronghorn: 30.5 },
  },
  features: {
    roads: [
      {
        // The Badlands Loop Road (SR 240) runs along the north side of the Wall
        id: 'loop-road',
        name: 'Badlands Loop Road (SR 240)',
        kind: 'road',
        width: 7.5,
        nodes: [
          { x: -260, z: -100 },
          { x: -130, z: -108 },
          { x: -6, z: -106 },
          { x: 120, z: -110 },
          { x: 260, z: -100 },
        ],
      },
      {
        id: 'parking-drive',
        name: 'Parking Area Entrance',
        kind: 'drive',
        levelFrom: 'loop-road',
        width: 6.0,
        nodes: [
          { x: -6, z: -106 },
          { x: -6, z: -96 },
          { x: -6, z: -88 },
        ],
      },
      {
        id: 'door-window-lot',
        name: 'Door and Window Parking Area',
        kind: 'lot',
        levelFrom: 'loop-road',
        width: 13.0,
        nodes: [
          { x: -6, z: -86 },
          { x: -6, z: -61 },
        ],
      },
    ],
    cars: [
      { x: -9.0, z: -80.0, yaw: Math.PI / 2, color: 0x2f4a6b },
      { x: -3.0, z: -74.0, yaw: -Math.PI / 2, color: 0xd9d6cc },
      { x: -10.0, z: -66.0, yaw: Math.PI / 2, color: 0x9a2a2a },
    ],
    logLadder: [{ x: -63, z: -14, yaw: 0, run: 5.4 }],
    // NPS: the Window Trail leads to a natural window in the Badlands Wall. The ground cannot have a hole, so the window is a rock frame you walk through.
    rockWindows: [{ x: 35.2, z: -22, yaw: 0.16, opening: 4.2, height: 3.4 }],
    // NPS: the Window Trail is a full boardwalk leading out to a viewpoint with railings
    railings: [{ path: 'window-trail', length: 7, endCap: true }],
    // hoodoo-like spires standing on the rugged slopes behind the Wall
    pinnacles: [
      { x: 60, z: 42, radius: 55, innerRadius: 8, count: 16, minHeight: 2.5, maxHeight: 7, colors: [0xd0bd98, 0xc2a584, 0xd9ccb0, 0xb99a7c] },
      { x: -105, z: 36, radius: 55, innerRadius: 8, count: 14, minHeight: 2.5, maxHeight: 6.5, colors: [0xd0bd98, 0xc2a584, 0xd9ccb0, 0xb99a7c] },
      { x: 0, z: 85, radius: 70, innerRadius: 6, count: 18, minHeight: 3, maxHeight: 8, colors: [0xd0bd98, 0xbf9f86, 0xd9ccb0, 0xb99a7c] },
    ],
    prairieDogTown: { x: -118, z: -72, radius: 10, mounds: 14, dogs: 8 },
    distantRidges: true,
  },
  rules: {
    zones: [
      {
        id: 'fossil-slope',
        kind: 'sensitive',
        name: 'Fossil-bearing Slope',
        x: 62,
        z: -42,
        radius: 8,
        reason: 'Fossils, plants, animals, artifacts and rocks must stay as you find them. Collecting them is illegal. (In the game this is an example area. Badlands is an open-hike park, so walking off trail is allowed, at your own risk.)',
      },
    ],
    litter: STANDARD_LITTER.map(l => ({
      ...l,
      trail: ({ 'can-1': 'castle-trail', 'bottle-1': 'door-trail', 'wrapper-1': 'window-trail', 'peel-1': 'notch-trail', 'bag-1': 'castle-trail' } as Record<string, string>)[l.id] ?? 'castle-trail',
    })),
  },
  about: {
    designNote:
      'A game-scale map of the Door and Window parking area and the trails that start from it. It follows what the NPS pages say: the Door and Window trails are short boardwalks through and into the Badlands Wall; the Notch Trail starts at the south end of the same parking area, meanders through a canyon, climbs a log ladder and follows a ledge to the Notch; the Castle Trail also starts there and runs five miles one way (only its first stretch fits here); the Badlands Loop Road runs along the north side of the Wall. Distances, heights and the exact positions of the trails and the Wall are game placements, not a survey. The Window is built as a rock frame (two rock jambs and a lintel) that you walk through, because the game\'s ground cannot hold a hole; its size and exact spot are game choices. The railings follow the NPS note that the Window boardwalk ends at a viewpoint with railings. The bison herd, prairie dog town and deer are real kinds of Badlands wildlife, but they are packed close to the trails here (in reality, for example, the best-known prairie dog town is far to the west along Sage Creek Rim Road). Bighorn sheep, bison, deer and prairie dogs are modelled (ewes and rams in separate groups, as the NPS describes; most graze on the prairie below the Wall, and a couple wait on the cliffs). Pronghorn are modelled too (shy and fast, on the grassland north of the Loop Road, where the NPS says they live). Black-footed ferrets are a real Badlands animal but are not modelled yet. This map has no drinking water, because the NPS lists none for this trailhead. The Badlands Wall, the overlooks along the Loop Road and the Cedar Pass area are only partly shown. The elevation range is taken from the NPS map description (Ben Reifel Visitor Center 745 m; Sheep Mountain Table about 1,000 m) and is not the height of anything you can reach in the game.',
    wildlifeGuidance: {
      text:
        'Badlands asks visitors to keep a distance of at least 100 feet from all wildlife. If wildlife reacts to your presence at all, you are too close.',
      caveat:
        'The game uses 30.5 m (100 ft) for every animal in this park. Always check the park\'s current page and signs.',
      sourceUrl: 'https://www.nps.gov/thingstodo/hiking-badl.htm',
      sourceLabel: 'nps.gov: Hiking the Badlands',
    },
    facts: [
      {
        id: 'open-hike',
        title: 'An open-hike park',
        text: 'Badlands has an Open Hike Policy: visitors may hike off trail. The rock formations are often easier to climb up than down, and cell service is not readily available in the backcountry.',
        sourceUrl: 'https://www.nps.gov/thingstodo/hiking-badl.htm',
        sourceLabel: 'nps.gov: Hiking the Badlands',
      },
      {
        id: 'water',
        title: 'Carry water',
        text: 'The park recommends two quarts of water per person for every two hours of hiking, plus a hat, sunglasses, sunscreen and sturdy shoes to protect your feet from cactus spines and snake bites.',
        sourceUrl: 'https://www.nps.gov/thingstodo/hiking-badl.htm',
        sourceLabel: 'nps.gov: Hiking the Badlands',
      },
      {
        id: 'door-window',
        title: 'The Door and the Window',
        text: 'The Door Trail is an accessible boardwalk through a break in the Badlands Wall; past its end, the maintained trail stops and travel is at your own risk. The Window Trail is a short boardwalk to a natural window in the Wall with a view of an intricately eroded canyon, ending at a viewpoint with railings.',
        sourceUrl: 'https://www.nps.gov/thingstodo/hiking-badl.htm',
        sourceLabel: 'nps.gov: Hiking the Badlands',
      },
      {
        id: 'notch',
        title: 'The Notch Trail',
        text: 'The Notch Trail is the park\'s most popular trail, and it sees the most injuries. It climbs a log ladder and follows a ledge to the Notch, and is treacherous during or after heavy rain or snow.',
        sourceUrl: 'https://www.nps.gov/places/notch-trail.htm',
        sourceLabel: 'nps.gov: Notch Trailhead',
      },
      {
        id: 'castle',
        title: 'The Castle Trail',
        text: 'The longest trail in the park begins at the Door and Window parking area and travels five miles one way to the Fossil Exhibit Trail. It is relatively level and passes along some badlands formations.',
        sourceUrl: 'https://www.nps.gov/thingstodo/hiking-badl.htm',
        sourceLabel: 'nps.gov: Hiking the Badlands',
      },
      {
        id: 'leave-it',
        title: 'Leave it as you find it',
        text: 'All park resources (fossils, plants, animals, artifacts and rocks) are to remain as you find them. Collecting them is illegal, so every visitor gets the same sense of discovery.',
        sourceUrl: 'https://www.nps.gov/thingstodo/hiking-badl.htm',
        sourceLabel: 'nps.gov: Hiking the Badlands',
      },
      {
        id: 'loop-road',
        title: 'The Loop Road',
        text: 'Badlands Loop Road enters at the Northeast Entrance, passes Big Badlands Overlook and reaches the Ben Reifel Visitor Center (elevation 2,443 feet, 745 meters). West of there it passes a string of overlooks, from White River Valley Overlook to Pinnacles Overlook.',
        sourceUrl: 'https://www.nps.gov/npgallery/GetAsset/0dcec1e820334c6c902e0598aa07e7e7/alttext.txt',
        sourceLabel: 'nps.gov: Badlands park map description',
      },
      {
        id: 'prairie-and-wildlife',
        title: 'Prairie and its animals',
        text: 'The park\'s 244,000 acres protect an expanse of mixed-grass prairie where bison, bighorn sheep, prairie dogs and black-footed ferrets live today.',
        sourceUrl: 'https://home.nps.gov/badl',
        sourceLabel: 'nps.gov: Badlands National Park',
      },
      {
        id: 'bighorn',
        title: 'Cliff-climbing sheep',
        text: 'Bighorn sheep drop down to grasslands to eat quickly, then retreat to cliffs away from predators. Badlands received its herd in 1964, when twenty-two bighorn were moved from Pike\'s Peak, Colorado; the park now has about 250.',
        sourceUrl: 'https://www.nps.gov/articles/000/bighorn-sheep-badl.htm',
        sourceLabel: 'nps.gov: Bighorn Sheep in the Badlands',
      },
      {
        id: 'pronghorn',
        title: 'Fastest on the prairie',
        text: 'Pronghorn, sometimes called "pronghorn antelope", are not true antelope. They can run about 55 miles per hour, and in Badlands they are most often seen in unbroken grassland, north of the Loop Road in the North Unit.',
        sourceUrl: 'https://www.nps.gov/articles/000/pronghorn.htm',
        sourceLabel: 'nps.gov: Pronghorn (Badlands)',
      },
      {
        id: 'prairie-dogs',
        title: 'A keystone species',
        text: 'Prairie dogs are a keystone species, meaning many plants and animals depend on them. They are also food for the endangered black-footed ferret. Park biologists try to prevent plague outbreaks by feeding prairie dogs an oral vaccine, and after testing flavors they found the prairie dogs like peanut butter best.',
        sourceUrl: 'https://home.nps.gov/articles/prairie-dogs.htm',
        sourceLabel: 'nps.gov: Prairie Dogs: Pipsqueaks of the Prairie',
      },
    ],
    checkedOn: '2026-11-15',
  },
  // No drinking water is listed at this trailhead on the NPS pages, so the map has none (carry your own, as the park advises)
  waterStations: [],
};

/**
 * Task 26: Theodore Roosevelt National Park, South Unit (North Dakota): the Wind Canyon area. Laid out from the NPS pages for the
 * Wind Canyon Trail (a short loop along wind-eroded cliffs above the Little Missouri River that climbs to a lookout; the trailhead is on
 * the west side of East River Road), the NPS South Unit map and the NPS wildlife and hiking pages. Game-scale, not a survey: see about.designNote.
 */
export const THEODORE_ROOSEVELT: ParkDefinition = {
  id: 'theodore-roosevelt',
  npsParkCode: 'thro',
  layoutSeed: 53,
  name: 'Theodore Roosevelt',
  subtitle: 'Roosevelt\'s Badlands',
  parkServiceUnit: 'National Park',
  state: 'North Dakota',
  region: 'Great Plains',
  description: 'In the North Dakota badlands, where a future president found his conservation spirit, a short trail follows a wind-carved canyon up to a lookout high above the Little Missouri River. Feral horses, bison and prairie dogs share the grassland beside the road.',
  elevationRange: { min: 819, max: 870 },
  spawn: { x: 64.0, y: 0.4, z: -30.0, yaw: Math.PI / 2 }, // in the trailhead parking lot, facing west toward the canyon
  terrain: {
    baseScale: 0.004,
    heightScale: 2.2,
    noiseX: 20,
    noiseZ: -40,
    // the Wind Canyon lookout sits on a knob of the rim (the "mountain" here): the deck is this high above the parking lot
    mountain: {
      x: -9.0,
      z: -11.0,
      height: 8.1,
      radius: 30.0,
      plateauRadius: 6.0,
      name: 'Wind Canyon Overlook',
    },
    badlands: {
      facing: 'west', // the prairie and the road are in the east; the badlands fall away to the river in the west
      wall: [
        { x: -240, z: -6 }, { x: -120, z: -14 }, { x: 0, z: -10 }, { x: 120, z: -4 }, { x: 240, z: -12 },
      ],
      crestHeight: 9.0,
      faceWidth: 26.0,
      topWidth: 8.0,
      backWidth: 85.0,
      basinDrop: 27.0,
      gaps: [
        { x: -21, depth: 0.55, width: 7 }, // Wind Canyon itself
      ],
      ruggedness: 0.75,
      terraceStep: 1.8,
      bankSlope: 0.9,
      bare: false, // junipers, shrubs and grass grow on the slopes and benches
      flatGrass: 0.5,
      strata: {
        // NPS: bentonite, a fine blue-gray clay, defines the badlands; dark bands are lignite coal seams; scoria is the red baked clay
        colors: [0xa7b0ac, 0xc9b690, 0xb59a76, 0x514841, 0xc7a98a, 0x9c5a3c, 0xd6c8a8],
        bandHeight: 1.3,
        strength: 0.8,
      },
    },
    groundLook: {
      patchScale: 0.016,
      strength: 0.85,
      patches: [0x7f9a4e, 0x9aa95a, 0xb7b366, 0xc8bb72, 0x9c9a62, 0x869a60],
      speckle: 0.2,
      soil: { color: 0xa89466, amount: 0.3 },
      mulch: 0.06,
    },
    colors: {
      valley: 0x84985a,
      meadow: 0x9eaa5c,
      dryGrass: 0xc7b76c,
      steepSlope: 0xa89a7c,
      summitRock: 0xb9aa8c,
      riverbed: 0x9a9078,
      riverbank: 0x8a8a62,
    },
  },
  water: {
    hasRiver: true,
    mode: 'river',
    name: 'Little Missouri River',
    noCrossing: true, // the trail ends at the lookout far above the river; nothing crosses it
    refZ: 0,
    surfaceY: -27.5,
    halfWidth: 6.5,
    bankWidth: 6.0,
    valleyWidth: 48.0,
    gradient: 0.0006,
    course: { baseX: -118.0, amp1: 7.0, freq1: 0.012, amp2: 2.5, freq2: 0.037 },
    deepColor: 0x4a5148,   // a muddy prairie river
    shallowColor: 0x7d7f68,
    skyReflectColor: 0xb4c4cc,
  },
  trail: {
    name: 'Wind Canyon Trail',
    width: 1.8,
    surface: { center: 0xbfae8c, mid: 0xa8997a, edge: 0x8e9460 }, // gravel and dirt
    paths: [
      {
        // NPS: a short loop that travels along wind-eroded cliffs above the Little Missouri River before climbing to a lookout (0.4 mile loop, gravel and dirt, with stairs)
        id: 'wind-canyon-loop',
        name: 'Wind Canyon Trail',
        closed: true,
        steps: 22,
        nodes: [
          { x: 58, z: -32, y: 0.4 },
          { x: 46, z: -34, y: 0.4 },
          { x: 34, z: -36, y: 0.6 },
          { x: 24, z: -36, y: 2.4 },
          { x: 15, z: -35, y: 5.0 },
          { x: 6, z: -32, y: 7.0 },
          { x: -4, z: -26, y: 7.9 },
          { x: -10, z: -17, y: 8.1 },
          { x: -6, z: -6, y: 7.9 },
          { x: 4, z: -5, y: 7.2 },
          { x: 14, z: -6, y: 5.2 },
          { x: 24, z: -10, y: 3.0 },
          { x: 34, z: -16, y: 1.2 },
          { x: 46, z: -24, y: 0.5 },
        ],
      },
      {
        // the short walk out to the lookout deck
        id: 'lookout-spur',
        name: 'Lookout Spur',
        steps: 12,
        nodes: [
          { x: -10, z: -17, y: 8.1 },
          { x: -9.5, z: -14, y: 8.1 },
          { x: -9, z: -11, y: 8.1 },
        ],
      },
    ],
  },
  overlook: {
    name: 'Wind Canyon Overlook',
    elevationLabel: 'High above the Little Missouri River',
    deckRadius: 4.0,
    hasBench: false,
    hasTelescope: false,
    signHeading: 'WIND CANYON',
    signSubheading: 'LITTLE MISSOURI RIVER VIEW',
  },
  vegetation: {
    treeCount: 170,
    shrubCount: 700,
    speciesWeights: {
      poplar: 3.0,   // cottonwoods
      conifer: 2.0,  // junipers
      broadleaf: 1.0,
      pine: 0.0,
      oak: 0.0,
      birch: 0.0,
      snag: 0.4,
    },
    look: {
      treeScale: 0.9,
      glades: 0.7,
      // cottonwood bottoms along the Little Missouri River
      groves: [
        { x: -118, z: -150, radius: 28 },
        { x: -118, z: -60, radius: 28 },
        { x: -118, z: 30, radius: 28 },
        { x: -118, z: 120, radius: 28 },
      ],
      palettes: {
        conifer: [0x5f7a5a, 0x6c8466, 0x587258],
        poplar: [0x7a9a44, 0x8aa84c, 0x6f9040, 0xb0b84a],
      },
      groundCover: {
        clumps: 240,
        flowerPatches: 70,
        clumpPalette: [0x8fa070, 0x7f9464, 0xa5ad84, 0x76895a, 0xb0a574],
        flowerPalette: [0xe8c83a, 0xf0efe0, 0x8a8ad0],
      },
      shrubPalette: [0x8a9a64, 0x7a8c58, 0x9ca46c, 0x728454],
      grass: { root: 0x566a30, stalk: 0x9aae56, dry: 0xd2c27c, fern: 0x7b9340, flowerA: 0xe8c83a, flowerB: 0xf0efe0 },
      grassland: {
        density: 1.5,
        radius: 50,
        heightRange: [0.5, 1.6],
        patchScale: 0.03,
        tints: [0xc4d890, 0xfff0c0, 0xe6d8a4],
        sway: 0.9,
        carpet: { count: 2400, radius: 20, height: 0.26, root: 0x566a30, tip: 0x9aae56, tipDry: 0xcfbf72 },
      },
    },
  },
  atmosphere: {
    fogColor: 0xe4dcc8,
    fogDensity: 0.0036,
    hemiSky: 0xdbe6f0,
    hemiGround: 0xa89a72,
    sunColor: 0xffecc8,
    sunIntensity: 3.1,
    skyHorizon: 0xece4d0,
    skyMid: 0x8dbbe2,
    skyZenith: 0x3478c4,
    skySun: 0xffe2a8,
  },
  landmarks: [
    {
      id: 'spawn',
      name: 'Wind Canyon Trailhead',
      shortName: 'Trailhead',
      description: 'The trailhead is on the west side of East River Road, in the South Unit. The parking lot has spaces for cars and RVs, including accessible spaces.',
      x: 64, y: 0.4, z: -30, yaw: Math.PI / 2,
    },
    {
      id: 'wind-canyon',
      name: 'Wind Canyon',
      shortName: 'Canyon',
      description: 'The trail follows wind-eroded cliffs beside a narrow canyon. The canyon channels the wind, which rushes through before escaping across the Little Missouri River.',
      x: 15, y: 5.0, z: -35, yaw: Math.PI * 0.5,
    },
    {
      id: 'summit',
      name: 'Wind Canyon Overlook',
      shortName: 'Overlook',
      description: 'The trail climbs to a lookout with the best view of the Little Missouri River in the South Unit. Rangers call it a favorite for sunsets.',
      x: -9, y: 8.1, z: -11, yaw: Math.PI * 1.5,
    },
    {
      id: 'little-missouri',
      name: 'Little Missouri River',
      shortName: 'River',
      description: 'The river that carved these badlands, below the lookout, with cottonwood groves along its banks.',
      x: -112, y: -26.9, z: -12, yaw: Math.PI * 0.5,
    },
    {
      id: 'prairie-dogs',
      name: 'Prairie Dog Town',
      shortName: 'Prairie Dogs',
      description: 'The park road passes through three large prairie dog towns in the South Unit. Prairie dogs may seem tame, but they are wild.',
      x: 112, y: 0.0, z: 20, yaw: Math.PI * 0.5,
    },
    {
      id: 'feral-horses',
      name: 'Feral Horses',
      shortName: 'Horses',
      description: 'Feral horses live in the South Unit only, and are often seen from the road. Watch from at least 25 yards (23 m).',
      x: 126, y: 0.0, z: -56, yaw: Math.PI * 0.5,
    },
    {
      id: 'bison-grassland',
      name: 'Bison on the Grassland',
      shortName: 'Bison',
      description: 'Open grassland east of the road, where bison graze. Bison may look tame, but they can be dangerous.',
      x: 140, y: 0.0, z: 62, yaw: Math.PI * 0.5,
    },
  ],
  wildlife: {
    spawns: [
      // feral horses (a stallion and mares), east of the road, in view of the parking lot
      { species: 'wild-horse', isBuck: true, isFawn: false, x: 130.0, z: -60.0, roamRadius: 10.0 },
      { species: 'wild-horse', isBuck: false, isFawn: false, x: 137.0, z: -54.0, roamRadius: 10.0 },
      { species: 'wild-horse', isBuck: false, isFawn: false, x: 123.0, z: -52.0, roamRadius: 10.0 },
      { species: 'wild-horse', isBuck: false, isFawn: false, x: 141.0, z: -67.0, roamRadius: 10.0 },
      // bison on the open grassland
      { species: 'bison', isBuck: true, isFawn: false, x: 150.0, z: 70.0, roamRadius: 10.0 },
      { species: 'bison', isBuck: false, isFawn: false, x: 158.0, z: 76.0, roamRadius: 10.0 },
      { species: 'bison', isBuck: false, isFawn: false, x: 144.0, z: 78.0, roamRadius: 9.0 },
      { species: 'bison', isBuck: false, isFawn: false, x: 164.0, z: 62.0, roamRadius: 9.0 },
      // deer in the cottonwood bottoms by the river
      { species: 'white-tailed-deer', isBuck: false, isFawn: false, x: -100.0, z: -70.0, roamRadius: 10.0 },
      { species: 'white-tailed-deer', isBuck: true, isFawn: false, x: -98.0, z: -62.0, roamRadius: 10.0 },
    ],
    // NPS: watch wildlife from a safe distance of 25 yards (23 m) or more
    safeDistanceOverrides: { 'white-tailed-deer': 23.0, bison: 23.0, 'prairie-dog': 23.0, 'wild-horse': 23.0 },
  },
  features: {
    roads: [
      {
        // East River Road (the Scenic Loop Drive) runs north-south; the trailhead is on its west side
        id: 'east-river-road',
        name: 'East River Road (Scenic Loop Drive)',
        kind: 'road',
        width: 7.5,
        nodes: [
          { x: 84, z: -270 },
          { x: 90, z: -140 },
          { x: 84, z: -30 },
          { x: 88, z: 100 },
          { x: 84, z: 270 },
        ],
      },
      {
        id: 'trailhead-drive',
        name: 'Trailhead Entrance',
        kind: 'drive',
        levelFrom: 'east-river-road',
        width: 6.0,
        nodes: [
          { x: 84, z: -29 },
          { x: 76, z: -29 },
          { x: 72, z: -29 },
        ],
      },
      {
        id: 'wind-canyon-lot',
        name: 'Wind Canyon Parking Lot',
        kind: 'lot',
        levelFrom: 'east-river-road',
        width: 12.0,
        nodes: [
          { x: 70, z: -40 },
          { x: 70, z: -20 },
        ],
      },
    ],
    cars: [
      { x: 67.0, z: -36.0, yaw: 0, color: 0x2f4a6b },
      { x: 67.0, z: -28.0, yaw: Math.PI, color: 0xd9d6cc },
      { x: 73.0, z: -22.0, yaw: 0, color: 0x9a2a2a },
    ],
    prairieDogTown: { x: 112, z: 20, radius: 10, mounds: 14, dogs: 8 },
    distantRidges: true,
  },
  rules: {
    zones: [
      {
        id: 'canyon-slope',
        kind: 'sensitive',
        name: 'Canyon Slope',
        x: 14,
        z: -21,
        radius: 6,
        reason: 'All plants, wildlife, and natural features are protected. Do not disturb or remove animal bones, rocks, flowers or anything else you discover while hiking. (In the game this is an example area.)',
      },
    ],
    litter: STANDARD_LITTER.map(l => ({ ...l, trail: 'wind-canyon-loop' })),
  },
  about: {
    designNote:
      'A game-scale map of the Wind Canyon Trail area in the South Unit. It follows the NPS pages: the trailhead is on the west side of East River Road (the Scenic Loop Drive); the short loop trail follows wind-eroded cliffs beside a canyon, climbs to a lookout, and returns; the Little Missouri River lies below. The trail is a closed loop about 145 game metres long (the real loop is 0.4 mile), and the stairs the NPS mentions are shown as a plain climbing path. Exact distances, heights and the positions of the canyon, the lookout and the river are game placements, not a survey. The feral horses, bison and prairie dog town are real South Unit animals but are packed close to the road here (the NPS says the park road passes through three large prairie dog towns). The cottonwood groves along the river are a game choice. The rest of the park (the Scenic Loop Drive, Buck Hill, Boicourt Overlook, the Coal Vein and Ridgeline trails, Painted Canyon, Medora and Roosevelt\'s Maltese Cross Cabin, and the separate North Unit and Elkhorn Ranch Unit) is not on this map. Elk, which the NPS says live in the South Unit near Buck Hill, are not shown. This map has no drinking water because none is listed for this trailhead. The elevation range comes from the two spot heights printed on the NPS South Unit map (2,687 ft / 819 m and 2,855 ft / 870 m) and is not the height of anything you can reach in the game.',
    wildlifeGuidance: {
      text: 'Theodore Roosevelt National Park asks you to watch wildlife from a safe distance of 25 yards (23 m) or more.',
      caveat: 'The game uses 23 m for every animal in this park. Bison, feral horses and prairie dogs may seem tame, but the park says they are wild and can be dangerous. Always check the park\'s current page and signs.',
      sourceUrl: 'https://www.nps.gov/thro/planyourvisit/hiking-and-trail-information.htm',
      sourceLabel: 'nps.gov: Hiking and Trail Information',
    },
    facts: [
      {
        id: 'wind-canyon',
        title: 'Wind Canyon',
        text: 'This short loop trail travels along wind-eroded cliffs above the Little Missouri River before climbing to a dramatic lookout. The trailhead is about 10.5 miles into the South Unit, on the west side of East River Road.',
        sourceUrl: 'https://www.nps.gov/thingstodo/hike-wind-canyon-trail.htm',
        sourceLabel: 'nps.gov: Hike Wind Canyon Trail',
      },
      {
        id: 'canyon-wind',
        title: 'A canyon that channels wind',
        text: 'Wind Canyon is an excellent example of how erosion formed the badlands. It channels the wind, which rushes through before escaping across the Little Missouri River.',
        sourceUrl: 'https://www.nps.gov/places/wind-canyon.htm',
        sourceLabel: 'nps.gov: Wind Canyon',
      },
      {
        id: 'trail-guide',
        title: 'The trail at a glance',
        text: 'The Wind Canyon Trail is a 0.4 mile (0.6 km) loop, about 20 minutes, with a gravel and dirt surface and stairs. It climbs to the best view of the Little Missouri River in the South Unit, and is a ranger favorite for sunsets.',
        sourceUrl: 'https://www.nps.gov/thro/planyourvisit/hiking-and-trail-information.htm',
        sourceLabel: 'nps.gov: Hiking and Trail Information',
      },
      {
        id: 'bentonite',
        title: 'Blue-gray clay',
        text: 'Bentonite, a fine-grained blue-gray clay, defines the badlands landscape. The dark bands you see in the hillsides are lignite coal seams.',
        sourceUrl: 'https://www.nps.gov/npgallery/GetAsset/257b1284-d776-43d5-9a8f-863023a2e520',
        sourceLabel: 'nps.gov: Theodore Roosevelt National Park brochure',
      },
      {
        id: 'protected',
        title: 'Everything is protected',
        text: 'All plants, wildlife, and natural and cultural features are protected. That includes animal bones, rocks, flowers and anything else you may discover while hiking. Do not disturb or remove them.',
        sourceUrl: 'https://www.nps.gov/thro/planyourvisit/hiking-and-trail-information.htm',
        sourceLabel: 'nps.gov: Hiking and Trail Information',
      },
      {
        id: 'horses',
        title: 'Feral horses',
        text: 'Feral horses inhabit the South Unit only. They are descended from domestic stock and are maintained in the park today as a cultural resource. They are often visible from the Scenic Loop Drive and from I-94.',
        sourceUrl: 'https://www.nps.gov/thro/planyourvisit/wildlife-viewing.htm',
        sourceLabel: 'nps.gov: Wildlife Viewing',
      },
      {
        id: 'prairie-dog-towns',
        title: 'Prairie dog towns',
        text: 'The park road passes through three large prairie dog towns in the South Unit. Bison, feral horses and prairie dogs may seem tame, but they are wild animals and can be dangerous.',
        sourceUrl: 'https://www.nps.gov/thro/planyourvisit/wildlife-viewing.htm',
        sourceLabel: 'nps.gov: Wildlife Viewing',
      },
      {
        id: 'scenic-loop',
        title: 'The Scenic Loop Drive',
        text: 'The South Unit\'s Scenic Loop Drive is 36 miles (58 km) round trip, with overlooks, trailheads and prairie dog towns. The NPS map also shows Roosevelt\'s Maltese Cross Cabin, Buck Hill and the Coal Vein Trail.',
        sourceUrl: 'https://www.nps.gov/npgallery/GetAsset/0b9717f0-8f0b-490c-8af8-2f240995d5d5',
        sourceLabel: 'nps.gov: South Unit map',
      },
      {
        id: 'roosevelt',
        title: 'A president made in the badlands',
        text: 'Theodore Roosevelt said in 1918 that he would never have become President if it had not been for his experiences in North Dakota.',
        sourceUrl: 'https://www.nps.gov/npgallery/GetAsset/257b1284-d776-43d5-9a8f-863023a2e520',
        sourceLabel: 'nps.gov: Theodore Roosevelt National Park brochure',
      },
    ],
    checkedOn: '2026-11-21',
  },
  // The NPS pages for this trailhead list no drinking water, so the map has none (carry your own)
  waterStations: [],
};

/**
 * Task 28: Arches National Park (Utah), the Windows Section. Laid out from the NPS pages for the Windows Viewpoint and Trail (North Window,
 * South Window, Turret Arch), Double Arch and the Windows Section. Game-scale, not a survey: see about.designNote.
 */
export const ARCHES: ParkDefinition = {
  id: 'arches',
  npsParkCode: 'arch',
  layoutSeed: 59,
  name: 'Arches',
  subtitle: 'The Windows Section',
  parkServiceUnit: 'National Park',
  state: 'Utah',
  region: 'Colorado Plateau',
  description: 'In southeast Utah, the Windows Section holds a dense cluster of stone arches. Climb to North Window, look through South Window, find Turret Arch, and stand beneath Double Arch, the tallest arch in the park.',
  elevationRange: { min: 1623, max: 1653 },
  spawn: { x: 6.0, y: 0.4, z: -6.0, yaw: 0 }, // in the Windows parking area, facing north toward the fin of arches
  terrain: {
    baseScale: 0.004,
    heightScale: 0.45, // the desert floor is nearly flat
    noiseX: 80,
    noiseZ: 10,
    // the North Window viewpoint deck sits on the crest just behind North Window (the "mountain" here)
    mountain: {
      x: -12.0,
      z: -72.0,
      height: 8.8,
      radius: 20.0,
      plateauRadius: 5.0,
      name: 'North Window Viewpoint',
    },
    badlands: {
      facing: 'north', // the desert floor and the parking area are in the south; the sandstone fin stands to the north
      wall: [
        { x: -240, z: 70 }, { x: -120, z: 76 }, { x: 0, z: 68 }, { x: 120, z: 72 }, { x: 240, z: 66 },
      ],
      crestHeight: 15.0,
      faceWidth: 24.0,
      topWidth: 10.0,
      backWidth: 70.0,
      basinDrop: 20.0,
      gaps: [
        { x: 14, depth: 0.42, width: 9 },   // North Window (world x = -14)
        { x: -34, depth: 0.45, width: 10 }, // South Window (world x = 34)
      ],
      ruggedness: 0.55,
      terraceStep: 2.4,
      bankSlope: 0.9,
      bare: true,
      strata: {
        // orange-red Entrada sandstone in layers
        colors: [0xd2784a, 0xc4643c, 0xdc9568, 0xb85a38, 0xe2a77a, 0xc9733f],
        bandHeight: 1.8,
        strength: 0.95,
      },
    },
    // desert sand, with dark patches of biological soil crust
    groundLook: {
      patchScale: 0.02,
      strength: 0.85,
      patches: [0xc98f64, 0xb9855c, 0xd4a070, 0xa8795a, 0x6f5f4c, 0xcfa67a],
      speckle: 0.25,
      soil: { color: 0xb98b62, amount: 0.45 },
      mulch: 0.0,
    },
    colors: {
      valley: 0xc98f64,
      meadow: 0xbd8c60,
      dryGrass: 0xc9a56e,
      steepSlope: 0xc26e44,
      summitRock: 0xd08a5a,
      riverbed: 0xb89870,
      riverbank: 0xa88a64,
    },
  },
  water: {
    // The NPS pages for this area mention no stream, so this map has none.
    hasRiver: false,
    mode: 'none',
    name: 'No stream here',
    surfaceY: -1.0,
    halfWidth: 3.0,
    bankWidth: 5.0,
    valleyWidth: 30.0,
    gradient: 0.003,
    deepColor: 0x3a4a48,
    shallowColor: 0x6a7f74,
    skyReflectColor: 0xa8c6d8,
  },
  trail: {
    name: 'Windows Trails',
    width: 2.0,
    surface: { center: 0xcfa87c, mid: 0xb98f64, edge: 0xa07858 }, // packed gravel
    paths: [
      {
        // NPS: a gentle climb up a gravel trail leads to North Window, South Window and Turret Arch (1 mile round trip, 99 ft / 30 m elevation change)
        id: 'windows-loop',
        name: 'Windows Loop',
        closed: true,
        steps: 22,
        nodes: [
          { x: 10, z: -12, y: 0.4 },
          { x: 6, z: -26, y: 0.5 },
          { x: -2, z: -40, y: 2.6 },
          { x: -6, z: -46, y: 4.1 },
          { x: -10, z: -52, y: 5.6 },
          { x: -12, z: -56, y: 7.0 },
          { x: -14, z: -60, y: 8.4 },
          { x: -14, z: -68, y: 8.8 }, // through North Window
          { x: -8, z: -76, y: 8.8 },
          { x: 12, z: -78, y: 8.7 },
          { x: 30, z: -72, y: 8.5 },
          { x: 36, z: -60, y: 7.2 },
          { x: 32, z: -46, y: 3.6 },
          { x: 24, z: -30, y: 0.9 },
          { x: 18, z: -16, y: 0.4 },
        ],
      },
      {
        // the short walk to the viewpoint just behind North Window
        id: 'viewpoint-spur',
        name: 'North Window Viewpoint Spur',
        steps: 10,
        nodes: [
          { x: -14, z: -68, y: 8.8 },
          { x: -13, z: -70, y: 8.8 },
          { x: -12, z: -72, y: 8.8 },
        ],
      },
      {
        // NPS: Turret Arch is on the loop's side trip; USGS/NPS: it lies southwest of South Window
        id: 'turret-spur',
        name: 'Turret Arch Spur',
        steps: 16,
        nodes: [
          { x: -2, z: -40, y: 2.6 },
          { x: -14, z: -38, y: 1.2 },
          { x: -26, z: -36, y: 0.5 },
          { x: -38, z: -35, y: 0.4 },
        ],
      },
      {
        // NPS: a gently sloping path leads to the base of Double Arch (0.6 mile round trip)
        id: 'double-arch-trail',
        name: 'Double Arch Trail',
        steps: 20,
        nodes: [
          { x: -8, z: -8, y: 0.4 },
          { x: -34, z: -12, y: 0.4 },
          { x: -62, z: -20, y: 0.4 },
          { x: -88, z: -30, y: 0.5 },
          { x: -102, z: -38, y: 0.6 },
        ],
      },
    ],
  },
  overlook: {
    name: 'North Window Viewpoint',
    elevationLabel: 'Behind North Window',
    deckRadius: 4.0,
    hasBench: false,
    hasTelescope: false,
    signHeading: 'NORTH WINDOW',
    signSubheading: 'VIEW THROUGH THE FIN',
  },
  vegetation: {
    treeCount: 60,
    shrubCount: 650,
    speciesWeights: { conifer: 4.0, pine: 0.0, broadleaf: 0.0, oak: 0.0, birch: 0.0, poplar: 0.0, snag: 0.6 },
    look: {
      treeScale: 0.7, // small, twisted pinyon and juniper
      glades: 0.9,
      palettes: { conifer: [0x6b7a52, 0x5c6c48, 0x75805a] },
      groundCover: {
        clumps: 200,
        flowerPatches: 20,
        clumpPalette: [0x9a9468, 0x8a8a5c, 0xa8a070, 0x7d8052],
        flowerPalette: [0xe8c83a, 0xd88a3a],
      },
      shrubPalette: [0x8a8a5a, 0x777a4c, 0x9a966a, 0x6b6e45],
    },
  },
  atmosphere: {
    fogColor: 0xecdcc4,
    fogDensity: 0.003,
    hemiSky: 0xdbe6f0,
    hemiGround: 0xc09468,
    sunColor: 0xfff0d0,
    sunIntensity: 3.3,
    skyHorizon: 0xf0e2cc,
    skyMid: 0x8dbbe2,
    skyZenith: 0x2f72c0,
    skySun: 0xffe2b0,
  },
  landmarks: [
    {
      id: 'spawn',
      name: 'Windows Parking Area',
      shortName: 'Parking Area',
      description: 'The Windows Section is 12 miles (19 km) from the park entrance. Massive North Window is visible from the parking lot, and trails lead to Turret Arch, North Window, South Window and Double Arch. There is no drinking water at the trailhead.',
      x: 6, y: 0.4, z: -6, yaw: 0,
    },
    {
      id: 'north-window',
      name: 'North Window',
      shortName: 'North Window',
      description: 'North Window invites you to walk up and look through it. Rock steps lead up to the arch.',
      x: -14, y: 8.6, z: -62, yaw: 0,
    },
    {
      id: 'summit',
      name: 'North Window Viewpoint',
      shortName: 'Viewpoint',
      description: 'Behind North Window the fin drops away to the desert beyond. Stay on the trail and on bare rock.',
      x: -12, y: 8.8, z: -72, yaw: Math.PI,
    },
    {
      id: 'south-window',
      name: 'South Window',
      shortName: 'South Window',
      description: 'South Window is an elevated arch in the same sandstone fin as North Window. The real arch is about 105 feet (32 m) wide and 66 feet (20 m) high. Do not try to climb into it.',
      x: 34, y: 7.6, z: -58, yaw: 0,
    },
    {
      id: 'turret-arch',
      name: 'Turret Arch',
      shortName: 'Turret Arch',
      description: 'Turret Arch stands in a castle-like formation southwest of South Window. You can see it through North Window.',
      x: -38, y: 0.4, z: -32, yaw: Math.PI * 1.5,
    },
    {
      id: 'double-arch',
      name: 'Double Arch',
      shortName: 'Double Arch',
      description: 'Double Arch is the tallest arch in the park (112 feet, 34 m) and the second longest (144 feet, 44 m). A gently sloping path leads to its base.',
      x: -100, y: 0.6, z: -36, yaw: Math.PI * 1.5,
    },
  ],
  wildlife: {
    // NPS: mule deer, kit foxes and (more often) jackrabbits are animals you may see at Arches. All three keep at least 23 m away from the trails.
    spawns: [
      // mule deer east of the parking area, about 28 to 35 m from the trails and easy to see from the lot
      { species: 'mule-deer', isBuck: true, isFawn: false, x: 44.0, z: -4.0, roamRadius: 7.0 },
      { species: 'mule-deer', isBuck: false, isFawn: false, x: 48.0, z: -12.0, roamRadius: 7.0 },
      { species: 'mule-deer', isBuck: false, isFawn: false, x: 40.0, z: 8.0, roamRadius: 7.0 },
      // kit foxes (shy; the real ones are mostly nocturnal)
      { species: 'kit-fox', isBuck: false, isFawn: false, x: 0.0, z: 24.0, roamRadius: 6.0 },
      { species: 'kit-fox', isBuck: false, isFawn: false, x: 52.0, z: -24.0, roamRadius: 6.0 },
      // black-tailed jackrabbits south and southwest of the lot
      { species: 'jackrabbit', isBuck: false, isFawn: false, x: -24.0, z: 28.0, roamRadius: 6.0 },
      { species: 'jackrabbit', isBuck: false, isFawn: false, x: -36.0, z: 20.0, roamRadius: 6.0 },
      { species: 'jackrabbit', isBuck: false, isFawn: false, x: 20.0, z: 24.0, roamRadius: 6.0 },
      // coyotes, within sight of the Double Arch trail and the lot
      { species: 'coyote', isBuck: false, isFawn: false, x: -76.0, z: 12.0, roamRadius: 8.0 },
      { species: 'coyote', isBuck: false, isFawn: false, x: 36.0, z: 20.0, roamRadius: 8.0 },
      // ONE mountain lion on the edge of the fin (NPS: sightings in Arches are very rare, usually from a distance).
      // It can be spotted from the South Window, about 55 m away.
      { species: 'mountain-lion', isBuck: false, isFawn: false, x: 90.0, z: -72.0, roamRadius: 3.0 },
    ],
    safeDistanceOverrides: { 'mule-deer': 23.0, 'kit-fox': 23.0, jackrabbit: 23.0, coyote: 23.0, 'mountain-lion': 46.0 },
  },
  features: {
    roads: [
      {
        // The park road reaches the Windows Parking Area from the south
        id: 'windows-road',
        name: 'Windows Road',
        kind: 'road',
        width: 7.0,
        nodes: [
          { x: 14, z: 270 },
          { x: 6, z: 150 },
          { x: 10, z: 40 },
          { x: 8, z: 4 },
        ],
      },
      {
        id: 'windows-lot',
        name: 'Windows Parking Area',
        kind: 'lot',
        levelFrom: 'windows-road',
        width: 13.0,
        nodes: [
          { x: -14, z: -6 },
          { x: 30, z: -6 },
        ],
      },
    ],
    cars: [
      { x: -4.0, z: -10.0, yaw: Math.PI / 2, color: 0x2f4a6b },
      { x: 12.0, z: -2.0, yaw: -Math.PI / 2, color: 0xd9d6cc },
      { x: 22.0, z: -10.0, yaw: Math.PI / 2, color: 0x9a2a2a },
    ],
    // NPS: North Window is a natural arch you can walk up to and look through; South Window and Turret Arch are in the same area; Double Arch has two openings
    rockWindows: [
      { x: -14, z: -64, yaw: 0, opening: 11, height: 7, scale: 1.8 },    // North Window
      { x: 34, z: -62, yaw: 0, opening: 12, height: 7.5, scale: 1.9 },   // South Window
      { x: -44, z: -34, yaw: 0.8, opening: 5, height: 4.5, scale: 1.4 }, // Turret Arch
      { x: -108, z: -44, yaw: 0.4, opening: 14, height: 11, scale: 2.4 }, // Double Arch, the tall opening
      { x: -126, z: -38, yaw: 0.4, opening: 8, height: 7, scale: 1.6 },   // Double Arch, the second opening
    ],
    pinnacles: [
      { x: 70, z: -70, radius: 40, innerRadius: 8, count: 10, minHeight: 3, maxHeight: 9, colors: [0xc9733f, 0xd2784a, 0xb85a38, 0xdc9568] },
      { x: -70, z: -90, radius: 40, innerRadius: 8, count: 10, minHeight: 3, maxHeight: 8, colors: [0xc9733f, 0xd2784a, 0xb85a38, 0xdc9568] },
    ],
    distantRidges: true,
  },
  rules: {
    zones: [
      {
        id: 'crust-1',
        kind: 'sensitive',
        name: 'Biological Soil Crust',
        x: -28,
        z: -18,
        radius: 8,
        reason: 'Don\'t bust the crust! Biological soil crust is alive and holds the desert together. One footprint can destroy hundreds of years of growth. Stay on trails, bare rock or in dry washes.',
      },
      {
        id: 'crust-2',
        kind: 'sensitive',
        name: 'Biological Soil Crust',
        x: 42,
        z: -30,
        radius: 8,
        reason: 'Don\'t bust the crust! Walk only on trails, rock or in sandy washes. A path through the crust can take hundreds of years to recover.',
      },
      {
        id: 'crust-3',
        kind: 'sensitive',
        name: 'Biological Soil Crust',
        x: -76,
        z: -14,
        radius: 8,
        reason: 'Don\'t bust the crust! The dark, bumpy soil is a living crust that many desert plants depend on. Stay on the trail.',
      },
    ],
    litter: STANDARD_LITTER.map(l => ({
      ...l,
      trail: ({ 'can-1': 'windows-loop', 'bottle-1': 'double-arch-trail', 'wrapper-1': 'windows-loop', 'peel-1': 'turret-spur', 'bag-1': 'double-arch-trail' } as Record<string, string>)[l.id] ?? 'windows-loop',
    })),
  },
  about: {
    designNote:
      'A game-scale map of the Windows Section. It follows the NPS pages: the section is reached by a road from the park entrance; the Windows Viewpoint trail is a 1 mile round trip with a gentle climb up a gravel trail to North Window, South Window and Turret Arch, with a very uneven primitive section; Double Arch has its own gently sloping path, and the NPS gives its height and length. The positions of the arches and trails relative to each other are game placements (the NPS says only that the trails lead to them; the USGS says Turret Arch is southwest of South Window). The arches are shown much smaller than the real ones (for example South Window is about 105 ft wide and 66 ft high), and each is built as a rock frame (jambs and a lintel) because the game\'s ground cannot hold holes. Double Arch is shown as two openings in one mass. Mule deer, kit foxes and black-tailed jackrabbits are real Arches animals (the NPS brochure lists them); their numbers and exact spots here are game placements, and the real foxes are mostly nocturnal and rarely seen. Coyotes and one mountain lion are modelled too (the lion is deliberately far away on the fin, because the NPS says lion sightings in Arches are very rare). Other Arches animals (cottontails, kangaroo rats, lizards, birds, desert bighorn sheep, black bears) are not modelled. The sensitive patches are example areas for the biological soil crust. There is no drinking water at the trailhead (the NPS says so), so the map has none. The elevation range is a game value: the NPS gives only the 99 ft (30 m) elevation change of the loop, and the base height (about 1,623 m) is the published height of Turret Arch, not NPS-checked.',
    wildlifeGuidance: {
      text: 'Arches asks visitors to keep wildlife wild. National parks generally ask you to stay at least 75 feet (23 m) from most animals.',
      caveat: 'The game uses 23 m (75 ft), the general NPS distance, for most animals in this map; no Arches-specific number was found for them. For the mountain lion it uses 46 m (150 ft), the distance Arches recommends for large animals such as black bears. Always check the park\'s current page and signs.',
      sourceUrl: 'https://www.nps.gov/arch/planyourvisit/hiking.htm',
      sourceLabel: 'nps.gov: Arches hiking',
    },
    facts: [
      {
        id: 'windows-section',
        title: 'The heart of Arches',
        text: 'The Windows Section is 12 miles (19 km) from the park entrance. It holds a large concentration of arches in just over two square miles, and some consider it the beating heart of the park. Massive North Window is visible from the parking lot.',
        sourceUrl: 'https://www.nps.gov/places/the-windows-section-trailhead.htm',
        sourceLabel: 'nps.gov: The Windows Viewpoint and Trail',
      },
      {
        id: 'loop-trail',
        title: 'The Windows trail',
        text: 'The trail is 1 mile (1.6 km) round trip, about 30 to 60 minutes, with a 99 ft (30 m) elevation change. A gentle climb up a gravel trail leads to North Window, South Window and Turret Arch. The primitive section is very uneven, with steps up and down.',
        sourceUrl: 'https://www.nps.gov/places/the-windows-section-trailhead.htm',
        sourceLabel: 'nps.gov: The Windows Viewpoint and Trail',
      },
      {
        id: 'carry-water',
        title: 'Bring your own water',
        text: 'There is no drinking water at the Windows trailhead. The park brochure says you must carry all your water.',
        sourceUrl: 'https://www.nps.gov/places/the-windows-section-trailhead.htm',
        sourceLabel: 'nps.gov: The Windows Viewpoint and Trail',
      },
      {
        id: 'south-window',
        title: 'South Window',
        text: 'South Window is 105 feet wide and 66 feet high. You can reach the other side of it by walking around the southeast end of the fin or by walking through North Window. Turret Arch is a short walk to the southwest.',
        sourceUrl: 'https://nps.gov/parkhistory/online_books/geology/publications/bul/1393/sec10c.htm',
        sourceLabel: 'NPS-hosted USGS Bulletin 1393: The Windows Section',
      },
      {
        id: 'double-arch',
        title: 'Double Arch',
        text: 'Double Arch is the tallest arch in the park (112 ft, 34 m) and the second longest (144 ft, 44 m). A gently sloping path leads to its base. Dogs are not allowed on this trail.',
        sourceUrl: 'https://www.nps.gov/places/double-arch.htm',
        sourceLabel: 'nps.gov: Double Arch Viewpoint and Trail',
      },
      {
        id: 'double-arch-access',
        title: 'A barrier-free path',
        text: 'The Double Arch trail is considered barrier free, with a hard packed surface, some slopes and a sandy surface at the end of the trail. Accessible parking is available.',
        sourceUrl: 'https://home.nps.gov/arch/planyourvisit/the-windows.htm',
        sourceLabel: 'nps.gov: The Windows Section',
      },
      {
        id: 'names',
        title: 'Names in the Windows Section',
        text: 'Other named features in this area include Garden of Eden, Elephant Butte and Parade of Elephants.',
        sourceUrl: 'https://www.nps.gov/arch/planyourvisit/the-windows.htm',
        sourceLabel: 'nps.gov: The Windows Section',
      },
      {
        id: 'animals-hours',
        title: 'Dawn, dusk and night',
        text: 'Most desert animals are nocturnal. Mule deer, coyotes, porcupines, desert cottontails and black-tailed jackrabbits are most active at dawn and dusk, when it is cooler. Hot weather and little water favor small mammals at Arches.',
        sourceUrl: 'https://home.nps.gov/arch/learn/nature/animals.htm',
        sourceLabel: 'nps.gov: Arches animals',
      },
      {
        id: 'mountain-lions',
        title: 'Rarely seen: mountain lions',
        text: 'Mountain lion sightings in Arches are very rare, even though about 80% of a mountain lion\'s diet in Utah is mule deer. If you do see one: do not approach, do not run, stand and face it, and appear larger. Report sightings to a ranger.',
        sourceUrl: 'https://www.nps.gov/arch/learn/nature/mammals.htm',
        sourceLabel: 'nps.gov: Arches mammals and Mountain Lion Safety',
      },
      {
        id: 'crust',
        title: 'Don\'t bust the crust',
        text: 'The plant communities of Arches depend on biological soil crusts, living communities of microbes that hold the sand in place and store water. Stay on established trails, or walk in dry washes or on bare rock. A path through the crust can take hundreds of years to recover.',
        sourceUrl: 'https://www.nps.gov/arch/learn/kidsyouth/biologicalsoilcrust.htm',
        sourceLabel: 'nps.gov: Biological Soil Crust Activity',
      },
    ],
    checkedOn: '2026-11-21',
  },
  // No drinking water at the trailhead (NPS), so the map has none
  waterStations: [],
};

/** Real parks first. Practice (fictional) parks come last. */
export const AVAILABLE_PARKS: ParkDefinition[] = [
  GREAT_SMOKY_MOUNTAINS,
  SHENANDOAH,
  ACADIA,
  CHIRICAHUA,
  WIND_CAVE,
  BADLANDS,
  THEODORE_ROOSEVELT,
  ARCHES,
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
