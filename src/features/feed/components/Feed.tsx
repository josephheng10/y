"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { SiteNav } from "@/components/SiteNav";
import { rankToday } from "@/lib/rank";
import type { Item, Source } from "@/lib/types";
import {
  COLLEGES,
  EMPTY_PROFILE,
  INTERESTS,
  NEEDS,
  QUICKS,
  fitReason,
  itemMatchesQuick,
  loadProfile,
  saveProfile,
  sourceLabel,
  toggleInterest,
  toggleNeed,
  tuneScore,
  type Profile,
} from "@/lib/taste";
import ItemCard, { TicketBody } from "./ItemCard";
import TodayCard from "./TodayCard";
import DigPanel from "./DigPanel";
import { nyKey, upcomingDays } from "../ui";

interface Props {
  initialItems: Item[];
  user: { email: string; provider: string | null } | null;
  config: { google: boolean; microsoft: boolean; yaleconnect: boolean; llm: boolean; store: string; demo: boolean };
}

type Tab = "foryou" | "tonight" | "tickets" | "you";
type SourceFilter = "all" | Source;

export default function Feed({ initialItems, user, config }: Props) {
  const [items, setItems] = useState(initialItems);
  const [tab, setTab] = useState<Tab>("foryou");
  const [quick, setQuick] = useState("foryou");
  const [source, setSource] = useState<SourceFilter>("all");
  const [day, setDay] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState<Item | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setProfile(loadProfile());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveProfile(profile);
  }, [profile, ready]);

  const days = useMemo(() => upcomingDays(7), []);
  const tonight = useMemo(() => {
    const ranked = rankToday(items, Date.now(), 12).filter((item) => !profile.hidden.includes(item.id));
    return [...ranked].sort((a, b) => tuneScore(b, profile) - tuneScore(a, profile));
  }, [items, profile]);

  const wall = useMemo(() => {
    const pool = items.filter((item) => {
      if (profile.hidden.includes(item.id)) return false;
      if (source !== "all" && item.source !== source) return false;
      if (day && (!item.starts_at || nyKey(item.starts_at) !== day)) return false;
      return itemMatchesQuick(item, quick, profile.interests);
    });
    const matched = [...pool].sort((a, b) => tuneScore(b, profile) - tuneScore(a, profile) || b.created_at.localeCompare(a.created_at));
    return matched;
  }, [items, profile, quick, source, day]);

  const relaxed = quick === "foryou" && profile.interests.length > 0 && !day && source === "all" && wall.length === 0;
  const shown = relaxed
    ? items
        .filter((item) => item.category !== "Noise" && !profile.hidden.includes(item.id))
        .sort((a, b) => b.score - a.score)
    : wall;

  const hero =
    tab === "foryou"
      ? tonight.find(
          (item) =>
            !profile.hidden.includes(item.id) &&
            (source === "all" || item.source === source) &&
            (!day || (item.starts_at && nyKey(item.starts_at) === day)) &&
            itemMatchesQuick(item, quick, profile.interests),
        ) ?? shown[0]
      : undefined;
  const rail = tonight.filter((item) => item.id !== hero?.id && itemMatchesQuick(item, quick, profile.interests)).slice(0, 8);
  const tonightIds = new Set([hero?.id, ...rail.map((item) => item.id)].filter(Boolean));
  const grid = shown.filter((item) => !tonightIds.has(item.id));

  const tickets = items.filter((item) => profile.going.includes(item.id) || profile.saved.includes(item.id));
  const dayCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      if (!item.starts_at || item.category === "Noise") continue;
      const key = nyKey(item.starts_at);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [items]);

  function patch(next: Profile | ((profile: Profile) => Profile)) {
    setProfile(next);
  }

  function toggleId(list: "going" | "saved" | "hidden", id: string) {
    patch((current) => {
      const has = current[list].includes(id);
      return { ...current, [list]: has ? current[list].filter((x) => x !== id) : [...current[list], id] };
    });
  }

  async function refresh() {
    const response = await fetch("/api/items", { cache: "no-store" });
    const json = await response.json();
    setItems(json.items);
  }

  async function sync(path: string, label: string) {
    setBusy(label);
    try {
      const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const json = await response.json();
      setToast(response.ok ? `${label}: ${json.ingested ?? 0} new` : `${label}: ${json.error}`);
      await refresh();
    } catch (error) {
      setToast(`${label} failed: ${(error as Error).message}`);
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 4000);
    }
  }

  async function share(item: Item) {
    const text = [`Y · ${item.title}`, item.starts_at ? item.starts_at : null, item.location].filter(Boolean).join("\n");
    try {
      if (navigator.share) await navigator.share({ title: item.title, text });
      else {
        await navigator.clipboard.writeText(text);
        setToast("Copied");
        setTimeout(() => setToast(null), 2000);
      }
    } catch {
      /* user cancelled share */
    }
  }

  function spin() {
    const pool = (shown.length ? shown : items).filter((item) => item.category !== "Noise").slice(0, 8);
    if (!pool.length) return;
    setOpen(pool[Math.floor(Math.random() * pool.length)]);
  }

  const displayName = profile.name.trim();
  const openReason = open ? fitReason(open, profile) : null;

  return (
    <div className="min-h-dvh bg-[#070708] text-ink">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070708]/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-baseline gap-3">
            <h1 className="font-display text-4xl leading-none tracking-tight">Y</h1>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
              {displayName ? `${displayName} · New Haven` : "New Haven"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <HeaderBtn onClick={spin}>Spin</HeaderBtn>
            <HeaderBtn onClick={() => setTab("you")}>Dig</HeaderBtn>
            <HeaderBtn onClick={() => { setTab("you"); }}>Tune</HeaderBtn>
            <HeaderBtn onClick={() => void refresh()}>Refresh</HeaderBtn>
          </div>
        </div>
        <SiteNav current="/" />
        {tab === "foryou" && (
          <div className="mx-auto max-w-5xl px-4 pb-3">
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
              <DayButton active={day === null} onClick={() => setDay(null)} dow="ALL" num="·" count={items.filter((i) => i.category !== "Noise").length} />
              {days.map((chip) => (
                <DayButton
                  key={chip.key}
                  active={day === chip.key}
                  onClick={() => setDay(day === chip.key ? null : chip.key)}
                  dow={chip.dow}
                  num={chip.num}
                  count={dayCounts[chip.key] ?? 0}
                />
              ))}
            </div>
            <div className="no-scrollbar -mx-4 mt-3 flex gap-4 overflow-x-auto px-4">
              {QUICKS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setQuick(entry.id)}
                  className={`shrink-0 border-b-2 pb-1 text-[12px] font-semibold uppercase tracking-[0.16em] ${
                    quick === entry.id ? "border-cyan text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  {entry.label}
                </button>
              ))}
            </div>
            <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
              {(["all", "email", "yaleconnect", "fizz", "campus"] as SourceFilter[]).map((entry) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => setSource(entry)}
                  className={`shrink-0 border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                    source === entry ? "border-white bg-white text-black" : "border-white/15 text-neutral-400 hover:border-white/40"
                  }`}
                >
                  {entry === "all" ? "All sources" : sourceLabel(entry)}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 pb-28 pt-6">
        {tab === "foryou" && ready && !profile.tuned && (
          <TuneBlock profile={profile} onChange={patch} onDone={() => patch((current) => ({ ...current, tuned: true }))} />
        )}

        {tab === "foryou" && (
          <>
            {relaxed && (
              <p className="border border-white/10 px-4 py-3 text-sm text-neutral-300">
                Nothing on this cut matches your list. Showing the rest of campus.
              </p>
            )}
            {hero && (
              <ItemCard
                item={hero}
                layout="hero"
                reason={fitReason(hero, profile)}
                going={profile.going.includes(hero.id)}
                saved={profile.saved.includes(hero.id)}
                onOpen={() => setOpen(hero)}
                onGoing={() => toggleId("going", hero.id)}
                onSave={() => toggleId("saved", hero.id)}
                onHide={() => toggleId("hidden", hero.id)}
                onShare={() => void share(hero)}
              />
            )}
            <TodayCard items={rail} onOpen={setOpen} />
            {(grid.length > 0 || (!hero && rail.length === 0)) && (
            <section>
              <div className="mb-4 flex items-end justify-between">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                  {quick === "foryou" ? "After that" : QUICKS.find((q) => q.id === quick)?.label}
                </h2>
                <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-600">{grid.length}</span>
              </div>
              {grid.length === 0 ? (
                <p className="border border-white/10 px-4 py-8 text-center text-sm text-neutral-400">Nothing on this cut.</p>
              ) : (
                <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2">
                  {grid.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      reason={fitReason(item, profile)}
                      going={profile.going.includes(item.id)}
                      saved={profile.saved.includes(item.id)}
                      onOpen={() => setOpen(item)}
                      onGoing={() => toggleId("going", item.id)}
                      onSave={() => toggleId("saved", item.id)}
                      onHide={() => toggleId("hidden", item.id)}
                      onShare={() => void share(item)}
                    />
                  ))}
                </div>
              )}
            </section>
            )}
          </>
        )}

        {tab === "tonight" && (
          <section className="space-y-8">
            <div>
              <h2 className="font-display text-6xl leading-none">Tonight</h2>
              <p className="mt-2 text-sm text-neutral-400">The next six hours, free food first.</p>
            </div>
            {tonight.length === 0 ? (
              <p className="border border-white/10 px-4 py-8 text-sm text-neutral-400">Quiet window. Check the wall.</p>
            ) : (
              tonight.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  layout="hero"
                  reason={fitReason(item, profile)}
                  going={profile.going.includes(item.id)}
                  saved={profile.saved.includes(item.id)}
                  onOpen={() => setOpen(item)}
                  onGoing={() => toggleId("going", item.id)}
                  onSave={() => toggleId("saved", item.id)}
                  onHide={() => toggleId("hidden", item.id)}
                  onShare={() => void share(item)}
                />
              ))
            )}
          </section>
        )}

        {tab === "tickets" && (
          <section className="space-y-6">
            <div>
              <h2 className="font-display text-6xl leading-none">Tickets</h2>
              <p className="mt-2 text-sm text-neutral-400">Things you said you&apos;re going to, and the ones you saved.</p>
            </div>
            {tickets.length === 0 ? (
              <p className="border border-white/10 px-4 py-8 text-sm text-neutral-400">
                Nothing in your pocket. Hit I&apos;m going on a flyer.
              </p>
            ) : (
              <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2">
                {tickets.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    note={profile.going.includes(item.id) ? "You're going" : "Saved"}
                    going={profile.going.includes(item.id)}
                    saved={profile.saved.includes(item.id)}
                    onOpen={() => setOpen(item)}
                    onGoing={() => toggleId("going", item.id)}
                    onSave={() => toggleId("saved", item.id)}
                    onHide={() => toggleId("hidden", item.id)}
                    onShare={() => void share(item)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "you" && (
          <div className="space-y-16">
            <DigPanel profile={profile} onChange={patch} onIngested={refresh} />
            <YouPanel
            profile={profile}
            user={user}
            config={config}
            busy={busy}
            onChange={patch}
            onSync={sync}
            onSignIn={(provider) => void signIn(provider)}
            onSignOut={() => void signOut({ callbackUrl: "/" })}
          />
          </div>
        )}
      </main>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/80 p-3 sm:items-center" onClick={() => setOpen(null)}>
          <div onClick={(event) => event.stopPropagation()} className="max-h-[92dvh] w-full max-w-md overflow-y-auto">
            <TicketBody
              item={open}
              reason={openReason}
              going={profile.going.includes(open.id)}
              saved={profile.saved.includes(open.id)}
              onGoing={() => toggleId("going", open.id)}
              onSave={() => toggleId("saved", open.id)}
              onShare={() => void share(open)}
              onHide={() => {
                toggleId("hidden", open.id);
                setOpen(null);
              }}
              onClose={() => setOpen(null)}
            />
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 border border-white/15 bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em]">
          {toast}
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#070708]/95 backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-4 pb-[env(safe-area-inset-bottom)]">
          <NavButton active={tab === "foryou"} onClick={() => setTab("foryou")} label="For you" />
          <NavButton active={tab === "tonight"} onClick={() => setTab("tonight")} label="Tonight" />
          <NavButton active={tab === "tickets"} onClick={() => setTab("tickets")} label="Tickets" count={tickets.length} />
          <NavButton active={tab === "you"} onClick={() => setTab("you")} label="You" />
        </div>
      </nav>
    </div>
  );
}

function HeaderBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border border-white/15 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-200 hover:border-white/50"
    >
      {children}
    </button>
  );
}

function DayButton({
  active,
  onClick,
  dow,
  num,
  count,
}: {
  active: boolean;
  onClick: () => void;
  dow: string;
  num: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-12 shrink-0 flex-col items-center py-1.5 ${active ? "bg-white text-black" : "text-neutral-400 hover:text-white"}`}
    >
      <span className="text-[9px] font-semibold tracking-[0.16em]">{dow}</span>
      <span className="font-display text-2xl leading-none">{num}</span>
      <span className={`text-[9px] ${active ? "text-black/60" : "text-neutral-600"}`}>{count || "·"}</span>
    </button>
  );
}

function NavButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-3 text-[11px] font-semibold uppercase tracking-[0.16em] ${active ? "text-cyan" : "text-neutral-500"}`}
    >
      {label}
      {count ? ` ${count}` : ""}
    </button>
  );
}

function TuneBlock({
  profile,
  onChange,
  onDone,
}: {
  profile: Profile;
  onChange: (next: Profile | ((profile: Profile) => Profile)) => void;
  onDone: () => void;
}) {
  return (
    <section className="border border-white/10">
      <div className="px-4 py-5 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan">Tune Y</p>
        <h2 className="mt-2 max-w-[14ch] font-display text-6xl leading-[0.85]">What are you leaving your room for?</h2>
        <p className="mt-3 max-w-md text-sm text-neutral-400">Pick a few. The wall reorders around them. Under You, the digger opens the public calendars and lists that match.</p>
        <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
          {COLLEGES.map((college) => {
            const on = profile.college === college;
            return (
              <button
                key={college}
                type="button"
                onClick={() => onChange({ ...profile, college: on ? null : college })}
                className={`shrink-0 border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                  on ? "border-white bg-white text-black" : "border-white/15 text-neutral-400"
                }`}
              >
                {college}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3">
        {NEEDS.map((need) => {
          const on = profile.needs.includes(need.id);
          return (
            <button
              key={need.id}
              type="button"
              onClick={() => onChange((current) => toggleNeed(current, need.id))}
              className="min-h-32 border border-black/40 px-3 py-3 text-left"
              style={{ background: need.bg, color: need.fg, outline: on ? "2px solid #20CCEE" : undefined, outlineOffset: "-2px" }}
            >
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] opacity-70">{on ? "On your list" : "Add"}</span>
              <span className="mt-3 block font-display text-3xl leading-none">{need.label}</span>
              <span className="mt-2 block text-xs opacity-75">{need.sub}</span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2 px-4 py-4">
        <button type="button" onClick={onDone} className="bg-cyan px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black">
          Build my night
        </button>
        <button type="button" onClick={onDone} className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
          Show everything
        </button>
      </div>
    </section>
  );
}

function YouPanel({
  profile,
  user,
  config,
  busy,
  onChange,
  onSync,
  onSignIn,
  onSignOut,
}: {
  profile: Profile;
  user: { email: string; provider: string | null } | null;
  config: Props["config"];
  busy: string | null;
  onChange: (next: Profile | ((profile: Profile) => Profile)) => void;
  onSync: (path: string, label: string) => void;
  onSignIn: (provider: string) => void;
  onSignOut: () => void;
}) {
  return (
    <section className="space-y-10">
      <div>
        <h2 className="font-display text-6xl leading-none">You</h2>
        <p className="mt-2 max-w-md text-sm text-neutral-400">This stays on this phone. It only changes the order of the wall.</p>
      </div>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Name on the list</span>
        <input
          value={profile.name}
          onChange={(event) => onChange({ ...profile, name: event.target.value, tuned: true })}
          placeholder="What should we call you"
          className="mt-2 w-full border border-white/15 bg-transparent px-3 py-3 text-lg outline-none placeholder:text-neutral-600 focus:border-cyan"
        />
      </label>

      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Needs</h3>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {NEEDS.map((need) => {
            const on = profile.needs.includes(need.id);
            return (
              <button
                key={need.id}
                type="button"
                onClick={() => onChange((current) => ({ ...toggleNeed(current, need.id), tuned: true }))}
                className="border px-3 py-3 text-left"
                style={{
                  background: on ? need.bg : "transparent",
                  color: on ? need.fg : "#a3a3a3",
                  borderColor: on ? need.bg : "rgba(255,255,255,0.15)",
                }}
              >
                <span className="block font-display text-2xl leading-none">{need.label}</span>
                <span className="mt-1 block text-[11px] uppercase tracking-[0.12em] opacity-70">{need.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Finer cuts</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {INTERESTS.map((interest) => {
            const on = profile.interests.includes(interest.id);
            return (
              <button
                key={interest.id}
                type="button"
                onClick={() => onChange((current) => ({ ...toggleInterest(current, interest.id), tuned: true }))}
                className={`border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                  on ? "border-cyan bg-cyan text-black" : "border-white/15 text-neutral-300"
                }`}
              >
                {interest.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">College</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...profile, college: null, tuned: true })}
            className={`border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${
              profile.college === null ? "border-white bg-white text-black" : "border-white/15 text-neutral-400"
            }`}
          >
            Any
          </button>
          {COLLEGES.map((college) => (
            <button
              key={college}
              type="button"
              onClick={() => onChange({ ...profile, college, tuned: true })}
              className={`border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                profile.college === college ? "border-white bg-white text-black" : "border-white/15 text-neutral-400"
              }`}
            >
              {college}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Account</h3>
        <div className="mt-3 divide-y divide-white/10 border border-white/10">
          {user ? (
            <>
              <div className="px-4 py-3">
                <p className="text-sm">{user.email}</p>
                <p className="text-xs text-neutral-500">
                  {user.provider === "google" ? "Gmail" : user.provider === "azure-ad" ? "Outlook" : "Email and password"}
                </p>
              </div>
              <SourceRow title="Sign out" detail="End this session" enabled onClick={onSignOut} />
            </>
          ) : (
            <Link href="/login" className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left">
              <span>
                <span className="block text-sm">Sign in</span>
                <span className="block text-xs text-neutral-500">Email, Gmail, or Outlook</span>
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan">Open</span>
            </Link>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Sources</h3>
        <div className="mt-3 divide-y divide-white/10 border border-white/10">
          {user && (user.provider === "google" || user.provider === "azure-ad") ? (
            <SourceRow
              title={busy === "Email" ? "Syncing mail" : "Sync listservs"}
              detail={user.email}
              enabled
              onClick={() => onSync("/api/ingest/email", "Email")}
            />
          ) : (
            <>
              <SourceRow title="Connect Gmail" detail={config.google ? "Read-only listservs" : "Needs Google keys"} enabled={config.google} onClick={() => onSignIn("google")} />
              <SourceRow title="Connect Outlook" detail={config.microsoft ? "Yale or personal" : "Needs Microsoft keys"} enabled={config.microsoft} onClick={() => onSignIn("azure-ad")} />
            </>
          )}
          <SourceRow
            title={busy === "YaleConnect" ? "Syncing YaleConnect" : "Pull YaleConnect"}
            detail={config.yaleconnect ? "iCal feeds" : "Paste a feed URL in env"}
            enabled={config.yaleconnect}
            onClick={() => onSync("/api/ingest/yaleconnect", "YaleConnect")}
          />
          <div className="px-4 py-3">
            <p className="text-sm">Fizz</p>
            <p className="text-xs text-neutral-500">Your friend posts into /api/ingest/fizz. Sample posts are already on the wall.</p>
          </div>
        </div>
        <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-neutral-600">
          Tagging {config.llm ? "with a model" : "offline"} · store {config.store}
          {config.demo ? " · sample data on" : ""}
        </p>
      </div>

      {profile.hidden.length > 0 && (
        <button
          type="button"
          onClick={() => onChange({ ...profile, hidden: [] })}
          className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400"
        >
          Bring back {profile.hidden.length} passed {profile.hidden.length === 1 ? "flyer" : "flyers"}
        </button>
      )}
    </section>
  );
}

function SourceRow({
  title,
  detail,
  enabled,
  onClick,
}: {
  title: string;
  detail: string;
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span>
        <span className="block text-sm">{title}</span>
        <span className="block text-xs text-neutral-500">{detail}</span>
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan">{enabled ? "Open" : "Off"}</span>
    </button>
  );
}
