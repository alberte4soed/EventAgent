"use client";

import { useState } from "react";
import { LANGUAGES, persistLanguage } from "@/kalas/i18n";
import type { AppLanguage } from "@/lib/db/types";

/** Language toggle for the (non-Kalas-themed) settings page. Persists to
    localStorage + profile; takes effect across the Kalas app on next load.
    Driven by the i18n LANGUAGES registry, so it grows with new languages. */
export function LanguageSetting({ initial }: { initial: AppLanguage }) {
  const [lang, setLang] = useState<AppLanguage>(initial);
  const choose = (l: AppLanguage) => { setLang(l); persistLanguage(l); };

  return (
    <div className="inline-flex items-center rounded-full border border-[#D4D6C0] p-0.5">
      {LANGUAGES.map(({ code, label }) => (
        <button key={code} type="button" onClick={() => choose(code)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            lang === code ? "bg-[#4A4E3C] text-[#F6F0E8]" : "text-[#7A8066] hover:text-[#4A4E3C]"
          }`}>
          {label}
        </button>
      ))}
    </div>
  );
}
