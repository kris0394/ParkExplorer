/**
 * TASK 12: downloads real National Park Service info and alerts at BUILD time.
 *
 * The NPS API key is read from the environment variable NPS_API_KEY (a GitHub
 * Actions secret). It is sent only in a request header and is never written to
 * any file, so it cannot end up in the game page.
 *
 * Output: public/nps/<parkCode>.json (git-ignored, copied into the site by Vite).
 * If there is no key, or a request fails, the build still succeeds and the game
 * simply shows "live NPS information not available".
 *
 * Run by hand with:  NPS_API_KEY=... npm run fetch:nps
 */
import fs from 'fs';
import path from 'path';
import { AVAILABLE_PARKS } from '../src/data/parks.ts';
import { cleanText, shapeNpsData } from '../src/utils/npsFormat.ts';

const BASE = process.env.NPS_API_BASE || 'https://developer.nps.gov/api/v1';
const KEY = process.env.NPS_API_KEY || '';
const OUT_DIR = path.resolve('public', 'nps');

async function getJson(endpoint: string, params: Record<string, string>): Promise<any> {
  const url = `${BASE}${endpoint}?${new URLSearchParams(params).toString()}`;
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'X-Api-Key': KEY, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

async function main() {
  const targets = AVAILABLE_PARKS.filter(p => p.npsParkCode);
  if (!KEY) {
    console.log('[nps] NPS_API_KEY is not set. Skipping the NPS download (the game will show "not available").');
    return;
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let ok = 0;
  for (const park of targets) {
    const code = park.npsParkCode!;
    try {
      const parks = await getJson('/parks', { parkCode: code, limit: '1' });
      const alerts = await getJson('/alerts', { parkCode: code, limit: '50' });
      const shaped = shapeNpsData(code, parks?.data?.[0], alerts?.data ?? [], new Date().toISOString());
      if (!shaped) {
        console.log(`[nps] ${code}: no park record returned, skipped`);
        continue;
      }
      fs.writeFileSync(path.join(OUT_DIR, `${code}.json`), JSON.stringify(shaped, null, 1), 'utf8');
      console.log(`[nps] ${code}: saved (${shaped.alerts.length} alerts)`);
      ok++;
    } catch (e) {
      // Never print the URL or headers: only a short reason
      console.log(`[nps] ${code}: could not download (${(e as Error).message}). Skipped.`);
    }
  }
  console.log(`[nps] done: ${ok} of ${targets.length} park(s) saved`);
  void cleanText;
}

main().catch(e => {
  console.log('[nps] unexpected problem, continuing without NPS data:', (e as Error).message);
});
