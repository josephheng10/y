/**
 * 🔌 FIZZ PLUG-IN POINT
 * Your friend's Fizz integration POSTs items to /api/ingest/fizz in this shape.
 * If `category` is omitted we run the AI tagger on title+text.
 */
import { tagOne, itemId } from "../tagger";
import { isCategory, type Item } from "../types";

export interface FizzInput {
  /** Stable id from Fizz (post id) — used for de-duplication. Required. */
  external_id: string;
  title: string;
  text?: string;
  summary?: string;
  category?: string;
  starts_at?: string | null;
  location?: string | null;
  url?: string | null;
  score?: number;
  created_at?: string;
  /** Must be 'fizz' if present. */
  source?: string;
}

export function validateFizz(x: unknown): x is FizzInput {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.external_id === "string" && o.external_id.length > 0 &&
    typeof o.title === "string" && o.title.length > 0 &&
    (o.source === undefined || o.source === "fizz")
  );
}

export async function fizzToItem(f: FizzInput): Promise<Item> {
  if (isCategory(f.category)) {
    return {
      id: itemId("fizz", f.external_id),
      user_id: null,
      source: "fizz",
      category: f.category,
      title: f.title.slice(0, 200),
      summary: (f.summary ?? f.text ?? "").slice(0, 500),
      starts_at: f.starts_at ? new Date(f.starts_at).toISOString() : null,
      location: f.location ?? null,
      url: f.url ?? null,
      score: Math.max(0, Math.min(100, f.score ?? 50)),
      created_at: f.created_at ?? new Date().toISOString(),
    };
  }
  return tagOne({
    source: "fizz",
    externalId: f.external_id,
    userId: null,
    title: f.title,
    text: f.text ?? f.summary ?? "",
    url: f.url ?? null,
    startsAt: f.starts_at ?? null,
    location: f.location ?? null,
    receivedAt: f.created_at,
  });
}
