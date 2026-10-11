/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { NatureWorld } from './components/NatureWorld.tsx';
import { Mountain, Compass, Waves, Footprints, Trees, MapPin } from 'lucide-react';
import { AVAILABLE_PARKS, setActivePark, getActivePark, ParkDefinition } from './data/parks.ts';
import { NpsInfoPanel } from './components/NpsInfoPanel.tsx';
import { SEASONS, SEASON_ORDER, Season, getActiveSeason, setActiveSeason } from './data/seasons.ts';

export default function App() {
  const [isPaused, setIsPaused] = useState(true);
  const [currentPark, setCurrentPark] = useState<ParkDefinition>(getActivePark());
  const [season, setSeason] = useState<Season>(getActiveSeason());

  const handleStartExploring = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.requestPointerLock();
    }
  };

  const handleSelectPark = (parkId: string) => {
    const updated = setActivePark(parkId);
    setCurrentPark({ ...updated });
  };

  // Task 10: changing the season rebuilds the world (trees, snow, grass, trail closures)
  const handleSelectSeason = (next: Season) => {
    if (next === season) return;
    setActiveSeason(next);
    setSeason(next);
  };
  const seasonDef = SEASONS[season];

  return (
    <main className="relative w-screen h-screen overflow-hidden font-serif bg-[#cfd9c4]">
      {/* 3D Simulation Engine */}
      <NatureWorld
        key={`${currentPark.id}-${season}`}
        park={currentPark}
        onSelectPark={handleSelectPark}
        onPauseChange={setIsPaused}
      />

      {/* Start / Pause Screen Overlay */}
      {isPaused && (
        <div
          id="overlay"
          onClick={handleStartExploring}
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/65 backdrop-blur-md text-stone-100 cursor-pointer p-4 transition-all duration-300"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="max-w-xl w-full max-h-[92vh] overflow-y-auto bg-stone-900/95 border border-stone-700/60 rounded-3xl p-5 md:p-6 text-center shadow-2xl backdrop-blur-xl animate-fade-in"
          >
            <div className="flex justify-center items-center gap-2 mb-0.5 text-amber-300">
              <Trees size={20} />
              <Compass size={18} />
              <Mountain size={20} />
            </div>

            <h1 className="text-2xl md:text-3xl font-normal tracking-wide text-amber-100 mb-0.5">
              PARK EXPLORER
            </h1>
            <p className="text-xs italic text-stone-400 mb-3 font-sans">
              3D Wilderness Exploration & Responsible Recreation
            </p>

            {/* Park Selector Tabs */}
            <div className="mb-3.5 bg-stone-950/70 p-1.5 rounded-2xl border border-stone-800 flex gap-1.5 font-sans">
              {AVAILABLE_PARKS.map(p => {
                const isActive = p.id === currentPark.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPark(p.id)}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs transition cursor-pointer text-left ${
                      isActive
                        ? 'bg-amber-600/80 text-amber-100 font-semibold shadow-md border border-amber-500/50'
                        : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
                    }`}
                  >
                    <div className="font-semibold text-stone-100 truncate text-[11px]">{p.name}</div>
                    <div className="text-[9px] opacity-80 truncate">
                      {p.isPracticePark ? 'Practice park • fictional' : `${p.parkServiceUnit} • ${p.region}`}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Season Selector (Task 10) */}
            <div className="mb-3.5 bg-stone-950/70 p-1.5 rounded-2xl border border-stone-800 font-sans">
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
                <div className="text-amber-300/90">Trails: {seasonDef.trailNote}</div>
                <div className="text-[10px] text-stone-500">
                  General natural history for learning, not official NPS information. Changing season reloads the park.
                </div>
              </div>
            </div>

            {/* Active Park Overview Card */}
            <div className="bg-stone-950/50 p-3 rounded-2xl border border-stone-800/80 text-left text-xs mb-3.5 font-sans">
              <div className="flex justify-between items-center mb-1 text-stone-300">
                <span className="font-semibold text-amber-300 flex items-center gap-1 text-xs">
                  <MapPin size={12} /> {currentPark.name} ({currentPark.state})
                </span>
                <span className="text-[10px] text-stone-400 font-mono">
                  Elev. {currentPark.elevationRange.min}m – {currentPark.elevationRange.max}m
                </span>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed mb-2 line-clamp-2">
                {currentPark.description}
              </p>

              {/* Park Highlights */}
              <div className="grid grid-cols-3 gap-1.5">
                <div className="bg-stone-900/60 p-1.5 rounded-xl border border-stone-800">
                  <div className="flex items-center gap-1 text-cyan-300 font-semibold text-[10px]">
                    <Waves size={11} /> {currentPark.water.name.split(' ')[0]}
                  </div>
                  <p className="text-[9px] text-stone-400 truncate">Stream & footbridge</p>
                </div>
                <div className="bg-stone-900/60 p-1.5 rounded-xl border border-stone-800">
                  <div className="flex items-center gap-1 text-amber-300 font-semibold text-[10px]">
                    <Footprints size={11} /> {currentPark.trail.name.split(' ')[0]}
                  </div>
                  <p className="text-[9px] text-stone-400 truncate">Hillside trail</p>
                </div>
                <div className="bg-stone-900/60 p-1.5 rounded-xl border border-stone-800">
                  <div className="flex items-center gap-1 text-emerald-300 font-semibold text-[10px]">
                    <Mountain size={11} /> {currentPark.overlook.name.split(' ')[0]}
                  </div>
                  <p className="text-[9px] text-stone-400 truncate">Summit & telescope</p>
                </div>
              </div>
            </div>

            {/* Official NPS information (Task 12) */}
            <NpsInfoPanel park={currentPark} />

            {/* Streamlined Compact Shortcuts Grid (retains 100% of controls without crowding) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1.5 text-left text-xs mb-4 font-sans bg-stone-950/60 p-2.5 rounded-2xl border border-stone-800/80">
              <div className="flex items-center gap-1.5">
                <kbd className="font-mono text-[9px] bg-stone-800 text-amber-300 px-1.5 py-0.5 rounded border border-stone-700 shrink-0">WASD</kbd>
                <span className="text-stone-300 text-[11px] truncate">Walk & Turn</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="font-mono text-[9px] bg-stone-800 text-amber-300 px-1.5 py-0.5 rounded border border-stone-700 shrink-0">Mouse</kbd>
                <span className="text-stone-300 text-[11px] truncate">Look around</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="font-mono text-[9px] bg-stone-800 text-amber-300 px-1.5 py-0.5 rounded border border-stone-700 shrink-0">Shift / C</kbd>
                <span className="text-stone-300 text-[11px] truncate">Sprint / Crouch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="font-mono text-[9px] bg-stone-800 text-amber-300 px-1.5 py-0.5 rounded border border-stone-700 shrink-0">B</kbd>
                <span className="text-stone-300 text-[11px] truncate">Binoculars (Zoom)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="font-mono text-[9px] bg-stone-800 text-amber-300 px-1.5 py-0.5 rounded border border-stone-700 shrink-0">V / Space</kbd>
                <span className="text-stone-300 text-[11px] truncate">Camera / Shoot</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="font-mono text-[9px] bg-stone-800 text-amber-300 px-1.5 py-0.5 rounded border border-stone-700 shrink-0">K</kbd>
                <span className="text-stone-300 text-[11px] truncate">Compass & Map</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="font-mono text-[9px] bg-stone-800 text-amber-300 px-1.5 py-0.5 rounded border border-stone-700 shrink-0">X / R</kbd>
                <span className="text-stone-300 text-[11px] truncate">Drink / Refill Canteen</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="font-mono text-[9px] bg-stone-800 text-amber-300 px-1.5 py-0.5 rounded border border-stone-700 shrink-0">Q</kbd>
                <span className="text-stone-300 text-[11px] truncate">Pick up litter</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="font-mono text-[9px] bg-stone-800 text-amber-300 px-1.5 py-0.5 rounded border border-stone-700 shrink-0">J / G</kbd>
                <span className="text-stone-300 text-[11px] truncate">Journal & Shop / Photos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="font-mono text-[9px] bg-stone-800 text-amber-300 px-1.5 py-0.5 rounded border border-stone-700 shrink-0">E / Tab</kbd>
                <span className="text-stone-300 text-[11px] truncate">Telescope / Free Mouse</span>
              </div>
            </div>

            {/* Park Rules (game version) */}
            <div className="text-left text-[11px] mb-4 font-sans bg-emerald-950/40 p-3 rounded-2xl border border-emerald-800/50 text-stone-300 leading-relaxed">
              <div className="font-semibold text-emerald-300 mb-1">Park Rules (game version)</div>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Stay at least 23 m (25 yards) from deer and 46 m (50 yards) from elk. Zoom in, don&apos;t walk closer.</li>
                <li>Move slowly near animals. Rushing them costs Stewardship.</li>
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

            {/* Click to Explore Button & Download Standalone HTML Link */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleStartExploring}
                className="inline-block w-full py-3 px-6 rounded-2xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-sans font-bold text-sm tracking-wider uppercase shadow-xl hover:shadow-amber-600/30 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Explore {currentPark.name}
              </button>

              <a
                href="./park-explorer.html"
                download="park-explorer.html"
                className="flex items-center justify-center gap-1.5 py-1.5 px-4 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-amber-300 font-sans text-xs font-semibold border border-stone-700/60 transition cursor-pointer shadow"
                title="Download self-contained offline HTML file"
              >
                <span>&#x21E9; Download Standalone HTML (park-explorer.html)</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
