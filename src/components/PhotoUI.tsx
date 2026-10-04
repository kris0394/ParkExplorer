/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Camera, X, CheckCircle, AlertTriangle, Images, Download, Trash2, ZoomIn } from 'lucide-react';
import { ScoredPhoto } from '../entities/photography.ts';

export interface CameraViewfinderProps {
  zoom: number;
  guide: {
    kind: string;
    subject: string;
    u: number | null;
    v: number | null;
    distance: number;
    condition: string | null;
    tooClose: boolean;
    hints: { text: string; good: boolean }[];
  } | null;
  photoCount: number;
  flashKey: number;
  onShutter: () => void;
  onLower: () => void;
  onOpenGallery: () => void;
}

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({
  zoom,
  guide,
  photoCount,
  flashKey,
  onShutter,
  onLower,
  onOpenGallery,
}) => {
  const boxBorder = guide
    ? guide.kind === 'wildlife'
      ? guide.condition === 'fleeing'
        ? 'rgba(251, 113, 133, 0.95)'
        : guide.tooClose || guide.condition === 'alert'
        ? 'rgba(251, 146, 60, 0.95)'
        : 'rgba(52, 211, 153, 0.95)'
      : 'rgba(251, 191, 36, 0.9)'
    : 'rgba(255, 255, 255, 0.0)';

  const hints = guide ? guide.hints.slice(0, 2) : [];

  return (
    <div className="fixed inset-0 z-30 pointer-events-none select-none font-sans">
      {/* Darkened Viewfinder Letterbox Overlay with 3:2 Photography Aspect */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-white/70"
        style={{
          height: 'min(78vh, 60vw)',
          aspectRatio: '3 / 2',
          boxShadow: '0 0 0 200vmax rgba(0, 0, 0, 0.55)',
        }}
      >
        {/* Rule of Thirds Guidelines */}
        <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/20" />
        <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/20" />
        <div className="absolute left-0 right-0 top-1/3 h-px bg-white/20" />
        <div className="absolute left-0 right-0 top-2/3 h-px bg-white/20" />

        {/* Center Target Mark */}
        <div className="absolute left-1/2 top-1/2 w-5 h-px -translate-x-1/2 bg-white/60" />
        <div className="absolute left-1/2 top-1/2 h-5 w-px -translate-y-1/2 bg-white/60" />

        {/* Autofocus Detection Reticle */}
        {guide && guide.u !== null && guide.v !== null && (
          <div
            className="absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2 border-2 rounded-md transition-[left,top] duration-100"
            style={{
              left: `${guide.u * 100}%`,
              top: `${guide.v * 100}%`,
              borderColor: boxBorder,
            }}
          />
        )}

        {/* Subject identification badge in corner */}
        {guide && guide.kind !== 'landscape' && (
          <div className="absolute left-3 bottom-3 bg-stone-950/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-mono text-stone-200">
            {guide.subject}
            {guide.distance > 0 && <span className="text-stone-400"> • {Math.round(guide.distance)} m</span>}
          </div>
        )}
      </div>

      {/* Composition Hints Banner */}
      {hints.length > 0 && (
        <div
          className="fixed left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
          style={{ top: 'calc(50% + min(39vh, 30vw) + 12px)' }}
        >
          {hints.map((h, i) => (
            <div
              key={i}
              className={`px-3 py-1 rounded-xl text-[11px] border shadow-xl backdrop-blur-md ${
                h.good
                  ? 'bg-emerald-950/85 border-emerald-500/50 text-emerald-200'
                  : 'bg-orange-950/85 border-orange-500/50 text-orange-200'
              }`}
            >
              {h.text}
            </div>
          ))}
        </div>
      )}

      {/* Top Header Controls */}
      <div className="fixed top-5 inset-x-0 flex justify-between items-center px-6">
        <div className="flex items-center gap-3 bg-stone-950/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-stone-700/60 shadow-2xl text-stone-200">
          <Camera size={18} className="text-amber-300" />
          <div>
            <div className="text-xs font-bold tracking-wider uppercase font-serif text-amber-100">Field Camera</div>
            <div className="text-[11px] text-stone-400 font-mono flex items-center gap-1.5">
              <ZoomIn size={12} /> {zoom.toFixed(1)}× • {photoCount} photo{photoCount === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onOpenGallery}
            className="flex items-center gap-2 bg-stone-900/85 hover:bg-stone-800 text-stone-200 px-3 py-2 rounded-2xl text-xs font-semibold border border-stone-700/60 shadow-xl transition cursor-pointer"
          >
            <Images size={15} /> Gallery (G)
          </button>
          <button
            onClick={onLower}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-stone-950 px-4 py-2 rounded-2xl text-xs font-bold shadow-xl transition cursor-pointer"
          >
            <X size={15} /> Lower (V)
          </button>
        </div>
      </div>

      {/* Shutter Button & Keyboard Instructions */}
      <div className="fixed bottom-5 inset-x-0 flex flex-col items-center gap-2">
        <button
          onClick={onShutter}
          className="pointer-events-auto w-14 h-14 rounded-full border-4 border-stone-200/90 bg-white/20 hover:bg-white/40 active:scale-95 transition cursor-pointer shadow-xl"
          title="Take photo (click / Space)"
        />
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-stone-950/85 backdrop-blur-md px-5 py-2 rounded-2xl border border-stone-700/60 shadow-2xl text-stone-300 text-xs font-mono">
          <span className="text-amber-300 font-bold">Click / Space: take photo</span>
          <span className="text-stone-600">•</span>
          <span>Scroll wheel / + -: zoom</span>
          <span className="text-stone-600">•</span>
          <span>C: crouch to steady</span>
        </div>
      </div>

      {/* Flash animation */}
      {flashKey > 0 && (
        <div
          key={flashKey}
          className="fixed inset-0 bg-white pointer-events-none animate-flash"
          style={{
            animation: 'photoFlash 0.35s ease-out forwards',
            opacity: 0,
          }}
        />
      )}
    </div>
  );
};

export const PhotoResultCard: React.FC<{ photo: ScoredPhoto | null }> = ({ photo }) => {
  if (!photo) return null;

  const scoreColor =
    photo.score >= 70
      ? 'text-emerald-300'
      : photo.score >= 50
      ? 'text-amber-300'
      : photo.score >= 30
      ? 'text-orange-300'
      : 'text-rose-300';

  return (
    <div className="fixed left-6 bottom-28 z-[35] w-72 pointer-events-none bg-stone-950/90 backdrop-blur-md rounded-2xl border border-stone-700/60 shadow-2xl overflow-hidden font-sans">
      <img src={photo.dataUrl} alt="Latest photograph" className="w-full aspect-[3/2] object-cover" />
      <div className="p-3">
        <div className="flex items-baseline justify-between mb-1">
          <div className="min-w-0">
            <div className="text-sm font-bold text-stone-100 font-serif truncate">{photo.subject}</div>
            <div className="text-[11px] text-stone-400 truncate">{photo.detail}</div>
          </div>
          <div className="text-right shrink-0 pl-2">
            <div className={`text-2xl font-bold font-mono leading-none ${scoreColor}`}>{photo.score}</div>
            <div className={`text-[11px] font-semibold ${scoreColor}`}>{photo.grade}</div>
          </div>
        </div>

        <ul className="space-y-0.5 mt-2">
          {photo.tags.map((t, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px] text-stone-300">
              {t.good ? (
                <CheckCircle size={13} className="text-emerald-400 mt-px shrink-0" />
              ) : (
                <AlertTriangle size={13} className="text-orange-400 mt-px shrink-0" />
              )}
              <span>{t.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export const PhotoGalleryModal: React.FC<{
  photos: ScoredPhoto[];
  onClose: () => void;
  onDelete: (id: string) => void;
}> = ({ photos, onClose, onDelete }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const active = photos.find(p => p.id === selectedId) ?? photos[0] ?? null;
  const bestScore = photos.reduce((max, p) => Math.max(max, p.score), 0);

  return (
    <div className="fixed inset-0 z-[60] bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4 font-sans">
      <div className="bg-stone-900 border border-stone-700 text-stone-200 w-full max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Images size={18} className="text-amber-300" />
            <h2 className="text-lg font-serif font-bold text-amber-100">Wildlife Photo Gallery</h2>
            <span className="text-xs text-stone-400 font-mono">
              {photos.length} photo{photos.length === 1 ? '' : 's'}
              {photos.length > 0 && ` • best score ${bestScore}`}
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <X size={14} /> Close (G / Esc)
          </button>
        </div>

        {photos.length === 0 ? (
          <div className="p-10 text-center text-sm text-stone-400">
            No photos yet. Press <strong className="text-amber-300">[V]</strong> to raise the camera, then click or press{' '}
            <strong className="text-amber-300">Space</strong> to shoot.
            <div className="mt-2 text-xs text-stone-500">
              Responsible wildlife photos score best from a respectful distance (25 yards / 23m+) with optical zoom.
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row min-h-0 flex-1">
            {/* Thumbnail Grid */}
            <div className="md:w-[45%] overflow-y-auto p-3 grid grid-cols-2 gap-2 content-start">
              {photos.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition ${
                    active && active.id === p.id ? 'border-amber-400' : 'border-transparent hover:border-stone-600'
                  }`}
                >
                  <img src={p.dataUrl} alt={p.subject} className="w-full aspect-[3/2] object-cover" />
                  <span className="absolute top-1.5 right-1.5 bg-stone-950/85 text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-md text-amber-200">
                    {p.score}
                  </span>
                </button>
              ))}
            </div>

            {/* Active Photo Inspector */}
            {active && (
              <div className="md:w-[55%] overflow-y-auto p-4 border-t md:border-t-0 md:border-l border-stone-800">
                <img
                  src={active.dataUrl}
                  alt={active.subject}
                  className="w-full aspect-[3/2] object-cover rounded-xl border border-stone-700"
                />

                <div className="flex items-baseline justify-between mt-3">
                  <div>
                    <div className="text-lg font-bold font-serif text-stone-100">{active.subject}</div>
                    <div className="text-xs text-stone-400">{active.detail}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold font-mono text-amber-300 leading-none">{active.score}</div>
                    <div className="text-xs font-semibold text-amber-200">{active.grade}</div>
                  </div>
                </div>

                <div className="text-[11px] text-stone-500 font-mono mt-1">
                  {active.parkName} • {active.timeOfDay} • {active.zoom.toFixed(1)}×
                  {active.distance > 0 && ` • ${Math.round(active.distance)} m`}
                </div>

                {/* Score breakdown tags */}
                <ul className="space-y-1 mt-3">
                  {active.tags.map((t, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-stone-300">
                      {t.good ? (
                        <CheckCircle size={14} className="text-emerald-400 mt-px shrink-0" />
                      ) : (
                        <AlertTriangle size={14} className="text-orange-400 mt-px shrink-0" />
                      )}
                      <span>{t.text}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex gap-2 mt-4">
                  <a
                    href={active.dataUrl}
                    download={`park-explorer-${active.id}.jpg`}
                    className="flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1.5 rounded-xl text-xs font-semibold border border-stone-700 transition cursor-pointer"
                  >
                    <Download size={14} /> Download
                  </a>
                  <button
                    onClick={() => onDelete(active.id)}
                    className="flex items-center gap-1.5 bg-stone-800 hover:bg-rose-900/60 text-stone-300 px-3 py-1.5 rounded-xl text-xs font-semibold border border-stone-700 transition cursor-pointer"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
