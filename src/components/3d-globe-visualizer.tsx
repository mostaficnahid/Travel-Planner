"use client";

import { MapPin, Navigation, Sparkles } from "lucide-react";

const BEACON_PINS = [
  { name: "Paris", top: "25%", left: "48%", color: "bg-blue-500" },
  { name: "Tokyo", top: "32%", left: "82%", color: "bg-indigo-500" },
  { name: "New York", top: "30%", left: "28%", color: "bg-amber-500" },
  { name: "London", top: "22%", left: "45%", color: "bg-emerald-500" },
  { name: "Dhaka", top: "45%", left: "72%", color: "bg-purple-500" },
  { name: "Sydney", top: "72%", left: "86%", color: "bg-rose-500" },
  { name: "Rio", top: "68%", left: "36%", color: "bg-teal-500" },
  { name: "Cairo", top: "40%", left: "55%", color: "bg-amber-400" },
];

export function Globe3DVisualizer() {
  return (
    <div className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto flex items-center justify-center perspective-2000 pointer-events-none select-none">
      {/* Ambient Radial Glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-600/30 via-indigo-600/30 to-amber-500/20 blur-3xl animate-pulse-glow" />

      {/* 3D Spinning Sphere Container */}
      <div className="w-52 h-52 sm:w-64 sm:h-64 rounded-full border-2 border-blue-400/40 relative transform-style-3d animate-spin-globe shadow-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-950/80 overflow-hidden">
        {/* Latitude & Longitude Grid Lines */}
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div className="absolute inset-2 rounded-full border border-indigo-400/20" />
        <div className="absolute inset-6 rounded-full border border-blue-400/20" />

        {/* Equatorial & Longitudinal Rings */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-blue-400/40" />
        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-indigo-400/40" />
        <div className="absolute top-1/4 left-0 right-0 h-[1px] bg-white/20 border-t border-dashed border-white/20" />
        <div className="absolute top-3/4 left-0 right-0 h-[1px] bg-white/20 border-t border-dashed border-white/20" />

        {/* Destination Beacons */}
        {BEACON_PINS.map((pin, i) => (
          <div
            key={pin.name}
            style={{ top: pin.top, left: pin.left }}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 group"
          >
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pin.color} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${pin.color}`}></span>
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider text-white bg-slate-900/90 px-1.5 py-0.5 rounded border border-white/10 opacity-80">
              {pin.name}
            </span>
          </div>
        ))}
      </div>

      {/* Outer 3D Orbital Rings */}
      <div className="absolute inset-0 rounded-full border border-blue-500/30 transform-style-3d animate-orbit-ring" />
      <div
        className="absolute inset-[-12px] rounded-full border border-dashed border-indigo-400/30 transform-style-3d animate-orbit-ring"
        style={{ animationDirection: "reverse", animationDuration: "25s" }}
      />
    </div>
  );
}
