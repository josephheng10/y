/**
 * Opens a short list of public calendars chosen from the campus catalog.
 * Newsletter and Mailman entries read the calendar they point at.
 * Bodies are tagged, then only the summary is stored.
 */
import { CAMPUS_SOURCES, feedSource, planDig, type CampusSource } from "../campus/catalog";
import { itemId, tagMany } from "../tagger";
import type { RawInput } from "../types";
import { parseIcal } from "./ical";

const UA = "Y/0.1 (Yale campus feed; public calendars only)";
const PER_SOURCE = 8;
const MAX_EVENTS = 40;
const HORIZON_MS = 21 * 86400000;
const SKIP_TITLE =
  /^(deadline|last day|reading period|examination period|course selection|no classes|recess\b|term (begins|ends)|\$\d+)/i;

export interface DigLook {
  id: string;
  name: string;
  kind: CampusSource["kind"];
  status: "ok" | "empty" | "no-feed" | "later" | "error";
  events: number;
  note?: string;
}

export interface DigResult {
  ingested: number;
  parsed: number;
  looked: DigLook[];
  inputs: RawInput[];
}

interface PullResult {
  status: "ok" | "empty" | "error";
  events: number;
  note?: string;
  inputs: RawInput[];
}

export async function digCampus(input: {
  ids: string[];
  interests: string[];
  college: string | null;
}): Promise<DigResult> {
  const plan = planDig({
    ids: input.ids.slice(0, 24),
    interests: input.interests.slice(0, 20),
    college: input.college,
  });
  const results = new Map<string, PullResult>();

  for (const source of plan.pulls) {
    if (!source.feed) continue;
    try {
      const inputs = await readFeed(source);
      results.set(source.feed.url, {
        status: inputs.length ? "ok" : "empty",
        events: inputs.length,
        inputs,
      });
    } catch (error) {
      results.set(source.feed.url, {
        status: "error",
        events: 0,
        note: (error as Error).message.slice(0, 160),
        inputs: [],
      });
    }
  }

  const looked: DigLook[] = [];
  const seenPull = new Set<string>();
  for (const source of plan.selected) {
    const feed = feedSource(source);
    if (!feed?.feed) {
      looked.push({
        id: source.id,
        name: source.name,
        kind: source.kind,
        status: "no-feed",
        events: 0,
        note: "No public event feed. Connect mail if you subscribe to it.",
      });
      continue;
    }
    const result = results.get(feed.feed.url);
    if (!result) {
      looked.push({
        id: source.id,
        name: source.name,
        kind: source.kind,
        status: "later",
        events: 0,
        note: "Saved. This pass stops at 8 feeds.",
      });
      continue;
    }
    if (seenPull.has(feed.feed.url) && source.id !== feed.id) {
      looked.push({
        id: source.id,
        name: source.name,
        kind: source.kind,
        status: result.status === "error" ? "error" : result.events ? "ok" : "empty",
        events: 0,
        note: result.note ?? `Same calendar as ${feed.name}.`,
      });
      continue;
    }
    seenPull.add(feed.feed.url);
    looked.push({
      id: source.id,
      name: source.name,
      kind: source.kind,
      status: result.status,
      events: result.events,
      note: result.note ?? (source.id === feed.id ? undefined : `Via ${feed.name}.`),
    });
  }

  const inputs = [...results.values()].flatMap((result) => result.inputs).slice(0, MAX_EVENTS);
  return {
    ingested: 0,
    parsed: inputs.length,
    looked,
    inputs,
  };
}

async function readFeed(source: CampusSource): Promise<RawInput[]> {
  if (!source.feed) return [];
  const text = await fetchCatalog(source.feed.url);
  const rows = source.feed.type === "ical" ? fromIcal(text, source.name) : fromLocalist(text, source.name);
  return rows
    .filter((row) => row.startsAt && inWindow(row.startsAt) && !SKIP_TITLE.test(row.title))
    .sort((a, b) => Date.parse(a.startsAt!) - Date.parse(b.startsAt!))
    .slice(0, PER_SOURCE);
}

