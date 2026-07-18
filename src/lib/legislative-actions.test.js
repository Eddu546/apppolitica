import { describe, expect, it } from 'vitest';
import { buildLegislativeActionsSummary, classifyLegislativeAction } from '@/lib/legislative-actions';

describe('legislative actions', () => {
  it('classifies a vote against a rejected matter without claiming sole causality', () => {
    const result = classifyLegislativeAction({ resultado: 'Rejeitado o requerimento', deputyVote: { vote: 'Não' } });
    expect(result.type).toBe('contributed_to_rejection');
    expect(result.explanation).toContain('contribuiu');
  });

  it('classifies obstruction before generic text changes', () => {
    const result = classifyLegislativeAction({ descricao: 'Destaque da emenda', deputyVote: { vote: 'Obstrução' } });
    expect(result.type).toBe('obstruction');
  });

  it('returns unavailable when the official recorte is empty', () => {
    expect(buildLegislativeActionsSummary([]).status).toBe('unavailable');
  });
});
