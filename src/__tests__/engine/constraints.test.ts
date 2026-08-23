import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GeneratedItinerary, CreateTripInput } from "@/lib/schemas/trip";
import type { WeatherForecastDay } from "@/lib/services/weather";

// Mock the places service so the constraint engine doesn't make HTTP calls
vi.mock("@/lib/services/places", () => ({
  searchPlaces: vi.fn().mockResolvedValue([
    { name: "National Museum", lat: 48.8566, lng: 2.3522 },
    { name: "City Art Gallery", lat: 48.8606, lng: 2.3376 },
  ]),
}));

// Import after mocking so vi.mock hoisting applies
const { validateAndSanitizeItinerary } = await import("@/lib/engine/constraints");

// ── Test Fixtures ──────────────────────────────────────────────────────────────

function makeActivity(overrides: object = {}) {
  return {
    title: "Outdoor Park Visit",
    description: "Beautiful park",
    category: "outdoor" as const,
    startTime: "09:00",
    endTime: "11:00",
    durationMinutes: 120,
    estimatedCost: 10,
    transportMode: "walk" as const,
    lat: 48.8566,
    lng: 2.3522,
    priority: 2,
    weatherSensitivity: "outdoor" as const,
    isCompleted: false,
    ...overrides,
  };
}

function makeDay(dayNumber: number, activities: ReturnType<typeof makeActivity>[]) {
  return {
    dayNumber,
    date: `2026-09-0${dayNumber}`,
    theme: `Day ${dayNumber}`,
    summary: `Day ${dayNumber} summary`,
    estimatedCost: activities.reduce((s, a) => s + a.estimatedCost, 0),
    travelDistance: 0,
    travelTime: 0,
    activities,
  };
}

const BASE_PREFERENCES: CreateTripInput = {
  destination: "Paris",
  country: "France",
  startDate: "2026-09-01",
  endDate: "2026-09-03",
  travelerCount: 2,
  budget: 1000,
  currency: "USD",
  budgetFlexibility: "balanced",
  travelStyle: "balanced",
  interests: ["sightseeing"],
  constraints: {
    maxDailyWalkingKm: 8,
    transportPreference: "public",
    dietaryRestrictions: [],
    accessibilityNeeds: [],
    dayStartTime: "09:00",
    dayEndTime: "21:00",
  },
};

