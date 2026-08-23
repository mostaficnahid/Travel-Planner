"use client";

import { useState } from "react";
import { Users, ThumbsUp, ThumbsDown, DollarSign } from "lucide-react";

interface Props {
  travelerCount: number;
}

export function GroupCollaboration({ travelerCount }: Props) {
  const [votes, setVotes] = useState<Record<string, { up: number; down: number }>>({
    "Historic Plaza": { up: 4, down: 0 },
    "Local Food Market": { up: 5, down: 0 },
    "Sunset Viewpoint": { up: 3, down: 1 },
  });

  const handleVote = (venue: string, type: "up" | "down") => {
    setVotes((prev) => {
      const current = prev[venue] || { up: 0, down: 0 };
      return {
        ...prev,
        [venue]: {
          up: type === "up" ? current.up + 1 : current.up,
          down: type === "down" ? current.down + 1 : current.down,
        },
      };
    });
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-7 sm:p-8 border border-white/10 shadow-2xl space-y-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Group Companion Collaboration & Voting
          </h3>
          <p className="text-xs text-slate-400 mt-1">{travelerCount} Travelers synced to this trip</p>
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
          Live Voting Room
        </span>
      </div>

      {/* Activity Voting Cards */}
      <div className="space-y-3">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
          Group Itinerary Activity Votes
        </span>
        {Object.entries(votes).map(([venue, v]) => (
          <div key={venue} className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-white/10">
            <div>
              <h4 className="text-xs font-bold text-white">{venue}</h4>
              <span className="text-[10px] text-slate-400 font-medium">
                {v.up} upvotes • {v.down} downvotes
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleVote(venue, "up")}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 border border-emerald-500/30 transition"
              >
                <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>{v.up}</span>
              </button>
              <button
                onClick={() => handleVote(venue, "down")}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-bold hover:bg-rose-500/30 border border-rose-500/30 transition"
              >
                <ThumbsDown className="w-3.5 h-3.5 text-rose-400" />
                <span>{v.down}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Group Expense Splitter */}
      <div className="p-4.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 space-y-2">
        <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-indigo-400" />
          Equal Expense Split Summary
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed">
          With {travelerCount} travelers, all shared expenses (hotel, rental, dining) are automatically divided into <strong>1/{travelerCount} equal shares</strong>.
        </p>
      </div>
    </div>
  );
}
