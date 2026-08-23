import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  image?: string;
}

/**
 * Retrieves and validates the current NextAuth session.
 * Returns the session user if authenticated, or a 401 NextResponse.
 * Usage in API routes:
 *   const result = await requireSession();
 *   if (result instanceof NextResponse) return result;
 *   const { user } = result;
 */
export async function requireSession(): Promise<{ user: SessionUser } | NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, error: "Unauthorized — please sign in to continue." },
      { status: 401 }
    );
  }

  // Resolve or auto-create DB user from session identity
  let dbUser = await db.user.findUnique({ where: { email: session.user.email } });

  if (!dbUser) {
    dbUser = await db.user.create({
      data: {
        email: session.user.email,
        name: session.user.name || session.user.email.split("@")[0] || "Traveler",
        avatarUrl: session.user.image || null,
      },
    });
  }

  return {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name || "Traveler",
      image: dbUser.avatarUrl || undefined,
    },
  };
}

/**
 * Verifies that the authenticated user owns the specified trip.
 * Returns the trip if authorized, or a 403 NextResponse.
 */
export async function requireTripOwnership(
  tripId: string,
  userId: string
): Promise<{ tripId: string } | NextResponse> {
  const trip = await db.trip.findUnique({
    where: { id: tripId },
    select: { userId: true },
  });

  if (!trip) {
    return NextResponse.json(
      { success: false, error: "Trip not found." },
      { status: 404 }
    );
  }

  if (trip.userId !== userId) {
    return NextResponse.json(
      { success: false, error: "Forbidden — you do not have access to this trip." },
      { status: 403 }
    );
  }

  return { tripId };
}
