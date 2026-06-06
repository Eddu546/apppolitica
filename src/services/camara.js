import { cachedJsonFetch } from '@/services/http';
import { applyPartyCorrectionToDeputadoInfo, applyPartyCorrectionToDeputy } from '@/lib/party-corrections';
import {
  attachDeputyVoteToVoting,
  getVotingPropositionRecordId,
  getVotingRecordId,
  isPlenaryVoting,
  normalizeVotingPropositionRecord,
  normalizeDeputyVoteRecord,
  selectRelevantVotacoes,
} from '@/lib/vote-highlights';

const BASE_URL = '/api/camara';
const CAMARA_SOURCE_URL = 'https://dadosabertos.camara.leg.br';

const normalizeEndpoint = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return cleanEndpoint.startsWith('/api/v2') ? cleanEndpoint : `/api/v2${cleanEndpoint}`;
};

const fetchCamara = async (endpoint, options = {}) => {
  const cleanEndpoint = normalizeEndpoint(endpoint);
  const urlCompleta = `${BASE_URL}${cleanEndpoint}`;
  const result = await cachedJsonFetch(urlCompleta, {
    cacheTtlMs: options.cacheTtlMs ?? 1000 * 60 * 10,
    retries: options.retries ?? 2,
    timeoutMs: options.timeoutMs ?? 12000,
  });

  if (result.error) {
    console.error(`[CAMARA API] Falha em ${urlCompleta}:`, result.error);
  }

  return {
    ...result,
    sourceName: 'Camara dos Deputados - Dados Abertos',
    sourceUrl: `${CAMARA_SOURCE_URL}${cleanEndpoint}`,
  };
};

const fetchCamaraFile = async (endpoint, options = {}) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const urlCompleta = `${BASE_URL}${cleanEndpoint}`;
  const result = await cachedJsonFetch(urlCompleta, {
    cacheTtlMs: options.cacheTtlMs ?? 1000 * 60 * 60,
    retries: options.retries ?? 1,
    timeoutMs: options.timeoutMs ?? 30000,
  });

  if (result.error) {
    console.error(`[CAMARA ARQUIVOS] Falha em ${urlCompleta}:`, result.error);
  }

  return {
    ...result,
    sourceName: 'Camara dos Deputados - Dados Abertos',
    sourceUrl: `${CAMARA_SOURCE_URL}${cleanEndpoint}`,
  };
};

const extractArrayFromCamaraFile = (data) => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];

  const directKeys = ['dados', 'votacoes', 'votacoesVotos', 'votos'];
  for (const key of directKeys) {
    if (Array.isArray(data[key])) return data[key];
  }

  return Object.values(data).find(Array.isArray) || [];
};

export const fetchAllCamaraPages = async (urlBase, maxPages = 5) => {
  let allData = [];
  let fetchedAt = null;
  let sourceUrl = '';
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= maxPages) {
    const separator = urlBase.includes('?') ? '&' : '?';
    const res = await fetchCamara(`${urlBase}${separator}pagina=${page}&itens=100`);
    fetchedAt = fetchedAt || res.fetchedAt;
    sourceUrl = sourceUrl || res.sourceUrl;

    if (res.data?.dados?.length > 0) {
      allData = [...allData, ...res.data.dados];
      page += 1;
    } else {
      hasMore = false;
    }
  }

  allData.__meta = {
    fetchedAt: fetchedAt || new Date().toISOString(),
    sourceName: 'Camara dos Deputados - Dados Abertos',
    sourceUrl,
  };

  return allData;
};

const getVotacoesArquivoAnual = async (ano) => {
  const raw = await fetchCamaraFile(`/arquivos/votacoes/json/votacoes-${encodeURIComponent(ano)}.json`, {
    timeoutMs: 45000,
  });
  const data = extractArrayFromCamaraFile(raw.data);
  data.__meta = {
    fetchedAt: raw.fetchedAt,
    sourceName: raw.sourceName,
    sourceUrl: raw.sourceUrl,
    sourceType: 'arquivo_anual_votacoes',
  };
  return data;
};

const getDeputadoVotosArquivoAnual = async (deputadoId, ano) => {
  const raw = await fetchCamaraFile(`/arquivos/votacoesVotos/json/votacoesVotos-${encodeURIComponent(ano)}.json`, {
    timeoutMs: 70000,
  });
  const allRecords = extractArrayFromCamaraFile(raw.data);
  const records = allRecords.filter((record) => {
    const normalized = normalizeDeputyVoteRecord(record);
    return String(normalized.deputyId) === String(deputadoId);
  });

  records.__meta = {
    fetchedAt: raw.fetchedAt,
    sourceName: raw.sourceName,
    sourceUrl: raw.sourceUrl,
    sourceType: 'arquivo_anual_votos',
    totalAnnualVoteRecords: allRecords.length,
  };
  return records;
};

