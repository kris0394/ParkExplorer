/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SightingRecord } from './binoculars.ts';
import { ScoredPhoto } from './photography.ts';
import { getSpeciesIdFromName, SPECIES_CATALOGUE } from '../data/species.ts';

export interface ActivityEntry {
  id: number;
  time: number;
  title: string;
  detail: string;
  credits: number;
  stewardship: number;
  good: boolean;
}

export interface SpeciesJournalEntry {
  firstSeen: number;
  parks: string[];
  variantsIdentified: string[];
  responsibleCount: number;
  disturbedCount: number;
  photographed: boolean;
  photoCount: number;
  bestPhotoScore: number;
  bestPhotoId: string | null;
  note: string;
}

export interface LandmarkJournalEntry {
  discovered: boolean;
  firstFound: number;
  photographed: boolean;
  bestPhotoScore: number;
  note: string;
}

export interface ParkJournalEntry {
  name: string;
  visits: number;
  firstVisit: number;
  lastVisit: number;
  landmarks: Record<string, LandmarkJournalEntry>;
  identified: Record<string, string[]>; // speciesId -> variant names
  photographed: Record<string, boolean>; // speciesId -> true
}

export interface ShopItem {
  id: string;
  name: string;
  category: 'water' | 'navigation' | 'optics' | 'camera' | 'safety';
  price: number;
  iconName: string;
  shortDesc: string;
  capability: string;
  tier?: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'compass_map',
    name: 'Orienteering Compass & Topo Map',
    category: 'navigation',
    price: 25,
    iconName: 'compass',
    shortDesc: 'Handheld liquid-filled magnetic compass and USGS topographical trail map.',
    capability: 'Press [K] or click to raise/lower the handheld compass. Shows true bearing, magnetic needle, elevation contours, and trailhead locations.',
  },
  {
    id: 'canteen_standard',
    name: 'Stainless Steel Trail Canteen (1.0 L)',
    category: 'water',
    price: 20,
    iconName: 'droplet',
    shortDesc: 'Insulated double-wall canteen for mountain hydration.',
    capability: 'Carries 1.0 L of clean water. Press [X] to drink and restore hydration. Refillable at treated potable trailhead fountains.',
    tier: 1,
  },
  {
    id: 'canteen_pro',
    name: 'Expedition Hydration Reservoir (2.5 L)',
    category: 'water',
    price: 60,
    iconName: 'droplet',
    shortDesc: 'Heavy-duty insulated backpack bladder with high-flow bite valve.',
    capability: 'Increases water capacity to 2.5 L. Cuts hydration drain while hiking by 30%.',
    tier: 2,
  },
  {
    id: 'binoculars_ed',
    name: '10×42 ED Wildlife Binoculars',
    category: 'optics',
    price: 55,
    iconName: 'binoculars',
    shortDesc: 'Extra-low dispersion multi-coated glass binoculars.',
    capability: 'Expands maximum zoom to 5.5× with a wider field of view. Cuts animal identification time from 2.8s down to 1.8s, with crisp twilight clarity.',
  },
  {
    id: 'lens_telephoto',
    name: '70–300mm Image-Stabilized Lens',
    category: 'camera',
    price: 75,
    iconName: 'camera',
    shortDesc: 'Precision telephoto zoom lens with optical stabilization.',
    capability: 'Boosts camera zoom up to 5.8×. Built-in stabilization eliminates walking shake penalties, allowing tack-sharp wildlife photos from 35m+ safe distance.',
  },
  {
    id: 'first_aid',
    name: 'Wilderness First-Aid & Electrolytes',
    category: 'safety',
    price: 30,
    iconName: 'heart-pulse',
    shortDesc: 'Compact backcountry medical kit with electrolyte packets.',
    capability: 'Doubles stamina regeneration rate when resting or walking, reducing mountain climb fatigue.',
  },
  {
    id: 'bear_bell_whistle',
    name: 'Trail Safety Bell & Rescue Whistle',
    category: 'safety',
    price: 15,
    iconName: 'bell',
    shortDesc: 'Acoustic trail chime and pealess 115dB emergency whistle.',
    capability: 'Gentle cadence alerts resting wildlife so you don’t startle them on blind corners, preventing sudden alert/flee reactions.',
  },
];

