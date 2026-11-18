import type { Item } from "@/lib/types";

const TZ = "America/New_York";

export function relTime(iso: string, now = Date.now()): string {
  const diff = Date.parse(iso) - now;
  const min = Math.round(diff / 60000);
  if (min < -30) return fmtTime(iso, now);
  if (min < 0) return "Happening now";
  if (min < 60) return `in ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h < 6) return `in ${h}h${m ? ` ${m}m` : ""}`;
  return fmtTime(iso, now);
}

export function fmtTime(iso: string, now: number): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  const today = nyKey(new Date(now));
  const day = nyKey(d);
  const time = d.toLocaleTimeString("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
  if (day === today) return `Today ${time}`;
  if (day === addDays(today, 1)) return `Tomorrow ${time}`;
  return `${d.toLocaleDateString("en-US", { timeZone: TZ, weekday: "short", month: "short", day: "numeric" })} ${time}`;
}

export function ago(iso: string, now = Date.now()): string {
  const min = Math.max(0, Math.round((now - Date.parse(iso)) / 60000));
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function nyKey(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

export interface DayChip {
  key: string;
  dow: string;
  num: string;
}

export function upcomingDays(n = 7, now = Date.now()): DayChip[] {
  const today = nyKey(new Date(now));
  const days: DayChip[] = [];
  for (let i = 0; i < n; i++) {
    const key = addDays(today, i);
    const at = new Date(`${key}T15:00:00Z`);
    days.push({
      key,
      dow: at.toLocaleDateString("en-US", { timeZone: TZ, weekday: "short" }),
      num: at.toLocaleDateString("en-US", { timeZone: TZ, day: "numeric" }),
    });
  }
  return days;
}

export function itemTitle(item: Item): string {
  return item.demo ? item.title.replace(/^\[Sample Fizz\]\s*/i, "") : item.title;
}

export function itemSummary(item: Item): string {
  return item.demo ? item.summary.replace(/^Sample(?: Fizz post)?:\s*/i, "") : item.summary;
}
