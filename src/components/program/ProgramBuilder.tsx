'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Clock,
  Repeat,
  CheckCircle2,
  Sparkles,
  Layers,
  Info,
  Search,
  X,
  Dumbbell,
  ArrowRight,
} from 'lucide-react';
import { Exercise, MuscleGroup, PlannedExercise, Program, ProgramDay } from '@/types';
import { getStorage } from '@/lib/storage';

interface ProgramBuilderProps {
  program: Program;
  allPrograms: Program[];
  exercises: Exercise[];
  onProgramUpdated: (updated: Program) => void;
  onProgramSwitched: (programId: string) => void;
}

const DAYS_OF_WEEK = [
  { dayIndex: 1, label: 'Mon', full: 'Monday' },
  { dayIndex: 2, label: 'Tue', full: 'Tuesday' },
  { dayIndex: 3, label: 'Wed', full: 'Wednesday' },
  { dayIndex: 4, label: 'Thu', full: 'Thursday' },
  { dayIndex: 5, label: 'Fri', full: 'Friday' },
  { dayIndex: 6, label: 'Sat', full: 'Saturday' },
  { dayIndex: 0, label: 'Sun', full: 'Sunday' },
];

export function ProgramBuilder({
  program,
  allPrograms,
  exercises,
  onProgramUpdated,
  onProgramSwitched,
}: ProgramBuilderProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(1); // Monday default
  const [isSwitchSplitOpen, setIsSwitchSplitOpen] = useState(false);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);

  // Add exercise modal form state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [newSets, setNewSets] = useState(3);
  const [newRepMin, setNewRepMin] = useState(8);
  const [newRepMax, setNewRepMax] = useState(12);
  const [newRestSec, setNewRestSec] = useState(90);
  const [newRpe, setNewRpe] = useState(8);
  const [newNotes, setNewNotes] = useState('');

  // Find day in program
  const currentDay: ProgramDay = program.days.find(
    (d) => d.dayOfWeek === selectedDayIndex
  ) || {
    id: `day-${selectedDayIndex}`,
    dayOfWeek: selectedDayIndex,
    name: `${DAYS_OF_WEEK.find((d) => d.dayIndex === selectedDayIndex)?.full} Workout`,
    isRestDay: false,
    exercises: [],
  };

  const getExercise = (id: string) => exercises.find((e) => e.id === id);

  const handleUpdateProgram = async (updatedProgram: Program) => {
    const storage = getStorage();
    await storage.saveProgram(updatedProgram);
    onProgramUpdated(updatedProgram);
  };

  const handleToggleRestDay = async () => {
    const updatedDays = program.days.map((d) => {
      if (d.dayOfWeek === selectedDayIndex) {
        return {
          ...d,
          isRestDay: !d.isRestDay,
        };
      }
      return d;
    });
    await handleUpdateProgram({ ...program, days: updatedDays });
  };

  const handleMoveExercise = async (index: number, direction: 'up' | 'down') => {
    const exList = [...currentDay.exercises];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= exList.length) return;

    const temp = exList[index];
    exList[index] = exList[targetIndex];
    exList[targetIndex] = temp;

    // Reassign order
    const updatedExList = exList.map((item, idx) => ({ ...item, order: idx + 1 }));

    const updatedDays = program.days.map((d) => {
      if (d.dayOfWeek === selectedDayIndex) {
        return { ...d, exercises: updatedExList };
      }
      return d;
    });

    await handleUpdateProgram({ ...program, days: updatedDays });
  };

  const handleDeleteExercise = async (plannedId: string) => {
    const updatedExList = currentDay.exercises
      .filter((e) => e.id !== plannedId)
      .map((item, idx) => ({ ...item, order: idx + 1 }));

    const updatedDays = program.days.map((d) => {
      if (d.dayOfWeek === selectedDayIndex) {
        return { ...d, exercises: updatedExList };
      }
      return d;
    });

    await handleUpdateProgram({ ...program, days: updatedDays });
  };

  const handleAddExerciseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExerciseId) return;

    const newPlanned: PlannedExercise = {
      id: `planned-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      exerciseId: selectedExerciseId,
      sets: newSets,
      repMin: newRepMin,
      repMax: newRepMax,
      restSec: newRestSec,
      targetRpe: newRpe,
      order: currentDay.exercises.length + 1,
      notes: newNotes.trim() || undefined,
    };

    const updatedDays = program.days.map((d) => {
      if (d.dayOfWeek === selectedDayIndex) {
        return {
          ...d,
          isRestDay: false,
          exercises: [...d.exercises, newPlanned],
        };
      }
      return d;
    });

    await handleUpdateProgram({ ...program, days: updatedDays });
    setIsAddExerciseOpen(false);
    setSelectedExerciseId('');
    setNewNotes('');
  };

  // Filter exercises for modal
  const filteredExercises = exercises.filter((ex) => {
    const matchSearch =
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.primaryMuscle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchMuscle = selectedMuscle === 'all' || ex.primaryMuscle === selectedMuscle;
    return matchSearch && matchMuscle;
  });

  const totalSets = currentDay.exercises.reduce((sum, e) => sum + e.sets, 0);

  return (
    <div className="space-y-4 pb-24">
      {/* Active Program Card */}
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 p-4 rounded-2xl border border-zinc-800/80 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                Active Program
              </span>
              <span className="text-xs text-zinc-400 capitalize">
                {program.splitType.replace('_', ' ')}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1.5">{program.name}</h2>
            <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
              {program.description}
            </p>
          </div>
          <button
            onClick={() => setIsSwitchSplitOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium border border-zinc-700/60 transition-colors shrink-0 ml-2"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            Switch
          </button>
        </div>
      </div>

      {/* Weekday Selector Pills */}
      <div className="flex items-center justify-between gap-1.5 bg-zinc-900/60 p-1.5 rounded-2xl border border-zinc-800/60">
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = selectedDayIndex === day.dayIndex;
          const dayData = program.days.find((d) => d.dayOfWeek === day.dayIndex);
          const isRest = dayData?.isRestDay ?? false;
          return (
            <button
              key={day.dayIndex}
              onClick={() => setSelectedDayIndex(day.dayIndex)}
              className={`flex-1 py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all duration-200 ${
                isSelected
                  ? 'bg-emerald-500 text-zinc-950 font-bold shadow-md shadow-emerald-500/20 scale-105'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <span className="text-xs">{day.label}</span>
              <span
                className={`w-1.5 h-1.5 rounded-full mt-1 ${
                  isSelected
                    ? 'bg-zinc-950'
                    : isRest
                    ? 'bg-zinc-600'
                    : 'bg-emerald-400'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Day Overview Banner */}
      <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800/80">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {currentDay.name}
              {currentDay.isRestDay && (
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Rest Day
                </span>
              )}
            </h3>
            {currentDay.subtitle && (
              <p className="text-xs text-zinc-400 mt-0.5">{currentDay.subtitle}</p>
            )}
          </div>

          <button
            onClick={handleToggleRestDay}
            className={`text-xs px-2.5 py-1.5 rounded-xl font-medium border transition-colors ${
              currentDay.isRestDay
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
            }`}
          >
            {currentDay.isRestDay ? 'Make Workout' : 'Make Rest'}
          </button>
        </div>

        {!currentDay.isRestDay && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-800/60 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentDay.exercises.length} exercises</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-emerald-400" />
              <span>{totalSets} total sets</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>~{Math.round(totalSets * 2.2)} mins</span>
            </div>
          </div>
        )}
      </div>

      {/* Planned Exercises List or Rest State */}
      {currentDay.isRestDay ? (
        <div className="bg-zinc-900/40 border border-zinc-800/60 border-dashed rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-zinc-200">Scheduled Recovery</h4>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-1">
            Muscles grow during recovery! Prioritize 8+ hours of sleep, hydrate well, and hit your protein target today.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Exercises ({currentDay.exercises.length})
            </span>
            <button
              onClick={() => setIsAddExerciseOpen(true)}
              className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Exercise
            </button>
          </div>

          {currentDay.exercises.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800/60 border-dashed rounded-2xl p-8 text-center">
              <p className="text-xs text-zinc-400 mb-3">No exercises scheduled for this day yet.</p>
              <button
                onClick={() => setIsAddExerciseOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl"
              >
                <Plus className="w-4 h-4" />
                Add Your First Exercise
              </button>
            </div>
          ) : (
            currentDay.exercises.map((planned, index) => {
              const ex = getExercise(planned.exerciseId);
              if (!ex) return null;
              const isFirst = index === 0;
              const isLast = index === currentDay.exercises.length - 1;

              return (
                <div
                  key={planned.id}
                  className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-3.5 hover:border-zinc-700/80 transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <span className="flex items-center justify-center w-5 h-5 rounded-md bg-zinc-800 text-[11px] font-bold text-zinc-400 mt-0.5">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-zinc-100">{ex.name}</h4>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                              ex.category === 'compound'
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            {ex.category}
                          </span>
                        </div>

                        {/* Prescription Details */}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-300 font-medium">
                          <span className="text-emerald-400 font-bold">
                            {planned.sets} sets × {planned.repMin}
                            {planned.repMin !== planned.repMax ? `–${planned.repMax}` : ''} reps
                          </span>
                          <span className="text-zinc-600">•</span>
                          <span className="text-zinc-400">{planned.restSec}s rest</span>
                          {planned.targetRpe && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span className="text-zinc-400">RPE {planned.targetRpe}</span>
                            </>
                          )}
                        </div>

                        {planned.notes && (
                          <p className="text-[11px] text-zinc-400 mt-1 italic">
                            {planned.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons: Move up/down & Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="flex flex-col">
                        <button
                          disabled={isFirst}
                          onClick={() => handleMoveExercise(index, 'up')}
                          className="p-1 text-zinc-500 hover:text-zinc-200 disabled:opacity-20 transition-opacity"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={isLast}
                          onClick={() => handleMoveExercise(index, 'down')}
                          className="p-1 text-zinc-500 hover:text-zinc-200 disabled:opacity-20 transition-opacity"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteExercise(planned.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors ml-1"
                        title="Remove exercise from day"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Switch Split Modal */}
      {isSwitchSplitOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white">Choose Workout Split</h3>
              <button
                onClick={() => setIsSwitchSplitOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {allPrograms.map((prog) => {
                const isActive = prog.id === program.id;
                return (
                  <button
                    key={prog.id}
                    onClick={() => {
                      onProgramSwitched(prog.id);
                      setIsSwitchSplitOpen(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{prog.name}</span>
                      {isActive && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                      {prog.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add Exercise Modal */}
      {isAddExerciseOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white">Add Exercise to {currentDay.name}</h3>
              <button
                onClick={() => setIsAddExerciseOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExerciseSubmit} className="space-y-3.5">
              {/* Exercise Search & Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Select Exercise
                </label>
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search 80+ exercises..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Muscle Quick Filter */}
                <div className="flex gap-1 overflow-x-auto pb-1.5 scrollbar-none text-[11px]">
                  {['all', 'chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'abs'].map(
                    (m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setSelectedMuscle(m)}
                        className={`px-2 py-0.5 rounded-lg capitalize whitespace-nowrap ${
                          selectedMuscle === m
                            ? 'bg-emerald-500 text-zinc-950 font-bold'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {m}
                      </button>
                    )
                  )}
                </div>

                {/* Select list */}
                <div className="max-h-36 overflow-y-auto border border-zinc-800 rounded-xl bg-zinc-950 divide-y divide-zinc-900 mt-1">
                  {filteredExercises.map((ex) => {
                    const isSelected = selectedExerciseId === ex.id;
                    return (
                      <button
                        type="button"
                        key={ex.id}
                        onClick={() => setSelectedExerciseId(ex.id)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                            : 'text-zinc-300 hover:bg-zinc-900'
                        }`}
                      >
                        <div>
                          <span>{ex.name}</span>
                          <span className="text-[10px] text-zinc-500 block capitalize">
                            {ex.primaryMuscle} • {ex.equipment}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] px-1 py-0.5 rounded ${
                            ex.category === 'compound'
                              ? 'bg-indigo-500/10 text-indigo-400'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {ex.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sets & Reps Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Sets
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newSets}
                    onChange={(e) => setNewSets(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Rest (seconds)
                  </label>
                  <input
                    type="number"
                    step={15}
                    min={30}
                    max={300}
                    value={newRestSec}
                    onChange={(e) => setNewRestSec(parseInt(e.target.value) || 60)}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Min Reps
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={newRepMin}
                    onChange={(e) => setNewRepMin(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Max Reps (Double-Progression Goal)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={newRepMax}
                    onChange={(e) => setNewRepMax(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Coach Notes / Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pause 1s on chest, drop 20% on last set"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddExerciseOpen(false)}
                  className="flex-1 py-2 bg-zinc-800 text-zinc-300 font-semibold text-xs rounded-xl hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedExerciseId}
                  className="flex-1 py-2 bg-emerald-500 disabled:opacity-40 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Add to Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
