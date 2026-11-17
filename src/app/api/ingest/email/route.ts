/**
 * POST /api/ingest/email
 * - Signed in (Google or Microsoft): pulls recent listserv mail from the user's inbox,
 *   tags it, stores ONLY the tagged summary (never full bodies).
 * - Testing without OAuth: POST { "messages": [{ "id", "from", "subject", "text", "headers"? }] }
 *   (requires INGEST_SECRET if set). Same filter + tagger runs.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getAccessToken, getSession } from "@/lib/auth";
import { checkIngestSecret, errorJson } from "@/lib/api";
import { fetchGmailListserv } from "@/lib/ingest/gmail";
import { fetchOutlookListserv } from "@/lib/ingest/outlook";
import { isListserv } from "@/lib/ingest/listserv";
import { upsertItems } from "@/lib/store";
import { tagMany } from "@/lib/tagger";
import type { RawInput } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // --- Manual / test mode ---
    if (Array.isArray(body?.messages)) {
      const denied = checkIngestSecret(req);
      if (denied) return denied;
      const userId: string | null = typeof body.user_id === "string" ? body.user_id : null;
      const inputs: RawInput[] = [];
      let skipped = 0;
      for (const m of body.messages as Record<string, unknown>[]) {
        const headers = Object.fromEntries(
          Object.entries((m.headers as Record<string, string>) ?? {}).map(([k, v]) => [k.toLowerCase(), v]),
        );
        const meta = { id: String(m.id ?? ""), from: String(m.from ?? ""), subject: String(m.subject ?? ""), headers };
        if (!meta.id || !isListserv(meta)) { skipped++; continue; }
        inputs.push({
          source: "email", externalId: `manual:${meta.id}`, userId,
          title: meta.subject, text: String(m.text ?? ""), from: meta.from, url: null,
        });
      }
      const items = await tagMany(inputs);
      await upsertItems(items);
      return NextResponse.json({ mode: "manual", ingested: items.length, skipped_non_listserv: skipped, items });
    }

    // --- OAuth mode ---
    const session = await getSession();
    const token = session ? await getAccessToken(req) : null;
    if (!session?.user?.email || !token) {
      return NextResponse.json({ error: "Sign in with Google or Microsoft first." }, { status: 401 });
    }
    const userId = session.user.email;
    const access = token.accessToken;
    const { inputs, scanned } =
      token.provider === "azure-ad"
        ? await fetchOutlookListserv(access, userId, { days: body?.days ?? 3 })
        : await fetchGmailListserv(access, userId, { days: body?.days ?? 3 });
    const items = await tagMany(inputs);
    await upsertItems(items);
    // Bodies were only in memory for tagging; nothing but the summary is stored.
    return NextResponse.json({ mode: token.provider, scanned, listserv: inputs.length, ingested: items.length });
  } catch (e) {
    return errorJson(e);
  }
}
