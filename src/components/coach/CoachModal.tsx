'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Flame,
  ShieldAlert,
  Loader2,
  Calendar,
  Dumbbell,
} from 'lucide-react';
import { CoachResponse } from '@/lib/coach/schemas';
import { Program, ProgramDay, PlannedExercise } from '@/types';
import { getStorage } from '@/lib/storage';

interface CoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProgramApplied: (newProgram: Program) => void;
}

const MUSCLE_TAGS = [
  { id: 'chest', label: 'Upper Chest' },
  { id: 'back', label: 'Lats & Back Width' },
  { id: 'shoulders', label: 'Side & Rear Delts' },
  { id: 'arms', label: 'Biceps & Triceps' },
  { id: 'quads', label: 'Quads & Legs' },
  { id: 'hamstrings', label: 'Hamstrings & Glutes' },
];

export function CoachModal({ isOpen, onClose, onProgramApplied }: CoachModalProps) {
  // Form State
  const [daysPerWeek, setDaysPerWeek] = useState<number>(5);
  const [goal, setGoal] = useState<'hypertrophy' | 'strength' | 'recomp'>('hypertrophy');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>(['chest', 'arms']);
  const [injuriesOrNotes, setInjuriesOrNotes] = useState<string>('');
  const [userPrompt, setUserPrompt] = useState<string>('');

  // Generation state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<CoachResponse | null>(null);

  if (!isOpen) return null;

  const toggleMuscle = (id: string) => {
    if (selectedMuscles.includes(id)) {
      setSelectedMuscles(selectedMuscles.filter((m) => m !== id));
    } else {
      if (selectedMuscles.length < 3) {
        setSelectedMuscles([...selectedMuscles, id]);
      }
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daysPerWeek,
          goal,
          experienceLevel,
          sessionMinutes: 60,
          focusMuscles: selectedMuscles,
          injuriesOrNotes: injuriesOrNotes.trim() || undefined,
          userPrompt: userPrompt.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate split.');
      }

      setGeneratedResult(data);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error communicating with AI coach.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToRoutine = async () => {
    if (!generatedResult) return;

    const storage = getStorage();
    const newProgramId = `ai-split-${Date.now()}`;

    const newDays: ProgramDay[] = generatedResult.days.map((d, dIdx) => ({
      id: `${newProgramId}-day-${d.dayOfWeek}`,
      dayOfWeek: d.dayOfWeek,
      name: d.name,
      subtitle: d.subtitle,
      isRestDay: d.isRestDay,
      exercises: d.exercises.map((ex, eIdx) => ({
        id: `pl-${newProgramId}-${d.dayOfWeek}-${eIdx + 1}`,
        exerciseId: ex.exerciseId,
        sets: ex.sets,
        repMin: ex.repMin,
        repMax: ex.repMax,
        restSec: ex.restSec,
        targetRpe: ex.targetRpe,
        order: eIdx + 1,
        notes: ex.notes,
      })),
    }));

    const newProgram: Program = {
      id: newProgramId,
      name: generatedResult.splitName,
      splitType: generatedResult.splitType,
      description: generatedResult.reasoning,
      isActive: true,
      days: newDays,
    };

    await storage.saveProgram(newProgram);
    await storage.setActiveProgram(newProgramId);
    onProgramApplied(newProgram);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-3 animate-in fade-in">
      <div className="bg-zinc-900 border border-emerald-500/40 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md">
              <Bot className="w-4 h-4 text-zinc-950 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                AI Split Coach
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  Gemini 2.5
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Evidence-based hypertrophy & split optimization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-2xl flex items-center gap-2 text-xs text-rose-300">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* View 1: Form Questionnaire */}
        {!generatedResult ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Days per week */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Training Days per Week
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[2, 3, 4, 5, 6].map((num) => (
                  <button
                    type="button"
                    key={num}
                    onClick={() => setDaysPerWeek(num)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      daysPerWeek === num
                        ? 'bg-emerald-500 text-zinc-950 shadow-md'
                        : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {num} Days
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Primary Goal
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { id: 'hypertrophy', label: 'Hypertrophy' },
                  { id: 'strength', label: 'Strength' },
                  { id: 'recomp', label: 'Recomp' },
                ].map((g) => (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() => setGoal(g.id as any)}
                    className={`py-2 px-1 rounded-xl font-semibold capitalize transition-all ${
                      goal === g.id
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Focus Muscle Tags */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Priority Muscle Focus (Max 3)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {MUSCLE_TAGS.map((m) => {
                  const isSelected = selectedMuscles.includes(m.id);
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => toggleMuscle(m.id)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-emerald-500 text-zinc-950'
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Special Instructions / Injuries (500-char limited) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Injuries, Equipment or Preferences
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {injuriesOrNotes.length}/500
                </span>
              </div>
              <textarea
                rows={2}
                maxLength={500}
                placeholder="e.g. Mild shoulder pain on flat bench, dumbbell only on Wednesday, prefer 45-min workouts"
                value={injuriesOrNotes}
                onChange={(e) => setInjuriesOrNotes(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Evidence-Based Routine...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Custom Split with Gemini
                </>
              )}
            </button>
          </form>
        ) : (
          /* View 2: Generated Split Preview & 1-Click Apply */
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl space-y-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                Coach Recommendation
              </span>
              <h4 className="text-base font-bold text-white">
                {generatedResult.splitName}
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {generatedResult.reasoning}
              </p>
            </div>

            {/* Days Preview */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                Prescribed 7-Day Schedule
              </span>
              {generatedResult.days.map((day) => (
                <div
                  key={day.dayOfWeek}
                  className="bg-zinc-950 border border-zinc-800/80 p-2.5 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white">{day.name}</span>
                    {day.subtitle && (
                      <span className="text-zinc-500 block text-[10px]">
                        {day.subtitle}
                      </span>
                    )}
                  </div>
                  {day.isRestDay ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      Rest Day
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                      {day.exercises.length} Exercises
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setGeneratedResult(null)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl transition-colors"
              >
                Back to Questionnaire
              </button>
              <button
                type="button"
                onClick={handleApplyToRoutine}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                Apply to My Routine
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
