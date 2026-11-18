# Y

Y is the hub for what is happening at Yale. The wall collects listserv mail, YaleConnect, and Fizz into one feed. Events, info, and the raw Fizz catalog are separate areas so people can work on them without editing the same files.

## Where work goes

```
src/app/                    URLs and API routes. Pages stay thin.
src/features/feed/          The wall: cards, filters, taste.
src/features/events/        Event and YaleConnect items from the shared store.
src/features/info/          Durable campus guides.
src/features/fizz/          Local Fizz catalog, and the adapter into ingest.
src/lib/                    Shared types, store, auth, tagger, and source ingest.
src/components/             Chrome used by more than one area (nav, page shell).
scripts/                    Jobs that refresh outside data.
```

Import another area only from its `index.ts`. Shared code moves to `src/lib` or `src/components` when a second area needs it.

| URL | Area |
| --- | --- |
| `/` | Wall |
| `/events` | Events |
| `/info` | Info |
| `/posts` | Fizz catalog |
| `/ask` | Questions over posts, events, and info |
| `/api/ingest/fizz` | Plug Fizz posts into the wall |
| `/api/ingest/email` | Listserv sync |
| `/api/ingest/yaleconnect` | YaleConnect iCal sync |

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). With no env vars the wall uses fictional demo items from `src/lib/demo-data.ts`. Copy `.env.example` to `.env.local` to turn on a real source. Each integration is independent.

| Feature | Env vars | Without them |
| --- | --- | --- |
| Gmail sign-in + ingest | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET` | button disabled |
| Outlook / Yale M365 | `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID` | button disabled |
| Supabase storage | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | memory + `.data/items.json` |
| AI tagging | `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` | keyword heuristic |
| YaleConnect | `YALECONNECT_ICAL_URL` | button disabled |
| Protect ingest routes | `INGEST_SECRET` | open locally |

`SEED_DEMO=false` hides the fictional items.

## Fizz

`/posts` and `/ask` use the Fizz archive through `src/lib/fizz.ts`. By default it reads `BS/output/fizz/fizz.sqlite`. Set `FIZZ_DB` to use another SQLite file. `npm run fizz:import` loads JSON batches dropped in the SQLite archive's inbox.

To use the hosted archive, run `supabase/fizz.sql` in the Supabase SQL Editor and set `FIZZ_SUPABASE_URL` and `FIZZ_SUPABASE_SECRET_KEY` in the server environment. Run `npm run fizz:migrate` with Node.js 22.13 or later to upsert the SQLite tables and verify their row counts. Rerun the command after importing new SQLite batches to upload the updates.

`postToFizzInput` turns a catalog post into the body `POST /api/ingest/fizz` already accepts. Required fields there are `external_id` and `title`. If `category` is missing, the tagger fills it in. Sample payload: `examples/fizz-items.json`.

## Email and YaleConnect

`POST /api/ingest/email` pulls the last 3 days of the signed-in inbox and keeps listserv-like mail only. Bodies are used for tagging and are not stored.

YaleConnect uses iCal subscribe links. `src/lib/ingest/ical.ts` parses them. `vercel.json` refreshes that route every 3 hours. If `INGEST_SECRET` is set, set Vercel `CRON_SECRET` to the same value.

OAuth redirect URIs:

- Google: `http://localhost:3000/api/auth/callback/google`
- Microsoft: `http://localhost:3000/api/auth/callback/azure-ad`

Gmail scope is `gmail.readonly`. Graph permissions are `Mail.Read`, `User.Read`, `offline_access`, `openid`, `profile`, and `email`. Yale's tenant may require admin consent.

## Storage

Run `supabase/schema.sql` if you use Supabase. The service-role key stays on the server. RLS is on with no public policies. Demo items are merged at read time and are not written to the database.

On Vercel, set `NEXTAUTH_URL` and use Supabase. The memory store does not survive a serverless instance.

## How we work

Name branches `<area>/<topic>`, for example `events/yaleconnect` or `posts/catalog`. Pull requests name the area. Leave `.env.local`, `.data/`, and the sqlite catalog untracked.
