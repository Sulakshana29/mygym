'use client';

import React, { useState, useRef } from 'react';
import { User, Scale, Flame, RefreshCw, ShieldCheck, Dumbbell, Award, Download, Upload, CheckCircle2 } from 'lucide-react';
import { Unit, UserProfile } from '@/types';
import { getStorage } from '@/lib/storage';

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
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUnitChange = async (unit: Unit) => {
    const updated = { ...profile, preferredUnit: unit };
    const storage = getStorage();
    await storage.saveUserProfile(updated);
    onProfileUpdated(updated);
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
        if (data.sessions) localStorage.setItem('mygym_sessions', JSON.stringify(data.sessions));
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
    <div className="space-y-4 pb-24">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-5 rounded-2xl border border-zinc-800/80 shadow-lg space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-zinc-950 text-xl shadow-lg shadow-emerald-950/40">
            {profile.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{profile.name}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ATHLETE
              </span>
            </div>
            <p className="text-xs text-zinc-400 capitalize">
              {profile.experienceLevel} • {profile.daysPerWeek} days / week
            </p>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Units & Display
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-white block">
              Weight Display Unit
            </span>
            <span className="text-xs text-zinc-400">
              Raw data is always securely stored in KG
            </span>
          </div>

          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => handleUnitChange('kg')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                profile.preferredUnit === 'kg'
                  ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Kilograms (KG)
            </button>
            <button
              onClick={() => handleUnitChange('lb')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                profile.preferredUnit === 'lb'
                  ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Pounds (LB)
            </button>
          </div>
        </div>
      </div>

      {/* Methodology Standards Card */}
      <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-2.5">
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
      <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
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

      {/* Confirmation Modal */}
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
