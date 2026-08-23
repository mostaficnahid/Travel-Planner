import { CreateTripInput, GeneratedItinerary, GeneratedItinerarySchema } from "@/lib/schemas/trip";
import { getLiveWeatherForecast } from "@/lib/services/weather";
import { searchHotels, searchPlaces, geocodeDestination, type HotelSearchResult } from "@/lib/services/places";
import { validateAndSanitizeItinerary } from "@/lib/engine/constraints";
import { optimizeItineraryDay } from "@/lib/engine/optimizer";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Generates a full structured trip itinerary matching constraints for ANY of the 196 countries worldwide.
 */
export async function generateTripItinerary(
  input: CreateTripInput
): Promise<GeneratedItinerary> {
  const destination = input.destination;
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  const daysCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);

  // Dynamic geocoding for destination lat/lng
  const center = await geocodeDestination(destination);

  // 1. Fetch live weather & hotel facts
  const weatherForecast = await getLiveWeatherForecast(center.lat, center.lng, daysCount);
  const recommendedHotels = await searchHotels(destination, input.travelStyle);

  let rawItinerary: GeneratedItinerary;

  // Attempt Gemini LLM generation if API key is available
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      const prompt = `You are Travel Planner, an expert AI travel platform operating worldwide. Create a realistic ${daysCount}-day itinerary for ${destination}.
Travelers: ${input.travelerCount}, Total Budget: $${input.budget} ${input.currency}, Travel Style: ${input.travelStyle}.
Interests: ${input.interests.join(", ")}.
Destination latitude: ${center.lat}, longitude: ${center.lng}.
Return strictly valid JSON matching this structure:
{
  "tripTitle": "${daysCount}-Day Journey across ${destination}",
  "summary": "High level trip summary for ${destination}...",
  "destinationOverview": "Overview of ${destination}...",
  "totalEstimatedCost": 0,
  "currency": "${input.currency}",
  "recommendedHotels": [],
  "days": [
    {
      "dayNumber": 1,
      "date": "${start.toISOString().split("T")[0]}",
      "theme": "Theme of the day in ${destination}",
      "summary": "Summary...",
      "estimatedCost": 150,
      "travelDistance": 5,
      "travelTime": 30,
      "activities": [
        {
          "title": "Activity in ${destination}",
          "description": "Description...",
          "category": "sightseeing",
          "startTime": "09:00",
          "endTime": "11:00",
          "durationMinutes": 120,
          "estimatedCost": 25,
          "transportMode": "walk",
          "lat": ${center.lat},
          "lng": ${center.lng},
          "weatherSensitivity": "outdoor"
        }
      ]
    }
  ]
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);
      rawItinerary = GeneratedItinerarySchema.parse(parsed);
    } catch (e) {
      console.warn("Gemini generation failed, using smart fallback generator:", e);
      rawItinerary = await generateSmartFallbackItinerary(input, daysCount, recommendedHotels, center);
    }
  } else {
    // No API key configured — use the deterministic 196-country fallback
    if (process.env.NODE_ENV !== "production") {
      console.info("No GEMINI_API_KEY found. Using smart fallback itinerary generator.");
    }
    rawItinerary = await generateSmartFallbackItinerary(input, daysCount, recommendedHotels, center);
  }


  // 2. Run deterministic 2-Opt Route Optimization on daily activities
  rawItinerary.days = rawItinerary.days.map((day) =>
    optimizeItineraryDay(day, input.constraints?.dayStartTime || "09:00")
  );

  // 3. Run Constraint Engine Validation (Budget check, rainy day indoor swap, overlap fix)
  const validation = await validateAndSanitizeItinerary(rawItinerary, input, weatherForecast);

  return validation.sanitizedItinerary;
}

/**
 * Dynamic fallback generator supporting all 196 countries worldwide.
 */
async function generateSmartFallbackItinerary(
  input: CreateTripInput,
  daysCount: number,
  recommendedHotels: HotelSearchResult[],
  center: { lat: number; lng: number }
): Promise<GeneratedItinerary> {
  const dest = input.destination;
  const startDate = new Date(input.startDate);

  const days = Array.from({ length: daysCount }).map((_, dIdx) => {
    const dDate = new Date(startDate);
    dDate.setDate(dDate.getDate() + dIdx);
    const dateStr = dDate.toISOString().split("T")[0];

    const isFirstDay = dIdx === 0;
    const theme = isFirstDay
      ? `Arrival & Historic Heart of ${dest}`
      : dIdx === 1
      ? `Cultural Treasures & Culinary Exploration in ${dest}`
      : `Scenic Landscapes & Local Secrets of ${dest}`;

    return {
      dayNumber: dIdx + 1,
      date: dateStr,
      theme,
      summary: `Immerse in top attractions, local heritage, and authentic dining across ${dest}.`,
      estimatedCost: Math.round(input.budget / (daysCount + 1)),
      travelDistance: 4.5,
      travelTime: 35,
      activities: [
        {
          title: `Morning Discovery at ${dest} Historic Landmark`,
          description: `Begin the day discovering iconic architecture, vibrant plazas, and culture in ${dest}.`,
          category: "sightseeing" as const,
          startTime: "09:30",
          endTime: "11:30",
          durationMinutes: 120,
          estimatedCost: 15,
          transportMode: "walk" as const,
          lat: center.lat + (dIdx * 0.004) + 0.001,
          lng: center.lng + (dIdx * 0.004) + 0.002,
          address: `Central Heritage Square, ${dest}`,
          priority: 1,
          weatherSensitivity: "outdoor" as const,
          isCompleted: false,
        },
        {
          title: `Authentic Local Dining & Tasting in ${dest}`,
          description: `Savor culinary specialties and local delicacies tailored for your ${input.travelStyle} travel style.`,
          category: "food" as const,
          startTime: "12:00",
          endTime: "13:30",
          durationMinutes: 90,
          estimatedCost: 30,
          transportMode: "walk" as const,
          lat: center.lat + (dIdx * 0.004) + 0.003,
          lng: center.lng + (dIdx * 0.004) + 0.004,
          address: `Culinary Quarter, ${dest}`,
          priority: 1,
          weatherSensitivity: "indoor" as const,
          isCompleted: false,
        },
        {
          title: `${dest} National Museum & Art Center`,
          description: `Explore world-class exhibitions, historical masterworks, and regional art.`,
          category: "cultural" as const,
          startTime: "14:00",
          endTime: "16:30",
          durationMinutes: 150,
          estimatedCost: 25,
          transportMode: "transit" as const,
          lat: center.lat + (dIdx * 0.004) + 0.007,
          lng: center.lng + (dIdx * 0.004) - 0.003,
          address: `Museum Avenue, ${dest}`,
          priority: 2,
          weatherSensitivity: "indoor" as const,
          isCompleted: false,
        },
        {
          title: `Sunset Viewpoint & Waterfront Stroll in ${dest}`,
          description: `Wrap up your day with breathtaking panoramic views and a relaxed evening walk.`,
          category: "outdoor" as const,
          startTime: "17:30",
          endTime: "19:30",
          durationMinutes: 120,
          estimatedCost: 0,
          transportMode: "walk" as const,
          lat: center.lat + (dIdx * 0.004) - 0.002,
          lng: center.lng + (dIdx * 0.004) + 0.006,
          address: `Promenade & Viewpoint, ${dest}`,
          priority: 2,
          weatherSensitivity: "outdoor" as const,
          isCompleted: false,
        },
      ],
    };
  });

  return {
    tripTitle: `${daysCount}-Day ${input.travelStyle.toUpperCase()} Experience in ${dest}`,
    summary: `A personalized ${daysCount}-day itinerary exploring ${dest} built strictly around your budget of $${input.budget} ${input.currency}.`,
    destinationOverview: `${dest} is a world-class travel destination offering rich history, beautiful landscapes, vibrant local markets, and memorable hospitality.`,
    totalEstimatedCost: Math.round(input.budget * 0.85),
    currency: input.currency,
    recommendedHotels,
    days,
  };
}
