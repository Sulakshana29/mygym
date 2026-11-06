'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Trophy,
  Dumbbell,
  Calendar,
  Flame,
  ChevronRight,
  Target,
  BarChart2,
  Trash2,
  Info,
} from 'lucide-react';
import { Exercise, Unit, WorkoutSession, LoggedSet } from '@/types';
import { getStorage } from '@/lib/storage';
import { formatWeight, toDisplayWeight } from '@/lib/utils/units';
import {
  calculateHardSetVolume,
  calculateWorkingVolumeLoad,
  calculateEstimated1RM,
} from '@/lib/utils/progression';

interface ProgressDashboardProps {
  exercises: Exercise[];
  preferredUnit: Unit;
}

// Target landmarks based on scientific hypertrophy literature (Schoenfeld et al.):
// MEV: ~10 sets/week, MAV: 10-20 sets/week, MRV: 20+ sets/week
const VOLUME_LANDMARKS: Record<string, { mev: number; mav: number; mrv: number }> = {
  chest: { mev: 10, mav: 16, mrv: 22 },
  back: { mev: 10, mav: 18, mrv: 25 },
  shoulders: { mev: 8, mav: 16, mrv: 22 },
  quads: { mev: 8, mav: 14, mrv: 20 },
  hamstrings: { mev: 6, mav: 12, mrv: 18 },
  arms: { mev: 8, mav: 14, mrv: 20 },
};

