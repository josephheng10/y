import { listInfo } from "@/features/info/data";
import { answerFixxQuestion, FIXX_MOCK_POSTS } from "@/features/fixx/mock";
import { formatWhen } from "@/lib/format";
import { listItems } from "@/lib/store";

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
  "happening", "please", "some",
]);

const PLAN = /\b(party|parties|rave|formal|mixer|darty|pregame|afterparty|flyer|adphi|toads|function|semiformal|tonight|\btn\b)\b/i;

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

/** Ask chatbot — works entirely on mock Fixx + in-memory/demo store items. */
export async function researchQuestion(question: string): Promise<ResearchAnswer> {
  const asked = question.trim().slice(0, 400);
  const words = tokens(asked);
  const aboutParties = partyQuestion(asked);
  const now = new Date();

  const fixx = answerFixxQuestion(asked);
  const postSources: ResearchSource[] = fixx.sources.map((source) => {
    const post = FIXX_MOCK_POSTS.find((p) => p.id === source.id);
    return {
      kind: "post" as const,
      title: source.title,
      excerpt: source.excerpt,
      href: source.href,
      when: post?.age ?? null,
    };
  });

  // If keyword scoring found nothing but Fixx chat did, keep those; otherwise also
  // scan the full mock feed for party/food matches when the question is open-ended.
  if (postSources.length === 0) {
    const fallback = FIXX_MOCK_POSTS.filter((post) => {
      const hay = `${post.body} ${post.tags.join(" ")}`.toLowerCase();
      if (aboutParties) return post.tags.some((t) => ["party", "nightlife", "formal", "toads"].includes(t));
      return words.some((word) => hay.includes(word));
    }).slice(0, 4);
    for (const post of fallback) {
      postSources.push({
        kind: "post",
        title: `${post.author} · ${post.community}`,
        excerpt: excerpt(post.body),
        href: `/posts?q=${encodeURIComponent(post.body.slice(0, 48))}`,
        when: post.age,
      });
    }
  }

  const events = await listItems();
  const eventSources: ResearchSource[] = events
    .filter((event) => {
      const start = event.starts_at ? Date.parse(event.starts_at) : Number.NaN;
      const soon =
        !Number.isNaN(start) &&
        start - now.getTime() > -2 * 60 * 60 * 1000 &&
        start - now.getTime() < 48 * 60 * 60 * 1000;
      const text = `${event.title} ${event.summary} ${event.location ?? ""}`;
      const wordHits = words.filter((word) => text.toLowerCase().includes(word)).length;
      const plan = PLAN.test(text);
      if (aboutParties) return (soon || plan) && (plan || wordHits > 0);
      return wordHits > 0 || (soon && plan);
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

  const sources = [...postSources, ...eventSources, ...infoSources];
  const asOf = "mock Fixx summary";
  const answer = writeAnswer({ asked, aboutParties, postSources, eventSources, infoSources });
  return { answer, sources, asOf };
}

function writeAnswer(input: {
  asked: string;
  aboutParties: boolean;
  postSources: ResearchSource[];
  eventSources: ResearchSource[];
  infoSources: ResearchSource[];
}): string {
  const lead = "Using Y's mock Fixx summary plus demo events and info.";

  if (input.aboutParties) {
    if (input.postSources.length === 0 && input.eventSources.length === 0) {
      return `${lead} I didn't find party plans in the mock feed right now.`;
    }
    const lines = input.postSources.map((source, index) => `${index + 1}. ${source.excerpt}`);
    const events = input.eventSources.length
      ? ` Listed events: ${input.eventSources.map((source) => `${source.title}${source.when ? ` (${source.when})` : ""}`).join("; ")}.`
      : "";
    return `${lead} These look like parties or plans:\n${lines.join("\n")}${events}`;
  }

  if (input.postSources.length === 0 && input.eventSources.length === 0 && input.infoSources.length === 0) {
    return `${lead} I didn't find posts, events, or info pages that match "${input.asked}". Try parties, free food, careers, or dining.`;
  }

  const parts = [lead];
  if (input.postSources.length) {
    parts.push(`Fixx:\n${input.postSources.map((source, index) => `${index + 1}. ${source.excerpt}`).join("\n")}`);
  }
  if (input.eventSources.length) {
    parts.push(`Events: ${input.eventSources.map((source) => source.title).join(", ")}.`);
  }
  if (input.infoSources.length) {
    parts.push(`Info: ${input.infoSources.map((source) => source.title).join(", ")}.`);
  }
  return parts.join("\n\n");
}
