import { describe, it, expect } from 'vitest';
import { LANGUAGES, translate } from './i18n';
import { APP_LANGUAGES } from '@/lib/db/types';

describe('i18n registry', () => {
  it('registers exactly the languages in APP_LANGUAGES', () => {
    expect(LANGUAGES.map((l) => l.code).sort()).toEqual([...APP_LANGUAGES].sort());
  });

  it('treats Danish as the source language (no dictionary)', () => {
    const da = LANGUAGES.find((l) => l.code === 'da');
    expect(da?.dict).toBeUndefined();
    // Source strings pass through untouched.
    expect(translate('da', 'Godkend & send')).toBe('Godkend & send');
  });

  it('translates via the target dictionary', () => {
    expect(translate('en', 'Godkend & send')).toBe('Approve & send');
    expect(translate('en', 'Kontakt')).toBe('Contact');
  });

  it('falls back to the source string for an unknown key', () => {
    expect(translate('en', 'En streng der ikke findes')).toBe('En streng der ikke findes');
  });

  it('interpolates {named} params in either language', () => {
    expect(translate('en', 'Skrevet på {sprog}', { sprog: 'Danish' })).toBe('Written in Danish');
    expect(translate('da', 'Skrevet på {sprog}', { sprog: 'dansk' })).toBe('Skrevet på dansk');
  });
});
