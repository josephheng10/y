"use client";

import type { ReactNode } from "react";
import type { Item } from "@/lib/types";
import { posterFor, refCode, sourceLabel, type PosterSkin } from "@/lib/taste";
import { dayParts, relTime } from "../ui";

export default function ItemCard({
  item,
  reason,
  note,
  going,
  saved,
  layout = "grid",
  onOpen,
  onGoing,
  onSave,
  onHide,
  onShare,
}: {
  item: Item;
  reason?: string | null;
  note?: string | null;
  going?: boolean;
  saved?: boolean;
  layout?: "grid" | "rail" | "hero";
  onOpen: () => void;
  onGoing?: () => void;
  onSave?: () => void;
  onHide?: () => void;
  onShare?: () => void;
}) {
  const skin = posterFor(item);
  const parts = dayParts(item.starts_at);
  const when = item.starts_at ? relTime(item.starts_at) : "Whenever";

  if (layout === "rail") {
    return (
      <button type="button" onClick={onOpen} className="w-[11.5rem] shrink-0 text-left">
        <PosterFace item={item} skin={skin} parts={parts} compact />
      </button>
    );
  }

  if (layout === "hero") {
    return (
      <article className="overflow-hidden border border-white/10">
        <button type="button" onClick={onOpen} className="block w-full text-left">
          <div className="relative min-h-[22rem] px-5 pb-6 pt-5 sm:min-h-[26rem]" style={{ background: skin.bg, color: skin.fg }}>
            <div className="flex items-start justify-between text-[11px] font-semibold uppercase tracking-[0.22em]">
              <span>Tonight</span>
              <span style={{ color: skin.accent }}>{skin.vibe}</span>
            </div>
            <p className="mt-10 font-display text-[7.5rem] leading-none tracking-tight sm:text-[9rem]">{parts.num}</p>
            <p className="text-sm font-semibold uppercase tracking-[0.18em]">
              {parts.dow} {parts.mon} · {parts.time}
            </p>
            <h2 className="mt-6 max-w-[16ch] font-display text-5xl leading-[0.9] tracking-tight sm:text-6xl">{item.title}</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed opacity-80">{item.summary}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
              <span>{item.location ?? "New Haven"}</span>
              <span style={{ color: skin.accent }}>{sourceLabel(item.source)}</span>
              {item.demo && <span className="opacity-60">Sample</span>}
            </div>
          </div>
        </button>
        <ActionBar
          item={item}
          reason={reason}
          note={note}
          going={going}
          saved={saved}
          onGoing={onGoing}
          onSave={onSave}
          onHide={onHide}
          onShare={onShare}
          onOpen={onOpen}
        />
      </article>
    );
  }

  return (
    <article className="flex flex-col">
      <button type="button" onClick={onOpen} className="block text-left">
        <PosterFace item={item} skin={skin} parts={parts} />
      </button>
      <div className="px-0.5 pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[17px] font-semibold leading-snug tracking-tight">{item.title}</h3>
        </div>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-neutral-400">{item.summary}</p>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
          {when}
          {item.location ? ` · ${item.location}` : ""}
          {` · ${sourceLabel(item.source)}`}
        </p>
      </div>
      <ActionBar
        item={item}
        reason={reason}
        note={note}
        going={going}
        saved={saved}
        onGoing={onGoing}
        onSave={onSave}
        onHide={onHide}
        onShare={onShare}
        onOpen={onOpen}
      />
    </article>
  );
}

