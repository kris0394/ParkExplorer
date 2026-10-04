/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useSyncExternalStore } from 'react';
import {
  BookOpen,
  X,
  Compass,
  Award,
  Coins,
  Footprints,
  Images,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Lock,
  Camera,
  PawPrint,
  MapPin,
  ScrollText,
  ShoppingBag,
  Droplet,
  HeartPulse,
  Bell,
  Binoculars,
} from 'lucide-react';
import { ParkDefinition } from '../data/parks.ts';
import { ScoredPhoto } from '../entities/photography.ts';
import {
  progress,
  getStewardshipRank,
  computeParkStats,
  SHOP_ITEMS,
  ShopItem,
} from '../entities/progress.ts';
import {
  SPECIES_CATALOGUE,
  getSpeciesForPark,
  isFactUnlocked,
  SPECIES_UNLOCK_DESCRIPTIONS,
} from '../data/species.ts';

export const ProgressBadge: React.FC<{
  onOpenJournal: () => void;
  onOpenShop: () => void;
}> = ({ onOpenJournal, onOpenShop }) => {
  const { data } = useSyncExternalStore(progress.subscribe, progress.getSnapshot);
  const rank = getStewardshipRank(data.stewardship);

  return (
    <div className="fixed left-6 top-[4.6rem] z-10 flex items-center gap-2 pointer-events-auto font-sans">
      <div className="flex items-center gap-3 bg-stone-900/65 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-700/50 shadow-lg text-stone-100">
        <button
          onClick={onOpenShop}
          className="flex items-center gap-1.5 hover:text-amber-300 transition cursor-pointer"
          title="Park Credits (Click to open Equipment Shop)"
        >
          <Coins size={15} className="text-amber-300" />
          <span className="font-mono text-sm font-semibold text-amber-200">{data.credits}</span>
        </button>

        <div className="w-px h-4 bg-stone-700/70" />

        <div className="flex flex-col leading-tight" title="Stewardship reputation score">
          <span className="text-[11px] font-semibold text-emerald-200 flex items-center gap-1">
            <Award size={12} className="text-emerald-400" /> {rank.title}
          </span>
          <span className="block h-1 w-24 rounded-full bg-stone-700/80 overflow-hidden mt-0.5">
            <span
              className="block h-full bg-emerald-400"
              style={{ width: `${Math.round(rank.progress * 100)}%` }}
            />
          </span>
        </div>
      </div>

      <button
        onClick={onOpenJournal}
        className="flex items-center gap-1.5 bg-stone-900/65 hover:bg-stone-900/85 backdrop-blur-md px-3 py-2 rounded-xl border border-stone-700/50 shadow-lg text-stone-100 text-xs font-semibold transition cursor-pointer"
        title="Field Journal (J)"
      >
        <BookOpen size={15} className="text-amber-300" /> Journal (J)
      </button>

      <button
        onClick={onOpenShop}
        className="flex items-center gap-1.5 bg-amber-600/85 hover:bg-amber-500 text-stone-950 font-bold px-3 py-2 rounded-xl border border-amber-400/50 shadow-lg text-xs transition cursor-pointer"
        title="Ranger Equipment Shop"
      >
        <ShoppingBag size={14} /> Shop
      </button>
    </div>
  );
};

