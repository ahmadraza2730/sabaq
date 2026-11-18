-- Events now go into a "Sabaq due dates" calendar the app creates in the
-- student's Google account (non-sensitive calendar.app.created scope).
alter table public.google_connections add column if not exists calendar_id text;
