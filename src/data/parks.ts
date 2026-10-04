/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ParkDefinition {
  id: string;
  name: string;
  subtitle: string;
  parkServiceUnit: string; // e.g. "National Park"
  state: string;
  region: string;
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
  };
  trail: {
    name: string;
    width: number;
    westNodes: { x: number; z: number }[];
    eastNodes: { x: number; z: number }[];
    bridge: {
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
}

/**
 * PROTOTYPE PARK: Whispering Valley & Pine Ridge
 * The baseline development park used for core physics and environment tests.
 */
export const PROTOTYPE_PARK: ParkDefinition = {
  id: 'whispering-valley',
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
};

/**
 * FIRST REAL NATIONAL PARK: Great Smoky Mountains National Park
 * Characterized by ancient weathered ridges, characteristic blue mist/haze,
 * sugar maples, yellow birches, mountain streams, and the Clingmans Ridge Overlook.
 */
export const GREAT_SMOKY_MOUNTAINS: ParkDefinition = {
  id: 'great-smoky-mountains',
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
      name: 'Clingmans Ridge High Point',
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
    name: 'Clingmans Observation Overlook',
    elevationLabel: 'Elev. 2,025m (6,643 ft)',
    deckRadius: 5.2,
    hasBench: true,
    hasTelescope: true,
    signHeading: 'CLINGMANS DOME',
    signSubheading: 'SMOKY MTNS OVERLOOK',
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
      name: 'Clingmans Ridge Overlook',
      description: 'High vantage point looking across endless waves of blue smoky ridges.',
      x: 82.0,
      y: 33.2,
      z: -70.0,
      yaw: Math.PI * 0.8,
    },
  ],
};

export const AVAILABLE_PARKS: ParkDefinition[] = [
  PROTOTYPE_PARK,
  GREAT_SMOKY_MOUNTAINS,
];

let activePark: ParkDefinition = PROTOTYPE_PARK;

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
