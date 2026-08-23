export interface CarbonFootprintResult {
  totalCo2Kg: number;
  ecoScore: "A+" | "A" | "B" | "C";
  breakdown: {
    walkingKm: number;
    transitKm: number;
    drivingKm: number;
  };
  offsetCostUsd: number;
  ecoTips: string[];
}

interface ActivityTransport {
  transportMode: string;
  lat: number;
  lng: number;
}

/** Haversine distance in km between two coordinates */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calculates environmental carbon footprint for a trip.
 *
 * Previously used a fixed 40/40/20 split regardless of actual activity transport
 * modes. This version computes the real per-leg distance using coordinates and
 * classifies each leg by the *next* activity's transport mode (how you got there).
 *
 * CO₂ emission factors (ICCT 2023):
 *   Walking / cycling:  0.000 kg CO₂/km
 *   Public transit:     0.040 kg CO₂/km  (avg bus/metro)
 *   Taxi / rideshare:   0.150 kg CO₂/km  (petrol car)
 *   Self-drive rental:  0.170 kg CO₂/km  (petrol car, solo)
 */
export function calculateTripCarbonFootprint(
  activities: ActivityTransport[],
  totalDistanceKm: number
): CarbonFootprintResult {
  let walkingKm = 0;
  let transitKm = 0;
  let drivingKm = 0;

  if (activities.length >= 2) {
    // Compute real per-leg distances and classify by transport mode
    for (let i = 0; i < activities.length - 1; i++) {
      const curr = activities[i];
      const next = activities[i + 1];
      const legDist = haversineKm(curr.lat, curr.lng, next.lat, next.lng);

      // The "next" activity's transportMode is how the traveler gets to it
      const mode = next.transportMode?.toLowerCase() ?? "walk";

      if (mode === "walk") {
        walkingKm += legDist;
      } else if (mode === "transit") {
        transitKm += legDist;
      } else {
        // "taxi" | "drive" | anything else
        drivingKm += legDist;
      }
    }
  } else {
    // Fallback when there are fewer than 2 activities: use totalDistanceKm
    // with a conservative 50/30/20 split (more walking than the old 40/40/20)
    walkingKm = Math.round(totalDistanceKm * 0.5 * 10) / 10;
    transitKm = Math.round(totalDistanceKm * 0.3 * 10) / 10;
    drivingKm = Math.round(totalDistanceKm * 0.2 * 10) / 10;
  }

  // Round to 1 decimal
  walkingKm = Math.round(walkingKm * 10) / 10;
  transitKm = Math.round(transitKm * 10) / 10;
  drivingKm = Math.round(drivingKm * 10) / 10;

  // CO₂ calculation
  const co2Transit = transitKm * 0.04;   // kg/km avg bus+metro
  const co2Driving = drivingKm * 0.16;   // kg/km avg taxi/rental (petrol)
  const totalCo2 = Math.round((co2Transit + co2Driving) * 10) / 10;

  // Eco score thresholds (based on typical 7-day trip benchmarks)
  let ecoScore: "A+" | "A" | "B" | "C" = "A+";
  if (totalCo2 > 35) ecoScore = "C";
  else if (totalCo2 > 20) ecoScore = "B";
  else if (totalCo2 > 8) ecoScore = "A";

  // Carbon offset price: ~$0.02 per kg CO₂ (voluntary carbon market avg)
  const offsetCost = Math.round(totalCo2 * 0.02 * 100) / 100;

  // Contextual eco tips
  const ecoTips: string[] = [];
  if (drivingKm > walkingKm && drivingKm > 0) {
    const savingKg = Math.round((drivingKm * 0.16 - drivingKm * 0.04) * 10) / 10;
    ecoTips.push(
      `Swapping ${drivingKm} km of taxi rides for public transit could save ~${savingKg} kg CO₂ (~$${Math.round(savingKg * 0.02 * 100) / 100} offset cost).`
    );
  }
  if (walkingKm > 0) {
    const walkPct = Math.round((walkingKm / Math.max(walkingKm + transitKm + drivingKm, 0.1)) * 100);
    ecoTips.push(`Your walking ratio is ${walkPct}% — zero-emission legs like these make a real difference!`);
  }
  if (ecoScore === "A+" || ecoScore === "A") {
    ecoTips.push("Great eco-conscious planning! Your trip is well below the average tourist carbon footprint.");
  }

  return {
    totalCo2Kg: totalCo2,
    ecoScore,
    breakdown: { walkingKm, transitKm, drivingKm },
    offsetCostUsd: Math.max(1, offsetCost),
    ecoTips,
  };
}
