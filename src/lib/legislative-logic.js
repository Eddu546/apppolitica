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

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildPresenceBreakdown = (presence = {}, singularLabel, pluralLabel) => {
  const presencas = safeNumber(presence.presencas);
  const justificadas = safeNumber(presence.ausenciasJustificadas);
  const naoJustificadas = safeNumber(presence.ausenciasNaoJustificadas);
  const total = presencas + justificadas + naoJustificadas;
  const label = total === 1 ? singularLabel : pluralLabel;

  return {
    total,
    presencas,
    justificadas,
    naoJustificadas,
    label,
    displayValue: `${formatNumber(presencas)} de ${formatNumber(total)} ${label}`,
    details: [
      { label: 'Total previsto', value: `${formatNumber(total)} ${label}` },
      { label: 'Presenças', value: `${formatNumber(presencas)} ${label}` },
      { label: 'Justificadas', value: `${formatNumber(justificadas)} ${label}` },
      { label: 'Não justificadas', value: `${formatNumber(naoJustificadas)} ${label}` },
    ],
  };
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

const getListDataStatus = (list, { limited = false } = {}) => {
  if (list.__meta?.error) return DATA_STATUS.error;
  if (list.length || list.__meta?.fetchedAt) {
    return limited ? DATA_STATUS.partial : DATA_STATUS.available;
  }
  return DATA_STATUS.unavailable;
};

export const buildDeputadoMetrics = ({
  proposicoes = [],
  despesas = [],
  eventos = [],
  discursos = [],
  votacoes = [],
  portalResumo,
  deputadoId,
  ano,
  fetchedAt,
} = {}) => {
  const listaProposicoes = ensureArray(proposicoes);
  const listaDespesas = ensureArray(despesas);
  const listaEventos = ensureArray(eventos);
  const listaDiscursos = ensureArray(discursos);
  const listaVotacoes = ensureArray(votacoes);
  const despesasStatus = getListDataStatus(listaDespesas);
  const proposicoesStatus = getListDataStatus(listaProposicoes);
  const eventosStatus = getListDataStatus(listaEventos, { limited: true });
  const discursosStatus = getListDataStatus(listaDiscursos);
  const votacoesStatus = getListDataStatus(listaVotacoes, { limited: true });
  const usesPortalDirectVotes = Boolean(listaVotacoes.__meta?.portalDirectSourceUsed);
  const camara = sourceWithFetch(SOURCES.camara, fetchedAt);
  const portalSource = portalResumo
    ? {
      sourceName: portalResumo.__meta?.sourceName || 'Camara dos Deputados - Portal do Deputado',
      sourceUrl: portalResumo.__meta?.sourceUrl || camara.sourceUrl,
      fetchedAt: portalResumo.__meta?.fetchedAt || camara.fetchedAt,
    }
    : null;
  const getPortalNumber = (key) => {
    const value = portalResumo?.[key];
    return Number.isFinite(value) ? value : null;
  };
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
  const portalPropostasAutoria = getPortalNumber('propostasAutoria');
  const portalPropostasRelatadas = getPortalNumber('propostasRelatadas');
  const portalVotacoesPlenario = getPortalNumber('votacoesNominaisPlenario');
  const portalDiscursosPlenario = getPortalNumber('discursosPlenario');
  const portalPresencaPlenario = portalResumo?.presencaPlenario || {};
  const portalPresencaComissoes = portalResumo?.presencaComissoes || {};
  const hasPortalPropostas = portalPropostasAutoria !== null;
  const hasPortalRelatorias = portalPropostasRelatadas !== null;
  const hasPortalVotacoes = portalVotacoesPlenario !== null;
  const hasPortalDiscursos = portalDiscursosPlenario !== null;
  const hasPortalPresencaPlenario = Number.isFinite(portalPresencaPlenario.presencas);
  const hasPortalPresencaComissoes = Number.isFinite(portalPresencaComissoes.presencas);
  const hasPortalPresenca = hasPortalPresencaPlenario || hasPortalPresencaComissoes;
  const portalWarnings = portalResumo?.__meta?.stale
    ? ['A atualização ao vivo falhou; este número usa o último cache oficial disponível e mostra a data da consulta.']
    : [];
  const presencaPlenarioResumo = hasPortalPresencaPlenario
    ? buildPresenceBreakdown(portalPresencaPlenario, 'dia', 'dias')
    : null;
  const presencaComissoesResumo = hasPortalPresencaComissoes
    ? buildPresenceBreakdown(portalPresencaComissoes, 'reuniao', 'reunioes')
    : null;
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
      value: despesasStatus === DATA_STATUS.error ? null : totalGasto,
      unit: 'BRL',
      status: despesasStatus,
      sourceName: despesasSource.sourceName,
      sourceUrl: despesasSource.sourceUrl,
      sourcePageUrl: despesasSourcePageUrl,
      fetchedAt: despesasSource.fetchedAt,
      confidenceLevel: despesasStatus === DATA_STATUS.available ? CONFIDENCE_LEVEL.high : CONFIDENCE_LEVEL.low,
      calculationMethod: 'Soma dos valores liquidos das despesas parlamentares retornadas pela API da Camara para o ano selecionado.',
      explanationForCitizen: despesasStatus === DATA_STATUS.error
        ? 'Não foi possível confirmar o total porque a fonte oficial falhou nesta consulta.'
        : 'Este parlamentar declarou ' + formatCurrency(totalGasto) + ' em despesas parlamentares neste ano.',
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
      value: despesasStatus === DATA_STATUS.error ? null : listaDespesas.length,
      unit: 'despesas',
      status: despesasStatus,
      sourceName: despesasSource.sourceName,
      sourceUrl: despesasSource.sourceUrl,
      sourcePageUrl: despesasSourcePageUrl,
      fetchedAt: despesasSource.fetchedAt,
      confidenceLevel: CONFIDENCE_LEVEL.high,
      calculationMethod: 'Contagem dos registros de despesa retornados pela API da Camara no ano selecionado.',
      explanationForCitizen: despesasStatus === DATA_STATUS.error
        ? 'Não foi possível confirmar a quantidade porque a fonte oficial falhou nesta consulta.'
        : 'Foram encontrados ' + formatNumber(listaDespesas.length) + ' registros de despesas declaradas.',
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
      label: hasPortalPropostas ? 'Propostas legislativas no portal' : 'Proposicoes de autoria encontradas',
      value: hasPortalPropostas || proposicoesStatus !== DATA_STATUS.error
        ? (hasPortalPropostas ? portalPropostasAutoria : listaProposicoes.length)
        : null,
      unit: 'proposicoes',
      status: hasPortalPropostas ? DATA_STATUS.available : proposicoesStatus,
      sourceName: hasPortalPropostas ? portalSource.sourceName : proposicoesSource.sourceName,
      sourceUrl: hasPortalPropostas ? portalSource.sourceUrl : proposicoesSource.sourceUrl,
      sourcePageUrl: hasPortalPropostas ? '' : proposicoesSourcePageUrl,
      fetchedAt: hasPortalPropostas ? portalSource.fetchedAt : proposicoesSource.fetchedAt,
      confidenceLevel: CONFIDENCE_LEVEL.high,
      calculationMethod: hasPortalPropostas
        ? 'Numero exibido no resumo publico do Portal da Camara para propostas legislativas de autoria no ano selecionado.'
        : 'Contagem das proposicoes retornadas pela API da Camara para o deputado e ano selecionado.',
      explanationForCitizen: hasPortalPropostas
        ? `O Portal da Camara informa ${formatNumber(portalPropostasAutoria)} propostas legislativas de autoria neste ano.`
        : `Apresentou ou assinou ${formatNumber(listaProposicoes.length)} propostas retornadas pela API neste ano.`,
      warnings: [
        'Este numero nao significa que as propostas foram aprovadas.',
        ...portalWarnings,
        ...(hasPortalPropostas
          ? ['A lista tecnica de proposicoes do FISCALIZA pode ter tamanho diferente porque vem de outro endpoint dos Dados Abertos.']
          : []),
      ],
      breakdown: proposicoesPorTipo,
    }),
    projetosLegislativos: createKpi({
      id: 'projetosLegislativos',
      label: 'Projetos legislativos',
      value: proposicoesStatus === DATA_STATUS.error ? null : projetosLegislativos.length,
      unit: 'projetos',
      status: proposicoesStatus,
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
      status: eventosStatus,
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
      value: hasPortalDiscursos || discursosStatus !== DATA_STATUS.error
        ? (hasPortalDiscursos ? portalDiscursosPlenario : listaDiscursos.length)
        : null,
      unit: 'discursos',
      status: hasPortalDiscursos ? DATA_STATUS.available : discursosStatus,
      sourceName: hasPortalDiscursos ? portalSource.sourceName : discursosSource.sourceName,
      sourceUrl: hasPortalDiscursos ? portalSource.sourceUrl : discursosSource.sourceUrl,
      sourcePageUrl: hasPortalDiscursos ? '' : discursosSourcePageUrl,
      fetchedAt: hasPortalDiscursos ? portalSource.fetchedAt : discursosSource.fetchedAt,
      confidenceLevel: hasPortalDiscursos || listaDiscursos.length ? CONFIDENCE_LEVEL.high : CONFIDENCE_LEVEL.low,
      calculationMethod: hasPortalDiscursos
        ? 'Numero exibido no resumo publico do Portal da Camara para discursos em Plenario no ano selecionado.'
        : 'Contagem dos discursos retornados pela API da Camara no periodo consultado.',
      explanationForCitizen: hasPortalDiscursos
        ? `O Portal da Camara informa ${formatNumber(portalDiscursosPlenario)} discursos em Plenario neste ano.`
        : `Foram encontrados ${formatNumber(listaDiscursos.length)} discursos registrados oficialmente.`,
      warnings: portalWarnings,
    }),
    votacoesPlenario: hasPortalVotacoes
      ? createKpi({
        id: 'votacoesPlenario',
        label: 'Votacoes nominais em Plenario',
        value: portalVotacoesPlenario,
        unit: 'votacoes',
        status: DATA_STATUS.available,
        sourceName: portalSource.sourceName,
        sourceUrl: portalSource.sourceUrl,
        fetchedAt: portalSource.fetchedAt,
        confidenceLevel: CONFIDENCE_LEVEL.high,
        calculationMethod: 'Numero exibido no resumo publico do Portal da Camara para votacoes nominais em Plenario no ano selecionado.',
        explanationForCitizen: `O Portal da Camara informa ${formatNumber(portalVotacoesPlenario)} votacoes nominais em Plenario neste ano.`,
        warnings: ['Este total do portal nao e a mesma coisa que o recorte de votacoes relevantes exibido na aba Votacoes.', ...portalWarnings],
      })
      : unavailableKpi({
        id: 'votacoesPlenario',
        label: 'Votacoes nominais em Plenario',
        source: SOURCES.camara,
        fetchedAt: camara.fetchedAt,
        calculationMethod: 'O resumo publico do portal da Camara nao retornou este total nesta consulta.',
        explanationForCitizen: 'Quando disponivel, este indicador reproduz o numero exibido no portal da Camara.',
      }),
    votacoesNominais: createKpi({
      id: 'votacoesNominais',
      label: 'Votacoes relevantes com voto registrado',
      value: votacoesStatus === DATA_STATUS.error ? null : listaVotacoes.length,
      unit: 'votacoes',
      status: votacoesStatus,
      sourceName: votacoesSource.sourceName,
      sourceUrl: votacoesSource.sourceUrl,
      sourcePageUrl: votacoesSourcePageUrl,
      fetchedAt: votacoesSource.fetchedAt,
      confidenceLevel: usesPortalDirectVotes ? CONFIDENCE_LEVEL.high : CONFIDENCE_LEVEL.medium,
      calculationMethod: usesPortalDirectVotes
        ? 'Contagem do recorte temático extraído da página oficial de votações nominais em Plenário do deputado para o ano selecionado.'
        : 'Contagem do recorte de votações relevantes em que os Dados Abertos retornaram voto nominal do parlamentar no ano selecionado.',
      explanationForCitizen: 'Mostra votacoes nominais abertas selecionadas por relevancia publica, como seguranca, penas, economia, direitos e temas institucionais.',
      warnings: [
        'Nao e a lista completa de todas as votacoes do ano.',
        'Deputados sem registro em uma votacao nao sao marcados como ausentes nesta tela.',
        'Segundo a propria Camara, votos por parlamentar nao listam deputados ausentes.',
      ],
      breakdown: resumoVotos,
    }),
    presencaPlenario: hasPortalPresencaPlenario
      ? createKpi({
        id: 'presencaPlenario',
        label: 'Presenca em Plenario',
        value: presencaPlenarioResumo.displayValue,
        unit: 'texto',
        status: DATA_STATUS.available,
        sourceName: portalSource.sourceName,
        sourceUrl: portalSource.sourceUrl,
        fetchedAt: portalSource.fetchedAt,
        confidenceLevel: CONFIDENCE_LEVEL.high,
        calculationMethod: 'Total previsto calculado como presencas + ausencias justificadas + ausencias nao justificadas, usando os numeros exibidos no Portal da Camara.',
        explanationForCitizen: `Compareceu a ${formatNumber(presencaPlenarioResumo.presencas)} de ${formatNumber(presencaPlenarioResumo.total)} dias de Plenario registrados no portal da Camara.`,
        warnings: [
          `Ausencias justificadas: ${formatNumber(presencaPlenarioResumo.justificadas)} dia(s).`,
          `Ausencias nao justificadas: ${formatNumber(presencaPlenarioResumo.naoJustificadas)} dia(s).`,
          ...portalWarnings,
        ],
        breakdown: { ...portalPresencaPlenario, totalEsperado: presencaPlenarioResumo.total },
        details: presencaPlenarioResumo.details,
      })
      : unavailableKpi({
        id: 'presencaPlenario',
        label: 'Presenca em Plenario',
        source: SOURCES.camara,
        fetchedAt: camara.fetchedAt,
        calculationMethod: 'O resumo publico do portal da Camara nao retornou presenca em Plenario nesta consulta.',
        explanationForCitizen: 'Quando disponivel, este indicador reproduz o numero exibido no portal da Camara.',
      }),
    presencaComissoes: hasPortalPresencaComissoes
      ? createKpi({
        id: 'presencaComissoes',
        label: 'Presenca em Comissoes',
        value: presencaComissoesResumo.displayValue,
        unit: 'texto',
        status: DATA_STATUS.available,
        sourceName: portalSource.sourceName,
        sourceUrl: portalSource.sourceUrl,
        fetchedAt: portalSource.fetchedAt,
        confidenceLevel: CONFIDENCE_LEVEL.high,
        calculationMethod: 'Total previsto calculado como presencas + ausencias justificadas + ausencias nao justificadas, usando os numeros exibidos no Portal da Camara.',
        explanationForCitizen: `Compareceu a ${formatNumber(presencaComissoesResumo.presencas)} de ${formatNumber(presencaComissoesResumo.total)} reunioes de Comissoes registradas no portal da Camara.`,
        warnings: [
          `Ausencias justificadas: ${formatNumber(presencaComissoesResumo.justificadas)} reuniao(oes).`,
          `Ausencias nao justificadas: ${formatNumber(presencaComissoesResumo.naoJustificadas)} reuniao(oes).`,
          ...portalWarnings,
        ],
        breakdown: { ...portalPresencaComissoes, totalEsperado: presencaComissoesResumo.total },
        details: presencaComissoesResumo.details,
      })
      : unavailableKpi({
        id: 'presencaComissoes',
        label: 'Presenca em Comissoes',
        source: SOURCES.camara,
        fetchedAt: camara.fetchedAt,
        calculationMethod: 'O resumo publico do portal da Camara nao retornou presenca em Comissoes nesta consulta.',
        explanationForCitizen: 'Quando disponivel, este indicador reproduz o numero exibido no portal da Camara.',
      }),
    presenca: hasPortalPresenca
      ? createKpi({
        id: 'presenca',
        label: 'Presenca em Plenario e Comissoes',
        value: [
          presencaPlenarioResumo ? `Plenario: ${formatNumber(presencaPlenarioResumo.presencas)}/${formatNumber(presencaPlenarioResumo.total)}` : null,
          presencaComissoesResumo ? `Comissoes: ${formatNumber(presencaComissoesResumo.presencas)}/${formatNumber(presencaComissoesResumo.total)}` : null,
        ].filter(Boolean).join(' / '),
        unit: 'texto',
        status: DATA_STATUS.available,
        sourceName: portalSource.sourceName,
        sourceUrl: portalSource.sourceUrl,
        fetchedAt: portalSource.fetchedAt,
        confidenceLevel: CONFIDENCE_LEVEL.high,
        calculationMethod: 'Numeros exibidos no resumo publico do Portal da Camara para presenca em Plenario e em Comissoes no ano selecionado.',
        explanationForCitizen: 'Mostra as presencas oficiais exibidas no portal da Camara, separando Plenario e Comissoes.',
        warnings: ['Este indicador reproduz o resumo oficial do portal; nao e calculo proprio de assiduidade do FISCALIZA.'],
        breakdown: {
          plenario: portalPresencaPlenario,
          comissoes: portalPresencaComissoes,
        },
      })
      : unavailableKpi({
        id: 'presenca',
        label: 'Presenca parlamentar',
        source: SOURCES.camara,
        fetchedAt: camara.fetchedAt,
        calculationMethod: 'A fonte consultada nao retornou presenca em Plenario e Comissoes nesta tela.',
        explanationForCitizen: 'O FISCALIZA nao transforma ausencia de voto ou de evento em falta sem confirmar a regra oficial.',
        warnings: ['Dado indisponivel nesta versao para evitar acusacao sem base.'],
      }),
    relatorias: hasPortalRelatorias
      ? createKpi({
        id: 'relatorias',
        label: 'Propostas relatadas no portal',
        value: portalPropostasRelatadas,
        unit: 'relatorias',
        status: DATA_STATUS.available,
        sourceName: portalSource.sourceName,
        sourceUrl: portalSource.sourceUrl,
        fetchedAt: portalSource.fetchedAt,
        confidenceLevel: CONFIDENCE_LEVEL.high,
        calculationMethod: 'Numero exibido no resumo publico do Portal da Camara para propostas relatadas no ano selecionado.',
        explanationForCitizen: `O Portal da Camara informa ${formatNumber(portalPropostasRelatadas)} propostas relatadas neste ano.`,
        warnings: ['Este numero vem do portal publico da Camara e nao significa, sozinho, que relatorios foram aprovados.', ...portalWarnings],
      })
      : unavailableKpi({
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

export const buildProfileDataCoverage = (metrics) => {
  const components = [
    { id: 'gastos', label: 'Gastos declarados', metric: metrics.totalGastoAno },
    { id: 'proposicoes', label: 'Propostas legislativas', metric: metrics.proposicoes },
    { id: 'relatorias', label: 'Relatorias encontradas', metric: metrics.relatorias },
    { id: 'presenca', label: 'Presença oficial', metric: metrics.presencaPlenario },
    { id: 'votacoes', label: 'Votações nominais', metric: metrics.votacoesNominais },
    { id: 'discursos', label: 'Discursos em Plenário', metric: metrics.discursos },
  ].map((component) => ({
    id: component.id,
    label: component.label,
    status: component.metric?.status || DATA_STATUS.unavailable,
    coverage: component.metric?.status === DATA_STATUS.available
      ? 1
      : component.metric?.status === DATA_STATUS.partial
        ? 0.5
        : 0,
  }));

  const value = Math.round(
    (components.reduce((acc, item) => acc + item.coverage, 0) / components.length) * 100
  );

  return createKpi({
    id: 'coberturaDadosPerfil',
    label: 'Cobertura dos dados do perfil',
    value,
    unit: '%',
    status: DATA_STATUS.partial,
    sourceName: 'FISCALIZA - cobertura calculada',
    sourceUrl: '/sobre',
    fetchedAt: new Date().toISOString(),
    confidenceLevel: CONFIDENCE_LEVEL.high,
    calculationMethod: 'Percentual de seis grupos de dados com resposta disponível. Dados parciais contam como meia cobertura; dados indisponíveis contam como zero.',
    explanationForCitizen: 'Este percentual informa quanto do perfil pôde ser preenchido com fontes rastreáveis. Ele não mede qualidade, produtividade ou conduta do parlamentar.',
    warnings: ['Indicador de completude calculado pelo site, não pela Câmara ou pelo Senado.', 'Não use este percentual para comparar desempenho entre parlamentares.'],
    breakdown: components,
  });
};

export const buildFiscalizationIndex = buildProfileDataCoverage;

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
