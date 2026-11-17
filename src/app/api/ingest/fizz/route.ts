/**
 * 🔌 POST /api/ingest/fizz — plug-in point for the Fizz integration.
 * Body: a single item or { "items": [ … ] }. Each item:
 *   { "source": "fizz", "external_id": "post_123", "title": "…", "text"?: "…",
 *     "category"?: "Event|Free food|Opportunity|Club news|Noise", "summary"?, "starts_at"?,
 *     "location"?, "url"?, "score"? }
 * If category is missing, the AI tagger fills category/summary/time/location.
 * Protect with INGEST_SECRET (header: x-ingest-secret).
 */
import { NextResponse, type NextRequest } from "next/server";
import { checkIngestSecret, errorJson } from "@/lib/api";
import { fizzToItem, validateFizz } from "@/lib/ingest/fizz";
import { upsertItems } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const denied = checkIngestSecret(req);
  if (denied) return denied;
  try {
    const body = await req.json();
    const raw: unknown[] = Array.isArray(body) ? body : Array.isArray(body?.items) ? body.items : [body];
    const valid = raw.filter(validateFizz);
    const invalid = raw.length - valid.length;
    if (!valid.length) {
      return NextResponse.json(
        { error: "No valid items. Each needs external_id + title, and source must be 'fizz' if given." },
        { status: 400 },
      );
    }
    const items = await Promise.all(valid.map(fizzToItem));
    await upsertItems(items);
    return NextResponse.json({ ingested: items.length, invalid, items });
  } catch (e) {
    return errorJson(e, 400);
  }
}
