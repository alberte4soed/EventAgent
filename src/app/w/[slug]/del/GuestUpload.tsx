"use client";

/* Guest-facing photo upload. Deliberately minimal: no login, no account, and
   a guest only ever sees the photos they themselves added in this visit —
   which is what makes the album safe to leave open without moderation. */

import { useRef, useState } from "react";
import { ImagePlus, Check, AlertCircle, Loader2 } from "lucide-react";
import { LanguageProvider, useLang } from "@/kalas/i18n";
import { normalizeImage } from "@/kalas/site/normalizeImage";
import type { AppLanguage } from "@/lib/db/types";

const NAME_KEY = "kalas_album_name";

type Item = {
  key: string;
  preview: string;
  state: "venter" | "sender" | "klar" | "fejl";
  error?: string;
};

interface Props {
  slug: string;
  names: string;
  total: number;
  closed: boolean;
  locked: boolean;
  lang: AppLanguage;
}

export function GuestUpload(props: Props) {
  return (
    <LanguageProvider initialLang={props.lang} lock>
      <div className="theme-kalas min-h-screen bg-canvas">
        {props.locked ? <PasswordGate slug={props.slug} /> : <Upload {...props} />}
      </div>
    </LanguageProvider>
  );
}

function Upload({ slug, names, total: initialTotal, closed }: Props) {
  const { t } = useLang();
  const [name, setName] = useState(() => {
    try { return localStorage.getItem(NAME_KEY) ?? ""; } catch { return ""; }
  });
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(initialTotal);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const done = items.filter((i) => i.state === "klar").length;

  async function handleFiles(files: FileList | null) {
    if (!files?.length || !name.trim()) return;
    try { localStorage.setItem(NAME_KEY, name.trim()); } catch { /* ignore */ }

    const picked = Array.from(files);
    const queued: Item[] = picked.map((f, i) => ({
      key: `${Date.now()}-${i}`,
      preview: URL.createObjectURL(f),
      state: "venter",
    }));
    setItems((prev) => [...prev, ...queued]);
    setBusy(true);

    // Serial, not parallel: phones on wedding-venue wifi do far better with
    // one request at a time, and it keeps the per-file progress honest.
    for (let i = 0; i < picked.length; i++) {
      const item = queued[i];
      setItems((prev) => prev.map((x) => (x.key === item.key ? { ...x, state: "sender" } : x)));
      try {
        const normalized = await normalizeImage(picked[i]);
        if (!normalized) throw new Error(t("Kunne ikke læse billedet"));

        const body = new FormData();
        body.append("file", normalized);
        body.append("name", name.trim());
        body.append("company", ""); // honeypot, always empty for real guests

        const res = await fetch(`/api/w/${slug}/album`, { method: "POST", body });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error ?? t("Kunne ikke sende billedet"));

        if (typeof json.total === "number") setTotal(json.total);
        setItems((prev) => prev.map((x) => (x.key === item.key ? { ...x, state: "klar" } : x)));
      } catch (err) {
        const message = err instanceof Error ? err.message : t("Kunne ikke sende billedet");
        setItems((prev) => prev.map((x) => (x.key === item.key ? { ...x, state: "fejl", error: message } : x)));
      }
    }

    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  if (closed) {
    return (
      <Frame names={names}>
        <p className="text-[0.9rem] text-muted">
          {t("Albummet er lukket for nu. Tak til alle der nåede at dele.")}
        </p>
      </Frame>
    );
  }

  return (
    <Frame names={names}>
      <p className="text-[0.9rem] leading-relaxed text-muted">
        {t("Har I taget billeder? Læg dem her, så samler vi dem alle sammen ét sted.")}
      </p>

      <label className="mt-6 block text-left">
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted">
          {t("Dit navn")}
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder={t("Så vi ved hvem der har delt")}
          className="mt-1.5 w-full rounded-xl rule bg-canvas px-4 py-3 text-[0.95rem] text-ink focus:border-ink focus:outline-none"
        />
      </label>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        onChange={(e) => void handleFiles(e.target.files)}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={!name.trim() || busy}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3.5 text-[0.85rem] font-medium text-canvas transition-colors hover:bg-ink/90 disabled:opacity-40 disabled:cursor-default cursor-pointer"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
        {busy ? t("Sender…") : t("Vælg billeder")}
      </button>
      {!name.trim() && (
        <p className="mt-2 text-[0.75rem] text-muted">{t("Skriv dit navn først")}</p>
      )}

      {items.length > 0 && (
        <div className="mt-6 text-left">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted">
            {t("Dine billeder ({done} af {n} sendt)", { done, n: items.length })}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {items.map((item) => (
              <div key={item.key} className="relative aspect-square overflow-hidden rounded-xl bg-shell">
                {/* Local object URL, the album itself is private. */}
                <img src={item.preview} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-ink/35">
                  {item.state === "klar" && <Check size={18} className="text-canvas" />}
                  {item.state === "sender" && <Loader2 size={16} className="animate-spin text-canvas" />}
                  {item.state === "fejl" && <AlertCircle size={16} className="text-canvas" />}
                </div>
              </div>
            ))}
          </div>
          {items.some((i) => i.state === "fejl") && (
            <p className="mt-2 text-[0.75rem] text-[var(--color-terracotta)]">
              {items.find((i) => i.state === "fejl")?.error}
            </p>
          )}
        </div>
      )}

      {total > 0 && (
        <p className="mt-6 text-[0.78rem] text-muted">
          {t("I alt {n} billeder delt", { n: total })}
        </p>
      )}
      <p className="mt-1 text-[0.72rem] text-muted/70">
        {t("Kun brudeparret kan se billederne.")}
      </p>
    </Frame>
  );
}

function Frame({ names, children }: { names: string; children: React.ReactNode }) {
  const { t } = useLang();
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl rule bg-card p-8 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-ink">
          <span className="font-serif text-[1.3rem] leading-none text-canvas">K</span>
        </div>
        <h1 className="mt-4 font-serif text-[1.4rem] leading-tight text-ink">
          {names || t("Billeder fra dagen")}
        </h1>
        {children}
      </div>
    </div>
  );
}

/* Same gate as the wedding site — the cookie is scoped to /w/{slug}, so
   verifying on either page unlocks both. */
function PasswordGate({ slug }: { slug: string }) {
  const { t } = useLang();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(false);
    try {
      const res = await fetch(`/api/w/${slug}/verify-password`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }),
      });
      if (res.ok) { window.location.reload(); return; }
      setError(true);
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl rule bg-card p-8 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-ink">
          <span className="font-serif text-[1.3rem] leading-none text-canvas">K</span>
        </div>
        <h1 className="mt-4 font-serif text-[1.3rem] text-ink">{t("Privat side")}</h1>
        <p className="mt-1 text-[0.85rem] text-muted">{t("Indtast koden fra jeres invitation.")}</p>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder={t("Adgangskode")} autoFocus
          className="mt-5 w-full rounded-xl rule bg-canvas px-4 py-3 text-center text-[0.95rem] text-ink focus:border-ink focus:outline-none" />
        {error && <p className="mt-2 text-[0.78rem] text-[var(--color-terracotta)]">{t("Forkert kode, prøv igen.")}</p>}
        <button type="submit" disabled={busy || !password}
          className="mt-4 w-full rounded-full bg-ink px-5 py-3 text-[0.82rem] font-medium text-canvas hover:bg-ink/90 transition-colors cursor-pointer disabled:opacity-50">
          {busy ? t("Åbner…") : t("Se siden")}
        </button>
      </form>
    </div>
  );
}
