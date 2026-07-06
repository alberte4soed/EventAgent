"use client";

import { motion } from 'motion/react';
import { Banknote, ImageIcon, Inbox, PenLine, Send } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { buildActivityFeed, type ActivityKind } from '@/lib/dashboard';
import { useWedding } from '../../useWedding';
import { useLang, type Lang } from '../../i18n';
import type { ScreenId } from '../../Shell';
import { Eyebrow } from '../../ui';

const ICONS: Record<ActivityKind, LucideIcon> = {
  quote: Banknote,
  reply: Inbox,
  sent: Send,
  proposal: PenLine,
  moodboard: ImageIcon,
};

function relTime(iso: string, lang: Lang): string {
  const rtf = new Intl.RelativeTimeFormat(lang === 'da' ? 'da' : 'en', { numeric: 'auto' });
  const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (Math.abs(mins) < 60) return rtf.format(mins, 'minute');
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
  return rtf.format(Math.round(hours / 24), 'day');
}

/* What Ava and the vendors have been up to lately. Hidden until something
   has happened. */
export default function ActivityFeed({ onNavigate }: { onNavigate: (s: ScreenId) => void }) {
  const { replies, outbound, proposals, moodboardItems, venues } = useWedding();
  const { t, lang } = useLang();

  const feed = buildActivityFeed({ replies, outbound, proposals, moodboardItems });
  if (feed.length === 0) return null;

  const venueName = (id?: string) => venues.find((v) => v.id === id)?.name ?? t('Leverandør');
  const text = (kind: ActivityKind, venue: string): string => {
    switch (kind) {
      case 'quote': return t('Tilbud fra {venue}', { venue });
      case 'reply': return t('Nyt svar fra {venue}', { venue });
      case 'sent': return t('Forespørgsel sendt til {venue}', { venue });
      case 'proposal': return t('Ava har skrevet et udkast til {venue}', { venue });
      case 'moodboard': return t('Nyt billede på moodboardet');
    }
  };
  const screen = (kind: ActivityKind): ScreenId => (kind === 'moodboard' ? 'inspiration' : 'inbox');

  return (
    <section className="mt-16">
      <div className="rule-b pb-4">
        <Eyebrow>{t('Seneste aktivitet')}</Eyebrow>
      </div>
      <div className="divide-y divide-[var(--color-line)]">
        {feed.map((item, i) => {
          const Icon = ICONS[item.kind];
          return (
            <motion.button
              key={`${item.kind}-${item.at}-${i}`}
              initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              onClick={() => onNavigate(screen(item.kind))}
              className="flex w-full items-center gap-4 py-3.5 text-left transition-colors hover:bg-shell/50 cursor-pointer"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-tint">
                <Icon size={14} className="text-ink" />
              </span>
              <span className="min-w-0 flex-1 truncate text-[0.9rem] text-ink">
                {text(item.kind, venueName(item.venueId))}
              </span>
              <span className="shrink-0 text-[0.75rem] text-muted">{relTime(item.at, lang)}</span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
