-- Sabaq: FAST-NUCES only, all five BS computing roadmaps (CS, SE, AI, DS,
-- CY), FAST student profiles (roll number, program, section), and a
-- personal task list that can sync with Google Classroom.
-- Roadmaps from nu.edu.pk/Program/BS(xx), checked November 2026.

-- ---------- FAST-NUCES only ----------

update public.profiles p
set campus_id = null
where campus_id is not null
  and not exists (
    select 1 from public.campuses c
    join public.universities u on u.id = c.university_id
    where c.id = p.campus_id and u.slug = 'fast-nuces'
  );

delete from public.universities where slug <> 'fast-nuces';

-- ---------- Programs ----------

-- One course can sit in several programs, in different semesters.
create table if not exists public.program_courses (
  course_id uuid not null references public.courses (id) on delete cascade,
  program text not null check (program in ('CS', 'SE', 'AI', 'DS', 'CY')),
  semester int not null check (semester between 1 and 8),
  position int not null default 0,
  primary key (course_id, program)
);
alter table public.program_courses enable row level security;
drop policy if exists "Anyone can read program courses" on public.program_courses;
create policy "Anyone can read program courses" on public.program_courses
  for select using (true);

-- Elective slots now use the short program code too.
update public.elective_slots set program = 'CS' where program = 'BS Computer Science';

-- ---------- Courses for all five programs ----------

with fast as (select id from public.universities where slug = 'fast-nuces')
insert into public.courses (university_id, code, title, semester, credit_hours, program, position)
select fast.id, x.code, x.title, x.semester, x.credit_hours, null, null
from fast, (values
  ('AI2001', 'Programming for AI', 3, '2+1'),
  ('CS2004', 'Fundamentals of Software Engineering', 4, '3+0'),
  ('AI3001', 'Knowledge Representation and Reasoning', 5, '3+0'),
  ('AI3006', 'Neural Learning', 6, '3+0'),
  ('AI4002', 'Computer Vision', 6, '3+0'),
  ('AI3007', 'AI Engineering', 7, '3+0'),
  ('AI4091', 'Final Year Project I', 7, '0+3'),
  ('AI4092', 'Final Year Project II', 8, '0+3'),
  ('SE1001', 'Introduction to Software Engineering', 3, '3+0'),
  ('SE2001', 'Software Requirements Engineering', 4, '3+0'),
  ('SE2002', 'Software Design and Architecture', 5, '3+0'),
  ('SE3005', 'Software Construction and Development', 6, '3+0'),
  ('SE3002', 'Software Quality Engineering', 6, '3+0'),
  ('CS4001', 'Professional Certification', 7, '3+0'),
  ('SE4091', 'Final Year Project I', 7, '0+3'),
  -- nu.edu.pk lists FYP II under SE4091 as well; given its own code here.
  ('SE4093', 'Final Year Project II', 8, '0+3'),
  ('SE4092', 'Fundamentals of Software Project Management', 8, '3+0'),
  ('DS2005', 'Introduction to Data Science', 3, '2+1'),
  ('DS3001', 'Data Analysis and Visualization', 5, '3+0'),
  ('DS3006', 'Computational Statistics', 6, '3+0'),
  ('DS3004', 'Data Warehousing and Business Intelligence', 6, '3+1'),
  ('DS3005', 'Data Mining', 7, '3+0'),
  ('DS4091', 'Final Year Project I', 7, '0+3'),
  ('DS4092', 'Final Year Project II', 8, '0+3'),
  ('SS3002', 'Civics and Community Engagement', 3, '2+0'),
  ('CY2004', 'Cyber Security', 3, '3+1'),
  ('CY3001', 'Cryptography and Network Security', 5, '3+1'),
  ('CY3009', 'Digital Forensics and Incident Response', 6, '3+1'),
  ('CY4001', 'Secure Software Design', 7, '3+1'),
  ('CY4091', 'Final Year Project I', 7, '0+3'),
  ('CY3003', 'Cloud and Application Security', 8, '3+1'),
  ('CY4092', 'Final Year Project II', 8, '0+3'),
  -- Listed on nu.edu.pk without a course code.
  ('CY-VARE', 'Vulnerability Assessment and Reverse Engineering', 8, '3+1')
) as x (code, title, semester, credit_hours)
on conflict (university_id, code) do nothing;

