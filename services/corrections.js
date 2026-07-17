const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isCorrectionsDatabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const getSupabaseRestUrl = () => {
  if (!SUPABASE_URL) return '';
  return SUPABASE_URL
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1$/, '');
};

const getSupabaseAuthUrl = () => `${getSupabaseRestUrl()}/auth/v1`;

const getStoredSession = () => {
  try {
    return JSON.parse(localStorage.getItem('fiscaliza_admin_session') || 'null');
  } catch {
    return null;
  }
};

const setStoredSession = (session) => {
  localStorage.setItem('fiscaliza_admin_session', JSON.stringify(session));
};

const clearStoredSession = () => {
  localStorage.removeItem('fiscaliza_admin_session');
};

const getAccessToken = () => getStoredSession()?.access_token;

const getAuthHeaders = () => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${getAccessToken() || SUPABASE_ANON_KEY}`,
});

const getPublicHeaders = () => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
});

export const getAdminSession = () => getStoredSession();

export const signInAdmin = async ({ email, password }) => {
  if (!isCorrectionsDatabaseConfigured) {
    return { ok: false, reason: 'missing-config' };
  }

  const response = await fetch(`${getSupabaseAuthUrl()}/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Falha no login');
  }

  const session = await response.json();
  setStoredSession(session);
  return { ok: true, session };
};

export const signOutAdmin = async () => {
  const token = getAccessToken();
  if (token && isCorrectionsDatabaseConfigured) {
    await fetch(`${getSupabaseAuthUrl()}/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).catch(() => null);
  }

  clearStoredSession();
};

export const submitCorrection = async (payload) => {
  if (!isCorrectionsDatabaseConfigured) {
    return { ok: false, reason: 'missing-config' };
  }

  const response = await fetch(`${getSupabaseRestUrl()}/rest/v1/correcoes`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      nome: payload.nome,
      email: payload.email,
      parlamentar: payload.parlamentar,
      cargo: payload.cargo,
      metrica: payload.metrica,
      ano: payload.ano,
      valor_informado: payload.valor,
      fonte_url: payload.fonte,
      observacoes: payload.observacoes,
      status: 'pendente',
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Falha ao enviar correcao');
  }

  return { ok: true };
};

export const fetchCorrections = async () => {
  if (!isCorrectionsDatabaseConfigured) {
    return { ok: false, reason: 'missing-config', data: [] };
  }

  const response = await fetch(
    `${getSupabaseRestUrl()}/rest/v1/correcoes?select=*&order=created_at.desc`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Falha ao buscar correcoes');
  }

  return { ok: true, data: await response.json() };
};

export const updateCorrectionStatus = async (id, payload) => {
  if (!isCorrectionsDatabaseConfigured) {
    return { ok: false, reason: 'missing-config' };
  }

  const response = await fetch(`${getSupabaseRestUrl()}/rest/v1/correcoes?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      status: payload.status,
      observacao_publica: payload.observacao_publica || null,
      observacao_interna: payload.observacao_interna || null,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Falha ao atualizar correcao');
  }

  return { ok: true };
};

export const publishValidatedMetric = async (correction) => {
  if (!isCorrectionsDatabaseConfigured) {
    return { ok: false, reason: 'missing-config' };
  }

  const response = await fetch(`${getSupabaseRestUrl()}/rest/v1/metricas_validadas`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      correcao_id: correction.id,
      parlamentar: correction.parlamentar,
      cargo: correction.cargo,
      metrica: correction.metrica,
      ano: correction.ano,
      valor: correction.valor_informado,
      fonte_url: correction.fonte_url,
      observacao_publica:
        correction.observacao_publica ||
        'Dado validado manualmente pelo FISCALIZA com base na fonte informada.',
      ativo: true,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Falha ao publicar metrica validada');
  }

  await updateCorrectionStatus(correction.id, {
    status: 'validado',
    observacao_publica:
      correction.observacao_publica ||
      'Dado validado manualmente pelo FISCALIZA com base na fonte informada.',
    observacao_interna: correction.observacao_interna,
  });

  return { ok: true };
};

export const fetchValidatedMetrics = async (filters = {}) => {
  if (!isCorrectionsDatabaseConfigured) {
    return { ok: false, reason: 'missing-config', data: [] };
  }

  const params = new URLSearchParams();
  params.set('select', '*');
  params.set('ativo', 'eq.true');
  params.set('order', 'validado_em.desc');

  if (filters.parlamentar) params.set('parlamentar', `eq.${filters.parlamentar}`);
  if (filters.cargo) params.set('cargo', `eq.${filters.cargo}`);
  if (filters.ano) params.set('ano', `eq.${filters.ano}`);

  const response = await fetch(`${getSupabaseRestUrl()}/rest/v1/metricas_validadas?${params.toString()}`, {
    headers: getPublicHeaders(),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Falha ao buscar metricas validadas');
  }

  return { ok: true, data: await response.json() };
};

export const buildCorrectionMailto = (form) => {
  const subject = encodeURIComponent(`Revisao de dado - ${form.parlamentar || 'FISCALIZA'}`);
  const body = encodeURIComponent(
    [
      'Pedido de revisao de dado no FISCALIZA',
      '',
      `Nome: ${form.nome}`,
      `E-mail: ${form.email}`,
      `Parlamentar: ${form.parlamentar}`,
      `Cargo: ${form.cargo}`,
      `Metrica: ${form.metrica}`,
      `Ano: ${form.ano}`,
      `Valor informado: ${form.valor}`,
      `Fonte/evidencia: ${form.fonte}`,
      '',
      'Observacoes:',
      form.observacoes,
      '',
      'Observacao: este envio nao altera dados automaticamente. Ele cria uma fila manual de verificacao.',
    ].join('\n')
  );

  return `mailto:contato@fiscaliza.app?subject=${subject}&body=${body}`;
};
