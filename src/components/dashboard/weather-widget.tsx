"use client";

import { CloudRain, Sun, Cloud, CloudLightning, Snowflake, ShieldAlert } from "lucide-react";
import { WeatherForecastDay } from "@/lib/services/weather";

interface Props {
  forecast: WeatherForecastDay[];
}

const ICON_MAP: Record<string, any> = {
  sun: Sun,
  "cloud-sun": Cloud,
  "cloud-rain": CloudRain,
  "cloud-lightning": CloudLightning,
  snowflake: Snowflake,
};

export function WeatherWidget({ forecast }: Props) {
  if (!forecast || forecast.length === 0) return null;

  const rainyDays = forecast.filter((f) => f.precipProbability >= 60);

  return (
    <div className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-7 sm:p-8 border border-white/10 shadow-2xl space-y-5 text-white">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <CloudRain className="w-5 h-5 text-blue-400" />
          Weather Intelligence & Forecast
        </h3>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/30">
          Live Forecast
        </span>
      </div>

      {/* Rain Alert Banner */}
      {rainyDays.length > 0 && (
        <div className="bg-blue-500/20 border border-blue-400/30 p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold text-blue-200">
          <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            Weather Alert: Rain expected on {rainyDays.map((d) => d.date).join(", ")}. Outdoor schedule automatically updated to indoor venues.
          </span>
        </div>
      )}

      {/* Weather Days Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {forecast.slice(0, 5).map((day, idx) => {
          const IconComp = ICON_MAP[day.icon] || Sun;
          const isRainy = day.precipProbability >= 60;

          return (
            <div
              key={day.date || idx}
              className={`p-4 rounded-2xl border text-center space-y-1.5 transition ${
                isRainy
                  ? "bg-blue-500/20 border-blue-400/40"
                  : "bg-slate-950/60 border-white/10 hover:bg-slate-800"
              }`}
            >
              <span className="text-[11px] font-bold text-slate-400 block truncate">
                {new Date(day.date).toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" })}
              </span>
              <IconComp
                className={`w-6 h-6 mx-auto ${
                  isRainy ? "text-blue-400 animate-bounce" : "text-amber-400"
                }`}
              />
              <div className="text-xs font-bold text-white">
                {day.tempMax}° / {day.tempMin}°C
              </div>
              <span
                className={`text-[10px] font-semibold block ${
                  isRainy ? "text-blue-300 font-bold" : "text-slate-400"
                }`}
              >
                💧 {day.precipProbability}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