function inWindow(iso: string): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  const now = Date.now();
  return t >= now - 3600000 && t <= now + HORIZON_MS;
}

function fromIcal(ics: string, channel: string): RawInput[] {
  return parseIcal(ics).map((event) => ({
    source: "campus" as const,
    externalId: `campus:${channel}:${event.uid}`,
    userId: null,
    title: event.summary || "(untitled event)",
    text: clip(`${channel}. ${event.description}`),
    from: channel,
    url: event.url,
    startsAt: event.start,
    location: event.location,
  }));
}

interface LocalistInstance {
  start?: string;
  id?: number | string;
}
interface LocalistEvent {
  id?: number | string;
  title?: string;
  description_text?: string;
  description?: string;
  location_name?: string;
  localist_url?: string;
  url?: string;
  private?: boolean;
  event_instances?: { event_instance?: LocalistInstance }[];
}

function fromLocalist(body: string, channel: string): RawInput[] {
  let parsed: { events?: { event?: LocalistEvent }[] };
  try {
    parsed = JSON.parse(body) as { events?: { event?: LocalistEvent }[] };
  } catch {
    throw new Error("calendar did not return JSON");
  }
  const inputs: RawInput[] = [];
  for (const row of parsed.events ?? []) {
    const event = row.event ?? (row as unknown as LocalistEvent);
    if (!event || event.private || !event.title) continue;
    const instances = (event.event_instances ?? [])
      .map((entry) => entry.event_instance)
      .filter((entry): entry is LocalistInstance => Boolean(entry?.start))
      .slice(0, 3);
    const text = clip(`${channel}. ${event.description_text || strip(event.description || "")}`);
    const place = event.location_name?.trim() || null;
    const url = event.localist_url || event.url || null;
    if (!instances.length) continue;
    for (const instance of instances) {
      inputs.push({
        source: "campus",
        externalId: `campus:${channel}:${event.id}:${instance.id ?? instance.start}`,
        userId: null,
        title: event.title,
        text,
        from: channel,
        url,
        startsAt: instance.start,
        location: place,
      });
    }
  }
  return inputs;
}

const FEED_HOSTS = new Set(
  CAMPUS_SOURCES.filter((source) => source.feed?.url.startsWith("https://")).map((source) => new URL(source.feed!.url).host),
);
const FEED_URLS = new Set(
  CAMPUS_SOURCES.filter((source) => source.feed?.url.startsWith("https://")).map((source) => source.feed!.url),
);

async function fetchCatalog(url: string): Promise<string> {
  if (!FEED_URLS.has(url)) throw new Error("feed is not in the catalog");
  let current = url;
  for (let hop = 0; hop < 3; hop++) {
    const response = await fetch(current, {
      redirect: "manual",
      headers: { "User-Agent": UA, Accept: "text/calendar, application/json, */*" },
      signal: AbortSignal.timeout(15000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error(`redirect ${response.status}`);
      const next = new URL(location, current);
      if (next.protocol !== "https:" || !FEED_HOSTS.has(next.host)) throw new Error("redirect left the calendar host");
      current = next.toString();
      continue;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  }
  throw new Error("too many redirects");
}

function clip(text: string): string {
  return strip(text).slice(0, 700);
}

function strip(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function tagCampus(inputs: RawInput[]) {
  const channels = new Map(inputs.map((input) => [itemId(input.source, input.externalId), input.from ?? ""]));
  const items = await tagMany(inputs, 6, { llm: false });
  for (const item of items) {
    const channel = channels.get(item.id);
    if (channel && !item.summary.toLowerCase().includes(channel.toLowerCase())) {
      item.summary = `${item.summary} · ${channel}`.slice(0, 500);
    }
  }
  return items;
}
