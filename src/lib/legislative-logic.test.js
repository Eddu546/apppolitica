import { describe, expect, it } from 'vitest';
import {
  buildDeputadoMetrics,
  buildProfileDataCoverage,
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
    expect(metrics.totalGastoAno.sourcePageUrl).toBe('/fonte/deputado/204536/despesas/2025');
    expect(metrics.proposicoes.sourcePageUrl).toBe('/fonte/deputado/204536/proposicoes/2025');
    expect(metrics.atividades.sourcePageUrl).toBe('/fonte/deputado/204536/eventos/2025');
    expect(metrics.discursos.sourcePageUrl).toBe('/fonte/deputado/204536/discursos/2025');
    expect(metrics.votacoesNominais.sourcePageUrl).toBe('/fonte/deputado/204536/votacoes/2025');
  });

  it('prioriza os numeros do portal publico da Camara nos cards de resumo anual', () => {
    const metrics = buildDeputadoMetrics({
      proposicoes: [{ siglaTipo: 'PL' }, { siglaTipo: 'REQ' }],
      discursos: [{ id: 1 }],
      portalResumo: {
        propostasAutoria: 588,
        propostasRelatadas: 42,
        votacoesNominaisPlenario: 270,
        discursosPlenario: 27,
        presencaPlenario: {
          presencas: 80,
          ausenciasJustificadas: 5,
          ausenciasNaoJustificadas: 2,
        },
        presencaComissoes: {
          presencas: 123,
          ausenciasJustificadas: 1,
          ausenciasNaoJustificadas: 13,
        },
        __meta: {
          fetchedAt: '2026-06-18T12:00:00.000Z',
          sourceName: 'Camara dos Deputados - Portal do Deputado',
          sourceUrl: 'https://www.camara.leg.br/deputados/204536?ano=2024',
        },
      },
    });

    expect(metrics.proposicoes.value).toBe(588);
    expect(metrics.proposicoes.sourceUrl).toContain('ano=2024');
    expect(metrics.proposicoes.sourcePageUrl).toBe('');
    expect(metrics.discursos.value).toBe(27);
    expect(metrics.votacoesPlenario.value).toBe(270);
    expect(metrics.relatorias.value).toBe(42);
    expect(metrics.relatorias.status).toBe('available');
    expect(metrics.presencaPlenario.value).toBe('80 de 87 dias');
    expect(metrics.presencaPlenario.breakdown.totalEsperado).toBe(87);
    expect(metrics.presencaPlenario.details).toContainEqual({ label: 'Total previsto', value: '87 dias' });
    expect(metrics.presencaComissoes.value).toBe('123 de 137 reunioes');
    expect(metrics.presencaComissoes.breakdown.totalEsperado).toBe(137);
    expect(metrics.presenca.value).toBe('Plenario: 80/87 / Comissoes: 123/137');
    expect(metrics.presenca.status).toBe('available');
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

  it('nao transforma falha da fonte em zero oficial', () => {
    const despesasComErro = [];
    despesasComErro.__meta = { error: 'Status 503', fetchedAt: '2026-07-10T12:00:00.000Z' };
    const despesasVazias = [];
    despesasVazias.__meta = { fetchedAt: '2026-07-10T12:00:00.000Z' };

    const failedMetrics = buildDeputadoMetrics({ despesas: despesasComErro });
    const emptyMetrics = buildDeputadoMetrics({ despesas: despesasVazias });

    expect(failedMetrics.totalGastoAno.status).toBe('error');
    expect(failedMetrics.totalGastoAno.value).toBeNull();
    expect(emptyMetrics.totalGastoAno.status).toBe('available');
    expect(emptyMetrics.totalGastoAno.value).toBe(0);
  });

  it('calcula somente a cobertura dos dados, sem avaliar o parlamentar', () => {
    const metrics = buildDeputadoMetrics({ despesas, proposicoes: [{ siglaTipo: 'PL' }] });
    const index = buildProfileDataCoverage(metrics);

    expect(index.status).toBe('partial');
    expect(index.sourceName).toContain('FISCALIZA');
    expect(index.label).toBe('Cobertura dos dados do perfil');
    expect(index.explanationForCitizen).toContain('não mede qualidade');
  });
});
