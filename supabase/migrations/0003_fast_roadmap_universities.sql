-- Sabaq: the full FAST-NUCES BS Computer Science roadmap, elective slots,
-- and details for the major universities of Pakistan and their campuses.
-- Safe to run more than once.

-- ---------- More detail on universities, campuses and courses ----------

alter table public.universities add column if not exists city text;
alter table public.universities add column if not exists sector text
  check (sector in ('public', 'private'));
alter table public.universities add column if not exists founded int;
alter table public.universities add column if not exists website text;
alter table public.universities add column if not exists featured boolean not null default false;

alter table public.campuses add column if not exists city text;

alter table public.courses add column if not exists credit_hours text;
alter table public.courses add column if not exists program text;
alter table public.courses add column if not exists position int;

-- Elective slots in a programme roadmap ("CS Elective I"). They are not
-- courses themselves: students add the elective they actually took.
create table if not exists public.elective_slots (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id) on delete cascade,
  program text not null,
  semester int not null check (semester between 1 and 8),
  code_hint text,
  label text not null,
  credit_hours text,
  position int not null default 0,
  unique (university_id, program, semester, label)
);
alter table public.elective_slots enable row level security;
drop policy if exists "Anyone can read elective slots" on public.elective_slots;
create policy "Anyone can read elective slots" on public.elective_slots
  for select using (true);

-- ---------- Universities ----------

insert into public.universities
  (slug, name, short_name, city, sector, founded, website, featured)
values
  ('fast-nuces', 'National University of Computer and Emerging Sciences', 'FAST-NUCES', 'Islamabad', 'private', 2000, 'https://www.nu.edu.pk', true),
  ('nust', 'National University of Sciences and Technology', 'NUST', 'Islamabad', 'public', 1991, 'https://nust.edu.pk', false),
  ('comsats', 'COMSATS University Islamabad', 'COMSATS', 'Islamabad', 'public', 1998, 'https://www.comsats.edu.pk', false),
  ('lums', 'Lahore University of Management Sciences', 'LUMS', 'Lahore', 'private', 1984, 'https://lums.edu.pk', false),
  ('giki', 'Ghulam Ishaq Khan Institute of Engineering Sciences and Technology', 'GIKI', 'Topi', 'private', 1993, 'https://giki.edu.pk', false),
  ('pieas', 'Pakistan Institute of Engineering and Applied Sciences', 'PIEAS', 'Islamabad', 'public', 1967, 'https://www.pieas.edu.pk', false),
  ('itu', 'Information Technology University of the Punjab', 'ITU', 'Lahore', 'public', 2012, 'https://itu.edu.pk', false),
  ('uet-lahore', 'University of Engineering and Technology, Lahore', 'UET Lahore', 'Lahore', 'public', 1921, 'https://www.uet.edu.pk', false),
  ('uet-taxila', 'University of Engineering and Technology, Taxila', 'UET Taxila', 'Taxila', 'public', 1993, 'https://www.uettaxila.edu.pk', false),
  ('uet-peshawar', 'University of Engineering and Technology, Peshawar', 'UET Peshawar', 'Peshawar', 'public', 1980, 'https://www.uetpeshawar.edu.pk', false),
  ('ned', 'NED University of Engineering and Technology', 'NED', 'Karachi', 'public', 1921, 'https://www.neduet.edu.pk', false),
  ('iba-karachi', 'Institute of Business Administration, Karachi', 'IBA Karachi', 'Karachi', 'public', 1955, 'https://www.iba.edu.pk', false),
  ('sukkur-iba', 'Sukkur IBA University', 'Sukkur IBA', 'Sukkur', 'public', 1994, 'https://www.iba-suk.edu.pk', false),
  ('habib', 'Habib University', 'Habib', 'Karachi', 'private', 2014, 'https://habib.edu.pk', false),
  ('szabist', 'Shaheed Zulfikar Ali Bhutto Institute of Science and Technology', 'SZABIST', 'Karachi', 'private', 1995, 'https://szabist.edu.pk', false),
  ('iqra', 'Iqra University', 'Iqra', 'Karachi', 'private', 1998, 'https://iqra.edu.pk', false),
  ('punjab', 'University of the Punjab', 'PU', 'Lahore', 'public', 1882, 'https://pu.edu.pk', false),
  ('qau', 'Quaid-i-Azam University', 'QAU', 'Islamabad', 'public', 1967, 'https://qau.edu.pk', false),
  ('iiui', 'International Islamic University, Islamabad', 'IIUI', 'Islamabad', 'public', 1980, 'https://www.iiu.edu.pk', false),
  ('numl', 'National University of Modern Languages', 'NUML', 'Islamabad', 'public', 1969, 'https://numl.edu.pk', false),
  ('ist', 'Institute of Space Technology', 'IST', 'Islamabad', 'public', 2002, 'https://www.ist.edu.pk', false),
  ('bahria', 'Bahria University', 'Bahria', 'Islamabad', 'public', 2000, 'https://www.bahria.edu.pk', false),
  ('air', 'Air University', 'Air University', 'Islamabad', 'public', 2002, 'https://au.edu.pk', false),
  ('cust', 'Capital University of Science and Technology', 'CUST', 'Islamabad', 'private', 1998, 'https://cust.edu.pk', false),
  ('riphah', 'Riphah International University', 'Riphah', 'Islamabad', 'private', 2002, 'https://www.riphah.edu.pk', false),
  ('umt', 'University of Management and Technology', 'UMT', 'Lahore', 'private', 1990, 'https://www.umt.edu.pk', false),
  ('ucp', 'University of Central Punjab', 'UCP', 'Lahore', 'private', 2002, 'https://ucp.edu.pk', false),
  ('uol', 'The University of Lahore', 'UOL', 'Lahore', 'private', 1999, 'https://uol.edu.pk', false),
  ('vu', 'Virtual University of Pakistan', 'VU', 'Lahore', 'public', 2002, 'https://www.vu.edu.pk', false)
