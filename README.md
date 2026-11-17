# Yale Social Hub 🐶

One feed for Yale social life: **email listservs** (Gmail or Outlook), **YaleConnect** events, and **Fizz** — AI-tagged into **Event / Free food / Opportunity / Club news / Noise**, with a **Today at Yale** card on top.

Hackathon starter: Next.js 15 (App Router, TypeScript) + Tailwind v4, Supabase-ready, Vercel-deployable.

## Quick start (zero credentials)

```bash
npm install
npm run dev        # http://localhost:3000
```

With no env vars you get a full feed of **fictional demo data** (`src/lib/demo-data.ts`, every item tagged "sample"), an offline keyword tagger, and an in-memory store persisted to `.data/items.json`. Turn the demo items off with `SEED_DEMO=false`.

Add env vars (copy `.env.example` → `.env.local`) to switch on each real integration; each one is independent.

| Feature | Env vars | Without it |
|---|---|---|
| Gmail sign-in + ingest | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET` | button disabled |
| Outlook / Yale M365 | `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID` | button disabled |
| Supabase storage | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | memory + JSON file |
| AI tagging | `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` | keyword heuristic |
| YaleConnect | `YALECONNECT_ICAL_URL` (comma-separated OK) | button disabled |
| Protect ingest routes | `INGEST_SECRET` | open (fine locally) |

## Project layout

```
src/
  app/
    page.tsx                      # home: Today card + filters + feed
    api/items/route.ts            # GET  /api/items?category=&source=&limit=
    api/ingest/email/route.ts     # POST /api/ingest/email
    api/ingest/yaleconnect/route.ts # POST (and GET for cron) /api/ingest/yaleconnect
    api/ingest/fizz/route.ts      # POST /api/ingest/fizz   ← Fizz plug-in point
    api/auth/[...nextauth]/route.ts
  components/                     # Feed, TodayCard, ItemCard
  lib/
    types.ts                      # shared Item type (matches the SQL table)
    store.ts                      # Supabase or memory/JSON
    tagger.ts                     # LLM (OpenAI-compatible) + heuristic fallback
    rank.ts                       # Today at Yale ranking
    auth.ts                       # Auth.js providers + token refresh
    ingest/{gmail,outlook,listserv,ical,yaleconnect,fizz}.ts
    demo-data.ts                  # ⚠️ fictional sample data
supabase/schema.sql
examples/                         # sample payloads for curl testing
```

## The Item

```ts
{ id, user_id, source: 'email'|'yaleconnect'|'fizz', category, title, summary,
  starts_at, location, url, score (0-100), created_at }
```
`id` is deterministic (`<source>:<sha1(externalId)>`), so re-ingesting the same message, event, or post updates it instead of duplicating. Email items are private (`user_id` = the signed-in email). YaleConnect and Fizz items are shared (`user_id = null`).

## 🫧 For the Fizz friend: how to plug in

POST to `/api/ingest/fizz` with one item, an array, or `{ "items": [...] }`:

```bash
curl -X POST http://localhost:3000/api/ingest/fizz \
  -H 'content-type: application/json' \
  -H "x-ingest-secret: $INGEST_SECRET" \
  -d '{
    "items": [{
      "source": "fizz",
      "external_id": "post_123",
      "title": "Free boba at Schwarzman",
      "text": "club giving out boba till 4pm",
      "category": "Free food",
      "summary": "Free boba while it lasts.",
      "starts_at": "2026-11-17T21:00:00Z",
      "location": "Schwarzman Center",
      "url": null,
      "score": 60
    }]
  }'
```

- Required fields are `external_id` (stable, used for dedupe) and `title`. Everything else is optional, and `text` is raw text for the tagger.
- If `category` is one of the five categories, the item is stored as given. Otherwise the tagger fills in category, summary, time, and location.
- `source` must be `"fizz"` if you include it.
- The code lives in `src/lib/ingest/fizz.ts` and `src/app/api/ingest/fizz/route.ts`. Sample payload: `examples/fizz-items.json`.
- Two items labeled `[Sample Fizz]` are in the demo seed so the UI shows Fizz before the real integration exists.

## Email ingest (Gmail + Outlook)

`POST /api/ingest/email` (the **Sync email** button) pulls the last 3 days of the signed-in user's inbox:

1. It fetches **headers only** first.
2. It keeps only **listserv-like** messages: `List-Id`, `List-Unsubscribe`, `List-Post`, or `Precedence: list|bulk` headers, plus known list senders (`LISTSERV_SENDERS` and built-in patterns like `panlist`, `listserv`, `-l@`).
3. For those, it fetches the body, runs the tagger in memory, and **stores only the tagged title, summary, time, and location**. Bodies are never persisted.

To test without OAuth: `curl -X POST localhost:3000/api/ingest/email -H 'content-type: application/json' -d @examples/listserv-emails.json` (the personal email in that file is skipped by the filter).

### Google OAuth setup
1. In [Google Cloud Console](https://console.cloud.google.com/), create a project and enable the **Gmail API**.
2. Set up the OAuth consent screen: External, add the scope `https://www.googleapis.com/auth/gmail.readonly`, and add your team as **test users**. Gmail read-only is a *restricted* scope, so a public launch needs Google verification. Test mode is fine for a hackathon (up to 100 test users).
3. Under Credentials, create an OAuth client ID (Web). Add the redirect URI `http://localhost:3000/api/auth/callback/google` and your Vercel URL `https://<app>.vercel.app/api/auth/callback/google`.
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

