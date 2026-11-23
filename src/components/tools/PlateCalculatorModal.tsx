'use client';

import React, { useState, useMemo } from 'react';
import { X, Disc, ArrowRight } from 'lucide-react';
import { Unit } from '@/types';
import { toDisplayWeight, fromDisplayWeight } from '@/lib/utils/units';

interface PlateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeightKg?: number;
  preferredUnit: Unit;
  onApplyWeight?: (weightKg: number) => void;
}

// Standard Olympic plate configurations with explicit hex colors
const KG_PLATES = [
  { weight: 25, hex: '#dc2626', border: '#ef4444', text: '#ffffff', label: '25', heightPx: 96, name: 'Red' },
  { weight: 20, hex: '#2563eb', border: '#3b82f6', text: '#ffffff', label: '20', heightPx: 88, name: 'Blue' },
  { weight: 15, hex: '#eab308', border: '#facc15', text: '#09090b', label: '15', heightPx: 78, name: 'Yellow' },
  { weight: 10, hex: '#16a34a', border: '#22c55e', text: '#ffffff', label: '10', heightPx: 66, name: 'Green' },
  { weight: 5, hex: '#f4f4f5', border: '#ffffff', text: '#09090b', label: '5', heightPx: 56, name: 'White' },
  { weight: 2.5, hex: '#27272a', border: '#52525b', text: '#f4f4f5', label: '2.5', heightPx: 48, name: 'Black' },
  { weight: 1.25, hex: '#71717a', border: '#a1a1aa', text: '#ffffff', label: '1.25', heightPx: 40, name: 'Silver' },
];

