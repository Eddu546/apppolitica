const parseMoney = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const normalized = String(value ?? '')
    .replace(/R\$/g, '')
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const publicQueryUrl = ({ name, year }) => {
  const url = new URL('https://portaldatransparencia.gov.br/emendas/consulta');
  url.searchParams.set('de', String(year));
  url.searchParams.set('ate', String(year));
  url.searchParams.set('nomeAutor', name);
  return url.toString();
};

const normalizeAmendment = (item = {}) => ({
  code: item.codigoEmenda || item.codigo || '',
  number: item.numeroEmenda || item.numero || '',
  year: item.ano || item.anoEmenda || null,
  type: item.tipoEmenda || item.tipo || 'Tipo não informado',
  author: item.nomeAutor || item.autor || item.nomeAutorEmenda || 'Autor não informado',
  location: item.localidadeDoGasto || item.localidadeGasto || item.municipio || item.uf || 'Localidade não informada',
  municipalityCode: item.codigoIbgeMunicipio || item.codigoMunicipioIBGE || item.codigoMunicipio || null,
  functionName: item.funcao || item.nomeFuncao || 'Área não informada',
  subfunction: item.subfuncao || item.nomeSubfuncao || '',
  program: item.programa || item.nomePrograma || '',
  favored: item.nomeFavorecido || item.favorecido || item.nomeBeneficiario || '',
  object: item.objeto || item.objetoConvenio || item.descricaoObjeto || '',
  agreement: item.numeroConvenio || item.numeroInstrumento || '',
  committed: parseMoney(item.valorEmpenhado),
  liquidated: parseMoney(item.valorLiquidado),
  paid: parseMoney(item.valorPago),
  raw: item,
});

export const summarizeAmendments = (records = []) => {
  const totals = records.reduce((acc, item) => ({
    committed: acc.committed + item.committed,
    liquidated: acc.liquidated + item.liquidated,
    paid: acc.paid + item.paid,
  }), { committed: 0, liquidated: 0, paid: 0 });

  const byLocation = records.reduce((map, item) => {
    const key = item.location || 'Localidade não informada';
    map.set(key, (map.get(key) || 0) + item.paid);
    return map;
  }, new Map());
  const byFunction = records.reduce((map, item) => {
    const key = item.functionName || 'Área não informada';
    map.set(key, (map.get(key) || 0) + item.paid);
    return map;
  }, new Map());
  const byFavored = records.reduce((map, item) => {
    if (!item.favored) return map;
    map.set(item.favored, (map.get(item.favored) || 0) + item.paid);
    return map;
  }, new Map());

  const top = (map) => [...map.entries()]
    .map(([name, paid]) => ({ name, paid }))
    .sort((a, b) => b.paid - a.paid)
    .slice(0, 5);

  return {
    totalRecords: records.length,
    ...totals,
    executionRate: totals.committed > 0 ? (totals.paid / totals.committed) * 100 : null,
    topLocations: top(byLocation),
    topFunctions: top(byFunction),
    topFavored: top(byFavored),
  };
};

export const getDeputyAmendmentsPage = async ({ name, year, page = 1, signal } = {}) => {
  const sourceUrl = publicQueryUrl({ name, year });
  const query = new URLSearchParams({ name, year: String(year), page: String(page) });

  try {
    const response = await fetch(`/api/portal-transparencia/emendas?${query}`, { signal });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        status: payload.configured === false ? 'unconfigured' : 'error',
        records: [],
        sourceUrl,
        fetchedAt: null,
      };
    }

    const records = (payload.data || []).map(normalizeAmendment);
    return {
      status: records.length ? 'available' : 'unavailable',
      records,
      summary: summarizeAmendments(records),
      sourceName: payload.sourceName,
      sourceUrl,
      fetchedAt: payload.fetchedAt,
      page: payload.page || page,
    };
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    return { status: 'error', records: [], sourceUrl, fetchedAt: null };
  }
};

export const getDeputyAmendments = (options = {}) =>
  getDeputyAmendmentsPage({ ...options, page: 1 });

export const getAllDeputyAmendments = async ({
  name,
  year,
  signal,
  maxPages = 20,
  onProgress,
} = {}) => {
  const records = [];
  const seen = new Set();
  let sourceName = '';
  let sourceUrl = '';
  let fetchedAt = '';
  let pagesFetched = 0;
  let complete = false;

  for (let page = 1; page <= maxPages; page += 1) {
    const result = await getDeputyAmendmentsPage({ name, year, page, signal });
    if (result.status === 'unconfigured' || result.status === 'error') return result;

    pagesFetched = page;
    sourceName = result.sourceName || sourceName;
    sourceUrl = result.sourceUrl || sourceUrl;
    fetchedAt = result.fetchedAt || fetchedAt;

    if (!result.records.length) {
      complete = true;
      break;
    }

    result.records.forEach((item) => {
      const key = [
        item.code,
        item.number,
        item.location,
        item.functionName,
        item.paid,
        item.committed,
      ].join('|');
      if (!seen.has(key)) {
        seen.add(key);
        records.push(item);
      }
    });

    onProgress?.({ page, maxPages, records: records.length });
  }

  return {
    status: records.length ? 'available' : 'unavailable',
    records,
    summary: summarizeAmendments(records),
    sourceName,
    sourceUrl,
    fetchedAt,
    pagesFetched,
    coverage: complete ? 'complete' : 'partial',
    warnings: complete
      ? []
      : [`A busca automática parou em ${maxPages} páginas para proteger o limite gratuito da fonte.`],
  };
};

export { normalizeAmendment, parseMoney };
