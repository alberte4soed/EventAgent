'use client';

import { useEffect, useState } from 'react';
import type { Language } from './types';

/** Live countdown to an ISO target — renders the `.cd` block Minuit/Céleste
    style (color/size come from the enclosing `.t14`/`.t15` scope). Replaces the
    inline <script> from the source. */
export function Countdown({ isoDate, language }: { isoDate: string; language: Language }) {
  const target = new Date(isoDate).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Number.isNaN(target) ? 0 : Math.max(0, target - now);
  const pad = (n: number) => String(n).padStart(2, '0');
  const days = Math.floor(diff / 864e5);
  const hours = pad(Math.floor((diff % 864e5) / 36e5));
  const mins = pad(Math.floor((diff % 36e5) / 6e4));
  const secs = pad(Math.floor((diff % 6e4) / 1e3));

  const L = language === 'da'
    ? { d: 'Dage', h: 'Timer', m: 'Min', s: 'Sek' }
    : { d: 'Days', h: 'Hours', m: 'Min', s: 'Sec' };

  return (
    <div className="cd">
      <div className="u"><div className="n">{days}</div><div className="l">{L.d}</div></div>
      <div className="div" />
      <div className="u"><div className="n">{hours}</div><div className="l">{L.h}</div></div>
      <div className="div" />
      <div className="u"><div className="n">{mins}</div><div className="l">{L.m}</div></div>
      <div className="div" />
      <div className="u"><div className="n">{secs}</div><div className="l">{L.s}</div></div>
    </div>
  );
}
