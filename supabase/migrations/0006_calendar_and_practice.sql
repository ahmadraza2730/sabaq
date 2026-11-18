-- Google Calendar sync for tasks, and progress for the practice problems.

alter table public.tasks add column if not exists calendar_event_id text;
alter table public.google_connections add column if not exists calendar_enabled boolean not null default false;

-- Solved practice problems. Problems themselves live in the app code.
create table if not exists public.practice_solved (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  problem_slug text not null check (char_length(problem_slug) between 1 and 80),
  language text not null check (language in ('cpp', 'java')),
  code text check (char_length(code) <= 50000),
  solved_at timestamptz not null default now(),
  primary key (user_id, problem_slug)
);

alter table public.practice_solved enable row level security;

drop policy if exists "practice own rows" on public.practice_solved;
create policy "practice own rows" on public.practice_solved
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.practice_solved from anon;
grant select, insert, update, delete on public.practice_solved to authenticated;

-- Runs per user per day, to keep the free compiler service healthy.
create table if not exists public.code_runs (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists code_runs_user_time on public.code_runs (user_id, created_at desc);
alter table public.code_runs enable row level security;
drop policy if exists "code runs own rows" on public.code_runs;
create policy "code runs own rows" on public.code_runs
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
revoke all on public.code_runs from anon;
grant select, insert on public.code_runs to authenticated;
