import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession, requireTripOwnership } from "@/lib/auth-guard";

const InviteSchema = z.object({
  email: z.string().email("A valid email address is required"),
  permission: z.enum(["view", "edit", "admin"]).default("edit"),
});

/**
 * GET /api/trips/:id/collaborators
 * Returns all collaborators on this trip (owner only).
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authResult = await requireSession();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const ownershipResult = await requireTripOwnership(params.id, user.id);
  if (ownershipResult instanceof NextResponse) return ownershipResult;

  try {
    const collaborators = await db.tripCollaborator.findMany({
      where: { tripId: params.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: collaborators });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch collaborators.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * POST /api/trips/:id/collaborators
 * Invites a user by email to collaborate on the trip (owner only).
 * Creates a Notification for the invited user.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authResult = await requireSession();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const ownershipResult = await requireTripOwnership(params.id, user.id);
  if (ownershipResult instanceof NextResponse) return ownershipResult;

  try {
    const body = await req.json();
    const { email, permission } = InviteSchema.parse(body);

    // Resolve the invited user
    const invitee = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (!invitee) {
      return NextResponse.json(
        { success: false, error: `No account found for ${email}. They must register first.` },
        { status: 404 }
      );
    }

    // Prevent re-inviting an existing collaborator
    const existing = await db.tripCollaborator.findFirst({
      where: { tripId: params.id, userId: invitee.id },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `${email} is already a collaborator on this trip.` },
        { status: 409 }
      );
    }

    // Prevent inviting yourself
    if (invitee.id === user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot invite yourself as a collaborator." },
        { status: 400 }
      );
    }

    // Fetch trip title for the notification message
    const trip = await db.trip.findUnique({
      where: { id: params.id },
      select: { title: true },
    });

    // Create collaborator + notification atomically
    const [collaborator] = await db.$transaction([
      db.tripCollaborator.create({
        data: {
          tripId: params.id,
          userId: invitee.id,
          permission,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      }),
      db.notification.create({
        data: {
          userId: invitee.id,
          title: "🗺️ Trip Collaboration Invite",
          message: `${user.name} has invited you to collaborate on "${trip?.title ?? "a trip"}" with ${permission} access.`,
        },
      }),
    ]);

    return NextResponse.json({ success: true, data: collaborator }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: err.errors[0].message }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : "Failed to add collaborator.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/trips/:id/collaborators?userId=xxx
 * Removes a collaborator from the trip (owner only).
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const authResult = await requireSession();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const ownershipResult = await requireTripOwnership(params.id, user.id);
  if (ownershipResult instanceof NextResponse) return ownershipResult;

  try {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "userId query param is required." }, { status: 400 });
    }

    await db.tripCollaborator.deleteMany({
      where: { tripId: params.id, userId: targetUserId },
    });

    return NextResponse.json({ success: true, message: "Collaborator removed successfully." });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to remove collaborator.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
