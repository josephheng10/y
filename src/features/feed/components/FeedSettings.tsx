"use client";

import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { COLLEGES, INTERESTS, NEEDS, toggleInterest, toggleNeed, type Profile } from "@/lib/taste";

export type FeedAccount = { email: string; provider: string | null };
export type FeedConfig = { google: boolean; microsoft: boolean; yaleconnect: boolean };

export default function FeedSettings({ profile, user, config, onChange, onDig, onIngested }: {
  profile: Profile;
  user: FeedAccount | null;
  config: FeedConfig;
  onChange: (next: Profile | ((profile: Profile) => Profile)) => void;
  onDig: () => void;
  onIngested: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function sync(path: string) {
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const result = await response.json() as { ingested?: number; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Couldn’t sync this source.");
      await onIngested();
      setStatus(`${result.ingested ?? 0} new posts added to the Wall.`);
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-6" aria-labelledby="feed-settings-title">
      <header>
        <h2 id="feed-settings-title" className="text-xl font-bold tracking-tight">Tune your feed</h2>
        <p className="mt-1 text-sm text-muted">Pick what you want to see more often on the Wall.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Display name
          <input className="field mt-1.5" value={profile.name} placeholder="Your name"
            onChange={(event) => onChange({ ...profile, name: event.target.value })} />
        </label>
        <label className="text-sm font-semibold">
          Residential college
          <select className="field mt-1.5" value={profile.college ?? ""}
            onChange={(event) => onChange({ ...profile, college: event.target.value || null, tuned: true })}>
            <option value="">Any college</option>
            {COLLEGES.map((college) => <option key={college}>{college}</option>)}
          </select>
        </label>
      </div>
      <fieldset>
        <legend className="mb-2.5 text-sm font-bold">What are you looking for?</legend>
        <div className="flex flex-wrap gap-2">
          {NEEDS.map((need) => (
            <button key={need.id} type="button" className="pill" title={need.sub}
              aria-pressed={profile.needs.includes(need.id)}
              onClick={() => onChange((current) => ({ ...toggleNeed(current, need.id), tuned: true }))}>
              {need.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2.5 text-sm font-bold">Interests</legend>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((interest) => (
            <button key={interest.id} type="button" className="pill" aria-pressed={profile.interests.includes(interest.id)}
              onClick={() => onChange((current) => ({ ...toggleInterest(current, interest.id), tuned: true }))}>
              {interest.label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="border-t border-line pt-4">
        <h3 className="text-sm font-bold">Sources</h3>
        <div className="mt-2 divide-y divide-line">
          <button type="button" className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm hover:text-accent" onClick={onDig}>
            <span><span className="block font-semibold">Dig campus</span><span className="block text-muted">Find and follow public campus feeds</span></span>
            <Icon name="arrow" size={17} />
          </button>
          {user && (user.provider === "google" || user.provider === "azure-ad") ? (
            <SourceButton label="Sync listserv mail" disabled={busy} onClick={() => void sync("/api/ingest/email")} />
          ) : (
            <>
              <SourceButton label="Connect Gmail" disabled={busy || !config.google} onClick={() => void signIn("google")} />
              <SourceButton label="Connect Outlook" disabled={busy || !config.microsoft} onClick={() => void signIn("azure-ad")} />
            </>
          )}
          <SourceButton label="Sync YaleConnect" disabled={busy || !config.yaleconnect}
            onClick={() => void sync("/api/ingest/yaleconnect")} />
        </div>
        <p role="status" className="text-sm text-muted">{busy ? "Syncing…" : status}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm">
        {user ? (
          <div className="flex min-w-0 flex-wrap items-center gap-x-2">
            <span className="wrap-anywhere text-muted">{user.email}</span>
            <button type="button" className="post-action" onClick={() => void signOut({ callbackUrl: "/" })}>Sign out</button>
          </div>
        ) : <Link href="/login" className="font-semibold text-accent hover:underline">Sign in</Link>}
        {profile.hidden.length > 0 && (
          <button type="button" className="post-action" onClick={() => onChange({ ...profile, hidden: [] })}>
            Restore hidden posts ({profile.hidden.length})
          </button>
        )}
      </div>
    </section>
  );
}

function SourceButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm font-semibold enabled:hover:text-accent disabled:text-muted">
      {label}
      {disabled ? <span className="text-xs font-normal">Unavailable</span> : <Icon name="arrow" size={17} />}
    </button>
  );
}
