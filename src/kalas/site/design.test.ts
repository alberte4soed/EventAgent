import { describe, expect, it } from 'vitest';
import { DEFAULT_DESIGN, parseSiteDesign } from './design';
import { googleFontsHref } from './fonts';

describe('parseSiteDesign — the model-output trust boundary', () => {
  it('returns the default design for garbage input', () => {
    expect(parseSiteDesign(null)).toEqual(DEFAULT_DESIGN);
    expect(parseSiteDesign(undefined)).toEqual(DEFAULT_DESIGN);
    expect(parseSiteDesign('not an object')).toEqual(DEFAULT_DESIGN);
    expect(parseSiteDesign(42)).toEqual(DEFAULT_DESIGN);
    expect(parseSiteDesign([])).toEqual(DEFAULT_DESIGN);
  });

  it('accepts a valid palette and normalizes hex to lowercase', () => {
    const d = parseSiteDesign({ palette: { bg: '#FFEEDD', accent: '#1A2B3C' } });
    expect(d.palette.bg).toBe('#ffeedd');
    expect(d.palette.accent).toBe('#1a2b3c');
  });

  it('rejects CSS-injection attempts in color fields', () => {
    const d = parseSiteDesign({
      palette: {
        bg: 'url(javascript:alert(1))',
        text: '#123; background: red',
        accent: 'expression(alert(1))',
        surface: '#12345',           // wrong length
        muted: 'red',                // named colors not allowed
        onAccent: '#12345678',       // 8-digit not allowed
      },
    });
    expect(d.palette.bg).toBe(DEFAULT_DESIGN.palette.bg);
    expect(d.palette.text).toBe(DEFAULT_DESIGN.palette.text);
    expect(d.palette.accent).toBe(DEFAULT_DESIGN.palette.accent);
    expect(d.palette.surface).toBe(DEFAULT_DESIGN.palette.surface);
    expect(d.palette.muted).toBe(DEFAULT_DESIGN.palette.muted);
    expect(d.palette.onAccent).toBe(DEFAULT_DESIGN.palette.onAccent);
  });

  it('clamps heroOverlay into [0, 0.9]', () => {
    expect(parseSiteDesign({ palette: { heroOverlay: 5 } }).palette.heroOverlay).toBe(0.9);
    expect(parseSiteDesign({ palette: { heroOverlay: -1 } }).palette.heroOverlay).toBe(0);
    expect(parseSiteDesign({ palette: { heroOverlay: 'dark' } }).palette.heroOverlay).toBe(
      DEFAULT_DESIGN.palette.heroOverlay
    );
  });

  it('coerces unknown enum values to defaults', () => {
    const d = parseSiteDesign({
      hero: { variant: 'parallax-3d' },
      shape: { radius: 'extreme', density: 'quantum' },
      decor: { style: '<script>' },
    });
    expect(d.hero.variant).toBe(DEFAULT_DESIGN.hero.variant);
    expect(d.shape.radius).toBe(DEFAULT_DESIGN.shape.radius);
    expect(d.shape.density).toBe(DEFAULT_DESIGN.shape.density);
    expect(d.decor.style).toBe(DEFAULT_DESIGN.decor.style);
  });

  it('only allows fonts from the catalog', () => {
    const ok = parseSiteDesign({ typography: { displayFont: 'playfair', bodyFont: 'inter' } });
    expect(ok.typography.displayFont).toBe('playfair');
    expect(ok.typography.bodyFont).toBe('inter');
    const bad = parseSiteDesign({ typography: { displayFont: 'Comic Sans MS, cursive' } });
    expect(bad.typography.displayFont).toBe(DEFAULT_DESIGN.typography.displayFont);
  });

  it('drops invalid sections, deduplicates, and coerces per-section variants', () => {
    const d = parseSiteDesign({
      sections: [
        { id: 'story', variant: 'quote', bg: 'surface' },
        { id: 'story', variant: 'centered', bg: 'default' }, // duplicate → dropped
        { id: 'evil', variant: 'x', bg: 'default' },         // unknown id → dropped
        { id: 'program', variant: 'quote', bg: 'nope' },     // wrong variant for program
      ],
    });
    expect(d.sections.map((s) => s.id)).toEqual(['story', 'program']);
    expect(d.sections[0].variant).toBe('quote');
    expect(d.sections[1].variant).toBe('timeline'); // program default
    expect(d.sections[1].bg).toBe('default');
  });

  it('falls back to default sections when the list is empty or invalid', () => {
    expect(parseSiteDesign({ sections: [] }).sections).toEqual(DEFAULT_DESIGN.sections);
    expect(parseSiteDesign({ sections: 'none' }).sections).toEqual(DEFAULT_DESIGN.sections);
  });

  it('sanitizes photo references to a safe charset', () => {
    const d = parseSiteDesign({
      images: {
        heroPhotoId: '../../etc/passwd',
        galleryPhotoIds: ['P1', 'b7e3a2c4-1111-2222-3333-444455556666', 'x'.repeat(50), { evil: 1 }],
      },
    });
    expect(d.images.heroPhotoId).toBe('');
    expect(d.images.galleryPhotoIds).toEqual(['P1', 'b7e3a2c4-1111-2222-3333-444455556666']);
  });

  it('truncates over-long copy but keeps it as plain text', () => {
    const d = parseSiteDesign({ copy: { tagline: 'x'.repeat(1000) } });
    expect(d.copy.tagline.length).toBe(140);
  });

  it('round-trips its own default (stored designs stay stable)', () => {
    expect(parseSiteDesign(JSON.parse(JSON.stringify(DEFAULT_DESIGN)))).toEqual(DEFAULT_DESIGN);
  });
});

describe('googleFontsHref', () => {
  it('builds a css2 url for the requested families, deduped', () => {
    const href = googleFontsHref(['playfair', 'playfair', 'inter']);
    expect(href).toContain('fonts.googleapis.com/css2');
    expect(href).toContain('Playfair+Display');
    expect(href).toContain('Inter');
    expect(href.match(/Playfair\+Display/g)).toHaveLength(1);
    expect(href).toContain('display=swap');
  });

  it('falls back to the catalog default for unknown ids', () => {
    const href = googleFontsHref(['definitely-not-a-font']);
    expect(href).toContain('fonts.googleapis.com/css2');
  });
});
