import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getLiveWeatherForecast } from "@/lib/services/weather";
import { calculateTripCarbonFootprint } from "@/lib/engine/carbon";
import { ItineraryTimeline } from "@/components/dashboard/itinerary-timeline";
import { TripMap } from "@/components/dashboard/trip-map";
import { BudgetTracker } from "@/components/dashboard/budget-tracker";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import { AICopilot } from "@/components/dashboard/ai-copilot";
import { LiveTripMode } from "@/components/dashboard/live-trip-mode";
import { GroupCollaboration } from "@/components/dashboard/group-collaboration";
import { TripHeaderActions } from "@/components/dashboard/trip-header-actions";
import { AddActivityModal } from "@/components/dashboard/add-activity-modal";
import { PackingList } from "@/components/dashboard/packing-list";
import { MapPin, Calendar, Users, DollarSign, Compass, Leaf } from "lucide-react";
import type {
  MapActivityShape,
  LiveModeActivityShape,
  TimelineDayShape,
  TimelineActivityShape,
  AddActivityDayShape,
  ExpenseRow,
  BudgetRow,
} from "@/types/trip-dashboard";

export const revalidate = 0;

export default async function TripDetailPage({ params }: { params: { id: string } }) {
  const trip = await db.trip.findUnique({
    where: { id: params.id },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: { activities: { orderBy: { startTime: "asc" } } },
      },
      expenses: { orderBy: { date: "desc" } },
      budgetDetails: true,
    },
  });

  if (!trip) {
    notFound();
  }

  // Live weather forecast for trip's primary location
  const centerLat = trip.days[0]?.activities[0]?.lat ?? 48.8566;
  const centerLng = trip.days[0]?.activities[0]?.lng ?? 2.3522;
  const weatherForecast = await getLiveWeatherForecast(centerLat, centerLng, trip.days.length || 5);
  const hasRainForecast = weatherForecast.some((w) => w.precipProbability >= 60);

  // KPI aggregates
  const totalActivities = trip.days.reduce((acc, d) => acc + d.activities.length, 0);
  const totalTravelKm = trip.days.reduce((acc, d) => acc + d.travelDistance, 0);
  const totalTravelMins = trip.days.reduce((acc, d) => acc + d.travelTime, 0);
  const estimatedCost = trip.days.reduce((acc, d) => acc + d.estimatedCost, 0);
  const costPerTraveler = Math.round(estimatedCost / Math.max(1, trip.travelerCount));

  // ── Typed prop shapes for each component ─────────────────────────────────

  // TripMap — minimal: id, title, lat, lng, startTime, category, address
  const mapActivities: MapActivityShape[] = trip.days.flatMap((d) =>
    d.activities.map((a): MapActivityShape => ({
      id: a.id,
      title: a.title,
      lat: a.lat,
      lng: a.lng,
      startTime: a.startTime,
      category: a.category,
      address: a.address ?? undefined,
    }))
  );

  // LiveTripMode — needs endTime, durationMinutes, transportMode
  const liveActivities: LiveModeActivityShape[] = trip.days.flatMap((d) =>
    d.activities.map((a): LiveModeActivityShape => ({
      id: a.id,
      title: a.title,
      description: a.description ?? undefined,
      startTime: a.startTime,
      endTime: a.endTime,
      durationMinutes: a.durationMinutes,
      lat: a.lat,
      lng: a.lng,
      address: a.address ?? undefined,
      transportMode: a.transportMode,
    }))
  );

  // ItineraryTimeline — full activity details + day date as ISO string
  const timelineDays: TimelineDayShape[] = trip.days.map((d): TimelineDayShape => ({
    id: d.id,
    dayNumber: d.dayNumber,
    date: d.date.toISOString().split("T")[0], // Date → ISO string
    theme: d.theme ?? undefined,              // null → undefined
    summary: d.summary ?? undefined,
    estimatedCost: d.estimatedCost,
    travelDistance: d.travelDistance,
    travelTime: d.travelTime,
    activities: d.activities.map((a): TimelineActivityShape => ({
      id: a.id,
      title: a.title,
      description: a.description ?? undefined,
      category: a.category,
      startTime: a.startTime,
      endTime: a.endTime,
      durationMinutes: a.durationMinutes,
      estimatedCost: a.estimatedCost,
      transportMode: a.transportMode,
      lat: a.lat,
      lng: a.lng,
      address: a.address ?? undefined,
      weatherSensitivity: a.weatherSensitivity,
      isCompleted: a.isCompleted,
    })),
  }));

  // AddActivityModal — only needs id, dayNumber, theme
  const addActivityDays: AddActivityDayShape[] = trip.days.map((d): AddActivityDayShape => ({
    id: d.id,
    dayNumber: d.dayNumber,
    theme: d.theme ?? undefined,
  }));

  // Carbon calc — needs transportMode, lat, lng per activity
  const carbonActivities = trip.days.flatMap((d) =>
    d.activities.map((a) => ({ transportMode: a.transportMode, lat: a.lat, lng: a.lng }))
  );
  const carbonResult = calculateTripCarbonFootprint(carbonActivities, totalTravelKm);

  // BudgetTracker expenses — convert Date → ISO string
  const expenseRows: ExpenseRow[] = trip.expenses.map((e): ExpenseRow => ({
    id: e.id,
    category: e.category,
    title: e.title,
    amount: e.amount,
    currency: e.currency,
    isPlanned: e.isPlanned,
    date: e.date.toISOString(),
  }));

  const budgetRow: BudgetRow | null = trip.budgetDetails
    ? {
        id: trip.budgetDetails.id,
        tripId: trip.budgetDetails.tripId,
        totalPlanned: trip.budgetDetails.totalPlanned,
        accommodationBudget: trip.budgetDetails.accommodationBudget,
        transportBudget: trip.budgetDetails.transportBudget,
        foodBudget: trip.budgetDetails.foodBudget,
        activitiesBudget: trip.budgetDetails.activitiesBudget,
        shoppingBudget: trip.budgetDetails.shoppingBudget,
        miscBudget: trip.budgetDetails.miscBudget,
      }
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Real-Time Live Trip Execution Mode Bar */}
      <LiveTripMode activities={liveActivities} />

      {/* Header Banner */}
      <div className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl space-y-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold mb-3">
              <span className="uppercase tracking-wider px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {trip.travelStyle} Trip
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-300 bg-emerald-500/20 px-3.5 py-1 rounded-full border border-emerald-400/30 font-bold flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                Eco Grade: {carbonResult.ecoScore} ({carbonResult.totalCo2Kg} kg CO₂)
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">{trip.title}</h1>
            <div className="flex flex-wrap items-center gap-5 text-xs sm:text-sm font-semibold text-slate-300 mt-3">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>{trip.destination}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>
                  {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>{trip.travelerCount} Travelers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span>Budget: ${trip.budget} {trip.currency}</span>
              </div>
            </div>
          </div>
          <TripHeaderActions tripId={trip.id} tripTitle={trip.title} />
        </div>

        {/* KPI Dashboard Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-6 border-t border-white/10">
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 shadow-inner">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Estimated Total</span>
            <p className="text-base font-black text-white mt-1">${Math.round(estimatedCost)}</p>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 shadow-inner">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Cost / Person</span>
            <p className="text-base font-black text-blue-400 mt-1">${costPerTraveler}</p>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 shadow-inner">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Activities</span>
            <p className="text-base font-black text-white mt-1">{totalActivities} Venues</p>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 shadow-inner">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Transit Distance</span>
            <p className="text-base font-black text-emerald-400 mt-1">{Math.round(totalTravelKm * 10) / 10} km</p>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 shadow-inner">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Transit Time</span>
            <p className="text-base font-black text-indigo-400 mt-1">{totalTravelMins} mins</p>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 shadow-inner">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Carbon Offset</span>
            <p className="text-base font-black text-amber-400 mt-1">${carbonResult.offsetCostUsd}</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-8 lg:space-y-10">
          <div className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-7 sm:p-8 border border-white/10 shadow-2xl space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-400" />
              Geospatial Route Map & Venue Pins
            </h3>
            <TripMap activities={mapActivities} center={[centerLat, centerLng]} />
          </div>

          <div className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-7 sm:p-8 border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Itinerary Timeline</h3>
              <AddActivityModal tripId={trip.id} days={addActivityDays} />
            </div>
            <ItineraryTimeline days={timelineDays} />
          </div>

          <PackingList
            destination={trip.destination}
            travelStyle={trip.travelStyle}
            hasRainForecast={hasRainForecast}
          />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 space-y-8 lg:space-y-10">
          <AICopilot tripId={trip.id} />
          <GroupCollaboration travelerCount={trip.travelerCount} />
          <WeatherWidget forecast={weatherForecast} />
          <BudgetTracker
            tripId={trip.id}
            budgetLimit={trip.budget}
            currency={trip.currency}
            budgetDetails={budgetRow}
            expenses={expenseRows}
          />
        </div>
      </div>
    </div>
  );
}
