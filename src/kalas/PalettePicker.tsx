import { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from './ui';
import { useLang } from './i18n';

export type WeddingPalette = {
  id: string;
  name: string;
  category: 'romantisk' | 'klassisk' | 'naturel' | 'dramatisk' | 'pastel';
  swatches: readonly [string, string, string, string, string];
  inviteBg: string;
  inviteInk: string;
  inviteAccent: string;
};

export const DEFAULT_CUSTOM_SWATCHES: [string, string, string, string, string] = [
  '#C47B90', '#8FA8B2', '#D4BFBC', '#EDE3D0', '#FAF8F5',
];

export function getActivePalette(
  id: string | null,
  customSwatches: [string, string, string, string, string] = DEFAULT_CUSTOM_SWATCHES,
): WeddingPalette {
  if (id === 'custom') {
    return {
      id: 'custom', name: 'Egne farver', category: 'romantisk',
      swatches: customSwatches,
      inviteBg: customSwatches[4],
      inviteInk: '#2E3020',
      inviteAccent: customSwatches[0],
    };
  }
  return WEDDING_PALETTES.find(p => p.id === id) ?? WEDDING_PALETTES[0];
}

export const WEDDING_PALETTES: WeddingPalette[] = [
  // ── Romantisk ─────────────────────────────────────────────────────────
  {
    id: 'rose-guld', name: 'Rose & Guld', category: 'romantisk',
    swatches: ['#C8A4A4', '#E8C4B8', '#D4A26A', '#F5E6D3', '#FAF3EE'],
    inviteBg: '#FAF3EE', inviteInk: '#5A3A3A', inviteAccent: '#C8A4A4',
  },
  {
    id: 'garden-party', name: 'Garden Party', category: 'romantisk',
    swatches: ['#8FAF82', '#E8C4B8', '#D4B28A', '#D4B5B5', '#FAF8F5'],
    inviteBg: '#FAF8F5', inviteInk: '#3A4A35', inviteAccent: '#8FAF82',
  },
  {
    id: 'burgundy', name: 'Burgundy Romance', category: 'romantisk',
    swatches: ['#6B2D3E', '#B07070', '#D4A26A', '#E8D5C8', '#FAF3EE'],
    inviteBg: '#F5EDE8', inviteInk: '#4A1A28', inviteAccent: '#6B2D3E',
  },
  {
    id: 'terra-cotta', name: 'Terra Cotta', category: 'romantisk',
    swatches: ['#B4503B', '#C87850', '#D4A870', '#EDE3D0', '#FAF5EE'],
    inviteBg: '#FAF5EE', inviteInk: '#4A2018', inviteAccent: '#B4503B',
  },
  // ── Klassisk ──────────────────────────────────────────────────────────
  {
    id: 'ivory-guld', name: 'Ivory & Guld', category: 'klassisk',
    swatches: ['#8A7050', '#C4B28A', '#D4A226', '#E8D5A3', '#FAF5E8'],
    inviteBg: '#FAF5E8', inviteInk: '#3A2E1A', inviteAccent: '#D4A226',
  },
  {
    id: 'hvid-sort', name: 'Hvid & Sort', category: 'klassisk',
    swatches: ['#1A1818', '#2C2C2A', '#6B6860', '#C4C0B8', '#FAF8F5'],
    inviteBg: '#FAF8F5', inviteInk: '#1A1818', inviteAccent: '#6B6860',
  },
  {
    id: 'cobalt-creme', name: 'Cobalt & Creme', category: 'klassisk',
    swatches: ['#1A3A6B', '#2E6CA8', '#6BA8D4', '#F5E6C8', '#FAF5EC'],
    inviteBg: '#FAF5EC', inviteInk: '#1A3A6B', inviteAccent: '#2E6CA8',
  },
  {
    id: 'champagne-mauve', name: 'Champagne & Mauve', category: 'klassisk',
    swatches: ['#C47B90', '#8FA8B2', '#D4BFBC', '#EDE3D0', '#FAF8F5'],
    inviteBg: '#FAF8F5', inviteInk: '#4A2E38', inviteAccent: '#C47B90',
  },
  // ── Naturel ───────────────────────────────────────────────────────────
  {
    id: 'skov', name: 'Skovens Farver', category: 'naturel',
    swatches: ['#3A4F37', '#7A9E8A', '#AEB080', '#D8D4C4', '#F3F1E6'],
    inviteBg: '#F3F1E6', inviteInk: '#2E3A2B', inviteAccent: '#7A9E8A',
  },
  {
    id: 'botanisk', name: 'Botanisk', category: 'naturel',
    swatches: ['#2A4A37', '#7A9E8A', '#C4784A', '#E8D4B8', '#F5F0E8'],
    inviteBg: '#F5F0E8', inviteInk: '#2A3A2E', inviteAccent: '#C4784A',
  },
  {
    id: 'stranddage', name: 'Stranddage', category: 'naturel',
    swatches: ['#2A5F6E', '#6AAAB0', '#D4C4A0', '#EEE8D8', '#FAF8F2'],
    inviteBg: '#FAF8F2', inviteInk: '#1E4850', inviteAccent: '#6AAAB0',
  },
  {
    id: 'grasslands', name: 'Grasslands', category: 'naturel',
    swatches: ['#595A23', '#8A8B45', '#B4503B', '#D8D4B8', '#F5F2E6'],
    inviteBg: '#F5F2E6', inviteInk: '#3A3B15', inviteAccent: '#595A23',
  },
  {
    id: 'moss-moonbeam', name: 'Moss & Moonbeam', category: 'naturel',
    swatches: ['#6A7A3A', '#A4B050', '#C8D2F0', '#E4EAD8', '#F5F8F5'],
    inviteBg: '#F5F8F5', inviteInk: '#3A4220', inviteAccent: '#6A7A3A',
  },
  // ── Dramatisk ─────────────────────────────────────────────────────────
  {
    id: 'midnat', name: 'Midnat', category: 'dramatisk',
    swatches: ['#1A1A2E', '#2E2E5E', '#D4A226', '#F5E6C8', '#FAF3EE'],
    inviteBg: '#1A1A2E', inviteInk: '#F3EED8', inviteAccent: '#D4A226',
  },
  {
    id: 'sorte-roser', name: 'Sorte Roser', category: 'dramatisk',
    swatches: ['#1A1212', '#4A1020', '#B06060', '#D4A226', '#F5E6D3'],
    inviteBg: '#1A1212', inviteInk: '#F3EAE4', inviteAccent: '#B06060',
  },
  {
    id: 'velvet-luxe', name: 'Velvet Luxe', category: 'dramatisk',
    swatches: ['#3A1A4A', '#6B2D6E', '#C87890', '#D4B040', '#FAF0EC'],
    inviteBg: '#3A1A4A', inviteInk: '#F5EDF5', inviteAccent: '#D4B040',
  },
  {
    id: 'cabernet', name: 'Cabernet & Ivoire', category: 'dramatisk',
    swatches: ['#4A0E20', '#7A2840', '#C47B90', '#EDE3D0', '#FAF8F5'],
    inviteBg: '#4A0E20', inviteInk: '#FAF0EC', inviteAccent: '#C47B90',
  },
  // ── Pastel ────────────────────────────────────────────────────────────
  {
    id: 'lyseroed', name: 'Lyserød Forår', category: 'pastel',
    swatches: ['#F4C2C2', '#E8B0C0', '#D4B8D4', '#C4D4E8', '#F5F0F8'],
    inviteBg: '#FDF6F6', inviteInk: '#5A3848', inviteAccent: '#E8B0C0',
  },
  {
    id: 'himmelblaa', name: 'Himmelblå', category: 'pastel',
    swatches: ['#B8D8F0', '#98C0E8', '#C8D4F8', '#E8D4E8', '#F5F0F8'],
    inviteBg: '#F5F8FD', inviteInk: '#2A4060', inviteAccent: '#98C0E8',
  },
  {
    id: 'pastel-have', name: 'Pastel Have', category: 'pastel',
    swatches: ['#C8E8D0', '#F0C8C0', '#D8C8E8', '#F8E4B8', '#F8F4EC'],
    inviteBg: '#F8F4EC', inviteInk: '#3A4838', inviteAccent: '#C8E8D0',
  },
  {
    id: 'bluebell', name: 'Bluebell & Lys', category: 'pastel',
    swatches: ['#6A88B0', '#C087CA', '#F2D9C4', '#EDE3D0', '#FAF8F5'],
    inviteBg: '#FAF8F5', inviteInk: '#2A3850', inviteAccent: '#6A88B0',
  },
];

type Category = 'alle' | WeddingPalette['category'];

const CATS: Array<{ id: Category; label: string }> = [
  { id: 'alle',      label: 'Alle' },
  { id: 'romantisk', label: 'Romantisk' },
  { id: 'klassisk',  label: 'Klassisk' },
  { id: 'naturel',   label: 'Naturel' },
  { id: 'dramatisk', label: 'Dramatisk' },
  { id: 'pastel',    label: 'Pastel' },
];

const SWATCH_LABELS = ['Primær', 'Tone 2', 'Tone 3', 'Tone 4', 'Baggrund'];

export default function PalettePicker({
  value, onChange, nullable = false,
  customSwatches: propCustomSwatches,
  onCustomSwatchesChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  nullable?: boolean;
  customSwatches?: [string, string, string, string, string];
  onCustomSwatchesChange?: (s: [string, string, string, string, string]) => void;
}) {
  const { t } = useLang();
  const [cat, setCat] = useState<Category>('alle');
  const [internalCustom, setInternalCustom] = useState<[string, string, string, string, string]>(DEFAULT_CUSTOM_SWATCHES);

  const customSwatches = propCustomSwatches ?? internalCustom;
  const setCustomSwatch = (index: number, color: string) => {
    const next = [...customSwatches] as [string, string, string, string, string];
    next[index] = color;
    setInternalCustom(next);
    onCustomSwatchesChange?.(next);
  };

  const visible = cat === 'alle'
    ? WEDDING_PALETTES
    : WEDDING_PALETTES.filter((p) => p.category === cat);

  return (
    <div>
      {/* Category filter pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {CATS.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={cn(
              'rounded-full px-3 py-1 text-[0.7rem] font-medium transition-all cursor-pointer',
              cat === c.id
                ? 'bg-ink text-canvas'
                : 'bg-shell text-muted hover:bg-sage-tint hover:text-ink',
            )}>
            {t(c.label)}
          </button>
        ))}
        {nullable && value !== null && (
          <button
            onClick={() => onChange(null)}
            className="rounded-full px-3 py-1 text-[0.7rem] font-medium transition-all cursor-pointer bg-shell text-muted hover:text-ink">
            {t('Nulstil ×')}
          </button>
        )}
      </div>

      {/* Palette grid */}
      <motion.div
        key={cat}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18 }}
        className="grid gap-2"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))' }}>

        {visible.map((p) => {
          const active = value === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onChange(p.id)}
              className={cn(
                'group flex flex-col gap-1.5 rounded-xl p-1.5 text-left cursor-pointer transition-all',
                active
                  ? 'ring-2 ring-ink bg-card'
                  : 'ring-1 ring-[var(--color-line)] hover:bg-card/60 hover:ring-ink/20',
              )}>
              <div className="flex h-8 overflow-hidden rounded-lg w-full">
                {p.swatches.map((c, i) => (
                  <div key={i} className="flex-1" style={{ background: c }} />
                ))}
              </div>
              <span className={cn(
                'text-[0.64rem] font-medium leading-tight pl-0.5 truncate w-full transition-colors',
                active ? 'text-ink' : 'text-muted group-hover:text-ink-soft',
              )}>
                {t(p.name)}
              </span>
            </button>
          );
        })}

        {/* Custom palette card — always shown */}
        <button
          onClick={() => onChange('custom')}
          className={cn(
            'group flex flex-col gap-1.5 rounded-xl p-1.5 text-left cursor-pointer transition-all',
            value === 'custom'
              ? 'ring-2 ring-ink bg-card'
              : 'ring-1 ring-[var(--color-line)] hover:bg-card/60 hover:ring-ink/20',
          )}>
          <div className="flex h-8 overflow-hidden rounded-lg w-full">
            {customSwatches.map((c, i) => (
              <div key={i} className="flex-1" style={{ background: c }} />
            ))}
          </div>
          <span className={cn(
            'text-[0.64rem] font-medium leading-tight pl-0.5 truncate w-full transition-colors',
            value === 'custom' ? 'text-ink' : 'text-muted group-hover:text-ink-soft',
          )}>
            {t('+ Egne farver')}
          </span>
        </button>
      </motion.div>

      {/* Custom color pickers — shown when custom palette is active */}
      {value === 'custom' && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-[var(--color-line)]">
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-muted mb-4">{t('Tilpas dine 5 farver')}</p>
          <div className="flex gap-4 flex-wrap">
            {customSwatches.map((color, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <label className="relative cursor-pointer block">
                  <div
                    className="w-11 h-11 rounded-full shadow-sm ring-2 ring-white/60 ring-offset-1"
                    style={{ background: color }}
                  />
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setCustomSwatch(i, e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full rounded-full"
                  />
                </label>
                <span className="text-[0.58rem] text-muted leading-none text-center">{SWATCH_LABELS[i]}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
