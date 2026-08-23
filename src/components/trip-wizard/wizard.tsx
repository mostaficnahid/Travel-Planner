"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Compass,
  Heart,
  Sliders,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ChevronDown,
  Globe,
} from "lucide-react";
import { WORLD_CURRENCIES } from "@/lib/services/currency";
import { useAuth } from "@/lib/context/AuthContext";

const POPULAR_DESTINATIONS = [
  { city: "Paris", country: "France" },
  { city: "Tokyo", country: "Japan" },
  { city: "London", country: "United Kingdom" },
  { city: "New York", country: "United States" },
  { city: "Dhaka", country: "Bangladesh" },
  { city: "Rome", country: "Italy" },
  { city: "Sydney", country: "Australia" },
  { city: "Rio de Janeiro", country: "Brazil" },
  { city: "Cairo", country: "Egypt" },
  { city: "Dubai", country: "UAE" },
  { city: "Bangkok", country: "Thailand" },
  { city: "Barcelona", country: "Spain" },
  { city: "Singapore", country: "Singapore" },
  { city: "Amsterdam", country: "Netherlands" },
  { city: "Berlin", country: "Germany" },
  { city: "Toronto", country: "Canada" },
  { city: "Istanbul", country: "Turkey" },
  { city: "Bali", country: "Indonesia" },
  { city: "Kyoto", country: "Japan" },
  { city: "Seoul", country: "South Korea" },
  { city: "Madrid", country: "Spain" },
  { city: "Vienna", country: "Austria" },
  { city: "Prague", country: "Czech Republic" },
  { city: "Venice", country: "Italy" },
];

const INTEREST_OPTIONS = [
  "Historical Landmarks",
  "Local Food & Fine Dining",
  "Museums & Galleries",
  "Nature & Hiking",
  "Shopping & Boutiques",
  "Nightlife & Clubs",
  "Architecture",
  "Beach & Water Sports",
  "Photography Spots",
  "Coffee Shops & Cafes",
  "Hidden Gems & Secret Spots",
  "Relaxation & Spas",
];

const GENERATION_STEPS = [
  "Geocoding destination latitude & longitude across global matrix...",
  "Researching authentic attractions & local geography...",
  "Fetching recommended hotels & dining spots...",
  "Retrieving live weather forecasts...",
  "Calculating transit matrix & walking routes...",
  "Running 2-Opt TSP route optimizer...",
  "Validating budget & schedule constraints...",
  "Finalizing personalized 196-country trip itinerary...",
];

