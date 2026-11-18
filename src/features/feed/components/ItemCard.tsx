"use client";

import { useEffect, useRef } from "react";
import { Icon, type IconName } from "@/components/Icon";
import type { Item } from "@/lib/types";
import { sourceLabel } from "@/lib/taste";
import { ago, fmtTime, itemSummary, itemTitle } from "../ui";

const sourceStyles: Record<Item["source"], { icon: IconName; color: string }> = {
  email: { icon: "mail", color: "bg-[#e8efff] text-[#345cba]" },
  yaleconnect: { icon: "campus", color: "bg-[#eee9fd] text-[#6547a9]" },
  fizz: { icon: "posts", color: "bg-[#fbe9f2] text-[#a94377]" },
  campus: { icon: "pin", color: "bg-[#e1f4ec] text-[#267557]" },
};

type Actions = {
  going: boolean;
  saved: boolean;
  onGoing: () => void;
  onSave: () => void;
  onShare: () => void;
};

type ItemProps = Actions & {
  item: Item;
  now: number;
  reason?: string | null;
};

export default function ItemCard({
  item, now, reason, onOpen, ...actions
}: ItemProps & { onOpen: () => void }) {
  return (
    <article className="px-4 py-4 sm:px-6 sm:py-5">
      <header className="flex items-center gap-3">
        <SourceAvatar source={item.source} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{sourceLabel(item.source)}</p>
          <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
            <span>{item.category}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={item.created_at}>{ago(item.created_at, now)}</time>
            {item.demo && <span className="ml-0.5 rounded-full bg-canvas px-1.5 py-0.5 font-medium">Sample</span>}
          </p>
        </div>
        <button type="button" className="icon-button" aria-label={`Options for ${itemTitle(item)}`} onClick={onOpen}>
          <Icon name="more" />
        </button>
      </header>
      <div className="mt-3.5 sm:pl-[52px]">
        <h2 className="text-[17px] font-bold leading-snug tracking-[-0.02em] wrap-anywhere sm:text-[18px]">
          <button type="button" className="text-left hover:text-accent" onClick={onOpen}>{itemTitle(item)}</button>
        </h2>
        {item.summary && (
          <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed wrap-anywhere text-muted">{itemSummary(item)}</p>
        )}
        <ItemMeta item={item} now={now} />
        {reason && <p className="mt-2 text-xs font-medium text-accent">Matches your interests · {reason}</p>}
        <div className="-ml-2 mt-2.5">
          <PostActions {...actions} />
        </div>
      </div>
    </article>
  );
}

function SourceAvatar({ source }: { source: Item["source"] }) {
  const style = sourceStyles[source];
  return (
    <span className={`grid size-10 shrink-0 place-items-center rounded-full ${style.color}`}>
      <Icon name={style.icon} size={19} />
    </span>
  );
}

function ItemMeta({ item, now }: { item: Item; now: number }) {
  if (!item.starts_at && !item.location) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-muted">
      {item.starts_at && (
        <time dateTime={item.starts_at} className="inline-flex items-center gap-1.5">
          <Icon name="clock" size={15} />
          {fmtTime(item.starts_at, now)}
        </time>
      )}
      {item.location && (
        <span className="inline-flex min-w-0 items-center gap-1.5 wrap-anywhere [&>svg]:shrink-0">
          <Icon name="pin" size={15} />
          {item.location}
        </span>
      )}
    </div>
  );
}

function PostActions({ going, saved, onGoing, onSave, onShare }: Actions) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 sm:gap-1.5">
      <button type="button" className="post-action" aria-pressed={going} onClick={onGoing}>
        <Icon name={going ? "check" : "plus"} size={17} /> {going ? "Going" : "I’m going"}
      </button>
      <button type="button" className="post-action" aria-pressed={saved} onClick={onSave}>
        <Icon name="bookmark" size={17} /> {saved ? "Saved" : "Save"}
      </button>
      <button type="button" className="post-action" onClick={onShare}>
        <Icon name="send" size={17} /> Share
      </button>
    </div>
  );
}

export function ItemDialog({
  item, now, reason, status, onHide, onClose, ...actions
}: ItemProps & { status: string | null; onHide: () => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="settings-dialog"
      aria-labelledby="item-dialog-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <SourceAvatar source={item.source} />
          <p className="flex-1 text-sm font-semibold">
            {sourceLabel(item.source)} <span className="font-normal text-muted">· {item.category}</span>
          </p>
          <button type="button" className="icon-button" aria-label="Close details" onClick={onClose}><Icon name="x" /></button>
        </div>
        <h2 id="item-dialog-title" className="mt-4 text-2xl leading-tight font-bold tracking-tight wrap-anywhere">{itemTitle(item)}</h2>
        {item.summary && <p className="mt-2.5 text-sm leading-relaxed wrap-anywhere text-muted">{itemSummary(item)}</p>}
        <ItemMeta item={item} now={now} />
        {item.demo && <p className="mt-2 text-xs text-muted">Sample post</p>}
        {reason && <p className="mt-2 text-xs font-medium text-accent">Matches your interests · {reason}</p>}
        <div className="mt-5 border-t border-line pt-3">
          <PostActions {...actions} />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {item.url && (
              <a className="post-action" href={item.url} target="_blank" rel="noreferrer">
                <Icon name="external" size={17} /> View original
              </a>
            )}
            <button type="button" className="post-action" onClick={onHide}>Hide from Wall</button>
          </div>
          <p role="status" className="text-xs text-muted">{status}</p>
        </div>
      </div>
    </dialog>
  );
}
