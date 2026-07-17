import { cachedJsonFetch } from '@/services/http';

const BASE_URL = '/api/senado';
const SENADO_SOURCE_URL = 'https://legis.senado.leg.br/dadosabertos';

export const ensureArray = (data) => {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
};

const toJsonEndpoint = (endpoint) => {
  if (endpoint.includes('.json')) return endpoint;
  const [path, query] = endpoint.split('?');
  return `${path}.json${query ? `?${query}` : ''}`;
};

const fetchSenado = async (endpoint, options = {}) => {
  const finalUrl = toJsonEndpoint(endpoint);
  const cleanEndpoint = finalUrl.startsWith('/') ? finalUrl : `/${finalUrl}`;
  const urlCompleta = `${BASE_URL}${cleanEndpoint}`;
  const result = await cachedJsonFetch(urlCompleta, {
    cacheTtlMs: options.cacheTtlMs ?? 1000 * 60 * 10,
    retries: options.retries ?? 2,
    timeoutMs: options.timeoutMs ?? 12000,
  });

  if (result.error) {
    console.error(`[SENADO API] Falha em ${urlCompleta}:`, result.error);
  }

  return {
    ...result,
    sourceName: 'Senado Federal - Dados Abertos',
    sourceUrl: `${SENADO_SOURCE_URL}${cleanEndpoint}`,
  };
};

export const getSenadoresAtuais = async () => {
  const raw = await fetchSenado('/senador/lista/atual');
  const lista = raw.data?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar || [];
  const arrayLista = ensureArray(lista);

  const data = arrayLista.map((s) => ({
    id: s.IdentificacaoParlamentar.CodigoParlamentar,
    nome: s.IdentificacaoParlamentar.NomeParlamentar,
    partido: s.IdentificacaoParlamentar.SiglaPartidoParlamentar,
    uf: s.IdentificacaoParlamentar.UfParlamentar,
    foto: s.IdentificacaoParlamentar.UrlFotoParlamentar,
  }));

  data.__meta = { fetchedAt: raw.fetchedAt, sourceName: raw.sourceName, sourceUrl: raw.sourceUrl };
  return data;
};

export const getSenadorDetalhes = async (id) => {
  if (!id) return null;
  const raw = await fetchSenado(`/senador/${encodeURIComponent(id)}`);
  const data = raw.data?.DetalheParlamentar?.Parlamentar || null;
  if (data) data.__meta = { fetchedAt: raw.fetchedAt, sourceName: raw.sourceName, sourceUrl: raw.sourceUrl };
  return data;
};

export const getSenadorRelatorias = async (id, ano) => {
  if (!id) return [];
  const data = [];
  data.__meta = {
    fetchedAt: new Date().toISOString(),
    sourceName: 'Senado Federal - Dados Abertos',
    sourceUrl: SENADO_SOURCE_URL,
    unavailableReason: 'Endpoint de relatorias individuais nao foi confirmado nesta integracao.',
    requestedYear: ano,
  };
  return data;
};

export const getSenadorVotacoes = async (id, ano) => {
  if (!id) return [];
  const data = [];
  data.__meta = {
    fetchedAt: new Date().toISOString(),
    sourceName: 'Senado Federal - Dados Abertos',
    sourceUrl: SENADO_SOURCE_URL,
    unavailableReason: 'Endpoint de votacoes individuais nao foi confirmado nesta integracao.',
    requestedYear: ano,
  };
  return data;
};

export const getSenadorDespesas = async (id, ano) => {
  const data = [];
  data.__meta = {
    fetchedAt: new Date().toISOString(),
    sourceName: 'Portal da Transparencia do Senado',
    sourceUrl: 'https://www6g.senado.leg.br/transparencia/sen/',
    unavailableReason: 'Despesas de senadores ainda nao estao normalizadas nesta integracao.',
    requestedId: id,
    requestedYear: ano,
  };
  return data;
};

export const getSenadorDiscursos = async (id, ano) => {
  const data = [];
  data.__meta = {
    fetchedAt: new Date().toISOString(),
    sourceName: 'Senado Federal - Dados Abertos',
    sourceUrl: SENADO_SOURCE_URL,
    unavailableReason: 'Discursos de senadores ainda nao estao normalizados nesta integracao.',
    requestedId: id,
    requestedYear: ano,
  };
  return data;
};
