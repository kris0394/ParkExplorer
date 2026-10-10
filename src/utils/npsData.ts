/**
 * TASK 12: loads the NPS information that was downloaded at build time.
 * There is no API key in the game: the data is a plain JSON file next to the page,
 * or (for the standalone park-explorer.html) copied into the page when it was built.
 */
import { useEffect, useState } from 'react';
import type { NpsData } from './npsFormat.ts';

declare global {
  interface Window {
    __NPS_DATA__?: Record<string, NpsData>;
  }
}

const cache = new Map<string, NpsData | null>();

export async function loadNpsData(parkCode: string): Promise<NpsData | null> {
  if (cache.has(parkCode)) return cache.get(parkCode)!;
  let result: NpsData | null = null;
  try {
    const res = await fetch(`./nps/${parkCode}.json`, { cache: 'no-cache' });
    if (res.ok) {
      const json = await res.json();
      if (json && json.parkCode === parkCode && json.park && Array.isArray(json.alerts)) result = json as NpsData;
    }
  } catch {
    /* offline, or opened as a local file */
  }
  if (!result && typeof window !== 'undefined' && window.__NPS_DATA__?.[parkCode]) {
    result = window.__NPS_DATA__[parkCode];
  }
  cache.set(parkCode, result);
  return result;
}

export function useNpsData(parkCode: string | undefined): { data: NpsData | null; loading: boolean } {
  const [state, setState] = useState<{ code: string | undefined; data: NpsData | null; loading: boolean }>({
    code: parkCode,
    data: null,
    loading: !!parkCode,
  });

  useEffect(() => {
    let cancelled = false;
    if (!parkCode) {
      setState({ code: parkCode, data: null, loading: false });
      return;
    }
    setState({ code: parkCode, data: null, loading: true });
    loadNpsData(parkCode).then(d => {
      if (!cancelled) setState({ code: parkCode, data: d, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [parkCode]);

  return state.code === parkCode ? { data: state.data, loading: state.loading } : { data: null, loading: !!parkCode };
}
