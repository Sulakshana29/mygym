'use client';

import React from 'react';
import { Dumbbell, CalendarRange, TrendingUp, BookOpen, User } from 'lucide-react';

export type TabType = 'workout' | 'program' | 'progress' | 'exercises' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'workout' as TabType, label: 'Today', icon: Dumbbell },
    { id: 'program' as TabType, label: 'Program', icon: CalendarRange },
    { id: 'progress' as TabType, label: 'Progress', icon: TrendingUp },
    { id: 'exercises' as TabType, label: 'Exercises', icon: BookOpen },
    { id: 'profile' as TabType, label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/80 px-2 py-2">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-emerald-400 scale-105'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-colors ${
                  isActive ? 'bg-emerald-500/10' : 'bg-transparent'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[11px] font-medium tracking-wide mt-0.5">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
