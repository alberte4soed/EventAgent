"use client";

/* App language (Danish default, English alternative). The preference lives in
   localStorage for instant switching and is mirrored to profiles.language for
   cross-device + server (agent) use. `t()` looks up the Danish source string
   in the English dictionary, falling back to Danish when untranslated. */

import * as React from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { EN } from './strings';
import type { AppLanguage } from '@/lib/db/types';

export type Lang = AppLanguage;

type Translate = (s: string, params?: Record<string, string | number>) => string;
interface LangCtx { lang: Lang; setLang: (l: Lang) => void; t: Translate }

function translate(lang: Lang, s: string, params?: Record<string, string | number>): string {
  let out = lang === 'en' ? (EN[s] ?? s) : s;
  if (params) for (const k of Object.keys(params)) out = out.split(`{${k}}`).join(String(params[k]));
  return out;
}

const Ctx = createContext<LangCtx | null>(null);

export function persistLanguage(l: Lang) {
  try { localStorage.setItem('kalas_lang', l); } catch { /* ignore */ }
  fetch('/api/profile', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language: l }),
  }).catch(() => {});
}

export function LanguageProvider({ initialLang = 'da', lock = false, children }: { initialLang?: Lang; lock?: boolean; children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  // The public wedding site locks to the couple's language and ignores the
  // viewer's stored preference; the app follows localStorage.
  useEffect(() => {
    if (lock) return;
    try {
      const stored = localStorage.getItem('kalas_lang');
      if (stored === 'da' || stored === 'en') setLangState(stored);
    } catch { /* ignore */ }
  }, [lock]);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    persistLanguage(l);
  }, []);

  const t = useCallback<Translate>((s, params) => translate(lang, s, params), [lang]);
  const value = useMemo<LangCtx>(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Safe outside a provider: returns Danish source strings and a no-op setter. */
export function useLang(): LangCtx {
  const ctx = useContext(Ctx);
  if (ctx) return ctx;
  return { lang: 'da', setLang: () => {}, t: (s, params) => translate('da', s, params) };
}

/* ── Presentational two-way switch (DA / EN) ─────────────────────────── */
export function LangSwitch({ lang, onSelect, className }: { lang: Lang; onSelect: (l: Lang) => void; className?: string }) {
  return (
    <div className={`inline-flex items-center rounded-full border border-[var(--color-line-strong)] p-0.5 ${className ?? ''}`}>
      {(['da', 'en'] as Lang[]).map((l) => (
        <button key={l} type="button" onClick={() => onSelect(l)}
          className={`rounded-full px-3 py-1.5 text-[0.78rem] font-medium transition-colors cursor-pointer ${
            lang === l ? 'bg-ink text-canvas' : 'text-ink-soft hover:text-ink'
          }`}>
          {l === 'da' ? 'Dansk' : 'English'}
        </button>
      ))}
    </div>
  );
}
