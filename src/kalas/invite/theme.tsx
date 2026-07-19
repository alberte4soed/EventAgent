"use client";

/* Invitation card renderer + font loader, used by both the in-app Invitation
   Studio (src/kalas/screens/Invites.tsx) and the public invitation
   (src/app/i/[slug]/PublicInvite.tsx), so a chosen template renders identically
   in the builder preview and on the guest's shared link. Pure LOOK data lives
   in ./theme-data (no client deps); this module re-exports it for convenience. */

import { useEffect, type ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  paletteById, fontById, DEFAULT_PROGRAM,
  type PaletteId, type FontId, type Alignment, type Composition, type ProgramRow,
  type Shape, type Frame,
} from './theme-data';

export * from './theme-data';

/* ─── Load the Google Fonts used by the pairings ───────────────────────── */
export function useInviteFonts() {
  useEffect(() => {
    const id = 'invite-studio-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=DM+Serif+Display&family=Marcellus&family=Bodoni+Moda:wght@400;500;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Cinzel:wght@400;500&family=Italiana&family=Pinyon+Script&family=Parisienne&family=Libre+Baskerville:wght@400;700&family=Montserrat:wght@300;400;500&family=Mulish:wght@300;400;500&family=DM+Sans:wght@300;400;500&family=Jost:wght@300;400;500&family=Nunito+Sans:wght@300;400&family=Lato:wght@300;400&family=Tenor+Sans&display=swap';
    document.head.appendChild(link);
  }, []);
}

export interface CardContent {
  eyebrow: string; names: string; date: string; venue: string; closing: string;
}
export interface CardLook {
  paletteId: PaletteId; fontId: FontId;
  alignment: Alignment; composition: Composition;
  shape?: Shape; frame?: Frame;
  /** Signed URL of the couple photo shown on the card face (when photoOnCard). */
  photoUrl?: string | null;
  photoOnCard?: boolean;
}

/** Small botanical sprig used for the `botanical` frame corners. */
function BotanicalCorner({ color, style }: { color: string; style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 60 60" width="46" height="46" style={{ position:'absolute', color, opacity:0.5, ...style }} fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
      <path d="M6 54 C 18 42, 22 26, 20 8" />
      <path d="M20 20 C 12 16, 8 18, 6 24" /><path d="M20 20 C 26 14, 30 14, 33 18" />
      <path d="M19 32 C 11 29, 8 31, 6 37" /><path d="M19 32 C 25 27, 29 27, 32 31" />
      <path d="M11 44 C 6 42, 4 44, 3 48" /><path d="M11 44 C 16 40, 20 40, 22 44" />
    </svg>
  );
}

function shapeRadius(shape: Shape): React.CSSProperties {
  if (shape === 'arched') return { borderRadius: '999px 999px 4px 4px' };
  if (shape === 'rounded') return { borderRadius: 18 };
  return { borderRadius: 3 };
}

/* ─── Card (front) ─────────────────────────────────────────────────────── */
export function InviteCard({ paletteId, fontId, alignment, composition, shape = 'rectangle', frame = 'none', photoUrl, photoOnCard, eyebrow, names, date, venue, closing }: CardLook & CardContent) {
  const pal  = paletteById(paletteId);
  const font = fontById(fontId);
  const showPhoto = Boolean(photoOnCard && photoUrl);

  const topBase = composition === 'top' ? 48 : 60;
  const topP    = (shape === 'arched' ? topBase + 26 : topBase) - (showPhoto ? 10 : 0);
  const bottomP = composition === 'top' ? 44 : 60;
  const jc = composition === 'centered' ? 'center' : composition === 'top' ? 'flex-start' : 'space-between';
  const ta = alignment === 'center' ? 'center' : 'left';
  const ai = alignment === 'center' ? 'center' : 'flex-start';

  return (
    <div style={{
      position:'relative', overflow:'hidden', aspectRatio:'5/8', background: pal.bg, ...shapeRadius(shape),
      boxShadow: '0 32px 80px -8px rgba(0,0,0,0.20), 0 8px 28px -4px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
    }}>
      {/* Decorative frame */}
      {frame === 'line' && (
        <div style={{ position:'absolute', inset:14, border:`0.75px solid ${pal.accent}`, opacity:0.4, pointerEvents:'none', ...(shape==='arched' ? { borderRadius:'999px 999px 2px 2px' } : shape==='rounded' ? { borderRadius:10 } : undefined) }} />
      )}
      {frame === 'botanical' && (
        <>
          <BotanicalCorner color={pal.accent} style={{ top:10, left:10 }} />
          <BotanicalCorner color={pal.accent} style={{ top:10, right:10, transform:'scaleX(-1)' }} />
          <BotanicalCorner color={pal.accent} style={{ bottom:10, left:10, transform:'scaleY(-1)' }} />
          <BotanicalCorner color={pal.accent} style={{ bottom:10, right:10, transform:'scale(-1,-1)' }} />
        </>
      )}

      <div style={{
        position:'relative', zIndex:2, height:'100%', display:'flex', flexDirection:'column',
        alignItems: ai, justifyContent: jc, textAlign: ta, gap: 11, padding: `${topP}px 30px ${bottomP}px`,
      }}>
        {showPhoto && (
          <div style={{ width:'100%', aspectRatio:'3/2', borderRadius:3, overflow:'hidden', marginBottom:4, boxShadow:'0 6px 18px -6px rgba(0,0,0,0.3)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl!} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          </div>
        )}
        <p style={{ fontFamily: font.body, fontSize:9.5, fontWeight:500, letterSpacing:'0.38em', textTransform:'uppercase', color:pal.accent, margin:0 }}>
          {eyebrow}
        </p>
        <p style={{ fontFamily:font.head, fontWeight:font.w, fontSize:font.sz, letterSpacing:font.sp, lineHeight:1.06, color:pal.ink, margin:0 }}>
          {names}
        </p>
        <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent: alignment==='center'?'center':'flex-start' }}>
          <span style={{ width:20, height:'0.5px', background:pal.accent, opacity:0.5, display:'block' }}/>
          <span style={{ width:4, height:4, borderRadius:'50%', background:pal.accent, opacity:0.4, display:'block' }}/>
          <span style={{ width:20, height:'0.5px', background:pal.accent, opacity:0.5, display:'block' }}/>
        </div>
        <p style={{ fontFamily:font.head, fontSize:15, fontWeight:400, letterSpacing:'0.01em', color:pal.ink, margin:0 }}>
          {date}
        </p>
        <p style={{ fontFamily:font.body, fontSize:10, fontWeight:500, letterSpacing:'0.22em', textTransform:'uppercase', color:pal.ink, opacity:0.6, margin:0 }}>
          {venue}
        </p>
        <p style={{ fontFamily:font.head, fontStyle:'italic', fontSize:14, fontWeight:400, color:pal.accent, opacity:0.88, margin:0 }}>
          {closing}
        </p>
      </div>
    </div>
  );
}

