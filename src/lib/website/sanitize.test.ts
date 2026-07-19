import { describe, expect, it } from 'vitest';
import { sanitizeSiteHtml, scrubCss } from './sanitize';
import { resolveHtml, familiesInHtml } from './resolveHtml';

/** Padding so outputs pass the too-small rejection threshold. */
const FILLER = `<section><h2>Program</h2><p>${'Vi glæder os til at fejre dagen sammen med jer. '.repeat(30)}</p></section>`;

describe('sanitizeSiteHtml — the model-output gate', () => {
  it('keeps legitimate site markup, style block and slots', () => {
    const html = sanitizeSiteHtml(`
      <style>#kalas-site h1 { font-family: 'Playfair Display', serif; color: #4a2e33; }</style>
      <header><h1>Anna &amp; Emil</h1>
        <button data-kalas="rsvp" class="btn">Svar udbedes</button>
        <span data-kalas="countdown"></span>
      </header>
      <img src="{{img:V1}}" alt="" class="hero">
      <div data-kalas="registry"></div>
      ${FILLER}`);
    expect(html).not.toBeNull();
    expect(html).toContain('data-kalas="rsvp"');
    expect(html).toContain('data-kalas="registry"');
    expect(html).toContain('data-kalas="countdown"');
    expect(html).toContain('{{img:V1}}');
    expect(html).toContain('Playfair Display');
  });

  it('strips scripts, frames, forms and event handlers', () => {
    const html = sanitizeSiteHtml(`
      <script>alert(1)</script>
      <iframe src="https://evil.example"></iframe>
      <form action="https://evil.example"><input name="pw"></form>
      <div onclick="alert(1)" onmouseover="steal()">Velkommen</div>
      ${FILLER}`);
    expect(html).not.toBeNull();
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('<form');
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('onmouseover');
    expect(html).toContain('Velkommen');
  });

  it('drops images with real URLs — aliases only', () => {
    const html = sanitizeSiteHtml(`
      <img src="https://evil.example/track.gif" alt="">
      <img src="data:image/png;base64,AAAA" alt="">
      <img src="{{img:P1}}" alt="">
      ${FILLER}`);
    expect(html).not.toBeNull();
    expect(html).not.toContain('evil.example');
    expect(html).not.toContain('data:image/png');
    expect(html).toContain('{{img:P1}}');
  });

  it('neutralizes external links and javascript: hrefs', () => {
    const html = sanitizeSiteHtml(`
      <a href="https://evil.example">klik</a>
      <a href="javascript:alert(1)">klik2</a>
      <a href="#rsvp">til RSVP</a>
      ${FILLER}`);
    expect(html).not.toBeNull();
    expect(html).not.toContain('evil.example');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('href="#rsvp"');
  });

  it('scrubs style-attribute url() payloads but keeps alias backgrounds', () => {
    const html = sanitizeSiteHtml(`
      <div style="background-image: url(https://evil.example/x.png); color: #333">a</div>
      <div style="background-image: url({{img:S-dresscode}})">b</div>
      ${FILLER}`);
    expect(html).not.toBeNull();
    expect(html).not.toContain('evil.example');
    expect(html).toContain('url({{img:S-dresscode}})');
  });

  it('rejects implausibly small output', () => {
    expect(sanitizeSiteHtml('<p>hi</p>')).toBeNull();
    expect(sanitizeSiteHtml('')).toBeNull();
  });

  it('strips markdown fences', () => {
    const html = sanitizeSiteHtml('```html\n<div><h1>Anna & Emil</h1></div>' + FILLER + '\n```');
    expect(html).not.toBeNull();
    expect(html).not.toContain('```');
  });
});

describe('scrubCss', () => {
  it('removes @import, expression and non-alias url()', () => {
    const css = scrubCss(`
      @import url("https://evil.example/x.css");
      #kalas-site .a { width: expression(alert(1)); background: url('https://evil.example/bg.png'); }
      #kalas-site .b { background-image: url({{img:V2}}); }
    `);
    expect(css).not.toContain('@import');
    expect(css).not.toContain('expression(');
    expect(css).not.toContain('evil.example');
    expect(css).toContain('url({{img:V2}})');
  });
});

describe('resolveHtml', () => {
  it('substitutes known aliases and blanks unknown ones', () => {
    const out = resolveHtml('<img src="{{img:P1}}"><img src="{{img:GONE}}">', { P1: 'https://cdn/x.jpg' });
    expect(out).toContain('src="https://cdn/x.jpg"');
    expect(out).not.toContain('{{img:');
    expect(out).toContain('data:image/gif');
  });
});

describe('familiesInHtml', () => {
  it('detects catalog families used in the markup', () => {
    const fams = familiesInHtml(
      "<style>h1{font-family:'Playfair Display',serif} p{font-family:Karla}</style>",
      ['Playfair Display', 'Karla', 'Bodoni Moda']
    );
    expect(fams).toEqual(['Playfair Display', 'Karla']);
  });
});
