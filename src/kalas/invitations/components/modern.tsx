'use client';

/* Moderne & minimal — Noir Éditorial, Bauhaus, Parisienne. */

import type { TemplateProps } from '../types';

const up = (s: string) => s.toUpperCase();
const join = (parts: (string | undefined)[], sep: string) => parts.filter(Boolean).join(sep);

/* ── T2 Noir Éditorial ──────────────────────────────────────────────── */
export function NoirEditorial({ data }: TemplateProps) {
  const da = data.language === 'da';
  return (
    <div className="t2 tpl"><div className="fit">
      <div className="top">{data.label}</div>
      <div className="mid">
        <div className="big">{up(data.partnerA)}</div>
        <div className="amp">{da ? 'og' : 'and'}</div>
        <div className="big">{up(data.partnerB)}</div>
      </div>
      <div className="meta">
        <hr />
        <div><div className="kk">{da ? 'Dato' : 'Date'}</div><div className="vv">{data.displayDate}</div></div>
        <hr />
        <div><div className="kk">{da ? 'Sted' : 'Location'}</div><div className="vv">{join([data.venue, data.venueDetail], ' · ')}</div></div>
        <hr />
      </div>
      <div className="foot" style={{ marginTop: 26 }}>R.S.V.P · <b>{data.rsvpLabel || data.venueDetail || data.venue}</b></div>
    </div></div>
  );
}

/* ── T6 Bauhaus ─────────────────────────────────────────────────────── */
export function Bauhaus({ data }: TemplateProps) {
  return (
    <div className="t6 tpl"><div className="fit">
      <div className="block"><span className="k">{data.label}</span><div className="circle" /></div>
      <div className="lo">
        <div className="big">{up(data.partnerA)}</div>
        <div className="amp">&amp;</div>
        <div className="big">{up(data.partnerB)}</div>
        <div className="when">{join([data.displayDate, join([data.venue, data.venueDetail], ' · ')], ' — ')}</div>
      </div>
    </div></div>
  );
}

/* ── T21 Linea ──────────────────────────────────────────────────────── */
export function Linea({ data }: TemplateProps) {
  return (
    <div className="t21 tpl"><div className="fit">
      <div className="lbl-s">{data.label}</div>
      <div className="nm">{up(data.partnerA)}<span className="amp">&amp;</span>{up(data.partnerB)}</div>
      <div className="rule" />
      <div className="when">{join([data.displayDate, join([data.venue, data.venueDetail], ' · ')], ' · ')}</div>
    </div></div>
  );
}

/* ── T22 Atelier ────────────────────────────────────────────────────── */
export function Atelier({ data }: TemplateProps) {
  return (
    <div className="t22 tpl"><div className="fit">
      <div className="lbl-s">{data.label}</div>
      <div className="big">{data.partnerA}<span className="amp">&amp;</span>{data.partnerB}</div>
      <div className="when">{join([data.displayDate, join([data.venue, data.venueDetail], ' · ')], ' — ')}</div>
    </div></div>
  );
}

/* ── T7 Parisienne ──────────────────────────────────────────────────── */
export function Parisienne({ data }: TemplateProps) {
  return (
    <div className="t7 tpl"><div className="fit">
      <svg className="tower" viewBox="0 0 40 70" fill="none" stroke="#1b1813" strokeWidth="1">
        <path d="M20 4 L20 66" />
        <path d="M12 66 L20 4 L28 66" />
        <path d="M15 40 L25 40 M13 54 L27 54 M17 24 L23 24" />
        <path d="M8 66 L32 66" />
      </svg>
      <div className="lbl-s">{data.label}</div>
      <div className="nm">{data.partnerA}<br />&amp; {data.partnerB}</div>
      {data.introLines[0] ? <div className="sub">{data.introLines[0]}</div> : null}
      <div className="rule" />
      <div className="when">{join([data.displayDate, join([data.venue, data.venueDetail], ' · ')], ' · ')}</div>
    </div></div>
  );
}
