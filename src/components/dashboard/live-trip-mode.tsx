"use client";

import { useState } from "react";
import { Radio, Navigation, Clock, CloudRain, AlertTriangle, CheckCircle2, Play, MapPin, Zap } from "lucide-react";

interface Activity {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  lat: number;
  lng: number;
  address?: string;
  transportMode: string;
}

interface Props {
  activities: Activity[];
  onTriggerAdapt?: (reason: string) => void;
}

export function LiveTripMode({ activities, onTriggerAdapt }: Props) {
  const [isActive, setIsActive] = useState(true);
  const currentAct = activities[0] || {
    title: "Morning Exploration at Historic Landmarks",
    startTime: "09:30",
    endTime: "11:30",
    durationMinutes: 120,
    transportMode: "walk",
    address: "Central Historic Square",
  };

  const nextAct = activities[1] || {
    title: "Authentic Local Lunch & Tasting",
    startTime: "12:00",
    endTime: "13:30",
    durationMinutes: 90,
  };

  if (!isActive) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-5 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold">Real-Time Live Trip Mode</h4>
            <p className="text-xs text-blue-100">Activate day-of live navigation & dynamic schedule co-pilot</p>
          </div>
        </div>
        <button
          onClick={() => setIsActive(true)}
          className="bg-white text-blue-600 font-bold text-xs px-4 py-2 rounded-xl shadow-sm hover:bg-blue-50 transition"
        >
          Enable Live Mode
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Live Trip Execution</span>
        </div>
        <button
          onClick={() => setIsActive(false)}
          className="text-xs text-slate-400 hover:text-white"
        >
          Minimize
        </button>
      </div>

      {/* Current Active Venue Card */}
      <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">Current Stop Now</span>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-black text-white">{currentAct.title}</h3>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>{currentAct.address || "Central District"}</span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{currentAct.startTime} - {currentAct.endTime}</span>
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
          <span className="text-slate-400">Next stop in 45 mins: <strong>{nextAct.title}</strong></span>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentAct.title)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-blue-400 font-bold hover:underline"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Open Directions</span>
          </a>
        </div>
      </div>

      {/* Day-of Instant Quick Adaptation Triggers */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Day-of Real-Time Adapters</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            onClick={() => onTriggerAdapt?.("rain")}
            className="flex items-center gap-1.5 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-blue-300 transition"
          >
            <CloudRain className="w-3.5 h-3.5 text-blue-400" />
            <span>Started Raining</span>
          </button>

          <button
            onClick={() => onTriggerAdapt?.("late")}
            className="flex items-center gap-1.5 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-amber-300 transition"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Running 30m Late</span>
          </button>

          <button
            onClick={() => onTriggerAdapt?.("optimize")}
            className="flex items-center gap-1.5 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-emerald-300 transition col-span-2 sm:col-span-1"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>2-Opt Re-Route</span>
          </button>
        </div>
      </div>
    </div>
  );
}
