import {
  DoubleProgressionStatus,
  Exercise,
  LoggedSet,
  PlannedExercise,
  Unit,
} from '@/types';
import { formatWeight } from './units';

/**
 * Calculates estimated 1 Rep Max using the Epley formula: weight * (1 + reps / 30).
 * EXCLUDES any sets marked as isWarmup === true.
 */
export function calculateEstimated1RM(sets: LoggedSet[]): number {
  const workingSets = sets.filter((s) => !s.isWarmup && s.weight > 0 && s.reps > 0);
  if (workingSets.length === 0) return 0;

  let max1RM = 0;
  for (const s of workingSets) {
    // Epley formula: 1 rep = exact weight
    const epley = s.reps === 1 ? s.weight : s.weight * (1 + s.reps / 30);
    if (epley > max1RM) {
      max1RM = epley;
    }
  }
  return Math.round(max1RM * 10) / 10;
}

/**
 * Calculates total hard working sets (excluding warmup sets).
 */
export function calculateHardSetVolume(sets: LoggedSet[]): number {
  return sets.filter((s) => !s.isWarmup && s.reps > 0).length;
}

/**
 * Calculates total working tonnage (sum of weight * reps for all non-warmup sets).
 */
export function calculateWorkingVolumeLoad(sets: LoggedSet[]): number {
  return sets
    .filter((s) => !s.isWarmup && s.weight > 0 && s.reps > 0)
    .reduce((total, s) => total + s.weight * s.reps, 0);
}

/**
 * Double-Progression Engine:
 * If a lifter hits or exceeds repMax across ALL working sets of an exercise
 * in their previous session, they earn the Double-Progression badge:
 * - Compounds: +2.5 kg next session
 * - Isolations: +1.25 to 2.5 kg next session
 */
export function checkDoubleProgression(
  exercise: Exercise,
  planned: PlannedExercise,
  lastSets: LoggedSet[],
  preferredUnit: Unit = 'kg'
): DoubleProgressionStatus {
  const isCompound = exercise.category === 'compound';
  const defaultRecommendedKg = isCompound ? 2.5 : 1.25;

  // Filter out warmup sets
  const workingSets = lastSets.filter((s) => !s.isWarmup && s.reps > 0);

  if (workingSets.length === 0 || workingSets.length < planned.sets) {
    return {
      earned: false,
      category: exercise.category,
      recommendedIncreaseKg: defaultRecommendedKg,
      message: `Target ${planned.sets} sets of ${planned.repMin}–${planned.repMax} reps before progressing.`,
    };
  }

  // Check if every working set reached or exceeded repMax
  const allHitRepMax = workingSets.every((s) => s.reps >= planned.repMax);

  if (allHitRepMax) {
    const formattedInc = formatWeight(defaultRecommendedKg, preferredUnit, true);
    return {
      earned: true,
      category: exercise.category,
      recommendedIncreaseKg: defaultRecommendedKg,
      message: `+${formattedInc} next session! Hit max reps (${planned.repMax}) on all sets.`,
    };
  }

  // Find lowest rep among working sets
  const lowestReps = Math.min(...workingSets.map((s) => s.reps));
  return {
    earned: false,
    category: exercise.category,
    recommendedIncreaseKg: defaultRecommendedKg,
    message: `Last session hit ${lowestReps}/${planned.repMax} reps. Keep current weight until all sets hit ${planned.repMax}.`,
  };
}
