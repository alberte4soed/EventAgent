'use client';

/* Invitation gallery — 20 templates grouped by the five moods, each shown in a
   phone frame with the couple's own names, tappable into the editor. */

import { motion } from 'motion/react';
import { PhoneFrame } from './PhoneFrame';
import { templatesByGroup } from './templates';
import { defaultDataFor } from './data';
import { useInvitationFonts } from './fonts';
import type { Language, Template } from './types';
import { useLang } from '../i18n';

export interface CoupleInput {
  partnerA: string;
  partnerB: string;
  isoDate: string | null;
  venue: string;
  language: Language;
}

/** A phone preview scaled to a thumbnail width without distorting the design. */
function ScaledPhone({ width, children }: { width: number; children: React.ReactNode }) {
  const base = 280;
  const scale = width / base;
  const height = (base * 590) / 280; // phone aspect 280/590
  return (
    <div style={{ width, height: height * scale, pointerEvents: 'none' }}>
      <div style={{ width: base, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  );
}

export function Gallery({ couple, onPick }: { couple: CoupleInput; onPick: (t: Template) => void }) {
  useInvitationFonts();
  const { t } = useLang();
  const groups = templatesByGroup();

  return (
    <div className="px-6 py-8 sm:px-9 lg:px-12 lg:py-8">
      <div className="max-w-2xl">
        <h1 className="display text-[clamp(1.8rem,3.5vw,2.6rem)] leading-tight text-ink">
          {t('Vælg en invitation')}<span className="italic">.</span>
        </h1>
        <p className="mt-2 max-w-md text-[0.95rem] leading-relaxed text-ink-soft">
          {t('Tyve stilarter — én du taster jeres detaljer ind i, og AI finpudser ordlyden. Vælg den der føles rigtig.')}
        </p>
      </div>

      {groups.map(({ group, label, templates }) => (
        <section key={group} className="mt-12">
          <p className="eyebrow mb-6">{t(label)}</p>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-7">
            {templates.map((tpl, i) => {
              const { Component } = tpl;
              const data = defaultDataFor(tpl, {
                partnerA: couple.partnerA,
                partnerB: couple.partnerB,
                isoDate: couple.isoDate,
                venue: couple.venue,
                language: couple.language,
              });
              return (
                <motion.button
                  key={tpl.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => onPick(tpl)}
                  className="group flex flex-col items-center text-center cursor-pointer"
                >
                  <div className="transition-transform duration-300 group-hover:-translate-y-1.5">
                    <ScaledPhone width={168}>
                      <PhoneFrame>
                        <Component data={data} />
                      </PhoneFrame>
                    </ScaledPhone>
                  </div>
                  <p className="mt-3 font-serif text-[1.05rem] text-ink">{tpl.name}</p>
                  <p className="mt-0.5 text-[0.7rem] uppercase tracking-[0.14em] text-muted">{t(tpl.subtitle)}</p>
                  {tpl.interactive && (
                    <span className="mt-1.5 rounded-full bg-sage-tint px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-ink">
                      {tpl.interactive === 'countdown' ? t('Live nedtælling') : t('Tryk for at åbne')}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
