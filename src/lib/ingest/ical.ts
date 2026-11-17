/**
 * Minimal, dependency-free iCalendar (RFC 5545) VEVENT parser.
 * Handles line folding, escaped text, UTC / floating / TZID / all-day DTSTART.
 * Floating & TZID times are interpreted as America/New_York (campus time).
 */
export interface IcalEvent {
  uid: string;
  summary: string;
  description: string;
  location: string | null;
  url: string | null;
  start: string | null; // ISO
  end: string | null;
}

function unfold(ics: string) {
  return ics.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}
function unescape(v: string) {
  return v.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}

/** Offset (minutes) of America/New_York at a given UTC instant. */
function nyOffsetMinutes(utcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return (asUtc - utcMs) / 60000;
}

export function parseIcalDate(value: string, params: string): string | null {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!m) return null;
  const [, y, mo, d, hh = "00", mi = "00", ss = "00", z] = m;
  const naive = Date.UTC(+y, +mo - 1, +d, +hh, +mi, +ss);
  if (z) return new Date(naive).toISOString();
  if (/VALUE=DATE(?!-)/i.test(params) || !m[4]) {
    // all-day: treat as noon NY to avoid date flipping
    return new Date(naive + 12 * 3600000 - nyOffsetMinutes(naive) * 60000).toISOString();
  }
  // floating or TZID → assume campus time (America/New_York)
  const off = nyOffsetMinutes(naive - nyOffsetMinutes(naive) * 60000);
  return new Date(naive - off * 60000).toISOString();
}

export function parseIcal(ics: string): IcalEvent[] {
  const lines = unfold(ics).split("\n");
  const events: IcalEvent[] = [];
  let cur: Record<string, { params: string; value: string }> | null = null;
  for (const line of lines) {
    if (line.startsWith("BEGIN:VEVENT")) { cur = {}; continue; }
    if (line.startsWith("END:VEVENT")) {
      if (cur) {
        const get = (k: string) => cur![k]?.value ?? "";
        events.push({
          uid: get("UID") || `${get("SUMMARY")}-${get("DTSTART")}`,
          summary: unescape(get("SUMMARY")),
          description: unescape(get("DESCRIPTION")),
          location: get("LOCATION") ? unescape(get("LOCATION")) : null,
          url: get("URL") || null,
          start: cur["DTSTART"] ? parseIcalDate(cur["DTSTART"].value, cur["DTSTART"].params) : null,
          end: cur["DTEND"] ? parseIcalDate(cur["DTEND"].value, cur["DTEND"].params) : null,
        });
      }
      cur = null;
      continue;
    }
    if (!cur) continue;
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const left = line.slice(0, idx);
    const [name, ...params] = left.split(";");
    cur[name.toUpperCase()] = { params: params.join(";"), value: line.slice(idx + 1).trim() };
  }
  return events;
}
