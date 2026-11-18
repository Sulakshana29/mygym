'use client';

import React from 'react';
import { MuscleGroup } from '@/types';

interface MuscleDiagramProps {
  primaryMuscles?: MuscleGroup[];
  secondaryMuscles?: MuscleGroup[];
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

export function MuscleDiagram({
  primaryMuscles = [],
  secondaryMuscles = [],
  size = 'md',
  showLabels = false,
  className = '',
}: MuscleDiagramProps) {
  const isPrimary = (muscle: MuscleGroup) => primaryMuscles.includes(muscle);
  const isSecondary = (muscle: MuscleGroup) => secondaryMuscles.includes(muscle);

  const getMuscleColor = (muscle: MuscleGroup): { fill: string; stroke: string; glow?: boolean } => {
    if (isPrimary(muscle)) {
      return { fill: '#10b981', stroke: '#34d399', glow: true }; // Emerald active
    }
    if (isSecondary(muscle)) {
      return { fill: '#6366f1', stroke: '#818cf8', glow: false }; // Indigo assisting
    }
    return { fill: '#27272a', stroke: '#3f3f46', glow: false }; // Dark zinc neutral
  };

  const scale = size === 'sm' ? 'w-24 h-36' : size === 'lg' ? 'w-56 h-80' : 'w-40 h-60';

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div className={`flex items-center justify-center gap-3 ${scale}`}>
        {/* =================== FRONT ANATOMY =================== */}
        <div className="relative h-full aspect-[1/2] flex flex-col items-center">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
            Front
          </span>
          <svg
            viewBox="0 0 100 200"
            className="w-full h-full drop-shadow-md overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Head & Neck */}
            <circle cx="50" cy="18" r="10" fill="#27272a" stroke="#3f3f46" strokeWidth="1.5" />
            <path d="M46 27h8v8h-8z" fill="#27272a" />

            {/* Traps (Front) */}
            <path
              d="M40 33 L46 28 L54 28 L60 33 L56 36 L44 36 Z"
              fill={getMuscleColor('traps').fill}
              stroke={getMuscleColor('traps').stroke}
              strokeWidth="1.2"
            />

            {/* Shoulders (Front Delts) */}
            <path
              d="M26 36 C25 43 28 50 33 52 L37 42 C36 38 33 35 26 36 Z"
              fill={getMuscleColor('shoulders').fill}
              stroke={getMuscleColor('shoulders').stroke}
              strokeWidth="1.2"
            />
            <path
              d="M74 36 C75 43 72 50 67 52 L63 42 C64 38 67 35 74 36 Z"
              fill={getMuscleColor('shoulders').fill}
              stroke={getMuscleColor('shoulders').stroke}
              strokeWidth="1.2"
            />

            {/* Chest (Left & Right Pectorals) */}
            <path
              d="M37 36 C42 36 49 37 49 48 C43 51 36 50 35 44 C34 40 35 37 37 36 Z"
              fill={getMuscleColor('chest').fill}
              stroke={getMuscleColor('chest').stroke}
              strokeWidth="1.2"
            />
            <path
              d="M63 36 C58 36 51 37 51 48 C57 51 64 50 65 44 C66 40 65 37 63 36 Z"
              fill={getMuscleColor('chest').fill}
              stroke={getMuscleColor('chest').stroke}
              strokeWidth="1.2"
            />

            {/* Biceps */}
            <path
              d="M24 52 C22 58 24 68 28 70 L31 60 C32 55 29 53 24 52 Z"
              fill={getMuscleColor('biceps').fill}
              stroke={getMuscleColor('biceps').stroke}
              strokeWidth="1.2"
            />
            <path
              d="M76 52 C78 58 76 68 72 70 L69 60 C68 55 71 53 76 52 Z"
              fill={getMuscleColor('biceps').fill}
              stroke={getMuscleColor('biceps').stroke}
              strokeWidth="1.2"
            />

            {/* Forearms (Front) */}
            <path
              d="M23 72 C21 82 24 92 27 98 L30 96 C28 88 28 78 27 72 Z"
              fill={getMuscleColor('forearms').fill}
              stroke={getMuscleColor('forearms').stroke}
              strokeWidth="1.2"
            />
            <path
              d="M77 72 C79 82 76 92 73 98 L70 96 C72 88 72 78 73 72 Z"
              fill={getMuscleColor('forearms').fill}
              stroke={getMuscleColor('forearms').stroke}
              strokeWidth="1.2"
            />

            {/* Hands */}
            <ellipse cx="28" cy="103" rx="3" ry="5" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />
            <ellipse cx="72" cy="103" rx="3" ry="5" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />

            {/* Abs & Core */}
            <path
              d="M40 50 C44 50 49 50 49 59 C44 59 40 59 40 50 Z"
              fill={getMuscleColor('abs').fill}
              stroke={getMuscleColor('abs').stroke}
              strokeWidth="1"
            />
            <path
              d="M60 50 C56 50 51 50 51 59 C56 59 60 59 60 50 Z"
              fill={getMuscleColor('abs').fill}
              stroke={getMuscleColor('abs').stroke}
              strokeWidth="1"
            />
            <path
              d="M41 61 C45 61 49 61 49 70 C45 70 41 70 41 61 Z"
              fill={getMuscleColor('abs').fill}
              stroke={getMuscleColor('abs').stroke}
              strokeWidth="1"
            />
            <path
              d="M59 61 C55 61 51 61 51 70 C55 70 59 70 59 61 Z"
              fill={getMuscleColor('abs').fill}
              stroke={getMuscleColor('abs').stroke}
              strokeWidth="1"
            />
            <path
              d="M42 72 C46 72 49 72 49 80 C46 81 42 79 42 72 Z"
              fill={getMuscleColor('abs').fill}
              stroke={getMuscleColor('abs').stroke}
              strokeWidth="1"
            />
            <path
              d="M58 72 C54 72 51 72 51 80 C54 81 58 79 58 72 Z"
              fill={getMuscleColor('abs').fill}
              stroke={getMuscleColor('abs').stroke}
              strokeWidth="1"
            />

            {/* Pelvis */}
            <path d="M41 81 H59 L54 90 H46 Z" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />

            {/* Quads (Left & Right Front Thighs) */}
            <path
              d="M36 92 C33 108 34 126 38 136 C42 136 46 126 47 114 C48 102 46 92 42 92 Z"
              fill={getMuscleColor('quads').fill}
              stroke={getMuscleColor('quads').stroke}
              strokeWidth="1.2"
            />
            <path
              d="M64 92 C67 108 66 126 62 136 C58 136 54 126 53 114 C52 102 54 92 58 92 Z"
              fill={getMuscleColor('quads').fill}
              stroke={getMuscleColor('quads').stroke}
              strokeWidth="1.2"
            />

            {/* Knees */}
            <circle cx="40" cy="141" r="3.5" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />
            <circle cx="60" cy="141" r="3.5" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />

            {/* Calves (Front Tibialis / Calves) */}
            <path
              d="M37 146 C34 158 35 174 38 184 L43 184 C45 174 45 158 44 146 Z"
              fill={getMuscleColor('calves').fill}
              stroke={getMuscleColor('calves').stroke}
              strokeWidth="1.2"
            />
            <path
              d="M63 146 C66 158 65 174 62 184 L57 184 C55 174 55 158 56 146 Z"
              fill={getMuscleColor('calves').fill}
              stroke={getMuscleColor('calves').stroke}
              strokeWidth="1.2"
            />

            {/* Feet */}
            <ellipse cx="39" cy="189" rx="4" ry="2" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />
            <ellipse cx="61" cy="189" rx="4" ry="2" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />
          </svg>
        </div>

        {/* =================== BACK ANATOMY =================== */}
        <div className="relative h-full aspect-[1/2] flex flex-col items-center">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
            Back
          </span>
          <svg
            viewBox="0 0 100 200"
            className="w-full h-full drop-shadow-md overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Head & Neck (Back) */}
            <circle cx="50" cy="18" r="10" fill="#27272a" stroke="#3f3f46" strokeWidth="1.5" />
            <path d="M46 27h8v8h-8z" fill="#27272a" />

            {/* Traps (Upper Back Diamond) */}
            <path
              d="M50 29 L59 34 L54 48 L50 54 L46 48 L41 34 Z"
              fill={getMuscleColor('traps').fill}
              stroke={getMuscleColor('traps').stroke}
              strokeWidth="1.2"
            />

            {/* Rear Deltoids */}
            <path
              d="M26 36 C25 43 28 50 33 52 L36 43 C35 39 33 36 26 36 Z"
              fill={getMuscleColor('shoulders').fill}
              stroke={getMuscleColor('shoulders').stroke}
              strokeWidth="1.2"
            />
            <path
              d="M74 36 C75 43 72 50 67 52 L64 43 C65 39 67 36 74 36 Z"
              fill={getMuscleColor('shoulders').fill}
              stroke={getMuscleColor('shoulders').stroke}
              strokeWidth="1.2"
            />

            {/* Triceps */}
            <path
              d="M24 52 C22 58 24 68 28 70 L30 60 C31 55 28 53 24 52 Z"
              fill={getMuscleColor('triceps').fill}
              stroke={getMuscleColor('triceps').stroke}
              strokeWidth="1.2"
            />
            <path
              d="M76 52 C78 58 76 68 72 70 L70 60 C69 55 72 53 76 52 Z"
              fill={getMuscleColor('triceps').fill}
              stroke={getMuscleColor('triceps').stroke}
              strokeWidth="1.2"
            />

            {/* Forearms (Back) */}
            <path
              d="M23 72 C21 82 24 92 27 98 L30 96 C28 88 28 78 27 72 Z"
              fill={getMuscleColor('forearms').fill}
              stroke={getMuscleColor('forearms').stroke}
              strokeWidth="1.2"
            />
            <path
              d="M77 72 C79 82 76 92 73 98 L70 96 C72 88 72 78 73 72 Z"
              fill={getMuscleColor('forearms').fill}
              stroke={getMuscleColor('forearms').stroke}
              strokeWidth="1.2"
            />

            {/* Hands */}
            <ellipse cx="28" cy="103" rx="3" ry="5" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />
            <ellipse cx="72" cy="103" rx="3" ry="5" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />

            {/* Lats & Mid Back */}
            <path
              d="M36 44 C42 46 45 52 45 74 C41 74 38 68 35 56 Z"
              fill={getMuscleColor('back').fill}
              stroke={getMuscleColor('back').stroke}
              strokeWidth="1.2"
            />
            <path
              d="M64 44 C58 46 55 52 55 74 C59 74 62 68 65 56 Z"
              fill={getMuscleColor('back').fill}
              stroke={getMuscleColor('back').stroke}
              strokeWidth="1.2"
            />

            {/* Lower Back */}
            <path
              d="M45 70 H55 L53 82 H47 Z"
              fill={getMuscleColor('back').fill}
              stroke={getMuscleColor('back').stroke}
              strokeWidth="1"
            />

            {/* Glutes (Buttocks) */}
            <path
              d="M37 83 C43 83 49 84 49 98 C43 100 36 96 36 88 Z"
              fill={getMuscleColor('glutes').fill}
              stroke={getMuscleColor('glutes').stroke}
              strokeWidth="1.2"
            />
            <path
              d="M63 83 C57 83 51 84 51 98 C57 100 64 96 64 88 Z"
              fill={getMuscleColor('glutes').fill}
              stroke={getMuscleColor('glutes').stroke}
              strokeWidth="1.2"
            />

            {/* Hamstrings (Back of Thighs) */}
            <path
              d="M36 99 C34 112 35 127 38 136 C42 136 46 128 47 116 C48 106 46 99 42 99 Z"
              fill={getMuscleColor('hamstrings').fill}
              stroke={getMuscleColor('hamstrings').stroke}
              strokeWidth="1.2"
            />
            <path
              d="M64 99 C66 112 65 127 62 136 C58 136 54 128 53 116 C52 106 54 99 58 99 Z"
              fill={getMuscleColor('hamstrings').fill}
              stroke={getMuscleColor('hamstrings').stroke}
              strokeWidth="1.2"
            />

            {/* Knee Backs */}
            <circle cx="40" cy="141" r="3.5" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />
            <circle cx="60" cy="141" r="3.5" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />

            {/* Calves (Back - Gastrocnemius) */}
            <path
              d="M36 146 C32 158 34 172 38 184 L44 184 C46 172 47 158 45 146 Z"
              fill={getMuscleColor('calves').fill}
              stroke={getMuscleColor('calves').stroke}
              strokeWidth="1.2"
            />
            <path
              d="M64 146 C68 158 66 172 62 184 L56 184 C54 172 53 158 55 146 Z"
              fill={getMuscleColor('calves').fill}
              stroke={getMuscleColor('calves').stroke}
              strokeWidth="1.2"
            />

            {/* Feet */}
            <ellipse cx="39" cy="189" rx="4" ry="2" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />
            <ellipse cx="61" cy="189" rx="4" ry="2" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />
          </svg>
        </div>
      </div>

      {/* Legend */}
      {showLabels && (
        <div className="flex items-center justify-center gap-4 mt-2 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="text-zinc-300">
              Primary: {primaryMuscles.join(', ') || 'None'}
            </span>
          </div>
          {secondaryMuscles.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
              <span className="text-zinc-400">
                Assisting: {secondaryMuscles.join(', ')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