-- Placement of every course in every program: (program, code, semester, position)
with fast as (select id from public.universities where slug = 'fast-nuces'),
plan (program, code, semester, position) as (values
  -- BS Computer Science
  ('CS','SS1019',1,1),('CS','MT1003',1,2),('CS','CL1000',1,3),('CS','CS1002',1,4),('CS','SS1012',1,5),('CS','SS1013',1,6),('CS','SS1007',1,7),
  ('CS','SS1015',2,1),('CS','CS1004',2,4),('CS','SS1014',2,5),('CS','SS1021',2,6),('CS','SS1022',2,7),
  ('CS','EE1005',3,2),('CS','CS2001',3,3),('CS','MG4011',3,4),
  ('CS','MT1004',4,1),('CS','EE2003',4,2),('CS','CS2006',4,3),('CS','CS3004',4,4),('CS','CS3005',4,5),('CS','SS2043',4,6),
  ('CS','CS3001',5,2),('CS','CS2009',5,3),('CS','AI2002',5,5),
  ('CS','CS2005',6,3),('CS','CS3009',6,4),('CS','CS3002',6,5),
  ('CS','CS4091',7,4),('CS','CS4075',7,5),
  ('CS','CS4092',8,4),('CS','CS2019',8,6),
  -- BS Software Engineering
  ('SE','MT1003',1,2),('SE','CL1000',1,3),('SE','CS1002',1,4),('SE','SS1013',1,5),('SE','SS1012',1,6),
  ('SE','SS1015',2,1),('SE','EE1005',2,3),('SE','CS1004',2,4),('SE','SS1021',2,5),('SE','SS1014',2,6),('SE','SS1022',2,7),
  ('SE','SS1019',3,1),('SE','EE2003',3,3),('SE','CS2001',3,4),('SE','SS2043',3,5),('SE','SE1001',3,6),('SE','SS1007',3,7),
  ('SE','MT1004',4,1),('SE','CS2006',4,2),('SE','MG4011',4,3),('SE','SE2001',4,4),
  ('SE','AI2002',5,1),('SE','CS3001',5,2),('SE','CS2009',5,3),('SE','SE2002',5,4),
  ('SE','CS3002',6,2),('SE','CS2005',6,3),('SE','SE3005',6,4),('SE','SE3002',6,5),
  ('SE','CS4075',7,3),('SE','SE4091',7,4),('SE','CS4001',7,5),
  ('SE','SE4093',8,4),('SE','SE4092',8,5),('SE','CS2019',8,6),
  -- BS Artificial Intelligence
  ('AI','SS1019',1,1),('AI','MT1003',1,2),('AI','CL1000',1,3),('AI','CS1002',1,4),('AI','SS1012',1,5),('AI','SS1013',1,6),('AI','SS1007',1,7),
  ('AI','SS1015',2,1),('AI','EE1005',2,3),('AI','CS1004',2,4),('AI','SS1014',2,5),('AI','SS1021',2,6),('AI','SS1022',2,7),
  ('AI','CS2001',3,3),('AI','AI2001',3,4),('AI','SS2043',3,6),
  ('AI','MT1004',4,1),('AI','EE2003',4,2),('AI','CS2005',4,3),('AI','CS2004',4,4),('AI','MG4011',4,6),
  ('AI','AI2002',5,1),('AI','CS2006',5,2),('AI','CS2009',5,3),('AI','AI3001',5,4),
  ('AI','CS3001',6,2),('AI','AI3006',6,3),('AI','AI4002',6,4),
  ('AI','CS4075',7,2),('AI','CS3002',7,3),('AI','AI4091',7,4),('AI','AI3007',7,5),
  ('AI','AI4092',8,3),('AI','CS2019',8,6),
  -- BS Data Science
  ('DS','SS1019',1,1),('DS','MT1003',1,2),('DS','CL1000',1,3),('DS','CS1002',1,4),('DS','SS1012',1,5),('DS','SS1013',1,6),('DS','SS1007',1,7),
  ('DS','SS1015',2,1),('DS','EE1005',2,3),('DS','CS1004',2,4),('DS','SS1014',2,5),('DS','SS1021',2,6),('DS','SS1022',2,7),
  -- nu.edu.pk prints Data Structures as CS2005 here; it is CS2001.
  ('DS','CS2001',3,3),('DS','DS2005',3,4),('DS','SS2043',3,6),
  ('DS','MT1004',4,1),('DS','CS2005',4,2),('DS','EE2003',4,3),('DS','CS2004',4,4),('DS','MG4011',4,6),
  ('DS','AI2002',5,1),('DS','CS2006',5,2),('DS','CS2009',5,3),('DS','DS3001',5,4),
  ('DS','DS3006',6,2),('DS','CS3001',6,3),('DS','DS3004',6,4),
  ('DS','CS3002',7,2),('DS','CS4075',7,3),('DS','DS4091',7,4),('DS','DS3005',7,5),
  ('DS','DS4092',8,4),('DS','CS2019',8,6),
  -- BS Cyber Security
  ('CY','MT1003',1,2),('CY','CL1000',1,3),('CY','CS1002',1,4),('CY','SS1013',1,5),('CY','SS1012',1,6),
  ('CY','SS1019',2,1),('CY','EE1005',2,3),('CY','CS1004',2,4),('CY','SS1007',2,5),('CY','SS1014',2,6),('CY','SS1015',2,7),
  ('CY','SS3002',3,1),('CY','CS2001',3,4),('CY','CY2004',3,5),('CY','SS1021',3,6),('CY','SS1022',3,7),
  ('CY','MT1004',4,1),('CY','EE2003',4,2),('CY','CS3001',4,3),('CY','CS2004',4,4),('CY','MG4011',4,5),
  ('CY','CS2005',5,1),('CY','CS2006',5,2),('CY','CY3001',5,3),('CY','CS2009',5,4),
  ('CY','AI2002',6,2),('CY','CS3002',6,3),('CY','CY3009',6,5),
  ('CY','CY4091',7,4),('CY','CY4001',7,5),
  ('CY','CY3003',8,2),('CY','CY4092',8,3),('CY','CY-VARE',8,4),('CY','CS2019',8,6)
)
insert into public.program_courses (course_id, program, semester, position)
select c.id, plan.program, plan.semester, plan.position
from plan
join public.courses c on c.code = plan.code
join fast on c.university_id = fast.id
on conflict (course_id, program) do update set
  semester = excluded.semester,
  position = excluded.position;