export const ActivityToastFeed: React.FC = () => {
  const { feed } = useSyncExternalStore(progress.subscribe, progress.getSnapshot);
  const [now, setNow] = useState(Date.now());

  React.useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, []);

  const visible = feed.filter(e => now - e.time < 8000).slice(-4);
  if (visible.length === 0) return null;

  return (
    <div className="fixed right-6 top-20 z-[36] w-72 flex flex-col gap-2 pointer-events-none font-sans">
      {visible.map(e => (
        <div
          key={e.id}
          className={`rounded-2xl border px-3 py-2 shadow-2xl backdrop-blur-md animate-fade-in ${
            e.good ? 'bg-stone-950/90 border-emerald-600/50' : 'bg-orange-950/90 border-orange-500/50'
          }`}
        >
          <div className={`text-xs font-bold ${e.good ? 'text-emerald-200' : 'text-orange-200'}`}>{e.title}</div>
          {e.detail && <div className="text-[11px] text-stone-300 mt-0.5">{e.detail}</div>}
          {(e.credits !== 0 || e.stewardship !== 0) && (
            <div className="flex gap-2 mt-1 text-[11px] font-mono font-bold">
              {e.credits !== 0 && (
                <span className={e.credits > 0 ? 'text-amber-300' : 'text-rose-300'}>
                  {e.credits > 0 ? '+' : ''}
                  {e.credits} Credits
                </span>
              )}
              {e.stewardship !== 0 && (
                <span className={e.stewardship > 0 ? 'text-emerald-300' : 'text-orange-300'}>
                  {e.stewardship > 0 ? '+' : ''}
                  {e.stewardship} Stewardship
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const StatBar: React.FC<{ label: string; value: number; total: number; color?: string }> = ({
  label,
  value,
  total,
  color = 'bg-emerald-400',
}) => (
  <div>
    <div className="flex justify-between text-[11px] text-stone-300 mb-0.5">
      <span>{label}</span>
      <span className="font-mono">
        {value}/{total}
      </span>
    </div>
    <div className="h-1.5 rounded-full bg-stone-800 overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: total ? `${(value / total) * 100}%` : '0%' }} />
    </div>
  </div>
);

const UnlockPill: React.FC<{ on: boolean; children: React.ReactNode }> = ({ on, children }) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
      on
        ? 'bg-emerald-950/70 border-emerald-600/60 text-emerald-200'
        : 'bg-stone-800/60 border-stone-700 text-stone-500'
    }`}
  >
    {on ? <CheckCircle size={12} /> : <Lock size={11} />} {children}
  </span>
);

export const JournalModal: React.FC<{
  park: ParkDefinition;
  photos: ScoredPhoto[];
  initialTab?: 'overview' | 'wildlife' | 'places' | 'shop' | 'activity';
  onClose: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
}> = ({ park, photos, initialTab = 'overview', onClose, onExport, onImport, onReset }) => {
  const { data, saveError } = useSyncExternalStore(progress.subscribe, progress.getSnapshot);
  const [tab, setTab] = useState<'overview' | 'wildlife' | 'places' | 'shop' | 'activity'>(initialTab);

  const parkSpecies = getSpeciesForPark(park.id);
  const [activeSpeciesId, setActiveSpeciesId] = useState<string>(parkSpecies[0] ?? Object.keys(SPECIES_CATALOGUE)[0]);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const rank = getStewardshipRank(data.stewardship);
  const parkStats = computeParkStats(data, park.id, park.landmarks);
  const parkEntry = data.parks[park.id];

  const handleBuy = (itemId: string) => {
    progress.buyEquipment(itemId);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BookOpen size={14} /> },
    { id: 'shop', label: 'Gear Shop', icon: <ShoppingBag size={14} /> },
    { id: 'wildlife', label: 'Wildlife', icon: <PawPrint size={14} /> },
    { id: 'places', label: 'Places', icon: <MapPin size={14} /> },
    { id: 'activity', label: 'Log', icon: <ScrollText size={14} /> },
  ] as const;

  return (
    <div className="fixed inset-0 z-[60] bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4 font-sans">
      <div className="bg-stone-900 border border-stone-700 text-stone-200 w-full max-w-4xl h-[88vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-amber-300" />
            <h2 className="text-lg font-serif font-bold text-amber-100">National Park Field Journal</h2>
            <span className="text-xs text-stone-500 font-mono hidden sm:inline">{park.name}</span>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <X size={14} /> Close (J / Esc)
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex gap-1 px-4 pt-3 border-b border-stone-800">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl text-xs font-semibold cursor-pointer transition ${
                tab === t.id ? 'bg-stone-800 text-amber-200' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {t.icon} {t.label}
              {t.id === 'shop' && (
                <span className="ml-1 bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-md font-mono text-[10px]">
                  {data.credits} Cr
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* TAB 1: OVERVIEW */}
          {tab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-4">
                {/* Credits & Stewardship */}
                <div className="bg-stone-800/60 rounded-2xl p-4 border border-stone-700/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-300">
                      <Coins size={20} />
                      <span className="text-3xl font-bold font-mono">{data.credits}</span>
                      <span className="text-xs text-stone-400">Park Credits</span>
                    </div>

                    <button
                      onClick={() => setTab('shop')}
                      className="text-xs bg-amber-600/80 hover:bg-amber-500 text-stone-950 font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      Visit Shop &rarr;
                    </button>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-emerald-300">
                    <Award size={18} />
                    <span className="font-bold font-serif text-base">{rank.title}</span>
                    <span className="text-xs text-stone-400 font-mono">{data.stewardship} Stewardship</span>
                  </div>

                  <div className="h-2 rounded-full bg-stone-700 overflow-hidden mt-2">
                    <div className="h-full bg-emerald-400" style={{ width: `${Math.round(rank.progress * 100)}%` }} />
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1">
                    {rank.next
                      ? `${rank.next.at - data.stewardship} more Stewardship points to achieve "${rank.next.title}"`
                      : 'You have reached the highest Park Guardian rank!'}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-2 leading-relaxed">
                    Credits are earned by exploring landmarks, identifying wildlife, and taking composed photos.
                    Stewardship grows through respectful observation and safe 23m+ distances.
                  </p>
                </div>

                {/* Park Progress */}
                <div className="bg-stone-800/60 rounded-2xl p-4 border border-stone-700/60">
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="text-sm font-bold text-amber-100 font-serif">{park.name}</h3>
                    <span className="text-xl font-bold font-mono text-emerald-300">{parkStats.percent}%</span>
                  </div>
                  <div className="space-y-2">
                    <StatBar label="Places discovered" value={parkStats.landmarksFound} total={parkStats.landmarksTotal} />
                    <StatBar
                      label="Wildlife identified calmly"
                      value={parkStats.wildlifeIdentified}
                      total={parkStats.wildlifeTotal}
                    />
                    <StatBar
                      label="Subjects photographed"
                      value={parkStats.photographed}
                      total={parkStats.photographedTotal}
                      color="bg-amber-400"
                    />
                  </div>
                  <div className="text-[11px] text-stone-500 mt-2">
                    Visited {parkEntry?.visits ?? 1} time{(parkEntry?.visits ?? 1) === 1 ? '' : 's'}.
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Stats */}
                <div className="bg-stone-800/60 rounded-2xl p-4 border border-stone-700/60">
                  <h3 className="text-sm font-bold text-amber-100 font-serif mb-2">Career Field Record</h3>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    {[
                      ['Animals identified', data.stats.sightings],
                      ['Calm sightings', data.stats.responsibleSightings],
                      ['Photos taken', data.stats.photos],
                      ['Best photo score', data.stats.bestPhotoScore],
                      ['Responsible photos', data.stats.responsiblePhotos],
                      ['Water drunk (L)', (data.stats.waterDrunk || 0).toFixed(1)],
                    ].map(([label, val]) => (
                      <div key={label as string} className="bg-stone-900/70 rounded-xl py-2 border border-stone-800">
                        <div className="text-xl font-bold font-mono text-stone-100">{val}</div>
                        <div className="text-[10px] uppercase tracking-wide text-stone-500">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save & Backup */}
                <div className="bg-stone-800/60 rounded-2xl p-4 border border-stone-700/60">
                  <h3 className="text-sm font-bold text-amber-100 font-serif mb-1">Local Progress Storage</h3>
                  <p className="text-[11px] text-stone-400">
                    Journal and photos save automatically in this browser. Export a backup anytime to prevent clearing.
                  </p>
                  {saveError && (
                    <p className="text-[11px] text-orange-300 mt-1 flex items-center gap-1">
                      <AlertTriangle size={12} /> Local storage blocked. Export a backup to preserve your work.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={onExport}
                      className="flex items-center gap-1.5 bg-stone-700 hover:bg-stone-600 text-stone-100 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition"
                    >
                      <Download size={13} /> Export Backup
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 bg-stone-700 hover:bg-stone-600 text-stone-100 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition"
                    >
                      <Upload size={13} /> Import Backup
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) onImport(file);
                        e.target.value = '';
                      }}
                    />

                    {confirmReset ? (
                      <span className="flex items-center gap-2 text-[11px] text-rose-300">
                        Erase save?
                        <button
                          onClick={() => {
                            onReset();
                            setConfirmReset(false);
                          }}
                          className="bg-rose-700 hover:bg-rose-600 text-white px-2.5 py-1 rounded-lg font-bold cursor-pointer"
                        >
                          Yes, Reset
                        </button>
                        <button
                          onClick={() => setConfirmReset(false)}
                          className="text-stone-300 underline cursor-pointer"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmReset(true)}
                        className="flex items-center gap-1.5 bg-stone-800 hover:bg-rose-900/60 text-stone-300 px-3 py-1.5 rounded-xl text-xs font-semibold border border-stone-700 cursor-pointer transition"
                      >
                        <RotateCcw size={13} /> Reset Save
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EQUIPMENT SHOP (TASK 7) */}
          {tab === 'shop' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-800/80 p-4 rounded-2xl border border-stone-700/70">
                <div>
                  <h3 className="text-base font-serif font-bold text-amber-100">Ranger Supply & Equipment Outfitter</h3>
                  <p className="text-xs text-stone-300">
                    Equip authentic backcountry gear with real capabilities using your earned Park Credits.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-stone-950 px-4 py-2 rounded-xl border border-amber-500/40">
                  <Coins size={16} className="text-amber-400" />
                  <span className="text-lg font-mono font-bold text-amber-200">{data.credits}</span>
                  <span className="text-xs text-stone-400">Available Credits</span>
                </div>
              </div>

              {/* Water & Hydration Quick Status */}
              <div className="bg-stone-800/40 p-3.5 rounded-2xl border border-stone-700/50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Droplet size={20} className="text-cyan-400" />
                  <div>
                    <div className="text-xs font-bold text-stone-200">Current Trail Hydration</div>
                    <div className="text-[11px] text-stone-400">
                      Water level: {Math.round(data.hydration)}% • Canteen: {data.waterLiters.toFixed(2)} /{' '}
                      {data.maxWaterLiters.toFixed(1)} L
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <button
                    onClick={() => progress.drinkWater()}
                    className="bg-cyan-700 hover:bg-cyan-600 text-stone-100 px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer"
                    title="Press X in the field to drink"
                  >
                    Drink (X)
                  </button>
                  <button
                    onClick={() => progress.refillWater('Trailhead Water Station')}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-100 px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer"
                  >
                    Refill at Station
                  </button>
                </div>
              </div>

              {/* Shop Items Grid */}
              <div className="grid md:grid-cols-2 gap-3.5">
                {SHOP_ITEMS.map(item => {
                  const isOwned = Boolean(data.ownedEquipment[item.id]);
                  const canAfford = data.credits >= item.price;

                  const getIcon = () => {
                    switch (item.iconName) {
                      case 'compass':
                        return <Compass size={20} className="text-amber-400" />;
                      case 'droplet':
                        return <Droplet size={20} className="text-cyan-400" />;
                      case 'binoculars':
                        return <Binoculars size={20} className="text-emerald-400" />;
                      case 'camera':
                        return <Camera size={20} className="text-amber-300" />;
                      case 'heart-pulse':
                        return <HeartPulse size={20} className="text-rose-400" />;
                      case 'bell':
                        return <Bell size={20} className="text-amber-400" />;
                      default:
                        return <ShoppingBag size={20} className="text-amber-400" />;
                    }
                  };

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                        isOwned
                          ? 'bg-stone-800/40 border-stone-700/40'
                          : canAfford
                          ? 'bg-stone-800/80 border-amber-600/40 hover:border-amber-500'
                          : 'bg-stone-900/60 border-stone-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-stone-950/80 border border-stone-800">{getIcon()}</div>
                            <div>
                              <div className="text-sm font-bold text-amber-100 font-serif">{item.name}</div>
                              <div className="text-[11px] text-stone-400 capitalize">{item.category} equipment</div>
                            </div>
                          </div>

                          <div className="text-right">
                            {isOwned ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-600/50 px-2 py-0.5 rounded-lg">
                                <CheckCircle size={12} /> Owned
                              </span>
                            ) : (
                              <span className="font-mono text-sm font-bold text-amber-300 flex items-center gap-1">
                                <Coins size={13} /> {item.price} Cr
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-stone-300 mt-2 mb-2 leading-relaxed">{item.shortDesc}</p>

                        <div className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-800/80 text-[11px] text-amber-200/90 leading-normal">
                          <strong className="text-amber-400">In-game capability:</strong> {item.capability}
                        </div>
                      </div>

                      <div className="mt-3.5 flex justify-end">
                        {isOwned ? (
                          item.id === 'compass_map' ? (
                            <button
                              onClick={() => progress.toggleCompass()}
                              className="text-xs bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                            >
                              {data.isCompassEquipped ? 'Stow Compass' : 'Hold Compass (K)'}
                            </button>
                          ) : (
                            <span className="text-[11px] text-stone-400 font-mono">Active in backpack</span>
                          )
                        ) : (
                          <button
                            onClick={() => handleBuy(item.id)}
                            disabled={!canAfford}
                            className={`text-xs px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
                              canAfford
                                ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-md'
                                : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700/40'
                            }`}
                          >
                            {canAfford ? 'Purchase Gear' : 'Need more credits'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: WILDLIFE */}
          {tab === 'wildlife' && (
            <div className="flex flex-col md:flex-row gap-4">
              {/* Species Selector */}
              <div className="md:w-48 space-y-1.5 shrink-0">
                {Object.values(SPECIES_CATALOGUE).map(sp => {
                  const isSeen = (data.species[sp.id]?.variantsIdentified.length ?? 0) > 0;
                  return (
                    <button
                      key={sp.id}
                      onClick={() => setActiveSpeciesId(sp.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl border text-xs cursor-pointer transition ${
                        activeSpeciesId === sp.id
                          ? 'bg-stone-800 border-amber-500/60 text-amber-100'
                          : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-600'
                      }`}
                    >
                      <div className="font-semibold">{isSeen ? sp.name : '??? (Unobserved)'}</div>
                      <div className="text-[10px] text-stone-500">{isSeen ? sp.scientific : 'Keep exploring glades'}</div>
                    </button>
                  );
                })}
              </div>

              {/* Species Detail */}
              <div className="flex-1 min-w-0">
                {(() => {
                  const sp = SPECIES_CATALOGUE[activeSpeciesId];
                  if (!sp) return null;
                  const record = data.species[sp.id];
                  const hasSeen = (record?.variantsIdentified.length ?? 0) > 0;

                  if (!hasSeen) {
                    return (
                      <div className="bg-stone-800/60 rounded-2xl p-6 border border-stone-700/60 text-center">
                        <div className="text-4xl font-serif text-stone-600 mb-2">?</div>
                        <div className="text-sm text-stone-300">You have not identified this species yet.</div>
                        <div className="text-xs text-stone-500 mt-1">
                          Raise the binoculars [B], find an animal in the meadow, and center it inside the reticle to
                          study its features.
                        </div>
                      </div>
                    );
                  }

                  const stats = {
                    identified: hasSeen,
                    photographed: Boolean(record?.photographed),
                    responsible: (record?.responsibleCount ?? 0) > 0,
                    variantsIdentified: sp.variants.filter(v => record?.variantsIdentified.includes(v)).length,
                    variantsTotal: sp.variants.length,
                  };

                  const bestPhoto = record?.bestPhotoId ? photos.find(p => p.id === record.bestPhotoId) : undefined;

                  return (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-serif font-bold text-amber-100">{sp.name}</h3>
                        <div className="text-xs italic text-stone-400">{sp.scientific}</div>
                        <p className="text-sm text-stone-300 mt-1 leading-relaxed">{sp.blurb}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <UnlockPill on={stats.identified}>Observed</UnlockPill>
                        <UnlockPill on={stats.photographed}>Photographed</UnlockPill>
                        <UnlockPill on={stats.responsible}>Observed at Safe Distance</UnlockPill>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="bg-stone-800/60 rounded-2xl p-3 border border-stone-700/60">
                            <div className="text-[11px] uppercase tracking-wide text-stone-500 mb-1.5">
                              Variants Catalogued
                            </div>
                            <ul className="space-y-1">
                              {sp.variants.map(v => {
                                const seen = Boolean(record?.variantsIdentified.includes(v));
                                return (
                                  <li
                                    key={v}
                                    className={`flex items-center gap-1.5 text-xs ${
                                      seen ? 'text-stone-200' : 'text-stone-500'
                                    }`}
                                  >
                                    {seen ? (
                                      <CheckCircle size={13} className="text-emerald-400" />
                                    ) : (
                                      <Lock size={12} />
                                    )}
                                    {seen ? v : 'Undiscovered variant'}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>

                          {bestPhoto && (
                            <div className="bg-stone-800/60 rounded-2xl p-2 border border-stone-700/60">
                              <img
                                src={bestPhoto.dataUrl}
                                alt="Best photograph"
                                className="w-full aspect-[3/2] object-cover rounded-xl"
                              />
                              <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mt-1.5 px-1">
                                <Camera size={12} /> Best photo:
                                <span className="font-mono text-amber-300 font-bold">{bestPhoto.score} pts</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="text-[11px] uppercase tracking-wide text-stone-500">Field Naturalist Notes</div>
                          {sp.facts.map(f => {
                            const unlocked = isFactUnlocked(f.unlock, stats);
                            return unlocked ? (
                              <div
                                key={f.id}
                                className="text-xs text-stone-200 bg-stone-800/60 rounded-xl p-2.5 border border-stone-700/60 leading-relaxed"
                              >
                                {f.text}
                              </div>
                            ) : (
                              <div
                                key={f.id}
                                className="text-xs text-stone-500 bg-stone-900 rounded-xl p-2.5 border border-stone-800 flex items-start gap-1.5"
                              >
                                <Lock size={12} className="mt-0.5 shrink-0" /> {SPECIES_UNLOCK_DESCRIPTIONS[f.unlock]}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Personal Field Notes */}
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-stone-500 mb-1">
                          Personal Observations & Sighting Notes
                        </div>
                        <textarea
                          value={record?.note ?? ''}
                          onChange={e => progress.setNote('species', sp.id, park.id, e.target.value)}
                          placeholder="Record details about herd behavior, locations, weather, or feeding..."
                          className="w-full h-24 bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500/60 resize-none"
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB 4: PLACES */}
          {tab === 'places' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-400">
                Walk near landmarks to register them in your journal. Photograph them from scenic angles for exploration
                bonuses.
              </p>
              {park.landmarks.map(lm => {
                const entry = parkEntry?.landmarks[lm.id];
                const discovered = Boolean(entry?.discovered);

                return (
                  <div key={lm.id} className="bg-stone-800/60 rounded-2xl p-3.5 border border-stone-700/60">
                    {discovered ? (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-serif font-bold text-amber-100 text-sm flex items-center gap-1.5">
                            <MapPin size={14} className="text-amber-400" /> {lm.name}
                          </div>
                          <div className="flex gap-2">
                            <UnlockPill on={true}>Discovered</UnlockPill>
                            <UnlockPill on={Boolean(entry?.photographed)}>
                              {entry?.photographed ? `Photographed (${entry.bestPhotoScore} pts)` : 'Not photographed'}
                            </UnlockPill>
                          </div>
                        </div>
                        <p className="text-xs text-stone-300 mt-1">{lm.description}</p>
                        <textarea
                          value={entry?.note ?? ''}
                          onChange={e => progress.setNote('landmark', lm.id, park.id, e.target.value)}
                          placeholder="Notes about trails, switchbacks, and viewpoints..."
                          className="w-full h-14 mt-2 bg-stone-950 border border-stone-700 rounded-xl p-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500/60 resize-none"
                        />
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <Lock size={13} /> Undiscovered landmark. Explore the valley trails to locate it.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 5: ACTIVITY LOG */}
          {tab === 'activity' && (
            <div className="space-y-2">
              {data.activity.length === 0 && (
                <div className="text-sm text-stone-400 text-center py-8">
                  No activity recorded yet. Observe an animal, take a photo, or hike to a landmark to start your log.
                </div>
              )}
              {data.activity.map(entry => (
                <div
                  key={entry.id}
                  className={`rounded-xl border px-3 py-2 ${
                    entry.good ? 'bg-stone-800/60 border-stone-700/60' : 'bg-orange-950/40 border-orange-700/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className={`text-xs font-bold ${entry.good ? 'text-stone-100' : 'text-orange-200'}`}>
                      {entry.title}
                    </div>
                    <div className="flex gap-2 text-[11px] font-mono font-bold shrink-0">
                      {entry.credits !== 0 && (
                        <span className={entry.credits > 0 ? 'text-amber-300' : 'text-rose-300'}>
                          {entry.credits > 0 ? '+' : ''}
                          {entry.credits} Cr
                        </span>
                      )}
                      {entry.stewardship !== 0 && (
                        <span className={entry.stewardship > 0 ? 'text-emerald-300' : 'text-orange-300'}>
                          {entry.stewardship > 0 ? '+' : ''}
                          {entry.stewardship} St
                        </span>
                      )}
                    </div>
                  </div>
                  {entry.detail && <div className="text-[11px] text-stone-400 mt-0.5">{entry.detail}</div>}
                  <div className="text-[10px] text-stone-600 mt-0.5">{new Date(entry.time).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
