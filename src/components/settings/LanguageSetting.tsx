"use client";

import { useState } from "react";
import { persistLanguage } from "@/kalas/i18n";
import type { AppLanguage } from "@/lib/db/types";

/** Language toggle for the (non-Kalas-themed) settings page. Persists to
    localStorage + profile; takes effect across the Kalas app on next load. */
export function LanguageSetting({ initial }: { initial: AppLanguage }) {
  const [lang, setLang] = useState<AppLanguage>(initial);
  const choose = (l: AppLanguage) => { setLang(l); persistLanguage(l); };

  return (
    <div className="inline-flex items-center rounded-full border border-[#D4D6C0] p-0.5">
      {(["da", "en"] as AppLanguage[]).map((l) => (
        <button key={l} type="button" onClick={() => choose(l)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            lang === l ? "bg-[#4A4E3C] text-[#F6F0E8]" : "text-[#7A8066] hover:text-[#4A4E3C]"
          }`}>
          {l === "da" ? "Dansk" : "English"}
        </button>
      ))}
    </div>
  );
}
