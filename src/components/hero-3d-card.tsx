"use client";

import { useState } from "react";
import { Globe3DVisualizer } from "@/components/3d-globe-visualizer";
import { Globe } from "lucide-react";

export function Hero3DCard() {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - card.left;
    const y = e.clientY - card.top;

    const centerX = card.width / 2;
    const centerY = card.height / 2;

    const rotX = (y - centerY) / 18;
    const rotY = (centerX - x) / 18;

    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div className="perspective-2000 w-full max-w-6xl mx-auto py-2 sm:py-6">
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: "transform 0.12s ease-out",
        }}
        className="transform-style-3d glass-card-3d rounded-3xl p-8 sm:p-12 lg:p-16 relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-blue-950/60 border border-white/15 shadow-2xl"
      >
        {/* Animated Background Mesh Orbs */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-500/25 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Text & Badges (7 Cols) */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-bold shadow-lg shadow-blue-500/10">
              <Globe className="w-4 h-4 text-blue-400 animate-spin" />
              <span>Full 196-Country AI Spatial Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              Build your dream trip to <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 via-purple-400 to-amber-400 bg-clip-text text-transparent">
                any corner of the world.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed font-medium">
              Pick any of the 196 countries worldwide. Travel Planner geocodes venues, optimizes 2-Opt routes, adapts to rain forecasts, and manages budgets seamlessly.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
              {[
                { label: "Coverage",   value: "196 Countries", color: "#1BA8B5" },
                { label: "Optimizer",  value: "2-Opt TSP",     color: "#1B2F5E" },
                { label: "Weather",    value: "Live Rain Swap", color: "#10b981" },
                { label: "Currencies", value: "160+ FX Rates",  color: "#C8872A" },
              ].map((stat) => (
                <div key={stat.label}
                  className="p-4 rounded-2xl shadow-lg transition-all hover:-translate-y-0.5"
                  style={{
                    background:   "rgba(27,168,181,0.08)",
                    border:       "1px solid rgba(27,168,181,0.18)",
                    backdropFilter: "blur(8px)",
                  }}>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider block" style={{ color: "var(--muted)" }}>
                    {stat.label}
                  </span>
                  <p className="text-base font-black mt-0.5" style={{ color: stat.color }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

          </div>

          {/* Right Interactive 3D Spinning Globe (5 Cols) */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <Globe3DVisualizer />
          </div>
        </div>
      </div>
    </div>
  );
}
