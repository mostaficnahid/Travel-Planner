import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { geocodeDestination } from "@/lib/services/places";
import { requireSession, requireTripOwnership } from "@/lib/auth-guard";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authResult = await requireSession();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const ownershipResult = await requireTripOwnership(params.id, user.id);
  if (ownershipResult instanceof NextResponse) return ownershipResult;

  try {
    const body = await req.json();
    const { dayId, title, description, category, startTime, endTime, durationMinutes, estimatedCost, address } = body;

    if (!dayId || !title) {
      return NextResponse.json({ success: false, error: "Missing required fields: dayId and title" }, { status: 400 });
    }

    // Geocode address if provided
    const locationName = address || title;
    const coords = await geocodeDestination(locationName);

    const activity = await db.activity.create({
      data: {
        dayId,
        title,
        description: description || "",
        category: category || "sightseeing",
        startTime: startTime || "10:00",
        endTime: endTime || "12:00",
        durationMinutes: durationMinutes || 120,
        estimatedCost: parseFloat(estimatedCost) || 0,
        transportMode: "walk",
        lat: coords.lat,
        lng: coords.lng,
        address: address || "",
        priority: 2,
        weatherSensitivity: category === "outdoor" ? "outdoor" : "flexible",
      },
    });

    return NextResponse.json({ success: true, data: activity }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create activity.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
