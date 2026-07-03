import * as React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { IMAGES } from './data';

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

/* ── Eyebrow / tracked label ─────────────────────────────────────────── */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('eyebrow', className)}>{children}</p>;
}

/* ── Pill button — sage fill or ghost. The only two button shapes in Kalas. */
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
  const base =
    'group inline-flex items-center justify-center gap-2.5 rounded-full text-[0.8125rem] font-medium tracking-[0.12em] uppercase transition-colors duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-default';
  const styles = {
    solid: 'bg-sage text-ink px-7 py-3.5 hover:bg-sage-strong',
    outline: 'rule text-ink px-7 py-3.5 hover:bg-card',
    ghost: 'text-muted px-2 py-3.5 hover:text-ink',
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cn(base, styles, className)}>
      {children}
      {arrow && <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />}
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
