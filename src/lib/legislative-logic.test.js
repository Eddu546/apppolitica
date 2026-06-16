import { describe, expect, it } from 'vitest';
import {
  buildDeputadoMetrics,
  buildFiscalizationIndex,
  getTopSupplier,
  groupExpensesByMonth,
  groupExpensesByType,
} from '@/lib/legislative-logic';
import { isDisplayableKpi } from '@/lib/data-quality';

const despesas = [
  {
    valorLiquido: '100.50',
    tipoDespesa: 'COMBUSTIVEIS',
    nomeFornecedor: 'Posto A',
    dataDocumento: '2024-01-10',
  },
  {
    valorLiquido: '200.00',
    tipoDespesa: 'DIVULGACAO',
    nomeFornecedor: 'Grafica B',
    dataDocumento: '2024-02-12',
  },
  {
    valorLiquido: '300.00',
    tipoDespesa: 'DIVULGACAO',
    nomeFornecedor: 'Grafica B',
    dataDocumento: '2024-02-20',
  },
];

describe('legislative KPI calculations', () => {
  it('calcula total, media mensal e quantidade de despesas com fonte rastreavel', () => {
    const metrics = buildDeputadoMetrics({ despesas, fetchedAt: '2026-05-23T12:00:00.000Z' });

    expect(metrics.totalGastoAno.value).toBeCloseTo(600.5);
    expect(metrics.mediaMensalGasto.value).toBeCloseTo(300.25);
    expect(metrics.quantidadeDespesas.value).toBe(3);
    expect(metrics.totalGastoAno.sourceName).toContain('Camara');
    expect(metrics.totalGastoAno.calculationMethod).toContain('Soma');
    expect(isDisplayableKpi(metrics.totalGastoAno)).toBe(true);
  });

  it('usa URLs oficiais reais nos cards quando deputado e ano sao conhecidos', () => {
    const metrics = buildDeputadoMetrics({
      despesas,
      deputadoId: 204536,
      ano: 2025,
      fetchedAt: '2026-05-23T12:00:00.000Z',
    });

    expect(metrics.totalGastoAno.sourceUrl).toContain('/deputados/204536/despesas');
    expect(metrics.totalGastoAno.sourceUrl).toContain('ano=2025');
    expect(metrics.totalGastoAno.sourceUrl).not.toContain('{id}');
  });

  it('agrupa despesas por categoria e por mes sem criar dados artificiais', () => {
    expect(groupExpensesByType(despesas)).toEqual([
      { name: 'DIVULGACAO', value: 500 },
      { name: 'COMBUSTIVEIS', value: 100.5 },
    ]);

    expect(groupExpensesByMonth(despesas)).toEqual([
      { month: '2024-01', value: 100.5 },
      { month: '2024-02', value: 500 },
    ]);
  });

  it('identifica maior fornecedor por soma real de despesas', () => {
    expect(getTopSupplier(despesas)).toMatchObject({
      name: 'Grafica B',
      value: 500,
      count: 2,
    });
  });

  it('mantem relatorias e presenca indisponiveis quando nao ha fonte segura', () => {
    const metrics = buildDeputadoMetrics({});

    expect(metrics.relatorias.status).toBe('unavailable');
    expect(metrics.presenca.status).toBe('unavailable');
    expect(metrics.relatorias.value).toBeNull();
    expect(metrics.presenca.value).toBeNull();
  });

  it('cria indice calculado com aviso de que nao e dado oficial', () => {
    const metrics = buildDeputadoMetrics({ despesas, proposicoes: [{ siglaTipo: 'PL' }] });
    const index = buildFiscalizationIndex(metrics);

    expect(index.status).toBe('partial');
    expect(index.sourceName).toContain('FISCALIZA');
    expect(index.warnings.some((warning) => warning.includes('nao pela Camara'))).toBe(true);
  });
});
