/**
 * AI tagger. Turns raw text (email / event / post) into a tagged Item.
 *  - If LLM_API_KEY is set → any OpenAI-compatible /chat/completions endpoint
 *    (OpenAI, Groq, Together, OpenRouter, xAI, local Ollama/LM Studio, …) with JSON output.
 *  - Otherwise → keyword heuristic so the demo works fully offline.
 * The LLM path falls back to the heuristic on any error.
 */
import { createHash } from "crypto";
import { env, hasLLM } from "./env";
import { CATEGORIES, isCategory, type Item, type RawInput, type TagResult } from "./types";

const MAX_TEXT = 4000;

export function itemId(source: string, externalId: string) {
  const h = createHash("sha1").update(externalId).digest("hex").slice(0, 16);
  return `${source}:${h}`;
}

export async function tagMany(inputs: RawInput[], concurrency = 4): Promise<Item[]> {
  const out: Item[] = [];
  let i = 0;
  async function worker() {
    while (i < inputs.length) {
      const input = inputs[i++];
      out.push(await tagOne(input));
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, inputs.length) }, worker));
  return out;
}

export async function tagOne(input: RawInput): Promise<Item> {
  let tag: TagResult;
  try {
    tag = hasLLM() ? await llmTag(input) : heuristicTag(input);
  } catch (e) {
    console.warn("[tagger] LLM failed, using heuristic:", (e as Error).message);
    tag = heuristicTag(input);
  }
  return {
    id: itemId(input.source, input.externalId),
    user_id: input.userId,
    source: input.source,
    category: tag.category,
    title: tag.title.slice(0, 200),
    summary: tag.summary.slice(0, 500),
    // Structured values (e.g. iCal DTSTART/LOCATION) beat guesses.
    starts_at: input.startsAt ?? tag.starts_at,
    location: input.location ?? tag.location,
    url: input.url ?? null,
    score: Math.max(0, Math.min(100, Math.round(tag.score))),
    created_at: input.receivedAt ?? new Date().toISOString(),
  };
}

