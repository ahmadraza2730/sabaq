# Sabaq

Notes, past papers and assignments shared by university students, sorted by course. Sabaq means "lesson".

Stage 1 covers FAST-NUCES. The database is designed for many universities from the start, so adding another one is new rows, not a rewrite.

## What it does

- Browse courses by semester and search by name, code or file title
- Course pages with files sorted by upvotes, filterable by kind (notes, past papers, assignments)
- Sign up, sign in, and upload files up to 20 MB
- Every upload waits in a review queue until an admin approves it
- Profile page with your uploads, their status, and download and upvote totals
- Download counts, and one upvote per student per file

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
2. Open the SQL editor, paste all of `supabase/migrations/0001_init.sql`, and run it. This creates the tables, security rules, storage bucket, and the FAST-NUCES courses.
3. In Project settings, API, copy the project URL and the publishable key into `.env.local` (and into the Vercel project's environment variables).
4. In Authentication, URL configuration, set the site URL to your deployed address and add `https://YOUR-SITE/auth/callback` to the redirect URLs.
5. Sign up on the site, then make yourself an admin in the SQL editor:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

## How the data is organised

```
universities ─┬─ campuses
              └─ courses ── resources ── votes
profiles (one per signed-up student) ── resources, votes
```

- `resources.status` is `pending`, `approved` or `rejected`. Row level security shows visitors only approved files; uploaders also see their own, and admins see everything.
- `votes` has a two-column primary key `(user_id, resource_id)`, so the database itself prevents double voting.
- Students can edit their own name, batch and campus but never their `role`; the column-level grant enforces that.
- Files live in a private storage bucket. Downloads go through `/r/[id]`, which checks access, counts the download, and redirects to a link that expires in 60 seconds.

## Roadmap

1. Notes and past papers for one university (this stage)
2. Questions and discussion per course
3. More campuses and universities
4. Project-partner and hackathon-team finder
5. Study assistant that answers from the uploaded notes
6. Internship and freelance board
