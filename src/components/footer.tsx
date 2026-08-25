import Link from "next/link";
import Image from "next/image";
import { Globe, ShieldCheck, Sparkles, MapPin, Cpu, ArrowRight } from "lucide-react";

export function Footer() {
  return (
    <footer
      className="border-t text-xs mt-24"
      style={{
        background: "var(--card)",
        borderColor: "var(--card-border)",
        color: "var(--muted)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">

        {/* ── Top Grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">

          {/* Brand column — real logo */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              {/* Logo image */}
              <div
                className="relative w-12 h-12 rounded-2xl overflow-hidden transition-transform duration-300 group-hover:scale-105"
                style={{ boxShadow: "0 0 20px -4px rgba(27,168,181,0.50)" }}
              >
                <Image
                  src="/logo.png"
                  alt="Travel Planner Logo"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Wordmark */}
              <div className="flex flex-col leading-none">
                <span
                  className="text-base font-black tracking-tight"
                  style={{ color: "var(--foreground)" }}
                >
                  Travel{" "}
                  <span
                    style={{
                      background: "linear-gradient(90deg,#1BA8B5,#C8872A)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Planner
                  </span>
                </span>
                <span
                  className="text-[9px] font-semibold tracking-[0.18em] uppercase mt-0.5"
                  style={{ color: "#1BA8B5", opacity: 0.85 }}
                >
                  Discover. Create. Journey.
                </span>
              </div>
            </Link>

            <p
              className="text-xs leading-relaxed max-w-sm font-medium"
              style={{ color: "var(--muted)" }}
            >
              World-Class 3D AI Travel Intelligence Platform. Powered by 2-Opt
              TSP geospatial optimization, live precipitation adaptation, 160+
              currency FX matrix, and constraint-aware itineraries across 196
              countries.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold"
                style={{
                  background: "rgba(27,168,181,0.12)",
                  border: "1px solid rgba(27,168,181,0.30)",
                  color: "#1BA8B5",
                }}
              >
                <Globe className="w-3.5 h-3.5" /> 196 Countries
              </span>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold"
                style={{
                  background: "rgba(16,185,129,0.10)",
                  border: "1px solid rgba(16,185,129,0.25)",
                  color: "#10b981",
                }}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Production Grade
              </span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <h4
              className="text-xs font-black uppercase tracking-widest"
              style={{ color: "var(--foreground)" }}
            >
              Platform Workspace
            </h4>
            <ul className="space-y-2.5 font-semibold" style={{ color: "var(--muted)" }}>
              {[
                { href: "/",             label: "Explore Worldwide" },
                { href: "/trips",        label: "My Expeditions Workspace" },
                { href: "/trips/new",    label: "3D Spatial Trip Generator" },
                { href: "/#destinations",label: "Global 196 Country Matrix" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="transition-colors hover:text-[#1BA8B5]"
                    style={{ color: "var(--muted)" }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* AI Engines list */}
          <div className="space-y-3">
            <h4
              className="text-xs font-black uppercase tracking-widest"
              style={{ color: "var(--foreground)" }}
            >
              AI Engines
            </h4>
            <ul className="space-y-2.5 font-semibold" style={{ color: "var(--muted)" }}>
              <li className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 shrink-0" style={{ color: "#1BA8B5" }} />
                2-Opt TSP Route Optimizer
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: "#C8872A" }} />
                Tool-Calling Copilot
              </li>
              <li className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 shrink-0" style={{ color: "#E87B2A" }} />
                160+ FX Currency Matrix
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "#10b981" }} />
                OpenStreetMap Geocoding
              </li>
            </ul>
          </div>

          {/* CTA card */}
          <div
            className="p-5 rounded-3xl space-y-3 flex flex-col justify-between"
            style={{
              background: "rgba(27,168,181,0.06)",
              border: "1px solid rgba(27,168,181,0.22)",
            }}
          >
            <div className="space-y-1">
              <h4 className="text-xs font-bold" style={{ color: "var(--foreground)" }}>
                Ready for your next trip?
              </h4>
              <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                Generate a custom itinerary in 30 seconds for any destination.
              </p>
            </div>
            <Link
              href="/trips/new"
              className="w-full py-2.5 rounded-xl text-xs font-bold text-center
                         flex items-center justify-center gap-1.5 transition hover:opacity-90"
              style={{
                background: "linear-gradient(135deg,#1BA8B5 0%,#1B2F5E 55%,#C8872A 100%)",
                boxShadow:  "0 4px 16px -4px rgba(27,168,181,0.40)",
                color:       "#ffffff",
              }}
            >
              <span style={{ color: "#ffffff" }}>Build Trip Plan</span>
              <ArrowRight className="w-3.5 h-3.5" style={{ color: "#ffffff" }} />
            </Link>
          </div>
        </div>

        {/* ── Bottom bar ──────────────────────────────────────────────── */}
        <div
          className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-medium"
          style={{ borderColor: "var(--card-border)", color: "var(--muted-foreground)" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <p>© {new Date().getFullYear()} Travel Planner — World-Class AI Travel Intelligence. All rights reserved.</p>
            <span
              className="hidden sm:inline text-[10px] px-2.5 py-0.5 rounded-full font-bold"
              style={{ background: "rgba(27,168,181,0.10)", color: "#1BA8B5", border: "1px solid rgba(27,168,181,0.20)" }}
            >
              v2.0
            </span>
          </div>

          {/* ── Developer Credit ─────────────────────────────────── */}
          <div
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-sm transition-all hover:scale-105"
            style={{
              background: "rgba(27,168,181,0.08)",
              borderColor: "rgba(27,168,181,0.25)",
            }}
          >
            <span className="text-[11px] font-semibold" style={{ color: "var(--muted)" }}>
              Developed with
            </span>
            <span className="text-rose-500 text-xs animate-pulse" aria-hidden="true">
              ♥
            </span>
            <span className="text-[11px] font-semibold" style={{ color: "var(--muted)" }}>
              by
            </span>
            <span
              className="text-xs font-black tracking-wide"
              style={{
                background: "linear-gradient(90deg, #1BA8B5 0%, #C8872A 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Mostafic Yellahy Nahid
            </span>
          </div>



          <div className="flex items-center gap-5">
            {["Privacy Policy", "Terms of Service", "Security"].map((item, i, arr) => (
              <span key={item} className="flex items-center gap-5">
                <span className="cursor-pointer hover:text-[#1BA8B5] transition-colors"
                  style={{ color: "var(--muted-foreground)" }}>
                  {item}
                </span>
                {i < arr.length - 1 && <span>•</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