// ---------------- LLM ----------------
async function llmTag(input: RawInput): Promise<TagResult> {
  const now = new Date();
  const system = `You tag Yale campus messages for a student feed. Reply with ONLY a JSON object:
{"category": one of ${JSON.stringify(CATEGORIES)},
 "title": short catchy title (<= 80 chars),
 "summary": 1-2 sentence summary (<= 220 chars), no personal data,
 "starts_at": ISO 8601 datetime with offset if the item happens at a specific time, else null,
 "location": campus location/building if stated, else null,
 "score": 0-100 how useful/interesting for a typical Yale undergrad}
Rules: "Free food" if free food/snacks are offered (overrides Event). "Opportunity" = jobs, research, fellowships, applications.
"Club news" = club updates without a specific event time. "Noise" = admin, spam, reminders with nothing to do.
Current time: ${now.toISOString()} (campus timezone America/New_York). Resolve relative dates like "tonight" or "Thursday" against it.`;
  const user = `Source: ${input.source}\nFrom: ${input.from ?? "n/a"}\nTitle: ${input.title}\n` +
    (input.startsAt ? `Known start: ${input.startsAt}\n` : "") +
    (input.location ? `Known location: ${input.location}\n` : "") +
    `Text:\n${input.text.slice(0, MAX_TEXT)}`;

  const res = await fetch(`${env.llmBaseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.llmApiKey}` },
    body: JSON.stringify({
      model: env.llmModel,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  const json = JSON.parse(content.replace(/^```(?:json)?|```$/g, "").trim());
  const fallback = heuristicTag(input);
  const starts = json.starts_at && !isNaN(Date.parse(json.starts_at)) ? new Date(json.starts_at).toISOString() : null;
  return {
    category: isCategory(json.category) ? json.category : fallback.category,
    title: typeof json.title === "string" && json.title ? json.title : fallback.title,
    summary: typeof json.summary === "string" && json.summary ? json.summary : fallback.summary,
    starts_at: starts,
    location: typeof json.location === "string" && json.location ? json.location : null,
    score: typeof json.score === "number" ? json.score : fallback.score,
  };
}

// ---------------- Heuristic ----------------
const RX = {
  food: /\b(free (food|pizza|lunch|dinner|breakfast|snacks?|boba|coffee|cookies?)|pizza|food provided|refreshments|snacks|catering|leftover|bagels?|donuts?|dumplings?|lunch will be|dinner will be|tea and)\b/i,
  opp: /\b(apply|application|deadline|internship|fellowship|research (assistant|position)|\bRA\b|hiring|job|position|paid|stipend|grant|scholarship|recruit)/i,
  event: /\b(talk|lecture|panel|workshop|seminar|concert|recital|show|performance|screening|tea|meeting|reception|info session|game|party|night|jam|rehearsal|tonight|today|tomorrow)\b/i,
  club: /\b(club|society|team|org(anization)?|newsletter|board elections?|members?|sign[- ]?ups?|tryouts?|auditions?)\b/i,
  noise: /\b(unsubscribe confirmation|password|reminder to update|policy update|survey|digest|no-?reply|system maintenance|outage|receipt)\b/i,
};

const PLACES = [
  "Sterling Memorial Library", "Sterling", "Bass Library", "Bass", "Commons", "Schwarzman Center",
  "Woolsey Hall", "Battell Chapel", "Sprague Hall", "Payne Whitney", "AKW", "Dunham Lab", "Kline Tower",
  "WLH", "Linsly-Chittenden", "LC", "SSS", "HQ", "Tsai CITY", "Beinecke", "Yale Art Gallery",
  "Peabody", "Old Campus", "Cross Campus", "Becton", "Watson Center", "Humanities Quadrangle",
  "Berkeley", "Branford", "Davenport", "Ezra Stiles", "Grace Hopper", "Jonathan Edwards", "Morse",
  "Pauli Murray", "Benjamin Franklin", "Pierson", "Saybrook", "Silliman", "Timothy Dwight", "Trumbull",
  "Dwight Hall", "Afro-American Cultural Center", "Asian American Cultural Center", "La Casa", "Good Life Center",
];

function findLocation(text: string): string | null {
  const room = text.match(/\b(?:room|rm\.?)\s*([A-Z]?\d{2,4}[A-Z]?)\b/i);
  for (const p of PLACES) {
    const re = new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(text)) return room ? `${p} ${room[1]}` : p;
  }
  return null;
}

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
function findStart(text: string, ref: Date): string | null {
  const t = text.toLowerCase();
  const tm = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)/);
  if (!tm) return null;
  let h = parseInt(tm[1], 10) % 12;
  if (tm[3].startsWith("p")) h += 12;
  const m = tm[2] ? parseInt(tm[2], 10) : 0;
  const d = new Date(ref);
  if (/\btomorrow\b/.test(t)) d.setDate(d.getDate() + 1);
  else {
    const day = DAYS.findIndex((dn) => new RegExp(`\\b${dn}\\b`).test(t));
    if (day >= 0) d.setDate(d.getDate() + ((day - d.getDay() + 7) % 7));
  }
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export function heuristicTag(input: RawInput): TagResult {
  const text = `${input.title}\n${input.text}`;
  let category: TagResult["category"] = "Noise";
  if (RX.food.test(text)) category = "Free food";
  else if (RX.opp.test(text)) category = "Opportunity";
  else if (input.startsAt || RX.event.test(text)) category = "Event";
  else if (RX.club.test(text)) category = "Club news";
  if (category !== "Free food" && RX.noise.test(text) && !input.startsAt) category = "Noise";

  const clean = input.text.replace(/\s+/g, " ").trim();
  const firstSentences = clean.split(/(?<=[.!?])\s/).slice(0, 2).join(" ");
  const summary = (firstSentences || input.title).slice(0, 220);
  const base: Record<TagResult["category"], number> = {
    "Free food": 70, Event: 60, Opportunity: 60, "Club news": 45, Noise: 10,
  };
  return {
    category,
    // Drop listserv subject prefixes like "[Econ DUS]" (email only).
    title: (input.source === "email" ? input.title.replace(/^\s*\[[^\]]+\]\s*/, "") : input.title).slice(0, 80) || "(untitled)",
    summary,
    starts_at: input.startsAt ?? findStart(text, input.receivedAt ? new Date(input.receivedAt) : new Date()),
    location: input.location ?? findLocation(text),
    score: base[category],
  };
}
