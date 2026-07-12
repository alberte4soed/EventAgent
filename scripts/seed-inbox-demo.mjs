/**
 * One-off seed: inbox outreach demo for a user.
 * Usage: node scripts/seed-inbox-demo.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnv() {
  const raw = readFileSync(join(root, ".env"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const USER_ID = "1d65b9a8-6f30-404a-83fc-1d47332fad8a";
const EVENT_ID = "469f0a20-94e2-49af-8034-525e7ac59e03";

const DEMO_IDS = {
  draft: "a1000001-0000-4000-8000-000000000001",
  outbound: [
    "a1000002-0000-4000-8000-000000000001",
    "a1000003-0000-4000-8000-000000000002",
    "a1000004-0000-4000-8000-000000000003",
    "a1000005-0000-4000-8000-000000000004",
  ],
  replies: [
    "a1000010-0000-4000-8000-000000000001",
    "a1000011-0000-4000-8000-000000000002",
    "a1000012-0000-4000-8000-000000000003",
  ],
  proposal: "a1000020-0000-4000-8000-000000000001",
};

const VENUES = {
  brunow: "7abc6027-8e40-4432-89be-f10223279307",
  raffles: "6ab91b52-a90a-421b-8fd7-0674231ad7c9",
  malawies: "f15e8415-7a5f-48d9-822c-fdf17f47c40f",
  rozalin: "7369e396-9bda-4e0d-ba2a-cea6dfed667e",
};

async function wipeDemo() {
  await supabase.from("reply_proposals").delete().eq("id", DEMO_IDS.proposal);
  await supabase.from("email_replies").delete().in("id", DEMO_IDS.replies);
  await supabase.from("outbound_emails").delete().in("id", DEMO_IDS.outbound);
  await supabase.from("email_drafts").delete().eq("id", DEMO_IDS.draft);
}

async function main() {
  console.log("Wiping prior demo rows…");
  await wipeDemo();

  console.log("Updating venue emails…");
  const venueUpdates = [
    { id: VENUES.brunow, email: "bryllup@palacbrunow.pl" },
    { id: VENUES.raffles, email: "events@raffles.com" },
    { id: VENUES.malawies, email: "wesela@palacmalawies.pl" },
    { id: VENUES.rozalin, email: "kontakt@palacrozalin.pl" },
  ];
  for (const v of venueUpdates) {
    const { error } = await supabase
      .from("venues")
      .update({ email: v.email, swipe_status: "liked" })
      .eq("id", v.id);
    if (error) throw error;
  }

  console.log("Inserting draft…");
  const { error: draftErr } = await supabase.from("email_drafts").insert({
    id: DEMO_IDS.draft,
    event_id: EVENT_ID,
    user_id: USER_ID,
    subject: "Forespørgsel om bryllup — f & f",
    body_template:
      "Kære {{venue_name}},\n\nVi planlægger vores bryllup i Polen og er meget interesserede i jeres venue. Vi forventer ca. 80 gæster og leder efter en dato i sensommeren 2027.\n\nKunne I sende os information om kapacitet, priser og tilgængelighed?\n\nMed venlig hilsen\nf & f",
    status: "sent",
    version: 1,
    category: "venue",
  });
  if (draftErr) throw draftErr;

  console.log("Inserting outbound emails…");
  const { error: outErr } = await supabase.from("outbound_emails").insert([
    {
      id: DEMO_IDS.outbound[0],
      event_id: EVENT_ID,
      venue_id: VENUES.brunow,
      draft_id: DEMO_IDS.draft,
      user_id: USER_ID,
      to_email: "bryllup@palacbrunow.pl",
      subject: "Forespørgsel om bryllup — f & f",
      body: "Kære Pałac Brunów,\n\nVi planlægger vores bryllup i Polen og er meget interesserede i jeres venue. Vi forventer ca. 80 gæster og leder efter en dato i sensommeren 2027.\n\nKunne I sende os information om kapacitet, priser og tilgængelighed?\n\nMed venlig hilsen\nf & f",
      gmail_message_id: "seed-msg-brunow-001",
      gmail_thread_id: "seed-thread-brunow",
      status: "replied",
      sent_at: "2026-07-10T10:00:00+00:00",
      kind: "outreach",
    },
    {
      id: DEMO_IDS.outbound[1],
      event_id: EVENT_ID,
      venue_id: VENUES.raffles,
      draft_id: DEMO_IDS.draft,
      user_id: USER_ID,
      to_email: "events@raffles.com",
      subject: "Forespørgsel om bryllup — f & f",
      body: "Kære Raffles Europejski Warsaw,\n\nVi planlægger vores bryllup i Polen og er meget interesserede i jeres venue. Vi forventer ca. 80 gæster og leder efter en dato i sensommeren 2027.\n\nKunne I sende os information om kapacitet, priser og tilgængelighed?\n\nMed venlig hilsen\nf & f",
      gmail_message_id: "seed-msg-raffles-001",
      gmail_thread_id: "seed-thread-raffles",
      status: "sent",
      sent_at: "2026-07-11T14:30:00+00:00",
      kind: "outreach",
    },
    {
      id: DEMO_IDS.outbound[2],
      event_id: EVENT_ID,
      venue_id: VENUES.malawies,
      draft_id: DEMO_IDS.draft,
      user_id: USER_ID,
      to_email: "wesela@palacmalawies.pl",
      subject: "Forespørgsel om bryllup — f & f",
      body: "Kære Pałac Mała Wieś,\n\nVi planlægger vores bryllup i Polen og er meget interesserede i jeres venue. Vi forventer ca. 80 gæster og leder efter en dato i sensommeren 2027.\n\nKunne I sende os information om kapacitet, priser og tilgængelighed?\n\nMed venlig hilsen\nf & f",
      gmail_message_id: "seed-msg-malawies-001",
      gmail_thread_id: "seed-thread-malawies",
      status: "replied",
      sent_at: "2026-07-09T09:15:00+00:00",
      kind: "outreach",
    },
    {
      id: DEMO_IDS.outbound[3],
      event_id: EVENT_ID,
      venue_id: VENUES.rozalin,
      draft_id: DEMO_IDS.draft,
      user_id: USER_ID,
      to_email: "kontakt@palacrozalin.pl",
      subject: "Forespørgsel om bryllup — f & f",
      body: "Kære Pałac Rozalin,\n\nVi planlægger vores bryllup i Polen og er meget interesserede i jeres venue. Vi forventer ca. 80 gæster og leder efter en dato i sensommeren 2027.\n\nKunne I sende os information om kapacitet, priser og tilgængelighed?\n\nMed venlig hilsen\nf & f",
      gmail_message_id: "seed-msg-rozalin-001",
      gmail_thread_id: "seed-thread-rozalin",
      status: "replied",
      sent_at: "2026-07-08T11:00:00+00:00",
      kind: "outreach",
    },
  ]);
  if (outErr) throw outErr;

  console.log("Inserting replies…");
  const { error: repErr } = await supabase.from("email_replies").insert([
    {
      id: DEMO_IDS.replies[0],
      outbound_email_id: DEMO_IDS.outbound[0],
      venue_id: VENUES.brunow,
      event_id: EVENT_ID,
      user_id: USER_ID,
      gmail_message_id: "seed-reply-brunow-001",
      from_email: "bryllup@palacbrunow.pl",
      snippet: "Tak for jeres henvendelse — vi har ledige datoer i august 2027.",
      body: "Dzień dobry,\n\nDziękujemy za zainteresowanie Pałac Brunów. Mamy wolne terminy 14. i 21. sierpnia 2027 dla ok. 80 gości.\n\nPakiet weekendowy od 185 000 PLN obejmuje salę, noclegi dla 40 osób i podstawową dekorację. Możemy umówić wizytę w sobotę 19 lipca.\n\nPozdrawiamy serdecznie,\nAnna Kowalska\nKoordynator wesel",
      received_at: "2026-07-11T08:45:00+00:00",
      quote: {
        has_quote: true,
        price_amount: 185000,
        currency: "PLN",
        price_basis: "total",
        availability: "available",
        conditions: "Weekendpakke inkl. 40 overnatninger",
        summary:
          "Ledig 14. og 21. august 2027 — weekendpakke fra 185.000 PLN for ~80 gæster.",
      },
      quote_status: "quoted",
      read_at: null,
    },
    {
      id: DEMO_IDS.replies[1],
      outbound_email_id: DEMO_IDS.outbound[2],
      venue_id: VENUES.malawies,
      event_id: EVENT_ID,
      user_id: USER_ID,
      gmail_message_id: "seed-reply-malawies-001",
      from_email: "wesela@palacmalawies.pl",
      snippet: "Oferujemy pakiet weselny od 142 000 PLN.",
      body: "Szanowni Państwo,\n\nDziękujemy za wiadomość. Dla 80 gości proponujemy pakiet od 142 000 PLN (ceremonia w ogrodzie + przyjęcie w pałacu).\n\nW załączeniu przesyłamy menu degustacyjne. Prosimy o informację, czy preferujecie sobotę czy niedzielę.\n\nZ poważaniem,\nMarta Wiśniewska",
      received_at: "2026-07-10T16:20:00+00:00",
      quote: {
        has_quote: true,
        price_amount: 142000,
        currency: "PLN",
        price_basis: "total",
        availability: "unclear",
        conditions: "Ceremonia w ogrodzie + przyjęcie w pałacu",
        summary:
          "Pakiet od 142.000 PLN for 80 gæster — menu vedlagt, afventer foretrukken dag.",
      },
      quote_status: "needs_info",
      read_at: "2026-07-11T09:00:00+00:00",
    },
    {
      id: DEMO_IDS.replies[2],
      outbound_email_id: DEMO_IDS.outbound[3],
      venue_id: VENUES.rozalin,
      event_id: EVENT_ID,
      user_id: USER_ID,
      gmail_message_id: "seed-reply-rozalin-001",
      from_email: "kontakt@palacrozalin.pl",
      snippet: "Niestety wybrany termin jest już zarezerwowany.",
      body: "Dzień dobry,\n\nDziękujemy za zapytanie. Niestety w sierpniu 2027 mamy już pełne obłożenie. Możemy zaproponować czerwiec 2027 lub wrzesień 2028.\n\nGdyby te terminy były interesujące, chętnie prześlemy wstępną wycenę.\n\nPozdrawiamy,\nZespół Pałac Rozalin",
      received_at: "2026-07-09T13:10:00+00:00",
      quote: {
        has_quote: false,
        price_amount: null,
        currency: null,
        price_basis: null,
        availability: "unavailable",
        conditions: "Alternativ: juni 2027 eller september 2028",
        summary:
          "August 2027 er optaget — tilbyder juni 2027 eller september 2028.",
      },
      quote_status: "no_availability",
      read_at: "2026-07-09T14:00:00+00:00",
    },
  ]);
  if (repErr) throw repErr;

  console.log("Inserting proposal…");
  const { error: propErr } = await supabase.from("reply_proposals").insert({
    id: DEMO_IDS.proposal,
    email_reply_id: DEMO_IDS.replies[0],
    outbound_email_id: DEMO_IDS.outbound[0],
    venue_id: VENUES.brunow,
    event_id: EVENT_ID,
    user_id: USER_ID,
    body: "Dzień dobry pani Anno,\n\nBardzo dziękujemy za szybką odpowiedź i propozycję terminów. 21 sierpnia 2027 brzmi idealnie dla nas.\n\nCzy moglibyśmy umówić wizytę na 19 lipca? Chcielibyśmy też doprecyzować, co dokładnie obejmuje pakiet weekendowy (catering, bar, koordynator).\n\nZ poważaniem,\nAva, w imieniu f & f",
    status: "proposed",
  });
  if (propErr) throw propErr;

  console.log("Updating event status…");
  const { error: evErr } = await supabase
    .from("events")
    .update({ status: "awaiting_replies" })
    .eq("id", EVENT_ID);
  if (evErr) throw evErr;

  const { count } = await supabase
    .from("outbound_emails")
    .select("*", { count: "exact", head: true })
    .eq("user_id", USER_ID);

  console.log(`Done. User now has ${count} outbound email(s). Open Inbox → Samtaler.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
