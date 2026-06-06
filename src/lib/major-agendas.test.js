import { describe, expect, it } from 'vitest';
import { searchMajorAgendas } from './major-agendas';

describe('major agenda search', () => {
  it('finds agendas by popular name', () => {
    const results = searchMajorAgendas('fake news');

    expect(results[0].apelido_pauta).toContain('Fake News');
    expect(results[0].numero_proposicao).toContain('PL 2630/2020');
  });

  it('finds agendas by official number', () => {
    const results = searchMajorAgendas('PEC 45/2019');

    expect(results[0].apelido_pauta).toBe('Reforma Tributária');
  });

  it('finds agendas by civic theme', () => {
    const results = searchMajorAgendas('saidinha');

    expect(results[0].apelido_pauta).toContain('Saidinhas');
  });
});
