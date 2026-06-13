"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EVENT_TEMPLATES } from "@/lib/db/profile";

interface Props {
  initialName: string;
  gmailConnected: boolean;
}

const ACCENTS = ["💍", "💐", "🥂", "✨", "🕊️", "🌿", "💌", "🎊"];
const TOTAL_STEPS = 4;

export function OnboardingFlow({ initialName, gmailConnected }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(initialName);
  const [city, setCity] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [accent, setAccent] = useState("🎉");

  function go(next: number) {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  function toggleInterest(key: string) {
    setInterests((cur) =>
      cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]
    );
  }

  async function finish() {
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: name,
          home_city: city,
          event_interests: interests,
          accent,
          onboarded: true,
        }),
      });
      router.push("/home");
      router.refresh();
    } catch {
      setSaving(false);
    }
  }

  const canAdvance =
    (step === 0 && name.trim().length > 0) ||
    (step === 1 && city.trim().length > 0) ||
    step === 2 ||
    step === 3;

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#F6F0E8] text-[#4A4E3C]">
      {/* soft washes */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-[#c2b280] blur-[120px]" />
        <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-[#ddd6c0] blur-[120px]" />
      </div>

      <header className="mx-auto flex w-full max-w-xl items-center justify-between px-6 py-6">
        <span className="font-[family-name:var(--font-fraunces)] text-[22px] font-semibold tracking-[-0.55px] text-[#4A4E3C]">
          kalas
        </span>
        <span className="text-xs font-medium text-[#8a8568]">
          Step {step + 1} of {TOTAL_STEPS}
        </span>
      </header>

      {/* progress bar */}
      <div className="mx-auto w-full max-w-xl px-6">
        <div className="h-1.5 overflow-hidden rounded-full bg-[#D4D6C0]">
          <motion.div
            className="h-full rounded-full bg-[#4A4E3C]"
            animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.5 }}
          />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 pb-16">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 0 && (
              <Step
                eyebrow="Welcome to Kalas"
                title="First — what should we call you?"
                subtitle="So Kalas can greet you like a friend, not a spreadsheet."
              >
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canAdvance && go(1)}
                  placeholder="Your name"
                  className="w-full rounded-2xl border border-[#D4D6C0] bg-[#F6F0E8] px-5 py-4 text-lg outline-none transition focus:border-[#4A4E3C]"
                />
              </Step>
            )}

            {step === 1 && (
              <Step
                eyebrow={`Hi ${name.split(" ")[0] || "there"} 👋`}
                title="Where are you getting married?"
                subtitle="Your wedding city helps Kalas find venues nearby first."
              >
                <input
                  autoFocus
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canAdvance && go(2)}
                  placeholder="e.g. Copenhagen"
                  className="w-full rounded-2xl border border-[#D4D6C0] bg-[#F6F0E8] px-5 py-4 text-lg outline-none transition focus:border-[#4A4E3C]"
                />
              </Step>
            )}

            {step === 2 && (
              <Step
                eyebrow="Good to know"
                title="What are you planning?"
                subtitle="Pick a few — we'll keep your favourites one tap away. Optional."
              >
                <div className="flex flex-wrap gap-2.5">
                  {EVENT_TEMPLATES.map((t) => {
                    const on = interests.includes(t.key);
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => toggleInterest(t.key)}
                        className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                          on
                            ? "border-[#4A4E3C] bg-[#c2b280] text-[#4A4E3C]"
                            : "border-[#D4D6C0] bg-[#F6F0E8] text-[#656952] hover:border-[#C4C8AE]"
                        }`}
                      >
                        <span>{t.emoji}</span> {t.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8">
                  <p className="mb-3 text-sm font-medium text-[#7A8066]">
                    Pick a vibe for your account
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ACCENTS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAccent(a)}
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-xl transition ${
                          accent === a
                            ? "border-[#4A4E3C] bg-[#c2b280] scale-105"
                            : "border-[#D4D6C0] bg-[#F6F0E8] hover:border-[#C4C8AE]"
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </Step>
            )}

            {step === 3 && (
              <Step
                eyebrow="Last thing"
                title="Connect Gmail to send for you"
                subtitle="Kalas emails wedding venues for quotes and reads the replies — all from your own inbox. You can also do this later in Settings."
              >
                <div className="rounded-2xl border border-[#D4D6C0] bg-[#F6F0E8] p-5">
                  {gmailConnected ? (
                    <div className="flex items-center gap-2 text-sm font-medium text-[#4A4E3C]">
                      <span className="h-2 w-2 rounded-full bg-[#4A4E3C]" />
                      Gmail connected — you&apos;re all set.
                    </div>
                  ) : (
                    <>
                      <a
                        href="/api/gmail/connect"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4A4E3C] px-4 py-3 text-sm font-medium text-[#F6F0E8] shadow-[0px_3px_10px_rgba(74,78,60,0.3)] transition hover:bg-[#575B47]"
                      >
                        Connect Gmail
                      </a>
                      <p className="mt-3 text-center text-xs text-[#8a8568]">
                        Send &amp; read scopes only. You stay in control of every email.
                      </p>
                    </>
                  )}
                </div>
              </Step>
            )}
          </motion.div>
        </AnimatePresence>

        {/* nav */}
        <div className="mt-10 flex items-center justify-between">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => go(step - 1)}
              className="rounded-full px-4 py-2 text-sm text-[#7A8066] transition hover:text-[#4A4E3C]"
            >
              ← Back
            </button>
          ) : (
            <span />
          )}

          {step < TOTAL_STEPS - 1 ? (
            <button
              type="button"
              disabled={!canAdvance}
              onClick={() => go(step + 1)}
              className="rounded-full bg-[#4A4E3C] px-7 py-3 text-sm font-medium text-[#F6F0E8] shadow-[0px_3px_10px_rgba(74,78,60,0.3)] transition hover:bg-[#575B47] disabled:opacity-40"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={finish}
              className="rounded-full bg-[#4A4E3C] px-7 py-3 text-sm font-medium text-[#F6F0E8] shadow-[0px_3px_10px_rgba(74,78,60,0.3)] transition hover:bg-[#575B47] disabled:opacity-50"
            >
              {saving ? "Setting up…" : "Enter Kalas →"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function Step({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[1.5px] text-[#4A4E3C]">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-fraunces)] text-3xl font-semibold tracking-[-0.7px] text-[#4A4E3C] sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[#7A8066]">{subtitle}</p>
      <div className="mt-7">{children}</div>
    </div>
  );
}