export function TripWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedDest = searchParams.get("destination") || "";
  const { isLoggedIn, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStepIdx, setGenerationStepIdx] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    destination: preselectedDest || "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split("T")[0],
    travelerCount: 2,
    budget: 1500,
    currency: "USD",
    budgetFlexibility: "balanced",
    travelStyle: "balanced",
    interests: ["Historical Landmarks", "Local Food & Fine Dining", "Museums & Galleries"],
    constraints: {
      maxDailyWalkingKm: 8,
      transportPreference: "public",
      dayStartTime: "09:00",
      dayEndTime: "21:00",
    },
  });

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (preselectedDest) {
      setFormData((prev) => ({ ...prev, destination: preselectedDest }));
    }
  }, [preselectedDest]);

  const updateField = (field: string, value: string | number | boolean | string[] | Record<string, unknown>) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => {
      const exists = prev.interests.includes(interest);
      const updated = exists
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: updated };
    });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);

    for (let i = 0; i < GENERATION_STEPS.length; i++) {
      setGenerationStepIdx(i);
      await new Promise((res) => setTimeout(res, 450));
    }

    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success && data.data?.id) {
        router.push(`/trips/${data.data.id}`);
      } else {
        alert(data.error || "Failed to generate trip");
        setIsGenerating(false);
      }
    } catch (e) {
      console.error(e);
      alert("Error building trip. Please try again.");
      setIsGenerating(false);
    }
  };

  const filteredDestinations = POPULAR_DESTINATIONS.filter((d) =>
    `${d.city} ${d.country}`.toLowerCase().includes(formData.destination.toLowerCase())
  );

  if (isGenerating) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-8">
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-ping opacity-75"></div>
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/40">
            <Sparkles className="w-10 h-10 animate-spin" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white">Crafting Expedition to {formData.destination}</h2>
          <p className="text-sm text-slate-400 mt-2">
            Geocoding venues, calculating 2-Opt routes, checking live weather & fitting your budget...
          </p>
        </div>

        <div className="bg-slate-900/90 p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4 text-left backdrop-blur-xl">
          {GENERATION_STEPS.map((stepText, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {idx < generationStepIdx ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : idx === generationStepIdx ? (
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-slate-700 shrink-0" />
              )}
              <span
                className={`text-sm font-medium ${
                  idx === generationStepIdx
                    ? "text-blue-400 font-bold"
                    : idx < generationStepIdx
                    ? "text-slate-200"
                    : "text-slate-500"
                }`}
              >
                {stepText}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 sm:py-16 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Step Indicators */}
      <div className="flex items-center justify-between mb-10 sm:mb-12">
        {[
          { num: 1, label: "Destination & Dates" },
          { num: 2, label: "Budget & Travelers" },
          { num: 3, label: "Style & Interests" },
          { num: 4, label: "Constraints" },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black transition ${
                step >= s.num
                  ? "bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 text-white shadow-lg shadow-blue-500/30 border border-white/20"
                  : "bg-slate-900 text-slate-500 border border-white/10"
              }`}
            >
              {s.num}
            </div>
            <span className="hidden sm:inline text-xs font-extrabold text-slate-300">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Step Form Content */}
      <div className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-8 sm:p-12 border border-white/10 shadow-2xl space-y-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  Select or Write Destination (Any of 196 Countries)
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Type any destination or click the dropdown arrow to pick from popular global cities.
                </p>
              </div>

              <div className="space-y-4">
                {/* Searchable Combobox Dropdown Input */}
                <div className="relative">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Destination City / Country
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={formData.destination}
                      onFocus={() => setIsDropdownOpen(true)}
                      onChange={(e) => {
                        updateField("destination", e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      placeholder="Select from dropdown or type any city/country..."
                      className="w-full pl-4 pr-10 py-3.5 rounded-xl border border-white/10 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="absolute right-3.5 text-slate-400 hover:text-white p-1"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                  </div>

                  {/* Dropdown Options Drawer */}
                  {isDropdownOpen && (
                    <div className="absolute z-30 left-0 right-0 mt-2 bg-slate-900 rounded-2xl border border-white/15 shadow-2xl max-h-60 overflow-y-auto divide-y divide-white/5">
                      {filteredDestinations.length > 0 ? (
                        filteredDestinations.map((d) => (
                          <div
                            key={`${d.city}-${d.country}`}
                            onClick={() => {
                              updateField("destination", `${d.city}, ${d.country}`);
                              setIsDropdownOpen(false);
                            }}
                            className="px-4 py-3 hover:bg-blue-600/20 cursor-pointer flex items-center justify-between text-xs font-medium text-slate-200 transition"
                          >
                            <span className="font-bold text-white">{d.city}</span>
                            <span className="text-slate-400 font-normal">{d.country}</span>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-xs text-slate-400 text-center font-medium">
                          Custom Destination: <strong>&quot;{formData.destination}&quot;</strong> (Will be geocoded automatically)
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => updateField("startDate", e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-white/10 bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => updateField("endDate", e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-white/10 bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                  Budget & Currency
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Select from 196 world currencies with live conversion intelligence.
                </p>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Total Budget
                    </label>
                    <input
                      type="number"
                      step={50}
                      value={formData.budget}
                      onChange={(e) => updateField("budget", parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3.5 rounded-xl border border-white/10 bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Currency Code
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => updateField("currency", e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-white/10 bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                    >
                      {WORLD_CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                          {c.code} - {c.name} ({c.symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Number of Travelers
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formData.travelerCount}
                    onChange={(e) => updateField("travelerCount", parseInt(e.target.value) || 1)}
                    className="w-32 px-4 py-3.5 rounded-xl border border-white/10 bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-blue-400" />
                  Travel Style & Interests
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Select your travel persona and preferences.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Travel Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    "budget",
                    "balanced",
                    "luxury",
                    "backpacker",
                    "family",
                    "romantic",
                    "adventure",
                    "cultural",
                    "food-focused",
                  ].map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => updateField("travelStyle", style)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold capitalize transition border ${
                        formData.travelStyle === style
                          ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/30"
                          : "bg-slate-950 text-slate-300 border-white/10 hover:bg-slate-800"
                      }`}
                    >
                      {style.replace("-", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-blue-400" />
                  Personal Constraints & Pacing
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Fine-tune daily intensity and transport preferences.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Max Daily Walking Target
                    </label>
                    <span className="text-sm font-bold text-blue-400">
                      {formData.constraints.maxDailyWalkingKm} km / day
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={18}
                    step={1}
                    value={formData.constraints.maxDailyWalkingKm}
                    onChange={(e) =>
                      updateField("constraints", {
                        ...formData.constraints,
                        maxDailyWalkingKm: parseInt(e.target.value),
                      })
                    }
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-white/10">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              disabled={!formData.destination}
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-1.5 px-7 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-blue-600/30 disabled:opacity-50 transition border border-white/20"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGenerate}
              className="flex items-center gap-2 px-9 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-black shadow-xl shadow-blue-600/30 transition transform active:scale-95 border border-white/20"
            >
              <Sparkles className="w-5 h-5" /> Generate Trip Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
