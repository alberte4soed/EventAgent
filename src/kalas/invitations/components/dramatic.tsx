'use client';

/* Dramatisk & metallisk — Minuit, Céleste, Déco, Émeraude, Champagne, Marbre.
   Minuit/Céleste use the live <Countdown>; Céleste's starfield is generated in
   useEffect (client-only, so it never mismatches SSR); Déco taps open. */

import { useEffect, useRef, useState } from 'react';
import type { TemplateProps } from '../types';
import { Countdown } from '../Countdown';

const compactMono = (a: string, b: string) =>
  `${(a.trim()[0] ?? '').toUpperCase()}&${(b.trim()[0] ?? '').toUpperCase()}`;
const venueLine = (venue: string, detail?: string) => [venue, detail].filter(Boolean).join(' · ');
const join = (parts: (string | undefined)[], sep: string) => parts.filter(Boolean).join(sep);
const up = (s: string) => s.toUpperCase();

/* ── T14 Minuit (countdown) ─────────────────────────────────────────── */
export function Minuit({ data, onRsvp }: TemplateProps) {
  const da = data.language === 'da';
  return (
    <div className="t14 tpl"><div className="fit">
      <div className="arch"><span>{data.monogram}</span></div>
      <div className="lbl-s">{data.label}</div>
      <div className="nm">{data.partnerA}<br />&amp; {data.partnerB}</div>
      <div className="dt">{data.displayDate}</div>
      <div className="cl">{da ? 'Tæller dagene' : 'Counting the days'}</div>
      <Countdown isoDate={data.isoDate} language={data.language} />
      <button className="btn" onClick={() => onRsvp?.()}>{data.rsvpLabel || (da ? 'Bekræft deltagelse' : 'RSVP')}</button>
    </div></div>
  );
}

/* ── T15 Céleste (countdown) ────────────────────────────────────────── */
function Stars() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sky = ref.current;
    if (!sky || sky.childElementCount) return;
    for (let i = 0; i < 38; i++) {
      const st = document.createElement('i');
      st.style.left = Math.random() * 100 + '%';
      st.style.top = Math.random() * 72 + '%';
      st.style.animationDelay = Math.random() * 3 + 's';
      st.style.transform = 'scale(' + (0.6 + Math.random() * 1.3) + ')';
      sky.appendChild(st);
    }
  }, []);
  return <div className="stars" ref={ref} />;
}

export function Celeste({ data }: TemplateProps) {
  const da = data.language === 'da';
  return (
    <div className="t15 tpl">
      <Stars />
      <div className="fit">
        <div className="lbl">{data.label}</div>
        <div className="nm">{data.partnerA}<span className="amp"> &amp; </span>{data.partnerB}</div>
        <div className="dt">{data.displayDate}</div>
        <div className="cl">{da ? 'Nedtælling til vores dag' : 'Counting down to our day'}</div>
        <Countdown isoDate={data.isoDate} language={data.language} />
      </div>
    </div>
  );
}

/* ── T5 Déco (tap to open) ──────────────────────────────────────────── */
export function Deco({ data }: TemplateProps) {
  const [open, setOpen] = useState(false);
  const da = data.language === 'da';
  return (
    <div className={`t5 tpl${open ? ' open' : ''}`} onClick={() => setOpen(true)}>
      <div className="fit closed">
        <div className="fan"><span>{compactMono(data.partnerA, data.partnerB)}</span></div>
        <div className="tt">{data.partnerA} &amp; {data.partnerB}</div>
        <div className="lbl-s tap">{da ? 'Tryk for at åbne' : 'Tap to open'}</div>
      </div>
      <div className="reveal">
        <div className="frameline" />
        <div className="fit">
          <div className="lbl-s" style={{ color: '#c6a55e' }}>{data.label}</div>
          <div className="nm">{up(data.partnerA)}</div>
          <div className="amp">&amp;</div>
          <div className="nm">{up(data.partnerB)}</div>
          <div className="ln lbl-s" style={{ color: '#c8bd8f' }}>{data.displayDate}<br />{join([venueLine(data.venue, data.venueDetail), data.time], ' · ')}</div>
        </div>
      </div>
    </div>
  );
}

/* ── T16 Émeraude ───────────────────────────────────────────────────── */
export function Emeraude({ data }: TemplateProps) {
  return (
    <div className="t16 tpl">
      <div className="frame" />
      <div className="cardfit"><div className="card">
        <div className="lbl">{data.label}</div>
        <div className="nm">{data.partnerA}<span className="amp"> &amp; </span>{data.partnerB}</div>
        <div className="when">{data.displayDate}<br />{venueLine(data.venue, data.venueDetail)}</div>
      </div></div>
    </div>
  );
}

/* ── T17 Champagne (gold foil) ──────────────────────────────────────── */
export function Champagne({ data }: TemplateProps) {
  return (
    <div className="t17 tpl"><div className="cardfit"><div className="card">
      <div className="foilframe" />
      <div className="mono">{compactMono(data.partnerA, data.partnerB)}</div>
      <div className="lbl-s">{data.label}</div>
      <div className="nm">{data.partnerA}<span className="amp"> &amp; </span>{data.partnerB}</div>
      <div className="when">{data.displayDate}<br />{venueLine(data.venue, data.venueDetail)}</div>
    </div></div></div>
  );
}

/* ── T20 Marbre ─────────────────────────────────────────────────────── */
export function Marbre({ data }: TemplateProps) {
  return (
    <div className="t20 tpl">
      <svg className="vein" viewBox="0 0 280 590" preserveAspectRatio="none" fill="none" stroke="#b7ad9c" strokeWidth="1">
        <path d="M-10 120C60 160 120 90 180 150 230 200 240 260 300 250" />
        <path d="M-10 360C70 330 130 420 210 380 250 360 280 400 300 390" />
        <path d="M40 -10C70 80 30 140 90 210" />
      </svg>
      <div className="fit">
        <div className="foil">{compactMono(data.partnerA, data.partnerB)}</div>
        <div className="lbl-s">{data.label}</div>
        <div className="nm">{data.partnerA}<span className="amp"> &amp; </span>{data.partnerB}</div>
        <div className="when">{data.displayDate}<br />{venueLine(data.venue, data.venueDetail)}</div>
      </div>
    </div>
  );
}
