/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AVAILABLE_PARKS } from './parks.ts';

export type UnlockCondition = 'identified' | 'photographed' | 'responsible' | 'allVariants';

export interface SpeciesFact {
  id: string;
  unlock: UnlockCondition;
  text: string;
}

export interface SpeciesDefinition {
  id: string;
  name: string;
  scientific: string;
  blurb: string;
  variants: string[];
  facts: SpeciesFact[];
  /** Game safe-viewing distance in metres. A park can override it (park.wildlife.safeDistanceOverrides). */
  safeDistanceM: number;
}

export const SPECIES_UNLOCK_DESCRIPTIONS: Record<UnlockCondition, string> = {
  identified: 'Identify this animal through the binoculars.',
  photographed: 'Photograph it with the camera.',
  responsible: 'Watch it calmly from a safe distance.',
  allVariants: 'Identify every variant of this animal (for example buck, doe and fawn).',
};

export const SPECIES_CATALOGUE: Record<string, SpeciesDefinition> = {
  'white-tailed-deer': {
    id: 'white-tailed-deer',
    name: 'White-tailed Deer',
    scientific: 'Odocoileus virginianus',
    safeDistanceM: 23,
    blurb: 'A graceful, wary herbivore of forest glades and meadows, most active and vocal around dawn and dusk.',
    variants: ['Adult buck (antlered)', 'Adult doe', 'Spotted fawn'],
    facts: [
      {
        id: 'tail',
        unlock: 'identified',
        text: 'The name comes from the white underside of the tail, which is flagged upright as an alarm signal to other herd members.',
      },
      {
        id: 'antlers',
        unlock: 'identified',
        text: 'Only bucks grow true bone antlers. They shed them each winter and grow a new, larger velvet-covered rack each spring.',
      },
      {
        id: 'feeding',
        unlock: 'identified',
        text: 'Feeding wildlife is prohibited in national parks. Maintaining at least 25 yards (about 23 m) keeps wildlife wild and calm.',
      },
      {
        id: 'fawns',
        unlock: 'photographed',
        text: 'Fawns are born with dappled white spots resembling sunlit leaves on the forest floor, providing natural camouflage against predators.',
      },
      {
        id: 'dawn',
        unlock: 'responsible',
        text: 'White-tailed deer are crepuscular, grazing actively at sunrise and twilight when cooler mountain air moves down the valley.',
      },
      {
        id: 'alert',
        unlock: 'allVariants',
        text: 'When attentive or alarmed, a deer raises its head high, pivots its large ears forward, and may stamp its front hoof to warn others.',
      },
    ],
  },
};

SPECIES_CATALOGUE['elk'] = {
  id: 'elk',
  name: 'Elk',
  scientific: 'Cervus canadensis',
  safeDistanceM: 46,
  blurb:
    'A very large deer of open meadows and forest edges. Elk can be dangerous if crowded, especially in autumn, so they are watched from much farther away than deer.',
  variants: ['Bull elk (antlered)', 'Cow elk'],
  facts: [
    {
      id: 'return',
      unlock: 'identified',
      text: 'Elk disappeared from the southern Appalachians in the 1800s. Great Smoky Mountains National Park released its first 25 elk in 2001.',
    },
    {
      id: 'distance',
      unlock: 'responsible',
      text: 'The park asks visitors to stay at least 50 yards (about 46 m) from elk, or any distance that changes the animal\'s behavior. The game uses 46 m for elk.',
    },
    {
      id: 'antlers',
      unlock: 'photographed',
      text: 'Only bulls grow antlers. They shed them each late winter and regrow a new, larger set every year.',
    },
    {
      id: 'bugle',
      unlock: 'identified',
      text: 'In autumn, during the breeding season called the rut, bulls make a loud, rising call known as a bugle. Bulls are restless and easily provoked then, so give them extra room.',
    },
    {
      id: 'sizes',
      unlock: 'allVariants',
      text: 'Bulls are noticeably larger than cows, and only bulls carry antlers.',
    },
  ],
};

export function getSpeciesIdFromName(name: string): string {
  for (const sp of Object.values(SPECIES_CATALOGUE)) {
    if (sp.name === name) return sp.id;
  }
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function getSpeciesForPark(parkId: string): string[] {
  const park = AVAILABLE_PARKS.find(p => p.id === parkId);
  const ids = new Set<string>(park ? park.wildlife.spawns.map(s => s.species) : ['white-tailed-deer']);
  if (ids.size === 0) ids.add('white-tailed-deer');
  // Keep a stable order: deer first, then the rest as listed in the catalogue
  return Object.keys(SPECIES_CATALOGUE).filter(id => ids.has(id));
}

/** Safe viewing distance for a species in a park (park data can override the species default). */
export function getSafeDistanceM(
  speciesId: string,
  park?: { wildlife: { safeDistanceOverrides?: Record<string, number> } }
): number {
  return park?.wildlife.safeDistanceOverrides?.[speciesId] ?? SPECIES_CATALOGUE[speciesId]?.safeDistanceM ?? 23;
}

export function isFactUnlocked(
  condition: UnlockCondition,
  progress: {
    identified: boolean;
    photographed: boolean;
    responsible: boolean;
    variantsIdentified: number;
    variantsTotal: number;
  }
): boolean {
  switch (condition) {
    case 'identified':
      return progress.identified;
    case 'photographed':
      return progress.photographed;
    case 'responsible':
      return progress.responsible;
    case 'allVariants':
      return progress.variantsTotal > 0 && progress.variantsIdentified >= progress.variantsTotal;
  }
}
