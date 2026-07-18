import { describe, expect, it } from 'vitest';
import { calculateMandateScore } from '@/lib/mandate-score';

const expenseCohort = Array.from({ length: 10 }, (_, index) => ({
  media_mensal: 10000 + index * 3000,
  quantidade_despesas: 20,
}));

const portalCohort = Array.from({ length: 10 }, (_, index) => ({
  propostas_autoria: index * 10,
  propostas_relatadas: index,
  votacoes_nominais_plenario: 100 + index * 10,
  discursos_plenario: 5 + index * 3,
}));

it('calcula nota de 1 a 10 e informa cobertura completa', () => {
  const score = calculateMandateScore({
    expenseSummary: { media_mensal: 12000, quantidade_despesas: 30 },
    portalSummary: {
      propostas_autoria: 80,
      propostas_relatadas: 8,
      votacoes_nominais_plenario: 180,
      discursos_plenario: 29,
      presenca_plenario: 90,
      ausencias_justificadas_plenario: 5,
      ausencias_nao_justificadas_plenario: 5,
      presenca_comissoes: 80,
      ausencias_justificadas_comissoes: 10,
      ausencias_nao_justificadas_comissoes: 10,
    },
    expenseCohort,
    portalCohort,
  });

  expect(score.value).toBeGreaterThanOrEqual(1);
  expect(score.value).toBeLessThanOrEqual(10);
  expect(score.coverage).toBe(100);
  expect(score.status).toBe('available');
});

it('nao transforma dado ausente em zero e bloqueia nota com cobertura insuficiente', () => {
  const score = calculateMandateScore({
    portalSummary: {
      presenca_plenario: 8,
      ausencias_justificadas_plenario: 1,
      ausencias_nao_justificadas_plenario: 1,
    },
    expenseCohort,
    portalCohort,
  });

  expect(score.components.find((item) => item.id === 'finance').score).toBeNull();
  expect(score.value).toBeNull();
  expect(score.coverage).toBe(30);
  expect(score.status).toBe('unavailable');
});

it('nao premia gasto zerado ou cache sem despesas', () => {
  const score = calculateMandateScore({
    expenseSummary: { media_mensal: 0, quantidade_despesas: 0 },
    portalSummary: portalCohort[5],
    expenseCohort,
    portalCohort,
  });

  expect(score.components.find((item) => item.id === 'finance').score).toBeNull();
});

