import { getLiveWeatherForecast, WeatherForecastDay } from "@/lib/services/weather";
import { getLiveExchangeRates, convertCurrency } from "@/lib/services/currency";
import { searchHotels, searchPlaces, HotelSearchResult, PlaceSearchResult } from "@/lib/services/places";
import { optimizeItineraryDay } from "@/lib/engine/optimizer";
import { calculateDistanceKm } from "@/lib/engine/constraints";
import { db } from "@/lib/db";

// ── Typed argument interfaces ──────────────────────────────────────────────────

interface SearchPlacesArgs {
  destination: string;
  category?: string;
}

interface SearchHotelsArgs {
  destination: string;
  budgetTier?: string;
}

interface GetWeatherArgs {
  lat: number;
  lng: number;
  days?: number;
}

interface GetExchangeRateArgs {
  baseCurrency: string;
}

interface CalculateRouteArgs {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
}

interface TripIdArgs {
  tripId: string;
}

// ── Tool result interfaces ─────────────────────────────────────────────────────

export interface RouteCalculationResult {
  distanceKm: number;
  walkingMinutes: number;
  transitMinutes: number;
}

export interface BudgetCalculationResult {
  budgetLimit: number;
  totalPlanned: number;
  totalActual: number;
  remaining: number;
  variance: number;
  suggestions: string[];
}

export interface OptimizeItineraryResult {
  success: boolean;
  previousTotalDistanceKm: number;
  newTotalDistanceKm: number;
  savedDistanceKm: number;
  message: string;
}

// ── Tool definition type ───────────────────────────────────────────────────────

export interface ToolDefinition<TArgs = unknown, TResult = unknown> {
  name: string;
  description: string;
  execute: (args: TArgs, context?: unknown) => Promise<TResult>;
}

// ── Tool registry ──────────────────────────────────────────────────────────────