export function ProgressDashboard({ exercises, preferredUnit }: ProgressDashboardProps) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');

  const loadSessions = async () => {
    setIsLoading(true);
    const storage = getStorage();
    const list = await storage.getWorkoutSessions();
    // Sort newest first
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setSessions(list);

    // Pick first exercise with data or barbell bench press
    if (!selectedExerciseId && exercises.length > 0) {
      const bench = exercises.find((e) => e.name.toLowerCase().includes('bench'));
      setSelectedExerciseId(bench ? bench.id : exercises[0].id);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadSessions();
  }, [exercises]);

  const exerciseMap = React.useMemo(() => {
    const map = new Map<string, Exercise>();
    exercises.forEach((e) => map.set(e.id, e));
    return map;
  }, [exercises]);

  // Filter sessions in the last 7 days for weekly volume landmarks
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const last7DaysSessions = sessions.filter((s) => new Date(s.date) >= sevenDaysAgo);

  // Calculate weekly volume by primary muscle group
  const weeklyMuscleVolume = React.useMemo(() => {
    const volume: Record<string, number> = {
      chest: 0,
      back: 0,
      shoulders: 0,
      quads: 0,
      hamstrings: 0,
      arms: 0,
    };

    last7DaysSessions.forEach((session) => {
      session.sets.forEach((set) => {
        if (set.isWarmup || set.reps <= 0) return;
        const ex = exerciseMap.get(set.exerciseId);
        if (!ex) return;

        const muscle = ex.primaryMuscle.toLowerCase();
        if (muscle.includes('chest')) volume.chest += 1;
        else if (muscle.includes('back') || muscle.includes('lat')) volume.back += 1;
        else if (muscle.includes('shoulder') || muscle.includes('delt')) volume.shoulders += 1;
        else if (muscle.includes('quad')) volume.quads += 1;
        else if (muscle.includes('hamstring') || muscle.includes('glute')) volume.hamstrings += 1;
        else if (muscle.includes('bicep') || muscle.includes('tricep') || muscle.includes('arm')) volume.arms += 1;
      });
    });

    return volume;
  }, [last7DaysSessions, exerciseMap]);

  // Overall career stats
  const careerStats = React.useMemo(() => {
    let totalHardSets = 0;
    let totalVolumeKg = 0;
    let totalPRs = 0;

    sessions.forEach((s) => {
      totalHardSets += calculateHardSetVolume(s.sets);
      totalVolumeKg += calculateWorkingVolumeLoad(s.sets);
      totalPRs += s.sets.filter((st) => st.isPR).length;
    });

    return {
      workoutCount: sessions.length,
      totalHardSets,
      totalVolumeKg,
      totalPRs,
    };
  }, [sessions]);

  // Selected exercise progression history
  const selectedExerciseHistory = React.useMemo(() => {
    if (!selectedExerciseId) return [];

    const history: {
      date: string;
      sessionName?: string;
      max1RM: number;
      bestSet: LoggedSet;
    }[] = [];

    sessions.forEach((s) => {
      const exerciseSets = s.sets.filter(
        (set) => set.exerciseId === selectedExerciseId && !set.isWarmup && set.weight > 0 && set.reps > 0
      );
      if (exerciseSets.length === 0) return;

      const est1RM = calculateEstimated1RM(exerciseSets);
      // Find set with best 1RM
      let bestSet = exerciseSets[0];
      let bestEst = 0;
      exerciseSets.forEach((st) => {
        const val = st.reps === 1 ? st.weight : st.weight * (1 + st.reps / 30);
        if (val > bestEst) {
          bestEst = val;
          bestSet = st;
        }
      });

      history.push({
        date: s.date,
        sessionName: s.notes?.split('-')[0]?.trim(),
        max1RM: est1RM,
        bestSet,
      });
    });

    return history;
  }, [sessions, selectedExerciseId]);

  const selectedExercise = exerciseMap.get(selectedExerciseId);

  return (
    <div className="space-y-4 pb-24 animate-in fade-in">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Progress & Volume
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Evidence-based hypertrophy landmarks and 1RM progression
          </p>
        </div>
      </div>

      {/* Career Overview Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-zinc-900 border border-zinc-800/80 p-3 rounded-2xl">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase block">
            Workouts
          </span>
          <span className="text-lg font-black text-white mt-0.5 block">
            {careerStats.workoutCount}
          </span>
          <span className="text-[10px] text-zinc-500">Sessions</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800/80 p-3 rounded-2xl">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase block">
            Hard Sets
          </span>
          <span className="text-lg font-black text-emerald-400 mt-0.5 block">
            {careerStats.totalHardSets}
          </span>
          <span className="text-[10px] text-zinc-500">All-time</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800/80 p-3 rounded-2xl">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase block">
            Total Tonnage
          </span>
          <span className="text-lg font-black text-amber-400 mt-0.5 block">
            {formatWeight(careerStats.totalVolumeKg, preferredUnit, true)}
          </span>
          <span className="text-[10px] text-zinc-500">Lifted</span>
        </div>
      </div>

      {/* Weekly Volume Landmarks (Last 7 Days) */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-400" />
              Weekly Hypertrophy Landmarks (7d)
            </h3>
            <span className="text-[10px] text-zinc-400 block mt-0.5">
              10–20 hard sets/week is optimal for muscle growth
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
            Hypertrophy
          </span>
        </div>

        <div className="space-y-2.5 pt-1">
          {Object.entries(VOLUME_LANDMARKS).map(([muscleKey, target]) => {
            const currentSets = weeklyMuscleVolume[muscleKey] || 0;
            const percent = Math.min(100, Math.round((currentSets / target.mav) * 100));

            // Status color and label
            let statusBadge = (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                Below MEV (&lt;{target.mev})
              </span>
            );
            let barColor = 'bg-amber-500';

            if (currentSets >= target.mev && currentSets <= target.mav) {
              statusBadge = (
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Optimal (MAV)
                </span>
              );
              barColor = 'bg-emerald-500';
            } else if (currentSets > target.mav) {
              statusBadge = (
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  High Volume (MRV)
                </span>
              );
              barColor = 'bg-indigo-500';
            }

            return (
              <div key={muscleKey} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-200 capitalize">{muscleKey}</span>
                  <div className="flex items-center gap-1.5">
                    {statusBadge}
                    <span className="font-mono font-bold text-white text-xs">
                      {currentSets} / {target.mav} sets
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/80">
                  <div
                    className={`h-full ${barColor} rounded-full transition-all duration-500`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 1RM Strength Progression Tracker */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            1RM Strength Tracker
          </h3>

          <select
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-xs text-white rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-medium"
          >
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        {selectedExercise && (
          <div className="pt-1 space-y-2">
            {selectedExerciseHistory.length === 0 ? (
              <div className="bg-zinc-950/60 border border-dashed border-zinc-800 rounded-xl p-4 text-center text-xs text-zinc-500">
                No recorded working sets for {selectedExercise.name} yet. Complete a workout to see your 1RM progression curve.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block font-semibold">
                      Current Peak 1RM
                    </span>
                    <span className="text-base font-black text-amber-400 font-mono">
                      {formatWeight(
                        Math.max(...selectedExerciseHistory.map((h) => h.max1RM)),
                        preferredUnit,
                        true
                      )}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold uppercase">
                    Epley 1RM
                  </span>
                </div>

                {/* History Session Rows */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block px-1">
                    Historical Sessions
                  </span>
                  {selectedExerciseHistory.slice(0, 5).map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <div>
                          <span className="font-semibold text-white block">{h.date}</span>
                          <span className="text-[10px] text-zinc-400">
                            Best set: {toDisplayWeight(h.bestSet.weight, preferredUnit)} {preferredUnit} × {h.bestSet.reps} reps
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-emerald-400 font-mono block">
                          ~{formatWeight(h.max1RM, preferredUnit, true)}
                        </span>
                        <span className="text-[9px] text-zinc-500">Est. 1RM</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Workout Session History Timeline */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 p-4 rounded-2xl space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-emerald-400" />
          Recent Workout Sessions
        </h3>

        {sessions.length === 0 ? (
          <div className="bg-zinc-950/60 border border-dashed border-zinc-800 rounded-xl p-6 text-center text-xs text-zinc-500">
            No workouts logged yet. Finish a workout in the Today tab to record your training history!
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.slice(0, 10).map((session) => {
              const hardSets = calculateHardSetVolume(session.sets);
              const volumeKg = calculateWorkingVolumeLoad(session.sets);
              const prs = session.sets.filter((s) => s.isPR).length;

              return (
                <div
                  key={session.id}
                  className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {session.notes?.split('-')[0]?.trim() || 'Workout Session'}
                      </span>
                      <span className="text-[10px] text-zinc-400">{session.date}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {prs > 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {prs} PR{prs > 1 ? 's' : ''}
                        </span>
                      )}
                      <span className="text-xs font-bold font-mono text-emerald-400">
                        {formatWeight(volumeKg, preferredUnit, true)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-900 pt-1">
                    <span>{hardSets} hard working sets completed</span>
                    <span>{session.sets.length} total logged sets</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
