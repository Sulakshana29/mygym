'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  MessageSquare,
  Send,
  ExternalLink,
  Video,
} from 'lucide-react';
import { CoachResponse } from '@/lib/coach/schemas';
import { Program, ProgramDay, PlannedExercise } from '@/types';
import { getStorage } from '@/lib/storage';

interface CoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProgramApplied: (newProgram: Program) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

const MUSCLE_TAGS = [
  { id: 'chest', label: 'Upper Chest' },
  { id: 'back', label: 'Lats & Back Width' },
  { id: 'shoulders', label: 'Side & Rear Delts' },
  { id: 'arms', label: 'Biceps & Triceps' },
  { id: 'quads', label: 'Quads & Legs' },
  { id: 'hamstrings', label: 'Hamstrings & Glutes' },
];

const QUICK_PROMPTS = [
  'How to do Bulgarian Split Squats properly?',
  'Shoulder-friendly alternative to Barbell Bench Press',
  'How do I brace correctly for Deadlifts?',
  'How many sets per week for Biceps?',
];

export function CoachModal({ isOpen, onClose, onProgramApplied }: CoachModalProps) {
  const [activeMode, setActiveMode] = useState<'split' | 'chat'>('split');

  // Split Generator State
  const [daysPerWeek, setDaysPerWeek] = useState<number>(5);
  const [goal, setGoal] = useState<'hypertrophy' | 'strength' | 'recomp'>('hypertrophy');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>(['chest', 'arms']);
  const [injuriesOrNotes, setInjuriesOrNotes] = useState<string>('');
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<CoachResponse | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "👋 Hey lifter! I'm your MyGym AI Form & Performance Coach. Ask me how to execute any exercise with safe biomechanics, ask for injury-friendly substitutions, or get progressive overload advice. I'll provide form cues and verified YouTube video search links!",
      timestamp: Date.now(),
    },
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeMode === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeMode]);

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
    setIsGenerating(true);
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
      setIsGenerating(false);
    }
  };

  const handleApplyToRoutine = async () => {
    if (!generatedResult) return;

    const storage = getStorage();
    const newProgramId = `ai-split-${Date.now()}`;

    const newDays: ProgramDay[] = generatedResult.days.map((d) => ({
      id: `day-${newProgramId}-${d.dayOfWeek}`,
      dayOfWeek: d.dayOfWeek,
      name: d.name,
      subtitle: d.subtitle,
      isRestDay: d.isRestDay,
      exercises: d.exercises.map((ex, idx) => ({
        id: `planned-${newProgramId}-${d.dayOfWeek}-${idx}`,
        exerciseId: ex.exerciseId,
        order: idx + 1,
        sets: ex.sets,
        repMin: ex.repMin,
        repMax: ex.repMax,
        restSec: ex.restSec,
        notes: ex.notes,
      })),
    }));

    const newProgram: Program = {
      id: newProgramId,
      name: generatedResult.splitName,
      splitType: generatedResult.splitType || 'custom',
      description: generatedResult.reasoning,
      isActive: true,
      days: newDays,
    };

    await storage.saveProgram(newProgram);
    await storage.setActiveProgram(newProgram.id);
    onProgramApplied(newProgram);
    onClose();
  };

  const handleSendChatMessage = async (overrideText?: string) => {
    const textToSend = (overrideText || chatInput).trim();
    if (!textToSend || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const history = chatMessages.slice(-6).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response from coach.');
      }

      const coachMsg: ChatMessage = {
        id: `coach-${Date.now()}`,
        role: 'model',
        text: data.reply,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, coachMsg]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: `⚠️ ${err?.message || 'Unable to connect to coach right now.'}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Helper to format coach markdown messages with clickable YouTube video search buttons
  const renderMessageContent = (text: string) => {
    // Regex to detect markdown links: [Link Text](url)
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const label = match[1];
      const url = match[2];
      const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

      parts.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 my-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 hover:text-white transition-all text-xs font-semibold"
        >
          {isYouTube ? <Video className="w-3.5 h-3.5 text-rose-400" /> : <ExternalLink className="w-3.5 h-3.5" />}
          <span>{label}</span>
        </a>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return (
      <div className="whitespace-pre-line text-xs leading-relaxed space-y-1">
        {parts.map((p, idx) => (typeof p === 'string' ? <span key={idx}>{p}</span> : p))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-zinc-950 shadow-md shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-white">Gemini AI Coach</h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                  v3.5 Flash Lite
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                {activeMode === 'split' ? 'Scientific Routine Designer' : 'Form & Technique Assistant'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="p-2 bg-zinc-950/40 border-b border-zinc-800/80 flex gap-1">
          <button
            onClick={() => setActiveMode('split')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeMode === 'split'
                ? 'bg-emerald-500 text-zinc-950 font-bold shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            Split Generator
          </button>
          <button
            onClick={() => setActiveMode('chat')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeMode === 'chat'
                ? 'bg-emerald-500 text-zinc-950 font-bold shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Ask Coach & Form Cues
          </button>
        </div>

        {/* Mode 1: Split Generator */}
        {activeMode === 'split' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {!generatedResult ? (
              <form onSubmit={handleGenerate} className="space-y-4">
                {/* Days Per Week */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Training Frequency ({daysPerWeek} days / week)
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[3, 4, 5, 6, 7].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setDaysPerWeek(num)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                          daysPerWeek === num
                            ? 'bg-emerald-500 text-zinc-950 border-emerald-400'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {num}d
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Goal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Primary Goal</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'hypertrophy', label: 'Hypertrophy' },
                      { id: 'strength', label: 'Strength (1RM)' },
                      { id: 'recomp', label: 'Body Recomp' },
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGoal(g.id as any)}
                        className={`py-2 text-xs font-medium rounded-xl border transition-all ${
                          goal === g.id
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 font-semibold'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Focus Muscle Groups */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-zinc-300">
                      Focus Muscle Priority (Select up to 3)
                    </label>
                    <span className="text-[10px] text-zinc-500">{selectedMuscles.length}/3 selected</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {MUSCLE_TAGS.map((m) => {
                      const isSel = selectedMuscles.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleMuscle(m.id)}
                          className={`py-1.5 px-2.5 rounded-xl text-xs text-left border transition-all flex items-center justify-between ${
                            isSel
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-medium'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <span>{m.label}</span>
                          {isSel && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Injuries or Equipment Preferences */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Injuries or Equipment Constraints
                  </label>
                  <input
                    type="text"
                    maxLength={150}
                    value={injuriesOrNotes}
                    onChange={(e) => setInjuriesOrNotes(e.target.value)}
                    placeholder="e.g. Mild shoulder impingement, dumbbells only"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Custom Instructions */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-zinc-300">
                      Custom Coaching Request
                    </label>
                    <span className="text-[10px] text-zinc-500">{userPrompt.length}/500</span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    placeholder="e.g. Prioritize upper chest incline pressing and heavy lat pulldowns."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all mt-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing Biomechanics & Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Evidence-Based Split
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Split Generated</span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-1">
                    {generatedResult.splitName}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
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
        )}

        {/* Mode 2: Ask Coach (Chat & Form Cues) */}
        {activeMode === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Quick Prompt Chips */}
            <div className="px-3 pt-2.5 pb-1 flex gap-1.5 overflow-x-auto scrollbar-none bg-zinc-950/30 border-b border-zinc-800/60">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendChatMessage(prompt)}
                  disabled={isChatLoading}
                  className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/40 whitespace-nowrap transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatMessages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 shadow-md ${
                        isUser
                          ? 'bg-emerald-500 text-zinc-950 font-medium rounded-tr-sm'
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-tl-sm'
                      }`}
                    >
                      {isUser ? (
                        <p className="text-xs whitespace-pre-line">{msg.text}</p>
                      ) : (
                        renderMessageContent(msg.text)
                      )}
                    </div>
                  </div>
                );
              })}

              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl rounded-tl-sm p-3 text-xs text-zinc-400 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>Analyzing exercise mechanics...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 bg-zinc-950/80 border-t border-zinc-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChatMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  maxLength={500}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask form cues, substitutions, or cues..."
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="p-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 rounded-xl transition-all font-bold"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
