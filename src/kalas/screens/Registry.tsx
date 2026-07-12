"use client";

/* Ønskeliste — the couple's gift registry. Paste a product URL, we fetch its
   title/image/price/store via Jina Reader, and it saves to registry_items.
   Guests reserve gifts from the public site (registry_claims); reservations
   show here live. Everything persists via useWedding's registry mutators. */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Plus, Trash2, Link2, Check, X } from 'lucide-react';
import { useWedding } from '../useWedding';
import { useLang } from '../i18n';
import { Eyebrow, Pill, cn } from '../ui';
import type { RegistryItemRow } from '@/lib/db/types';

export default function Registry({ onNavigate }: { onNavigate?: (s: import('../Shell').ScreenId) => void }) {
  const { t } = useLang();
  const { registryItems, registryClaims, addRegistryItem, updateRegistryItem, deleteRegistryItem } = useWedding();
  const [url, setUrl] = useState('');
  const [looking, setLooking] = useState(false);
  const [draft, setDraft] = useState<Partial<RegistryItemRow> | null>(null);

  const claimsFor = (id: string) => registryClaims.filter((c) => c.item_id === id).reduce((n, c) => n + (c.quantity ?? 1), 0);

  const lookup = async () => {
    const clean = url.trim();
    if (!clean) return;
    setLooking(true);
    try {
      const res = await fetch('/api/registry/lookup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: clean }),
      });
      const info = res.ok ? await res.json() : {};
      setDraft({
        title: info.title ?? '',
        image_url: info.image ?? null,
        product_url: clean,
        store_name: info.storeName ?? null,
        price_cents: info.priceCents ?? null,
        currency: info.currency ?? 'DKK',
        quantity: 1,
      });
      setUrl('');
    } finally { setLooking(false); }
  };

  const save = async () => {
    if (!draft?.title?.trim()) return;
    await addRegistryItem({
      title: draft.title.trim(),
      image_url: draft.image_url ?? null,
      product_url: draft.product_url ?? null,
      store_name: draft.store_name ?? null,
      price_cents: draft.price_cents ?? null,
      currency: draft.currency ?? 'DKK',
      quantity: draft.quantity ?? 1,
      sort: registryItems.length,
    });
    setDraft(null);
  };

  return (
    <div className="px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
      <Eyebrow>{t('Ønskeliste')}</Eyebrow>
      <h1 className="display mt-4 text-[clamp(2.5rem,5vw,4rem)] text-ink">
        {t('Gaver, I faktisk')} <span className="italic">{t('ønsker jer')}</span>
      </h1>
      <p className="mt-3 max-w-lg text-[0.9rem] text-ink-soft">
        {t('Indsæt et link til en gave, så henter vi billede og pris. Gæsterne kan reservere den fra jeres bryllupsside — så to ikke køber det samme.')}
      </p>

      {/* Add by URL */}
      <div className="mt-8 flex flex-wrap items-center gap-2 rounded-2xl rule bg-card p-2">
        <div className="flex flex-1 items-center gap-2 px-3">
          <Link2 size={16} className="shrink-0 text-muted" />
          <input value={url} onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void lookup(); }}
            placeholder={t('Indsæt produktlink (fx fra en webshop)…')}
            className="flex-1 bg-transparent py-2.5 text-[0.92rem] text-ink placeholder:text-muted focus:outline-none" />
        </div>
        <button onClick={lookup} disabled={looking || !url.trim()}
          className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[0.8rem] font-medium text-canvas hover:bg-ink/90 transition-colors cursor-pointer disabled:opacity-50">
          {looking ? t('Henter…') : <><Plus size={14} /> {t('Tilføj')}</>}
        </button>
      </div>

      {/* Draft editor */}
      <AnimatePresence>
        {draft && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="mt-3 flex gap-4 rounded-2xl rule bg-card p-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-shell">
                {draft.image_url
                  ? <img src={draft.image_url} alt="" className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full items-center justify-center"><Gift size={22} className="text-muted" /></div>}
              </div>
              <div className="flex-1 space-y-2">
                <input value={draft.title ?? ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder={t('Gavens navn')}
                  className="w-full rounded-lg rule bg-canvas px-3 py-2 font-serif text-[1rem] text-ink focus:border-ink focus:outline-none" />
                <div className="flex flex-wrap gap-2">
                  <input value={draft.price_cents != null ? String(draft.price_cents / 100) : ''}
                    onChange={(e) => { const n = Number(e.target.value.replace(/[^\d.]/g, '')); setDraft({ ...draft, price_cents: Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null }); }}
                    placeholder={t('Pris')} inputMode="decimal"
                    className="w-28 rounded-lg rule bg-canvas px-3 py-1.5 text-[0.85rem] text-ink focus:border-ink focus:outline-none" />
                  <input value={draft.store_name ?? ''} onChange={(e) => setDraft({ ...draft, store_name: e.target.value })}
                    placeholder={t('Butik')}
                    className="flex-1 min-w-[120px] rounded-lg rule bg-canvas px-3 py-1.5 text-[0.85rem] text-ink focus:border-ink focus:outline-none" />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button onClick={save} disabled={!draft.title?.trim()}
                    className="flex items-center gap-1.5 rounded-full bg-sage px-4 py-2 text-[0.78rem] font-medium text-ink hover:bg-sage-strong transition-colors cursor-pointer disabled:opacity-50">
                    <Check size={14} /> {t('Gem på listen')}
                  </button>
                  <button onClick={() => setDraft(null)} className="rounded-full px-3 py-2 text-[0.78rem] text-muted hover:text-ink cursor-pointer">{t('Annuller')}</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {registryItems.length === 0 && !draft ? (
        <div className="mt-14 flex flex-col items-center justify-center rounded-2xl rule bg-card py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-tint"><Gift size={22} className="text-ink" /></div>
          <p className="mt-4 font-serif text-[1.2rem] text-ink">{t('Ingen ønsker endnu')}</p>
          <p className="mt-1 max-w-sm text-[0.88rem] text-muted">{t('Indsæt jeres første gavelink ovenfor.')}</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {registryItems.map((it) => {
            const claimed = claimsFor(it.id);
            const reserved = claimed >= it.quantity;
            return (
              <div key={it.id} className="flex gap-4 rounded-2xl rule bg-card p-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-shell">
                  {it.image_url ? <img src={it.image_url} alt="" className="h-full w-full object-cover" />
                    : <div className="flex h-full w-full items-center justify-center"><Gift size={20} className="text-muted" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-serif text-[1.05rem] text-ink leading-tight">{it.title}</p>
                    <button onClick={() => deleteRegistryItem(it.id)} aria-label={t('Fjern')}
                      className="shrink-0 text-muted/60 hover:text-[var(--color-terracotta)] transition-colors cursor-pointer"><Trash2 size={14} /></button>
                  </div>
                  <p className="mt-0.5 text-[0.8rem] text-muted">
                    {it.price_cents != null ? `${(it.price_cents / 100).toLocaleString('da-DK')} ${it.currency}` : ''}
                    {it.store_name ? `${it.price_cents != null ? ' · ' : ''}${it.store_name}` : ''}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[0.66rem] font-medium uppercase tracking-[0.1em]',
                      reserved ? 'bg-sage-tint text-ink' : 'rule text-muted')}>
                      {reserved ? t('Reserveret') : t('{n}/{q} reserveret', { n: claimed, q: it.quantity })}
                    </span>
                    {it.product_url && (
                      <a href={it.product_url} target="_blank" rel="noopener noreferrer"
                        className="text-[0.72rem] text-muted hover:text-ink transition-colors">{t('Se produkt ↗')}</a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {registryItems.length > 0 && (
        <div className="mt-8 flex items-center gap-3 rule-t pt-6">
          <p className="text-[0.85rem] text-muted">{t('Ønskelisten vises automatisk på jeres bryllupsside under “Gaveønsker”.')}</p>
          {onNavigate && <Pill variant="ghost" arrow onClick={() => onNavigate('website')}>{t('Åbn hjemmeside')}</Pill>}
        </div>
      )}
    </div>
  );
}
