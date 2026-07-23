'use client';

/* Public share page for a digital invitation. Renders the chosen template
   full-bleed (tap-open / countdown live) with a floating RSVP + copy-link bar
   and an RSVP modal that writes to /api/i/[slug]/rsvp. */

import { useState } from 'react';
import { InvitationStage } from '@/kalas/invitations/PhoneFrame';
import { getTemplate } from '@/kalas/invitations/templates';
import type { InvitationData } from '@/kalas/invitations/types';

export function PublicInvitation({ slug, templateId, data }: { slug: string; templateId: string; data: InvitationData }) {
  const template = getTemplate(templateId);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const da = data.language === 'da';

  if (!template) return null;
  const { Component } = template;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#12100e', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <InvitationStage>
        <Component data={data} onRsvp={() => setRsvpOpen(true)} />
      </InvitationStage>

      {/* Floating action bar */}
      <div style={{ position: 'fixed', bottom: 18, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 10, zIndex: 80 }}>
        <button onClick={() => setRsvpOpen(true)} style={barBtn(true)}>
          {data.rsvpLabel || (da ? 'Bekræft deltagelse' : 'RSVP')}
        </button>
        <button onClick={copyLink} style={barBtn(false)}>
          {copied ? (da ? 'Kopieret ✓' : 'Copied ✓') : (da ? 'Kopiér link' : 'Copy link')}
        </button>
      </div>

      {rsvpOpen && <RsvpModal slug={slug} language={data.language} onClose={() => setRsvpOpen(false)} />}
    </div>
  );
}

function barBtn(primary: boolean): React.CSSProperties {
  return {
    fontFamily: "'Jost', system-ui, sans-serif",
    fontSize: 11,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    padding: '11px 20px',
    borderRadius: 999,
    cursor: 'pointer',
    border: primary ? 'none' : '1px solid rgba(239,233,223,.3)',
    background: primary ? '#efe9df' : 'transparent',
    color: primary ? '#12100e' : '#efe9df',
    backdropFilter: 'blur(6px)',
  };
}

function RsvpModal({ slug, language, onClose }: { slug: string; language: 'da' | 'en'; onClose: () => void }) {
  const da = language === 'da';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [attending, setAttending] = useState<boolean | null>(null);
  const [note, setNote] = useState('');
  const [company, setCompany] = useState(''); // honeypot
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!name.trim() || attending === null) {
      setError(da ? 'Udfyld navn og svar.' : 'Please add your name and answer.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/i/${slug}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, attending, note, company }),
      });
      if (res.ok) setDone(true);
      else setError(da ? 'Noget gik galt — prøv igen.' : 'Something went wrong — try again.');
    } catch {
      setError(da ? 'Noget gik galt — prøv igen.' : 'Something went wrong — try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 360, background: '#fbf9f5', borderRadius: 18, padding: 26, fontFamily: "'Jost', system-ui, sans-serif", color: '#2a261f' }}>
        {done ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26 }}>{da ? 'Tak!' : 'Thank you!'}</p>
            <p style={{ fontSize: 13, color: '#6b6459', marginTop: 8 }}>{da ? 'Dit svar er registreret.' : 'Your reply is in.'}</p>
            <button onClick={onClose} style={{ ...barBtn(true), marginTop: 20 }}>{da ? 'Luk' : 'Close'}</button>
          </div>
        ) : (
          <>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, marginBottom: 16 }}>{da ? 'Bekræft deltagelse' : 'RSVP'}</p>

            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={da ? 'Dit navn' : 'Your name'} style={field} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={da ? 'Email (valgfri)' : 'Email (optional)'} style={field} />

            <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
              <button onClick={() => setAttending(true)} style={choice(attending === true)}>{da ? 'Kommer' : 'Attending'}</button>
              <button onClick={() => setAttending(false)} style={choice(attending === false)}>{da ? 'Kan ikke' : "Can't make it"}</button>
            </div>

            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={da ? 'Besked (valgfri)' : 'Note (optional)'} rows={2} style={{ ...field, resize: 'none' }} />

            {/* honeypot */}
            <input value={company} onChange={(e) => setCompany(e.target.value)} tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }} aria-hidden />

            {error && <p style={{ color: '#b34e37', fontSize: 12, marginTop: 6 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={onClose} style={{ ...choice(false), flex: 1 }}>{da ? 'Annullér' : 'Cancel'}</button>
              <button onClick={submit} disabled={busy} style={{ ...barBtn(true), flex: 1, opacity: busy ? 0.6 : 1 }}>
                {busy ? (da ? 'Sender…' : 'Sending…') : (da ? 'Send svar' : 'Send reply')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const field: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  marginTop: 8,
  borderRadius: 10,
  border: '1px solid #e0d8c8',
  background: '#fff',
  fontSize: 14,
  fontFamily: 'inherit',
  color: '#2a261f',
};

function choice(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: '10px 12px',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'inherit',
    border: active ? '1px solid #2a261f' : '1px solid #e0d8c8',
    background: active ? '#2a261f' : '#fff',
    color: active ? '#fbf9f5' : '#2a261f',
  };
}
