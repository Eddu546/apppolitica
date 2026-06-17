export const SUPPORT_URL = 'https://apoia.se/fiscaliza';

export const SUPPORT_MONTHLY_GOAL = 3500;

export const supportBudgetItems = [
  {
    label: 'Manutenção técnica especializada',
    value: 1800,
    description:
      'Correções, revisão de código, novas páginas, testes, melhorias de performance e acompanhamento de erros.',
  },
  {
    label: 'Pesquisa e validação de dados públicos',
    value: 750,
    description:
      'Conferência de APIs oficiais, documentação de fontes, revisão de KPIs e checagem manual de casos sensíveis.',
  },
  {
    label: 'Ferramentas de IA, produtividade e edição',
    value: 450,
    description:
      'Apoio a ferramentas usadas para acelerar desenvolvimento, revisar textos, criar materiais e melhorar a experiência do usuário.',
  },
  {
    label: 'Design, comunicação e conteúdo cívico',
    value: 350,
    description:
      'Peças visuais, textos explicativos, revisão de linguagem cidadã e materiais para divulgar o projeto.',
  },
  {
    label: 'Reserva operacional e infraestrutura',
    value: 150,
    description:
      'Domínio futuro, pequenos serviços, contingências e expansão gradual. A infraestrutura atual prioriza planos gratuitos.',
  },
];

export const supportRewards = [
  {
    title: 'Apoiador da Transparência',
    value: 10,
    description:
      'Obrigado por apoiar o FISCALIZA. Seu apoio ajuda a manter uma ferramenta pública, independente e gratuita de fiscalização parlamentar.',
  },
  {
    title: 'Nome na página de apoiadores',
    value: 20,
    description:
      'Além do agradecimento, seu nome poderá aparecer na página pública de apoiadores do FISCALIZA, caso você autorize. A publicação é opcional.',
  },
  {
    title: 'Bastidores do projeto',
    value: 35,
    description:
      'Você poderá receber atualizações sobre melhorias, novas fontes de dados, problemas corrigidos e próximos passos do FISCALIZA.',
  },
  {
    title: 'Sugestões com prioridade',
    value: 50,
    description:
      'Você poderá sugerir pautas, filtros e melhorias para análise prioritária. O apoio não altera dados, rankings ou validações.',
  },
];

export const supportTransparencyRules = [
  'O apoio financia a manutenção do projeto cívico FISCALIZA.',
  'O apoio não é doação eleitoral, não financia campanha e não compra influência política.',
  'Dados públicos continuam gratuitos e verificáveis por qualquer cidadão.',
  'Nenhum apoiador pode alterar KPI, ranking, fonte ou validação por contribuir financeiramente.',
];

export const getSupportBudgetTotal = () =>
  supportBudgetItems.reduce((total, item) => total + item.value, 0);

export const getSupportBudgetShare = (value) => {
  if (!SUPPORT_MONTHLY_GOAL) return 0;
  return Math.round((Number(value || 0) / SUPPORT_MONTHLY_GOAL) * 100);
};
