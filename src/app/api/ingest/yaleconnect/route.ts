/**
 * POST /api/ingest/yaleconnect            → uses YALECONNECT_ICAL_URL
 * POST /api/ingest/yaleconnect {"url": …} → any iCal feed (one or more, comma-separated in env)
 * Also accepts raw .ics text: {"ics": "BEGIN:VCALENDAR…"} (handy for testing).
 */
import { NextResponse, type NextRequest } from "next/server";
import { checkIngestSecret, errorJson } from "@/lib/api";
import { env } from "@/lib/env";
import { parseIcal } from "@/lib/ingest/ical";
import { fetchYaleConnect } from "@/lib/ingest/yaleconnect";
import { upsertItems } from "@/lib/store";
import { tagMany } from "@/lib/tagger";
import type { RawInput } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const denied = checkIngestSecret(req);
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => ({}));
    let inputs: RawInput[] = [];
    let parsed = 0;
    if (typeof body?.ics === "string") {
      const evs = parseIcal(body.ics);
      parsed = evs.length;
      inputs = evs.map((e) => ({
        source: "yaleconnect", externalId: `yc:${e.uid}`, userId: null,
        title: e.summary, text: e.description, url: e.url, startsAt: e.start, location: e.location,
      }));
    } else {
      const urls = String(body?.url || env.yaleConnectIcalUrl).split(",").map((s) => s.trim()).filter(Boolean);
      if (!urls.length) {
        return NextResponse.json({ error: "Set YALECONNECT_ICAL_URL or pass {\"url\": \"…ics\"}" }, { status: 400 });
      }
      for (const u of urls) {
        const r = await fetchYaleConnect(u);
        inputs.push(...r.inputs);
        parsed += r.parsed;
      }
    }
    const items = await tagMany(inputs);
    await upsertItems(items);
    return NextResponse.json({ parsed, ingested: items.length });
  } catch (e) {
    return errorJson(e);
  }
}

/** Convenience for Vercel Cron (GET). */
export async function GET(req: NextRequest) {
  return POST(req);
}
