import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

export type FizzPost = {
  postKey: string;
  community: string | null;
  authorLabel: string | null;
  body: string;
  displayedAge: string | null;
  firstSeenAt: string;
  score: number | null;
  commentCount: number | null;
  refizzCount: number | null;
  shareCount: number | null;
};

export type FizzCatalog = {
  postCount: number;
  latestSeenAt: string | null;
  posts: FizzPost[];
  query: string;
};

export type FizzResearchPost = {
  post_key: string;
  body: string;
  displayed_age: string | null;
  first_seen_at: string;
  author_label: string | null;
  community: string | null;
  media_reference: string | null;
};

type CatalogRows = {
  postCount: number;
  latestSeenAt: string | null;
  posts: Record<string, unknown>[];
};

type ResearchRows = { latestSeenAt: string | null; posts: FizzResearchPost[] };
type CommentRow = { post_key: string; body: string };

let supabase: SupabaseClient | undefined;

function cloudCatalog() {
  const url = process.env.FIZZ_SUPABASE_URL;
  const secret = process.env.FIZZ_SUPABASE_SECRET_KEY;
  if (!url && !secret) return undefined;
  if (!url || !secret) throw new Error("Set both Fizz Supabase environment variables.");
  return (supabase ??= createClient(url, secret, { auth: { persistSession: false } }));
}

async function fizzQuery<T>(client: SupabaseClient, name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await client.rpc(name, args);
  if (error) throw new Error(`Fizz query ${name} failed (${error.code}).`);
  return data as T;
}

const POST_SQL = `
  SELECT
    p.post_key,
    p.community,
    p.author_label,
    p.body,
    p.displayed_age,
    p.first_seen_at,
    m.displayed_score,
    m.comment_count,
    m.refizz_count,
    m.share_count
  FROM posts p
  LEFT JOIN (
    SELECT entity_key, displayed_score, comment_count, refizz_count, share_count,
           ROW_NUMBER() OVER (PARTITION BY entity_key ORDER BY captured_at DESC, rowid DESC) AS rn
    FROM metric_observations
    WHERE entity_type = 'post'
  ) m ON m.entity_key = p.post_key AND m.rn = 1
  WHERE p.body IS NOT NULL
    AND length(trim(p.body)) > 0
    AND (? = '' OR p.body LIKE ? ESCAPE '\\')
  ORDER BY p.first_seen_at DESC, p.post_key DESC
  LIMIT ?
`;

export function fizzDbPath(): string {
  return process.env.FIZZ_DB ?? path.resolve(process.cwd(), "..", "output", "fizz", "fizz.sqlite");
}

function openDb(): DatabaseSync {
  return new DatabaseSync(fizzDbPath(), { readOnly: true });
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

function localCatalog(query: string, limit: number): CatalogRows {
  const like = `%${query.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
  const db = openDb();
  try {
    const count = db.prepare("SELECT COUNT(*) AS n FROM posts WHERE body IS NOT NULL AND length(trim(body)) > 0").get() as { n: number };
    const latest = db.prepare("SELECT MAX(first_seen_at) AS seen FROM posts").get() as { seen: string | null };
    return {
      postCount: count.n,
      latestSeenAt: latest.seen,
      posts: db.prepare(POST_SQL).all(query, like, limit),
    };
  } finally {
    db.close();
  }
}

export async function loadFizzCatalog(rawQuery: string, limit = 40): Promise<FizzCatalog> {
  const capped = Math.min(Math.max(limit, 1), 40);
  const query = rawQuery.trim().slice(0, 120);
  const client = cloudCatalog();
  const { posts, ...catalog } = client
    ? await fizzQuery<CatalogRows>(client, "fizz_catalog", { p_query: query, p_limit: capped })
    : localCatalog(query, capped);

  return {
    ...catalog,
    query,
    posts: posts.map((row) => ({
      postKey: String(row.post_key),
      community: asString(row.community),
      authorLabel: asString(row.author_label),
      body: String(row.body),
      displayedAge: asString(row.displayed_age),
      firstSeenAt: String(row.first_seen_at),
      score: asNumber(row.displayed_score),
      commentCount: asNumber(row.comment_count),
      refizzCount: asNumber(row.refizz_count),
      shareCount: asNumber(row.share_count),
    })),
  };
}

export async function loadFizzResearchPosts(terms: string[]): Promise<ResearchRows> {
  const client = cloudCatalog();
  if (client) return fizzQuery<ResearchRows>(client, "fizz_research_posts", { p_terms: terms });

  const db = openDb();
  try {
    const posts = db.prepare(
      `SELECT post_key, body, displayed_age, first_seen_at, author_label, community, media_reference
       FROM posts WHERE length(trim(body)) > 0`,
    ).all() as FizzResearchPost[];
    let latest = 0;
    for (const post of posts) {
      const seen = Date.parse(post.first_seen_at);
      if (seen > latest) latest = seen;
    }
    return { posts, latestSeenAt: latest ? new Date(latest).toISOString() : null };
  } finally {
    db.close();
  }
}

function localComments(keys: string[]): CommentRow[] {
  const db = openDb();
  try {
    const marks = keys.map(() => "?").join(", ");
    return db.prepare(
      `SELECT post_key, body FROM comments
       WHERE post_key IN (${marks}) AND length(trim(body)) > 0
       ORDER BY first_seen_at`,
    ).all(...keys) as CommentRow[];
  } finally {
    db.close();
  }
}

export async function loadFizzResearchComments(keys: string[]): Promise<Map<string, string[]>> {
  const grouped = new Map<string, string[]>();
  if (keys.length === 0) return grouped;

  const client = cloudCatalog();
  const rows = client
    ? await fizzQuery<CommentRow[]>(client, "fizz_research_comments", { p_post_keys: keys })
    : localComments(keys);
  for (const row of rows) {
    const comments = grouped.get(row.post_key) ?? [];
    if (comments.length < 4) comments.push(row.body.trim());
    grouped.set(row.post_key, comments);
  }
  return grouped;
}