on conflict (slug) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  city = excluded.city,
  sector = excluded.sector,
  founded = excluded.founded,
  website = excluded.website,
  featured = excluded.featured;

-- ---------- Campuses ----------

insert into public.campuses (university_id, slug, name, city)
select u.id, x.slug, x.name, x.city
from public.universities u
join (values
  ('fast-nuces', 'islamabad', 'Islamabad (H-11/4)', 'Islamabad'),
  ('fast-nuces', 'lahore', 'Lahore (Faisal Town)', 'Lahore'),
  ('fast-nuces', 'karachi', 'Karachi (National Highway)', 'Karachi'),
  ('fast-nuces', 'peshawar', 'Peshawar', 'Peshawar'),
  ('fast-nuces', 'chiniot-faisalabad', 'Chiniot-Faisalabad', 'Faisalabad'),
  ('fast-nuces', 'multan', 'Multan', 'Multan'),

  ('nust', 'islamabad', 'Islamabad (H-12)', 'Islamabad'),
  ('nust', 'rawalpindi', 'Rawalpindi (CEME)', 'Rawalpindi'),
  ('nust', 'rawalpindi-mcs', 'Rawalpindi (MCS)', 'Rawalpindi'),
  ('nust', 'risalpur', 'Risalpur (CAE)', 'Risalpur'),
  ('nust', 'risalpur-mce', 'Risalpur (MCE)', 'Risalpur'),
  ('nust', 'karachi', 'Karachi (PNEC)', 'Karachi'),
  ('nust', 'quetta', 'Quetta (NBC)', 'Quetta'),

  ('comsats', 'islamabad', 'Islamabad', 'Islamabad'),
  ('comsats', 'lahore', 'Lahore', 'Lahore'),
  ('comsats', 'abbottabad', 'Abbottabad', 'Abbottabad'),
  ('comsats', 'wah', 'Wah', 'Wah Cantt'),
  ('comsats', 'attock', 'Attock', 'Attock'),
  ('comsats', 'sahiwal', 'Sahiwal', 'Sahiwal'),
  ('comsats', 'vehari', 'Vehari', 'Vehari'),

  ('lums', 'lahore', 'Lahore (DHA)', 'Lahore'),
  ('giki', 'topi', 'Topi', 'Swabi'),
  ('pieas', 'islamabad', 'Islamabad (Nilore)', 'Islamabad'),
  ('itu', 'lahore', 'Lahore', 'Lahore'),

  ('uet-lahore', 'lahore', 'Lahore (Main)', 'Lahore'),
  ('uet-lahore', 'kala-shah-kaku', 'Kala Shah Kaku', 'Sheikhupura'),
  ('uet-lahore', 'faisalabad', 'Faisalabad', 'Faisalabad'),
  ('uet-lahore', 'narowal', 'Narowal', 'Narowal'),
  ('uet-lahore', 'rachna', 'Rachna College, Gujranwala', 'Gujranwala'),
  ('uet-taxila', 'taxila', 'Taxila', 'Taxila'),
  ('uet-peshawar', 'peshawar', 'Peshawar', 'Peshawar'),
  ('ned', 'karachi', 'Karachi', 'Karachi'),

  ('iba-karachi', 'main', 'Main Campus', 'Karachi'),
  ('iba-karachi', 'city', 'City Campus', 'Karachi'),
  ('sukkur-iba', 'sukkur', 'Sukkur', 'Sukkur'),
  ('habib', 'karachi', 'Karachi', 'Karachi'),

  ('szabist', 'karachi', 'Karachi', 'Karachi'),
  ('szabist', 'islamabad', 'Islamabad', 'Islamabad'),
  ('szabist', 'hyderabad', 'Hyderabad', 'Hyderabad'),
  ('szabist', 'larkana', 'Larkana', 'Larkana'),
  ('szabist', 'gharo', 'Gharo', 'Thatta'),
  ('szabist', 'dubai', 'Dubai', 'Dubai'),
  ('iqra', 'karachi', 'Karachi', 'Karachi'),
  ('iqra', 'islamabad', 'Islamabad', 'Islamabad'),

  ('punjab', 'lahore', 'Lahore (Quaid-e-Azam Campus)', 'Lahore'),
  ('punjab', 'gujranwala', 'Gujranwala', 'Gujranwala'),
  ('punjab', 'jhelum', 'Jhelum', 'Jhelum'),
  ('qau', 'islamabad', 'Islamabad', 'Islamabad'),
  ('iiui', 'islamabad', 'Islamabad (H-10)', 'Islamabad'),

  ('numl', 'islamabad', 'Islamabad', 'Islamabad'),
  ('numl', 'rawalpindi', 'Rawalpindi', 'Rawalpindi'),
  ('numl', 'lahore', 'Lahore', 'Lahore'),
  ('numl', 'faisalabad', 'Faisalabad', 'Faisalabad'),
  ('numl', 'multan', 'Multan', 'Multan'),
  ('numl', 'peshawar', 'Peshawar', 'Peshawar'),
  ('numl', 'karachi', 'Karachi', 'Karachi'),
  ('numl', 'hyderabad', 'Hyderabad', 'Hyderabad'),
  ('numl', 'quetta', 'Quetta', 'Quetta'),
  ('ist', 'islamabad', 'Islamabad', 'Islamabad'),

  ('bahria', 'islamabad-e8', 'Islamabad (E-8)', 'Islamabad'),
  ('bahria', 'islamabad-h11', 'Islamabad (H-11)', 'Islamabad'),
  ('bahria', 'karachi', 'Karachi', 'Karachi'),
  ('bahria', 'lahore', 'Lahore', 'Lahore'),

  ('air', 'islamabad', 'Islamabad (E-9)', 'Islamabad'),
  ('air', 'islamabad-h11', 'Islamabad (H-11)', 'Islamabad'),
  ('air', 'multan', 'Multan', 'Multan'),
  ('air', 'kamra', 'Kamra (Aerospace and Aviation)', 'Attock'),
  ('air', 'kharian', 'Kharian', 'Kharian'),

  ('cust', 'islamabad', 'Islamabad', 'Islamabad'),
  ('riphah', 'islamabad', 'Islamabad (I-14)', 'Islamabad'),
  ('riphah', 'rawalpindi', 'Rawalpindi (Al-Mizan)', 'Rawalpindi'),
  ('riphah', 'lahore', 'Lahore', 'Lahore'),
  ('riphah', 'faisalabad', 'Faisalabad', 'Faisalabad'),
  ('riphah', 'sahiwal', 'Sahiwal', 'Sahiwal'),
  ('riphah', 'malakand', 'Malakand', 'Malakand'),
  ('umt', 'lahore', 'Lahore (Johar Town)', 'Lahore'),
  ('umt', 'sialkot', 'Sialkot', 'Sialkot'),
  ('ucp', 'lahore', 'Lahore (Johar Town)', 'Lahore'),
  ('uol', 'lahore', 'Lahore', 'Lahore'),
  ('uol', 'sargodha', 'Sargodha', 'Sargodha'),
  ('vu', 'lahore', 'Lahore (head office)', 'Lahore')
) as x (uni, slug, name, city) on x.uni = u.slug
on conflict (university_id, slug) do update set
  name = excluded.name,
  city = excluded.city;

