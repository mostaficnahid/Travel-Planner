import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PatchTripSchema } from "@/lib/schemas/trip";
import { requireSession, requireTripOwnership } from "@/lib/auth-guard";

// GET /api/trips/:id
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authResult = await requireSession();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const ownershipResult = await requireTripOwnership(params.id, user.id);
  if (ownershipResult instanceof NextResponse) return ownershipResult;

  try {
    const trip = await db.trip.findUnique({
      where: { id: params.id },
      include: {
        days: {
          orderBy: { dayNumber: "asc" },
          include: {
            activities: {
              orderBy: { startTime: "asc" },
            },
          },
        },
        expenses: { orderBy: { date: "desc" } },
        budgetDetails: true,
        weatherSnapshots: true,
      },
    });

    if (!trip) {
      return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: trip });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// PATCH /api/trips/:id
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authResult = await requireSession();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const ownershipResult = await requireTripOwnership(params.id, user.id);
  if (ownershipResult instanceof NextResponse) return ownershipResult;

  try {
    const body = await req.json();
    // Validate & restrict updateable fields — prevents mass-assignment attacks
    const validated = PatchTripSchema.parse(body);

    const updated = await db.trip.update({
      where: { id: params.id },
      data: validated,
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Update failed.";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}

// DELETE /api/trips/:id
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const authResult = await requireSession();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const ownershipResult = await requireTripOwnership(params.id, user.id);
  if (ownershipResult instanceof NextResponse) return ownershipResult;

  try {
    await db.trip.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: "Trip deleted successfully" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
