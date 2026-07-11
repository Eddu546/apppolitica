export const CAMARA_OPEN_DATA_BASE = 'https://dadosabertos.camara.leg.br';
export const CAMARA_PORTAL_BASE = 'https://www.camara.leg.br';

export const isInternalPath = (url = '') => String(url).startsWith('/');

export const isCamaraTechnicalUrl = (url = '') => {
  const value = String(url || '');
  return value.includes('dadosabertos.camara.leg.br/api/') || value.includes('dadosabertos.camara.leg.br/arquivos/');
};

export const isSenadoTechnicalUrl = (url = '') => String(url || '').includes('legis.senado.leg.br/dadosabertos');

export const isTechnicalOpenDataUrl = (url = '') => isCamaraTechnicalUrl(url) || isSenadoTechnicalUrl(url);

export const parseOfficialNumber = (value = '') => {
  const match = String(value).match(/\b(PEC|PLP|PL|MPV|PDL|PRC|REQ)\s*(\d{1,6})\s*\/\s*(\d{4})\b/i);
  if (!match) return null;

  return {
    type: match[1].toUpperCase(),
    number: match[2],
    year: match[3],
  };
};

export const normalizeOfficialNumberLabel = (value = '') => {
  const parsed = parseOfficialNumber(value);
  return parsed ? `${parsed.type} ${parsed.number}/${parsed.year}` : String(value || '');
};

export const fiscalizaAgendaPath = (value = '') => {
  const parsed = parseOfficialNumber(value);
  if (!parsed) return '/pautas';
  return `/pautas/${parsed.type}-${parsed.number}-${parsed.year}`;
};

export const getCamaraPortalPropositionUrl = (id) =>
  id ? `${CAMARA_PORTAL_BASE}/propostas-legislativas/${encodeURIComponent(id)}` : '';

export const getCamaraPortalDeputyUrl = (deputyId) =>
  deputyId ? `${CAMARA_PORTAL_BASE}/deputados/${encodeURIComponent(deputyId)}` : '';

export const getCamaraPortalDeputyVotesUrl = (deputyId, year) =>
  deputyId && year
    ? `${CAMARA_PORTAL_BASE}/deputados/${encodeURIComponent(deputyId)}/votacoes-nominais-plenario/${encodeURIComponent(year)}`
    : '';

export const getCamaraPortalPropositionSearchUrl = (query = '') => {
  const params = [
    ['contextoBusca', 'BuscaProposicoes'],
    ['pagina', '1'],
    ['order', 'data'],
    ['abaEspecifica', 'true'],
    ['q', query],
  ];

  return `${CAMARA_PORTAL_BASE}/busca-portal?${params
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')}`;
};

export const getCamaraPortalAuthorSearchUrl = (deputyId, year) =>
  deputyId && year
    ? getCamaraPortalPropositionSearchUrl(
      `autores.ideCadastro: ${deputyId} AND dataApresentacao:[${year}-01-01 TO ${year}-12-31]`
    )
    : '';

export const getCamaraPortalRapporteurSearchUrl = (deputyId, year) =>
  deputyId && year
    ? getCamaraPortalPropositionSearchUrl(
      `relatores.ideCadastro: ${deputyId} AND relatores.dataInicioRelator:[${year}-01-01 TO ${year}-12-31]`
    )
    : '';

export const getCamaraPortalSearchUrl = (term = '') => {
  const params = new URLSearchParams({
    contextoBusca: 'BuscaGeral',
    pagina: '1',
    order: 'relevancia',
    termo: normalizeOfficialNumberLabel(term),
  });
  return `${CAMARA_PORTAL_BASE}/busca-portal?${params.toString()}`;
};

const getUrl = (sourceUrl = '') => {
  try {
    return new URL(String(sourceUrl));
  } catch {
    return null;
  }
};

export const getInternalSourcePageFromTechnicalUrl = (sourceUrl = '') => {
  const url = getUrl(sourceUrl);
  if (!url) return '';

  const path = url.pathname;
  const expenseMatch = path.match(/\/api\/v2\/deputados\/([^/]+)\/despesas/i);
  if (expenseMatch) {
    const year = url.searchParams.get('ano');
    return year ? `/fonte/deputado/${encodeURIComponent(expenseMatch[1])}/despesas/${encodeURIComponent(year)}` : '';
  }

  const deputyDatasetMatch = path.match(/\/api\/v2\/deputados\/([^/]+)\/(eventos|discursos)/i);
  if (deputyDatasetMatch) {
    const year = (url.searchParams.get('dataInicio') || '').slice(0, 4);
    return year ? `/fonte/deputado/${encodeURIComponent(deputyDatasetMatch[1])}/${deputyDatasetMatch[2]}/${encodeURIComponent(year)}` : '';
  }

  if (path.includes('/api/v2/proposicoes')) {
    const deputyId = url.searchParams.get('idDeputadoAutor');
    const year = url.searchParams.get('ano');
    if (deputyId && year) {
      return `/fonte/deputado/${encodeURIComponent(deputyId)}/proposicoes/${encodeURIComponent(year)}`;
    }
  }

  return '';
};

export const getReadableSourceUrl = ({ sourcePageUrl = '', sourceUrl = '' } = {}) => {
  if (sourcePageUrl && !String(sourcePageUrl).includes('{')) return sourcePageUrl;

  const internalSource = getInternalSourcePageFromTechnicalUrl(sourceUrl);
  if (internalSource) return internalSource;

  if (!sourceUrl || String(sourceUrl).includes('{')) return '';
  if (isTechnicalOpenDataUrl(sourceUrl)) return '';

  return sourceUrl;
};
