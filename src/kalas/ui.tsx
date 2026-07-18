import * as React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { IMAGES } from './data';

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

/** Shared page gutters — keep Home / Timeline / Budget / Venues aligned. */
export const pagePad = 'px-6 py-8 sm:px-9 lg:px-12 lg:py-8';
export const pagePadX = 'px-6 sm:px-9 lg:px-12';

/** Shared action-button size — matches shell “Spørg Ava” (h-8 / text-xs). */
export const btnSize =
  'inline-flex h-8 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold';

/* ── Eyebrow / tracked label ─────────────────────────────────────────── */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('eyebrow', className)}>{children}</p>;
}

/* ── Pill button — matches shell “Spørg Ava” size (h-8). ─────────────── */
export function Pill({
  children,
  onClick,
  variant = 'solid',
  arrow = false,
  className,
  type = 'button',
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'solid' | 'ghost' | 'outline';
  arrow?: boolean;
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const base = cn(
    'group cursor-pointer transition-colors duration-200 disabled:opacity-40 disabled:cursor-default',
    btnSize,
    'tracking-[0.12em] uppercase',
  );
  const styles = {
    solid: 'bg-sage text-ink hover:bg-sage-strong',
    outline: 'rule text-ink hover:bg-card',
    ghost: 'px-2 text-muted hover:text-ink',
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cn(base, styles, className)}>
      {children}
      {arrow && <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />}
    </button>
  );
}

/* ── Full-bleed image — edge to edge, no inner frame. Pinterest feel. ─── */
export function Bleed({
  src,
  alt,
  className,
  rounded = 'rounded-none',
}: {
  src: keyof typeof IMAGES | string;
  alt: string;
  className?: string;
  rounded?: string;
}) {
  const url = (src as string) in IMAGES ? IMAGES[src as keyof typeof IMAGES] : (src as string);
  return (
    <div className={cn('relative overflow-hidden bg-shell', rounded, className)}>
      <img
        src={url}
        alt={alt}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out hover:scale-[1.04]"
      />
    </div>
  );
}

/* ── Hairline divider ────────────────────────────────────────────────── */
export function Rule({ className }: { className?: string }) {
  return <div className={cn('rule-t', className)} />;
}

/* ── Section header — eyebrow + serif display ────────────────────────── */
export function SectionHead({
  eyebrow,
  title,
  action,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-end justify-between gap-6', className)}>
      <div className="space-y-3">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 className="display text-3xl md:text-[2.5rem] text-ink">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/* ── Status chip (tiny) ──────────────────────────────────────────────── */
export function Chip({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'sage' | 'clay' | 'success';
}) {
  const tones = {
    neutral: 'text-muted rule',
    sage: 'text-ink bg-sage-tint',
    clay: 'text-[#7a543c] bg-[#ecdcd0]',
    success: 'text-[#3f5436] bg-[#dde7d6]',
  }[tone];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.14em]', tones)}>
      {children}
    </span>
  );
}

/* ── Preview note ────────────────────────────────────────────────────────
   Marks a design-only screen: the layout is real, but nothing here is saved
   to the couple's wedding yet. Keeps the app honest about what persists. */
export function PreviewNote({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mx-auto mb-6 flex max-w-fit items-center gap-2 rounded-full bg-sage-tint px-4 py-2 text-[0.72rem] font-medium tracking-[0.04em] text-ink">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-sage-strong" />
      {children ?? 'Forhåndsvisning — Ava arbejder på at gøre denne del interaktiv. Ændringer gemmes endnu ikke.'}
    </div>
  );
}

/* ── Animated screen wrapper ─────────────────────────────────────────── */
export function Screen({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* Stagger helpers for editorial reveals. */
export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};
