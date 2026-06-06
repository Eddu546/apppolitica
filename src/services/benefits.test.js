import { describe, expect, it } from 'vitest';
import {
  analyzeVehicleRentalExpenses,
  buildAusteritySeal,
  buildSensitiveCeapSummary,
  parseHousingBenefitsHtml,
} from '@/services/benefits';

describe('benefits and austerity seal', () => {
  it('detecta despesa de veiculo alugado ou fretado na CEAP', () => {
    const despesas = [
      {
        tipoDespesa: 'LOCACAO OU FRETAMENTO DE VEICULOS AUTOMOTORES',
        valorLiquido: '1200.50',
      },
      {
        tipoDespesa: 'COMBUSTIVEIS E LUBRIFICANTES',
        valorLiquido: '300.00',
      },
    ];
    despesas.__meta = { fetchedAt: '2026-05-29T12:00:00.000Z' };

    const result = analyzeVehicleRentalExpenses(despesas, { deputadoId: 204536, ano: 2025 });

    expect(result.status).toBe('available');
    expect(result.usesBenefit).toBe(true);
    expect(result.count).toBe(1);
    expect(result.amount).toBeCloseTo(1200.5);
    expect(result.sourceUrl).toContain('204536');
  });

  it('confirma ausencia de veiculo alugado apenas quando a fonte esta disponivel', () => {
    const despesas = [
      {
        tipoDespesa: 'DIVULGACAO DA ATIVIDADE PARLAMENTAR',
        valorLiquido: '200.00',
      },
    ];
    despesas.__meta = { fetchedAt: '2026-05-29T12:00:00.000Z' };

    const result = analyzeVehicleRentalExpenses(despesas);

    expect(result.status).toBe('available');
    expect(result.usesBenefit).toBe(false);
    expect(result.amount).toBe(0);
  });

  it('le o portal de moradia quando a pagina informa nenhum beneficio', () => {
    const html = '<main><h1>Deputado Teste</h1><p>Nenhum benefício</p></main>';

    const result = parseHousingBenefitsHtml(html);

    expect(result.status).toBe('available');
    expect(result.usesBenefit).toBe(false);
    expect(result.label).toContain('Nenhum beneficio');
  });

  it('mantem moradia em analise quando o HTML nao permite conclusao', () => {
    const html = '<main><h1>Consulta de moradia</h1><p>Pagina indisponivel temporariamente</p></main>';

    const result = parseHousingBenefitsHtml(html);

    expect(result.status).toBe('unavailable');
    expect(result.usesBenefit).toBeNull();
  });

  it('aprova o selo somente quando todas as checagens oficiais passam', () => {
    const seal = buildAusteritySeal({
      vehicleRental: {
        status: 'available',
        usesBenefit: false,
        label: 'Sem veiculo alugado/fretado na CEAP',
      },
      housingBenefits: {
        status: 'available',
        usesBenefit: false,
        label: 'Nenhum beneficio de moradia encontrado',
      },
    });

    expect(seal.status).toBe('approved');
    expect(seal.checks.every((check) => check.passed)).toBe(true);
  });

  it('nao concede selo quando alguma regalia verificavel aparece', () => {
    const seal = buildAusteritySeal({
      vehicleRental: {
        status: 'available',
        usesBenefit: true,
        label: 'Usou cota com veiculo alugado/fretado',
      },
      housingBenefits: {
        status: 'available',
        usesBenefit: false,
        label: 'Nenhum beneficio de moradia encontrado',
      },
    });

    expect(seal.status).toBe('not_approved');
  });

  it('mantem selo em analise quando falta fonte verificavel', () => {
    const seal = buildAusteritySeal({
      vehicleRental: {
        status: 'partial',
        usesBenefit: false,
        label: 'Sem veiculo alugado/fretado na CEAP',
      },
      housingBenefits: {
        status: 'available',
        usesBenefit: false,
        label: 'Nenhum beneficio de moradia encontrado',
      },
    });

    expect(seal.status).toBe('review');
  });

  it('agrupa categorias sensiveis da CEAP com valor, quantidade e participacao', () => {
    const despesas = [
      {
        tipoDespesa: 'LOCACAO OU FRETAMENTO DE VEICULOS AUTOMOTORES',
        valorLiquido: '1000.00',
        nomeFornecedor: 'Locadora A',
        dataDocumento: '2025-01-10',
      },
      {
        tipoDespesa: 'COMBUSTIVEIS E LUBRIFICANTES',
        valorLiquido: '500.00',
        nomeFornecedor: 'Posto B',
        dataDocumento: '2025-02-10',
      },
      {
        tipoDespesa: 'DIVULGACAO DA ATIVIDADE PARLAMENTAR',
        valorLiquido: '250.00',
        nomeFornecedor: 'Grafica C',
        dataDocumento: '2025-03-10',
      },
      {
        tipoDespesa: 'MANUTENCAO DE ESCRITORIO',
        valorLiquido: '250.00',
        nomeFornecedor: 'Fornecedor D',
      },
    ];
    despesas.__meta = { fetchedAt: '2026-05-29T12:00:00.000Z' };

    const summary = buildSensitiveCeapSummary(despesas, { deputadoId: 123, ano: 2025 });

    expect(summary.status).toBe('available');
    expect(summary.total).toBe(2000);
    expect(summary.sensitiveTotal).toBe(1750);
    expect(summary.sensitiveShare).toBeCloseTo(0.875);
    expect(summary.categories).toHaveLength(3);
    expect(summary.categories[0]).toMatchObject({
      id: 'rented_vehicle',
      amount: 1000,
      count: 1,
    });
    expect(summary.sourceUrl).toContain('123');
  });

  it('retorna painel sensivel vazio sem inventar categoria', () => {
    const despesas = [
      {
        tipoDespesa: 'MANUTENCAO DE ESCRITORIO',
        valorLiquido: '300.00',
      },
    ];
    despesas.__meta = { fetchedAt: '2026-05-29T12:00:00.000Z' };

    const summary = buildSensitiveCeapSummary(despesas);

    expect(summary.status).toBe('available');
    expect(summary.sensitiveTotal).toBe(0);
    expect(summary.categories).toEqual([]);
  });
});
