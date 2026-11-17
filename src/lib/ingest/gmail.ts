/**
 * Gmail ingest (scope: gmail.readonly). Fetches recent messages, keeps only
 * listserv-like ones (by headers first, so personal mail bodies are never fetched),
 * and returns RawInputs for the tagger.
 */
import type { RawInput } from "../types";
import { isListserv, toPlainText, type EmailMeta } from "./listserv";

const API = "https://gmail.googleapis.com/gmail/v1/users/me";

interface GmailPart {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
}

async function g<T>(token: string, url: string): Promise<T> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Gmail ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json() as Promise<T>;
}

function decode(b64?: string) {
  return b64 ? Buffer.from(b64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8") : "";
}
function findBody(p: GmailPart | undefined): string {
  if (!p) return "";
  if (p.mimeType === "text/plain" && p.body?.data) return decode(p.body.data);
  for (const c of p.parts ?? []) {
    const t = findBody(c);
    if (t) return t;
  }
  if (p.mimeType === "text/html" && p.body?.data) return toPlainText(decode(p.body.data));
  return "";
}

export async function fetchGmailListserv(
  accessToken: string,
  userId: string,
  { days = 3, max = 40 } = {},
): Promise<{ inputs: RawInput[]; scanned: number }> {
  const list = await g<{ messages?: { id: string }[] }>(
    accessToken,
    `${API}/messages?maxResults=${max}&q=${encodeURIComponent(`newer_than:${days}d -in:sent -in:chats`)}`,
  );
  const ids = (list.messages ?? []).map((m) => m.id);
  const inputs: RawInput[] = [];

  for (const id of ids) {
    // 1) metadata only
    const meta = await g<{ payload?: { headers?: { name: string; value: string }[] }; internalDate?: string }>(
      accessToken,
      `${API}/messages/${id}?format=metadata` +
        ["From", "Subject", "List-Id", "List-Unsubscribe", "List-Post", "Precedence", "Date"]
          .map((h) => `&metadataHeaders=${h}`)
          .join(""),
    );
    const headers: Record<string, string> = {};
    for (const h of meta.payload?.headers ?? []) headers[h.name.toLowerCase()] = h.value;
    const em: EmailMeta = { id, from: headers["from"] ?? "", subject: headers["subject"] ?? "", headers };
    if (!isListserv(em)) continue;

    // 2) body only for listserv messages
    const full = await g<{ payload?: GmailPart; snippet?: string }>(accessToken, `${API}/messages/${id}?format=full`);
    const text = toPlainText(findBody(full.payload) || full.snippet || "");
    inputs.push({
      source: "email",
      externalId: `gmail:${userId}:${id}`,
      userId,
      title: em.subject || "(no subject)",
      text,
      from: em.from,
      url: `https://mail.google.com/mail/u/0/#all/${id}`,
      receivedAt: meta.internalDate ? new Date(Number(meta.internalDate)).toISOString() : undefined,
    });
  }
  return { inputs, scanned: ids.length };
}
