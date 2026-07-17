import { describe, expect, it } from 'vitest';
import { filterAndSortByFields, filterAndSortByName, normalizeSearchText, rankNameMatch } from '@/lib/search';

describe('search helpers', () => {
  it('normaliza texto removendo acentos e espacos extras', () => {
    expect(normalizeSearchText('  Mário   Negromonte  ')).toBe('mario negromonte');
  });

  it('prioriza nomes que comecam com a busca', () => {
    const items = [
      { nome: 'Allan Garces' },
      { nome: 'Kim Kataguiri' },
      { nome: 'Akim Silva' },
    ];

    const result = filterAndSortByName(items, 'kim');

    expect(result.map((item) => item.nome)).toEqual(['Kim Kataguiri', 'Akim Silva']);
  });

  it('permite buscar por iniciais de nome e sobrenome sem trazer nomes irrelevantes', () => {
    const items = [
      { nome: 'Allan Garces' },
      { nome: 'Augusto Pupio' },
      { nome: 'Kim Kataguiri' },
      { nome: 'Mariana Carvalho' },
    ];

    const result = filterAndSortByName(items, 'kim k');

    expect(result.map((item) => item.nome)).toEqual(['Kim Kataguiri']);
  });

  it('encontra nomes depois da letra m sem depender de select nativo', () => {
    expect(rankNameMatch('Nicoletti', 'nic')).toBeGreaterThan(0);
    expect(rankNameMatch('Zeca Dirceu', 'zec')).toBeGreaterThan(0);
  });

  it('permite busca global por partido e estado sem perder a prioridade do nome', () => {
    const items = [
      { nome: 'Kim Kataguiri', partido: 'MISSÃO', uf: 'SP', cargo: 'Deputado Federal' },
      { nome: 'João da Paraíba', partido: 'PSB', uf: 'PB', cargo: 'Deputado Federal' },
      { nome: 'Maria Silva', partido: 'PT', uf: 'PB', cargo: 'Senadora' },
    ];

    expect(filterAndSortByFields(items, 'missao', ['nome', 'partido', 'uf', 'cargo']).map((item) => item.nome)).toEqual(['Kim Kataguiri']);
    expect(filterAndSortByFields(items, 'PB', ['nome', 'partido', 'uf', 'cargo']).map((item) => item.nome)).toEqual(['João da Paraíba', 'Maria Silva']);
  });
});
