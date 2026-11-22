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
    'Black bears are normally shy and are watched from far away. They are never an enemy, but they deserve a lot of room.',
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

SPECIES_CATALOGUE['elk'].facts.push({
  id: 'treeline',
  unlock: 'identified',
  text: 'In Rocky Mountain National Park, elk spend much of the summer at or above treeline, moving to lower elevations in fall, winter and spring. Their favorite feeding times are dawn and dusk. The park asks you to stay at least 75 feet (23 m) away.',
});

SPECIES_CATALOGUE['yellow-bellied-marmot'] = {
  id: 'yellow-bellied-marmot',
  name: 'Yellow-bellied Marmot',
  scientific: 'Marmota flaviventris',
  safeDistanceM: 23,
  blurb: 'A stocky, brown mountain rodent with a yellowish belly that sunbathes on rocks. It whistles a warning and dives for cover when you come near.',
  variants: ['Adult marmot'],
  facts: [
    {
      id: 'tundra-rocks',
      unlock: 'identified',
      text: 'Yellow-bellied marmots favor rocky areas. They are best seen on the alpine tundra along Trail Ridge Road and Old Fall River Road in Rocky Mountain National Park.',
    },
    {
      id: 'hibernation',
      unlock: 'photographed',
      text: 'The tundra summer is short. Marmots store fat, then draw on those reserves while they hibernate through the winter.',
    },
    {
      id: 'distance',
      unlock: 'responsible',
      text: 'Rocky Mountain asks you to stay at least 75 feet (23 m) from all wildlife and never to feed it. If an animal reacts to you, you are too close.',
    },
  ],
};

SPECIES_CATALOGUE['pika'] = {
  id: 'pika',
  name: 'Pika',
  scientific: 'Ochotona princeps',
  safeDistanceM: 23,
  blurb: 'A tiny, round-eared, light-colored mammal of rock piles high in the mountains. You will hear its sharp bark before you see it.',
  variants: ['Adult pika'],
  facts: [
    {
      id: 'rabbit-relative',
      unlock: 'identified',
      text: 'Pikas are small mammals related to the rabbit family, even though they look more like hamsters.',
    },
    {
      id: 'rock-piles',
      unlock: 'photographed',
      text: 'Pikas favor rocky areas and are common in rock piles. Listen for their sharp, distinctive bark and watch for movement.',
    },
    {
      id: 'distance',
      unlock: 'responsible',
      text: 'Rocky Mountain asks you to stay at least 75 feet (23 m) from all wildlife. For black bears, moose and mountain lions it recommends at least 120 feet (36 m).',
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
      id: 'summer-tundra',
      unlock: 'identified',
      text: 'On Rocky Mountain\'s Trail Ridge, bighorn sheep are commonly seen on the tundra in summer. They migrate in fall to lower elevations. In late spring and early summer they come down to Sheep Lakes to eat soil for minerals.',
    },
    {
      id: 'grass-and-cliffs',
      unlock: 'identified',
      text: 'Bighorn drop down to grasslands to eat large amounts of grass and shrubs quickly, then retreat to cliffs, away from predators, where they chew their food again as cud.',
    },
    {
      id: 'home-herd',
      unlock: 'photographed',
      text: 'Some herds were started by moving animals. The Badlands received twenty-two bighorn from Pike\'s Peak in Colorado in 1964, and now has about 250 of the roughly 80,000 bighorn in the United States. Rocky Mountain National Park is home to over 350 bighorn sheep, which were nearly extinct there in the 1950s.',
    },
    {
      id: 'few-predators',
      unlock: 'responsible',
      text: 'Adult bighorn in Badlands have few to no natural predators. The most common way for them to die is by accident or disease: a lamb that missteps climbing or descending a slope can take a fatal fall. Badlands asks visitors to stay at least 100 feet (30 m) from all wildlife; Rocky Mountain asks for at least 75 feet (23 m) from deer, bighorn sheep and elk.',
    },
    {
      id: 'groups',
      unlock: 'allVariants',
      text: 'Bighorn live in separate groups by sex and age. Ewes and lambs form large herds, while young rams leave their mother\'s herd at about two to four years old and join a bachelor group of up to ten rams, led by a dominant ram.',
    },
  ],
};

