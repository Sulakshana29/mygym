export type Unit = 'kg' | 'lb';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'abs'
  | 'forearms'
  | 'traps';

export type EquipmentType =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'smith'
  | 'ez-bar'
  | 'other';

export type ExerciseCategory = 'compound' | 'isolation';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: EquipmentType;
  notes?: string;
  isCustom?: boolean;
}

export interface PlannedExercise {
  id: string;
  exerciseId: string;
  sets: number;
  repMin: number;
  repMax: number;
  restSec: number;
  targetRpe?: number;
  order: number;
  notes?: string;
}

export interface ProgramDay {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  name: string;
  subtitle?: string;
  isRestDay: boolean;
  exercises: PlannedExercise[];
}

export type SplitType = 'ppl' | 'upper_lower' | 'full_body' | 'custom';

export interface Program {
  id: string;
  name: string;
  splitType: SplitType;
  description: string;
  isActive: boolean;
  days: ProgramDay[];
}

export interface LoggedSet {
  id: string;
  exerciseId: string;
  plannedExerciseId?: string;
  setNo: number;
  weight: number; // Raw weight strictly stored in KG
  reps: number;
  rpe?: number;
  isWarmup?: boolean; // If true: EXCLUDED from weekly hard-set volume and 1RM calculation
  isPR?: boolean;
  completedAt?: string;
}

export interface WorkoutSession {
  id: string;
  programId: string;
  programDayId: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime?: string;
  sets: LoggedSet[];
  notes?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  preferredUnit: Unit;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek: number;
  targetGoal: 'hypertrophy' | 'strength' | 'general_fitness';
  activeProgramId: string;
}

export interface DoubleProgressionStatus {
  earned: boolean;
  category: ExerciseCategory;
  recommendedIncreaseKg: number;
  message: string;
}
