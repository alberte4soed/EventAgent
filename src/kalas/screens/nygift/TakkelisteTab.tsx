import * as React from 'react';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Plus, Gift, Mail, StickyNote } from 'lucide-react';
import { useWedding } from '../../useWedding';
import { cn, TaskCheckbox, taskRowTone, doneLabelClass } from '../../ui';
import { useLang } from '../../i18n';
import {
  buildThankList, thankProgress, subjectKey, THANK_METHODS, methodLabel,
  type ThankEntry,
} from './thanks';
import type { ThankMethod } from '@/lib/db/types';

type Filter = 'alle' | 'mangler' | 'takket';

const FILTER_LABELS: Record<Filter, string> = {
  alle: 'Alle',
  mangler: 'Mangler',
  takket: 'Takket',
};

export default function TakkelisteTab() {
  const { t } = useLang();
  const { guests, registryClaims, registryItems, thankYous, saveThankYou } = useWedding();
  const [filter, setFilter] = useState<Filter>('alle');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const newInputRef = useRef<HTMLInputElement>(null);

  const entries = buildThankList(guests, registryClaims, registryItems, thankYous);
  const { done, total } = thankProgress(entries);

  const counts: Record<Filter, number> = {
    alle: total,
    mangler: total - done,
    takket: done,
  };

  const q = query.trim().toLowerCase();
  const visible = entries.filter((e) => {
    if (filter === 'mangler' && e.thankedAt) return false;
    if (filter === 'takket' && !e.thankedAt) return false;
    if (q && !e.name.toLowerCase().includes(q) && !(e.gift ?? '').toLowerCase().includes(q)) return false;
    return true;
  });

  function toggle(entry: ThankEntry) {
    void saveThankYou(entry.key, {
      label: entry.name,
      gift: entry.gift,
      thanked_at: entry.thankedAt ? null : new Date().toISOString(),
      method: entry.thankedAt ? null : entry.method,
      note: entry.note,
    });
  }

  function setMethod(entry: ThankEntry, method: ThankMethod) {
    void saveThankYou(entry.key, {
      label: entry.name,
      gift: entry.gift,
      // Picking a method is itself a statement that they have been thanked.
      thanked_at: entry.thankedAt ?? new Date().toISOString(),
      method: entry.method === method ? null : method,
      note: entry.note,
    });
  }

  function setNote(entry: ThankEntry, note: string) {
    void saveThankYou(entry.key, {
      label: entry.name,
      gift: entry.gift,
      thanked_at: entry.thankedAt,
      method: entry.method,
      note: note.trim() || null,
    });
  }

  function openAdd() {
    setAdding(true);
    setNewName('');
    setTimeout(() => newInputRef.current?.focus(), 60);
  }

  function commitAdd() {
    const label = newName.trim();
    if (!label) { setAdding(false); return; }
    void saveThankYou(subjectKey('manual', crypto.randomUUID()), { label });
    setAdding(false);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5 rounded-[28px] border border-[#d8d4c7] bg-[#fcfbf7] p-7"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-md text-sm text-[#6c7561]">
          {t('Alle der kom, og alle der gav noget — samlet ét sted, så ingen bliver glemt.')}
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <p className="shrink-0 text-sm font-bold text-[#8a9079]">
            {t('{done} af {total} takket', { done, total })}
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="flex h-8 items-center gap-1.5 rounded-full bg-[#173c32] px-3 text-xs font-semibold text-white cursor-pointer"
          >
            <Plus size={13} />
            {t('Tilføj person')}
          </button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-11 w-full items-center gap-2.5 rounded-[14px] border border-[#e4e0d4] bg-[#f7f5ef] px-4 sm:w-[260px]">
          <Search size={15} className="shrink-0 text-[#9a9686]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Søg efter navn eller gave')}
            aria-label={t('Søg efter navn eller gave')}
            className="min-w-0 flex-1 bg-transparent text-sm text-[#314523] placeholder:text-[#9a9686] focus:outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label={t('Ryd søgning')}
              className="text-[#9a9686] hover:text-[#314523] cursor-pointer">
              <X size={14} />
            </button>
          )}
        </div>
        {(['alle', 'mangler', 'takket'] as Filter[]).map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold uppercase tracking-[0.1em] transition-colors cursor-pointer',
                active
                  ? 'bg-[#314523] text-[#f7f5ef]'
                  : 'border border-[#e4e0d4] bg-[#f7f5ef] text-[#6c7561] hover:text-[#314523]',
              )}
            >
              {t(FILTER_LABELS[f])}
              <span className={active ? 'text-[#dce3d3]' : 'text-[#9a9686]'}>{counts[f]}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {visible.length === 0 && (
          <div className="rounded-[18px] border border-[#e4e0d4] bg-[#f7f5ef] px-5 py-10 text-center">
            <p className="font-serif text-lg text-[#314523]">
              {total === 0
                ? t('Listen fylder sig selv ud, når gæsterne svarer og reserverer gaver.')
                : filter === 'takket' ? t('I har ikke takket nogen endnu.')
                : filter === 'mangler' ? t('Alle er takket. Flot klaret.')
                : t('Ingen matcher din søgning.')}
            </p>
          </div>
        )}

        <AnimatePresence>
          {adding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-3 rounded-[18px] border border-[#d3dcc4] bg-[#eef1e6] px-5 py-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-[#c4bfae]">
                  <Plus size={14} className="text-[#314523]" />
                </span>
                <input
                  ref={newInputRef} value={newName} onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitAdd(); if (e.key === 'Escape') setAdding(false); }}
                  placeholder={t('Hvem mangler på listen?')}
                  aria-label={t('Hvem mangler på listen?')}
                  className="min-w-0 flex-1 bg-transparent text-base font-semibold text-[#314523] placeholder:text-[#9a9686] focus:outline-none"
                />
                <button type="button" onClick={commitAdd}
                  className="flex h-8 items-center gap-1.5 rounded-full bg-[#314523] px-3 text-xs font-semibold text-[#f7f5ef] cursor-pointer">
                  {t('Gem')}
                </button>
                <button type="button" onClick={() => setAdding(false)}
                  className="text-sm font-medium text-[#6c7561] hover:text-[#314523] cursor-pointer">
                  {t('Annuller')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {visible.map((entry) => (
          <ThankRow
            key={entry.key}
            entry={entry}
            open={openId === entry.key}
            onOpen={() => setOpenId((k) => (k === entry.key ? null : entry.key))}
            onToggle={() => toggle(entry)}
            onMethod={(m) => setMethod(entry, m)}
            onNote={(n) => setNote(entry, n)}
          />
        ))}
      </div>
    </motion.section>
  );
}

