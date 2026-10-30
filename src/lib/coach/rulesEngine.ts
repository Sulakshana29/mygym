import { CoachRequest, CoachResponse } from './schemas';
import {
  WINTER_ARC_PROGRAM,
  PPL_PROGRAM,
  UPPER_LOWER_PROGRAM,
  FULL_BODY_PROGRAM,
} from '../constants/programs';

/**
 * Deterministic Rules-Engine Fallback:
 * Provides evidence-based split generation according to exercise science:
 * - 3 days -> Full Body 3x/week
 * - 4 days -> Upper / Lower 2x/week
 * - 5 days -> 5-Day Specialization / Winter Arc
 * - 6 days -> Push / Pull / Legs 2x/week
 */
export function generateRulesBasedSplit(req: CoachRequest): CoachResponse {
  const days = req.daysPerWeek;

  if (days <= 3) {
    return {
      splitName: `Evidence-Based Full Body (${days} Day)`,
      splitType: 'full_body',
      reasoning:
        'With 3 training days per week, a Full Body routine maximizes muscle protein synthesis frequency by stimulating every major muscle group 3 times every 7 days.',
      weeklyVolumeBreakdown: {
        chest: 12,
        back: 12,
        quads: 12,
        hamstrings: 9,
        shoulders: 9,
        arms: 9,
      },
      days: FULL_BODY_PROGRAM.days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        name: d.name,
        subtitle: d.subtitle,
        isRestDay: d.isRestDay,
        exercises: d.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          sets: e.sets,
          repMin: e.repMin,
          repMax: e.repMax,
          restSec: e.restSec,
          targetRpe: e.targetRpe,
          notes: e.notes,
        })),
      })),
    };
  }

  if (days === 4) {
    return {
      splitName: 'Evidence-Based Upper / Lower (4 Day)',
      splitType: 'upper_lower',
      reasoning:
        '4 days allows an optimal 2x/week frequency for all muscle groups with dedicated upper and lower body sessions, leaving 3 rest days for complete systemic CNS recovery.',
      weeklyVolumeBreakdown: {
        chest: 14,
        back: 14,
        quads: 14,
        hamstrings: 12,
        shoulders: 12,
        arms: 10,
      },
      days: UPPER_LOWER_PROGRAM.days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        name: d.name,
        subtitle: d.subtitle,
        isRestDay: d.isRestDay,
        exercises: d.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          sets: e.sets,
          repMin: e.repMin,
          repMax: e.repMax,
          restSec: e.restSec,
          targetRpe: e.targetRpe,
          notes: e.notes,
        })),
      })),
    };
  }

  if (days === 5) {
    return {
      splitName: 'Winter Arc 5-Day Overload Split',
      splitType: 'custom',
      reasoning:
        '5 days allows dedicated Upper Strength & Back Width (Mon), Posterior Chain & Deadlift (Tue), Weak Points & Arms (Wed), Bench Volume (Fri), and Quads/Calves (Sat). Optimal for lifters with high recovery capacity.',
      weeklyVolumeBreakdown: {
        chest: 18,
        back: 19,
        quads: 16,
        hamstrings: 13,
        shoulders: 17,
        arms: 18,
      },
      days: WINTER_ARC_PROGRAM.days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        name: d.name,
        subtitle: d.subtitle,
        isRestDay: d.isRestDay,
        exercises: d.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          sets: e.sets,
          repMin: e.repMin,
          repMax: e.repMax,
          restSec: e.restSec,
          targetRpe: e.targetRpe,
          notes: e.notes,
        })),
      })),
    };
  }

  // 6 or 7 days -> PPL
  return {
    splitName: 'Evidence-Based Push / Pull / Legs (6 Day)',
    splitType: 'ppl',
    reasoning:
      '6 days provides the classic PPL split hitting each muscle group twice every 7 days with high volume and dedicated rest on Sunday.',
    weeklyVolumeBreakdown: {
      chest: 16,
      back: 16,
      quads: 14,
      hamstrings: 14,
      shoulders: 14,
      arms: 12,
    },
    days: PPL_PROGRAM.days.map((d) => ({
      dayOfWeek: d.dayOfWeek,
      name: d.name,
      subtitle: d.subtitle,
      isRestDay: d.isRestDay,
      exercises: d.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        sets: e.sets,
        repMin: e.repMin,
        repMax: e.repMax,
        restSec: e.restSec,
        targetRpe: e.targetRpe,
        notes: e.notes,
      })),
    })),
  };
}
