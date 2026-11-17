import { listInfo } from "@/features/info/data";
import { fizzDbPath } from "@/lib/fizz";
import { formatWhen } from "@/lib/format";
import { listItems } from "@/lib/store";
import { DatabaseSync } from "node:sqlite";

export type ResearchSource = {
  kind: "post" | "event" | "info";
  title: string;
  excerpt: string;
  href: string;
  when: string | null;
};

export type ResearchAnswer = {
  answer: string;
  sources: ResearchSource[];
  asOf: string | null;
};

const STOP = new Set([
  "a", "an", "and", "are", "at", "be", "do", "for", "from", "going", "how", "i", "in", "is", "it",
  "me", "of", "on", "or", "tell", "that", "the", "there", "this", "to", "tonight", "tn", "today",
  "what", "whats", "what's", "when", "where", "which", "who", "with", "you", "we", "any", "about",
  "happening", "going", "check", "please", "some",
]);

const PARTY = [
  "party", "parties", "rave", "formal", "mixer", "darty", "pregame", "afterparty", "after party",
  "semiformal", "semi formal", "function", "flyer", "adphi", "toads", "tonight", "tn",
];

const PLAN = /\b(party|parties|rave|formal|mixer|darty|pregame|afterparty|flyer|adphi|toads|function|semiformal|tonight|\btn\b)\b/i;
const FORWARD = /\b(tonight|\btn\b|this weekend|friday|saturday|flyer|doors at|come to|pulling up)\b/i;
const LOOKING_BACK = /\b(last year|last night|was so|went to|proves)\b/i;
const TIME_HINT = /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)|tonight|\btn\b|doors)\b/i;

type PostRow = {
  post_key: string;
  body: string;
  displayed_age: string | null;
  first_seen_at: string;
  author_label: string | null;
  community: string | null;
};

function ageToMs(age: string | null): number | null {
  if (!age) return null;
  const match = age.trim().toLowerCase().match(/^(\d+)\s*(m|min|h|hr|hrs|d|w|wk|wks|mo|y|yr)s?$/);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2];
  const hour = 60 * 60 * 1000;
  if (unit === "m" || unit === "min") return amount * 60 * 1000;
  if (unit === "h" || unit === "hr" || unit === "hrs") return amount * hour;
  if (unit === "d") return amount * 24 * hour;
  if (unit === "w" || unit === "wk" || unit === "wks") return amount * 7 * 24 * hour;
  if (unit === "mo") return amount * 30 * 24 * hour;
  return amount * 365 * 24 * hour;
}