const getVotacoesProposicoesArquivoAnual = async (ano, tipoArquivo) => {
  const folder = tipoArquivo === 'objetos' ? 'votacoesObjetos' : 'votacoesProposicoes';
  const prefix = tipoArquivo === 'objetos' ? 'votacoesObjetos' : 'votacoesProposicoes';
  const raw = await fetchCamaraFile(`/arquivos/${folder}/json/${prefix}-${encodeURIComponent(ano)}.json`, {
    timeoutMs: 60000,
  });
  const data = extractArrayFromCamaraFile(raw.data);
  data.__meta = {
    fetchedAt: raw.fetchedAt,
    sourceName: raw.sourceName,
    sourceUrl: raw.sourceUrl,
    sourceType: `arquivo_anual_${folder}`,
  };
  return data;
};

const buildVotingPropositionIndex = (records = []) =>
  records.reduce((acc, record) => {
    const key = getVotingPropositionRecordId(record);
    if (!key) return acc;
    const normalized = normalizeVotingPropositionRecord(record);
    if (!normalized.label && !normalized.id && !normalized.ementa) return acc;
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key).push(normalized);
    return acc;
  }, new Map());

const attachOfficialPropositionRelations = (votacoes = [], objetosIndex = new Map(), afetadasIndex = new Map()) =>
  votacoes.map((votacao) => {
    const key = String(votacao.id || '');
    const officialObjects = objetosIndex.get(key) || [];
    const affectedPropositions = afetadasIndex.get(key) || [];
    return {
      ...votacao,
      officialObjects,
      affectedPropositions,
    };
  });

export const getDeputadoInfo = async (id) => {
  if (!id) return null;
  const raw = await fetchCamara(`/deputados/${encodeURIComponent(id)}`);
  const data = applyPartyCorrectionToDeputadoInfo(raw.data?.dados || null);
  if (data) {
    data.__meta = {
      fetchedAt: raw.fetchedAt,
      sourceName: raw.sourceName,
      sourceUrl: raw.sourceUrl,
    };
  }
  return data;
};

export const getDeputadoProposicoes = async (id, ano) => {
  if (!id) return [];
  const endpoint = `/proposicoes?idDeputadoAutor=${encodeURIComponent(id)}&ano=${encodeURIComponent(ano)}&itens=100&ordem=DESC&ordenarPor=id`;
  const raw = await fetchCamara(endpoint);
  const data = raw.data?.dados || [];
  data.__meta = { fetchedAt: raw.fetchedAt, sourceName: raw.sourceName, sourceUrl: raw.sourceUrl };
  return data;
};

export const getProposicaoByOfficialNumber = async ({ siglaTipo, numero, ano }) => {
  if (!siglaTipo || !numero || !ano) return null;

  const params = new URLSearchParams({
    siglaTipo: String(siglaTipo).toUpperCase(),
    numero: String(numero),
    ano: String(ano),
  });
  const endpoint = `/proposicoes?${params.toString()}`;
  const raw = await fetchCamara(endpoint);
  const data = raw.data?.dados?.[0] || null;

  if (data) {
    data.__meta = {
      fetchedAt: raw.fetchedAt,
      sourceName: raw.sourceName,
      sourceUrl: raw.sourceUrl,
    };
  }

  return data;
};

export const getProposicaoAutores = async (id) => {
  if (!id) return [];
  const raw = await fetchCamara(`/proposicoes/${encodeURIComponent(id)}/autores`);
  const data = raw.data?.dados || [];
  data.__meta = {
    fetchedAt: raw.fetchedAt,
    sourceName: raw.sourceName,
    sourceUrl: raw.sourceUrl,
  };
  return data;
};

export const getProposicaoVotacoes = async (id) => {
  if (!id) return [];
  const data = await fetchAllCamaraPages(`/proposicoes/${encodeURIComponent(id)}/votacoes?ordem=DESC&ordenarPor=dataHoraRegistro`, 5);
  data.__meta = {
    ...(data.__meta || {}),
    sourceUrl: `https://dadosabertos.camara.leg.br/api/v2/proposicoes/${id}/votacoes`,
  };
  return data;
};

export const getVotacaoVotos = async (id) => {
  if (!id) return [];
  const data = await fetchAllCamaraPages(`/votacoes/${encodeURIComponent(id)}/votos`, 8);
  data.__meta = {
    ...(data.__meta || {}),
    sourceUrl: `https://dadosabertos.camara.leg.br/api/v2/votacoes/${id}/votos`,
  };
  return data.map(normalizeDeputyVoteRecord);
};