export const toolsRegistry = {
  search_places: {
    name: "search_places",
    description: "Search attractions, dining, and places in a destination.",
    execute: async ({ destination, category }: SearchPlacesArgs): Promise<PlaceSearchResult[]> => {
      return await searchPlaces(destination, category);
    },
  } satisfies ToolDefinition<SearchPlacesArgs, PlaceSearchResult[]>,

  search_hotels: {
    name: "search_hotels",
    description: "Find hotel recommendations matching travel style.",
    execute: async ({ destination, budgetTier }: SearchHotelsArgs): Promise<HotelSearchResult[]> => {
      return await searchHotels(destination, budgetTier || "balanced");
    },
  } satisfies ToolDefinition<SearchHotelsArgs, HotelSearchResult[]>,

  get_weather: {
    name: "get_weather",
    description: "Get live weather forecast for a trip destination.",
    execute: async ({ lat, lng, days }: GetWeatherArgs): Promise<WeatherForecastDay[]> => {
      return await getLiveWeatherForecast(lat ?? 48.8566, lng ?? 2.3522, days ?? 5);
    },
  } satisfies ToolDefinition<GetWeatherArgs, WeatherForecastDay[]>,

  get_exchange_rate: {
    name: "get_exchange_rate",
    description: "Get current live exchange rate for a currency.",
    execute: async ({ baseCurrency }: GetExchangeRateArgs) => {
      return await getLiveExchangeRates(baseCurrency || "USD");
    },
  } satisfies ToolDefinition<GetExchangeRateArgs>,

  calculate_route: {
    name: "calculate_route",
    description: "Calculate geospatial distance and transit duration between coordinates.",
    execute: async ({ fromLat, fromLng, toLat, toLng }: CalculateRouteArgs): Promise<RouteCalculationResult> => {
      const dist = calculateDistanceKm(fromLat, fromLng, toLat, toLng);
      const walkTime = Math.ceil(dist * 12);
      const transitTime = Math.max(8, Math.ceil(dist * 4));
      return { distanceKm: dist, walkingMinutes: walkTime, transitMinutes: transitTime };
    },
  } satisfies ToolDefinition<CalculateRouteArgs, RouteCalculationResult>,

  calculate_budget: {
    name: "calculate_budget",
    description: "Calculate detailed trip budget variance and cost optimization suggestions.",
    execute: async ({ tripId }: TripIdArgs): Promise<BudgetCalculationResult> => {
      const trip = await db.trip.findUnique({
        where: { id: tripId },
        include: { days: { include: { activities: true } }, expenses: true },
      });
      if (!trip) throw new Error("Trip not found");

      const totalPlanned = trip.days.reduce((acc, d) => acc + d.estimatedCost, 0);
      const totalActual = trip.expenses.reduce((acc, e) => acc + e.amount, 0);
      const budgetLimit = trip.budget;
      const remaining = budgetLimit - totalActual;
      const variance = totalPlanned - budgetLimit;

      const suggestions: string[] = [];
      if (totalPlanned > budgetLimit) {
        suggestions.push(
          `Over budget by $${Math.round(variance)}. Consider swapping 1 paid attraction for a free museum or park.`
        );
      } else {
        suggestions.push(`Under budget by $${Math.round(Math.abs(variance))}. Budget is healthy!`);
      }

      return { budgetLimit, totalPlanned, totalActual, remaining, variance, suggestions };
    },
  } satisfies ToolDefinition<TripIdArgs, BudgetCalculationResult>,

  optimize_itinerary: {
    name: "optimize_itinerary",
    description: "Re-run priority-aware 2-Opt TSP route optimizer to minimize travel distance across all days.",
    execute: async ({ tripId }: TripIdArgs): Promise<OptimizeItineraryResult> => {
      const trip = await db.trip.findUnique({
        where: { id: tripId },
        include: { days: { include: { activities: true } } },
      });
      if (!trip) throw new Error("Trip not found");

      let initialTotalDist = 0;
      let optimizedTotalDist = 0;

      for (const day of trip.days) {
        initialTotalDist += day.travelDistance;
        const mappedDay = {
          dayNumber: day.dayNumber,
          date: day.date.toISOString().split("T")[0],
          theme: day.theme || "",
          summary: day.summary || "",
          estimatedCost: day.estimatedCost,
          travelDistance: day.travelDistance,
          travelTime: day.travelTime,
          activities: day.activities.map((a) => ({
            id: a.id,
            title: a.title,
            description: a.description || undefined,
            category: a.category as
              | "sightseeing"
              | "food"
              | "accommodation"
              | "transport"
              | "outdoor"
              | "cultural"
              | "shopping"
              | "relaxation",
            startTime: a.startTime,
            endTime: a.endTime,
            durationMinutes: a.durationMinutes,
            estimatedCost: a.estimatedCost,
            transportMode: a.transportMode as "walk" | "transit" | "taxi" | "drive",
            lat: a.lat,
            lng: a.lng,
            address: a.address || undefined,
            priority: a.priority,
            weatherSensitivity: a.weatherSensitivity as "outdoor" | "indoor" | "flexible",
            isCompleted: a.isCompleted,
          })),
        };

        const opt = optimizeItineraryDay(mappedDay);
        optimizedTotalDist += opt.travelDistance;

        // Persist updated activity timestamps
        for (const act of opt.activities) {
          if (act.id) {
            await db.activity.update({
              where: { id: act.id },
              data: { startTime: act.startTime, endTime: act.endTime },
            });
          }
        }

        await db.itineraryDay.update({
          where: { id: day.id },
          data: { travelDistance: opt.travelDistance, travelTime: opt.travelTime },
        });
      }

      const savedDist = Math.max(0, Math.round((initialTotalDist - optimizedTotalDist) * 10) / 10);
      return {
        success: true,
        previousTotalDistanceKm: Math.round(initialTotalDist * 10) / 10,
        newTotalDistanceKm: Math.round(optimizedTotalDist * 10) / 10,
        savedDistanceKm: savedDist,
        message: `Route optimized! Saved ${savedDist} km of total transit distance.`,
      };
    },
  } satisfies ToolDefinition<TripIdArgs, OptimizeItineraryResult>,
} as const;
