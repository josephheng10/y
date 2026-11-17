# Y

Y is the hub Yale students use to find what is happening and what they need to know. This repo is organized so each person can own one area without editing the same files.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You need Node 20 or newer.

## Where work goes

```
src/app/                 URLs only. A page loads one feature and renders it.
src/features/events/     Campus events: source, types, and UI.
src/features/info/       Durable campus info: guides, offices, how-tos.
src/features/fizz/       Student posts. UI lives here.
src/lib/fizz.ts          Fizz catalog reader. Stays here while the database hookup is in progress.
src/components/          UI used by more than one area, such as the top nav.
src/lib/                 Helpers used by more than one area.
scripts/                 Jobs that refresh outside data. Not imported by pages.
```

Each feature has the same shape:

```
features/<area>/
  index.ts        What the rest of the app is allowed to import
  types.ts
  data.ts         The only file in that area that reads a source
  components/     UI for that area
```

Routes today:

| URL | Area | Folder |
| --- | --- | --- |
| `/` | Posts | `src/features/fizz` and `src/lib/fizz.ts` |
| `/events`, `/events/[id]` | Events | `src/features/events` |
| `/info`, `/info/[slug]` | Info | `src/features/info` |

Events and info currently render sample listings so the shape is fixed. Replace the array in that area's `data.ts` when a real source is ready, and keep the function names (`listEvents`, `getEvent`, `listInfo`, `getInfo`).

The Fizz database stays outside this repo, in `BS/output/fizz`. `npm run fizz:import` loads new catalog batches from that inbox. New Fizz scripts go in `scripts/` and stay out of React components.

## How we work in parallel

1. Pick an area and stay inside its folder plus its route under `src/app`.
2. Import another area only from its `index.ts`. Reach into `components/` or `data.ts` of another area only by moving that code into the public index first.
3. Keep pages thin. A route file should call the feature and render what it returns. Data queries, parsing, and card markup belong in the feature. If the page reads the request (a search, a database, or an id), do that read inside `<Suspense>` so the nav can render immediately.
4. Add shared code only when a second area needs it. The first version lives in the feature. The second use is what earns a spot in `src/components` or `src/lib`.
5. Name branches `<area>/<topic>`, for example `events/college-teas` or `fizz/refresh`.
6. Open a pull request with the area filled in. The template is in `.github/pull_request_template.md`.
7. Leave `.env*`, sqlite files, and scraped inbox JSON untracked. The gitignore already skips env files. Databases live under `BS/output`, not in this repo.

## Add a new area

1. Create `src/features/<name>/types.ts`, `data.ts`, `index.ts`, and `components/`.
2. Export only what routes need from `index.ts`.
3. Add `src/app/<name>/page.tsx` that imports from `@/features/<name>`.
4. Add the route to `areas` in `src/components/AreaNav.tsx`.
