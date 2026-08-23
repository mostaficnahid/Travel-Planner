import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, requireTripOwnership } from "@/lib/auth-guard";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authResult = await requireSession();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const ownershipResult = await requireTripOwnership(params.id, user.id);
  if (ownershipResult instanceof NextResponse) return ownershipResult;

  try {
    const url = new URL(req.url);
    const format = url.searchParams.get("format") || "txt";

    const trip = await db.trip.findUnique({
      where: { id: params.id },
      include: {
        days: {
          orderBy: { dayNumber: "asc" },
          include: { activities: { orderBy: { startTime: "asc" } } },
        },
        expenses: true,
      },
    });

    if (!trip) {
      return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 });
    }

    const safeTitle = trip.destination.toLowerCase().replace(/[^a-z0-9]/g, "-");

    // ── 1. JSON Export ──────────────────────────────────────────────────────
    if (format === "json") {
      return new NextResponse(JSON.stringify(trip, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${safeTitle}-itinerary.json"`,
        },
      });
    }

    // ── 2. iCal (.ics) Export — timezone-aware ──────────────────────────────
    if (format === "ics") {
      /**
       * Format a Date to iCal DTSTART/DTEND local-time (no Z suffix = floating/local).
       * We use the activity's date from the ItineraryDay and the HH:mm time fields.
       * This avoids UTC-conversion errors — calendar apps treat floating times as local.
       */
      const formatIcsLocalDt = (dayDate: Date, timeStr: string): string => {
        const [h, m] = (timeStr || "09:00").split(":").map(Number);
        const d = new Date(dayDate);
        d.setHours(h || 9, m || 0, 0, 0);
        const pad = (n: number) => String(n).padStart(2, "0");
        return (
          `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
          `T${pad(d.getHours())}${pad(d.getMinutes())}00`
        );
      };

      const formatIcsUtcNow = (): string => {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, "0");
        return (
          `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
          `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`
        );
      };

      const icsLines: string[] = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//VoyageAI//Travel Planner//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        `X-WR-CALNAME:${trip.title}`,
        "X-WR-TIMEZONE:UTC",
      ];

      for (const day of trip.days) {
        const dayDate = new Date(day.date);
        for (const act of day.activities) {
          const dtStart = formatIcsLocalDt(dayDate, act.startTime || "09:00");
          const dtEnd = formatIcsLocalDt(dayDate, act.endTime || "11:00");
          const dtstamp = formatIcsUtcNow();
          // Escape special chars for iCal text fields
          const escapeIcs = (s: string) =>
            s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

          icsLines.push(
            "BEGIN:VEVENT",
            `UID:act-${act.id}@voyageai.com`,
            `DTSTAMP:${dtstamp}`,
            `DTSTART;TZID=UTC:${dtStart}`,
            `DTEND;TZID=UTC:${dtEnd}`,
            `SUMMARY:${escapeIcs(act.title)}`,
            `DESCRIPTION:${escapeIcs(act.description || "")}\\nCategory: ${act.category}\\nEst. Cost: $${act.estimatedCost}`,
            `LOCATION:${escapeIcs(act.address || trip.destination)}`,
            "END:VEVENT"
          );
        }
      }

      icsLines.push("END:VCALENDAR");

      return new NextResponse(icsLines.join("\r\n"), {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": `attachment; filename="${safeTitle}-itinerary.ics"`,
        },
      });
    }

    // ── 3. HTML (Print-to-PDF) Export ────────────────────────────────────────
    if (format === "pdf") {
      const startStr = new Date(trip.startDate).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const endStr = new Date(trip.endDate).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const dayHtml = trip.days
        .map(
          (day) => `
        <div style="margin-bottom:28px; page-break-inside: avoid;">
          <h2 style="color:#1e40af;border-bottom:2px solid #bfdbfe;padding-bottom:6px;margin-bottom:12px;">
            Day ${day.dayNumber}: ${day.theme || "Exploration"}
          </h2>
          <p style="color:#64748b;font-size:13px;margin-bottom:8px;">${day.summary || ""}</p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="background:#eff6ff;">
                <th style="padding:8px 10px;text-align:left;border:1px solid #bfdbfe;">Time</th>
                <th style="padding:8px 10px;text-align:left;border:1px solid #bfdbfe;">Activity</th>
                <th style="padding:8px 10px;text-align:left;border:1px solid #bfdbfe;">Category</th>
                <th style="padding:8px 10px;text-align:right;border:1px solid #bfdbfe;">Cost</th>
              </tr>
            </thead>
            <tbody>
              ${day.activities
                .map(
                  (act, i) => `
                <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"};">
                  <td style="padding:7px 10px;border:1px solid #e2e8f0;white-space:nowrap;">${act.startTime} – ${act.endTime}</td>
                  <td style="padding:7px 10px;border:1px solid #e2e8f0;"><strong>${act.title}</strong>${act.address ? `<br/><span style="color:#94a3b8;font-size:11px;">📍 ${act.address}</span>` : ""}</td>
                  <td style="padding:7px 10px;border:1px solid #e2e8f0;text-transform:capitalize;">${act.category}</td>
                  <td style="padding:7px 10px;border:1px solid #e2e8f0;text-align:right;">$${act.estimatedCost}</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
          <p style="font-size:12px;color:#64748b;margin-top:6px;">Daily estimate: <strong>$${day.estimatedCost}</strong> · Travel: ${day.travelDistance} km / ${day.travelTime} min</p>
        </div>`
        )
        .join("");

      const totalCost = trip.days.reduce((acc, d) => acc + d.estimatedCost, 0);

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${trip.title} — VoyageAI Itinerary</title>
  <style>
    @media print { body { -webkit-print-color-adjust: exact; } }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 32px 48px; }
    h1 { font-size: 26px; color: #1e40af; margin-bottom: 4px; }
    .meta { font-size: 13px; color: #64748b; margin-bottom: 24px; }
    .badge { display:inline-block; background:#eff6ff; color:#1d4ed8; padding:3px 10px; border-radius:99px; font-size:11px; font-weight:700; text-transform:uppercase; margin-right:6px; }
    .kpi { display:flex; gap:24px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px 20px; margin-bottom:28px; flex-wrap:wrap; }
    .kpi-item { text-align:center; }
    .kpi-item .label { font-size:10px; color:#94a3b8; text-transform:uppercase; font-weight:700; }
    .kpi-item .value { font-size:18px; font-weight:800; color:#1e40af; }
    footer { margin-top:40px; font-size:11px; color:#94a3b8; text-align:center; border-top:1px solid #e2e8f0; padding-top:12px; }
  </style>
</head>
<body>
  <h1>${trip.title}</h1>
  <p class="meta">
    <span class="badge">${trip.travelStyle}</span>
    <span class="badge">${trip.status}</span>
    ${startStr} → ${endStr} · ${trip.travelerCount} traveler${trip.travelerCount > 1 ? "s" : ""}
  </p>
  <div class="kpi">
    <div class="kpi-item"><div class="label">Destination</div><div class="value">${trip.destination}</div></div>
    <div class="kpi-item"><div class="label">Budget</div><div class="value">$${trip.budget} ${trip.currency}</div></div>
    <div class="kpi-item"><div class="label">Days</div><div class="value">${trip.days.length}</div></div>
    <div class="kpi-item"><div class="label">Est. Total Cost</div><div class="value">$${Math.round(totalCost)}</div></div>
  </div>
  ${dayHtml}
  <footer>Generated by VoyageAI — voyageai.com · Open in browser and use File → Print → Save as PDF</footer>
</body>
</html>`;

      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `inline; filename="${safeTitle}-itinerary.html"`,
        },
      });
    }

    // ── 4. Plain Text / Markdown Export ──────────────────────────────────────
    let exportText = `# ${trip.title}\n`;
    exportText += `Destination: ${trip.destination}\n`;
    exportText += `Dates: ${new Date(trip.startDate).toLocaleDateString()} - ${new Date(trip.endDate).toLocaleDateString()}\n`;
    exportText += `Budget: $${trip.budget} ${trip.currency}\n`;
    exportText += `Style: ${trip.travelStyle} · Travelers: ${trip.travelerCount}\n\n`;

    for (const day of trip.days) {
      exportText += `## Day ${day.dayNumber}: ${day.theme || "Exploration"}\n`;
      exportText += `${day.summary || ""}\n\n`;
      for (const act of day.activities) {
        exportText += `- ${act.startTime} – ${act.endTime}: **${act.title}** (${act.category}, $${act.estimatedCost})\n`;
        if (act.address) exportText += `  📍 ${act.address}\n`;
      }
      exportText += `\nDaily estimate: $${day.estimatedCost} · Travel: ${day.travelDistance} km\n\n`;
    }

    return new NextResponse(exportText, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeTitle}-itinerary.txt"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Export failed.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
