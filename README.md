# Kalas 🎉

*From Swedish "kalas" — a celebration.*

A conversational event planner. Chat with an AI agent about the event you're
planning — it searches the web for real venues, you swipe through them
Tinder-style, approve one quote-request email, and the agent sends a
personalized copy to every venue you liked **from the shared Kalas outreach
mailbox**, then monitors the replies and extracts quotes automatically.
Every thread is tagged back to the owning user via a per-event plus address
(`mailbox+<tag>@domain`), so one mailbox serves all accounts.

## Stack

- **Next.js** (App Router, TypeScript, Tailwind) — frontend + API routes
- **Supabase** — Postgres, Auth (Google sign-in), Realtime
- **Gemini** (`gemini-2.5-flash`) — chat agent, Google Search grounding for
  venue discovery, structured extraction for venues & quotes
- **Gmail API** — sending quote requests, polling replies (one shared
  platform mailbox, OAuth via an internal Workspace app)
- **Netlify** — app hosting
- **Render** — cron job polling the mailbox every 5 minutes
  (`render.yaml` → `worker/poll.ts`)

## How it works

1. **Chat** — describe your event ("50th birthday in Copenhagen, 80 people").
   The agent saves details via function calling and asks for what's missing.
2. **Search** — the agent runs a grounded Google search through Gemini and
   turns the results into structured venue cards.
3. **Swipe** — Tinder-style deck: right = shortlist, left = pass.
4. **Draft** — the agent writes one master quote-request email with a
   `{{venue_name}}` placeholder; you review it in chat and approve.
5. **Send** — each liked venue gets a personalized copy sent from the
   platform mailbox with `Reply-To: mailbox+<event-tag>@domain` (missing
   contact emails are looked up on the fly).
6. **Quotes** — the Render worker polls the mailbox, matches replies by
   Gmail thread id (falling back to the plus-address tag, then to a
   uniquely-known sender; unattributable Kalas mail is labeled
   `kalas/unmatched` for triage), extracts price/availability with Gemini,
   and updates the dashboard live via Supabase Realtime.

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL migrations in `supabase/migrations/` in order
   (`0001_init.sql` … `0013_html_sites.sql`) in the SQL editor.
3. Note the project URL, anon key and service-role key (Settings → API).
4. Enable the **Google** auth provider (Authentication → Providers) using the
   OAuth client from step 2 below, and add your site URL(s) under
   Authentication → URL Configuration.

### 2. Google Cloud — two separate projects

**Sign-in project** (existing): backs Supabase Google login. Consent screen
External so anyone with a Google account can sign in. Its client's redirect
URI: `https://<project-ref>.supabase.co/auth/v1/callback`.

**Mailbox project** (for the shared outreach Gmail): must live in the Google
Workspace org that hosts the mailbox — for Kalas that is
`ava@kalas-weddings.com`, which is both the sending address and the account
that connects it (it is the one listed in `PLATFORM_ADMIN_EMAILS`).

1. Create the project, enable the **Gmail API**.
2. OAuth consent screen: User type **Internal** — no verification review,
   and refresh tokens are exempt from the 7-day testing-mode expiry.
   Runtime scopes: `gmail.modify`, `openid`, `email`.
3. Create an **OAuth 2.0 Client ID** (Web application) with redirect URIs:
   - `http://localhost:3000/api/admin/gmail/callback` (local)
   - `https://<your-app-url>/api/admin/gmail/callback` (prod)
4. Put this client's id/secret in `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
   and list mailbox admins in `PLATFORM_ADMIN_EMAILS`.

### 3. Gemini

Get an API key at [aistudio.google.com](https://aistudio.google.com).

### 4. Environment

```bash
cp .env.local.example .env.local
# fill in every value; generate TOKEN_ENCRYPTION_KEY with: openssl rand -hex 32
```

### 5. Run

```bash
npm install
npm run dev
```

Sign in with Google; an account listed in `PLATFORM_ADMIN_EMAILS` connects
the shared outreach mailbox in **Settings**, then everyone can start
planning.

### Deploy

**App — Netlify** (`netlify.toml`): set every env var from
`.env.local.example` on the site, with `GOOGLE_REDIRECT_URI` pointing at the
production `/api/admin/gmail/callback`.

**Reply polling — Render** (`render.yaml`): New → Blueprint → pick this
repo, fill in the six prompted secrets. The cron job runs
`worker/poll.ts` every 5 minutes; each run prints a JSON summary. Enable
failure notifications on the service. One pass locally:

```bash
npx tsx --env-file=.env worker/poll.ts
```

Manual trigger against the deployed app (subject to Netlify's function
timeout — the worker is authoritative):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/poll-replies
```
