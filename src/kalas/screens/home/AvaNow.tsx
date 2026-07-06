"use client";

import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { tasksDueSoon } from '@/lib/dashboard';
import { useWedding } from '../../useWedding';
import { useLang } from '../../i18n';
import type { ScreenId } from '../../Shell';
import { DA_STAGES, STAGE_SCREEN, daStageHint } from './stages';

/* "Ava anbefaler nu" — the one card that always tells the couple what to do
   next: approvals first, then unread replies, overdue tasks, then the active
   journey stages. */
export default function AvaNow({ onNavigate }: { onNavigate: (s: ScreenId) => void }) {
  const { journey, pendingProposals, unreadReplies, timelineTasks, venues, replies } = useWedding();
  const { t } = useLang();

  const overdue = tasksDueSoon(timelineTasks).overdue.length;
  const active = journey.filter((s) => s.status === 'active').slice(0, 2);
  const counts = {
    liked: venues.filter((v) => v.category === 'venue' && v.swipe_status === 'liked').length,
    quotes: replies.filter((r) => r.quote_status === 'quoted').length,
  };

  const rows: { key: string; title: string; sub: string; screen: ScreenId }[] = [];
  if (pendingProposals > 0) {
    rows.push({
      key: 'proposals',
      title: t('{n} svar klar til godkendelse', { n: pendingProposals }),
      sub: t('Ava har forberedt svar til jeres leverandører'),
      screen: 'ava',
    });
  }
  if (unreadReplies > 0) {
    rows.push({
      key: 'unread',
      title: t('{n} ulæste svar i indbakken', { n: unreadReplies }),
      sub: t('Nye beskeder fra jeres leverandører'),
      screen: 'inbox',
    });
  }
  if (overdue > 0) {
    rows.push({
      key: 'overdue',
      title: t('{n} opgaver er over tid', { n: overdue }),
      sub: t('Et lille skub, så er I foran igen'),
      screen: 'planning',
    });
  }
  for (const s of active) {
    rows.push({
      key: s.key,
      title: t(DA_STAGES[s.key].label),
      sub: daStageHint(s, counts, t),
      screen: STAGE_SCREEN[s.key],
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rule rounded-2xl bg-card overflow-hidden"
    >
      <div className="flex items-center gap-2.5 px-6 py-3.5 rule-b">
        {rows.length > 0 && (
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-terracotta)] opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-terracotta)]" />
          </div>
        )}
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-muted">{t('Ava anbefaler nu')}</p>
      </div>
      {rows.length === 0 ? (
        <p className="px-6 py-5 font-serif text-[1rem] italic text-muted">
          {t('Alt er klaret for nu. Nyd roen — jeg siger til, når næste skridt nærmer sig.')}
        </p>
      ) : (
        <div className="divide-y divide-[var(--color-line)]">
          {rows.slice(0, 4).map((row) => (
            <button key={row.key} onClick={() => onNavigate(row.screen)}
              className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-shell/60 transition-colors cursor-pointer group">
              <div className="min-w-0">
                <p className="font-serif text-[1rem] text-ink leading-snug truncate">{row.title}</p>
                <p className="text-[0.75rem] text-muted mt-0.5">{row.sub}</p>
              </div>
              <ArrowUpRight size={14} className="shrink-0 text-muted group-hover:text-ink transition-colors" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
