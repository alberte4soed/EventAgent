/* The exact Google-fonts href the templates were designed against
   (invitationer-final.html). Loaded via a runtime <link> — client-side through
   useInvitationFonts(), server-side on the public share page. */

'use client';

import { useEffect } from 'react';

export const INVITATION_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Pinyon+Script&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,400;1,9..144,500&family=Jost:wght@300;400;500&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Cinzel:wght@400;500;600&family=Italiana&family=Parisienne&display=swap';

/** Inject the invitation-template font stylesheet once (idempotent). */
export function useInvitationFonts() {
  useEffect(() => {
    const id = 'invitation-template-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = INVITATION_FONTS_HREF;
    document.head.appendChild(link);
  }, []);
}
