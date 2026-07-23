'use client';

/* Farve & sol — Terracotta, Aquarelle, Amalfi. */

import type { TemplateProps } from '../types';

const venueLine = (venue: string, detail?: string) => [venue, detail].filter(Boolean).join(' · ');
const join = (parts: (string | undefined)[], sep: string) => parts.filter(Boolean).join(sep);

function MultiLine({ lines }: { lines: string[] }) {
  return <>{lines.map((ln, i) => <span key={i}>{i > 0 ? <br /> : null}{ln}</span>)}</>;
}

/* ── T11 Terracotta ─────────────────────────────────────────────────── */
export function Terracotta({ data }: TemplateProps) {
  return (
    <div className="t11 tpl"><div className="arch"><div className="archfit">
      <div className="lbl-s">{data.label}</div>
      <div className="nm">{data.partnerA}<br /><span className="amp">&amp;</span><br />{data.partnerB}</div>
      <div className="sun" />
      <div className="when">{data.displayDate}<br />{venueLine(data.venue, data.venueDetail)}</div>
    </div></div></div>
  );
}

/* ── T12 Aquarelle ──────────────────────────────────────────────────── */
export function Aquarelle({ data }: TemplateProps) {
  return (
    <div className="t12 tpl">
      <span className="wash w1" /><span className="wash w2" /><span className="wash w3" />
      <div className="fit">
        <div className="lbl">{data.label}</div>
        <div className="nm">{data.partnerA}<br />&amp; {data.partnerB}</div>
        {data.introLines.length ? <div className="body"><MultiLine lines={data.introLines} /></div> : null}
        <div className="when">{join([data.displayDate, venueLine(data.venue, data.venueDetail)], ' · ')}</div>
      </div>
    </div>
  );
}

/* ── T23 Corail ─────────────────────────────────────────────────────── */
export function Corail({ data }: TemplateProps) {
  return (
    <div className="t23 tpl"><div className="fit">
      <div className="lbl-s">{data.label}</div>
      <div className="nm">{data.partnerA}<br /><span className="amp">&amp;</span><br />{data.partnerB}</div>
      <div className="ring" />
      <div className="when">{data.displayDate}<br />{venueLine(data.venue, data.venueDetail)}</div>
    </div></div>
  );
}

const Lavender = ({ cls }: { cls: string }) => (
  <svg className={`lavender ${cls}`} viewBox="0 0 100 100" fill="none">
    <path d="M20 92C22 68 34 52 52 34" stroke="#8f7fb0" strokeWidth="1.3" />
    <g fill="#9b8fc4">
      <ellipse cx="52" cy="34" rx="4" ry="8" transform="rotate(28 52 34)" />
      <ellipse cx="46" cy="42" rx="4" ry="8" transform="rotate(22 46 42)" />
      <ellipse cx="40" cy="51" rx="4" ry="8" transform="rotate(16 40 51)" />
      <ellipse cx="34" cy="60" rx="4" ry="8" transform="rotate(10 34 60)" />
    </g>
    <g fill="#c9bfe0">
      <ellipse cx="30" cy="70" rx="5" ry="9" transform="rotate(-30 30 70)" />
      <ellipse cx="24" cy="80" rx="5" ry="9" transform="rotate(-40 24 80)" />
    </g>
  </svg>
);

/* ── T24 Provence ───────────────────────────────────────────────────── */
export function Provence({ data }: TemplateProps) {
  return (
    <div className="t24 tpl">
      <Lavender cls="lt" />
      <Lavender cls="rb" />
      <div className="fit">
        <div className="lbl-s">{data.label}</div>
        <div className="nm">{data.partnerA}<br />&amp; {data.partnerB}</div>
        <div className="when">{data.displayDate}<br />{venueLine(data.venue, data.venueDetail)}</div>
      </div>
    </div>
  );
}

/* ── T13 Amalfi ─────────────────────────────────────────────────────── */
export function Amalfi({ data }: TemplateProps) {
  return (
    <div className="t13 tpl">
      <span className="top" /><span className="bot" />
      <div className="fit">
        <div className="lem">
          <svg viewBox="0 0 40 40">
            <ellipse cx="20" cy="22" rx="13" ry="10" fill="#e9c23f" />
            <path d="M20 12c-4 0-6 4-6 4" stroke="#5a8a4a" strokeWidth="2" fill="none" />
            <ellipse cx="16" cy="9" rx="6" ry="3" fill="#6ba354" transform="rotate(-30 16 9)" />
          </svg>
        </div>
        <div className="lbl-s">{data.label}</div>
        <div className="nm">{data.partnerA}<br />&amp; {data.partnerB}</div>
        <div className="when">{data.displayDate}<br />{venueLine(data.venue, data.venueDetail)}</div>
      </div>
    </div>
  );
}
