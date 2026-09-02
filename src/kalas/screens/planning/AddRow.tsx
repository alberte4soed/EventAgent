import * as React from 'react';
import { motion } from 'motion/react';
import { Plus, Check } from 'lucide-react';
import { useLang } from '../../i18n';

/** Inline "new item" row. `date` is omitted on the checklist tab, where items
 *  are grouped by area rather than by time. */
export default function AddRow({
  inputRef, title, date, placeholder, onTitleChange, onDateChange, onSave, onCancel,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  title: string;
  date?: string;
  placeholder: string;
  onTitleChange: (v: string) => void;
  onDateChange?: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { t } = useLang();
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
      className="overflow-hidden"
    >
      <div className="flex flex-wrap items-center gap-3 rounded-[18px] border border-[#d3dcc4] bg-[#e8f0ec] px-5 py-4">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-[#c6cbc6]">
          <Plus size={14} className="text-[#24413a]" />
        </span>
        <input
          ref={inputRef} value={title} onChange={(e) => onTitleChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
          placeholder={t(placeholder)}
          aria-label={t(placeholder)}
          className="min-w-0 flex-1 bg-transparent text-base font-semibold text-[#24413a] placeholder:text-[#9a9686] focus:outline-none"
        />
        {date !== undefined && onDateChange && (
          <input
            type="date" value={date} onChange={(e) => onDateChange(e.target.value)}
            aria-label={t('Dato for ny milepæl')}
            className="rounded-full border border-[#dcdfdb] bg-[#ffffff] px-3.5 py-2 text-[13px] text-[#24413a] focus:outline-none cursor-pointer"
          />
        )}
        <button type="button" onClick={onSave} aria-label={t('Gem')}
          className="flex h-8 items-center gap-1.5 rounded-full bg-[#24413a] px-3 text-xs font-semibold text-[#f8f9f8] cursor-pointer">
          <Check size={13} /> {t('Gem')}
        </button>
        <button type="button" onClick={onCancel}
          className="text-sm font-medium text-[#5f6b66] hover:text-[#24413a] cursor-pointer">
          {t('Annuller')}
        </button>
      </div>
    </motion.div>
  );
}
