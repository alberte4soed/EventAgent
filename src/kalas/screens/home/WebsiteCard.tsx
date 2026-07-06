"use client";

import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, Globe } from 'lucide-react';
import { useWedding } from '../../useWedding';
import { useLang } from '../../i18n';
import type { ScreenId } from '../../Shell';
import { Chip } from '../../ui';

/* Quiet one-line website row. Shows the real domain once the site is
   published; until then an honest "coming soon" — no fabricated links. */
export default function WebsiteCard({ onNavigate }: { onNavigate: (s: ScreenId) => void }) {
  const { weddingSite } = useWedding();
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  const domain = weddingSite?.published ? weddingSite.domain : null;

  function copy() {
    if (!domain) return;
    navigator.clipboard.writeText(`https://${domain}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5 }}
      className="mt-16 rule flex items-center justify-between gap-4 rounded-2xl bg-card px-6 py-4"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-tint">
          <Globe size={17} className="text-ink" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-serif text-[1.05rem] text-ink">{t('Jeres hjemmeside')}</p>
          {domain ? (
            <p className="truncate font-mono text-[0.76rem] text-muted">{domain}</p>
          ) : (
            <p className="text-[0.76rem] text-muted">{t('Del detaljer, program og RSVP med gæsterne')}</p>
          )}
        </div>
        {!domain && <Chip>{t('Kommer snart')}</Chip>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {domain && (
          <button onClick={copy}
            className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.14em] bg-ink text-canvas hover:bg-ink/80 transition-colors cursor-pointer">
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? t('Kopieret!') : t('Kopiér link')}
          </button>
        )}
        <button onClick={() => onNavigate('website')}
          className="rounded-full border border-[var(--color-line)] px-4 py-2 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-ink hover:bg-shell transition-colors cursor-pointer">
          {t('Tilpas →')}
        </button>
      </div>
    </motion.div>
  );
}
