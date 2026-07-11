import { LEGISLATIVE_YEARS } from '@/lib/legislative-years';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const CACHE_YEARS = LEGISLATIVE_YEARS;

const getSupabaseBaseUrl = () => {
  if (!SUPABASE_URL) return '';
  return SUPABASE_URL
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1$/, '');
};

const getProjectRef = () => {
  try {
    return new URL(getSupabaseBaseUrl()).hostname.split('.')[0] || '';
  } catch {
    return '';
  }
};

const getStoredSession = () => {
  try {
    return JSON.parse(localStorage.getItem('fiscaliza_admin_session') || 'null');
  } catch {
    return null;
  }
};

const decodeJwtPayload = (token) => {
  if (!token) return {};

  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return {};
  }
};

const getAccessToken = () => getStoredSession()?.access_token || '';

const getAdminEmail = () => {
  const session = getStoredSession();
  return session?.user?.email || decodeJwtPayload(session?.access_token).email || '';
};

const getPublicHeaders = () => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
});

const getAuthHeaders = () => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${getAccessToken() || SUPABASE_ANON_KEY}`,
});

const readResponseMessage = async (response) => {
  const text = await response.text().catch(() => '');
  if (!text) return response.statusText || 'Sem detalhe retornado.';

  try {
    const json = JSON.parse(text);
    return json.message || json.error_description || json.error || text;
  } catch {
    return text;
  }
};

const parseContentRangeCount = (contentRange) => {
  if (!contentRange) return null;
  const total = contentRange.split('/')[1];
  if (!total || total === '*') return null;
  const parsed = Number(total);
  return Number.isFinite(parsed) ? parsed : null;
};

const makeCheck = ({ id, label, status, summary, detail = '', action = null }) => ({
  id,
  label,
  status,
  summary,
  detail,
  action,
});

const describeSupabaseError = (message) => {
  const normalized = String(message || '').toLowerCase();
  if (normalized.includes('failed to fetch') || normalized.includes('network') || normalized.includes('timeout')) {
    return 'Não houve resposta do Supabase. O projeto pode estar pausado, religando ou sem rede.';
  }

  if (normalized.includes('jwt') || normalized.includes('expired')) {
    return 'A sessão admin expirou. Saia do painel e entre novamente.';
  }

  if (normalized.includes('permission denied') || normalized.includes('row-level security')) {
    return 'A política de segurança bloqueou a leitura/escrita. Confira o e-mail em public.admin_users.';
  }

  if (normalized.includes('does not exist') || normalized.includes('relation')) {
    return 'Uma tabela esperada ainda não existe. Rode o arquivo supabase/schema.sql no SQL Editor.';
  }

  return message || 'Falha desconhecida.';
};

const fetchTableCount = async ({ table, headers, filters = {}, label }) => {
  const params = new URLSearchParams();
  params.set('select', 'id');
  params.set('limit', '1');
  Object.entries(filters).forEach(([key, value]) => params.set(key, value));

  const response = await fetch(`${getSupabaseBaseUrl()}/rest/v1/${table}?${params.toString()}`, {
    headers: {
      ...headers,
      Prefer: 'count=exact',
    },
  });

  if (!response.ok) {
    const message = await readResponseMessage(response);
    return {
      name: table,
      label,
      status: 'error',
      count: null,
      summary: describeSupabaseError(message),
      detail: message,
    };
  }

  return {
    name: table,
    label,
    status: 'ok',
    count: parseContentRangeCount(response.headers.get('content-range')),
    summary: 'Leitura disponível.',
    detail: '',
  };
};

const fetchLatestCacheRow = async () => {
  const params = new URLSearchParams();
  params.set('select', 'ano,nome,updated_at,fetched_at');
  params.set('order', 'updated_at.desc');
  params.set('limit', '1');

  const response = await fetch(`${getSupabaseBaseUrl()}/rest/v1/deputado_ano_resumos?${params.toString()}`, {
    headers: getPublicHeaders(),
  });

  if (!response.ok) return null;
  const rows = await response.json().catch(() => []);
  return rows[0] || null;
};

const checkSupabaseAuth = async () => {
  const session = getStoredSession();
  const token = session?.access_token || '';
  const payload = decodeJwtPayload(token);
  const expiresAt = payload.exp ? new Date(payload.exp * 1000) : null;
  const expired = expiresAt ? expiresAt.getTime() <= Date.now() : false;
  const email = getAdminEmail();

  if (!token) {
    return {
      sessionFound: false,
      email: '',
      expiresAt: null,
      expired: false,
      authStatus: 'warning',
      authSummary: 'Nenhuma sessão admin salva neste navegador.',
      allowlistStatus: 'unknown',
      allowlistSummary: 'Entre no /admin para validar o e-mail administrador.',
    };
  }

  if (expired) {
    return {
      sessionFound: true,
      email,
      expiresAt,
      expired,
      authStatus: 'error',
      authSummary: 'Sessão admin expirada.',
      allowlistStatus: 'unknown',
      allowlistSummary: 'Entre novamente no /admin.',
    };
  }

  const userResponse = await fetch(`${getSupabaseBaseUrl()}/auth/v1/user`, {
    headers: getAuthHeaders(),
  }).catch((error) => ({ ok: false, _message: error.message }));

  const authStatus = userResponse.ok ? 'ok' : 'error';
  const authSummary = userResponse.ok
    ? 'Sessão admin aceita pelo Supabase Auth.'
    : describeSupabaseError(userResponse._message || await readResponseMessage(userResponse));

  let allowlistStatus = 'unknown';
  let allowlistSummary = 'Não foi possível conferir a allowlist.';

  if (email && userResponse.ok) {
    const params = new URLSearchParams();
    params.set('select', 'email');
    params.set('email', `eq.${email}`);
    const allowlistResponse = await fetch(`${getSupabaseBaseUrl()}/rest/v1/admin_users?${params.toString()}`, {
      headers: getAuthHeaders(),
    }).catch((error) => ({ ok: false, _message: error.message }));

    if (allowlistResponse.ok) {
      const rows = await allowlistResponse.json().catch(() => []);
      allowlistStatus = rows.length ? 'ok' : 'error';
      allowlistSummary = rows.length
        ? 'E-mail encontrado em public.admin_users.'
        : 'E-mail logado não está em public.admin_users.';
    } else {
      allowlistStatus = 'error';
      allowlistSummary = describeSupabaseError(allowlistResponse._message || await readResponseMessage(allowlistResponse));
    }
  }

  return {
    sessionFound: true,
    email,
    expiresAt,
    expired,
    authStatus,
    authSummary,
    allowlistStatus,
    allowlistSummary,
  };
};

const checkOfficialApi = async ({ id, label, url }) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return makeCheck({
        id,
        label,
        status: 'error',
        summary: `Resposta ${response.status}.`,
        detail: await readResponseMessage(response),
      });
    }

    return makeCheck({
      id,
      label,
      status: 'ok',
      summary: 'API oficial respondeu.',
      detail: '',
    });
  } catch (error) {
    return makeCheck({
      id,
      label,
      status: 'error',
      summary: 'API oficial não respondeu.',
      detail: error.message,
    });
  }
};

export const runSystemHealthCheck = async () => {
  const checkedAt = new Date().toISOString();
  const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
  const projectRef = getProjectRef();
  const dashboardUrl = projectRef ? `https://supabase.com/dashboard/project/${projectRef}` : '';

  if (!supabaseConfigured) {
    return {
      checkedAt,
      config: {
        supabaseConfigured,
        projectUrl: getSupabaseBaseUrl(),
        projectRef,
        dashboardUrl,
      },
      admin: null,
      services: [
        makeCheck({
          id: 'supabase-config',
          label: 'Configuração do Supabase',
          status: 'error',
          summary: 'Variáveis do Supabase ausentes.',
          detail: 'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY na Vercel e no .env.local.',
        }),
      ],
      tables: [],
      cache: { years: [], latest: null, status: 'error' },
      recommendations: [
        'Configure VITE_SUPABASE_URL sem /rest/v1 no final.',
        'Configure VITE_SUPABASE_ANON_KEY com a chave publishable/anon do Supabase.',
      ],
    };
  }

  const [metricsTable, summariesTable, correctionsTable, latestCache, admin, camaraApi, senadoApi] = await Promise.all([
    fetchTableCount({
      table: 'metricas_validadas',
      label: 'Métricas validadas',
      headers: getPublicHeaders(),
      filters: { ativo: 'eq.true' },
    }),
    fetchTableCount({
      table: 'deputado_ano_resumos',
      label: 'Cache anual de deputados',
      headers: getPublicHeaders(),
    }),
    getAccessToken()
      ? fetchTableCount({
        table: 'correcoes',
        label: 'Fila de correções',
        headers: getAuthHeaders(),
      })
      : Promise.resolve({
        name: 'correcoes',
        label: 'Fila de correções',
        status: 'warning',
        count: null,
        summary: 'Leitura exige login admin.',
        detail: 'Entre no /admin para conferir a fila privada.',
      }),
    fetchLatestCacheRow(),
    checkSupabaseAuth(),
    checkOfficialApi({
      id: 'camara-api',
      label: 'Câmara dos Deputados',
      url: '/api/camara/api/v2/deputados?itens=1',
    }),
    checkOfficialApi({
      id: 'senado-api',
      label: 'Senado Federal',
      url: '/api/senado/senador/lista/atual.json',
    }),
  ]);

  const cacheYears = await Promise.all(CACHE_YEARS.map(async (year) => {
    const result = await fetchTableCount({
      table: 'deputado_ano_resumos',
      label: `Cache ${year}`,
      headers: getPublicHeaders(),
      filters: { ano: `eq.${year}` },
    });

    return {
      year,
      count: result.count || 0,
      status: result.status === 'error'
        ? 'error'
        : result.count >= 450
          ? 'ok'
          : result.count > 0
            ? 'warning'
            : 'empty',
      summary: result.summary,
      detail: result.detail,
    };
  }));

  const services = [
    makeCheck({
      id: 'supabase-rest',
      label: 'Supabase REST',
      status: summariesTable.status === 'ok' || metricsTable.status === 'ok' ? 'ok' : 'error',
      summary: summariesTable.status === 'ok' || metricsTable.status === 'ok'
        ? 'Banco respondeu às leituras públicas.'
        : 'Banco não respondeu às leituras públicas.',
      detail: summariesTable.detail || metricsTable.detail,
      action: dashboardUrl ? { label: 'Abrir Supabase', href: dashboardUrl } : null,
    }),
    makeCheck({
      id: 'supabase-auth',
      label: 'Supabase Auth',
      status: admin.authStatus,
      summary: admin.authSummary,
      detail: admin.expiresAt ? `Sessão expira em ${admin.expiresAt.toLocaleString('pt-BR')}.` : '',
    }),
    makeCheck({
      id: 'admin-allowlist',
      label: 'Permissão admin',
      status: admin.allowlistStatus === 'unknown' ? 'warning' : admin.allowlistStatus,
      summary: admin.allowlistSummary,
      detail: admin.email ? `E-mail detectado: ${admin.email}` : 'Nenhum e-mail admin detectado neste navegador.',
    }),
    camaraApi,
    senadoApi,
  ];

  const latestYearWithFullCache = cacheYears.find((item) => item.status === 'ok');
  const recommendations = [];

  if (services[0].status === 'error') {
    recommendations.push('Abra o Supabase e confirme se o projeto está ativo. Se estiver pausado, clique em Resume project.');
  }

  if (admin.authStatus !== 'ok') {
    recommendations.push('Entre novamente no /admin para renovar a sessão.');
  }

  if (admin.allowlistStatus === 'error') {
    recommendations.push('Confirme que o e-mail logado existe exatamente igual em public.admin_users.');
  }

  if (!latestYearWithFullCache) {
    recommendations.push('Sincronize pelo menos um ano completo no /admin para liberar rankings nacionais confiáveis.');
  }

  if (summariesTable.status === 'error' || metricsTable.status === 'error') {
    recommendations.push('Rode novamente supabase/schema.sql no SQL Editor para garantir tabelas e políticas atualizadas.');
  }

  return {
    checkedAt,
    config: {
      supabaseConfigured,
      projectUrl: getSupabaseBaseUrl(),
      projectRef,
      dashboardUrl,
    },
    admin,
    services,
    tables: [summariesTable, metricsTable, correctionsTable],
    cache: {
      years: cacheYears,
      latest: latestCache,
      status: cacheYears.some((item) => item.status === 'ok')
        ? 'ok'
        : cacheYears.some((item) => item.status === 'warning')
          ? 'warning'
          : 'empty',
    },
    recommendations,
  };
};
