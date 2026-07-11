import { describe, expect, it } from 'vitest';
import { getLegislativeYears, normalizeLegislativeYear } from '@/lib/legislative-years';

describe('legislative years', () => {
  it('builds the available years from the current legislature', () => {
    expect(getLegislativeYears({ startYear: 2023, endYear: 2026 })).toEqual([
      '2023',
      '2024',
      '2025',
      '2026',
    ]);
  });

  it('rejects unsupported years and uses the informed fallback', () => {
    expect(normalizeLegislativeYear('1999', '2025')).toBe('2025');
  });
});