export interface SaveData {
  saveVersion: number;
  credits: number;
  stewardship: number;
  species: Record<string, SpeciesJournalEntry>;
  parks: Record<string, ParkJournalEntry>;
  credited: Record<string, number>;
  photoBest: Record<string, number>;
  ownedEquipment: Record<string, boolean>;
  isCompassEquipped: boolean;
  hydration: number; // 0 - 100
  waterLiters: number; // current water carried
  maxWaterLiters: number; // total capacity
  stats: {
    sightings: number;
    responsibleSightings: number;
    photos: number;
    responsiblePhotos: number;
    tooClose: number;
    bestPhotoScore: number;
    waterDrunk: number;
  };
  activity: ActivityEntry[];
  nextActivityId: number;
}

export const REWARDS = {
  sightingCredits: 8,
  sightingStewardship: 2,
  newSpeciesCredits: 15,
  landmarkCredits: 5,
  photoCreditsDivisor: 4,
  goodPhotoScore: 70,
  tooClosePenalty: 2,
};

export const STEWARDSHIP_RANKS = [
  { at: 0, title: 'New Explorer' },
  { at: 10, title: 'Responsible Hiker' },
  { at: 30, title: 'Wildlife Observer' },
  { at: 60, title: 'Nature Steward' },
  { at: 100, title: 'Park Guardian' },
];

export function getStewardshipRank(score: number): {
  title: string;
  next: { at: number; title: string } | null;
  progress: number;
} {
  let cur = 0;
  for (let i = 0; i < STEWARDSHIP_RANKS.length; i++) {
    if (score >= STEWARDSHIP_RANKS[i].at) {
      cur = i;
    }
  }
  const current = STEWARDSHIP_RANKS[cur];
  const next = STEWARDSHIP_RANKS[cur + 1] ?? null;
  const span = next ? next.at - current.at : 1;
  const prog = next ? (score - current.at) / span : 1.0;
  return {
    title: current.title,
    next,
    progress: Math.max(0, Math.min(1, prog)),
  };
}

const STORAGE_KEY = 'park-explorer-save';

function defaultSaveData(): SaveData {
  return {
    saveVersion: 2,
    credits: 30, // Starting grant so player can try out the equipment shop!
    stewardship: 0,
    species: {},
    parks: {},
    credited: {},
    photoBest: {},
    ownedEquipment: {
      canteen_standard: true, // Everyone starts with a reliable basic canteen
    },
    isCompassEquipped: false,
    hydration: 100,
    waterLiters: 1.0,
    maxWaterLiters: 1.0,
    stats: {
      sightings: 0,
      responsibleSightings: 0,
      photos: 0,
      responsiblePhotos: 0,
      tooClose: 0,
      bestPhotoScore: 0,
      waterDrunk: 0,
    },
    activity: [],
    nextActivityId: 1,
  };
}

function migrateSaveData(raw: unknown): SaveData {
  const def = defaultSaveData();
  if (!raw || typeof raw !== 'object') return def;
  const o = raw as Record<string, unknown>;

  const owned = (o.ownedEquipment && typeof o.ownedEquipment === 'object')
    ? (o.ownedEquipment as Record<string, boolean>)
    : { canteen_standard: true };

  let maxW = 1.0;
  if (owned.canteen_pro) maxW = 2.5;
  else if (owned.canteen_standard) maxW = 1.0;

  return {
    ...def,
    ...o,
    saveVersion: 2,
    credits: Math.max(0, Number(o.credits) || 0),
    stewardship: Math.max(0, Number(o.stewardship) || 0),
    species: (o.species && typeof o.species === 'object') ? (o.species as Record<string, SpeciesJournalEntry>) : {},
    parks: (o.parks && typeof o.parks === 'object') ? (o.parks as Record<string, ParkJournalEntry>) : {},
    credited: (o.credited && typeof o.credited === 'object') ? (o.credited as Record<string, number>) : {},
    photoBest: (o.photoBest && typeof o.photoBest === 'object') ? (o.photoBest as Record<string, number>) : {},
    ownedEquipment: owned,
    isCompassEquipped: Boolean(o.isCompassEquipped),
    hydration: typeof o.hydration === 'number' ? Math.max(0, Math.min(100, o.hydration)) : 100,
    waterLiters: typeof o.waterLiters === 'number' ? Math.max(0, Math.min(maxW, o.waterLiters)) : maxW,
    maxWaterLiters: maxW,
    stats: {
      ...def.stats,
      ...((o.stats as Record<string, number>) ?? {}),
    },
    activity: Array.isArray(o.activity) ? o.activity.slice(0, 50) : [],
    nextActivityId: Number(o.nextActivityId) || 1,
  };
}

