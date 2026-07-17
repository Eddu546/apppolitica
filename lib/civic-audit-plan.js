export const civicAuditQuestions = [
  {
    id: 'priority',
    label: 'O que voce quer fiscalizar primeiro?',
    options: [
      {
        value: 'expenses',
        label: 'Gastos publicos',
        description: 'CEAP, fornecedores, media nacional e categorias sensiveis.',
      },
      {
        value: 'alerts',
        label: 'Pontos de atencao',
        description: 'Padroes fora da media que merecem leitura da fonte oficial.',
      },
      {
        value: 'proposals',
        label: 'Propostas e votos',
        description: 'Proposicoes, atividades registradas e votacoes nominais.',
      },
      {
        value: 'corrections',
        label: 'Dados contestados',
        description: 'Metricas enviadas por cidadaos e validadas manualmente.',
      },
    ],
  },
  {
    id: 'scope',
    label: 'Qual recorte ajuda mais agora?',
    options: [
      {
        value: 'state',
        label: 'Meu estado',
        description: 'Comparar parlamentares dentro da mesma unidade federativa.',
      },
      {
        value: 'national',
        label: 'Brasil inteiro',
        description: 'Olhar tendencias nacionais quando a base estiver completa.',
      },
      {
        value: 'specific',
        label: 'Um parlamentar',
        description: 'Entrar no perfil individual e ler fonte por fonte.',
      },
    ],
  },
  {
    id: 'depth',
    label: 'Quanto tempo voce quer gastar?',
    options: [
      {
        value: 'quick',
        label: '10 minutos',
        description: 'Um caminho curto para achar sinais principais.',
      },
      {
        value: 'compare',
        label: 'Comparar 2 nomes',
        description: 'Ver dois parlamentares lado a lado com os mesmos criterios.',
      },
      {
        value: 'deep',
        label: 'Analise completa',
        description: 'Passar por gastos, alertas, proposicoes, votos e validacoes.',
      },
    ],
  },
];

const auditAreas = {
  expenses: {
    id: 'expenses',
    title: 'Comece pelos gastos declarados',
    description:
      'Veja total gasto no ano, media mensal, fornecedor principal e categorias da CEAP. Use menor e maior gasto para evitar conclusoes por uma unica ponta do ranking.',
    link: '/rankings',
    linkLabel: 'Abrir rankings',
    sourceName: 'Camara dos Deputados - Dados Abertos',
    confidenceLevel: 'high',
    calculationMethod:
      'Soma dos valores liquidos das despesas CEAP sincronizadas no Supabase a partir da API oficial da Camara.',
  },
  alerts: {
    id: 'alerts',
    title: 'Depois leia os pontos de atencao',
    description:
      'Procure concentracao de gasto em fornecedor, categorias sensiveis e valores acima da media. Esses sinais orientam a fiscalizacao, mas nao acusam irregularidade.',
    link: '/alertas',
    linkLabel: 'Ver pontos de atencao',
    sourceName: 'Camara dos Deputados - Dados Abertos',
    confidenceLevel: 'medium',
    calculationMethod:
      'Regras publicas do FISCALIZA aplicadas sobre despesas oficiais sincronizadas: concentracao, comparacao com media e peso de categoria sensivel.',
  },
  proposals: {
    id: 'proposals',
    title: 'Confira producao legislativa e votos',
    description:
      'No perfil individual, leia proposicoes, atividades registradas, discursos e votacoes nominais quando a API retornar dados confirmaveis.',
    link: '/deputados',
    linkLabel: 'Buscar deputados',
    sourceName: 'Camara dos Deputados - Dados Abertos',
    confidenceLevel: 'medium',
    calculationMethod:
      'Consulta direta aos endpoints oficiais disponiveis. Ausencia de retorno aparece como dado indisponivel, nao como zero definitivo.',
  },
  corrections: {
    id: 'corrections',
    title: 'Veja dados validados manualmente',
    description:
      'Quando um cidadao ou gabinete envia uma correcao com fonte, ela so aparece publicamente depois de revisao manual.',
    link: '/dados-validados',
    linkLabel: 'Abrir dados validados',
    sourceName: 'Supabase Free + revisao manual do FISCALIZA',
    confidenceLevel: 'medium',
    calculationMethod:
      'Registro enviado por formulario, revisado por administrador e publicado com fonte informada pelo solicitante.',
  },
  compare: {
    id: 'compare',
    title: 'Compare dois parlamentares sem ranking automatico',
    description:
      'Use a comparacao lado a lado para ver os mesmos indicadores em dois perfis. A tela nao define quem e melhor; ela mostra os dados para leitura cidada.',
    link: '/comparar',
    linkLabel: 'Comparar parlamentares',
    sourceName: 'Camara dos Deputados - Dados Abertos',
    confidenceLevel: 'medium',
    calculationMethod:
      'Leitura dos mesmos KPIs auditaveis para dois parlamentares selecionados pelo usuario.',
  },
};

const uniqueById = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const buildOrderedSteps = (answers = {}) => {
  const priority = answers.priority || 'expenses';
  const depth = answers.depth || 'quick';
  const ordered = [auditAreas[priority], auditAreas.alerts, auditAreas.expenses, auditAreas.proposals];

  if (depth === 'compare') {
    ordered.unshift(auditAreas.compare);
  }

  if (depth === 'deep') {
    ordered.push(auditAreas.corrections, auditAreas.compare);
  }

  if (priority === 'corrections') {
    ordered.unshift(auditAreas.corrections);
  }

  return uniqueById(ordered.filter(Boolean));
};

export const buildCivicAuditPlan = (answers = {}) => {
  const steps = buildOrderedSteps(answers);
  const scope = answers.scope || 'national';
  const depth = answers.depth || 'quick';

  const scopeText = {
    state: 'Priorize comparacoes dentro do mesmo estado antes de olhar o ranking nacional.',
    national: 'Use dados nacionais somente quando a base anual estiver marcada como completa.',
    specific: 'Comece pelo perfil individual e abra as fontes exibidas em cada card.',
  }[scope];

  const depthText = {
    quick: 'Roteiro curto: foque nos dois primeiros passos e abra a fonte oficial antes de concluir qualquer coisa.',
    compare: 'Roteiro comparativo: escolha dois parlamentares e compare os mesmos indicadores, sem transformar diferenca em acusacao.',
    deep: 'Roteiro completo: passe por todos os blocos e registre evidencias quando encontrar algo que precise de correcao.',
  }[depth];

  return {
    title: 'Roteiro de fiscalizacao cidada',
    summary: `${scopeText} ${depthText}`,
    status: 'educational',
    confidenceLevel: 'medium',
    sourceName: 'FISCALIZA',
    calculationMethod:
      'Roteiro editorial gerado a partir das prioridades do usuario. Ele nao mede voto, ideologia, honestidade nem afinidade parlamentar.',
    warnings: [
      'Este roteiro nao e um dado oficial.',
      'Ele nao calcula afinidade politica e nao recomenda parlamentares.',
      'Use sempre os cards de fonte antes de publicar qualquer conclusao.',
    ],
    steps,
  };
};
