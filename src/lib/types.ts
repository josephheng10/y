/**
 * Shared Item type — every source (email listservs, YaleConnect, Fizz) is
 * normalized into this shape. Mirrors the `items` table in supabase/schema.sql.
 */
export const SOURCES = ["email", "yaleconnect", "fizz", "campus"] as const;
export type Source = (typeof SOURCES)[number];

export function isSource(x: unknown): x is Source {
  return typeof x === "string" && (SOURCES as readonly string[]).includes(x);
}

export const CATEGORIES = [
  "Event",
  "Free food",
  "Opportunity",
  "Club news",
  "Noise",
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Item {
  /** Deterministic id: `${source}:${externalId}` so re-ingesting is idempotent. */
  id: string;
  /** Owner for private items (email). null = shared/public (YaleConnect, Fizz, demo). */
  user_id: string | null;
  source: Source;
  category: Category;
  title: string;
  summary: string;
  /** ISO 8601 or null when the item isn't time-bound. */
  starts_at: string | null;
  location: string | null;
  url: string | null;
  /** 0–100 relevance score from the tagger. */
  score: number;
  created_at: string;
  /** True for seeded demo/sample content (never stored in Supabase). */
  demo?: boolean;
}

/** Raw input handed to the tagger before it becomes an Item. */
export interface RawInput {
  source: Source;
  externalId: string;
  userId: string | null;
  /** Subject / event name / post title. */
  title: string;
  /** Body text (truncated). Used for tagging only — never persisted. */
  text: string;
  from?: string;
  url?: string | null;
  /** Known structured values (e.g. from iCal) take precedence over AI guesses. */
  startsAt?: string | null;
  location?: string | null;
  receivedAt?: string;
}

export interface TagResult {
  category: Category;
  title: string;
  summary: string;
  starts_at: string | null;
  location: string | null;
  score: number;
}

export function isCategory(x: unknown): x is Category {
  return typeof x === "string" && (CATEGORIES as readonly string[]).includes(x);
}
