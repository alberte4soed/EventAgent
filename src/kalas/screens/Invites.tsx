'use client';

/* Invitationer — the digital-invitation builder. Browse 20 templates, fill a
   short form with a live preview, let AI polish the wording, then save & share
   a /i/<slug> link with RSVP (writes to the couple's guest list). */

import { useState } from 'react';
import { useWedding } from '../useWedding';
import { useLang } from '../i18n';
import { Gallery, type CoupleInput } from '../invitations/Gallery';
import { Editor } from '../invitations/Editor';
import { getTemplateMeta } from '../invitations/templates.meta';
import { defaultDataFor } from '../invitations/data';
import type { InvitationData, Language, Template } from '../invitations/types';

export default function Invites() {
  const { t } = useLang();
  const { loading, couple, event, venues, invitations, saveInvitation } = useWedding();

  const [selected, setSelected] = useState<{ template: Template; data: InvitationData; invitationId?: string } | null>(null);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-[0.85rem] text-muted">{t('Indlæser…')}</div>;
  }

  const chosenVenue =
    venues.find((v) => v.id === event?.chosen_venue_id) ??
    venues.find((v) => v.category === 'venue' && v.swipe_status === 'liked');

  const language: Language = 'da'; // default; the user can switch in the editor
  const coupleInput: CoupleInput = {
    partnerA: couple.a,
    partnerB: couple.b,
    isoDate: couple.dateISO,
    venue: chosenVenue?.name ?? '',
    language,
  };

  function pick(template: Template) {
    // Reuse an existing invitation for this template if the couple already made one.
    const existing = invitations.find((inv) => inv.template_id === template.id);
    if (existing) {
      const meta = getTemplateMeta(template.id)!;
      const base = defaultDataFor(meta, {
        partnerA: coupleInput.partnerA,
        partnerB: coupleInput.partnerB,
        isoDate: coupleInput.isoDate,
        venue: coupleInput.venue,
        language,
      });
      setSelected({ template, data: { ...base, ...(existing.data as Partial<InvitationData>) } as InvitationData, invitationId: existing.id });
      return;
    }
    const data = defaultDataFor(template, {
      partnerA: coupleInput.partnerA,
      partnerB: coupleInput.partnerB,
      isoDate: coupleInput.isoDate,
      venue: coupleInput.venue,
      language,
    });
    setSelected({ template, data });
  }

  if (selected) {
    return (
      <Editor
        template={selected.template}
        initialData={selected.data}
        invitationId={selected.invitationId}
        onBack={() => setSelected(null)}
        onSave={saveInvitation}
      />
    );
  }

  return <Gallery couple={coupleInput} onPick={pick} />;
}
