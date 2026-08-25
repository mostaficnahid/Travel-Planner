"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import {
  User as UserIcon,
  Mail,
  Shield,
  DollarSign,
  Compass,
  Globe,
  Calendar,
  Lock,
  Save,
  CheckCircle2,
  XCircle,
  Sparkles,
  MapPin,
  Heart,
  Sliders,
} from "lucide-react";
import { WORLD_CURRENCIES } from "@/lib/services/currency";

const INPUT_CLS =
  "w-full px-4 py-3 rounded-xl border font-medium text-sm transition-all duration-200 " +
  "bg-[var(--input-bg)] text-[var(--input-text)] border-[var(--input-border)] placeholder:text-[var(--muted)] " +
  "focus:outline-none focus:ring-2 focus:ring-[#1BA8B5] focus:border-[#1BA8B5]";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  hasPassword: boolean;
  profile: {
    homeCurrency: string;
    passportCountry?: string;
    bio?: string;
  };
  preferences: {
    preferredTravelStyle: string;
    maxDailyWalkingKm: number;
    transportPreference: string;
  };
  stats: {
    totalTrips: number;
    totalDays: number;
    uniqueCountries: number;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading, login } = useAuth();

  const [activeTab, setActiveTab] = useState<"general" | "preferences" | "security">("general");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [homeCurrency, setHomeCurrency] = useState("USD");
  const [passportCountry, setPassportCountry] = useState("");
  const [travelStyle, setTravelStyle] = useState("balanced");
  const [maxWalkingKm, setMaxWalkingKm] = useState(8);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login?redirect=/profile");
    }
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/user/profile");
        const data = await res.json();
        if (data.success && data.data) {
          setProfile(data.data);
          setName(data.data.name || "");
          setBio(data.data.profile?.bio || "");
          setHomeCurrency(data.data.profile?.homeCurrency || "USD");
          setPassportCountry(data.data.profile?.passportCountry || "");
          setTravelStyle(data.data.preferences?.preferredTravelStyle || "balanced");
          setMaxWalkingKm(data.data.preferences?.maxDailyWalkingKm || 8);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (isLoggedIn) {
      loadProfile();
    }
  }, [isLoggedIn]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsSaving(true);

    if (activeTab === "security") {
      if (newPassword && newPassword !== confirmPassword) {
        setMessage({ type: "error", text: "New passwords do not match." });
        setIsSaving(false);
        return;
      }
      if (newPassword && newPassword.length < 8) {
        setMessage({ type: "error", text: "Password must be at least 8 characters long." });
        setIsSaving(false);
        return;
      }
    }

    try {
      const payload: Record<string, unknown> = {
        name,
        bio,
        homeCurrency,
        passportCountry,
        preferredTravelStyle: travelStyle,
        maxDailyWalkingKm: maxWalkingKm,
      };

      if (activeTab === "security" && newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ type: "error", text: data.error || "Failed to update profile." });
      } else {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        login(data.data.email, data.data.name);
        if (activeTab === "security") {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#1BA8B5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* ── Profile Header Banner ─────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 sm:p-10 border backdrop-blur-2xl"
        style={{
          background: "linear-gradient(135deg, var(--card) 0%, rgba(27,168,181,0.08) 50%, var(--card) 100%)",
          borderColor: "rgba(27,168,181,0.25)",
          boxShadow: "0 20px 60px -12px rgba(0,0,0,0.25)",
        }}
      >
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-20 h-20 rounded-3xl object-cover border-2 shadow-xl"
                style={{ borderColor: "#1BA8B5", boxShadow: "0 0 24px -4px rgba(27,168,181,0.50)" }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-black text-white shadow-xl"
                style={{
                  background: "linear-gradient(135deg, #1BA8B5 0%, #1B2F5E 55%, #C8872A 100%)",
                  boxShadow: "0 0 24px -4px rgba(27,168,181,0.50)",
                }}
              >
                {name?.charAt(0)?.toUpperCase() || "T"}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>
                  {name || "Traveler"}
                </h1>
                <span
                  className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                  style={{ background: "rgba(27,168,181,0.12)", color: "#1BA8B5", border: "1px solid rgba(27,168,181,0.25)" }}
                >
                  Global Explorer
                </span>
              </div>
              <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
                <Mail className="w-3.5 h-3.5" style={{ color: "#1BA8B5" }} />
                {profile?.email}
              </p>
              {profile?.createdAt && (
                <p className="text-[11px] font-medium" style={{ color: "var(--muted-foreground)" }}>
                  Member since {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </p>
              )}
            </div>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Trips", value: profile?.stats?.totalTrips ?? 0, icon: <Compass className="w-4 h-4" style={{ color: "#1BA8B5" }} /> },
              { label: "Days", value: profile?.stats?.totalDays ?? 0, icon: <Calendar className="w-4 h-4" style={{ color: "#C8872A" }} /> },
              { label: "Countries", value: profile?.stats?.uniqueCountries ?? 0, icon: <Globe className="w-4 h-4" style={{ color: "#10b981" }} /> },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center justify-center p-3 sm:px-4 rounded-2xl border text-center"
                style={{ background: "rgba(27,168,181,0.06)", borderColor: "rgba(27,168,181,0.18)" }}
              >
                {s.icon}
                <span className="text-base sm:text-lg font-black mt-0.5" style={{ color: "var(--foreground)" }}>
                  {s.value}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Status Message Alert ──────────────────────────────────── */}
      {message && (
        <div
          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold"
          style={{
            background: message.type === "success" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
            border: `1px solid ${message.type === "success" ? "rgba(16,185,129,0.30)" : "rgba(239,68,68,0.30)"}`,
            color: message.type === "success" ? "#10b981" : "#f87171",
          }}
        >
          {message.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ── Main Profile Settings Card ────────────────────────────── */}
      <div
        className="rounded-3xl border shadow-xl backdrop-blur-2xl overflow-hidden"
        style={{ background: "var(--card)", borderColor: "var(--card-border)" }}
      >
        {/* Navigation Tabs */}
        <div className="flex border-b overflow-x-auto" style={{ borderColor: "var(--card-border)" }}>
          {[
            { id: "general", label: "General Information", icon: <UserIcon className="w-4 h-4" /> },
            { id: "preferences", label: "Travel Preferences", icon: <Heart className="w-4 h-4" /> },
            { id: "security", label: "Security & Password", icon: <Shield className="w-4 h-4" /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className="flex items-center gap-2 px-6 py-4 text-xs font-black tracking-wide transition-all border-b-2 whitespace-nowrap"
                style={{
                  borderColor: isActive ? "#1BA8B5" : "transparent",
                  color: isActive ? "#1BA8B5" : "var(--muted)",
                  background: isActive ? "rgba(27,168,181,0.06)" : "transparent",
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSaveProfile} className="p-6 sm:p-10 space-y-6">
          {/* TAB 1: General Info */}
          {activeTab === "general" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Full Name"
                    className={INPUT_CLS}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={profile?.email || ""}
                    className={INPUT_CLS + " opacity-70 cursor-not-allowed"}
                  />
                  <span className="text-[10px] font-semibold" style={{ color: "var(--muted-foreground)" }}>
                    Email is associated with your account and cannot be modified.
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                  Passport / Origin Country
                </label>
                <input
                  type="text"
                  value={passportCountry}
                  onChange={(e) => setPassportCountry(e.target.value)}
                  placeholder="e.g. Bangladesh, United States, United Kingdom"
                  className={INPUT_CLS}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                  Bio & Travel Notes
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a little about your travel passions..."
                  className={INPUT_CLS + " resize-none"}
                />
              </div>
            </div>
          )}

          {/* TAB 2: Travel Preferences */}
          {activeTab === "preferences" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                    Default Home Currency
                  </label>
                  <select
                    value={homeCurrency}
                    onChange={(e) => setHomeCurrency(e.target.value)}
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

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                      Max Walking Target (km/day)
                    </label>
                    <span className="text-sm font-black" style={{ color: "#1BA8B5" }}>
                      {maxWalkingKm} km / day
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={18}
                    step={1}
                    value={maxWalkingKm}
                    onChange={(e) => setMaxWalkingKm(parseInt(e.target.value))}
                    className="w-full accent-[#1BA8B5] cursor-pointer mt-3"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                  Default Travel Style
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
                  ].map((style) => {
                    const isSelected = travelStyle === style;
                    return (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setTravelStyle(style)}
                        className="px-3.5 py-2.5 rounded-xl text-xs font-bold capitalize transition-all border text-left"
                        style={{
                          background: isSelected
                            ? "linear-gradient(135deg, #1BA8B5 0%, #1B2F5E 100%)"
                            : "var(--card)",
                          color: isSelected ? "#ffffff" : "var(--foreground)",
                          borderColor: isSelected ? "#1BA8B5" : "var(--card-border)",
                          boxShadow: isSelected ? "0 4px 14px -2px rgba(27,168,181,0.40)" : "none",
                        }}
                      >
                        {style.replace("-", " ")}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Security & Password */}
          {activeTab === "security" && (
            <div className="space-y-5 max-w-lg">
              {profile?.hasPassword ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className={INPUT_CLS}
                  />
                </div>
              ) : (
                <div
                  className="p-4 rounded-2xl text-xs font-medium flex items-center gap-2.5"
                  style={{ background: "rgba(27,168,181,0.10)", color: "#1BA8B5", border: "1px solid rgba(27,168,181,0.25)" }}
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  <span>You signed up via OAuth (Google / Facebook). You can set a password below to also enable email login.</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className={INPUT_CLS}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className={INPUT_CLS}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-6 border-t flex justify-end" style={{ borderColor: "var(--card-border)" }}>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-sm text-white
                         transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 border border-white/20 shadow-xl"
              style={{
                background: "linear-gradient(135deg, #1BA8B5 0%, #1B2F5E 55%, #C8872A 100%)",
                boxShadow: "0 8px 24px -4px rgba(27,168,181,0.50)",
                color: "#ffffff",
              }}
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" style={{ color: "#ffffff" }} />
              )}
              <span style={{ color: "#ffffff" }}>{isSaving ? "Saving Changes..." : "Save Settings"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
