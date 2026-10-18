/**
 * TASK 15: pure maths for turning free elevation tiles into a small "relief grid" for the game.
 * No network and no files here, so it can be tested with made-up tiles.
 *
 * Source format: AWS "Terrain Tiles" in Terrarium encoding.
 *   height in metres = (red * 256 + green + blue / 256) - 32768
 */

export const TILE_SIZE = 256;
const METRES_PER_DEG_LAT = 111320;

export interface ReliefData {
  version: 1;
  parkId: string;
  featureName: string;
  centerLat: number;
  centerLon: number;
  zoom: number;
  /** World position (game metres) of the centre of the grid. */
  originX: number;
  originZ: number;
  sizeM: number;
  stepM: number;
  n: number;
  /** Detrended, scaled relief in centimetres. Row-major: index = j * n + i (i = west to east, j = north to south). */
  reliefCm: number[];
  /** How strongly the real relief replaces the procedural hills away from the trail (0 to 1). */
  mix: number;
  stats: {
    realMinM: number;
    realMaxM: number;
    realReliefRmsM: number;
    targetRmsM: number;
    /** Share of the real vertical relief that is shown (1 = true scale). */
    scale: number;
    maxSlopePercent: number;
  };
  attribution: { text: string; url: string };
  fetchedAt: string;
}

export function lonLatToTile(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const latRad = (lat * Math.PI) / 180;
  const x = ((lon + 180) / 360) * n;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

export function decodeTerrarium(r: number, g: number, b: number): number {
  return r * 256 + g + b / 256 - 32768;
}

/** Game position (x east, z south) to latitude and longitude around a centre point. */
export function worldToLatLon(
  x: number,
  z: number,
  originX: number,
  originZ: number,
  centerLat: number,
  centerLon: number
): { lat: number; lon: number } {
  const lat = centerLat - (z - originZ) / METRES_PER_DEG_LAT;
  const lon = centerLon + (x - originX) / (METRES_PER_DEG_LAT * Math.cos((centerLat * Math.PI) / 180));
  return { lat, lon };
}

export interface GridSpec {
  centerLat: number;
  centerLon: number;
  originX: number;
  originZ: number;
  sizeM: number;
  stepM: number;
  zoom: number;
}

export function gridSize(spec: GridSpec): number {
  return Math.round(spec.sizeM / spec.stepM) + 1;
}

/** Which tiles must be downloaded to cover the whole grid (with a one-pixel margin). */
export function tilesForGrid(spec: GridSpec): { z: number; x: number; y: number }[] {
  const half = spec.sizeM / 2;
  const corners = [
    worldToLatLon(spec.originX - half, spec.originZ - half, spec.originX, spec.originZ, spec.centerLat, spec.centerLon),
    worldToLatLon(spec.originX + half, spec.originZ + half, spec.originX, spec.originZ, spec.centerLat, spec.centerLon),
  ];
  const a = lonLatToTile(corners[0].lat, corners[0].lon, spec.zoom);
  const b = lonLatToTile(corners[1].lat, corners[1].lon, spec.zoom);
  const margin = 1 / TILE_SIZE;
  const x0 = Math.floor(Math.min(a.x, b.x) - margin);
  const x1 = Math.floor(Math.max(a.x, b.x) + margin);
  const y0 = Math.floor(Math.min(a.y, b.y) - margin);
  const y1 = Math.floor(Math.max(a.y, b.y) + margin);
  const out: { z: number; x: number; y: number }[] = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push({ z: spec.zoom, x, y });
  return out;
}

/** Decoded tiles keyed by "z/x/y": 256 x 256 heights in metres. */
export type HeightTiles = Map<string, Float32Array>;

export function tileKey(z: number, x: number, y: number): string {
  return `${z}/${x}/${y}`;
}

/** Decode raw RGBA pixels (256 x 256) into heights in metres. */
export function decodeTilePixels(rgba: Uint8Array | Buffer): Float32Array {
  const out = new Float32Array(TILE_SIZE * TILE_SIZE);
  for (let i = 0; i < TILE_SIZE * TILE_SIZE; i++) {
    out[i] = decodeTerrarium(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]);
  }
  return out;
}

/** Bilinear height at a latitude and longitude from the decoded tiles. Returns NaN if a tile is missing. */
export function heightAtLatLon(tiles: HeightTiles, zoom: number, lat: number, lon: number): number {
  const t = lonLatToTile(lat, lon, zoom);
  // Pixel centres sit at +0.5
  const gx = t.x * TILE_SIZE - 0.5;
  const gy = t.y * TILE_SIZE - 0.5;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const fx = gx - x0;
  const fy = gy - y0;
  const px = (gxp: number, gyp: number): number => {
    const tx = Math.floor(gxp / TILE_SIZE);
    const ty = Math.floor(gyp / TILE_SIZE);
    const tile = tiles.get(tileKey(zoom, tx, ty));
    if (!tile) return NaN;
    return tile[(gyp - ty * TILE_SIZE) * TILE_SIZE + (gxp - tx * TILE_SIZE)];
  };
  const h00 = px(x0, y0);
  const h10 = px(x0 + 1, y0);
  const h01 = px(x0, y0 + 1);
  const h11 = px(x0 + 1, y0 + 1);
  return (h00 * (1 - fx) + h10 * fx) * (1 - fy) + (h01 * (1 - fx) + h11 * fx) * fy;
}

