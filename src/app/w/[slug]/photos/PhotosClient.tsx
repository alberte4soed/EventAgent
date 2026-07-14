"use client";

/* Guest-facing photo page: upload form (no login, GDPR consent) + gallery of
   signed-URL images. Uploads POST to the service-role route and refresh the
   page so the new photo appears with a fresh signed URL. */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LanguageProvider, useLang } from "@/kalas/i18n";
import type { AppLanguage } from "@/lib/db/types";

type PhotoView = {
  id: string;
  url: string | null;
  uploaderName: string | null;
  uploadedBy: "guest" | "couple";
};

export function PhotosClient(props: {
  slug: string;
  coupleNames: string;
  lang: AppLanguage;
  wallOpen: boolean;
  photos: PhotoView[];
}) {
  return (
    <LanguageProvider initialLang={props.lang} lock>
      <div className="theme-kalas">
        <Inner {...props} />
      </div>
    </LanguageProvider>
  );
}

function Inner({ slug, coupleNames, wallOpen, photos }: {
  slug: string; coupleNames: string; wallOpen: boolean; photos: PhotoView[];
}) {
  const { t } = useLang();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploaderName, setUploaderName] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [error, setError] = useState("");

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !consent) return;
    setBusy(true); setError("");
    let uploaded = 0;
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.set("file", file);
        form.set("uploaderName", uploaderName.trim());
        form.set("consent", "true");
        const res = await fetch(`/api/w/${slug}/photos/upload`, { method: "POST", body: form });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          setError(j.error === "file_too_large" ? t("Billedet er for stort (maks. 25 MB).")
            : j.error === "photo_limit_reached" ? t("Galleriet er fyldt — tak for alle billederne!")
            : t("Noget gik galt — prøv igen."));
          break;
        }
        uploaded++;
      }
    } finally {
      setBusy(false);
      setDoneCount(uploaded);
      if (uploaded > 0) router.refresh();
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-canvas">
      <header className="px-6 pb-8 pt-12 text-center">
        <a href={`/w/${slug}`} className="text-[0.72rem] uppercase tracking-[0.2em] text-muted hover:text-ink">← {coupleNames}</a>
        <h1 className="mt-3 font-serif text-[clamp(1.8rem,6vw,2.6rem)] text-ink">{t("Del jeres billeder")}</h1>
        <p className="mx-auto mt-2 max-w-md text-[0.9rem] text-muted">
          {t("Upload billeder fra dagen direkte fra telefonen — de samles i ét fælles galleri til brudeparret.")}
        </p>
      </header>

      {/* Upload card */}
      <div className="mx-auto max-w-md px-6">
        <div className="rounded-2xl rule bg-card p-6">
          <label className="block">
            <span className="text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-muted">{t("Dit navn (valgfrit)")}</span>
            <input value={uploaderName} onChange={(e) => setUploaderName(e.target.value)}
              className="mt-1.5 w-full rounded-xl rule bg-canvas px-4 py-2.5 text-[0.92rem] text-ink focus:border-ink focus:outline-none" />
          </label>

          <label className="mt-4 flex items-start gap-2.5 text-[0.8rem] text-ink-soft cursor-pointer">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
            <span>{t("Jeg giver samtykke til, at billederne deles med brudeparret og deres gæster.")}</span>
          </label>

          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden
            onChange={(e) => void upload(e.target.files)} />
          <button onClick={() => fileRef.current?.click()} disabled={busy || !consent}
            className="mt-5 w-full rounded-full bg-ink px-5 py-3 text-[0.82rem] font-medium text-canvas hover:bg-ink/90 transition-colors cursor-pointer disabled:opacity-50">
            {busy ? t("Uploader…") : t("Vælg billeder")}
          </button>
          {!consent && <p className="mt-2 text-center text-[0.7rem] text-muted">{t("Sæt kryds i samtykke for at uploade.")}</p>}
          {doneCount > 0 && !busy && !error && (
            <p className="mt-2 text-center text-[0.78rem] text-ink">{t("Tak! {n} billeder er delt.", { n: String(doneCount) })}</p>
          )}
          {error && <p className="mt-2 text-center text-[0.78rem] text-[var(--color-terracotta)]">{error}</p>}
        </div>
      </div>

      {/* Gallery */}
      <main className="mx-auto max-w-3xl px-6 py-10">
        {photos.length === 0 ? (
          <p className="py-10 text-center font-serif text-[1.05rem] italic text-muted">
            {wallOpen ? t("Ingen billeder endnu — bliv den første!") : t("Gæsternes billeder vises efter den store dag.")}
          </p>
        ) : (
          <div className="columns-2 gap-3 sm:columns-3 [&>figure]:mb-3">
            {photos.map((p) => (
              <figure key={p.id} className="break-inside-avoid overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url ?? ""} alt="" loading="lazy" className="w-full" />
                {p.uploaderName && (
                  <figcaption className="px-1 pt-1 text-[0.68rem] text-muted">{p.uploaderName}</figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </main>

      <footer className="pb-10 text-center">
        <span className="text-[0.68rem] uppercase tracking-[0.2em] text-muted/60">Kalas</span>
      </footer>
    </div>
  );
}