-- Elective slots for the other four programs.
with fast as (select id from public.universities where slug = 'fast-nuces')
insert into public.elective_slots (university_id, program, semester, code_hint, label, credit_hours, position)
select fast.id, x.program, x.semester, x.code_hint, x.label, x.credit_hours, x.position
from fast, (values
  ('SE',1,'NSxxxx','Natural Science Elective','3+0',1),('SE',1,'AHX21','Arts and Humanities Elective','2+0',7),
  ('SE',2,'MTxxxx','Qualitative Reasoning I','3+0',2),('SE',3,'MTxxxx','Qualitative Reasoning II','3+0',2),
  ('SE',4,'SSX31','Social Sciences Elective I','3+0',5),('SE',5,'IDSxxxx','Inter-Disciplinary Elective I','3+0',5),
  ('SE',6,'SEX01','SE Elective I','3+0',1),('SE',7,'SEX02','SE Elective II','3+0',1),('SE',7,'SEX03','SE Elective III','3+0',2),
  ('SE',8,'SEX04','SE Elective IV','3+0',1),('SE',8,'SEX05','SE Elective V','3+0',2),('SE',8,'IDSxxxx','Inter-Disciplinary Elective II','3+0',3),

  ('AI',2,'MTxxxx','Qualitative Reasoning I','3+0',2),('AI',3,'MTxxxx','Qualitative Reasoning II','3+0',1),
  ('AI',3,'NSxxxx','Natural Science Elective','3+0',2),('AI',3,'SSX31','Social Sciences Elective I','3+0',5),
  ('AI',4,'AHX21','Arts and Humanities Elective I','2+0',5),('AI',5,'IDSxxxx','Inter-Disciplinary Elective I','3+0',5),
  ('AI',6,'AIX01','AI Elective I','3+0',1),('AI',6,'IDSxxxx','Inter-Disciplinary Elective II','3+0',5),
  ('AI',7,'AIX02','AI Elective II','3+0',1),('AI',8,'AIX03','AI Elective III','3+0',1),('AI',8,'AIX04','AI Elective IV','3+0',2),
  ('AI',8,'AIX05','AI Elective V','3+0',4),('AI',8,'CSxxxx','Professional Certification','3+0',5),

  ('DS',2,'MTxxxx','Qualitative Reasoning I','3+0',2),('DS',3,'MTxxxx','Qualitative Reasoning II','3+0',1),
  ('DS',3,'NSxxxx','Natural Science Elective','3+0',2),('DS',3,'SSX31','Social Sciences Elective I','3+0',5),
  ('DS',4,'AHX21','Arts and Humanities Elective I','2+0',5),('DS',5,'IDSxxxx','Inter-Disciplinary Elective I','3+0',5),
  ('DS',6,'DSX01','DS Elective I','3+0',1),('DS',6,'IDSxxxx','Inter-Disciplinary Elective II','3+0',5),
  ('DS',7,'DSX02','DS Elective II','3+0',1),('DS',8,'DSX03','DS Elective III','3+0',1),('DS',8,'DSX04','DS Elective IV','3+0',2),
  ('DS',8,'DSX05','DS Elective V','3+0',3),('DS',8,'CSxxxx','Professional Certification','3+0',5),

  ('CY',1,'NSxxxx','Natural Science Elective','3+0',1),('CY',1,'AHX21','Arts and Humanities Elective I','2+0',7),
  ('CY',2,'MTxxxx','Qualitative Reasoning I','3+0',2),('CY',3,'MTxxxx','Qualitative Reasoning II','3+0',2),
  ('CY',3,'SSX31','Social Sciences Elective I','3+0',3),('CY',6,'CYX01','CY Elective I','3+0',1),
  ('CY',6,'IDSxxxx','Inter-Disciplinary Elective I','3+0',4),('CY',7,'CYX02','CY Elective II','3+0',1),
  ('CY',7,'CYX03','CY Elective III','3+0',2),('CY',7,'CSxxxx','Professional Certification','3+0',3),
  ('CY',8,'CYxxxx','CY Elective IV','3+0',1)
) as x (program, semester, code_hint, label, credit_hours, position)
on conflict (university_id, program, semester, label) do update set
  code_hint = excluded.code_hint,
  credit_hours = excluded.credit_hours,
  position = excluded.position;

