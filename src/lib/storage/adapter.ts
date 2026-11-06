import {
  Exercise,
  Program,
  UserProfile,
  WorkoutSession,
  LoggedSet,
} from '@/types';

export interface StorageAdapter {
  getUserProfile(): Promise<UserProfile>;
  saveUserProfile(profile: UserProfile): Promise<void>;

  getExercises(): Promise<Exercise[]>;
  getExerciseById(id: string): Promise<Exercise | undefined>;
  saveCustomExercise(exercise: Exercise): Promise<void>;

  getPrograms(): Promise<Program[]>;
  getProgramById(id: string): Promise<Program | undefined>;
  getActiveProgram(): Promise<Program | undefined>;
  setActiveProgram(id: string): Promise<void>;
  saveProgram(program: Program): Promise<void>;
  deleteProgram(id: string): Promise<void>;

  getWorkoutSessions(): Promise<WorkoutSession[]>;
  getWorkoutSessionById(id: string): Promise<WorkoutSession | undefined>;
  saveWorkoutSession(session: WorkoutSession): Promise<void>;

  getLastSessionForExercise(
    exerciseId: string
  ): Promise<{ session: WorkoutSession; sets: LoggedSet[] } | undefined>;

  getLastSetsForPlannedExercise(
    plannedExerciseId: string,
    exerciseId: string
  ): Promise<LoggedSet[] | undefined>;

  getAllTimeMax1RM(exerciseId: string): Promise<number>;

  resetToDefaults(): Promise<void>;
}
