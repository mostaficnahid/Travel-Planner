import { describe, it, expect } from "vitest";
import { optimize2OptRoute, resequenceDailySchedule, optimizeItineraryDay } from "@/lib/engine/optimizer";
import type { ActivityInput, ItineraryDayInput } from "@/lib/schemas/trip";

// Helper: build a minimal ActivityInput
function makeActivity(
  overrides: Partial<ActivityInput> & { lat: number; lng: number; priority?: number }
): ActivityInput {
  return {
    title: "Test Activity",
    category: "sightseeing",
    startTime: "09:00",
    endTime: "10:00",
    durationMinutes: 60,
    estimatedCost: 10,
    transportMode: "walk",
    address: "Test St",
    priority: 1,
    weatherSensitivity: "flexible",
    isCompleted: false,
    ...overrides,
  };
}

// A classic badly-ordered route: far away point in the middle
const DISORDERED_ACTIVITIES: ActivityInput[] = [
  makeActivity({ title: "A", lat: 48.8566, lng: 2.3522, priority: 2 }), // Paris centre
  makeActivity({ title: "B", lat: 51.5074, lng: -0.1278, priority: 2 }), // London (far)
  makeActivity({ title: "C", lat: 48.8606, lng: 2.3376, priority: 2 }), // Near Paris
  makeActivity({ title: "D", lat: 48.8584, lng: 2.2945, priority: 2 }), // Eiffel Tower
];

describe("optimize2OptRoute", () => {
  it("returns input unchanged when fewer than 4 activities", () => {
    const acts = DISORDERED_ACTIVITIES.slice(0, 3);
    const result = optimize2OptRoute(acts);
    expect(result).toEqual(acts);
  });

  it("produces a shorter or equal total distance than the input", () => {
    function totalDist(acts: ActivityInput[]) {
      let d = 0;
      for (let i = 0; i < acts.length - 1; i++) {
        const dLat = acts[i + 1].lat - acts[i].lat;
        const dLng = acts[i + 1].lng - acts[i].lng;
        d += Math.sqrt(dLat ** 2 + dLng ** 2);
      }
      return d;
    }

    const original = totalDist(DISORDERED_ACTIVITIES);
    const optimized = optimize2OptRoute([...DISORDERED_ACTIVITIES]);
    const optimizedDist = totalDist(optimized);
    expect(optimizedDist).toBeLessThanOrEqual(original + 0.001); // small float tolerance
  });

  it("preserves all activities (no additions or deletions)", () => {
    const result = optimize2OptRoute([...DISORDERED_ACTIVITIES]);
    expect(result).toHaveLength(DISORDERED_ACTIVITIES.length);
    const titles = result.map((a) => a.title).sort();
    expect(titles).toEqual(["A", "B", "C", "D"]);
  });
});

describe("resequenceDailySchedule", () => {
  it("produces non-overlapping times starting from dayStartTime", () => {
    const acts = [
      makeActivity({ lat: 48.8566, lng: 2.3522, durationMinutes: 60 }),
      makeActivity({ lat: 48.8606, lng: 2.3376, durationMinutes: 90 }),
    ];
    const result = resequenceDailySchedule(acts, "08:00");
    expect(result[0].startTime).toBe("08:00");
    // Second should start after first ends + transit
    const [h0, m0] = result[0].endTime.split(":").map(Number);
    const [h1, m1] = result[1].startTime.split(":").map(Number);
    const end0 = h0 * 60 + m0;
    const start1 = h1 * 60 + m1;
    expect(start1).toBeGreaterThanOrEqual(end0);
  });

  it("clamps times to within 00:00–23:59", () => {
    const acts = Array.from({ length: 20 }, (_, i) =>
      makeActivity({ lat: 0, lng: i * 0.001, durationMinutes: 120 })
    );
    const result = resequenceDailySchedule(acts, "06:00");
    result.forEach((a) => {
      const [endH] = a.endTime.split(":").map(Number);
      expect(endH).toBeLessThanOrEqual(23);
    });
  });
});

describe("optimizeItineraryDay", () => {
  const baseDay: ItineraryDayInput = {
    dayNumber: 1,
    date: "2026-09-01",
    theme: "Explore",
    summary: "Day 1",
    estimatedCost: 100,
    travelDistance: 0,
    travelTime: 0,
    activities: [
      makeActivity({ title: "Anchor A", lat: 48.8566, lng: 2.3522, priority: 1 }),
      makeActivity({ title: "Flexible B", lat: 51.5074, lng: -0.1278, priority: 2 }),
      makeActivity({ title: "Flexible C", lat: 48.8606, lng: 2.3376, priority: 2 }),
      makeActivity({ title: "Flexible D", lat: 48.8584, lng: 2.2945, priority: 2 }),
    ],
  };

  it("returns day unchanged when 2 or fewer activities", () => {
    const day: ItineraryDayInput = { ...baseDay, activities: baseDay.activities.slice(0, 2) };
    const result = optimizeItineraryDay(day);
    expect(result).toEqual(day);
  });

  it("keeps priority-1 activities at their original relative position", () => {
    const result = optimizeItineraryDay({ ...baseDay, activities: [...baseDay.activities] });
    // The anchor (priority 1) should remain at index 0
    expect(result.activities[0].title).toBe("Anchor A");
  });

  it("recalculates travelDistance and travelTime as non-negative numbers", () => {
    const result = optimizeItineraryDay({ ...baseDay, activities: [...baseDay.activities] });
    expect(result.travelDistance).toBeGreaterThanOrEqual(0);
    expect(result.travelTime).toBeGreaterThanOrEqual(0);
  });

  it("preserves total number of activities", () => {
    const result = optimizeItineraryDay({ ...baseDay, activities: [...baseDay.activities] });
    expect(result.activities).toHaveLength(baseDay.activities.length);
  });
});
