import { describe, expect, it } from 'vitest';
import { buildCivicAuditPlan, civicAuditQuestions } from './civic-audit-plan';

describe('buildCivicAuditPlan', () => {
  it('builds an educational plan without political affinity claims', () => {
    const plan = buildCivicAuditPlan({ priority: 'expenses', scope: 'national', depth: 'quick' });

    expect(plan.status).toBe('educational');
    expect(plan.calculationMethod).toContain('nao mede voto');
    expect(plan.warnings.join(' ')).toContain('nao calcula afinidade politica');
    expect(plan.steps[0].id).toBe('expenses');
    expect(plan.steps[0]).not.toHaveProperty('affinity');
  });

  it('prioritizes comparison when the user asks to compare names', () => {
    const plan = buildCivicAuditPlan({ priority: 'alerts', scope: 'state', depth: 'compare' });

    expect(plan.steps[0].id).toBe('compare');
    expect(plan.summary).toContain('mesmo estado');
  });

  it('includes manually validated data in the deep route', () => {
    const plan = buildCivicAuditPlan({ priority: 'proposals', scope: 'specific', depth: 'deep' });

    expect(plan.steps.map((step) => step.id)).toContain('corrections');
    expect(plan.summary).toContain('perfil individual');
  });
});

describe('civicAuditQuestions', () => {
  it('offers explicit choices without ideology mapping', () => {
    const questionText = JSON.stringify(civicAuditQuestions).toLowerCase();

    expect(questionText).toContain('gastos publicos');
    expect(questionText).not.toContain('direita');
    expect(questionText).not.toContain('esquerda');
  });
});
