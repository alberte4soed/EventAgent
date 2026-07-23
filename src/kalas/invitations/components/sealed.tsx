'use client';

/* Klassisk & forseglet — Sceau, Ivoire, Bleu Poudré, Lettre.
   Markup ported 1:1 from invitationer-final.html; text driven by InvitationData.
   Tap-to-open reveals use React state instead of the source's inline onclick. */

import { useState } from 'react';
import type { TemplateProps } from '../types';

const compactMono = (a: string, b: string) =>
  `${(a.trim()[0] ?? '').toUpperCase()}&${(b.trim()[0] ?? '').toUpperCase()}`;

const venueLine = (venue: string, detail?: string) =>
  [venue, detail].filter(Boolean).join(' · ');

/* ── T1 Sceau (tap to open) ─────────────────────────────────────────── */
export function Sceau({ data, onRsvp }: TemplateProps) {
  const [open, setOpen] = useState(false);
  const da = data.language === 'da';
  return (
    <div className={`t1 tpl${open ? ' open' : ''}`} onClick={() => setOpen(true)}>
      <div className="fit closed">
        <div className="lbl k">{da ? 'Du har post fra' : "You've got mail from"}</div>
        <div className="nm">{data.partnerA}<br />&amp; {data.partnerB}</div>
        <div className="seal"><span>{data.monogram}</span></div>
        <div className="lbl-s tap">{da ? 'Tryk for at åbne' : 'Tap to open'}</div>
      </div>
      <div className="reveal"><div className="fit">
        <div className="lbl k">{data.label}</div>
        <div className="rn">{data.partnerA} &amp; {data.partnerB}</div>
        <div className="rule" />
        {data.introLines.map((ln, i) => <div className="ln" key={i}>{ln}</div>)}
        <div className="lbl dt">{data.displayDate}</div>
        <div className="ln" style={{ fontStyle: 'normal', marginTop: 12 }}>{venueLine(data.venue, data.venueDetail)}</div>
        <button className="btn" onClick={(e) => { e.stopPropagation(); onRsvp?.(); }}>
          {data.rsvpLabel || (da ? 'Bekræft deltagelse' : 'RSVP')}
        </button>
      </div></div>
    </div>
  );
}

/* ── T3 Ivoire (letterpress) ────────────────────────────────────────── */
export function Ivoire({ data }: TemplateProps) {
  return (
    <div className="t3 tpl">
      <div className="frame" />
      <div className="cardfit"><div className="card">
        <div className="lbl">{data.label}</div>
        <div className="nm">{data.partnerA}<br />&amp;<br />{data.partnerB}</div>
        <div className="when">{data.displayDate}<br />{venueLine(data.venue, data.venueDetail)}</div>
      </div></div>
    </div>
  );
}

/* ── T4 Bleu Poudré ─────────────────────────────────────────────────── */
export function BleuPoudre({ data }: TemplateProps) {
  const secondLine = [data.time, data.venue].filter(Boolean).join(' · ');
  return (
    <div className="t4 tpl"><div className="fit">
      <div className="crest"><span>{compactMono(data.partnerA, data.partnerB)}</span></div>
      <div className="lbl-s">{data.label}</div>
      <div className="nm">{data.partnerA}<span className="amp"> &amp; </span>{data.partnerB}</div>
      <div className="when">{data.displayDate}<br />{secondLine}{data.venueDetail ? <><br />{data.venueDetail}</> : null}</div>
    </div></div>
  );
}

/* ── T25 Cachet (wax seal, formal) ──────────────────────────────────── */
export function Cachet({ data }: TemplateProps) {
  return (
    <div className="t25 tpl"><div className="fit">
      <div className="seal"><span>{data.monogram}</span></div>
      <div className="lbl">{data.label}</div>
      <div className="nm">{data.partnerA}<br /><span className="amp">&amp;</span><br />{data.partnerB}</div>
      <div className="when">{data.displayDate}<br />{venueLine(data.venue, data.venueDetail)}</div>
    </div></div>
  );
}

/* ── T18 Lettre (tap to open) ───────────────────────────────────────── */
export function Lettre({ data, onRsvp }: TemplateProps) {
  const [open, setOpen] = useState(false);
  const da = data.language === 'da';
  return (
    <div className={`t18 tpl${open ? ' open' : ''}`} onClick={() => setOpen(true)}>
      <div className="fit closed">
        <svg className="lace" viewBox="0 0 250 52">
          <path d="M0 6 L250 6" stroke="#efe7d1" strokeWidth="1" opacity=".5" />
          <g fill="none" stroke="#efe7d1" strokeWidth="1">
            <path d="M5 6 Q17 30 29 6 Q41 30 53 6 Q65 30 77 6 Q89 30 101 6 Q113 30 125 6 Q137 30 149 6 Q161 30 173 6 Q185 30 197 6 Q209 30 221 6 Q233 30 245 6" />
            <path d="M5 6 Q17 22 29 6 Q41 22 53 6 Q65 22 77 6 Q89 22 101 6 Q113 22 125 6 Q137 22 149 6 Q161 22 173 6 Q185 22 197 6 Q209 22 221 6 Q233 22 245 6" opacity=".6" />
          </g>
          <g fill="#efe7d1" opacity=".85">
            {[17, 41, 65, 89, 113, 137, 161, 185, 209, 233].map((cx) => <circle key={cx} cx={cx} cy="30" r="1.4" />)}
          </g>
        </svg>
        <div className="lbl">{data.label}</div>
        <div className="nm">{data.partnerA}<br />&amp; {data.partnerB}</div>
        <div className="seal"><span>{data.monogram}</span></div>
        <div className="lbl-s tap">{da ? 'Åbn invitationen' : 'Open the invitation'}</div>
      </div>
      <div className="reveal"><div className="fit">
        <div className="lbl">{da ? 'Gem datoen' : 'Save the date'}</div>
        <div className="rn">{data.partnerA} &amp; {data.partnerB}</div>
        <div className="rule" />
        {data.introLines.map((ln, i) => <div className="ln" key={i}>{ln}</div>)}
        <div className="dt">{data.displayDate}</div>
        <div className="ln" style={{ fontStyle: 'normal', marginTop: 12 }}>{venueLine(data.venue, data.venueDetail)}</div>
        <button className="btn" onClick={(e) => { e.stopPropagation(); onRsvp?.(); }}>
          {data.rsvpLabel || (da ? 'Bekræft deltagelse' : 'RSVP')}
        </button>
      </div></div>
    </div>
  );
}