-- ---------- FAST-NUCES BS Computer Science roadmap ----------

-- Courses from the earlier seed that are not in the current roadmap.
-- Removed only while nothing has been posted to them.
delete from public.courses c
using public.universities u
where c.university_id = u.id
  and u.slug = 'fast-nuces'
  and c.code in ('CS1005', 'MT1008', 'NS1001', 'MT2005')
  and not exists (select 1 from public.resources r where r.course_id = c.id)
  and not exists (select 1 from public.threads t where t.course_id = c.id);

insert into public.courses
  (university_id, code, title, semester, credit_hours, program, position)
select u.id, x.code, x.title, x.semester, x.credit_hours, 'BS Computer Science', x.position
from public.universities u
join (values
  ('SS1019', 'Understanding of Sirat-Un-Nabi (PBUH)', 1, 'NC+0', 1),
  ('MT1003', 'Calculus and Analytical Geometry', 1, '3+0', 2),
  ('CL1000', 'Introduction to Information and Communication Technology', 1, '0+1', 3),
  ('CS1002', 'Programming Fundamentals', 1, '3+1', 4),
  ('SS1012', 'Functional English', 1, '2+1', 5),
  ('SS1013', 'Ideology and Constitution of Pakistan', 1, '2+0', 6),
  ('SS1007', 'Islamic Studies/Ethics', 1, '2+0', 7),

  ('SS1015', 'Pakistan Studies', 2, '2+0', 1),
  ('CS1004', 'Object Oriented Programming', 2, '3+1', 4),
  ('SS1014', 'Expository Writing', 2, '2+1', 5),
  ('SS1021', 'Understanding of Holy Quran I', 2, '1+0', 6),
  ('SS1022', 'Understanding of Holy Quran II', 2, '1+0', 7),

  ('EE1005', 'Digital Logic Design', 3, '3+1', 2),
  ('CS2001', 'Data Structures', 3, '3+1', 3),
  ('MG4011', 'Entrepreneurship', 3, '3+0', 4),

  ('MT1004', 'Linear Algebra', 4, '3+0', 1),
  ('EE2003', 'Computer Organization and Assembly Language', 4, '3+1', 2),
  ('CS2006', 'Operating Systems', 4, '3+1', 3),
  ('CS3004', 'Software Design and Analysis', 4, '3+0', 4),
  ('CS3005', 'Theory of Automata', 4, '3+0', 5),
  ('SS2043', 'Civics and Community Engagement', 4, '2+0', 6),

  ('CS3001', 'Computer Networks', 5, '3+1', 2),
  ('CS2009', 'Design and Analysis of Algorithms', 5, '3+0', 3),
  ('AI2002', 'Artificial Intelligence', 5, '3+1', 5),

  ('CS2005', 'Database Systems', 6, '3+1', 3),
  ('CS3009', 'Software Engineering', 6, '3+0', 4),
  ('CS3002', 'Information Security', 6, '3+0', 5),

  ('CS4091', 'Final Year Project I', 7, '0+3', 4),
  ('CS4075', 'Cloud Computing', 7, '3+0', 5),

  ('CS4092', 'Final Year Project II', 8, '0+3', 4),
  ('CS2019', 'Computing Internship', 8, '0+1', 6)
) as x (code, title, semester, credit_hours, position) on true
where u.slug = 'fast-nuces'
on conflict (university_id, code) do update set
  title = excluded.title,
  semester = excluded.semester,
  credit_hours = excluded.credit_hours,
  program = excluded.program,
  position = excluded.position;

