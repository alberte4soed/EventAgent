"use client";

/* The couple's monogram: generated from their initials in one of four styles
   that inherit the site's font and colors, or — when the couple has uploaded
   their own SVG/PNG — that image (passed as a pre-signed URL). Used in the
   public site's nav, hero and footer, and in the builder preview. */

import type { CSSProperties } from 'react';
import type { MonogramStyle } from './config';

export function Monogram({
  a, b, style, imageUrl, color, fontFamily, size = 40,
}: {
  a: string;
  b: string;
  style: MonogramStyle;
  imageUrl?: string | null;
  color: string;
  fontFamily?: CSSProperties['fontFamily'];
  size?: number;
}) {
  if (imageUrl) {
    return (
      <img src={imageUrl} alt={`${a} & ${b}`} width={size} height={size}
        style={{ width: size, height: size, objectFit: 'contain' }} />
    );
  }

  const ia = (a.trim()[0] ?? '').toUpperCase();
  const ib = (b.trim()[0] ?? '').toUpperCase();
  if (!ia && !ib) return null;

  const serif = fontFamily ?? 'Georgia, serif';
  const base: CSSProperties = {
    fontFamily: serif, color, lineHeight: 1,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  };

  switch (style) {
    case 'initials-dot':
      return (
        <span style={{ ...base, fontSize: size * 0.52, letterSpacing: '0.08em' }}>
          {ia}<span style={{ opacity: 0.55, margin: `0 ${size * 0.1}px`, fontSize: size * 0.3 }}>·</span>{ib}
        </span>
      );
    case 'stacked':
      return (
        <span style={{ ...base, flexDirection: 'column', gap: 0 }}>
          <span style={{ fontSize: size * 0.42 }}>{ia}</span>
          <span style={{ fontSize: size * 0.42, marginTop: -size * 0.08, fontStyle: 'italic' }}>{ib}</span>
        </span>
      );
    case 'ring':
      return (
        <span style={{
          ...base, fontSize: size * 0.4, width: size, height: size,
          border: `1px solid ${color}`, borderRadius: '50%', letterSpacing: '0.05em',
        }}>
          {ia}{ib}
        </span>
      );
    case 'initials-amp':
    default:
      return (
        <span style={{ ...base, fontSize: size * 0.5 }}>
          {ia}<span style={{ fontStyle: 'italic', opacity: 0.7, margin: `0 ${size * 0.06}px`, fontSize: size * 0.4 }}>&</span>{ib}
        </span>
      );
  }
}