export const getDeputadoRelatorias = async (id, ano) => {
  console.warn('[CAMARA API] Relatorias de deputados nao sao inferidas por autoria.', { id, ano });
  const data = [];
  data.__meta = {
    fetchedAt: new Date().toISOString(),
    sourceName: 'Camara dos Deputados - Dados Abertos',
    sourceUrl: CAMARA_SOURCE_URL,
    unavailableReason: 'Nao ha endpoint integrado que confirme relatorias aprovadas por deputado nesta tela.',
  };
  return data;
};

export const getDeputadoDespesas = async (id, ano) => {
  if (!id) return [];
  const endpoint = `/deputados/${encodeURIComponent(id)}/despesas?ano=${encodeURIComponent(ano)}&ordem=DESC&ordenarPor=dataDocumento`;
  return fetchAllCamaraPages(endpoint, 8);
};

export const getDeputadoEventos = async (id, ano) => {
  if (!id) return [];
  const endpoint = `/deputados/${encodeURIComponent(id)}/eventos?dataInicio=${ano}-01-01&dataFim=${ano}-12-31&ordem=ASC&ordenarPor=dataHoraInicio`;
  return fetchAllCamaraPages(endpoint, 5);
};

export const getDeputadoDiscursos = async (id, ano) => {
  if (!id) return [];
  const endpoint = `/deputados/${encodeURIComponent(id)}/discursos?dataInicio=${ano}-01-01&dataFim=${ano}-12-31&ordenarPor=dataHoraInicio`;
  const raw = await fetchCamara(endpoint);
  const data = raw.data?.dados || [];
  data.__meta = { fetchedAt: raw.fetchedAt, sourceName: raw.sourceName, sourceUrl: raw.sourceUrl };
  return data;
};

const findDeputyVoteInVoting = async (votacao, deputadoId) => {
  if (!votacao?.id || !deputadoId) return null;

  let page = 1;
  let lastMeta = null;
  let hasMore = true;

  while (hasMore && page <= 6) {
    const endpoint = `/votacoes/${encodeURIComponent(votacao.id)}/votos?pagina=${page}&itens=100`;
    const raw = await fetchCamara(endpoint, {
      cacheTtlMs: 1000 * 60 * 60,
      timeoutMs: 15000,
    });
    lastMeta = raw;

    const records = raw.data?.dados || [];
    const attached = attachDeputyVoteToVoting(votacao, records, deputadoId);

    if (attached) {
      return {
        ...attached,
        sourceName: raw.sourceName,
        sourceUrl: raw.sourceUrl,
        fetchedAt: raw.fetchedAt,
      };
    }

    hasMore = records.length === 100 && !raw.error;
    page += 1;
  }

  if (lastMeta?.error) {
    console.warn('[CAMARA API] Falha ao buscar votos de uma votacao.', {
      votacaoId: votacao.id,
      deputadoId,
      error: lastMeta.error,
    });
  }

  return null;
};