SPECIES_CATALOGUE['pronghorn'] = {
  id: 'pronghorn',
  name: 'Pronghorn',
  scientific: 'Antilocapra americana',
  safeDistanceM: 30.5,
  blurb:
    'A slim, tan-and-white animal of open prairie, often called "antelope". Fast and shy: it will bolt long before you get close.',
  variants: ['Pronghorn buck (pronged horns)', 'Pronghorn doe'],
  facts: [
    {
      id: 'not-antelope',
      unlock: 'identified',
      text: 'The pronghorn is sometimes called the "pronghorn antelope", but it is not a true antelope. It shows some of the same traits as the true antelopes of Asia and Africa.',
    },
    {
      id: 'markings',
      unlock: 'photographed',
      text: 'Pronghorn have white patches of fur on the rump, side, belly and throat. Males grow pronged horns up to a foot long, which give the animal its name, while females grow much smaller, straight horns.',
    },
    {
      id: 'speed',
      unlock: 'responsible',
      text: 'The pronghorn\'s most amazing trait is speed: it can run at about 55 miles per hour. It uses the open space of the prairie to evade predators, which is why it is so shy of people.',
    },
    {
      id: 'where',
      unlock: 'allVariants',
      text: 'In Badlands, pronghorn are most often seen in unbroken grassland. In the North Unit they live north of the Badlands Loop Road (SR 240) and in the Buffalo Gap National Grassland next to the park.',
    },
  ],
};

SPECIES_CATALOGUE['wild-horse'] = {
  id: 'wild-horse',
  name: 'Feral Horse',
  scientific: 'Equus caballus',
  safeDistanceM: 23.0,
  blurb:
    'The "wild horses" of the South Unit are feral: they descend from domestic stock. They graze in small bands and are often seen from the Scenic Loop Drive.',
  variants: ['Feral horse stallion', 'Feral horse mare'],
  facts: [
    {
      id: 'south-unit-only',
      unlock: 'identified',
      text: 'Feral horses live in the South Unit only. They are often visible from the Scenic Loop Drive and from Interstate 94.',
    },
    {
      id: 'cultural-resource',
      unlock: 'photographed',
      text: 'The horses descend from domestic stock. Today the park maintains them as a cultural resource, a reminder of the ranching days when Theodore Roosevelt lived in the badlands.',
    },
    {
      id: 'not-tame',
      unlock: 'responsible',
      text: 'Bison, feral horses and prairie dogs may seem tame, but they are wild animals and can be dangerous. Theodore Roosevelt National Park asks you to watch wildlife from at least 25 yards (23 m).',
    },
    {
      id: 'both',
      unlock: 'allVariants',
      text: 'Find both a stallion and a mare from a safe distance to complete the journal entry for the feral horse.',
    },
  ],
};

SPECIES_CATALOGUE['mule-deer'] = {
  id: 'mule-deer',
  name: 'Mule Deer',
  scientific: 'Odocoileus hemionus',
  safeDistanceM: 23.0,
  blurb:
    'A gray-brown deer with very big ears and a black-tipped white tail. It is the large mammal most often seen at Arches, usually at dawn and dusk.',
  variants: ['Mule deer buck (forked antlers)', 'Mule deer doe'],
  facts: [
    {
      id: 'dawn-dusk',
      unlock: 'identified',
      text: 'Mule deer are crepuscular, most active at dawn and dusk when it is cooler. Coyotes, porcupines, desert cottontails and black-tailed jackrabbits keep the same hours.',
    },
    {
      id: 'big-ears',
      unlock: 'photographed',
      text: 'The mule deer has big ears and a white tail with a black tip. The NPS photographs one standing among green plants in Arches.',
    },
    {
      id: 'lion-prey',
      unlock: 'responsible',
      text: 'In Utah, around 80% of a mountain lion\'s diet is mule deer, so the two are never far apart. Unlike mule deer, mountain lion sightings are very rare. Keep a safe distance from all wildlife (the game uses 23 m).',
    },
    {
      id: 'both',
      unlock: 'allVariants',
      text: 'Find both a buck and a doe from a safe distance to complete the journal entry for the mule deer.',
    },
  ],
};

