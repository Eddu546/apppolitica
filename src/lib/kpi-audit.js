const finiteOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const compareValues = (left, right, sameDefinition) => {
  if (left === null || right === null) return 'unavailable';
  if (!sameDefinition) return 'different_definition';
  return left === right ? 'match' : 'review';
};

const buildRow = ({ id, label, fiscalizaValue, officialValue, sameDefinition, fiscalizaMethod, officialMethod, sourceUrl }) => ({
  id,
  label,
  fiscalizaValue,
  officialValue,
  status: compareValues(fiscalizaValue, officialValue, sameDefinition),
  sameDefinition,
  fiscalizaMethod,
  officialMethod,
  sourceUrl,
});

export const buildKpiAuditRows = ({ metrics = {}, raw = {}, portalSummary = null } = {}) => {
  const portalUrl = portalSummary?.__meta?.sourceUrl || '';
  const portalNumber = (key) => finiteOrNull(portalSummary?.[key]);
  const metricValue = (key) => finiteOrNull(metrics?.[key]?.value);
  const listCount = (key) => Array.isArray(raw?.[key]) ? raw[key].length : null;

  return [
    buildRow({
      id: 'proposals-portal',
      label: 'Propostas legislativas de autoria',
      fiscalizaValue: metricValue('proposicoes'),
      officialValue: portalNumber('propostasAutoria'),
      sameDefinition: true,
      fiscalizaMethod: metrics?.proposicoes?.calculationMethod,
      officialMethod: 'Número publicado no resumo anual do Portal do Deputado.',
      sourceUrl: portalUrl,
    }),
    buildRow({
      id: 'proposals-api',
      label: 'Lista técnica de proposições',
      fiscalizaValue: listCount('proposicoes'),
      officialValue: portalNumber('propostasAutoria'),
      sameDefinition: false,
      fiscalizaMethod: 'Contagem paginada do endpoint de proposições por deputado autor e ano.',
      officialMethod: 'Resumo editorial do Portal do Deputado; o escopo pode incluir assinaturas e tipos diferentes.',
      sourceUrl: portalUrl,
    }),
    buildRow({
      id: 'votes',
      label: 'Votações nominais em Plenário',
      fiscalizaValue: metricValue('votacoesNominais'),
      officialValue: portalNumber('votacoesNominaisPlenario'),
      sameDefinition: false,
      fiscalizaMethod: 'Recorte de votações relevantes com voto individual encontrado.',
      officialMethod: 'Total anual de votações nominais em Plenário publicado no portal.',
      sourceUrl: portalUrl,
    }),
    buildRow({
      id: 'speeches',
      label: 'Discursos em Plenário',
      fiscalizaValue: metricValue('discursos'),
      officialValue: portalNumber('discursosPlenario'),
      sameDefinition: Boolean(portalSummary && metrics?.discursos?.sourceUrl === portalUrl),
      fiscalizaMethod: metrics?.discursos?.calculationMethod,
      officialMethod: 'Total anual de discursos em Plenário publicado no portal.',
      sourceUrl: portalUrl,
    }),
    buildRow({
      id: 'reports',
      label: 'Propostas relatadas',
      fiscalizaValue: metricValue('relatorias'),
      officialValue: portalNumber('propostasRelatadas'),
      sameDefinition: true,
      fiscalizaMethod: metrics?.relatorias?.calculationMethod,
      officialMethod: 'Número de propostas relatadas publicado no Portal do Deputado; não significa relatório aprovado.',
      sourceUrl: portalUrl,
    }),
    buildRow({
      id: 'expenses',
      label: 'Registros de despesas CEAP',
      fiscalizaValue: metricValue('quantidadeDespesas'),
      officialValue: listCount('despesas'),
      sameDefinition: true,
      fiscalizaMethod: metrics?.quantidadeDespesas?.calculationMethod,
      officialMethod: 'Quantidade de registros retornados pela mesma API oficial na consulta atual.',
      sourceUrl: metrics?.quantidadeDespesas?.sourceUrl,
    }),
  ];
};

export const summarizeKpiAudit = (rows = []) => rows.reduce((summary, row) => {
  summary.total += 1;
  summary[row.status] = (summary[row.status] || 0) + 1;
  return summary;
}, { total: 0, match: 0, review: 0, different_definition: 0, unavailable: 0 });

