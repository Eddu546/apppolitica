import { describe, expect, it } from 'vitest';
import { buildKpiAuditRows, summarizeKpiAudit } from '@/lib/kpi-audit';

describe('kpi audit', () => {
  it('does not call two different vote definitions a mismatch', () => {
    const rows = buildKpiAuditRows({
      metrics: { votacoesNominais: { value: 12 } },
      portalSummary: { votacoesNominaisPlenario: 270, __meta: {} },
    });
    expect(rows.find((row) => row.id === 'votes').status).toBe('different_definition');
  });

  it('flags comparable values that differ for review', () => {
    const rows = buildKpiAuditRows({
      metrics: { proposicoes: { value: 20 } },
      portalSummary: { propostasAutoria: 21, __meta: {} },
    });
    expect(rows.find((row) => row.id === 'proposals-portal').status).toBe('review');
    expect(summarizeKpiAudit(rows).review).toBe(1);
  });
});
