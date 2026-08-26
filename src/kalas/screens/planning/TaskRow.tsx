import * as React from 'react';
import { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, MoreHorizontal, CalendarDays, CornerDownRight, Pencil, CalendarOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn, TaskCheckbox, taskRowTone, doneLabelClass } from '../../ui';
import { useLang } from '../../i18n';
import { formatDate, statusOf, statusLabel, daysDiff } from './shared';

export type DisplayTask = {
  id: string;
  title: string;
  /** Null for check items, and for milestones Ava added without a date. */
  dateISO: string | null;
  done: boolean;
  weddingDay: boolean;
  /** Leading icon — the area, on the timeline's visiting checklist rows. */
  Icon?: LucideIcon;
  /** Small label marking a row that lives on the other tab, e.g. "Milepæl". */
  tag?: string;
};

/** One completable row, shared by both tabs. The menu entries differ:
 *  the checklist is append-only (int `sort`, no fractional insert), so it
 *  passes no `onInsertAfter`; the timeline passes no `onRename`. A checklist
 *  row visiting the timeline passes `onClearDate` instead of `onDelete` —
 *  taking it off the timeline must not delete it off the checklist. */
export default function TaskRow({
  task, deleteLabel, menuOpen, onMenu, onCloseMenu, onToggle, onDelete, onInsertAfter, onRename, onClearDate, onDateChange,
}: {
  task: DisplayTask;
  deleteLabel: string;
  menuOpen: boolean;
  onMenu: () => void;
  onCloseMenu: () => void;
  onToggle: () => void;
  onDelete?: () => void;
  onInsertAfter?: () => void;
  onRename?: () => void;
  onClearDate?: () => void;
  onDateChange: (dateISO: string) => void;
}) {
  const { t } = useLang();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const status = statusOf(task);
  const done = status === 'done';
  const overdue = status === 'overdue';
  const diff = task.dateISO ? daysDiff(task.dateISO) : null;
  const isSoon = status === 'planned' && diff !== null && diff > 0 && diff <= 14;
  const isToday = status === 'planned' && diff === 0;

  return (
    <div
      className={cn(
        'flex w-full flex-wrap items-center gap-3 rounded-[18px] border px-5 py-4 sm:gap-4',
        taskRowTone(done ? 'done' : overdue ? 'overdue' : 'default'),
      )}
    >
      <TaskCheckbox done={task.done} label={task.title} onToggle={onToggle} />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn('flex flex-wrap items-center gap-2 text-base font-semibold', done ? doneLabelClass : 'text-[#314523]')}>
          {task.Icon && <task.Icon size={14} strokeWidth={2} className="shrink-0 text-[#8a9079]" aria-hidden />}
          {t(task.title)}
          {task.tag && (
            <span className="rounded-full bg-[#eef1e6] px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-[#6c7561]">
              {t(task.tag)}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => dateInputRef.current?.showPicker?.()}
          aria-label={t("Ændr dato for '{title}'", { title: task.title })}
          className={cn(
            'relative flex w-fit items-center gap-1.5 text-[13px] hover:text-[#314523] cursor-pointer',
            task.dateISO ? 'text-[#6c7561]' : 'text-[#9a9686]',
          )}
        >
          <CalendarDays size={12} />
          {task.dateISO ? formatDate(task.dateISO) : t('Vælg dato')}
          <input
            ref={dateInputRef}
            type="date"
            value={task.dateISO ?? ''}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            className="absolute inset-0 w-full cursor-pointer opacity-0"
            tabIndex={-1}
          />
        </button>
      </div>

      <span
        className={cn(
          'text-xs font-bold uppercase tracking-[0.12em]',
          done ? 'text-[#7a9068]'
            : overdue ? 'text-[#b34e37]'
            : status === 'wedding' ? 'text-[#314523]'
            : isSoon || isToday ? 'text-[#8a7d5c]'
            : 'text-[#9a9686]',
        )}
      >
        {statusLabel(task, t)}
      </span>

      <div className="relative">
        <button
          type="button"
          onClick={onMenu}
          aria-label={t("Handlinger for '{title}'", { title: task.title })}
          className="flex size-8 items-center justify-center rounded-full text-[#9a9686] transition-colors hover:bg-white/70 hover:text-[#314523] cursor-pointer"
        >
          <MoreHorizontal size={18} />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={onCloseMenu} />
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.14 }}
                className="absolute right-0 top-9 z-50 w-[168px] overflow-hidden rounded-[14px] border border-[#d8d4c7] bg-[#fcfbf7] py-1 shadow-[0_16px_40px_-12px_rgba(20,26,19,0.25)]"
              >
                {onInsertAfter && (
                  <button type="button" onClick={onInsertAfter}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-[#314523] transition-colors hover:bg-[#f0ede5] cursor-pointer">
                    <CornerDownRight size={14} className="text-[#6c7561]" /> {t('Indsæt under')}
                  </button>
                )}
                {onRename && (
                  <button type="button" onClick={onRename}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-[#314523] transition-colors hover:bg-[#f0ede5] cursor-pointer">
                    <Pencil size={14} className="text-[#6c7561]" /> {t('Omdøb punkt')}
                  </button>
                )}
                {onClearDate && (
                  <button type="button" onClick={onClearDate}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-[#314523] transition-colors hover:bg-[#f0ede5] cursor-pointer">
                    <CalendarOff size={14} className="text-[#6c7561]" /> {t('Fjern dato')}
                  </button>
                )}
                {onDelete && (
                  <button type="button" onClick={onDelete}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-[#b34e37] transition-colors hover:bg-[#faf4ef] cursor-pointer">
                    <Trash2 size={14} /> {t(deleteLabel)}
                  </button>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
