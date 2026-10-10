/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Compass, X, MapPin, Mountain, Waves, Footprints } from 'lucide-react';
import { ParkDefinition } from '../data/parks.ts';

export interface HandheldCompassUIProps {
  currentPark: ParkDefinition;
  yaw: number;
  altitude: number;
  playerPos: { x: number; z: number };
  onClose: () => void;
}

export const HandheldCompassUI: React.FC<HandheldCompassUIProps> = ({
  currentPark,
  yaw,
  altitude,
  playerPos,
  onClose,
}) => {
  // Convert Three.js camera yaw (radians) to 0-360 compass degrees
  const deg = ((-yaw * 180) / Math.PI) % 360;
  const compassDeg = deg < 0 ? deg + 360 : deg;
  const cardinalIndex = Math.round(compassDeg / 45) % 8;
  const cardinal = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][cardinalIndex];

  // Map coordinate conversion (park world is roughly -120 to +120 around center)
  const mapSpan = 180;
  const mapCenterX = 40;
  const mapCenterZ = -25;
  const toMapX = (x: number) => Math.max(8, Math.min(92, 50 + ((x - mapCenterX) / mapSpan) * 100));
  const toMapY = (z: number) => Math.max(8, Math.min(92, 50 + ((z - mapCenterZ) / mapSpan) * 100));

  const playerDotX = toMapX(playerPos.x);
  const playerDotY = toMapY(playerPos.z);

  return (
    <div className="fixed bottom-6 right-6 z-40 pointer-events-auto select-none font-sans animate-fade-in">
      <div className="bg-stone-900/95 backdrop-blur-xl border-2 border-amber-600/60 rounded-3xl p-4 shadow-2xl w-80 text-stone-100 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-2">
          <div className="flex items-center gap-2">
            <Compass className="text-amber-400 animate-pulse" size={18} />
            <div>
              <div className="text-xs font-bold text-amber-100 font-serif tracking-wider uppercase">
                Orienteering Compass
              </div>
              <div className="text-[10px] text-stone-400 font-mono">USGS Field Spec • Liquid Damped</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition cursor-pointer"
            title="Lower Compass (K / Esc)"
          >
            <X size={15} />
          </button>
        </div>

        {/* Compass Dial Housing */}
        <div className="flex items-center justify-center py-1">
          <div className="relative w-44 h-44 rounded-full border-4 border-amber-500/50 bg-stone-950 shadow-[0_0_35px_rgba(0,0,0,0.85)_inset] flex items-center justify-center">
            {/* Degree Tick Ring (Bezel rotates opposite to player yaw) */}
            <div
              className="absolute inset-2 rounded-full border border-stone-700/60 transition-transform duration-75"
              style={{ transform: `rotate(${-compassDeg}deg)` }}
            >
              <div className="absolute top-1 left-1/2 -translate-x-1/2 font-mono font-bold text-xs text-rose-500">
                N
              </div>
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 font-mono font-bold text-xs text-stone-400">
                S
              </div>
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-stone-400">
                E
              </div>
              <div className="absolute left-1.5 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-stone-400">
                W
              </div>

              {/* Tick marks */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-[1px] bg-stone-700/40" />
                <div className="h-full w-[1px] bg-stone-700/40" />
              </div>
            </div>

            {/* Static Lubber Line (Travel Direction Arrow pointing forward) */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-amber-400 text-xs font-bold font-mono">
              ▲
            </div>

            {/* Floating Magnetic Needle (points towards Magnetic North) */}
            <div
              className="relative w-2 h-32 flex flex-col items-center justify-between transition-transform duration-75"
              style={{ transform: `rotate(${-compassDeg}deg)` }}
            >
              {/* North Pointer (Red) */}
              <div className="w-0 h-0 border-x-4 border-x-transparent border-b-[44px] border-b-rose-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.7)]" />
              {/* Center Pivot Jewel */}
              <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-stone-900 z-10 shadow" />
              {/* South Pointer (White / Silver) */}
              <div className="w-0 h-0 border-x-4 border-x-transparent border-t-[44px] border-t-stone-300" />
            </div>
          </div>
        </div>

        {/* Numeric Readouts */}
        <div className="grid grid-cols-2 gap-2 text-center bg-stone-950/70 p-2.5 rounded-2xl border border-stone-800">
          <div>
            <div className="text-[10px] text-stone-400 uppercase font-mono">Bearing</div>
            <div className="font-mono text-base font-bold text-amber-300">
              {Math.round(compassDeg)}° {cardinal}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-stone-400 uppercase font-mono">Elevation</div>
            <div className="font-mono text-base font-bold text-emerald-300">{altitude.toFixed(1)} m</div>
          </div>
        </div>

        {/* Topo Map Mini-Overview */}
        <div className="relative w-full h-28 rounded-2xl bg-stone-950 border border-stone-800 overflow-hidden p-1.5 flex flex-col justify-between">
          <div className="text-[10px] font-mono text-stone-400 flex items-center justify-between px-1">
            <span className="flex items-center gap-1 text-emerald-400">
              <Mountain size={11} /> Topo Grid
            </span>
            <span>{currentPark.name}</span>
          </div>

          {/* Map canvas stylized representation */}
          <div className="relative flex-1 w-full h-full bg-[#202722] rounded-xl overflow-hidden border border-stone-800/80">
            {/* Contour lines */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="w-36 h-36 rounded-full border border-stone-400 absolute -top-8 -right-8" />
              <div className="w-24 h-24 rounded-full border border-stone-400 absolute -top-2 -right-2" />
              <div className="w-12 h-12 rounded-full border border-stone-400 absolute 4 4" />
            </div>

            {/* River ribbon */}
            <div className="absolute left-[38%] top-0 bottom-0 w-2.5 bg-cyan-700/60 -skew-x-12" />

            {/* Trailhead spawn pin */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
              style={{ left: `${toMapX(currentPark.spawn.x)}%`, top: `${toMapY(currentPark.spawn.z)}%` }}
              title="Trailhead"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow" />
            </div>

            {/* Bridge landmark pin */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
              style={{
                left: `${toMapX((currentPark.trail.bridge.westX + currentPark.trail.bridge.eastX) / 2)}%`,
                top: `${toMapY(currentPark.trail.bridge.centerZ)}%`,
              }}
              title="Footbridge"
            >
              <div className="w-2 h-2 rounded-full bg-amber-400 shadow" />
            </div>

            {/* Summit landmark pin */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
              style={{
                left: `${toMapX(currentPark.terrain.mountain.x)}%`,
                top: `${toMapY(currentPark.terrain.mountain.z)}%`,
              }}
              title={currentPark.terrain.mountain.name}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow" />
            </div>

            {/* Player current location pulsating dot */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-[left,top] duration-150"
              style={{ left: `${playerDotX}%`, top: `${playerDotY}%` }}
              title="You are here"
            >
              <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping opacity-75 absolute" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-300 border border-stone-950 z-10 shadow" />
            </div>
          </div>

          <div className="text-[9px] text-stone-500 font-mono text-center mt-1">
            Press <strong>[K]</strong> to stow or draw compass
          </div>
        </div>
      </div>
    </div>
  );
};
