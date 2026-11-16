-- Sabaq stages 2 to 5: discussions, more universities, team finder,
-- and the study assistant that answers from uploaded notes.
-- Run once after 0001_init.sql.

-- ---------- Stage 3: more universities ----------

insert into public.universities (slug, name, short_name) values
  ('nust', 'National University of Sciences and Technology', 'NUST'),
  ('comsats', 'COMSATS University Islamabad', 'COMSATS'),
  ('lums', 'Lahore University of Management Sciences', 'LUMS');

insert into public.campuses (university_id, slug, name)
select u.id, x.slug, x.name
from public.universities u
join (values
  ('nust', 'islamabad', 'Islamabad (H-12)'),
  ('nust', 'rawalpindi', 'Rawalpindi'),
  ('nust', 'risalpur', 'Risalpur'),
  ('nust', 'karachi', 'Karachi'),
  ('nust', 'quetta', 'Quetta'),
  ('comsats', 'islamabad', 'Islamabad'),
  ('comsats', 'lahore', 'Lahore'),
  ('comsats', 'abbottabad', 'Abbottabad'),
  ('comsats', 'wah', 'Wah'),
  ('comsats', 'attock', 'Attock'),
  ('comsats', 'sahiwal', 'Sahiwal'),
  ('comsats', 'vehari', 'Vehari'),
  ('lums', 'lahore', 'Lahore')
) as x (uni, slug, name) on x.uni = u.slug;

-- Students add the courses their university is missing.
alter table public.courses
  add column added_by uuid references public.profiles (id) on delete set null;
alter table public.courses
  add constraint courses_code_format check (code ~ '^[A-Z0-9-]{3,12}$');
alter table public.courses
  add constraint courses_title_length check (char_length(title) between 3 and 120);

create policy "Students add missing courses" on public.courses
  for insert to authenticated
  with check (added_by = (select auth.uid()));
create policy "Admins edit courses" on public.courses
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Admins delete courses" on public.courses
  for delete to authenticated
  using ((select public.is_admin()));

create view public.university_feed with (security_invoker = true) as
select
  u.id,
  u.slug,
  u.name,
  u.short_name,
  (select count(*) from public.courses c where c.university_id = u.id)::int
    as course_count,
  (
    select count(*) from public.resources r
    join public.courses c on c.id = r.course_id
    where c.university_id = u.id and r.status = 'approved'
  )::int as resource_count
from public.universities u;

-- ---------- Stage 2: questions and answers per course ----------

create table public.threads (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 5 and 150),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now()
);
create index threads_course_idx on public.threads (course_id, last_activity_at desc);

create table public.replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index replies_thread_idx on public.replies (thread_id, created_at);

-- A new answer moves its question to the top of the list.
create function public.touch_thread()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.threads set last_activity_at = now() where id = new.thread_id;
  return new;
end;
$$;
revoke execute on function public.touch_thread() from public, anon, authenticated;

create trigger on_reply_created
  after insert on public.replies
  for each row execute function public.touch_thread();

alter table public.threads enable row level security;
alter table public.replies enable row level security;

create policy "Anyone can read questions" on public.threads
  for select using (true);
create policy "Students ask as themselves" on public.threads
  for insert to authenticated
  with check (author_id = (select auth.uid()));
create policy "Authors and admins delete questions" on public.threads
  for delete to authenticated
  using (author_id = (select auth.uid()) or (select public.is_admin()));

create policy "Anyone can read answers" on public.replies
  for select using (true);
create policy "Students answer as themselves" on public.replies
  for insert to authenticated
  with check (author_id = (select auth.uid()));
create policy "Authors and admins delete answers" on public.replies
  for delete to authenticated
  using (author_id = (select auth.uid()) or (select public.is_admin()));

create view public.thread_feed with (security_invoker = true) as
select
  t.id,
  t.course_id,
  t.author_id,
  t.title,
  t.body,
  t.created_at,
  t.last_activity_at,
  p.full_name as author_name,
  (select count(*) from public.replies r where r.thread_id = t.id)::int
    as reply_count
