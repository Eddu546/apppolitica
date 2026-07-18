import { describe, expect, it } from 'vitest';
import { sanitizeMunicipalityCodes } from '@/services/healthContext';

describe('municipal health context', () => {
  it('accepts only unique seven-digit IBGE municipality codes', () => {
    expect(sanitizeMunicipalityCodes(['2507507', '2507507', 'abc', '3550308'])).toEqual(['2507507', '3550308']);
  });
});

