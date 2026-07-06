"use client";

import { motion } from 'motion/react';
import { useWedding } from '../../useWedding';
import { useLang } from '../../i18n';
import type { ScreenId } from '../../Shell';
import { Bleed, Eyebrow, Pill, fadeUp, stagger } from '../../ui';
import { IMAGES } from '../../data';

/* The couple's real moodboard — no mock imagery. Local blob: uploads are not
   persisted, so only IMAGES keys and http(s) urls render here. */
export default function MoodboardStrip({ onNavigate }: { onNavigate: (s: ScreenId) => void }) {
  const { moodboardItems } = useWedding();
  const { t } = useLang();

  const items = moodboardItems
    .flatMap((m) => {
      const url =
        m.image_key && m.image_key in IMAGES
          ? IMAGES[m.image_key as keyof typeof IMAGES]
          : m.image_url?.startsWith('http')
            ? m.image_url
            : null;
      return url ? [{ id: m.id, caption: m.note ?? '', url }] : [];
    })
    .slice(0, 4);

  return (
    <section className="mt-24">
      <div className="flex items-end justify-between gap-6">
        <div>
          <Eyebrow>Moodboard</Eyebrow>
          <h2 className="display mt-3 text-[clamp(2rem,4vw,3rem)] text-ink">
            {t('Jeres univers, samlet')} <span className="italic">{t('ét sted')}</span>
          </h2>
          <p className="mt-3 max-w-md text-ink-soft leading-relaxed">
            {t('Hver gang I gemmer et billede, sender Ava det videre til vendor-briefs og hjemmesidens tema.')}
          </p>
        </div>
        <Pill variant="ghost" arrow onClick={() => onNavigate('inspiration')} className="hidden sm:inline-flex">{t('Åbn')}</Pill>
      </div>

      {items.length === 0 ? (
        <div className="mt-8">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <button key={i} onClick={() => onNavigate('inspiration')}
                className="rule aspect-[3/4] cursor-pointer bg-shell/70 transition-colors hover:bg-shell" />
            ))}
          </div>
          <div className="mt-6 text-center">
            <Pill arrow onClick={() => onNavigate('inspiration')}>{t('Byg jeres moodboard')}</Pill>
          </div>
        </div>
      ) : (
        <motion.div
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}
          className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {items.map((m) => (
            <motion.button
              key={m.id} variants={fadeUp} onClick={() => onNavigate('inspiration')}
              className="group relative aspect-[3/4] cursor-pointer overflow-hidden"
            >
              <Bleed src={m.url} alt={m.caption || t('Moodboard-billede')} className="h-full w-full" />
              {m.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#3a4f37b3] to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="text-[0.7rem] uppercase tracking-[0.14em] text-canvas">{m.caption}</span>
                </div>
              )}
            </motion.button>
          ))}
        </motion.div>
      )}
    </section>
  );
}
