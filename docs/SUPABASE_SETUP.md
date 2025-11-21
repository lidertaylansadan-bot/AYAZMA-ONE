# Supabase Setup and Configuration

## 1) Environment Variables

Frontend `.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`

Backend `api/.env`:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT`

## 2) Authentication Configuration

- Enable Email/Password in Supabase Auth settings
- Enable OAuth providers (Google, GitHub) and set Redirect URLs:
  - `http://localhost:5173/dashboard`
  - Production domain `/dashboard`

Frontend uses:
- `signInWithPassword(email, password)`
- `signInWithOAuth({ provider, options: { redirectTo } })`
- Session token persisted in `localStorage` (`supabase-token`)

Backend validates requests via `Authorization: Bearer <token>` using service role client.

## 3) Database Schema & RLS

Apply migrations in order:
- `001_create_profiles.sql`
- `002_create_projects.sql`
- `003_create_sector_blueprints.sql`
- `004_create_wizard_sessions.sql`
- `005_rls_indexes.sql`

RLS policies enforce:
- Access limited to `auth.uid()`
- Wizard sessions require project ownership

Indexes optimize queries:
- `projects(owner_id, status, created_at)`
- Wizard sessions `(project_id, user_id)`

## 4) Storage Buckets

Buckets:
- `project-assets` (private)
- `content-media` (private)

Startup ensures buckets exist. Policies restrict access to paths prefixed with the project id.
Upload limits and MIME restrictions validated app-side.

## 5) Realtime

Subscriptions:
- Database changes on `projects` and wizard tables
- Presence channel `presence:dashboard`
- Broadcast channel `broadcast:dashboard`

## 6) Error Handling & Logging

- Backend uses `helmet`, `morgan`, and rate limiting
- Services return `{ success, data?, error? }`
- Frontend toasts on errors via `sonner`

## 7) Tests

- `npm run test:supabase` performs basic connectivity, realtime, and storage checks
- Configure env before running tests

## 8) Deployment Notes

- Use service role key only on backend
- Set environment variables per environment
- Ensure OAuth redirect URLs match deployed domain