"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  DollarSign,
  Heart,
  Sliders,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ChevronDown,
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

const INPUT_CLS =
  "w-full px-4 py-3.5 rounded-xl border font-medium text-sm transition-all duration-200 " +
  "bg-[var(--input-bg)] text-[var(--input-text)] border-[var(--input-border)] placeholder:text-[var(--muted)] " +
  "focus:outline-none focus:ring-2 focus:ring-[#1BA8B5] focus:border-[#1BA8B5]";

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
          <div className="absolute inset-0 rounded-full border-4 border-[#1BA8B5]/20 animate-ping opacity-75"></div>
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl"
            style={{
              background: "linear-gradient(135deg, #1BA8B5 0%, #1B2F5E 55%, #C8872A 100%)",
              boxShadow: "0 12px 36px -6px rgba(27,168,181,0.50)",
            }}
          >
            <Sparkles className="w-10 h-10 animate-spin" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>
            Crafting Expedition to {formData.destination}
          </h2>
          <p className="text-sm mt-2 font-medium" style={{ color: "var(--muted)" }}>
            Geocoding venues, calculating 2-Opt routes, checking live weather & fitting your budget...
          </p>
        </div>

        <div
          className="p-6 rounded-3xl border shadow-2xl space-y-4 text-left backdrop-blur-xl"
          style={{ background: "var(--card)", borderColor: "var(--card-border)" }}
        >
          {GENERATION_STEPS.map((stepText, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {idx < generationStepIdx ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : idx === generationStepIdx ? (
                <Loader2 className="w-5 h-5 animate-spin shrink-0" style={{ color: "#1BA8B5" }} />
              ) : (
                <div
                  className="w-5 h-5 rounded-full border-2 shrink-0"
                  style={{ borderColor: "var(--card-border)" }}
                />
              )}
              <span
                className="text-sm font-medium transition-colors"
                style={{
                  color:
                    idx === generationStepIdx
                      ? "#1BA8B5"
                      : idx < generationStepIdx
                      ? "var(--foreground)"
                      : "var(--muted)",
                  fontWeight: idx === generationStepIdx ? 700 : 500,
                }}
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
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black transition border"
              style={{
                background:
                  step >= s.num
                    ? "linear-gradient(135deg, #1BA8B5 0%, #1B2F5E 60%, #C8872A 100%)"
                    : "var(--card)",
                color: step >= s.num ? "#ffffff" : "var(--muted)",
                borderColor: step >= s.num ? "rgba(27,168,181,0.4)" : "var(--card-border)",
                boxShadow: step >= s.num ? "0 4px 16px -2px rgba(27,168,181,0.40)" : "none",
              }}
            >
              {s.num}
            </div>
            <span
              className="hidden sm:inline text-xs font-black tracking-wide"
              style={{ color: step >= s.num ? "var(--foreground)" : "var(--muted)" }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Step Form Container */}
      <div
        className="backdrop-blur-2xl rounded-3xl p-8 sm:p-12 border shadow-2xl space-y-8"
        style={{
          background: "var(--card)",
          borderColor: "var(--card-border)",
          boxShadow: "0 24px 64px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(27,168,181,0.08) inset",
        }}
      >
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
                <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5" style={{ color: "var(--foreground)" }}>
                  <MapPin className="w-5 h-5 shrink-0" style={{ color: "#1BA8B5" }} />
                  Select or Write Destination (Any of 196 Countries)
                </h2>
                <p className="text-sm mt-1.5 font-medium" style={{ color: "var(--muted)" }}>
                  Type any destination or click the dropdown arrow to pick from popular global cities.
                </p>
              </div>

              <div className="space-y-4">
                {/* Searchable Combobox Dropdown Input */}
                <div className="relative">
                  <label className="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
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
                      className={INPUT_CLS + " pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="absolute right-3.5 p-1 transition-colors"
                      style={{ color: "var(--muted)" }}
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                  </div>

                  {/* Dropdown Options Drawer */}
                  {isDropdownOpen && (
                    <div
                      className="absolute z-30 left-0 right-0 mt-2 rounded-2xl border shadow-2xl max-h-60 overflow-y-auto backdrop-blur-2xl"
                      style={{
                        background: "var(--card)",
                        borderColor: "var(--card-border)",
                        boxShadow: "0 16px 40px -8px rgba(0,0,0,0.30)",
                      }}
                    >
                      {filteredDestinations.length > 0 ? (
                        filteredDestinations.map((d) => (
                          <div
                            key={`${d.city}-${d.country}`}
                            onClick={() => {
                              updateField("destination", `${d.city}, ${d.country}`);
                              setIsDropdownOpen(false);
                            }}
                            className="px-4 py-3.5 cursor-pointer flex items-center justify-between text-xs font-medium transition border-b last:border-b-0 hover:bg-[rgba(27,168,181,0.12)]"
                            style={{ borderColor: "var(--card-border)" }}
                          >
                            <span className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
                              {d.city}
                            </span>
                            <span
                              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                              style={{
                                background: "rgba(27,168,181,0.12)",
                                color: "#1BA8B5",
                                border: "1px solid rgba(27,168,181,0.25)",
                              }}
                            >
                              {d.country}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-xs text-center font-medium" style={{ color: "var(--muted)" }}>
                          Custom Destination: <strong style={{ color: "var(--foreground)" }}>&quot;{formData.destination}&quot;</strong> (Will be geocoded automatically)
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => updateField("startDate", e.target.value)}
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => updateField("endDate", e.target.value)}
                      className={INPUT_CLS}
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
                <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5" style={{ color: "var(--foreground)" }}>
                  <DollarSign className="w-5 h-5 shrink-0" style={{ color: "#10b981" }} />
                  Budget & Currency
                </h2>
                <p className="text-sm mt-1.5 font-medium" style={{ color: "var(--muted)" }}>
                  Select from 196 world currencies with live conversion intelligence.
                </p>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
                      Total Budget
                    </label>
                    <input
                      type="number"
                      step={50}
                      value={formData.budget}
                      onChange={(e) => updateField("budget", parseFloat(e.target.value) || 0)}
                      className={INPUT_CLS + " font-black text-lg"}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
                      Currency Code
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => updateField("currency", e.target.value)}
                      className={INPUT_CLS}
                    >
                      {WORLD_CURRENCIES.map((c) => (
                        <option
                          key={c.code}
                          value={c.code}
                          style={{ background: "var(--card)", color: "var(--foreground)" }}
                        >
                          {c.code} - {c.name} ({c.symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
                    Number of Travelers
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formData.travelerCount}
                    onChange={(e) => updateField("travelerCount", parseInt(e.target.value) || 1)}
                    className={INPUT_CLS + " w-36 font-black text-lg"}
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
                <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5" style={{ color: "var(--foreground)" }}>
                  <Heart className="w-5 h-5 shrink-0" style={{ color: "#E87B2A" }} />
                  Travel Style & Interests
                </h2>
                <p className="text-sm mt-1.5 font-medium" style={{ color: "var(--muted)" }}>
                  Select your travel persona and customize activities.
                </p>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>
                  Travel Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                  ].map((style) => {
                    const isSelected = formData.travelStyle === style;
                    return (
                      <button
                        key={style}
                        type="button"
                        onClick={() => updateField("travelStyle", style)}
                        className="px-4 py-3 rounded-2xl text-xs font-bold capitalize transition-all border transform hover:scale-[1.02] active:scale-95"
                        style={{
                          background: isSelected
                            ? "linear-gradient(135deg, #1BA8B5 0%, #1B2F5E 100%)"
                            : "var(--card)",
                          color: isSelected ? "#ffffff" : "var(--foreground)",
                          borderColor: isSelected ? "#1BA8B5" : "var(--card-border)",
                          boxShadow: isSelected ? "0 4px 16px -2px rgba(27,168,181,0.45)" : "none",
                        }}
                      >
                        {style.replace("-", " ")}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-black uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>
                  Interests & Venues
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {INTEREST_OPTIONS.map((interest) => {
                    const isSelected = formData.interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all border transform hover:scale-105"
                        style={{
                          background: isSelected ? "rgba(27,168,181,0.15)" : "var(--card)",
                          color: isSelected ? "#1BA8B5" : "var(--foreground)",
                          borderColor: isSelected ? "#1BA8B5" : "var(--card-border)",
                        }}
                      >
                        {interest}
                      </button>
                    );
                  })}
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
                <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5" style={{ color: "var(--foreground)" }}>
                  <Sliders className="w-5 h-5 shrink-0" style={{ color: "#C8872A" }} />
                  Personal Constraints & Pacing
                </h2>
                <p className="text-sm mt-1.5 font-medium" style={{ color: "var(--muted)" }}>
                  Fine-tune daily intensity and transport preferences.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                      Max Daily Walking Target
                    </label>
                    <span className="text-sm font-black" style={{ color: "#1BA8B5" }}>
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
                    className="w-full accent-[#1BA8B5] cursor-pointer"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buttons */}
        <div
          className="flex justify-between items-center pt-6 border-t"
          style={{ borderColor: "var(--card-border)" }}
        >
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border text-sm font-bold transition hover:scale-105"
              style={{
                background: "var(--card)",
                borderColor: "var(--card-border)",
                color: "var(--foreground)",
              }}
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
              className="flex items-center gap-1.5 px-7 py-3 rounded-xl text-sm font-black shadow-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 border border-white/20"
              style={{
                background: "linear-gradient(135deg, #1BA8B5 0%, #1B2F5E 100%)",
                boxShadow: "0 6px 20px -4px rgba(27,168,181,0.50)",
                color: "#ffffff",
              }}
            >
              <span style={{ color: "#ffffff" }}>Continue</span>
              <ArrowRight className="w-4 h-4" style={{ color: "#ffffff" }} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGenerate}
              className="flex items-center gap-2 px-9 py-3.5 rounded-xl text-sm font-black shadow-xl transition transform hover:scale-105 active:scale-95 border border-white/20"
              style={{
                background: "linear-gradient(135deg, #1BA8B5 0%, #1B2F5E 55%, #C8872A 100%)",
                boxShadow: "0 8px 28px -6px rgba(27,168,181,0.50)",
                color: "#ffffff",
              }}
            >
              <Sparkles className="w-5 h-5" style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff" }}>Generate Trip Plan</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
