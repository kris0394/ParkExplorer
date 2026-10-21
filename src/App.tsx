/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NatureWorld } from './components/NatureWorld.tsx';
import { Mountain, Compass, Waves, Footprints, Trees, MapPin, Search } from 'lucide-react';
import { AVAILABLE_PARKS, setActivePark, getActivePark, ParkDefinition } from './data/parks.ts';
import { NpsInfoPanel } from './components/NpsInfoPanel.tsx';
import { loadRelief, applyCachedRelief, needsReliefLoad } from './utils/terrainData.ts';
import { getActiveReliefData } from './terrain/realRelief.ts';
import { SEASONS, SEASON_ORDER, Season, getActiveSeason, setActiveSeason } from './data/seasons.ts';

export default function App() {
  const [isPaused, setIsPaused] = useState(true);
  const [currentPark, setCurrentPark] = useState<ParkDefinition>(getActivePark());
  const [season, setSeason] = useState<Season>(getActiveSeason());
  // Landing page: which tab is open, and the park search box
  const [tab, setTab] = useState<'park' | 'season' | 'play'>('park');
  const [query, setQuery] = useState('');
  // Task 15: real elevation relief must be loaded BEFORE the world is built
  const [reliefTriedFor, setReliefTriedFor] = useState<string | null>(null);
  const waitingForTerrain = needsReliefLoad(currentPark) && reliefTriedFor !== currentPark.id;

  useEffect(() => {
    let cancelled = false;
    if (!currentPark.realTerrain) {
      applyCachedRelief(currentPark);
      return;
    }
    loadRelief(currentPark).then(() => {
      if (cancelled) return;
      applyCachedRelief(currentPark);
      setReliefTriedFor(currentPark.id);
    });
    return () => {
      cancelled = true;
    };
  }, [currentPark.id]);

  const handleStartExploring = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.requestPointerLock();
    }
  };

  const handleSelectPark = (parkId: string) => {
    const updated = setActivePark(parkId);
    applyCachedRelief(updated); // use already-loaded real terrain right away (or clear it)
    setCurrentPark({ ...updated });
  };

  // Task 10: changing the season rebuilds the world (trees, snow, grass, trail closures)
  const handleSelectSeason = (next: Season) => {
    if (next === season) return;
    setActiveSeason(next);
    setSeason(next);
  };
  const seasonDef = SEASONS[season];

  // Park list: filtered by the search box, real parks first, practice parks in their own group
  const q = query.trim().toLowerCase();
  const matches = AVAILABLE_PARKS.filter(p =>
    !q || `${p.name} ${p.state} ${p.region}`.toLowerCase().includes(q)
  );
  const realParks = matches.filter(p => !p.isPracticePark);
  const practiceParks = matches.filter(p => p.isPracticePark);

  const renderParkButton = (p: ParkDefinition) => {
    const isActive = p.id === currentPark.id;
    return (
      <button
        key={p.id}
        onClick={() => handleSelectPark(p.id)}
        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer border ${
          isActive
            ? 'bg-amber-600/80 text-amber-50 border-amber-500/60 shadow-md'
            : 'text-stone-300 border-transparent hover:bg-stone-800/70 hover:text-stone-100'
        }`}
      >
        <div className="font-semibold truncate text-[12px]">{p.name}</div>
        <div className={`truncate text-[10px] ${isActive ? 'text-amber-100/90' : 'text-stone-500'}`}>
          {p.isPracticePark ? 'Practice park • fictional' : p.state}
        </div>
      </button>
    );
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden font-serif bg-[#cfd9c4]">
      {/* 3D Simulation Engine (built only after the terrain data is ready) */}
      {waitingForTerrain ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950 text-stone-300 font-sans text-sm">
          Loading terrain…
        </div>
      ) : (
        <NatureWorld
          key={`${currentPark.id}-${season}`}
          park={currentPark}
          onSelectPark={handleSelectPark}
          onPauseChange={setIsPaused}
        />
      )}

      {/* Start / Pause Screen Overlay */}
      {isPaused && (
        <div
          id="overlay"
          onClick={handleStartExploring}
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/65 backdrop-blur-md text-stone-100 cursor-pointer p-3 md:p-4 transition-all duration-300"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="max-w-4xl w-full max-h-[94vh] md:h-[min(90vh,740px)] flex flex-col bg-stone-900/95 border border-stone-700/60 rounded-3xl shadow-2xl backdrop-blur-xl animate-fade-in cursor-default font-sans"
          >
            {/* Header */}
            <div className="shrink-0 px-5 pt-4 pb-3 border-b border-stone-800 text-center">
              <div className="flex justify-center items-center gap-2 text-amber-300 mb-0.5">
                <Trees size={16} />
                <Compass size={15} />
                <Mountain size={16} />
              </div>
              <h1 className="font-serif text-2xl md:text-3xl font-normal tracking-wide text-amber-100">PARK EXPLORER</h1>
              <p className="text-[11px] italic text-stone-400">3D Wilderness Exploration &amp; Responsible Recreation</p>
            </div>

            {/* Body: park list on the left, selected park on the right */}
            <div className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden grid md:grid-cols-[250px_1fr] md:grid-rows-1 gap-3 p-3 md:p-4">
              {/* LEFT: choose a park */}
              <div className="min-h-0 md:h-full flex flex-col bg-stone-950/50 border border-stone-800 rounded-2xl p-2">
                <div className="shrink-0 flex items-center justify-between px-1.5 pb-1.5 text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                  <span>Choose a park</span>
                  <span>{AVAILABLE_PARKS.length} available</span>
                </div>
                {AVAILABLE_PARKS.length > 5 && (
                  <div className="shrink-0 relative mb-1.5">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Search name or state"
                      className="w-full bg-stone-900 border border-stone-700 rounded-lg pl-7 pr-2 py-1.5 text-[11px] text-stone-200 placeholder:text-stone-600 outline-none focus:border-amber-600"
                    />
                  </div>
                )}
                <div className="min-h-0 max-h-44 md:max-h-none flex-1 overflow-y-auto space-y-1 pr-0.5">
                  {realParks.map(renderParkButton)}
                  {practiceParks.length > 0 && (
                    <div className="pt-1.5 mt-1.5 border-t border-stone-800">
                      <div className="px-1.5 pb-1 text-[10px] uppercase tracking-wider text-stone-600 font-semibold">Practice</div>
                      <div className="space-y-1">{practiceParks.map(renderParkButton)}</div>
                    </div>
                  )}
                  {matches.length === 0 && (
                    <div className="text-[11px] text-stone-500 px-2 py-3">No park matches &ldquo;{query}&rdquo;.</div>
                  )}
                </div>
              </div>

              {/* RIGHT: selected park */}
              <div className="min-h-0 md:h-full md:overflow-y-auto pr-0.5">
                {/* Park overview */}
                <div className="bg-stone-950/50 p-3 rounded-2xl border border-stone-800/80 text-left mb-3">
                  <div className="flex flex-wrap justify-between items-baseline gap-x-3 gap-y-0.5 mb-1">
                    <span className="font-semibold text-amber-300 flex items-center gap-1 text-sm">
                      <MapPin size={13} /> {currentPark.name}
                      <span className="text-stone-400 font-normal text-[11px]">({currentPark.state})</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      Elev. {currentPark.elevationRange.min}m – {currentPark.elevationRange.max}m
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed mb-2">{currentPark.description}</p>
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    <span className="flex items-center gap-1 bg-stone-900/70 border border-stone-800 rounded-full px-2 py-0.5 text-cyan-300">
                      <Waves size={10} /> {currentPark.water.name}
                    </span>
                    <span className="flex items-center gap-1 bg-stone-900/70 border border-stone-800 rounded-full px-2 py-0.5 text-amber-300">
                      <Footprints size={10} /> {currentPark.trail.name}
                    </span>
                    <span className="flex items-center gap-1 bg-stone-900/70 border border-stone-800 rounded-full px-2 py-0.5 text-emerald-300">
                      <Mountain size={10} /> {currentPark.overlook.name}
                    </span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-2.5 bg-stone-950/60 p-1 rounded-xl border border-stone-800">
                  {([
                    ['park', 'Park info'],
                    ['season', `Season: ${seasonDef.label}`],
                    ['play', 'How to play'],
                  ] as const).map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setTab(id)}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] transition cursor-pointer ${
                        tab === id
                          ? 'bg-amber-600/80 text-amber-50 font-semibold shadow'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* TAB: Park info */}
                {tab === 'park' && (
                  <div>
                    <NpsInfoPanel park={currentPark} />
                    {(() => {
                      const relief = getActiveReliefData(currentPark.id);
                      if (relief) {
                        return (
                          <div className="p-2.5 rounded-2xl border border-stone-800 bg-stone-950/40 text-left text-[11px] text-stone-400 leading-relaxed">
                            <span className="font-semibold text-stone-300">Terrain: </span>
                            real elevation relief from the {relief.featureName} (a {Math.round(relief.sizeM / 100) / 10} km window, real
                            elevation {relief.stats.realMinM.toLocaleString()} to {relief.stats.realMaxM.toLocaleString()} m), shown at{' '}
                            {Math.round(relief.stats.scale * 100)}% of its real height and blended into the hills away from the
                            hand-placed trail, brook and summit. {relief.attribution.text}{' '}
                            <a href={relief.attribution.url} target="_blank" rel="noopener noreferrer" className="text-sky-400 underline">
                              Details
                            </a>
                          </div>
                        );
                      }
                      if (currentPark.realTerrain) {
                        return (
                          <div className="p-2.5 rounded-2xl border border-stone-800 bg-stone-950/40 text-left text-[11px] text-stone-500 leading-relaxed">
                            <span className="font-semibold text-stone-400">Terrain: </span>
                            the game&apos;s built-in landscape (real elevation data is not available in this copy of the game).
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}

                {/* TAB: Season (Task 10) */}
                {tab === 'season' && (
                  <div className="bg-stone-950/70 p-1.5 rounded-2xl border border-stone-800">
                    <div className="flex gap-1.5">
                      {SEASON_ORDER.map(s => (
                        <button
                          key={s}
                          onClick={() => handleSelectSeason(s)}
                          className={`flex-1 py-1.5 rounded-xl text-xs transition cursor-pointer ${
                            s === season
                              ? 'bg-amber-600/80 text-amber-100 font-semibold shadow-md border border-amber-500/50'
                              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
                          }`}
                        >
                          {SEASONS[s].label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 px-1.5 pb-1 text-left text-[11px] leading-relaxed space-y-1">
                      <div className="text-stone-200">{seasonDef.worldChanges}</div>
                      <div className="text-emerald-300/90">Wildlife: {seasonDef.wildlifeNote}</div>
                      {currentPark.wildlife.spawns.some(s => s.species === 'black-bear') && (
                        <div className="text-emerald-300/90">Bears: {seasonDef.bear.note}</div>
                      )}
                      <div className="text-amber-300/90">
                        Trails:{' '}
                        {season === 'winter' && !currentPark.rules.zones.some(z => z.seasons?.includes('winter'))
                          ? 'Open in the game. Real trails and roads can close in winter, so check nps.gov for current alerts.'
                          : seasonDef.trailNote}
                      </div>
                      <div className="text-[10px] text-stone-500">
                        General natural history for learning, not official NPS information. Changing season reloads the park.
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: How to play */}
                {tab === 'play' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1.5 text-left text-xs bg-stone-950/60 p-2.5 rounded-2xl border border-stone-800/80">
                      {[
                        ['WASD', 'Walk & Turn'],
                        ['Mouse', 'Look around'],
                        ['Shift / C', 'Sprint / Crouch'],
                        ['B', 'Binoculars (Zoom)'],
                        ['V / Space', 'Camera / Shoot'],
                        ['K', 'Compass & Map'],
                        ['X / R', 'Drink / Refill Canteen'],
                        ['Q', 'Pick up litter'],
                        ['J / G', 'Journal & Shop / Photos'],
                        ['E / Tab', 'Telescope / Free Mouse'],
                        ['1 – 4', 'Jump to a landmark'],
                        ['T', 'Change time of day'],
                      ].map(([key, what]) => (
                        <div key={key} className="flex items-center gap-1.5">
                          <kbd className="font-mono text-[9px] bg-stone-800 text-amber-300 px-1.5 py-0.5 rounded border border-stone-700 shrink-0">{key}</kbd>
                          <span className="text-stone-300 text-[11px] truncate">{what}</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-left text-[11px] bg-emerald-950/40 p-3 rounded-2xl border border-emerald-800/50 text-stone-300 leading-relaxed">
                      <div className="font-semibold text-emerald-300 mb-1">Park Rules (game version)</div>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li>Stay at least 23 m (25 yards) from deer and 46 m (50 yards) from elk and bears. Zoom in, don&apos;t walk closer.</li>
                        <li>Move slowly near animals. Rushing them costs Stewardship.</li>
                        {currentPark.wildlife.spawns.some(s => s.species === 'black-bear') && (
                          <li>If a bear walks toward you, face it and back away slowly. Never run.</li>
                        )}
                        <li>Respect closed areas, and stay on the trail in fragile areas.</li>
                        <li>Pick up litter and pack it out. Leave no trace.</li>
                      </ul>
                      <div className="mt-1.5 text-[10px] text-stone-500">
                        These are game rules, not official NPS rules. Real parks differ, so always check each park&apos;s own rules.
                      </div>
                      {currentPark.about && (
                        <div className="mt-2 pt-2 border-t border-emerald-900/60">
                          <div className="font-semibold text-sky-300 mb-0.5">What {currentPark.name} says about wildlife</div>
                          <div>{currentPark.about.wildlifeGuidance.text}</div>
                          <div className="mt-1 text-[10px] text-stone-500">
                            {currentPark.about.wildlifeGuidance.caveat}{' '}
                            <a
                              href={currentPark.about.wildlifeGuidance.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-400 underline"
                            >
                              Source
                            </a>
                            , checked {currentPark.about.checkedOn}.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer: always visible */}
            <div className="shrink-0 px-4 pb-3 pt-2.5 border-t border-stone-800 flex flex-col gap-1.5">
              <button
                onClick={handleStartExploring}
                className="w-full py-3 px-6 rounded-2xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm tracking-wider uppercase shadow-xl hover:shadow-amber-600/30 transition-all cursor-pointer"
              >
                Explore {currentPark.name}
              </button>
              <a
                href="./park-explorer.html"
                download="park-explorer.html"
                className="text-center text-[11px] text-stone-500 hover:text-amber-300 transition cursor-pointer"
                title="Download self-contained offline HTML file"
              >
                &#x21E9; Download standalone HTML (park-explorer.html)
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
