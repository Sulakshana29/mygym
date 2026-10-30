'use client';

import React from 'react';
import { Flame, Sparkles } from 'lucide-react';
import { Unit } from '@/types';

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
  return (
    <header className="sticky top-0 z-30 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/50">
          <Flame className="w-5 h-5 text-zinc-950 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-bold text-white tracking-tight">MyGym</h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
              PRO
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 truncate max-w-[150px]">
            {activeProgramName}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* AI Coach Trigger Button */}
        <button
          onClick={onOpenCoach}
          className="flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-sm"
          title="Open AI Split Coach (Gemini 2.5 Flash)"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>AI Coach</span>
        </button>

        {/* Quick Unit Switcher */}
        <button
          onClick={onToggleUnit}
          className="flex items-center bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2.5 py-1 rounded-lg text-xs font-semibold text-zinc-200 transition-colors"
          title="Toggle display unit (raw storage stays in kg)"
        >
          <span className={preferredUnit === 'kg' ? 'text-emerald-400' : 'text-zinc-500'}>
            KG
          </span>
          <span className="text-zinc-600 mx-1">/</span>
          <span className={preferredUnit === 'lb' ? 'text-emerald-400' : 'text-zinc-500'}>
            LB
          </span>
        </button>
      </div>
    </header>
  );
}