/* ── One person on the list ───────────────────────────────────────────── */
function ThankRow({ entry, open, onOpen, onToggle, onMethod, onNote }: {
  entry: ThankEntry;
  open: boolean;
  onOpen: () => void;
  onToggle: () => void;
  onMethod: (m: ThankMethod) => void;
  onNote: (n: string) => void;
}) {
  const { t } = useLang();
  const [note, setNoteDraft] = useState(entry.note ?? '');
  const done = Boolean(entry.thankedAt);

  return (
    <div className={cn('rounded-[18px] border px-5 py-4', taskRowTone(done ? 'done' : 'default'))}>
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <TaskCheckbox done={done} label={entry.name} onToggle={onToggle} />

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={cn('text-base font-semibold', done ? doneLabelClass : 'text-[#314523]')}>
            {entry.name}
          </span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-[#6c7561]">
            {entry.gift && (
              <span className="flex items-center gap-1.5">
                <Gift size={12} className="shrink-0" />
                {entry.gift}
              </span>
            )}
            {entry.email && (
              // No send button anywhere in the app — mailto is the honest option.
              <a href={`mailto:${entry.email}`} className="flex items-center gap-1.5 hover:text-[#314523]">
                <Mail size={12} className="shrink-0" />
                {entry.email}
              </a>
            )}
            {!entry.attended && !entry.gift && (
              <span className="text-[#9a9686]">{t('Kom ikke')}</span>
            )}
          </div>
        </div>

        {done && entry.method && (
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7a9068]">
            {t(methodLabel(entry.method) ?? '')}
          </span>
        )}

        <button
          type="button"
          onClick={onOpen}
          aria-expanded={open}
          aria-label={t('Detaljer for {name}', { name: entry.name })}
          className="flex size-8 items-center justify-center rounded-full text-[#9a9686] transition-colors hover:bg-white/70 hover:text-[#314523] cursor-pointer"
        >
          <StickyNote size={16} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 flex flex-col gap-3 border-t border-[#e4e0d4] pt-4">
              {entry.message && (
                <div className="rounded-[14px] bg-white/60 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9a9686]">
                    {t('De skrev')}
                  </p>
                  <p className="mt-1 text-sm italic leading-relaxed text-[#314523]">{entry.message}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9a9686]">
                  {t('Takket via')}
                </span>
                {THANK_METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onMethod(m.id)}
                    className={cn(
                      'flex h-7 items-center rounded-full px-3 text-xs font-semibold transition-colors cursor-pointer',
                      entry.method === m.id
                        ? 'bg-[#314523] text-[#f7f5ef]'
                        : 'border border-[#e4e0d4] bg-white/60 text-[#6c7561] hover:text-[#314523]',
                    )}
                  >
                    {t(m.label)}
                  </button>
                ))}
              </div>

              <input
                value={note}
                onChange={(e) => setNoteDraft(e.target.value)}
                onBlur={() => note !== (entry.note ?? '') && onNote(note)}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                placeholder={t('Privat note — fx hvad I gav igen')}
                aria-label={t('Privat note — fx hvad I gav igen')}
                className="h-10 rounded-[12px] border border-[#e4e0d4] bg-white/60 px-3.5 text-sm text-[#314523] placeholder:text-[#9a9686] focus:outline-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
