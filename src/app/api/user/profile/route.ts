import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const cleanEmail = session.user.email.trim().toLowerCase();

    const user = await db.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: "insensitive",
        },
      },
      include: {
        profile: true,
        preferences: true,
        trips: {
          select: {
            id: true,
            title: true,
            destination: true,
            budget: true,
            currency: true,
            startDate: true,
            endDate: true,
            days: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Calculate stats
    const totalTrips = user.trips.length;
    const totalDays = user.trips.reduce((acc, t) => acc + t.days.length, 0);
    const uniqueCountries = new Set(user.trips.map((t) => t.destination.split(",").pop()?.trim())).size;

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name || "",
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        hasPassword: !!user.passwordHash,
        profile: user.profile || {
          homeCurrency: "USD",
          passportCountry: "",
          bio: "",
        },
        preferences: user.preferences || {
          preferredTravelStyle: "balanced",
          maxDailyWalkingKm: 8,
          transportPreference: "public",
        },
        stats: {
          totalTrips,
          totalDays,
          uniqueCountries,
        },
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load profile";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const cleanEmail = session.user.email.trim().toLowerCase();
    const body = await req.json();
    const { name, bio, homeCurrency, passportCountry, preferredTravelStyle, maxDailyWalkingKm, currentPassword, newPassword } = body;

    const user = await db.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: "insensitive",
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Handle password update if provided
    let newPasswordHash = undefined;
    if (newPassword && newPassword.trim().length > 0) {
      if (user.passwordHash) {
        if (!currentPassword) {
          return NextResponse.json({ success: false, error: "Current password is required to set a new password." }, { status: 400 });
        }
        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
          return NextResponse.json({ success: false, error: "Current password is incorrect." }, { status: 400 });
        }
      }
      if (newPassword.length < 8) {
        return NextResponse.json({ success: false, error: "New password must be at least 8 characters long." }, { status: 400 });
      }
      newPasswordHash = await bcrypt.hash(newPassword, 12);
    }

    // Update user record
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(newPasswordHash && { passwordHash: newPasswordHash }),
        profile: {
          upsert: {
            create: {
              homeCurrency: homeCurrency || "USD",
              passportCountry: passportCountry || "",
              bio: bio || "",
            },
            update: {
              ...(homeCurrency !== undefined && { homeCurrency }),
              ...(passportCountry !== undefined && { passportCountry }),
              ...(bio !== undefined && { bio }),
            },
          },
        },
        preferences: {
          upsert: {
            create: {
              preferredTravelStyle: preferredTravelStyle || "balanced",
              maxDailyWalkingKm: maxDailyWalkingKm ? parseFloat(maxDailyWalkingKm) : 8.0,
            },
            update: {
              ...(preferredTravelStyle !== undefined && { preferredTravelStyle }),
              ...(maxDailyWalkingKm !== undefined && { maxDailyWalkingKm: parseFloat(maxDailyWalkingKm) }),
            },
          },
        },
      },
      include: {
        profile: true,
        preferences: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        profile: updatedUser.profile,
        preferences: updatedUser.preferences,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update profile";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
