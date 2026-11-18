"use client";

import { useMemo, useState } from "react";
import {
  CAMPUS_SOURCES,
  planDig,
  suggestedIds,
  type CampusKind,
  type CampusSource,
} from "@/lib/campus/catalog";
import { toggleFollow, type Profile } from "@/lib/taste";

interface Look {
  id: string;
  name: string;
  kind: CampusKind;
  status: "ok" | "empty" | "no-feed" | "later" | "error";
  events: number;
  note?: string;
}

const KINDS: { id: CampusKind; label: string }[] = [
  { id: "calendar", label: "Calendars" },
  { id: "newsletter", label: "Newsletters" },
  { id: "list", label: "Mailing lists" },
];

export default function DigPanel({
  profile,
  onChange,
  onIngested,
}: {
  profile: Profile;
  onChange: (next: Profile | ((profile: Profile) => Profile)) => void;
  onIngested: () => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [looked, setLooked] = useState<Look[] | null>(null);
  const [kept, setKept] = useState<number | null>(null);

  const plan = useMemo(
    () => planDig({ ids: profile.follows, interests: profile.interests, college: profile.college }),
    [profile.follows, profile.interests, profile.college],
  );
  const needle = query.trim().toLowerCase();

  async function dig() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/ingest/campus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: profile.follows,
          interests: profile.interests,
          college: profile.college,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Dig failed");
      setLooked(json.looked ?? []);
      setKept(json.ingested ?? 0);
      await onIngested();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-display text-6xl leading-none">Dig</h2>
        <p className="mt-2 max-w-md text-sm text-neutral-400">
          Pick calendars, newsletters, and lists. Each pass opens up to eight public feeds and puts the events on your wall.
          It does not join a list or open anyone&apos;s inbox. Franklin, Pauli Murray, and Silliman are the colleges with a public Google Calendar.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange({ ...profile, follows: suggestedIds(profile), tuned: true })}
          className="border border-white/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-200"
        >
          Match my interests
        </button>
        {profile.follows.length > 0 && (
          <button
            type="button"
            onClick={() => onChange({ ...profile, follows: [] })}
            className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500"
          >
            Clear
          </button>
        )}
      </div>

      <div className="border border-white/10 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
          {plan.automatic ? "This pass, from your cut" : "This pass"}
        </p>
        <p className="mt-2 text-sm text-neutral-200">
          {plan.pulls.length ? plan.pulls.map((source) => source.name).join(" · ") : "Nothing public to open."}
        </p>
        <button
          type="button"
          onClick={() => void dig()}
          disabled={busy || plan.pulls.length === 0}
          className="mt-3 bg-cyan px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black disabled:opacity-40"
        >
          {busy ? "Digging" : "Dig campus"}
        </button>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        {kept !== null && !error && (
          <p className="mt-3 text-sm text-neutral-300">{kept} events on the wall from this pass.</p>
        )}
        {looked && (
          <ul className="mt-3 space-y-1 text-xs text-neutral-400">
            {looked.map((row) => (
              <li key={row.id}>
                {row.name}: {statusLine(row)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search Tsai, SOM, athletics"
        className="w-full border border-white/15 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-neutral-600 focus:border-cyan"
      />

      {KINDS.map((kind) => {
        const rows = CAMPUS_SOURCES.filter((source) => source.kind === kind.id && matches(source, needle));
        if (!rows.length) return null;
        return (
          <div key={kind.id}>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">{kind.label}</h3>
            <div className="mt-3 divide-y divide-white/10 border border-white/10">
              {rows.map((source) => {
                const on = profile.follows.includes(source.id);
                return (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => onChange((current) => toggleFollow(current, source.id))}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
                  >
                    <span>
                      <span className="block text-sm">{source.name}</span>
                      <span className="block text-xs text-neutral-500">{source.blurb}</span>
                    </span>
                    <span className={`shrink-0 text-[11px] font-semibold uppercase tracking-[0.16em] ${on ? "text-cyan" : "text-neutral-500"}`}>
                      {on ? "On" : "Add"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function matches(source: CampusSource, needle: string) {
  if (!needle) return true;
  return `${source.name} ${source.blurb}`.toLowerCase().includes(needle);
}

function statusLine(row: Look) {
  if (row.status === "ok") return row.events ? `${row.events} upcoming` : "opened";
  if (row.status === "empty") return "nothing upcoming";
  if (row.status === "no-feed") return row.note ?? "no public feed";
  if (row.status === "later") return "next pass";
  return row.note ?? "could not open";
}
