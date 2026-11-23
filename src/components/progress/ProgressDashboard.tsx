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
  Activity,
  Layers,
  Clock,
} from 'lucide-react';
import { Exercise, Unit, WorkoutSession, LoggedSet, MuscleGroup } from '@/types';
import { getStorage } from '@/lib/storage';
import { formatWeight, toDisplayWeight } from '@/lib/utils/units';
import {
  calculateHardSetVolume,
  calculateWorkingVolumeLoad,
  calculateEstimated1RM,
} from '@/lib/utils/progression';
import { ProgressChart, DataPoint1RM, VolumePoint } from './ProgressChart';
import { MuscleDiagram } from '../diagrams/MuscleDiagram';

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
      glutes: 0,
      calves: 0,
      abs: 0,
      biceps: 0,
      triceps: 0,
      forearms: 0,
      traps: 0,
    };

    last7DaysSessions.forEach((session) => {
      session.sets.forEach((set) => {
        if (set.isWarmup || set.reps <= 0) return;
        const ex = exerciseMap.get(set.exerciseId);
        if (!ex) return;

        const muscle = ex.primaryMuscle.toLowerCase();
        if (volume[muscle] !== undefined) {
          volume[muscle] += 1;
        }

        // Also aggregate arms
        if (muscle.includes('bicep') || muscle.includes('tricep') || muscle.includes('arm')) {
          volume.arms += 1;
        }
      });
    });

    return volume;
  }, [last7DaysSessions, exerciseMap]);

  // Determine active muscle groups for visual muscle diagram (last 7 days)
  const activeStimulatedMuscles = React.useMemo(() => {
    const primary: MuscleGroup[] = [];
    const secondary: MuscleGroup[] = [];

    Object.entries(weeklyMuscleVolume).forEach(([mKey, count]) => {
      const m = mKey as MuscleGroup;
      if (count >= 8) {
        primary.push(m);
      } else if (count > 0) {
        secondary.push(m);
      }
    });

    return { primary, secondary };
  }, [weeklyMuscleVolume]);

  // Overall career stats
  const careerStats = React.useMemo(() => {
    let totalHardSets = 0;
    let totalVolumeKg = 0;
    let totalPRs = 0;
    let totalMinutes = 0;
    let sessionsWithDuration = 0;

    sessions.forEach((s) => {
      totalHardSets += calculateHardSetVolume(s.sets);
      totalVolumeKg += calculateWorkingVolumeLoad(s.sets);
      totalPRs += s.sets.filter((st) => st.isPR).length;
      const duration = s.durationMinutes || (s.startedAt && s.finishedAt ? Math.round((new Date(s.finishedAt).getTime() - new Date(s.startedAt).getTime()) / 60000) : 0);
      if (duration > 0) {
        totalMinutes += duration;
        sessionsWithDuration++;
      }
    });

    const avgDuration = sessionsWithDuration > 0 ? Math.round(totalMinutes / sessionsWithDuration) : 0;

    return {
      workoutCount: sessions.length,
      totalHardSets,
      totalVolumeKg,
      totalPRs,
      avgDuration,
      totalMinutes,
    };
  }, [sessions]);

  // Selected exercise progression history for chart
  const data1RMPoints: DataPoint1RM[] = React.useMemo(() => {
    if (!selectedExerciseId) return [];

    const points: DataPoint1RM[] = [];

    // Reverse sessions so it's chronologically oldest to newest for graphing
    const chronological = [...sessions].reverse();

    chronological.forEach((s) => {
      const exerciseSets = s.sets.filter(
        (set) =>
          set.exerciseId === selectedExerciseId &&
          !set.isWarmup &&
          set.weight > 0 &&
          set.reps > 0
      );
      if (exerciseSets.length === 0) return;

      const est1RM = calculateEstimated1RM(exerciseSets);
      let bestSet = exerciseSets[0];
      let bestEst = 0;
      exerciseSets.forEach((st) => {
        const val = st.reps === 1 ? st.weight : st.weight * (1 + st.reps / 30);
        if (val > bestEst) {
          bestEst = val;
          bestSet = st;
        }
      });

      points.push({
        date: s.date,
        sessionName: s.notes?.split('-')[0]?.trim(),
        max1RM: est1RM,
        weight: bestSet.weight,
        reps: bestSet.reps,
      });
    });

    return points;
  }, [sessions, selectedExerciseId]);

  // Volume points for tonnage bar chart
  const volumeData: VolumePoint[] = React.useMemo(() => {
    return [...sessions]
      .reverse()
      .map((s) => ({
        label: s.date,
        volumeKg: calculateWorkingVolumeLoad(s.sets),
        hardSets: calculateHardSetVolume(s.sets),
      }));
  }, [sessions]);

  const selectedExercise = exerciseMap.get(selectedExerciseId);

  return (
    <div className="space-y-4 pb-28 animate-in fade-in">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Performance & Growth
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Progress curves, anatomical volume maps & hypertrophy landmarks
          </p>
        </div>
      </div>

      {/* Career Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/90 p-3.5 rounded-2xl shadow-sm">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            Workouts
          </span>
          <span className="text-xl sm:text-2xl font-black text-white mt-1 block font-mono">
            {careerStats.workoutCount}
          </span>
          <span className="text-[10px] text-zinc-500 font-medium">Logged</span>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/90 p-3.5 rounded-2xl shadow-sm">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            Avg Duration
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 block font-mono">
            {careerStats.avgDuration > 0 ? `${careerStats.avgDuration}m` : '—'}
          </span>
          <span className="text-[10px] text-zinc-500 font-medium">Per workout</span>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/90 p-3.5 rounded-2xl shadow-sm">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            Hard Sets
          </span>
          <span className="text-xl sm:text-2xl font-black text-cyan-400 mt-1 block font-mono">
            {careerStats.totalHardSets}
          </span>
          <span className="text-[10px] text-zinc-500 font-medium">Working sets</span>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/90 p-3.5 rounded-2xl shadow-sm">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            Tonnage
          </span>
          <span className="text-xl sm:text-2xl font-black text-amber-400 mt-1 block font-mono truncate">
            {formatWeight(careerStats.totalVolumeKg, preferredUnit, true)}
          </span>
          <span className="text-[10px] text-zinc-500 font-medium">Total lifted</span>
        </div>
      </div>

      {/* Exercise Selector for 1RM Progression Chart */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Select Lift for Strength Curve:
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">
            {data1RMPoints.length} session{data1RMPoints.length === 1 ? '' : 's'}
          </span>
        </div>

        <select
          value={selectedExerciseId}
          onChange={(e) => setSelectedExerciseId(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 text-sm font-bold text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 shadow-inner"
        >
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name} ({ex.primaryMuscle})
            </option>
          ))}
        </select>
      </div>

      {/* Visual Performance Graph Component */}
      <ProgressChart
        data1RM={data1RMPoints}
        volumeData={volumeData}
        preferredUnit={preferredUnit}
        exerciseName={selectedExercise?.name || 'Exercise'}
      />

      {/* ================= ANATOMICAL MUSCLE ACTIVATION MAP ================= */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              Weekly Muscle Activation Map (7d)
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Visual anatomical map of target muscle stimulation over the last 7 days
            </p>
          </div>
        </div>

        <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800/80 flex flex-col items-center">
          <MuscleDiagram
            primaryMuscles={activeStimulatedMuscles.primary}
            secondaryMuscles={activeStimulatedMuscles.secondary}
            size="md"
            showLabels={false}
          />

          <div className="flex items-center justify-center gap-4 mt-3 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              <span className="text-zinc-200">Optimal Volume (8+ sets)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-indigo-500 shadow-sm shadow-indigo-500/50" />
              <span className="text-zinc-300">Worked (1–7 sets)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-zinc-800 border border-zinc-700" />
              <span className="text-zinc-500">Untrained</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Volume Landmarks (Last 7 Days) */}
      <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-400" />
              Hypertrophy Volume Landmarks (7d)
            </h3>
            <span className="text-xs text-zinc-400 block mt-0.5">
              10–20 hard sets/week is optimal for muscle growth (MAV)
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
            Scientific
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {Object.entries(VOLUME_LANDMARKS).map(([muscleKey, target]) => {
            const currentSets = weeklyMuscleVolume[muscleKey] || 0;
            const percent = Math.min(100, Math.round((currentSets / target.mav) * 100));

            let statusBadge = (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                Below MEV (&lt;{target.mev})
              </span>
            );
            let barColor = 'bg-amber-500';

            if (currentSets >= target.mev && currentSets <= target.mav) {
              statusBadge = (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Optimal (MAV)
                </span>
              );
              barColor = 'bg-emerald-500';
            } else if (currentSets > target.mav) {
              statusBadge = (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  High Volume (MRV)
                </span>
              );
              barColor = 'bg-indigo-500';
            }

            return (
              <div key={muscleKey} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white capitalize text-sm">{muscleKey}</span>
                  <div className="flex items-center gap-2">
                    {statusBadge}
                    <span className="font-mono font-bold text-white text-xs sm:text-sm">
                      {currentSets} / {target.mav} sets
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
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

      {/* Workout Session History Timeline */}
      <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl space-y-3 shadow-md">
        <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
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
              const durationMin = session.durationMinutes || (session.startedAt && session.finishedAt ? Math.round((new Date(session.finishedAt).getTime() - new Date(session.startedAt).getTime()) / 60000) : 0);

              return (
                <div
                  key={session.id}
                  className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 hover:border-zinc-700/80 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-white block">
                        {session.notes?.split('-')[0]?.trim() || 'Workout Session'}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                        <span>{session.date}</span>
                        {durationMin > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 font-semibold flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-emerald-400" />
                              {durationMin} min
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {prs > 0 && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {prs} PR{prs > 1 ? 's' : ''}
                        </span>
                      )}
                      <span className="text-sm font-black font-mono text-emerald-400">
                        {formatWeight(volumeKg, preferredUnit, true)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-900 pt-2 font-medium">
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
