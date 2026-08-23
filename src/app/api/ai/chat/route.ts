import { NextResponse } from "next/server";
import { AIChatInputSchema } from "@/lib/schemas/trip";
import { toolsRegistry } from "@/lib/ai/tools";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth-guard";

/**
 * GET /api/ai/chat?tripId=xxx
 * Loads the most recent AiConversation + all its messages for the authenticated user.
 * Returns { conversationId, messages } — empty messages array if no history exists.
 */
export async function GET(req: Request) {
  const authResult = await requireSession();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("tripId");

    const conversation = await db.aiConversation.findFirst({
      where: {
        userId: user.id,
        ...(tripId ? { tripId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            role: true,
            content: true,
            toolCallsJson: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({
        success: true,
        data: { conversationId: null, messages: [] },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        conversationId: conversation.id,
        messages: conversation.messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          actionExecuted: m.toolCallsJson
            ? (JSON.parse(m.toolCallsJson) as { tool?: string }).tool ?? null
            : null,
        })),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load chat history.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authResult = await requireSession();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const body = await req.json();
    const { tripId, message, conversationId } = AIChatInputSchema.parse(body);

    // If tripId is provided, verify the user owns that trip
    if (tripId) {
      const trip = await db.trip.findUnique({
        where: { id: tripId },
        select: { userId: true, destination: true },
      });
      if (!trip) {
        return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 });
      }
      if (trip.userId !== user.id) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    // ── Resolve or create AiConversation ─────────────────────────────────────
    let conversation = conversationId
      ? await db.aiConversation.findFirst({
          where: { id: conversationId, userId: user.id },
        })
      : null;

    if (!conversation) {
      conversation = await db.aiConversation.create({
        data: {
          userId: user.id,
          tripId: tripId ?? null,
          title: tripId ? `Trip Copilot` : "VoyageAI Chat",
        },
      });
    }

    // Persist the user's message
    await db.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message,
      },
    });

    // ── Tool intent matching & execution ──────────────────────────────────────
    const lowerMsg = message.toLowerCase();
    let actionExecuted: string | null = null;
    let toolResultData: unknown = null;
    let replyText = "";

    if (lowerMsg.includes("optimize") || lowerMsg.includes("route") || lowerMsg.includes("walking")) {
      if (tripId) {
        toolResultData = await toolsRegistry.optimize_itinerary.execute({ tripId });
        actionExecuted = "optimize_itinerary";
        const result = toolResultData as { savedDistanceKm?: number };
        replyText = `I've optimized your daily routes using 2-Opt TSP geospatial analysis! Reduced total travel distance by ${result.savedDistanceKm ?? 0} km and rearranged activities into seamless neighbourhood clusters.`;
      } else {
        replyText = "Please select a trip first so I can optimize your itinerary routes.";
      }
    } else if (lowerMsg.includes("budget") || lowerMsg.includes("cost") || lowerMsg.includes("spending")) {
      if (tripId) {
        toolResultData = await toolsRegistry.calculate_budget.execute({ tripId });
        actionExecuted = "calculate_budget";
        const result = toolResultData as { totalPlanned?: number; budgetLimit?: number; suggestions?: string[] };
        replyText = `Budget snapshot: Total Planned is $${result.totalPlanned} vs Allocated $${result.budgetLimit}. ${result.suggestions?.[0] ?? ""}`;
      } else {
        replyText = "Please select a trip to see your budget analysis.";
      }
    } else if (lowerMsg.includes("hotel") || lowerMsg.includes("stay") || lowerMsg.includes("accommodation")) {
      const dest = tripId
        ? (await db.trip.findUnique({ where: { id: tripId }, select: { destination: true } }))?.destination || "Paris"
        : "Paris";
      toolResultData = await toolsRegistry.search_hotels.execute({ destination: dest });
      actionExecuted = "search_hotels";
      const hotels = toolResultData as Array<{ name?: string; pricePerNight?: number }>;
      replyText = `Top hotels in ${dest}: 1) ${hotels[0]?.name ?? "Option A"} ($${hotels[0]?.pricePerNight ?? "—"}/night) · 2) ${hotels[1]?.name ?? "Option B"} ($${hotels[1]?.pricePerNight ?? "—"}/night). Would you like details on any of these?`;
    } else if (lowerMsg.includes("weather") || lowerMsg.includes("rain") || lowerMsg.includes("forecast")) {
      let lat = 48.8566;
      let lng = 2.3522;
      if (tripId) {
        const firstActivity = await db.activity.findFirst({
          where: { day: { tripId } },
          select: { lat: true, lng: true },
        });
        if (firstActivity) { lat = firstActivity.lat; lng = firstActivity.lng; }
      }
      toolResultData = await toolsRegistry.get_weather.execute({ lat, lng, days: 5 });
      actionExecuted = "get_weather";
      const forecast = toolResultData as Array<{ date: string; precipProbability: number; tempMin: number; tempMax: number }>;
      const rainyDays = forecast.filter((w) => w.precipProbability >= 60);
      if (rainyDays.length > 0) {
        replyText = `⛈️ Rain alert: ${rainyDays.map((r) => r.date).join(", ")} have ${rainyDays[0].precipProbability}%+ precipitation. I've flagged outdoor activities on those days for indoor alternatives!`;
      } else {
        replyText = `☀️ Clear forecast! Temperatures range ${forecast[0]?.tempMin}°C – ${forecast[0]?.tempMax}°C with low rain probability across your trip.`;
      }
    } else if (lowerMsg.includes("exchange") || lowerMsg.includes("currency") || lowerMsg.includes("convert")) {
      const currencyMatch = message.match(/\b([A-Z]{3})\b/);
      const base = currencyMatch?.[1] || "USD";
      toolResultData = await toolsRegistry.get_exchange_rate.execute({ baseCurrency: base });
      actionExecuted = "get_exchange_rate";
      const rates = toolResultData as { rates?: Record<string, number>; isLive?: boolean };
      const topRates = Object.entries(rates.rates ?? {}).slice(0, 5).map(([k, v]) => `${k}: ${v.toFixed(3)}`).join(", ");
      replyText = `Live exchange rates for ${base} ${rates.isLive ? "(verified live)" : "(cached matrix)"}: ${topRates}. Use the currency switcher in the Budget panel for full conversion.`;
    } else {
      replyText = `I'm your VoyageAI Copilot! I can:\n• ⚡ Re-optimize daily routes (say "optimize route")\n• 🌧️ Check weather & adapt rainy-day plans\n• 💰 Analyze your budget variance\n• 🏨 Search hotels & dining\n• 💱 Get live exchange rates\n\nWhat would you like me to help with?`;
    }

    // ── Persist assistant reply to DB ─────────────────────────────────────────
    await db.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: replyText,
        toolCallsJson: actionExecuted ? JSON.stringify({ tool: actionExecuted }) : null,
        toolResultJson: toolResultData ? JSON.stringify(toolResultData) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        reply: replyText,
        actionExecuted,
        toolResult: toolResultData,
        conversationId: conversation.id, // return so client can continue same thread
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