### Microsoft (Outlook / Yale M365) setup
1. In [Azure Portal](https://portal.azure.com/), go to **App registrations**, click New, and choose "Accounts in any organizational directory and personal Microsoft accounts".
2. Add the Web redirect URI `http://localhost:3000/api/auth/callback/azure-ad` (plus the Vercel one).
3. Under API permissions, add Microsoft Graph delegated permissions: `Mail.Read`, `User.Read`, `offline_access`, `openid`, `profile`, `email`.
4. Under Certificates & secrets, create a new client secret, then set `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, and `AZURE_AD_TENANT_ID=common`.
5. ⚠️ Yale's tenant may require **admin consent** for third-party apps reading mail. If Yale accounts get "Need admin approval", demo with a personal Outlook account or ask Yale ITS.

Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`, and set `NEXTAUTH_URL` to your site URL.

## YaleConnect ingest

YaleConnect (CampusGroups) offers iCal "subscribe" / export links for the events calendar and for individual groups. Paste one or more into `YALECONNECT_ICAL_URL`, then press **YaleConnect** in the UI or call:

```bash
curl -X POST localhost:3000/api/ingest/yaleconnect                       # uses env
curl -X POST localhost:3000/api/ingest/yaleconnect -d '{"url":"https://…ics"}' -H 'content-type: application/json'
curl -X POST localhost:3000/api/ingest/yaleconnect -d '{"ics":"BEGIN:VCALENDAR…"}' -H 'content-type: application/json'
```
The parser has no dependencies (`src/lib/ingest/ical.ts`). It handles folding, escapes, UTC, and all-day times. Floating and TZID times are read as America/New_York, and only the next 14 days are kept when fetching from a URL. iCal `DTSTART` and `LOCATION` always win over AI guesses. `vercel.json` adds a cron that refreshes every 3 hours. If you set `INGEST_SECRET`, also set Vercel's `CRON_SECRET` to the same value, because the route accepts `Authorization: Bearer <secret>`.

## AI tagger

`src/lib/tagger.ts` calls any **OpenAI-compatible** `POST {LLM_BASE_URL}/chat/completions` with `response_format: json_object` and asks for `{category, title, summary, starts_at, location, score}`. It works with OpenAI, xAI, Groq, Together, OpenRouter, or local Ollama (`LLM_BASE_URL=http://localhost:11434/v1`). With no key, or on any error, it falls back to a regex and keyword heuristic that knows Yale buildings and colleges, so the demo never breaks offline.

## Today at Yale ranking

`src/lib/rank.ts` takes items starting in the next **6 hours** (or that started under 30 minutes ago), excluding Noise. Each gets `0.5×score + soonness (0–40) + 30 if Free food`, and the top 4 are shown.

## Supabase

1. Create a project and run `supabase/schema.sql` in the SQL editor.
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. The key is server-only, and RLS is on with no public policies.
3. That's it. `src/lib/store.ts` switches automatically. Demo items are merged in at read time and never written to the database.

## Deploy to Vercel

1. Push this folder to a Git repo and import it at [vercel.com/new](https://vercel.com/new). The framework is auto-detected as Next.js.
2. Add the env vars from `.env.example`. Set `NEXTAUTH_URL=https://<app>.vercel.app` and `NEXTAUTH_SECRET`.
3. Add the Vercel callback URLs to the Google and Azure OAuth clients.
4. Use **Supabase** in production. Vercel's filesystem is read-only and per-instance, so the memory store resets.
5. Deploy. The cron in `vercel.json` keeps YaleConnect fresh.

## Privacy stance

- **Read-only:** Gmail `gmail.readonly` and Graph `Mail.Read`. The app can never send, delete, or modify mail.
- **Listserv-only:** personal mail is filtered out using headers *before* any body is downloaded.
- **Summaries only:** bodies are used in memory for tagging and then dropped. Only the title, short summary, time, location, and a deep link are stored.
- Email items are private to the user who synced them. Tokens live in the encrypted Auth.js session cookie, not the database.
- If an LLM key is set, the truncated message text (up to 4k characters) is sent to that provider for tagging. Use a provider your team trusts, or the offline heuristic.

## Scripts

`npm run dev` · `npm run build` · `npm start` · `npm run typecheck`
