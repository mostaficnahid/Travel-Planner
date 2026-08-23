import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ExpenseInputSchema } from "@/lib/schemas/trip";
import { requireSession, requireTripOwnership } from "@/lib/auth-guard";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authResult = await requireSession();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const ownershipResult = await requireTripOwnership(params.id, user.id);
  if (ownershipResult instanceof NextResponse) return ownershipResult;

  try {
    const body = await req.json();
    const validated = ExpenseInputSchema.parse(body);

    const expense = await db.expense.create({
      data: {
        tripId: params.id,
        category: validated.category,
        title: validated.title,
        amount: validated.amount,
        currency: validated.currency,
        isPlanned: validated.isPlanned,
        notes: validated.notes,
      },
    });

    return NextResponse.json({ success: true, data: expense }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create expense.";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
