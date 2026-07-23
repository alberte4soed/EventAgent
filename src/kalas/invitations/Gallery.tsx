'use client';

/* Invitation gallery — pick a style at the top, then a template beneath it.
   Each template renders in a phone frame with the couple's own names, tappable
   into the editor. The style bar mirrors a curated set of moods; "Alle" shows
   every category stacked. */

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { PhoneFrame, ScaledPhone } from './PhoneFrame';
import { templatesByGroup } from './templates';
import { defaultDataFor } from './data';
import { useInvitationFonts } from './fonts';
import { GROUP_META, GROUP_ORDER, GROUP_LABELS } from './types';
import type { InvitationData, Language, Template, TemplateGroup } from './types';
import { useLang } from '../i18n';

export interface CoupleInput {
  partnerA: string;
  partnerB: string;
  isoDate: string | null;
  venue: string;
  language: Language;
}

type Active = TemplateGroup | 'all';

export function Gallery({ couple, onPick }: { couple: CoupleInput; onPick: (t: Template) => void }) {
  useInvitationFonts();
  const { t } = useLang();
  const [active, setActive] = useState<Active>('all');
  const groups = templatesByGroup();

  const dataFor = useMemo(
    () => (tpl: Template): InvitationData =>
      defaultDataFor(tpl, {
        partnerA: couple.partnerA,
        partnerB: couple.partnerB,
        isoDate: couple.isoDate,
        venue: couple.venue,
        language: couple.language,
      }),
    [couple.partnerA, couple.partnerB, couple.isoDate, couple.venue, couple.language]
  );

  const visible = active === 'all' ? groups : groups.filter((g) => g.group === active);

  return (
    <div className="px-6 py-8 sm:px-9 lg:px-12 lg:py-8">
      <div>
        <h1 className="font-serif text-[clamp(2rem,4vw,2.4rem)] leading-[1.1] tracking-[-0.02em] text-[#314523]">
          {t('Invitationer')}
        </h1>
        <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-[#6c7561]">
          {t('Vælg en stil, tast jeres detaljer, og lad AI finpudse ordlyden.')}
        </p>
      </div>

      {/* ── Style selector (text only) ─────────────────────────────────── */}
      <div className="mt-8 -mx-6 px-6 sm:-mx-9 sm:px-9 lg:-mx-12 lg:px-12">
        <div className="flex gap-2.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <StyleChip
            label={t('Alle')}
            active={active === 'all'}
            onClick={() => setActive('all')}
          />
          {GROUP_ORDER.map((group) => (
            <StyleChip
              key={group}
              label={t(GROUP_LABELS[group])}
              active={active === group}
              onClick={() => setActive(group)}
            />
          ))}
        </div>
      </div>

      {/* ── Templates ──────────────────────────────────────────────────── */}
      {visible.map(({ group, label, templates }) => (
        <section key={group} className="mt-10">
          {active === 'all' && (
            <p className="eyebrow mb-6">
              {t(label)}
              <span className="ml-2 normal-case tracking-normal text-muted">· {t(GROUP_META[group].subtitle)}</span>
            </p>
          )}
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-7">
            {templates.map((tpl, i) => {
              const { Component } = tpl;
              return (
                <motion.div
                  key={tpl.id}
                  role="button"
                  tabIndex={0}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => onPick(tpl)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(tpl); } }}
                  className="group flex flex-col items-center text-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 rounded-lg"
                >
                  <div className="transition-transform duration-300 group-hover:-translate-y-1.5">
                    <ScaledPhone width={168}>
                      <PhoneFrame>
                        <Component data={dataFor(tpl)} />
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
                </motion.div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

/** A text-only category pill in the style bar, highlighted when active. */
function StyleChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={active}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      className={`shrink-0 rounded-full border px-5 py-2.5 font-serif text-[0.95rem] leading-none transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 ${
        active ? 'border-ink bg-ink text-canvas' : 'rule bg-card text-ink-soft hover:border-[var(--color-line-strong)] hover:text-ink'
      }`}
    >
      {label}
    </div>
  );
}
