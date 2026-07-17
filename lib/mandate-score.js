export const SCORE_VERSION = '1.0';

export const MANDATE_SCORE_COMPONENTS = [
  { id: 'finance', label: 'Uso da cota', weight: 25 },
  { id: 'legislative', label: 'Atuação legislativa', weight: 30 },
  { id: 'presence', label: 'Presença oficial', weight: 30 },
  { id: 'participation', label: 'Participação pública', weight: 15 },
];

const finiteOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = (value, digits = 1) => Number(value.toFixed(digits));

const readPortalValue = (summary, snakeKey, camelKey) =>
  finiteOrNull(summary?.[snakeKey] ?? summary?.[camelKey]);

const readPresence = (summary, group, field) => {
  const snakePrefix = group === 'plenario' ? 'plenario' : 'comissoes';
  const camelGroup = group === 'plenario' ? 'presencaPlenario' : 'presencaComissoes';
  const snakeField = field === 'present'
    ? `presenca_${snakePrefix}`
    : field === 'justified'
      ? `ausencias_justificadas_${snakePrefix}`
      : `ausencias_nao_justificadas_${snakePrefix}`;
  const camelField = field === 'present'
    ? 'presencas'
    : field === 'justified'
      ? 'ausenciasJustificadas'
      : 'ausenciasNaoJustificadas';

  return finiteOrNull(summary?.[snakeField] ?? summary?.[camelGroup]?.[camelField]);
};

const percentileScore = (value, cohortValues, { lowerIsBetter = false } = {}) => {
  const current = finiteOrNull(value);
  const values = cohortValues.map(finiteOrNull).filter((item) => item !== null);
  if (current === null || values.length < 5) return null;

  const lowerCount = values.filter((item) => item < current).length;
  const equalCount = values.filter((item) => item === current).length;
  const percentile = (lowerCount + equalCount * 0.5) / values.length;
  const direction = lowerIsBetter ? 1 - percentile : percentile;
  return round(1 + direction * 9);
};

const weightedAverage = (parts) => {
  const available = parts.filter((part) => part.score !== null);
  const weight = available.reduce((total, part) => total + part.weight, 0);
  if (!weight) return null;
  return round(available.reduce((total, part) => total + part.score * part.weight, 0) / weight);
};

const presenceRate = (summary, group) => {
  const present = readPresence(summary, group, 'present');
  const justified = readPresence(summary, group, 'justified');
  const unjustified = readPresence(summary, group, 'unjustified');
  if ([present, justified, unjustified].every((value) => value === null)) return null;

  const total = (present || 0) + (justified || 0) + (unjustified || 0);
  return total > 0 ? (present || 0) / total : null;
};

const buildFinanceComponent = (expenseSummary, expenseCohort) => {
  const monthly = finiteOrNull(expenseSummary?.media_mensal ?? expenseSummary?.mediaMensal);
  const count = finiteOrNull(expenseSummary?.quantidade_despesas ?? expenseSummary?.quantidadeDespesas);
  const cohort = expenseCohort
    .filter((item) => finiteOrNull(item?.quantidade_despesas ?? item?.quantidadeDespesas) > 0)
    .map((item) => item?.media_mensal ?? item?.mediaMensal)
    .filter((value) => finiteOrNull(value) > 0);
  const score = count > 0 && monthly > 0
    ? percentileScore(monthly, cohort, { lowerIsBetter: true })
    : null;

  return {
    id: 'finance',
    label: 'Uso da cota',
    weight: 25,
    score,
    status: score === null ? 'unavailable' : 'available',
    explanation: score === null
      ? 'Sem ano completo de despesas suficiente para comparar.'
      : 'Compara a média mensal da CEAP com os demais deputados sincronizados. Menor gasto recebe nota maior.',
  };
};

const buildLegislativeComponent = (portalSummary, portalCohort) => {
  const proposals = readPortalValue(portalSummary, 'propostas_autoria', 'propostasAutoria');
  const reports = readPortalValue(portalSummary, 'propostas_relatadas', 'propostasRelatadas');
  const proposalScore = percentileScore(
    proposals,
    portalCohort.map((item) => readPortalValue(item, 'propostas_autoria', 'propostasAutoria'))
  );
  const reportScore = percentileScore(
    reports,
    portalCohort.map((item) => readPortalValue(item, 'propostas_relatadas', 'propostasRelatadas'))
  );
  const score = weightedAverage([
    { score: proposalScore, weight: 40 },
    { score: reportScore, weight: 60 },
  ]);

  return {
    id: 'legislative',
    label: 'Atuação legislativa',
    weight: 30,
    score,
    status: score === null ? 'unavailable' : 'available',
    explanation: score === null
      ? 'Sem base comparável de propostas e relatorias no ano.'
      : 'Compara propostas de autoria e propostas relatadas no portal. Relatorias têm peso maior; não significa aprovação.',
  };
};

