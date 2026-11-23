'use client';

import React, { useState, useMemo } from 'react';
import { X, Disc, Plus, Minus, ArrowRight } from 'lucide-react';
import { Unit } from '@/types';
import { toDisplayWeight, fromDisplayWeight } from '@/lib/utils/units';

interface PlateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeightKg?: number;
  preferredUnit: Unit;
  onApplyWeight?: (weightKg: number) => void;
}

// Standard Olympic plate configurations
const KG_PLATES = [
  { weight: 25, color: 'bg-red-600 border-red-500 text-white', label: '25', height: 'h-24' },
  { weight: 20, color: 'bg-blue-600 border-blue-500 text-white', label: '20', height: 'h-22' },
  { weight: 15, color: 'bg-amber-500 border-amber-400 text-zinc-950', label: '15', height: 'h-20' },
  { weight: 10, color: 'bg-emerald-600 border-emerald-500 text-white', label: '10', height: 'h-16' },
  { weight: 5, color: 'bg-zinc-200 border-white text-zinc-900', label: '5', height: 'h-14' },
  { weight: 2.5, color: 'bg-zinc-800 border-zinc-600 text-zinc-200', label: '2.5', height: 'h-12' },
  { weight: 1.25, color: 'bg-zinc-600 border-zinc-400 text-zinc-100', label: '1.25', height: 'h-10' },
];

const LB_PLATES = [
  { weight: 45, color: 'bg-blue-600 border-blue-500 text-white', label: '45', height: 'h-24' },
  { weight: 35, color: 'bg-amber-500 border-amber-400 text-zinc-950', label: '35', height: 'h-20' },
  { weight: 25, color: 'bg-emerald-600 border-emerald-500 text-white', label: '25', height: 'h-18' },
  { weight: 10, color: 'bg-zinc-200 border-white text-zinc-900', label: '10', height: 'h-14' },
  { weight: 5, color: 'bg-zinc-800 border-zinc-600 text-zinc-200', label: '5', height: 'h-12' },
  { weight: 2.5, color: 'bg-zinc-600 border-zinc-400 text-zinc-100', label: '2.5', height: 'h-10' },
];

const BAR_OPTIONS = {
  kg: [
    { label: 'Olympic (20 kg)', weight: 20 },
    { label: 'Women (15 kg)', weight: 15 },
    { label: 'EZ Bar (10 kg)', weight: 10 },
    { label: 'Machine (0 kg)', weight: 0 },
  ],
  lb: [
    { label: 'Olympic (45 lb)', weight: 45 },
    { label: 'Women (35 lb)', weight: 35 },
    { label: 'EZ Bar (25 lb)', weight: 25 },
    { label: 'Machine (0 lb)', weight: 0 },
  ],
};

