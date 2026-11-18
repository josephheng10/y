"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { rankToday } from "@/lib/rank";
import { SOURCES, type Item, type Source } from "@/lib/types";
import {
  EMPTY_PROFILE, QUICKS, fitReason, itemMatchesQuick, loadProfile, saveProfile,
  sourceLabel, tuneScore, type Profile,
} from "@/lib/taste";
import DigPanel from "./DigPanel";
import ItemCard, { ItemDialog } from "./ItemCard";
import FeedSettings, { type FeedAccount, type FeedConfig } from "./FeedSettings";
import { itemTitle, nyKey, relTime, upcomingDays } from "../ui";

const views = [
  { id: "foryou", label: "For you" },
  { id: "tonight", label: "Tonight" },
  { id: "saved", label: "Saved" },
] as const;

type View = (typeof views)[number]["id"] | "tune" | "dig";
type SourceFilter = "all" | Source;

interface Props {
  initialItems: Item[];
  initialTime: number;
  user: FeedAccount | null;
  config: FeedConfig;
}

export default function Feed({ initialItems, initialTime, user, config }: Props) {
  const [items, setItems] = useState(initialItems);
  const [now, setNow] = useState(initialTime);
  const [view, setView] = useState<View>("foryou");
  const [quick, setQuick] = useState("foryou");
  const [source, setSource] = useState<SourceFilter>("all");
  const [day, setDay] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [open, setOpen] = useState<Item | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toolsMenu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    // Read device preferences after hydration so the first client render matches the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(loadProfile());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const days = useMemo(() => upcomingDays(7, now), [now]);
  const tonight = useMemo(() => {
    const visible = items.filter((item) => !profile.hidden.includes(item.id));
    return rankToday(visible, now, 12).sort((a, b) => tuneScore(b, profile, now) - tuneScore(a, profile, now));
  }, [items, now, profile]);

  const wall = useMemo(() => {
    const matches = items.filter((item) =>
      !profile.hidden.includes(item.id) &&
      (source === "all" || item.source === source) &&
      (!day || (item.starts_at && nyKey(item.starts_at) === day)) &&
      itemMatchesQuick(item, quick, profile.interests)
    );
    return matches.sort((a, b) => tuneScore(b, profile, now) - tuneScore(a, profile, now) ||
      b.created_at.localeCompare(a.created_at));
  }, [items, now, profile, quick, source, day]);

  const relaxed = quick === "foryou" && profile.interests.length > 0 && !day && source === "all" && wall.length === 0;
  const shown = relaxed
    ? items.filter((item) => item.category !== "Noise" && !profile.hidden.includes(item.id)).sort((a, b) => b.score - a.score)
    : wall;
  const savedItems = items.filter((item) => profile.going.includes(item.id) || profile.saved.includes(item.id));
  // If the feed is left open past the selected day, keep the active value available.
  const dateOptions = day && !days.some((entry) => entry.key === day)
    ? [...upcomingDays(1, Date.parse(`${day}T15:00:00Z`)), ...days]
    : days;

  function patch(next: Profile | ((profile: Profile) => Profile)) {
    const updated = typeof next === "function" ? next(profile) : next;
    setProfile(updated);
    try {
      saveProfile(updated);
    } catch {
      setToast("This browser couldn’t save your preferences.");
    }
  }

  function toggleId(list: "going" | "saved" | "hidden", id: string) {
    patch((current) => {
      const values = current[list];
      return { ...current, [list]: values.includes(id) ? values.filter((value) => value !== id) : [...values, id] };
    });
  }

  async function refresh() {
    const response = await fetch("/api/items", { cache: "no-store" });
    if (!response.ok) throw new Error("Couldn’t refresh the Wall.");
    const json = await response.json() as { items: Item[] };
    setItems(json.items);
    setNow(Date.now());
  }

  async function refreshFromMenu() {
    setRefreshing(true);
    try {
      await refresh();
      setToast("Wall refreshed");
    } catch (error) {
      setToast((error as Error).message);
    } finally {
      setRefreshing(false);
    }
  }

  async function share(item: Item) {
    const title = itemTitle(item);
    const text = [title, item.starts_at, item.location, item.url].filter(Boolean).join("\n");
    try {
      if (navigator.share) {
        await navigator.share({ title, text });
      } else {
        await navigator.clipboard.writeText(text);
        setToast("Copied to clipboard");
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setToast("Couldn’t share this post.");
    }
  }

  function spin() {
    const pool = (shown.length ? shown : items)
      .filter((item) => item.category !== "Noise" && !profile.hidden.includes(item.id)).slice(0, 8);
    if (pool.length) setOpen(pool[Math.floor(Math.random() * pool.length)]);
    else setToast("There’s nothing to pick from yet.");
  }

  function chooseTool(action: () => void) {
    if (toolsMenu.current) toolsMenu.current.open = false;
    action();
  }

  function actionsFor(item: Item) {
    return {
      going: profile.going.includes(item.id),
      saved: profile.saved.includes(item.id),
      onGoing: () => toggleId("going", item.id),
      onSave: () => toggleId("saved", item.id),
      onShare: () => void share(item),
    };
  }

  function hide(item: Item) {
    if (!profile.hidden.includes(item.id)) toggleId("hidden", item.id);
    setOpen(null);
    setToast("Hidden from the Wall");
  }

  const feedItems = view === "tonight" ? tonight : view === "saved" ? savedItems : shown;
  const filterCount = Number(source !== "all") + Number(day !== null);
  const settingsOpen = view === "tune" || view === "dig";

  return (
    <main className="feed-layout">
      <div className="min-w-0">
        <header className="mb-5 flex items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <h1 className="page-title">The Wall</h1>
            {profile.name.trim() && <p className="mt-0.5 truncate text-xs text-muted">Hi, {profile.name.trim()}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button type="button" className="pill bg-surface" aria-pressed={view === "tune"}
              onClick={() => setView(view === "tune" ? "foryou" : "tune")}>
              <Icon name="sliders" size={16} /> Tune feed
            </button>
            <details ref={toolsMenu} className="relative"
              onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false; }}
              onKeyDown={(event) => {
                if (event.key === "Escape" && event.currentTarget.open) {
                  event.currentTarget.open = false;
                  event.currentTarget.querySelector("summary")?.focus();
                }
              }}>
              <summary className="icon-button list-none bg-surface" aria-label="Wall options"><Icon name="more" /></summary>
              <div className="surface absolute top-full right-0 z-10 mt-2 grid min-w-42 p-1.5 shadow-lg">
                <button type="button" className="post-action justify-start" onClick={() => chooseTool(() => setView("dig"))}>
                  <Icon name="search" size={16} /> Dig campus
                </button>
                <button type="button" className="post-action justify-start" onClick={() => chooseTool(spin)}>
                  <Icon name="sparkles" size={16} /> Spin
                </button>
                <button type="button" className="post-action justify-start" disabled={refreshing}
                  onClick={() => chooseTool(() => void refreshFromMenu())}>
                  <Icon name="refresh" size={16} /> {refreshing ? "Refreshing…" : "Refresh"}
                </button>
              </div>
            </details>
          </div>
        </header>

        <div className="surface">
          <nav className="grid grid-cols-3 border-b border-line px-2 sm:px-5" aria-label="Wall views">
            {views.map(({ id, label }) => (
              <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)}
                className="border-b-2 border-transparent px-2 pt-3.5 pb-3 text-sm font-semibold text-muted hover:text-ink aria-pressed:border-accent aria-pressed:text-accent">
                {label}
                {id === "saved" && savedItems.length > 0 && <span className="ml-1.5 text-xs">{savedItems.length}</span>}
              </button>
            ))}
          </nav>
          {view === "foryou" && (
            <section className="border-b border-line px-4 py-3.5 sm:px-6" aria-label="Filter the Wall">
              <div className="flex items-center gap-2">
                <div className="chip-scroll flex min-w-0 flex-1 gap-1.5 overflow-x-auto p-1" role="group" aria-label="Topics">
                  {QUICKS.map(({ id, label }) => (
                    <button key={id} type="button" aria-pressed={quick === id} onClick={() => setQuick(id)}
                      className="pill min-h-9 shrink-0 whitespace-nowrap">
                      {id === "foryou" ? "All topics" : label}
                    </button>
                  ))}
                </div>
                <button type="button" className={`pill shrink-0 ${filtersOpen || filterCount ? "bg-accent-soft text-accent" : ""}`}
                  onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen} aria-controls="wall-filters">
                  <Icon name="sliders" size={16} /> Filters{filterCount > 0 && ` ${filterCount}`}
                </button>
              </div>
              <div id="wall-filters" hidden={!filtersOpen}>
                <div className="mt-2 flex flex-wrap items-end gap-3 rounded-xl bg-canvas p-3">
                  <label className="min-w-32 flex-1 text-xs font-semibold text-muted">
                    Date
                    <select className="field mt-1" value={day ?? ""} onChange={(event) => setDay(event.target.value || null)}>
                      <option value="">Any day</option>
                      {dateOptions.map(({ key, dow, num }) => <option value={key} key={key}>{dow} {num}</option>)}
                    </select>
                  </label>
                  <label className="min-w-32 flex-1 text-xs font-semibold text-muted">
                    Source
                    <select className="field mt-1" value={source} onChange={(event) => setSource(event.target.value as SourceFilter)}>
                      <option value="all">All sources</option>
                      {SOURCES.map((entry) => <option value={entry} key={entry}>{sourceLabel(entry)}</option>)}
                    </select>
                  </label>
                  {filterCount > 0 && (
                    <button type="button" className="post-action" onClick={() => { setDay(null); setSource("all"); }}>Clear</button>
                  )}
                </div>
              </div>
            </section>
          )}

          {settingsOpen ? (
            <div className="p-4 sm:p-6">
              {view === "tune" ? (
                <FeedSettings profile={profile} onChange={patch} user={user} config={config}
                  onDig={() => setView("dig")} onIngested={refresh} />
              ) : <DigPanel profile={profile} onChange={patch} onIngested={refresh} />}
            </div>
          ) : (
            <>
              {view === "tonight" && <p className="border-b border-line px-4 py-3 text-sm text-muted sm:px-6">Starting in the next six hours</p>}
              {view === "foryou" && relaxed && (
                <p className="border-b border-line px-4 py-3 text-sm text-muted sm:px-6">Showing all campus posts. There are no matches for your interests yet.</p>
              )}
              {feedItems.length ? (
                <div className="divide-y divide-line">
                  {feedItems.map((item) => (
                    <ItemCard key={item.id} item={item} now={now} reason={fitReason(item, profile)}
                      onOpen={() => setOpen(item)} {...actionsFor(item)} />
                  ))}
                </div>
              ) : (
                <div className="grid justify-items-center px-6 py-12 text-center">
                  <span className="mb-3 grid size-12 place-items-center rounded-full bg-accent-soft text-accent">
                    <Icon name={view === "saved" ? "bookmark" : view === "tonight" ? "moon" : "posts"} />
                  </span>
                  <p className="font-semibold">
                    {view === "saved" ? "Nothing saved yet" : view === "tonight" ? "Nothing coming up yet" : "No matching posts"}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {view === "saved" ? "Save a post or mark it as going to find it here." :
                      view === "tonight" ? "Browse Events for more dates." : "Try a different topic, date, or source."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <aside className="feed-aside sticky top-23 grid gap-4" aria-label="Around campus">
        <Link href="/events"
          className="campus-link group flex min-h-37 items-end justify-between gap-3 rounded-[18px] p-4 text-white">
          <span className="text-[17px] leading-tight font-bold tracking-tight">Explore campus events</span>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/20 group-hover:bg-white/35">
            <Icon name="arrow" size={17} />
          </span>
        </Link>
        <section className="surface px-4 pt-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold tracking-[-0.02em]">Up next</h2>
            <button type="button" onClick={() => setView("tonight")} className="text-xs font-semibold text-accent hover:underline">See tonight</button>
          </div>
          {tonight.length ? (
            <ul className="mt-1 divide-y divide-line">
              {tonight.slice(0, 3).map((item) => (
                <li key={item.id}>
                  <button type="button" className="group grid w-full grid-cols-[32px_minmax(0,1fr)] items-start gap-2.5 py-3 text-left"
                    onClick={() => setOpen(item)}>
                    <span className="grid size-8 place-items-center rounded-[10px] bg-accent-soft text-accent"><Icon name="clock" size={16} /></span>
                    <span className="min-w-0">
                      <span className="block text-[13px] leading-snug font-semibold group-hover:text-accent">{itemTitle(item)}</span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {item.starts_at && relTime(item.starts_at, now)}{item.demo && " · Sample"}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : <p className="py-3 text-sm text-muted">No events in the next six hours.</p>}
        </section>
        <Link href="/ask" className="group flex items-center gap-3 rounded-[16px] bg-accent-soft p-3.5 text-accent">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface"><Icon name="sparkles" size={19} /></span>
          <span className="flex-1 text-sm font-semibold">Ask about campus</span>
          <span className="group-hover:translate-x-0.5"><Icon name="arrow" size={17} /></span>
        </Link>
      </aside>

      {open && (
        <ItemDialog item={open} now={now} reason={fitReason(open, profile)} status={toast} {...actionsFor(open)}
          onHide={() => hide(open)} onClose={() => setOpen(null)} />
      )}
      <div role="status" className="pointer-events-none fixed right-4 bottom-20 left-4 z-30 flex justify-center sm:bottom-6">
        {toast && !open && <p className="rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-lg">{toast}</p>}
      </div>
    </main>
  );
}
