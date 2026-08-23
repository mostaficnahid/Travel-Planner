import { NextResponse } from "next/server";
import { toolsRegistry } from "@/lib/ai/tools";
import { db } from "@/lib/db";
import { requireSession, requireTripOwnership } from "@/lib/auth-guard";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authResult = await requireSession();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const ownershipResult = await requireTripOwnership(params.id, user.id);
  if (ownershipResult instanceof NextResponse) return ownershipResult;

  try {
    const result = await toolsRegistry.optimize_itinerary.execute({ tripId: params.id });

    const updatedTrip = await db.trip.findUnique({
      where: { id: params.id },
      include: {
        days: {
          orderBy: { dayNumber: "asc" },
          include: { activities: { orderBy: { startTime: "asc" } } },
        },
      },
    });

    return NextResponse.json({ success: true, optimization: result, data: updatedTrip });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Optimization failed.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
