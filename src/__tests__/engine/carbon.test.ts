import { describe, it, expect } from "vitest";
import { calculateTripCarbonFootprint } from "@/lib/engine/carbon";

// Helper: build a simple activity transport array
function makeActivities(
  modes: string[],
  coords: Array<[number, number]>
) {
  return modes.map((transportMode, i) => ({
    transportMode,
    lat: coords[i][0],
    lng: coords[i][1],
  }));
}

// Paris city-scale coords (all very close, ~1km apart per step)
const PARIS_COORDS: Array<[number, number]> = [
  [48.8566, 2.3522], // Notre-Dame
  [48.8606, 2.3376], // Louvre
  [48.8738, 2.2950], // Arc de Triomphe
  [48.8584, 2.2945], // Eiffel Tower
];

describe("calculateTripCarbonFootprint", () => {
  it("returns 0 CO2 for an all-walking trip", () => {
    const acts = makeActivities(["walk", "walk", "walk", "walk"], PARIS_COORDS);
    const result = calculateTripCarbonFootprint(acts, 10);
    expect(result.totalCo2Kg).toBe(0);
  });

  it("produces correct CO2 for a transit-only trip", () => {
    // 3 legs of transit, each ~1-3 km at 0.04 kg/km
    const acts = makeActivities(["transit", "transit", "transit", "transit"], PARIS_COORDS);
    const result = calculateTripCarbonFootprint(acts, 10);
    expect(result.totalCo2Kg).toBeGreaterThan(0);
    expect(result.totalCo2Kg).toBeLessThan(5); // City-scale, should be minimal
  });

  it("scores A+ for a low-emission walking trip", () => {
    const acts = makeActivities(["walk", "walk", "walk", "walk"], PARIS_COORDS);
    const result = calculateTripCarbonFootprint(acts, 5);
    expect(result.ecoScore).toBe("A+");
  });

  it("scores C for a heavy-driving trip", () => {
    // Need enough driving km to exceed 35 kg threshold
    // 220+ km of driving → 220 * 0.16 = 35.2 kg
    const farCoords: Array<[number, number]> = [
      [48.8566, 2.3522],
      [50.8503, 4.3517], // Brussels (~300 km)
      [51.5074, -0.1278], // London
      [48.8566, 2.3522], // back to Paris
    ];
    const acts = makeActivities(["drive", "drive", "drive", "drive"], farCoords);
    const result = calculateTripCarbonFootprint(acts, 900);
    expect(result.ecoScore).toBe("C");
    expect(result.totalCo2Kg).toBeGreaterThan(35);
  });

  it("uses fallback split for fewer than 2 activities", () => {
    const result = calculateTripCarbonFootprint([{ transportMode: "walk", lat: 0, lng: 0 }], 100);
    // Fallback: 50% walk(0) + 30% transit(0.04) + 20% drive(0.16)
    // = 30 * 0.04 + 20 * 0.16 = 1.2 + 3.2 = 4.4 kg
    expect(result.totalCo2Kg).toBeGreaterThan(0);
    expect(result.breakdown.walkingKm).toBe(50);
    expect(result.breakdown.transitKm).toBe(30);
    expect(result.breakdown.drivingKm).toBe(20);
  });

  it("always returns at least $1 offset cost", () => {
    const acts = makeActivities(["walk", "walk"], [PARIS_COORDS[0], PARIS_COORDS[1]]);
    const result = calculateTripCarbonFootprint(acts, 1);
    expect(result.offsetCostUsd).toBeGreaterThanOrEqual(1);
  });

  it("includes a walking percentage eco tip when walkingKm > 0", () => {
    const acts = makeActivities(["walk", "transit", "walk"], PARIS_COORDS.slice(0, 3));
    const result = calculateTripCarbonFootprint(acts, 5);
    const hasTip = result.ecoTips.some((t) => t.includes("walking ratio"));
    expect(hasTip).toBe(true);
  });

  it("breakdown km values are non-negative", () => {
    const acts = makeActivities(["taxi", "walk", "transit"], PARIS_COORDS.slice(0, 3));
    const result = calculateTripCarbonFootprint(acts, 20);
    expect(result.breakdown.walkingKm).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.transitKm).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.drivingKm).toBeGreaterThanOrEqual(0);
  });
});
