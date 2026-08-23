import { ActivityInput, ItineraryDayInput } from "@/lib/schemas/trip";
import { calculateDistanceKm, parseTimeToMinutes, formatMinutesToTime } from "@/lib/engine/constraints";

/**
 * Calculates total tour distance for an array of activities.
 */
function calculateTotalTourDistance(activities: ActivityInput[]): number {
  let dist = 0;
  for (let i = 0; i < activities.length - 1; i++) {
    dist += calculateDistanceKm(
      activities[i].lat,
      activities[i].lng,
      activities[i + 1].lat,
      activities[i + 1].lng
    );
  }
  return dist;
}

/**
 * Performs 2-Opt swap optimization on an array of activities to minimize geographic distance.
 */
export function optimize2OptRoute(activities: ActivityInput[]): ActivityInput[] {
  if (activities.length <= 3) return activities; // Small tours don't need 2-opt

  let bestRoute = [...activities];
  let bestDistance = calculateTotalTourDistance(bestRoute);
  let improved = true;
  let iterations = 0;
  const MAX_ITERATIONS = 50;

  while (improved && iterations < MAX_ITERATIONS) {
    improved = false;
    iterations++;

    for (let i = 0; i < bestRoute.length - 1; i++) {
      for (let k = i + 1; k < bestRoute.length; k++) {
        // Create 2-opt swap
        const newRoute = twoOptSwap(bestRoute, i, k);
        const newDistance = calculateTotalTourDistance(newRoute);

        if (newDistance < bestDistance - 0.05) {
          bestDistance = newDistance;
          bestRoute = newRoute;
          improved = true;
        }
      }
    }
  }

  return bestRoute;
}

/**
 * Reverses segment from index i to k
 */
function twoOptSwap(route: ActivityInput[], i: number, k: number): ActivityInput[] {
  const newRoute = route.slice(0, i);
  const reversedSegment = route.slice(i, k + 1).reverse();
  const rest = route.slice(k + 1);
  return [...newRoute, ...reversedSegment, ...rest];
}

/**
 * Recalculates start and end times for a reordered list of daily activities.
 */
export function resequenceDailySchedule(
  activities: ActivityInput[],
  dayStartTimeStr: string = "09:00"
): ActivityInput[] {
  let currentMinutes = parseTimeToMinutes(dayStartTimeStr);

  return activities.map((act, index) => {
    // If not first activity, calculate travel transit time from previous activity
    if (index > 0) {
      const prev = activities[index - 1];
      const dist = calculateDistanceKm(prev.lat, prev.lng, act.lat, act.lng);
      // Use transport-mode-aware speed
      const minsPerKm = act.transportMode === "walk" ? 12 : act.transportMode === "transit" ? 5 : 4;
      const transitMins = Math.max(10, Math.ceil(dist * minsPerKm));
      currentMinutes += transitMins;
    }

    const startTime = formatMinutesToTime(currentMinutes);
    const endTime = formatMinutesToTime(currentMinutes + act.durationMinutes);
    currentMinutes += act.durationMinutes;

    return {
      ...act,
      startTime,
      endTime,
    };
  });
}

/**
 * Priority-aware 2-Opt optimization for a single itinerary day.
 *
 * Strategy:
 *  1. Extract priority-1 (anchor) activities — their relative order is preserved.
 *  2. Run 2-Opt only on priority-2/3 (flexible) activities.
 *  3. Merge: anchors stay in their original day-position slots; flexible activities
 *     fill the gaps. This ensures must-do activities (shows, check-ins) are never reordered.
 *  4. Resequence timestamps for the merged result.
 */
export function optimizeItineraryDay(
  day: ItineraryDayInput,
  dayStartTimeStr: string = "09:00"
): ItineraryDayInput {
  if (day.activities.length <= 2) return day;

  // Separate anchors (priority 1) from flexible activities (priority 2 & 3)
  const anchors: Array<{ index: number; activity: ActivityInput }> = [];
  const flexible: ActivityInput[] = [];

  day.activities.forEach((act, originalIndex) => {
    if (act.priority === 1) {
      anchors.push({ index: originalIndex, activity: act });
    } else {
      flexible.push(act);
    }
  });

  // Run 2-Opt only on flexible activities
  const optimizedFlexible = flexible.length > 3
    ? optimize2OptRoute(flexible)
    : flexible;

  // Reconstruct merged array: anchors at their original relative positions, flexible fills gaps
  const total = day.activities.length;
  const anchorIndices = new Set(anchors.map((a) => a.index));
  const merged: ActivityInput[] = new Array(total);

  // Place anchors first
  anchors.forEach(({ index, activity }) => {
    merged[index] = activity;
  });

  // Fill non-anchor slots with optimized flexible activities in order
  let flexCursor = 0;
  for (let i = 0; i < total; i++) {
    if (!anchorIndices.has(i)) {
      if (flexCursor < optimizedFlexible.length) {
        merged[i] = optimizedFlexible[flexCursor++];
      }
    }
  }

  // Resequence timestamps to ensure valid sequence without overlaps
  const resequenced = resequenceDailySchedule(merged, dayStartTimeStr);

  // Recalculate day-level metrics
  let totalDistance = 0;
  let totalTravelMinutes = 0;

  for (let i = 0; i < resequenced.length - 1; i++) {
    const dist = calculateDistanceKm(
      resequenced[i].lat,
      resequenced[i].lng,
      resequenced[i + 1].lat,
      resequenced[i + 1].lng
    );
    totalDistance += dist;
    const minsPerKm = resequenced[i + 1].transportMode === "walk" ? 12 : 5;
    totalTravelMinutes += Math.max(10, Math.ceil(dist * minsPerKm));
  }

  return {
    ...day,
    travelDistance: Math.round(totalDistance * 10) / 10,
    travelTime: totalTravelMinutes,
    activities: resequenced,
  };
}
