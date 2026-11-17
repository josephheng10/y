-- Yale Social Hub — Supabase schema
-- Run in Supabase → SQL Editor. Stores ONLY tagged summaries (no email bodies).

create table if not exists public.items (
  id          text primary key,                       -- deterministic "<source>:<hash>" for idempotent upserts
  user_id     text,                                   -- owner email for private items (email); null = shared (YaleConnect, Fizz)
  source      text not null check (source in ('email','yaleconnect','fizz')),
  category    text not null check (category in ('Event','Free food','Opportunity','Club news','Noise')),
  title       text not null,
  summary     text not null default '',
  starts_at   timestamptz,
  location    text,
  url         text,
  score       int  not null default 50 check (score between 0 and 100),
  created_at  timestamptz not null default now()
);

create index if not exists items_user_idx      on public.items (user_id);
create index if not exists items_created_idx   on public.items (created_at desc);
create index if not exists items_starts_idx    on public.items (starts_at);
create index if not exists items_category_idx  on public.items (category);

-- The app talks to Supabase from server routes with the service-role key, so RLS
-- is enabled with no public policies (anon/browser clients can't read anything).
alter table public.items enable row level security;

-- Optional housekeeping: drop items older than 30 days.
-- select cron.schedule('prune-items', '0 4 * * *', $$delete from public.items where created_at < now() - interval '30 days'$$);