function makeItinerary(days: ReturnType<typeof makeDay>[], totalCost = 500): GeneratedItinerary {
  return {
    tripTitle: "Test Trip",
    summary: "A test trip",
    destinationOverview: "Paris overview",
    totalEstimatedCost: totalCost,
    currency: "USD",
    recommendedHotels: [],
    days,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("validateAndSanitizeItinerary — budget", () => {
  it("produces no budget violation when cost is within budget", async () => {
    const itinerary = makeItinerary(
      [makeDay(1, [makeActivity({ estimatedCost: 50 })])],
      50
    );
    const prefs = { ...BASE_PREFERENCES, budget: 500 };
    const result = await validateAndSanitizeItinerary(itinerary, prefs);
    const budgetViolations = result.violations.filter((v) => v.type === "budget");
    expect(budgetViolations).toHaveLength(0);
  });

  it("produces an error severity violation on strict budget overrun", async () => {
    const itinerary = makeItinerary(
      [makeDay(1, [makeActivity({ estimatedCost: 900 })])],
      900
    );
    const prefs = { ...BASE_PREFERENCES, budget: 100, budgetFlexibility: "strict" as const };
    const result = await validateAndSanitizeItinerary(itinerary, prefs);
    const violation = result.violations.find((v) => v.type === "budget");
    expect(violation).toBeDefined();
    expect(violation?.severity).toBe("error");
    expect(result.isValid).toBe(false);
  });

  it("produces a warning severity violation on balanced budget overrun", async () => {
    const itinerary = makeItinerary(
      [makeDay(1, [makeActivity({ estimatedCost: 900 })])],
      900
    );
    const prefs = { ...BASE_PREFERENCES, budget: 100, budgetFlexibility: "balanced" as const };
    const result = await validateAndSanitizeItinerary(itinerary, prefs);
    const violation = result.violations.find((v) => v.type === "budget");
    expect(violation?.severity).toBe("warning");
    // Warning-only: isValid should still be true
    expect(result.isValid).toBe(true);
  });
});

describe("validateAndSanitizeItinerary — weather adaptation", () => {
  const RAINY_FORECAST: WeatherForecastDay[] = [
    {
      date: "2026-09-01",
      tempMax: 18,
      tempMin: 12,
      condition: "Rainy",
      precipProbability: 75,
      icon: "🌧️",
    },
  ];

  it("mutates outdoor activities to indoor on rainy days", async () => {
    const outdoorActivity = makeActivity({ weatherSensitivity: "outdoor" });
    const itinerary = makeItinerary([makeDay(1, [outdoorActivity])]);
    const result = await validateAndSanitizeItinerary(
      itinerary,
      BASE_PREFERENCES,
      RAINY_FORECAST
    );
    const mutated = result.sanitizedItinerary.days[0].activities[0];
    expect(mutated.weatherSensitivity).toBe("indoor");
  });

  it("replaces outdoor activity title with a real venue name when searchPlaces succeeds", async () => {
    const outdoorActivity = makeActivity({ weatherSensitivity: "outdoor" });
    const itinerary = makeItinerary([makeDay(1, [outdoorActivity])]);
    const result = await validateAndSanitizeItinerary(
      itinerary,
      BASE_PREFERENCES,
      RAINY_FORECAST
    );
    const mutated = result.sanitizedItinerary.days[0].activities[0];
    // Mocked searchPlaces returns "National Museum" as first result
    expect(mutated.title).toBe("National Museum");
  });

  it("emits a weather violation for rainy days with outdoor activities", async () => {
    const itinerary = makeItinerary([makeDay(1, [makeActivity({ weatherSensitivity: "outdoor" })])]);
    const result = await validateAndSanitizeItinerary(
      itinerary,
      BASE_PREFERENCES,
      RAINY_FORECAST
    );
    const weatherViolation = result.violations.find((v) => v.type === "weather");
    expect(weatherViolation).toBeDefined();
    expect(weatherViolation?.severity).toBe("warning");
    expect(weatherViolation?.dayNumber).toBe(1);
  });

  it("does not mutate indoor activities on rainy days", async () => {
    const indoorActivity = makeActivity({ title: "Museum Visit", weatherSensitivity: "indoor" });
    const itinerary = makeItinerary([makeDay(1, [indoorActivity])]);
    const result = await validateAndSanitizeItinerary(
      itinerary,
      BASE_PREFERENCES,
      RAINY_FORECAST
    );
    const activity = result.sanitizedItinerary.days[0].activities[0];
    expect(activity.title).toBe("Museum Visit");
    expect(activity.weatherSensitivity).toBe("indoor");
  });
});

describe("validateAndSanitizeItinerary — pacing", () => {
  it("flags days with more than 5 activities", async () => {
    const activities = Array.from({ length: 6 }, (_, i) =>
      makeActivity({ title: `Activity ${i + 1}`, lat: 48.85 + i * 0.001, lng: 2.35 })
    );
    const itinerary = makeItinerary([makeDay(1, activities)]);
    const result = await validateAndSanitizeItinerary(itinerary, BASE_PREFERENCES);
    const pacingViolation = result.violations.find((v) => v.type === "pacing");
    expect(pacingViolation).toBeDefined();
    expect(pacingViolation?.message).toContain("6");
  });
});

describe("validateAndSanitizeItinerary — general", () => {
  it("returns a valid result with no violations for a simple compliant itinerary", async () => {
    const itinerary = makeItinerary(
      [makeDay(1, [makeActivity({ estimatedCost: 20, weatherSensitivity: "indoor" })])],
      20
    );
    const result = await validateAndSanitizeItinerary(itinerary, {
      ...BASE_PREFERENCES,
      budget: 500,
    });
    expect(result.isValid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("sanitizedItinerary preserves all original days", async () => {
    const days = [
      makeDay(1, [makeActivity()]),
      makeDay(2, [makeActivity()]),
    ];
    const itinerary = makeItinerary(days, 100);
    const result = await validateAndSanitizeItinerary(itinerary, BASE_PREFERENCES);
    expect(result.sanitizedItinerary.days).toHaveLength(2);
  });
});
