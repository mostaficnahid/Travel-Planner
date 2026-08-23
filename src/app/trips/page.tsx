import Link from "next/link";
import { db } from "@/lib/db";
import {
  MapPin, Calendar, Plus, Compass, Sparkles,
  Trash2, ArrowRight, Globe, BarChart3,
} from "lucide-react";
import { revalidatePath } from "next/cache";

export const revalidate = 0;

async function deleteTripAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  if (id) {
    await db.trip.delete({ where: { id } });
    revalidatePath("/trips");
    revalidatePath("/");
  }
}

export default async function MyTripsPage() {
  const trips = await db.trip.findMany({
    orderBy: { createdAt: "desc" },
    include: { days: true },
  });

  const totalDays = trips.reduce((s, t) => s + t.days.length, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 sm:p-10 border"
        style={{
          background:   "linear-gradient(135deg, var(--card) 0%, rgba(27,168,181,0.06) 50%, var(--card) 100%)",
          borderColor:  "rgba(27,168,181,0.22)",
          boxShadow:    "0 20px 60px -12px rgba(0,0,0,0.25)",
        }}
      >
        {/* Ambient glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-30"
          style={{ background: "radial-gradient(circle, #1BA8B5, transparent)" }} />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full"
              style={{ color: "#1BA8B5", background: "rgba(27,168,181,0.12)", border: "1px solid rgba(27,168,181,0.28)" }}>
              <Compass className="w-3.5 h-3.5" /> Workspace
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>
              My Expeditions
            </h1>
            <p className="text-sm font-medium leading-relaxed max-w-lg" style={{ color: "var(--muted)" }}>
              Manage, review, and re-optimize all your AI travel itineraries across 196 countries.
            </p>
          </div>

          <Link href="/trips/new"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm
                       shrink-0 transition-all transform hover:scale-105 active:scale-95 border border-white/20"
            style={{
              background: "linear-gradient(135deg, #1BA8B5 0%, #1B2F5E 55%, #C8872A 100%)",
              boxShadow:  "0 8px 28px -6px rgba(27,168,181,0.50)",
              color:      "#ffffff",
            }}>
            <Plus className="w-4 h-4" style={{ color: "#fff" }} />
            <span style={{ color: "#ffffff" }}>New Expedition</span>
          </Link>
        </div>

        {/* ── Stats strip ─────────────────────────────────────────── */}
        {trips.length > 0 && (
          <div className="relative mt-8 grid grid-cols-3 gap-4">
            {[
              { icon: <Globe className="w-4 h-4" style={{ color: "#1BA8B5" }} />,   label: "Trips Created",  value: trips.length },
              { icon: <Calendar className="w-4 h-4" style={{ color: "#C8872A" }} />, label: "Total Days",     value: totalDays },
              { icon: <BarChart3 className="w-4 h-4" style={{ color: "#E87B2A" }} />,label: "Countries",      value: new Set(trips.map(t => t.destination.split(",").pop()?.trim())).size },
            ].map((s) => (
              <div key={s.label}
                className="flex flex-col items-center sm:flex-row sm:items-center gap-2 p-4 rounded-2xl text-center sm:text-left"
                style={{ background: "rgba(27,168,181,0.06)", border: "1px solid rgba(27,168,181,0.15)" }}>
                {s.icon}
                <div>
                  <p className="text-xl font-black" style={{ color: "var(--foreground)" }}>{s.value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Empty state ──────────────────────────────────────────────── */}
      {trips.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-6 py-24 rounded-3xl border text-center px-8"
          style={{ background: "var(--card)", borderColor: "var(--card-border)" }}
        >
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ background: "rgba(27,168,181,0.10)", border: "1px solid rgba(27,168,181,0.25)" }}
          >
            <Compass className="w-10 h-10 animate-spin" style={{ color: "#1BA8B5" }} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>No Expeditions Yet</h3>
            <p className="text-sm max-w-sm" style={{ color: "var(--muted)" }}>
              Launch the AI trip wizard to generate your first custom itinerary for any city or country.
            </p>
          </div>
          <Link href="/trips/new"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #1BA8B5, #1B2F5E)",
              color:      "#ffffff",
              boxShadow:  "0 8px 24px -6px rgba(27,168,181,0.45)",
            }}>
            <Sparkles className="w-4 h-4" style={{ color: "#fff" }} />
            <span style={{ color: "#ffffff" }}>Create First Trip</span>
          </Link>
        </div>
      ) : (
        /* ── Trips Grid ──────────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="trip-card group rounded-3xl overflow-hidden border shadow-xl hover:shadow-2xl
                         transition-all transform hover:-translate-y-1.5 flex flex-col backdrop-blur-xl"
              style={{
                background:  "var(--card)",
                borderColor: "var(--card-border)",
              }}
            >
              {/* Cover image */}
              <div className="relative h-48 overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                  style={{ backgroundImage: `url(${trip.coverImageUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070D1A] via-[#070D1A]/30 to-transparent" />

                {/* Delete button */}
                <div className="absolute top-3 right-3">
                  <form action={deleteTripAction}>
                    <input type="hidden" name="id" value={trip.id} />
                    <button type="submit" aria-label="Delete expedition"
                      className="p-2 rounded-xl backdrop-blur-xl text-white/70 hover:text-white
                                 hover:bg-rose-600 transition-all border border-white/20"
                      style={{ background: "rgba(7,13,26,0.75)" }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                {/* Title overlay */}
                <div className="absolute bottom-4 left-4 right-4 space-y-1">
                  <span
                    className="inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md"
                    style={{ background: "rgba(27,168,181,0.85)", color: "#fff" }}
                  >
                    {trip.travelStyle}
                  </span>
                  <h3 className="text-lg font-bold text-white truncate drop-shadow-lg">{trip.title}</h3>
                </div>
              </div>

              {/* Card body */}
              <div className="p-5 space-y-3 flex-1">
                <div className="flex items-center justify-between text-xs font-semibold"
                  style={{ color: "var(--muted)" }}>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "#1BA8B5" }} />
                    <span>{trip.destination}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold"
                    style={{ color: "#10b981" }}>
                    <span>${trip.budget.toLocaleString()} {trip.currency}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--muted)" }}>
                  <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: "#C8872A" }} />
                  <span>
                    {new Date(trip.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {" → "}
                    {new Date(trip.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Card footer */}
              <div
                className="px-5 py-3.5 border-t flex items-center justify-between text-xs font-bold"
                style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
              >
                <span
                  className="px-2.5 py-1 rounded-full text-[10px] font-black"
                  style={{ background: "rgba(27,168,181,0.10)", color: "#1BA8B5", border: "1px solid rgba(27,168,181,0.20)" }}
                >
                  {trip.days.length} Days
                </span>
                <Link href={`/trips/${trip.id}`}
                  className="flex items-center gap-1 transition-all group-hover:translate-x-1"
                  style={{ color: "#1BA8B5" }}>
                  <span>Open Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
