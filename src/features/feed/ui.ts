import type { Category, Source } from "@/lib/types";

export const CAT_STYLE: Record<Category, { emoji: string; chip: string; dot: string }> = {
  Event: { emoji: "📅", chip: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500" },
  "Free food": { emoji: "🍕", chip: "bg-amber-50 text-amber-800 ring-amber-200", dot: "bg-amber-500" },
  Opportunity: { emoji: "🚀", chip: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  "Club news": { emoji: "📣", chip: "bg-violet-50 text-violet-700 ring-violet-200", dot: "bg-violet-500" },
  Noise: { emoji: "🔇", chip: "bg-slate-100 text-slate-500 ring-slate-200", dot: "bg-slate-400" },
};

export const SOURCE_STYLE: Record<Source, { label: string; icon: string; cls: string }> = {
  email: { label: "Email", icon: "✉️", cls: "text-sky-700" },
  yaleconnect: { label: "YaleConnect", icon: "🏛️", cls: "text-yale" },
  fizz: { label: "Fixx", icon: "🫧", cls: "text-pink-600" },
};

const TZ = "America/New_York";

export function relTime(iso: string, now = Date.now()): string {
  const diff = Date.parse(iso) - now;
  const min = Math.round(diff / 60000);
  if (min < -30) return fmtTime(iso);
  if (min < 0) return "Happening now";
  if (min < 60) return `in ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h < 6) return `in ${h}h${m ? ` ${m}m` : ""}`;
  return fmtTime(iso);
}

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date().toLocaleDateString("en-US", { timeZone: TZ });
  const day = d.toLocaleDateString("en-US", { timeZone: TZ });
  const time = d.toLocaleTimeString("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
  if (day === today) return `Today ${time}`;
  const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString("en-US", { timeZone: TZ });
  if (day === tomorrow) return `Tomorrow ${time}`;
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
      dow: at.toLocaleDateString("en-US", { timeZone: TZ, weekday: "short" }).toUpperCase(),
      num: at.toLocaleDateString("en-US", { timeZone: TZ, day: "numeric" }),
    });
  }
  return days;
}

export function dayParts(iso: string | null): { dow: string; mon: string; num: string; time: string } {
  if (!iso) return { dow: "ANY", mon: "DAY", num: "—", time: "Time TBD" };
  const d = new Date(iso);
  return {
    dow: d.toLocaleDateString("en-US", { timeZone: TZ, weekday: "short" }).toUpperCase(),
    mon: d.toLocaleDateString("en-US", { timeZone: TZ, month: "short" }).toUpperCase(),
    num: d.toLocaleDateString("en-US", { timeZone: TZ, day: "numeric" }),
    time: d.toLocaleTimeString("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" }),
  };
}
