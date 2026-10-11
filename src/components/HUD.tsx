/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Compass,
  Mountain,
  Volume2,
  VolumeX,
  Camera,
  MapPin,
  Waves,
  Trees,
  MousePointer,
  Eye,
  ZoomIn,
  X,
  Droplet,
  Images,
  Binoculars,
  ShoppingBag,
} from 'lucide-react';
import { ParkDefinition } from '../data/parks.ts';
import { BinocularTarget } from '../entities/binoculars.ts';

interface HUDProps {
  currentPark: ParkDefinition;
  availableParks: ParkDefinition[];
  stamina: number;
  exhausted: boolean;
  hydration: number;
  waterLiters: number;
  maxWaterLiters: number;
  altitude: number;
  yaw: number;
  pitch: number;
  waterDepth: number;
  isWading: boolean;
  isOnBridge: boolean;
  isOnSummit: boolean;
  isNearTelescope: boolean;
  isNearWaterStation: boolean;
  isLookingThroughTelescope: boolean;
  telescopeZoomLevel: number;
  isBinocularsActive: boolean;
  binocularsZoomLevel: number;
  binocularTarget: BinocularTarget | null;
  sightingsCount: number;
  isMuted: boolean;
  photoMode: boolean;
  timeOfDay: 'day' | 'sunset' | 'dawn' | 'twilight';
  isCursorLocked: boolean;
  isCompassOwned: boolean;
  isCompassEquipped: boolean;
  onToggleTelescope: () => void;
  onTelescopePan?: (dYaw: number, dPitch: number) => void;
  onToggleBinoculars: () => void;
  onToggleCamera: () => void;
  onToggleGallery: () => void;
  onToggleCompass: () => void;
  onDrinkWater: () => void;
  onRefillWater: () => void;
  onOpenShop: () => void;
  onToggleCursorLock: () => void;
  onSelectPark: (parkId: string) => void;
  onToggleMute: () => void;
  onTogglePhotoMode: () => void;
  onSelectTimeOfDay: (time: 'day' | 'sunset' | 'dawn' | 'twilight') => void;
  onTeleport: (x: number, y: number, z: number, yaw: number) => void;
  onToggleHelp: () => void;
  photoCount: number;
}

