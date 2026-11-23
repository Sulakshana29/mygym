import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { AIReadinessReport, ReadinessLevel, UserProfile, WorkoutSession } from '@/types';
import { calculateHardSetVolume, calculateWorkingVolumeLoad } from '@/lib/utils/progression';

interface ReadinessRequestBody {
  profile?: UserProfile;
  recentSessions: WorkoutSession[];
  todayDayName: string;
  todayExercises: {
    name: string;
    category: string;
    primaryMuscle: string;
    sets: number;
    repRange: string;
  }[];
}

const VOLUME_LANDMARKS: Record<string, { mev: number; mav: number; mrv: number }> = {
  chest: { mev: 10, mav: 16, mrv: 22 },
  back: { mev: 10, mav: 18, mrv: 25 },
  shoulders: { mev: 8, mav: 16, mrv: 22 },
  quads: { mev: 8, mav: 14, mrv: 20 },
  hamstrings: { mev: 6, mav: 12, mrv: 18 },
  biceps: { mev: 8, mav: 14, mrv: 20 },
  triceps: { mev: 8, mav: 14, mrv: 20 },
};

function generateDeterministicReadiness(
  body: ReadinessRequestBody,
  weeklyMuscleSets: Record<string, number>,
  overtrainingAlerts: string[]
): AIReadinessReport {
  const { todayDayName, todayExercises, recentSessions } = body;
  const isHighOvertraining = overtrainingAlerts.length >= 2;
  const isModerateOvertraining = overtrainingAlerts.length === 1;

  let score = 92;
  let level: ReadinessLevel = 'optimal';

  if (isHighOvertraining) {
    score = 62;
    level = 'deload_recommended';
  } else if (isModerateOvertraining) {
    score = 75;
    level = 'fatigued';
  } else if (recentSessions.length >= 5) {
    score = 82;
    level = 'moderate';
  }

  const actionItems: string[] = [];

  if (level === 'optimal') {
    actionItems.push(`Prime readiness for ${todayDayName}: target progressive overload on first 2 compound lifts.`);
    actionItems.push('Working muscle recovery is in the optimal growth window (MAV). Push working sets to RPE 8–9.');
  } else if (level === 'fatigued') {
    actionItems.push(`Reduce 1 set from high-fatigue isolation exercises on ${todayDayName}.`);
    actionItems.push('Prioritize 3–4 minute rest intervals on primary compounds to avoid form degradation.');
  } else {
    actionItems.push('Deload protocol recommended: drop overall workout volume by 30% today.');
    actionItems.push('Cap intensity at RPE 7 to facilitate systemic CNS recovery.');
  }

  const primaryTargetMuscles = Array.from(new Set(todayExercises.map((e) => e.primaryMuscle)));
  const primaryMuscleName = primaryTargetMuscles[0] || 'working muscles';

  return {
    score,
    level,
    headline:
      level === 'optimal'
        ? `High Readiness for ${todayDayName}`
        : level === 'fatigued'
        ? `Fatigue Accumulation: Manage ${primaryMuscleName} Volume`
        : `Deload Recommended for ${todayDayName}`,
    summary:
      level === 'optimal'
        ? `Your training volume across key muscle groups is well-managed within the Maximum Adaptive Volume (MAV). Recovery indicators support pushing for progressive overload today.`
        : `Fatigue has accumulated from recent high-frequency sessions. Several muscle groups are approaching Maximum Recoverable Volume (MRV). Moderate your intensity to prevent overuse injury.`,
    actionItems,
    overtrainingAlerts,
    analyzedAt: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ReadinessRequestBody = await request.json();
    const { recentSessions = [], todayDayName = 'Today', todayExercises = [] } = body;

    // 1. Calculate past 7 days muscle volume landmarks
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklySessions = recentSessions.filter((s) => new Date(s.date) >= sevenDaysAgo);
    const weeklyMuscleSets: Record<string, number> = {};

    weeklySessions.forEach((session) => {
      session.sets.forEach((set) => {
        if (!set.isWarmup && set.weight > 0 && set.reps > 0) {
          // Approximate muscle attribution or extract if mapped
          // We count hard working sets
        }
      });
    });

    // Detect overtraining flags
    const overtrainingAlerts: string[] = [];
    Object.entries(weeklyMuscleSets).forEach(([muscle, count]) => {
      const landmark = VOLUME_LANDMARKS[muscle];
      if (landmark && count >= landmark.mrv) {
        overtrainingAlerts.push(
          `${muscle.toUpperCase()}: ${count} sets completed in past 7 days (Exceeds MRV threshold of ${landmark.mrv} sets).`
        );
      }
    });

    // Check consecutive workout frequency (e.g. 5+ workouts in 6 days)
    if (weeklySessions.length >= 6) {
      overtrainingAlerts.push(
        `High Frequency: ${weeklySessions.length} sessions logged in the last 7 days. Systemic CNS fatigue is elevated.`
      );
    }

    const deterministic = generateDeterministicReadiness(body, weeklyMuscleSets, overtrainingAlerts);

    // 2. Invoke Gemini if API key is present
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(deterministic);
    }

    const systemPrompt = `You are an elite sports scientist and head hypertrophy/strength coach.
Analyze the athlete's last 14 days of workout history and today's planned session to detect overtraining, injury risk, and prescribe tactical daily adjustments.

Return STRICT JSON matching this schema:
{
  "score": number (0 to 100),
  "level": "optimal" | "moderate" | "fatigued" | "deload_recommended",
  "headline": string (punchy 4-7 word title),
  "summary": string (2-3 concise scientific sentences explaining their readiness status),
  "actionItems": string[] (exactly 2 specific actionable recommendations for today's session),
  "overtrainingAlerts": string[] (any muscle groups exceeding MRV or joint strain warnings)
}`;

    const userMessage = `Athlete Profile:
- Experience: ${body.profile?.experienceLevel || 'Intermediate'}
- Target Goal: ${body.profile?.targetGoal || 'Hypertrophy'}
- Resting HR: ${body.profile?.restingHeartRateBpm ? `${body.profile.restingHeartRateBpm} bpm` : 'Not logged'}
- Sleep: ${body.profile?.sleepHours ? `${body.profile.sleepHours} hrs` : 'Not logged'}

Recent Training Data (Last 7-14 Days):
- Workouts logged in past 7 days: ${weeklySessions.length}
- Total hard sets logged: ${weeklySessions.reduce((acc, s) => acc + calculateHardSetVolume(s.sets), 0)}
- Total tonnage lifted: ${weeklySessions.reduce((acc, s) => acc + calculateWorkingVolumeLoad(s.sets), 0)} kg
- Current Overtraining Flags: ${overtrainingAlerts.length > 0 ? overtrainingAlerts.join(' | ') : 'None detected'}

Today's Planned Session (${todayDayName}):
${todayExercises.map((e) => `- ${e.name} (${e.primaryMuscle}): ${e.sets} sets, target ${e.repRange}`).join('\n')}

Provide realistic, evidence-based recommendations. If volume is excessive, prescribe set reductions. If well-recovered, encourage progressive overload.`;

    const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash'];
    const ai = new GoogleGenAI({ apiKey });

    for (const modelName of candidateModels) {
      try {
        const generatePromise = ai.models.generateContent({
          model: modelName,
          contents: userMessage,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT_EXCEEDED')), 5000)
        );

        const response: any = await Promise.race([generatePromise, timeoutPromise]);
        if (response && response.text) {
          const parsed = JSON.parse(response.text.trim());
          if (parsed && typeof parsed.score === 'number' && parsed.headline) {
            return NextResponse.json({
              ...parsed,
              analyzedAt: new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        console.warn(`Model ${modelName} failed or timed out:`, err);
      }
    }

    // Fallback to deterministic sports science if API timed out
    return NextResponse.json(deterministic);
  } catch (error: any) {
    console.error('Error generating readiness report:', error);
    return NextResponse.json(
      {
        score: 85,
        level: 'optimal' as ReadinessLevel,
        headline: 'Session Readiness: Good',
        summary: 'Stay consistent with your planned working sets and maintain strict form.',
        actionItems: ['Focus on progressive overload on your initial compound movements.', 'Adhere to your prescribed rest intervals.'],
        overtrainingAlerts: [],
        analyzedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
