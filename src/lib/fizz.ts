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
  dbPath: string;
  postCount: number;
  latestSeenAt: string | null;
  posts: FizzPost[];
  query: string;
};

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

export function loadFizzCatalog(rawQuery: string, limit = 40): FizzCatalog {
  const query = rawQuery.trim().slice(0, 120);
  const like = `%${query.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
  const db = openDb();
  try {
    const count = db.prepare("SELECT COUNT(*) AS n FROM posts WHERE body IS NOT NULL AND length(trim(body)) > 0").get() as { n: number };
    const latest = db.prepare("SELECT MAX(first_seen_at) AS seen FROM posts").get() as { seen: string | null };
    const rows = db.prepare(POST_SQL).all(query, like, limit) as Record<string, unknown>[];
    return {
      dbPath: fizzDbPath(),
      postCount: count.n,
      latestSeenAt: latest.seen,
      query,
      posts: rows.map((row) => ({
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
  } finally {
    db.close();
  }
}
