"use client";

import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { useState, type FormEvent, type ReactNode } from "react";
import { SiteNav } from "./SiteNav";

const ERRORS: Record<string, string> = {
  CredentialsSignin: "That email and password don't match.",
  OAuthSignin: "That provider couldn't start sign-in.",
  OAuthCallback: "That provider didn't finish sign-in.",
  OAuthAccountNotLinked: "That email is already used with a different sign-in method.",
  AccessDenied: "Access was denied.",
  Configuration: "Sign-in isn't configured.",
};

interface Props {
  mode: "login" | "signup";
  callbackUrl: string;
  initialError?: string | null;
  session: { email: string; name: string | null } | null;
  providers: { google: boolean; microsoft: boolean };
}

export function AuthScreen({ mode, callbackUrl, initialError, session, providers }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(initialError ? (ERRORS[initialError] ?? "Sign-in didn't go through. Try again.") : null);
  const [pending, setPending] = useState<string | null>(null);

  const otherHref = `${mode === "login" ? "/signup" : "/login"}?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  async function finish(result: { ok?: boolean; error?: string | null; url?: string | null } | undefined) {
    if (!result || result.error || result.ok === false) {
      setError(ERRORS[result?.error ?? ""] ?? "That email and password don't match.");
      setPending(null);
      return;
    }
    window.location.assign(result.url || callbackUrl);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (mode === "signup" && password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }
    setPending("email");
    try {
      if (mode === "signup") {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const json = (await response.json()) as { error?: string };
        if (!response.ok) {
          setError(json.error ?? "Couldn't create the account.");
          setPending(null);
          return;
        }
      }
      const result = await signIn("credentials", { email, password, redirect: false, callbackUrl });
      await finish(result);
    } catch (cause) {
      setError((cause as Error).message || "Something went wrong.");
      setPending(null);
    }
  }

  async function onProvider(provider: "google" | "azure-ad") {
    setError(null);
    setPending(provider);
    await signIn(provider, { callbackUrl });
  }

  return (
    <div className="min-h-dvh bg-[#070708] text-ink">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070708]/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-baseline gap-3 px-4 py-3">
          <Link href="/" className="font-display text-4xl leading-none tracking-tight">
            Y
          </Link>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">New Haven</p>
        </div>
        <SiteNav current="/" />
      </header>
      <main className="mx-auto max-w-md px-4 py-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan">{mode === "login" ? "Account" : "New account"}</p>
        <h1 className="mt-2 font-display text-7xl leading-none">{mode === "login" ? "Sign in" : "Join"}</h1>
        <p className="mt-3 text-sm text-neutral-400">
          {mode === "login"
            ? "Your account keeps private listserv mail on your wall. The rest of campus stays open."
            : "A name, an email, and a password. Gmail and Outlook can come later for listserv sync."}
        </p>

        {session ? (
          <div className="mt-8 border border-white/10 px-4 py-5">
            <p className="text-sm">You&apos;re signed in as {session.name || session.email}.</p>
            <p className="mt-1 text-xs text-neutral-500">{session.email}</p>
            <div className="mt-4 flex gap-2">
              <Link href={callbackUrl} className="bg-cyan px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black">
                Continue
              </Link>
              <button
                type="button"
                onClick={() => void signOut({ callbackUrl: mode === "login" ? "/login" : "/signup" })}
                className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={(event) => void onSubmit(event)} className="mt-8 space-y-4">
              {mode === "signup" && (
                <Field label="Name">
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    required
                    maxLength={80}
                    placeholder="What should we call you"
                    className={fieldClass}
                  />
                </Field>
              )}
              <Field label="Email">
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@yale.edu"
                  className={fieldClass}
                />
              </Field>
              <Field label="Password">
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={mode === "signup" ? 8 : undefined}
                  placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                  className={fieldClass}
                />
              </Field>
              {mode === "signup" && (
                <Field label="Confirm password">
                  <input
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    placeholder="Type it again"
                    className={fieldClass}
                  />
                </Field>
              )}
              {error && <p className="border border-white/15 px-3 py-2 text-sm text-neutral-200">{error}</p>}
              <button
                type="submit"
                disabled={pending !== null}
                className="w-full bg-cyan px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-black disabled:opacity-50"
              >
                {pending === "email" ? "Working" : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>

            {mode === "login" && (
              <div className="mt-8">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Or continue with</h2>
                <div className="mt-3 divide-y divide-white/10 border border-white/10">
                  <ProviderButton
                    title="Gmail"
                    detail={providers.google ? "Also unlocks listserv sync" : "Needs Google keys"}
                    enabled={providers.google && pending === null}
                    pending={pending === "google"}
                    onClick={() => void onProvider("google")}
                  />
                  <ProviderButton
                    title="Outlook"
                    detail={providers.microsoft ? "Yale or personal" : "Needs Microsoft keys"}
                    enabled={providers.microsoft && pending === null}
                    pending={pending === "azure-ad"}
                    onClick={() => void onProvider("azure-ad")}
                  />
                </div>
              </div>
            )}

            <p className="mt-6 text-sm text-neutral-400">
              {mode === "login" ? "No account yet?" : "Already have one?"}{" "}
              <Link href={otherHref} className="text-cyan">
                {mode === "login" ? "Create one" : "Sign in"}
              </Link>
            </p>
          </>
        )}
      </main>
    </div>
  );
}

const fieldClass = "mt-2 w-full border border-white/15 bg-transparent px-3 py-3 text-base outline-none placeholder:text-neutral-600 focus:border-cyan";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">{label}</span>
      {children}
    </label>
  );
}

function ProviderButton({
  title,
  detail,
  enabled,
  pending,
  onClick,
}: {
  title: string;
  detail: string;
  enabled: boolean;
  pending: boolean;
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
        <span className="block text-sm">{pending ? "Opening" : title}</span>
        <span className="block text-xs text-neutral-500">{detail}</span>
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan">{enabled ? "Open" : "Off"}</span>
    </button>
  );
}
