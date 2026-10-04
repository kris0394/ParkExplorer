/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TASK 10: Season selector.
 *
 * One small data table drives everything seasonal: leaf colours, snow,
 * grass tint, deer behaviour and trail access. Wildlife notes are general
 * natural history for teaching, not official NPS content.
 */

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export const SEASON_ORDER: Season[] = ['spring', 'summer', 'autumn', 'winter'];

export interface SeasonDef {
  id: Season;
  label: string;
  /** What changes in the world (shown on the start screen). */
  worldChanges: string;
  /** Why wildlife behaves differently (shown on the start screen). */
  wildlifeNote: string;
  /** Short note on trail access this season. */
  trailNote: string;

  /** Deciduous trees: 'full' leaves, or 'bare' (no leaf canopy). */
  leaves: 'full' | 'bare';
  /** Replacement leaf palette for deciduous trees (null keeps the default palette). */
  leafPalette: number[] | null;
  /** Share of deciduous trees that show accent colours (autumn colour or spring blossom). */
  accentChance: number;
  /** Accent colours (null uses each species' own autumn colours). */
  accentPalette: number[] | null;
  /** How much conifers are frosted white with snow (0 to 1). */
  coniferSnow: number;
  /** Shrub colours. */
  shrubPalette: number[];
  /** Multiplier applied to the grass colour (values above 1 lighten). */
  grassTint: [number, number, number];
  /** Ground colour blended over the terrain, and how strongly (0 to 1). */
  groundColor: number;
  groundAmount: number;
  /** Snow settles on flat ground and builds up with height. */
  groundIsSnow: boolean;

  deer: {
    /** Multiplier on the distance at which a deer notices you. */
    alertMult: number;
    /** Share of idle moments a deer spends wandering (vs feeding and standing). */
    wanderChance: number;
    /** Multiplier on the Stewardship penalty for startling wildlife. */
    startlePenaltyMult: number;
  };
}

export const SEASONS: Record<Season, SeasonDef> = {
  spring: {
    id: 'spring',
    label: 'Spring',
    worldChanges: 'Fresh pale-green leaves, a few blossoms, lush grass.',
    wildlifeNote:
      'Does give birth to fawns in late spring and early summer and hide them in tall grass. A fawn alone is almost never abandoned, so never touch or approach it.',
    trailNote: 'All trails open.',
    leaves: 'full',
    leafPalette: [0x9ec65a, 0x8fbf5a, 0xa8cf6a, 0x86b85a, 0xb4d46e],
    accentChance: 0.08,
    accentPalette: [0xf0c4d4, 0xf7e1e8],
    coniferSnow: 0,
    shrubPalette: [0x6f9a4a, 0x80ab4a, 0x8fb850, 0x5f8a50],
    grassTint: [1.05, 1.28, 0.95],
    groundColor: 0x7aa844,
    groundAmount: 0.14,
    groundIsSnow: false,
    deer: { alertMult: 1.15, wanderChance: 0.12, startlePenaltyMult: 1 },
  },
  summer: {
    id: 'summer',
    label: 'Summer',
    worldChanges: 'Full green canopy and golden meadow grass.',
    wildlifeNote:
      'Deer feed heavily on summer plants. Bucks carry soft, velvet-covered antlers, and animals rest in shade during the heat of the day.',
    trailNote: 'All trails open.',
    leaves: 'full',
    leafPalette: null,
    accentChance: 0.03,
    accentPalette: null,
    coniferSnow: 0,
    shrubPalette: [0x3e6b3a, 0x557a35, 0x6f8a3a, 0x2f5a42, 0x7f9a3c],
    grassTint: [1, 1, 1],
    groundColor: 0x000000,
    groundAmount: 0,
    groundIsSnow: false,
    deer: { alertMult: 1, wanderChance: 0.12, startlePenaltyMult: 1 },
  },
  autumn: {
    id: 'autumn',
    label: 'Autumn',
    worldChanges: 'Gold, orange and red leaves, tan grass, warm ground.',
    wildlifeNote:
      'Autumn is the deer breeding season (the rut). Animals are restless and more easily alarmed, so give extra space and move quietly.',
    trailNote: 'All trails open.',
    leaves: 'full',
    leafPalette: [0x8a9a3a, 0x9aa23a, 0x7f9038, 0xb09a34],
    accentChance: 0.88,
    accentPalette: [0xd9a21f, 0xc9791f, 0xb4472a, 0xe0b83a, 0xa9532b, 0xc08a2e],
    coniferSnow: 0,
    shrubPalette: [0x8a6a2f, 0x9a5a2a, 0x7a6a30, 0x6a5a2a, 0xa57a35],
    grassTint: [1.38, 1.02, 0.6],
    groundColor: 0xa07a3a,
    groundAmount: 0.32,
    groundIsSnow: false,
    deer: { alertMult: 1.3, wanderChance: 0.18, startlePenaltyMult: 1 },
  },
  winter: {
    id: 'winter',
    label: 'Winter',
    worldChanges: 'Bare trees, snow on the ground and on evergreens, frosted grass.',
    wildlifeNote:
      'Food is scarce, so deer move less to save energy. Every time a deer is startled into running it burns fat it needs to survive until spring.',
    trailNote: 'Summit trail closed: ice and snow on the exposed upper steps.',
    leaves: 'bare',
    leafPalette: null,
    accentChance: 0,
    accentPalette: null,
    coniferSnow: 0.6,
    shrubPalette: [0x8a8f86, 0x9aa09a, 0x7a8078, 0xb8bdb6],
    grassTint: [1.85, 1.92, 2.05],
    groundColor: 0xf2f6fa,
    groundAmount: 0.78,
    groundIsSnow: true,
    deer: { alertMult: 1.1, wanderChance: 0.05, startlePenaltyMult: 2 },
  },
};

const STORAGE_KEY = 'park-explorer-season';

function loadSeason(): Season {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw && (SEASON_ORDER as string[]).includes(raw)) return raw as Season;
  } catch {
    /* ignore */
  }
  return 'summer';
}

let activeSeason: Season = loadSeason();

export function getActiveSeason(): Season {
  return activeSeason;
}

export function getSeasonDef(): SeasonDef {
  return SEASONS[activeSeason];
}

export function setActiveSeason(season: Season): void {
  activeSeason = season;
  try {
    localStorage.setItem(STORAGE_KEY, season);
  } catch {
    /* ignore */
  }
}
