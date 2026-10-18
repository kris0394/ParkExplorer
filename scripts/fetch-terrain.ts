/**
 * TASK 15: downloads free elevation tiles at BUILD time and turns them into a small relief grid.
 *
 * Source: Terrain Tiles on AWS (Terrarium PNG tiles), public, no key needed.
 * Output: public/terrain/<id>.json (not committed; Vite copies it into the site).
 *
 * If a download fails, the build still succeeds and the game uses its built-in landscape.
 * Run by hand with:  npm run fetch:terrain
 */
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import { AVAILABLE_PARKS } from '../src/data/parks.ts';
import { hillStats } from '../src/terrain/hillStats.ts';
import {
  ReliefData,
  HeightTiles,
  TILE_SIZE,
  buildRelief,
  decodeTilePixels,
  gridSize,
  sampleGrid,
  tileKey,
  tilesForGrid,
} from '../src/utils/terrainBuild.ts';

const TILE_BASE = process.env.TERRAIN_TILE_BASE || 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium';
const OUT_DIR = path.resolve('public', 'terrain');
const ATTRIBUTION = {
  text: 'Elevation: Terrain Tiles on AWS (Mapzen), which includes USGS 3DEP and other public elevation data.',
  url: 'https://registry.opendata.aws/terrain-tiles',
};

async function getTile(z: number, x: number, y: number): Promise<Buffer> {
  const url = `${TILE_BASE}/${z}/${x}/${y}.png`;
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

async function main() {
  const targets = AVAILABLE_PARKS.filter(p => p.realTerrain);
  if (targets.length === 0) return;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let ok = 0;

  for (const park of targets) {
    const rt = park.realTerrain!;
    try {
      const spec = {
        centerLat: rt.centerLat,
        centerLon: rt.centerLon,
        originX: rt.originX,
        originZ: rt.originZ,
        sizeM: rt.sizeM,
        stepM: rt.stepM,
        zoom: rt.zoom,
      };
      const wanted = tilesForGrid(spec);
      const tiles: HeightTiles = new Map();
      for (const t of wanted) {
        const png = PNG.sync.read(await getTile(t.z, t.x, t.y));
        if (png.width !== TILE_SIZE || png.height !== TILE_SIZE) throw new Error('unexpected tile size');
        tiles.set(tileKey(t.z, t.x, t.y), decodeTilePixels(png.data));
      }
      const n = gridSize(spec);
      const heights = sampleGrid(tiles, spec);
      const target = hillStats(park.terrain).std;
      const { reliefM, stats } = buildRelief(heights, n, rt.stepM, {
        detrendSigmaM: rt.detrendSigmaM,
        targetRmsM: target,
      });
      if (stats.realMaxM - stats.realMinM < 5) throw new Error('the downloaded area looks flat, refusing to use it');

      const data: ReliefData = {
        version: 1,
        parkId: park.id,
        featureName: rt.featureName,
        centerLat: rt.centerLat,
        centerLon: rt.centerLon,
        zoom: rt.zoom,
        originX: rt.originX,
        originZ: rt.originZ,
        sizeM: rt.sizeM,
        stepM: rt.stepM,
        n,
        reliefCm: Array.from(reliefM, v => Math.round(v * 100)),
        mix: rt.mix,
        stats,
        attribution: ATTRIBUTION,
        fetchedAt: new Date().toISOString(),
      };
      fs.writeFileSync(path.join(OUT_DIR, `${rt.id}.json`), JSON.stringify(data), 'utf8');
      console.log(
        `[terrain] ${rt.id}: saved. ${wanted.length} tiles, real elevation ${stats.realMinM} to ${stats.realMaxM} m, ` +
          `relief rms ${stats.realReliefRmsM} m (target ${stats.targetRmsM} m, shown at ${Math.round(stats.scale * 100)}%), ` +
          `steepest ${stats.maxSlopePercent}%`
      );
      if (stats.scale < 0.2) console.log(`[terrain] ${rt.id}: note: the real relief here is gentle, so the effect will be subtle`);
      ok++;
    } catch (e) {
      console.log(`[terrain] ${rt.id}: could not build (${(e as Error).message}). The game will use its built-in landscape.`);
    }
  }
  console.log(`[terrain] done: ${ok} of ${targets.length} park(s) saved`);
}

main().catch(e => {
  console.log('[terrain] unexpected problem, continuing without real terrain:', (e as Error).message);
});
