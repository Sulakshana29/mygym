import {
  Exercise,
  Program,
  UserProfile,
  WorkoutSession,
  LoggedSet,
} from '@/types';
import { StorageAdapter } from './adapter';
import { INITIAL_EXERCISES } from '../constants/exercises';
import { ALL_INITIAL_PROGRAMS, WINTER_ARC_PROGRAM } from '../constants/programs';

const STORAGE_KEYS = {
  PROFILE: 'mygym_user_profile_v1',
  EXERCISES: 'mygym_exercises_v1',
  PROGRAMS: 'mygym_programs_v1',
  SESSIONS: 'mygym_workout_sessions_v1',
};

const DEFAULT_PROFILE: UserProfile = {
  id: 'default-user',
  name: 'Athlete',
  preferredUnit: 'kg',
  experienceLevel: 'intermediate',
  daysPerWeek: 5,
  targetGoal: 'hypertrophy',
  activeProgramId: WINTER_ARC_PROGRAM.id,
};

export class LocalStorageAdapter implements StorageAdapter {
  private isClient(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private initDefaultsIfNeeded(): void {
    if (!this.isClient()) return;

    // 1. User Profile
    if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
    }

    // 2. Exercises
    if (!localStorage.getItem(STORAGE_KEYS.EXERCISES)) {
      localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(INITIAL_EXERCISES));
    }

    // 3. Programs (Winter Arc active by default)
    if (!localStorage.getItem(STORAGE_KEYS.PROGRAMS)) {
      localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(ALL_INITIAL_PROGRAMS));
    }

    // 4. Workout Sessions
    if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([]));
    }
  }

  async getUserProfile(): Promise<UserProfile> {
    this.initDefaultsIfNeeded();
    if (!this.isClient()) return DEFAULT_PROFILE;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return raw ? JSON.parse(raw) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }

  async getExercises(): Promise<Exercise[]> {
    this.initDefaultsIfNeeded();
    if (!this.isClient()) return INITIAL_EXERCISES;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EXERCISES);
      return raw ? JSON.parse(raw) : INITIAL_EXERCISES;
    } catch {
      return INITIAL_EXERCISES;
    }
  }

  async getExerciseById(id: string): Promise<Exercise | undefined> {
    const list = await this.getExercises();
    return list.find((e) => e.id === id);
  }

  async saveCustomExercise(exercise: Exercise): Promise<void> {
    if (!this.isClient()) return;
    const list = await this.getExercises();
    const existingIdx = list.findIndex((e) => e.id === exercise.id);
    if (existingIdx >= 0) {
      list[existingIdx] = exercise;
    } else {
      list.unshift(exercise);
    }
    localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(list));
  }

  async getPrograms(): Promise<Program[]> {
    this.initDefaultsIfNeeded();
    if (!this.isClient()) return ALL_INITIAL_PROGRAMS;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROGRAMS);
      return raw ? JSON.parse(raw) : ALL_INITIAL_PROGRAMS;
    } catch {
      return ALL_INITIAL_PROGRAMS;
    }
  }

  async getProgramById(id: string): Promise<Program | undefined> {
    const list = await this.getPrograms();
    return list.find((p) => p.id === id);
  }

  async getActiveProgram(): Promise<Program | undefined> {
    const programs = await this.getPrograms();
    const active = programs.find((p) => p.isActive);
    return active || programs[0] || WINTER_ARC_PROGRAM;
  }

  async setActiveProgram(id: string): Promise<void> {
    if (!this.isClient()) return;
    const programs = await this.getPrograms();
    const updated = programs.map((p) => ({
      ...p,
      isActive: p.id === id,
    }));
    localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(updated));

    const profile = await this.getUserProfile();
    await this.saveUserProfile({ ...profile, activeProgramId: id });
  }

  async saveProgram(program: Program): Promise<void> {
    if (!this.isClient()) return;
    const programs = await this.getPrograms();
    const index = programs.findIndex((p) => p.id === program.id);
    if (index >= 0) {
      programs[index] = program;
    } else {
      programs.unshift(program);
    }
    localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(programs));
  }

  async deleteProgram(id: string): Promise<void> {
    if (!this.isClient()) return;
    const programs = await this.getPrograms();
    const filtered = programs.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(filtered));
  }

  async getWorkoutSessions(): Promise<WorkoutSession[]> {
    this.initDefaultsIfNeeded();
    if (!this.isClient()) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async getWorkoutSessionById(id: string): Promise<WorkoutSession | undefined> {
    const sessions = await this.getWorkoutSessions();
    return sessions.find((s) => s.id === id);
  }

  async saveWorkoutSession(session: WorkoutSession): Promise<void> {
    if (!this.isClient()) return;
    const sessions = await this.getWorkoutSessions();
    const index = sessions.findIndex((s) => s.id === session.id);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.unshift(session);
    }
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }

  async getLastSessionForExercise(
    exerciseId: string
  ): Promise<{ session: WorkoutSession; sets: LoggedSet[] } | undefined> {
    const sessions = await this.getWorkoutSessions();
    // Sort descending by date / startTime
    const sorted = [...sessions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (const session of sorted) {
      const matchedSets = session.sets.filter((s) => s.exerciseId === exerciseId);
      if (matchedSets.length > 0) {
        return { session, sets: matchedSets };
      }
    }
    return undefined;
  }

  async resetToDefaults(): Promise<void> {
    if (!this.isClient()) return;
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.EXERCISES);
    localStorage.removeItem(STORAGE_KEYS.PROGRAMS);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    this.initDefaultsIfNeeded();
  }
}
