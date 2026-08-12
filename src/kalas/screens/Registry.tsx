"use client";

/* Ønskeliste — the couple's gift registry. Paste a product URL and we fetch its
   title/image/price/store via Jina Reader, or add a wish by hand for the ones
   with no web shop behind them. Guests reserve gifts from the public site
   (registry_claims); reservations show here live. The tile itself is GiftCard,
   shared with both public-site renderers so the two surfaces match. */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Plus, Trash2, Link2, Check, Pencil, ExternalLink, Heart } from 'lucide-react';
import { useWedding } from '../useWedding';
import { useLang } from '../i18n';
import { Pill, cn } from '../ui';
import GiftCard from '../registry/GiftCard';
import { sortGifts, claimedCount } from '../registry/gifts';
import type { RegistryItemRow } from '@/lib/db/types';

/** An item being written: a fresh wish has no id, an edit carries one. */
type Draft = Partial<RegistryItemRow> & { id?: string };

const EMPTY: Draft = { title: '', currency: 'DKK', quantity: 1, favourite: false };

export default function Registry({ onNavigate }: { onNavigate?: (s: import('../Shell').ScreenId) => void }) {
  const { t } = useLang();
  const { registryItems, registryClaims, addRegistryItem, updateRegistryItem, deleteRegistryItem } = useWedding();
  const [url, setUrl] = useState('');
  const [looking, setLooking] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const claimsForItem = (id: string) => registryClaims.filter((c) => c.item_id === id);
  const items = sortGifts(registryItems);

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
        ...EMPTY,
        title: info.title ?? '',
        image_url: info.image ?? null,
        product_url: clean,
        store_name: info.storeName ?? null,
        price_cents: info.priceCents ?? null,
        currency: info.currency ?? 'DKK',
      });
      setUrl('');
    } finally { setLooking(false); }
  };

  const save = async () => {
    if (!draft?.title?.trim()) return;
    const patch = {
      title: draft.title.trim(),
      description: draft.description?.trim() || null,
      image_url: draft.image_url?.trim() || null,
      product_url: draft.product_url?.trim() || null,
      store_name: draft.store_name?.trim() || null,
      price_cents: draft.price_cents ?? null,
      currency: draft.currency ?? 'DKK',
      quantity: draft.quantity && draft.quantity > 0 ? draft.quantity : 1,
      favourite: Boolean(draft.favourite),
    };
    if (draft.id) await updateRegistryItem(draft.id, patch);
    else await addRegistryItem({ ...patch, sort: registryItems.length });
    setDraft(null);
  };

  /** Starring from the tile writes straight through — no need to open the editor
   *  to change one's mind about a favourite. */
  const toggleFavourite = (it: RegistryItemRow) =>
    void updateRegistryItem(it.id, { favourite: !it.favourite });

  const editing = draft?.id ? registryItems.find((it) => it.id === draft.id) ?? null : null;
  const editingClaims = editing ? claimsForItem(editing.id) : [];

  return (
    <div className="px-6 py-8 sm:px-9 lg:px-12 lg:py-8">
      <h1 className="font-serif text-[clamp(2rem,4vw,2.4rem)] leading-[1.1] tracking-[-0.02em] text-[#314523]">
        {t('Ønskeliste')}
      </h1>
      <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-[#6c7561]">
        {t('Indsæt et link til en gave, så henter vi billede og pris. Gæsterne kan reservere den fra jeres bryllupsside — så to ikke køber det samme.')}
      </p>

      {/* Add */}
      <div className="mt-8 flex flex-wrap items-center gap-2 rounded-2xl rule bg-card p-2">
        <div className="flex flex-1 items-center gap-2 px-3">
          <Link2 size={16} className="shrink-0 text-muted" />
          <input value={url} onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void lookup(); }}
            placeholder={t('Indsæt produktlink (fx fra en webshop)…')}
            className="flex-1 bg-transparent py-2.5 text-[0.92rem] text-ink placeholder:text-muted focus:outline-none" />
        </div>
        <button onClick={() => setDraft({ ...EMPTY })}
          className="rounded-full px-3 py-2.5 text-[0.78rem] text-muted hover:text-ink transition-colors cursor-pointer">
          {t('Tilføj uden link')}
        </button>
        <button onClick={lookup} disabled={looking || !url.trim()}
          className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[0.8rem] font-medium text-canvas hover:bg-ink/90 transition-colors cursor-pointer disabled:opacity-50">
          {looking ? t('Henter…') : <><Plus size={14} /> {t('Tilføj')}</>}
        </button>
      </div>

      {/* Editor — one panel for a new wish and for editing a saved one */}
      <AnimatePresence>
        {draft && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="mt-3 rounded-2xl rule bg-card p-4">
              <p className="mb-3 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted">
                {draft.id ? t('Rediger ønske') : t('Nyt ønske')}
              </p>
              <div className="flex flex-wrap gap-4 sm:flex-nowrap">
                <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-shell">
                  {draft.image_url
                    ? <img src={draft.image_url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                    : <div className="flex h-full w-full items-center justify-center bg-sage-tint"><Gift size={22} className="text-ink/30" /></div>}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <input value={draft.title ?? ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder={t('Gavens navn')} autoFocus
                    className="w-full rounded-lg rule bg-canvas px-3 py-2 font-serif text-[1rem] text-ink focus:border-ink focus:outline-none" />
                  <div className="flex flex-wrap gap-2">
                    <input value={draft.price_cents != null ? String(draft.price_cents / 100) : ''}
                      onChange={(e) => { const n = Number(e.target.value.replace(/[^\d.]/g, '')); setDraft({ ...draft, price_cents: Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null }); }}
                      placeholder={t('Pris')} inputMode="decimal"
                      className="w-24 rounded-lg rule bg-canvas px-3 py-1.5 text-[0.85rem] text-ink focus:border-ink focus:outline-none" />
                    <input value={draft.store_name ?? ''} onChange={(e) => setDraft({ ...draft, store_name: e.target.value })}
                      placeholder={t('Butik')}
                      className="min-w-[120px] flex-1 rounded-lg rule bg-canvas px-3 py-1.5 text-[0.85rem] text-ink focus:border-ink focus:outline-none" />
                    <input value={draft.quantity ?? 1} type="number" min={1}
                      onChange={(e) => setDraft({ ...draft, quantity: Math.max(1, Number(e.target.value) || 1) })}
                      aria-label={t('Antal')} title={t('Antal')}
                      className="w-20 rounded-lg rule bg-canvas px-3 py-1.5 text-[0.85rem] text-ink focus:border-ink focus:outline-none" />
                  </div>
                  <input value={draft.image_url ?? ''} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                    placeholder={t('Billedlink')}
                    className="w-full rounded-lg rule bg-canvas px-3 py-1.5 text-[0.8rem] text-muted focus:border-ink focus:text-ink focus:outline-none" />
                  <textarea value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    placeholder={t('En note til gæsterne — farve, størrelse, hvor I helst vil have den fra')} rows={2}
                    className="w-full resize-none rounded-lg rule bg-canvas px-3 py-2 text-[0.82rem] text-ink placeholder:text-muted focus:border-ink focus:outline-none" />

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button onClick={() => setDraft({ ...draft, favourite: !draft.favourite })}
                      aria-pressed={Boolean(draft.favourite)}
                      className={cn('flex items-center gap-1.5 rounded-full px-3 py-2 text-[0.78rem] transition-colors cursor-pointer',
                        draft.favourite ? 'bg-[var(--color-terracotta-tint)] text-[var(--color-terracotta)]' : 'rule text-muted hover:text-ink')}>
                      <Heart size={13} className={draft.favourite ? 'fill-current' : ''} /> {t('Ønskes mest')}
                    </button>
                    <button onClick={save} disabled={!draft.title?.trim()}
                      className="flex items-center gap-1.5 rounded-full bg-sage px-4 py-2 text-[0.78rem] font-medium text-ink hover:bg-sage-strong transition-colors cursor-pointer disabled:opacity-50">
                      <Check size={14} /> {draft.id ? t('Gem ændringer') : t('Gem på listen')}
                    </button>
                    <button onClick={() => setDraft(null)} className="rounded-full px-3 py-2 text-[0.78rem] text-muted hover:text-ink cursor-pointer">{t('Annuller')}</button>
                    {!draft.title?.trim() && (
                      <span className="text-[0.74rem] text-muted">{t('Giv ønsket et navn, så kan I gemme det.')}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Who reserved it, and what they wrote. This used to sit on every
                  card, where it was the single biggest thing on the screen. */}
              {editing && editingClaims.length > 0 && (
                <div className="mt-4 rule-t pt-3">
                  <p className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted">{t('Reserveret af')}</p>
                  <div className="mt-1.5 space-y-1.5">
                    {editingClaims.map((c) => (
                      <div key={c.id}>
                        <p className="text-[0.8rem] font-medium text-ink">{c.guest_name}</p>
                        {c.message && <p className="text-[0.76rem] italic leading-snug text-muted">{c.message}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The grid */}
      {items.length === 0 && !draft ? (
        <div className="mt-14 flex flex-col items-center justify-center rounded-2xl rule bg-card py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-tint"><Gift size={22} className="text-ink" /></div>
          <p className="mt-4 font-serif text-[1.2rem] text-ink">{t('Ingen ønsker endnu')}</p>
          <p className="mt-1 max-w-sm text-[0.88rem] text-muted">{t('Indsæt jeres første gavelink ovenfor.')}</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {items.map((it) => {
            const claimed = claimedCount(claimsForItem(it.id));
            const reserved = claimed >= it.quantity;
            return (
              <div key={it.id} className="flex flex-col gap-1.5">
                <GiftCard
                  item={it}
                  reserved={reserved}
                  reservedBy={claimsForItem(it.id)[0]?.guest_name ?? null}
                  actions={
                    <>
                      <TileButton label={t('Rediger')} onClick={() => setDraft({ ...it })}><Pencil size={15} /></TileButton>
                      <TileButton label={t('Ønskes mest')} onClick={() => toggleFavourite(it)}>
                        <Heart size={15} className={it.favourite ? 'fill-[var(--color-terracotta)] text-[var(--color-terracotta)]' : ''} />
                      </TileButton>
                      {it.product_url && (
                        <TileButton label={t('Åbn produkt')} href={it.product_url}><ExternalLink size={15} /></TileButton>
                      )}
                      <TileButton label={t('Fjern ønske')} tone="danger" onClick={() => setConfirmDelete(it.id)}>
                        <Trash2 size={15} />
                      </TileButton>
                    </>
                  }
                />

                {/* Confirming inline rather than in a dialog: deleting used to
                    happen on a single click, with no way back. */}
                {confirmDelete === it.id && (
                  <div className="rounded-xl border border-[#e2b9ab] bg-[#faf4ef] px-3 py-2.5">
                    <p className="text-[0.78rem] text-ink">{t('Slet “{title}”?', { title: it.title })}</p>
                    <div className="mt-1.5 flex gap-2">
                      <button onClick={() => { setConfirmDelete(null); void deleteRegistryItem(it.id); }}
                        className="rounded-full bg-[var(--color-terracotta)] px-3 py-1 text-[0.72rem] font-medium text-white cursor-pointer">
                        {t('Ja, slet')}
                      </button>
                      <button onClick={() => setConfirmDelete(null)}
                        className="rounded-full px-2 py-1 text-[0.72rem] text-muted hover:text-ink cursor-pointer">
                        {t('Fortryd')}
                      </button>
                    </div>
                  </div>
                )}

                {!reserved && claimed > 0 && (
                  <p className="px-1 text-[0.72rem] text-muted">{t('{n}/{q} reserveret', { n: claimed, q: it.quantity })}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-8 flex items-center gap-3 rule-t pt-6">
          <p className="text-[0.85rem] text-muted">{t('Ønskelisten vises automatisk på jeres bryllupsside under “Gaveønsker”.')}</p>
          {onNavigate && <Pill variant="ghost" arrow onClick={() => onNavigate('website')}>{t('Åbn hjemmeside')}</Pill>}
        </div>
      )}
    </div>
  );
}

/** Round control on the tile's hover overlay. Renders as a link when it has an
 *  href so "open product" keeps middle-click and copy-link. */
function TileButton({ label, onClick, href, tone, children }: {
  label: string;
  onClick?: () => void;
  href?: string;
  tone?: 'danger';
  children: React.ReactNode;
}) {
  const className = cn(
    'flex h-8 w-8 items-center justify-center rounded-full bg-card transition-colors cursor-pointer',
    tone === 'danger' ? 'text-[var(--color-terracotta)] hover:bg-[#faf4ef]' : 'text-ink hover:bg-shell',
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className={className}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={className}>
      {children}
    </button>
  );
}
