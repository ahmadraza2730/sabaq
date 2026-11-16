-- Sabaq: stage 1 schema.
-- Built for many universities from day one, launched with one.
-- Run this once in the Supabase SQL editor (or `supabase db push`).

-- ---------- Tables ----------

create table public.universities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_name text not null
);

create table public.campuses (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id) on delete cascade,
  slug text not null,
  name text not null,
  unique (university_id, slug)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id) on delete cascade,
  code text not null,
  title text not null,
  semester int not null check (semester between 1 and 8),
  unique (university_id, code)
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  batch text,
  campus_id uuid references public.campuses (id),
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

create type public.resource_type as enum ('notes', 'past_paper', 'assignment');
create type public.resource_status as enum ('pending', 'approved', 'rejected');

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  campus_id uuid references public.campuses (id),
  uploader_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  type public.resource_type not null,
  year int check (year between 2000 and 2100),
  file_path text not null unique,
  file_name text not null,
  status public.resource_status not null default 'pending',
  downloads int not null default 0,
  created_at timestamptz not null default now()
);

create index resources_course_status_idx on public.resources (course_id, status);
create index resources_uploader_idx on public.resources (uploader_id);

-- One vote per student per resource: the two-column primary key enforces it.
create table public.votes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, resource_id)
);

create index votes_resource_idx on public.votes (resource_id);

-- ---------- Helper functions ----------

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Create a profile row whenever someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, batch)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'batch', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Count a download. Only approved resources are counted.
create function public.increment_download(rid uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.resources
  set downloads = downloads + 1
  where id = rid and status = 'approved';
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
-- Security rules call is_admin() for every visitor, signed in or not.
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- Row level security ----------

alter table public.universities enable row level security;
alter table public.campuses enable row level security;
alter table public.courses enable row level security;
alter table public.profiles enable row level security;
alter table public.resources enable row level security;
alter table public.votes enable row level security;

create policy "Anyone can read universities" on public.universities
  for select using (true);
create policy "Anyone can read campuses" on public.campuses
  for select using (true);
create policy "Anyone can read courses" on public.courses
  for select using (true);

create policy "Anyone can read profiles" on public.profiles
  for select using (true);
create policy "Students update their own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- A student may edit their name, batch and campus, never their role.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, batch, campus_id) on public.profiles to authenticated;

create policy "Approved resources are public; owners and admins see the rest"
  on public.resources for select
  using (
    status = 'approved'
    or uploader_id = (select auth.uid())
    or (select public.is_admin())
  );

create policy "Students upload as themselves, always pending"
  on public.resources for insert to authenticated
  with check (
    uploader_id = (select auth.uid())
    and status = 'pending'
    and downloads = 0
    and file_path like (select auth.uid())::text || '/%'
  );

create policy "Admins review resources" on public.resources
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins delete resources" on public.resources
  for delete to authenticated
  using ((select public.is_admin()));

create policy "Anyone can read votes" on public.votes
  for select using (true);
create policy "Students vote as themselves" on public.votes
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Students remove their own vote" on public.votes
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------- Views the app reads ----------

create view public.course_feed with (security_invoker = true) as
select
  c.id,
  c.code,
  c.title,
  c.semester,
  u.slug as university_slug,
  u.short_name as university_name,
  (
    select count(*) from public.resources r
    where r.course_id = c.id and r.status = 'approved'
  )::int as resource_count
from public.courses c
join public.universities u on u.id = c.university_id;

create view public.resource_feed with (security_invoker = true) as
select
  r.id,
  r.course_id,
  r.uploader_id,
  r.title,
  r.type,
  r.year,
  r.file_name,
  r.status,
  r.downloads,
  r.created_at,
  c.code as course_code,
  c.title as course_title,
  u.slug as university_slug,
  p.full_name as uploader_name,
  cp.name as campus_name,
  (select count(*) from public.votes v where v.resource_id = r.id)::int as votes
from public.resources r
join public.courses c on c.id = r.course_id
join public.universities u on u.id = c.university_id
left join public.profiles p on p.id = r.uploader_id
left join public.campuses cp on cp.id = r.campus_id;

-- ---------- File storage ----------

insert into storage.buckets (id, name, public, file_size_limit)
values ('resources', 'resources', false, 20971520);

create policy "Students upload into their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'resources'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Files are readable once approved, or by owner and admins"
  on storage.objects for select
  using (
    bucket_id = 'resources'
    and (
      owner_id = (select auth.uid())::text
      or (select public.is_admin())
      or exists (
        select 1 from public.resources r
        where r.file_path = storage.objects.name and r.status = 'approved'
      )
    )
  );

create policy "Admins delete files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'resources' and (select public.is_admin()));

-- ---------- Seed: FAST-NUCES ----------

insert into public.universities (slug, name, short_name)
values ('fast-nuces', 'National University of Computer and Emerging Sciences', 'FAST-NUCES');

insert into public.campuses (university_id, slug, name)
select u.id, x.slug, x.name
from public.universities u,
  (values
    ('islamabad', 'Islamabad'),
    ('lahore', 'Lahore'),
    ('karachi', 'Karachi'),
    ('peshawar', 'Peshawar'),
    ('chiniot-faisalabad', 'Chiniot-Faisalabad'),
    ('multan', 'Multan')
  ) as x (slug, name)
where u.slug = 'fast-nuces';

-- BS Computer Science, semesters 1 to 4. Check codes against your own
-- course outline and fix any that differ.
insert into public.courses (university_id, code, title, semester)
select u.id, x.code, x.title, x.semester
from public.universities u,
  (values
    ('CS1002', 'Programming Fundamentals', 1),
    ('CL1000', 'Introduction to Information and Communication Technology', 1),
    ('MT1003', 'Calculus and Analytical Geometry', 1),
    ('NS1001', 'Applied Physics', 1),
    ('SS1012', 'Functional English', 1),
    ('CS1004', 'Object Oriented Programming', 2),
    ('EE1005', 'Digital Logic Design', 2),
    ('MT1008', 'Multivariable Calculus', 2),
    ('CS1005', 'Discrete Structures', 2),
    ('SS1014', 'Expository Writing', 2),
    ('CS2001', 'Data Structures', 3),
    ('EE2003', 'Computer Organization and Assembly Language', 3),
    ('MT1004', 'Linear Algebra', 3),
    ('MT2005', 'Probability and Statistics', 3),
    ('CS2005', 'Database Systems', 4),
    ('CS2006', 'Operating Systems', 4),
    ('CS2009', 'Design and Analysis of Algorithms', 4),
    ('CS3001', 'Computer Networks', 4)
  ) as x (code, title, semester)
where u.slug = 'fast-nuces';

-- To make yourself an admin after signing up, run:
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'you@example.com');
