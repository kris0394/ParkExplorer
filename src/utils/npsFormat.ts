/**
 * TASK 12: turns raw NPS API records into the small, clean, safe shape the game shows.
 * Used by the build-time download script and by the tests. Contains no network code.
 */

export type NpsAlertCategory = 'Danger' | 'Park Closure' | 'Caution' | 'Information';

export interface NpsAlert {
  id: string;
  category: NpsAlertCategory;
  title: string;
  description: string;
  url: string;
}

export interface NpsParkInfo {
  parkCode: string;
  fullName: string;
  designation: string;
  states: string;
  description: string;
  weatherInfo: string;
  url: string;
}

export interface NpsData {
  parkCode: string;
  /** ISO time the data was downloaded (build time). */
  fetchedAt: string;
  park: NpsParkInfo;
  alerts: NpsAlert[];
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&rsquo;': '\u2019',
  '&lsquo;': '\u2018',
  '&rdquo;': '\u201D',
  '&ldquo;': '\u201C',
  '&ndash;': '\u2013',
  '&mdash;': '\u2014',
};

/** Removes HTML, decodes common entities, collapses spaces, and limits length. */
export function cleanText(input: unknown, maxLen = 600): string {
  if (typeof input !== 'string') return '';
  let s = input
    .replace(/<\s*(br|\/p|\/li|\/div)\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|quot|apos|nbsp|rsquo|lsquo|rdquo|ldquo|ndash|mdash|#39);/g, m => ENTITIES[m] ?? m)
    .replace(/&#(\d{2,5});/g, (_m, n) => {
      const code = Number(n);
      return code > 31 && code < 65536 ? String.fromCharCode(code) : '';
    })
    .replace(/\s+/g, ' ')
    .trim();
  if (s.length > maxLen) {
    s = s.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '\u2026';
  }
  return s;
}

/** Only links to nps.gov are kept (anything else becomes an empty string). */
export function safeNpsUrl(input: unknown): string {
  if (typeof input !== 'string') return '';
  try {
    const u = new URL(input.trim());
    const host = u.hostname.toLowerCase();
    if (u.protocol !== 'https:') return '';
    if (host === 'nps.gov' || host.endsWith('.nps.gov')) return u.toString();
  } catch {
    /* not a URL */
  }
  return '';
}

const CATEGORY_ORDER: NpsAlertCategory[] = ['Danger', 'Park Closure', 'Caution', 'Information'];

function normaliseCategory(c: unknown): NpsAlertCategory {
  const found = CATEGORY_ORDER.find(x => x.toLowerCase() === String(c ?? '').trim().toLowerCase());
  return found ?? 'Information';
}

export function shapeNpsData(
  parkCode: string,
  rawPark: any,
  rawAlerts: any[],
  fetchedAt: string
): NpsData | null {
  if (!rawPark || typeof rawPark !== 'object') return null;
  const alerts: NpsAlert[] = (Array.isArray(rawAlerts) ? rawAlerts : [])
    .filter(a => a && typeof a === 'object')
    .map(a => ({
      id: String(a.id ?? ''),
      category: normaliseCategory(a.category),
      title: cleanText(a.title, 160),
      description: cleanText(a.description, 500),
      url: safeNpsUrl(a.url),
    }))
    .filter(a => a.title)
    .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category))
    .slice(0, 12);

  return {
    parkCode,
    fetchedAt,
    park: {
      parkCode,
      fullName: cleanText(rawPark.fullName, 120),
      designation: cleanText(rawPark.designation, 60),
      states: cleanText(rawPark.states, 60),
      description: cleanText(rawPark.description, 600),
      weatherInfo: cleanText(rawPark.weatherInfo, 500),
      url: safeNpsUrl(rawPark.url) || `https://www.nps.gov/${parkCode}/`,
    },
    alerts,
  };
}