from public.threads t
left join public.profiles p on p.id = t.author_id;

create view public.reply_feed with (security_invoker = true) as
select r.id, r.thread_id, r.author_id, r.body, r.created_at,
  p.full_name as author_name
from public.replies r
left join public.profiles p on p.id = r.author_id;

-- ---------- Stage 4: project partners and hackathon teams ----------

create type public.team_kind as enum ('project', 'hackathon', 'fyp', 'study_group');

create table public.team_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  university_id uuid references public.universities (id) on delete set null,
  kind public.team_kind not null,
  title text not null check (char_length(title) between 5 and 120),
  body text not null check (char_length(body) between 10 and 3000),
  skills text[] not null default '{}' check (cardinality(skills) <= 10),
  contact text not null check (char_length(contact) between 3 and 200),
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);
create index team_posts_created_idx on public.team_posts (is_open desc, created_at desc);

alter table public.team_posts enable row level security;

create policy "Anyone can read team posts" on public.team_posts
  for select using (true);
create policy "Students post as themselves" on public.team_posts
  for insert to authenticated
  with check (author_id = (select auth.uid()));
create policy "Authors open and close their posts" on public.team_posts
  for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));
create policy "Authors and admins delete team posts" on public.team_posts
  for delete to authenticated
  using (author_id = (select auth.uid()) or (select public.is_admin()));

-- Contact details are for signed-in students only.
revoke select on public.team_posts from anon;
grant select (id, author_id, university_id, kind, title, body, skills, is_open, created_at)
  on public.team_posts to anon;
-- Authors may only flip is_open after posting.
revoke update on public.team_posts from anon, authenticated;
grant update (is_open) on public.team_posts to authenticated;

-- ---------- Stage 5: study assistant over uploaded notes ----------

alter table public.resources add column indexed_at timestamptz;

create table public.resource_chunks (
  id bigint generated always as identity primary key,
  resource_id uuid not null references public.resources (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  chunk_index int not null,
  content text not null,
  tsv tsvector generated always as (to_tsvector('english', content)) stored,
  unique (resource_id, chunk_index)
);
create index resource_chunks_tsv_idx on public.resource_chunks using gin (tsv);
create index resource_chunks_course_idx on public.resource_chunks (course_id);

alter table public.resource_chunks enable row level security;

create policy "Text of approved files is readable" on public.resource_chunks
  for select using (
    exists (
      select 1 from public.resources r
      where r.id = resource_id and r.status = 'approved'
    )
    or (select public.is_admin())
  );
create policy "Admins index files" on public.resource_chunks
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admins clear indexes" on public.resource_chunks
  for delete to authenticated using ((select public.is_admin()));

-- Find the passages that best match a question, any word counting.
create function public.match_chunks(cid uuid, question text, n int default 6)
returns table (resource_id uuid, title text, content text, rank real)
language sql
stable
set search_path = ''
as $$
  with q as (
    select nullif(
      replace(plainto_tsquery('english', question)::text, ' & ', ' | '),
      ''
    )::tsquery as query
  )
  select c.resource_id, r.title, c.content, ts_rank(c.tsv, q.query) as rank
  from public.resource_chunks c
  join public.resources r on r.id = c.resource_id
  cross join q
  where c.course_id = cid
    and r.status = 'approved'
    and c.tsv @@ q.query
  order by rank desc
  limit least(greatest(n, 1), 10);
$$;
grant execute on function public.match_chunks(uuid, text, int) to anon, authenticated;

-- One row per question asked, for the daily limit.
create table public.ai_questions (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index ai_questions_user_idx on public.ai_questions (user_id, created_at desc);

alter table public.ai_questions enable row level security;

create policy "Students log their own questions" on public.ai_questions
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Students see their own questions" on public.ai_questions
  for select to authenticated
  using (user_id = (select auth.uid()));
