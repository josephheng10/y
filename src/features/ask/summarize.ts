import { env, hasLLM } from "@/lib/env";

export type EvidencePost = {
  body: string;
  age: string | null;
  flyer: string | null;
  comments: string[];
};

export type EvidenceEvent = {
  title: string;
  excerpt: string;
  when: string | null;
};

type Brief = {
  question: string;
  aboutParties: boolean;
  asOf: string | null;
  catalogIsStale: boolean;
  posts: EvidencePost[];
  events: EvidenceEvent[];
  info: { title: string; excerpt: string }[];
};

const THEMES: [string, RegExp][] = [
  ["an Aeris rave", /aeris/i],
  ["a millennial-hope party", /millennial hope/i],
  ["a formal", /\bformal\b/i],
  ["ADPhi", /adphi/i],
  ["Toad's", /toads/i],
  ["a darty", /darty/i],
];

export async function summarizeEvidence(brief: Brief): Promise<string> {
  const fallback = writeBriefing(brief);
  if (!hasLLM() || brief.posts.length + brief.events.length + brief.info.length === 0) return fallback;
  try {
    return await modelBriefing(brief);
  } catch (error) {
    console.warn("[ask] summary model failed:", error instanceof Error ? error.message : error);
    return fallback;
  }
}

async function modelBriefing(brief: Brief): Promise<string> {
  const evidence = {
    catalogAsOf: brief.asOf,
    catalogIsOlderThanThreeDays: brief.catalogIsStale,
    posts: brief.posts.map((post) => ({
      ageWhenCaptured: post.age,
      text: post.body.slice(0, 500),
      flyer: post.flyer,
      comments: post.comments.slice(0, 4),
    })),
    events: brief.events,
    info: brief.info,
  };
  const system = `You brief a Yale student from campus posts. Use only the evidence JSON. Do not invent a time, place, host, or event.
If the catalog is older than today, say the summary is as of that capture, not tonight's live feed.
Treat questions and rumors as questions and rumors. Mention a comment or flyer only when it adds a place, time, host, or disagreement.
Write 2 short paragraphs of plain prose. No bullet list and no preamble.`;
  const response = await fetch(`${env.llmBaseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.llmApiKey}` },
    body: JSON.stringify({
      model: env.llmModel,
      reasoning_effort: "high",
      max_completion_tokens: 2000,
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Question: ${brief.question}\n\nEvidence:\n${JSON.stringify(evidence)}` },
      ],
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) throw new Error(`LLM HTTP ${response.status}`);
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("LLM returned an empty summary");
  return text;
}

function writeBriefing(brief: Brief): string {
  const when = brief.catalogIsStale && brief.asOf
    ? `This is as of the Fizz catalog captured ${brief.asOf}, not a live read of tonight.`
    : brief.asOf
      ? `This is from the Fizz catalog as of ${brief.asOf}.`
      : "This is from the Fizz catalog.";

  if (brief.posts.length === 0 && brief.events.length === 0 && brief.info.length === 0) {
    return `${when} Nothing in the posts, comments, events, or info pages matches that.`;
  }

  if (brief.aboutParties) return partyBriefing(brief, when);

  const bits = [when];
  if (brief.posts.length) {
    const lines = brief.posts.slice(0, 4).map((post) => clip(post.body));
    bits.push(`Posts say: ${lines.join(" ")}`);
    const comments = usefulComments(brief.posts);
    if (comments.length) bits.push(`Comments add: ${comments.join(" ")}`);
  }
  if (brief.events.length) {
    bits.push(`On the events list: ${brief.events.map((event) => `${event.title}${event.when ? ` (${event.when})` : ""}`).join("; ")}.`);
  }
  if (brief.info.length) {
    bits.push(`The info pages cover ${brief.info.map((guide) => guide.title).join(", ")}. ${clip(brief.info[0].excerpt)}`);
  }
  return bits.join(" ");
}

function partyBriefing(brief: Brief, when: string): string {
  const text = brief.posts.map((post) => [post.body, post.flyer ?? "", ...post.comments].join("\n")).join("\n");
  const themes = THEMES.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
  const times = unique(text.match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi) ?? []).slice(0, 3);
  const places = unique(
    [...text.matchAll(/\b(?:\d{1,4}\s+[A-Z][A-Za-z]+(?:\s+(?:St|Street|Ave|Rd))?|[A-Z][a-z]+(?: Hall| College| Buttery))\b/g)].map((match) => match[0]),
  ).slice(0, 3);
  const flyers = brief.posts.map((post) => post.flyer).filter((flyer): flyer is string => !!flyer && !/^https?:/i.test(flyer));
  const comments = usefulComments(brief.posts);

  const sentences = [when];
  if (themes.length) {
    sentences.push(`The recent posts point to ${joinList(themes)}.`);
  } else if (brief.posts.length) {
    sentences.push("The recent posts talk about going out, but they don't name one clear event.");
  }
  if (times.length || places.length) {
    sentences.push(
      `Details that show up in the text: ${[times.length ? `times ${times.join(", ")}` : "", places.length ? `places ${places.join(", ")}` : ""].filter(Boolean).join("; ")}.`,
    );
  } else {
    sentences.push("None of these posts give both a door time and an address.");
  }
  if (flyers.length) sentences.push(`Flyer notes: ${flyers.slice(0, 2).map(clip).join(" ")}.`);
  else if (brief.posts.some((post) => post.flyer)) sentences.push("Some of these posts have an image, but the catalog didn't keep the words on the flyer.");
  if (comments.length) sentences.push(`Comments that add something: ${comments.map((comment) => `"${clip(comment)}"`).join(" ")}`);
  if (brief.events.length) {
    sentences.push(`Listed events in the same window: ${brief.events.map((event) => event.title).join(", ")}.`);
  }
  const forward = brief.posts.filter((post) => /\b(tonight|tn\b|this weekend|friday|saturday)\b/i.test(post.body)).slice(0, 2);
  if (forward.length) sentences.push(`The lines that sound like plans: ${forward.map((post) => `"${clip(post.body)}"`).join(" ")}`);
  return sentences.join(" ");
}

function usefulComments(posts: EvidencePost[]): string[] {
  return unique(
    posts.flatMap((post) => post.comments).filter((comment) => /\b(party|tonight|tn\b|where|address|pm|am|come|open|free|flyer|at)\b/i.test(comment)),
  ).slice(0, 3);
}

function clip(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > 160 ? `${flat.slice(0, 157)}…` : flat;
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