/* ─── Card back — program + RSVP note, same palette & type ─────────────── */
export function InviteBack({ paletteId, fontId, domain, program = DEFAULT_PROGRAM, rsvpNote }: {
  paletteId: PaletteId; fontId: FontId; domain: string; program?: ProgramRow[]; rsvpNote?: string;
}) {
  const pal  = paletteById(paletteId);
  const font = fontById(fontId);

  const row = (time: string, label: string) => (
    <div key={`${time}-${label}`} style={{ display:'flex', alignItems:'baseline', gap:12, justifyContent:'center' }}>
      <span style={{ fontFamily:font.body, fontSize:9.5, letterSpacing:'0.12em', color:pal.ink, opacity:0.5, width:34, textAlign:'right' }}>{time}</span>
      <span style={{ width:3, height:3, borderRadius:'50%', background:pal.accent, opacity:0.6, alignSelf:'center' }} />
      <span style={{ fontFamily:font.head, fontSize:13.5, color:pal.ink, width:120, textAlign:'left' }}>{label}</span>
    </div>
  );

  return (
    <div style={{
      position:'relative', overflow:'hidden', aspectRatio:'5/8', background: pal.bg, borderRadius: 3,
      boxShadow: '0 32px 80px -8px rgba(0,0,0,0.20), 0 8px 28px -4px rgba(0,0,0,0.10)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: 18, padding: '48px 28px', textAlign:'center',
    }}>
      <div style={{ position:'absolute', inset:14, border:`0.75px solid ${pal.accent}`, opacity:0.35, pointerEvents:'none' }} />
      <p style={{ fontFamily:font.body, fontSize:9, fontWeight:500, letterSpacing:'0.38em', textTransform:'uppercase', color:pal.accent, margin:0 }}>
        Program for dagen
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {program.map((p) => row(p.time, p.label))}
      </div>
      <div style={{ width:26, height:'0.5px', background:pal.accent, opacity:0.5 }} />
      <div>
        <p style={{ fontFamily:font.body, fontSize:8.5, fontWeight:500, letterSpacing:'0.3em', textTransform:'uppercase', color:pal.accent, margin:0 }}>
          {rsvpNote || 'Svar udbedes'}
        </p>
        <p style={{ fontFamily:font.head, fontSize:14, color:pal.ink, margin:'8px 0 0' }}>
          {domain}
        </p>
        <p style={{ fontFamily:font.head, fontStyle:'italic', fontSize:12.5, color:pal.ink, opacity:0.6, margin:'6px 0 0' }}>
          — svar, menu og overnatning
        </p>
      </div>
    </div>
  );
}

/* ─── Flip container — front/back with 3D turn ─────────────────────────── */
export function FlipCard({ side, front, back }: { side: 'front' | 'back'; front: ReactNode; back: ReactNode }) {
  return (
    <div style={{ perspective: 1400 }}>
      <motion.div
        animate={{ rotateY: side === 'back' ? 180 : 0 }}
        transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        style={{ transformStyle: 'preserve-3d', position: 'relative' }}
      >
        <div style={{ backfaceVisibility: 'hidden' }}>{front}</div>
        <div style={{ position:'absolute', inset:0, transform:'rotateY(180deg)', backfaceVisibility:'hidden' }}>{back}</div>
      </motion.div>
    </div>
  );
}
