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
      text: 'The Smokies ask visitors to stay at least 50 yards (about 46 m) from elk, or any distance that changes the animal\'s behavior, and the game uses 46 m there. Wind Cave asks for at least 25 yards (23 m) from all wildlife, so the game uses 23 m for elk in that park.',
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

SPECIES_CATALOGUE['black-bear'] = {
  id: 'black-bear',
  name: 'Black Bear',
  scientific: 'Ursus americanus',
  safeDistanceM: 46,
  blurb:
    'The most famous resident of the Smokies. Black bears are normally shy and are watched from far away. They are never an enemy, but they deserve a lot of room.',
  variants: ['Adult black bear'],
  facts: [
    {
      id: 'fifty-yards',
      unlock: 'responsible',
      text: 'Great Smoky Mountains and Shenandoah both ask visitors to stay at least 50 yards (150 feet) from black bears, and in the Smokies approaching any distance that disturbs or displaces a bear is illegal. The game uses 46 m.',
    },
    {
      id: 'back-away',
      unlock: 'identified',
      text: 'If a bear approaches or follows you, slowly back away while facing it. Never run or turn your back: running can trigger a bear\'s pursuit response.',
    },
    {
      id: 'fall-weight',
      unlock: 'identified',
      text: 'As fall approaches, black bears can nearly double their weight in preparation for winter.',
    },
    {
      id: 'food-conditioned',
      unlock: 'photographed',
      text: 'Bears that learn to eat human food often damage property and threaten safety, and sadly some have to be euthanized. That is why rangers enforce rules on littering, feeding and food storage.',
    },
    {
      id: 'habitat',
      unlock: 'allVariants',
      text: 'The Smokies are one of the largest protected areas in the eastern United States where black bears live in wild, natural surroundings, and they use all elevations of the park.',
    },
  ],
};

SPECIES_CATALOGUE['bison'] = {
  id: 'bison',
  name: 'American Bison',
  scientific: 'Bison bison',
  safeDistanceM: 46,
  blurb:
    'The great grazer of the prairie. Bison can look calm, but they are unpredictable and dangerous, so they are watched from much farther away than deer.',
  variants: ['Bull bison', 'Cow bison'],
  facts: [
    {
      id: 'dangerous',
      unlock: 'responsible',
      text: 'Parks ask visitors to keep well back from wildlife: Wind Cave requires at least 25 yards (23 m) and strongly recommends more room for bison, and Badlands asks for at least 100 feet (30 m) from all wildlife. Wind Cave notes that bison may look tame, yet they are unpredictable, may charge without warning, and are more aggressive during calving and mating season from May through August. The game uses each park\'s own distance (Wind Cave bison: 46 m).',
    },
    {
      id: 'calves',
      unlock: 'identified',
      text: 'Bison calves are born orange or red and turn brown when they are about two months old.',
    },
    {
      id: 'herd',
      unlock: 'identified',
      text: 'Several hundred bison live in Wind Cave National Park. They often cross the highways, causing what visitors call a "bison jam".',
    },
    {
      id: 'wallow',
      unlock: 'photographed',
      text: 'Bison like to graze among prairie dogs because the grass there is more tender and nutritious, and they wallow in the bare dirt at the burrow entrances.',
    },
    {
      id: 'sizes',
      unlock: 'allVariants',
      text: 'Bulls often lounge by themselves or in small groups, while cows stay with their calves in bigger herds.',
    },
  ],
};

SPECIES_CATALOGUE['prairie-dog'] = {
  id: 'prairie-dog',
  name: 'Black-tailed Prairie Dog',
  scientific: 'Cynomys ludovicianus',
  safeDistanceM: 23,
  blurb:
    'A small, social burrowing rodent that lives in big groups called towns. It is watched from a distance, never fed.',
  variants: ['Adult prairie dog'],
  facts: [
    {
      id: 'towns',
      unlock: 'identified',
      text: 'Prairie dogs live in large groups known as towns so that many pairs of eyes can watch for predators such as badgers, coyotes and birds of prey. They are active all year and do not hibernate.',
    },
    {
      id: 'neighbors',
      unlock: 'identified',
      text: 'Burrowing owls and rattlesnakes use prairie dog burrows for shelter, and prairie dogs provide food or shelter for much of the prairie\'s wildlife.',
    },
    {
      id: 'no-feeding',
      unlock: 'responsible',
      text: 'Feeding prairie dogs and other wildlife is illegal in all national parks. Burrows also attract rattlesnakes, black widow spiders and fleas that may carry plague, so enjoy towns from a safe distance.',
    },
    {
      id: 'sentinel',
      unlock: 'photographed',
      text: 'Prairie dogs stand up on their hind legs to look around, and dive into their burrows when something worrying comes near.',
    },
  ],
};

SPECIES_CATALOGUE['bighorn-sheep'] = {
  id: 'bighorn-sheep',
  name: 'Bighorn Sheep',
  scientific: 'Ovis canadensis',
  safeDistanceM: 30.5,
  blurb:
    'A sure-footed sheep of rocky cliffs and buttes. Rams carry massive curled horns; ewes have short, thin ones. It is watched from a distance, never approached.',
  variants: ['Bighorn ram (curled horns)', 'Bighorn ewe'],
  facts: [
    {
      id: 'grass-and-cliffs',
      unlock: 'identified',
      text: 'Bighorn drop down to grasslands to eat large amounts of grass and shrubs quickly, then retreat to cliffs, away from predators, where they chew their food again as cud.',
    },
    {
      id: 'home-herd',
      unlock: 'photographed',
      text: 'The Badlands received its own herd in 1964, when twenty-two bighorn were moved from Pike\'s Peak in Colorado. A second group arrived in 2004 from Wheeler Peak in New Mexico. The park now has about 250 of the roughly 80,000 bighorn in the United States.',
    },
    {
      id: 'few-predators',
      unlock: 'responsible',
      text: 'Adult bighorn in Badlands have few to no natural predators. The most common way for them to die is by accident or disease: a lamb that missteps climbing or descending a slope can take a fatal fall. Badlands asks visitors to stay at least 100 feet (30 m) from all wildlife.',
    },
    {
      id: 'groups',
      unlock: 'allVariants',
      text: 'Bighorn live in separate groups by sex and age. Ewes and lambs form large herds, while young rams leave their mother\'s herd at about two to four years old and join a bachelor group of up to ten rams, led by a dominant ram.',
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
