import { describe, expect, it } from 'vitest';
import {
  buildDeputyAnnualExpenseSummary,
  buildSensitiveCategoryAttentionPoints,
  buildSpendingAttentionPoints,
  buildSupplierBreakdown,
  buildSupplierNetwork,
  computeExpenseComparisons,
  decorateSummariesWithSensitiveCategory,
  getSensitiveCategoryAmountFromSummary,
  getAnnualSummaryBaseStatus,
  selectLiveSampleDeputies,
} from '@/services/annualSummaries';

describe('annual summaries', () => {
  it('monta amostra ao vivo distribuida entre UFs sem usar aleatoriedade', () => {
    const deputados = [
      { id: 1, nome: 'Ana', siglaUf: 'SP' },
      { id: 2, nome: 'Bruno', siglaUf: 'SP' },
      { id: 3, nome: 'Carlos', siglaUf: 'PB' },
      { id: 4, nome: 'Diana', siglaUf: 'RJ' },
    ];

    expect(selectLiveSampleDeputies(deputados, 3).map((item) => item.siglaUf)).toEqual(['PB', 'RJ', 'SP']);
  });

  it('gera resumo anual de despesas com fonte e metodo', () => {
    const despesas = [
      { valorLiquido: '100.00', tipoDespesa: 'COMBUSTIVEL', nomeFornecedor: 'Posto A', dataDocumento: '2024-01-10' },
      { valorLiquido: '300.00', tipoDespesa: 'DIVULGACAO', nomeFornecedor: 'Grafica B', dataDocumento: '2024-02-10' },
    ];
    despesas.__meta = { fetchedAt: '2026-05-23T12:00:00.000Z' };

    const summary = buildDeputyAnnualExpenseSummary({
      deputado: { id: 123, nome: 'Deputado Teste', siglaPartido: 'ABC', siglaUf: 'SP' },
      despesas,
      ano: '2024',
    });

    expect(summary.deputado_id).toBe('123');
    expect(summary.total_gasto).toBe(400);
    expect(summary.media_mensal).toBe(200);
    expect(summary.maior_fornecedor).toBe('Grafica B');
    expect(summary.categorias).toEqual([
      { name: 'DIVULGACAO', value: 300, count: 1 },
      { name: 'COMBUSTIVEL', value: 100, count: 1 },
    ]);
    expect(summary.status).toBe('available');
    expect(summary.calculation_method).toContain('valores liquidos');
  });

  it('agrupa fornecedores por documento e cria rede entre deputados', () => {
    const suppliers = buildSupplierBreakdown([
      { valorLiquido: '100', nomeFornecedor: 'Empresa A', cnpjCpfFornecedor: '11.111.111/0001-11' },
      { valorLiquido: '200', nomeFornecedor: 'Empresa A Ltda', cnpjCpfFornecedor: '11.111.111/0001-11' },
    ]);

    expect(suppliers).toHaveLength(1);
    expect(suppliers[0].value).toBe(300);

    const network = buildSupplierNetwork([
      { deputado_id: '1', nome: 'Deputado A', fornecedores: suppliers },
      { deputado_id: '2', nome: 'Deputado B', fornecedores: suppliers },
    ]);
    expect(network[0].deputyCount).toBe(2);
    expect(network[0].value).toBe(600);
  });

  it('bloqueia ranking nacional quando a base anual esta incompleta', () => {
    const current = {
      ano: '2024',
      deputado_id: '1',
      nome: 'Atual',
      uf: 'SP',
      total_gasto: 1000,
      fetched_at: '2026-05-23T12:00:00.000Z',
    };

    const comparison = computeExpenseComparisons(current, [
      { deputado_id: '2', uf: 'SP', total_gasto: 500 },
      { deputado_id: '3', uf: 'RJ', total_gasto: 700 },
    ]);

    expect(comparison.status).toBe('unavailable');
    expect(comparison.reason).toContain('pelo menos 450');
  });

  it('calcula medias e rankings quando a base anual esta completa', () => {
    const current = {
      ano: '2024',
      deputado_id: '1',
      nome: 'Atual',
      uf: 'SP',
      total_gasto: 1000,
      source_url: 'https://dadosabertos.camara.leg.br',
      fetched_at: '2026-05-23T12:00:00.000Z',
    };

    const summaries = Array.from({ length: 460 }, (_, index) => ({
      deputado_id: String(index + 2),
      uf: index < 20 ? 'SP' : 'RJ',
      total_gasto: index + 1,
    }));

    const comparison = computeExpenseComparisons(current, summaries);

    expect(comparison.status).toBe('available');
    expect(comparison.nationalCount).toBe(461);
    expect(comparison.nationalRank).toBe(1);
    expect(comparison.stateRank).toBe(1);
    expect(comparison.nationalAverage).toBeGreaterThan(0);
    expect(comparison.calculationMethod).toContain('Supabase');
  });

  it('classifica a qualidade da base anual antes de exibir ranking', () => {
    expect(getAnnualSummaryBaseStatus([]).status).toBe('unavailable');
    expect(getAnnualSummaryBaseStatus([{ deputado_id: '1' }]).status).toBe('partial');
    expect(getAnnualSummaryBaseStatus(Array.from({ length: 450 }, (_, index) => ({ deputado_id: String(index) }))).status).toBe('available');
  });

  it('gera pontos de atencao responsaveis sem acusacao', () => {
    const points = buildSpendingAttentionPoints([
      {
        ano: '2025',
        deputado_id: '1',
        nome: 'Deputado A',
        partido: 'AAA',
        uf: 'SP',
        total_gasto: 1000,
        maior_fornecedor: 'Fornecedor X',
        maior_fornecedor_valor: 500,
        source_name: 'Camara',
        source_url: 'https://dadosabertos.camara.leg.br',
        fetched_at: '2026-05-29T12:00:00.000Z',
      },
      {
        ano: '2025',
        deputado_id: '2',
        nome: 'Deputado B',
        partido: 'BBB',
        uf: 'RJ',
        total_gasto: 100,
        maior_fornecedor: 'Fornecedor Y',
        maior_fornecedor_valor: 10,
      },
    ]);

    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({
      type: 'supplier_concentration',
      level: 'medium',
      deputyName: 'Deputado A',
    });
    expect(points[0].explanation).toContain('não indica irregularidade sozinho');
  });

  it('calcula recorte de ranking por categoria sensivel salva no resumo', () => {
    const summaries = [
      {
        deputado_id: '1',
        nome: 'Deputado A',
        total_gasto: 1000,
        quantidade_despesas: 10,
        categorias: [
          { name: 'COMBUSTIVEIS E LUBRIFICANTES', value: 300, count: 3 },
          { name: 'DIVULGACAO DA ATIVIDADE PARLAMENTAR', value: 700, count: 7 },
        ],
      },
      {
        deputado_id: '2',
        nome: 'Deputado B',
        total_gasto: 500,
        quantidade_despesas: 5,
        categorias: [
          { name: 'COMBUSTIVEIS E LUBRIFICANTES', value: 50, count: 1 },
        ],
      },
    ];

    expect(getSensitiveCategoryAmountFromSummary(summaries[0], 'fuel')).toBe(300);

    const decorated = decorateSummariesWithSensitiveCategory(summaries, 'fuel');

    expect(decorated[0]).toMatchObject({
      ranking_value: 300,
      ranking_count: 3,
    });
    expect(decorated[0].ranking_share).toBeCloseTo(0.3);
    expect(decorated[1].ranking_value).toBe(50);
  });

  it('mantem contagem do recorte como nao informada quando o cache antigo nao tem count', () => {
    const [decorated] = decorateSummariesWithSensitiveCategory([
      {
        deputado_id: '1',
        total_gasto: 1000,
        categorias: [{ name: 'COMBUSTIVEIS E LUBRIFICANTES', value: 300 }],
      },
    ], 'fuel');

    expect(decorated.ranking_value).toBe(300);
    expect(decorated.ranking_count).toBeNull();
  });

  it('gera ponto de atencao por categoria sensivel com peso alto no total', () => {
    const points = buildSensitiveCategoryAttentionPoints([
      {
        ano: '2025',
        deputado_id: '1',
        nome: 'Deputado A',
        partido: 'AAA',
        uf: 'SP',
        total_gasto: 100000,
        source_name: 'Camara',
        source_url: 'https://dadosabertos.camara.leg.br',
        fetched_at: '2026-05-29T12:00:00.000Z',
        categorias: [
          { name: 'COMBUSTIVEIS E LUBRIFICANTES', value: 30000, count: 12 },
        ],
      },
    ]);

    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({
      type: 'sensitive_category_share',
      categoryId: 'fuel',
      level: 'high',
      recordCount: 12,
    });
    expect(points[0].explanation).toContain('não indica irregularidade sozinho');
  });

  it('inclui categorias sensiveis no motor geral de pontos de atencao', () => {
    const points = buildSpendingAttentionPoints([
      {
        ano: '2025',
        deputado_id: '1',
        nome: 'Deputado A',
        partido: 'AAA',
        uf: 'SP',
        total_gasto: 100000,
        maior_fornecedor_valor: 0,
        categorias: [
          { name: 'DIVULGACAO DA ATIVIDADE PARLAMENTAR', value: 50000, count: 8 },
        ],
      },
    ]);

    expect(points.some((point) => point.type === 'sensitive_category_share')).toBe(true);
  });

  it('gera ponto responsavel quando despesas estao ausentes no resumo anual', () => {
    const points = buildSpendingAttentionPoints([
      {
        ano: '2025',
        deputado_id: '1',
        nome: 'Deputado Sem Despesa',
        partido: 'AAA',
        uf: 'SP',
        total_gasto: 0,
        quantidade_despesas: 0,
        maior_fornecedor_valor: 0,
      },
    ]);

    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({
      type: 'missing_expense_data',
      level: 'medium',
      recordCount: 0,
    });
    expect(points[0].explanation).toContain('não prova automaticamente');
  });

  it('gera ponto de possivel mandato parcial apenas como sinal de contexto', () => {
    const base = Array.from({ length: 450 }, (_, index) => ({
      ano: '2025',
      deputado_id: String(index + 2),
      nome: `Deputado ${index + 2}`,
      partido: 'AAA',
      uf: 'SP',
      total_gasto: 100000,
      quantidade_despesas: 40,
      maior_fornecedor_valor: 0,
    }));

    const points = buildSpendingAttentionPoints([
      ...base,
      {
        ano: '2025',
        deputado_id: '1',
        nome: 'Deputado Poucos Registros',
        partido: 'BBB',
        uf: 'PB',
        total_gasto: 3000,
        quantidade_despesas: 2,
        maior_fornecedor_valor: 0,
      },
    ]);

    const point = points.find((item) => item.type === 'possible_partial_mandate');
    expect(point).toMatchObject({
      deputyName: 'Deputado Poucos Registros',
      level: 'medium',
      recordCount: 2,
    });
    expect(point.explanation).toContain('não é conclusão sobre conduta');
  });
});
