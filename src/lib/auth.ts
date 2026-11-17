/**
 * Auth.js / NextAuth (v4) config. Providers are only enabled when their env vars exist,
 * so the app runs with zero credentials. Access tokens live in the encrypted JWT cookie
 * (no DB needed) and are refreshed when they expire.
 */
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import { env, hasAuth, hasGoogle, hasMicrosoft } from "./env";

export const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
export const GRAPH_SCOPES = "openid profile email offline_access User.Read Mail.Read";

type Provider = "google" | "azure-ad";

async function refresh(provider: Provider, refreshToken: string) {
  const url =
    provider === "google"
      ? "https://oauth2.googleapis.com/token"
      : `https://login.microsoftonline.com/${env.msTenant}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: provider === "google" ? env.googleId : env.msId,
    client_secret: provider === "google" ? env.googleSecret : env.msSecret,
    ...(provider === "azure-ad" ? { scope: GRAPH_SCOPES } : {}),
  });
  const res = await fetch(url, { method: "POST", body });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.error || "refresh failed");
  return data as { access_token: string; expires_in: number; refresh_token?: string };
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV !== "production" ? "dev-only-insecure-secret" : undefined),
  session: { strategy: "jwt" },
  providers: [
    ...(hasGoogle()
      ? [
          GoogleProvider({
            clientId: env.googleId,
            clientSecret: env.googleSecret,
            authorization: {
              params: { scope: `openid email profile ${GMAIL_SCOPE}`, access_type: "offline", prompt: "consent" },
            },
          }),
        ]
      : []),
    ...(hasMicrosoft()
      ? [
          AzureADProvider({
            clientId: env.msId,
            clientSecret: env.msSecret,
            tenantId: env.msTenant,
            authorization: { params: { scope: GRAPH_SCOPES } },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        return {
          ...token,
          provider: account.provider as Provider,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at ? account.expires_at * 1000 : Date.now() + 3500 * 1000,
        };
      }
      if (token.expiresAt && Date.now() < (token.expiresAt as number) - 60000) return token;
      if (!token.refreshToken || !token.provider) return token;
      try {
        const r = await refresh(token.provider as Provider, token.refreshToken as string);
        return {
          ...token,
          accessToken: r.access_token,
          expiresAt: Date.now() + r.expires_in * 1000,
          refreshToken: r.refresh_token ?? token.refreshToken,
          error: undefined,
        };
      } catch {
        return { ...token, error: "RefreshFailed" };
      }
    },
    async session({ session, token }) {
      // Expose only what the server routes need. Access token stays server-side
      // via getServerSession; the client never needs it.
      (session as SessionWithProvider).provider = token.provider as Provider | undefined;
      (session as SessionWithProvider).error = token.error as string | undefined;
      return session;
    },
  },
};

export interface SessionWithProvider {
  user?: { email?: string | null; name?: string | null };
  provider?: Provider;
  error?: string;
}

/** Safe session getter: returns null when auth isn't configured. */
export async function getSession(): Promise<SessionWithProvider | null> {
  if (!hasAuth()) return null;
  try {
    return (await getServerSession(authOptions)) as SessionWithProvider | null;
  } catch (e) {
    console.warn("[auth] session error:", (e as Error).message);
    return null;
  }
}

/** Server-only: read the provider access token from the JWT cookie, refreshing if expired. */
export async function getAccessToken(req: NextRequest): Promise<{ provider: Provider; accessToken: string } | null> {
  if (!hasAuth()) return null;
  const t = await getToken({ req, secret: authOptions.secret });
  if (!t?.accessToken || !t.provider) return null;
  const provider = t.provider as Provider;
  if (t.expiresAt && Date.now() > (t.expiresAt as number) - 60000 && t.refreshToken) {
    const r = await refresh(provider, t.refreshToken as string);
    return { provider, accessToken: r.access_token };
  }
  return { provider, accessToken: t.accessToken as string };
}
