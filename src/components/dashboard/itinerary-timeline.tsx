"use client";

import { useState } from "react";
import {
  Clock,
  MapPin,
  Navigation,
  DollarSign,
  CloudRain,
  Sun,
  Utensils,
  Camera,
  Landmark,
  ShoppingBag,
} from "lucide-react";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { type LucideIcon } from "lucide-react";

interface Activity {
  id: string;
  title: string;
  description?: string;
  category: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  estimatedCost: number;
  transportMode: string;
  lat: number;
  lng: number;
  address?: string;
  weatherSensitivity: string;
  isCompleted?: boolean;
}

interface ItineraryDay {
  id: string;
  dayNumber: number;
  date: string;
  theme?: string;
  summary?: string;
  estimatedCost: number;
  travelDistance: number;
  travelTime: number;
  activities: Activity[];
}

interface Props {
  days: ItineraryDay[];
  onSelectActivity?: (activity: Activity) => void;
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  sightseeing: Landmark,
  food: Utensils,
  cultural: Camera,
  outdoor: Sun,
  shopping: ShoppingBag,
};

export function ItineraryTimeline({ days, onSelectActivity }: Props) {
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const { formatAmount } = useCurrency();
  const activeDay = days[selectedDayIdx] || days[0];

  if (!activeDay) return null;

  return (
    <div className="space-y-6">
      {/* Day Tabs Bar */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-3 scrollbar-none">
        {days.map((day, idx) => (
          <button
            key={day.id}
            onClick={() => setSelectedDayIdx(idx)}
            className={`px-4.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition border ${
              selectedDayIdx === idx
                ? "bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 text-white border-blue-400 shadow-lg shadow-blue-500/30"
                : "bg-slate-950/60 text-slate-300 border-white/10 hover:bg-slate-800"
            }`}
          >
            Day {day.dayNumber}
            <span className="ml-2 font-normal opacity-80">
              ({new Date(day.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })})
            </span>
          </button>
        ))}
      </div>

      {/* Day Theme Banner */}
      <div className="bg-gradient-to-r from-blue-950/70 via-indigo-950/50 to-slate-900/90 border border-white/10 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white shadow-xl">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-white">
            Day {activeDay.dayNumber}: {activeDay.theme || "Exploration Day"}
          </h3>
          <p className="text-xs text-slate-300 font-medium">{activeDay.summary}</p>
        </div>
        <div className="flex items-center gap-5 text-xs font-semibold text-slate-300 shrink-0">
          <div className="flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-blue-400" />
            <span>{activeDay.travelDistance} km total</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>{formatAmount(activeDay.estimatedCost)}</span>
          </div>
        </div>
      </div>

      {/* Activities Timeline List */}
      <div className="relative pl-7 space-y-6 border-l-2 border-blue-500/30 ml-4">
        {activeDay.activities.map((act, index) => {
          const IconComp = CATEGORY_ICONS[act.category] || Landmark;
          const isOutdoorRainWarning = act.weatherSensitivity === "indoor" && act.description?.includes("Adapted for expected rain");

          return (
            <div
              key={act.id || index}
              onClick={() => onSelectActivity?.(act)}
              className="relative group cursor-pointer"
            >
              {/* Timeline Dot */}
              <div className="absolute -left-[35px] top-2 w-7 h-7 rounded-full bg-slate-950 border-2 border-blue-400 flex items-center justify-center text-blue-400 shadow-lg group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition">
                <IconComp className="w-3.5 h-3.5" />
              </div>

              {/* Activity Card */}
              <div className="bg-slate-950/80 p-6 rounded-2xl border border-white/10 shadow-xl hover:border-blue-400/50 hover:shadow-2xl transition space-y-3 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {act.startTime} - {act.endTime} ({act.durationMinutes} mins)
                      </span>
                      <span className="capitalize px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-semibold border border-blue-500/30">
                        {act.category}
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-blue-300 transition">
                      {act.title}
                    </h4>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-amber-400">
                      {act.estimatedCost > 0 ? formatAmount(act.estimatedCost) : "Free"}
                    </span>
                  </div>
                </div>

                {act.description && (
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">{act.description}</p>
                )}

                {isOutdoorRainWarning && (
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30">
                    <CloudRain className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Adapted to indoor alternative due to rain forecast</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between pt-3 border-t border-white/10 text-xs text-slate-400 gap-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate max-w-[240px]">{act.address || "Central District"}</span>
                  </div>
                  <div className="flex items-center gap-1 capitalize font-medium text-slate-300">
                    <Navigation className="w-3.5 h-3.5 text-blue-400" />
                    <span>{act.transportMode} transit</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