function newSpeciesEntry(): SpeciesJournalEntry {
  return {
    firstSeen: Date.now(),
    parks: [],
    variantsIdentified: [],
    responsibleCount: 0,
    disturbedCount: 0,
    photographed: false,
    photoCount: 0,
    bestPhotoScore: 0,
    bestPhotoId: null,
    note: '',
  };
}

function newParkEntry(name: string): ParkJournalEntry {
  const now = Date.now();
  return {
    name,
    visits: 0,
    firstVisit: now,
    lastVisit: now,
    landmarks: {},
    identified: {},
    photographed: {},
  };
}

function newLandmarkEntry(): LandmarkJournalEntry {
  return {
    discovered: false,
    firstFound: 0,
    photographed: false,
    bestPhotoScore: 0,
    note: '',
  };
}

export interface ProgressSnapshot {
  data: SaveData;
  feed: ActivityEntry[];
  saveError: boolean;
}

class ProgressStore {
  private snapshot: ProgressSnapshot;
  private listeners = new Set<() => void>();
  private saveTimer: number | null = null;

  constructor() {
    this.snapshot = {
      data: this.load(),
      feed: [],
      saveError: false,
    };
  }

  public getSnapshot = (): ProgressSnapshot => this.snapshot;

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public getPhotoBest(key: string): number {
    return this.snapshot.data.photoBest[key] ?? 0;
  }

  public isOwned(itemId: string): boolean {
    return Boolean(this.snapshot.data.ownedEquipment[itemId]);
  }

