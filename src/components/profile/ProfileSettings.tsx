'use client';

import React, { useState, useRef } from 'react';
import {
  User,
  Scale,
  Flame,
  RefreshCw,
  ShieldCheck,
  Dumbbell,
  Award,
  Download,
  Upload,
  CheckCircle2,
  Heart,
  Moon,
  Building,
  CreditCard,
  Edit3,
  Plus,
  Activity,
  Sparkles,
  Clock,
  Disc,
  X,
  Save,
  Check,
} from 'lucide-react';
import { Unit, UserProfile, BodyWeightEntry } from '@/types';
import { getStorage } from '@/lib/storage';
import { formatWeight, toDisplayWeight, fromDisplayWeight } from '@/lib/utils/units';
import { getLocalDateString } from '@/lib/utils/date';

interface ProfileSettingsProps {
  profile: UserProfile;
  onProfileUpdated: (updated: UserProfile) => void;
  onResetComplete: () => void;
}

export function ProfileSettings({
  profile,
  onProfileUpdated,
  onResetComplete,
}: ProfileSettingsProps) {
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Profile Form State
  const [editForm, setEditForm] = useState({
    name: profile.name || 'Athlete',
    bio: profile.bio || '',
    homeGymName: profile.homeGymName || '',
    memberId: profile.memberId || '',
    experienceLevel: profile.experienceLevel || 'intermediate',
    daysPerWeek: profile.daysPerWeek || 5,
    targetGoal: profile.targetGoal || 'hypertrophy',
    targetWeightKg: profile.targetWeightKg || 0,
    heightCm: profile.heightCm || 0,
    defaultRestSec: profile.defaultRestSec || 90,
    defaultBarWeightKg: profile.defaultBarWeightKg ?? 20,
    restingHeartRateBpm: profile.restingHeartRateBpm || 0,
    sleepHours: profile.sleepHours || 8,
  });

  // Bodyweight Log Form State
  const [newWeightValue, setNewWeightValue] = useState<string>('');
  const [newWeightDate, setNewWeightDate] = useState<string>(getLocalDateString());

  const handleUnitChange = async (unit: Unit) => {
    const updated = { ...profile, preferredUnit: unit };
    const storage = getStorage();
    await storage.saveUserProfile(updated);
    onProfileUpdated(updated);
  };

  const handleSaveProfile = async () => {
    const updated: UserProfile = {
      ...profile,
      name: editForm.name.trim() || 'Athlete',
      bio: editForm.bio.trim(),
      homeGymName: editForm.homeGymName.trim(),
      memberId: editForm.memberId.trim(),
      experienceLevel: editForm.experienceLevel as any,
      daysPerWeek: Number(editForm.daysPerWeek),
      targetGoal: editForm.targetGoal as any,
      targetWeightKg: Number(editForm.targetWeightKg) || undefined,
      heightCm: Number(editForm.heightCm) || undefined,
      defaultRestSec: Number(editForm.defaultRestSec),
      defaultBarWeightKg: Number(editForm.defaultBarWeightKg),
      restingHeartRateBpm: Number(editForm.restingHeartRateBpm) || undefined,
      sleepHours: Number(editForm.sleepHours) || undefined,
    };

    const storage = getStorage();
    await storage.saveUserProfile(updated);
    onProfileUpdated(updated);
    setIsEditModalOpen(false);
  };

  const handleLogWeight = async () => {
    const val = parseFloat(newWeightValue);
    if (!val || val <= 0) return;

    const weightInKg = fromDisplayWeight(val, profile.preferredUnit);
    const newEntry: BodyWeightEntry = {
      id: `weight-${Date.now()}`,
      date: newWeightDate,
      weightKg: Math.round(weightInKg * 10) / 10,
    };

    const currentHistory = profile.weightHistory || [];
    const updatedHistory = [newEntry, ...currentHistory.filter((w) => w.date !== newWeightDate)].slice(0, 30);

    const updated: UserProfile = {
      ...profile,
      currentWeightKg: newEntry.weightKg,
      weightHistory: updatedHistory,
    };

    const storage = getStorage();
    await storage.saveUserProfile(updated);
    onProfileUpdated(updated);
    setNewWeightValue('');
    setIsWeightModalOpen(false);
  };

  const handleResetData = async () => {
    const storage = getStorage();
    await storage.resetToDefaults();
    setIsResetConfirmOpen(false);
    onResetComplete();
  };

  const handleExportBackup = async () => {
    const storage = getStorage();
    const [userProfile, programs, exercises, sessions] = await Promise.all([
      storage.getUserProfile(),
      storage.getPrograms(),
      storage.getExercises(),
      storage.getWorkoutSessions(),
    ]);

    const backupPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      userProfile,
      programs,
      exercises,
      sessions,
    };

    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mygym-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupStatus('Backup exported!');
    setTimeout(() => setBackupStatus(null), 3000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.userProfile) localStorage.setItem('mygym_user_profile', JSON.stringify(data.userProfile));
        if (data.programs) localStorage.setItem('mygym_programs', JSON.stringify(data.programs));
        if (data.exercises) localStorage.setItem('mygym_exercises', JSON.stringify(data.exercises));
        if (data.sessions) localStorage.setItem('mygym_workout_sessions_v1', JSON.stringify(data.sessions));
        setBackupStatus('Backup restored successfully!');
        setTimeout(() => setBackupStatus(null), 3000);
        onResetComplete();
      } catch {
        setBackupStatus('Invalid backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 pb-28 animate-in fade-in">
      {/* Athlete Identity Card */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-5 rounded-3xl border border-zinc-800/80 shadow-xl space-y-4 relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-700 flex items-center justify-center font-black text-zinc-950 text-2xl shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/30 shrink-0">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-white">{profile.name}</h2>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase tracking-wide">
                  PRO ATHLETE
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {profile.bio || 'Strength & Hypertrophy Athlete'}
              </p>
              {(profile.homeGymName || profile.memberId) && (
                <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1">
                  {profile.homeGymName && (
                    <span className="flex items-center gap-1 text-zinc-300">
                      <Building className="w-3 h-3 text-emerald-400" />
                      {profile.homeGymName}
                    </span>
                  )}
                  {profile.memberId && (
                    <span className="text-zinc-500 font-mono">
                      ID: {profile.memberId}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setEditForm({
                name: profile.name || 'Athlete',
                bio: profile.bio || '',
                homeGymName: profile.homeGymName || '',
                memberId: profile.memberId || '',
                experienceLevel: profile.experienceLevel || 'intermediate',
                daysPerWeek: profile.daysPerWeek || 5,
                targetGoal: profile.targetGoal || 'hypertrophy',
                targetWeightKg: profile.targetWeightKg || 0,
                heightCm: profile.heightCm || 0,
                defaultRestSec: profile.defaultRestSec || 90,
                defaultBarWeightKg: profile.defaultBarWeightKg ?? 20,
                restingHeartRateBpm: profile.restingHeartRateBpm || 0,
                sleepHours: profile.sleepHours || 8,
              });
              setIsEditModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold border border-zinc-700/60 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Edit</span>
          </button>
        </div>

        {/* Athlete Quick Badges */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-800/60 text-center">
          <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80">
            <span className="text-[10px] font-bold text-zinc-500 uppercase block">Level</span>
            <span className="text-xs font-black text-white capitalize">{profile.experienceLevel}</span>
          </div>
          <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80">
            <span className="text-[10px] font-bold text-zinc-500 uppercase block">Frequency</span>
            <span className="text-xs font-black text-emerald-400">{profile.daysPerWeek} Days / Wk</span>
          </div>
          <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80">
            <span className="text-[10px] font-bold text-zinc-500 uppercase block">Primary Goal</span>
            <span className="text-xs font-black text-amber-400 capitalize">{profile.targetGoal.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Bodyweight & Composition Tracker Widget */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-3.5 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Bodyweight Tracking</h3>
              <p className="text-[11px] text-zinc-400">Log weigh-ins & track mass changes</p>
            </div>
          </div>

          <button
            onClick={() => {
              setNewWeightValue(
                profile.currentWeightKg
                  ? toDisplayWeight(profile.currentWeightKg, profile.preferredUnit).toString()
                  : ''
              );
              setNewWeightDate(getLocalDateString());
              setIsWeightModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Log Weight</span>
          </button>
        </div>

        {/* Current Weight & Target Stat */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-500 uppercase block">Latest Weight</span>
            <span className="text-lg font-black text-white font-mono mt-0.5 block">
              {profile.currentWeightKg
                ? formatWeight(profile.currentWeightKg, profile.preferredUnit, true)
                : 'Not logged'}
            </span>
          </div>

          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-500 uppercase block">Target Goal</span>
            <span className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">
              {profile.targetWeightKg
                ? formatWeight(profile.targetWeightKg, profile.preferredUnit, true)
                : '—'}
            </span>
          </div>
        </div>

        {/* Recent Weight Log List */}
        {profile.weightHistory && profile.weightHistory.length > 0 && (
          <div className="space-y-1 pt-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
              Recent Weigh-ins
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {profile.weightHistory.slice(0, 5).map((w) => (
                <div
                  key={w.id}
                  className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-xl shrink-0 text-center"
                >
                  <span className="text-[10px] text-zinc-500 block">{w.date.slice(5)}</span>
                  <span className="text-xs font-black text-zinc-200 font-mono">
                    {formatWeight(w.weightKg, profile.preferredUnit, true)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Health & Biometrics Hub */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-3 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Health & Recovery Biometrics</h3>
            <p className="text-[11px] text-zinc-400">Resting vitals to calibrate your AI Coach</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
              <Activity className="w-3 h-3 text-rose-400" />
              Resting HR
            </span>
            <span className="text-base font-black text-white font-mono mt-0.5 block">
              {profile.restingHeartRateBpm ? `${profile.restingHeartRateBpm} bpm` : '62 bpm (Est.)'}
            </span>
          </div>

          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
              <Moon className="w-3 h-3 text-indigo-400" />
              Sleep Target
            </span>
            <span className="text-base font-black text-white font-mono mt-0.5 block">
              {profile.sleepHours ? `${profile.sleepHours} hrs` : '8.0 hrs'}
            </span>
          </div>
        </div>

        {/* Integration Sync Status Badges */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
          <div className="p-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl flex items-center justify-between">
            <span className="text-zinc-300 font-bold flex items-center gap-1.5">
              <span>🍏</span> Apple Health
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              Ready
            </span>
          </div>

          <div className="p-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl flex items-center justify-between">
            <span className="text-zinc-300 font-bold flex items-center gap-1.5">
              <span>🩺</span> Health Connect
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              Ready
            </span>
          </div>
        </div>
      </div>

      {/* Training Preferences */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-4 shadow-md">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Training Preferences & Apparatus
        </h3>

        {/* Unit Selector */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-white block">Weight Display Unit</span>
            <span className="text-xs text-zinc-400">Raw logs are securely stored in KG</span>
          </div>

          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => handleUnitChange('kg')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                profile.preferredUnit === 'kg'
                  ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              KG
            </button>
            <button
              onClick={() => handleUnitChange('lb')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                profile.preferredUnit === 'lb'
                  ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              LB
            </button>
          </div>
        </div>

        {/* Default Barbell & Rest Interval Display */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-zinc-800/60">
          <div className="flex items-center justify-between p-2.5 bg-zinc-950 rounded-xl border border-zinc-800">
            <span className="text-zinc-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Default Rest:
            </span>
            <strong className="text-zinc-200">{profile.defaultRestSec || 90}s</strong>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-zinc-950 rounded-xl border border-zinc-800">
            <span className="text-zinc-400 flex items-center gap-1">
              <Disc className="w-3.5 h-3.5 text-blue-400" />
              Default Bar:
            </span>
            <strong className="text-zinc-200">{profile.defaultBarWeightKg ?? 20} kg</strong>
          </div>
        </div>
      </div>

      {/* Methodology Standards Card */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-2.5 shadow-md">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Evidence-Based Programming Rules
        </h3>

        <div className="space-y-2 text-xs text-zinc-300">
          <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800/80">
            <span className="font-bold text-emerald-400 block mb-0.5">
              🔥 Double-Progression Engine
            </span>
            <p className="text-zinc-400">
              When you hit your target max reps across all working sets in a session, a green badge awards you:
              <strong className="text-zinc-200 block mt-0.5">
                • +2.5 kg next session for compound lifts
              </strong>
              <strong className="text-zinc-200 block">
                • +1–2.5 kg next session for isolation lifts
              </strong>
            </p>
          </div>

          <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800/80">
            <span className="font-bold text-amber-400 block mb-0.5">
              ⚖️ Warm-up Set Exclusion Rule
            </span>
            <p className="text-zinc-400">
              Sets flagged as <strong className="text-amber-300 font-mono">WARM</strong> are strictly excluded from your weekly hard-set volume landmark calculations and 1RM estimations.
            </p>
          </div>
        </div>
      </div>

      {/* Data Backup & Portability Section */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Data Backup & Sync
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Export your mobile workouts or restore from a JSON backup
            </p>
          </div>
          {backupStatus && (
            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {backupStatus}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-zinc-950 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-zinc-950 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-xl text-xs font-semibold transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportBackup}
            className="hidden"
          />
        </div>
      </div>

      {/* Reset Section */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-zinc-300 block">
            Reset Application Data
          </span>
          <span className="text-[11px] text-zinc-500">
            Re-seeds Winter Arc 5-Day and 80+ exercises
          </span>
        </div>

        <button
          onClick={() => setIsResetConfirmOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-400 text-xs font-semibold rounded-xl border border-zinc-700/60 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black text-white">Edit Athlete Profile</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 font-bold block mb-1">Athlete Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full h-11 bg-zinc-900 border border-zinc-700 rounded-xl px-3 text-white font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">Bio / Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Strength & Hypertrophy Focus"
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full h-11 bg-zinc-900 border border-zinc-700 rounded-xl px-3 text-white font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Home Gym</label>
                  <input
                    type="text"
                    placeholder="e.g. Iron House Gym"
                    value={editForm.homeGymName}
                    onChange={(e) => setEditForm({ ...editForm, homeGymName: e.target.value })}
                    className="w-full h-11 bg-zinc-900 border border-zinc-700 rounded-xl px-3 text-white font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Member ID</label>
                  <input
                    type="text"
                    placeholder="#8492"
                    value={editForm.memberId}
                    onChange={(e) => setEditForm({ ...editForm, memberId: e.target.value })}
                    className="w-full h-11 bg-zinc-900 border border-zinc-700 rounded-xl px-3 text-white font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Experience Level</label>
                  <select
                    value={editForm.experienceLevel}
                    onChange={(e) => setEditForm({ ...editForm, experienceLevel: e.target.value as any })}
                    className="w-full h-11 bg-zinc-900 border border-zinc-700 rounded-xl px-3 text-white font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Target Goal</label>
                  <select
                    value={editForm.targetGoal}
                    onChange={(e) => setEditForm({ ...editForm, targetGoal: e.target.value as any })}
                    className="w-full h-11 bg-zinc-900 border border-zinc-700 rounded-xl px-3 text-white font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="hypertrophy">Hypertrophy (Muscle)</option>
                    <option value="strength">Strength (Power)</option>
                    <option value="general_fitness">General Fitness</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Target Weight (KG)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editForm.targetWeightKg || ''}
                    onChange={(e) => setEditForm({ ...editForm, targetWeightKg: parseFloat(e.target.value) || 0 })}
                    className="w-full h-11 bg-zinc-900 border border-zinc-700 rounded-xl px-3 text-white font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Rest Interval (sec)</label>
                  <select
                    value={editForm.defaultRestSec}
                    onChange={(e) => setEditForm({ ...editForm, defaultRestSec: parseInt(e.target.value) || 90 })}
                    className="w-full h-11 bg-zinc-900 border border-zinc-700 rounded-xl px-3 text-white font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option value={60}>60 Seconds</option>
                    <option value={90}>90 Seconds</option>
                    <option value={120}>120 Seconds</option>
                    <option value={180}>180 Seconds</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-3 bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Bodyweight Modal */}
      {isWeightModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-xs p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-400" />
                Log Bodyweight
              </h3>
              <button
                onClick={() => setIsWeightModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">
                  Weight ({profile.preferredUnit.toUpperCase()})
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="300"
                  placeholder="e.g. 75.5"
                  value={newWeightValue}
                  onChange={(e) => setNewWeightValue(e.target.value)}
                  className="w-full h-12 bg-zinc-900 border border-zinc-700 rounded-xl px-3 text-center text-xl font-mono font-black text-white focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Date</label>
                <input
                  type="date"
                  value={newWeightDate}
                  onChange={(e) => setNewWeightDate(e.target.value)}
                  className="w-full h-10 bg-zinc-900 border border-zinc-700 rounded-xl px-3 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogWeight}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
            >
              Save Weigh-in
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Reset */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 max-w-xs w-full text-center space-y-3">
            <h4 className="text-sm font-bold text-white">Reset all data?</h4>
            <p className="text-xs text-zinc-400">
              This will restore the initial Winter Arc 5-Day split and reset any custom logs.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-2 bg-zinc-800 text-zinc-300 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleResetData}
                className="flex-1 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
