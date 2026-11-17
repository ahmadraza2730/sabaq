-- Let the assistant search every course at a university, and log
-- questions that are not tied to one course.

create or replace function public.match_chunks_university(uni text, question text, n int default 6)
returns table (resource_id uuid, title text, content text, rank real, course_code text)
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
  select c.resource_id, r.title, c.content, ts_rank(c.tsv, q.query) as rank, co.code
  from public.resource_chunks c
  join public.resources r on r.id = c.resource_id
  join public.courses co on co.id = c.course_id
  join public.universities u on u.id = co.university_id
  cross join q
  where u.slug = uni
    and r.status = 'approved'
    and c.tsv @@ q.query
  order by rank desc
  limit least(greatest(n, 1), 10);
$$;
grant execute on function public.match_chunks_university(text, text, int) to anon, authenticated;

alter table public.ai_questions alter column course_id drop not null;