  private load(): SaveData {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return migrateSaveData(JSON.parse(raw));
      }
    } catch {
      // Ignore
    }
    return defaultSaveData();
  }

  private scheduleSave(): void {
    if (this.saveTimer !== null) {
      window.clearTimeout(this.saveTimer);
    }
    this.saveTimer = window.setTimeout(() => this.saveNow(), 400);
  }

  public saveNow(): void {
    this.saveTimer = null;
    let err = false;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.snapshot.data));
    } catch {
      err = true;
    }
    if (err !== this.snapshot.saveError) {
      this.snapshot = { ...this.snapshot, saveError: err };
      this.notify();
    }
  }

  private notify(): void {
    this.listeners.forEach(l => l());
  }

  private commit(nextData: SaveData, toast?: ActivityEntry): void {
    let feed = this.snapshot.feed;
    if (toast) {
      feed = [...feed, toast].slice(-6);
    }
    this.snapshot = { ...this.snapshot, data: nextData, feed };
    this.scheduleSave();
    this.notify();
  }

  private award(
    d: SaveData,
    title: string,
    detail: string,
    credits: number,
    stewardship: number,
    good: boolean
  ): ActivityEntry {
    d.credits = Math.max(0, d.credits + credits);
    d.stewardship = Math.max(0, d.stewardship + stewardship);
    const entry: ActivityEntry = {
      id: d.nextActivityId++,
      time: Date.now(),
      title,
      detail,
      credits,
      stewardship,
      good,
    };
    d.activity = [entry, ...d.activity].slice(0, 50);
    return entry;
  }

  public buyEquipment(itemId: string): { success: boolean; message: string } {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return { success: false, message: 'Item not found' };

    const d = structuredClone(this.snapshot.data);
    if (d.ownedEquipment[itemId]) {
      return { success: false, message: 'You already own this equipment.' };
    }
    if (d.credits < item.price) {
      return { success: false, message: `Need ${item.price} Credits (you have ${d.credits}).` };
    }

    d.credits -= item.price;
    d.ownedEquipment[itemId] = true;

    // Apply immediate gear adjustments
    if (itemId === 'compass_map') {
      d.isCompassEquipped = true;
    } else if (itemId === 'canteen_pro') {
      d.maxWaterLiters = 2.5;
      d.waterLiters = Math.max(d.waterLiters, 2.5);
    }

    const toast = this.award(
      d,
      `Equipment Acquired: ${item.name}`,
      item.shortDesc,
      0,
      1,
      true
    );
    this.commit(d, toast);
    return { success: true, message: `Purchased ${item.name}!` };
  }

  public toggleCompass(): boolean {
    const d = structuredClone(this.snapshot.data);
    if (!d.ownedEquipment.compass_map) {
      return false;
    }
    d.isCompassEquipped = !d.isCompassEquipped;
    this.commit(d);
    return d.isCompassEquipped;
  }

  public drinkWater(): { success: boolean; message: string; hydration: number } {
    const d = structuredClone(this.snapshot.data);
    if (d.waterLiters <= 0.05) {
      return {
        success: false,
        message: 'Your water canteen is empty! Refill at the potable trailhead fountain.',
        hydration: d.hydration,
      };
    }

    if (d.hydration >= 98) {
      return {
        success: false,
        message: 'Already fully hydrated (100%). Save your water for strenuous climbs!',
        hydration: d.hydration,
      };
    }

    const sipAmount = 0.25; // 250ml
    const actualSip = Math.min(d.waterLiters, sipAmount);
    d.waterLiters = Math.max(0, d.waterLiters - actualSip);
    d.hydration = Math.min(100, d.hydration + 35);
    d.stats.waterDrunk = (d.stats.waterDrunk || 0) + actualSip;

    const toast = this.award(
      d,
      'Refreshed with Trail Water',
      `Drank clean water from canteen (${d.waterLiters.toFixed(2)} L remaining). Hydration restored.`,
      0,
      0,
      true
    );
    this.commit(d, toast);
    return { success: true, message: `Hydration restored to ${Math.round(d.hydration)}%`, hydration: d.hydration };
  }

  public refillWater(stationName: string = 'Trailhead Water Station'): { success: boolean; message: string } {
    const d = structuredClone(this.snapshot.data);
    d.waterLiters = d.maxWaterLiters;
    d.hydration = 100;

    const toast = this.award(
      d,
      `Refilled at ${stationName}`,
      `Filled canteen with ${d.maxWaterLiters.toFixed(1)} L of treated potable water. Safe and cold!`,
      0,
      1,
      true
    );
    this.commit(d, toast);
    return { success: true, message: `Refilled to ${d.maxWaterLiters.toFixed(1)} L clean water!` };
  }

  public updateHydrationDrain(dt: number, isSprinting: boolean, isMoving: boolean): void {
    const d = structuredClone(this.snapshot.data);
    const hasBladder = Boolean(d.ownedEquipment.canteen_pro);
    const hasElectrolytes = Boolean(d.ownedEquipment.first_aid);

    let drainRate = 0.4; // % per minute resting
    if (isMoving) drainRate = 1.6;
    if (isSprinting) drainRate = 4.2;

    if (hasBladder) drainRate *= 0.7;
    if (hasElectrolytes) drainRate *= 0.8;

    const drain = (drainRate / 60) * dt;
    d.hydration = Math.max(0, d.hydration - drain);

    // Save periodically
    this.snapshot = { ...this.snapshot, data: d };
    this.scheduleSave();
    this.notify();
  }

  public visitPark(parkId: string, parkName: string): void {
    const d = structuredClone(this.snapshot.data);
    const p = (d.parks[parkId] ??= newParkEntry(parkName));
    p.name = parkName;
    p.visits += 1;
    p.lastVisit = Date.now();
    this.commit(d);
  }

  public discoverLandmark(
    parkId: string,
    parkName: string,
    landmark: { id: string; name: string }
  ): ActivityEntry | null {
    if (this.snapshot.data.parks[parkId]?.landmarks[landmark.id]?.discovered) {
      return null;
    }
    const d = structuredClone(this.snapshot.data);
    const p = (d.parks[parkId] ??= newParkEntry(parkName));
    const lm = (p.landmarks[landmark.id] ??= newLandmarkEntry());
    lm.discovered = true;
    lm.firstFound = Date.now();

    if (landmark.id === 'spawn') {
      this.commit(d);
      return null;
    }

    const toast = this.award(
      d,
      `Discovered: ${landmark.name}`,
      'Logged into the Places catalogue in your Field Journal.',
      REWARDS.landmarkCredits,
      0,
      true
    );
    this.commit(d, toast);
    return toast;
  }

  public recordSighting(
    sighting: SightingRecord,
    parkId: string,
    parkName: string
  ): ActivityEntry {
    const d = structuredClone(this.snapshot.data);
    const speciesId = getSpeciesIdFromName(sighting.species);
    const sp = (d.species[speciesId] ??= newSpeciesEntry());
    const pk = (d.parks[parkId] ??= newParkEntry(parkName));

    if (!sp.parks.includes(parkId)) sp.parks.push(parkId);
    if (!sp.variantsIdentified.includes(sighting.detail)) {
      sp.variantsIdentified.push(sighting.detail);
    }
    d.stats.sightings += 1;

    let toast: ActivityEntry;
    const roundedDist = Math.round(sighting.distance);

    if (sighting.responsible) {
      const parkList = (pk.identified[speciesId] ??= []);
      if (!parkList.includes(sighting.detail)) parkList.push(sighting.detail);

      sp.responsibleCount += 1;
      d.stats.responsibleSightings += 1;

      let cr = 0;
      let st = 0;
      let title = `Observed: ${sighting.detail}`;
      let detail = `Watched calmly from ${roundedDist} m. Already catalogued.`;

      const variantKey = `sight:${parkId}:${speciesId}:${sighting.detail}`;
      if (!d.credited[variantKey]) {
        d.credited[variantKey] = Date.now();
        cr += REWARDS.sightingCredits;
        st += REWARDS.sightingStewardship;
        title = `Identified: ${sighting.detail}`;
        detail = `Observed from safe distance (${roundedDist} m).`;
      }

      const speciesKey = `species:${speciesId}`;
      if (!d.credited[speciesKey]) {
        d.credited[speciesKey] = Date.now();
        cr += REWARDS.newSpeciesCredits;
        title = `New Species: ${sighting.species}`;
        detail = `${sighting.detail}, observed from ${roundedDist} m. Sighting page opened in Field Journal.`;
      }

      toast = this.award(d, title, detail, cr, st, true);
    } else {
      sp.disturbedCount += 1;
      d.stats.tooClose += 1;
      const warning =
        sighting.distance < 23
          ? `Within ${roundedDist} m. Respect wildlife space by keeping 25 yards (23 m) clearance.`
          : 'Animal was alert. Stand quietly or back away to allow it to graze peacefully.';

      toast = this.award(
        d,
        `Identified, but disturbed: ${sighting.detail}`,
        warning,
        0,
        -REWARDS.tooClosePenalty,
        false
      );
    }

    this.commit(d, toast);
    return toast;
  }

  public recordPhoto(
    photo: ScoredPhoto,
    parkId: string,
    parkName: string,
    subjectKey: string
  ): ActivityEntry {
    const d = structuredClone(this.snapshot.data);
    const pk = (d.parks[parkId] ??= newParkEntry(parkName));
    d.stats.photos += 1;

    const prevBest = d.photoBest[subjectKey] ?? 0;
    const speciesId = photo.kind === 'wildlife' ? getSpeciesIdFromName(photo.subject) : null;
    const sp = speciesId ? (d.species[speciesId] ??= newSpeciesEntry()) : null;

    if (sp) sp.photoCount += 1;

    let credits = 0;
    let stewardship = 0;
    let title = `Photo: ${photo.subject}`;
    let detail = '';
    let good = true;

    if (photo.kind === 'wildlife' && !photo.responsible) {
      d.stats.tooClose += 1;
      stewardship = -REWARDS.tooClosePenalty;
      good = false;
      title = 'Disturbed Wildlife Photography';
      detail =
        photo.distance < 23
          ? `Taken at ${Math.round(photo.distance)} m. Back away to safe distance (23 m+) and use zoom.`
          : 'Animal was fleeing or alert. Wait patiently for calm grazing.';
    } else {
      d.stats.responsiblePhotos += 1;
      d.stats.bestPhotoScore = Math.max(d.stats.bestPhotoScore, photo.score);

      if (photo.score > prevBest) {
        credits = Math.floor((photo.score - prevBest) / REWARDS.photoCreditsDivisor);
        d.photoBest[subjectKey] = photo.score;
        if (photo.kind === 'wildlife' && photo.score >= REWARDS.goodPhotoScore && prevBest < REWARDS.goodPhotoScore) {
          stewardship = 1;
        }
        detail = prevBest === 0 ? `Score: ${photo.score}.` : `New personal best: ${photo.score} (was ${prevBest}).`;
      } else {
        detail = `Score: ${photo.score}. Beat previous best of ${prevBest} to earn additional credits.`;
      }

      if (sp && speciesId) {
        sp.photographed = true;
        pk.photographed[speciesId] = true;
        if (photo.score > sp.bestPhotoScore) {
          sp.bestPhotoScore = photo.score;
          sp.bestPhotoId = photo.id;
        }
      }

      if (photo.kind === 'landmark') {
        const lmId = subjectKey.split(':').slice(2).join(':');
        const lm = (pk.landmarks[lmId] ??= newLandmarkEntry());
        if (!lm.discovered) {
          lm.discovered = true;
          lm.firstFound = Date.now();
        }
        lm.photographed = true;
        lm.bestPhotoScore = Math.max(lm.bestPhotoScore, photo.score);
      }
    }

    const toast = this.award(d, title, detail, credits, stewardship, good);
    this.commit(d, toast);
    return toast;
  }

  public setNote(kind: 'species' | 'landmark', id: string, parkId: string, note: string): void {
    const d = structuredClone(this.snapshot.data);
    if (kind === 'species') {
      const sp = d.species[id];
      if (!sp) return;
      sp.note = note.slice(0, 2000);
    } else {
      const lm = d.parks[parkId]?.landmarks[id];
      if (!lm) return;
      lm.note = note.slice(0, 2000);
    }
    this.commit(d);
  }

  public exportData(): SaveData {
    return structuredClone(this.snapshot.data);
  }

  public importData(imported: unknown): void {
    this.commit(migrateSaveData(imported));
    this.saveNow();
  }

  public reset(): void {
    this.snapshot = {
      data: defaultSaveData(),
      feed: [],
      saveError: false,
    };
    this.saveNow();
    this.notify();
  }
}

