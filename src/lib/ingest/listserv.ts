/**
 * Listserv filter — applied BEFORE anything is tagged or stored.
 * Only mailing-list style messages pass; personal 1:1 mail is skipped entirely.
 */
import { env } from "../env";

export interface EmailMeta {
  id: string;
  from: string;
  subject: string;
  headers: Record<string, string>; // lower-cased header names
}

const DEFAULT_SENDER_PATTERNS = [
  /listserv/i, /\blists?\./i, /-l@/i, /-list@/i, /panlist/i, /announce/i, /newsletter/i,
  /yaleconnect/i, /campusgroups/i, /engage/i, /events?@/i, /@mailman\./i, /googlegroups\.com/i,
];

export function isListserv(m: EmailMeta): boolean {
  const h = m.headers;
  if (h["list-id"] || h["list-unsubscribe"] || h["list-post"]) return true;
  if ((h["precedence"] || "").match(/\b(list|bulk)\b/i)) return true;
  const from = m.from.toLowerCase();
  if (env.listservSenders.some((s) => from.includes(s))) return true;
  return DEFAULT_SENDER_PATTERNS.some((re) => re.test(from));
}

/** Strip HTML → plain text and truncate. Body is only used for tagging, never stored. */
export function toPlainText(input: string, max = 4000): string {
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim()
    .slice(0, max);
}
