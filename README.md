# Sabaq

Notes, past papers and assignments shared by university students, sorted by course. Sabaq means "lesson".

It covers FAST-NUCES, NUST, COMSATS and LUMS. Adding another university is new rows in the database, not a rewrite.

## What it does

- Browse courses by semester and search by name, code or file title
- Course pages with files sorted by upvotes, filterable by kind (notes, past papers, assignments)
- Sign up, sign in, and upload files up to 20 MB
- Every upload waits in a review queue until an admin approves it
- Profile page with your uploads, their status, and download and upvote totals
- Download counts, and one upvote per student per file
- Questions and answers on every course page
- Students add courses their university is missing
- Team finder for projects, hackathons, final year projects and study groups; contact details are visible only to signed-in students
- "Ask the notes": answers questions from the text of approved PDF and Word files in a course, with links to the files it used

## Stack

| Part | Tool |
|---|---|
| App | Next.js 16 (App Router), TypeScript |
| Styling | Tailwind CSS 4 |
| Database, login, file storage | Supabase |
| Hosting | Vercel |

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in the two values
npm run dev
```

Without the two environment variables the site still runs, on built-in sample data with sign-in and uploads turned off.

## Connect the database

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run `supabase/migrations/0001_init.sql`, then `0002_community.sql`, in that order. They create the tables, security rules, storage bucket, universities and FAST-NUCES courses.
3. In Project settings, API, copy the project URL and the publishable key into `.env.local` (and into the Vercel project's environment variables).
4. In Authentication, URL configuration, set the site URL to your deployed address and add `https://YOUR-SITE/auth/callback` to the redirect URLs.
5. Sign up on the site, then make yourself an admin in the SQL editor:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

## Turn on the study assistant

Add `ANTHROPIC_API_KEY` to the Vercel project's environment variables and redeploy. Optionally set `AI_MODEL` (default `claude-haiku-5-5`). Each student can ask 20 questions a day.

When an admin approves a PDF or Word file, its text is split into passages and stored in `resource_chunks`. A question is matched against those passages with Postgres full-text search, and the best six are sent to the model with instructions to answer only from them.

## How the data is organised

```
universities ─┬─ campuses
              └─ courses ── resources ── votes
profiles (one per signed-up student) ── resources, votes
courses ── threads ── replies
resources ── resource_chunks (text for the assistant)
team_posts (per university, optional)
```

- `resources.status` is `pending`, `approved` or `rejected`. Row level security shows visitors only approved files; uploaders also see their own, and admins see everything.
- `votes` has a two-column primary key `(user_id, resource_id)`, so the database itself prevents double voting.
- Students can edit their own name, batch and campus but never their `role`; the column-level grant enforces that.
- Files live in a private storage bucket. Downloads go through `/r/[id]`, which checks access, counts the download, and redirects to a link that expires in 60 seconds.

## Roadmap

1. Notes and past papers for one university (done)
2. Questions and discussion per course (done)
3. More campuses and universities (done: NUST, COMSATS, LUMS)
4. Project-partner and hackathon-team finder (done)
5. Study assistant that answers from the uploaded notes (done, needs an API key)
6. Internship and freelance board
