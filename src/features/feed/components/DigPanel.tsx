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
        <h2 className="text-xl font-bold tracking-tight">Dig campus</h2>
        <p className="mt-1 text-sm text-muted">
          Follow public calendars, newsletters, and mailing lists. Each dig checks up to eight feeds for events to add to the Wall.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange({ ...profile, follows: suggestedIds(profile), tuned: true })}
          className="pill"
        >
          Match my interests
        </button>
        {profile.follows.length > 0 && (
          <button
            type="button"
            onClick={() => onChange({ ...profile, follows: [] })}
            className="post-action"
          >
            Clear
          </button>
        )}
      </div>

      <div className="rounded-xl bg-canvas px-4 py-3">
        <p className="text-sm font-semibold">
          {plan.automatic ? "Suggested feeds" : "Feeds for this dig"}
        </p>
        <p className="mt-2 text-sm text-muted">
          {plan.pulls.length ? plan.pulls.map((source) => source.name).join(" · ") : "No feeds selected."}
        </p>
        <button
          type="button"
          onClick={() => void dig()}
          disabled={busy || plan.pulls.length === 0}
          className="primary-button mt-3"
        >
          {busy ? "Checking feeds…" : "Check feeds"}
        </button>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        {kept !== null && !error && (
          <p role="status" className="mt-3 text-sm text-muted">{kept} events added to the Wall.</p>
        )}
        {looked && (
          <ul className="mt-3 space-y-1 text-xs text-muted">
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
        type="search"
        aria-label="Search campus sources"
        placeholder="Search campus sources"
        className="field"
      />

      {KINDS.map((kind) => {
        const rows = CAMPUS_SOURCES.filter((source) => source.kind === kind.id && matches(source, needle));
        if (!rows.length) return null;
        return (
          <div key={kind.id}>
            <h3 className="text-sm font-bold">{kind.label}</h3>
            <div className="mt-1 divide-y divide-line">
              {rows.map((source) => {
                const on = profile.follows.includes(source.id);
                return (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => onChange((current) => toggleFollow(current, source.id))}
                    aria-pressed={on}
                    className="group flex w-full items-center justify-between gap-4 py-3 text-left"
                  >
                    <span>
                      <span className="block text-sm font-semibold group-hover:text-accent">{source.name}</span>
                      <span className="block text-xs text-muted">{source.blurb}</span>
                    </span>
                    <span className={`pill min-h-8 shrink-0 ${on ? "bg-accent-soft text-accent" : ""}`}>
                      {on ? "Following" : "Follow"}
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