export const progress = new ProgressStore();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => progress.saveNow());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') progress.saveNow();
  });
}

export function computeParkStats(
  save: SaveData,
  parkId: string,
  landmarks: { id: string }[]
): {
  landmarksFound: number;
  landmarksTotal: number;
  wildlifeIdentified: number;
  wildlifeTotal: number;
  photographed: number;
  photographedTotal: number;
  percent: number;
} {
  const p = save.parks[parkId];
  const speciesList = ['white-tailed-deer'];
  const lTotal = landmarks.length;
  const lFound = landmarks.filter(lm => p?.landmarks[lm.id]?.discovered).length;

  let wTotal = 0;
  let wIdentified = 0;
  let sPhotographed = 0;

  for (const spId of speciesList) {
    const def = SPECIES_CATALOGUE[spId];
    if (def) {
      wTotal += def.variants.length;
      const seen = p?.identified[spId] ?? [];
      wIdentified += seen.filter(v => def.variants.includes(v)).length;
      if (p?.photographed[spId]) sPhotographed += 1;
    }
  }

  const lmPhotographed = landmarks.filter(lm => p?.landmarks[lm.id]?.photographed).length;
  const photoTotal = speciesList.length + lTotal;
  const photoDone = sPhotographed + lmPhotographed;

  const parts = [
    lTotal ? lFound / lTotal : 1,
    wTotal ? wIdentified / wTotal : 1,
    photoTotal ? photoDone / photoTotal : 1,
  ];
  const percent = Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100);

  return {
    landmarksFound: lFound,
    landmarksTotal: lTotal,
    wildlifeIdentified: wIdentified,
    wildlifeTotal: wTotal,
    photographed: photoDone,
    photographedTotal: photoTotal,
    percent,
  };
}
