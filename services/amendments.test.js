import { describe, expect, it } from 'vitest';
import { normalizeAmendment, parseMoney, summarizeAmendments } from '@/services/amendments';

describe('amendments service', () => {
  it('parses Brazilian money strings', () => {
    expect(parseMoney('R$ 1.234,56')).toBe(1234.56);
  });

  it('normalizes and summarizes official records', () => {
    const records = [normalizeAmendment({
      codigoEmenda: '1',
      nomeAutor: 'Pessoa',
      localidadeDoGasto: 'João Pessoa - PB',
      codigoIbgeMunicipio: '2507507',
      funcao: 'Saúde',
      nomeFavorecido: 'Fundo Municipal de Saúde',
      valorEmpenhado: 1000,
      valorPago: 500,
    })];
    expect(records[0].location).toBe('João Pessoa - PB');
    expect(records[0].municipalityCode).toBe('2507507');
    const summary = summarizeAmendments(records);
    expect(summary.executionRate).toBe(50);
    expect(summary.topFunctions[0].name).toBe('Saúde');
    expect(summary.topFavored[0].name).toBe('Fundo Municipal de Saúde');
  });
});
