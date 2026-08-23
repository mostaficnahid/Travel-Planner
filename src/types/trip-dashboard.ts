/**
 * Shared Prisma-compatible prop types for dashboard components.
 * These match the shapes returned by db.trip.findUnique({ include: ... })
 * so we can avoid `as any` casts in the trip dashboard page.
 *
 * NOTE: Date fields from Prisma come as `Date` objects on the server;
 * where components expect strings, we coerce them in the page.
 */

export interface ActivityRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  estimatedCost: number;
  transportMode: string;
  lat: number;
  lng: number;
  address: string | null;
  priority: number;
  weatherSensitivity: string;
  isCompleted: boolean;
}

/** ItineraryTimeline expects `date` as string (ISO) and `theme`/`summary` as optional strings */
export interface TimelineDayShape {
  id: string;
  dayNumber: number;
  date: string;                // ISO string: "2026-08-15"
  theme?: string;              // undefined — not null (component type)
  summary?: string;
  estimatedCost: number;
  travelDistance: number;
  travelTime: number;
  activities: TimelineActivityShape[];
}

/** Activity shape matching ItineraryTimeline's internal interface */
export interface TimelineActivityShape {
  id: string;
  title: string;
  description?: string;
  category: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  estimatedCost: number;
  transportMode: string;
  lat: number;
  lng: number;
  address?: string;
  weatherSensitivity: string;
  isCompleted?: boolean;
}

/** Activity shape matching AddActivityModal's days selector */
export interface AddActivityDayShape {
  id: string;
  dayNumber: number;
  theme?: string;
}

/** Activity shape matching TripMap's internal interface */
export interface MapActivityShape {
  id: string;
  title: string;
  lat: number;
  lng: number;
  startTime: string;
  category: string;
  address?: string;
}

/** Activity shape matching LiveTripMode's internal interface */
export interface LiveModeActivityShape {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  lat: number;
  lng: number;
  address?: string;
  transportMode: string;
}

/** Expense shape — date as Date from Prisma, converted to string for BudgetTracker */
export interface ExpenseRow {
  id: string;
  category: string;
  title: string;
  amount: number;
  currency: string;
  isPlanned: boolean;
  date: string;  // BudgetTracker expects string
}

export interface BudgetRow {
  id: string;
  tripId: string;
  totalPlanned: number;
  accommodationBudget: number;
  transportBudget: number;
  foodBudget: number;
  activitiesBudget: number;
  shoppingBudget: number;
  miscBudget: number;
}
