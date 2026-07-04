"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChipButton, ChipGroup } from "@/components/ui/Chip";
import {
  BUDGET_BANDS,
  GUEST_BANDS,
  VIBES,
  seasonChips,
  weddingTitle,
  type OnboardingDate,
} from "@/lib/onboarding";

interface Props {
  initialName: string;
}

const TOTAL_STEPS = 7;

export function OnboardingFlow({ initialName }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initialName);
  const [partner, setPartner] = useState("");
  const [city, setCity] = useState("");
  const [dateChoice, setDateChoice] = useState<string | null>(null); // chip key | "exact" | "undecided"
  const [exactDate, setExactDate] = useState("");
  const [guestBand, setGuestBand] = useState<string | null>(null);
  const [budgetBand, setBudgetBand] = useState<string | null>(null);
  const [customBudget, setCustomBudget] = useState("");
  const [budgetOther, setBudgetOther] = useState(false);
  const [vibes, setVibes] = useState<string[]>([]);
  const [customVibe, setCustomVibe] = useState("");
  const [vibeOther, setVibeOther] = useState(false);

  const dateOptions = useMemo(() => seasonChips(8), []);

  function go(next: number) {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  const canAdvance =
    (step === 0 && name.trim().length > 0) ||
    (step === 1 && city.trim().length > 0) ||
    (step === 2 && (dateChoice === "exact" ? exactDate.length > 0 : dateChoice !== null)) ||
    (step === 3 && guestBand !== null) ||
    step === 4 ||
    step === 5 ||
    step === 6;

  function buildDate(): OnboardingDate {
    if (dateChoice === "exact" && exactDate) {
      return { precision: "exact", iso: exactDate };
    }
    const chip = dateOptions.find((c) => c.key === dateChoice);
    if (chip) return { precision: "season", hint: chip.label };
    return { precision: "undecided" };
  }

  function buildBudget(): string | null {
    if (budgetOther && customBudget.trim()) return customBudget.trim();
    const band = BUDGET_BANDS.find((b) => b.key === budgetBand);
    if (!band || band.key === "private") return null;
    return band.label;
  }

  function buildVibes(): string[] {
    const picked: string[] = vibes
      .map((k) => VIBES.find((v) => v.key === k)?.label as string | undefined)
      .filter((v): v is string => Boolean(v));
    if (vibeOther && customVibe.trim()) picked.push(customVibe.trim());
    return picked;
  }

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          partner_name: partner.trim() || null,
          city: city.trim(),
          date: buildDate(),
          guest_band: guestBand,
          budget: buildBudget(),
          vibes: buildVibes(),
        }),
      });
      if (!res.ok) throw new Error("Could not finish setup");
      router.push("/home");
      router.refresh();
    } catch {
      setError("Something went wrong — try again.");
      setSaving(false);
    }
  }

  // Summary line for the final step.
  const summary = [
    weddingTitle(name, partner).replace(/'s wedding$/, "").replace(/ wedding$/, ""),
    city.trim(),
    dateChoice === "exact" && exactDate
      ? new Date(exactDate).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : dateOptions.find((c) => c.key === dateChoice)?.label,
    GUEST_BANDS.find((b) => b.key === guestBand)?.count
      ? `~${GUEST_BANDS.find((b) => b.key === guestBand)!.count} guests`
      : null,
    buildVibes()[0]?.toLowerCase(),
  ]
    .filter(Boolean)
    .join(" · ");

  const skippable = step === 4 || step === 5;
  const firstName = name.split(" ")[0] || "there";

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
                title="Who's getting married?"
                subtitle="So Ava can greet you like a friend, not a spreadsheet."
              >
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canAdvance && go(1)}
                  placeholder="Your name"
                  className="w-full rounded-2xl border border-[#D4D6C0] bg-[#F6F0E8] px-5 py-4 text-lg outline-none transition focus:border-[#4A4E3C]"
                />
                <input
                  value={partner}
                  onChange={(e) => setPartner(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canAdvance && go(1)}
                  placeholder="Your partner's name (optional)"
                  className="mt-3 w-full rounded-2xl border border-[#D4D6C0] bg-[#F6F0E8] px-5 py-4 text-lg outline-none transition focus:border-[#4A4E3C]"
                />
              </Step>
            )}

            {step === 1 && (
              <Step
                eyebrow={`Hi ${firstName} 👋`}
                title="Where's the wedding?"
                subtitle="A city, a region, or 'not sure between Copenhagen and Aarhus' — all fine. Everything local starts from here."
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
                eyebrow="No pressure"
                title="When are you thinking?"
                subtitle="A season is plenty to work with — you can lock the date later."
              >
                <div className="flex flex-wrap gap-2.5">
                  {dateOptions.map((c) => (
                    <ChipButton
                      key={c.key}
                      label={c.label}
                      selected={dateChoice === c.key}
                      onClick={() => setDateChoice(dateChoice === c.key ? null : c.key)}
                    />
                  ))}
                  <ChipButton
                    label="We have an exact date"
                    emoji="📅"
                    selected={dateChoice === "exact"}
                    onClick={() => setDateChoice(dateChoice === "exact" ? null : "exact")}
                  />
                  <ChipButton
                    label="No idea yet"
                    emoji="🤷"
                    selected={dateChoice === "undecided"}
                    onClick={() =>
                      setDateChoice(dateChoice === "undecided" ? null : "undecided")
                    }
                  />
                </div>
                {dateChoice === "exact" && (
                  <motion.input
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    type="date"
                    value={exactDate}
                    onChange={(e) => setExactDate(e.target.value)}
                    className="mt-4 w-full rounded-2xl border border-[#D4D6C0] bg-[#F6F0E8] px-5 py-4 text-lg outline-none transition focus:border-[#4A4E3C]"
                  />
                )}
              </Step>
            )}

            {step === 3 && (
              <Step
                eyebrow="Roughly is fine"
                title="How many guests?"
                subtitle="This shapes which venues fit — a rough band is all Ava needs."
              >
                <ChipGroup
                  options={GUEST_BANDS}
                  value={guestBand ? [guestBand] : []}
                  onChange={(keys) => setGuestBand(keys[0] ?? null)}
                  mode="single"
                />
              </Step>
            )}

            {step === 4 && (
              <Step
                eyebrow="Optional"
                title="A budget in mind?"
                subtitle="Helps Ava steer venue and vendor suggestions. Skip if you'd rather not."
              >
                <div className="flex flex-wrap gap-2.5">
                  {BUDGET_BANDS.map((b) => (
                    <ChipButton
                      key={b.key}
                      label={b.label}
                      emoji={b.emoji}
                      selected={!budgetOther && budgetBand === b.key}
                      onClick={() => {
                        setBudgetOther(false);
                        setBudgetBand(budgetBand === b.key ? null : b.key);
                      }}
                    />
                  ))}
                  <ChipButton
                    label="Other — type it"
                    emoji="✏️"
                    selected={budgetOther}
                    onClick={() => {
                      setBudgetOther(!budgetOther);
                      setBudgetBand(null);
                    }}
                  />
                </div>
                {budgetOther && (
                  <motion.input
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    autoFocus
                    value={customBudget}
                    onChange={(e) => setCustomBudget(e.target.value)}
                    placeholder="e.g. around 150k DKK all-in"
                    className="mt-4 w-full rounded-2xl border border-[#D4D6C0] bg-[#F6F0E8] px-5 py-4 text-lg outline-none transition focus:border-[#4A4E3C]"
                  />
                )}
              </Step>
            )}

            {step === 5 && (
              <Step
                eyebrow="The fun part"
                title="What's the vibe?"
                subtitle="Pick as many as feel right — Ava uses these to find venues that actually match."
              >
                <div className="flex flex-wrap gap-2.5">
                  {VIBES.map((v) => (
                    <ChipButton
                      key={v.key}
                      label={v.label}
                      emoji={v.emoji}
                      selected={vibes.includes(v.key)}
                      onClick={() =>
                        setVibes((cur) =>
                          cur.includes(v.key)
                            ? cur.filter((k) => k !== v.key)
                            : [...cur, v.key]
                        )
                      }
                    />
                  ))}
                  <ChipButton
                    label="Something else…"
                    emoji="✏️"
                    selected={vibeOther}
                    onClick={() => setVibeOther(!vibeOther)}
                  />
                </div>
                {vibeOther && (
                  <motion.input
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    autoFocus
                    value={customVibe}
                    onChange={(e) => setCustomVibe(e.target.value)}
                    placeholder="Describe it in a few words"
                    className="mt-4 w-full rounded-2xl border border-[#D4D6C0] bg-[#F6F0E8] px-5 py-4 text-lg outline-none transition focus:border-[#4A4E3C]"
                  />
                )}
              </Step>
            )}

            {step === 6 && (
              <Step
                eyebrow="You're set"
                title="Here's what Ava knows"
                subtitle="First stop: the venue. Everything local — flowers, music, catering — depends on where you say 'I do'."
              >
                <div className="rounded-2xl border border-[#D4D6C0] bg-[#F6F0E8] p-6 shadow-[0px_4px_20px_rgba(74,78,60,0.05)]">
                  <p className="font-[family-name:var(--font-fraunces)] text-xl font-semibold tracking-[-0.4px] text-[#4A4E3C]">
                    {weddingTitle(name, partner)}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#7A8066]">
                    {summary || "We'll fill in the details together."}
                  </p>
                  {buildVibes().length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {buildVibes().map((v) => (
                        <span
                          key={v}
                          className="flex h-7 items-center rounded-full border border-[#D4D6C0] bg-[#ddd6c0] px-3 text-xs font-medium text-[#656952]"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {error && <p className="mt-3 text-sm text-[#a8483a]">{error}</p>}
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

          <div className="flex items-center gap-3">
            {skippable && (
              <button
                type="button"
                onClick={() => go(step + 1)}
                className="rounded-full px-4 py-2 text-sm text-[#7A8066] transition hover:text-[#4A4E3C]"
              >
                Skip for now
              </button>
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
                {saving ? "Setting up…" : "Start with the venue →"}
              </button>
            )}
          </div>
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
