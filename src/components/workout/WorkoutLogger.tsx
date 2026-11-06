'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Check,
  Plus,
  Trash2,
  Trophy,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Save,
  CheckCircle2,
  Calendar,
  History,
  X,
} from 'lucide-react';
import {
  Exercise,
  LoggedSet,
  PlannedExercise,
  Program,
  ProgramDay,
  Unit,
  WorkoutSession,
} from '@/types';
import { getStorage } from '@/lib/storage';
import {
  checkDoubleProgression,
  calculateEstimated1RM,
  calculateHardSetVolume,
  calculateWorkingVolumeLoad,
} from '@/lib/utils/progression';
import { formatWeight, toDisplayWeight, fromDisplayWeight } from '@/lib/utils/units';
import { getLocalDateString } from '@/lib/utils/date';

interface WorkoutLoggerProps {
  program: Program;
  exercises: Exercise[];
  preferredUnit: Unit;
  onWorkoutCompleted?: () => void;
}

export function WorkoutLogger({
  program,
  exercises,
  preferredUnit,
  onWorkoutCompleted,
}: WorkoutLoggerProps) {
  // Determine today's day of week (0=Sun, 1=Mon, ..., 6=Sat)
  const todayDayOfWeek = new Date().getDay();
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(
    todayDayOfWeek === 0 ? 0 : todayDayOfWeek
  );

  const currentDay = program.days.find((d) => d.dayOfWeek === selectedDayIndex) || program.days[0];

  // Active workout session sets state: Map of plannedExerciseId -> LoggedSet[]
  const [workoutSets, setWorkoutSets] = useState<Record<string, LoggedSet[]>>({});
  const [completedSetIds, setCompletedSetIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'error' | 'info' | 'success' } | null>(null);
  const [isDraftRestored, setIsDraftRestored] = useState<boolean>(false);

  // Rest Timer state
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number | null>(null);
  const [timerTotal, setTimerTotal] = useState<number>(90);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Past session lookup for double progression & hints (scoped to plannedExerciseId)
  const [lastSetsMap, setLastSetsMap] = useState<Record<string, LoggedSet[]>>({});
  const [allTimeMax1RMMap, setAllTimeMax1RMMap] = useState<Record<string, number>>({});
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishSummary, setFinishSummary] = useState<{
    totalVolumeKg: number;
    hardSets: number;
    prsHit: number;
  } | null>(null);

  // Guard to prevent overwriting saved drafts during initial load
  const isInitializedRef = useRef(false);

  // Initialize or restore sets for the active day's planned exercises
  useEffect(() => {
    if (!currentDay || currentDay.isRestDay) {
      isInitializedRef.current = false;
      return;
    }

    isInitializedRef.current = false;
    const storage = getStorage();
    const draftKey = `mygym_draft_${currentDay.id}`;

    const loadDayData = async () => {
      // 1. Fetch previous session sets and all-time 1RM baselines
      const scopedSetsMap: Record<string, LoggedSet[]> = {};
      const max1RMMap: Record<string, number> = {};

      for (const planned of currentDay.exercises) {
        const lastSets = await storage.getLastSetsForPlannedExercise(planned.id, planned.exerciseId);
        if (lastSets && lastSets.length > 0) {
          scopedSetsMap[planned.id] = lastSets;
        }
        const max1RM = await storage.getAllTimeMax1RM(planned.exerciseId);
        if (max1RM) {
          max1RMMap[planned.exerciseId] = max1RM;
        }
      }
      setLastSetsMap(scopedSetsMap);
      setAllTimeMax1RMMap(max1RMMap);

      // 2. Check for an existing in-progress draft
      let restoredFromDraft = false;
      try {
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed.sets && Object.keys(parsed.sets).length > 0) {
            setWorkoutSets(parsed.sets);
            setCompletedSetIds(new Set(parsed.completedSetIds || []));
            setIsDraftRestored(true);
            restoredFromDraft = true;
          }
        }
      } catch (err) {
        console.error('Failed to restore workout draft:', err);
      }

      // 3. If no draft, initialize fresh sets with previous weights pre-filled
      if (!restoredFromDraft) {
        setIsDraftRestored(false);
        const initialSetsMap: Record<string, LoggedSet[]> = {};
        currentDay.exercises.forEach((planned) => {
          const previousSets = scopedSetsMap[planned.id] || [];
          const sets: LoggedSet[] = [];

          for (let i = 1; i <= planned.sets; i++) {
            const lastSetForSlot = previousSets[i - 1] || previousSets[previousSets.length - 1];
            const prefillWeight = lastSetForSlot ? lastSetForSlot.weight : 0;

            sets.push({
              id: `set-${planned.id}-${i}-${Date.now()}`,
              plannedExerciseId: planned.id,
              exerciseId: planned.exerciseId,
              setNo: i,
              weight: prefillWeight,
              reps: planned.repMin,
              isWarmup: false,
              isPR: false,
            });
          }
          initialSetsMap[planned.id] = sets;
        });
        setWorkoutSets(initialSetsMap);
        setCompletedSetIds(new Set());
      }

      // Mark initialized so auto-saver can safely persist subsequent changes
      setTimeout(() => {
        isInitializedRef.current = true;
      }, 100);
    };

    loadDayData();
  }, [currentDay?.id]);

  // Auto-persist workout draft to localStorage
  useEffect(() => {
    if (!isInitializedRef.current || !currentDay || currentDay.isRestDay) return;

    const draftKey = `mygym_draft_${currentDay.id}`;
    const draftPayload = {
      sets: workoutSets,
      completedSetIds: Array.from(completedSetIds),
      updatedAt: Date.now(),
    };
    try {
      localStorage.setItem(draftKey, JSON.stringify(draftPayload));
    } catch (err) {
      console.error('Failed to save workout draft:', err);
    }
  }, [workoutSets, completedSetIds, currentDay?.id]);

  // Discard draft and reset to default
  const handleResetDraft = () => {
    if (!currentDay || currentDay.isRestDay) return;
    const draftKey = `mygym_draft_${currentDay.id}`;
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // ignore
    }

    const initialSetsMap: Record<string, LoggedSet[]> = {};
    currentDay.exercises.forEach((planned) => {
      const previousSets = lastSetsMap[planned.id] || [];
      const sets: LoggedSet[] = [];

      for (let i = 1; i <= planned.sets; i++) {
        const lastSetForSlot = previousSets[i - 1] || previousSets[previousSets.length - 1];
        const prefillWeight = lastSetForSlot ? lastSetForSlot.weight : 0;

        sets.push({
          id: `set-${planned.id}-${i}-${Date.now()}`,
          plannedExerciseId: planned.id,
          exerciseId: planned.exerciseId,
          setNo: i,
          weight: prefillWeight,
          reps: planned.repMin,
          isWarmup: false,
          isPR: false,
        });
      }
      initialSetsMap[planned.id] = sets;
    });

    setWorkoutSets(initialSetsMap);
    setCompletedSetIds(new Set());
    setIsDraftRestored(false);
    setToastMessage({ text: 'Workout draft reset to default prescription.', type: 'info' });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSecondsLeft !== null && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (timerSecondsLeft === 0) {
      setIsTimerRunning(false);
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        try {
          navigator.vibrate([200, 100, 200]);
        } catch {
          // ignore
        }
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSecondsLeft]);

  const startRestTimer = (seconds: number) => {
    setTimerTotal(seconds);
    setTimerSecondsLeft(seconds);
    setIsTimerRunning(true);
  };

  const getExercise = (id: string) => exercises.find((e) => e.id === id);

  // Checks whether a given set qualifies as a Personal Record (PR)
  const isSetPR = (set: LoggedSet): boolean => {
    if (set.isWarmup || set.weight <= 0 || set.reps <= 0) return false;
    const baselineMax = allTimeMax1RMMap[set.exerciseId] || 0;
    if (baselineMax <= 0) return false;
    const est1RM = set.reps === 1 ? set.weight : set.weight * (1 + set.reps / 30);
    return est1RM > baselineMax;
  };

  const handleUpdateSet = (
    plannedId: string,
    setId: string,
    field: keyof LoggedSet,
    value: any
  ) => {
    setWorkoutSets((prev) => {
      const existing = prev[plannedId] || [];
      const updated = existing.map((s) => {
        if (s.id === setId) {
          const newSet = { ...s, [field]: value };
          newSet.isPR = isSetPR(newSet);
          return newSet;
        }
        return s;
      });
      return { ...prev, [plannedId]: updated };
    });
  };

  const handleToggleCompleteSet = (
    planned: PlannedExercise,
    set: LoggedSet
  ) => {
    const isCompleted = completedSetIds.has(set.id);
    const nextCompleted = new Set(completedSetIds);

    if (isCompleted) {
      nextCompleted.delete(set.id);
    } else {
      nextCompleted.add(set.id);
      startRestTimer(planned.restSec);
    }
    setCompletedSetIds(nextCompleted);
  };

  const handleAddSet = (planned: PlannedExercise) => {
    setWorkoutSets((prev) => {
      const existing = prev[planned.id] || [];
      const nextNo = existing.length + 1;
      const lastWeight = existing[existing.length - 1]?.weight || 0;
      const newSet: LoggedSet = {
        id: `set-${planned.id}-${nextNo}-${Date.now()}`,
        plannedExerciseId: planned.id,
        exerciseId: planned.exerciseId,
        setNo: nextNo,
        weight: lastWeight,
        reps: planned.repMin,
        isWarmup: false,
        isPR: false,
      };
      newSet.isPR = isSetPR(newSet);
      return { ...prev, [planned.id]: [...existing, newSet] };
    });
  };

  const handleDeleteSet = (plannedId: string, setId: string) => {
    setWorkoutSets((prev) => {
      const existing = prev[plannedId] || [];
      const updated = existing
        .filter((s) => s.id !== setId)
        .map((s, idx) => ({ ...s, setNo: idx + 1 }));
      return { ...prev, [plannedId]: updated };
    });
    setCompletedSetIds((prev) => {
      const next = new Set(prev);
      next.delete(setId);
      return next;
    });
  };

  const handleFinishWorkout = async () => {
    const storage = getStorage();
    const allSets: LoggedSet[] = [];

    Object.values(workoutSets).forEach((sets) => {
      sets.forEach((s) => {
        if (completedSetIds.has(s.id) && s.reps > 0) {
          allSets.push(s);
        }
      });
    });

    if (allSets.length === 0) {
      setToastMessage({
        text: 'Please complete and check off at least one set before saving!',
        type: 'error',
      });
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    const hardSets = calculateHardSetVolume(allSets);
    const totalVolumeKg = calculateWorkingVolumeLoad(allSets);
    const prsHit = allSets.filter((s) => s.isPR).length;

    const session: WorkoutSession = {
      id: `session-${Date.now()}`,
      programId: program.id,
      programDayId: currentDay.id,
      date: getLocalDateString(), // Accurate local timezone YYYY-MM-DD
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      sets: allSets,
      notes: `${currentDay.name} - Finished with ${hardSets} hard sets.`,
    };

    await storage.saveWorkoutSession(session);

    // Clear saved draft on completion
    try {
      localStorage.removeItem(`mygym_draft_${currentDay.id}`);
    } catch {
      // ignore
    }

    setFinishSummary({
      totalVolumeKg,
      hardSets,
      prsHit,
    });
    setIsFinishing(true);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-3 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === 'error'
              ? 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
              : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-zinc-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Day Selector Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {program.days.map((day) => {
          const isSelected = day.dayOfWeek === selectedDayIndex;
          return (
            <button
              key={day.id}
              onClick={() => setSelectedDayIndex(day.dayOfWeek)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-emerald-500 text-zinc-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {day.name.split('—')[0].trim()}
              {day.isRestDay && ' (Rest)'}
            </button>
          );
        })}
      </div>

      {/* Workout Header Banner */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-4 rounded-2xl border border-zinc-800/80 shadow-lg relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                {currentDay.isRestDay ? 'Rest & Rebuild' : 'Live Workout'}
              </span>
              <span className="text-xs text-zinc-400">{program.name}</span>
              {isDraftRestored && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  Draft Restored
                  <button
                    onClick={handleResetDraft}
                    className="hover:underline text-indigo-200 ml-1 font-bold"
                    title="Reset to fresh prescribed sets"
                  >
                    Reset
                  </button>
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white mt-1.5">{currentDay.name}</h2>
            {currentDay.subtitle && (
              <p className="text-xs text-zinc-400 mt-0.5">{currentDay.subtitle}</p>
            )}
          </div>

          {!currentDay.isRestDay && (
            <button
              onClick={handleFinishWorkout}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              Finish
            </button>
          )}
        </div>
      </div>

      {/* Floating / Embedded Rest Timer */}
      {timerSecondsLeft !== null && (
        <div className="sticky top-14 z-20 bg-zinc-900/95 backdrop-blur-md border border-emerald-500/40 p-3 rounded-2xl shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                timerSecondsLeft === 0
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {Math.floor(timerSecondsLeft / 60)}:
              {(timerSecondsLeft % 60).toString().padStart(2, '0')}
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-100 flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 text-emerald-400" />
                Rest Timer
              </span>
              <span className="text-[10px] text-zinc-400 block">
                {timerSecondsLeft === 0 ? 'Rest complete! Next set!' : `Target rest: ${timerTotal}s`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTimerSecondsLeft((prev) => Math.max(0, (prev || 0) - 15))}
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[11px] font-semibold"
            >
              -15s
            </button>
            <button
              onClick={() => setTimerSecondsLeft((prev) => (prev || 0) + 30)}
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[11px] font-semibold"
            >
              +30s
            </button>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-1.5 bg-zinc-800 text-zinc-200 rounded-lg hover:bg-zinc-700"
            >
              {isTimerRunning ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={() => setTimerSecondsLeft(null)}
              className="p-1.5 text-zinc-500 hover:text-zinc-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Rest Day State */}
      {currentDay.isRestDay ? (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-zinc-100">Scheduled Recovery Day</h3>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            No training scheduled for today. Spend time on mobility, sleep, and nutrition to hit your next session with maximum power.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentDay.exercises.map((planned) => {
            const ex = getExercise(planned.exerciseId);
            if (!ex) return null;

            const sets = workoutSets[planned.id] || [];
            const lastSets = lastSetsMap[planned.id];
            const doubleProg = lastSets
              ? checkDoubleProgression(
                  ex,
                  planned,
                  lastSets,
                  preferredUnit
                )
              : null;

            return (
              <div
                key={planned.id}
                className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-3.5 shadow-sm space-y-3"
              >
                {/* Exercise Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm font-bold text-white">{ex.name}</h4>
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
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5 flex-wrap">
                      <span className="text-emerald-400 font-semibold">
                        Target: {planned.sets} sets × {planned.repMin}
                        {planned.repMin !== planned.repMax ? `–${planned.repMax}` : ''} reps
                      </span>
                      <span>•</span>
                      <span>{planned.restSec}s rest</span>
                      {allTimeMax1RMMap[planned.exerciseId] && (
                        <>
                          <span>•</span>
                          <span className="text-zinc-500">
                            PR: {formatWeight(allTimeMax1RMMap[planned.exerciseId], preferredUnit, true)} (1RM)
                          </span>
                        </>
                      )}
                    </div>
                    {/* Previous session reference summary */}
                    {lastSets && lastSets.length > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-1">
                        <History className="w-3 h-3 text-zinc-500" />
                        <span>
                          Last time:{' '}
                          {lastSets
                            .map((s) => `${toDisplayWeight(s.weight, preferredUnit)}×${s.reps}`)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Double Progression Badge Banner */}
                {doubleProg && doubleProg.earned && (
                  <div className="bg-emerald-500/15 border border-emerald-500/40 p-2.5 rounded-xl flex items-center gap-2 animate-in fade-in">
                    <Flame className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="text-xs">
                      <span className="font-bold text-emerald-300">
                        Double-Progression Earned!
                      </span>{' '}
                      <span className="text-emerald-400">{doubleProg.message}</span>
                    </div>
                  </div>
                )}

                {doubleProg && !doubleProg.earned && lastSets && (
                  <div className="bg-zinc-950/70 border border-zinc-800/80 px-2.5 py-1.5 rounded-xl text-[11px] text-zinc-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{doubleProg.message}</span>
                  </div>
                )}

                {/* Set Logging Table */}
                <div className="space-y-1.5">
                  <div className="grid grid-cols-12 text-[10px] font-bold text-zinc-500 uppercase px-1">
                    <span className="col-span-2">Set</span>
                    <span className="col-span-3">
                      Weight ({preferredUnit.toUpperCase()})
                    </span>
                    <span className="col-span-3">Reps</span>
                    <span className="col-span-2 text-center">Type</span>
                    <span className="col-span-2 text-right">Log</span>
                  </div>

                  {sets.map((set) => {
                    const isCompleted = completedSetIds.has(set.id);
                    const displayWeight = toDisplayWeight(set.weight, preferredUnit);

                    return (
                      <div
                        key={set.id}
                        className={`grid grid-cols-12 items-center gap-1.5 p-1.5 rounded-xl border transition-all ${
                          isCompleted
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : set.isWarmup
                            ? 'bg-zinc-950/40 border-dashed border-zinc-800'
                            : 'bg-zinc-950 border-zinc-800/80'
                        }`}
                      >
                        {/* Set Index + PR Indicator */}
                        <div className="col-span-2 flex items-center gap-1">
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                              isCompleted
                                ? 'bg-emerald-500 text-zinc-950'
                                : 'bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            {set.setNo}
                          </span>
                          {set.isPR && (
                            <span
                              title="New Estimated 1RM Record!"
                              className="text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
                            >
                              PR
                            </span>
                          )}
                        </div>

                        {/* Weight Input */}
                        <div className="col-span-3">
                          <input
                            type="number"
                            step={0.5}
                            min={0}
                            placeholder="0"
                            value={displayWeight === 0 ? '' : displayWeight}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const rawKg = fromDisplayWeight(val, preferredUnit);
                              handleUpdateSet(planned.id, set.id, 'weight', rawKg);
                            }}
                            className="w-full bg-zinc-900 border border-zinc-700/60 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 text-center"
                          />
                        </div>

                        {/* Reps Input */}
                        <div className="col-span-3">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={set.reps === 0 ? '' : set.reps}
                            onChange={(e) => {
                              const reps = parseInt(e.target.value) || 0;
                              handleUpdateSet(planned.id, set.id, 'reps', reps);
                            }}
                            className="w-full bg-zinc-900 border border-zinc-700/60 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 text-center"
                          />
                        </div>

                        {/* Warm-up Toggle Button */}
                        <div className="col-span-2 flex justify-center">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateSet(planned.id, set.id, 'isWarmup', !set.isWarmup)
                            }
                            className={`text-[9px] font-bold px-1.5 py-1 rounded transition-colors ${
                              set.isWarmup
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                            title="Warmup sets are excluded from hard-set volume & 1RM"
                          >
                            {set.isWarmup ? 'WARM' : 'WORK'}
                          </button>
                        </div>

                        {/* Completion Checkmark & Delete */}
                        <div className="col-span-2 flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleCompleteSet(planned, set)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                              isCompleted
                                ? 'bg-emerald-500 text-zinc-950 font-bold'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white'
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSet(planned.id, set.id)}
                            className="p-1 text-zinc-600 hover:text-rose-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Set Button */}
                <button
                  type="button"
                  onClick={() => handleAddSet(planned)}
                  className="w-full py-1.5 border border-dashed border-zinc-800 rounded-xl text-xs font-semibold text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/40 flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Set
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Completion Modal */}
      {isFinishing && finishSummary && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-emerald-500/40 rounded-3xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 uppercase">
                Workout Logged
              </span>
              <h3 className="text-xl font-black text-white mt-2">Workout Complete!</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Outstanding effort on {currentDay.name}. Your session has been stored.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 text-left">
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase block">
                  Hard Working Sets
                </span>
                <span className="text-lg font-bold text-white">
                  {finishSummary.hardSets} sets
                </span>
                <span className="text-[10px] text-zinc-500 block">
                  (warmups excluded)
                </span>
              </div>
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase block">
                  Volume Load
                </span>
                <span className="text-lg font-bold text-emerald-400">
                  {formatWeight(finishSummary.totalVolumeKg, preferredUnit, true)}
                </span>
                <span className="text-[10px] text-zinc-500 block">
                  Working tonnage
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsFinishing(false);
                setCompletedSetIds(new Set());
                if (onWorkoutCompleted) onWorkoutCompleted();
              }}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/30 transition-all"
            >
              Done & Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
