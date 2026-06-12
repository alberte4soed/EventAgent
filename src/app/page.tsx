import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const steps = [
  {
    number: "01",
    title: "Tell",
    description:
      "Describe your event in a sentence. A 50th birthday in Copenhagen, a wedding by the fjord — the agent asks only what it needs.",
  },
  {
    number: "02",
    title: "Choose",
    description:
      "Real venues, found on the open web, dealt to you as cards. Swipe right to shortlist, left to pass.",
  },
  {
    number: "03",
    title: "Receive",
    description:
      "One approved email, sent from your own Gmail to every venue you liked. Replies return as tidy, comparable quotes.",
  },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/events");

  return (
    <main className="flex flex-1 flex-col bg-[#faf9f6] text-stone-900">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold tracking-tight">kalas</span>
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm text-stone-600 transition hover:text-stone-900"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 transition hover:bg-stone-700"
          >
            Sign up
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-24 pt-20 sm:pt-28">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#7c8a76]">
          Your event-planning agent
        </p>
        <h1 className="mt-5 max-w-2xl text-5xl font-medium leading-[1.08] tracking-tight sm:text-6xl">
          Celebrate more.
          <br />
          <span className="text-stone-400">Coordinate less.</span>
        </h1>
        <p className="mt-7 max-w-xl text-lg leading-relaxed text-stone-500">
          Kalas finds venues for your event, you swipe through them, and it
          requests quotes by email on your behalf — then gathers the replies
          into one calm overview. <em>Kalas</em> — Swedish for a celebration.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/login"
            className="rounded-full bg-stone-900 px-7 py-3.5 text-sm font-medium text-stone-50 transition hover:bg-stone-700"
          >
            Start planning — it&apos;s free
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-stone-300 px-7 py-3.5 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-100"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Steps */}
      <section className="border-t border-stone-200 bg-white">
        <div className="mx-auto grid w-full max-w-5xl gap-12 px-6 py-20 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number}>
              <p className="text-xs font-medium tracking-[0.25em] text-[#7c8a76]">
                {step.number}
              </p>
              <h2 className="mt-3 text-xl font-medium tracking-tight">
                {step.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-stone-500">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Quiet proof strip */}
      <section className="border-t border-stone-200 bg-[#faf9f6]">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-6 px-6 py-16 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-base leading-relaxed text-stone-600">
            Birthdays, weddings, dinners for eighty. One conversation, every
            quote in writing.
          </p>
          <Link
            href="/login"
            className="rounded-full bg-[#7c8a76] px-7 py-3.5 text-sm font-medium text-white transition hover:bg-[#6a7765]"
          >
            Plan your first event
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-8 text-xs text-stone-400">
          <span className="font-medium tracking-tight text-stone-500">kalas</span>
          <span>Designed with ro · © {new Date().getFullYear()}</span>
        </div>
      </footer>
    </main>
  );
}
