'use client';

/* Invitation editor — per-template fields on one side, a live phone preview
   that updates on every keystroke on the other. "Make it perfect with AI"
   returns 2–3 template-voiced variants; save publishes a shareable /i/<slug>. */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Check, Copy, ArrowLeft } from 'lucide-react';
import { PhoneFrame } from './PhoneFrame';
import { useInvitationFonts } from './fonts';
import { deriveMonogram, phraseDate } from './data';
import type { InvitationData, Language, Template } from './types';
import { useLang } from '../i18n';

function isoToDateInput(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

export function Editor({
  template,
  initialData,
  invitationId,
  onBack,
  onSave,
}: {
  template: Template;
  initialData: InvitationData;
  invitationId?: string;
  onBack: () => void;
  onSave: (input: { id?: string; templateId: string; data: Record<string, unknown>; publish?: boolean }) => Promise<{ slug: string | null } | null>;
}) {
  useInvitationFonts();
  const { t } = useLang();
  const { Component, fields } = template;

  const [data, setData] = useState<InvitationData>(initialData);
  const [introText, setIntroText] = useState(initialData.introLines.join('\n'));
  const [variants, setVariants] = useState<InvitationData[] | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState('');
  const [saving, setSaving] = useState(false);
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const da = data.language === 'da';
  const has = (f: string) => fields.includes(f as never);
  const showTime = has('time') || template.interactive === 'countdown';

  // Keep introLines derived from the free-text editor (blank lines dropped).
  const liveData: InvitationData = useMemo(
    () => ({ ...data, introLines: introText.split('\n').map((l) => l.trim()).filter(Boolean) }),
    [data, introText]
  );

  function set<K extends keyof InvitationData>(key: K, value: InvitationData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function setName(which: 'partnerA' | 'partnerB', value: string) {
    setData((d) => {
      const next = { ...d, [which]: value };
      if (template.monogram) next.monogram = deriveMonogram(next.partnerA, next.partnerB);
      return next;
    });
  }

  function setDate(dateStr: string) {
    setData((d) => {
      const time = d.isoDate.slice(10) || 'T15:00:00';
      const iso = dateStr ? `${dateStr}${time}` : d.isoDate;
      return { ...d, isoDate: iso, displayDate: phraseDate(iso, template.dateStyle, d.language) };
    });
  }

  function setLanguage(lang: Language) {
    setData((d) => ({ ...d, language: lang, displayDate: phraseDate(d.isoDate, template.dateStyle, lang) }));
  }

  async function runAi() {
    setAiBusy(true);
    setAiError('');
    try {
      const res = await fetch('/api/invitations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          partnerA: data.partnerA,
          partnerB: data.partnerB,
          isoDate: data.isoDate,
          venue: data.venue,
          venueDetail: data.venueDetail,
          language: data.language,
        }),
      });
      const json = (await res.json()) as { variants?: InvitationData[] };
      if (res.ok && json.variants?.length) setVariants(json.variants);
      else setAiError(da ? 'AI kunne ikke svare — prøv igen.' : 'AI could not respond — try again.');
    } catch {
      setAiError(da ? 'AI kunne ikke svare — prøv igen.' : 'AI could not respond — try again.');
    } finally {
      setAiBusy(false);
    }
  }

  function chooseVariant(v: InvitationData) {
    setData(v);
    setIntroText(v.introLines.join('\n'));
    setVariants(null);
  }

  async function save() {
    setSaving(true);
    try {
      const row = await onSave({ id: invitationId, templateId: template.id, data: { ...liveData }, publish: true });
      if (row?.slug) setShareSlug(row.slug);
    } finally {
      setSaving(false);
    }
  }

  const shareUrl = shareSlug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/i/${shareSlug}` : '';
  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[1fr_420px] lg:min-h-full">

      {/* ── Form ─────────────────────────────────────────────────────── */}
      <div className="order-2 px-6 py-8 sm:px-9 lg:order-1 lg:px-12">
        <button onClick={onBack} className="mb-5 flex items-center gap-2 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink cursor-pointer">
          <ArrowLeft size={13} /> {t('Alle invitationer')}
        </button>
        <h1 className="display text-[clamp(1.7rem,3vw,2.3rem)] leading-tight text-ink">{template.name}<span className="italic">.</span></h1>
        <p className="mt-2 max-w-sm text-[0.85rem] leading-relaxed text-muted">
          {t('Tast jeres detaljer — kortet opdateres live. Lad AI finpudse ordlyden i skabelonens stil.')}
        </p>

        {/* AI button */}
        <button onClick={runAi} disabled={aiBusy}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3.5 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-canvas transition-opacity hover:opacity-85 disabled:opacity-60 cursor-pointer">
          <Sparkles size={14} /> {aiBusy ? t('AI skriver…') : t('Gør den perfekt med AI')}
        </button>
        {aiError && <p className="mt-2 text-[0.78rem] text-[#b34e37]">{aiError}</p>}

        {/* Variant picker */}
        <AnimatePresence>
          {variants && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mt-5 overflow-hidden">
              <p className="mb-3 text-[0.72rem] text-muted">
                {t('AI skrev jeres detaljer i skabelonens stil — vælg en, og redigér frit bagefter.')}
              </p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {variants.map((v, i) => (
                  <button key={i} onClick={() => chooseVariant(v)}
                    className="rounded-xl rule bg-card p-3 text-left transition-colors hover:bg-shell cursor-pointer">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">{t('Variant')} {i + 1}</p>
                    <p className="mt-1.5 line-clamp-2 text-[0.82rem] text-ink">{v.introLines.join(' ') || v.label}</p>
                    <p className="mt-1 text-[0.72rem] text-muted">{v.displayDate}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fields */}
        <div className="mt-8 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('Partner A')} value={data.partnerA} onChange={(v) => setName('partnerA', v)} />
            <Field label={t('Partner B')} value={data.partnerB} onChange={(v) => setName('partnerB', v)} />
          </div>

          {template.monogram && (
            <Field label={t('Monogram')} value={data.monogram} onChange={(v) => set('monogram', v)} hint={t('Udledes af initialer — kan redigeres')} />
          )}

          {has('label') && (
            <Field label={t('Overlinje')} value={data.label} onChange={(v) => set('label', v)} />
          )}

          {has('introLines') && (
            <div>
              <FieldLabel>{t('Ordlyd')}</FieldLabel>
              <textarea value={introText} onChange={(e) => setIntroText(e.target.value)} rows={2}
                className="w-full rounded-lg rule bg-card px-3 py-2 text-[0.9rem] text-ink focus:outline-none resize-none" />
              <p className="mt-1 text-[0.68rem] text-muted">{t('Én linje pr. sætning')}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>{t('Dato')}</FieldLabel>
              <input type="date" value={isoToDateInput(data.isoDate)} onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg rule bg-card px-3 py-2 text-[0.9rem] text-ink focus:outline-none" />
            </div>
            {showTime && (
              <Field label={t('Tidspunkt')} value={data.time ?? ''} onChange={(v) => set('time', v || undefined)} placeholder={da ? 'Kl. 16' : 'Four o’clock'} />
            )}
          </div>

          <Field label={t('Sted')} value={data.venue} onChange={(v) => set('venue', v)} />
          {has('venueDetail') && (
            <Field label={t('Sted — detalje')} value={data.venueDetail ?? ''} onChange={(v) => set('venueDetail', v || undefined)} placeholder={da ? 'By, land' : 'City, country'} />
          )}
          {has('closing') && (
            <Field label={t('Afslutning')} value={data.closing ?? ''} onChange={(v) => set('closing', v || undefined)} />
          )}
          {has('rsvpLabel') && (
            <Field label={t('RSVP-tekst')} value={data.rsvpLabel ?? ''} onChange={(v) => set('rsvpLabel', v || undefined)} />
          )}

          <div>
            <FieldLabel>{t('Sprog')}</FieldLabel>
            <div className="flex gap-2">
              {(['da', 'en'] as const).map((l) => (
                <button key={l} onClick={() => setLanguage(l)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-[0.8rem] cursor-pointer transition-all ${data.language === l ? 'border-ink bg-ink text-canvas' : 'rule text-ink-soft hover:text-ink'}`}>
                  {l === 'da' ? 'Dansk' : 'English'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save / share */}
        <div className="mt-8 rule-t pt-6">
          {shareSlug ? (
            <div className="rounded-xl bg-sage-tint p-4">
              <p className="text-[0.78rem] font-semibold text-ink">{t('Din invitation er klar at dele')}</p>
              <div className="mt-2 flex items-center gap-2">
                <input readOnly value={shareUrl} className="min-w-0 flex-1 rounded-lg bg-canvas px-3 py-2 text-[0.78rem] text-ink-soft" />
                <button onClick={copyShare} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-[0.72rem] font-semibold text-canvas hover:opacity-85 cursor-pointer">
                  {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? t('Kopieret') : t('Kopiér')}
                </button>
              </div>
              <a href={shareUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[0.74rem] text-ink underline">
                {t('Åbn invitationen')} →
              </a>
            </div>
          ) : (
            <button onClick={save} disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sage px-4 py-3.5 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-ink transition-colors hover:bg-sage-strong disabled:opacity-60 cursor-pointer">
              {saving ? t('Gemmer…') : t('Gem & del')}
            </button>
          )}
        </div>
      </div>

      {/* ── Live preview ─────────────────────────────────────────────── */}
      <div className="order-1 flex items-center justify-center bg-[#efece5] py-8 lg:order-2 lg:sticky lg:top-0 lg:h-screen lg:py-0">
        <PhoneFrame>
          <Component data={liveData} />
        </PhoneFrame>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted">{children}</p>;
}

function Field({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg rule bg-card px-3 py-2 text-[0.9rem] text-ink focus:outline-none" />
      {hint && <p className="mt-1 text-[0.68rem] text-muted">{hint}</p>}
    </div>
  );
}