/** Real elevations in metres on the game grid. Throws if any tile is missing. */
export function sampleGrid(tiles: HeightTiles, spec: GridSpec): Float32Array {
  const n = gridSize(spec);
  const out = new Float32Array(n * n);
  const half = spec.sizeM / 2;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = spec.originX - half + i * spec.stepM;
      const z = spec.originZ - half + j * spec.stepM;
      const ll = worldToLatLon(x, z, spec.originX, spec.originZ, spec.centerLat, spec.centerLon);
      const h = heightAtLatLon(tiles, spec.zoom, ll.lat, ll.lon);
      if (!Number.isFinite(h)) throw new Error('a needed elevation tile is missing');
      out[j * n + i] = h;
    }
  }
  return out;
}

/**
 * Separable Gaussian blur (sigma in grid cells).
 * Past the edge the data is mirrored "upside down" around the edge value, so a plain overall slope
 * continues straight instead of bending, and the slope is removed cleanly right up to the edge.
 */
export function gaussianBlur(src: Float32Array, n: number, sigmaCells: number): Float32Array {
  const radius = Math.max(1, Math.ceil(sigmaCells * 3));
  const kernel: number[] = [];
  let sum = 0;
  for (let k = -radius; k <= radius; k++) {
    const w = Math.exp(-(k * k) / (2 * sigmaCells * sigmaCells));
    kernel.push(w);
    sum += w;
  }
  for (let k = 0; k < kernel.length; k++) kernel[k] /= sum;

  // value of a line of n samples at (possibly out-of-range) index k, with odd reflection at both ends
  const at = (line: (idx: number) => number, k: number): number => {
    if (k >= 0 && k <= n - 1) return line(k);
    if (k < 0) {
      const m = Math.min(n - 1, -k);
      return 2 * line(0) - line(m);
    }
    const m = Math.max(0, 2 * (n - 1) - k);
    return 2 * line(n - 1) - line(m);
  };

  const tmp = new Float32Array(n * n);
  const out = new Float32Array(n * n);
  for (let j = 0; j < n; j++) {
    const row = (idx: number) => src[j * n + idx];
    for (let i = 0; i < n; i++) {
      let acc = 0;
      for (let k = -radius; k <= radius; k++) acc += at(row, i + k) * kernel[k + radius];
      tmp[j * n + i] = acc;
    }
  }
  for (let i = 0; i < n; i++) {
    const col = (idx: number) => tmp[idx * n + i];
    for (let j = 0; j < n; j++) {
      let acc = 0;
      for (let k = -radius; k <= radius; k++) acc += at(col, j + k) * kernel[k + radius];
      out[j * n + i] = acc;
    }
  }
  return out;
}

export interface ReliefBuildOptions {
  /** Features larger than this (metres) are treated as the overall slope and removed. */
  detrendSigmaM: number;
  /** Standard deviation (metres) the shown relief should have if the real relief is at least this large. */
  targetRmsM: number;
}

/**
 * Turns real elevations into game relief: removes the big overall slope, then scales the rest down
 * (never up) so it is about as lively as the procedural hills it replaces.
 */
export function buildRelief(
  heights: Float32Array,
  n: number,
  stepM: number,
  opts: ReliefBuildOptions
): { reliefM: Float32Array; stats: ReliefData['stats'] } {
  let realMin = Infinity;
  let realMax = -Infinity;
  for (const h of heights) {
    if (h < realMin) realMin = h;
    if (h > realMax) realMax = h;
  }
  const smooth = gaussianBlur(heights, n, opts.detrendSigmaM / stepM);
  const rel = new Float32Array(n * n);
  let mean = 0;
  for (let i = 0; i < rel.length; i++) {
    rel[i] = heights[i] - smooth[i];
    mean += rel[i];
  }
  mean /= rel.length;
  let ss = 0;
  for (let i = 0; i < rel.length; i++) {
    rel[i] -= mean;
    ss += rel[i] * rel[i];
  }
  const rms = Math.sqrt(ss / rel.length);
  const scale = rms > 1e-6 ? Math.min(1, opts.targetRmsM / rms) : 0;
  const reliefM = new Float32Array(n * n);
  for (let i = 0; i < rel.length; i++) reliefM[i] = Math.round(rel[i] * scale * 100) / 100;

  let maxSlope = 0;
  for (let j = 0; j < n - 1; j++) {
    for (let i = 0; i < n - 1; i++) {
      const a = reliefM[j * n + i];
      maxSlope = Math.max(maxSlope, Math.abs(reliefM[j * n + i + 1] - a) / stepM, Math.abs(reliefM[(j + 1) * n + i] - a) / stepM);
    }
  }
  return {
    reliefM,
    stats: {
      realMinM: Math.round(realMin),
      realMaxM: Math.round(realMax),
      realReliefRmsM: Math.round(rms * 10) / 10,
      targetRmsM: Math.round(opts.targetRmsM * 10) / 10,
      scale: Math.round(scale * 100) / 100,
      maxSlopePercent: Math.round(maxSlope * 1000) / 10,
    },
  };
}
