import { z } from 'zod';

export const CoachRequestSchema = z.object({
  daysPerWeek: z.number().int().min(2).max(7).default(5),
  goal: z.enum(['hypertrophy', 'strength', 'general_fitness', 'recomp']).default('hypertrophy'),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  sessionMinutes: z.number().int().min(30).max(120).default(60),
  focusMuscles: z.array(z.string()).max(4).default([]),
  equipmentAvailable: z.array(z.string()).default(['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight']),
  injuriesOrNotes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
  userPrompt: z.string().max(500, 'Prompt must be 500 characters or less').optional(),
});

export type CoachRequest = z.infer<typeof CoachRequestSchema>;

export const PlannedExerciseSchema = z.object({
  exerciseId: z.string(),
  sets: z.number().int().min(1).max(8),
  repMin: z.number().int().min(1).max(50),
  repMax: z.number().int().min(1).max(50),
  restSec: z.number().int().min(30).max(300),
  targetRpe: z.number().min(6).max(10).optional(),
  notes: z.string().max(200).optional(),
});

export const ProgramDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  name: z.string().max(50),
  subtitle: z.string().max(100).optional(),
  isRestDay: z.boolean(),
  exercises: z.array(PlannedExerciseSchema),
});

export const CoachResponseSchema = z.object({
  splitName: z.string().max(80),
  splitType: z.enum(['ppl', 'upper_lower', 'full_body', 'custom']),
  reasoning: z.string().max(600),
  weeklyVolumeBreakdown: z.record(z.string(), z.number()).optional(),
  days: z.array(ProgramDaySchema).min(7).max(7),
});

export type CoachResponse = z.infer<typeof CoachResponseSchema>;
