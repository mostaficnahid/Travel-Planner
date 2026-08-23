import { GeneratedItinerary, CreateTripInput, ActivityInput } from "@/lib/schemas/trip";
import { WeatherForecastDay } from "@/lib/services/weather";
import { searchPlaces } from "@/lib/services/places";

export interface ConstraintViolation {
  type: "budget" | "time_overlap" | "opening_hours" | "weather" | "pacing" | "geography";
  severity: "warning" | "error";
  message: string;
  dayNumber?: number;
  activityTitle?: string;
  suggestion?: string;
}

export interface ConstraintValidationResult {
  isValid: boolean;
  violations: ConstraintViolation[];
  sanitizedItinerary: GeneratedItinerary;
}

/**
 * Calculates straight line distance in km between two lat/lng coordinates (Haversine formula).
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Converts HH:mm string to total minutes from 00:00
 */
export function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.split(":");
  if (parts.length !== 2) return 0;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

/**
 * Converts total minutes back to HH:mm string format
 */
export function formatMinutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, minutes));
  const hrs = Math.floor(clamped / 60);
  const mins = clamped % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Validates and sanitizes a generated itinerary against user constraints and weather snapshots.
 */
export async function validateAndSanitizeItinerary(
  itinerary: GeneratedItinerary,
  userPreferences: CreateTripInput,
  weatherForecast: WeatherForecastDay[] = []
): Promise<ConstraintValidationResult> {
  const violations: ConstraintViolation[] = [];
  const sanitized: GeneratedItinerary = JSON.parse(JSON.stringify(itinerary));

  // 1. Budget Constraint Check
  let calculatedTotalCost = 0;
  for (const day of sanitized.days) {
    let dayCost = 0;
    for (const act of day.activities) {
      dayCost += act.estimatedCost || 0;
    }
    day.estimatedCost = dayCost;
    calculatedTotalCost += dayCost;
  }

  // Include hotel costs in total trip estimate if available
  const nights = Math.max(1, sanitized.days.length - 1);
  if (sanitized.recommendedHotels.length > 0) {
    const avgHotelNight = sanitized.recommendedHotels[0].pricePerNight || 0;
    calculatedTotalCost += avgHotelNight * nights;
  }

  sanitized.totalEstimatedCost = Math.round(calculatedTotalCost * 100) / 100;

  if (calculatedTotalCost > userPreferences.budget) {
    const overrun = Math.round(calculatedTotalCost - userPreferences.budget);
    violations.push({
      type: "budget",
      severity: userPreferences.budgetFlexibility === "strict" ? "error" : "warning",
      message: `Total estimated trip cost ($${sanitized.totalEstimatedCost}) exceeds allocated budget ($${userPreferences.budget}) by $${overrun}.`,
      suggestion: `Swap 1-2 high-cost activities for free attractions or select lower-budget dining options.`,
    });
  }

  // 2. Weather & Rainy Day Adaptation
  // We use an async-compatible approach: collect mutations as promises, then await all
  const weatherMutations: Promise<void>[] = [];

  sanitized.days.forEach((day, index) => {
    const forecast = weatherForecast[index];
    if (forecast && forecast.precipProbability >= 60) {
      // Rainy day — find real indoor venues as replacements
      weatherMutations.push(
        (async () => {
          // Fetch indoor venue suggestions for the destination
          const destination = userPreferences.destination;
          let indoorVenues: string[] = [];

          try {
            const results = await searchPlaces(destination, "museum");
            indoorVenues = results.slice(0, 10).map((r) => r.name);
          } catch {
            // Silently fall back to string-append if geocoding fails
          }

          let outdoorCount = 0;
          let venueIndex = 0;

          day.activities.forEach((act) => {
            if (act.weatherSensitivity === "outdoor") {
              outdoorCount++;
              act.weatherSensitivity = "indoor";

              if (indoorVenues[venueIndex]) {
                // Real venue substitution
                const venue = indoorVenues[venueIndex++];
                act.title = venue;
                act.description = `Substituted from outdoor plan due to ${forecast.precipProbability}% rain forecast. Enjoy this indoor attraction!`;
              } else {
                // Fallback: append note to original title
                act.title = `${act.title} (Indoor Alternative)`;
                act.description = `${act.description ?? ""} [Adapted for expected rain: ${forecast.precipProbability}% chance]`;
              }
            }
          });

          if (outdoorCount > 0) {
            violations.push({
              type: "weather",
              severity: "warning",
              dayNumber: day.dayNumber,
              message: `Day ${day.dayNumber} has a high rain forecast (${forecast.precipProbability}%). ${outdoorCount} outdoor activities were automatically swapped for indoor alternatives.`,
            });
          }
        })()
      );
    }
  });

  // Await all indoor venue lookups before continuing
  await Promise.all(weatherMutations);

  // 3. Time Overlaps & Transit Gap Verification
  sanitized.days.forEach((day) => {
    let dayDistance = 0;
    let dayTravelTime = 0;

    for (let i = 0; i < day.activities.length; i++) {
      const current = day.activities[i];
      const startMin = parseTimeToMinutes(current.startTime);
      const endMin = parseTimeToMinutes(current.endTime);

      // Verify start < end
      if (endMin <= startMin) {
        current.endTime = formatMinutesToTime(startMin + current.durationMinutes);
      }

      // Check distance & transit gap to next activity
      if (i < day.activities.length - 1) {
        const next = day.activities[i + 1];
        const distance = calculateDistanceKm(current.lat, current.lng, next.lat, next.lng);
        dayDistance += distance;

        // Estimate travel time: ~5 min per km for driving/transit, ~12 min per km walking
        const speedMinPerKm = current.transportMode === "walk" ? 12 : 4;
        const estimatedTransitMins = Math.max(10, Math.ceil(distance * speedMinPerKm));
        dayTravelTime += estimatedTransitMins;

        const currentEnd = parseTimeToMinutes(current.endTime);
        const nextStart = parseTimeToMinutes(next.startTime);

        if (nextStart < currentEnd + estimatedTransitMins) {
          violations.push({
            type: "time_overlap",
            severity: "warning",
            dayNumber: day.dayNumber,
            activityTitle: next.title,
            message: `Tight transit gap on Day ${day.dayNumber} between "${current.title}" and "${next.title}" (${distance} km distance requires ~${estimatedTransitMins} mins travel).`,
          });

          // Adjust next activity start time automatically
          const adjustedNextStart = currentEnd + estimatedTransitMins;
          next.startTime = formatMinutesToTime(adjustedNextStart);
          next.endTime = formatMinutesToTime(adjustedNextStart + next.durationMinutes);
        }
      }
    }

    day.travelDistance = Math.round(dayDistance * 10) / 10;
    day.travelTime = dayTravelTime;

    // 4. Energy & Pacing Validation (Max daily walking & activity overload)
    if (dayDistance > (userPreferences.constraints?.maxDailyWalkingKm || 10)) {
      violations.push({
        type: "pacing",
        severity: "warning",
        dayNumber: day.dayNumber,
        message: `Day ${day.dayNumber} involves ${day.travelDistance} km travel, exceeding your daily target of ${userPreferences.constraints?.maxDailyWalkingKm || 10} km.`,
        suggestion: `Consider using public transport or taxis between far locations.`,
      });
    }

    if (day.activities.length > 5) {
      violations.push({
        type: "pacing",
        severity: "warning",
        dayNumber: day.dayNumber,
        message: `Day ${day.dayNumber} has ${day.activities.length} packed activities with minimal rest breaks.`,
        suggestion: `Consider dropping optional activities to maintain a relaxed travel pace.`,
      });
    }
  });

  const hasErrors = violations.some((v) => v.severity === "error");

  return {
    isValid: !hasErrors,
    violations,
    sanitizedItinerary: sanitized,
  };
}
