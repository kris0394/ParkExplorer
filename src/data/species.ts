/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

export function getSpeciesIdFromName(name: string): string {
  for (const sp of Object.values(SPECIES_CATALOGUE)) {
    if (sp.name === name) return sp.id;
  }
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function getSpeciesForPark(parkId: string): string[] {
  // Currently white-tailed deer are present in all parks
  return ['white-tailed-deer'];
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
