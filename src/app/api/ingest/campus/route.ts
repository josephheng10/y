/**
 * POST /api/ingest/campus
 * Body: { ids?: string[], interests?: string[], college?: string | null }
 * Opens up to 8 public calendars from the catalog. Saved ids win.
 * With no ids, the pass follows interests and college, or a starter cut.
 */
import { NextResponse, type NextRequest } from "next/server";
import { checkIngestSecret, errorJson } from "@/lib/api";
import { digCampus, tagCampus } from "@/lib/ingest/campus";
import { upsertItems } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function strings(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length < 80).slice(0, max);
}

export async function POST(req: NextRequest) {
  const denied = checkIngestSecret(req);
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => ({}));
    const college = typeof body?.college === "string" ? body.college.slice(0, 40) : null;
    const dug = await digCampus({
      ids: strings(body?.ids, 24),
      interests: strings(body?.interests, 20),
      college,
    });
    const items = await tagCampus(dug.inputs);
    await upsertItems(items);
    return NextResponse.json({ ingested: items.length, parsed: dug.parsed, looked: dug.looked });
  } catch (error) {
    return errorJson(error);
  }
}