function tokens(text: string): string[] {
  return [...new Set(text.toLowerCase().match(/[a-z0-9']{2,}/g) ?? [])].filter((word) => !STOP.has(word));
}

function partyQuestion(text: string): boolean {
  return /\b(part(?:y|ies)|rave|formal|mixer|darty|tonight|tn|flyer|going out|where (?:are|r) we going)\b/i.test(text);
}

function excerpt(body: string): string {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length > 220 ? `${flat.slice(0, 217)}…` : flat;
}

function loadPosts(): PostRow[] {
  const db = new DatabaseSync(fizzDbPath(), { readOnly: true });
  try {
    return db.prepare(
      `SELECT post_key, body, displayed_age, first_seen_at, author_label, community
       FROM posts
       WHERE body IS NOT NULL AND length(trim(body)) > 0`,
    ).all() as PostRow[];
  } finally {
    db.close();
  }
}

function latestSeen(posts: PostRow[]): Date | null {
  let latest = 0;
  for (const post of posts) {
    const time = Date.parse(post.first_seen_at);
    if (time > latest) latest = time;
  }
  return latest ? new Date(latest) : null;
}

export async function researchQuestion(question: string): Promise<ResearchAnswer> {
  const asked = question.trim().slice(0, 400);
  const words = tokens(asked);
  const aboutParties = partyQuestion(asked);
  const posts = loadPosts();
  const newest = latestSeen(posts);
  const now = new Date();
  const catalogIsStale = newest != null && now.getTime() - newest.getTime() > 3 * 24 * 60 * 60 * 1000;
  const reference = catalogIsStale && newest ? newest : now;
  const recentWindow = 3 * 24 * 60 * 60 * 1000;

  const ranked = posts
    .map((post) => {
      const age = ageToMs(post.displayed_age);
      const seen = Date.parse(post.first_seen_at);
      const postedAt = Number.isNaN(seen) ? null : seen - (age ?? 0);
      const recent = postedAt != null && reference.getTime() - postedAt <= recentWindow && reference.getTime() - postedAt >= -6 * 60 * 60 * 1000;
      const haystack = post.body.toLowerCase();
      const wordHits = words.filter((word) => haystack.includes(word)).length;
      const partyHits = PARTY.filter((word) => haystack.includes(word)).length;
      let score = wordHits * 3;
      if (aboutParties) score += partyHits * 2;
      if (PLAN.test(post.body) && TIME_HINT.test(post.body)) score += 3;
      if (FORWARD.test(post.body)) score += 4;
      if (LOOKING_BACK.test(post.body)) score -= 8;
      if (aboutParties && partyHits === 0 && !PLAN.test(post.body)) score = 0;
      if (!aboutParties && wordHits === 0) score = 0;
      if (recent && score > 0) score += 6;
      if (aboutParties && !recent) score = Math.min(score, 2);
      return { post, score, recent, postedAt };
    })
    .filter((item) => item.score >= (aboutParties ? 6 : 3))
    .sort((a, b) => b.score - a.score || (b.postedAt ?? 0) - (a.postedAt ?? 0));
  const seenExcerpts = new Set<string>();
  const uniqueRanked = ranked.filter((item) => {
    const key = excerpt(item.post.body).toLowerCase();
    if (seenExcerpts.has(key)) return false;
    seenExcerpts.add(key);
    return true;
  }).slice(0, 8);

  const events = await listItems();
  const eventSources: ResearchSource[] = events
    .filter((event) => {
      const start = event.starts_at ? Date.parse(event.starts_at) : Number.NaN;
      const soon = !Number.isNaN(start) && start - now.getTime() > -2 * 60 * 60 * 1000 && start - now.getTime() < 18 * 60 * 60 * 1000;
      const nearCatalog = !Number.isNaN(start) && Math.abs(start - reference.getTime()) < 36 * 60 * 60 * 1000;
      const text = `${event.title} ${event.summary} ${event.location ?? ""}`;
      const wordHits = words.filter((word) => text.toLowerCase().includes(word)).length;
      const plan = PLAN.test(text);
      if (aboutParties) return (soon || nearCatalog) && plan;
      return wordHits > 0;
    })
    .slice(0, 4)
    .map((event) => ({
      kind: "event" as const,
      title: event.title,
      excerpt: `${event.summary} ${event.location ?? ""}`.trim(),
      href: `/events/${encodeURIComponent(event.id)}`,
      when: event.starts_at ? formatWhen(event.starts_at) : null,
    }));

  const infoSources: ResearchSource[] = listInfo()
    .map((guide) => {
      const text = `${guide.title} ${guide.summary} ${guide.body} ${guide.category}`.toLowerCase();
      const wordHits = words.filter((word) => text.includes(word)).length;
      return { guide, wordHits };
    })
    .filter((item) => item.wordHits > 0)
    .sort((a, b) => b.wordHits - a.wordHits)
    .slice(0, 3)
    .map(({ guide }) => ({
      kind: "info" as const,
      title: guide.title,
      excerpt: guide.summary,
      href: `/info/${guide.slug}`,
      when: guide.category,
    }));

  const postSources: ResearchSource[] = uniqueRanked.map(({ post }) => ({
    kind: "post",
    title: post.author_label ?? post.community ?? "Yale",
    excerpt: excerpt(post.body),
    href: `/posts?q=${encodeURIComponent(excerpt(post.body).slice(0, 80))}`,
    when: post.displayed_age ? `${post.displayed_age} when captured ${formatWhen(post.first_seen_at)}` : formatWhen(post.first_seen_at),
  }));

  const sources = [...postSources, ...eventSources, ...infoSources];
  const asOf = newest ? formatWhen(newest.toISOString()) : null;
  const answer = writeAnswer({ asked, aboutParties, catalogIsStale, asOf, postSources, eventSources, infoSources });
  return { answer, sources, asOf };
}

function writeAnswer(input: {
  asked: string;
  aboutParties: boolean;
  catalogIsStale: boolean;
  asOf: string | null;
  postSources: ResearchSource[];
  eventSources: ResearchSource[];
  infoSources: ResearchSource[];
}): string {
  const stale = input.catalogIsStale && input.asOf
    ? input.aboutParties
      ? `The Fizz catalog's newest capture is ${input.asOf}, so "tonight" means that night in the catalog.`
      : `The Fizz catalog's newest capture is ${input.asOf}.`
    : input.asOf
      ? `Looking at the Fizz catalog as of ${input.asOf}.`
      : "Looking at the Fizz catalog.";

  if (input.aboutParties) {
    if (input.postSources.length === 0 && input.eventSources.length === 0) {
      return `${stale} I didn't find posts from the last few days that mention a party, flyer, or a plan for that night.`;
    }
    const lines = input.postSources.map((source, index) => `${index + 1}. ${source.excerpt}`);
    const events = input.eventSources.length
      ? ` Listed events: ${input.eventSources.map((source) => `${source.title} (${source.when})`).join("; ")}.`
      : "";
    return `${stale} These posts from the last few days look like parties or plans:\n${lines.join("\n")}${events}`;
  }

  if (input.postSources.length === 0 && input.eventSources.length === 0 && input.infoSources.length === 0) {
    return `${stale} I didn't find posts, events, or info pages that match "${input.asked}".`;
  }

  const parts = [stale];
  if (input.postSources.length) {
    parts.push(`Posts:\n${input.postSources.map((source, index) => `${index + 1}. ${source.excerpt}`).join("\n")}`);
  }
  if (input.eventSources.length) {
    parts.push(`Events: ${input.eventSources.map((source) => source.title).join(", ")}.`);
  }
  if (input.infoSources.length) {
    parts.push(`Info: ${input.infoSources.map((source) => source.title).join(", ")}.`);
  }
  return parts.join("\n\n");
}