const LB_PLATES = [
  { weight: 45, hex: '#2563eb', border: '#3b82f6', text: '#ffffff', label: '45', heightPx: 96, name: 'Blue' },
  { weight: 35, hex: '#eab308', border: '#facc15', text: '#09090b', label: '35', heightPx: 84, name: 'Yellow' },
  { weight: 25, hex: '#16a34a', border: '#22c55e', text: '#ffffff', label: '25', heightPx: 74, name: 'Green' },
  { weight: 10, hex: '#f4f4f5', border: '#ffffff', text: '#09090b', label: '10', heightPx: 60, name: 'White' },
  { weight: 5, hex: '#27272a', border: '#52525b', text: '#f4f4f5', label: '5', heightPx: 50, name: 'Black' },
  { weight: 2.5, hex: '#71717a', border: '#a1a1aa', text: '#ffffff', label: '2.5', heightPx: 42, name: 'Silver' },
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
    const rawVal = initialWeightKg && initialWeightKg > 0 ? initialWeightKg : (isLb ? 135 : 60);
    const converted = toDisplayWeight(rawVal, preferredUnit);
    return converted > 0 ? converted : (isLb ? 135 : 60);
  });

  // Calculate plates required per side
  const calculation = useMemo(() => {
    const weightPerSide = Math.max(0, (targetWeight - selectedBarWeight) / 2);
    let remaining = weightPerSide;
    const platesPerSide: {
      weight: number;
      count: number;
      hex: string;
      border: string;
      text: string;
      label: string;
      heightPx: number;
      name: string;
    }[] = [];

    for (const plate of platesConfig) {
      if (remaining >= plate.weight) {
        const count = Math.floor(remaining / plate.weight);
        remaining = Math.round((remaining - count * plate.weight) * 100) / 100;
        platesPerSide.push({
          weight: plate.weight,
          count,
          hex: plate.hex,
          border: plate.border,
          text: plate.text,
          label: plate.label,
          heightPx: plate.heightPx,
          name: plate.name,
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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Disc className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Barbell Plate Calculator</h3>
              <p className="text-[11px] text-zinc-400">Visual loading diagram for each side of the bar</p>
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
              className="px-3 h-12 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-bold text-xs transition-colors active:scale-95"
            >
              {isLb ? '-10' : '-5'}
            </button>
            <button
              type="button"
              onClick={() => handleStep(isLb ? -5 : -2.5)}
              className="px-2.5 h-12 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-bold text-xs transition-colors active:scale-95"
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
                className="w-full h-12 bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl px-3 text-center text-2xl font-black font-mono text-white focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500 pointer-events-none">
                {preferredUnit.toUpperCase()}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleStep(isLb ? 5 : 2.5)}
              className="px-2.5 h-12 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-bold text-xs transition-colors active:scale-95"
            >
              {isLb ? '+5' : '+2.5'}
            </button>
            <button
              type="button"
              onClick={() => handleStep(isLb ? 10 : 5)}
              className="px-3 h-12 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-bold text-xs transition-colors active:scale-95"
            >
              {isLb ? '+10' : '+5'}
            </button>
          </div>
        </div>

        {/* Bar Weight Selector */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            Barbell / Apparatus Weight
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

        {/* Visual Barbell Loading Sleeve (Guaranteed High Contrast & Responsive) */}
        <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden">
          <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-2">
            One-Side Sleeve Loading (Inside ➔ Outside)
          </span>

          {calculation.isBelowBar ? (
            <div className="text-center py-4 text-xs text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 rounded-xl px-4">
              Target weight ({targetWeight} {preferredUnit}) is below bar weight ({selectedBarWeight} {preferredUnit}).
            </div>
          ) : calculation.platesPerSide.length === 0 ? (
            <div className="text-center py-4 text-xs text-zinc-400 font-medium">
              Just the empty bar ({selectedBarWeight} {preferredUnit}). No plates needed.
            </div>
          ) : (
            <div className="w-full flex items-center justify-center overflow-x-auto py-3 px-2 scrollbar-none">
              {/* Barbell Sleeve Hub */}
              <div className="flex items-center shrink-0">
                {/* Thick Collar */}
                <div
                  className="w-5 rounded-l border-r-2 border-zinc-900 shadow-lg flex items-center justify-center shrink-0"
                  style={{ height: '100px', backgroundColor: '#52525b' }}
                >
                  <div className="w-1.5 h-14 bg-zinc-800 rounded-sm" />
                </div>

                {/* Sleeve Shaft */}
                <div className="flex items-center relative py-1 shrink-0">
                  {/* Steel Shaft Rod Behind Plates */}
                  <div
                    className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-5 -z-0 rounded"
                    style={{ backgroundColor: '#71717a' }}
                  />

                  {/* Plates Loaded in Order */}
                  <div className="flex items-center gap-1.5 relative z-10 px-1">
                    {calculation.platesPerSide.flatMap((plate) =>
                      Array.from({ length: plate.count }).map((_, idx) => (
                        <div
                          key={`${plate.weight}-${idx}`}
                          className="flex flex-col items-center justify-center rounded-lg shadow-xl shrink-0 transition-transform hover:scale-105"
                          style={{
                            width: '32px',
                            height: `${plate.heightPx}px`,
                            backgroundColor: plate.hex,
                            border: `2.5px solid ${plate.border}`,
                            color: plate.text,
                          }}
                          title={`${plate.weight} ${preferredUnit} (${plate.name})`}
                        >
                          <span className="font-black text-xs font-mono leading-none tracking-tight select-none">
                            {plate.label}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Outer Sleeve Tip End Cap */}
                  <div
                    className="w-7 h-7 rounded-r border-l-2 border-zinc-700 shadow shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: '#52525b' }}
                  >
                    <div className="w-2 h-2 rounded-full bg-zinc-800" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Visual Colorful Plate Breakdown Cards (Clear Badges on Mobile) */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            Plates Needed on EACH Side:
          </span>

          {calculation.platesPerSide.length === 0 ? (
            <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 text-xs text-zinc-400 text-center">
              No plates to load.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {calculation.platesPerSide.map((p) => (
                <div
                  key={p.weight}
                  className="bg-zinc-900 border border-zinc-800/90 p-2.5 rounded-xl flex items-center gap-2.5 shadow-sm"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shadow"
                    style={{
                      backgroundColor: p.hex,
                      border: `2px solid ${p.border}`,
                      color: p.text,
                    }}
                  >
                    {p.label}
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">
                      {p.count} × {p.weight} {preferredUnit}
                    </span>
                    <span className="text-[10px] text-zinc-400 capitalize">
                      {p.name} Plate
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {calculation.remainingPerSide > 0 && (
            <div className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
              ⚠️ Note: Remainder of {calculation.remainingPerSide * 2} {preferredUnit} cannot be evenly loaded with standard plates.
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