export const getDeputadoVotacoes = async (id, ano) => {
  if (!id) return [];

  const endpointPlenario = `/votacoes?idOrgao=180&dataInicio=${ano}-01-01&dataFim=${ano}-12-31`;
  const endpointGeral = `/votacoes?dataInicio=${ano}-01-01&dataFim=${ano}-12-31`;
  const votacoesPlenarioDiretas = await fetchAllCamaraPages(endpointPlenario, 12);
  const votacoesAno = await fetchAllCamaraPages(endpointGeral, 6);
  const shouldUseAnnualVotingFile = votacoesPlenarioDiretas.length === 0 && votacoesAno.length === 0;
  const votacoesArquivo = shouldUseAnnualVotingFile ? await getVotacoesArquivoAnual(ano).catch(() => []) : [];
  const votacoesBaseAno = votacoesAno.length ? votacoesAno : votacoesArquivo;
  const votacoesPlenario = [
    ...votacoesPlenarioDiretas,
    ...votacoesBaseAno.filter(isPlenaryVoting),
  ];
  const idsPrioritarios = new Set();
  const relevantesPlenario = selectRelevantVotacoes(votacoesPlenario, { limit: 90, includeFallback: true });
  const relevantesTematicas = selectRelevantVotacoes(votacoesBaseAno, { limit: 40, includeFallback: false });
  const relevantes = [...relevantesPlenario, ...relevantesTematicas].filter((votacao) => {
    const key = String(votacao.id || '');
    if (!key || idsPrioritarios.has(key)) return false;
    idsPrioritarios.add(key);
    return true;
  });
  const [objetosVotacao, proposicoesAfetadas] = await Promise.all([
    getVotacoesProposicoesArquivoAnual(ano, 'objetos').catch(() => []),
    getVotacoesProposicoesArquivoAnual(ano, 'proposicoes').catch(() => []),
  ]);
  const objetosIndex = buildVotingPropositionIndex(objetosVotacao);
  const afetadasIndex = buildVotingPropositionIndex(proposicoesAfetadas);
  const relevantesComProposicoes = attachOfficialPropositionRelations(relevantes, objetosIndex, afetadasIndex);
  const votacoesComVoto = [];

  for (const votacao of relevantesComProposicoes) {
    const votacaoComVoto = await findDeputyVoteInVoting(votacao, id);
    if (votacaoComVoto) {
      votacoesComVoto.push(votacaoComVoto);
    }

    if (votacoesComVoto.length >= 12) break;
  }

  let annualVoteRecords = [];
  if (votacoesComVoto.length === 0 && relevantes.length > 0) {
    annualVoteRecords = await getDeputadoVotosArquivoAnual(id, ano).catch(() => []);
    const recordsByVotingId = annualVoteRecords.reduce((acc, record) => {
      const key = getVotingRecordId(record);
      if (!key) return acc;
      if (!acc.has(key)) acc.set(key, []);
      acc.get(key).push(record);
      return acc;
    }, new Map());

    for (const votacao of relevantesComProposicoes) {
      const records = recordsByVotingId.get(String(votacao.id || '')) || [];
      const votacaoComVoto = attachDeputyVoteToVoting(votacao, records, id);
      if (votacaoComVoto) {
        votacoesComVoto.push({
          ...votacaoComVoto,
          sourceName: 'Camara dos Deputados - Dados Abertos',
          sourceUrl: annualVoteRecords.__meta?.sourceUrl || 'https://dadosabertos.camara.leg.br/arquivos/votacoesVotos/json',
          fetchedAt: annualVoteRecords.__meta?.fetchedAt || new Date().toISOString(),
        });
      }

      if (votacoesComVoto.length >= 12) break;
    }
  }

  votacoesComVoto.__meta = {
    fetchedAt:
      votacoesPlenarioDiretas.__meta?.fetchedAt ||
      votacoesAno.__meta?.fetchedAt ||
      votacoesArquivo.__meta?.fetchedAt ||
      annualVoteRecords.__meta?.fetchedAt ||
      new Date().toISOString(),
    sourceName: 'Camara dos Deputados - Dados Abertos',
    sourceUrl: shouldUseAnnualVotingFile
      ? 'https://dadosabertos.camara.leg.br/arquivos/votacoes/json'
      : 'https://dadosabertos.camara.leg.br/api/v2/votacoes',
    selectionMethod:
      'Recorte de votacoes relevantes com prioridade para idOrgao=180 (Plenario), depois temas publicos, tipo de materia, volume de votos e margem. Cada item exibido exige voto nominal retornado por /votacoes/{id}/votos ou pelo arquivo anual votacoesVotos.',
    plenarySourceUrl: 'https://dadosabertos.camara.leg.br/api/v2/votacoes?idOrgao=180',
    totalPlenaryCandidates: votacoesPlenario.length,
    totalGeneralCandidates: votacoesBaseAno.length,
    totalCandidatesChecked: relevantesComProposicoes.length,
    votingObjectRelations: objetosVotacao.length,
    affectedPropositionRelations: proposicoesAfetadas.length,
    annualVotingFileUsed: shouldUseAnnualVotingFile,
    annualVoteRecordsForDeputy: annualVoteRecords.length,
    annualVotingFileSourceUrl: votacoesArquivo.__meta?.sourceUrl,
    annualVoteFileSourceUrl: annualVoteRecords.__meta?.sourceUrl,
  };

  return votacoesComVoto;
};

export const getAllDeputadosList = async () => {
  const endpoint = '/deputados?ordem=ASC&ordenarPor=nome&itens=100';
  const allDeputadosRaw = await fetchAllCamaraPages(endpoint, 8);

  const deputadosMap = new Map();
  allDeputadosRaw.forEach((deputado) => {
    const key = String(deputado.id || '');
    if (key) {
      deputadosMap.set(key, deputado);
    }
  });

  const data = Array.from(deputadosMap.values()).map(applyPartyCorrectionToDeputy);
  data.__meta = {
    ...allDeputadosRaw.__meta,
    sourceUrl: 'https://dadosabertos.camara.leg.br/api/v2/deputados?ordem=ASC&ordenarPor=nome&itens=100',
    activeList: true,
    expectedSeats: 513,
  };
  return data;
};
