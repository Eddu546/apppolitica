import { describe, expect, it } from 'vitest';
import { buildDeputyKpiVerificationRows, summarizeVerificationCoverage } from '@/lib/kpi-verification';

describe('kpi verification', () => {
  it('shows portal KPIs as comparable and keeps external checks only when unavailable', () => {
    const rows = buildDeputyKpiVerificationRows({
      deputyId: 204536,
      year: 2026,
      metrics: {
        proposicoes: { id: 'proposicoes', value: 178, status: 'available' },
        discursos: { id: 'discursos', value: 174, status: 'available' },
        votacoesPlenario: { id: 'votacoesPlenario', value: 111, status: 'available' },
        relatorias: { id: 'relatorias', value: 24, status: 'available' },
        presenca: { id: 'presenca', value: '54 dias / 40 reunioes', status: 'available' },
        totalGastoAno: { id: 'totalGastoAno', value: 1234, status: 'available' },
      },
    });

    expect(rows.find((row) => row.id === 'proposicoes')).toMatchObject({
      status: 'comparable',
      internalSourceUrl: '/fonte/deputado/204536/proposicoes/2026',
    });
    expect(rows.find((row) => row.id === 'votacoesPlenario')).toMatchObject({
      status: 'comparable',
      fiscalizaValue: 111,
      officialUrl: 'https://www.camara.leg.br/deputados/204536/votacoes-nominais-plenario/2026',
    });
    expect(rows.find((row) => row.id === 'relatorias')).toMatchObject({
      status: 'comparable',
      fiscalizaValue: 24,
    });
    expect(rows.find((row) => row.id === 'presenca')).toMatchObject({
      status: 'comparable',
      fiscalizaValue: '54 dias / 40 reunioes',
    });
  });

  it('summarizes verification coverage', () => {
    const rows = buildDeputyKpiVerificationRows({ deputyId: 204536, year: 2026 });
    expect(summarizeVerificationCoverage(rows)).toEqual({
      comparable: 4,
      differentScope: 0,
      externalCheck: 2,
      total: 6,
    });
  });
});
