begin;

create table if not exists public.fizz_posts (
  post_key text primary key,
  source_post_id text,
  community text,
  author_label text,
  body text,
  body_completeness text not null default 'unknown',
  displayed_age text,
  first_seen_at text not null,
  media_reference text,
  evidence_path text,
  extraction_notes text,
  source_url text
);

create table if not exists public.fizz_comments (
  comment_key text primary key,
  source_comment_id text,
  post_key text not null references public.fizz_posts(post_key),
  parent_comment_key text references public.fizz_comments(comment_key) deferrable initially deferred,
  author_label text,
  body text,
  body_completeness text not null default 'unknown',
  displayed_age text,
  first_seen_at text not null,
  evidence_path text,
  extraction_notes text
);

create table if not exists public.fizz_metric_observations (
  observation_id bigint primary key,
  entity_type text not null,
  entity_key text not null,
  captured_at text not null,
  upvotes integer,
  downvotes integer,
  -- SQLite stored a few textual observations in these two numeric columns.
  displayed_score jsonb,
  comment_count integer,
  refizz_count jsonb,
  source_display text,
  evidence_path text,
  extraction_notes text,
  share_count integer,
  unique (entity_type, entity_key, captured_at, source_display)
);

create table if not exists public.fizz_captures (
  capture_id bigint primary key,
  captured_at text not null,
  surface text not null,
  screen_description text,
  evidence_path text,
  collector_state text,
  notes text,
  unique (captured_at, surface, screen_description)
);

create table if not exists public.fizz_crawl_state (
  key text primary key,
  value text not null,
  updated_at text not null
);

create table if not exists public.fizz_discoveries (
  discovery_id bigint primary key,
  from_entity_type text,
  from_entity_key text,
  to_entity_type text not null,
  to_entity_key text not null,
  discovery_method text not null,
  query text,
  sequence_no integer,
  first_seen_at text not null,
  evidence_path text,
  extraction_notes text,
  unique (from_entity_type, from_entity_key, to_entity_type, to_entity_key, discovery_method, query, first_seen_at)
);

create table if not exists public.fizz_poll_observations (
  poll_observation_id bigint primary key,
  post_key text not null references public.fizz_posts(post_key),
  captured_at text not null,
  total_fizzes integer,
  result_button_visible integer,
  evidence_path text,
  extraction_notes text
);

create table if not exists public.fizz_poll_options (
  post_key text not null references public.fizz_posts(post_key),
  option_index integer not null,
  option_text text not null,
  first_seen_at text not null,
  evidence_path text,
  extraction_notes text,
  primary key (post_key, option_index)
);

create table if not exists public.fizz_post_relations (
  relation_id bigint primary key,
  source_post_key text not null references public.fizz_posts(post_key),
  target_post_key text references public.fizz_posts(post_key),
  relation_type text not null,
  displayed_reference text,
  first_seen_at text not null,
  evidence_path text,
  extraction_notes text
);

create table if not exists public.fizz_search_runs (
  search_id bigint primary key,
  query text not null,
  started_at text not null,
  result_count integer,
  completion_state text not null default 'in_progress',
  notes text,
  unique (query, started_at)
);

create index if not exists fizz_posts_seen_idx on public.fizz_posts (first_seen_at desc, post_key desc);
create index if not exists fizz_comments_post_seen_idx on public.fizz_comments (post_key, first_seen_at, comment_key);
create index if not exists fizz_metrics_latest_idx
  on public.fizz_metric_observations (entity_type, entity_key, captured_at desc, observation_id desc);
create index if not exists fizz_post_relations_source_idx on public.fizz_post_relations (source_post_key);
create index if not exists fizz_post_relations_target_idx on public.fizz_post_relations (target_post_key);

create or replace function public.fizz_catalog(p_query text, p_limit integer)
returns jsonb
language sql stable
set search_path = ''
as $$
  with recent as (
    select p.post_key, p.community, p.author_label, p.body, p.displayed_age, p.first_seen_at,
           m.displayed_score, m.comment_count, m.refizz_count, m.share_count
    from public.fizz_posts p
    left join lateral (
      select o.displayed_score, o.comment_count, o.refizz_count, o.share_count
      from public.fizz_metric_observations o
      where o.entity_type = 'post' and o.entity_key = p.post_key
      order by o.captured_at desc, o.observation_id desc
      limit 1
    ) m on true
    where length(btrim(p.body)) > 0
      and strpos(lower(p.body), lower(p_query)) > 0
    order by p.first_seen_at desc, p.post_key desc
    limit least(greatest(p_limit, 1), 40)
  )
  select jsonb_build_object(
    'postCount', (select count(*) from public.fizz_posts where length(btrim(body)) > 0),
    'latestSeenAt', (select max(first_seen_at) from public.fizz_posts),
    'posts', coalesce(jsonb_agg(to_jsonb(recent) order by first_seen_at desc, post_key desc), '[]'::jsonb)
  ) from recent;
$$;

create or replace function public.fizz_research_posts(p_terms text[])
returns jsonb
language sql stable
set search_path = ''
as $$
  with matching as (
    select post_key, body, displayed_age, first_seen_at, author_label, community, media_reference
    from public.fizz_posts p
    where length(btrim(p.body)) > 0
      and exists (select from unnest(p_terms) term where strpos(lower(p.body), term) > 0)
  )
  select jsonb_build_object(
    'latestSeenAt', (select max(first_seen_at) from public.fizz_posts where length(btrim(body)) > 0),
    'posts', coalesce(jsonb_agg(to_jsonb(matching) order by post_key), '[]'::jsonb)
  ) from matching;
$$;

create or replace function public.fizz_research_comments(p_post_keys text[])
returns table (post_key text, body text)
language sql stable
set search_path = ''
as $$
  select c.post_key, c.body
  from unnest(p_post_keys) as posts(key)
  cross join lateral (
    select c.post_key, c.body, c.first_seen_at, c.comment_key
    from public.fizz_comments c
    where c.post_key = posts.key and length(btrim(c.body)) > 0
    order by c.first_seen_at, c.comment_key
    limit 4
  ) c
  order by c.first_seen_at, c.comment_key;
$$;

alter table public.fizz_posts enable row level security;
alter table public.fizz_comments enable row level security;
alter table public.fizz_metric_observations enable row level security;
alter table public.fizz_captures enable row level security;
alter table public.fizz_crawl_state enable row level security;
alter table public.fizz_discoveries enable row level security;
alter table public.fizz_poll_observations enable row level security;
alter table public.fizz_poll_options enable row level security;
alter table public.fizz_post_relations enable row level security;
alter table public.fizz_search_runs enable row level security;

revoke all on table public.fizz_posts, public.fizz_comments, public.fizz_metric_observations,
  public.fizz_captures, public.fizz_crawl_state, public.fizz_discoveries, public.fizz_poll_observations,
  public.fizz_poll_options, public.fizz_post_relations, public.fizz_search_runs from public, anon, authenticated;
grant select, insert, update on table public.fizz_posts, public.fizz_comments, public.fizz_metric_observations,
  public.fizz_captures, public.fizz_crawl_state, public.fizz_discoveries, public.fizz_poll_observations,
  public.fizz_poll_options, public.fizz_post_relations, public.fizz_search_runs to service_role;

revoke all on function public.fizz_catalog(text, integer), public.fizz_research_posts(text[]),
  public.fizz_research_comments(text[]) from public, anon, authenticated;
grant execute on function public.fizz_catalog(text, integer), public.fizz_research_posts(text[]),
  public.fizz_research_comments(text[]) to service_role;

commit;
