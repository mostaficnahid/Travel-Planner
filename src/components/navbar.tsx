/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Bell, Globe, LogIn, LogOut, Moon, Plus, Sun, X, User, Compass, ChevronDown } from "lucide-react";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { useAuth } from "@/lib/context/AuthContext";
import { useTheme } from "@/lib/context/ThemeContext";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function Navbar() {
  const router = useRouter();
  const { selectedCurrency, setSelectedCurrency, allCurrencies } = useCurrency();
  const { user, isLoggedIn, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const isDark = theme === "dark";

  // Poll notifications every 60 s
  useEffect(() => {
    if (!isLoggedIn) return;
    async function fetchNotifs() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) { setNotifications(data.data); setUnreadCount(data.unreadCount); }
      } catch { /* ignore */ }
    }
    fetchNotifs();
    const iv = setInterval(fetchNotifs, 60_000);
    return () => clearInterval(iv);
  }, [isLoggedIn]);

  // Close on outside click
  useEffect(() => {
    function h(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);


  const handleOpenNotifs = async () => {
    setNotifOpen((o) => !o);
    if (!notifOpen && unreadCount > 0) {
      try {
        await fetch("/api/notifications", { method: "PATCH" });
        setUnreadCount(0);
        setNotifications((p) => p.map((n) => ({ ...n, isRead: true })));
      } catch { /* ignore */ }
    }
  };

  const handleNewTripClick = (e: React.MouseEvent) => {
    if (!isLoggedIn) { e.preventDefault(); router.push("/login?redirect=/trips/new"); }
  };

  /* ── Theme-aware token helpers ────────────────────────────────── */
  const pillBg     = isDark ? "rgba(14,25,41,0.90)"           : "rgba(255,255,255,0.95)";
  const pillBorder = isDark ? "rgba(27,168,181,0.22)"         : "rgba(27,168,181,0.35)";
  const pillText   = isDark ? "#E0EAF4"                       : "#0D1E38";
  const dropdownBg = isDark ? "rgba(7,13,26,0.98)"            : "rgba(255,255,255,0.98)";
  const dropBorder = isDark ? "rgba(27,168,181,0.20)"         : "rgba(27,168,181,0.30)";

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background:   isDark ? "rgba(7,13,26,0.92)"         : "rgba(240,246,250,0.95)",
        backdropFilter: "blur(24px)",
        borderColor:  isDark ? "rgba(27,168,181,0.18)"      : "rgba(27,168,181,0.28)",
        boxShadow:    isDark ? "0 1px 32px rgba(0,0,0,0.5)" : "0 1px 16px rgba(27,47,94,0.10)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-4">

        {/* ── Logo ──────────────────────────────────────────────── */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div
            className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden
                        group-hover:scale-105 transition-transform duration-300"
            style={{ boxShadow: "0 0 24px -4px rgba(27,168,181,0.55)" }}
          >
            <Image src="/logo.png" alt="Travel Planner Logo" fill className="object-cover" priority />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-base font-black tracking-tight" style={{ color: "var(--foreground)" }}>
              Travel
              <span className="ml-1.5"
                style={{ background: "linear-gradient(90deg,#1BA8B5,#C8872A)",
                         WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Planner
              </span>
            </span>
            <span className="text-[9px] font-semibold tracking-[0.18em] uppercase mt-0.5"
              style={{ color: "#1BA8B5", opacity: 0.90 }}>
              Discover. Create. Journey.
            </span>
          </div>
        </Link>

        {/* ── Nav links ─────────────────────────────────────────── */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold"
          style={{ color: "var(--muted)" }}>
          {[
            { href: "/",              label: "Explore" },
            { href: "/trips",         label: "My Expeditions" },
            { href: "/#destinations", label: "196 Countries", cls: "hidden lg:inline" },
          ].map((l) => (
            <Link key={l.href} href={l.href}
              className={`hover:text-[#1BA8B5] transition-colors duration-200 ${l.cls ?? ""}`}>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* ── Right cluster ─────────────────────────────────────── */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">

          {/* Currency selector */}
          <div
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border"
            style={{ background: pillBg, borderColor: pillBorder, color: pillText }}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" style={{ color: "#1BA8B5" }} />
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              aria-label="Select currency"
              className="bg-transparent focus:outline-none cursor-pointer text-xs font-bold max-w-[110px] truncate"
              style={{ color: pillText }}
            >
              {allCurrencies.map((c) => (
                <option key={c.code} value={c.code}
                  className="bg-slate-900 text-white py-1"
                  style={{ background: isDark ? "#0E1929" : "#fff", color: isDark ? "#fff" : "#0D1E38" }}>
                  {c.code} ({c.symbol}) — {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Theme toggle */}
          <button
            id="theme-toggle"
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle colour theme"
            className="p-2.5 rounded-xl border transition-all duration-300"
            style={{
              background:  isDark ? "rgba(27,168,181,0.12)" : "rgba(27,47,94,0.08)",
              borderColor: isDark ? "rgba(27,168,181,0.30)" : "rgba(27,47,94,0.25)",
            }}
          >
            <span className="block transition-transform duration-500"
              style={{ transform: isDark ? "rotate(0deg)" : "rotate(180deg)" }}>
              {isDark
                ? <Sun  className="w-4 h-4" style={{ color: "#C8872A" }} />
                : <Moon className="w-4 h-4" style={{ color: "#1B2F5E" }} />}
            </span>
          </button>

          {/* ── Auth section ──────────────────────────────────────── */}
          {isLoggedIn && user ? (
            <div className="flex items-center gap-2">

              {/* Notification bell */}
              <div className="relative" ref={notifRef}>
                <button
                  id="notifications-bell"
                  onClick={handleOpenNotifs}
                  title="Notifications"
                  className="relative p-2 rounded-xl border border-transparent
                             hover:border-[rgba(27,168,181,0.28)] hover:bg-[rgba(27,168,181,0.08)] transition-all"
                  style={{ color: "var(--muted)" }}
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black
                                     text-white flex items-center justify-center animate-pulse"
                      style={{ background: "#E87B2A", boxShadow: "0 0 10px rgba(232,123,42,0.6)" }}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification dropdown */}
                {notifOpen && (
                  <div className="absolute right-0 top-12 w-80 rounded-2xl border overflow-hidden z-50 shadow-2xl"
                    style={{ background: dropdownBg, backdropFilter: "blur(20px)", borderColor: dropBorder }}>
                    <div className="flex items-center justify-between px-4 py-3 border-b"
                      style={{ borderColor: dropBorder }}>
                      <span className="text-xs font-bold" style={{ color: "var(--foreground)" }}>Notifications</span>
                      <button onClick={() => setNotifOpen(false)}
                        className="hover:text-[#1BA8B5] transition" style={{ color: "var(--muted)" }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs" style={{ color: "var(--muted)" }}>
                          No notifications yet
                        </div>
                      ) : notifications.map((n) => (
                        <div key={n.id}
                          className={`px-4 py-3 border-b last:border-0 ${n.isRead ? "opacity-60" : ""}`}
                          style={{ borderColor: "rgba(27,168,181,0.10)",
                                   background: n.isRead ? undefined : "rgba(27,168,181,0.05)" }}>
                          <p className="text-xs font-bold" style={{ color: "var(--foreground)" }}>{n.title}</p>
                          <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "var(--muted)" }}>{n.message}</p>
                          <p className="text-[10px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                            {new Date(n.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar + Profile Dropdown Menu */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all hover:scale-105"
                  style={{ background: pillBg, borderColor: pillBorder, color: pillText }}
                >
                  {user.image ? (
                    <img src={user.image} alt={user.name}
                      className="w-6 h-6 rounded-full object-cover border" style={{ borderColor: "#1BA8B5" }} />
                  ) : (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-black"
                      style={{ background: "linear-gradient(135deg,#1BA8B5,#1B2F5E)" }}>
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <span className="max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${profileOpen ? "rotate-180" : ""}`} style={{ color: "var(--muted)" }} />
                </button>

                {profileOpen && (
                  <div
                    className="absolute right-0 top-12 w-56 rounded-2xl border overflow-hidden z-50 shadow-2xl p-2 space-y-1"
                    style={{ background: dropdownBg, backdropFilter: "blur(20px)", borderColor: dropBorder }}
                  >
                    <div className="px-3 py-2 border-b" style={{ borderColor: "rgba(27,168,181,0.15)" }}>
                      <p className="text-xs font-bold truncate" style={{ color: "var(--foreground)" }}>{user.name}</p>
                      <p className="text-[10px] truncate" style={{ color: "var(--muted)" }}>{user.email}</p>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition hover:bg-[rgba(27,168,181,0.10)]"
                      style={{ color: "var(--foreground)" }}
                    >
                      <User className="w-3.5 h-3.5" style={{ color: "#1BA8B5" }} />
                      <span>My Profile & Settings</span>
                    </Link>

                    <Link
                      href="/trips"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition hover:bg-[rgba(27,168,181,0.10)]"
                      style={{ color: "var(--foreground)" }}
                    >
                      <Compass className="w-3.5 h-3.5" style={{ color: "#C8872A" }} />
                      <span>My Expeditions</span>
                    </Link>

                    <Link
                      href="/trips/new"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition hover:bg-[rgba(27,168,181,0.10)]"
                      style={{ color: "var(--foreground)" }}
                    >
                      <Plus className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
                      <span>New Trip</span>
                    </Link>

                    <div className="pt-1 border-t" style={{ borderColor: "rgba(27,168,181,0.15)" }}>
                      <button
                        onClick={() => { setProfileOpen(false); logout(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (

            <Link href="/login"
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border
                         border-transparent hover:border-[rgba(27,168,181,0.28)] hover:bg-[rgba(27,168,181,0.08)] transition-all"
              style={{ color: "var(--muted)" }}
            >
              <LogIn className="w-4 h-4" style={{ color: "#1BA8B5" }} />
              <span className="hidden sm:inline">Login</span>
            </Link>
          )}

          {/* New Trip CTA */}
          <Link
            href="/trips/new"
            onClick={handleNewTripClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black text-white
                       transition-all transform active:scale-95 border border-white/20 shadow-lg"
            style={{
              background:  "linear-gradient(135deg, #1BA8B5 0%, #1B2F5E 55%, #C8872A 100%)",
              boxShadow:   "0 4px 24px -4px rgba(27,168,181,0.50)",
              color:       "#ffffff",
            }}
          >
            <Plus className="w-4 h-4" />
            <span>New Trip</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