function PosterFace({
  item,
  skin,
  parts,
  compact = false,
}: {
  item: Item;
  skin: PosterSkin;
  parts: ReturnType<typeof dayParts>;
  compact?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col overflow-hidden ${compact ? "aspect-[3/4] p-3" : "aspect-[4/5] p-4"}`}
      style={{ background: skin.bg, color: skin.fg }}
    >
      <div className="flex items-start justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]">
        <span>
          {parts.dow} {parts.num} · {parts.time}
        </span>
        <span style={{ color: skin.accent }}>{skin.vibe}</span>
      </div>
      <h3 className={`mt-4 font-display uppercase leading-[0.86] tracking-tight ${compact ? "line-clamp-5 text-[1.7rem]" : "line-clamp-6 text-[2.6rem]"}`}>
        {item.title.replace(/^\[Sample Fizz\]\s*/i, "")}
      </h3>
      <div className="mt-auto flex items-end justify-between gap-2 pt-4 text-[10px] font-semibold uppercase tracking-[0.16em]">
        <span className="line-clamp-2">{item.location ?? "New Haven"}</span>
        <span className="shrink-0 opacity-70">{item.demo ? "Sample" : sourceLabel(item.source)}</span>
      </div>
    </div>
  );
}

function ActionBar({
  item,
  reason,
  note,
  going,
  saved,
  onGoing,
  onSave,
  onHide,
  onShare,
  onOpen,
}: {
  item: Item;
  reason?: string | null;
  note?: string | null;
  going?: boolean;
  saved?: boolean;
  onGoing?: () => void;
  onSave?: () => void;
  onHide?: () => void;
  onShare?: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="mt-3">
      {(reason || note) && (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan">{note ?? `Fits ${reason}`}</p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onGoing}
          className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${
            going ? "bg-cyan text-black" : "bg-white text-black"
          }`}
        >
          {going ? "Going" : "I'm going"}
        </button>
        <button
          type="button"
          onClick={onSave}
          className={`px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${saved ? "text-cyan" : "text-neutral-300"}`}
        >
          {saved ? "Saved" : "Save"}
        </button>
        <button type="button" onClick={onShare} className="px-1 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
          Share
        </button>
        <button type="button" onClick={onOpen} className="px-1 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
          Ticket
        </button>
        <button type="button" onClick={onHide} className="ml-auto px-1 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-600">
          Pass
        </button>
      </div>
      <span className="sr-only">{item.title}</span>
    </div>
  );
}

function TextBtn({
  children,
  onClick,
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
        active
          ? "border-cyan bg-cyan text-black"
          : "border-white/15 text-neutral-300 hover:border-white/40 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export function TicketBody({
  item,
  reason,
  going,
  saved,
  onGoing,
  onSave,
  onShare,
  onHide,
  onClose,
}: {
  item: Item;
  reason?: string | null;
  going?: boolean;
  saved?: boolean;
  onGoing: () => void;
  onSave: () => void;
  onShare: () => void;
  onHide: () => void;
  onClose: () => void;
}) {
  const skin = posterFor(item);
  const parts = dayParts(item.starts_at);
  return (
    <div className="w-full max-w-md border border-white/10 bg-[#0c0c0d]">
      <div className="relative px-5 pb-8 pt-5" style={{ background: skin.bg, color: skin.fg }}>
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em]">
          <span>Y · New Haven</span>
          <button type="button" onClick={onClose} className="uppercase tracking-[0.16em]" style={{ color: skin.fg }}>
            Close
          </button>
        </div>
        <p className="mt-8 font-display text-8xl leading-none">{parts.num}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em]">
          {parts.dow} {parts.mon} · {parts.time}
        </p>
        <h2 className="mt-5 font-display text-5xl leading-[0.9]">{item.title}</h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed opacity-80">{item.summary}</p>
      </div>
      <div className="poster-stub border-y border-dashed border-white/20 px-5 py-4">
        <dl className="grid grid-cols-2 gap-3 text-[11px] uppercase tracking-[0.16em] text-neutral-400">
          <div>
            <dt>Where</dt>
            <dd className="mt-1 text-sm normal-case tracking-normal text-ink">{item.location ?? "New Haven"}</dd>
          </div>
          <div>
            <dt>From</dt>
            <dd className="mt-1 text-sm normal-case tracking-normal text-ink">{sourceLabel(item.source)}</dd>
          </div>
          <div>
            <dt>Ref</dt>
            <dd className="mt-1 font-mono text-sm tracking-normal text-ink">{refCode(item.id)}</dd>
          </div>
          <div>
            <dt>Door</dt>
            <dd className="mt-1 text-sm normal-case tracking-normal text-ink">{item.starts_at ? relTime(item.starts_at) : "Unscheduled"}</dd>
          </div>
        </dl>
        {item.demo && <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-neutral-600">Sample flyer. Not a real ticket.</p>}
        {reason && <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan">Fits {reason}</p>}
      </div>
      <div className="flex flex-wrap gap-2 px-5 py-4">
        <TextBtn onClick={onGoing} active={going}>
          {going ? "You're going" : "I'm going"}
        </TextBtn>
        <TextBtn onClick={onSave} active={saved}>
          {saved ? "Saved" : "Save"}
        </TextBtn>
        <TextBtn onClick={onShare}>Share</TextBtn>
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="border border-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-300 hover:border-white/40 hover:text-white"
          >
            Original
          </a>
        )}
        <TextBtn onClick={onHide}>Pass</TextBtn>
      </div>
    </div>
  );
}