export function PlateCalculatorModal({
  isOpen,
  onClose,
  initialWeightKg = 60,
  preferredUnit,
  onApplyWeight,
}: PlateCalculatorModalProps) {
  const isLb = preferredUnit === 'lb';
  const availableBars = isLb ? BAR_OPTIONS.lb : BAR_OPTIONS.kg;
  const platesConfig = isLb ? LB_PLATES : KG_PLATES;

  // Selected bar weight in current unit
  const [selectedBarWeight, setSelectedBarWeight] = useState<number>(
    isLb ? 45 : 20
  );

  // Target total weight in current display unit
  const [targetWeight, setTargetWeight] = useState<number>(() => {
    return toDisplayWeight(initialWeightKg > 0 ? initialWeightKg : (isLb ? 135 : 60), preferredUnit);
  });

  // Calculate plates required per side
  const calculation = useMemo(() => {
    const weightPerSide = Math.max(0, (targetWeight - selectedBarWeight) / 2);
    let remaining = weightPerSide;
    const platesPerSide: { weight: number; count: number; color: string; label: string; height: string }[] = [];

    for (const plate of platesConfig) {
      if (remaining >= plate.weight) {
        const count = Math.floor(remaining / plate.weight);
        remaining = Math.round((remaining - count * plate.weight) * 100) / 100;
        platesPerSide.push({
          weight: plate.weight,
          count,
          color: plate.color,
          label: plate.label,
          height: plate.height,
        });
      }
    }

    const totalLoadedWeight = selectedBarWeight + (weightPerSide - remaining) * 2;

    return {
      weightPerSide,
      remainingPerSide: remaining,
      platesPerSide,
      totalLoadedWeight,
      isBelowBar: targetWeight < selectedBarWeight,
    };
  }, [targetWeight, selectedBarWeight, platesConfig]);

  if (!isOpen) return null;

  const handleStep = (step: number) => {
    setTargetWeight((prev) => Math.max(0, Math.round((prev + step) * 10) / 10));
  };

  const handleApply = () => {
    if (onApplyWeight) {
      const weightInKg = fromDisplayWeight(targetWeight, preferredUnit);
      onApplyWeight(weightInKg);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Disc className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Barbell Plate Calculator</h3>
              <p className="text-[11px] text-zinc-400">Exact plates to load on each side of the bar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Weight Input & Steppers */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Target Weight</span>
            <span className="text-xs font-semibold text-emerald-400">
              Per side: <strong className="font-mono text-sm">{calculation.weightPerSide} {preferredUnit}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStep(isLb ? -10 : -5)}
              className="px-3 h-12 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-bold text-xs transition-colors"
            >
              {isLb ? '-10' : '-5'}
            </button>
            <button
              type="button"
              onClick={() => handleStep(isLb ? -5 : -2.5)}
              className="px-2.5 h-12 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-bold text-xs transition-colors"
            >
              {isLb ? '-5' : '-2.5'}
            </button>

            <div className="flex-1 relative">
              <input
                type="number"
                step={isLb ? 2.5 : 1.25}
                min={0}
                value={targetWeight || ''}
                onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 0)}
                className="w-full h-12 bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl px-3 text-center text-xl font-black font-mono text-white focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500 pointer-events-none">
                {preferredUnit.toUpperCase()}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleStep(isLb ? 5 : 2.5)}
              className="px-2.5 h-12 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-bold text-xs transition-colors"
            >
              {isLb ? '+5' : '+2.5'}
            </button>
            <button
              type="button"
              onClick={() => handleStep(isLb ? 10 : 5)}
              className="px-3 h-12 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-bold text-xs transition-colors"
            >
              {isLb ? '+10' : '+5'}
            </button>
          </div>
        </div>

        {/* Bar Weight Selector */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            Bar / Apparatus Type
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {availableBars.map((bar) => {
              const isSelected = selectedBarWeight === bar.weight;
              return (
                <button
                  key={bar.label}
                  type="button"
                  onClick={() => setSelectedBarWeight(bar.weight)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border text-center ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {bar.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Visual Barbell Graphic */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
            One Side Sleeve Loading (Inside ➔ Outside)
          </span>

          {calculation.isBelowBar ? (
            <div className="text-center py-4 text-xs text-amber-400 font-medium">
              Target weight ({targetWeight} {preferredUnit}) is less than bar weight ({selectedBarWeight} {preferredUnit}).
            </div>
          ) : calculation.platesPerSide.length === 0 ? (
            <div className="text-center py-4 text-xs text-zinc-400 font-medium">
              Just the empty bar! ({selectedBarWeight} {preferredUnit})
            </div>
          ) : (
            <div className="flex items-center gap-1 overflow-x-auto max-w-full py-2 px-3">
              {/* Barbell Collar / Sleeve Base */}
              <div className="w-4 h-16 bg-zinc-700 border-r-2 border-zinc-600 rounded-l flex items-center justify-center shrink-0">
                <div className="w-1.5 h-12 bg-zinc-600 rounded-sm" />
              </div>

              {/* Bar Shaft Background */}
              <div className="flex items-center gap-1.5 relative py-2">
                {/* Horizontal Bar line behind plates */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-3 bg-zinc-700 -z-0 rounded" />

                {/* Plates loaded from inside to outside */}
                {calculation.platesPerSide.flatMap((plate) =>
                  Array.from({ length: plate.count }).map((_, idx) => (
                    <div
                      key={`${plate.weight}-${idx}`}
                      className={`relative z-10 w-6 sm:w-7 ${plate.height} ${plate.color} border-2 rounded-md shadow-md flex flex-col items-center justify-center font-black text-[10px] tracking-tight shrink-0 transition-all hover:scale-105`}
                      title={`${plate.weight} ${preferredUnit}`}
                    >
                      <span className="rotate-90 sm:rotate-0 leading-none">{plate.label}</span>
                    </div>
                  ))
                )}

                {/* Outer Sleeve Tip */}
                <div className="relative z-10 w-6 h-6 bg-zinc-600 rounded-r border border-zinc-500 shrink-0" />
              </div>
            </div>
          )}
        </div>

        {/* Numerical Breakdown Summary */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
            <span>Each Side Requires:</span>
            <span className="text-emerald-400 font-mono font-black">
              {calculation.platesPerSide.length === 0
                ? 'No plates'
                : calculation.platesPerSide.map((p) => `${p.count}×${p.label}${preferredUnit}`).join(', ')}
            </span>
          </div>

          {calculation.remainingPerSide > 0 && (
            <div className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
              ⚠️ Note: {calculation.remainingPerSide * 2} {preferredUnit} cannot be evenly loaded with standard plates.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {onApplyWeight && (
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <span>Use {targetWeight} {preferredUnit}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`${onApplyWeight ? 'px-4' : 'w-full'} py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-sm rounded-xl transition-colors`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
