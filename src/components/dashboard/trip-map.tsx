"use client";

import { useState } from "react";
import { MapPin, Navigation, ExternalLink, Layers, Compass, CheckCircle2 } from "lucide-react";

interface Activity {
  id: string;
  title: string;
  lat: number;
  lng: number;
  startTime: string;
  category: string;
  address?: string;
}

interface Props {
  activities: Activity[];
  center?: [number, number];
}

export function TripMap({ activities, center = [48.8566, 2.3522] }: Props) {
  const [selectedActivityIdx, setSelectedActivityIdx] = useState(0);
  const [mapMode, setMapMode] = useState<"m" | "k" | "p" | "h">("m"); // m: roadmap, k: satellite, p: terrain, h: hybrid

  const activeActivity = activities[selectedActivityIdx] || activities[0];
  const activeLat = activeActivity?.lat || center[0];
  const activeLng = activeActivity?.lng || center[1];

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Construct Google Maps Embed URL
  const googleMapEmbedUrl = apiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${activeLat},${activeLng}&zoom=14`
    : `https://maps.google.com/maps?q=${activeLat},${activeLng}&z=14&t=${mapMode}&output=embed`;

  // Construct Google Maps Turn-by-Turn Route URL
  const origin = activities[0] ? `${activities[0].lat},${activities[0].lng}` : "";
  const destination = activities[activities.length - 1]
    ? `${activities[activities.length - 1].lat},${activities[activities.length - 1].lng}`
    : "";
  const waypoints = activities
    .slice(1, -1)
    .map((a) => `${a.lat},${a.lng}`)
    .join("|");

  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=transit`;

  return (
    <div className="space-y-4">
      {/* Top Google Map Controls & Mode Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-3.5 px-4 rounded-2xl border border-white/10 text-xs font-semibold text-white">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-slate-200">Google Maps Navigation Engine</span>
          <span className="text-[10px] bg-blue-500/20 text-blue-300 font-extrabold px-2.5 py-0.5 rounded-full border border-blue-500/30">
            Official Google Map
          </span>
        </div>

        {/* Map Type Switcher Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setMapMode("m")}
            className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition ${
              mapMode === "m" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Roadmap
          </button>
          <button
            onClick={() => setMapMode("k")}
            className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition ${
              mapMode === "k" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setMapMode("h")}
            className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition ${
              mapMode === "h" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Hybrid
          </button>
        </div>
      </div>

      {/* Embedded Interactive Google Map Iframe Container */}
      <div className="relative w-full h-[460px] rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-slate-950 group">
        <iframe
          title="Google Map Route View"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={googleMapEmbedUrl}
          className="w-full h-full filter contrast-[1.05]"
        />

        {/* Floating Active Stop Card Badge */}
        {activeActivity && (
          <div className="absolute top-4 left-4 bg-slate-950/90 backdrop-blur-xl p-3.5 px-4.5 rounded-2xl border border-white/15 shadow-2xl space-y-1 max-w-sm pointer-events-auto">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-blue-400 gap-2">
              <span>Stop #{selectedActivityIdx + 1} ({activeActivity.startTime})</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {activeActivity.category}
              </span>
            </div>
            <h4 className="text-sm font-bold text-white truncate">{activeActivity.title}</h4>
            {activeActivity.address && (
              <p className="text-[11px] text-slate-400 truncate font-medium">{activeActivity.address}</p>
            )}
          </div>
        )}

        {/* Floating Turn-by-Turn Directions Button */}
        <a
          href={googleMapsDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-4 right-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-2xl text-xs font-black shadow-2xl shadow-blue-600/50 flex items-center gap-2 border border-white/20 transition transform hover:scale-105 active:scale-95"
        >
          <Navigation className="w-4 h-4 fill-current text-white" />
          <span>Open Full Route in Google Maps</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Interactive Venue Pin Selector Strip */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            Click Venue Stop to Focus Google Map ({activities.length} Stops)
          </span>
          <span className="text-[11px] text-blue-400 font-semibold">
            Stop {selectedActivityIdx + 1} of {activities.length} Selected
          </span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {activities.map((act, idx) => (
            <button
              key={act.id || idx}
              onClick={() => setSelectedActivityIdx(idx)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition border ${
                selectedActivityIdx === idx
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-lg shadow-blue-500/30 scale-105"
                  : "bg-slate-900/90 text-slate-300 border-white/10 hover:bg-slate-800"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                  selectedActivityIdx === idx ? "bg-white text-blue-600" : "bg-slate-800 text-slate-400"
                }`}
              >
                {idx + 1}
              </span>
              <span className="truncate max-w-[130px]">{act.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
