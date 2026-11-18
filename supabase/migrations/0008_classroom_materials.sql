-- Classroom subjects and their files (slides, PDFs, links), synced per student.

alter table public.google_connections add column if not exists scopes text;

-- Each Classroom class the student is in, matched to a Sabaq course when possible.
create table if not exists public.classroom_courses (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  external_id text not null,
  name text not null,
  section text,
  link text,
  course_id uuid references public.courses (id) on delete set null,
  synced_at timestamptz not null default now(),
  primary key (user_id, external_id)
);

-- One row per attached file or link, from materials, announcements and assignments.
create table if not exists public.classroom_materials (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  external_id text not null,
  classroom_course text not null,
  source text not null check (source in ('material', 'announcement', 'assignment')),
  post_title text,
  topic text,
  title text not null,
  url text not null,
  file_type text not null check (file_type in ('slides', 'pdf', 'doc', 'sheet', 'video', 'link', 'form', 'file')),
  post_link text,
  posted_at timestamptz,
  unique (user_id, external_id)
);
create index if not exists classroom_materials_course on public.classroom_materials (user_id, classroom_course);

alter table public.classroom_courses enable row level security;
alter table public.classroom_materials enable row level security;

drop policy if exists "classroom courses own rows" on public.classroom_courses;
create policy "classroom courses own rows" on public.classroom_courses
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "classroom materials own rows" on public.classroom_materials;
create policy "classroom materials own rows" on public.classroom_materials
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.classroom_courses from anon;
revoke all on public.classroom_materials from anon;
grant select, insert, update, delete on public.classroom_courses to authenticated;
grant select, insert, update, delete on public.classroom_materials to authenticated;

-- Classroom work meant for other sections stays in the database but is hidden by default.
alter table public.tasks add column if not exists other_section boolean not null default false;
