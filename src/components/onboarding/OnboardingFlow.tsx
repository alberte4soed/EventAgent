"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EVENT_TEMPLATES } from "@/lib/db/profile";

interface Props {
  initialName: string;
  gmailConnected: boolean;
}

const ACCENTS = ["🎉", "🎂", "💍", "🥂", "🌿", "🍸", "✨", "🎈"];
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
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#f4f1e8] text-[#3d2b23]">
      {/* soft washes */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-[#f0e4dd] blur-[120px]" />
        <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-[#f3ecd6] blur-[120px]" />
      </div>

      <header className="mx-auto flex w-full max-w-xl items-center justify-between px-6 py-6">
        <span className="font-[family-name:var(--font-fraunces)] text-[22px] font-semibold tracking-[-0.55px] text-[#ac5239]">
          kalas
        </span>
        <span className="text-xs font-medium text-[#9a8a77]">
          Step {step + 1} of {TOTAL_STEPS}
        </span>
      </header>

      {/* progress bar */}
      <div className="mx-auto w-full max-w-xl px-6">
        <div className="h-1.5 overflow-hidden rounded-full bg-[#e5e0cf]">
          <motion.div
            className="h-full rounded-full bg-[#ac5239]"
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
                subtitle="So Kalas can greet you like a friend, not a form."
              >
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canAdvance && go(1)}
                  placeholder="Your name"
                  className="w-full rounded-2xl border border-[#dfd9c6] bg-[#fdfbf4] px-5 py-4 text-lg outline-none transition focus:border-[#ac5239]"
                />
              </Step>
            )}

            {step === 1 && (
              <Step
                eyebrow={`Hi ${name.split(" ")[0] || "there"} 👋`}
                title="Where do you usually celebrate?"
                subtitle="Your home city helps Kalas find venues nearby first."
              >
                <input
                  autoFocus
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canAdvance && go(2)}
                  placeholder="e.g. Copenhagen"
                  className="w-full rounded-2xl border border-[#dfd9c6] bg-[#fdfbf4] px-5 py-4 text-lg outline-none transition focus:border-[#ac5239]"
                />
              </Step>
            )}

            {step === 2 && (
              <Step
                eyebrow="Good to know"
                title="What do you love to throw?"
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
                            ? "border-[#ac5239] bg-[#f0e4dd] text-[#ac5239]"
                            : "border-[#dfd9c6] bg-[#fdfbf4] text-[#5c4a3d] hover:border-[#cfc8b2]"
                        }`}
                      >
                        <span>{t.emoji}</span> {t.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8">
                  <p className="mb-3 text-sm font-medium text-[#7a6b5c]">
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
                            ? "border-[#ac5239] bg-[#f0e4dd] scale-105"
                            : "border-[#dfd9c6] bg-[#fdfbf4] hover:border-[#cfc8b2]"
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
                subtitle="Kalas emails venues for quotes and reads the replies — all from your own inbox. You can also do this later in Settings."
              >
                <div className="rounded-2xl border border-[#dfd9c6] bg-[#fdfbf4] p-5">
                  {gmailConnected ? (
                    <div className="flex items-center gap-2 text-sm font-medium text-[#3d2b23]">
                      <span className="h-2 w-2 rounded-full bg-[#ac5239]" />
                      Gmail connected — you&apos;re all set.
                    </div>
                  ) : (
                    <>
                      <a
                        href="/api/gmail/connect"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ac5239] px-4 py-3 text-sm font-medium text-[#f8f4e9] shadow-[0px_3px_10px_rgba(172,82,57,0.3)] transition hover:bg-[#96462f]"
                      >
                        Connect Gmail
                      </a>
                      <p className="mt-3 text-center text-xs text-[#9a8a77]">
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
              className="rounded-full px-4 py-2 text-sm text-[#7a6b5c] transition hover:text-[#3d2b23]"
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
              className="rounded-full bg-[#ac5239] px-7 py-3 text-sm font-medium text-[#f8f4e9] shadow-[0px_3px_10px_rgba(172,82,57,0.3)] transition hover:bg-[#96462f] disabled:opacity-40"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={finish}
              className="rounded-full bg-[#ac5239] px-7 py-3 text-sm font-medium text-[#f8f4e9] shadow-[0px_3px_10px_rgba(172,82,57,0.3)] transition hover:bg-[#96462f] disabled:opacity-50"
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
      <p className="text-[11px] font-medium uppercase tracking-[1.5px] text-[#ac5239]">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-fraunces)] text-3xl font-semibold tracking-[-0.7px] text-[#3d2b23] sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[#7a6b5c]">{subtitle}</p>
      <div className="mt-7">{children}</div>
    </div>
  );
}
