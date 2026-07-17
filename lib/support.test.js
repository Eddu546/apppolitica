import { describe, expect, it } from 'vitest';
import {
  SUPPORT_MONTHLY_GOAL,
  SUPPORT_URL,
  getSupportBudgetShare,
  getSupportBudgetTotal,
  supportRewards,
  supportTransparencyRules,
} from '@/lib/support';

describe('support configuration', () => {
  it('mantem a meta mensal igual a soma dos custos declarados', () => {
    expect(getSupportBudgetTotal()).toBe(SUPPORT_MONTHLY_GOAL);
  });

  it('usa o link oficial de apoio informado para o Fiscaliza', () => {
    expect(SUPPORT_URL).toBe('https://apoia.se/fiscaliza');
  });

  it('mantem recompensa minima acessivel e regras de independencia visiveis', () => {
    const minimumReward = Math.min(...supportRewards.map((reward) => reward.value));

    expect(minimumReward).toBe(10);
    expect(supportTransparencyRules.join(' ')).toContain('não é doação eleitoral');
    expect(supportTransparencyRules.join(' ')).toContain('não compra influência política');
  });

  it('calcula a participacao de cada custo na meta mensal', () => {
    expect(getSupportBudgetShare(350)).toBe(10);
  });
});
