"use client";

/* The walkthrough's inline controls, rendered under Ava's last bubble:
   "try asking me…" chips that fire real agent turns, and, on the last step —
   the chat-vs-classic choice that ends onboarding. */

import { motion } from 'motion/react';
import { ArrowRight, MessageCircle, PanelLeft } from 'lucide-react';
import { useLang } from './i18n';
import { cn } from './ui';
import type { Walkthrough } from './useWalkthrough';

export default function WalkthroughChips({ wt }: { wt: Walkthrough }) {
  const { t } = useLang();
  const { step } = wt;
  if (!step) return null;

  if (step.final) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rule mt-1 rounded-2xl bg-card p-4"
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => wt.finish('chat')}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-[0.88rem] font-semibold text-canvas transition-opacity hover:opacity-90"
          >
            <MessageCircle size={15} strokeWidth={1.8} />
            {t('Bliv i chatten')}
          </button>
          <button
            type="button"
            onClick={() => wt.finish('classic')}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#d9ded9] bg-canvas px-4 py-3 text-[0.88rem] font-semibold text-ink transition-colors hover:bg-shell"
          >
            <PanelLeft size={15} strokeWidth={1.8} />
            {t('Skift til klassisk')}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-2"
    >
      {/* Ava just did the thing on the stage, say so, and stay put until they
          have actually looked at it. */}
      {wt.tried && (
        <p className="w-full text-[0.8rem] leading-snug text-faint">
          {t('Kig på skærmen, jeg bliver her, til I siger videre.')}
        </p>
      )}

      {!wt.tried && wt.tries.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => wt.runTry(prompt)}
          className={cn(
            'flex cursor-pointer items-center gap-1.5 rounded-full border border-[#c9d3c4] bg-sage-tint px-3.5 py-2',
            'text-left text-[0.85rem] leading-snug text-ink transition-colors hover:bg-sage',
          )}
        >
          <MessageCircle size={13} strokeWidth={1.8} className="shrink-0 text-[#5c7a4f]" />
          <span>{t('Prøv: “{prompt}”', { prompt })}</span>
        </button>
      ))}

      <button
        type="button"
        onClick={wt.next}
        className={cn(
          'flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.85rem] transition-colors',
          wt.tried
            ? 'bg-ink font-semibold text-canvas hover:opacity-90'
            : 'border border-[#d9ded9] bg-card text-ink-soft hover:text-ink',
        )}
      >
        {t('Videre')}
        <ArrowRight size={13} strokeWidth={1.8} />
      </button>

      <button
        type="button"
        onClick={wt.skip}
        className="cursor-pointer px-2 py-2 text-[0.8rem] text-faint transition-colors hover:text-ink-soft"
      >
        {t('Spring guiden over')}
      </button>
    </motion.div>
  );
}
