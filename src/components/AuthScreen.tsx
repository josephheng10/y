"use client";

import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { useState, type FormEvent, type ReactNode } from "react";

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
    <main className="surface w-full max-w-md p-5 sm:p-7">
        <h1 className="page-title">{session ? "Your account" : mode === "login" ? "Sign in" : "Create an account"}</h1>
        {!session && (
          <p className="mt-2 text-sm text-muted">
            {mode === "login" ? "Sign in to connect and sync your listserv mail." : "Join Y with your name, email, and password."}
          </p>
        )}

        {session ? (
          <div className="mt-5">
            <p className="text-sm">You&apos;re signed in as {session.name || session.email}.</p>
            {session.name && <p className="mt-1 text-xs text-muted">{session.email}</p>}
            <div className="mt-4 flex gap-2">
              <Link href={callbackUrl} className="primary-button">
                Continue
              </Link>
              <button
                type="button"
                onClick={() => void signOut({ callbackUrl: mode === "login" ? "/login" : "/signup" })}
                className="post-action"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={(event) => void onSubmit(event)} className="mt-6 space-y-4">
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
              {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
              <button
                type="submit"
                disabled={pending !== null}
                className="primary-button min-h-11 w-full"
              >
                {pending === "email" ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>

            {mode === "login" && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold">Or continue with</h2>
                <div className="mt-1 divide-y divide-line">
                  <ProviderButton
                    title="Gmail"
                    detail={providers.google ? "Connect your listserv mail" : "Unavailable"}
                    enabled={providers.google && pending === null}
                    pending={pending === "google"}
                    onClick={() => void onProvider("google")}
                  />
                  <ProviderButton
                    title="Outlook"
                    detail={providers.microsoft ? "Use your Yale or personal account" : "Unavailable"}
                    enabled={providers.microsoft && pending === null}
                    pending={pending === "azure-ad"}
                    onClick={() => void onProvider("azure-ad")}
                  />
                </div>
              </div>
            )}

            <p className="mt-6 text-sm text-muted">
              {mode === "login" ? "No account yet?" : "Already have one?"}{" "}
              <Link href={otherHref} className="font-semibold text-accent hover:underline">
                {mode === "login" ? "Create one" : "Sign in"}
              </Link>
            </p>
          </>
        )}
    </main>
  );
}

const fieldClass = "field mt-1.5";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
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
      className="flex w-full items-center justify-between gap-4 py-3 text-left enabled:hover:text-accent disabled:text-muted"
    >
      <span>
        <span className="block text-sm font-medium">{pending ? "Opening…" : title}</span>
        <span className="block text-xs text-muted">{detail}</span>
      </span>
      {enabled && <span className="text-xs font-semibold text-accent">Continue</span>}
    </button>
  );
}
