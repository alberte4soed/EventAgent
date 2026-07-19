"use client";

/* Client shell for the public online invitation: locks to the couple's
   language, plays the envelope reveal, then renders the invitation card and its
   sections (countdown, photo, message, program) plus the guest RSVP form. All
   guest writes go to the service-role route /api/i/[slug]/rsvp. */

import { useEffect, useState } from "react";
import { LanguageProvider, useLang } from "@/kalas/i18n";
import { EnvelopeReveal } from "@/kalas/invite/EnvelopeReveal";
import { InviteCard, useInviteFonts, paletteById, fontById, DEFAULT_PROGRAM } from "@/kalas/invite/theme";
import type { InviteConfig } from "@/kalas/invite/config";
import type { AppLanguage } from "@/lib/db/types";

interface Props {
  slug: string;
  config: InviteConfig;
  names: string;
  dateISO: string;
  dateLabel: string;
  photoUrl: string | null;
  guestName: string | null;
  rsvpToken: string | null;
  lang: AppLanguage;
}

export function PublicInvite(props: Props) {
  return (
    <LanguageProvider initialLang={props.lang} lock>
      <div className="theme-kalas">
        <Invite {...props} />
      </div>
    </LanguageProvider>
  );
}

function Invite({ slug, config, names, dateISO, dateLabel, photoUrl, guestName, rsvpToken }: Props) {
  useInviteFonts();
  const pal = paletteById(config.paletteId);
  const font = fontById(config.fontId);
  const [rsvpOpen, setRsvpOpen] = useState(false);

  const greeting = guestName ? `Kære ${guestName}` : null;
  const program = config.program.length > 0 ? config.program : DEFAULT_PROGRAM;

  const content = (
    <>
      <main style={{ minHeight: "100vh", background: pal.bg, color: pal.ink, padding: "clamp(40px, 8vw, 80px) 20px" }}>
        <div style={{ maxWidth: 380, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>

          {/* The card */}
          <div style={{ width: "100%" }}>
            <InviteCard
              paletteId={config.paletteId}
              fontId={config.fontId}
              alignment={config.alignment}
              composition={config.composition}
              shape={config.shape}
              frame={config.frame}
              photoUrl={photoUrl}
              photoOnCard={config.photoOnCard}
              eyebrow={config.eyebrow}
              names={names}
              date={dateLabel}
              venue={config.venue}
              closing={config.closing}
            />
          </div>

          {/* Countdown */}
          {config.countdown && dateISO && <Countdown dateISO={dateISO} pal={pal} font={font} />}

          {/* Photo (below the card only when it isn't on the card face) */}
          {photoUrl && !config.photoOnCard && (
            <div style={{ width: "100%" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt="" style={{ width: "100%", borderRadius: 4, display: "block", boxShadow: "0 18px 44px -12px rgba(0,0,0,0.28)" }} />
            </div>
          )}

          {/* Message / our story */}
          {config.message && (
            <div style={{ textAlign: "center", maxWidth: 340 }}>
              <Divider pal={pal} />
              <p style={{ fontFamily: font.head, fontStyle: "italic", fontSize: 17, lineHeight: 1.6, color: pal.ink, opacity: 0.9, margin: "26px 0 0", whiteSpace: "pre-line" }}>
                {config.message}
              </p>
            </div>
          )}

          {/* Program */}
          {config.showProgram && (
            <div style={{ width: "100%", textAlign: "center" }}>
              <Divider pal={pal} />
              <p style={{ fontFamily: font.body, fontSize: 10, fontWeight: 500, letterSpacing: "0.32em", textTransform: "uppercase", color: pal.accent, margin: "26px 0 18px" }}>
                Program for dagen
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {program.map((p, i) => (
                  <div key={`${p.time}-${i}`} style={{ display: "flex", alignItems: "baseline", gap: 14, justifyContent: "center" }}>
                    <span style={{ fontFamily: font.body, fontSize: 11, letterSpacing: "0.1em", color: pal.ink, opacity: 0.5, width: 44, textAlign: "right" }}>{p.time}</span>
                    <span style={{ width: 3, height: 3, borderRadius: "50%", background: pal.accent, opacity: 0.6 }} />
                    <span style={{ fontFamily: font.head, fontSize: 16, color: pal.ink, width: 150, textAlign: "left" }}>{p.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RSVP */}
          {config.rsvpEnabled && (
            <div style={{ textAlign: "center", width: "100%" }}>
              <Divider pal={pal} />
              {config.rsvpDeadline && (
                <p style={{ fontFamily: font.body, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: pal.ink, opacity: 0.55, margin: "26px 0 14px" }}>
                  Svar senest {config.rsvpDeadline}
                </p>
              )}
              <button
                onClick={() => setRsvpOpen(true)}
                style={{
                  marginTop: config.rsvpDeadline ? 0 : 26,
                  fontFamily: font.body, fontSize: 13, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase",
                  color: pal.bg, background: pal.accent, border: "none", borderRadius: 999,
                  padding: "14px 34px", cursor: "pointer",
                }}
              >
                Svar på invitationen
              </button>
            </div>
          )}

          {!config.hideBranding && (
            <p style={{ fontFamily: font.body, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: pal.ink, opacity: 0.35, marginTop: 12 }}>
              Lavet med Kalas
            </p>
          )}
        </div>
      </main>

      {rsvpOpen && <RsvpModal slug={slug} config={config} token={rsvpToken} guestName={guestName} onClose={() => setRsvpOpen(false)} />}
    </>
  );

  if (!config.envelope.enabled) return content;

  return (
    <EnvelopeReveal
      paletteId={config.paletteId}
      fontId={config.fontId}
      monogram={config.envelope.monogram}
      note={config.envelope.note}
      names={names}
      greeting={greeting}
      persistKey={`inv-open-${slug}`}
    >
      {content}
    </EnvelopeReveal>
  );
}

function Divider({ pal }: { pal: { accent: string } }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
      <span style={{ width: 28, height: "0.5px", background: pal.accent, opacity: 0.5 }} />
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: pal.accent, opacity: 0.45 }} />
      <span style={{ width: 28, height: "0.5px", background: pal.accent, opacity: 0.5 }} />
    </div>
  );
}

type Pal = ReturnType<typeof paletteById>;
type Font = ReturnType<typeof fontById>;

function Countdown({ dateISO, pal, font }: { dateISO: string; pal: Pal; font: Font }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const target = new Date(`${dateISO}T12:00:00`).getTime();
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  const cells: [number, string][] = [[days, "dage"], [hours, "timer"], [mins, "min"], [secs, "sek"]];

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontFamily: font.body, fontSize: 10, fontWeight: 500, letterSpacing: "0.32em", textTransform: "uppercase", color: pal.accent, margin: "0 0 16px" }}>
        Nedtælling
      </p>
      <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
        {cells.map(([n, label]) => (
          <div key={label} style={{ minWidth: 48 }}>
            <div style={{ fontFamily: font.head, fontSize: 30, lineHeight: 1, color: pal.ink }}>{n}</div>
            <div style={{ fontFamily: font.body, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: pal.ink, opacity: 0.5, marginTop: 6 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── RSVP modal (mirrors the public site's RsvpModal) ─────────────────── */
function RsvpModal({ slug, config, token, guestName, onClose }: {
  slug: string; config: InviteConfig; token: string | null; guestName: string | null; onClose: () => void;
}) {
  const { t } = useLang();
  const [name, setName] = useState(guestName ?? "");
  const [email, setEmail] = useState("");
  const [attending, setAttending] = useState<boolean | null>(null);
  const [plusOne, setPlusOne] = useState(false);
  const [plusOneName, setPlusOneName] = useState("");
  const [meal, setMeal] = useState("");
  const [dietary, setDietary] = useState("");
  const [note, setNote] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | boolean>(null);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (attending === null || !name.trim()) return;
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/i/${slug}/rsvp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token, name: name.trim(), email: email.trim() || null, attending,
          plusOne: config.rsvpPlusOne ? plusOne : false, plusOneName: plusOneName.trim() || null,
          meal: config.rsvpMeal ? meal.trim() || null : null,
          dietary: config.rsvpDietary ? dietary.trim() || null : null,
          note: note.trim() || null, company,
        }),
      });
      if (!res.ok) { setError(t("Noget gik galt — prøv igen.")); return; }
      setDone(attending);
    } finally { setBusy(false); }
  };

  return (
    <Overlay onClose={onClose}>
      {done !== null ? (
        <div className="p-8 text-center">
          <p className="text-[2rem]">{done ? "🥂" : "💛"}</p>
          <h2 className="mt-3 font-serif text-[1.3rem] text-ink">{done ? t("Tak — vi ses!") : t("Tak for svaret")}</h2>
          <p className="mt-2 text-[0.88rem] text-ink-soft">
            {done ? t("Vi har noteret jeres deltagelse.") : t("Vi kommer til at savne jer.")}
          </p>
          <button onClick={onClose} className="mt-5 rounded-full bg-ink px-6 py-2.5 text-[0.82rem] font-medium text-canvas cursor-pointer">{t("Luk")}</button>
        </div>
      ) : (
        <form onSubmit={submit} className="max-h-[85vh] overflow-y-auto p-6 sm:p-8">
          <h2 className="font-serif text-[1.4rem] text-ink">{t("Svar på invitation")}</h2>
          {config.rsvpDeadline && <p className="mt-1 text-[0.8rem] text-muted">{t("Svar venligst inden {date}.", { date: config.rsvpDeadline })}</p>}

          <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

          <Field label={t("Navn")}>
            <input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
          </Field>
          <Field label={t("E-mail (valgfrit)")}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </Field>

          <div className="mt-4">
            <p className="mb-2 text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-muted">{t("Kommer I?")}</p>
            <div className="flex gap-2">
              <Choice active={attending === true} onClick={() => setAttending(true)}>{t("Ja, vi kommer 🎉")}</Choice>
              <Choice active={attending === false} onClick={() => setAttending(false)}>{t("Desværre ikke")}</Choice>
            </div>
          </div>

          {attending === true && (
            <>
              {config.rsvpPlusOne && (
                <div className="mt-4">
                  <label className="flex items-center gap-2 text-[0.9rem] text-ink cursor-pointer">
                    <input type="checkbox" checked={plusOne} onChange={(e) => setPlusOne(e.target.checked)} />
                    {t("Jeg tager en ledsager med")}
                  </label>
                  {plusOne && (
                    <input value={plusOneName} onChange={(e) => setPlusOneName(e.target.value)} placeholder={t("Ledsagers navn")} className={`${inputCls} mt-2`} />
                  )}
                </div>
              )}
              {config.rsvpMeal && (
                <Field label={t("Menuvalg (valgfrit)")}>
                  <input value={meal} onChange={(e) => setMeal(e.target.value)} placeholder={t("f.eks. kød, fisk, vegetar")} className={inputCls} />
                </Field>
              )}
              {config.rsvpDietary && (
                <Field label={t("Allergier / hensyn (valgfrit)")}>
                  <input value={dietary} onChange={(e) => setDietary(e.target.value)} className={inputCls} />
                </Field>
              )}
            </>
          )}

          <Field label={t("Besked til brudeparret (valgfrit)")}>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
          </Field>

          {error && <p className="mt-2 text-[0.8rem] text-[var(--color-terracotta)]">{error}</p>}
          <div className="mt-5 flex gap-2">
            <button type="submit" disabled={busy || attending === null || !name.trim()}
              className="flex-1 rounded-full bg-ink px-5 py-3 text-[0.82rem] font-medium text-canvas hover:bg-ink/90 transition-colors cursor-pointer disabled:opacity-50">
              {busy ? t("Sender…") : t("Send svar")}
            </button>
            <button type="button" onClick={onClose} className="rounded-full rule px-5 py-3 text-[0.82rem] text-ink-soft hover:bg-shell cursor-pointer">{t("Annuller")}</button>
          </div>
        </form>
      )}
    </Overlay>
  );
}

const inputCls = "mt-1.5 w-full rounded-xl rule bg-canvas px-4 py-2.5 text-[0.92rem] text-ink focus:border-ink focus:outline-none";

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-canvas shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-4 block">
      <span className="text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-muted">{label}</span>
      {children}
    </label>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex-1 rounded-xl border px-4 py-2.5 text-[0.88rem] transition-colors cursor-pointer ${
        active ? "border-ink bg-sage-tint text-ink font-medium" : "border-[var(--color-line-strong)] text-ink-soft hover:bg-shell"
      }`}>
      {children}
    </button>
  );
}
