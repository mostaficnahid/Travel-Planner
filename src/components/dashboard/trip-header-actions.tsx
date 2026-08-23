"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, FileText, Calendar, Download, Printer, CheckCircle2, Loader2, ChevronDown } from "lucide-react";

interface Props {
  tripId: string;
  tripTitle: string;
}

export function TripHeaderActions({ tripId, tripTitle }: Props) {
  const router = useRouter();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedSuccess, setOptimizedSuccess] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setOptimizedSuccess(false);
    try {
      const res = await fetch(`/api/trips/${tripId}/optimize`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setOptimizedSuccess(true);
        router.refresh();
        setTimeout(() => setOptimizedSuccess(false), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
    setShowExportMenu(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 relative">
      {/* 2-Opt Route Optimization Button */}
      <button
        onClick={handleOptimize}
        disabled={isOptimizing}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition transform active:scale-95 border border-white/20 disabled:opacity-50"
      >
        {isOptimizing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : optimizedSuccess ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
        ) : (
          <Zap className="w-4 h-4 fill-white text-white" />
        )}
        <span>{isOptimizing ? "Optimizing 2-Opt..." : optimizedSuccess ? "Route Optimized!" : "Optimize 2-Opt Route"}</span>
      </button>

      {/* Export Dropdown Menu Button */}
      <div className="relative">
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 transition shadow-sm"
        >
          <FileText className="w-4 h-4 text-blue-400" />
          <span>Export Itinerary</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExportMenu ? "rotate-180" : ""}`} />
        </button>

        {showExportMenu && (
          <div className="absolute right-0 mt-2 w-52 bg-slate-900 rounded-2xl border border-white/15 shadow-2xl z-50 p-2 space-y-1">
            <a
              href={`/api/trips/${tripId}/export?format=ics`}
              download={`${tripTitle}-calendar.ics`}
              onClick={() => setShowExportMenu(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-blue-600/20 hover:text-white transition"
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Apple / Google Calendar (.ics)</span>
            </a>

            <a
              href={`/api/trips/${tripId}/export?format=txt`}
              download={`${tripTitle}-itinerary.txt`}
              onClick={() => setShowExportMenu(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-blue-600/20 hover:text-white transition"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Markdown / Text (.txt)</span>
            </a>

            <a
              href={`/api/trips/${tripId}/export?format=json`}
              download={`${tripTitle}-data.json`}
              onClick={() => setShowExportMenu(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-blue-600/20 hover:text-white transition"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Full Raw Data (.json)</span>
            </a>

            <button
              onClick={handlePrintPdf}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-blue-600/20 hover:text-white transition text-left"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
