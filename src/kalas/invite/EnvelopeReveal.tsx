"use client";

/* The signature "online invite" moment: guests land on a closed envelope with a
   wax seal and a monogram, tap "Klik for at åbne", and the flap lifts to reveal
   the invitation (children). Colours + type follow the chosen template so the
   envelope matches the card. When `persistKey` is set the reveal only plays once
   per session (sessionStorage), so navigating the invite doesn't replay it. */

import { useEffect, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { paletteById, fontById } from './theme-data';

interface Props {
  paletteId: string;
  fontId: string;
  monogram: string;
  note: string;
  names: string;
  /** Personalized line, e.g. "Kære Anne & Peter" — overrides note when set. */
  greeting?: string | null;
  /** sessionStorage key; when set, the reveal is skipped after the first open. */
  persistKey?: string | null;
  children: ReactNode;
}

export function EnvelopeReveal({ paletteId, fontId, monogram, note, names, greeting, persistKey, children }: Props) {
  const pal = paletteById(paletteId);
  const font = fontById(fontId);
  const [opened, setOpened] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    if (persistKey && typeof window !== 'undefined' && sessionStorage.getItem(persistKey) === '1') {
      setOpened(true);
      setMounted(false);
    }
  }, [persistKey]);

  const open = () => {
    if (opened) return;
    setOpened(true);
    if (persistKey && typeof window !== 'undefined') sessionStorage.setItem(persistKey, '1');
    // Let the flap + seal animation play, then unmount the overlay.
    window.setTimeout(() => setMounted(false), 1250);
  };

  const initials = monogram.trim() || (names.split('&').map((s) => s.trim()[0] ?? '').join(' & '));

  return (
    <div style={{ position: 'relative' }}>
      {children}

      <AnimatePresence>
        {mounted && (
          <motion.div
            key="envelope"
            initial={{ opacity: 1 }}
            animate={opened ? { opacity: 0 } : { opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: opened ? 0.6 : 0.3, delay: opened ? 0.6 : 0 }}
            onClick={open}
            role="button"
            aria-label="Åbn invitationen"
            style={{
              position: 'fixed', inset: 0, zIndex: 60, cursor: opened ? 'default' : 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 26, padding: 24,
              background: `radial-gradient(circle at 50% 38%, ${pal.bg} 0%, ${pal.soft} 140%)`,
            }}
          >
            {/* Greeting above the envelope */}
            <div style={{ textAlign: 'center', maxWidth: 460 }}>
              <p style={{ fontFamily: font.body, fontSize: 11, fontWeight: 500, letterSpacing: '0.34em', textTransform: 'uppercase', color: pal.accent, margin: 0 }}>
                {greeting ? greeting : note}
              </p>
              {!greeting && (
                <p style={{ fontFamily: font.head, fontStyle: 'italic', fontSize: 34, lineHeight: 1.1, color: pal.ink, margin: '12px 0 0' }}>
                  {names}
                </p>
              )}
            </div>

            {/* The envelope */}
            <motion.div
              animate={opened ? { y: 40, scale: 0.96 } : { y: 0, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
              style={{ position: 'relative', width: 'min(78vw, 340px)', aspectRatio: '7 / 5', filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.22))' }}
            >
              {/* Body */}
              <div style={{ position: 'absolute', inset: 0, background: pal.soft, borderRadius: 6, overflow: 'hidden' }}>
                {/* Bottom pocket fold lines */}
                <svg viewBox="0 0 140 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                  <path d="M0 100 L70 46 L140 100 Z" fill="rgba(0,0,0,0.05)" />
                  <path d="M0 0 L70 54 L0 100" fill="rgba(255,255,255,0.10)" />
                  <path d="M140 0 L70 54 L140 100" fill="rgba(0,0,0,0.04)" />
                </svg>
              </div>

              {/* Flap (opens upward) */}
              <motion.div
                animate={opened ? { rotateX: -168 } : { rotateX: 0 }}
                transition={{ duration: 0.75, ease: [0.32, 0.72, 0, 1] }}
                style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '54%',
                  transformOrigin: 'top', transformStyle: 'preserve-3d', zIndex: 3,
                }}
              >
                <svg viewBox="0 0 140 76" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
                  <path d="M0 0 L140 0 L70 74 Z" fill={pal.soft} />
                  <path d="M0 0 L70 74 L140 0" fill="rgba(0,0,0,0.06)" />
                </svg>
              </motion.div>

              {/* Wax seal */}
              <motion.div
                animate={opened ? { scale: 0.4, opacity: 0 } : { scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: 'easeIn' }}
                style={{
                  position: 'absolute', top: '48%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 4,
                  width: 62, height: 62, borderRadius: '50%',
                  background: `radial-gradient(circle at 38% 32%, ${pal.accent} 0%, rgba(0,0,0,0.25) 160%)`,
                  boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.25), inset 0 -3px 8px rgba(0,0,0,0.35), 0 3px 6px rgba(0,0,0,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <span style={{ fontFamily: font.head, fontStyle: 'italic', fontSize: 17, letterSpacing: '0.02em', color: pal.bg, opacity: 0.92 }}>
                  {initials}
                </span>
              </motion.div>
            </motion.div>

            {/* Prompt */}
            <motion.p
              animate={opened ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{ fontFamily: font.body, fontSize: 11, fontWeight: 500, letterSpacing: '0.3em', textTransform: 'uppercase', color: pal.ink, opacity: 0.7, margin: 0 }}
            >
              Klik for at åbne
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