SPECIES_CATALOGUE['kit-fox'] = {
  id: 'kit-fox',
  name: 'Kit Fox',
  scientific: 'Vulpes macrotis',
  safeDistanceM: 23.0,
  blurb:
    'A small, sandy desert fox with big upright ears and a bushy tail. It is shy and rarely seen, and the NPS says foxes are mostly active at night.',
  variants: ['Kit fox'],
  facts: [
    {
      id: 'night-fox',
      unlock: 'identified',
      text: 'Most desert animals are nocturnal, which helps them avoid predators and the hot daytime temperatures. Mostly nocturnal animals at Arches include kangaroo rats, woodrats, skunks, ringtails, foxes, bobcats, mountain lions, bats and owls.',
    },
    {
      id: 'rarely-seen',
      unlock: 'photographed',
      text: 'Arches is hot and has little water, which favors small mammals. Larger mammals such as foxes are not uncommon, but they are rarely seen.',
    },
    {
      id: 'brochure',
      unlock: 'responsible',
      text: 'The park brochure lists kit foxes among the animals you might see at Arches, though jackrabbits and cottontails are seen more often. Pets are not allowed on Arches trails, because dogs can frighten, injure or kill wild animals and pass diseases to them.',
    },
  ],
};

SPECIES_CATALOGUE['jackrabbit'] = {
  id: 'jackrabbit',
  name: 'Black-tailed Jackrabbit',
  scientific: 'Lepus californicus',
  safeDistanceM: 23.0,
  blurb:
    'A long-eared hare of the open desert. It sits still until you come close, then bounds away in a zigzag.',
  variants: ['Black-tailed jackrabbit'],
  facts: [
    {
      id: 'dawn-dusk-hare',
      unlock: 'identified',
      text: 'Black-tailed jackrabbits are crepuscular: they are active in the early morning and late evening, when temperatures are cooler.',
    },
    {
      id: 'hare',
      unlock: 'photographed',
      text: 'The jackrabbit is not really a rabbit, but a hare. The NPS says it can often be seen bounding away on a zigzag course.',
    },
    {
      id: 'dont-approach',
      unlock: 'responsible',
      text: 'The park brochure says jackrabbits and cottontails are seen more often at Arches than foxes. Remember: do not approach wildlife.',
    },
  ],
};

SPECIES_CATALOGUE['coyote'] = {
  id: 'coyote',
  name: 'Coyote',
  scientific: 'Canis latrans',
  safeDistanceM: 23.0,
  blurb:
    'A gray-tan wild dog of the desert, bigger than a kit fox, with upright ears and a bushy tail held low. Shy, and most often seen at dawn and dusk.',
  variants: ['Coyote'],
  facts: [
    {
      id: 'dawn-dusk-coyote',
      unlock: 'identified',
      text: 'Coyotes are crepuscular, most active at dawn and dusk, the cooler times of day. Mule deer, porcupines, desert cottontails and black-tailed jackrabbits keep the same hours.',
    },
    {
      id: 'wary',
      unlock: 'photographed',
      text: 'Many desert animals are either inactive during daylight hours or wary of humans, so seeing one can be a special event.',
    },
    {
      id: 'keep-wild',
      unlock: 'responsible',
      text: 'Arches asks you not to handle or feed wildlife, even if it looks distressed. Many wild animals in the park carry life-threatening diseases that can spread to humans, such as rabies, hantavirus and plague.',
    },
  ],
};

SPECIES_CATALOGUE['mountain-lion'] = {
  id: 'mountain-lion',
  name: 'Mountain Lion',
  scientific: 'Puma concolor',
  safeDistanceM: 46.0,
  blurb:
    'A big, tawny cat with a long tail, also called a cougar or puma. Sightings are very rare, and it avoids people.',
  variants: ['Mountain lion'],
  facts: [
    {
      id: 'names',
      unlock: 'identified',
      text: 'Mountain lions are also called cougars, pumas, panthers and catamounts.',
    },
    {
      id: 'deer-eater',
      unlock: 'photographed',
      text: 'In Utah, around 80% of a mountain lion\'s diet is mule deer, so the two are never far apart. Unlike mule deer, mountain lion sightings are very rare.',
    },
    {
      id: 'safety',
      unlock: 'responsible',
      text: 'Do not approach a mountain lion; most try to avoid a confrontation, so give them a way to escape. Do not run, because running may trigger the chase instinct. Stand and face the animal, make eye contact, and try to look larger. Typical sightings are from a distance, around dawn or dusk, and should be reported to a ranger. Arches and Canyonlands recommend 150 feet (46 m) from large animals such as black bears; the game uses 46 m for the lion.',
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
  if (ids.size === 0 && !park) ids.add('white-tailed-deer'); // only for an unknown park; a known park with no animals (Arches) really has none
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
