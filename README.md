<img width="1320" height="708" alt="image" src="https://github.com/user-attachments/assets/04ae237f-d056-4558-822f-b73ace009f38" />


https://github.com/user-attachments/assets/e5efbd4f-5f9b-46ed-b4f7-f848054985b6

<img width="1000" height="1000" alt="mail google" src="https://github.com/user-attachments/assets/36df11c6-1599-4721-b53e-4e8e9be8566c" />

**Y** is an X-style campus feed built for Yale students at a hackathon.

Y brings together what's happening at Yale, from club events, talks, performances, and free food to campus opportunities and student discussions. Browse the Wall to see what's going on, or use **Ask Y** to research a question across the Yale Fizz archive and campus listings.

## Research Yale Fizz with Ask Y

**Posts** lets you search the saved Fizz archive by keyword and read the original post text with its capture date and available engagement counts. **Ask Y** takes a question like “What parties are going on tonight?” and pulls together relevant posts, their comments, and available flyer details. It can also include matching events and campus guides. The answer shows source excerpts and links you can follow in Y, along with the archive's capture date when available.

## Explore the app

| Page | What you'll find |
| --- | --- |
| Wall (`/`) | A personalized feed with dates, topics, and source filters. Save items for later, open Tonight for near-term plans, or use Dig campus to find calendars and newsletters. |
| Events (`/events`) | A browsable list of campus events from configured sources such as YaleConnect and public calendars, with times and locations when available. |
| Posts (`/posts`) | Searchable posts from the Yale Fizz archive. |
| Info (`/info`) | Guides to everyday Yale tasks like checking dining hours, reading course listings, and reserving rooms. |
| Ask Y (`/ask`) | A research chat that summarizes relevant material and shows the sources it used. |

## Run locally

Use Node.js 22.13 or later and npm. Run these commands from the repository root.

```bash
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). Wall and Events start with fictional demo items. The Posts search and Ask Y questions require a configured Fizz archive. To enable integrations, copy [`.env.example`](.env.example) to `.env.local` and fill in the relevant variables.

### Connect the Fizz archive

- **SQLite** works with an existing archive at `../output/fizz/fizz.sqlite` relative to the repository root. Set `FIZZ_DB` to use another path.
- **Supabase** uses the [Fizz schema](supabase/fizz.sql). Apply it to your project, set `FIZZ_SUPABASE_URL` and `FIZZ_SUPABASE_SECRET_KEY` in the server environment, and run `npm run fizz:migrate` to copy records from your SQLite archive and verify row counts. Rerun the migration after updating the SQLite archive.
- **Summaries** can use an OpenAI-compatible endpoint via `LLM_API_KEY`, `LLM_BASE_URL`, and `LLM_MODEL`. Ask Y uses a built-in summary when the model is unavailable. The same endpoint can help categorize ingested items.

The archive is refreshed from imported data. The Windows `npm run fizz:import` script expects an existing batch importer at `../output/fizz/catalog_batch.py` and JSON batches in `../output/fizz/inbox/`. To send selected Fizz items to the Wall, use `POST /api/ingest/fizz` with an `external_id` and `title` for each item. See the [sample Wall payload](examples/fizz-items.json).

### Other integrations

| Integration | Setup |
| --- | --- |
| YaleConnect | Set `YALECONNECT_ICAL_URL` to one or more comma-separated iCal subscription URLs. The [Vercel configuration](vercel.json) schedules a refresh every three hours. |
| Gmail and Microsoft Outlook | Set the Google or Azure AD OAuth credentials in [`.env.example`](.env.example). Inbox sync looks back three days by default and stores summaries of listserv messages. |
| Application storage | Apply [`supabase/schema.sql`](supabase/schema.sql) and set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for persistent Wall and Events items. Local installs can use `.data/items.json`. Email/password accounts use `.data/users.json` where the filesystem is writable. |
| Demo data | Set `SEED_DEMO=false` to hide fictional items on Wall and Events. Ask Y currently reads its event context from demo data and the local item file. |

For local OAuth, register `http://localhost:3000/api/auth/callback/google` or `http://localhost:3000/api/auth/callback/azure-ad` with the provider. Gmail uses read-only inbox access, and Microsoft uses Graph `Mail.Read`. Yale's Microsoft tenant may require admin consent.

For a deployment, set `NEXTAUTH_URL` to the deployed URL and configure `NEXTAUTH_SECRET`. Keep Supabase keys on the server. Set `INGEST_SECRET` to protect ingest routes that accept a shared secret. If Vercel runs the YaleConnect refresh, give `CRON_SECRET` the same value.

## Repository layout

Y uses Next.js App Router, React, TypeScript, Tailwind CSS, and NextAuth. SQLite stores the local Fizz archive, and Supabase supports hosted archive and feed storage.

```text
src/app/                  Pages, layouts, and API routes
src/features/feed/        Wall, filters, and personalization
src/features/events/      Event lists and detail pages
src/features/info/        Campus guides
src/features/fizz/        Posts search and the adapter for Wall imports
src/features/ask/         Research chat, source ranking, and summaries
src/components/           Shared navigation, page shells, and account UI
src/lib/                  Auth, storage, ranking, and source ingestion
supabase/                 Database schemas for feed items and the Fizz archive
scripts/                  Archive import and migration scripts
examples/                 Sample iCal, listserv, and Fizz payloads
```

Import other feature areas through their `index.ts`. Name branches `<area>/<topic>` and identify the area in the pull request. Keep `.env.local`, `.data/`, and the archive database out of Git.

Run `npm run lint` and `npm run typecheck` for code checks, or `npm run build` for a production build.

<details>
<summary>Additional project image</summary>

<img width="1000" height="1000" alt="mail google" src="https://github.com/user-attachments/assets/f0cb268f-ee1b-45ba-ae10-dc27f3f5bce0" />

</details>
<img width="3024" height="1964" alt="unnamed" src="https://github.com/user-attachments/assets/c64213aa-cc75-4644-852e-1b01f8097491" />




https://github.com/user-attachments/assets/abdfd3a1-25a4-4558-b20b-08e81ae7fb6c


