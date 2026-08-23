import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CreateTripInputSchema } from "@/lib/schemas/trip";
import { generateTripItinerary } from "@/lib/ai/orchestrator";
import { requireSession } from "@/lib/auth-guard";

// GET /api/trips — List authenticated user's trips with optional pagination
// Query params: ?page=1&limit=12
export async function GET(req: Request) {
  const authResult = await requireSession();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10)));
    const skip = (page - 1) * limit;

    const [trips, total] = await Promise.all([
      db.trip.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          days: { include: { activities: true } },
          expenses: true,
          budgetDetails: true,
        },
      }),
      db.trip.count({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({
      success: true,
      data: trips,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch trips.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/trips — Create trip & generate AI itinerary
export async function POST(req: Request) {
  const authResult = await requireSession();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const body = await req.json();
    const validated = CreateTripInputSchema.parse(body);

    // Build a destination-specific Unsplash cover image URL
    const destinationSlug = encodeURIComponent(
      `${validated.destination} ${validated.country || ""} travel landmark`.trim()
    );
    const coverImageUrl = `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&auto=format&fit=crop&q=80&ixid=${Date.now()}`;
    // Use a curated set of destination-tagged images that vary by destination name hash
    const destinationImages: Record<string, string> = {
      paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&auto=format&fit=crop&q=80",
      tokyo: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&auto=format&fit=crop&q=80",
      london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&auto=format&fit=crop&q=80",
      "new york": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&auto=format&fit=crop&q=80",
      dhaka: "https://images.unsplash.com/photo-1608958435020-e8a7109ba809?w=1200&auto=format&fit=crop&q=80",
      rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&auto=format&fit=crop&q=80",
      sydney: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&auto=format&fit=crop&q=80",
      rio: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1200&auto=format&fit=crop&q=80",
      dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&auto=format&fit=crop&q=80",
      barcelona: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1200&auto=format&fit=crop&q=80",
      bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&auto=format&fit=crop&q=80",
      bangkok: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&auto=format&fit=crop&q=80",
      singapore: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&auto=format&fit=crop&q=80",
      istanbul: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=1200&auto=format&fit=crop&q=80",
      amsterdam: "https://images.unsplash.com/photo-1534351590666-13e3e96b5702?w=1200&auto=format&fit=crop&q=80",
      berlin: "https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=1200&auto=format&fit=crop&q=80",
      prague: "https://images.unsplash.com/photo-1592906209472-a36b1f3782ef?w=1200&auto=format&fit=crop&q=80",
      kyoto: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop&q=80",
      seoul: "https://images.unsplash.com/photo-1601621915196-2621bfb0cd6e?w=1200&auto=format&fit=crop&q=80",
      cairo: "https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=1200&auto=format&fit=crop&q=80",
    };

    const destKey = validated.destination.toLowerCase();
    const resolvedCover =
      Object.entries(destinationImages).find(([key]) => destKey.includes(key))?.[1] ||
      `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&auto=format&fit=crop&q=80`;

    // 1. Create main trip record
    const trip = await db.trip.create({
      data: {
        userId: user.id,
        title: `${validated.destination} Expedition`,
        destination: validated.destination,
        country: validated.country || "International",
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
        travelerCount: validated.travelerCount,
        budget: validated.budget,
        currency: validated.currency,
        budgetFlexibility: validated.budgetFlexibility,
        travelStyle: validated.travelStyle,
        interestsJson: JSON.stringify(validated.interests),
        constraintsJson: JSON.stringify(validated.constraints),
        status: "planned",
        coverImageUrl: resolvedCover,
      },
    });

    // 2. Generate itinerary via AI Orchestrator + Constraint Engine + 2-Opt Optimizer
    const generated = await generateTripItinerary(validated);

    // 3. Persist days & activities into DB
    for (const day of generated.days) {
      const createdDay = await db.itineraryDay.create({
        data: {
          tripId: trip.id,
          dayNumber: day.dayNumber,
          date: new Date(day.date),
          theme: day.theme,
          summary: day.summary,
          estimatedCost: day.estimatedCost,
          travelDistance: day.travelDistance,
          travelTime: day.travelTime,
        },
      });

      for (const act of day.activities) {
        await db.activity.create({
          data: {
            dayId: createdDay.id,
            title: act.title,
            description: act.description,
            category: act.category,
            startTime: act.startTime,
            endTime: act.endTime,
            durationMinutes: act.durationMinutes,
            estimatedCost: act.estimatedCost,
            transportMode: act.transportMode,
            lat: act.lat,
            lng: act.lng,
            address: act.address,
            priority: act.priority || 1,
            weatherSensitivity: act.weatherSensitivity || "flexible",
          },
        });
      }
    }

    // 4. Create budget breakdown
    await db.budget.create({
      data: {
        tripId: trip.id,
        totalPlanned: generated.totalEstimatedCost,
        accommodationBudget: Math.round(validated.budget * 0.35),
        foodBudget: Math.round(validated.budget * 0.25),
        transportBudget: Math.round(validated.budget * 0.15),
        activitiesBudget: Math.round(validated.budget * 0.15),
        shoppingBudget: Math.round(validated.budget * 0.05),
        miscBudget: Math.round(validated.budget * 0.05),
      },
    });

    const fullTrip = await db.trip.findUnique({
      where: { id: trip.id },
      include: {
        days: { include: { activities: true } },
        budgetDetails: true,
      },
    });

    // Fire-and-forget notification (non-blocking)
    db.notification.create({
      data: {
        userId: user.id,
        title: "🗺️ Your itinerary is ready!",
        message: `"${trip.title}" has been generated with ${generated.days.length} days and a ${validated.currency} ${validated.budget.toLocaleString()} budget.`,
      },
    }).catch(() => { /* silently ignore notification errors */ });

    return NextResponse.json({ success: true, data: fullTrip }, { status: 201 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Trip creation failed.";
    console.error("Trip creation failed:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
