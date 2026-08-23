import Link from "next/link";
import {
  MapPin, Sparkles, CloudRain, Cpu, RefreshCw, Compass,
} from "lucide-react";
import { Hero3DCard } from "@/components/hero-3d-card";

/**
 * Landing page — fully public, no database queries.
 * ISR: revalidate every 3600s for CDN caching — zero runtime DB hits.
 */
export const revalidate = 3600;

const FEATURED_COUNTRIES = [
  { name: "France",         city: "Paris",           tag: "Romance & Art",       image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop&q=80" },
  { name: "Japan",          city: "Tokyo",           tag: "Futuristic Culture",   image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80" },
  { name: "United Kingdom", city: "London",          tag: "Heritage & Cuisine",   image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&auto=format&fit=crop&q=80" },
  { name: "United States",  city: "New York",        tag: "Skyline & Shows",      image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&auto=format&fit=crop&q=80" },
  { name: "Bangladesh",     city: "Dhaka",           tag: "Rivers & Heritage",    image: "https://images.unsplash.com/photo-1608958435020-e8a7109ba809?w=600&auto=format&fit=crop&q=80" },
  { name: "Italy",          city: "Rome",            tag: "Ancient Empire",        image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&auto=format&fit=crop&q=80" },
  { name: "Australia",      city: "Sydney",          tag: "Harbor & Sun",         image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&auto=format&fit=crop&q=80" },
  { name: "Brazil",         city: "Rio de Janeiro",  tag: "Beaches & Carnival",   image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=600&auto=format&fit=crop&q=80" },
];

/* ── Shared engine card colour configs ─────────────────────────────────── */
const ENGINE_CARDS = [
  {
    icon: <Cpu      className="w-6 h-6 animate-pulse" style={{ color: "#1BA8B5" }} />,
    iconBg:   "rgba(27,168,181,0.12)",
    iconBorder:"rgba(27,168,181,0.30)",
    title: "2-Opt Route Optimizer",
    desc:  "Computes pairwise Haversine distances and applies 2-Opt TSP node swaps to minimize daily transit time.",
  },
  {
    icon: <CloudRain className="w-6 h-6" style={{ color: "#1B2F5E" }} />,
    iconBg:    "rgba(27,47,94,0.15)",
    iconBorder:"rgba(27,47,94,0.35)",
    title: "Live Rain Adapt Engine",
    desc:  "Monitors precipitation probabilities and automatically swaps outdoor parks for museums during rain.",
  },
  {
    icon: <RefreshCw className="w-6 h-6" style={{ color: "#C8872A" }} />,
    iconBg:    "rgba(200,135,42,0.12)",
    iconBorder:"rgba(200,135,42,0.30)",
    title: "160+ Currency FX Engine",
    desc:  "Converts local venue costs into any selected currency ($USD, €EUR, £GBP, ¥JPY, ৳BDT, etc.) live.",
  },
  {
    icon: <Compass className="w-6 h-6 animate-spin" style={{ color: "#E87B2A" }} />,
    iconBg:    "rgba(232,123,42,0.12)",
    iconBorder:"rgba(232,123,42,0.30)",
    title: "Tool-Calling AI Copilot",
    desc:  "Conversational assistant equipped with execution tools to modify activities, adjust pace, or swap hotels.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-28 sm:space-y-36 lg:space-y-40 pb-20">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-8 sm:pt-12 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <Hero3DCard />

        <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Primary gradient CTA */}
          <Link
            href="/trips/new"
            className="w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-base
                       flex items-center justify-center gap-2.5 transition transform
                       hover:scale-105 active:scale-95 border border-white/20"
            style={{
              background: "linear-gradient(135deg, #1BA8B5 0%, #1B2F5E 55%, #C8872A 100%)",
              boxShadow:  "0 8px 32px -6px rgba(27,168,181,0.55)",
              color:       "#ffffff",          /* always white — never overridden */
            }}
          >
            <span className="text-white">✦</span>
            <span style={{ color: "#ffffff" }}>Build Expedition for Any Country</span>
            <span style={{ color: "#ffffff" }}>→</span>
          </Link>

          {/* Secondary outline */}
          <Link
            href="/trips"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl border-2 font-bold text-base
                       flex items-center justify-center gap-2 transition hover:bg-[rgba(27,168,181,0.08)]"
            style={{
              borderColor: "#1BA8B5",
              color:        "var(--foreground)",
            }}
          >
            <span style={{ color: "#1BA8B5" }}>⊙</span>
            <span>My Expeditions</span>
          </Link>
        </div>
      </section>

      {/* ── Engine Cards ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span
            className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border shadow-sm"
            style={{
              color:       "#1BA8B5",
              background:  "rgba(27,168,181,0.10)",
              borderColor: "rgba(27,168,181,0.25)",
            }}
          >
            Spatial AI Architecture
          </span>
          <h2
            className="text-3xl sm:text-5xl font-black tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Constraint-Aware Travel Intelligence
          </h2>
          <p className="text-sm sm:text-base leading-relaxed font-medium" style={{ color: "var(--muted)" }}>
            Four specialized AI engines working synchronously to construct optimized daily schedules across 196 countries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {ENGINE_CARDS.map((card) => (
            <div
              key={card.title}
              className="p-7 sm:p-8 rounded-3xl border shadow-xl hover:shadow-2xl transition-all
                         transform hover:-translate-y-1.5 space-y-4 backdrop-blur-xl group"
              style={{
                background:   "var(--card)",
                borderColor:  "var(--card-border)",
              }}
            >
              <div
                className="w-13 h-13 rounded-2xl flex items-center justify-center
                           transition-transform group-hover:scale-110"
                style={{
                  background: card.iconBg,
                  border:     `1px solid ${card.iconBorder}`,
                }}
              >
                {card.icon}
              </div>
              <h3
                className="text-lg font-bold"
                style={{ color: "var(--foreground)" }}
              >
                {card.title}
              </h3>
              <p
                className="text-xs leading-relaxed font-normal"
                style={{ color: "var(--muted)" }}
              >
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 196 Country Showcase ─────────────────────────────────────── */}
      <section id="destinations" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span
            className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border shadow-sm"
            style={{
              color:       "#C8872A",
              background:  "rgba(200,135,42,0.10)",
              borderColor: "rgba(200,135,42,0.25)",
            }}
          >
            Global Destinations
          </span>
          <h2
            className="text-3xl sm:text-5xl font-black tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Explore 196 Countries Worldwide
          </h2>
          <p
            className="text-sm sm:text-base leading-relaxed font-medium"
            style={{ color: "var(--muted)" }}
          >
            Pick any country or city. VoyageAI geocodes locations, venues, weather forecasts, and currency rates for any destination you choose.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {FEATURED_COUNTRIES.map((c) => (
            <Link
              key={c.name}
              href={`/trips/new?destination=${encodeURIComponent(c.city)}`}
              className="group relative h-72 sm:h-80 rounded-3xl overflow-hidden shadow-xl border transition transform hover:-translate-y-2 hover:shadow-2xl"
              style={{ borderColor: "rgba(27,168,181,0.18)" }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition duration-700"
                style={{ backgroundImage: `url(${c.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070D1A] via-[#070D1A]/50 to-transparent opacity-90" />
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-1.5">
                <span
                  className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md"
                  style={{
                    background:  "rgba(27,168,181,0.25)",
                    border:      "1px solid rgba(27,168,181,0.40)",
                    color:       "#1BA8B5",
                  }}
                >
                  {c.name}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white">{c.city}</h3>
                <p className="text-xs text-slate-300 font-medium">{c.tag}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section id="trips" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="rounded-3xl p-12 sm:p-16 border shadow-2xl text-center space-y-6"
          style={{
            background:  "linear-gradient(135deg, var(--card) 0%, rgba(27,168,181,0.06) 50%, var(--card) 100%)",
            borderColor: "rgba(27,168,181,0.22)",
          }}
        >
          <span
            className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border"
            style={{
              color:       "#1BA8B5",
              background:  "rgba(27,168,181,0.10)",
              borderColor: "rgba(27,168,181,0.25)",
            }}
          >
            Your Expeditions
          </span>
          <h2
            className="text-3xl sm:text-4xl font-black tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Ready to Plan Your Next Journey?
          </h2>
          <p
            className="text-sm max-w-xl mx-auto leading-relaxed"
            style={{ color: "var(--muted)" }}
          >
            Sign in to access your personalized trip dashboard, AI Copilot, live weather alerts, and interactive itinerary maps.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            {/* Primary gradient */}
            <Link
              href="/trips"
              className="px-10 py-4 rounded-2xl font-black text-base
                         flex items-center justify-center gap-2 transition transform hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #1BA8B5 0%, #1B2F5E 55%, #C8872A 100%)",
                boxShadow:  "0 8px 28px -6px rgba(27,168,181,0.50)",
                color:       "#ffffff",
              }}
            >
              <MapPin className="w-4 h-4" style={{ color: "#fff" }} />
              <span style={{ color: "#ffffff" }}>View My Trips</span>
            </Link>
            {/* Secondary outline */}
            <Link
              href="/trips/new"
              className="px-10 py-4 rounded-2xl border-2 font-bold text-base
                         flex items-center justify-center gap-2 transition hover:bg-[rgba(200,135,42,0.08)]"
              style={{
                borderColor: "#C8872A",
                color:        "var(--foreground)",
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: "#C8872A" }} />
              <span>Create New Trip</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
