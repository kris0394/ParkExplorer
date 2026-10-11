/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, Ban, Leaf, Recycle } from 'lucide-react';

export interface RangerNoticeState {
  wildlife: { dist: number; safeDist: number; alert: boolean; species: string } | null;
  zone: { name: string; reason: string; kind: 'closed' | 'sensitive'; inside: boolean } | null;
  litter: { label: string; tip: string } | null;
}

export const EMPTY_RANGER_NOTICE: RangerNoticeState = {
  wildlife: null,
  zone: null,
  litter: null,
};

interface Props {
  notice: RangerNoticeState;
}

/**
 * Task 8: educational on-screen notices (wildlife distance, closed or
 * fragile areas, litter). Mistakes teach; nothing here ends the game.
 */
export const RangerNotices: React.FC<Props> = ({ notice }) => {
  const { wildlife, zone, litter } = notice;
  if (!wildlife && !zone && !litter) return null;

  return (
    <>
      <div className="fixed top-[7.5rem] left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center gap-2 w-[min(92vw,30rem)] font-sans">
        {wildlife && (
          <div
            className={`w-full backdrop-blur-md px-4 py-2.5 rounded-xl border shadow-2xl text-xs leading-relaxed ${
              wildlife.alert
                ? 'bg-rose-950/85 border-rose-500/60 text-rose-100'
                : 'bg-amber-950/85 border-amber-500/60 text-amber-100'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-0.5">
              <AlertTriangle size={14} className={wildlife.alert ? 'text-rose-300' : 'text-amber-300'} />
              {wildlife.alert
                ? `The ${wildlife.species.toLowerCase()} has noticed you`
                : `${wildlife.species} within ${Math.round(wildlife.safeDist)} m (${Math.round(wildlife.safeDist / 0.9144)} yards)`}
            </div>
            <div>
              You are about {Math.round(wildlife.dist)} m away. Keep at least {Math.round(wildlife.safeDist)} m from this animal.{' '}
              {wildlife.alert
                ? 'Stay calm and back away slowly. Do not run toward it.'
                : 'Back away slowly and use binoculars or camera zoom instead of walking closer.'}{' '}
              Close approaches stress animals and make them waste energy.
            </div>
          </div>
        )}

        {zone && (
          <div
            className={`w-full backdrop-blur-md px-4 py-2.5 rounded-xl border shadow-2xl text-xs leading-relaxed ${
              zone.kind === 'closed'
                ? 'bg-red-950/85 border-red-500/60 text-red-100'
                : zone.inside
                ? 'bg-orange-950/85 border-orange-500/60 text-orange-100'
                : 'bg-yellow-950/80 border-yellow-500/50 text-yellow-100'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-0.5">
              {zone.kind === 'closed' ? (
                <Ban size={14} className="text-red-300" />
              ) : (
                <Leaf size={14} className="text-yellow-300" />
              )}
              {zone.kind === 'closed'
                ? `Area closed: ${zone.name}`
                : zone.inside
                ? `Off-trail in a fragile area: ${zone.name}`
                : `Fragile area ahead: ${zone.name}`}
            </div>
            <div>
              {zone.reason}{' '}
              {zone.kind === 'closed'
                ? 'Please go around.'
                : zone.inside
                ? 'Step back onto the trail.'
                : 'Please stay on the trail.'}
            </div>
            <div className="mt-1 text-[10px] opacity-70">Game example, not an official NPS notice.</div>
          </div>
        )}
      </div>

      {litter && (
        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-[min(92vw,28rem)] font-sans">
          <div className="bg-emerald-950/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-emerald-500/60 shadow-2xl text-xs text-emerald-100 leading-relaxed">
            <div className="flex items-center gap-2 font-bold mb-0.5">
              <Recycle size={14} className="text-emerald-300" />
              Press <strong className="font-mono text-emerald-200">[Q]</strong> to pick up: {litter.label}
            </div>
            <div>{litter.tip}</div>
          </div>
        </div>
      )}
    </>
  );
};
