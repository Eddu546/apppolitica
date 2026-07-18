import { describe, expect, it } from 'vitest';
import { buildAgendaImpactEvidence } from '@/lib/agenda-impact';

describe('agenda impact evidence', () => {
  it('does not infer impact without an official proposal', () => {
    expect(buildAgendaImpactEvidence({}).status).toBe('unavailable');
  });

  it('recognizes a confirmed legislative outcome but keeps social warning', () => {
    const result = buildAgendaImpactEvidence({ proposal: { siglaTipo: 'PL', numero: 1, ano: 2024, statusProposicao: { descricaoSituacao: 'Transformado em Norma Jurídica' } } });
    expect(result.status).toBe('available');
    expect(result.warnings[0]).toContain('não é o mesmo');
  });

  it('uses official procedures to build a traceable timeline', () => {
    const result = buildAgendaImpactEvidence({
      proposal: { siglaTipo: 'PL', numero: 1, ano: 2024 },
      procedures: [
        { dataHora: '2024-01-10T12:00:00Z', descricaoTramitacao: 'Apresentação da proposição' },
        { dataHora: '2024-06-10T12:00:00Z', descricaoSituacao: 'Aprovado em comissão' },
      ],
      themes: [{ tema: 'Saúde' }],
    });
    expect(result.timeline).toHaveLength(2);
    expect(result.themes).toEqual(['Saúde']);
    expect(result.stage).toContain('Aprovação');
  });
});
