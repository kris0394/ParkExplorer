import React, { useState } from 'react';
import { ExternalLink, ShieldAlert, Info } from 'lucide-react';
import { ParkDefinition } from '../data/parks.ts';
import { useNpsData } from '../utils/npsData.ts';
import type { NpsAlertCategory } from '../utils/npsFormat.ts';

const CATEGORY_STYLE: Record<NpsAlertCategory, string> = {
  Danger: 'bg-red-950/70 border-red-600/60 text-red-100',
  'Park Closure': 'bg-orange-950/70 border-orange-600/60 text-orange-100',
  Caution: 'bg-yellow-950/60 border-yellow-600/50 text-yellow-100',
  Information: 'bg-sky-950/50 border-sky-700/50 text-sky-100',
};

interface Props {
  park: ParkDefinition;
}

/**
 * Task 12: real National Park Service information for the selected park.
 * Clearly separate from the game's own example rules and closures.
 */
export const NpsInfoPanel: React.FC<Props> = ({ park }) => {
  const { data, loading } = useNpsData(park.npsParkCode);
  const [open, setOpen] = useState(false);

  if (!park.npsParkCode) {
    return (
      <div className="mb-3.5 p-2.5 rounded-2xl border border-stone-800 bg-stone-950/40 text-left text-[11px] text-stone-400 font-sans leading-relaxed">
        <span className="font-semibold text-stone-300">{park.name}</span> is a fictional practice park, so it has no
        NPS page. Switch to a real park to see live National Park Service information.
      </div>
    );
  }

  const link = `https://www.nps.gov/${park.npsParkCode}/`;

  return (
    <div className="mb-3.5 p-2.5 rounded-2xl border border-sky-900/60 bg-sky-950/20 text-left text-[11px] font-sans leading-relaxed">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 text-sky-200 font-semibold cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          <Info size={13} /> Official NPS information
          {data && data.alerts.length > 0 && (
            <span className="text-[10px] bg-amber-600/70 text-amber-50 px-1.5 py-0.5 rounded-full">
              {data.alerts.length} alert{data.alerts.length === 1 ? '' : 's'}
            </span>
          )}
        </span>
        <span className="text-stone-400 text-[10px]">{open ? 'Hide' : 'Show'}</span>
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {loading && <div className="text-stone-400">Loading…</div>}

          {!loading && !data && (
            <div className="text-stone-400">
              Live NPS information is not available right now (it is downloaded when the site is built, and not
              available in every copy of the game).{' '}
              <a href={link} target="_blank" rel="noopener noreferrer" className="text-sky-300 underline">
                Open the park page on nps.gov
              </a>
              .
            </div>
          )}

          {data && (
            <>
              <div className="text-stone-200">
                <span className="font-semibold">{data.park.fullName}</span>
                {data.park.designation ? ` · ${data.park.designation}` : ''}
                {data.park.states ? ` · ${data.park.states}` : ''}
              </div>
              {data.park.description && <p className="text-stone-400">{data.park.description}</p>}
              {data.park.weatherInfo && (
                <p className="text-stone-400">
                  <span className="text-stone-300 font-semibold">Weather: </span>
                  {data.park.weatherInfo}
                </p>
              )}

              <div>
                <div className="flex items-center gap-1 text-amber-300 font-semibold mb-1">
                  <ShieldAlert size={12} /> Current park alerts
                </div>
                {data.alerts.length === 0 ? (
                  <div className="text-stone-400">No alerts were posted when this was downloaded.</div>
                ) : (
                  <ul className="space-y-1.5">
                    {data.alerts.map(a => (
                      <li key={a.id || a.title} className={`p-2 rounded-xl border ${CATEGORY_STYLE[a.category]}`}>
                        <div className="font-semibold">
                          <span className="uppercase text-[9px] tracking-wide opacity-80 mr-1.5">{a.category}</span>
                          {a.title}
                        </div>
                        {a.description && <div className="opacity-90 mt-0.5">{a.description}</div>}
                        {a.url && (
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1 underline opacity-90"
                          >
                            Read on nps.gov <ExternalLink size={10} />
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="text-[10px] text-stone-500 pt-1 border-t border-stone-800">
                From the National Park Service, downloaded {new Date(data.fetchedAt).toLocaleString()}. Alerts change
                often, so always check{' '}
                <a href={data.park.url} target="_blank" rel="noopener noreferrer" className="text-sky-400 underline">
                  nps.gov
                </a>{' '}
                before you visit. The game&apos;s own closures and rules are examples, not NPS notices.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
