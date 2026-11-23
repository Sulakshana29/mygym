'use client';

import React, { useState } from 'react';
import { Flame, Sparkles, Disc } from 'lucide-react';
import { Unit } from '@/types';
import { PlateCalculatorModal } from '../tools/PlateCalculatorModal';

interface AppHeaderProps {
  preferredUnit: Unit;
  onToggleUnit: () => void;
  onOpenCoach: () => void;
  activeProgramName?: string;
}

export function AppHeader({
  preferredUnit,
  onToggleUnit,
  onOpenCoach,
  activeProgramName = 'Winter Arc 5-Day',
}: AppHeaderProps) {
  const [isPlateCalcOpen, setIsPlateCalcOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-800/70 px-4 py-2.5 flex items-center justify-between shadow-lg shadow-black/30">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/10">
          <Flame className="w-5 h-5 text-zinc-950 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-black text-white tracking-tight">MyGym</h1>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-extrabold border border-emerald-500/30 uppercase tracking-wide">
              PRO
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 font-medium truncate max-w-[150px]">
            {activeProgramName}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Plate Calculator Quick Trigger */}
        <button
          onClick={() => setIsPlateCalcOpen(true)}
          className="flex items-center gap-1 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
          title="Open Barbell Plate Calculator"
        >
          <Disc className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Plates</span>
        </button>

        {/* AI Coach Trigger Button */}
        <button
          onClick={onOpenCoach}
          className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500/15 to-teal-500/10 hover:from-emerald-500/25 hover:to-teal-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
          title="Open AI Split Coach"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>AI Coach</span>
        </button>

        {/* Quick Unit Switcher */}
        <button
          onClick={onToggleUnit}
          className="flex items-center bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 px-2.5 py-1.5 rounded-xl text-xs font-bold text-zinc-200 transition-all active:scale-95 shadow-sm"
          title="Toggle display unit (raw storage stays in kg)"
        >
          <span className={preferredUnit === 'kg' ? 'text-emerald-400 font-black' : 'text-zinc-500'}>
            KG
          </span>
          <span className="text-zinc-600 mx-1">/</span>
          <span className={preferredUnit === 'lb' ? 'text-emerald-400 font-black' : 'text-zinc-500'}>
            LB
          </span>
        </button>
      </div>

      {/* Standalone Plate Calculator Modal */}
      {isPlateCalcOpen && (
        <PlateCalculatorModal
          isOpen={isPlateCalcOpen}
          onClose={() => setIsPlateCalcOpen(false)}
          preferredUnit={preferredUnit}
          initialWeightKg={60}
        />
      )}
    </header>
  );
}
