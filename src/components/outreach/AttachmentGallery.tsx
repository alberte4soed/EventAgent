"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { EmailAttachmentRow } from "@/lib/db/types";

interface Props {
  attachments: EmailAttachmentRow[];
}

interface Resolved extends EmailAttachmentRow {
  url: string | null;
}

function isImage(mime: string | null): boolean {
  return Boolean(mime?.startsWith("image/"));
}

/** Signed-URL thumbnails for vendor attachments; file chips for non-images. */
export function AttachmentGallery({ attachments }: Props) {
  const [resolved, setResolved] = useState<Resolved[]>([]);

  useEffect(() => {
    if (attachments.length === 0) return;
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      const out = await Promise.all(
        attachments.map(async (a) => {
          const { data } = await supabase.storage
            .from("vendor-files")
            .createSignedUrl(a.storage_path, 3600);
          return { ...a, url: data?.signedUrl ?? null };
        })
      );
      if (!cancelled) setResolved(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [attachments]);

  if (attachments.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {resolved.map((a) =>
        isImage(a.mime_type) && a.url ? (
          <a
            key={a.id}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block h-20 w-20 overflow-hidden rounded-lg border border-[#D4D6C0]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.url} alt={a.filename} className="h-full w-full object-cover" />
          </a>
        ) : (
          <a
            key={a.id}
            href={a.url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-[#D4D6C0] bg-[#F6F0E8] px-3 py-2 text-xs text-[#656952] transition hover:bg-[#ece8db]"
          >
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" className="size-4 text-[#8a8568]">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <polyline points="13 2 13 9 20 9" />
            </svg>
            <span className="max-w-[140px] truncate">{a.filename}</span>
          </a>
        )
      )}
    </div>
  );
}
