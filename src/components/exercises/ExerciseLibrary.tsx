'use client';

import React, { useState } from 'react';
import { Search, Plus, Filter, Dumbbell, Sparkles, X, Check } from 'lucide-react';
import { Exercise, EquipmentType, MuscleGroup, ExerciseCategory } from '@/types';
import { getStorage } from '@/lib/storage';

interface ExerciseLibraryProps {
  exercises: Exercise[];
  onExerciseAdded: (newExercise: Exercise) => void;
}

const MUSCLE_GROUPS: { id: string; label: string }[] = [
  { id: 'all', label: 'All Muscles' },
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'quads', label: 'Quads' },
  { id: 'hamstrings', label: 'Hamstrings' },
  { id: 'glutes', label: 'Glutes' },
  { id: 'calves', label: 'Calves' },
  { id: 'abs', label: 'Abs & Core' },
  { id: 'forearms', label: 'Forearms' },
  { id: 'traps', label: 'Traps' },
];

const EQUIPMENT_LIST: { id: string; label: string }[] = [
  { id: 'all', label: 'All Gear' },
  { id: 'barbell', label: 'Barbell' },
  { id: 'dumbbell', label: 'Dumbbell' },
  { id: 'cable', label: 'Cable' },
  { id: 'machine', label: 'Machine' },
  { id: 'bodyweight', label: 'Bodyweight' },
  { id: 'ez-bar', label: 'EZ-Bar' },
];

export function ExerciseLibrary({ exercises, onExerciseAdded }: ExerciseLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);

  // Custom exercise form
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<ExerciseCategory>('compound');
  const [customMuscle, setCustomMuscle] = useState<MuscleGroup>('chest');
  const [customEquipment, setCustomEquipment] = useState<EquipmentType>('barbell');
  const [customNotes, setCustomNotes] = useState('');

  const filtered = exercises.filter((ex) => {
    const matchSearch =
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.primaryMuscle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.equipment.toLowerCase().includes(searchQuery.toLowerCase());
    const matchMuscle = selectedMuscle === 'all' || ex.primaryMuscle === selectedMuscle;
    const matchEquipment =
      selectedEquipment === 'all' || ex.equipment === selectedEquipment;
    return matchSearch && matchMuscle && matchEquipment;
  });

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newEx: Exercise = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: customName.trim(),
      category: customCategory,
      primaryMuscle: customMuscle,
      secondaryMuscles: [],
      equipment: customEquipment,
      notes: customNotes.trim() || undefined,
      isCustom: true,
    };

    const storage = getStorage();
    await storage.saveCustomExercise(newEx);
    onExerciseAdded(newEx);

    setIsAddCustomOpen(false);
    setCustomName('');
    setCustomNotes('');
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Search Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Exercise Library</h2>
            <p className="text-xs text-zinc-400">
              {exercises.length} movements available for your splits
            </p>
          </div>
          <button
            onClick={() => setIsAddCustomOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Custom
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search bench press, deadlift, curls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Muscle Filter Carousel */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {MUSCLE_GROUPS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMuscle(m.id)}
              className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition-all ${
                selectedMuscle === m.id
                  ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Equipment Filter Chips */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          {EQUIPMENT_LIST.map((eq) => (
            <button
              key={eq.id}
              onClick={() => setSelectedEquipment(eq.id)}
              className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-all ${
                selectedEquipment === eq.id
                  ? 'bg-zinc-700 text-white font-semibold'
                  : 'bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {eq.label}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Card Grid */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block px-1">
          Showing {filtered.length} exercises
        </span>

        {filtered.map((ex) => (
          <div
            key={ex.id}
            className="bg-zinc-900/90 border border-zinc-800/80 p-3.5 rounded-2xl hover:border-zinc-700 transition-all shadow-sm space-y-1.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-sm font-bold text-white">{ex.name}</h4>
                  {ex.isCustom && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      CUSTOM
                    </span>
                  )}
                  <span
                    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${
                      ex.category === 'compound'
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {ex.category}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400 capitalize">
                  <span className="text-emerald-400 font-semibold">{ex.primaryMuscle}</span>
                  <span>•</span>
                  <span>{ex.equipment}</span>
                  {ex.secondaryMuscles.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-zinc-500 truncate max-w-[150px]">
                        +{ex.secondaryMuscles.join(', ')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {ex.notes && (
              <p className="text-xs text-zinc-400 bg-zinc-950/60 p-2 rounded-xl border border-zinc-800/60">
                💡 {ex.notes}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Add Custom Exercise Modal */}
      {isAddCustomOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white">Create Custom Exercise</h3>
              <button
                onClick={() => setIsAddCustomOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustom} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Exercise Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nordic Hamstring Curl"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Category
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as ExerciseCategory)}
                    className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="compound">Compound</option>
                    <option value="isolation">Isolation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Primary Muscle
                  </label>
                  <select
                    value={customMuscle}
                    onChange={(e) => setCustomMuscle(e.target.value as MuscleGroup)}
                    className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 capitalize"
                  >
                    {MUSCLE_GROUPS.filter((m) => m.id !== 'all').map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Equipment
                </label>
                <select
                  value={customEquipment}
                  onChange={(e) => setCustomEquipment(e.target.value as EquipmentType)}
                  className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 capitalize"
                >
                  {EQUIPMENT_LIST.filter((eq) => eq.id !== 'all').map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Coaching Notes / Cue (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Keep chest high, pause at full stretch."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomOpen(false)}
                  className="flex-1 py-2 bg-zinc-800 text-zinc-300 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Save Exercise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
