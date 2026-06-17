import { ensureArray } from '@/services/senado';
import { CONFIDENCE_LEVEL, DATA_STATUS, SOURCES, createKpi, unavailableKpi } from '@/lib/data-quality';
import { summarizeDeputyVotes } from '@/lib/vote-highlights';

export const normalizeText = (text) => {
  if (!text) return '';
  return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
};

export const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

export const formatNumber = (value) => Number(value || 0).toLocaleString('pt-BR');

const parseMoney = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const countMonthsWithExpenses = (despesas) => {
  const months = new Set();
  ensureArray(despesas).forEach((despesa) => {
    const date = despesa.dataDocumento || despesa.mes || despesa.ano;
    if (typeof date === 'string' && date.length >= 7) {
      months.add(date.slice(0, 7));
    }
  });
  return Math.max(months.size, 1);
};

export const groupExpensesByType = (despesas) => {
  const grouped = ensureArray(despesas).reduce((acc, curr) => {
    const tipo = curr.tipoDespesa || 'Outras despesas';
    const valor = parseMoney(curr.valorLiquido);
    if (valor > 0) acc[tipo] = (acc[tipo] || 0) + valor;
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

export const groupExpensesByMonth = (despesas) => {
  const grouped = ensureArray(despesas).reduce((acc, curr) => {
    const date = curr.dataDocumento || '';
    const month = date.length >= 7 ? date.slice(0, 7) : 'Sem data';
    const valor = parseMoney(curr.valorLiquido);
    if (valor > 0) acc[month] = (acc[month] || 0) + valor;
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([month, value]) => ({ month, value }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

export const getTopSupplier = (despesas) => {
  const grouped = ensureArray(despesas).reduce((acc, curr) => {
    const fornecedor = curr.nomeFornecedor || curr.cnpjCpfFornecedor || 'Fornecedor nao informado';
    const valor = parseMoney(curr.valorLiquido);
    if (valor > 0) {
      acc[fornecedor] = {
        name: fornecedor,
        value: (acc[fornecedor]?.value || 0) + valor,
        count: (acc[fornecedor]?.count || 0) + 1,
      };
    }
    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => b.value - a.value)[0] || null;
};

export const buildExpenseAlerts = (despesas) => {
  const total = ensureArray(despesas).reduce((acc, item) => acc + parseMoney(item.valorLiquido), 0);
  const topSupplier = getTopSupplier(despesas);
  const warnings = [];

  if (total > 0 && topSupplier && topSupplier.value / total >= 0.4) {
    warnings.push(
      `Ponto de atencao: ${((topSupplier.value / total) * 100).toFixed(1)}% das despesas ficaram concentradas em ${topSupplier.name}.`
    );
  }

  return warnings;
};

const sourceWithFetch = (source, fetchedAt) => ({
  ...source,
  fetchedAt: fetchedAt || new Date().toISOString(),
});

const sourceFromList = (source, list, fallbackUrl) => ({
  sourceName: list.__meta?.sourceName || source.sourceName,
  sourceUrl: list.__meta?.sourceUrl || fallbackUrl || source.sourceUrl,
  fetchedAt: list.__meta?.fetchedAt || source.fetchedAt,
});

export const buildDeputadoMetrics = ({
  proposicoes = [],
  despesas = [],
  eventos = [],
  discursos = [],
  votacoes = [],
  deputadoId,
  ano,
  fetchedAt,
} = {}) => {
  const listaProposicoes = ensureArray(proposicoes);
  const listaDespesas = ensureArray(despesas);
  const listaEventos = ensureArray(eventos);
  const listaDiscursos = ensureArray(discursos);
  const listaVotacoes = ensureArray(votacoes);
  const camara = sourceWithFetch(SOURCES.camara, fetchedAt);
  const encodedDeputadoId = deputadoId ? encodeURIComponent(deputadoId) : '';
  const encodedAno = ano ? encodeURIComponent(ano) : '';
  const despesasSource = sourceFromList(
    camara,
    listaDespesas,
    encodedDeputadoId
      ? `https://dadosabertos.camara.leg.br/api/v2/deputados/${encodedDeputadoId}/despesas${encodedAno ? `?ano=${encodedAno}` : ''}`
      : 'https://dadosabertos.camara.leg.br/api/v2/deputados'
  );
  const despesasSourcePageUrl = encodedDeputadoId && encodedAno
    ? `/fonte/deputado/${encodedDeputadoId}/despesas/${encodedAno}`
    : '';
  const proposicoesSourcePageUrl = encodedDeputadoId && encodedAno
    ? `/fonte/deputado/${encodedDeputadoId}/proposicoes/${encodedAno}`
    : '';
  const eventosSourcePageUrl = encodedDeputadoId && encodedAno
    ? `/fonte/deputado/${encodedDeputadoId}/eventos/${encodedAno}`
    : '';
  const discursosSourcePageUrl = encodedDeputadoId && encodedAno
    ? `/fonte/deputado/${encodedDeputadoId}/discursos/${encodedAno}`
    : '';
  const votacoesSourcePageUrl = encodedDeputadoId && encodedAno
    ? `/fonte/deputado/${encodedDeputadoId}/votacoes/${encodedAno}`
    : '';
  const proposicoesSource = sourceFromList(
    camara,
    listaProposicoes,
    encodedDeputadoId
      ? `https://dadosabertos.camara.leg.br/api/v2/proposicoes?idDeputadoAutor=${encodedDeputadoId}${encodedAno ? `&ano=${encodedAno}` : ''}`
      : 'https://dadosabertos.camara.leg.br/api/v2/proposicoes'
  );
  const eventosSource = sourceFromList(
    camara,
    listaEventos,
    encodedDeputadoId
      ? `https://dadosabertos.camara.leg.br/api/v2/deputados/${encodedDeputadoId}/eventos`
      : 'https://dadosabertos.camara.leg.br/api/v2/deputados'
  );
  const discursosSource = sourceFromList(
    camara,
    listaDiscursos,
    encodedDeputadoId
      ? `https://dadosabertos.camara.leg.br/api/v2/deputados/${encodedDeputadoId}/discursos`
      : 'https://dadosabertos.camara.leg.br/api/v2/deputados'
  );
  const votacoesSource = sourceFromList(
    camara,
    listaVotacoes,
    'https://dadosabertos.camara.leg.br/api/v2/votacoes'
  );

  const totalGasto = listaDespesas.reduce((acc, d) => acc + parseMoney(d.valorLiquido), 0);
  const months = countMonthsWithExpenses(listaDespesas);
  const mediaMensal = totalGasto / months;
  const categorias = groupExpensesByType(listaDespesas);
  const topSupplier = getTopSupplier(listaDespesas);
  const expenseWarnings = buildExpenseAlerts(listaDespesas);
  const projetosLegislativos = listaProposicoes.filter((p) =>
    ['PL', 'PLP', 'PEC', 'MPV'].includes(p.siglaTipo)
  );
  const proposicoesPorTipo = listaProposicoes.reduce((acc, item) => {
    const tipo = item.siglaTipo || 'Sem tipo';
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});
  const atividadesRegistradas = listaEventos.filter((e) => {
    const tipo = normalizeText(e.descricaoTipo || e.descricao || e.titulo);
    return tipo.includes('SESSAO') || tipo.includes('VOTACAO') || tipo.includes('REUNIAO');
  });
  const resumoVotos = summarizeDeputyVotes(listaVotacoes);

  return {
    totalGastoAno: createKpi({
      id: 'totalGastoAno',
      label: 'Total gasto no ano',
      value: totalGasto,
      unit: 'BRL',
      status: listaDespesas.length ? DATA_STATUS.available : DATA_STATUS.unavailable,
      sourceName: despesasSource.sourceName,
      sourceUrl: despesasSource.sourceUrl,
      sourcePageUrl: despesasSourcePageUrl,
      fetchedAt: despesasSource.fetchedAt,
      confidenceLevel: listaDespesas.length ? CONFIDENCE_LEVEL.high : CONFIDENCE_LEVEL.low,
      calculationMethod: 'Soma dos valores liquidos das despesas parlamentares retornadas pela API da Camara para o ano selecionado.',
      explanationForCitizen: `Este parlamentar declarou ${formatCurrency(totalGasto)} em despesas parlamentares neste ano.`,
      warnings: expenseWarnings,
      breakdown: { categorias },
    }),
    mediaMensalGasto: createKpi({
      id: 'mediaMensalGasto',
      label: 'Media mensal de gastos',
      value: listaDespesas.length ? mediaMensal : null,
      unit: 'BRL',
      status: listaDespesas.length ? DATA_STATUS.available : DATA_STATUS.unavailable,
      sourceName: despesasSource.sourceName,
      sourceUrl: despesasSource.sourceUrl,
      sourcePageUrl: despesasSourcePageUrl,
      fetchedAt: despesasSource.fetchedAt,
      confidenceLevel: CONFIDENCE_LEVEL.high,
      calculationMethod: 'Total gasto dividido pela quantidade de meses com despesas registradas no ano consultado.',
      explanationForCitizen: listaDespesas.length
        ? `Isso equivale a aproximadamente ${formatCurrency(mediaMensal)} por mes com despesa registrada.`
        : 'Nao ha despesas retornadas pela fonte oficial para calcular a media mensal.',
      warnings: [],
    }),
    quantidadeDespesas: createKpi({
      id: 'quantidadeDespesas',
      label: 'Quantidade de despesas',
      value: listaDespesas.length,
      unit: 'despesas',
      status: listaDespesas.length ? DATA_STATUS.available : DATA_STATUS.unavailable,
      sourceName: despesasSource.sourceName,
      sourceUrl: despesasSource.sourceUrl,
      sourcePageUrl: despesasSourcePageUrl,
      fetchedAt: despesasSource.fetchedAt,
      confidenceLevel: CONFIDENCE_LEVEL.high,
      calculationMethod: 'Contagem dos registros de despesa retornados pela API da Camara no ano selecionado.',
      explanationForCitizen: `Foram encontrados ${formatNumber(listaDespesas.length)} registros de despesas declaradas.`,
      warnings: [],
    }),
    maiorFornecedor: createKpi({
      id: 'maiorFornecedor',
      label: 'Maior fornecedor',
      value: topSupplier?.name || null,
      unit: 'texto',
      status: topSupplier ? DATA_STATUS.available : DATA_STATUS.unavailable,
      sourceName: despesasSource.sourceName,
      sourceUrl: despesasSource.sourceUrl,
      sourcePageUrl: despesasSourcePageUrl,
      fetchedAt: despesasSource.fetchedAt,
      confidenceLevel: topSupplier ? CONFIDENCE_LEVEL.high : CONFIDENCE_LEVEL.low,
      calculationMethod: 'Agrupamento das despesas por fornecedor e selecao do maior valor somado.',
      explanationForCitizen: topSupplier
        ? `${topSupplier.name} concentrou ${formatCurrency(topSupplier.value)} em despesas declaradas.`
        : 'Nao ha fornecedor suficiente para calcular este indicador.',
      warnings: expenseWarnings,
      breakdown: topSupplier,
    }),
    proposicoes: createKpi({
      id: 'proposicoes',
      label: 'Proposicoes de autoria encontradas',
      value: listaProposicoes.length,
      unit: 'proposicoes',
      status: DATA_STATUS.available,
      sourceName: proposicoesSource.sourceName,
      sourceUrl: proposicoesSource.sourceUrl,
      sourcePageUrl: proposicoesSourcePageUrl,
      fetchedAt: proposicoesSource.fetchedAt,
      confidenceLevel: CONFIDENCE_LEVEL.high,
      calculationMethod: 'Contagem das proposicoes retornadas pela API da Camara para o deputado e ano selecionado.',
      explanationForCitizen: `Apresentou ou assinou ${formatNumber(listaProposicoes.length)} propostas retornadas pela API neste ano.`,
      warnings: ['Este numero nao significa que as propostas foram aprovadas.'],
      breakdown: proposicoesPorTipo,
    }),
    projetosLegislativos: createKpi({
      id: 'projetosLegislativos',
      label: 'Projetos legislativos',
      value: projetosLegislativos.length,
      unit: 'projetos',
      status: DATA_STATUS.available,
      sourceName: proposicoesSource.sourceName,
      sourceUrl: proposicoesSource.sourceUrl,
      sourcePageUrl: proposicoesSourcePageUrl,
      fetchedAt: proposicoesSource.fetchedAt,
      confidenceLevel: CONFIDENCE_LEVEL.high,
      calculationMethod: 'Recorte das proposicoes cujo tipo e PL, PLP, PEC ou MPV.',
      explanationForCitizen: `${formatNumber(projetosLegislativos.length)} registros sao projetos legislativos como PL, PLP, PEC ou MPV.`,
      warnings: ['Nao mede qualidade, impacto ou aprovacao das propostas.'],
    }),
    atividades: createKpi({
      id: 'atividades',
      label: 'Atividades registradas',
      value: atividadesRegistradas.length,
      unit: 'eventos',
      status: listaEventos.length ? DATA_STATUS.partial : DATA_STATUS.unavailable,
      sourceName: eventosSource.sourceName,
      sourceUrl: eventosSource.sourceUrl,
      sourcePageUrl: eventosSourcePageUrl,
      fetchedAt: eventosSource.fetchedAt,
      confidenceLevel: CONFIDENCE_LEVEL.medium,
      calculationMethod: 'Contagem de eventos oficiais retornados pela agenda da Camara com descricao de sessao, votacao ou reuniao.',
      explanationForCitizen: 'Este indicador considera eventos oficiais registrados na base da Camara. Pode nao representar todas as atividades politicas do parlamentar.',
      warnings: ['Nao confunda atividade registrada com presenca em plenário ou com voto.'],
    }),
    discursos: createKpi({
      id: 'discursos',
      label: 'Discursos registrados',
      value: listaDiscursos.length,
      unit: 'discursos',
      status: listaDiscursos.length ? DATA_STATUS.available : DATA_STATUS.unavailable,
      sourceName: discursosSource.sourceName,
      sourceUrl: discursosSource.sourceUrl,
      sourcePageUrl: discursosSourcePageUrl,
      fetchedAt: discursosSource.fetchedAt,
      confidenceLevel: listaDiscursos.length ? CONFIDENCE_LEVEL.high : CONFIDENCE_LEVEL.low,
      calculationMethod: 'Contagem dos discursos retornados pela API da Camara no periodo consultado.',
      explanationForCitizen: `Foram encontrados ${formatNumber(listaDiscursos.length)} discursos registrados oficialmente.`,
      warnings: [],
    }),
    votacoesNominais: createKpi({
      id: 'votacoesNominais',
      label: 'Votacoes relevantes com voto registrado',
      value: listaVotacoes.length,
      unit: 'votacoes',
      status: listaVotacoes.length ? DATA_STATUS.partial : DATA_STATUS.unavailable,
      sourceName: votacoesSource.sourceName,
      sourceUrl: votacoesSource.sourceUrl,
      sourcePageUrl: votacoesSourcePageUrl,
      fetchedAt: votacoesSource.fetchedAt,
      confidenceLevel: CONFIDENCE_LEVEL.medium,
      calculationMethod: 'Contagem do recorte de votacoes relevantes em que /votacoes/{id}/votos retornou voto nominal do parlamentar no ano selecionado.',
      explanationForCitizen: 'Mostra votacoes nominais abertas selecionadas por relevancia publica, como seguranca, penas, economia, direitos e temas institucionais.',
      warnings: [
        'Nao e a lista completa de todas as votacoes do ano.',
        'Deputados sem registro em uma votacao nao sao marcados como ausentes nesta tela.',
        'Segundo a propria Camara, votos por parlamentar nao listam deputados ausentes.',
      ],
      breakdown: resumoVotos,
    }),
    presenca: unavailableKpi({
      id: 'presenca',
      label: 'Presenca parlamentar',
      source: SOURCES.camara,
      fetchedAt: camara.fetchedAt,
      calculationMethod: 'A API consultada nao fornece, nesta tela, um denominador seguro de eventos esperados para calcular percentual de presenca.',
      explanationForCitizen: 'O FISCALIZA nao transforma ausencia de voto ou de evento em falta sem confirmar a regra oficial.',
      warnings: ['Dado indisponivel nesta versao para evitar acusacao sem base.'],
    }),
    relatorias: unavailableKpi({
      id: 'relatorias',
      label: 'Relatorias e pareceres',
      source: SOURCES.camara,
      fetchedAt: camara.fetchedAt,
      calculationMethod: 'Nao foi encontrada uma fonte oficial direta, nesta consulta, que confirme relatorias aprovadas por deputado.',
      explanationForCitizen: 'Relatoria so sera exibida como numero quando houver fonte oficial capaz de confirmar parlamentar, comissao, data e resultado.',
      warnings: ['Nunca tratamos autoria de proposicao como relatoria.'],
    }),
  };
};

export const buildSenadorMetrics = ({ relatorias = [], votacoes = [], despesas = [], discursos = [], fetchedAt } = {}) => {
  const listaRelatorias = ensureArray(relatorias);
  const listaVotacoes = ensureArray(votacoes);
  const listaDespesas = ensureArray(despesas);
  const listaDiscursos = ensureArray(discursos);
  const senado = sourceWithFetch(SOURCES.senado, fetchedAt);

  return {
    relatorias: listaRelatorias.length
      ? createKpi({
        id: 'relatorias',
        label: 'Materias relatadas',
        value: listaRelatorias.length,
        unit: 'materias',
        status: DATA_STATUS.partial,
        sourceName: senado.sourceName,
        sourceUrl: senado.sourceUrl,
        fetchedAt: senado.fetchedAt,
        confidenceLevel: CONFIDENCE_LEVEL.medium,
        calculationMethod: 'Contagem dos registros de relatoria retornados pela fonte do Senado.',
        explanationForCitizen: 'O numero depende da disponibilidade do servico do Senado para relatorias do parlamentar.',
        warnings: ['Nao e usado como ranking definitivo.'],
      })
      : unavailableKpi({
        id: 'relatorias',
        label: 'Relatorias e pareceres',
        source: SOURCES.senado,
        fetchedAt: senado.fetchedAt,
        calculationMethod: 'A fonte consultada nao retornou registros suficientes para confirmar relatorias.',
        explanationForCitizen: 'O FISCALIZA nao cria numero de relatorias sem retorno oficial verificavel.',
      }),
    votacoes: listaVotacoes.length
      ? createKpi({
        id: 'votacoes',
        label: 'Votacoes registradas',
        value: listaVotacoes.length,
        unit: 'votacoes',
        status: DATA_STATUS.partial,
        sourceName: senado.sourceName,
        sourceUrl: senado.sourceUrl,
        fetchedAt: senado.fetchedAt,
        confidenceLevel: CONFIDENCE_LEVEL.medium,
        calculationMethod: 'Contagem dos registros de votacao retornados pelo Senado para o parlamentar.',
        explanationForCitizen: 'Mostra votacoes retornadas pela fonte oficial. Nao deve ser lido como presenca total.',
        warnings: ['Ausencia de votacao retornada nao prova falta.'],
      })
      : unavailableKpi({
        id: 'votacoes',
        label: 'Votacoes registradas',
        source: SOURCES.senado,
        fetchedAt: senado.fetchedAt,
        calculationMethod: 'A fonte consultada nao retornou dados suficientes de votacao individual.',
        explanationForCitizen: 'Sem retorno oficial verificavel, o FISCALIZA mostra o dado como indisponivel.',
      }),
    despesas: unavailableKpi({
      id: 'despesas',
      label: 'Despesas do senador',
      source: SOURCES.senado,
      fetchedAt: senado.fetchedAt,
      calculationMethod: 'A API integrada nesta versao ainda nao fornece soma auditavel de despesas por senador.',
      explanationForCitizen: 'Consulte o Portal da Transparencia do Senado enquanto este dado nao estiver normalizado no FISCALIZA.',
      warnings: listaDespesas.length ? [] : ['Dado indisponivel nesta integracao.'],
    }),
    discursos: createKpi({
      id: 'discursos',
      label: 'Discursos',
      value: listaDiscursos.length || null,
      unit: 'discursos',
      status: listaDiscursos.length ? DATA_STATUS.partial : DATA_STATUS.unavailable,
      sourceName: senado.sourceName,
      sourceUrl: senado.sourceUrl,
      fetchedAt: senado.fetchedAt,
      confidenceLevel: listaDiscursos.length ? CONFIDENCE_LEVEL.medium : CONFIDENCE_LEVEL.low,
      calculationMethod: 'Contagem dos discursos retornados pela fonte oficial, quando disponivel.',
      explanationForCitizen: listaDiscursos.length
        ? `Foram encontrados ${formatNumber(listaDiscursos.length)} discursos retornados pela fonte.`
        : 'A consulta atual nao retornou discursos para exibir com seguranca.',
      warnings: [],
    }),
  };
};

export const filterComplexProjects = (projetos) => {
  const lista = ensureArray(projetos);
  return lista.filter((p) => ['PEC', 'PLP', 'PL', 'MPV'].includes(p.siglaTipo || p.tipo || ''));
};

export const buildFiscalizationIndex = (metrics) => {
  const components = [
    { id: 'gastos', label: 'Gastos auditaveis', weight: 25, score: metrics.totalGastoAno?.status === DATA_STATUS.available ? 80 : 0 },
    { id: 'proposicoes', label: 'Producao legislativa', weight: 25, score: metrics.proposicoes?.status === DATA_STATUS.available ? 70 : 0 },
    { id: 'atividades', label: 'Atividades registradas', weight: 20, score: metrics.atividades?.status !== DATA_STATUS.unavailable ? 60 : 0 },
    { id: 'votacoes', label: 'Votacoes registradas', weight: 15, score: metrics.votacoesNominais?.status !== DATA_STATUS.unavailable ? 60 : 0 },
    { id: 'qualidade', label: 'Transparencia dos dados', weight: 15, score: 70 },
  ];

  const value = Math.round(
    components.reduce((acc, item) => acc + item.score * (item.weight / 100), 0)
  );

  return createKpi({
    id: 'indiceFiscalizacaoCidada',
    label: 'Indice de Fiscalizacao Cidada',
    value,
    unit: 'pontos',
    status: DATA_STATUS.partial,
    sourceName: 'FISCALIZA - metodologia calculada',
    sourceUrl: '/sobre',
    fetchedAt: new Date().toISOString(),
    confidenceLevel: CONFIDENCE_LEVEL.medium,
    calculationMethod: 'Indicador calculado pelo FISCALIZA combinando disponibilidade de dados, despesas auditaveis, proposicoes, atividades e votacoes registradas.',
    explanationForCitizen: 'Este indice e uma sintese para orientar fiscalizacao cidadã. Nao e dado oficial e nao deve ser usado como acusacao.',
    warnings: ['Indicador calculado pelo site, nao pela Camara ou pelo Senado.', 'Use como ponto de partida para analisar os dados detalhados.'],
    breakdown: components,
  });
};

// Compatibility exports for older screens/tests.
export const calculateDeputadoProducaoLegislativa = (proposicoes) =>
  buildDeputadoMetrics({ proposicoes }).projetosLegislativos;

export const calculateDeputadoGastos = (despesas) =>
  buildDeputadoMetrics({ despesas }).totalGastoAno;

export const calculateDeputadoAssiduity = (eventos) =>
  buildDeputadoMetrics({ eventos }).atividades;

export const calculateDeputadoDiscursos = (discursos) =>
  buildDeputadoMetrics({ discursos }).discursos;

export const calculateDeputadoOverallScore = () =>
  unavailableKpi({
    id: 'overall',
    label: 'Score geral',
    calculationMethod: 'O score geral antigo foi removido por falta de base auditavel.',
    explanationForCitizen: 'O FISCALIZA usa apenas indicadores com fonte e metodo explicados.',
  });

export const calculateSenatorRelatorScore = (relatorias) =>
  buildSenadorMetrics({ relatorias }).relatorias;

export const calculateSenatorAssiduity = (votacoes) =>
  buildSenadorMetrics({ votacoes }).votacoes;

export const calculateSenatorGastos = (despesas) =>
  buildSenadorMetrics({ despesas }).despesas;

export const calculateSenatorDiscursos = (discursos) =>
  buildSenadorMetrics({ discursos }).discursos;

export const calculateSenatorOverallScore = () =>
  unavailableKpi({
    id: 'overall',
    label: 'Score geral',
    calculationMethod: 'O score geral antigo foi removido por falta de base auditavel.',
    explanationForCitizen: 'O FISCALIZA usa apenas indicadores com fonte e metodo explicados.',
  });
