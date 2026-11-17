/**
 * Microsoft Graph ingest (scope: Mail.Read) — for Yale mail hosted on Outlook / M365.
 * Same pattern as Gmail: headers first, body only for listserv messages.
 */
import type { RawInput } from "../types";
import { isListserv, toPlainText, type EmailMeta } from "./listserv";

const API = "https://graph.microsoft.com/v1.0/me";

interface GraphMsg {
  id: string;
  subject?: string;
  from?: { emailAddress?: { address?: string; name?: string } };
  receivedDateTime?: string;
  webLink?: string;
  internetMessageHeaders?: { name: string; value: string }[];
  body?: { content?: string; contentType?: string };
  bodyPreview?: string;
}

async function g<T>(token: string, url: string, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, ...headers } });
  if (!res.ok) throw new Error(`Graph ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json() as Promise<T>;
}

export async function fetchOutlookListserv(
  accessToken: string,
  userId: string,
  { days = 3, max = 40 } = {},
): Promise<{ inputs: RawInput[]; scanned: number }> {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const list = await g<{ value: GraphMsg[] }>(
    accessToken,
    `${API}/mailFolders/inbox/messages?$top=${max}&$orderby=receivedDateTime desc` +
      `&$filter=receivedDateTime ge ${since}&$select=id,subject,from,receivedDateTime,webLink`,
  );
  const inputs: RawInput[] = [];
  for (const m of list.value ?? []) {
    // 1) headers only
    const hdr = await g<GraphMsg>(accessToken, `${API}/messages/${m.id}?$select=internetMessageHeaders`);
    const headers: Record<string, string> = {};
    for (const h of hdr.internetMessageHeaders ?? []) headers[h.name.toLowerCase()] = h.value;
    const from = m.from?.emailAddress?.address ?? "";
    const em: EmailMeta = { id: m.id, from, subject: m.subject ?? "", headers };
    if (!isListserv(em)) continue;

    // 2) body (as text) only for listserv messages
    const full = await g<GraphMsg>(accessToken, `${API}/messages/${m.id}?$select=body,bodyPreview`, {
      Prefer: 'outlook.body-content-type="text"',
    });
    inputs.push({
      source: "email",
      externalId: `outlook:${userId}:${m.id}`,
      userId,
      title: m.subject || "(no subject)",
      text: toPlainText(full.body?.content || full.bodyPreview || ""),
      from,
      url: m.webLink ?? null,
      receivedAt: m.receivedDateTime,
    });
  }
  return { inputs, scanned: (list.value ?? []).length };
}
