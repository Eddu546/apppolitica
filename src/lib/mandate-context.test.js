import { describe, expect, it } from 'vitest';
import { buildMandateContext, classifyMandateStatus } from '@/lib/mandate-context';

describe('mandate context', () => {
  it('classifies official exercise and leave descriptions', () => {
    expect(classifyMandateStatus({ situacao: 'Exercício' })).toBe('active');
    expect(classifyMandateStatus({ situacao: 'Licença para tratamento de saúde' })).toBe('inactive');
  });

  it('calculates a partial year only when the timeline is known', () => {
    const history = [
      { dataHora: '2023-01-01T00:00:00Z', situacao: 'Exercício' },
      { dataHora: '2025-07-01T00:00:00Z', situacao: 'Licença' },
    ];
    const context = buildMandateContext({ history, year: 2025 });
    expect(context.status).toBe('partial');
    expect(context.activeDays).toBeGreaterThan(170);
    expect(context.activeDays).toBeLessThan(190);
  });

  it('keeps exact days unavailable when the initial state is unknown', () => {
    const context = buildMandateContext({ history: [], year: 2025 });
    expect(context.status).toBe('unknown');
    expect(context.activeDays).toBeNull();
  });
});
