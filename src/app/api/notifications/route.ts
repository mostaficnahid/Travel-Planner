import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth-guard";

/**
 * GET /api/notifications
 * Returns all unread notifications for the authenticated user, newest first.
 */
export async function GET() {
  const authResult = await requireSession();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({ success: true, data: notifications, unreadCount });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch notifications.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications
 * Mark all notifications as read for the authenticated user.
 */
export async function PATCH() {
  const authResult = await requireSession();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    await db.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, message: "All notifications marked as read." });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update notifications.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
