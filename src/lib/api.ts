import { NextResponse, type NextRequest } from "next/server";
import { env } from "./env";

/** Optional shared secret for ingest routes (set INGEST_SECRET to enable). */
export function checkIngestSecret(req: NextRequest): NextResponse | null {
  if (!env.ingestSecret) return null;
  const got = req.headers.get("x-ingest-secret") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (got !== env.ingestSecret) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return null;
}

export function errorJson(e: unknown, status = 500) {
  return NextResponse.json({ error: (e as Error).message ?? String(e) }, { status });
}
