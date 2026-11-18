'use client';

import React, { useState } from 'react';
import { Unit } from '@/types';
import { formatWeight, toDisplayWeight } from '@/lib/utils/units';
import { Trophy, TrendingUp, Calendar, Zap, ArrowUpRight } from 'lucide-react';

export interface DataPoint1RM {
  date: string;
  max1RM: number; // in raw kg
  weight: number;
  reps: number;
  sessionName?: string;
}

export interface VolumePoint {
  label: string; // date or week
  volumeKg: number;
  hardSets: number;
}

interface ProgressChartProps {
  data1RM: DataPoint1RM[];
  volumeData: VolumePoint[];
  preferredUnit: Unit;
  exerciseName: string;
}

export function ProgressChart({
  data1RM,
  volumeData,
  preferredUnit,
  exerciseName,
}: ProgressChartProps) {
  const [activeTab, setActiveTab] = useState<'1rm' | 'volume'>('1rm');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // --- 1RM Line Chart Calculations ---
  // Sort chronologically for the chart
  const sorted1RM = [...data1RM].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const displayValues = sorted1RM.map((d) => toDisplayWeight(d.max1RM, preferredUnit));
  const minVal = displayValues.length > 0 ? Math.floor(Math.min(...displayValues) * 0.9) : 0;
  const maxVal = displayValues.length > 0 ? Math.ceil(Math.max(...displayValues) * 1.08) : 100;
  const range = maxVal - minVal || 1;

  // Chart dimensions
  const width = 360;
  const height = 180;
  const paddingX = 35;
  const paddingTop = 25;
  const paddingBottom = 30;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingTop - paddingBottom;

  const points = sorted1RM.map((d, i) => {
    const x =
      sorted1RM.length === 1
        ? width / 2
        : paddingX + (i / (sorted1RM.length - 1)) * chartW;
    const val = toDisplayWeight(d.max1RM, preferredUnit);
    const y = paddingTop + chartH - ((val - minVal) / range) * chartH;
    return { x, y, val, original: d };
  });

  // Build SVG path
  let pathD = '';
  if (points.length === 1) {
    pathD = `M ${points[0].x - 20} ${points[0].y} L ${points[0].x + 20} ${points[0].y}`;
  } else if (points.length > 1) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx1 = prev.x + (curr.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (curr.x - prev.x) / 2;
      const cy2 = curr.y;
      pathD += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
    }
  }

  // Area path (closed at bottom)
  let areaD = '';
  if (points.length > 1) {
    areaD = `${pathD} L ${points[points.length - 1].x} ${
      paddingTop + chartH
    } L ${points[0].x} ${paddingTop + chartH} Z`;
  }

  // Calculate Net Strength Progress
  const first1RM = sorted1RM[0]?.max1RM || 0;
  const last1RM = sorted1RM[sorted1RM.length - 1]?.max1RM || 0;
  const diffKg = last1RM - first1RM;
  const diffDisplay = toDisplayWeight(Math.abs(diffKg), preferredUnit);
  const diffPct = first1RM > 0 ? Math.round((diffKg / first1RM) * 100) : 0;
  const isPositive = diffKg >= 0;

  // Peak PR Index
  const peakVal = Math.max(...displayValues, 0);
  const peakIdx = displayValues.indexOf(peakVal);

  const selectedPoint =
    hoveredIdx !== null ? points[hoveredIdx] : points[points.length - 1];

  // --- Volume Bar Chart Calculations ---
  const recentVolume = [...volumeData].slice(-6);
  const maxVolume = Math.max(...recentVolume.map((v) => v.volumeKg), 1);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl space-y-3.5">
      {/* Header & Mode Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Visual Performance Analytics
          </span>
          <h3 className="text-base font-extrabold text-white flex items-center gap-1.5 mt-0.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            {activeTab === '1rm' ? `${exerciseName} 1RM Curve` : 'Weekly Volume Tonnage'}
          </h3>
        </div>

        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
          <button
            onClick={() => setActiveTab('1rm')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              activeTab === '1rm'
                ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            1RM Curve
          </button>
          <button
            onClick={() => setActiveTab('volume')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              activeTab === 'volume'
                ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Volume Bars
          </button>
        </div>
      </div>

      {/* ================= 1RM LINE GRAPH ================= */}
      {activeTab === '1rm' && (
        <div className="space-y-3">
          {sorted1RM.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-xl text-center p-4">
              <Zap className="w-6 h-6 text-zinc-600 mb-1.5" />
              <p className="text-sm font-semibold text-zinc-400">No workout logs yet</p>
              <span className="text-xs text-zinc-500 mt-0.5">
                Complete a session with {exerciseName} to generate your 1RM curve.
              </span>
            </div>
          ) : (
            <>
              {/* Highlight Stats Pill */}
              <div className="flex items-center justify-between bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800/80">
                <div>
                  <span className="text-[11px] text-zinc-400 block font-medium">
                    {selectedPoint?.original.sessionName || 'Selected Workout'}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-lg font-black text-white font-mono">
                      {selectedPoint?.val} {preferredUnit}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      (Best: {toDisplayWeight(selectedPoint?.original.weight || 0, preferredUnit)}
                      {preferredUnit} × {selectedPoint?.original.reps} reps)
                    </span>
                  </div>
                </div>

                {sorted1RM.length > 1 && (
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">
                      Total Gain
                    </span>
                    <span
                      className={`text-xs font-black font-mono flex items-center justify-end gap-0.5 ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      {isPositive ? '+' : '-'}
                      {diffDisplay} {preferredUnit} ({isPositive ? '+' : ''}
                      {diffPct}%)
                    </span>
                  </div>
                )}
              </div>

              {/* SVG Curve Container */}
              <div className="w-full relative overflow-hidden bg-zinc-950/60 rounded-xl border border-zinc-800/80 pt-1">
                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  className="w-full h-auto overflow-visible select-none"
                >
                  <defs>
                    <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Horizontal Gridlines */}
                  {[0, 0.5, 1].map((pct, idx) => {
                    const yPos = paddingTop + chartH * pct;
                    const valAtY = Math.round(maxVal - pct * range);
                    return (
                      <g key={idx}>
                        <line
                          x1={paddingX}
                          y1={yPos}
                          x2={width - paddingX}
                          y2={yPos}
                          stroke="#27272a"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                        <text
                          x={paddingX - 6}
                          y={yPos + 3}
                          fill="#71717a"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="end"
                          fontFamily="monospace"
                        >
                          {valAtY}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area Fill */}
                  {areaD && <path d={areaD} fill="url(#emeraldGrad)" />}

                  {/* Line Curve */}
                  {pathD && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#glow)"
                    />
                  )}

                  {/* Interactive Points */}
                  {points.map((p, idx) => {
                    const isHovered = hoveredIdx === idx;
                    const isPeak = idx === peakIdx;
                    return (
                      <g
                        key={idx}
                        className="cursor-pointer"
                        onClick={() => setHoveredIdx(idx)}
                        onMouseEnter={() => setHoveredIdx(idx)}
                      >
                        {/* Hit Area */}
                        <circle cx={p.x} cy={p.y} r="14" fill="transparent" />

                        {/* Outer Glow on hover or peak */}
                        {(isHovered || isPeak) && (
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="9"
                            fill={isPeak ? '#f59e0b' : '#10b981'}
                            opacity="0.3"
                            className="animate-pulse"
                          />
                        )}

                        {/* Solid Center Dot */}
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={isHovered ? 5.5 : 4}
                          fill={isPeak ? '#f59e0b' : '#10b981'}
                          stroke="#09090b"
                          strokeWidth="2"
                        />

                        {/* Date Label on Bottom */}
                        <text
                          x={p.x}
                          y={height - 10}
                          fill={isHovered ? '#10b981' : '#71717a'}
                          fontSize="9"
                          fontWeight={isHovered ? 'bold' : 'normal'}
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {p.original.date.slice(5)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </>
          )}
        </div>
      )}

      {/* ================= VOLUME TONNAGE BAR CHART ================= */}
      {activeTab === 'volume' && (
        <div className="space-y-3">
          {recentVolume.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-xl text-center p-4">
              <Calendar className="w-6 h-6 text-zinc-600 mb-1.5" />
              <p className="text-sm font-semibold text-zinc-400">No session volume recorded</p>
              <span className="text-xs text-zinc-500 mt-0.5">
                Log full workouts to view your weekly tonnage overload bars.
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-zinc-400 block font-medium">
                    Latest Session Working Tonnage
                  </span>
                  <span className="text-lg font-black text-amber-400 font-mono">
                    {formatWeight(
                      recentVolume[recentVolume.length - 1]?.volumeKg || 0,
                      preferredUnit,
                      true
                    )}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-zinc-400 block font-medium">
                    Hard Working Sets
                  </span>
                  <span className="text-lg font-black text-white font-mono">
                    {recentVolume[recentVolume.length - 1]?.hardSets || 0} sets
                  </span>
                </div>
              </div>

              {/* Bars container */}
              <div className="h-36 flex items-end justify-around gap-2 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                {recentVolume.map((v, i) => {
                  const pct = Math.max(12, Math.round((v.volumeKg / maxVolume) * 100));
                  const isLatest = i === recentVolume.length - 1;
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center justify-end h-full group"
                    >
                      <span className="text-[9px] font-mono font-bold text-zinc-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {toDisplayWeight(v.volumeKg, preferredUnit)}
                      </span>
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          isLatest
                            ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-lg shadow-emerald-500/20'
                            : 'bg-gradient-to-t from-zinc-800 to-zinc-700 hover:from-emerald-900 hover:to-emerald-600'
                        }`}
                        style={{ height: `${pct}%` }}
                      />
                      <span className="text-[9px] text-zinc-400 font-mono mt-1.5 whitespace-nowrap">
                        {v.label.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