export const HUD: React.FC<HUDProps> = ({
  currentPark,
  availableParks,
  stamina,
  exhausted,
  hydration,
  waterLiters,
  maxWaterLiters,
  altitude,
  yaw,
  pitch,
  waterDepth,
  isWading,
  isOnBridge,
  isOnSummit,
  isNearTelescope,
  isNearWaterStation,
  isLookingThroughTelescope,
  telescopeZoomLevel,
  isBinocularsActive,
  binocularsZoomLevel,
  binocularTarget,
  sightingsCount,
  isMuted,
  photoMode,
  timeOfDay,
  isCursorLocked,
  isCompassOwned,
  isCompassEquipped,
  onToggleTelescope,
  onTelescopePan,
  onToggleBinoculars,
  onToggleCamera,
  onToggleGallery,
  onToggleCompass,
  onDrinkWater,
  onRefillWater,
  onOpenShop,
  onToggleCursorLock,
  onSelectPark,
  onToggleMute,
  onTogglePhotoMode,
  onSelectTimeOfDay,
  onTeleport,
  onToggleHelp,
  photoCount,
}) => {
  // 1. Photo Mode UI (clean minimalist view)
  if (photoMode) {
    return (
      <div className="fixed top-5 right-5 z-20 pointer-events-auto">
        <button
          onClick={onTogglePhotoMode}
          className="flex items-center gap-2 bg-stone-900/60 hover:bg-stone-900/85 backdrop-blur-md text-stone-200 px-3 py-1.5 rounded-full text-xs transition border border-stone-700/60 shadow-lg cursor-pointer"
        >
          <Camera size={14} /> Exit Photo Mode (F)
        </button>
      </div>
    );
  }

  // Compass degrees
  const deg = ((-yaw * 180) / Math.PI) % 360;
  const compassDeg = deg < 0 ? deg + 360 : deg;
  const cardinalDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const cardinalIndex = Math.round(compassDeg / 45) % 8;
  const cardinal = cardinalDirections[cardinalIndex];

  // Pitch degrees for telescope
  const pitchDeg = Math.round((pitch * 180) / Math.PI);

  // 2. Interactive Summit Telescope Viewfinder Mode
  if (isLookingThroughTelescope) {
    return (
      <div className="fixed inset-0 pointer-events-none select-none z-30 font-sans">
        {/* Optical Telescope Vignette & Field Circle */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at center, transparent 48%, rgba(8, 12, 16, 0.55) 60%, rgba(5, 8, 10, 0.96) 72%)',
          }}
        />

        {/* Frosted Brass Bezel Rim & High-Precision Crosshairs */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[84vh] h-[84vh] rounded-full border border-amber-500/30 shadow-[0_0_80px_rgba(0,0,0,0.85)_inset] pointer-events-none flex items-center justify-center relative">
            {/* Fine Reticle Crosshairs */}
            <div className="absolute w-full h-[1px] bg-amber-400/40" />
            <div className="absolute h-full w-[1px] bg-amber-400/40" />

            {/* Stadiametric Range Rings */}
            <div className="w-48 h-48 rounded-full border border-amber-400/25 border-dashed" />
            <div className="w-16 h-16 rounded-full border border-amber-300/40" />
            <div className="w-2 h-2 rounded-full bg-amber-400/80" />

            {/* Bearing & Vertical Pitch Readouts on Rim */}
            <div className="absolute top-3 flex items-center gap-2">
              <div className="text-[11px] font-mono tracking-widest text-amber-300/90 font-bold bg-stone-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                BEARING: {Math.round(compassDeg)}° {cardinal}
              </div>
              <div className="text-[11px] font-mono tracking-widest text-emerald-300 font-bold bg-stone-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                TILT: {pitchDeg > 0 ? `+${pitchDeg}° UP` : `${pitchDeg}° DOWN`}
              </div>
            </div>
          </div>
        </div>

        {/* Top Control Bar for Telescope */}
        <div className="fixed top-6 inset-x-0 flex justify-between items-center px-8 pointer-events-auto">
          <div className="flex items-center gap-3 bg-stone-950/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-amber-600/40 shadow-2xl text-amber-200">
            <Eye size={18} className="text-amber-400" />
            <div>
              <div className="text-xs font-bold tracking-wider uppercase font-serif text-amber-100">
                {currentPark.overlook.name}
              </div>
              <div className="text-[11px] text-stone-400 font-mono">Observation Telescope • 360° Panoramic Pan & Tilt</div>
            </div>
          </div>

          <button
            onClick={onToggleTelescope}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-stone-950 px-4 py-2 rounded-2xl text-xs font-bold shadow-xl transition cursor-pointer"
          >
            <X size={15} /> Exit Telescope (E / Esc)
          </button>
        </div>

        {/* Responsive Directional Aim Pad (Up/Down/Left/Right) */}
        {onTelescopePan && (
          <div className="fixed right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 pointer-events-auto bg-stone-950/80 backdrop-blur-md p-3 rounded-2xl border border-amber-600/40 shadow-2xl">
            <span className="text-[10px] text-amber-300 font-mono font-bold uppercase tracking-wider mb-0.5">
              Aim View
            </span>
            <button
              onClick={() => onTelescopePan(0, 0.16)}
              className="w-10 h-9 flex items-center justify-center bg-stone-800 hover:bg-stone-700 active:scale-95 text-amber-300 font-bold rounded-lg transition cursor-pointer shadow border border-stone-700/60"
              title="Look Up (W / ArrowUp)"
            >
              ▲
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => onTelescopePan(0.16, 0)}
                className="w-10 h-9 flex items-center justify-center bg-stone-800 hover:bg-stone-700 active:scale-95 text-amber-300 font-bold rounded-lg transition cursor-pointer shadow border border-stone-700/60"
                title="Pan Left (A / ArrowLeft)"
              >
                ◄
              </button>
              <button
                onClick={() => onTelescopePan(-0.16, 0)}
                className="w-10 h-9 flex items-center justify-center bg-stone-800 hover:bg-stone-700 active:scale-95 text-amber-300 font-bold rounded-lg transition cursor-pointer shadow border border-stone-700/60"
                title="Pan Right (D / ArrowRight)"
              >
                ►
              </button>
            </div>
            <button
              onClick={() => onTelescopePan(0, -0.16)}
              className="w-10 h-9 flex items-center justify-center bg-stone-800 hover:bg-stone-700 active:scale-95 text-amber-300 font-bold rounded-lg transition cursor-pointer shadow border border-stone-700/60"
              title="Look Down into Valley (S / ArrowDown)"
            >
              ▼
            </button>
          </div>
        )}

        {/* Bottom Optical Readout */}
        <div className="fixed bottom-7 inset-x-0 flex flex-col items-center gap-1.5 pointer-events-auto">
          <div className="flex items-center gap-4 bg-stone-950/85 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-amber-600/40 shadow-2xl text-amber-200 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-amber-300 font-bold">
              <ZoomIn size={15} /> {telescopeZoomLevel.toFixed(1)}× MAGNIFICATION
            </span>
            <span className="text-stone-500">•</span>
            <span className="text-stone-300">Aim: Mouse Drag, WASD, or Arrows (Up & Down into Valley)</span>
            <span className="text-stone-500">•</span>
            <span className="text-stone-400">Scroll Wheel or + / - to Zoom</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. Binoculars View Overlay
  if (isBinocularsActive) {
    const target = binocularTarget;
    const boxColor = target
      ? target.condition === 'calm'
        ? target.identified
          ? 'rgba(52, 211, 153, 0.95)'
          : 'rgba(251, 191, 36, 0.95)'
        : 'rgba(251, 146, 60, 0.95)'
      : 'rgba(255, 255, 255, 0.45)';

    const circumference = 2 * Math.PI * 48;
    const progressFrac = target ? target.progress : 0;

    return (
      <div className="fixed inset-0 pointer-events-none select-none z-30 font-sans">
        <svg
          className="fixed inset-0 w-full h-full"
          viewBox="0 0 160 100"
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <radialGradient id="lensFeather">
              <stop offset="0" stopColor="#000" />
              <stop offset="0.9" stopColor="#000" />
              <stop offset="1" stopColor="#fff" />
            </radialGradient>
            <mask id="binocularMask" maskUnits="userSpaceOnUse" x="-600" y="-600" width="1360" height="1300">
              <rect x="-600" y="-600" width="1360" height="1300" fill="#fff" />
              <circle cx="63" cy="50" r="45" fill="url(#lensFeather)" />
              <circle cx="97" cy="50" r="45" fill="url(#lensFeather)" />
            </mask>
          </defs>
          <rect x="-600" y="-600" width="1360" height="1300" fill="#030506" fillOpacity="0.97" mask="url(#binocularMask)" />
        </svg>

        {/* Center reticle target */}
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="relative w-[18vh] h-[18vh]">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="3" />
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke={boxColor}
                strokeWidth="1.2"
                strokeDasharray="3 2"
                opacity={progressFrac > 0 ? 0.35 : 1}
              />
              {progressFrac > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="none"
                  stroke={boxColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progressFrac)}
                />
              )}
            </svg>
            <div className="absolute left-0 right-0 top-1/2 h-px bg-white/25" />
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/25" />
            <div className="absolute left-1/2 top-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />
          </div>
        </div>

        {/* Target Information Card */}
        {target && (
          <div className="fixed left-1/2 top-[calc(50%+11vh)] -translate-x-1/2 flex flex-col items-center gap-1.5 w-[min(92vw,26rem)]">
            <div className="bg-stone-950/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-stone-700/60 shadow-2xl text-center">
              {target.identified ? (
                <>
                  <div className="text-sm font-bold text-emerald-300 font-serif tracking-wide">{target.species}</div>
                  <div className="text-[11px] text-stone-300">{target.detail}</div>
                </>
              ) : target.tooFar ? (
                <div className="text-xs text-stone-300">Wildlife spotted, but too far to identify. Use zoom or approach slowly.</div>
              ) : target.condition === 'fleeing' ? (
                <div className="text-xs text-orange-300">Animal is running away. Wait patiently for it to calm down.</div>
              ) : (
                <div className="text-xs text-amber-200">
                  Studying wildlife... hold steady ({Math.round(target.progress * 100)}%)
                </div>
              )}

              <div className="mt-1 flex items-center justify-center gap-2 text-[11px] font-mono text-stone-400">
                <span>{Math.round(target.distance)} m</span>
                <span className="text-stone-600">•</span>
                <span
                  className={
                    target.condition === 'calm'
                      ? 'text-emerald-300'
                      : target.condition === 'alert'
                      ? 'text-orange-300'
                      : 'text-rose-300'
                  }
                >
                  {target.condition === 'calm' ? 'Calm Grazing' : target.condition === 'alert' ? 'Alert' : 'Fleeing'}
                </span>
              </div>
            </div>

            {target.condition === 'alert' && (
              <div className="bg-orange-950/85 border border-orange-500/50 text-orange-200 text-[11px] px-3 py-1.5 rounded-xl text-center shadow-xl">
                Animal has noticed your presence. Stand still or crouch (C) to avoid startling it.
              </div>
            )}
            {target.tooClose && target.condition === 'calm' && (
              <div className="bg-amber-950/85 border border-amber-500/50 text-amber-200 text-[11px] px-3 py-1.5 rounded-xl text-center shadow-xl">
                Close encounter ({Math.round(target.distance)} m). Keep at least {Math.round(target.safeDistance)} m ({Math.round(target.safeDistance / 0.9144)} yards) clearance.
              </div>
            )}
          </div>
        )}

        {/* Top Header */}
        <div className="fixed top-6 inset-x-0 flex justify-between items-center px-8">
          <div className="flex items-center gap-3 bg-stone-950/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-stone-700/60 shadow-2xl text-stone-200">
            <Binoculars size={18} className="text-amber-300" />
            <div>
              <div className="text-xs font-bold tracking-wider uppercase font-serif text-amber-100">
                Field Binoculars
              </div>
              <div className="text-[11px] text-stone-400 font-mono">
                {binocularsZoomLevel.toFixed(1)}× • {sightingsCount} identified
              </div>
            </div>
          </div>

          <button
            onClick={onToggleBinoculars}
            className="pointer-events-auto flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-stone-950 px-4 py-2 rounded-2xl text-xs font-bold shadow-xl transition cursor-pointer"
          >
            <X size={15} /> Lower (B / Esc)
          </button>
        </div>

        {/* Bottom Bar */}
        <div className="fixed bottom-7 inset-x-0 flex justify-center">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-stone-950/85 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-stone-700/60 shadow-2xl text-stone-300 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-amber-300 font-bold">
              <ZoomIn size={15} /> Scroll or + / - to zoom
            </span>
            <span className="text-stone-600">•</span>
            <span>Center animal in reticle ring to study</span>
            <span className="text-stone-600">•</span>
            <span>Press C to crouch & brace hands</span>
          </div>
        </div>
      </div>
    );
  }

  // 4. Standard Exploration HUD (Task 7 Equippable Compass & Hydration System)
  return (
    <div className="fixed inset-0 pointer-events-none select-none z-10 font-sans">
      {/* Reticle Dot (only shown when mouse is actively locked to camera) */}
      {isCursorLocked && (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/70 shadow-sm pointer-events-none" />
      )}

      {/* Top Bar: Equippable Compass / Park Selector / Controls */}
      <div className="fixed top-4 inset-x-0 flex justify-between items-start px-6">
        {/* Left: Equippable Compass Button & Park Info */}
        <div className="flex items-center gap-2.5">
          {/* TASK 7: Replace permanent HUD compass with equippable one */}
          {isCompassOwned ? (
            <button
              onClick={onToggleCompass}
              className={`pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md transition cursor-pointer shadow-lg ${
                isCompassEquipped
                  ? 'bg-amber-600 text-stone-950 border-amber-400 font-bold'
                  : 'bg-stone-900/65 hover:bg-stone-900/85 text-stone-200 border-stone-700/50'
              }`}
              title="Press K to raise or stow your handheld orienteering compass"
            >
              <Compass size={16} className={isCompassEquipped ? 'text-stone-950' : 'text-amber-300'} />
              <span className="text-xs font-semibold">{isCompassEquipped ? 'Compass Drawn' : 'Compass (K)'}</span>
            </button>
          ) : (
            <button
              onClick={onOpenShop}
              className="pointer-events-auto flex items-center gap-1.5 bg-stone-900/65 hover:bg-stone-900/85 text-stone-400 hover:text-amber-300 px-3 py-1.5 rounded-xl border border-stone-700/50 text-xs font-semibold transition cursor-pointer shadow-lg"
              title="Equippable compass available in Ranger Gear Shop"
            >
              <Compass size={16} className="text-stone-500" />
              <span>Get Compass (Shop)</span>
            </button>
          )}

          {/* Elevation Readout */}
          <div className="flex items-center gap-1.5 bg-stone-900/65 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-700/50 shadow-lg text-stone-100">
            <Mountain size={15} className="text-emerald-400" />
            <span className="text-xs uppercase tracking-wider text-stone-400">Elev:</span>
            <span className="font-mono text-xs font-semibold text-emerald-200">{altitude.toFixed(1)}m</span>
          </div>

          {/* Park Selector Dropdown with [P] hotkey hint */}
          <div className="pointer-events-auto bg-stone-900/65 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-700/50 shadow-lg flex items-center gap-2 text-stone-100">
            <span className="font-mono text-[10px] bg-stone-800 text-amber-300 px-1.5 py-0.5 rounded border border-stone-700">
              P
            </span>
            <Trees size={15} className="text-emerald-400" />
            <select
              value={currentPark.id}
              onChange={e => onSelectPark(e.target.value)}
              className="bg-transparent text-xs font-semibold text-stone-200 focus:outline-none cursor-pointer pr-1"
            >
              {availableParks.map(p => (
                <option key={p.id} value={p.id} className="bg-stone-900 text-stone-200">
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Dynamic Interaction / Telescope Prompt / Location Banner */}
        <div className="flex flex-col items-center gap-1.5">
          {/* Telescope Interaction Prompt */}
          {isNearTelescope && (
            <div className="pointer-events-auto flex items-center gap-2.5 bg-amber-600/90 hover:bg-amber-500 backdrop-blur-md px-4 py-2 rounded-2xl border border-amber-300/60 shadow-2xl text-stone-950 font-bold text-xs cursor-pointer transition transform hover:scale-105 active:scale-95 animate-bounce">
              <Eye size={17} />
              <button onClick={onToggleTelescope} className="cursor-pointer">
                Press <strong>[E]</strong> to Look through Summit Telescope
              </button>
            </div>
          )}

          {/* Water Refill Prompt when near potable station */}
          {isNearWaterStation && (
            <div className="pointer-events-auto flex items-center gap-2 bg-emerald-950/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-emerald-500/60 shadow-2xl text-emerald-200 text-xs font-bold animate-pulse">
              <Droplet size={15} className="text-emerald-400" />
              <button onClick={onRefillWater} className="cursor-pointer">
                Treated Potable Water Fountain • Press <strong>[R]</strong> or Click to Refill Canteen
              </button>
            </div>
          )}

          {!isCursorLocked && !isNearTelescope && (
            <div className="flex items-center gap-1.5 bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-amber-200 px-3 py-1 rounded-full text-xs font-medium animate-pulse">
              <MousePointer size={12} />
              <span>
                Mouse Free: Click UI options or press <strong>[Tab]</strong> to lock mouse look
              </span>
            </div>
          )}

          {/* Environmental location indicators */}
          {isWading && (
            <div className="flex flex-col items-center gap-0.5 bg-blue-950/85 backdrop-blur-md px-4 py-1.5 rounded-xl border border-cyan-500/50 shadow-xl text-cyan-200">
              <div className="flex items-center gap-2">
                <Waves size={16} className="text-cyan-300" />
                <span className="text-xs font-medium">
                  Wading in {currentPark.water.name} (Depth: {waterDepth.toFixed(1)}m • Speed -50%)
                </span>
              </div>
              <span className="text-[10px] text-amber-300/90 font-mono">
                Untreated River Water • Do not drink without boiling/filtration
              </span>
            </div>
          )}
          {isOnBridge && (
            <div className="flex items-center gap-2 bg-amber-950/70 backdrop-blur-md px-4 py-1.5 rounded-xl border border-amber-600/50 shadow-xl text-amber-200">
              <MapPin size={16} className="text-amber-400" />
              <span className="text-xs font-medium">{currentPark.trail.bridge.name}</span>
            </div>
          )}
          {isOnSummit && !isNearTelescope && (
            <div className="flex items-center gap-2 bg-emerald-950/75 backdrop-blur-md px-4 py-1.5 rounded-xl border border-emerald-500/50 shadow-xl text-emerald-200">
              <Mountain size={16} className="text-emerald-400" />
              <span className="text-xs font-medium">
                {currentPark.overlook.name} ({currentPark.overlook.elevationLabel})
              </span>
            </div>
          )}
        </div>

        {/* Right: Lighting, Free Mouse Toggle, Audio, Binoculars, Camera, Guide */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Lighting Mode with [T] hotkey indicator */}
          <div className="flex items-center bg-stone-900/60 backdrop-blur-md p-1 rounded-xl border border-stone-700/50 shadow-lg text-xs gap-1">
            <span
              className="font-mono text-[10px] bg-stone-800 text-amber-300 px-1.5 py-0.5 rounded border border-stone-700 ml-1"
              title="Press T to cycle lighting"
            >
              T
            </span>
            {(['day', 'sunset', 'dawn', 'twilight'] as const).map(t => (
              <button
                key={t}
                onClick={() => onSelectTimeOfDay(t)}
                className={`px-2 py-1 rounded-lg capitalize transition cursor-pointer ${
                  timeOfDay === t
                    ? 'bg-amber-600/70 text-amber-100 font-semibold shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title={`Switch to ${t} (or press T)`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Cursor Toggle button [Tab] */}
          <button
            onClick={onToggleCursorLock}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border backdrop-blur-md text-xs font-semibold shadow-lg transition cursor-pointer ${
              !isCursorLocked
                ? 'bg-amber-600 text-stone-950 border-amber-400 font-bold'
                : 'bg-stone-900/60 hover:bg-stone-900/80 text-stone-300 border-stone-700/50'
            }`}
            title="Press Tab to toggle mouse cursor lock"
          >
            <span className="font-mono text-[10px] bg-stone-950/40 text-current px-1 py-0.5 rounded">Tab</span>
            <MousePointer size={14} />
            <span>{!isCursorLocked ? 'Mouse Free' : 'Lock Look'}</span>
          </button>

          {/* Binoculars Toggle [B] */}
          <button
            onClick={onToggleBinoculars}
            className="p-2 bg-stone-900/60 hover:bg-stone-900/80 backdrop-blur-md rounded-xl border border-stone-700/50 text-stone-200 shadow-lg transition cursor-pointer"
            title="Field Binoculars (B)"
          >
            <Binoculars size={17} />
          </button>

          {/* Camera Toggle [V] */}
          <button
            onClick={onToggleCamera}
            className="p-2 bg-stone-900/60 hover:bg-stone-900/80 backdrop-blur-md rounded-xl border border-stone-700/50 text-amber-300 shadow-lg transition cursor-pointer"
            title="Field Camera (V)"
          >
            <Camera size={17} />
          </button>

          {/* Photo Gallery [G] */}
          <button
            onClick={onToggleGallery}
            className="px-2.5 py-2 bg-stone-900/60 hover:bg-stone-900/80 backdrop-blur-md rounded-xl border border-stone-700/50 text-stone-200 text-xs font-semibold shadow-lg transition cursor-pointer"
            title="Photo Gallery (G)"
          >
            Photos{photoCount > 0 ? ` (${photoCount})` : ''}
          </button>

          {/* Sound Toggle [M] */}
          <button
            onClick={onToggleMute}
            className="p-2 bg-stone-900/60 hover:bg-stone-900/80 backdrop-blur-md rounded-xl border border-stone-700/50 text-stone-200 shadow-lg transition cursor-pointer"
            title={isMuted ? 'Unmute Audio (M)' : 'Mute Audio (M)'}
          >
            {isMuted ? <VolumeX size={17} className="text-rose-400" /> : <Volume2 size={17} className="text-stone-200" />}
          </button>

          {/* Clean View Photo Mode [F] */}
          <button
            onClick={onTogglePhotoMode}
            className="p-2 bg-stone-900/60 hover:bg-stone-900/80 backdrop-blur-md rounded-xl border border-stone-700/50 text-stone-200 shadow-lg transition cursor-pointer"
            title="Photo Mode (F)"
          >
            <Eye size={17} />
          </button>

          {/* Guide */}
          <button
            onClick={onToggleHelp}
            className="px-2.5 py-2 bg-stone-900/60 hover:bg-stone-900/80 backdrop-blur-md rounded-xl border border-stone-700/50 text-stone-200 text-xs font-semibold shadow-lg transition cursor-pointer"
            title="Controls & Guide"
          >
            Guide
          </button>
        </div>
      </div>

      {/* Bottom Bar: Stamina, Hydration (TASK 7) & Landmark Teleports */}
      <div className="fixed bottom-5 inset-x-0 flex justify-between items-end px-6">
        {/* Left: Stamina & Hydration Gauges */}
        <div className="flex gap-2.5 items-end">
          {/* Stamina Gauge */}
          <div className="bg-stone-900/65 backdrop-blur-md px-3.5 py-2 rounded-xl border border-stone-700/50 shadow-lg w-48">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-semibold tracking-wider text-stone-300 uppercase text-[10px]">Stamina</span>
              <span className={`font-mono text-xs ${exhausted ? 'text-rose-400 font-bold' : 'text-stone-400'}`}>
                {exhausted ? 'Exhausted' : `${Math.round(stamina)}%`}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-stone-800/90 overflow-hidden border border-stone-700/40">
              <div
                className={`h-full transition-all duration-150 ${
                  exhausted ? 'bg-rose-500' : stamina < 30 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, stamina))}%` }}
              />
            </div>
          </div>

          {/* TASK 7: Hydration Gauge & Water Canteen */}
          <div className="bg-stone-900/65 backdrop-blur-md px-3.5 py-2 rounded-xl border border-stone-700/50 shadow-lg w-52 pointer-events-auto">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-semibold tracking-wider text-cyan-300 uppercase text-[10px] flex items-center gap-1">
                <Droplet size={11} /> Hydration
              </span>
              <span className={`font-mono text-xs ${hydration < 15 ? 'text-rose-300' : 'text-stone-300'}`}>
                {hydration < 15 ? 'Low: slowing you down · ' : ''}{Math.round(hydration)}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-stone-800/90 overflow-hidden border border-stone-700/40 mb-1.5">
              <div
                className={`h-full transition-all duration-150 ${
                  hydration < 25 ? 'bg-rose-500' : hydration < 50 ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, hydration))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-stone-400">
              <span>Canteen: {waterLiters.toFixed(2)} / {maxWaterLiters.toFixed(1)} L</span>
              <button
                onClick={onDrinkWater}
                className="bg-cyan-800/80 hover:bg-cyan-700 text-stone-100 px-2 py-0.5 rounded font-mono font-bold transition cursor-pointer"
                title="Press X to drink from canteen"
              >
                Drink [X]
              </button>
            </div>
          </div>
        </div>

        {/* Right: Dynamic Landmarks with Number Hotkey Badges */}
        <div className="flex items-center gap-1.5 bg-stone-900/65 backdrop-blur-md p-1.5 rounded-xl border border-stone-700/50 shadow-lg pointer-events-auto">
          <span className="text-[11px] font-semibold text-stone-400 px-2 uppercase tracking-wider flex items-center gap-1">
            <MapPin size={12} /> Jump to:
          </span>
          {currentPark.landmarks.map((lm, idx) => (
            <button
              key={lm.id}
              onClick={() => onTeleport(lm.x, lm.y, lm.z, lm.yaw)}
              className={`px-2.5 py-1 text-xs rounded-lg transition cursor-pointer border flex items-center gap-1.5 ${
                idx === currentPark.landmarks.length - 1
                  ? 'text-amber-200 font-medium hover:text-white hover:bg-amber-900/50 border-amber-700/40'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/80 border-transparent hover:border-stone-700/60'
              }`}
              title={`${lm.name} (Press ${idx + 1}): ${lm.description}`}
            >
              <span className="font-mono text-[10px] bg-stone-800/90 text-amber-300 px-1 py-0.2 rounded border border-stone-700">
                {idx + 1}
              </span>
              <span>{lm.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
