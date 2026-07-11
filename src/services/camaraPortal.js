import { cachedTextFetch } from '@/services/http';

const PORTAL_PROXY_BASE = '/api/camara-portal';
const CAMARA_PORTAL_BASE = 'https://www.camara.leg.br';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const PORTAL_SUMMARY_TABLE = 'deputado_portal_resumos';
const LOCAL_PORTAL_CACHE_PREFIX = 'fiscaliza_portal_resumo';
const LOCAL_PORTAL_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const CURRENT_YEAR_PORTAL_CACHE_TTL_MS = 1000 * 60 * 60 * 6;

const isPortalSummaryDatabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const getSupabaseRestUrl = () => {
  if (!SUPABASE_URL) return '';
  return SUPABASE_URL
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1$/, '');
};

const getStoredSession = () => {
  try {
    return JSON.parse(localStorage.getItem('fiscaliza_admin_session') || 'null');
  } catch {
    return null;
  }
};

const getAccessToken = () => getStoredSession()?.access_token;

const getPublicHeaders = () => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
});

const getAuthHeaders = () => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${getAccessToken() || SUPABASE_ANON_KEY}`,
});

const getLocalPortalCacheKey = (deputadoId, ano) =>
  `${LOCAL_PORTAL_CACHE_PREFIX}:${ano}:${deputadoId}`;

export const isPortalSummaryFresh = (summary, ano, now = Date.now()) => {
  if (!summary) return false;
  if (Number(ano) < new Date(now).getFullYear()) return true;

  const fetchedAt = Date.parse(summary.__meta?.fetchedAt || summary.__meta?.cachedAt || '');
  return Number.isFinite(fetchedAt) && now - fetchedAt < CURRENT_YEAR_PORTAL_CACHE_TTL_MS;
};

const readLocalPortalResumoCache = (deputadoId, ano) => {
  if (typeof localStorage === 'undefined') return null;

  try {
    const raw = localStorage.getItem(getLocalPortalCacheKey(deputadoId, ano));
    if (!raw) return null;

    const entry = JSON.parse(raw);
    const storedAt = Date.parse(entry?.storedAt || '');
    if (!entry?.data || !Number.isFinite(storedAt)) return null;

    if (Date.now() - storedAt > LOCAL_PORTAL_CACHE_TTL_MS) {
      localStorage.removeItem(getLocalPortalCacheKey(deputadoId, ano));
      return null;
    }

    return {
      ...entry.data,
      __meta: {
        ...(entry.data.__meta || {}),
        cachedAt: entry.storedAt,
        fromLocalCache: true,
      },
    };
  } catch {
    return null;
  }
};

const writeLocalPortalResumoCache = (deputadoId, ano, data) => {
  if (typeof localStorage === 'undefined' || !deputadoId || !ano || !data || data.__meta?.error) return;

  try {
    localStorage.setItem(
      getLocalPortalCacheKey(deputadoId, ano),
      JSON.stringify({
        storedAt: new Date().toISOString(),
        data,
      })
    );
  } catch {
    // localStorage can be full or blocked; the official live fallback still works.
  }
};

const normalizeSearchText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

const toText = (html = '') => {
  if (!html) return '';
  const spacedHtml = String(html)
    .replace(/<\s*br\s*\/?>/gi, ' ')
    .replace(/></g, '> <');

  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(spacedHtml, 'text/html');
    return doc.body?.textContent || '';
  }

  return spacedHtml
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
};

const parseNumber = (value) => {
  const parsed = Number.parseInt(String(value || '').replace(/\D/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const rowToPortalResumo = (row) => {
  if (!row) return null;

  return {
    propostasAutoria: row.propostas_autoria,
    propostasRelatadas: row.propostas_relatadas,
    votacoesNominaisPlenario: row.votacoes_nominais_plenario,
    discursosPlenario: row.discursos_plenario,
    presencaPlenario: {
      presencas: row.presenca_plenario,
      ausenciasJustificadas: row.ausencias_justificadas_plenario,
      ausenciasNaoJustificadas: row.ausencias_nao_justificadas_plenario,
    },
    presencaComissoes: {
      presencas: row.presenca_comissoes,
      ausenciasJustificadas: row.ausencias_justificadas_comissoes,
      ausenciasNaoJustificadas: row.ausencias_nao_justificadas_comissoes,
    },
    __meta: {
      fetchedAt: row.fetched_at,
      cachedAt: row.updated_at,
      sourceName: row.source_name || 'Camara dos Deputados - Portal do Deputado',
      sourceUrl: row.source_url,
      fromSupabase: true,
    },
  };
};

const portalResumoToRow = ({ deputado = {}, deputadoId, ano, resumo }) => ({
  ano: String(ano),
  deputado_id: String(deputadoId || deputado.id || deputado?.ultimoStatus?.id || ''),
  nome: deputado.nome || deputado?.ultimoStatus?.nomeEleitoral || deputado?.ultimoStatus?.nome || null,
  partido: deputado.siglaPartido || deputado?.ultimoStatus?.siglaPartido || null,
  uf: deputado.siglaUf || deputado?.ultimoStatus?.siglaUf || null,
  propostas_autoria: resumo.propostasAutoria ?? null,
  propostas_relatadas: resumo.propostasRelatadas ?? null,
  votacoes_nominais_plenario: resumo.votacoesNominaisPlenario ?? null,
  discursos_plenario: resumo.discursosPlenario ?? null,
  presenca_plenario: resumo.presencaPlenario?.presencas ?? null,
  ausencias_justificadas_plenario: resumo.presencaPlenario?.ausenciasJustificadas ?? null,
  ausencias_nao_justificadas_plenario: resumo.presencaPlenario?.ausenciasNaoJustificadas ?? null,
  presenca_comissoes: resumo.presencaComissoes?.presencas ?? null,
  ausencias_justificadas_comissoes: resumo.presencaComissoes?.ausenciasJustificadas ?? null,
  ausencias_nao_justificadas_comissoes: resumo.presencaComissoes?.ausenciasNaoJustificadas ?? null,
  status: resumo.__meta?.error ? 'partial' : 'available',
  source_name: resumo.__meta?.sourceName || 'Camara dos Deputados - Portal do Deputado',
  source_url: resumo.__meta?.sourceUrl || `${CAMARA_PORTAL_BASE}/deputados/${encodeURIComponent(deputadoId || deputado.id)}?ano=${encodeURIComponent(ano)}`,
  fetched_at: resumo.__meta?.fetchedAt || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const fetchCachedDeputadoPortalResumo = async (deputadoId, ano) => {
  if (!isPortalSummaryDatabaseConfigured || !deputadoId || !ano) {
    return { ok: false, reason: 'missing-config', data: null };
  }

  const params = new URLSearchParams();
  params.set('select', '*');
  params.set('deputado_id', `eq.${deputadoId}`);
  params.set('ano', `eq.${ano}`);
  params.set('limit', '1');

  const response = await fetch(`${getSupabaseRestUrl()}/rest/v1/${PORTAL_SUMMARY_TABLE}?${params.toString()}`, {
    headers: getPublicHeaders(),
  });

  if (!response.ok) {
    return { ok: false, reason: await response.text(), data: null };
  }

  const rows = await response.json();
  return { ok: true, data: rowToPortalResumo(rows[0] || null) };
};

const matchNumbers = (text, regex) => {
  const match = text.match(regex);
  if (!match) return [];
  return match.slice(1).map(parseNumber);
};

const cleanPortalCellText = (value = '') => String(value).replace(/\s+/g, ' ').trim();

const normalizePortalVote = (value = '') => {
  const normalized = normalizeSearchText(value);
  if (normalized === 'SIM') return 'Sim';
  if (normalized === 'NAO') return 'Não';
  if (normalized.includes('ABST')) return 'Abstenção';
  if (normalized.includes('OBSTRU')) return 'Obstrução';
  if (normalized.includes('ART. 17') || normalized.includes('ART 17')) return 'Art. 17';
  return cleanPortalCellText(value);
};

const toIsoDate = (value = '') => {
  const match = String(value).match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return match ? match[3] + '-' + match[2] + '-' + match[1] + 'T12:00:00-03:00' : '';
};

const findSessionDateNearTable = (table) => {
  let current = table;

  for (let depth = 0; current && depth < 5; depth += 1) {
    let sibling = current.previousElementSibling;
    while (sibling) {
      const match = cleanPortalCellText(sibling.textContent).match(/\d{2}\/\d{2}\/\d{4}/);
      if (match) return match[0];
      sibling = sibling.previousElementSibling;
    }
    current = current.parentElement;
  }

  return '';
};

export const parseDeputadoPortalVotacoesHtml = (html = '', { deputadoId, ano } = {}) => {
  if (!html || typeof DOMParser === 'undefined') return [];

  const document = new DOMParser().parseFromString(String(html), 'text/html');
  const records = [];

  document.querySelectorAll('table').forEach((table) => {
    const headerText = normalizeSearchText(
      Array.from(table.querySelectorAll('th')).map((cell) => cell.textContent).join(' ')
    );
    if (!headerText.includes('O QUE FOI VOTADO') || !headerText.includes('VOTO')) return;

    const sessionDate = findSessionDateNearTable(table);

    table.querySelectorAll('tr').forEach((row) => {
      const cells = Array.from(row.querySelectorAll('td'));
      if (cells.length < 2) return;

      const description = cleanPortalCellText(cells[0].textContent);
      const rawVote = cleanPortalCellText(cells[1].textContent);
      if (!description || !rawVote || rawVote === '---') return;

      const vote = normalizePortalVote(rawVote);
      const attendance = cleanPortalCellText(cells[2]?.textContent);
      const absenceJustification = cleanPortalCellText(cells[3]?.textContent);
      const index = records.length + 1;

      records.push({
        id: ['portal', ano || 'ano', deputadoId || 'deputado', index].join('-'),
        dataHoraRegistro: toIsoDate(sessionDate),
        data: sessionDate,
        descricao: description,
        titulo: description,
        siglaOrgao: 'PLENÁRIO',
        nomeOrgao: 'Plenário da Câmara dos Deputados',
        idOrgao: '180',
        deputyVote: {
          deputyId: deputadoId ? String(deputadoId) : '',
          vote,
          votedAt: toIsoDate(sessionDate),
          attendance,
          absenceJustification,
        },
        totals: { sim: 0, nao: 0, abstencao: 0, obstrucao: 0, outros: 0, total: 0 },
      });
    });
  });

  return records;
};

export const parseDeputadoPortalResumoHtml = (html = '') => {
  const text = normalizeSearchText(toText(html));
  const [propostasAutoria, propostasRelatadas] = matchNumbers(
    text,
    /PROPOSTAS LEGISLATIVAS\s+DE SUA AUTORIA\s+([\d.]+)\s+RELATADAS\s+([\d.]+)/
  );
  const [votacoesNominaisPlenario] = matchNumbers(
    text,
    /VOTACOES NOMINAIS\s*\??\s+EM PLENARIO\s+([\d.]+)/
  );
  const [discursosPlenario] = matchNumbers(
    text,
    /DISCURSOS\s+EM PLENARIO\s+([\d.]+)/
  );
  const [presencasPlenario, ausenciasJustificadasPlenario, ausenciasNaoJustificadasPlenario] = matchNumbers(
    text,
    /PRESENCA EM PLENARIO\s+SOBRE PRESENCA EM PLENARIO\s*\??\s+PRESENCAS NA CAMARA\s+([\d.]+)\s+DIAS\s+AUSENCIAS JUSTIFICADAS\s+([\d.]+)\s+DIAS\s+AUSENCIAS NAO JUSTIFICADAS\s+([\d.]+)\s+DIAS/
  );
  const [presencasComissoes, ausenciasJustificadasComissoes, ausenciasNaoJustificadasComissoes] = matchNumbers(
    text,
    /PRESENCA EM COMISSOES\s+SOBRE PRESENCA EM COMISSOES\s*\??\s+PRESENCAS NA CAMARA\s+([\d.]+)\s+REUNIOES\s+AUSENCIAS JUSTIFICADAS\s+([\d.]+)\s+REUNIOES\s+AUSENCIAS NAO JUSTIFICADAS\s+([\d.]+)\s+REUNIOES/
  );

  return {
    propostasAutoria,
    propostasRelatadas,
    votacoesNominaisPlenario,
    discursosPlenario,
    presencaPlenario: {
      presencas: presencasPlenario,
      ausenciasJustificadas: ausenciasJustificadasPlenario,
      ausenciasNaoJustificadas: ausenciasNaoJustificadasPlenario,
    },
    presencaComissoes: {
      presencas: presencasComissoes,
      ausenciasJustificadas: ausenciasJustificadasComissoes,
      ausenciasNaoJustificadas: ausenciasNaoJustificadasComissoes,
    },
  };
};

const fetchDeputadoPortalResumoFromCamara = async (deputadoId, ano) => {
  if (!deputadoId || !ano) return null;

  const path = `/deputados/${encodeURIComponent(deputadoId)}?ano=${encodeURIComponent(ano)}`;
  const raw = await cachedTextFetch(`${PORTAL_PROXY_BASE}${path}`, {
    cacheTtlMs: 1000 * 60 * 30,
    retries: 1,
    timeoutMs: 15000,
  });

  if (raw.error || !raw.data) {
    return {
      __meta: {
        fetchedAt: raw.fetchedAt,
        sourceName: 'Câmara dos Deputados - Portal do Deputado',
        sourceUrl: `${CAMARA_PORTAL_BASE}${path}`,
        error: raw.error || 'Portal sem resposta',
      },
    };
  }

  return {
    ...parseDeputadoPortalResumoHtml(raw.data),
    __meta: {
      fetchedAt: raw.fetchedAt,
      sourceName: 'Câmara dos Deputados - Portal do Deputado',
      sourceUrl: `${CAMARA_PORTAL_BASE}${path}`,
    },
  };
};

export const getDeputadoPortalResumo = async (deputadoId, ano, options = {}) => {
  if (!deputadoId || !ano) return null;
  let fallbackCached = null;

  if (options.preferCache !== false) {
    const cached = await fetchCachedDeputadoPortalResumo(deputadoId, ano).catch(() => null);
    if (cached?.data) {
      fallbackCached = cached.data;
      if (isPortalSummaryFresh(cached.data, ano)) return cached.data;
    }

    const localCached = readLocalPortalResumoCache(deputadoId, ano);
    if (localCached) return localCached;
  }

  const liveData = await fetchDeputadoPortalResumoFromCamara(deputadoId, ano);
  if (liveData?.__meta?.error && fallbackCached) {
    return {
      ...fallbackCached,
      __meta: {
        ...(fallbackCached.__meta || {}),
        stale: true,
        refreshError: liveData.__meta.error,
      },
    };
  }
  writeLocalPortalResumoCache(deputadoId, ano, liveData);
  return liveData;
};

export const getDeputadoPortalVotacoes = async (deputadoId, ano) => {
  if (!deputadoId || !ano) return [];

  const path = '/deputados/' + encodeURIComponent(deputadoId) + '/votacoes-nominais-plenario/' + encodeURIComponent(ano);
  const raw = await cachedTextFetch(PORTAL_PROXY_BASE + path, {
    cacheTtlMs: 1000 * 60 * 60 * 6,
    retries: 1,
    timeoutMs: 20000,
  });
  const records = raw.data
    ? parseDeputadoPortalVotacoesHtml(raw.data, { deputadoId, ano })
    : [];
  const sourceUrl = CAMARA_PORTAL_BASE + path;

  records.forEach((record) => {
    record.sourceName = 'Câmara dos Deputados - Votações Nominais em Plenário';
    record.sourceUrl = sourceUrl;
    record.fetchedAt = raw.fetchedAt;
  });

  records.__meta = {
    fetchedAt: raw.fetchedAt,
    sourceName: 'Câmara dos Deputados - Votações Nominais em Plenário',
    sourceUrl,
    sourceType: 'portal_votacoes_nominais',
    totalPortalRecords: records.length,
    ...(raw.error ? { error: raw.error } : {}),
  };

  return records;
};

export const upsertDeputadoPortalResumoCache = async ({ deputado, deputadoId, ano, resumo }) => {
  if (!isPortalSummaryDatabaseConfigured) {
    return { ok: false, reason: 'missing-config' };
  }

  const targetId = deputadoId || deputado?.id || deputado?.ultimoStatus?.id;
  const data = resumo || await fetchDeputadoPortalResumoFromCamara(targetId, ano);
  if (!data) return { ok: false, reason: 'empty-summary' };

  const response = await fetch(
    `${getSupabaseRestUrl()}/rest/v1/${PORTAL_SUMMARY_TABLE}?on_conflict=ano,deputado_id`,
    {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(portalResumoToRow({ deputado, deputadoId: targetId, ano, resumo: data })),
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Falha ao salvar resumo do portal da Camara');
  }

  return { ok: true, data };
};