-- ---------- FAST student profiles ----------

alter table public.profiles add column if not exists roll_number text;
alter table public.profiles add column if not exists program text
  check (program in ('CS', 'SE', 'AI', 'DS', 'CY'));
alter table public.profiles add column if not exists section text
  check (section ~ '^[A-Z]{1,2}$');
alter table public.profiles add column if not exists current_semester int
  check (current_semester between 1 and 8);

-- FAST roll numbers look like 23I-0567: year, campus letter, four digits.
alter table public.profiles drop constraint if exists profiles_roll_number_format;
alter table public.profiles add constraint profiles_roll_number_format
  check (roll_number ~ '^[0-9]{2}[ILKPFM]-[0-9]{4}$');
create unique index if not exists profiles_roll_number_key
  on public.profiles (roll_number) where roll_number is not null;

grant update (full_name, batch, campus_id, roll_number, program, section, current_semester)
  on public.profiles to authenticated;

-- ---------- Personal tasks and reminders ----------

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  notes text check (char_length(notes) <= 2000),
  course_id uuid references public.courses (id) on delete set null,
  group_label text,
  due_at timestamptz,
  done boolean not null default false,
  source text not null default 'manual' check (source in ('manual', 'classroom')),
  external_id text,
  link text,
  created_at timestamptz not null default now(),
  unique (user_id, source, external_id)
);
create index if not exists tasks_user_due_idx on public.tasks (user_id, done, due_at);

alter table public.tasks enable row level security;
drop policy if exists "Students manage their own tasks" on public.tasks;
create policy "Students manage their own tasks" on public.tasks
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Google Classroom connection: one per student, readable only by them.
create table if not exists public.google_connections (
  user_id uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  google_email text,
  refresh_token text not null,
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz
);
alter table public.google_connections enable row level security;
drop policy if exists "Students manage their own Google connection" on public.google_connections;
create policy "Students manage their own Google connection" on public.google_connections
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
revoke all on public.google_connections from anon;