insert into public.elective_slots
  (university_id, program, semester, code_hint, label, credit_hours, position)
select u.id, 'BS Computer Science', x.semester, x.code_hint, x.label, x.credit_hours, x.position
from public.universities u
join (values
  (2, 'MTxxxx', 'Qualitative Reasoning I', '3+0', 2),
  (2, 'NSxxxx', 'Natural Science Elective', '3+0', 3),
  (3, 'MTxxxx', 'Qualitative Reasoning II', '3+0', 1),
  (3, 'AHX21', 'Arts and Humanities Elective I', '2+0', 5),
  (3, 'SSX31', 'Social Sciences Elective I', '3+0', 6),
  (5, 'CSX01', 'CS Elective I', '3+0', 1),
  (5, 'IDSxxxx', 'Inter-Disciplinary Elective I', '3+0', 4),
  (6, 'CSX02', 'CS Elective II', '3+0', 1),
  (6, 'CSX03', 'CS Elective III', '3+0', 2),
  (7, 'CSX04', 'CS Elective IV', '3+0', 1),
  (7, 'CSX05', 'CS Elective V', '3+0', 2),
  (7, 'IDSxxxx', 'Inter-Disciplinary Elective II', '3+0', 3),
  (8, 'CSxxxx', 'CS Elective VI', '3+0', 1),
  (8, 'CSX07', 'CS Elective VII', '3+0', 2),
  (8, 'CSX08', 'CS Elective VIII', '3+0', 3),
  (8, 'CSxxxx', 'Professional Certification', '3+0', 5)
) as x (semester, code_hint, label, credit_hours, position) on true
where u.slug = 'fast-nuces'
on conflict (university_id, program, semester, label) do update set
  code_hint = excluded.code_hint,
  credit_hours = excluded.credit_hours,
  position = excluded.position;

-- ---------- Views the app reads (new columns go at the end) ----------

create or replace view public.course_feed with (security_invoker = true) as
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
  )::int as resource_count,
  c.credit_hours,
  c.program,
  c.position
from public.courses c
join public.universities u on u.id = c.university_id;

create or replace view public.university_feed with (security_invoker = true) as
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
  )::int as resource_count,
  u.city,
  u.sector,
  u.founded,
  u.website,
  u.featured,
  (select count(*) from public.campuses cp where cp.university_id = u.id)::int
    as campus_count
from public.universities u;
