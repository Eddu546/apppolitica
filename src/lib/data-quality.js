export const DATA_STATUS = {
  available: 'available',
  unavailable: 'unavailable',
  partial: 'partial',
  error: 'error',
};

export const CONFIDENCE_LEVEL = {
  high: 'high',
  medium: 'medium',
  low: 'low',
};

export const SOURCES = {
  camara: {
    sourceName: 'Camara dos Deputados - Dados Abertos',
    sourceUrl: 'https://dadosabertos.camara.leg.br/',
  },
  senado: {
    sourceName: 'Senado Federal - Dados Abertos',
    sourceUrl: 'https://legis.senado.leg.br/dadosabertos/',
  },
  fiscaliza: {
    sourceName: 'FISCALIZA - validacao manual',
    sourceUrl: '/dados-validados',
  },
  unavailable: {
    sourceName: 'Fonte oficial nao encontrada',
    sourceUrl: '',
  },
};

export const createKpi = ({
  id,
  label,
  value,
  unit,
  status = DATA_STATUS.available,
  sourceName,
  sourceUrl,
  sourcePageUrl,
  fetchedAt,
  updatedAt,
  confidenceLevel = CONFIDENCE_LEVEL.high,
  calculationMethod,
  explanationForCitizen,
  warnings = [],
  breakdown,
}) => ({
  id,
  label,
  title: label,
  value,
  unit,
  status,
  sourceName,
  sourceUrl,
  sourcePageUrl,
  fetchedAt: fetchedAt || new Date().toISOString(),
  updatedAt: updatedAt || null,
  confidenceLevel,
  calculationMethod,
  explanationForCitizen,
  warnings,
  breakdown,
});

export const unavailableKpi = ({
  id,
  label,
  source = SOURCES.unavailable,
  fetchedAt,
  calculationMethod = 'O FISCALIZA nao encontrou uma fonte oficial suficiente para calcular este indicador com seguranca.',
  explanationForCitizen = 'Este dado nao sera exibido como numero porque a fonte oficial atual nao permite confirmar o valor.',
  warnings = [],
}) =>
  createKpi({
    id,
    label,
    value: null,
    status: DATA_STATUS.unavailable,
    sourceName: source.sourceName,
    sourceUrl: source.sourceUrl,
    fetchedAt,
    confidenceLevel: CONFIDENCE_LEVEL.low,
    calculationMethod,
    explanationForCitizen,
    warnings,
  });

export const isDisplayableKpi = (kpi) =>
  Boolean(
    kpi &&
      typeof kpi.label === 'string' &&
      typeof kpi.status === 'string' &&
      typeof kpi.sourceName === 'string' &&
      typeof kpi.fetchedAt === 'string' &&
      typeof kpi.calculationMethod === 'string' &&
      typeof kpi.explanationForCitizen === 'string'
  );
