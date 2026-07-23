'use client';

/* Dev-only parity harness: renders all 20 templates with the source sample
   content, grouped by mood, inside the phone frame — to confirm the port
   matches invitationer-final.html and that nothing clips. Visit /dev/templates. */

import { useInvitationFonts } from '@/kalas/invitations/fonts';
import { PhoneFrame } from '@/kalas/invitations/PhoneFrame';
import { templatesByGroup } from '@/kalas/invitations/templates';
import { sampleData } from '@/kalas/invitations/data';

export default function DevTemplatesPage() {
  useInvitationFonts();
  const groups = templatesByGroup();

  return (
    <div style={{ background: '#12100e', color: '#efe9df', minHeight: '100vh', padding: '48px 22px 110px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 300, marginBottom: 8 }}>Invitation templates — parity harness</h1>
        <p style={{ color: '#8a8074', fontSize: 14, marginBottom: 40 }}>
          All templates with sample content. Tap Sceau / Déco / Lettre to open; Minuit &amp; Céleste count down live.
        </p>

        {groups.map(({ group, label, templates }) => (
          <section key={group} style={{ marginBottom: 56 }}>
            <p style={{ textTransform: 'uppercase', letterSpacing: '.34em', fontSize: 11, color: '#8a8074', marginBottom: 24 }}>{label}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 48, justifyItems: 'center' }}>
              {templates.map((tpl) => {
                const { Component } = tpl;
                return (
                  <div key={tpl.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <PhoneFrame>
                      <Component data={sampleData(tpl)} />
                    </PhoneFrame>
                    <p style={{ marginTop: 16, fontSize: 16 }}>{tpl.name}</p>
                    <p style={{ fontSize: 11, color: '#8a8074', textTransform: 'uppercase', letterSpacing: '.14em' }}>{tpl.subtitle}</p>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
