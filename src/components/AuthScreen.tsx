"use client";

import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { useState, type FormEvent, type ReactNode } from "react";
import { AppChrome } from "./AppChrome";

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
    <AppChrome current="/">
      <main className="mx-auto max-w-md px-4 py-8">
        <p className="text-[13px] font-semibold text-[var(--accent)]">{mode === "login" ? "Account" : "New account"}</p>
        <h1 className="mt-1 text-[32px] font-extrabold tracking-tight">{mode === "login" ? "Sign in" : "Join"}</h1>
        <p className="mt-2 text-[15px] text-[var(--text-muted)]">
          {mode === "login"
            ? "Your account keeps private email on your wall. The rest of campus stays open."
            : "A name, an email, and a password. Gmail and Outlook can come later for email sync."}
        </p>

        {session ? (
          <div className="mt-8 rounded-2xl border border-[var(--border)] px-4 py-5">
            <p className="text-[15px]">You&apos;re signed in as {session.name || session.email}.</p>
            <p className="mt-1 text-[13px] text-[var(--text-muted)]">{session.email}</p>
            <div className="mt-4 flex gap-2">
              <Link href={callbackUrl} className="rounded-full bg-[var(--accent)] px-4 py-2 text-[13px] font-bold text-white">
                Continue
              </Link>
              <button
                type="button"
                onClick={() => void signOut({ callbackUrl: mode === "login" ? "/login" : "/signup" })}
                className="px-3 py-2 text-[13px] font-semibold text-[var(--text-muted)]"
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
              {error && <p className="rounded-xl border border-[var(--border)] px-3 py-2 text-[14px] text-[var(--text)]">{error}</p>}
              <button
                type="submit"
                disabled={pending !== null}
                className="w-full rounded-full bg-[var(--text)] px-4 py-3 text-[15px] font-bold text-[var(--bg)] disabled:opacity-50"
              >
                {pending === "email" ? "Working" : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>

            {mode === "login" && (
              <div className="mt-8">
                <h2 className="text-[13px] font-semibold text-[var(--text-muted)]">Or continue with</h2>
                <div className="mt-3 divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)]">
                  <ProviderButton
                    title="Gmail"
                    detail={providers.google ? "Also unlocks email sync" : "Needs Google keys"}
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

            <p className="mt-6 text-[14px] text-[var(--text-muted)]">
              {mode === "login" ? "No account yet?" : "Already have one?"}{" "}
              <Link href={otherHref} className="font-semibold text-[var(--accent)]">
                {mode === "login" ? "Create one" : "Sign in"}
              </Link>
            </p>
          </>
        )}
      </main>
    </AppChrome>
  );
}

const fieldClass =
  "mt-2 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-3 text-[15px] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--accent)]";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[13px] font-semibold text-[var(--text-muted)]">{label}</span>
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
        <span className="block text-[15px]">{pending ? "Opening" : title}</span>
        <span className="block text-[13px] text-[var(--text-muted)]">{detail}</span>
      </span>
      <span className="text-[13px] font-semibold text-[var(--accent)]">{enabled ? "Open" : "Off"}</span>
    </button>
  );
}
