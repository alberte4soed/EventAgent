"use client";

import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { tasksDueSoon } from '@/lib/dashboard';
import { useWedding } from '../../useWedding';
import { useLang } from '../../i18n';
import type { ScreenId } from '../../Shell';
import { Chip, Eyebrow, cn } from '../../ui';

/* Overdue + next-14-days tasks with an inline done-toggle. Hidden until the
   couple has a timeline at all. */
export default function TasksDueSoon({ onNavigate }: { onNavigate: (s: ScreenId) => void }) {
  const { timelineTasks, updateTask } = useWedding();
  const { t, lang } = useLang();

  if (timelineTasks.length === 0) return null;

  const { overdue, upcoming } = tasksDueSoon(timelineTasks);
  const rows = [...overdue, ...upcoming].slice(0, 5);
  const locale = lang === 'da' ? 'da-DK' : 'en-GB';

  return (
    <section className="mt-16">
      <div className="flex items-center justify-between rule-b pb-4">
        <Eyebrow>
          {overdue.length > 0
            ? t('Opgaver · {n} over tid', { n: overdue.length })
            : t('Opgaver · de næste 14 dage')}
        </Eyebrow>
        <button onClick={() => onNavigate('planning')} className="eyebrow hover:text-ink transition-colors cursor-pointer">
          {t('Se tidslinjen')}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 font-serif text-[1rem] italic text-muted">
          {t('Ingen opgaver de næste 14 dage — I er foran. 🤍')}
        </p>
      ) : (
        <div className="divide-y divide-[var(--color-line)]">
          {rows.map((task) => {
            const late = overdue.some((o) => o.id === task.id);
            return (
              <motion.div key={task.id}
                initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-4 py-3.5"
              >
                <button
                  onClick={() => void updateTask(task.id, { done: true })}
                  aria-label={t('Markér som klaret')}
                  className="group flex h-6 w-6 shrink-0 items-center justify-center rounded-full rule transition-colors hover:bg-sage cursor-pointer"
                >
                  <Check size={12} className="text-transparent transition-colors group-hover:text-ink" />
                </button>
                <span className="min-w-0 flex-1 truncate text-[0.9rem] text-ink">{task.title}</span>
                {task.due_date && (
                  <span className={cn('shrink-0 text-[0.75rem]', late ? 'text-[#7a543c]' : 'text-muted')}>
                    {new Date(`${task.due_date}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                  </span>
                )}
                {late && <Chip tone="clay">{t('Over tid')}</Chip>}
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
