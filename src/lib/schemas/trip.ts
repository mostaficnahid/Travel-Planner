import { z } from "zod";

export const TravelStyleEnum = z.enum([
  "budget",
  "balanced",
  "luxury",
  "backpacker",
  "family",
  "romantic",
  "adventure",
  "cultural",
  "food-focused",
  "photography",
  "digital nomad"
]);

export const BudgetFlexibilityEnum = z.enum(["strict", "balanced", "flexible"]);

export const TripConstraintsSchema = z.object({
  maxDailyWalkingKm: z.number().min(1).max(25).default(8),
  transportPreference: z.enum(["public", "walking", "taxi", "rental"]).default("public"),
  dietaryRestrictions: z.array(z.string()).default([]),
  accessibilityNeeds: z.array(z.string()).default([]),
  dayStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default("09:00"),
  dayEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default("21:00"),
});

export const CreateTripInputSchema = z.object({
  destination: z.string().min(2, "Destination is required"),
  country: z.string().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  travelerCount: z.number().int().min(1).max(20).default(1),
  budget: z.number().positive("Budget must be greater than 0"),
  currency: z.string().default("USD"),
  budgetFlexibility: BudgetFlexibilityEnum.default("balanced"),
  travelStyle: TravelStyleEnum.default("balanced"),
  interests: z.array(z.string()).min(1, "Select at least one interest"),
  constraints: TripConstraintsSchema.default({}),
});

export const ActivitySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(["sightseeing", "food", "accommodation", "transport", "outdoor", "cultural", "shopping", "relaxation"]).default("sightseeing"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  durationMinutes: z.number().int().positive(),
  estimatedCost: z.number().min(0),
  transportMode: z.enum(["walk", "transit", "taxi", "drive"]).default("walk"),
  lat: z.number(),
  lng: z.number(),
  address: z.string().optional(),
  priority: z.number().int().min(1).max(3).default(1),
  weatherSensitivity: z.enum(["outdoor", "indoor", "flexible"]).default("flexible"),
  openingHours: z.string().optional(),
  isCompleted: z.boolean().default(false),
});

export const ItineraryDaySchema = z.object({
  id: z.string().optional(),
  dayNumber: z.number().int().positive(),
  date: z.string(),
  theme: z.string().optional(),
  summary: z.string().optional(),
  estimatedCost: z.number().min(0),
  travelDistance: z.number().min(0),
  travelTime: z.number().min(0),
  activities: z.array(ActivitySchema),
});

export const GeneratedItinerarySchema = z.object({
  tripTitle: z.string(),
  summary: z.string(),
  destinationOverview: z.string(),
  totalEstimatedCost: z.number(),
  currency: z.string(),
  recommendedHotels: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      lat: z.number(),
      lng: z.number(),
      pricePerNight: z.number(),
      rating: z.number().optional(),
    })
  ).default([]),
  days: z.array(ItineraryDaySchema),
});

export const ExpenseInputSchema = z.object({
  category: z.enum(["accommodation", "transportation", "food", "activities", "shopping", "miscellaneous"]),
  title: z.string().min(1, "Expense title is required"),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("USD"),
  isPlanned: z.boolean().default(false),
  notes: z.string().optional(),
});

export const AIChatInputSchema = z.object({
  tripId: z.string().optional(),
  message: z.string().min(1, "Message cannot be empty"),
  conversationId: z.string().optional(),
});

export type CreateTripInput = z.infer<typeof CreateTripInputSchema>;
export type ActivityInput = z.infer<typeof ActivitySchema>;
export type ItineraryDayInput = z.infer<typeof ItineraryDaySchema>;
export type GeneratedItinerary = z.infer<typeof GeneratedItinerarySchema>;
export type ExpenseInput = z.infer<typeof ExpenseInputSchema>;

/**
 * PatchTripSchema — only allows safe, user-editable fields.
 * Critically EXCLUDES: userId, id, createdAt, updatedAt.
 * Used by PATCH /api/trips/:id to prevent mass-assignment attacks.
 */
export const PatchTripSchema = z.object({
  title: z.string().min(1).optional(),
  destination: z.string().min(2).optional(),
  country: z.string().optional(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  travelerCount: z.number().int().min(1).max(20).optional(),
  budget: z.number().positive().optional(),
  currency: z.string().optional(),
  budgetFlexibility: BudgetFlexibilityEnum.optional(),
  travelStyle: TravelStyleEnum.optional(),
  interestsJson: z.string().optional(),
  constraintsJson: z.string().optional(),
  status: z.enum(["draft", "planned", "active", "completed"]).optional(),
  coverImageUrl: z.string().url().optional(),
});

export type PatchTripInput = z.infer<typeof PatchTripSchema>;

