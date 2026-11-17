/**
 * YaleConnect ingest via any iCal feed (YALECONNECT_ICAL_URL or a URL in the request).
 * YaleConnect (CampusGroups) exposes calendar export / subscribe links per club or
 * for the whole event calendar — paste that .ics URL here.
 */
import type { RawInput } from "../types";
import { parseIcal } from "./ical";

export async function fetchYaleConnect(icalUrl: string, { daysAhead = 14 } = {}) {
  const url = icalUrl.replace(/^webcal:\/\//i, "https://");
  const res = await fetch(url, { headers: { Accept: "text/calendar" }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`iCal fetch ${res.status}`);
  const events = parseIcal(await res.text());
  const now = Date.now();
  const horizon = now + daysAhead * 86400000;
  const upcoming = events.filter((e) => {
    if (!e.start) return false;
    const t = Date.parse(e.start);
    const end = e.end ? Date.parse(e.end) : t;
    return end >= now - 3600000 && t <= horizon;
  });
  const inputs: RawInput[] = upcoming.map((e) => ({
    source: "yaleconnect",
    externalId: `yc:${e.uid}`,
    userId: null,
    title: e.summary || "(untitled event)",
    text: e.description,
    url: e.url,
    startsAt: e.start,
    location: e.location,
  }));
  return { inputs, parsed: events.length };
}
