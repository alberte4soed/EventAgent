# Kalas 🎉

*From Swedish "kalas" — a celebration.*

A conversational event planner. Chat with an AI agent about the event you're
planning — it searches the web for real venues, you swipe through them
Tinder-style, approve one quote-request email, and the agent sends a
personalized copy to every venue you liked **from your own Gmail**, then
monitors the replies and extracts quotes automatically.

## Stack

- **Next.js** (App Router, TypeScript, Tailwind) — frontend + API routes
- **Supabase** — Postgres, Auth (Google sign-in), Realtime
- **Gemini** (`gemini-2.5-flash`) — chat agent, Google Search grounding for
  venue discovery, structured extraction for venues & quotes
- **Gmail API** — sending quote requests, polling replies
- **Vercel** — hosting + cron (reply polling every 5 minutes)

## How it works

1. **Chat** — describe your event ("50th birthday in Copenhagen, 80 people").
   The agent saves details via function calling and asks for what's missing.
2. **Search** — the agent runs a grounded Google search through Gemini and
   turns the results into structured venue cards.
3. **Swipe** — Tinder-style deck: right = shortlist, left = pass.
4. **Draft** — the agent writes one master quote-request email with a
   `{{venue_name}}` placeholder; you review it in chat and approve.
5. **Send** — each liked venue gets a personalized copy sent through your
   Gmail (missing contact emails are looked up on the fly).
6. **Quotes** — a cron job polls your inbox, matches replies by Gmail thread
   id, extracts price/availability with Gemini, and updates the dashboard
   live via Supabase Realtime.

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL migrations in `supabase/migrations/` in order
   (`0001_init.sql`, then `0002_profiles.sql`) in the SQL editor.
3. Note the project URL, anon key and service-role key (Settings → API).
4. Enable the **Google** auth provider (Authentication → Providers) using the
   OAuth client from step 2 below, and add your site URL(s) under
   Authentication → URL Configuration.

### 2. Google Cloud

1. Create a project at [console.cloud.google.com](https://console.cloud.google.com)
   and enable the **Gmail API**.
2. OAuth consent screen: External, **Testing** mode (add yourself as a test
   user); scopes: `gmail.send`, `gmail.readonly`, `openid`, `email`, `profile`.
3. Create an **OAuth 2.0 Client ID** (Web application) with redirect URIs:
   - `https://<project-ref>.supabase.co/auth/v1/callback` (app login)
   - `http://localhost:3000/api/gmail/callback` (Gmail connect, dev)
   - `https://<your-domain>/api/gmail/callback` (Gmail connect, prod)

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

Sign in with Google, connect Gmail in **Settings**, then start planning.

### Deploy

Push to Vercel with all env vars set (plus `CRON_SECRET`); `vercel.json`
schedules reply polling every 5 minutes. To poll manually:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/poll-replies
```
