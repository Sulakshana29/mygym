'use client';

import React, { useState, useEffect } from 'react';
import { Exercise, Program, UserProfile, Unit } from '@/types';
import { getStorage } from '@/lib/storage';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav, TabType } from '@/components/layout/BottomNav';
import { ProgramBuilder } from '@/components/program/ProgramBuilder';
import { WorkoutLogger } from '@/components/workout/WorkoutLogger';
import { ExerciseLibrary } from '@/components/exercises/ExerciseLibrary';
import { ProgressDashboard } from '@/components/progress/ProgressDashboard';
import { ProfileSettings } from '@/components/profile/ProfileSettings';
import { CoachModal } from '@/components/coach/CoachModal';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('workout');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCoachOpen, setIsCoachOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const storage = getStorage();
    const userProfile = await storage.getUserProfile();
    const programList = await storage.getPrograms();
    const active = await storage.getActiveProgram();
    const exerciseList = await storage.getExercises();

    setProfile(userProfile);
    setAllPrograms(programList);
    setActiveProgram(active || programList[0] || null);
    setExercises(exerciseList);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleUnit = async () => {
    if (!profile) return;
    const nextUnit: Unit = profile.preferredUnit === 'kg' ? 'lb' : 'kg';
    const updated = { ...profile, preferredUnit: nextUnit };
    const storage = getStorage();
    await storage.saveUserProfile(updated);
    setProfile(updated);
  };

  const handleProgramSwitched = async (programId: string) => {
    const storage = getStorage();
    await storage.setActiveProgram(programId);
    await loadData();
  };

  const handleProgramApplied = (newProgram: Program) => {
    setActiveProgram(newProgram);
    setAllPrograms((prev) => [newProgram, ...prev]);
    setActiveTab('program');
  };

  const handleExerciseAdded = (newEx: Exercise) => {
    setExercises((prev) => [newEx, ...prev]);
  };

  if (isLoading || !profile || !activeProgram) {
    return (
      <main className="w-full max-w-md min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 p-6">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold tracking-wider text-zinc-300">
          LOADING WINTER ARC ROUTINE...
        </p>
      </main>
    );
  }

  return (
    <main className="w-full max-w-md min-h-screen bg-zinc-950 flex flex-col relative border-x border-zinc-900/80 shadow-2xl">
      {/* Top Mobile Header */}
      <AppHeader
        preferredUnit={profile.preferredUnit}
        onToggleUnit={handleToggleUnit}
        onOpenCoach={() => setIsCoachOpen(true)}
        activeProgramName={activeProgram.name}
      />

      {/* Main View Area */}
      <div className="flex-1 px-4 pt-3">
        {activeTab === 'workout' && (
          <WorkoutLogger
            program={activeProgram}
            exercises={exercises}
            preferredUnit={profile.preferredUnit}
            onWorkoutCompleted={loadData}
          />
        )}

        {activeTab === 'program' && (
          <ProgramBuilder
            program={activeProgram}
            allPrograms={allPrograms}
            exercises={exercises}
            onProgramUpdated={(updated) => setActiveProgram(updated)}
            onProgramSwitched={handleProgramSwitched}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressDashboard
            exercises={exercises}
            preferredUnit={profile.preferredUnit}
          />
        )}

        {activeTab === 'exercises' && (
          <ExerciseLibrary
            exercises={exercises}
            onExerciseAdded={handleExerciseAdded}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileSettings
            profile={profile}
            onProfileUpdated={setProfile}
            onResetComplete={loadData}
          />
        )}
      </div>

      {/* Bottom Sticky Tab Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* AI Split Coach Modal */}
      <CoachModal
        isOpen={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
        onProgramApplied={handleProgramApplied}
      />
    </main>
  );
}