const buildPresenceComponent = (portalSummary) => {
  const plenaryRate = presenceRate(portalSummary, 'plenario');
  const committeeRate = presenceRate(portalSummary, 'comissoes');
  const rate = weightedAverage([
    { score: plenaryRate === null ? null : plenaryRate * 10, weight: 65 },
    { score: committeeRate === null ? null : committeeRate * 10, weight: 35 },
  ]);
  const score = rate === null ? null : round(clamp(rate, 1, 10));

  return {
    id: 'presence',
    label: 'Presença oficial',
    weight: 30,
    score,
    status: score === null ? 'unavailable' : 'available',
    explanation: score === null
      ? 'O portal não retornou presenças e ausências oficiais suficientes.'
      : 'Usa a proporção de presenças no Plenário e nas comissões. Ausência de voto não é tratada como falta.',
  };
};

const buildParticipationComponent = (portalSummary, portalCohort) => {
  const votes = readPortalValue(portalSummary, 'votacoes_nominais_plenario', 'votacoesNominaisPlenario');
  const speeches = readPortalValue(portalSummary, 'discursos_plenario', 'discursosPlenario');
  const voteScore = percentileScore(
    votes,
    portalCohort.map((item) => readPortalValue(item, 'votacoes_nominais_plenario', 'votacoesNominaisPlenario'))
  );
  const speechScore = percentileScore(
    speeches,
    portalCohort.map((item) => readPortalValue(item, 'discursos_plenario', 'discursosPlenario'))
  );
  const score = weightedAverage([
    { score: voteScore, weight: 65 },
    { score: speechScore, weight: 35 },
  ]);

  return {
    id: 'participation',
    label: 'Participação pública',
    weight: 15,
    score,
    status: score === null ? 'unavailable' : 'available',
    explanation: score === null
      ? 'Sem base comparável de votações e discursos no ano.'
      : 'Compara votações nominais em Plenário e discursos registrados com os demais deputados.',
  };
};

const buildReasons = (components) => {
  const available = components.filter((item) => item.score !== null);
  const positives = [...available]
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((item) => `${item.label}: ${item.score.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}`);
  const weakest = [...available].sort((a, b) => a.score - b.score)[0];

  return {
    positives,
    attention: weakest && weakest.score < 6
      ? `${weakest.label} foi o componente com menor pontuação disponível.`
      : 'Nenhum componente disponível ficou abaixo de 6,0.',
  };
};

export const calculateMandateScore = ({
  expenseSummary,
  portalSummary,
  expenseCohort = [],
  portalCohort = [],
} = {}) => {
  const components = [
    buildFinanceComponent(expenseSummary, expenseCohort),
    buildLegislativeComponent(portalSummary, portalCohort),
    buildPresenceComponent(portalSummary),
    buildParticipationComponent(portalSummary, portalCohort),
  ];
  const availableWeight = components
    .filter((component) => component.score !== null)
    .reduce((total, component) => total + component.weight, 0);
  const coverage = availableWeight;
  const rawScore = weightedAverage(components);
  const value = coverage >= 50 && rawScore !== null ? round(clamp(rawScore, 1, 10)) : null;
  const status = value === null ? 'unavailable' : coverage >= 80 ? 'available' : 'partial';
  const reasons = buildReasons(components);

  return {
    id: 'mandateScore',
    label: 'Nota do mandato',
    value,
    unit: 'de 10',
    status,
    coverage,
    version: SCORE_VERSION,
    components,
    positives: reasons.positives,
    attention: reasons.attention,
    sourceName: 'FISCALIZA, com dados oficiais da Câmara dos Deputados',
    sourceUrl: '/sobre',
    fetchedAt: new Date().toISOString(),
    calculationMethod:
      'Média ponderada dos componentes disponíveis: uso da cota (25%), atuação legislativa (30%), presença oficial (30%) e participação pública (15%). Componentes sem dados são retirados e reduzem a cobertura.',
    explanationForCitizen: value === null
      ? 'Ainda não há dados suficientes para publicar uma nota responsável neste ano.'
      : `Nota calculada com ${coverage}% dos componentes previstos. É um indicador do FISCALIZA, não uma avaliação oficial da Câmara.`,
    warnings: [
      'A nota não mede honestidade, ideologia, qualidade técnica de cada projeto nem impacto social.',
      'Propostas relatadas não são tratadas como relatórios aprovados.',
      'Compare preferencialmente deputados no mesmo ano e com cobertura semelhante.',
    ],
  };
};

export const addMandateScoresToSummaries = (expenseSummaries = [], portalSummaries = []) => {
  const portalByDeputy = new Map(
    portalSummaries.map((item) => [String(item.deputado_id ?? item.deputadoId), item])
  );

  return expenseSummaries.map((expenseSummary) => {
    const portalSummary = portalByDeputy.get(String(expenseSummary.deputado_id ?? expenseSummary.deputadoId));
    const mandateScore = calculateMandateScore({
      expenseSummary,
      portalSummary,
      expenseCohort: expenseSummaries,
      portalCohort: portalSummaries,
    });

    return { ...expenseSummary, portalSummary, mandateScore };
  });
};
