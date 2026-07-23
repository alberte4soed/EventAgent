'use client';

/* Botanisk & blomster — Jardin, Prairie, Gravure, Toile.
   SVG signature graphics copied verbatim from the source. */

import type { TemplateProps } from '../types';

const venueLine = (venue: string, detail?: string) => [venue, detail].filter(Boolean).join(' · ');
const join = (parts: (string | undefined)[], sep: string) => parts.filter(Boolean).join(sep);

function MultiLine({ lines }: { lines: string[] }) {
  return <>{lines.map((ln, i) => <span key={i}>{i > 0 ? <br /> : null}{ln}</span>)}</>;
}

const Sprig = ({ cls }: { cls: string }) => (
  <svg className={`sprig ${cls}`} viewBox="0 0 100 100">
    <path d="M14 90C14 60 30 40 54 24" stroke="#7d9070" strokeWidth="1.4" fill="none" />
    <g fill="#9fb58f">
      <ellipse cx="22" cy="70" rx="6" ry="12" transform="rotate(-38 22 70)" />
      <ellipse cx="34" cy="54" rx="6" ry="13" transform="rotate(-30 34 54)" />
      <ellipse cx="46" cy="38" rx="6" ry="12" transform="rotate(-22 46 38)" />
    </g>
    <circle cx="56" cy="24" r="6" fill="#e7c9d0" />
  </svg>
);

const Eng = ({ cls }: { cls: string }) => (
  <svg className={`eng ${cls}`} viewBox="0 0 100 100" fill="none" stroke="#93693f" strokeWidth="1">
    <path d="M92 8C70 14 60 32 62 52 64 72 50 84 30 88" />
    <path d="M62 40C54 34 44 36 40 44" />
    <path d="M66 58C60 56 52 60 50 68" />
    <ellipse cx="80" cy="20" rx="7" ry="4" transform="rotate(40 80 20)" />
    <ellipse cx="88" cy="30" rx="7" ry="4" transform="rotate(60 88 30)" />
  </svg>
);

/* ── T8 Jardin ──────────────────────────────────────────────────────── */
export function Jardin({ data }: TemplateProps) {
  return (
    <div className="t8 tpl"><div className="cardfit"><div className="card">
      <Sprig cls="tl" />
      <Sprig cls="br" />
      <div className="lbl-s">{data.label}</div>
      <div className="nm">{data.partnerA}<br />&amp; {data.partnerB}</div>
      {data.introLines.length ? <div className="body"><MultiLine lines={data.introLines} /></div> : null}
      <div className="when">{join([data.displayDate, data.time], ' · ')}<br />{venueLine(data.venue, data.venueDetail)}</div>
    </div></div></div>
  );
}

/* ── T9 Prairie ─────────────────────────────────────────────────────── */
export function Prairie({ data }: TemplateProps) {
  return (
    <div className="t9 tpl"><div className="fit">
      <div className="lbl-s">{data.label}</div>
      <div className="nm">{data.partnerA}<br />&amp; {data.partnerB}</div>
      <div className="when">{data.displayDate}<br />{venueLine(data.venue, data.venueDetail)}</div>
      <svg className="meadow" viewBox="0 0 280 120" preserveAspectRatio="none">
        <g stroke="#9aa07a" strokeWidth="1.2" fill="none">
          <path d="M22 120C20 90 26 80 24 60" /><path d="M52 120C54 88 48 78 52 58" />
          <path d="M92 120C90 92 96 82 92 64" /><path d="M142 120C144 86 138 76 142 56" />
          <path d="M192 120C190 94 196 84 192 66" /><path d="M234 120C236 90 230 80 234 60" />
          <path d="M260 120C258 92 264 82 260 64" />
        </g>
        <g fill="#d8b8c4"><circle cx="24" cy="56" r="5" /><circle cx="142" cy="52" r="5" /><circle cx="234" cy="56" r="5" /></g>
        <g fill="#e8cf7a"><circle cx="52" cy="54" r="4" /><circle cx="192" cy="62" r="4" /><circle cx="92" cy="60" r="4" /><circle cx="260" cy="60" r="4" /></g>
      </svg>
    </div></div>
  );
}

/* ── T10 Gravure ────────────────────────────────────────────────────── */
export function Gravure({ data }: TemplateProps) {
  return (
    <div className="t10 tpl"><div className="fit">
      <Eng cls="e1" />
      <Eng cls="e2" />
      <div className="lbl-s">{data.label}</div>
      <div className="nm">{data.partnerA}<br />&amp; {data.partnerB}</div>
      <div className="when">{data.displayDate}<br />{venueLine(data.venue, data.venueDetail)}</div>
    </div></div>
  );
}

const Euc = ({ cls }: { cls: string }) => (
  <svg className={`euc ${cls}`} viewBox="0 0 100 100" fill="none">
    <path d="M12 88C30 66 44 60 70 46" stroke="#7f9382" strokeWidth="1.3" />
    <g fill="#aebfa8" stroke="#8aa08f" strokeWidth=".8">
      <circle cx="70" cy="46" r="7" />
      <circle cx="56" cy="52" r="8" />
      <circle cx="42" cy="60" r="8" />
      <circle cx="28" cy="70" r="7" />
      <circle cx="18" cy="80" r="6" />
    </g>
  </svg>
);

/* ── T26 Eucalyptus ─────────────────────────────────────────────────── */
export function Eucalyptus({ data }: TemplateProps) {
  return (
    <div className="t26 tpl"><div className="cardfit"><div className="card">
      <Euc cls="et" />
      <Euc cls="eb" />
      <div className="lbl-s">{data.label}</div>
      <div className="nm">{data.partnerA}<br /><span className="amp">&amp;</span><br />{data.partnerB}</div>
      <div className="when">{data.displayDate}<br />{venueLine(data.venue, data.venueDetail)}</div>
    </div></div></div>
  );
}

/* ── T19 Toile ──────────────────────────────────────────────────────── */
export function Toile({ data }: TemplateProps) {
  return (
    <div className="t19 tpl">
      <div className="band" />
      <div className="cardfit"><div className="card">
        <div className="lbl-s">{data.label}</div>
        <div className="nm">{data.partnerA}<br /><span className="amp">&amp;</span><br />{data.partnerB}</div>
        <div className="when">{data.displayDate}<br />{venueLine(data.venue, data.venueDetail)}</div>
      </div></div>
    </div>
  );
}
